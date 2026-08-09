/**
 * Analytics XLSX export tests.
 *
 * Pure logic: the workbook is built from a fixture and then read back with the
 * same library, so every assertion is about what a reader of the file would
 * actually see. That round trip is the point — the two failure modes this export
 * has (paise printed as rupees, and percentages on two different scales) both
 * produce a file that opens perfectly and is silently wrong by 100x.
 *
 *   npx esbuild scripts/test-analytics-export.ts --bundle --platform=node \
 *     --format=cjs --alias:@=. --outfile=/tmp/tae.cjs && node /tmp/tae.cjs
 *
 * --format=cjs is required: xlsx is CJS and dynamically requires 'stream'.
 */

import * as XLSX from 'xlsx';
import { buildAnalyticsWorkbook, analyticsFilename } from '@/lib/services/whatsapp/analytics-export';
import type { AnalyticsOverview } from '@/lib/services/whatsapp/analytics';

let passed = 0;
let failed = 0;
function check(label: string, condition: boolean) {
    if (condition) { passed++; console.log(`  PASS  ${label}`); }
    else { failed++; console.log(`  FAIL  ${label}`); }
}

/**
 * Deliberately awkward numbers: amounts that are not round rupees, so a missing
 * /100 cannot coincidentally look right, and rates that are not 0 or 1.
 */
const FIXTURE: AnalyticsOverview = {
    range: { from: new Date('2026-07-01T00:00:00Z'), to: new Date('2026-07-31T00:00:00Z') },
    funnel: {
        queued: 1000, sent: 940, delivered: 900, read: 603, clicked: 117, replied: 51,
        failed: 40, skipped: 60, optedOut: 9,
        deliveryRate: 900 / 940, readRate: 603 / 900, clickRate: 117 / 900,
        optOutRate: 9 / 900,
    },
    trends: [
        { day: '2026-07-01', sent: 400, delivered: 380, read: 250, failed: 20, costPaise: 41234 },
        { day: '2026-07-02', sent: 540, delivered: 520, read: 353, failed: 20, costPaise: 55566 },
    ],
    cost: {
        totalPaise: 96800, marketingPaise: 71300, utilityPaise: 25500,
        costPerDeliveredPaise: 108, costPerReadPaise: 161,
        monthToDatePaise: 96800, budgetPaise: 500000, percentOfBudget: 19,
        state: 'ok',
    },
    templates: [
        {
            templateId: 't1', name: 'olivia_reengage_v1', category: 'MARKETING',
            sent: 500, delivered: 480, read: 300, failed: 20,
            readRate: 300 / 480, optOuts: 7, optOutRate: 7 / 480,
        },
    ],
    hours: [
        { hour: 9, sent: 200, read: 150, readRate: 0.75 },
        { hour: 21, sent: 200, read: 60, readRate: 0.3 },
    ],
    consent: {
        total: 1200, optedIn: 800, pending: 300, optedOut: 80, suppressed: 20,
        withProof: 760, proofPercent: 95,
    },
    // Awkward on purpose, like the costs above: 1234567 paise is ₹12,345.67, so a
    // missing /100 cannot coincidentally look plausible.
    attribution: {
        clickBookings: 7, clickRevenue: 1234567,
        phoneBookings: 3, phoneRevenue: 456789,
        confirmedBookings: 7, confirmedRevenue: 1234567,
        medianHoursToBook: 19,
    },
};

const buffer = buildAnalyticsWorkbook(FIXTURE);
const book = XLSX.read(buffer, { type: 'buffer', cellNF: true });

console.log('\n--- the workbook is well formed ---');
check('a non-empty buffer is produced', buffer.length > 0);
check('it is a real zip (xlsx magic bytes)', buffer[0] === 0x50 && buffer[1] === 0x4b);
check('all four sheets are present',
    ['Summary', 'Daily', 'Templates', 'By hour'].every((n) => book.SheetNames.includes(n)));
check('the filename carries the range',
    analyticsFilename(FIXTURE) === 'olivia-whatsapp-analytics-2026-07-01-to-2026-07-31.xlsx');

/** Read a Summary row by its label, returning the raw cell. */
function summaryCell(label: string): XLSX.CellObject | undefined {
    const sheet = book.Sheets['Summary'];
    const range = XLSX.utils.decode_range(sheet['!ref']!);
    for (let r = range.s.r; r <= range.e.r; r++) {
        const l = sheet[XLSX.utils.encode_cell({ c: 0, r })] as XLSX.CellObject | undefined;
        if (l?.v === label) return sheet[XLSX.utils.encode_cell({ c: 1, r })] as XLSX.CellObject | undefined;
    }
    return undefined;
}

