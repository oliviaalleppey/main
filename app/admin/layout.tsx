import { Inter } from 'next/font/google';
import '../globals.css';
import { Sidebar } from '@/components/admin/sidebar';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { and, gte, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });
const MAX_RETRIES = Number(process.env.BOOKING_WATCHDOG_MAX_RETRIES || 12);

export const metadata = {
    title: 'Admin Panel - Olivia Hotel',
    description: 'Manage your hotel website',
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AdminLayoutContent>{children}</AdminLayoutContent>;
}

async function AdminLayoutContent({ children }: { children: React.ReactNode }) {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
        redirect('/signin');
    }

    // NOTE: Some environments may have an older Postgres enum for booking_status
    // that doesn't include newer states like 'payment_success'/'booking_requested' yet.
    // Comparing as text avoids runtime errors and keeps the admin dashboard usable.
    const PENDING_STATES = ['payment_success', 'booking_requested'] as const;

    const [pendingRows, atRiskRows] = await Promise.all([
        db.select({ count: sql<number>`count(*)` })
            .from(bookings)
            .where(sql`${bookings.status}::text in (${sql.join(PENDING_STATES.map((s) => sql`${s}`), sql`, `)})`),
        db.select({ count: sql<number>`count(*)` })
            .from(bookings)
            .where(and(
                sql`${bookings.status}::text in (${sql.join(PENDING_STATES.map((s) => sql`${s}`), sql`, `)})`,
                gte(bookings.retryCount, MAX_RETRIES)
            )),
    ]);

    const pendingConfirmations = Number(pendingRows[0]?.count || 0);
    const atRiskConfirmations = Number(atRiskRows[0]?.count || 0);

    return (
        <div className={`flex min-h-screen bg-gray-100 ${inter.className}`}>
            <Sidebar
                pendingConfirmations={pendingConfirmations}
                atRiskConfirmations={atRiskConfirmations}
            />
            <main className="flex-1 p-8">
                {children}
            </main>
        </div>
    );
}
