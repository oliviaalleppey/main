import * as XLSX from 'xlsx';
import type { AnalyticsOverview } from './analytics';

/**
 * XLSX export of the analytics screen.
 *
 * Two things here are easy to get silently wrong, and both would produce a file
 * that looks perfectly plausible while being off by a factor of 100.
 *
 * **Money is stored in paise** (gotcha 6). Every amount is divided by 100 on the
 * way out and given a rupee format, so the sheet reads in the same units as the
 * screen. Exporting the raw integers would turn ₹412 into ₹41,200 with nothing
 * to hint at the error.
 *
 * **The percentages arrive on two different scales.** The funnel and template
 * rates are fractions (delivered/sent), while `proofPercent` and
 * `percentOfBudget` are already 0–100. They are normalised to fractions here and
 * written with a real Excel percent format, so every percentage in the workbook
 * means the same thing and stays a number the reader can chart or average —
 * rather than a string like "62%" that sorts alphabetically.
 */

/** Excel number formats. `z` is honoured by the community build; styling is not. */
const FMT_RUPEE = '₹#,##0.00';
const FMT_PERCENT = '0.0%';
const FMT_INT = '#,##0';

type Column<T> = {
    header: string;
    value: (row: T) => string | number | null;
    format?: string;
    width?: number;
};

/** paise -> rupees. */
function rupees(paise: number): number {
    return Math.round(paise) / 100;
}

/**
 * Build a sheet from typed columns, applying number formats per column.
 *
 * aoa_to_sheet writes the values; the formats have to be stamped onto the cells
 * afterwards, because there is no column-level format in the file format itself
 * — a "column format" in Excel is just the same format applied to every cell.
 */
function sheetFrom<T>(rows: T[], columns: Column<T>[]): XLSX.WorkSheet {
    const aoa: (string | number | null)[][] = [
        columns.map((c) => c.header),
        ...rows.map((row) => columns.map((c) => c.value(row))),
    ];
    const sheet = XLSX.utils.aoa_to_sheet(aoa);

    columns.forEach((column, columnIndex) => {
        if (!column.format) return;
        for (let rowIndex = 1; rowIndex <= rows.length; rowIndex++) {
            const address = XLSX.utils.encode_cell({ c: columnIndex, r: rowIndex });
            const cell = sheet[address] as XLSX.CellObject | undefined;
            if (cell && cell.t === 'n') cell.z = column.format;
        }
    });

    sheet['!cols'] = columns.map((c) => ({ wch: c.width ?? Math.max(12, c.header.length + 2) }));
    sheet['!freeze'] = { xSplit: 0, ySplit: 1 };
    return sheet;
}

/** A label/value/note sheet, for figures that are not a table. */
function summarySheet(rows: [string, string | number | null, string?][]): XLSX.WorkSheet {
    const aoa = [['Measure', 'Value', 'Note'], ...rows.map((r) => [r[0], r[1], r[2] ?? ''])];
    const sheet = XLSX.utils.aoa_to_sheet(aoa);
    sheet['!cols'] = [{ wch: 30 }, { wch: 16 }, { wch: 52 }];
    return sheet;
}

function formatDate(value: Date): string {
    return value.toISOString().slice(0, 10);
}

export function analyticsFilename(overview: AnalyticsOverview): string {
    return `olivia-whatsapp-analytics-${formatDate(overview.range.from)}-to-${formatDate(overview.range.to)}.xlsx`;
}

