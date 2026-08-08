/**
 * Shared types for the WhatsApp module, plus the Meta error taxonomy.
 *
 * The dispatcher must never switch on raw Meta error numbers. It switches on
 * `ErrorClass`, which is what decides whether a failure is retried, skipped,
 * or serious enough to halt the whole campaign.
 */

export type ProviderName = 'mock' | 'cloud';

/**
 * How the dispatcher should react to a failure.
 *
 *  retryable — transient. Back off and try again, up to maxAttempts.
 *  skip      — this recipient can never receive this message. Mark skipped, no
 *              retry, and do NOT count it as a quality failure.
 *  permanent — our payload or config is wrong for this message. Mark failed.
 *  config    — account-level misconfiguration (bad token, unregistered number).
 *              Nothing will succeed until a human fixes it.
 *  halt      — Meta is signalling a policy or reputation problem. Stop
 *              everything immediately.
 */
export type ErrorClass = 'retryable' | 'skip' | 'permanent' | 'config' | 'halt';

type ErrorSpec = { class: ErrorClass; message: string };

/**
 * Meta Cloud API error codes we handle explicitly.
 * Anything unlisted falls back to HTTP-status-based classification.
 */
export const META_ERROR_CODES: Record<number, ErrorSpec> = {
    // --- Auth / account level: nothing will work until fixed ---
    190: { class: 'config', message: 'Access token is invalid or expired' },
    133010: { class: 'config', message: 'Phone number is not registered with the Cloud API' },
    133005: { class: 'config', message: 'Two-step verification PIN mismatch' },

    // --- Policy / reputation: stop sending ---
    368: { class: 'halt', message: 'Temporarily blocked for policy violations' },
    131031: { class: 'halt', message: 'Account has been locked by Meta' },
    131048: { class: 'halt', message: 'Spam rate limit hit — account reputation is at risk' },

    // --- Rate limiting: back off ---
    4: { class: 'retryable', message: 'API call volume limit reached' },
    613: { class: 'retryable', message: 'Rate limit exceeded' },
    80007: { class: 'retryable', message: 'Rate limit exceeded' },
    130429: { class: 'retryable', message: 'Cloud API message throughput limit reached' },
    131056: { class: 'retryable', message: 'Too many messages to this number in a short period' },

    // --- Per-recipient: skip, never retry, not our fault ---
    131026: { class: 'skip', message: 'Not a WhatsApp user, or cannot receive messages' },
    131047: { class: 'skip', message: 'Outside the 24-hour window — a template is required' },
    131049: { class: 'skip', message: 'Meta capped marketing messages to this user this period' },
    130472: { class: 'skip', message: 'User is in an experiment group excluded from marketing' },

    // --- Template problems: our payload or the template itself ---
    132000: { class: 'permanent', message: 'Template variable count does not match' },
    132001: { class: 'permanent', message: 'Template does not exist in this language' },
    132005: { class: 'permanent', message: 'Filled-in template text exceeds the length limit' },
    132007: { class: 'permanent', message: 'Template content violates format policy' },
    132012: { class: 'permanent', message: 'Template variable format mismatch' },
    132015: { class: 'halt', message: 'Template was paused by Meta for low quality' },
    132016: { class: 'halt', message: 'Template was disabled by Meta' },
    132068: { class: 'halt', message: 'Flow is blocked' },

    // --- Payload ---
    100: { class: 'permanent', message: 'Invalid request parameter' },
    131008: { class: 'permanent', message: 'Required parameter is missing' },
    131009: { class: 'permanent', message: 'Parameter value is not valid' },
    131021: { class: 'permanent', message: 'Sender and recipient are the same number' },
};

export class WhatsAppError extends Error {
    readonly code: number;
    readonly errorClass: ErrorClass;
    readonly httpStatus?: number;
    readonly details?: string;
    readonly raw?: unknown;

