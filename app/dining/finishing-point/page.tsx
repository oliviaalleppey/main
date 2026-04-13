import FullMenuPage from '../FullMenuPage';

export const metadata = {
    title: 'Finishing Point Menu | Olivia Alleppey',
    description: 'Full à la carte menu for Finishing Point at Olivia International, Alappuzha.',
};

export default function FinishingPointPage() {
    return (
        <FullMenuPage
            outletName="Finishing Point"
            outletTagline="All-day dining with a refined spread of Kerala favourites and global classics."
            hours="7:00 am – 11:00 pm"
        />
    );
}
