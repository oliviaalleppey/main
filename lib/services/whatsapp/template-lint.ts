/**
 * Pure template helpers: name rules, component parsing, the linter and preview
 * rendering.
 *
 * Split out from templates.ts precisely because this file imports nothing —
 * no db, no provider. That lets the "request a template" form run the exact
 * same linter in the browser, live as the user types, instead of a
 * near-enough copy that drifts from the server's rules.
 */

// --------------------------------------------
// The re-permission template
// --------------------------------------------

/**
 * The templates that may lawfully be sent to a `pending` contact.
 *
 * This is a property of the TEMPLATE, never of the contact. Deriving it from the
 * contact ("this person is pending, so this must be the re-permission ask") is a
 * consent bypass: it would let any marketing template through to exactly the
 * people who never opted in.
 *
 * Configurable because the hotel may submit it under a different name, but it
 * defaults to the name in the plan's §8 template list.
 */
export const RE_PERMISSION_TEMPLATES = (
    process.env.WHATSAPP_REPERMISSION_TEMPLATES || 'olivia_reengage_v1'
)
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);

/**
 * Which button carries the click token, by position among the template's buttons.
 *
 * Meta indexes button parameters by their position in the registered template,
 * so this is read off the buttons rather than assumed to be 0 — every marketing
 * template gets an auto-added opt-out button, which is very often button 0.
 *
 * Returns null when there is no dynamic URL button, and the dispatcher then
 * sends no button component at all. Sending a parameter for a button that is
 * static is not harmlessly ignored: Meta rejects the whole message.
 *
 * It lives in this file rather than with the rest of attribution because this
 * file imports nothing, so the campaign wizard can call it in the browser to
 * decide whether to offer the link-destination fields. attribution.ts imports
 * the database, and pulling that into a client bundle is not an option.
 */
export function dynamicUrlButtonIndex(
    buttons: { type?: string; url?: string }[] | null | undefined,
): number | null {
    if (!buttons?.length) return null;
    const index = buttons.findIndex(
        (button) => button?.type === 'URL' && /\{\{\s*1\s*\}\}/.test(button.url ?? ''),
    );
    return index === -1 ? null : index;
}

export function isRePermissionTemplate(templateName: string | null | undefined): boolean {
    if (!templateName) return false;
    return RE_PERMISSION_TEMPLATES.includes(templateName.trim().toLowerCase());
}

// --------------------------------------------
// Names
// --------------------------------------------

/** Meta requires lower_snake_case, max 512 chars, letters/digits/underscore only. */
export function slugifyTemplateName(input: string): string {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 512);
}

export function isValidTemplateName(name: string): boolean {
    return /^[a-z0-9_]{1,512}$/.test(name);
}

// --------------------------------------------
// Component parsing
// --------------------------------------------

export type TemplateButton =
    | { type: 'QUICK_REPLY'; text: string }
    | { type: 'URL'; text: string; url: string }
    | { type: 'PHONE_NUMBER'; text: string; phone_number: string };

export type ParsedTemplate = {
    bodyText: string;
    headerType: 'none' | 'text' | 'image' | 'document' | 'video';
    headerText: string;
    footerText: string;
    buttons: TemplateButton[];
    variableCount: number;
};

/** Every distinct {{n}} in a string, in ascending numeric order. */
export function extractVariables(text: string): number[] {
    const found = new Set<number>();
    for (const match of text.matchAll(/\{\{\s*(\d+)\s*\}\}/g)) {
        found.add(Number(match[1]));
    }
    return [...found].sort((a, b) => a - b);
}

type RawComponent = {
    type?: string;
    format?: string;
    text?: string;
    buttons?: { type?: string; text?: string; url?: string; phone_number?: string }[];
};

/** Meta's component array -> flat fields for the form and the preview. */
export function parseComponents(components: unknown[] | null | undefined): ParsedTemplate {
    const parsed: ParsedTemplate = {
        bodyText: '',
        headerType: 'none',
        headerText: '',
        footerText: '',
        buttons: [],
        variableCount: 0,
    };

    for (const raw of (components ?? []) as RawComponent[]) {
        const type = String(raw?.type ?? '').toUpperCase();

        if (type === 'BODY') {
            parsed.bodyText = raw.text ?? '';
        } else if (type === 'HEADER') {
            const format = String(raw.format ?? 'TEXT').toLowerCase();
            parsed.headerType = (['text', 'image', 'document', 'video'].includes(format)
                ? format
                : 'text') as ParsedTemplate['headerType'];
            parsed.headerText = raw.text ?? '';
        } else if (type === 'FOOTER') {
            parsed.footerText = raw.text ?? '';
        } else if (type === 'BUTTONS') {
            for (const button of raw.buttons ?? []) {
                const buttonType = String(button?.type ?? '').toUpperCase();
                if (buttonType === 'URL') {
                    parsed.buttons.push({ type: 'URL', text: button.text ?? '', url: button.url ?? '' });
                } else if (buttonType === 'PHONE_NUMBER') {
                    parsed.buttons.push({
                        type: 'PHONE_NUMBER',
                        text: button.text ?? '',
                        phone_number: button.phone_number ?? '',
                    });
                } else {
                    parsed.buttons.push({ type: 'QUICK_REPLY', text: button.text ?? '' });
                }
            }
        }
    }

    // Header and body share one variable namespace in our model; the count that
    // matters downstream is how many distinct placeholders must be supplied.
    parsed.variableCount = extractVariables(`${parsed.headerText} ${parsed.bodyText}`).length;

    return parsed;
}

