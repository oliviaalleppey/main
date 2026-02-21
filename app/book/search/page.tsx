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

type SortKey = 'recommended' | 'price-asc' | 'size-desc' | 'guests-desc';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'recommended', label: 'Recommended' },
    { key: 'price-asc', label: 'Lowest Price' },
    { key: 'size-desc', label: 'Largest Room' },
    { key: 'guests-desc', label: 'Max Guests' },
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
    if (isValidDates) {
        try {
            rooms = await getAvailableRoomsForSearch(
                checkInDate,
                checkOutDate,
                { adults: safeAdults, children: safeChildren },
                safeRooms,
            );
        } catch (error) {
            console.error('Failed to fetch rooms', error);
        }
    }

    const formatDate = (date: Date) => date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const formatDateWithWeekday = (date: Date) => date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', weekday: 'short' });
    const providerUnavailable = isValidDates && rooms.length > 0 && rooms.every((room) => !room.bookable);
    const sortedRooms = [...rooms].sort((a, b) => {
        switch (sortKey) {
            case 'price-asc':
                return a.price - b.price;
            case 'size-desc':
                return (b.roomType.size || 0) - (a.roomType.size || 0) || a.price - b.price;
            case 'guests-desc':
                return b.roomType.maxGuests - a.roomType.maxGuests || a.price - b.price;
            case 'recommended':
            default:
                if (a.bookable !== b.bookable) {
                    return a.bookable ? -1 : 1;
                }
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
        params.set('sort', nextSort);
        return `/book/search?${params.toString()}`;
    };

    return (
        <div className="min-h-screen bg-[#F4F5F0] pb-12 md:pb-20">
            <div className="border-b border-[#E4E8DD] bg-gradient-to-b from-[#FAFAF5] via-[#F7F8F2] to-[#F4F5F0]">
                <div className="max-w-[1400px] mx-auto px-3 md:px-6 py-4 md:py-10">
                    <div className="rounded-2xl md:rounded-3xl border border-[#D8DEC9] bg-white/95 p-3 md:p-8 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.5)]">
                        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 md:gap-6">
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.24em] md:tracking-[0.3em] text-gray-500 mb-1 md:mb-2">Stay Summary</p>
                                <h1 className="text-2xl md:text-4xl font-serif text-[#1D2B25] leading-tight">
                                    {isValidDates ? (
                                        <>
                                            {formatDate(checkInDate)}
                                            <span className="text-[#8A968A] font-sans text-xl md:text-2xl mx-2 md:mx-3">to</span>
                                            {formatDate(checkOutDate)}
                                        </>
                                    ) : (
                                        'Select valid travel dates'
                                    )}
                                </h1>
                                {isValidDates && (
                                    <p className="mt-1.5 md:mt-3 text-xs md:text-sm text-gray-600">
                                        {nights} night{nights > 1 ? 's' : ''} • {formatDateWithWeekday(checkInDate)} to {formatDateWithWeekday(checkOutDate)}
                                    </p>
                                )}
                                <div className="mt-2 md:mt-4 flex flex-wrap items-center gap-1.5 md:gap-2">
                                    <span className="inline-flex items-center rounded-full border border-[#CFD7C3] bg-[#F6F8EF] px-2.5 py-0.5 md:px-3 md:py-1 text-[11px] md:text-xs font-medium text-[#2D3D34]">
                                        {safeAdults} adult{safeAdults > 1 ? 's' : ''}, {safeChildren} child{safeChildren !== 1 ? 'ren' : ''}
                                    </span>
                                    <span className="inline-flex items-center rounded-full border border-[#CFD7C3] bg-[#F6F8EF] px-2.5 py-0.5 md:px-3 md:py-1 text-[11px] md:text-xs font-medium text-[#2D3D34]">
                                        {safeRooms} room{safeRooms > 1 ? 's' : ''} selected
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 md:px-3 md:py-1 text-[11px] md:text-xs font-medium text-emerald-800">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        Live rates enabled
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
                                <Link
                                    href="/"
                                    className="inline-flex items-center justify-center rounded-xl border border-[#CDD5C1] bg-white px-4 py-2.5 text-sm font-medium text-[#223128] hover:bg-[#F6F8F1] transition-colors"
                                >
                                    Change Dates
                                </Link>
                                <Link
                                    href="/rooms"
                                    className="inline-flex items-center justify-center rounded-xl bg-[#1F2A24] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2A362F] transition-colors"
                                >
                                    View All Room Types
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-3 md:px-6 py-4 md:py-10">
                <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-3 md:gap-5 mb-4 md:mb-7">
                    <div>
                        <h2 className="text-[24px] md:text-[30px] leading-tight font-serif text-[#1C2822]">
                            {isValidDates ? `${rooms.length} Room Types Available` : 'Please select valid dates'}
                        </h2>
                        <p className="text-xs md:text-sm text-gray-600 mt-1 md:mt-2">
                            Compare room size, occupancy, meal plan, cancellation and live pricing before you continue.
                        </p>
                    </div>
                    {isValidDates && (
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

                {providerUnavailable && (
                    <div className="mb-4 md:mb-7 rounded-xl md:rounded-2xl border border-amber-200 bg-amber-50 px-3 md:px-4 py-2.5 md:py-3 text-amber-900">
                        <p className="text-sm font-semibold">Live booking is temporarily unavailable</p>
                        <p className="text-xs mt-1">
                            You can still compare room options below. Contact reservations for immediate assistance.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:gap-7">
                    {sortedRooms.map((result, index) => {
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
                        const maxSelectableRooms = Math.max(1, Math.min(result.availableRooms, safeAdults));
                        const defaultRoomCount = Math.min(maxSelectableRooms, safeRooms);

                        return (
                            <div
                                key={result.roomType.id}
                                className="group overflow-hidden rounded-2xl md:rounded-3xl border border-[#DFE4D8] bg-white shadow-[0_16px_45px_-35px_rgba(15,23,42,0.6)] transition-all duration-300 hover:shadow-[0_20px_45px_-28px_rgba(15,23,42,0.55)]"
                            >
                                <div className="flex flex-col xl:flex-row">
                                    <div className="relative h-[170px] md:h-[280px] w-full overflow-hidden bg-gray-100 xl:h-auto xl:w-[390px]">
                                        {result.roomType.images && result.roomType.images.length > 0 ? (
                                            <Image
                                                src={result.roomType.images[0]}
                                                alt={result.roomType.name}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-gray-400">No Image</div>
                                        )}

                                        <div className="absolute left-3 md:left-4 top-3 md:top-4 flex flex-wrap gap-1.5 md:gap-2">
                                            {sortKey === 'recommended' && index === 0 && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 md:px-3 md:py-1 text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-white shadow-sm">
                                                    <Sparkles className="w-3 h-3" />
                                                    Top Pick
                                                </span>
                                            )}
                                            {result.bookable && result.availableRooms <= 3 && (
                                                <span className="rounded-full bg-[#E95D20] px-2.5 py-0.5 md:px-3 md:py-1 text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-white shadow-sm">
                                                    Only {result.availableRooms} left
                                                </span>
                                            )}
                                            {!result.bookable && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-900/80 px-2.5 py-0.5 md:px-3 md:py-1 text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-white shadow-sm">
                                                    <Ban className="w-3 h-3" />
                                                    Unavailable
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 p-3 md:p-8">
                                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 md:gap-5">
                                            <div className="min-w-0 flex-1">
                                                <div className="mb-2 md:mb-3 flex items-start justify-between gap-3 md:gap-4">
                                                    <h3 className="text-[30px] md:text-[38px] leading-none font-serif text-[#1F2A24]">{result.roomType.name}</h3>
                                                    <div className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 md:px-2.5 md:py-1 text-[#E95D20]">
                                                        <Star className="h-3.5 w-3.5 fill-current" />
                                                        <span className="text-xs font-bold">5.0</span>
                                                    </div>
                                                </div>

                                                <p className="max-w-3xl text-sm md:text-base text-gray-600 leading-relaxed mb-3 md:mb-5 line-clamp-2">
                                                    {result.roomType.description}
                                                </p>

                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mb-3 md:mb-5">
                                                    <div className="rounded-lg md:rounded-xl border border-[#DEE4D8] bg-[#F7F8F3] px-2.5 md:px-3 py-2 md:py-2.5">
                                                        <p className="mb-1 text-[11px] uppercase tracking-wide text-gray-500">Guests</p>
                                                        <p className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-gray-900">
                                                            <Users className="w-3.5 h-3.5 text-gray-500" />
                                                            Up to {result.roomType.maxGuests}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-lg md:rounded-xl border border-[#DEE4D8] bg-[#F7F8F3] px-2.5 md:px-3 py-2 md:py-2.5">
                                                        <p className="mb-1 text-[11px] uppercase tracking-wide text-gray-500">Room Size</p>
                                                        <p className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-gray-900">
                                                            <BedDouble className="w-3.5 h-3.5 text-gray-500" />
                                                            {roomSizeLabel}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-lg md:rounded-xl border border-[#DEE4D8] bg-[#F7F8F3] px-2.5 md:px-3 py-2 md:py-2.5">
                                                        <p className="mb-1 text-[11px] uppercase tracking-wide text-gray-500">Meal Plan</p>
                                                        <p className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-gray-900">
                                                            <Coffee className="w-3.5 h-3.5 text-gray-500" />
                                                            {mealPlan}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-lg md:rounded-xl border border-[#DEE4D8] bg-[#F7F8F3] px-2.5 md:px-3 py-2 md:py-2.5">
                                                        <p className="mb-1 text-[11px] uppercase tracking-wide text-gray-500">Cancellation</p>
                                                        <p className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-gray-900 line-clamp-2">
                                                            <Calendar className="w-3.5 h-3.5 text-gray-500" />
                                                            {cancellationPolicy}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                                                    {bestRatePlan?.name && (
                                                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 md:px-2.5 md:py-1 text-[11px] md:text-xs font-medium text-blue-700">
                                                            <Tag className="w-3 h-3" />
                                                            {bestRatePlan.name}
                                                        </span>
                                                    )}
                                                    {inclusions.map((item: string) => (
                                                        <span
                                                            key={item}
                                                            className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 md:px-2.5 md:py-1 text-[11px] md:text-xs font-medium text-gray-600"
                                                        >
                                                            {item}
                                                        </span>
                                                    ))}
                                                    {result.roomType.amenities?.slice(0, 2).map((item: string) => (
                                                        <span
                                                            key={item}
                                                            className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 md:px-2.5 md:py-1 text-[11px] md:text-xs font-medium text-gray-500"
                                                        >
                                                            {item}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="w-full lg:w-[255px] shrink-0 rounded-xl lg:rounded-2xl border border-[#DCE2D2] bg-[#F9FAF6] p-3 md:p-4 lg:p-5">
                                                <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 mb-1">Starting from</p>
                                                <div className="text-2xl md:text-3xl font-serif text-[#1C2822]">
                                                    {formatCurrency(result.price)}
                                                    <span className="ml-1 text-sm font-sans font-normal text-gray-500">/ night</span>
                                                </div>
                                                <p className="mt-2 text-xs text-gray-500">
                                                    Stay total (per room): {formatCurrency(result.totalPrice)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Taxes & fees (per room): {formatCurrency(result.taxesAndFees)}
                                                </p>
                                                <p className={`mt-3 text-xs font-medium ${result.bookable ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                    {result.bookable
                                                        ? 'Instant confirmation after payment verification'
                                                        : (result.availabilityMessage || 'Live booking unavailable')}
                                                </p>
                                                <div className="mt-4 flex flex-col gap-2.5">
                                                    <Link
                                                        href={`/rooms/${result.roomType.slug}`}
                                                        className="inline-flex items-center justify-center rounded-md md:rounded-lg border border-gray-300 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                                                    >
                                                        View Room
                                                    </Link>
                                                    <BookingButton
                                                        roomId={result.roomType.slug}
                                                        searchParams={{
                                                            checkIn: checkInDate.toISOString(),
                                                            checkOut: checkOutDate.toISOString(),
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

                    {isValidDates && rooms.length === 0 && (
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
