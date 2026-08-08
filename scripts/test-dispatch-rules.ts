/**
 * Tests for the dispatcher's decision rules.
 *
 * These are the pure parts of the send path: which template may reach a pending
 * contact, and what the dispatcher does with each Meta error code. Both are
 * places where a quiet mistake is expensive — the first is a consent bypass, the
 * second decides whether we keep hammering a locked account.
 *
 * The claim/send loop itself needs a database and is not covered here.
 *
 * Run:
 *   npx esbuild scripts/test-dispatch-rules.ts --bundle --platform=node \
 *     --format=cjs --alias:@=. --outfile=/tmp/t.cjs && node /tmp/t.cjs
 */

import { isRePermissionTemplate, RE_PERMISSION_TEMPLATES } from '@/lib/services/whatsapp/template-lint';
import { classifyError, META_ERROR_CODES, WhatsAppError } from '@/lib/services/whatsapp/types';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
    if (condition) { passed++; console.log(`  PASS  ${name}`); }
    else { failed++; console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ''}`); }
}

console.log('\n--- re-permission is a property of the TEMPLATE, not the contact ---');
check('the configured re-permission template is recognised', isRePermissionTemplate('olivia_reengage_v1'));
check('case and whitespace tolerated', isRePermissionTemplate('  Olivia_Reengage_V1  '));
check('a marketing offer template is NOT re-permission', !isRePermissionTemplate('olivia_offer_v1'));
check('a utility template is NOT re-permission', !isRePermissionTemplate('olivia_booking_confirm_v1'));
check('null is not re-permission', !isRePermissionTemplate(null));
check('empty string is not re-permission', !isRePermissionTemplate(''));
check('an unknown template is not re-permission', !isRePermissionTemplate('some_new_promo'));
check('the default list is non-empty', RE_PERMISSION_TEMPLATES.length > 0);

console.log('\n--- error taxonomy: every code maps to a defined class ---');
const VALID_CLASSES = ['retryable', 'skip', 'permanent', 'config', 'halt'];
let taxonomyOk = true;
for (const [code, spec] of Object.entries(META_ERROR_CODES)) {
    if (!VALID_CLASSES.includes(spec.class)) {
        taxonomyOk = false;
        console.log(`        code ${code} has invalid class "${spec.class}"`);
    }
    if (!spec.message?.trim()) {
        taxonomyOk = false;
        console.log(`        code ${code} has no message`);
    }
}
check(`all ${Object.keys(META_ERROR_CODES).length} mapped codes are well-formed`, taxonomyOk);

console.log('\n--- the classifications the dispatcher acts on ---');
// Per-recipient problems must be SKIP: the guest did nothing wrong, so these must
// not be retried and must not count as quality failures.
for (const code of [131026, 131047, 131049, 130472]) {
    check(`${code} -> skip`, classifyError(code).class === 'skip', `got ${classifyError(code).class}`);
}
// Rate limits must be RETRYABLE, never failures.
for (const code of [4, 613, 80007, 130429, 131056]) {
    check(`${code} -> retryable`, classifyError(code).class === 'retryable', `got ${classifyError(code).class}`);
}
// Account-level problems must stop everything.
for (const code of [190, 133010, 133005]) {
    check(`${code} -> config`, classifyError(code).class === 'config', `got ${classifyError(code).class}`);
}
for (const code of [368, 131031, 131048, 132015, 132016]) {
    check(`${code} -> halt`, classifyError(code).class === 'halt', `got ${classifyError(code).class}`);
}

console.log('\n--- HTTP fallbacks for unmapped codes ---');
check('429 -> retryable', classifyError(undefined, 429).class === 'retryable');
check('500 -> retryable', classifyError(undefined, 500).class === 'retryable');
check('503 -> retryable', classifyError(undefined, 503).class === 'retryable');
check('401 -> config', classifyError(undefined, 401).class === 'config');
check('403 -> config', classifyError(undefined, 403).class === 'config');
check('unknown -> permanent (fails closed, no infinite retry)', classifyError(undefined, undefined).class === 'permanent');
check('an unmapped 4xx code -> permanent', classifyError(999999, 400).class === 'permanent');

console.log('\n--- shouldHalt covers both stop-everything classes ---');
for (const [errorClass, expected] of [
    ['halt', true], ['config', true], ['retryable', false], ['skip', false], ['permanent', false],
] as const) {
    const error = new WhatsAppError({ code: 1, message: 'x', errorClass });
    check(`${errorClass}.shouldHalt === ${expected}`, error.shouldHalt === expected);
}

console.log('\n--- isRetryable is exactly the retryable class ---');
check('retryable', new WhatsAppError({ code: 1, message: 'x', errorClass: 'retryable' }).isRetryable);
check('skip is not retryable', !new WhatsAppError({ code: 1, message: 'x', errorClass: 'skip' }).isRetryable);
check('halt is not retryable', !new WhatsAppError({ code: 1, message: 'x', errorClass: 'halt' }).isRetryable);

console.log('\n--- backoff schedule is bounded and increasing ---');
// Mirrors backoffUntil() in dispatcher.ts: min(60, max(1, attempts^2)) minutes.
const backoffMinutes = (attempts: number) => Math.min(60, Math.max(1, attempts * attempts));
check('attempt 1 -> 1 min', backoffMinutes(1) === 1);
check('attempt 2 -> 4 min', backoffMinutes(2) === 4);
check('attempt 3 -> 9 min', backoffMinutes(3) === 9);
check('capped at 60 min', backoffMinutes(100) === 60);
check('monotonically increasing to the cap', [1, 2, 3, 4, 5].every((n) => backoffMinutes(n) <= backoffMinutes(n + 1)));
check('never zero or negative', [0, 1, 50].every((n) => backoffMinutes(n) >= 1));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