/** The opt-out button every marketing template must carry. */
export const OPT_OUT_BUTTON: TemplateButton = { type: 'QUICK_REPLY', text: 'Stop promotions' };

function hasOptOutButton(buttons: TemplateButton[]): boolean {
    return buttons.some(
        (b) => b.type === 'QUICK_REPLY' && ['stop promotions', 'no thanks', 'unsubscribe'].includes(b.text.trim().toLowerCase()),
    );
}

/**
 * Flat fields -> Meta's component array.
 *
 * For MARKETING the opt-out quick reply is appended here rather than in the form,
 * so it cannot be removed by editing the payload. consent.ts recognises exactly
 * these button texts when an inbound reply arrives, so the two must stay in step.
 */
export function buildComponents(
    input: ParsedTemplate & { category: string; exampleValues?: string[] },
): unknown[] {
    const components: unknown[] = [];

    if (input.headerType !== 'none') {
        if (input.headerType === 'text' && input.headerText.trim()) {
            const header: Record<string, unknown> = { type: 'HEADER', format: 'TEXT', text: input.headerText };
            const headerVars = extractVariables(input.headerText);
            if (headerVars.length) {
                header.example = { header_text: headerVars.map((_, i) => input.exampleValues?.[i] || 'Sample') };
            }
            components.push(header);
        } else if (input.headerType !== 'text') {
            components.push({ type: 'HEADER', format: input.headerType.toUpperCase() });
        }
    }

    const body: Record<string, unknown> = { type: 'BODY', text: input.bodyText };
    const bodyVars = extractVariables(input.bodyText);
    if (bodyVars.length) {
        // Meta rejects a variable-bearing template with no example values, and the
        // example array must be as long as the variable list.
        body.example = {
            body_text: [bodyVars.map((n, i) => input.exampleValues?.[i] || `Sample ${n}`)],
        };
    }
    components.push(body);

    if (input.footerText.trim()) {
        components.push({ type: 'FOOTER', text: input.footerText });
    }

    const buttons = [...input.buttons];
    if (input.category === 'MARKETING' && !hasOptOutButton(buttons)) {
        buttons.push(OPT_OUT_BUTTON);
    }
    if (buttons.length) {
        components.push({ type: 'BUTTONS', buttons });
    }

    return components;
}

// --------------------------------------------
// The linter
// --------------------------------------------

export type LintIssue = {
    severity: 'error' | 'warning';
    field: 'name' | 'body' | 'header' | 'footer' | 'buttons' | 'category';
    message: string;
};

const URL_SHORTENERS = [
    'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly', 'is.gd', 'buff.ly',
    'rebrand.ly', 'cutt.ly', 'shorturl.at', 'rb.gy', 'tiny.cc',
];

const BODY_LIMIT = 1024;
const HEADER_LIMIT = 60;
const FOOTER_LIMIT = 60;

/**
 * Pre-submit checks for the causes of most Meta rejections.
 *
 * Errors block submission; warnings do not. The split matters — an over-strict
 * linter that blocks a legitimate template just teaches people to work around it.
 */
