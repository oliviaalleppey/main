import { CloudProvider } from './cloud-provider';
import { MockProvider } from './mock-provider';
import type { ProviderName, WhatsAppProvider } from './types';

/**
 * Provider factory.
 *
 * WHATSAPP_PROVIDER=mock  — simulated, no Meta account needed (default)
 * WHATSAPP_PROVIDER=cloud — real Meta Cloud API
 *
 * Defaulting to 'mock' is deliberate: an unconfigured or misconfigured
 * environment must never accidentally send real messages to real guests.
 * Going live is an explicit act.
 */

let cached: WhatsAppProvider | undefined;
let cachedFor: ProviderName | undefined;

export function resolveProviderName(): ProviderName {
    return process.env.WHATSAPP_PROVIDER === 'cloud' ? 'cloud' : 'mock';
}

export function getProvider(): WhatsAppProvider {
    const name = resolveProviderName();

    // Re-instantiate if the env changed under us (dev server hot reload).
    if (cached && cachedFor === name) return cached;

    cached = name === 'cloud' ? new CloudProvider() : new MockProvider();
    cachedFor = name;

    if (name === 'mock') {
        console.info('[whatsapp] Using the MOCK provider — no real messages will be sent.');
    }

    return cached;
}

/** Test seam: drop the cached provider so the next call re-reads env. */
export function resetProviderCache() {
    cached = undefined;
    cachedFor = undefined;
}

export * from './types';
export {
    normalizePhone,
    normalizeBatch,
    toWhatsAppId,
    formatDisplay,
    maskPhone,
    describeRejection,
} from './phone';
