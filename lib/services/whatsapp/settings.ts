import { db } from '@/lib/db';
import { waSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * The wa_settings singleton: caps, guardrails and the kill switch.
 *
 * Everything that limits sending lives here rather than in env vars, so an
 * operator can pull the handbrake from the admin panel without a redeploy.
 * Env vars only cover credentials and the provider choice.
 */

const SETTINGS_KEY = 'default';

export type WaSettings = typeof waSettings.$inferSelect;

/**
 * Short-lived cache. The dispatcher reads settings once per message; a serverless
 * invocation lasts seconds, so a few seconds of staleness is harmless and saves a
 * query per send. The kill switch is checked once per batch, not once per send,
 * so flipping it takes effect on the next tick either way.
 */
const CACHE_TTL_MS = 5_000;
let cache: { value: WaSettings; at: number } | undefined;

export const DEFAULT_SETTINGS = {
    enabled: false,
    testMode: true,
    testNumbers: [] as string[],
    dailyCap: 250,
    throttlePerMin: 60,
    batchSize: 100,
    maxConcurrency: 10,
    maxAttempts: 3,
    quietHoursEnabled: true,
    quietHoursStart: 21,
    quietHoursEnd: 9,
    timezone: 'Asia/Kolkata',
    frequencyCapPer30d: 2,
    monthlyBudget: 2_500_000, // paise = ₹25,000
    budgetWarnPercent: 80,
    stopOptOutRateBp: 300,
    stopFailureRateBp: 1000,
    stopMinSample: 200,
    haltOnRedQuality: true,
    approvalThreshold: 1000,
};

export async function getSettings(options?: { fresh?: boolean }): Promise<WaSettings> {
    if (!options?.fresh && cache && Date.now() - cache.at < CACHE_TTL_MS) {
        return cache.value;
    }

    let row = await db.query.waSettings.findFirst({
        where: eq(waSettings.key, SETTINGS_KEY),
    });

    // Self-heal if the seed INSERT in the migration was skipped.
    if (!row) {
        const inserted = await db
            .insert(waSettings)
            .values({ key: SETTINGS_KEY })
            .onConflictDoNothing()
            .returning();
        row = inserted[0] ?? (await db.query.waSettings.findFirst({
            where: eq(waSettings.key, SETTINGS_KEY),
        }));
    }

    if (!row) {
        throw new Error('[whatsapp] wa_settings row could not be created — has the migration been applied?');
    }

    cache = { value: row, at: Date.now() };
    return row;
}

export async function updateSettings(patch: Partial<WaSettings>): Promise<WaSettings> {
    // The primary key is not editable through this path.
    const { key: _ignored, ...safe } = patch;

    const [row] = await db
        .update(waSettings)
        .set({ ...safe, updatedAt: new Date() })
        .where(eq(waSettings.key, SETTINGS_KEY))
        .returning();

    cache = undefined;
    return row;
}

export function invalidateSettingsCache() {
    cache = undefined;
}

/** Flip the global kill switch. Returns the new state. */
export async function setEnabled(enabled: boolean): Promise<WaSettings> {
    return updateSettings({ enabled });
}

// --------------------------------------------
// Quiet hours
// --------------------------------------------

/**
 * The hour of day (0-23) at `now` in the configured timezone.
 * Vercel runs in UTC, so this cannot use getHours().
 */
export function hourInTimezone(now: Date, timeZone: string): number {
    const formatted = new Intl.DateTimeFormat('en-GB', {
        timeZone,
        hour: 'numeric',
        hour12: false,
    }).format(now);
    // en-GB with hour12:false can yield '24' at midnight.
    return Number(formatted) % 24;
}

/**
 * Quiet hours normally wrap midnight (21:00 -> 09:00), so the window is
 * "hour >= start OR hour < end". A non-wrapping window (09:00 -> 17:00) is
 * handled too, in case someone configures it that way.
 */
export function isWithinQuietHours(settings: WaSettings, now: Date = new Date()): boolean {
    if (!settings.quietHoursEnabled) return false;

    const start = settings.quietHoursStart ?? DEFAULT_SETTINGS.quietHoursStart;
    const end = settings.quietHoursEnd ?? DEFAULT_SETTINGS.quietHoursEnd;
    if (start === end) return false; // degenerate config — treat as always open

    const hour = hourInTimezone(now, settings.timezone || DEFAULT_SETTINGS.timezone);

    return start > end
        ? hour >= start || hour < end   // wraps midnight
        : hour >= start && hour < end;  // same-day window
}

/**
 * When quiet hours end, as an absolute Date. The dispatcher parks a message's
 * send_after here rather than failing it, so held messages resume on their own.
 */
export function quietHoursEndAt(settings: WaSettings, now: Date = new Date()): Date {
    const end = settings.quietHoursEnd ?? DEFAULT_SETTINGS.quietHoursEnd;
    const timeZone = settings.timezone || DEFAULT_SETTINGS.timezone;
    const hour = hourInTimezone(now, timeZone);

    // Hours until the window closes, walking forward one hour at a time so we
    // never have to reason about the timezone's UTC offset directly.
    let hoursAhead = 0;
    while (hoursAhead < 25) {
        const candidate = new Date(now.getTime() + hoursAhead * 3_600_000);
        if (hourInTimezone(candidate, timeZone) === end) {
            // Zero the UTC minutes so the timestamp is tidy. In a timezone with a
            // half-hour offset like IST this lands mid-hour (09:30 rather than
            // 09:00), which is intentionally the safe direction — a message never
            // wakes up before quiet hours have actually ended.
            candidate.setUTCMinutes(0, 0, 0);
            return candidate;
        }
        hoursAhead += 1;
    }

    void hour;
    // Unreachable in practice; fall back to an hour from now.
    return new Date(now.getTime() + 3_600_000);
}

// --------------------------------------------
// Budget
// --------------------------------------------

export function budgetState(settings: WaSettings, spentPaise: number) {
    const budget = settings.monthlyBudget ?? DEFAULT_SETTINGS.monthlyBudget;
    const warnAt = ((settings.budgetWarnPercent ?? DEFAULT_SETTINGS.budgetWarnPercent) / 100) * budget;

    return {
        budget,
        spent: spentPaise,
        remaining: Math.max(0, budget - spentPaise),
        percentUsed: budget > 0 ? Math.round((spentPaise / budget) * 100) : 0,
        shouldWarn: spentPaise >= warnAt && spentPaise < budget,
        exhausted: spentPaise >= budget,
    };
}
