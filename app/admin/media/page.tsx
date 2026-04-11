import { getAllMedia, getPageHeaders, getRoomTypesWithImages, getAmenityImages, getDiningImages, getWeddingVenueImages, getWeddingSectionImages, getConferenceVenueImages, getConferenceSectionImages, getMembershipImages } from './actions';
import MediaCenter from './MediaCenter';

export const metadata = {
    title: 'Media Center | Admin',
};

interface MediaItem {
    id: string;
    title: string;
    imageUrl: string;
    category: string;
    createdAt: Date;
}

export default async function MediaPage() {
    const [allMedia, pageHeaders, rooms, amenityImages, diningImages, weddingVenueImages, weddingSectionImages, conferenceVenueImages, conferenceSectionImages, membershipImages] = await Promise.all([
        getAllMedia(),
        getPageHeaders(),
        getRoomTypesWithImages(),
        getAmenityImages(),
        getDiningImages(),
        getWeddingVenueImages(),
        getWeddingSectionImages(),
        getConferenceVenueImages(),
        getConferenceSectionImages(),
        getMembershipImages(),
    ]);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <MediaCenter
                media={allMedia as MediaItem[]}
                pageHeaders={pageHeaders}
                rooms={rooms}
                amenityImages={amenityImages}
                diningImages={diningImages}
                weddingVenueImages={weddingVenueImages}
                weddingSectionImages={weddingSectionImages}
                conferenceVenueImages={conferenceVenueImages}
                conferenceSectionImages={conferenceSectionImages}
                membershipImages={membershipImages}
            />
        </div>
    );
}
