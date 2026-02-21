import { db } from '@/lib/db';
import { ratePlans, roomTypes } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Plus, Pencil, Tag, Calendar, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { eq } from 'drizzle-orm';

export default async function RatePlansPage() {
    const allRatePlans = await db.query.ratePlans.findMany({
        with: {
            roomType: true,
        },
        orderBy: (plans, { asc }) => [asc(plans.displayOrder)],
    });

    const allRoomTypes = await db.select().from(roomTypes);

    // Group rate plans by room type
    const ratePlansByRoomType = allRoomTypes.map(roomType => ({
        ...roomType,
        ratePlans: allRatePlans.filter(plan => plan.roomTypeId === roomType.id),
    }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Rate Plans</h1>
                    <p className="text-gray-600">Manage pricing options for each room type</p>
                </div>
                <Link href="/admin/rooms/rate-plans/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Rate Plan
                    </Button>
                </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="text-sm text-gray-500">Total Rate Plans</div>
                    <div className="text-2xl font-bold">{allRatePlans.length}</div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm text-gray-500">Active Plans</div>
                    <div className="text-2xl font-bold text-green-600">
                        {allRatePlans.filter(p => p.isActive).length}
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm text-gray-500">Default Plans</div>
                    <div className="text-2xl font-bold text-blue-600">
                        {allRatePlans.filter(p => p.isDefault).length}
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm text-gray-500">Promotional</div>
                    <div className="text-2xl font-bold text-amber-600">
                        {allRatePlans.filter(p => p.isPromotional).length}
                    </div>
                </Card>
            </div>

            {/* Rate Plans by Room Type */}
            <div className="space-y-8">
                {ratePlansByRoomType.map(roomType => (
                    <div key={roomType.id}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold">{roomType.name}</h2>
                                <p className="text-sm text-gray-500">
                                    Base Price: {formatCurrency(roomType.basePrice)} / night
                                </p>
                            </div>
                            <Link href={`/admin/rooms/rate-plans/new?roomTypeId=${roomType.id}`}>
                                <Button variant="outline" size="sm">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Plan
                                </Button>
                            </Link>
                        </div>

                        {roomType.ratePlans.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {roomType.ratePlans.map(plan => (
                                    <Card key={plan.id} className={`p-4 ${!plan.isActive ? 'opacity-60' : ''} ${plan.isDefault ? 'border-blue-500 border-2' : ''}`}>
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold">{plan.name}</h3>
                                                    {plan.isDefault && (
                                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                                            Default
                                                        </span>
                                                    )}
                                                    {plan.isPromotional && (
                                                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                                                            Promo
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500">{plan.code}</p>
                                            </div>
                                            <Link href={`/admin/rooms/rate-plans/${plan.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Price Modifier</span>
                                                <span className={`font-medium ${(plan.basePriceModifier ?? 100) > 100 ? 'text-green-600' : (plan.basePriceModifier ?? 100) < 100 ? 'text-red-600' : ''}`}>
                                                    {plan.basePriceModifier ?? 100}%
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Final Price</span>
                                                <span className="font-semibold">
                                                    {formatCurrency(Math.round(roomType.basePrice * (plan.basePriceModifier ?? 100) / 100))}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Min Stay</span>
                                                <span>{plan.minLOS} night(s)</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Cancellation</span>
                                                <span className="capitalize">{plan.cancellationPolicy?.replace('_', ' ')}</span>
                                            </div>
                                        </div>

                                        {/* Inclusions */}
                                        <div className="mt-3 pt-3 border-t">
                                            <div className="flex flex-wrap gap-1">
                                                {plan.includesBreakfast && (
                                                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                                                        Breakfast
                                                    </span>
                                                )}
                                                {plan.includesAirportTransfer && (
                                                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                                                        Transfer
                                                    </span>
                                                )}
                                                {plan.includesLateCheckout && (
                                                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                                                        Late Checkout
                                                    </span>
                                                )}
                                                {plan.includesSpa && (
                                                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                                                        Spa
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {!plan.isActive && (
                                            <div className="mt-2 text-xs text-red-600">
                                                Inactive
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="p-8 text-center text-gray-500 border-dashed">
                                <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No rate plans for this room type</p>
                                <Link href={`/admin/rooms/rate-plans/new?roomTypeId=${roomType.id}`} className="mt-2 inline-block">
                                    <Button variant="outline" size="sm">Create Rate Plan</Button>
                                </Link>
                            </Card>
                        )}
                    </div>
                ))}
            </div>

            {/* Rate Plan Types Info */}
            <Card className="p-6 bg-gray-50">
                <h3 className="font-semibold mb-4">Rate Plan Types Guide</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                        <div className="font-medium text-blue-700 mb-1">Best Available Rate (BAR)</div>
                        <p className="text-gray-600">Standard flexible rate with moderate cancellation</p>
                    </div>
                    <div>
                        <div className="font-medium text-green-700 mb-1">Non-Refundable</div>
                        <p className="text-gray-600">Discounted rate, full prepayment required</p>
                    </div>
                    <div>
                        <div className="font-medium text-amber-700 mb-1">Package Rates</div>
                        <p className="text-gray-600">Room + inclusions (breakfast, spa, etc.)</p>
                    </div>
                    <div>
                        <div className="font-medium text-purple-700 mb-1">Corporate/Contract</div>
                        <p className="text-gray-600">Negotiated rates for companies</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
