import { AlertTriangle, CheckCircle2, CircleSlash, Database } from 'lucide-react';
import { KillSwitch } from '@/components/admin/whatsapp/kill-switch';
import { getProvider, resolveProviderName } from '@/lib/services/whatsapp';
import { getSettings, isWithinQuietHours, budgetState } from '@/lib/services/whatsapp/settings';
import { formatCurrency } from '@/lib/utils';
import type { AccountHealth } from '@/lib/services/whatsapp/types';
import type { WaSettings } from '@/lib/services/whatsapp/settings';

export const dynamic = 'force-dynamic';

/**
 * Overview / health page.
 *
 * Sprint 1 scope: prove the foundation is wired end to end — settings load from
 * the database, the provider answers, and the kill switch round-trips. Live
 * campaign progress, spend and alerts arrive with the dispatcher in Sprint 3.
 */
export default async function WhatsAppOverviewPage() {
    const provider = resolveProviderName();

    let settings: WaSettings | null = null;
    let settingsError: string | null = null;
    try {
        settings = await getSettings({ fresh: true });
    } catch (error) {
        // The most likely cause is the migration not having been applied yet.
        settingsError = error instanceof Error ? error.message : 'Unknown error';
    }

    let health: AccountHealth = { connected: false, error: 'Not checked' };
    try {
        health = await getProvider().getAccountHealth();
    } catch (error) {
        health = { connected: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    if (settingsError) {
        return (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-6">
                <div className="flex items-start gap-3">
                    <Database className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                        <h2 className="font-semibold text-amber-900">WhatsApp tables are not set up yet</h2>
                        <p className="mt-1 text-sm text-amber-800">
                            The module&apos;s database migration has not been applied to this environment.
                        </p>
                        <pre className="mt-3 overflow-x-auto rounded bg-amber-100 p-3 text-xs text-amber-900">
                            psql &quot;$DATABASE_URL&quot; -f drizzle/0006_whatsapp_module.sql
                        </pre>
                        <p className="mt-3 text-xs text-amber-700">Details: {settingsError}</p>
                    </div>
                </div>
            </div>
        );
    }

    const quiet = isWithinQuietHours(settings!);
    const budget = budgetState(settings!, 0); // real spend lands with the dispatcher

    return (
        <div className="space-y-6">
            {/* Sending state */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sending</p>
                    <div className="mt-2 flex items-center gap-2">
                        {settings!.enabled ? (
                            <>
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <span className="text-lg font-semibold text-gray-900">Enabled</span>
                            </>
                        ) : (
                            <>
                                <CircleSlash className="h-5 w-5 text-gray-400" />
                                <span className="text-lg font-semibold text-gray-500">Off</span>
                            </>
                        )}
                    </div>
                    <div className="mt-4">
                        <KillSwitch enabled={!!settings!.enabled} />
                    </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Account</p>
                    <p className="mt-2 text-lg font-semibold text-gray-900">
                        {health.connected ? (health.qualityRating ?? 'Connected') : 'Not connected'}
                    </p>
                    <dl className="mt-3 space-y-1 text-xs text-gray-500">
                        <div className="flex justify-between gap-2">
                            <dt>Provider</dt>
                            <dd className="font-medium text-gray-700">{provider}</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                            <dt>Messaging tier</dt>
                            <dd className="font-medium text-gray-700">{health.messagingTier ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                            <dt>Number</dt>
                            <dd className="font-medium text-gray-700">{health.displayPhoneNumber ?? '—'}</dd>
                        </div>
                        {health.error && (
                            <div className="pt-1 text-amber-700">{health.error}</div>
                        )}
                    </dl>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Budget this month</p>
                    <p className="mt-2 text-lg font-semibold text-gray-900">
                        {formatCurrency(budget.spent)}{' '}
                        <span className="text-sm font-normal text-gray-400">of {formatCurrency(budget.budget)}</span>
                    </p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                            className="h-full bg-gray-900 transition-all"
                            style={{ width: `${Math.min(100, budget.percentUsed)}%` }}
                        />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                        Spend tracking activates with the dispatcher.
                    </p>
                </div>
            </div>

            {/* Guardrails currently in force */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="text-sm font-semibold text-gray-900">Guardrails in force</h2>
                <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <Guardrail
                        label="Test mode"
                        value={settings!.testMode ? 'On' : 'Off'}
                        detail={
                            settings!.testMode
                                ? `Only ${((settings!.testNumbers as string[] | null) ?? []).length} whitelisted number(s) can receive messages`
                                : 'Messages go to real recipients'
                        }
                        warn={!settings!.testMode}
                    />
                    <Guardrail label="Daily cap" value={String(settings!.dailyCap)} detail="Messages per 24 hours" />
                    <Guardrail
                        label="Quiet hours"
                        value={settings!.quietHoursEnabled ? `${settings!.quietHoursStart}:00–${settings!.quietHoursEnd}:00` : 'Off'}
                        detail={quiet ? 'Active right now — marketing is held' : 'Not active right now'}
                    />
                    <Guardrail
                        label="Frequency cap"
                        value={`${settings!.frequencyCapPer30d} / 30 days`}
                        detail="Marketing messages per contact"
                    />
                    <Guardrail
                        label="Auto-halt"
                        value={`${(settings!.stopOptOutRateBp ?? 0) / 100}% opt-out`}
                        detail={`or ${(settings!.stopFailureRateBp ?? 0) / 100}% failures, min ${settings!.stopMinSample} sent`}
                    />
                    <Guardrail
                        label="Two-person rule"
                        value={`Above ${settings!.approvalThreshold}`}
                        detail="Recipients requiring a second approver"
                    />
                </dl>
            </div>

            {/* Build status — honest about what does and doesn't work yet */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">Module build status</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Foundation is in place: schema, provider abstraction, phone normalisation,
                            consent gate, settings and this kill switch. Contacts, templates, campaigns,
                            inbox and analytics land in the next sprints — their tabs are greyed out until then.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Guardrail({
    label,
    value,
    detail,
    warn,
}: {
    label: string;
    value: string;
    detail: string;
    warn?: boolean;
}) {
    return (
        <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
            <dd className={`mt-0.5 font-semibold ${warn ? 'text-amber-700' : 'text-gray-900'}`}>{value}</dd>
            <dd className="mt-0.5 text-xs text-gray-500">{detail}</dd>
        </div>
    );
}
