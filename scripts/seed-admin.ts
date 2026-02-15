import 'dotenv/config';
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    const email = process.argv[2];
    if (!email) {
        console.error("Please provide an email address.");
        process.exit(1);
    }

    console.log(`Promoting ${email} to admin...`);

    await db.update(users)
        .set({ role: 'admin' })
        .where(eq(users.email, email));

    console.log("Done!");
    process.exit(0);
}

main();
