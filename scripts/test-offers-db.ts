/**
 * Promo code validation and redemption against the real database.
 *
 *   npx esbuild scripts/test-offers-db.ts --bundle --platform=node \
 *     --format=cjs --alias:@=. --outfile=/tmp/tod.cjs && node --env-file=.env /tmp/tod.cjs
 *
 * The arithmetic is covered by scripts/test-offers.ts. What can only be tested
 * here is the part that involves other people booking at the same time:
 *
 *   **A limited offer must not be over-redeemed.** Validation reads
 *   `usage_count < usage_limit`, and between that read and the booking there is a
 *   window in which any number of other guests can also pass it. The only thing
 *   standing between "50 rooms at this rate" and 60 sold is that the increment is
 *   a single conditional UPDATE. That property is asserted here by running
 *   redemptions concurrently and counting.
 *
 * The `offers` table is empty at baseline (0 rows) and is returned to it.
 */

import { db } from '@/lib/db';
import { offers } from '@/lib/db/schema';
import { inArray, eq, sql } from 'drizzle-orm';
import {
    validateOfferCode, redeemOffer, releaseOffer, hotelToday, type OfferRejectReason,
} from '@/lib/services/offers';

let passed = 0;
let failed = 0;
function check(name: string, condition: boolean, detail?: string) {
    if (condition) { passed++; console.log(`  PASS  ${name}`); }
    else { failed++; console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ''}`); }
}

const created: string[] = [];

async function makeOffer(over: Partial<typeof offers.$inferInsert> & { code: string }) {
    const [row] = await db.insert(offers).values({
        title: `Test ${over.code}`,
        discountType: 'percentage',
        discountValue: 10,
        validFrom: '2020-01-01',
        validTo: '2099-12-31',
        isActive: true,
        ...over,
    }).returning();
    created.push(row.id);
    return row;
}

async function cleanup() {
    if (created.length) await db.delete(offers).where(inArray(offers.id, created));
}

/** ₹10,000 room, ₹1,200 tax, ₹1,500 add-ons, ₹270 add-on tax. */
const CTX = { roomSubtotal: 1000000, bookingTotal: 1000000 + 120000 + 150000 + 27000 };

async function expectReject(label: string, code: string, reason: OfferRejectReason) {
    const result = await validateOfferCode(code, CTX);
    check(label, !result.valid && result.reason === reason,
        result.valid ? 'unexpectedly valid' : `got reason "${result.reason}"`);
}

async function main() {
    // ----------------------------------------
    console.log('\n--- a good code validates ---');
    // ----------------------------------------

    await makeOffer({ code: 'GOODTEST', discountType: 'percentage', discountValue: 15 });

    const good = await validateOfferCode('GOODTEST', CTX);
    check('a live code is accepted', good.valid === true);
    check('the discount is 15% of the room', good.valid && good.discount === 150000,
        good.valid ? `got ${good.discount}` : '');
    check('the message names the saving', good.valid && good.message.includes('1,500'),
        good.valid ? good.message : '');

    const lower = await validateOfferCode('goodtest', CTX);
    check('a lower-case code still validates', lower.valid === true);
    const padded = await validateOfferCode('  GoOdTeSt  ', CTX);
    check('a padded, mixed-case code still validates', padded.valid === true);

    // ----------------------------------------
    console.log('\n--- every rejection path ---');
    // ----------------------------------------

    await expectReject('an empty code is refused', '', 'empty');
    await expectReject('an unknown code is refused', 'NOSUCHCODE', 'not_found');

    await makeOffer({ code: 'INACTIVETEST', isActive: false });
    await expectReject('a deactivated code is refused', 'INACTIVETEST', 'inactive');

    await makeOffer({ code: 'FUTURETEST', validFrom: '2099-01-01', validTo: '2099-12-31' });
    await expectReject('a code that has not started is refused', 'FUTURETEST', 'not_started');

    await makeOffer({ code: 'EXPIREDTEST', validFrom: '2020-01-01', validTo: '2020-12-31' });
    await expectReject('an expired code is refused', 'EXPIREDTEST', 'expired');

    await makeOffer({ code: 'USEDUPTEST', usageLimit: 5, usageCount: 5 });
    await expectReject('a fully claimed code is refused', 'USEDUPTEST', 'usage_limit_reached');

    await makeOffer({ code: 'BIGSPENDTEST', minBookingAmount: 99999999 });
    await expectReject('a code below its minimum is refused', 'BIGSPENDTEST', 'below_minimum');

    const minMessage = await validateOfferCode('BIGSPENDTEST', CTX);
    check('the minimum-spend message states the threshold',
        !minMessage.valid && /₹/.test(minMessage.message), minMessage.message);

    await makeOffer({ code: 'ZEROTEST', discountType: 'percentage', discountValue: 0 });
    await expectReject('a code worth nothing is refused', 'ZEROTEST', 'no_discount');

    // ----------------------------------------
    console.log('\n--- validity is judged on the hotel\'s date ---');
    // ----------------------------------------

    const today = hotelToday();
    await makeOffer({ code: 'TODAYTEST', validFrom: today, validTo: today });
    const todayResult = await validateOfferCode('TODAYTEST', CTX);
    check('a code valid only today is live today', todayResult.valid === true,
        todayResult.valid ? '' : `rejected as ${todayResult.reason} (today = ${today})`);

    // ----------------------------------------
    console.log('\n--- the minimum is measured on the pre-discount total ---');
    // ----------------------------------------

    await makeOffer({ code: 'MINEXACTTEST', minBookingAmount: CTX.bookingTotal });
    check('a booking exactly on the threshold qualifies',
        (await validateOfferCode('MINEXACTTEST', CTX)).valid === true);

    check('a booking one paisa short does not',
        !(await validateOfferCode('MINEXACTTEST', {
            ...CTX, bookingTotal: CTX.bookingTotal - 1,
        })).valid);

    // ----------------------------------------
    console.log('\n--- redemption increments, once ---');
    // ----------------------------------------

    const limited = await makeOffer({ code: 'LIMITEDTEST', usageLimit: 3, usageCount: 0 });

    check('the first redemption succeeds', (await redeemOffer(limited.id)) === true);
    const afterOne = await db.query.offers.findFirst({ where: eq(offers.id, limited.id) });
    check('the counter went up by one', afterOne?.usageCount === 1, `got ${afterOne?.usageCount}`);

    check('the second succeeds', (await redeemOffer(limited.id)) === true);
    check('the third succeeds', (await redeemOffer(limited.id)) === true);
    check('the fourth is refused', (await redeemOffer(limited.id)) === false,
        'the limit is the limit');

    const afterAll = await db.query.offers.findFirst({ where: eq(offers.id, limited.id) });
    check('a refused redemption does not increment', afterAll?.usageCount === 3,
        `got ${afterAll?.usageCount}`);

    // ----------------------------------------
    console.log('\n--- concurrent redemption cannot oversell ---');
    // ----------------------------------------

    // The property that matters. Twenty guests hit checkout at once against an
    // offer with ten seats. A read-then-write implementation lets more than ten
    // through here; the conditional UPDATE does not.
    const contended = await makeOffer({ code: 'RACETEST', usageLimit: 10, usageCount: 0 });

    const attempts = await Promise.all(
        Array.from({ length: 20 }, () => redeemOffer(contended.id)),
    );
    const granted = attempts.filter(Boolean).length;

    check('exactly the limit is granted under contention', granted === 10, `granted ${granted} of 20`);

    const [raceRow] = await db.select({ n: offers.usageCount }).from(offers).where(eq(offers.id, contended.id));
    check('the stored count matches what was granted', raceRow.n === 10, `stored ${raceRow.n}`);
    check('the count never exceeded the limit', (raceRow.n ?? 0) <= 10);

    // An unlimited offer must not be accidentally capped by the same clause.
    const unlimited = await makeOffer({ code: 'UNLIMITEDTEST', usageLimit: null, usageCount: 0 });
    const manyAttempts = await Promise.all(
        Array.from({ length: 12 }, () => redeemOffer(unlimited.id)),
    );
    check('an unlimited offer grants every request',
        manyAttempts.every(Boolean), `${manyAttempts.filter(Boolean).length} of 12`);
    const [unlimitedRow] = await db.select({ n: offers.usageCount }).from(offers).where(eq(offers.id, unlimited.id));
    check('an unlimited offer counts every use', unlimitedRow.n === 12, `stored ${unlimitedRow.n}`);

    // ----------------------------------------
    console.log('\n--- a deactivated offer cannot be redeemed at all ---');
    // ----------------------------------------

    const dead = await makeOffer({ code: 'DEADTEST', isActive: false, usageLimit: null, usageCount: 0 });
    check('redemption of an inactive offer is refused', (await redeemOffer(dead.id)) === false,
        'the redemption clause re-checks is_active, so switching an offer off stops it mid-flight');

    // ----------------------------------------
    console.log('\n--- releasing hands a use back ---');
    // ----------------------------------------

    const released = await makeOffer({ code: 'RELEASETEST', usageLimit: 2, usageCount: 0 });
    await redeemOffer(released.id);
    await redeemOffer(released.id);
    check('the offer is exhausted', (await redeemOffer(released.id)) === false);

    await releaseOffer(released.id);
    const afterRelease = await db.query.offers.findFirst({ where: eq(offers.id, released.id) });
    check('releasing decrements the counter', afterRelease?.usageCount === 1, `got ${afterRelease?.usageCount}`);
    check('the freed seat can be claimed again', (await redeemOffer(released.id)) === true,
        'a booking that failed must not permanently consume a seat');

    // Releasing more than was claimed must not produce a negative count, which
    // would silently grant extra capacity.
    const floor = await makeOffer({ code: 'FLOORTEST', usageLimit: 5, usageCount: 0 });
    await releaseOffer(floor.id);
    await releaseOffer(floor.id);
    const floorRow = await db.query.offers.findFirst({ where: eq(offers.id, floor.id) });
    check('the counter floors at zero', floorRow?.usageCount === 0, `got ${floorRow?.usageCount}`);

    // ----------------------------------------
    console.log('\n--- validation is advisory; redemption is authoritative ---');
    // ----------------------------------------

    const lastSeat = await makeOffer({ code: 'LASTSEATTEST', usageLimit: 1, usageCount: 0 });

    const guestA = await validateOfferCode('LASTSEATTEST', CTX);
    const guestB = await validateOfferCode('LASTSEATTEST', CTX);
    check('two guests can both see the last seat as available',
        guestA.valid === true && guestB.valid === true,
        'this is expected — validation is a read, and it is why redemption re-checks');

    check('the first to check out gets it', (await redeemOffer(lastSeat.id)) === true);
    check('the second does not', (await redeemOffer(lastSeat.id)) === false,
        'and their booking proceeds at full price rather than failing');
}

main()
    .then(async () => {
        console.log('\n--- everything is put back ---');
        await cleanup();

        const [count] = await db.select({ n: sql<number>`count(*)::int` }).from(offers);
        check('the offers table is back to 0 rows', Number(count.n) === 0, `found ${count.n}`);

        console.log(`\n${passed} passed, ${failed} failed`);
        process.exit(failed === 0 ? 0 : 1);
    })
    .catch(async (error) => {
        console.error('\nSUITE ERROR:', error);
        await cleanup().catch((e) => console.error('cleanup also failed:', e));
        process.exit(1);
    });
