'use client';

import { useState } from 'react';
import { Users, Grid3x3, School, Square, Table2, Wine, PartyPopper } from 'lucide-react';

type SeatingStyle = 'theatre' | 'cluster' | 'classroom' | 'u_shape' | 'boardroom' | 'banquet' | 'cocktail';

interface SeatingDiagramProps {
    capacities: {
        theatre?: number | null;
        cluster?: string | null;
        classroom?: number | null;
        uShape?: number | null;
        boardroom?: number | null;
        banquet?: number | null;
        cocktail?: number | null;
    };
    venueName: string;
}

const seatingStyles: {
    id: SeatingStyle;
    label: string;
    icon: any;
    description: string;
}[] = [
        {
            id: 'theatre',
            label: 'Theatre',
            icon: Users,
            description: 'Rows of chairs facing forward, ideal for presentations',
        },
        {
            id: 'cluster',
            label: 'Cluster',
            icon: Grid3x3,
            description: 'Round tables for group discussions and dining',
        },
        {
            id: 'classroom',
            label: 'Classroom',
            icon: School,
            description: 'Tables with chairs facing forward for training',
        },
        {
            id: 'u_shape',
            label: 'U-Shape',
            icon: Square,
            description: 'Tables arranged in U formation for interaction',
        },
        {
            id: 'boardroom',
            label: 'Boardroom',
            icon: Table2,
            description: 'Single table with chairs around for meetings',
        },
        {
            id: 'banquet',
            label: 'Banquet',
            icon: Wine,
            description: 'Round tables with premium dining setup',
        },
        {
            id: 'cocktail',
            label: 'Cocktail',
            icon: PartyPopper,
            description: 'Standing reception with high tables',
        },
    ];