    constructor(params: {
        code: number;
        message: string;
        errorClass: ErrorClass;
        httpStatus?: number;
        details?: string;
        raw?: unknown;
    }) {
        super(params.message);
        this.name = 'WhatsAppError';
        this.code = params.code;
        this.errorClass = params.errorClass;
        this.httpStatus = params.httpStatus;
        this.details = params.details;
        this.raw = params.raw;
    }

    get isRetryable() {
        return this.errorClass === 'retryable';
    }

    /** True when the whole campaign (or all sending) should stop. */
    get shouldHalt() {
        return this.errorClass === 'halt' || this.errorClass === 'config';
    }
}

export function classifyError(code: number | undefined, httpStatus?: number): ErrorSpec {
    if (code !== undefined && META_ERROR_CODES[code]) {
        return META_ERROR_CODES[code];
    }
    if (httpStatus === 429) {
        return { class: 'retryable', message: 'Rate limited by Meta' };
    }
    if (httpStatus !== undefined && httpStatus >= 500) {
        return { class: 'retryable', message: `Meta server error (HTTP ${httpStatus})` };
    }
    if (httpStatus === 401 || httpStatus === 403) {
        return { class: 'config', message: `Authentication failed (HTTP ${httpStatus})` };
    }
    return { class: 'permanent', message: code ? `Unhandled Meta error ${code}` : 'Unknown error' };
}

// --------------------------------------------
// Provider interface
// --------------------------------------------

export type TemplateComponent = {
    type: 'header' | 'body' | 'button';
    sub_type?: string;
    index?: string;
    parameters: { type: string; text?: string; image?: { link: string } }[];
};

export type SendTemplateParams = {
    /** E.164 with '+'. The provider strips it. */
    to: string;
    templateName: string;
    language: string;
    components?: TemplateComponent[];
};

export type SendTextParams = {
    to: string;
    body: string;
    previewUrl?: boolean;
};

export type SendResult = {
    wamid: string;
    /** Meta returns this when the recipient's number was normalised differently. */
    normalizedTo?: string;
};

export type RemoteTemplate = {
    metaTemplateId: string;
    name: string;
    language: string;
    category: string;
    status: string;
    components: unknown[];
    rejectionReason?: string;
    qualityScore?: string;
};

export type CreateTemplateParams = {
    name: string;
    language: string;
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
    components: unknown[];
};

export type AccountHealth = {
    connected: boolean;
    qualityRating?: string;
    messagingTier?: string;
    throughput?: string;
    verifiedName?: string;
    displayPhoneNumber?: string;
    error?: string;
};

export interface WhatsAppProvider {
    readonly name: ProviderName;

    sendTemplate(params: SendTemplateParams): Promise<SendResult>;
    sendText(params: SendTextParams): Promise<SendResult>;

    listTemplates(): Promise<RemoteTemplate[]>;
    createTemplate(params: CreateTemplateParams): Promise<{ metaTemplateId: string; status: string }>;
    deleteTemplate(name: string): Promise<void>;

    getAccountHealth(): Promise<AccountHealth>;
}

/**
 * Meta's customer service window: for this long after a guest messages us, we may
 * send free-form text; outside it, only an approved template.
 *
 * It lives here, with no imports of its own, because two parts of the module
 * depend on it from opposite directions — the webhook *sets* the expiry when an
 * inbound message arrives, and the inbox *enforces* it when an operator replies.
 * Two copies of this number that drift apart would open a hole in the gate.
 */
export const SERVICE_WINDOW_MS = 24 * 3_600_000;

/**
 * Indicative per-message price in paise, by template category.
 * India rates as of the July 2025 switch to per-message billing. These are for
 * pre-send estimates only — actual cost is reconciled from Meta's own reporting,
 * and the rate card is revised periodically.
 */
export const PRICE_PAISE: Record<string, number> = {
    MARKETING: 78,
    UTILITY: 13,
    AUTHENTICATION: 13,
};

export function estimateCostPaise(category: string, recipients: number): number {
    return (PRICE_PAISE[category] ?? PRICE_PAISE.MARKETING) * recipients;
}
