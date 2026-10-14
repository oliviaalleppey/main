import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMasqueradeNotes } from '@/lib/masquerade-notes';

const notes = [
    'THE GRAND MASQUERADE, 31 DECEMBER. Package price includes the room.',
    'Room 1 (Lake View Balcony Suite): 2 adults, 1 junior guest (6-11), nanny',
    'Room 2 (Canal View King Room): 2 adults, 1 extra adult',
    "Gala Evening for Two x 1 (outside the hotel)",
    "Chauffeur's Stay & Dining x 2 (outside the hotel)",
    'Guest note: vegetarian dinner please',
].join('\n');

test('reads rooms, outside guests and the guest note back from the booking notes', () => {
    const n = parseMasqueradeNotes(notes);
    assert.equal(n.isMasquerade, true);
    assert.equal(n.isTest, false);
    assert.deepEqual(n.rooms, [
        { number: 1, roomType: 'Lake View Balcony Suite', guests: '2 adults, 1 junior guest (6-11), nanny' },
        { number: 2, roomType: 'Canal View King Room', guests: '2 adults, 1 extra adult' },
    ]);
    assert.deepEqual(n.outside, ['Gala Evening for Two x 1', "Chauffeur's Stay & Dining x 2"]);
    assert.equal(n.guestNote, 'vegetarian dinner please');
});

test('a test booking is recognised', () => {
    const n = parseMasqueradeNotes('TEST BOOKING (Rs 5). Do not honour.\nTHE GRAND MASQUERADE, 31 DECEMBER.\nRoom 1 (Canal View King Room): 2 adults');
    assert.equal(n.isTest, true);
    assert.equal(n.isMasquerade, true);
    assert.equal(n.rooms.length, 1);
});

test('an ordinary booking is not mistaken for a 31st Night one', () => {
    assert.equal(parseMasqueradeNotes('Late check-in please').isMasquerade, false);
    assert.equal(parseMasqueradeNotes(null).isMasquerade, false);
    assert.deepEqual(parseMasqueradeNotes(undefined).rooms, []);
});
