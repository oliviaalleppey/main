'use client';

import { useState } from 'react';
import { Trash2, Image as ImageIcon } from 'lucide-react';
import { deleteMedia } from './actions';
import { MEDIA_CATEGORIES } from './constants';
import { toast } from 'sonner';

interface MediaItem {
    id: string;
    title: string;
    imageUrl: string;
    category: string;
    createdAt: Date;
}

function DeleteButton({ id }: { id: string }) {
    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this media?')) return;
        await deleteMedia(id);
        toast.success('Media deleted');
        window.location.reload();
    };

    return (
        <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
        >
            <Trash2 className="w-4 h-4" />
        </button>
    );
}

export default function MediaGallery({ items }: { items: MediaItem[] }) {
    const [activeCategory, setActiveCategory] = useState<string>('all');

    const categoryCounts = items.reduce<Record<string, number>>((acc, item) => {
        const cat = item.category || 'general';
        acc[cat] = (acc[cat] ?? 0) + 1;
        return acc;
    }, {});

    const tabs = [
        { value: 'all', label: 'All', count: items.length },
        ...MEDIA_CATEGORIES
            .filter(cat => (categoryCounts[cat.value] ?? 0) > 0)
            .map(cat => ({ value: cat.value, label: cat.label, count: categoryCounts[cat.value] })),
    ];

    const filtered = activeCategory === 'all'
        ? items
        : items.filter(item => (item.category || 'general') === activeCategory);

    if (items.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No media uploaded yet</p>
                <p className="text-sm mt-1">Upload media using the form above</p>
            </div>
        );
    }

    return (
        <div>
            {/* Category Tab Pills */}
            <div className="flex flex-wrap gap-2 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => setActiveCategory(tab.value)}
                        className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors border
                            ${activeCategory === tab.value
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-white text-[var(--text-dark)] border-gray-200 hover:border-amber-300 hover:text-amber-600'
                            }`}
                    >
                        {tab.label}
                        <span className={`ml-1.5 text-xs ${activeCategory === tab.value ? 'opacity-80' : 'text-gray-400'}`}>
                            ({tab.count})
                        </span>
                    </button>
                ))}
            </div>

            {/* Media Grid */}
            {filtered.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">No media in this category.</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filtered.map(item => (
                        <div key={item.id} className="group relative bg-gray-100 rounded-lg overflow-hidden aspect-video">
                            {item.imageUrl.endsWith('.mp4') || item.imageUrl.endsWith('.webm') ? (
                                <video src={item.imageUrl} className="w-full h-full object-cover" />
                            ) : (
                                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <DeleteButton id={item.id} />
                            </div>
                            <p className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent text-white text-xs truncate">
                                {item.title}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
