import { db } from '@/lib/db';
import { roomTypes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { PricingRuleForm } from '@/components/admin/pricing-rule-form';

export default async function CreatePricingRulePage() {
    const allRoomTypes = await db.select({
        id: roomTypes.id,
        name: roomTypes.name,
    })
        .from(roomTypes)
        .where(eq(roomTypes.status, 'active'));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Create Pricing Rule</h1>
                <p className="text-gray-600 mt-1">
                    Add a new seasonal or event-based pricing rule
                </p>
            </div>

            <PricingRuleForm roomTypes={allRoomTypes} />
        </div>
    );
}
