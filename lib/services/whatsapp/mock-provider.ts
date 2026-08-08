import crypto from 'crypto';
import {
    WhatsAppError,
    classifyError,
    type AccountHealth,
    type CreateTemplateParams,
    type RemoteTemplate,
    type SendResult,
    type SendTemplateParams,
    type SendTextParams,
    type SendMediaParams,
    type WhatsAppProvider,
} from './types';

/**
 * Simulated Cloud API, used while the hotel's Meta account is still in
 * verification and for all local development.
 *
 * It deliberately misbehaves: without a provider that produces realistic
 * failures, the dispatcher's retry, skip and halt paths never get exercised
 * until they run against real guests and real money.
 *
 * Behaviour is deterministic per recipient — the same number always gets the
 * same outcome — so a test run is reproducible and a "failing" number stays
 * failing while you debug it.
 *
 * Delivery/read transitions are NOT simulated here. Those arrive via webhook in
 * production, so the mock's counterpart is a dev-only endpoint that replays
 * webhook payloads (added in Sprint 4 alongside the real webhook handler).
 */

type FailureMode = 'none' | 'not_whatsapp' | 'rate_limit' | 'marketing_cap' | 'server_error';

/** Deterministic 0..99 bucket derived from the recipient number. */
function bucketFor(to: string): number {
    const hash = crypto.createHash('sha256').update(to).digest();
    return hash[0] % 100;
}

/**
 * Failure mix roughly matching a real send to a stale Indian contact list:
 * a meaningful slice simply aren't on WhatsApp, plus occasional transient noise.
 */
function failureModeFor(to: string): FailureMode {
    const bucket = bucketFor(to);
    if (bucket < 12) return 'not_whatsapp';    // 12% — the big one on old lists
    if (bucket < 15) return 'marketing_cap';   //  3% — Meta's per-user cap
    if (bucket < 17) return 'rate_limit';      //  2% — retryable
    if (bucket < 18) return 'server_error';    //  1% — retryable
    return 'none';                             // 82% succeed
}

const FAILURE_CODES: Record<Exclude<FailureMode, 'none'>, number> = {
    not_whatsapp: 131026,
    rate_limit: 130429,
    marketing_cap: 131049,
    server_error: 0,
};

