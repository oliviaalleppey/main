'use client';

import { useState } from 'react';
import { Grid, Film, BedDouble, Heart, Mic2, Crown } from 'lucide-react';
import MediaLibrary from './MediaLibrary';
import PageHeaders from './PageHeaders';
import RoomImages from './RoomImages';
import WeddingVenues from './WeddingVenues';
import ConferenceVenues from './ConferenceVenues';
import MembershipImages from './MembershipImages';

interface MediaItem {
    id: string;
    title: string;
    imageUrl: string;
    category: string;
    createdAt: Date;
}

interface PageHeader {
    type: 'video' | 'image';
    url: string;
}

interface RoomType {
    id: string;
    name: string;
    images: string[] | null;
}

interface Props {
    media: MediaItem[];
    pageHeaders: Record<string, PageHeader>;
    rooms: RoomType[];
    amenityImages: Record<string, string>;
    diningImages: Record<string, string>;
    weddingVenueImages: Record<string, string>;
    weddingSectionImages: Record<string, string>;
    conferenceVenueImages: Record<string, string>;
    conferenceSectionImages: Record<string, string>;
    membershipImages: Record<string, string>;
}

type Tab = 'library' | 'rooms' | 'headers' | 'wedding' | 'conference' | 'membership';

export default function MediaCenter({ media, pageHeaders, rooms, amenityImages, diningImages, weddingVenueImages, weddingSectionImages, conferenceVenueImages, conferenceSectionImages, membershipImages }: Props) {
    const [tab, setTab] = useState<Tab>('rooms');

    const totalRoomImages = rooms.reduce((sum, r) => sum + (r.images?.length ?? 0), 0);

    const tabClass = (t: Tab) =>
        `flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === t
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-[var(--text-dark)]'
        }`;

    const countClass = (t: Tab) =>
        `text-xs px-1.5 py-0.5 rounded-full ${tab === t ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`;

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-serif text-[var(--text-dark)]">Media Center</h1>
                <p className="text-sm text-gray-500 mt-1">Manage all your website media assets.</p>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 mb-8 border-b border-gray-100">
                <button onClick={() => setTab('rooms')} className={tabClass('rooms')}>
                    <BedDouble className="w-4 h-4" />
                    Room Images
                    <span className={countClass('rooms')}>{totalRoomImages}</span>
                </button>
                <button onClick={() => setTab('library')} className={tabClass('library')}>
                    <Grid className="w-4 h-4" />
                    Media Library
                    <span className={countClass('library')}>{media.length}</span>
                </button>
                <button onClick={() => setTab('headers')} className={tabClass('headers')}>
                    <Film className="w-4 h-4" />
                    Page Headers
                </button>
                <button onClick={() => setTab('wedding')} className={tabClass('wedding')}>
                    <Heart className="w-4 h-4" />
                    Wedding
                </button>
                <button onClick={() => setTab('conference')} className={tabClass('conference')}>
                    <Mic2 className="w-4 h-4" />
                    Conference
                </button>
                <button onClick={() => setTab('membership')} className={tabClass('membership')}>
                    <Crown className="w-4 h-4" />
                    Membership
                </button>
            </div>

            {/* Content panel */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                {tab === 'rooms' && <RoomImages rooms={rooms} />}
                {tab === 'library' && <MediaLibrary items={media} />}
                {tab === 'headers' && <PageHeaders headers={pageHeaders} homeSlides={media.filter(m => m.category === 'home')} amenityImages={amenityImages} diningImages={diningImages} />}
                {tab === 'wedding' && <WeddingVenues venueImages={weddingVenueImages} sectionImages={weddingSectionImages} />}
                {tab === 'conference' && <ConferenceVenues venueImages={conferenceVenueImages} sectionImages={conferenceSectionImages} />}
                {tab === 'membership' && <MembershipImages images={membershipImages} />}
            </div>
        </div>
    );
}
