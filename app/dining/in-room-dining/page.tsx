import FullMenuPage from '../FullMenuPage';

export const metadata = {
    title: 'In-Room Dining Menu | Olivia Alleppey',
    description: 'Full à la carte menu for In-Room Dining at Olivia International, Alappuzha.',
};

export default function InRoomDiningPage() {
    return (
        <FullMenuPage
            outletName="In-Room Dining"
            outletTagline="Round-the-clock dining delivered to your room — local and global flavours, any hour."
            hours="24 Hours"
        />
    );
}
