'use client';

import { Share2 } from 'lucide-react';

export default function ShareButton({ title, url }: { title: string; url: string }) {
    const handleShare = async () => {
        const shareUrl = `${window.location.origin}${url}`;
        if (navigator.share) {
            try {
                await navigator.share({ title, url: shareUrl });
            } catch {
                // user cancelled
            }
        } else {
            await navigator.clipboard.writeText(shareUrl);
        }
    };

    return (
        <button
            onClick={handleShare}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full text-white transition-colors"
        >
            <Share2 className="w-4 h-4" />
        </button>
    );
}
