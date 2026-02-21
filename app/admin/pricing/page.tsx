import { db } from '@/lib/db';
import { pricingRules } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, TrendingUp } from 'lucide-react';

export default async function PricingRulesPage() {
    const rules = await db.select()
        .from(pricingRules)
        .orderBy(desc(pricingRules.priority), desc(pricingRules.createdAt));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Pricing Rules</h1>
                    <p className="text-gray-600 mt-1">Manage seasonal and event-based pricing</p>
                </div>
                <Link href="/admin/pricing/create">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Pricing Rule
                    </Button>
                </Link>
            </div>

            {rules.length === 0 ? (
                <Card className="p-12 text-center">
                    <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No pricing rules yet</h3>
                    <p className="text-gray-600 mb-4">
                        Create your first pricing rule to adjust prices for holidays, weekends, or special events.
                    </p>
                    <Link href="/admin/pricing/create">
                        <Button>Create Pricing Rule</Button>
                    </Link>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {rules.map((rule) => (
                        <Card key={rule.id} className="p-6">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold">{rule.name}</h3>
                                        <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                                            {rule.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                        {rule.priceModifier > 100 && (
                                            <Badge variant="destructive">
                                                <TrendingUp className="w-3 h-3 mr-1" />
                                                +{rule.priceModifier - 100}%
                                            </Badge>
                                        )}
                                        {rule.priceModifier < 100 && (
                                            <Badge variant="success">
                                                -{100 - rule.priceModifier}%
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p>
                                            <span className="font-medium">Period:</span>{' '}
                                            {new Date(rule.startDate).toLocaleDateString()} -{' '}
                                            {new Date(rule.endDate).toLocaleDateString()}
                                        </p>
                                        <p>
                                            <span className="font-medium">Minimum Stay:</span> {rule.minimumStay} night(s)
                                        </p>
                                        <p>
                                            <span className="font-medium">Priority:</span> {rule.priority}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Link href={`/admin/pricing/${rule.id}/edit`}>
                                        <Button variant="outline" size="sm">Edit</Button>
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