function mockWamid(): string {
    return `wamid.MOCK${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
}

function envFlag(name: string, fallback: boolean): boolean {
    const raw = process.env[name];
    if (raw === undefined) return fallback;
    return raw === 'true' || raw === '1';
}

function envInt(name: string, fallback: number): number {
    const parsed = Number(process.env[name]);
    return Number.isFinite(parsed) ? parsed : fallback;
}

async function simulateLatency() {
    const base = envInt('WHATSAPP_MOCK_LATENCY_MS', 120);
    if (base <= 0) return;
    const jitter = Math.floor(Math.random() * base * 0.5);
    await new Promise((resolve) => setTimeout(resolve, base + jitter));
}

// Templates created during a mock session, kept in module scope so a dev can
// submit one and see it appear in the list. Resets on server restart, which is
// fine — the durable copy lives in wa_templates.
const mockTemplates = new Map<string, RemoteTemplate>();

function seedMockTemplates() {
    if (mockTemplates.size > 0) return;
    const seed: RemoteTemplate[] = [
        {
            metaTemplateId: 'mock-tpl-offer',
            name: 'olivia_offer_v1',
            language: 'en',
            category: 'MARKETING',
            status: 'APPROVED',
            components: [
                { type: 'BODY', text: 'Hello {{1}}, enjoy {{2}} off your next stay at Olivia Alleppey. Reply STOP to opt out.' },
                { type: 'BUTTONS', buttons: [{ type: 'QUICK_REPLY', text: 'Stop promotions' }] },
            ],
            qualityScore: 'GREEN',
        },
        {
            metaTemplateId: 'mock-tpl-reengage',
            name: 'olivia_reengage_v1',
            language: 'en',
            category: 'MARKETING',
            status: 'APPROVED',
            components: [
                { type: 'BODY', text: 'Hello {{1}}, may we send you occasional offers from Olivia Alleppey on WhatsApp?' },
                { type: 'BUTTONS', buttons: [{ type: 'QUICK_REPLY', text: 'Yes, keep me posted' }, { type: 'QUICK_REPLY', text: 'No thanks' }] },
            ],
            qualityScore: 'GREEN',
        },
        {
            metaTemplateId: 'mock-tpl-confirm',
            name: 'olivia_booking_confirm_v1',
            language: 'en',
            category: 'UTILITY',
            status: 'APPROVED',
            components: [
                { type: 'BODY', text: 'Dear {{1}}, your booking {{2}} at Olivia Alleppey is confirmed for {{3}}.' },
            ],
            qualityScore: 'GREEN',
        },
        {
            metaTemplateId: 'mock-tpl-rejected',
            name: 'olivia_flash_sale_v1',
            language: 'en',
            category: 'MARKETING',
            status: 'REJECTED',
            components: [{ type: 'BODY', text: 'BIGGEST SALE EVER!!! CLICK bit.ly/xyz NOW' }],
            rejectionReason: 'ABUSIVE_CONTENT',
        },
    ];
    for (const t of seed) mockTemplates.set(`${t.name}:${t.language}`, t);
}

export class MockProvider implements WhatsAppProvider {
    readonly name = 'mock' as const;

    private async send(to: string): Promise<SendResult> {
        await simulateLatency();

        if (envFlag('WHATSAPP_MOCK_ALWAYS_SUCCEED', false)) {
            return { wamid: mockWamid() };
        }

        const mode = failureModeFor(to);
        if (mode !== 'none') {
            const code = FAILURE_CODES[mode];
            const httpStatus = mode === 'server_error' ? 503 : mode === 'rate_limit' ? 429 : 400;
            const spec = classifyError(code, httpStatus);
            throw new WhatsAppError({
                code,
                message: `[mock] ${spec.message}`,
                errorClass: spec.class,
                httpStatus,
            });
        }

        return { wamid: mockWamid() };
    }

    async sendTemplate(params: SendTemplateParams): Promise<SendResult> {
        return this.send(params.to);
    }

    async sendText(params: SendTextParams): Promise<SendResult> {
        return this.send(params.to);
    }

    /**
     * Media send. Rejects an unreachable link the way Meta does (code 131053,
     * "media upload error") rather than pretending any URL works — the most
     * likely real failure is a blob URL that is not actually public, and a mock
     * that always succeeds would hide exactly that.
     */
    async sendMedia(params: SendMediaParams): Promise<SendResult> {
        if (!/^https:\/\//i.test(params.link)) {
            throw new WhatsAppError({
                code: 131053,
                message: '[mock] Media link must be a public https URL',
                errorClass: 'permanent',
                httpStatus: 400,
            });
        }
        return this.send(params.to);
    }

    async listTemplates(): Promise<RemoteTemplate[]> {
        seedMockTemplates();
        await simulateLatency();
        return [...mockTemplates.values()];
    }

    async createTemplate(params: CreateTemplateParams) {
        seedMockTemplates();
        await simulateLatency();

        const key = `${params.name}:${params.language}`;
        if (mockTemplates.has(key)) {
            throw new WhatsAppError({
                code: 100,
                message: '[mock] A template with this name and language already exists',
                errorClass: 'permanent',
                httpStatus: 400,
            });
        }

        const metaTemplateId = `mock-tpl-${crypto.randomBytes(6).toString('hex')}`;
        mockTemplates.set(key, {
            metaTemplateId,
            name: params.name,
            language: params.language,
            category: params.category,
            status: 'PENDING',
            components: params.components,
        });

        // Simulate Meta's review delay so the panel's pending state is real.
        const reviewMs = envInt('WHATSAPP_MOCK_REVIEW_MS', 30_000);
        const approve = !/sale|free|winner|click here|bit\.ly/i.test(JSON.stringify(params.components));
        setTimeout(() => {
            const current = mockTemplates.get(key);
            if (!current || current.status !== 'PENDING') return;
            mockTemplates.set(key, {
                ...current,
                status: approve ? 'APPROVED' : 'REJECTED',
                rejectionReason: approve ? undefined : 'ABUSIVE_CONTENT',
                qualityScore: approve ? 'GREEN' : undefined,
            });
        }, reviewMs).unref?.();

        return { metaTemplateId, status: 'PENDING' };
    }

    async deleteTemplate(name: string): Promise<void> {
        await simulateLatency();
        for (const key of [...mockTemplates.keys()]) {
            if (key.startsWith(`${name}:`)) mockTemplates.delete(key);
        }
    }

    async getAccountHealth(): Promise<AccountHealth> {
        await simulateLatency();
        return {
            connected: true,
            qualityRating: process.env.WHATSAPP_MOCK_QUALITY || 'GREEN',
            messagingTier: process.env.WHATSAPP_MOCK_TIER || 'TIER_250',
            throughput: 'STANDARD',
            verifiedName: 'Olivia Alleppey (mock)',
            displayPhoneNumber: '+91 00000 00000',
        };
    }
}
