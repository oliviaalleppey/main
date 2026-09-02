/**
 * Verifies room tax is summed per night, each night on its own slab.
 * Run: npx tsx scripts/verify-tax-logic.ts
 */
import {
    calculateRoomTax,
    calculateRoomTaxForNightlyRates,
    getRoomTaxRateForNightlyRate,
    GST_ACCOMMODATION_THRESHOLD_PAISE,
} from '../lib/services/tax';

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

let failures = 0;
function check(label: string, actual: number, expected: number, format = rupees) {
    const ok = actual === expected;
    if (!ok) failures++;
    console.log(
        `${ok ? 'PASS' : 'FAIL'}  ${label}\n      expected ${format(expected)}   actual ${format(actual)}`
    );
}

const percent = (value: number) => `${value}%`;

console.log('--- slab boundary (threshold is inclusive) ---');
check('₹7,499/night → 5%', getRoomTaxRateForNightlyRate(749_900), 5, percent);
check('₹7,500/night → 5%', getRoomTaxRateForNightlyRate(GST_ACCOMMODATION_THRESHOLD_PAISE), 5, percent);
check('₹7,500.01/night → 18%', getRoomTaxRateForNightlyRate(GST_ACCOMMODATION_THRESHOLD_PAISE + 1), 18, percent);

console.log('\n--- regression: OL-3008-VBZA, 2 nights @ ₹10,499 ---');
// Was charged 188,982 (one night only). Both nights are above the threshold.
check(
    'two nights taxed, not one',
    calculateRoomTaxForNightlyRates([1_049_900, 1_049_900]),
    377_964
);

console.log('\n--- regression: OL-0908-B4R1, 1 night @ ₹24,499 ---');
// Was charged 293,988 at a stale 12%.
check('single night at 18%', calculateRoomTaxForNightlyRates([2_449_900]), 440_982);

console.log('\n--- mixed slabs in one stay (Canal View King, 16→18 Aug) ---');
// ₹7,499 night at 5% = 37,495; ₹8,499 night at 18% = 152,982.
check(
    'each night takes its own slab',
    calculateRoomTaxForNightlyRates([749_900, 849_900]),
    190_477
);
check(
    'averaging the same stay would be wrong',
    calculateRoomTaxForNightlyRates([799_900, 799_900]),
    287_964
);

console.log('\n--- quantity multiplies whole rooms ---');
check('3 rooms × 2 nights @ ₹7,499', calculateRoomTaxForNightlyRates([749_900, 749_900], 3), 224_970);

console.log('\n--- legacy quote with no nightlyRates falls back to an even split ---');
check(
    'stay total spread across 2 nights',
    calculateRoomTax({ totalPricePerRoom: 2_099_800, nights: 2 }),
    377_964
);
check(
    'pricePerNight only',
    calculateRoomTax({ pricePerNight: 749_900, nights: 2 }),
    74_990
);

console.log('\n--- odd totals keep their paise ---');
check(
    '₹1,000.01 over 3 nights loses nothing',
    calculateRoomTax({ totalPricePerRoom: 100_001, nights: 3 }),
    // 33_334 + 33_334 + 33_333 → 5% each, all below threshold
    Math.round(33_334 * 0.05) * 2 + Math.round(33_333 * 0.05)
);

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
