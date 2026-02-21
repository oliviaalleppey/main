
import 'dotenv/config';
import { db } from '@/lib/db';
import { ratePlans } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    console.log("Checking rate plans...");
    const plan = await db.query.ratePlans.findFirst({
        where: eq(ratePlans.code, 'rp_standard')
    });

    if (plan) {
        console.log("Found plan:", plan);
    } else {
        console.log("Plan 'rp_standard' NOT FOUND. Existing plans:");
        const allPlans = await db.query.ratePlans.findMany();
        console.log(allPlans.map(p => ({ code: p.code, name: p.name })));
    }
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
