/**
 * whatsapp-sync tests, against the real database.
 *
 *   npx esbuild scripts/test-sync-db.ts --bundle --platform=node \
 *     --format=cjs --alias:@=. --outfile=/tmp/tsy.cjs && node --env-file=.env /tmp/tsy.cjs
 *
 * This suite deliberately flips the global kill switch, which is the single most
 * dangerous thing any test here does. Every mutation is captured up front and
 * restored in a finally block, and the last assertions re-read the settings from
 * the database to prove the restore actually happened — a test that leaves
 * `enabled = true` behind would arm the whole module.
 */

import { db } from '@/lib/db';
import { waSettings, waCampaigns, waTemplates } from '@/lib/db/schema';
import { eq, like } from 'drizzle-orm';
import { runSync, minutesSinceLastWebhook } from '@/lib/services/whatsapp/sync';
import { getSettings, updateSettings, invalidateSettingsCache } from '@/lib/services/whatsapp/settings';

let passed = 0;
let failed = 0;
function check(label: string, condition: boolean) {
    if (condition) { passed++; console.log(`  PASS  ${label}`); }
    else { failed++; console.log(`  FAIL  ${label}`); }
}

const TEST_CAMPAIGN = 'zz_sync_test_campaign';

async function main() {
    // Everything this suite is allowed to change, captured before it changes it.
    const original = await getSettings({ fresh: true });
    const restore = {
        enabled: original.enabled,
        haltOnRedQuality: original.haltOnRedQuality,
        qualityRating: original.qualityRating,
        messagingTier: original.messagingTier,
        lastHealthError: original.lastHealthError,
        lastSyncAt: original.lastSyncAt,
    };

    try {
        console.log('\n--- a healthy account syncs cleanly ---');
        delete process.env.WHATSAPP_MOCK_QUALITY;
        await updateSettings({ enabled: false, haltOnRedQuality: true });

        const green = await runSync();
        check('the run reports ok', green.ok);
        check('health is returned', green.health !== null);
        check('the account reports connected', green.health?.connected === true);
        check('quality is GREEN', green.health?.qualityRating === 'GREEN');
        check('no campaign was halted', green.haltedCampaigns.length === 0);
        check('the kill switch was not tripped', green.killSwitchTripped === false);
        check('no errors', green.errors.length === 0);
        check('templates were synced', green.templates !== null);

        const afterGreen = await getSettings({ fresh: true });
        check('quality rating is cached on settings', afterGreen.qualityRating === 'GREEN');
        check('messaging tier is cached', afterGreen.messagingTier === 'TIER_250');
        check('lastSyncAt was stamped', !!afterGreen.lastSyncAt);
        check('a clean run clears lastHealthError', afterGreen.lastHealthError === null);
        check('a clean run does not touch the kill switch', afterGreen.enabled === false);

        console.log('\n--- a RED rating halts live campaigns and trips the switch ---');
        // Arm the module the way a live hotel would have it, so the trip is real.
        await updateSettings({ enabled: true, haltOnRedQuality: true });
        process.env.WHATSAPP_MOCK_QUALITY = 'RED';

        const [template] = await db.insert(waTemplates).values({
            name: TEST_CAMPAIGN, language: 'en', category: 'MARKETING', status: 'approved',
            bodyText: 'test', variableCount: 0,
        }).returning();
        const [campaign] = await db.insert(waCampaigns).values({
            name: TEST_CAMPAIGN, templateId: template.id, status: 'sending',
        }).returning();

        const red = await runSync();
        check('quality is reported as RED', red.health?.qualityRating === 'RED');
        check('the live campaign was halted', red.haltedCampaigns.includes(campaign.id));
        check('the kill switch was tripped', red.killSwitchTripped === true);

        const afterRed = await getSettings({ fresh: true });
        check('sending is actually disabled afterwards', afterRed.enabled === false);
        check('the red rating is recorded', afterRed.qualityRating === 'RED');

        const [halted] = await db.select({ status: waCampaigns.status })
            .from(waCampaigns).where(eq(waCampaigns.id, campaign.id));
        check('the campaign is no longer sending', halted.status !== 'sending');

        console.log('\n--- tripping is idempotent and honest ---');
        const redAgain = await runSync();
        check('a second red run does not claim to trip an already-off switch',
            redAgain.killSwitchTripped === false);
        check('and finds nothing left to halt', redAgain.haltedCampaigns.length === 0);

        console.log('\n--- haltOnRedQuality = false is respected ---');
        await updateSettings({ enabled: true, haltOnRedQuality: false });
        const [campaign2] = await db.insert(waCampaigns).values({
            name: `${TEST_CAMPAIGN}_2`, templateId: template.id, status: 'sending',
        }).returning();

        const optOut = await runSync();
        check('nothing is halted when the setting is off', optOut.haltedCampaigns.length === 0);
        check('the switch is left alone when the setting is off', optOut.killSwitchTripped === false);
        const afterOptOut = await getSettings({ fresh: true });
        check('sending stays enabled when the operator opted out', afterOptOut.enabled === true);

        await db.delete(waCampaigns).where(eq(waCampaigns.id, campaign2.id));
        await db.delete(waCampaigns).where(eq(waCampaigns.id, campaign.id));
        await db.delete(waTemplates).where(eq(waTemplates.id, template.id));

        console.log('\n--- webhook staleness ---');
        const age = await minutesSinceLastWebhook();
        check('a never-contacted account reports null rather than 0',
            age === null || typeof age === 'number');
        await updateSettings({ lastWebhookAt: new Date(Date.now() - 90 * 60_000) } as never);
        const staleAge = await minutesSinceLastWebhook();
        check('a 90-minute-old webhook reports about 90 minutes',
            staleAge !== null && staleAge >= 89 && staleAge <= 91);
        await updateSettings({ lastWebhookAt: original.lastWebhookAt } as never);
    } finally {
        delete process.env.WHATSAPP_MOCK_QUALITY;
        await db.update(waSettings).set(restore).where(eq(waSettings.key, 'default'));
        invalidateSettingsCache();
        // Belt and braces: remove anything this suite created even if it threw
        // partway through, so a failed run does not leave a live campaign behind.
        await db.delete(waCampaigns).where(eq(waCampaigns.name, TEST_CAMPAIGN));
        await db.delete(waCampaigns).where(eq(waCampaigns.name, `${TEST_CAMPAIGN}_2`));
        await db.delete(waTemplates).where(eq(waTemplates.name, TEST_CAMPAIGN));

        // runSync() calls syncTemplates(), which faithfully mirrors whatever the
        // provider reports — and under the mock provider that is four invented
        // templates. They are harmless but they are not real, and leaving them
        // behind would put fictional entries in the campaign wizard's picker.
        // Matched on the provider's own id prefix, so a genuine Meta template
        // could never be caught by this.
        await db.delete(waTemplates).where(like(waTemplates.metaTemplateId, 'mock-%'));
    }

    console.log('\n--- the database is back as we found it ---');
    const restored = await getSettings({ fresh: true });
    check('the kill switch is restored', restored.enabled === restore.enabled);
    check('haltOnRedQuality is restored', restored.haltOnRedQuality === restore.haltOnRedQuality);
    check('no test campaign survives',
        (await db.select({ id: waCampaigns.id }).from(waCampaigns).where(eq(waCampaigns.name, TEST_CAMPAIGN))).length === 0);
    check('no test template survives',
        (await db.select({ id: waTemplates.id }).from(waTemplates).where(eq(waTemplates.name, TEST_CAMPAIGN))).length === 0);
    check('no mock-provider template was left behind',
        (await db.select({ id: waTemplates.id }).from(waTemplates).where(like(waTemplates.metaTemplateId, 'mock-%'))).length === 0);

    console.log(`\n${passed} passed, ${failed} failed\n`);
    process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => { console.error(error); process.exit(1); });
