/**
 * The 31st Night settings as saved from admin: guest prices and the party-only couple pass.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    DEFAULT_PARTY_POPUP,
    GATSBY_SHARE_IMAGE,
    NOIR_SHARE_IMAGE,
    MAX_GUEST_PRICES,
    PARTY_THEMES,
    normalisePartyPopup,
    partyShareImage,
    switchPartyTheme,
} from '@/lib/config/party-popup';

test('nothing saved yet gives the built-in price list', () => {
    const settings = normalisePartyPopup(undefined);
    assert.deepEqual(settings.guestPrices, DEFAULT_PARTY_POPUP.guestPrices);
    assert.equal(settings.pricePerCoupleNonResidential, 0);
    assert.equal(settings.theme, 'The Grand Masquerade');
});

test('the bar is called Spirits, not open bar', () => {
    const settings = normalisePartyPopup(undefined);
    assert.ok(settings.highlights.includes('Spirits'));
    assert.ok(!settings.highlights.some((h) => /open bar/i.test(h)));
    assert.doesNotMatch(settings.finePrint, /\bbar\b/i);
});

test('page photos only come from our folder or the public blob store', () => {
    const settings = normalisePartyPopup({
        crowdImage: '/party/crowd.webp',
        lightsImage: 'https://evil.example.com/x.jpg',
    });
    assert.equal(settings.crowdImage, '/party/crowd.webp');
    assert.equal(settings.lightsImage, '');
});

test('the built-in list matches the prices we were given', () => {
    const byName = Object.fromEntries(DEFAULT_PARTY_POPUP.guestPrices.map((g) => [`${g.label}|${g.stay}`, g.price]));
    assert.deepEqual(byName, {
        'Extra adult|R': 9999,
        'Kid|R': 4999,
        'Child or infant|both': 2999,
        'Nanny|NR': 2999,
        'Nanny with extra bed|R': 5999,
    });
});

test('rows without a name or a price are dropped, and odd values are tidied', () => {
    const settings = normalisePartyPopup({
        guestPrices: [
            { label: '  Kid  ', note: '6 to 11 years', price: '4999.4', stay: 'R' },
            { label: '', note: 'no name', price: 100, stay: 'R' },
            { label: 'Free', note: '', price: 0, stay: 'NR' },
            { label: 'Nanny', note: '', price: 2999, stay: 'somewhere' },
            'not a row',
        ],
    });
    assert.deepEqual(settings.guestPrices, [
        { label: 'Kid', note: '6 to 11 years', price: 4999, stay: 'R' },
        { label: 'Nanny', note: '', price: 2999, stay: 'both' },
    ]);
});

test('an emptied list stays empty instead of coming back', () => {
    assert.deepEqual(normalisePartyPopup({ guestPrices: [] }).guestPrices, []);
});

test('the list is capped', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ label: `Guest ${i}`, note: '', price: 100 + i, stay: 'R' }));
    assert.equal(normalisePartyPopup({ guestPrices: many }).guestPrices.length, MAX_GUEST_PRICES);
});

test('the party-only couple price keeps a real number and drops anything else', () => {
    assert.equal(normalisePartyPopup({ pricePerCoupleNonResidential: 34999 }).pricePerCoupleNonResidential, 34999);
    assert.equal(normalisePartyPopup({ pricePerCoupleNonResidential: -5 }).pricePerCoupleNonResidential, 0);
    assert.equal(normalisePartyPopup({ pricePerCoupleNonResidential: 'abc' }).pricePerCoupleNonResidential, 0);
});

test('the page stays on the masquerade until someone switches it', () => {
    assert.equal(normalisePartyPopup(undefined).pageTheme, 'masquerade');
    assert.equal(normalisePartyPopup({ pageTheme: 'gatsby' }).pageTheme, 'gatsby');
    assert.equal(normalisePartyPopup({ pageTheme: 'disco' }).pageTheme, 'masquerade');
});

test('switching to Gatsby brings its words and keeps prices', () => {
    const next = switchPartyTheme(normalisePartyPopup({ pricePerCoupleNonResidential: 34999 }), 'gatsby');
    assert.equal(next.pageTheme, 'gatsby');
    assert.equal(next.theme, PARTY_THEMES.gatsby.copy.theme);
    assert.equal(next.dressValue, PARTY_THEMES.gatsby.copy.dressValue);
    assert.equal(next.pricePerCoupleNonResidential, 34999);
    assert.deepEqual(next.guestPrices, DEFAULT_PARTY_POPUP.guestPrices);
});

test('words someone rewrote survive a theme switch, and switching back restores the rest', () => {
    const edited = { ...normalisePartyPopup(undefined), intro: 'Our own words.' };
    const gatsby = switchPartyTheme(edited, 'gatsby');
    assert.equal(gatsby.intro, 'Our own words.');
    const back = switchPartyTheme(gatsby, 'masquerade');
    assert.equal(back.theme, PARTY_THEMES.masquerade.copy.theme);
    assert.equal(back.intro, 'Our own words.');
});

test('the Gatsby page shares its own picture, not the masquerade photos', () => {
    assert.equal(partyShareImage(normalisePartyPopup({ pageTheme: 'gatsby', pageImage: '/party/x.webp' })), GATSBY_SHARE_IMAGE);
    assert.equal(partyShareImage(normalisePartyPopup({ pageImage: '/party/x.webp' })), '/party/x.webp');
});

test('the Dark Night theme can be chosen and brings its own words and picture', () => {
    const noir = switchPartyTheme(normalisePartyPopup({ pageTheme: 'gatsby', ...PARTY_THEMES.gatsby.copy }), 'noir');
    assert.equal(normalisePartyPopup(noir).pageTheme, 'noir');
    assert.equal(noir.theme, 'The Dark Night Masquerade');
    assert.equal(noir.dressValue, PARTY_THEMES.noir.copy.dressValue);
    assert.equal(partyShareImage(noir), NOIR_SHARE_IMAGE);
});
