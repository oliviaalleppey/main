'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { formatRoomName } from '@/lib/utils';
import { updateSessionRoom } from '@/app/book/actions';
import { Loader2, Check, User, Info, Tag } from 'lucide-react';

interface CheckoutRoomListProps {
    rooms: any[];
    selectedRoomTypeId: string;
    errorMessage?: string;
}

export function CheckoutRoomList({ rooms, selectedRoomTypeId, errorMessage }: CheckoutRoomListProps) {
    if (errorMessage) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 relative">
                <button className="absolute top-2 right-2 text-red-400 hover:text-red-600 transition-colors">
                    <span className="sr-only">Dismiss</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <div className="text-sm text-red-800 pr-6 space-y-1">
                    <p>{errorMessage}</p>
                    <p className="font-semibold mt-2">Inventory search fail.</p>
                </div>
            </div>
        );
    }

    if (!rooms.length) {
        return (
            <div className="text-center py-8">
                <p className="text-sm text-gray-500 font-medium">No rooms available for these dates.</p>
                <p className="text-xs text-gray-400 mt-1">Please go back to Step 1 and try different dates.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {rooms.map((result) => (
                <CheckoutRoomCard 
                    key={result.roomType.id} 
                    result={result} 
                    isSelected={result.roomType.id === selectedRoomTypeId} 
                />
            ))}
        </div>
    );
}

