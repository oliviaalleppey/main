/**
 * The six submission-ready template drafts.
 *
 *   npx esbuild scripts/test-template-drafts.ts --bundle --platform=node \
 *     --format=cjs --alias:@=. --outfile=/tmp/ttd.cjs && node /tmp/ttd.cjs
 *
 * Two classes of bug are caught here, and both would otherwise be found only
 * after Meta had already approved the template — which is the expensive moment,
 * because a fix means resubmission and another review cycle:
 *
 *  1. **Variable-count mismatch.** The UTILITY templates are fired by code that
 *     already passes a fixed number of parameters. A template expecting four
 *     when its caller sends five does not fail at approval; it fails per send,
 *     as a pile of failed rows nobody is watching.
 *  2. **An opt-out button consent.ts does not recognise.** A marketing template
 *     whose "No thanks" text is not in the list consent.ts matches would render
 *     a button that looks like an opt-out, is tapped like an opt-out, and does
 *     nothing. That is worse than having no button at all.
 */

import {
    TEMPLATE_DRAFTS, AUTOMATION_VARIABLE_CONTRACT, draftByName, type TemplateDraft,
} from '@/lib/services/whatsapp/template-drafts';
import {
    lintTemplate, isValidTemplateName, buildComponents, parseComponents,
    dynamicUrlButtonIndex, extractVariables, renderTemplateText,
} from '@/lib/services/whatsapp/template-lint';
import { isOptOutButton } from '@/lib/services/whatsapp/consent';
import { AUTOMATION_KEYS } from '@/lib/services/whatsapp/automations';
import { clickButtonUrlTemplate } from '@/lib/services/whatsapp/attribution';

let passed = 0;
let failed = 0;
function check(name: string, condition: boolean, detail?: string) {
    if (condition) { passed++; console.log(`  PASS  ${name}`); }
    else { failed++; console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ''}`); }
}

/**
 * A draft is a loose authoring shape; buildComponents wants a complete
 * ParsedTemplate. Filling the defaults in one place keeps the round-trip
 * assertions below testing the builder rather than testing this adapter.
 */
function asParsed(draft: TemplateDraft) {
    return {
        category: draft.category,
        bodyText: draft.bodyText,
        headerType: draft.headerType ?? ('none' as const),
        headerText: draft.headerText ?? '',
        footerText: draft.footerText ?? '',
        buttons: draft.buttons ?? [],
        variableCount: extractVariables(draft.bodyText).length,
        exampleValues: draft.exampleValues,
    };
}

// --------------------------------------------
console.log('\n--- every draft passes our own linter ---');
// --------------------------------------------

for (const draft of TEMPLATE_DRAFTS) {
    const issues = lintTemplate({
        name: draft.name,
        category: draft.category,
        bodyText: draft.bodyText,
        headerType: draft.headerType,
        headerText: draft.headerText,
        footerText: draft.footerText,
        buttons: draft.buttons,
        exampleValues: draft.exampleValues,
    });

    const errors = issues.filter((i) => i.severity === 'error');
    check(`${draft.name} lints with no errors`, errors.length === 0,
        errors.map((e) => `${e.field}: ${e.message}`).join('; '));

    // Warnings do not block submission, but an unexpected one is worth seeing.
    const warnings = issues.filter((i) => i.severity === 'warning');
    if (warnings.length) {
        for (const w of warnings) console.log(`        note (${draft.name}) ${w.field}: ${w.message}`);
    }

    check(`${draft.name} is a valid Meta template name`, isValidTemplateName(draft.name));
}

// --------------------------------------------
console.log('\n--- the variable contracts match the code that fires them ---');
// --------------------------------------------

for (const draft of TEMPLATE_DRAFTS) {
    const inBody = extractVariables(draft.bodyText);

    check(`${draft.name} documents every variable it uses`,
        inBody.length === draft.variables.length,
        `body has ${inBody.length} ({{${inBody.join('}}, {{')}}}), variables[] documents ${draft.variables.length}`);

    // Meta rejects a variable-bearing template that arrives without examples,
    // and one example short is the same rejection as none at all.
    check(`${draft.name} has an example for every variable`,
        draft.exampleValues.length === inBody.length,
        `${draft.exampleValues.length} examples for ${inBody.length} variables`);
    check(`${draft.name}'s examples look like real data`,
        draft.exampleValues.every((v) => v.trim().length > 0 && !/^sample/i.test(v)),
        'the reviewer reads these to judge the message');

    check(`${draft.name} numbers its variables from 1 with no gaps`,
        inBody.every((n, i) => n === i + 1),
        `got {{${inBody.join('}}, {{')}}}`);
}

