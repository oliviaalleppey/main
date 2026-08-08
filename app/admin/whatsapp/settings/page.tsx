import { KillSwitch } from '@/components/admin/whatsapp/kill-switch';
import { getSettings } from '@/lib/services/whatsapp/settings';
import { resolveProviderName } from '@/lib/services/whatsapp';
import { formatCurrency } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * Settings — read-only in Sprint 1 apart from the kill switch.
 *
 * The editable form arrives in Sprint 4 with the rest of the ops module. Showing
 * the live values now is still worth it: these numbers govern every send, and an
 * operator should be able to see them before the first campaign is built.
 */
export default async function WhatsAppSettingsPage() {
    let settings;
    try {
        settings = await getSettings({ fresh: true });
    } catch {
        return (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
                Settings are unavailable — apply <code>drizzle/0006_whatsapp_module.sql</code> first.
            </div>
        );
    }

    const testNumbers = (settings.testNumbers as string[] | null) ?? [];

    const groups: { title: string; rows: [string, string][] }[] = [
        {
            title: 'Provider',
            rows: [
                ['Provider', resolveProviderName()],
                ['Phone number ID', process.env.WHATSAPP_PHONE_NUMBER_ID ? 'configured' : 'not set'],
                ['WABA ID', process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ? 'configured' : 'not set'],
                ['Access token', process.env.WHATSAPP_ACCESS_TOKEN ? 'configured' : 'not set'],
                ['App secret (webhook)', process.env.WHATSAPP_APP_SECRET ? 'configured' : 'not set'],
                ['API version', process.env.WHATSAPP_API_VERSION || 'v23.0 (default)'],
            ],
        },
        {
            title: 'Safety',
            rows: [
                ['Sending enabled', settings.enabled ? 'yes' : 'no'],
                ['Test mode', settings.testMode ? 'on' : 'off'],
                ['Test numbers', testNumbers.length ? testNumbers.join(', ') : 'none'],
            ],
        },
        {
            title: 'Throughput',
            rows: [
                ['Daily cap', String(settings.dailyCap)],
                ['Throttle', `${settings.throttlePerMin} / minute`],
                ['Batch size', String(settings.batchSize)],
                ['Max concurrency', String(settings.maxConcurrency)],
                ['Max attempts', String(settings.maxAttempts)],
            ],
        },
        {
            title: 'Guest protection',
            rows: [
                ['Quiet hours', settings.quietHoursEnabled ? `${settings.quietHoursStart}:00 – ${settings.quietHoursEnd}:00` : 'off'],
                ['Timezone', settings.timezone ?? 'Asia/Kolkata'],
                ['Frequency cap', `${settings.frequencyCapPer30d} marketing messages / 30 days`],
            ],
        },
        {
            title: 'Cost & approvals',
            rows: [
                ['Monthly budget', formatCurrency(settings.monthlyBudget ?? 0)],
                ['Warn at', `${settings.budgetWarnPercent}%`],
                ['Two-person rule above', `${settings.approvalThreshold} recipients`],
            ],
        },
        {
            title: 'Auto-halt thresholds',
            rows: [
                ['Opt-out rate', `${(settings.stopOptOutRateBp ?? 0) / 100}%`],
                ['Failure rate', `${(settings.stopFailureRateBp ?? 0) / 100}%`],
                ['Minimum sample', `${settings.stopMinSample} sent`],
                ['Halt on red quality', settings.haltOnRedQuality ? 'yes' : 'no'],
            ],
        },
    ];

    return (
        <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="text-sm font-semibold text-gray-900">Global kill switch</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Stops every outbound message immediately, including in-flight campaigns.
                </p>
                <div className="mt-3">
                    <KillSwitch enabled={!!settings.enabled} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {groups.map((group) => (
                    <div key={group.title} className="rounded-lg border border-gray-200 bg-white p-5">
                        <h2 className="text-sm font-semibold text-gray-900">{group.title}</h2>
                        <dl className="mt-3 space-y-2 text-sm">
                            {group.rows.map(([label, value]) => (
                                <div key={label} className="flex items-start justify-between gap-4">
                                    <dt className="text-gray-500">{label}</dt>
                                    <dd className="text-right font-medium text-gray-900 break-all">{value}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                ))}
            </div>

            <p className="text-xs text-gray-500">
                Editing these values from the panel arrives with the ops module in Sprint 4. Until then they
                can be changed directly in <code>wa_settings</code>.
            </p>
        </div>
    );
}
