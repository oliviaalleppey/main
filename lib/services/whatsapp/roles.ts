/**
 * Roles and capabilities for the WhatsApp module.
 *
 * Until now the whole admin panel was one binary gate, `role === 'admin'`, and
 * two safety rules in the plan were left inert because of it: the two-person rule
 * on template submission, and a campaign approval that must come from someone
 * other than the person who built it. Neither can mean anything while there is
 * only one kind of user.
 *
 * The design rule here is that **send is a separate capability from create**.
 * Marketing staff build campaigns and draft templates; launching one at a few
 * thousand guests is an admin action. That split is the whole point — it is what
 * makes "two people were involved" enforceable rather than aspirational.
 *
 * Capabilities are checked, never roles: a route asks for `campaigns.send`, not
 * for `admin`. Adding a role later is then a change to this table alone.
 */

export const WHATSAPP_ROLES = ['admin', 'marketing', 'frontdesk', 'viewer'] as const;
export type WhatsAppRole = (typeof WHATSAPP_ROLES)[number];

export type Capability =
    | 'contacts.read'
    | 'contacts.write'
    | 'contacts.unmask'
    | 'contacts.erase'
    | 'audiences.read'
    | 'audiences.write'
    | 'templates.read'
    | 'templates.write'
    | 'templates.submit'
    | 'campaigns.read'
    | 'campaigns.create'
    | 'campaigns.send'
    | 'campaigns.approve'
    | 'inbox.read'
    | 'inbox.reply'
    | 'automations.read'
    | 'automations.write'
    | 'analytics.read'
    | 'compliance.read'
    | 'compliance.erase'
    | 'settings.read'
    | 'settings.write';

const MARKETING: Capability[] = [
    'contacts.read', 'contacts.write', 'contacts.unmask',
    'audiences.read', 'audiences.write',
    'templates.read', 'templates.write',
    // Deliberately NOT templates.submit: submitting to Meta is the point at which
    // a mistake becomes the hotel's public reputation.
    'campaigns.read', 'campaigns.create',
    // Deliberately NOT campaigns.send or .approve.
    'inbox.read', 'inbox.reply',
    'automations.read',
    'analytics.read',
    'compliance.read',
    'settings.read',
];

const FRONTDESK: Capability[] = [
    // Front desk answer guests; they do not run marketing. Phone numbers are
    // masked for them, hence no contacts.unmask.
    'contacts.read',
    'templates.read',
    'inbox.read', 'inbox.reply',
];

const VIEWER: Capability[] = [
    'contacts.read',
    'audiences.read',
    'templates.read',
    'campaigns.read',
    'inbox.read',
    'automations.read',
    'analytics.read',
    'compliance.read',
    'settings.read',
];

/** admin is intentionally not a list — it holds everything, including future capabilities. */
const CAPABILITIES: Record<Exclude<WhatsAppRole, 'admin'>, Set<Capability>> = {
    marketing: new Set(MARKETING),
    frontdesk: new Set(FRONTDESK),
    viewer: new Set(VIEWER),
};

export function isWhatsAppRole(role: string | null | undefined): role is WhatsAppRole {
    return !!role && (WHATSAPP_ROLES as readonly string[]).includes(role);
}

export function can(role: string | null | undefined, capability: Capability): boolean {
    if (!isWhatsAppRole(role)) return false;
    if (role === 'admin') return true;
    return CAPABILITIES[role].has(capability);
}

export function capabilitiesFor(role: string | null | undefined): Capability[] {
    if (!isWhatsAppRole(role)) return [];
    if (role === 'admin') return [...ALL_CAPABILITIES];
    return [...CAPABILITIES[role]];
}

export const ALL_CAPABILITIES: Capability[] = [
    'contacts.read', 'contacts.write', 'contacts.unmask', 'contacts.erase',
    'audiences.read', 'audiences.write',
    'templates.read', 'templates.write', 'templates.submit',
    'campaigns.read', 'campaigns.create', 'campaigns.send', 'campaigns.approve',
    'inbox.read', 'inbox.reply',
    'automations.read', 'automations.write',
    'analytics.read',
    'compliance.read', 'compliance.erase',
    'settings.read', 'settings.write',
];

/**
 * Whether a role sees real phone numbers or masked ones.
 *
 * Front desk and viewers get `+91 98••• ••123`. They need to recognise a guest,
 * not to be able to copy 4,000 numbers out of the panel.
 */
export function shouldMaskPhones(role: string | null | undefined): boolean {
    return !can(role, 'contacts.unmask');
}

export const ROLE_LABELS: Record<WhatsAppRole, string> = {
    admin: 'Administrator',
    marketing: 'Marketing',
    frontdesk: 'Front desk',
    viewer: 'Viewer',
};

export const ROLE_DESCRIPTIONS: Record<WhatsAppRole, string> = {
    admin: 'Everything, including launching campaigns and changing settings.',
    marketing: 'Builds contacts, audiences, templates and campaigns — but cannot launch or submit them.',
    frontdesk: 'Answers guests in the inbox. Sees contacts with phone numbers masked.',
    viewer: 'Read-only across the module.',
};