// The contract that actually matters: what BookingService and the automations
// cron pass today.
for (const [key, expected] of Object.entries(AUTOMATION_VARIABLE_CONTRACT)) {
    const draft = TEMPLATE_DRAFTS.find((d) => d.automationKey === key);
    check(`the ${key} automation has a template`, draft !== undefined);
    if (!draft) continue;

    check(`${draft.name} takes exactly the ${expected} variables ${key} sends`,
        extractVariables(draft.bodyText).length === expected,
        `template takes ${extractVariables(draft.bodyText).length}, caller sends ${expected}`);
}

// Every automation key we wrote a template for must be a real one.
for (const draft of TEMPLATE_DRAFTS) {
    if (!draft.automationKey) continue;
    check(`${draft.automationKey} is a real automation key`,
        (AUTOMATION_KEYS as readonly string[]).includes(draft.automationKey));
}

// The three seeded-but-unwired automations deliberately have no template yet —
// stated as an assertion so that if one is wired up later, this fails and asks
// for the copy rather than shipping an automation that can never fire.
const UNWIRED = ['booking_cancelled', 'event_inquiry_ack', 'birthday_greeting'];
for (const key of UNWIRED) {
    check(`${key} is still unwired and has no draft (expected)`,
        TEMPLATE_DRAFTS.every((d) => d.automationKey !== key));
}

// --------------------------------------------
console.log('\n--- marketing templates can actually be opted out of ---');
// --------------------------------------------

const marketing = TEMPLATE_DRAFTS.filter((d) => d.category === 'MARKETING');
check('there are marketing templates to check', marketing.length === 2);

for (const draft of marketing) {
    const quickReplies = (draft.buttons ?? []).filter((b) => b.type === 'QUICK_REPLY');
    const recognised = quickReplies.filter((b) => isOptOutButton(b.text));

    check(`${draft.name} carries an opt-out button`, recognised.length >= 1,
        `quick replies: ${quickReplies.map((b) => b.text).join(', ') || 'none'}`);

    // The cross-file check. A button consent.ts does not recognise is a button
    // that looks like an opt-out and silently is not one.
    check(`${draft.name}'s opt-out text is one consent.ts recognises`,
        recognised.length >= 1,
        'consent.ts matches: stop promotions, no thanks, unsubscribe');
}

check('the re-permission ask offers a real refusal',
    (draftByName('olivia_reengage_v1')?.buttons ?? []).some((b) => isOptOutButton(b.text)),
    'a permission ask that buries the "no" produces consent that would not survive scrutiny');

// --------------------------------------------
console.log('\n--- utility templates stay utility ---');
// --------------------------------------------

const utility = TEMPLATE_DRAFTS.filter((d) => d.category === 'UTILITY');
check('there are four utility templates', utility.length === 4);

for (const draft of utility) {
    const issues = lintTemplate({
        name: draft.name, category: draft.category, bodyText: draft.bodyText,
        footerText: draft.footerText, buttons: draft.buttons,
        exampleValues: draft.exampleValues,
    });
    // Meta reclassifies aggressively, and a UTILITY template reclassified as
    // MARKETING costs ~6x and needs consent we do not have.
    check(`${draft.name} carries no marketing language`,
        !issues.some((i) => i.field === 'category'),
        issues.filter((i) => i.field === 'category').map((i) => i.message).join('; '));

    check(`${draft.name} has no tracked link`,
        !(draft.buttons ?? []).some((b) => b.type === 'URL'),
        'a link in a utility template is the fastest way to get it reclassified');
}

