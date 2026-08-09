/**
 * Meta credential preflight. Run this the moment the hotel's keys arrive.
 *
 *   npx esbuild scripts/preflight-whatsapp.ts --bundle --platform=node \
 *     --format=cjs --alias:@=. --outfile=/tmp/pf.cjs && node --env-file=.env /tmp/pf.cjs
 *
 * Every check below is one that, left undone, surfaces later as a Graph API
 * error code inside a failed send — at which point you are debugging four
 * credentials at once, through an error that names none of them. This asks each
 * question separately, in dependency order, and stops at the first answer that
 * makes the rest meaningless.
 *
 * It is READ-ONLY. It sends no message, creates no template, and changes no
 * setting. Safe to run against production credentials at any time, including
 * before the kill switch is ever turned on.
 *
 *   --verbose  print raw Graph responses
 */

const VERBOSE = process.argv.includes('--verbose');

const GRAPH = 'https://graph.facebook.com';

type Check = {
    label: string;
    ok: boolean;
    detail: string;
    /** Nothing after this can be meaningfully tested. */
    fatal?: boolean;
};

const checks: Check[] = [];

function record(label: string, ok: boolean, detail: string, fatal = false) {
    checks.push({ label, ok, detail, fatal });
    console.log(`  ${ok ? 'OK  ' : 'FAIL'}  ${label}`);
    if (detail) console.log(`        ${detail}`);
    return ok;
}

/** Never print a credential. Enough to tell two apart, not enough to use one. */
function fingerprint(value: string): string {
    if (value.length <= 8) return `${value.length} chars`;
    return `${value.slice(0, 4)}…${value.slice(-4)} (${value.length} chars)`;
}

async function graph<T>(
    path: string,
    token: string,
    query: Record<string, string> = {},
): Promise<{ ok: true; data: T } | { ok: false; status: number; code?: number; message: string }> {
    const url = new URL(`${GRAPH}/${version}/${path}`);
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);

    let response: Response;
    try {
        response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    } catch (error) {
        return { ok: false, status: 0, message: error instanceof Error ? error.message : 'Network error' };
    }

    const text = await response.text();
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { parsed = text; }

    if (VERBOSE) console.log(`        ${url.pathname} -> ${response.status} ${text.slice(0, 400)}`);

    if (!response.ok) {
        const body = parsed as { error?: { code?: number; message?: string; error_user_msg?: string } };
        return {
            ok: false,
            status: response.status,
            code: body.error?.code,
            message: body.error?.error_user_msg || body.error?.message || text.slice(0, 200),
        };
    }

    return { ok: true, data: parsed as T };
}

const version = process.env.WHATSAPP_API_VERSION || 'v23.0';

