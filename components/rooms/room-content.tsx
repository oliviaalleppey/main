import { ReactNode } from 'react';
import {
    BedDouble, Bath, Wifi, Wind, Monitor, Clock, Maximize, Users, Car, Coffee, Tv, Wine, Check, Waves, CigaretteOff, Umbrella, Briefcase, Snowflake, Shirt, Flame
} from 'lucide-react';

interface RoomContentProps {
    title: string;
    tagline: string;
    description: string;
    details: {
        label: string;
        value: string | number | ReactNode;
    }[];
    amenities?: {
        icon: string;
        title: string;
        description: string;
    }[];
}

function getIconForString(text: string) {
    const t = text.toLowerCase();
    if (t.includes('bed') || t.includes('twin') || t.includes('king')) return BedDouble;
    if (t.includes('view') || t.includes('lake') || t.includes('ocean')) return Waves;
    if (t.includes('shower') || t.includes('bath') || t.includes('tub')) return Bath;
    if (t.includes('wifi') || t.includes('internet')) return Wifi;
    if (t.includes('air') || t.includes('ac ') || t.includes('cooling') || t.includes('condition')) return Snowflake;
    if (t.includes('desk') || t.includes('work')) return Briefcase;
    if (t.includes('check') || t.includes('time') || t.includes('hour')) return Clock;
    if (t.includes('size') || t.includes('sq ft') || t.includes('area')) return Maximize;
    if (t.includes('occupancy') || t.includes('guest') || t.includes('person')) return Users;
    if (t.includes('park') || t.includes('car')) return Car;
    if (t.includes('coffee') || t.includes('tea') || t.includes('breakfast')) return Coffee;
    if (t.includes('tv') || t.includes('television') || t.includes('smart')) return Tv;
    if (t.includes('bar') || t.includes('wine') || t.includes('drink') || t.includes('fridge')) return Wine;
    if (t.includes('smoke') || t.includes('smoking')) return CigaretteOff;
    if (t.includes('beach')) return Umbrella;
    if (t.includes('laundry') || t.includes('wash')) return Shirt;
    if (t.includes('heat') || t.includes('fire')) return Flame;
    return Check;
}

export default function RoomContent({ title, tagline, description, details, amenities }: RoomContentProps) {
    // Combine details and amenities into a single list for the grid
    const displayItems = [
        ...details.map(d => {
             const useValueOnly = ['Size', 'Occupancy', 'Bed', 'View'].includes(d.label);
             return {
                 text: useValueOnly ? String(d.value) : `${d.label} ${d.value}`,
                 iconSource: d.label
             };
        }),
        ...(amenities || []).map(a => ({
            text: a.title,
            iconSource: a.title
        }))
    ];

    // Remove duplicates if any
    const uniqueItems = Array.from(new Map(displayItems.map(item => [item.text, item])).values());

    return (
        <section className="bg-[var(--surface-cream)] text-[var(--text-dark)] pt-0 pb-16 px-6 md:px-12">
            <div className="max-w-[1400px] mx-auto">
                
                {/* Title Section (Optional, usually omitted as Title is above the Hero Grid) */}
                {title && (
                    <div className="mb-12 text-center">
                        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight text-[var(--text-dark)] mb-4">
                            {title}
                        </h1>
                        {tagline && (
                            <p className="text-xl md:text-2xl text-[var(--text-dark)]/80 font-light leading-relaxed">
                                {tagline}
                            </p>
                        )}
                    </div>
                )}

                {/* Amenities & Description Container */}
                <div className="max-w-4xl mx-auto pt-2">
                    
                    {/* Amenities Grid */}
                    <div className="mb-8">
                        <h2 className="text-3xl md:text-[32px] text-[#8C7A6B] font-serif mb-6 tracking-wide text-center">Amenities</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-y-6 gap-x-6 justify-center max-w-3xl mx-auto">
                            {uniqueItems.map((item, idx) => {
                                const IconComp = getIconForString(item.iconSource);
                                return (
                                    <div key={idx} className="flex items-center gap-3 text-[#59544D] mx-auto w-full max-w-[160px]">
                                        <IconComp className="w-5 h-5 flex-shrink-0 text-[var(--text-dark)]/80" strokeWidth={1.5} />
                                        <span className="text-[14px] font-medium leading-tight whitespace-nowrap">
                                            {item.text}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Description Section */}
                    {description && (
                        <div className="text-center mt-8">
                            <p className="text-[#59544D] leading-relaxed text-[16px] font-normal max-w-3xl mx-auto">
                                {description}
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </section>
    );
}