export function buildAnalyticsWorkbook(overview: AnalyticsOverview): Buffer {
    const { range, funnel, trends, cost, templates, hours, consent } = overview;
    const book = XLSX.utils.book_new();

    // --- Summary -----------------------------------------------------------
    const summary = summarySheet([
        ['Report range', `${formatDate(range.from)} to ${formatDate(range.to)}`],
        ['Generated', new Date().toISOString().slice(0, 16).replace('T', ' ')],
        ['', ''],
        ['Queued', funnel.queued],
        ['Sent', funnel.sent],
        ['Delivered', funnel.delivered],
        ['Read', funnel.read],
        ['Replied', funnel.replied],
        ['Failed', funnel.failed],
        ['Skipped', funnel.skipped, 'Blocked by the consent gate at send time, not an error'],
        ['Opted out', funnel.optedOut],
        ['Delivery rate', funnel.deliveryRate, 'delivered / sent'],
        ['Read rate', funnel.readRate, 'read / delivered'],
        ['Opt-out rate', funnel.optOutRate, 'opted out / delivered'],
        ['', ''],
        ['Total spend', rupees(cost.totalPaise)],
        ['  Marketing', rupees(cost.marketingPaise)],
        ['  Utility', rupees(cost.utilityPaise)],
        ['Cost per delivered', rupees(cost.costPerDeliveredPaise)],
        ['Cost per read', rupees(cost.costPerReadPaise)],
        ['Month to date', rupees(cost.monthToDatePaise)],
        ['Monthly budget', rupees(cost.budgetPaise)],
        ['Budget used', cost.percentOfBudget / 100, `State: ${cost.state}`],
        ['', ''],
        ['Contacts', consent.total],
        ['  Opted in', consent.optedIn],
        ['  Pending', consent.pending],
        ['  Opted out', consent.optedOut],
        ['  Suppressed', consent.suppressed],
        ['Consent proof', consent.proofPercent / 100,
            'Share of opted-in contacts with a recorded consent timestamp. Anything under 100% is a contact we could not defend if asked.'],
    ]);

    // Stamp formats on the summary's value column, which is mixed by nature.
    const moneyRows = ['Total spend', '  Marketing', '  Utility', 'Cost per delivered', 'Cost per read', 'Month to date', 'Monthly budget'];
    const percentRows = ['Delivery rate', 'Read rate', 'Opt-out rate', 'Budget used', 'Consent proof'];
    for (let r = 1; r <= 40; r++) {
        const label = (summary[XLSX.utils.encode_cell({ c: 0, r })] as XLSX.CellObject | undefined)?.v;
        const cell = summary[XLSX.utils.encode_cell({ c: 1, r })] as XLSX.CellObject | undefined;
        if (!cell || cell.t !== 'n' || typeof label !== 'string') continue;
        if (moneyRows.includes(label)) cell.z = FMT_RUPEE;
        else if (percentRows.includes(label)) cell.z = FMT_PERCENT;
        else cell.z = FMT_INT;
    }
    XLSX.utils.book_append_sheet(book, summary, 'Summary');

    // --- Daily -------------------------------------------------------------
    XLSX.utils.book_append_sheet(book, sheetFrom(trends, [
        { header: 'Day', value: (r) => r.day, width: 12 },
        { header: 'Sent', value: (r) => r.sent, format: FMT_INT },
        { header: 'Delivered', value: (r) => r.delivered, format: FMT_INT },
        { header: 'Read', value: (r) => r.read, format: FMT_INT },
        { header: 'Failed', value: (r) => r.failed, format: FMT_INT },
        { header: 'Cost', value: (r) => rupees(r.costPaise), format: FMT_RUPEE },
    ]), 'Daily');

    // --- Templates ---------------------------------------------------------
    XLSX.utils.book_append_sheet(book, sheetFrom(templates, [
        { header: 'Template', value: (r) => r.name, width: 34 },
        { header: 'Category', value: (r) => r.category, width: 14 },
        { header: 'Sent', value: (r) => r.sent, format: FMT_INT },
        { header: 'Delivered', value: (r) => r.delivered, format: FMT_INT },
        { header: 'Read', value: (r) => r.read, format: FMT_INT },
        { header: 'Failed', value: (r) => r.failed, format: FMT_INT },
        { header: 'Read rate', value: (r) => r.readRate, format: FMT_PERCENT },
        { header: 'Opt-outs', value: (r) => r.optOuts, format: FMT_INT },
        { header: 'Opt-out rate', value: (r) => r.optOutRate, format: FMT_PERCENT, width: 14 },
    ]), 'Templates');

    // --- By hour -----------------------------------------------------------
    XLSX.utils.book_append_sheet(book, sheetFrom(hours, [
        { header: 'Hour', value: (r) => `${String(r.hour).padStart(2, '0')}:00`, width: 10 },
        { header: 'Sent', value: (r) => r.sent, format: FMT_INT },
        { header: 'Read', value: (r) => r.read, format: FMT_INT },
        { header: 'Read rate', value: (r) => r.readRate, format: FMT_PERCENT },
    ]), 'By hour');

    // `type: 'buffer'` avoids the base64 round-trip; bookSST keeps strings shared.
    return XLSX.write(book, { bookType: 'xlsx', type: 'buffer' }) as Buffer;
}