async function main() {
    console.log('\nWhatsApp Cloud API preflight');
    console.log(`Graph version: ${version}\n`);

    // ----------------------------------------
    console.log('--- 1. the four credentials are present ---');
    // ----------------------------------------

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

    // Each recorded separately and none short-circuited: the whole point of a
    // preflight is to hand back every missing credential in one pass, not to
    // reveal them one re-run at a time.
    const hasPhoneId = record('WHATSAPP_PHONE_NUMBER_ID is set', !!phoneNumberId,
        phoneNumberId ? fingerprint(phoneNumberId) : 'missing', true);
    const hasWabaId = record('WHATSAPP_BUSINESS_ACCOUNT_ID is set', !!wabaId,
        wabaId ? fingerprint(wabaId) : 'missing', true);
    const hasToken = record('WHATSAPP_ACCESS_TOKEN is set', !!token,
        token ? fingerprint(token) : 'missing', true);
    const present = hasPhoneId && hasWabaId && hasToken;

    // Not fatal — these two are not needed to talk to Graph, but the module is
    // not actually usable without them, so say so now rather than at go-live.
    record('WHATSAPP_APP_SECRET is set', !!appSecret,
        appSecret ? fingerprint(appSecret) : 'missing — webhook signature verification will reject every event');
    record('WHATSAPP_WEBHOOK_VERIFY_TOKEN is set', !!verifyToken,
        verifyToken
            ? fingerprint(verifyToken)
            : 'missing — we choose this value ourselves and paste it into Meta\'s webhook config; Meta does not supply it');

    if (!present) {
        console.log('\nStopping: the three required credentials are not all present.');
        return summarise();
    }

    // A very common paste error, and one that produces a confusing 404 later:
    // the two IDs are different things and are easy to swap.
    record('the phone number ID and WABA ID are different values',
        phoneNumberId !== wabaId,
        phoneNumberId === wabaId
            ? 'they are identical — these are two different IDs in Meta\'s dashboard and have been swapped or duplicated'
            : 'as expected');

    // ----------------------------------------
    console.log('\n--- 2. the access token is valid ---');
    // ----------------------------------------

    const me = await graph<{ id?: string; name?: string }>('me', token!);
    if (!me.ok) {
        record('the token is accepted by Graph', false,
            me.code === 190
                ? `code 190: the token is invalid or expired. ${me.message}`
                : `HTTP ${me.status}${me.code ? ` code ${me.code}` : ''}: ${me.message}`,
            true);
        console.log('\nStopping: nothing else can be checked with a token Graph will not accept.');
        return summarise();
    }
    record('the token is accepted by Graph', true, `identity: ${me.data.name ?? me.data.id ?? 'unknown'}`);

    // ----------------------------------------
    console.log('\n--- 3. the phone number ID resolves and is usable ---');
    // ----------------------------------------

    const phone = await graph<{
        id: string;
        display_phone_number?: string;
        verified_name?: string;
        quality_rating?: string;
        code_verification_status?: string;
        platform_type?: string;
        throughput?: { level?: string };
    }>(phoneNumberId!, token!, {
        fields: 'id,display_phone_number,verified_name,quality_rating,code_verification_status,platform_type,throughput',
    });

    if (!phone.ok) {
        record('the phone number ID resolves', false,
            phone.code === 100
                ? `code 100: no such object, or this token cannot see it. Check WHATSAPP_PHONE_NUMBER_ID is the *Phone number ID*, not the phone number itself and not the WABA ID. ${phone.message}`
                : `HTTP ${phone.status}${phone.code ? ` code ${phone.code}` : ''}: ${phone.message}`);
    } else {
        record('the phone number ID resolves', true,
            `${phone.data.display_phone_number ?? 'unknown number'} — "${phone.data.verified_name ?? 'no display name'}"`);

        record('the number has completed verification',
            phone.data.code_verification_status === 'VERIFIED',
            `code_verification_status: ${phone.data.code_verification_status ?? 'unknown'}`);

        const quality = phone.data.quality_rating ?? 'UNKNOWN';
        record('quality rating is not RED',
            quality !== 'RED',
            quality === 'RED'
                ? 'RED — the sync cron will halt all sending and trip the kill switch on the first run'
                : `${quality}`);

        if (phone.data.throughput?.level) {
            record('messaging throughput is reported', true, `level: ${phone.data.throughput.level}`);
        }
    }

    // ----------------------------------------
    console.log('\n--- 4. the WABA resolves and owns that number ---');
    // ----------------------------------------

    const waba = await graph<{ id: string; name?: string; timezone_id?: string }>(wabaId!, token!, {
        fields: 'id,name,timezone_id',
    });

    if (!waba.ok) {
        record('the WABA ID resolves', false,
            `HTTP ${waba.status}${waba.code ? ` code ${waba.code}` : ''}: ${waba.message}`);
    } else {
        record('the WABA ID resolves', true, `${waba.data.name ?? waba.data.id}`);

        // The check that catches credentials from two different Meta accounts —
        // individually valid, and useless together.
        const numbers = await graph<{ data?: { id: string; display_phone_number?: string }[] }>(
            `${wabaId}/phone_numbers`, token!, { fields: 'id,display_phone_number' },
        );
        if (!numbers.ok) {
            record('the WABA lists its phone numbers', false,
                `HTTP ${numbers.status}${numbers.code ? ` code ${numbers.code}` : ''}: ${numbers.message}`);
        } else {
            const ids = (numbers.data.data ?? []).map((n) => n.id);
            record('the phone number belongs to this WABA',
                ids.includes(phoneNumberId!),
                ids.includes(phoneNumberId!)
                    ? `1 of ${ids.length} number(s) on the account`
                    : `this WABA owns [${ids.join(', ') || 'none'}] — WHATSAPP_PHONE_NUMBER_ID is not among them, so the two credentials are from different accounts`);
        }
    }

    // ----------------------------------------
    console.log('\n--- 5. templates and permissions ---');
    // ----------------------------------------

    const templates = await graph<{ data?: { name: string; status: string; category: string }[] }>(
        `${wabaId}/message_templates`, token!, { fields: 'name,status,category', limit: '100' },
    );

    if (!templates.ok) {
        record('the token can read message templates', false,
            templates.code === 200 || templates.code === 10
                ? `code ${templates.code}: permission denied. The token is missing whatsapp_business_management. ${templates.message}`
                : `HTTP ${templates.status}${templates.code ? ` code ${templates.code}` : ''}: ${templates.message}`);
    } else {
        const rows = templates.data.data ?? [];
        record('the token can read message templates', true, `${rows.length} template(s) on the account`);

        const approved = rows.filter((t) => t.status === 'APPROVED');
        record('at least one approved template exists',
            approved.length > 0,
            approved.length
                ? approved.map((t) => `${t.name} (${t.category})`).join(', ')
                : 'none yet — expected before submission. Run scripts/seed-templates.ts, review, then submit.');
    }

    // ----------------------------------------
    console.log('\n--- 6. webhook subscription ---');
    // ----------------------------------------

    const subs = await graph<{ data?: { whatsapp_business_api_data?: unknown }[] }>(
        `${wabaId}/subscribed_apps`, token!,
    );
    if (!subs.ok) {
        record('the WABA has a subscribed app', false,
            `HTTP ${subs.status}${subs.code ? ` code ${subs.code}` : ''}: ${subs.message}`);
    } else {
        const count = (subs.data.data ?? []).length;
        record('the WABA has a subscribed app', count > 0,
            count > 0
                ? `${count} app(s) subscribed — inbound messages and status updates will arrive`
                : 'none — no webhook will ever fire, so nothing will be marked delivered or read and the inbox stays empty');
    }

    // ----------------------------------------
    console.log('\n--- 7. what the app itself is configured to do ---');
    // ----------------------------------------

    const provider = process.env.WHATSAPP_PROVIDER;
    record('WHATSAPP_PROVIDER is set to cloud', provider === 'cloud',
        provider === 'cloud'
            ? 'real sends are enabled at the provider level'
            : `currently "${provider ?? 'unset'}" — the mock provider is in use, so nothing reaches Meta regardless of these credentials`);

    return summarise();
}

function summarise() {
    const failures = checks.filter((c) => !c.ok);
    console.log(`\n${checks.length - failures.length} of ${checks.length} checks passed.`);

    if (!failures.length) {
        console.log('\nCredentials are good. Going live still needs three deliberate acts:');
        console.log('  1. templates submitted and approved by Meta');
        console.log('  2. WHATSAPP_PROVIDER=cloud');
        console.log('  3. test mode off and the kill switch on, in the settings screen');
        process.exit(0);
    }

    console.log('\nFailed:');
    for (const f of failures) console.log(`  - ${f.label}: ${f.detail}`);
    process.exit(1);
}

main().catch((error) => {
    console.error('\nPreflight crashed:', error);
    process.exit(1);
});
