import Link from 'next/link';
import { WhatsAppSubNav } from '@/components/admin/whatsapp/sub-nav';
import { resolveProviderName } from '@/lib/services/whatsapp';

export const metadata = {
    title: 'WhatsApp — Olivia Admin',
};

export default function WhatsAppLayout({ children }: { children: React.ReactNode }) {
    const provider = resolveProviderName();

    return (
        <div className="space-y-6">
            <div>
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-semibold text-gray-900">WhatsApp</h1>
                    {provider === 'mock' && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                            Simulator mode — no real messages are sent
                        </span>
                    )}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                    Broadcasts, guest conversations and consent for the hotel&apos;s WhatsApp number.{' '}
                    <Link href="/admin/whatsapp/settings" className="underline hover:text-gray-700">
                        Settings
                    </Link>
                </p>
            </div>

            <WhatsAppSubNav />

            {children}
        </div>
    );
}