function CheckoutRoomCard({ result, isSelected }: { result: any, isSelected: boolean }) {
    const [isPending, startTransition] = useTransition();
    const [selectingRateId, setSelectingRateId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'Rates' | 'Amenities' | 'Photos'>('Rates');

    const handleSelect = (ratePlanId: string, quoteSnapshot?: any) => {
        setSelectingRateId(ratePlanId);
        startTransition(async () => {
            const res = await updateSessionRoom(result.roomType.id, 1, ratePlanId, quoteSnapshot);
            if (!res.success) {
                alert(res.message || 'Failed to select room');
            } else {
                window.dispatchEvent(new CustomEvent('room-selected'));
            }
            setSelectingRateId(null);
        });
    };

    const bestRatePlan = result.ratePlans.length
        ? [...result.ratePlans].sort((a: any, b: any) => a.amount - b.amount)[0]
        : null;

    const basePrice = bestRatePlan ? bestRatePlan.amount / 100 : 0;
    const taxes = bestRatePlan?.tax ? bestRatePlan.tax / 100 : basePrice * ((result.roomType.taxRate || 12) / 100);
    const total = basePrice + taxes;

    return (
        <div className={`flex flex-col bg-[#F5F5F5] transition-all duration-300 ${isSelected ? 'ring-2 ring-[var(--text-dark)]' : ''}`}>
            
            {/* Top Block */}
            <div className="flex flex-col lg:flex-row p-4 gap-6">
                {/* Image */}
                <div className="relative w-full lg:w-[320px] h-[200px] shrink-0 rounded-sm overflow-hidden bg-gray-200">
                    {result.roomType.images?.[0] ? (
                        <Image src={result.roomType.images[0]} alt={result.roomType.name} fill className="object-cover" />
                    ) : null}
                    {!result.bookable && (
                        <div className="absolute top-3 right-3 bg-red-100 text-red-700 text-[11px] font-bold px-2 py-1 rounded-sm">
                            Sold Out
                        </div>
                    )}
                    {result.bookable && result.availableRooms <= 3 && (
                        <div className="absolute top-3 right-3 bg-red-100 text-red-700 text-[11px] font-bold px-2 py-1 rounded-sm">
                            In high demand! Only {result.availableRooms} room{result.availableRooms > 1 ? 's' : ''} left
                        </div>
                    )}
                    {isSelected && (
                        <div className="absolute top-3 left-3 bg-[var(--text-dark)] text-white text-[11px] font-bold px-2 py-1 rounded-sm flex items-center gap-1">
                            <Check className="w-3 h-3" /> Selected
                        </div>
                    )}
                </div>

                {/* Center Content */}
                <div className="flex-1 flex flex-col">
                    <h3 className="text-xl font-medium text-gray-900">{formatRoomName(result.roomType.name)}</h3>
                    
                    <div className="flex items-center gap-1 mt-3 text-gray-600">
                        {Array.from({ length: result.roomType.maxGuests }).map((_, i) => (
                            <User key={i} className="w-4 h-4" />
                        ))}
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-semibold">Room Size:</span> 
                        <span>{result.roomType.size} {result.roomType.sizeUnit}</span>
                    </div>
                </div>

                {/* Right Price Block */}
                {bestRatePlan && (
                    <div className="flex flex-col items-start lg:items-end justify-start min-w-[200px]">
                        <div className="flex items-baseline gap-1">
                            <span className="text-xs text-gray-500">From</span>
                            <span className="text-2xl font-bold text-gray-900">₹{basePrice.toLocaleString('en-IN')}</span>
                            <span className="text-xs text-gray-500">INR/ Night</span>
                        </div>
                        <p className="text-[11px] text-emerald-600 mt-1">Plus ₹{taxes.toLocaleString('en-IN', { minimumFractionDigits: 2 })} In Taxes & Fees/Night</p>
                        <p className="text-xs text-gray-600 mt-2 text-right">
                            Total <span className="font-semibold">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span> for 1 Night including taxes & fees
                        </p>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex w-full border-y border-gray-200 bg-[#F9F9F9]">
                {['Rates', 'Amenities', 'Photos'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`flex-1 py-3 text-sm transition-all ${
                            activeTab === tab 
                            ? 'bg-white font-semibold text-gray-900 border-t-2 border-t-black' 
                            : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 border-t-2 border-t-transparent'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white p-4 lg:p-6 min-h-[200px]">
                {activeTab === 'Rates' && (
                    <div className="space-y-6">
                        {result.ratePlans.length === 0 ? (
                            <p className="text-sm text-gray-500">No rate plans available for this room.</p>
                        ) : (
                            result.ratePlans.map((plan: any) => {
                                const pBase = plan.amount / 100;
                                const pTaxes = plan.tax ? plan.tax / 100 : pBase * ((result.roomType.taxRate || 12) / 100);
                                const pTotal = pBase + pTaxes;

                                return (
                                    <div key={plan.id} className="flex flex-col lg:flex-row justify-between gap-6 pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <h4 className="font-bold text-gray-900">{plan.name}</h4>
                                                {plan.isDefault && (
                                                    <span className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1">
                                                        <Tag className="w-3 h-3" /> Best Available Rate
                                                    </span>
                                                )}
                                                {plan.basePriceModifier && plan.basePriceModifier < 100 && (
                                                    <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                                                        <Tag className="w-3 h-3" /> {100 - plan.basePriceModifier}% Off On Room Price
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <ul className="mt-4 space-y-2">
                                                {plan.inclusions?.slice(0, 4).map((inc: string, i: number) => (
                                                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Check className="w-4 h-4 text-emerald-600 shrink-0" /> {inc}
                                                    </li>
                                                ))}
                                                {plan.inclusions && plan.inclusions.length > 4 && (
                                                    <li className="text-xs text-gray-500 underline cursor-pointer mt-2">+ {plan.inclusions.length - 4} More</li>
                                                )}
                                            </ul>
                                        </div>

                                        <div className="flex flex-col items-start lg:items-end justify-start min-w-[200px]">
                                            <div className="flex items-baseline gap-1">
                                                {plan.originalBasePrice && plan.basePriceModifier && plan.basePriceModifier < 100 && (
                                                    <span className="text-sm text-gray-400 line-through mr-1">
                                                        ₹{plan.originalBasePrice.toLocaleString('en-IN')}
                                                    </span>
                                                )}
                                                <span className="text-xl font-bold text-gray-900">₹{pBase.toLocaleString('en-IN')}</span>
                                                <span className="text-[10px] text-gray-500">INR/ Night</span>
                                            </div>
                                            <p className="text-[10px] text-emerald-600 mt-1">Plus ₹{pTaxes.toLocaleString('en-IN', { minimumFractionDigits: 2 })} In Taxes & Fees/Night</p>
                                            
                                            <button
                                                onClick={() => handleSelect(plan.id, {
                                                    pricePerNight: plan.amount,
                                                    totalPrice: plan.amount,
                                                    taxesAndFees: plan.tax || Math.round(plan.amount * ((result.roomType.taxRate || 12) / 100)),
                                                })}
                                                disabled={isPending || !result.bookable}
                                                className={`mt-4 w-full lg:w-32 px-4 py-2.5 flex justify-center items-center text-sm font-semibold transition-all ${
                                                    !result.bookable ? 'bg-gray-200 text-gray-500 cursor-not-allowed' :
                                                    'bg-[var(--text-dark)] text-white hover:bg-black'
                                                }`}
                                            >
                                                {selectingRateId === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Select'}
                                            </button>
                                            
                                            <p className="text-[11px] text-gray-600 mt-2 text-right">
                                                Total <span className="font-bold">₹{pTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span> for 1 Night including taxes & fees
                                            </p>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                )}

                {activeTab === 'Amenities' && (
                    <div className="text-sm text-gray-600 leading-relaxed">
                        <p className="mb-6">{result.roomType.description || result.roomType.shortDescription}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                            {result.roomType.amenities?.map((amenity: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-[var(--text-dark)] shrink-0 mt-0.5" />
                                    <span>{amenity}</span>
                                </div>
                            ))}
                            {(!result.roomType.amenities || result.roomType.amenities.length === 0) && (
                                <p className="text-gray-400 italic">No amenities explicitly listed.</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'Photos' && (
                    <div>
                        {result.roomType.images && result.roomType.images.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {result.roomType.images.map((img: string, idx: number) => (
                                    <div key={idx} className="relative w-full aspect-video bg-gray-100 rounded-sm overflow-hidden">
                                        <Image src={img} alt={`${result.roomType.name} photo ${idx + 1}`} fill className="object-cover" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 py-8 text-center bg-gray-50 rounded-md border border-dashed border-gray-200">
                                No additional photos available.
                            </p>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
}
