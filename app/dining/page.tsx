import type { Metadata } from 'next';
import { getDiningImages } from '@/app/admin/media/actions';
import DiningClient from './DiningClient';

export const metadata: Metadata = {
    title: 'Dining | Olivia Alleppey',
    description: 'Dining at Olivia Alleppey. A culinary journey of global flavors and Kerala heritage.',
};

const outlets = [
    {
        name: 'In-Room Dining',
        description: 'Round-the-clock dining service delivered to rooms and suites with a curated selection of local and global delicacies — at any hour, with full hotel comfort.',
        slug: 'in-room-dining',
        image: '/images/rooms/balcony-room-5.jpg',
        capacity: '88 Rooms and Suites',
        location: 'All Floors',
        operatingHours: '24 Hours',
        cuisine: 'Local & Global',
        status: 'operational' as const,
        tag: '24 Hours',
    },
    {
        name: 'Finishing Point',
        description: 'Our all-day dining venue with a refined spread of Kerala favorites and global classics, served in a warm and welcoming atmosphere from morning through evening.',
        slug: 'finishing-point',
        image: '/images/dining/FINISHING POINT.webp',
        capacity: '94 Guests',
        location: 'Lobby Level',
        operatingHours: '07:00 HRS to 23:00 HRS',
        cuisine: 'Local & Global',
        status: 'operational' as const,
        tag: 'All-Day Dining',
    },
    {
        name: 'Brew & Bite',
        description: 'A 24-hour coffee and snack lounge for quick meetings, relaxed breaks, and comfort bites — the perfect pause in your day.',
        slug: 'brew-bar',
        image: '/images/dining/BREW& BITE.webp',
        capacity: '24 Guests',
        location: 'Lobby Level',
        operatingHours: '24 Hours',
        cuisine: 'Short Bites & Refreshments',
        status: 'operational' as const,
        tag: 'Coffee & Bites',
    },
    {
        name: 'Aqua Pool Lounge',
        description: 'Poolside refreshments and light bites in a serene daytime setting, overlooking the water with an unhurried, resort-style atmosphere.',
        slug: 'aqua-pool-lounge',
        image: '/images/dining/aquapool.webp',
        capacity: '24 Guests',
        location: '3rd Floor',
        operatingHours: '07:00 HRS to 19:00 HRS',
        cuisine: 'Short Bites & Refreshments',
        status: 'operational' as const,
        tag: 'Poolside',
    },
    {
        name: 'Club 9',
        description: 'An upcoming evening lounge with curated bar experiences and a thoughtfully crafted beverage program — where the night finds its finest hour.',
        slug: 'club-9',
        image: '/images/dining/CLUB 9.webp',
        capacity: '44 Guests',
        location: '1st Floor',
        operatingHours: '11:00 HRS to 23:00 HRS',
        cuisine: 'Bar & Beverage',
        status: 'upcoming' as const,
        tag: 'Bar & Lounge',
    },
    {
        name: 'Kaayal',
        description: 'An upcoming seafood concept with a live seafood selection and global culinary direction, inspired by the backwaters that define Alappuzha.',
        slug: 'kaayal',
        image: '/images/dining/KAAYAL.webp',
        capacity: '72 Guests',
        location: '3rd Floor',
        operatingHours: '19:00 HRS to 23:00 HRS',
        cuisine: 'Live Seafood & Global',
        status: 'upcoming' as const,
        tag: 'Seafood & Bar',
    },
];

export default async function DiningPage() {
    const dbImages = await getDiningImages();
    const allOutlets = outlets.map(o => ({
        ...o,
        image: dbImages[o.slug] || o.image,
    }));

    return <DiningClient outlets={allOutlets} />;
}