export function lintTemplate(input: {
    name: string;
    category: string;
    bodyText: string;
    headerType?: string;
    headerText?: string;
    footerText?: string;
    buttons?: TemplateButton[];
    exampleValues?: string[];
}): LintIssue[] {
    const issues: LintIssue[] = [];
    const body = input.bodyText ?? '';
    const trimmedBody = body.trim();

    if (!isValidTemplateName(input.name)) {
        issues.push({
            severity: 'error',
            field: 'name',
            message: 'Name must be lower_snake_case — letters, digits and underscores only.',
        });
    }

    if (!trimmedBody) {
        issues.push({ severity: 'error', field: 'body', message: 'Body text is required.' });
        return issues; // Everything below assumes a body.
    }

    if (body.length > BODY_LIMIT) {
        issues.push({
            severity: 'error',
            field: 'body',
            message: `Body is ${body.length} characters; the limit is ${BODY_LIMIT}.`,
        });
    }

    const variables = extractVariables(body);

    // Meta rejects a body that opens or closes on a variable — it cannot tell
    // what the message says without knowing the value.
    if (/^\s*\{\{\s*\d+\s*\}\}/.test(body)) {
        issues.push({
            severity: 'error',
            field: 'body',
            message: 'Body starts with a variable. Add text before it, e.g. "Hello {{1}}".',
        });
    }
    if (/\{\{\s*\d+\s*\}\}\s*$/.test(body)) {
        issues.push({
            severity: 'error',
            field: 'body',
            message: 'Body ends with a variable. Add text after it, or move it earlier.',
        });
    }
    if (/\{\{\s*\d+\s*\}\}[\s,.:;-]*\{\{\s*\d+\s*\}\}/.test(body)) {
        issues.push({
            severity: 'error',
            field: 'body',
            message: 'Two variables sit next to each other. Put wording between them.',
        });
    }

    // Variables must be 1..n with no gaps, or Meta's example array won't line up.
    const expected = variables.map((_, index) => index + 1);
    if (variables.length && variables.join(',') !== expected.join(',')) {
        issues.push({
            severity: 'error',
            field: 'body',
            message: `Variables must be numbered {{1}} upwards with no gaps. Found {{${variables.join('}}, {{')}}}.`,
        });
    }

    if (variables.length && (input.exampleValues ?? []).filter(Boolean).length < variables.length) {
        issues.push({
            severity: 'error',
            field: 'body',
            message: 'Every variable needs an example value — Meta rejects templates without them.',
        });
    }

    const combined = `${input.headerText ?? ''} ${body} ${input.footerText ?? ''}`;
    for (const shortener of URL_SHORTENERS) {
        if (combined.toLowerCase().includes(shortener)) {
            issues.push({
                severity: 'error',
                field: 'body',
                message: `Link shorteners (${shortener}) are a common rejection reason. Use the full URL.`,
            });
            break;
        }
    }

    // Shouty promo copy. Measured on letters only so "{{1}}" and digits don't skew it.
    const letters = body.replace(/[^A-Za-z]/g, '');
    const upperRatio = letters.length >= 20
        ? letters.split('').filter((c) => c === c.toUpperCase()).length / letters.length
        : 0;
    if (upperRatio > 0.6) {
        issues.push({
            severity: 'warning',
            field: 'body',
            message: 'Body is mostly capitals, which reads as spam. Use normal sentence case.',
        });
    }
    if ((body.match(/!/g) ?? []).length >= 3) {
        issues.push({
            severity: 'warning',
            field: 'body',
            message: 'Several exclamation marks — this pattern is associated with rejections.',
        });
    }

    // Emoji-only / text-free content.
    const withoutVariables = body.replace(/\{\{\s*\d+\s*\}\}/g, '').trim();
    if (withoutVariables && !/[A-Za-zഀ-ൿऀ-ॿ]/.test(withoutVariables)) {
        issues.push({
            severity: 'error',
            field: 'body',
            message: 'Body has no readable text — emoji or punctuation alone will be rejected.',
        });
    }

    if ((input.headerText?.length ?? 0) > HEADER_LIMIT) {
        issues.push({
            severity: 'error',
            field: 'header',
            message: `Header is ${input.headerText!.length} characters; the limit is ${HEADER_LIMIT}.`,
        });
    }
    if ((input.footerText?.length ?? 0) > FOOTER_LIMIT) {
        issues.push({
            severity: 'error',
            field: 'footer',
            message: `Footer is ${input.footerText!.length} characters; the limit is ${FOOTER_LIMIT}.`,
        });
    }

    const buttons = input.buttons ?? [];
    if (buttons.length > 10) {
        issues.push({ severity: 'error', field: 'buttons', message: 'Meta allows at most 10 buttons.' });
    }
    for (const button of buttons) {
        if (!button.text?.trim()) {
            issues.push({ severity: 'error', field: 'buttons', message: 'Every button needs a label.' });
            break;
        }
        if (button.type === 'URL' && !/^https?:\/\//i.test(button.url ?? '')) {
            issues.push({
                severity: 'error',
                field: 'buttons',
                message: `Button "${button.text}" needs a full URL starting with https://.`,
            });
        }
    }

    if (input.category === 'MARKETING' && !hasOptOutButton(buttons)) {
        issues.push({
            severity: 'warning',
            field: 'buttons',
            message: 'An opt-out button will be added automatically — marketing templates require one.',
        });
    }

    if (input.category === 'UTILITY' && /\b(offer|discount|sale|deal|% off|book now)\b/i.test(body)) {
        issues.push({
            severity: 'warning',
            field: 'category',
            message: 'This reads like marketing copy. Submitting it as UTILITY is a common rejection cause — and Meta reclassifies aggressively.',
        });
    }

    return issues;
}

export function hasBlockingIssues(issues: LintIssue[]): boolean {
    return issues.some((issue) => issue.severity === 'error');
}

// --------------------------------------------
// Preview rendering
// --------------------------------------------

/**
 * Fill {{n}} for the bubble preview.
 *
 * An unmapped variable renders as its fallback rather than being left as
 * "{{2}}", because seeing the raw placeholder is exactly what stops people
 * noticing that a variable is unmapped.
 */
export function renderTemplateText(
    text: string,
    values: Record<string, string> = {},
    fallback = 'Guest',
): string {
    return text.replace(/\{\{\s*(\d+)\s*\}\}/g, (_match, index: string) => values[index] || fallback);
}