// --------------------------------------------
console.log('\n--- the offer template carries a working tracked link ---');
// --------------------------------------------

const offer = draftByName('olivia_offer_v1')!;
check('the offer template exists', offer !== undefined);

const urlButtons = (offer.buttons ?? []).filter((b) => b.type === 'URL');
check('it has exactly one URL button', urlButtons.length === 1);
check('the URL is our click endpoint with the variable at the end',
    urlButtons[0] && 'url' in urlButtons[0] && urlButtons[0].url === clickButtonUrlTemplate(),
    'url' in (urlButtons[0] ?? {}) ? (urlButtons[0] as { url: string }).url : 'none');

// The index matters: the dispatcher sends the token as a parameter for this
// exact position, and getting it wrong makes Meta reject the whole message.
const reparsedOffer = parseComponents(buildComponents(asParsed(offer)));
const buttonIndex = dynamicUrlButtonIndex(reparsedOffer.buttons);

check('the tracked button survives the build/parse round trip', buttonIndex !== null);
check('the opt-out button comes first, so the tracked one is index 1',
    buttonIndex === 1, `dynamicUrlButtonIndex returned ${buttonIndex}`);
check('the auto-added opt-out is not duplicated',
    reparsedOffer.buttons.filter((b) => b.type === 'QUICK_REPLY').length === 1,
    `found ${reparsedOffer.buttons.filter((b) => b.type === 'QUICK_REPLY').length} quick replies`);

// Only the offer template is tracked; nothing else should mint tokens.
for (const draft of TEMPLATE_DRAFTS) {
    if (draft.name === 'olivia_offer_v1') continue;
    const parsed = parseComponents(buildComponents(asParsed(draft)));
    check(`${draft.name} does not mint click tokens`,
        dynamicUrlButtonIndex(parsed.buttons) === null);
}

// --------------------------------------------
console.log('\n--- the copy renders as intended ---');
// --------------------------------------------

const confirm = draftByName('olivia_booking_confirm_v1')!;
const rendered = renderTemplateText(confirm.bodyText, {
    '1': 'Anita Menon', '2': 'OL-2026-0412', '3': '12 Dec 2026', '4': '15 Dec 2026', '5': 'Premium Houseboat',
});

check('every placeholder is filled', !/\{\{\d+\}\}/.test(rendered), rendered);
check('the guest name appears', rendered.includes('Anita Menon'));
check('the booking reference appears', rendered.includes('OL-2026-0412'));
check('the room type appears', rendered.includes('Premium Houseboat'));
check('it invites a reply, which opens the 24-hour service window',
    /reply to this message/i.test(rendered));

const reengageRendered = renderTemplateText(draftByName('olivia_reengage_v1')!.bodyText, { '1': 'Anita' });
check('the permission ask names the guest', reengageRendered.startsWith('Hello Anita,'));
check('the permission ask actually asks', /may we\?/i.test(reengageRendered));
check('the permission ask promises silence on refusal',
    /only message you if you say yes/i.test(reengageRendered));
check('the permission ask makes no offer',
    !/\b(discount|% off|deal|sale|save)\b/i.test(reengageRendered),
    'attaching a sell to a permission ask is what gets it reported as spam');

// --------------------------------------------
console.log('\n--- nothing exceeds Meta\'s limits ---');
// --------------------------------------------

for (const draft of TEMPLATE_DRAFTS) {
    check(`${draft.name} body is within 1024 characters`,
        draft.bodyText.length <= 1024, `${draft.bodyText.length} chars`);
    if (draft.footerText) {
        check(`${draft.name} footer is within 60 characters`,
            draft.footerText.length <= 60, `${draft.footerText.length} chars`);
    }
    check(`${draft.name} has at most 10 buttons`, (draft.buttons ?? []).length <= 10);
    check(`${draft.name} explains why it is worded as it is`,
        draft.rationale.length > 40);
}

// --------------------------------------------
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
