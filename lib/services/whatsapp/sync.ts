import { db } from '@/lib/db';
import { waCampaigns } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';
import { getProvider } from './index';
import { getSettings, updateSettings } from './settings';
import { syncTemplates, type SyncResult } from './templates';
import { haltCampaign } from './campaigns';
import type { AccountHealth } from './types';

/**
 * Account-health and template-status sync.
 *
 * A backstop, not the primary path: template status arrives by webhook, and the
 * dispatcher reacts to account-level errors the moment a send fails. This exists
 * for the states that produce no event at all — a webhook Meta never retried, a
 * quality rating that drifted down over a quiet weekend, an access token about
 * to expire. Nothing here is the only way we learn something; everything here is
 * a second way.
 *
 * It is deliberately tolerant. A failure to reach Meta is recorded in
 * `lastHealthError` and reported, but never thrown: a cron that 500s on a
 * transient Graph API blip produces alert noise and fixes nothing.
 */

/** RED is Meta's own wording, and the only rating that means "act now". */
function isRedQuality(rating: string | undefined): boolean {
    return (rating ?? '').toUpperCase() === 'RED';
}

export type SyncReport = {
    ok: boolean;
    health: AccountHealth | null;
    templates: SyncResult | null;
    /** Campaigns stopped because quality went red, if any. */
    haltedCampaigns: string[];
    /** True when this run turned the global kill switch off. */
    killSwitchTripped: boolean;
    errors: string[];
};

/**
 * Halt everything in flight because Meta rated the number RED.
 *
 * A red rating is the step before Meta restricts the number outright, and the
 * usual cause is exactly what we can still stop: marketing going to people who
 * did not want it. Sending harder into a red rating is how a hotel loses its
 * WhatsApp number permanently, so `haltOnRedQuality` defaults to true.
 *
 * The kill switch is turned off as well as halting the live campaigns, because
 * halting alone would leave automations and the inbox free to keep sending.
 */
async function reactToRedQuality(rating: string): Promise<{ halted: string[]; tripped: boolean }> {
    const settings = await getSettings({ fresh: true });
    if (!settings.haltOnRedQuality) return { halted: [], tripped: false };

    const live = await db
        .select({ id: waCampaigns.id })
        .from(waCampaigns)
        .where(inArray(waCampaigns.status, ['sending', 'scheduled', 'paused']));

    const halted: string[] = [];
    for (const campaign of live) {
        try {
            await haltCampaign(campaign.id, `Account quality rating went ${rating}`);
            halted.push(campaign.id);
        } catch (error) {
            console.error(`[whatsapp/sync] failed to halt campaign ${campaign.id}`, error);
        }
    }

    // Only trip the switch if it was actually on, so the report does not claim
    // to have stopped something that was already stopped.
    const tripped = settings.enabled === true;
    if (tripped) await updateSettings({ enabled: false });

    return { halted, tripped };
}

/**
 * One sync pass.
 *
 * Health first: if the account is unreachable there is no point pulling
 * templates, and the health error is the more useful thing to record.
 */
export async function runSync(): Promise<SyncReport> {
    const errors: string[] = [];
    let health: AccountHealth | null = null;
    let templates: SyncResult | null = null;
    let haltedCampaigns: string[] = [];
    let killSwitchTripped = false;

    try {
        health = await getProvider().getAccountHealth();
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Account health check failed';
        errors.push(message);
        await updateSettings({ lastHealthError: message, lastSyncAt: new Date() }).catch(() => {});
        return { ok: false, health: null, templates: null, haltedCampaigns: [], killSwitchTripped: false, errors };
    }

    if (isRedQuality(health.qualityRating)) {
        // Loud on purpose. This is the one line in the module that means the
        // hotel is at risk of losing the number.
        console.error(`[whatsapp/sync] account quality is ${health.qualityRating} — halting`);
        try {
            const reaction = await reactToRedQuality(health.qualityRating!);
            haltedCampaigns = reaction.halted;
            killSwitchTripped = reaction.tripped;
        } catch (error) {
            errors.push(error instanceof Error ? error.message : 'Failed to react to red quality');
        }
    }

    // Templates are refreshed even when quality is red: a paused or disabled
    // template is precisely what a red rating tends to come with, and the panel
    // should show that rather than a stale "approved".
    try {
        templates = await syncTemplates();
    } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Template sync failed');
    }

    await updateSettings({
        qualityRating: health.qualityRating ?? null,
        messagingTier: health.messagingTier ?? null,
        lastHealthError: health.error ?? (errors.length ? errors.join('; ') : null),
        lastSyncAt: new Date(),
    }).catch((error) => {
        errors.push(error instanceof Error ? error.message : 'Failed to record sync state');
    });

    return {
        ok: errors.length === 0 && health.connected,
        health,
        templates,
        haltedCampaigns,
        killSwitchTripped,
        errors,
    };
}

/**
 * How long since a webhook last arrived, in minutes, or null if none ever has.
 *
 * A number that keeps climbing is the signal that the webhook subscription has
 * silently lapsed — the failure mode nothing else in the module can detect,
 * because a webhook that stops arriving produces no error anywhere.
 */
export async function minutesSinceLastWebhook(): Promise<number | null> {
    const settings = await getSettings({ fresh: true });
    if (!settings.lastWebhookAt) return null;
    return Math.floor((Date.now() - new Date(settings.lastWebhookAt).getTime()) / 60000);
}
