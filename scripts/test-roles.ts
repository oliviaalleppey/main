/**
 * Tests for the role/capability matrix.
 *
 * Pure logic, no database. It is tested at all because the table is the thing
 * that decides whether a marketing account can put a message in front of every
 * guest the hotel has, and a one-line edit to that table is very easy to make and
 * very hard to notice.
 *
 * The assertions are written as prohibitions rather than permissions on purpose:
 * "marketing cannot send" is the property that matters, and it stays true only if
 * something checks it.
 *
 * Run:
 *   npx esbuild scripts/test-roles.ts --bundle --platform=node \
 *     --format=cjs --alias:@=. --outfile=/tmp/trl.cjs && node /tmp/trl.cjs
 */

import {
    can, capabilitiesFor, isWhatsAppRole, shouldMaskPhones,
    WHATSAPP_ROLES, ALL_CAPABILITIES, ROLE_LABELS, ROLE_DESCRIPTIONS,
    type Capability,
} from '@/lib/services/whatsapp/roles';
import { phoneMaskerFor } from '@/lib/services/whatsapp/phone';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
    if (condition) { passed++; console.log(`  PASS  ${name}`); }
    else { failed++; console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ''}`); }
}

console.log('\n--- role recognition ---');
check('every declared role is recognised', WHATSAPP_ROLES.every(isWhatsAppRole));
check('an unknown role is not', !isWhatsAppRole('superuser'));
check('the pre-existing generic "user" role is not a WhatsApp role', !isWhatsAppRole('user'));
check('null is not', !isWhatsAppRole(null));
check('undefined is not', !isWhatsAppRole(undefined));
check('empty string is not', !isWhatsAppRole(''));

console.log('\n--- an unknown role can do nothing at all ---');
check('no capability for an unknown role',
    ALL_CAPABILITIES.every((capability) => !can('superuser', capability)));
check('no capability for null', ALL_CAPABILITIES.every((capability) => !can(null, capability)));
check('no capability for the generic user role',
    ALL_CAPABILITIES.every((capability) => !can('user', capability)));
check('capabilitiesFor an unknown role is empty', capabilitiesFor('superuser').length === 0);

console.log('\n--- admin holds everything ---');
check('admin has every capability', ALL_CAPABILITIES.every((capability) => can('admin', capability)));
check('capabilitiesFor(admin) is the full list',
    capabilitiesFor('admin').length === ALL_CAPABILITIES.length);

console.log('\n--- THE RULE: send is separate from create ---');
check('marketing can create a campaign', can('marketing', 'campaigns.create'));
check('marketing CANNOT send one', !can('marketing', 'campaigns.send'));
check('marketing CANNOT approve one', !can('marketing', 'campaigns.approve'));
check('marketing can draft a template', can('marketing', 'templates.write'));
check('marketing CANNOT submit it to Meta', !can('marketing', 'templates.submit'));
check('only admin can send', WHATSAPP_ROLES.filter((r) => can(r, 'campaigns.send')).join() === 'admin');
check('only admin can approve', WHATSAPP_ROLES.filter((r) => can(r, 'campaigns.approve')).join() === 'admin');
check('only admin can submit templates',
    WHATSAPP_ROLES.filter((r) => can(r, 'templates.submit')).join() === 'admin');

console.log('\n--- settings and erasure are admin-only ---');
check('marketing cannot change settings', !can('marketing', 'settings.write'));
check('marketing can read settings', can('marketing', 'settings.read'));
check('only admin can write settings',
    WHATSAPP_ROLES.filter((r) => can(r, 'settings.write')).join() === 'admin');
check('only admin can erase a data subject',
    WHATSAPP_ROLES.filter((r) => can(r, 'compliance.erase')).join() === 'admin');
check('only admin can erase a contact',
    WHATSAPP_ROLES.filter((r) => can(r, 'contacts.erase')).join() === 'admin');
check('only admin can change automations',
    WHATSAPP_ROLES.filter((r) => can(r, 'automations.write')).join() === 'admin');

console.log('\n--- front desk: the inbox, and not much else ---');
check('frontdesk can read the inbox', can('frontdesk', 'inbox.read'));
check('frontdesk can reply', can('frontdesk', 'inbox.reply'));
check('frontdesk can read contacts', can('frontdesk', 'contacts.read'));
check('frontdesk CANNOT edit contacts', !can('frontdesk', 'contacts.write'));
check('frontdesk CANNOT see unmasked numbers', !can('frontdesk', 'contacts.unmask'));
check('frontdesk CANNOT see campaigns at all', !can('frontdesk', 'campaigns.read'));
check('frontdesk CANNOT see analytics', !can('frontdesk', 'analytics.read'));
check('frontdesk CANNOT touch settings', !can('frontdesk', 'settings.read'));

console.log('\n--- viewer is read-only, everywhere ---');
const WRITE_CAPABILITIES: Capability[] = [
    'contacts.write', 'contacts.erase', 'audiences.write', 'templates.write',
    'templates.submit', 'campaigns.create', 'campaigns.send', 'campaigns.approve',
    'inbox.reply', 'automations.write', 'compliance.erase', 'settings.write',
];
check('viewer holds no write capability',
    WRITE_CAPABILITIES.every((capability) => !can('viewer', capability)),
    WRITE_CAPABILITIES.filter((c) => can('viewer', c)).join(', '));
check('viewer can still read the inbox', can('viewer', 'inbox.read'));
check('viewer can read analytics', can('viewer', 'analytics.read'));
check('viewer CANNOT reply', !can('viewer', 'inbox.reply'));

console.log('\n--- phone masking follows contacts.unmask ---');
check('admin sees real numbers', !shouldMaskPhones('admin'));
check('marketing sees real numbers', !shouldMaskPhones('marketing'));
check('frontdesk sees masked numbers', shouldMaskPhones('frontdesk'));
check('viewer sees masked numbers', shouldMaskPhones('viewer'));
check('an unknown role sees masked numbers', shouldMaskPhones('superuser'));
check('null sees masked numbers', shouldMaskPhones(null));

console.log('\n--- phoneMaskerFor is what the routes actually call ---');
{
    const REAL = '+919847123456';
    const masked = phoneMaskerFor('frontdesk')(REAL);
    const plain = phoneMaskerFor('admin')(REAL);

    check('admin gets the number back untouched', plain === REAL);
    check('marketing gets the number back untouched', phoneMaskerFor('marketing')(REAL) === REAL);
    check('frontdesk gets a masked number', masked !== REAL);
    check('viewer gets a masked number', phoneMaskerFor('viewer')(REAL) !== REAL);

    // The point of masking is that digits are gone, not merely re-formatted: a
    // mask that kept every digit while inserting bullets would pass a naive
    // "not equal" check and leak the whole number.
    //
    // The threshold is stated as hidden digits rather than as a fraction. What is
    // revealed here is the country code and '98' — an operator prefix carrying
    // almost no entropy — so a ratio would flatter the mask. Five hidden digits
    // is 100,000 candidates, which is what makes the number unguessable.
    const digitsIn = REAL.replace(/\D/g, '');
    const digitsOut = masked.replace(/\D/g, '');
    check('at least 5 digits are hidden', digitsIn.length - digitsOut.length >= 5);
    check('the masked form does not contain the full number', !digitsOut.includes(digitsIn));
    check('enough tail survives to recognise a guest', masked.endsWith('456'));
    check('the country code survives', masked.startsWith('+91'));

    // An unknown or absent role must mask — failing closed is the whole point.
    check('an unknown role is masked', phoneMaskerFor('superuser')(REAL) !== REAL);
    check('null is masked', phoneMaskerFor(null)(REAL) !== REAL);
    check('undefined is masked', phoneMaskerFor(undefined)(REAL) !== REAL);

    check('masking agrees with shouldMaskPhones for every role',
        WHATSAPP_ROLES.every((role) =>
            (phoneMaskerFor(role)(REAL) !== REAL) === shouldMaskPhones(role)));

    // Masking twice must not reveal anything new or corrupt the display form.
    check('masking is idempotent', phoneMaskerFor('frontdesk')(masked) === masked);
}

console.log('\n--- the table is internally consistent ---');
check('every role has a label', WHATSAPP_ROLES.every((role) => !!ROLE_LABELS[role]));
check('every role has a description', WHATSAPP_ROLES.every((role) => !!ROLE_DESCRIPTIONS[role]));
check('ALL_CAPABILITIES has no duplicates',
    new Set(ALL_CAPABILITIES).size === ALL_CAPABILITIES.length);
check('no role claims a capability outside ALL_CAPABILITIES',
    WHATSAPP_ROLES.every((role) =>
        capabilitiesFor(role).every((capability) => ALL_CAPABILITIES.includes(capability))),
);
check('every non-admin role is a strict subset of admin',
    WHATSAPP_ROLES.filter((r) => r !== 'admin').every(
        (role) => capabilitiesFor(role).length < ALL_CAPABILITIES.length));

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
