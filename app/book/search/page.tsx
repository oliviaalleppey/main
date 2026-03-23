import Image from 'next/image';
import Link from 'next/link';
import {
    ArrowUpDown,
    Ban,
    BedDouble,
    Calendar,
    Coffee,
    MoveRight,
    ShieldCheck,
    Sparkles,
    Star,
    Tag,
    Users,
} from 'lucide-react';
import { getAvailableRoomsForSearch, type SearchResult } from '@/lib/services/search';
import { BookingButton } from '@/components/booking/booking-button';
import { SearchStayEditor } from '@/components/booking/search-stay-editor';
import { formatRoomName } from '@/lib/utils';

type SortKey = 'recommended' | 'price-asc' | 'size-desc';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'recommended', label: 'Recommended' },
    { key: 'price-asc', label: 'Lowest Price' },
    { key: 'size-desc', label: 'Largest Room' },
];

const MEAL_PLAN_LABELS: Record<string, string> = {
    EP: 'Room only',
    CP: 'Breakfast included',
    MAP: 'Breakfast & dinner',
    AP: 'All meals included',
};

const formatCurrency = (amountInPaise: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amountInPaise / 100);
};

interface SearchPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const sp = await searchParams;
    const getParam = (key: string): string => {
        const val = sp[key];
        if (Array.isArray(val)) return val[0];
        return val || '';
    };

    const checkInParam = getParam('checkIn');
    const checkOutParam = getParam('checkOut');
    const adultsParam = getParam('adults') || '1';
    const childrenParam = getParam('children') || '0';
    const roomsParam = getParam('rooms') || '1';
    const roomParam = getParam('room');
    const requestedSort = getParam('sort');
    const sortKey = SORT_OPTIONS.some((option) => option.key === requestedSort)
        ? (requestedSort as SortKey)
        : 'recommended';

    const adults = Number.parseInt(adultsParam, 10);
    const children = Number.parseInt(childrenParam, 10);
    const requestedRooms = Number.parseInt(roomsParam, 10);
    const safeAdults = Number.isFinite(adults) && adults > 0 ? adults : 1;
    const safeChildren = Number.isFinite(children) && children >= 0 ? children : 0;
    const safeRooms = Number.isFinite(requestedRooms) && requestedRooms > 0 ? Math.min(8, requestedRooms) : 1;
    const checkInDate = checkInParam ? new Date(checkInParam) : new Date();
    const checkOutDate = checkOutParam ? new Date(checkOutParam) : new Date(new Date().setDate(new Date().getDate() + 1));
    const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));
    const isValidDates = !isNaN(checkInDate.getTime()) && !isNaN(checkOutDate.getTime()) && checkOutDate > checkInDate;

    let rooms: SearchResult[] = [];
    let searchError: string | undefined;
    if (isValidDates) {
        try {
            const payload = await getAvailableRoomsForSearch(
                checkInDate,
                checkOutDate,
                { adults: safeAdults, children: safeChildren },
                safeRooms,
            );
            rooms = payload.rooms;
            searchError = payload.error;
        } catch (error) {
            console.error('Failed to fetch rooms', error);
        }
    }

    const roomFiltered = roomParam
        ? rooms.filter((result) => result.roomType.slug === roomParam)
        : rooms;

    const formatDate = (date: Date) => date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const formatDateWithWeekday = (date: Date) => date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', weekday: 'short' });
    const providerUnavailable = isValidDates && roomFiltered.length > 0 && roomFiltered.every((room) => !room.bookable);
    const sortedRooms = [...roomFiltered].sort((a, b) => {
        switch (sortKey) {
            case 'price-asc':
                return a.price - b.price;
            case 'size-desc':
                return (b.roomType.size || 0) - (a.roomType.size || 0) || a.price - b.price;
            case 'recommended':
            default:
                if (a.bookable !== b.bookable) {
                    return a.bookable ? -1 : 1;
                }
                const aSort = a.roomType.sortOrder ?? 0;
                const bSort = b.roomType.sortOrder ?? 0;
                if (aSort !== bSort) return aSort - bSort;
                return a.price - b.price;
        }
    });

    const buildSortHref = (nextSort: SortKey) => {
        const params = new URLSearchParams();
        if (checkInParam) params.set('checkIn', checkInParam);
        if (checkOutParam) params.set('checkOut', checkOutParam);
        params.set('adults', safeAdults.toString());
        params.set('children', safeChildren.toString());
        params.set('rooms', safeRooms.toString());
        if (roomParam) params.set('room', roomParam);
        params.set('sort', nextSort);
        return `/book/search?${params.toString()}`;
    };

    return (
        <div className="min-h-screen bg-[#F4F5F0] pb-12 md:pb-20">
            <div className="border-b border-[#E4E8DD] bg-gradient-to-b from-[#FAFAF5] via-[#F7F8F2] to-[#F4F5F0]">
                <div className="max-w-[1400px] mx-auto px-3 md:px-6 py-4 md:py-10">
                    <SearchStayEditor
                        initialCheckIn={checkInDate}
                        initialCheckOut={checkOutDate}
                        initialAdults={safeAdults}
                        initialChildren={safeChildren}
                        initialRooms={safeRooms}
                    />
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-3 md:px-6 py-4 md:py-10">
                <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-3 md:gap-5 mb-4 md:mb-7">
                    <div>
                        <h2 className="text-[24px] md:text-[30px] leading-tight font-serif text-[#1C2822]">
                            {isValidDates ? `${sortedRooms.length} Room Type${sortedRooms.length === 1 ? '' : 's'} Available` : 'Please select valid dates'}
                        </h2>
                        <p className="text-xs md:text-sm text-gray-600 mt-1 md:mt-2">
                            Compare room size, occupancy, meal plan, cancellation and live pricing before you continue.
                        </p>
                    </div>
                    {isValidDates && sortedRooms.length > 1 && (
                        <div className="rounded-xl md:rounded-2xl border border-[#DCE2D1] bg-white p-2 md:p-4">
                            <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                                <span className="inline-flex items-center gap-1 text-[11px] md:text-xs uppercase tracking-[0.18em] md:tracking-[0.2em] text-gray-500 pr-1">
                                    <ArrowUpDown className="w-3.5 h-3.5" />
                                    Sort
                                </span>
                                {SORT_OPTIONS.map((option) => {
                                    const active = option.key === sortKey;
                                    return (
                                        <Link
                                            key={option.key}
                                            href={buildSortHref(option.key)}
                                            className={`rounded-full px-2.5 py-1 md:px-3 md:py-1.5 text-[11px] md:text-xs font-semibold transition-colors ${active
                                                ? 'bg-[#1F2A24] text-white'
                                                : 'bg-[#F3F4EF] text-[#465248] hover:bg-[#EAEDE2]'
                                                }`}
                                        >
                                            {option.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {searchError && (
                    <div className="mb-4 md:mb-7 rounded-xl md:rounded-2xl border border-red-200 bg-red-50 p-4 relative">
                        <div className="text-sm text-red-800 pr-6 space-y-1">
                            <p>{searchError}</p>
                            <p className="font-semibold mt-2">Inventory search fail.</p>
                        </div>
                    </div>
                )}

                {providerUnavailable && (
                    <div className="mb-4 md:mb-7 rounded-xl md:rounded-2xl border border-amber-200 bg-amber-50 px-3 md:px-4 py-2.5 md:py-3 text-amber-900">
                        <p className="text-sm font-semibold">Live booking is temporarily unavailable</p>
                        <p className="text-xs mt-1">
                            You can still compare room options below. Contact reservations for immediate assistance.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:gap-4">
                    {sortedRooms.map((result, index) => {
                        const roomName = formatRoomName(result.roomType.name);
                        const bestRatePlan = result.ratePlans.length
                            ? [...result.ratePlans].sort((a, b) => a.amount - b.amount)[0]
                            : undefined;
                        const cancellationPolicy = bestRatePlan?.cancellationPolicy || 'Policy shared at checkout';
                        const mealPlan = bestRatePlan?.mealPlan
                            ? (MEAL_PLAN_LABELS[bestRatePlan.mealPlan] || bestRatePlan.mealPlan)
                            : 'Room only';
                        const inclusions = bestRatePlan?.inclusions?.slice(0, 3) || [];
                        const roomSizeLabel = result.roomType.size
                            ? `${result.roomType.size} ${result.roomType.sizeUnit}`
                            : 'Size on request';
                        const maxSelectableRooms = Math.max(1, result.availableRooms);
                        const defaultRoomCount = Math.min(maxSelectableRooms, safeRooms);

                        return (
                            <div
                                key={result.roomType.id}
                                className="group overflow-hidden rounded-2xl md:rounded-3xl border border-[#DFE4D8] bg-white shadow-[0_14px_34px_-30px_rgba(15,23,42,0.5)] transition-all duration-300 hover:shadow-[0_18px_34px_-24px_rgba(15,23,42,0.45)] hover:-translate-y-1"
                            >
                                <div className="flex flex-col xl:flex-row">
                                    <div className="relative h-[180px] md:h-[220px] w-full overflow-hidden bg-gray-50 xl:h-auto xl:w-[340px]">
                                        {result.roomType.images && result.roomType.images.length > 0 ? (
                                            <Image
                                                src={result.roomType.images[0]}
                                                alt={roomName}
                                                fill
                                                className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center bg-[#F7F8F3] text-gray-400">
                                                <Image src="/logo-icon.png" alt="Logo" width={40} height={40} className="opacity-20" />
                                            </div>
                                        )}
                                        
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        <div className="absolute left-0 top-4 flex flex-col gap-2">
                                            {sortKey === 'recommended' && index === 0 && (
                                                <div className="bg-[#1C2822] text-white px-4 py-1.5 rounded-r-full flex items-center gap-2 shadow-lg transform -translate-x-1 group-hover:translate-x-0 transition-transform duration-500">
                                                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                                    <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Top Pick</span>
                                                </div>
                                            )}
                                            {result.bookable && result.availableRooms <= 3 && (
                                                <div className="bg-[#E95D20] text-white px-4 py-1.5 rounded-r-full flex items-center gap-2 shadow-lg transform -translate-x-1 group-hover:translate-x-0 transition-transform duration-500 delay-75">
                                                    <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Only {result.availableRooms} Left</span>
                                                </div>
                                            )}
                                        </div>

                                        {!result.bookable && (
                                            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
                                                <div className="bg-white/90 shadow-xl rounded-2xl p-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                                    <Ban className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                                                    <span className="text-[10px] uppercase font-bold tracking-[0.1em] text-gray-900 leading-tight block">Room Temporarily<br/>Unavailable</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                        <div className="flex-1 p-4 md:p-6 lg:p-7">
                                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                                                <div className="min-w-0 flex-1 flex flex-col justify-center">
                                                <div className="mb-3 flex items-start justify-between gap-4">
                                                    <div>
                                                        <h3 className="text-[28px] md:text-[38px] leading-[1.1] font-serif text-[#1C2822] mb-1">{roomName}</h3>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex text-amber-500">
                                                                {[...Array(5)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-current" />)}
                                                            </div>
                                                            <span className="text-[9px] uppercase font-bold tracking-[0.1em] text-gray-400">Excellent 5.0</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <p className="max-w-xl text-sm text-gray-500 leading-relaxed mb-6 line-clamp-2">
                                                    {result.roomType.description}
                                                </p>

                                                <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2 border-t border-gray-100 pt-5">
                                                    <div className="flex items-start gap-2.5">
                                                        <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-[#1C2822]/5 flex items-center justify-center">
                                                            <Users className="w-3.5 h-3.5 text-[#1C2822]" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[8px] uppercase tracking-[0.15em] text-gray-400 font-bold mb-0.5">Occupancy</p>
                                                            <p className="text-[11px] font-semibold text-[#1C2822]">{result.roomType.maxGuests} Guests</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-2.5">
                                                        <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-[#1C2822]/5 flex items-center justify-center">
                                                            <BedDouble className="w-3.5 h-3.5 text-[#1C2822]" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[8px] uppercase tracking-[0.15em] text-gray-400 font-bold mb-0.5">Area</p>
                                                            <p className="text-[11px] font-semibold text-[#1C2822]">{roomSizeLabel}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-2.5">
                                                        <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-[#1C2822]/5 flex items-center justify-center">
                                                            <Coffee className="w-3.5 h-3.5 text-[#1C2822]" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[8px] uppercase tracking-[0.15em] text-gray-400 font-bold mb-0.5">Board</p>
                                                            <p className="text-[11px] font-semibold text-[#1C2822]">{mealPlan}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-2.5">
                                                        <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-[#1C2822]/5 flex items-center justify-center text-gray-500">
                                                            <Calendar className="w-3.5 h-3.5 text-[#1C2822]" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[8px] uppercase tracking-[0.15em] text-gray-400 font-bold mb-0.5">Policy</p>
                                                            <p className="text-[11px] font-semibold text-[#1C2822]">{cancellationPolicy.includes('checkout') ? 'Flexible' : cancellationPolicy}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="h-px bg-gray-100 mt-4 mb-5" />

                                                <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                                                    {bestRatePlan?.name && (
                                                        <span className="inline-flex items-center gap-1 rounded-full border border-[#146B43]/20 bg-[#146B43]/5 px-2 py-0.5 md:px-2.5 md:py-1 text-[11px] md:text-xs font-semibold text-[#146B43]">
                                                            <Tag className="w-3 h-3" />
                                                            {bestRatePlan.name}
                                                        </span>
                                                    )}
                                                    {inclusions.slice(0, 2).map((item: string) => (
                                                        <span
                                                            key={item}
                                                            className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 md:px-2.5 md:py-1 text-[11px] md:text-xs font-medium text-gray-600"
                                                        >
                                                            {item}
                                                        </span>
                                                    ))}
                                                    {result.roomType.amenities?.slice(0, 1).map((item: string) => (
                                                        <span
                                                            key={item}
                                                            className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 md:px-2.5 md:py-1 text-[11px] md:text-xs font-medium text-gray-500"
                                                        >
                                                            {item}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="w-full lg:w-[250px] shrink-0 rounded-[28px] border border-[#DCE2D2] bg-[#F9FAF6] p-5 md:p-6 flex flex-col justify-between">
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#8A8F82] font-bold mb-2">STARTING FROM</p>
                                                    <div className="flex items-baseline gap-1.5 mb-3">
                                                        <span className="text-[34px] font-sans font-bold tracking-tight text-[#1C2822]">{formatCurrency(result.price)}</span>
                                                        <span className="text-[13px] text-[#8A8F82] font-semibold">/ night</span>
                                                    </div>
                                                    
                                                    <div className="space-y-1.5 mb-5 pt-0.5">
                                                        <div className="flex justify-between items-center text-[12px] font-semibold text-[#5C6156]">
                                                            <span>Stay total (per room):</span>
                                                            <span className="text-[#1C2822]">{formatCurrency(result.totalPrice)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-3">
                                                    <Link
                                                        href={`/rooms/${result.roomType.slug}`}
                                                        className="inline-flex items-center justify-center rounded-xl border border-[#DCE2D2] px-6 h-12 text-[13px] font-bold text-[#1C2822] transition-all hover:bg-white hover:border-[#1C2822]"
                                                    >
                                                        View Room
                                                    </Link>
                                                    <BookingButton
                                                        roomId={result.roomType.slug}
                                                        searchParams={{
                                                            checkIn: checkInDate.toISOString().split('T')[0],
                                                            checkOut: checkOutDate.toISOString().split('T')[0],
                                                            adults: safeAdults,
                                                            children: safeChildren,
                                                        }}
                                                        quoteSnapshot={{
                                                            pricePerNight: result.price,
                                                            totalPrice: result.totalPrice,
                                                            taxesAndFees: result.taxesAndFees,
                                                            externalRatePlanId: bestRatePlan?.id,
                                                        }}
                                                        maxRooms={maxSelectableRooms}
                                                        defaultRoomCount={defaultRoomCount}
                                                        disabled={!result.bookable}
                                                        disabledLabel="Unavailable"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                {isValidDates && sortedRooms.length === 0 && (
                        <div className="rounded-2xl md:rounded-3xl border border-[#DCE2D2] bg-white p-5 md:p-10 text-center">
                            <h3 className="mb-2 text-xl md:text-2xl font-serif text-[#1C1C1C]">No rooms available for selected dates</h3>
                            <p className="mb-4 md:mb-6 text-sm text-gray-500">Try shifting your stay by 1-2 days or reducing guest count for better availability.</p>
                            <Link
                                href="/rooms"
                                className="inline-flex items-center gap-2 rounded-md bg-[#1C1C1C] px-5 md:px-6 py-2.5 md:py-3 text-sm text-white transition-colors hover:bg-[#333]"
                            >
                                Explore Room Types
                                <MoveRight className="w-4 h-4" />
                            </Link>
                        </div>
                    )}
                </div>

                {isValidDates && sortedRooms.length > 0 && (
                    <div className="mt-5 md:mt-9 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 md:px-4 py-2.5 md:py-3 text-emerald-900">
                        <ShieldCheck className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p className="text-xs md:text-sm leading-relaxed">
                            Rates are re-validated before payment. If inventory changes during checkout, you will see updated pricing before final confirmation.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