export default function SeatingDiagram({ capacities, venueName }: SeatingDiagramProps) {
    const [activeStyle, setActiveStyle] = useState<SeatingStyle>('theatre');

    const getCapacity = (style: SeatingStyle) => {
        switch (style) {
            case 'theatre':
                return capacities.theatre;
            case 'cluster':
                return capacities.cluster;
            case 'classroom':
                return capacities.classroom;
            case 'u_shape':
                return capacities.uShape;
            case 'boardroom':
                return capacities.boardroom;
            case 'banquet':
                return capacities.banquet;
            case 'cocktail':
                return capacities.cocktail;
            default:
                return null;
        }
    };

    const availableStyles = seatingStyles.filter(style => {
        const capacity = getCapacity(style.id);
        return capacity !== null && capacity !== undefined;
    });

    const currentCapacity = getCapacity(activeStyle);

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-cream-900 to-gold-900 text-white p-6">
                <h3 className="font-display text-2xl mb-2">Seating Arrangements</h3>
                <p className="text-cream-100 text-sm">
                    Explore different configurations for {venueName}
                </p>
            </div>

            {/* Style Selector */}
            <div className="p-6 border-b border-cream-200">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {availableStyles.map((style) => {
                        const Icon = style.icon;
                        const isActive = activeStyle === style.id;

                        return (
                            <button
                                key={style.id}
                                onClick={() => setActiveStyle(style.id)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-300 ${isActive
                                        ? 'border-gold-500 bg-gold-50 shadow-md'
                                        : 'border-cream-200 hover:border-gold-300 hover:bg-cream-50'
                                    }`}
                            >
                                <Icon className={`w-6 h-6 ${isActive ? 'text-gold-600' : 'text-cream-600'}`} />
                                <span className={`text-sm font-medium ${isActive ? 'text-gold-900' : 'text-cream-700'}`}>
                                    {style.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Visualization & Details */}
            <div className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Visual Representation */}
                    <div className="bg-cream-50 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                        <SeatingVisual style={activeStyle} />
                    </div>

                    {/* Details */}
                    <div className="flex flex-col justify-center">
                        <div className="mb-6">
                            <h4 className="font-display text-3xl text-cream-900 mb-2">
                                {seatingStyles.find(s => s.id === activeStyle)?.label} Style
                            </h4>
                            <p className="text-cream-600">
                                {seatingStyles.find(s => s.id === activeStyle)?.description}
                            </p>
                        </div>

                        {/* Capacity Display */}
                        <div className="bg-gradient-to-br from-gold-50 to-cream-50 rounded-lg p-6 border-2 border-gold-200">
                            <div className="flex items-center gap-3 mb-2">
                                <Users className="w-6 h-6 text-gold-600" />
                                <span className="text-sm font-medium text-cream-700 uppercase tracking-wide">
                                    Maximum Capacity
                                </span>
                            </div>
                            <div className="text-5xl font-display text-gold-900">
                                {currentCapacity || 'N/A'}
                            </div>
                            <div className="text-sm text-cream-600 mt-1">guests</div>
                        </div>

                        {/* Best For */}
                        <div className="mt-6 p-4 bg-cream-50 rounded-lg">
                            <div className="text-xs font-medium text-cream-600 uppercase tracking-wide mb-2">
                                Best For
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {getBestFor(activeStyle).map((item, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-white text-cream-700 text-sm rounded-full border border-cream-200"
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Visual representation component
function SeatingVisual({ style }: { style: SeatingStyle }) {
    const baseClass = "transition-all duration-500";

    switch (style) {
        case 'theatre':
            return (
                <div className={`${baseClass} space-y-2`}>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex gap-2">
                            {[...Array(8)].map((_, j) => (
                                <div key={j} className="w-4 h-4 bg-gold-400 rounded-sm" />
                            ))}
                        </div>
                    ))}
                </div>
            );
        case 'cluster':
        case 'banquet':
            return (
                <div className={`${baseClass} grid grid-cols-3 gap-6`}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="relative">
                            <div className="w-16 h-16 bg-gold-400 rounded-full flex items-center justify-center">
                                <div className="w-10 h-10 bg-cream-100 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            );
        case 'classroom':
            return (
                <div className={`${baseClass} space-y-3`}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex gap-3">
                            {[...Array(4)].map((_, j) => (
                                <div key={j} className="w-8 h-6 bg-gold-400 rounded-sm" />
                            ))}
                        </div>
                    ))}
                </div>
            );
        case 'u_shape':
            return (
                <div className={`${baseClass} relative w-40 h-32`}>
                    <div className="absolute top-0 left-0 right-0 h-6 bg-gold-400 rounded-t-lg" />
                    <div className="absolute top-0 bottom-0 left-0 w-6 bg-gold-400" />
                    <div className="absolute top-0 bottom-0 right-0 w-6 bg-gold-400" />
                </div>
            );
        case 'boardroom':
            return (
                <div className={`${baseClass} relative w-48 h-24 bg-gold-400 rounded-lg flex items-center justify-center`}>
                    <div className="w-32 h-12 bg-cream-100 rounded" />
                </div>
            );
        case 'cocktail':
            return (
                <div className={`${baseClass} grid grid-cols-4 gap-4`}>
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="w-8 h-12 bg-gold-400 rounded-t-full" />
                    ))}
                </div>
            );
        default:
            return null;
    }
}

function getBestFor(style: SeatingStyle): string[] {
    switch (style) {
        case 'theatre':
            return ['Conferences', 'Presentations', 'Seminars', 'Award Ceremonies'];
        case 'cluster':
            return ['Weddings', 'Galas', 'Networking', 'Team Building'];
        case 'classroom':
            return ['Training', 'Workshops', 'Educational Events'];
        case 'u_shape':
            return ['Meetings', 'Discussions', 'Interviews', 'Small Conferences'];
        case 'boardroom':
            return ['Executive Meetings', 'Board Meetings', 'Strategy Sessions'];
        case 'banquet':
            return ['Weddings', 'Formal Dinners', 'Celebrations', 'Galas'];
        case 'cocktail':
            return ['Receptions', 'Networking', 'Product Launches', 'Social Events'];
        default:
            return [];
    }
}