console.log('\n--- money is in rupees, not paise ---');
// 96800 paise is ₹968.00. If the /100 were missing this would read 96,800.
check('total spend is converted to rupees', summaryCell('Total spend')?.v === 968);
check('marketing spend is converted', summaryCell('  Marketing')?.v === 713);
check('utility spend is converted', summaryCell('  Utility')?.v === 255);
check('a sub-rupee amount keeps its paise', summaryCell('Cost per delivered')?.v === 1.08);
check('cost per read keeps its paise', summaryCell('Cost per read')?.v === 1.61);
check('the budget is converted', summaryCell('Monthly budget')?.v === 5000);
check('money cells carry a rupee format', summaryCell('Total spend')?.z === '₹#,##0.00');
// These rows sit past where the format loop's old hard-coded bound stopped, so
// they also prove the bound now follows the sheet's real extent.
check('attributed revenue is converted to rupees', summaryCell('Attributed revenue')?.v === 12345.67);
check('assisted revenue is converted to rupees', summaryCell('Assisted revenue')?.v === 4567.89);
check('attributed revenue carries a rupee format', summaryCell('Attributed revenue')?.z === '₹#,##0.00');
check('a daily cost is converted', (book.Sheets['Daily']['F2'] as XLSX.CellObject).v === 412.34);

console.log('\n--- the two attribution tiers stay separable ---');
check('deterministic bookings are reported', summaryCell('Attributed bookings')?.v === 7);
check('assisted bookings are reported separately', summaryCell('Assisted bookings')?.v === 3);
check('the two tiers are never pre-summed into one cell',
    summaryCell('Attributed bookings')?.v !== 10 && summaryCell('Assisted bookings')?.v !== 10);
check('median hours to book survives', summaryCell('Median hours to book')?.v === 19);

console.log('\n--- percentages are stored on one scale ---');
// Everything must be a fraction, so Excel's percent format displays it correctly
// and the reader can average a column without first asking which scale it is on.
const deliveryRate = summaryCell('Delivery rate');
check('delivery rate is a fraction, not 0-100', (deliveryRate!.v as number) < 1);
check('delivery rate is numerically right',
    Math.abs((deliveryRate!.v as number) - 900 / 940) < 1e-9);
check('rates carry a percent format', deliveryRate?.z === '0.0%');
// proofPercent arrives as 95 and must not be written as 9500%.
check('consent proof is normalised from 0-100', summaryCell('Consent proof')?.v === 0.95);
check('budget used is normalised from 0-100', summaryCell('Budget used')?.v === 0.19);
check('every percentage in Summary is <= 1',
    ['Delivery rate', 'Read rate', 'Opt-out rate', 'Budget used', 'Consent proof']
        .every((l) => (summaryCell(l)!.v as number) <= 1));

console.log('\n--- percentages stay numbers, not strings ---');
check('a rate is a numeric cell', deliveryRate?.t === 'n');
check('a template read rate is numeric',
    (book.Sheets['Templates']['G2'] as XLSX.CellObject).t === 'n');
check('an hourly read rate is numeric',
    (book.Sheets['By hour']['D2'] as XLSX.CellObject).t === 'n');

console.log('\n--- the tables carry the right rows ---');
const daily = XLSX.utils.sheet_to_json<Record<string, unknown>>(book.Sheets['Daily']);
check('every day is a row', daily.length === FIXTURE.trends.length);
check('the day column survives', daily[0]['Day'] === '2026-07-01');
check('sent counts survive', daily[1]['Sent'] === 540);

const templates = XLSX.utils.sheet_to_json<Record<string, unknown>>(book.Sheets['Templates']);
check('the template name survives', templates[0]['Template'] === 'olivia_reengage_v1');
check('opt-outs survive', templates[0]['Opt-outs'] === 7);

const hours = XLSX.utils.sheet_to_json<Record<string, unknown>>(book.Sheets['By hour']);
check('the hour is zero-padded and readable', hours[0]['Hour'] === '09:00');
check('a late hour is not misread as a number', hours[1]['Hour'] === '21:00');

console.log('\n--- the export carries no personal data ---');
// It is gated on analytics.read, which frontdesk and viewer hold, so it must not
// become a way around the phone masking.
// String cells only. A numeric cell cannot hold a phone number — and testing
// their stringified form gives false positives, because a rate like
// 0.9574468085106383 carries more than ten consecutive digits.
const everyCell = book.SheetNames.flatMap((name) => {
    const sheet = book.Sheets[name];
    return Object.keys(sheet)
        .filter((k) => !k.startsWith('!'))
        .map((k) => sheet[k] as XLSX.CellObject)
        .filter((cell) => cell.t === 's')
        .map((cell) => String(cell.v ?? ''));
});
check('no cell contains anything shaped like a phone number',
    !everyCell.some((v) => /\+?\d{10,}/.test(v)));
check('no cell contains a bulleted (masked) number',
    !everyCell.some((v) => v.includes('•')));

console.log('\n--- empty data does not produce a broken file ---');
const empty = buildAnalyticsWorkbook({
    ...FIXTURE,
    trends: [], templates: [], hours: [],
    funnel: { ...FIXTURE.funnel, queued: 0, sent: 0, delivered: 0, read: 0, replied: 0, failed: 0, skipped: 0, optedOut: 0, deliveryRate: 0, readRate: 0, optOutRate: 0 },
});
const emptyBook = XLSX.read(empty, { type: 'buffer' });
check('an empty report still has all sheets',
    ['Summary', 'Daily', 'Templates', 'By hour'].every((n) => emptyBook.SheetNames.includes(n)));
check('an empty table still has its header row',
    (emptyBook.Sheets['Daily']['A1'] as XLSX.CellObject).v === 'Day');
check('an empty table has no data rows',
    XLSX.utils.sheet_to_json(emptyBook.Sheets['Daily']).length === 0);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
