/**
 * Search snippets and which venue pages are kept out of the index.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { altText, clipDescription, pageMetadata } from '@/lib/seo';
import { findParentVenue } from '@/lib/venue-sections';

test('short copy is left alone, apart from collapsed whitespace', () => {
    assert.equal(clipDescription('  Lake view,\n  king bed.  '), 'Lake view, king bed.');
});

test('long copy is cut at a word boundary within snippet length', () => {
    const long = 'Our most exclusive suite with a large private balcony and panoramic views over the backwaters, '.repeat(3);
    const clipped = clipDescription(long);
    assert.ok(clipped.length <= 158, `got ${clipped.length} characters`);
    assert.ok(clipped.endsWith('…'));
    assert.ok(long.startsWith(clipped.slice(0, -1)), 'cut mid-word');
    assert.doesNotMatch(clipped, /[\s,]…$/);
});

const venues = [
    { slug: 'grand-ballroom', isDivisible: true },
    { slug: 'grand-ballroom-1', isDivisible: false },
    { slug: 'forum-1', isDivisible: false },
    { slug: 'forum-2', isDivisible: false },
];

test('a numbered section of a divisible room has that room as its parent', () => {
    assert.equal(findParentVenue('grand-ballroom-1', venues)?.slug, 'grand-ballroom');
});

test('numbered rooms with no divisible parent stand alone', () => {
    assert.equal(findParentVenue('forum-1', venues), undefined);
    assert.equal(findParentVenue('grand-ballroom', venues), undefined);
});

test('a numbered room is not a section of a parent that cannot be divided', () => {
    assert.equal(
        findParentVenue('grand-ballroom-1', [{ slug: 'grand-ballroom', isDivisible: false }]),
        undefined
    );
});

test('thin pages can stay out of the index while their links are still followed', () => {
    const meta = pageMetadata({ title: 'T', description: 'D', path: '/x', noIndex: true, followLinks: true });
    assert.deepEqual(meta.robots, { index: false, follow: true, nocache: false });
});

test('private pages stay fully closed by default', () => {
    const meta = pageMetadata({ title: 'T', description: 'D', path: '/x', noIndex: true });
    assert.deepEqual(meta.robots, { index: false, follow: false, nocache: true });
});

test('alt text keeps a real caption', () => {
    assert.equal(altText('Lake view suite at sunset', 'fallback'), 'Lake view suite at sunset');
    assert.equal(altText('Lobby', 'fallback'), 'Lobby');
});

test('alt text replaces file names and blanks with the fallback', () => {
    for (const raw of ['Hero_2.jpg', 'IMG_4021', 'canal_view_king.webp', 'Hero_2', '', '   ', null, undefined]) {
        assert.equal(altText(raw, 'fallback'), 'fallback', `kept ${String(raw)}`);
    }
});
