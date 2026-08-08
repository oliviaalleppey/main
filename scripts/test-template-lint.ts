/**
 * Tests for the template linter and Meta component builder.
 *
 * The linter's whole job is to catch the causes of Meta rejections before
 * submission — a rejection is slow (hours to days) and counts against the
 * account's reputation, so a rule that silently stops working is expensive.
 *
 * Run:
 *   npx esbuild scripts/test-template-lint.ts --bundle --platform=node \
 *     --format=cjs --alias:@=. --outfile=/tmp/t.cjs && node /tmp/t.cjs
 *
 * --format=cjs is required, not esm: see gotcha 5 in WHATSAPP-ADMIN-PLAN.md.
 */

import {
    lintTemplate, hasBlockingIssues, slugifyTemplateName, isValidTemplateName,
    extractVariables, parseComponents, buildComponents, renderTemplateText,
    type TemplateButton,
} from '@/lib/services/whatsapp/template-lint';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
    if (condition) { passed++; console.log(`  PASS  ${name}`); }
    else { failed++; console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ''}`); }
}

function errorsFor(input: Parameters<typeof lintTemplate>[0]) {
    return lintTemplate(input).filter((i) => i.severity === 'error').map((i) => i.message);
}

const base = {
    name: 'olivia_offer_v1',
    category: 'MARKETING',
    bodyText: 'Hello {{1}}, enjoy a special rate at Olivia Alleppey this season.',
    exampleValues: ['Anjali'],
};

/** A typed view of Meta's component array, so the assertions below need no `any`. */
type BuiltComponent = {
    type?: string;
    format?: string;
    text?: string;
    buttons?: { type?: string; text?: string; url?: string }[];
    example?: { body_text?: string[][]; header_text?: string[] };
};

function componentOfType(components: unknown[], type: string): BuiltComponent | undefined {
    return (components as BuiltComponent[]).find((c) => c.type === type);
}

console.log('\n--- names ---');
check('slugify spaces/caps', slugifyTemplateName('Onam Offer 2026!') === 'onam_offer_2026');
check('slugify strips edge underscores', slugifyTemplateName('  --Hello--  ') === 'hello');
check('valid name accepted', isValidTemplateName('olivia_offer_v1'));
check('uppercase rejected', !isValidTemplateName('Olivia_Offer'));
check('hyphen rejected', !isValidTemplateName('olivia-offer'));
check('empty rejected', !isValidTemplateName(''));

console.log('\n--- variable extraction ---');
check('extracts in order', extractVariables('a {{2}} b {{1}}').join(',') === '1,2');
check('dedupes', extractVariables('{{1}} and {{1}}').join(',') === '1');
check('tolerates inner spaces', extractVariables('{{ 3 }}').join(',') === '3');
check('none found', extractVariables('no variables here').length === 0);

console.log('\n--- linter: the rejection causes it exists to catch ---');
check('clean template passes', !hasBlockingIssues(lintTemplate(base)));

check(
    'body starting with a variable is an error',
    errorsFor({ ...base, bodyText: '{{1}}, welcome back to Olivia.' }).some((m) => m.includes('starts with a variable')),
);
check(
    'body ending with a variable is an error',
    errorsFor({ ...base, bodyText: 'Your booking code is {{1}}' }).some((m) => m.includes('ends with a variable')),
);
check(
    'consecutive variables is an error',
    errorsFor({ ...base, bodyText: 'Hi {{1}} {{2}} welcome to Olivia.', exampleValues: ['A', 'B'] })
        .some((m) => m.includes('next to each other')),
);
check(
    'gapped variable numbering is an error',
    errorsFor({ ...base, bodyText: 'Hello {{1}}, your code {{3}} is ready now.', exampleValues: ['A', 'B'] })
        .some((m) => m.includes('no gaps')),
);
check(
    'missing example values is an error',
    errorsFor({ ...base, exampleValues: [] }).some((m) => m.includes('example value')),
);
check(
    'url shortener is an error',
    errorsFor({ ...base, bodyText: 'Hello {{1}}, book now at bit.ly/olivia today.' })
        .some((m) => m.includes('shortener')),
);
check(
    'empty body is an error',
    errorsFor({ ...base, bodyText: '   ' }).some((m) => m.includes('required')),
);
check(
    'emoji-only body is an error',
    errorsFor({ ...base, bodyText: '🎉🎉🎉 {{1}} 🎉🎉🎉' }).some((m) => m.includes('no readable text')),
);
check(
    'over-long body is an error',
    errorsFor({ ...base, bodyText: `Hello {{1}}, ${'x'.repeat(1100)}` }).some((m) => m.includes('limit is 1024')),
);
check(
    'bad name is an error',
    errorsFor({ ...base, name: 'Olivia Offer' }).some((m) => m.includes('lower_snake_case')),
);
check(
    'URL button without a scheme is an error',
    errorsFor({ ...base, buttons: [{ type: 'URL', text: 'Book', url: 'oliviaalleppey.com' }] as TemplateButton[] })
        .some((m) => m.includes('full URL')),
);

console.log('\n--- linter: warnings must NOT block ---');
const shouty = lintTemplate({ ...base, bodyText: 'HELLO {{1}}, BIGGEST SALE EVER AT OLIVIA ALLEPPEY RESORT.' });
check('all-caps warns', shouty.some((i) => i.severity === 'warning' && i.message.includes('capitals')));
check('all-caps does not block', !hasBlockingIssues(shouty));

const marketingNoOptOut = lintTemplate({ ...base, buttons: [] });
check(
    'missing opt-out warns but does not block',
    marketingNoOptOut.some((i) => i.severity === 'warning' && i.message.includes('opt-out')) &&
    !hasBlockingIssues(marketingNoOptOut),
);

const utilityPromo = lintTemplate({
    ...base,
    category: 'UTILITY',
    bodyText: 'Hello {{1}}, enjoy 20% off your next booking with us.',
});
check(
    'marketing copy in a UTILITY template warns',
    utilityPromo.some((i) => i.severity === 'warning' && i.field === 'category'),
);
check('…and does not block', !hasBlockingIssues(utilityPromo));

console.log('\n--- the marketing opt-out button is not removable ---');
const marketingComponents = buildComponents({
    bodyText: 'Hello {{1}}, a special rate awaits you.',
    headerType: 'none', headerText: '', footerText: '',
    buttons: [], variableCount: 1, category: 'MARKETING', exampleValues: ['Anjali'],
});
const marketingButtons = componentOfType(marketingComponents, 'BUTTONS')?.buttons ?? [];
check('opt-out auto-added for MARKETING', marketingButtons.some((b) => b.text === 'Stop promotions'));

const utilityComponents = buildComponents({
    bodyText: 'Hello {{1}}, your booking is confirmed.',
    headerType: 'none', headerText: '', footerText: '',
    buttons: [], variableCount: 1, category: 'UTILITY', exampleValues: ['Anjali'],
});
check(
    'opt-out NOT added for UTILITY',
    componentOfType(utilityComponents, 'BUTTONS') === undefined,
);

const alreadyOptedOut = buildComponents({
    bodyText: 'Hello {{1}}, a special rate awaits you.',
    headerType: 'none', headerText: '', footerText: '',
    buttons: [{ type: 'QUICK_REPLY', text: 'No thanks' }], variableCount: 1,
    category: 'MARKETING', exampleValues: ['Anjali'],
});
const dedupedButtons = componentOfType(alreadyOptedOut, 'BUTTONS')?.buttons ?? [];
check('existing opt-out is not duplicated', dedupedButtons.length === 1, JSON.stringify(dedupedButtons));

console.log('\n--- example arrays Meta requires ---');
const withExamples = buildComponents({
    bodyText: 'Hello {{1}}, your {{2}} is ready.',
    headerType: 'none', headerText: '', footerText: '',
    buttons: [], variableCount: 2, category: 'UTILITY', exampleValues: ['Anjali', 'room'],
});
const bodyComponent = componentOfType(withExamples, 'BODY');
check('body example is a nested array', Array.isArray(bodyComponent?.example?.body_text?.[0]));
check('example length matches variable count', bodyComponent?.example?.body_text?.[0].length === 2);

const noVars = buildComponents({
    bodyText: 'Your booking is confirmed.',
    headerType: 'none', headerText: '', footerText: '',
    buttons: [], variableCount: 0, category: 'UTILITY', exampleValues: [],
});
check('no example key when there are no variables', componentOfType(noVars, 'BODY')?.example === undefined);

console.log('\n--- parse/build round-trip (claimed lossless in the file comment) ---');
const original = [
    { type: 'HEADER', format: 'TEXT', text: 'Olivia Alleppey' },
    { type: 'BODY', text: 'Hello {{1}}, enjoy your stay with us.' },
    { type: 'FOOTER', text: 'Reply STOP to opt out' },
    { type: 'BUTTONS', buttons: [{ type: 'QUICK_REPLY', text: 'Stop promotions' }] },
];
const roundTripped = buildComponents({ ...parseComponents(original), category: 'MARKETING', exampleValues: ['Anjali'] });
const reparsed = parseComponents(roundTripped);
const first = parseComponents(original);
check('body survives', reparsed.bodyText === first.bodyText);
check('header survives', reparsed.headerText === first.headerText && reparsed.headerType === first.headerType);
check('footer survives', reparsed.footerText === first.footerText);
check('buttons survive', JSON.stringify(reparsed.buttons) === JSON.stringify(first.buttons),
    `${JSON.stringify(first.buttons)} vs ${JSON.stringify(reparsed.buttons)}`);
check('variable count survives', reparsed.variableCount === first.variableCount);

console.log('\n--- parsing the mock provider’s seeded templates ---');
const rejectedSeed = parseComponents([{ type: 'BODY', text: 'BIGGEST SALE EVER!!! CLICK bit.ly/xyz NOW' }]);
const seedIssues = lintTemplate({
    name: 'olivia_flash_sale_v1', category: 'MARKETING',
    bodyText: rejectedSeed.bodyText, exampleValues: [],
});
check(
    'the mock’s deliberately-rejected template is caught by our linter',
    hasBlockingIssues(seedIssues),
    JSON.stringify(seedIssues),
);

console.log('\n--- preview rendering ---');
check('fills values', renderTemplateText('Hi {{1}}', { '1': 'Anjali' }) === 'Hi Anjali');
check('falls back when unmapped', renderTemplateText('Hi {{1}}', {}, 'Guest') === 'Hi Guest');
check('never leaves a raw placeholder', !renderTemplateText('Hi {{1}} and {{2}}', { '1': 'A' }).includes('{{'));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
