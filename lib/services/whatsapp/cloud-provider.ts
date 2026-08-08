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
import { toWhatsAppId } from './phone';

/**
 * Real Meta Cloud API provider.
 *
 * Follows the lazy-init + warn-once pattern used by lib/services/email.ts, so a
 * missing configuration degrades to a clear error rather than crashing at import
 * time (important: this module is imported by admin pages that must still render
 * before the hotel supplies credentials).
 */

const GRAPH_HOST = 'https://graph.facebook.com';

type Config = {
    phoneNumberId: string;
    wabaId: string;
    token: string;
    version: string;
};

let warnedMissingConfig = false;

function readConfig(): Config | null {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
    const token = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !wabaId || !token) {
        if (!warnedMissingConfig) {
            console.warn(
                '[whatsapp] Cloud provider selected but WHATSAPP_PHONE_NUMBER_ID / ' +
                'WHATSAPP_BUSINESS_ACCOUNT_ID / WHATSAPP_ACCESS_TOKEN are not all set. ' +
                'Sending is disabled. Set WHATSAPP_PROVIDER=mock for local work.',
            );
            warnedMissingConfig = true;
        }
        return null;
    }

    return {
        phoneNumberId,
        wabaId,
        token,
        version: process.env.WHATSAPP_API_VERSION || 'v23.0',
    };
}

function requireConfig(): Config {
    const config = readConfig();
    if (!config) {
        throw new WhatsAppError({
            code: 0,
            message: 'WhatsApp Cloud API is not configured',
            errorClass: 'config',
        });
    }
    return config;
}

type GraphErrorBody = {
    error?: {
        message?: string;
        code?: number;
        error_subcode?: number;
        error_data?: { details?: string };
        fbtrace_id?: string;
    };
};

async function graphRequest<T>(
    config: Config,
    path: string,
    init: { method: 'GET' | 'POST' | 'DELETE'; body?: unknown; query?: Record<string, string> },
): Promise<T> {
    const url = new URL(`${GRAPH_HOST}/${config.version}/${path}`);
    for (const [k, v] of Object.entries(init.query ?? {})) {
        url.searchParams.set(k, v);
    }

    let response: Response;
    try {
        response = await fetch(url, {
            method: init.method,
            headers: {
                Authorization: `Bearer ${config.token}`,
                ...(init.body ? { 'Content-Type': 'application/json' } : {}),
            },
            body: init.body ? JSON.stringify(init.body) : undefined,
            // Meta is normally fast; a hung socket must not hold a serverless
            // function open until the platform timeout.
            signal: AbortSignal.timeout(20_000),
        });
    } catch (cause) {
        // Network failure or timeout — always worth retrying.
        throw new WhatsAppError({
            code: 0,
            message: cause instanceof Error && cause.name === 'TimeoutError'
                ? 'Request to Meta timed out'
                : 'Network error contacting Meta',
            errorClass: 'retryable',
            raw: cause,
        });
    }

    const text = await response.text();
    let parsed: unknown;
    try {
        parsed = text ? JSON.parse(text) : {};
    } catch {
        parsed = { raw: text };
    }

    if (!response.ok) {
        const body = parsed as GraphErrorBody;
        const code = body.error?.code;
        const spec = classifyError(code, response.status);
        throw new WhatsAppError({
            code: code ?? 0,
            // Prefer Meta's own message; our table's text is the fallback.
            message: body.error?.message || spec.message,
            errorClass: spec.class,
            httpStatus: response.status,
            details: body.error?.error_data?.details,
            raw: parsed,
        });
    }

    return parsed as T;
}

export class CloudProvider implements WhatsAppProvider {
    readonly name = 'cloud' as const;

    async sendTemplate(params: SendTemplateParams): Promise<SendResult> {
        const config = requireConfig();
        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: toWhatsAppId(params.to),
            type: 'template',
            template: {
                name: params.templateName,
                language: { code: params.language },
                ...(params.components?.length ? { components: params.components } : {}),
            },
        };

        const result = await graphRequest<{
            messages?: { id: string }[];
            contacts?: { wa_id: string; input: string }[];
        }>(config, `${config.phoneNumberId}/messages`, { method: 'POST', body: payload });

        const wamid = result.messages?.[0]?.id;
        if (!wamid) {
            throw new WhatsAppError({
                code: 0,
                message: 'Meta accepted the request but returned no message id',
                errorClass: 'retryable',
                raw: result,
            });
        }

