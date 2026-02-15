import { Inter } from 'next/font/google';
import '../globals.css';
import { Sidebar } from '@/components/admin/sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'Admin Panel - Olivia Hotel',
    description: 'Manage your hotel website',
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={`flex min-h-screen bg-gray-100 ${inter.className}`}>
            <Sidebar />
            <main className="flex-1 p-8">
                {children}
            </main>
        </div>
    );
}
