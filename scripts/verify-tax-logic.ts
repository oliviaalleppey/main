/**
 * Verifies room tax is summed per night, each night on its own slab.
 * Run: npx tsx scripts/verify-tax-logic.ts
 */
import {
    calculateRoomTax,
    calculateRoomTaxForNightlyRates,
    getRoomTaxRateForNightlyRate,
    groupTaxByRate,
    splitStayIntoNightlyCharges,
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

console.log('\n--- invoice: tax grouped by rate (CGST/SGST are half each) ---');
{
    const twoNights = splitStayIntoNightlyCharges({
        items: [{ pricePerNight: 1_049_900, subtotal: 2_099_800, rooms: 1 }],
        nights: 2,
        roomTaxTotal: 377_964,
    });

    const roomsOnly = groupTaxByRate(twoNights);
    check('one rate band', roomsOnly.length, 1, String);
    check('band is 18%', roomsOnly[0].rate, 18, (v) => `${v}%`);
    check('taxable value', roomsOnly[0].taxableValue, 2_099_800);
    check('tax', roomsOnly[0].tax, 377_964);
    check('CGST is half', roomsOnly[0].tax / 2, 188_982);

    // Add-ons are always 18%, so with an 18% room they merge into one band.
    const withAddOn = groupTaxByRate(twoNights, [{ rate: 18, taxableValue: 100_000, tax: 18_000 }]);
    check('still one band at 18%', withAddOn.length, 1, String);
    check('add-on folded in', withAddOn[0].tax, 395_964);

    // A 5% room plus an 18% add-on must itemise separately.
    const cheapStay = splitStayIntoNightlyCharges({
        items: [{ pricePerNight: 500_000, subtotal: 1_000_000, rooms: 1 }],
        nights: 2,
        roomTaxTotal: 50_000,
    });
    const mixed = groupTaxByRate(cheapStay, [{ rate: 18, taxableValue: 100_000, tax: 18_000 }]);
    check('two rate bands', mixed.length, 2, String);
    check('5% band tax', mixed[0].tax, 50_000);
    check('18% band tax', mixed[1].tax, 18_000);
    check('bands sum to the booking tax', mixed[0].tax + mixed[1].tax, 68_000);
}

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