        const waId = result.contacts?.[0]?.wa_id;
        return {
            wamid,
            normalizedTo: waId ? `+${waId}` : undefined,
        };
    }

    async sendText(params: SendTextParams): Promise<SendResult> {
        const config = requireConfig();
        const result = await graphRequest<{ messages?: { id: string }[] }>(
            config,
            `${config.phoneNumberId}/messages`,
            {
                method: 'POST',
                body: {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: toWhatsAppId(params.to),
                    type: 'text',
                    text: { body: params.body, preview_url: params.previewUrl ?? false },
                },
            },
        );

        const wamid = result.messages?.[0]?.id;
        if (!wamid) {
            throw new WhatsAppError({
                code: 0,
                message: 'Meta accepted the request but returned no message id',
                errorClass: 'retryable',
                raw: result,
            });
        }
        return { wamid };
    }

    /**
     * Send an image or document by public link.
     *
     * Meta fetches the URL itself rather than us uploading bytes, which is why
     * the link has to be publicly reachable. The alternative — POST to /media for
     * an id, then send the id — avoids that but adds a second round trip and a
     * 30-day expiry on the id; the link form is simpler and the blob store is
     * already public.
     */
    async sendMedia(params: SendMediaParams): Promise<SendResult> {
        const config = requireConfig();
        // The media object's key is the type name itself: { image: {...} }.
        const media: Record<string, unknown> = { link: params.link };
        if (params.caption) media.caption = params.caption;
        // filename is meaningful only for documents; Meta ignores it elsewhere.
        if (params.kind === 'document' && params.filename) media.filename = params.filename;

        const result = await graphRequest<{ messages?: { id: string }[] }>(
            config,
            `${config.phoneNumberId}/messages`,
            {
                method: 'POST',
                body: {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: toWhatsAppId(params.to),
                    type: params.kind,
                    [params.kind]: media,
                },
            },
        );

        const wamid = result.messages?.[0]?.id;
        if (!wamid) {
            throw new WhatsAppError({
                code: 0,
                message: 'Meta accepted the media request but returned no message id',
                errorClass: 'retryable',
                raw: result,
            });
        }
        return { wamid };
    }

    async listTemplates(): Promise<RemoteTemplate[]> {
        const config = requireConfig();
        const out: RemoteTemplate[] = [];
        let after: string | undefined;

        // Paginate — a mature account can hold well over the default page size.
        do {
            const page = await graphRequest<{
                data?: {
                    id: string;
                    name: string;
                    language: string;
                    category: string;
                    status: string;
                    components?: unknown[];
                    rejected_reason?: string;
                    quality_score?: { score?: string };
                }[];
                paging?: { cursors?: { after?: string }; next?: string };
            }>(config, `${config.wabaId}/message_templates`, {
                method: 'GET',
                query: {
                    limit: '100',
                    fields: 'id,name,language,category,status,components,rejected_reason,quality_score',
                    ...(after ? { after } : {}),
                },
            });

            for (const t of page.data ?? []) {
                out.push({
                    metaTemplateId: t.id,
                    name: t.name,
                    language: t.language,
                    category: t.category,
                    status: t.status,
                    components: t.components ?? [],
                    rejectionReason: t.rejected_reason && t.rejected_reason !== 'NONE'
                        ? t.rejected_reason
                        : undefined,
                    qualityScore: t.quality_score?.score,
                });
            }

            after = page.paging?.next ? page.paging?.cursors?.after : undefined;
        } while (after);

        return out;
    }

    async createTemplate(params: CreateTemplateParams) {
        const config = requireConfig();
        const result = await graphRequest<{ id: string; status: string; category?: string }>(
            config,
            `${config.wabaId}/message_templates`,
            {
                method: 'POST',
                body: {
                    name: params.name,
                    language: params.language,
                    category: params.category,
                    components: params.components,
                },
            },
        );
        return { metaTemplateId: result.id, status: result.status || 'PENDING' };
    }

    async deleteTemplate(name: string): Promise<void> {
        const config = requireConfig();
        await graphRequest(config, `${config.wabaId}/message_templates`, {
            method: 'DELETE',
            query: { name },
        });
    }

    async getAccountHealth(): Promise<AccountHealth> {
        const config = readConfig();
        if (!config) {
            return { connected: false, error: 'Not configured' };
        }

        try {
            const result = await graphRequest<{
                data?: {
                    id: string;
                    verified_name?: string;
                    display_phone_number?: string;
                    quality_rating?: string;
                    messaging_limit_tier?: string;
                    throughput?: { level?: string };
                }[];
            }>(config, `${config.wabaId}/phone_numbers`, {
                method: 'GET',
                query: {
                    fields: 'id,verified_name,display_phone_number,quality_rating,messaging_limit_tier,throughput',
                },
            });

            const me = result.data?.find((n) => n.id === config.phoneNumberId) ?? result.data?.[0];
            if (!me) {
                return { connected: false, error: 'No phone numbers found on this WABA' };
            }

            return {
                connected: true,
                qualityRating: me.quality_rating,
                messagingTier: me.messaging_limit_tier,
                throughput: me.throughput?.level,
                verifiedName: me.verified_name,
                displayPhoneNumber: me.display_phone_number,
            };
        } catch (error) {
            return {
                connected: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}
