/**
 * Tests for campaign attribution — the pure-logic half.
 *
 * Three of the things checked here are the kind that fail silently and produce a
 * number nobody questions:
 *
 *  - **The open redirect.** buildDestination() is the only place a redirect
 *    target is produced, and /w/<token> is a link the hotel sends to thousands
 *    of guests. If it can be steered off-origin, it is a phishing endpoint on
 *    the hotel's own domain. That is tested here as a prohibition.
 *  - **Bot filtering.** WhatsApp fetches every link to build a preview card, so
 *    without the filter the click-through rate is roughly "everyone we sent to"
 *    and reads as a triumph.
 *  - **The button index.** Meta rejects a message that carries a parameter for a
 *    button that is static, and marketing templates get an auto-added opt-out
 *    button that is very often button 0 — so the index cannot be assumed.
 *
 * Run:
 *   npx esbuild scripts/test-attribution.ts --bundle --platform=node \
 *     --format=cjs --alias:@=. --outfile=/tmp/tat.cjs && node /tmp/tat.cjs
 */

import {
    generateToken,
    normalizeToken,
    classifyUserAgent,
    hashIp,
    buildDestination,
    clickButtonUrlTemplate,
    clickLink,
} from '@/lib/services/whatsapp/attribution';
import { assignVariant, readRateSignificance, describeOutcome, type VariantStats } from '@/lib/services/whatsapp/ab';
import { lintTemplate, dynamicUrlButtonIndex } from '@/lib/services/whatsapp/template-lint';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
    if (condition) { passed++; console.log(`  PASS  ${name}`); }
    else { failed++; console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ''}`); }
}

// --------------------------------------------
console.log('\n--- token generation ---');
// --------------------------------------------

const tokens = Array.from({ length: 2000 }, () => generateToken());

check('a token is 8 characters', tokens[0].length === 8);
check('every token is 8 characters', tokens.every((t) => t.length === 8));
check('tokens use only the Crockford alphabet',
    tokens.every((t) => /^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{8}$/.test(t)));
check('the ambiguous letters I, L, O and U never appear',
    tokens.every((t) => !/[ILOU]/.test(t)),
    'a token that can be misread cannot be read back off a screen');
check('2000 tokens are all distinct', new Set(tokens).size === 2000);

// A weak generator that repeated a character class would show up as a small
// alphabet. 2000 tokens is 16000 characters over 32 symbols.
const usedSymbols = new Set(tokens.join('').split(''));
check('the generator reaches most of the alphabet', usedSymbols.size >= 30,
    `saw ${usedSymbols.size} of 32 symbols`);

check('a token round-trips through normalizeToken', normalizeToken(tokens[0]) === tokens[0]);
check('lower case is accepted and upper-cased', normalizeToken('k7m2q9zz') === 'K7M2Q9ZZ');
check('surrounding whitespace is trimmed', normalizeToken('  K7M2Q9ZZ  ') === 'K7M2Q9ZZ');
check('an empty token is rejected', normalizeToken('') === null);
check('a null token is rejected', normalizeToken(null) === null);
check('a token with an ambiguous letter is rejected', normalizeToken('K7M2Q9IL') === null);
check('a token with punctuation is rejected', normalizeToken('K7M2-Q9Z') === null);
check('an over-long token is rejected', normalizeToken('K'.repeat(20)) === null);
check('a SQL-ish token is rejected', normalizeToken("K7' OR 1=1--") === null);

// --------------------------------------------
console.log('\n--- bot detection ---');
// --------------------------------------------

const REAL_PHONE_UA =
    'Mozilla/5.0 (Linux; Android 13; SM-G990B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
const REAL_IPHONE_UA =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1';

check('an Android browser is a human', classifyUserAgent(REAL_PHONE_UA).isBot === false);
check('an iPhone browser is a human', classifyUserAgent(REAL_IPHONE_UA).isBot === false);

// This is the one that matters: WhatsApp hits the link at SEND time, for every
// recipient, to build the preview card. Counting those is how a campaign nobody
// opened reports a ~100% click rate.
const whatsappPreview = classifyUserAgent('WhatsApp/2.23.20.0 A');
check('the WhatsApp link preview fetch is a bot', whatsappPreview.isBot === true);
check('the WhatsApp preview is labelled as such', whatsappPreview.reason === 'whatsapp_preview');

check('facebookexternalhit is a bot', classifyUserAgent('facebookexternalhit/1.1').isBot === true);
check('a generic crawler is a bot', classifyUserAgent('Googlebot/2.1 (+http://www.google.com/bot.html)').isBot === true);
check('curl is a bot', classifyUserAgent('curl/8.4.0').isBot === true);
check('python-requests is a bot', classifyUserAgent('python-requests/2.31.0').isBot === true);
check('a headless browser is a bot', classifyUserAgent('HeadlessChrome/120.0.0.0').isBot === true);
check('an absent user agent is a bot', classifyUserAgent(null).isBot === true);
check('an empty user agent is a bot', classifyUserAgent('   ').isBot === true);
check('an absent user agent says why', classifyUserAgent(null).reason === 'no_user_agent');
check('a human click carries no bot reason', classifyUserAgent(REAL_PHONE_UA).reason === null);

// --------------------------------------------
console.log('\n--- IP hashing ---');
// --------------------------------------------

check('an IP is hashed, not stored', hashIp('49.37.128.14') !== '49.37.128.14');
check('hashing is stable', hashIp('49.37.128.14') === hashIp('49.37.128.14'));
check('different IPs hash differently', hashIp('49.37.128.14') !== hashIp('49.37.128.15'));
check('only the client IP of an X-Forwarded-For chain is used',
    hashIp('49.37.128.14, 10.0.0.1, 172.16.0.5') === hashIp('49.37.128.14'));
check('a missing IP hashes to null', hashIp(null) === null);
check('an empty IP hashes to null', hashIp('') === null);

// --------------------------------------------
console.log('\n--- the redirect cannot leave our origin ---');
// --------------------------------------------

const ORIGIN = 'https://www.oliviaalleppey.com';

check('a normal path is kept',
    buildDestination({ destinationPath: '/rooms/houseboat' }).startsWith(`${ORIGIN}/rooms/houseboat`));
check('a missing path falls back to the home page',
    buildDestination({ destinationPath: null }).startsWith(`${ORIGIN}/?`));
check('an empty path falls back to the home page',
    buildDestination({ destinationPath: '   ' }).startsWith(`${ORIGIN}/?`));

// The attacks. Each of these must land back on our own origin.
const HOSTILE = [
    'https://evil.example.com/phish',
    'http://evil.example.com',
    // Protocol-relative: a URL parser given this resolves to another HOST, which
    // is why the guard is "starts with exactly one slash" and not "has no scheme".
    '//evil.example.com/phish',
    '///evil.example.com',
    'javascript:alert(document.cookie)',
    'data:text/html,<script>alert(1)</script>',
    '\\\\evil.example.com',
    'https:evil.example.com',
];

for (const hostile of HOSTILE) {
    const result = buildDestination({ destinationPath: hostile });
    check(`"${hostile.slice(0, 32)}" cannot escape the origin`,
        new URL(result).origin === ORIGIN,
        `got ${result}`);
}

check('a path traversal stays on origin',
    new URL(buildDestination({ destinationPath: '/../../etc/passwd' })).origin === ORIGIN);

// --------------------------------------------
console.log('\n--- UTM is emitted for GA, and is not the mechanism ---');
// --------------------------------------------

const tagged = new URL(buildDestination({
    destinationPath: '/rooms/houseboat',
    utmCampaign: 'onam_2026',
    variantLabel: 'B',
}));

check('utm_source is whatsapp', tagged.searchParams.get('utm_source') === 'whatsapp');
check('utm_medium is broadcast', tagged.searchParams.get('utm_medium') === 'broadcast');
check('utm_campaign carries the campaign', tagged.searchParams.get('utm_campaign') === 'onam_2026');
check('utm_content carries the variant', tagged.searchParams.get('utm_content') === 'B');
check('the path itself is untouched', tagged.pathname === '/rooms/houseboat');
check('no token appears in the destination',
    !tagged.toString().includes('K7M2'),
    'the token identifies a person; it must not travel on to the landing page');

const untagged = new URL(buildDestination({ destinationPath: '/offers' }));
check('utm_campaign is omitted when there is none', !untagged.searchParams.has('utm_campaign'));
check('utm_content is omitted when there is no variant', !untagged.searchParams.has('utm_content'));

// --------------------------------------------
console.log('\n--- the dynamic URL button ---');
// --------------------------------------------

check('the registered button URL ends in the variable',
    clickButtonUrlTemplate() === `${ORIGIN}/w/{{1}}`);
check('a click link is the base plus the token',
    clickLink('K7M2Q9ZZ') === `${ORIGIN}/w/K7M2Q9ZZ`);

// Meta only allows a variable at the END of a button URL. If our own linter
// rejected the URL we build, campaigns could never be tracked at all.
const lintIssues = lintTemplate({
    name: 'olivia_onam_offer_v1',
    category: 'MARKETING',
    bodyText: 'Hello {{1}}, our Onam packages are open for booking. Tap below to see the rooms.',
    buttons: [
        { type: 'URL', text: 'See rooms', url: clickButtonUrlTemplate() },
    ],
});
check('our own linter accepts the tracked button URL',
    !lintIssues.some((issue) => issue.severity === 'error' && issue.field === 'buttons'),
    JSON.stringify(lintIssues.filter((i) => i.field === 'buttons')));

check('a template with no buttons has no dynamic button',
    dynamicUrlButtonIndex([]) === null);
check('null buttons are handled', dynamicUrlButtonIndex(null) === null);
check('a static URL button is not a dynamic one',
    dynamicUrlButtonIndex([{ type: 'URL', url: 'https://www.oliviaalleppey.com/rooms' }]) === null,
    'sending a parameter for a static button makes Meta reject the whole message');
check('a quick-reply button is not a URL button',
    dynamicUrlButtonIndex([{ type: 'QUICK_REPLY' }]) === null);
check('a dynamic button at position 0 is found',
    dynamicUrlButtonIndex([{ type: 'URL', url: clickButtonUrlTemplate() }]) === 0);

// The realistic marketing shape: the auto-added opt-out button comes first.
check('a dynamic button after an opt-out button reports index 1',
    dynamicUrlButtonIndex([
        { type: 'QUICK_REPLY' },
        { type: 'URL', url: clickButtonUrlTemplate() },
    ]) === 1,
    'assuming index 0 would put the token in the opt-out button');
check('whitespace inside the variable is tolerated',
    dynamicUrlButtonIndex([{ type: 'URL', url: 'https://x.test/w/{{ 1 }}' }]) === 0);

// --------------------------------------------
console.log('\n--- A/B bucketing ---');
// --------------------------------------------

const CAMPAIGN = '11111111-1111-4111-8111-111111111111';
const OTHER_CAMPAIGN = '22222222-2222-4222-8222-222222222222';
const contactIds = Array.from({ length: 4000 }, (_, i) =>
    `33333333-3333-4333-8333-${String(i).padStart(12, '0')}`);

const assignments = contactIds.map((id) => assignVariant(CAMPAIGN, id));

check('assignment is deterministic',
    contactIds.every((id, i) => assignVariant(CAMPAIGN, id) === assignments[i]),
    'a queue rebuild must not move people between arms');

const inA = assignments.filter((v) => v === 'A').length;
check('a 50/50 split is close to even', Math.abs(inA - 2000) < 120, `A = ${inA} of 4000`);

const skewed = contactIds.map((id) => assignVariant(CAMPAIGN, id, 20));
const skewedA = skewed.filter((v) => v === 'A').length;
check('a 20% split is honoured', Math.abs(skewedA - 800) < 100, `A = ${skewedA} of 4000`);

check('0% puts everyone in B', contactIds.slice(0, 100).every((id) => assignVariant(CAMPAIGN, id, 0) === 'B'));
check('100% puts everyone in A', contactIds.slice(0, 100).every((id) => assignVariant(CAMPAIGN, id, 100) === 'A'));

// If the campaign id were not in the hash, the same half of the list would
// receive variant A for ever and the test would slowly measure the people
// instead of the template.
const reassigned = contactIds.map((id) => assignVariant(OTHER_CAMPAIGN, id));
const moved = reassigned.filter((v, i) => v !== assignments[i]).length;
check('a different campaign reshuffles the arms', moved > 1500 && moved < 2500,
    `${moved} of 4000 contacts moved arm`);

// --------------------------------------------
console.log('\n--- significance is honest about small samples ---');
// --------------------------------------------

function stats(over: Partial<VariantStats>): VariantStats {
    return {
        label: 'A', campaignId: 'c', sent: 0, delivered: 0, read: 0, optedOut: 0,
        clicks: 0, bookings: 0, revenue: 0, readRate: 0, clickRate: 0, optOutRate: 0,
        ...over,
    };
}

// A genuinely large, genuinely different pair.
const bigA = stats({ label: 'A', delivered: 5000, read: 2500, bookings: 40 });
const bigB = stats({ label: 'B', delivered: 5000, read: 2900, bookings: 55 });
const bigResult = readRateSignificance(bigA, bigB);

check('a real difference at volume is significant', bigResult.significant === true);
check('the lift is reported in points', Math.abs(bigResult.liftPoints - 8) < 0.001,
    `got ${bigResult.liftPoints}`);
check('a large clear difference has a tiny p-value', bigResult.pValue < 0.001);
check('a large sample carries no caveat', bigResult.caveat === null);

// The hotel's actual situation: tiny numbers that look decisive and are not.
const tinyA = stats({ label: 'A', delivered: 9, read: 2, bookings: 1 });
const tinyB = stats({ label: 'B', delivered: 9, read: 7, bookings: 3 });
const tinyResult = readRateSignificance(tinyA, tinyB);

check('a tiny sample is never significant', tinyResult.significant === false,
    'this is the whole point: 7-of-9 vs 2-of-9 looks decisive and is not');
check('a tiny sample says why', tinyResult.caveat !== null);
check('the tiny-sample caveat mentions the sample',
    /sample too small/i.test(tinyResult.caveat ?? ''));

const identical = readRateSignificance(
    stats({ delivered: 1000, read: 500 }),
    stats({ delivered: 1000, read: 500 }),
);
check('identical arms are not significant', identical.significant === false);
check('identical arms report zero lift', identical.liftPoints === 0);

const empty = readRateSignificance(stats({ delivered: 0 }), stats({ delivered: 1000, read: 500 }));
check('an arm with no deliveries is not significant', empty.significant === false);
check('an empty arm says why', /no delivered/i.test(empty.caveat ?? ''));
check('an empty arm cannot produce NaN', Number.isFinite(empty.pValue) && Number.isFinite(empty.zScore));

// A moderate difference that is real but not yet provable.
const midA = stats({ delivered: 200, read: 100 });
const midB = stats({ delivered: 200, read: 112 });
const midResult = readRateSignificance(midA, midB);
check('a moderate difference at moderate volume is not yet significant',
    midResult.significant === false, `p = ${midResult.pValue}`);
check('a p-value is always a probability',
    [bigResult, tinyResult, midResult, identical, empty]
        .every((r) => r.pValue >= 0 && r.pValue <= 1));

// --------------------------------------------
console.log('\n--- the verdict text refuses to overclaim ---');
// --------------------------------------------

const bigText = describeOutcome(bigA, bigB, bigResult);
check('a real winner is named', /variant b wins/i.test(bigText), bigText);
check('the winning margin is quoted', bigText.includes('8.0 points'), bigText);

// The realistic case: plenty of reads to decide on, almost no bookings. The
// verdict must not let the booking counts read as part of the finding.
const thinBookingsA = stats({ label: 'A', delivered: 5000, read: 2500, bookings: 2 });
const thinBookingsB = stats({ label: 'B', delivered: 5000, read: 2900, bookings: 6 });
const thinText = describeOutcome(
    thinBookingsA, thinBookingsB, readRateSignificance(thinBookingsA, thinBookingsB));
check('bookings are flagged as directional when there are few of them',
    /directional only/i.test(thinText), thinText);
check('the thin booking counts are still shown', thinText.includes('2 vs 6'), thinText);

const tinyText = describeOutcome(tinyA, tinyB, tinyResult);
check('a tiny sample names no winner', !/wins/i.test(tinyText), tinyText);
check('a tiny sample says to keep running', /keep both arms running/i.test(tinyText), tinyText);

const midText = describeOutcome(midA, midB, midResult);
check('an inconclusive test says so', /no significant difference/i.test(midText), midText);

// Once bookings are plentiful the directional caveat drops away.
const plentifulA = stats({ label: 'A', delivered: 5000, read: 2500, bookings: 20 });
const plentifulB = stats({ label: 'B', delivered: 5000, read: 2900, bookings: 25 });
const plentifulText = describeOutcome(
    plentifulA, plentifulB, readRateSignificance(plentifulA, plentifulB));
check('the directional caveat drops once bookings are plentiful',
    !/directional only/i.test(plentifulText), plentifulText);

// --------------------------------------------
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
