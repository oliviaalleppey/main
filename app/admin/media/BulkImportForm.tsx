'use client';

import { useState } from 'react';
import { bulkImportMedia } from './actions';
import { MEDIA_CATEGORIES } from './constants';
import { Download, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function BulkImportForm() {
    const [open, setOpen] = useState(false);
    const [urls, setUrls] = useState('');
    const [category, setCategory] = useState('general');
    const [isImporting, setIsImporting] = useState(false);
    const router = useRouter();

    const handleImport = async () => {
        const lines = urls
            .split('\n')
            .map(u => u.trim())
            .filter(u => u.startsWith('http'));

        if (lines.length === 0) {
            toast.error('No valid URLs found. Each URL must start with http.');
            return;
        }

        setIsImporting(true);
        try {
            const result = await bulkImportMedia(lines, category);
            toast.success(`Imported ${result.count} photo${result.count !== 1 ? 's' : ''} successfully!`);
            setUrls('');
            router.refresh();
        } catch (e) {
            toast.error('Import failed. Please check your URLs and try again.');
        } finally {
            setIsImporting(false);
        }
    };

    const urlCount = urls
        .split('\n')
        .map(u => u.trim())
        .filter(u => u.startsWith('http')).length;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-8">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full p-6 flex items-center justify-between text-left"
            >
                <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-amber-500" />
                    <div>
                        <h2 className="text-lg font-medium text-[var(--text-dark)]">Bulk Import from URLs</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Paste existing Vercel Blob URLs to add them to the library</p>
                    </div>
                </div>
                {open ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>

            {open && (
                <div className="px-6 pb-6 space-y-4 border-t border-gray-50 pt-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-dark)] mb-1">
                            Category for all URLs
                        </label>
                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full p-2.5 border border-[#E8E0D5] rounded-lg bg-white text-[var(--text-dark)] focus:border-[#C9A84C] focus:outline-none"
                        >
                            {MEDIA_CATEGORIES.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--text-dark)] mb-1">
                            URLs <span className="text-gray-400 font-normal">(one per line)</span>
                        </label>
                        <textarea
                            value={urls}
                            onChange={e => setUrls(e.target.value)}
                            placeholder={`https://your-blob-url.vercel-storage.com/photo1.webp\nhttps://your-blob-url.vercel-storage.com/photo2.jpg\nhttps://your-blob-url.vercel-storage.com/photo3.png`}
                            rows={8}
                            className="w-full p-2.5 border border-[#E8E0D5] rounded-lg bg-white text-[var(--text-dark)] focus:border-[#C9A84C] focus:outline-none font-mono text-xs resize-none"
                        />
                        {urlCount > 0 && (
                            <p className="text-xs text-gray-500 mt-1">{urlCount} valid URL{urlCount !== 1 ? 's' : ''} detected</p>
                        )}
                    </div>

                    <button
                        onClick={handleImport}
                        disabled={isImporting || urlCount === 0}
                        className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
                    >
                        {isImporting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</>
                        ) : (
                            <><Download className="w-4 h-4" /> Import {urlCount > 0 ? `${urlCount} Photo${urlCount !== 1 ? 's' : ''}` : 'Photos'}</>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
