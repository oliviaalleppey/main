import { getPageHeaders } from '@/app/admin/media/actions';
import DiscoverClient from './DiscoverClient';

export const metadata = {
    title: 'Discover | Olivia Alleppey',
};

export default async function DiscoverPage() {
    const pageHeaders = await getPageHeaders();
    const discoverHeader = pageHeaders.discover;

    return <DiscoverClient headerImage={discoverHeader?.url} />;
}