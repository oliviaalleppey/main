/**
 * STOP detection decides who is opted out of marketing. Missing a real "stop"
 * keeps messaging someone who asked us not to; a false match only costs reach.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectStopIntent, isOptOutButton } from '@/lib/services/whatsapp/consent';

test('English opt-outs', () => {
    for (const text of ['STOP', 'stop', 'Unsubscribe', 'opt out', 'please stop sending these', "don't message me", 'not interested']) {
        assert.equal(detectStopIntent(text), true, text);
    }
});

test('transliterated Malayalam, Hindi and Tamil', () => {
    for (const text of ['venda', 'ini ayakkanda', 'mathi', 'band karo', 'mat bhejo', 'vendam']) {
        assert.equal(detectStopIntent(text), true, text);
    }
});

test('Malayalam, Hindi and Tamil in their own scripts', () => {
    for (const text of ['വേണ്ട', 'ഇനി അയക്കണ്ട', 'മെസേജ് അയയ്ക്കണ്ട', 'അയക്കേണ്ട', 'നിർത്തൂ', 'मत भेजो', 'बंद करो', 'வேண்டாம்']) {
        assert.equal(detectStopIntent(text), true, text);
    }
});

test('words that merely start like "venda" are not opt-outs', () => {
    // വേണ്ടി = "for"; വേണ്ടേ = "don't you want?"; മതിൽ = "wall".
    for (const text of ['എനിക്ക് വേണ്ടി ഒരു റൂം', 'ബ്രേക്ക്ഫാസ്റ്റ് വേണ്ടേ?', 'മതിൽ', 'Can I book a room for tonight?']) {
        assert.equal(detectStopIntent(text), false, text);
    }
});

test('long messages are conversation, not commands', () => {
    assert.equal(detectStopIntent(`stop ${'x'.repeat(300)}`), false);
});

test('opt-out quick-reply buttons', () => {
    assert.equal(isOptOutButton('Stop promotions'), true);
    assert.equal(isOptOutButton('Book now'), false);
});
