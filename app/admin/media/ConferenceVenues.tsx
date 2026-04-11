'use client';

import { useState, useRef } from 'react';
import { setConferenceVenueImage, setConferenceSectionImage } from './actions';
import { UploadCloud, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';

async function toWebPClient(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) { reject(new Error('Canvas not available')); return; }
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(
                (blob) => {
                    if (!blob) { reject(new Error('WebP conversion failed')); return; }
                    const webpName = file.name.replace(/\.[^.]+$/, '.webp');
                    resolve(new File([blob], webpName, { type: 'image/webp' }));
                },
                'image/webp',
                0.85,
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image'));
        };

        img.src = objectUrl;
    });
}

const VENUES = [
    { key: 'grand-ballroom', label: 'Grand BallRoom' },
    { key: 'forum', label: 'Forum' },
    { key: 'poolside', label: 'Poolside' },
];

const SECTION_IMAGES = [
    { key: 'how_we_plan_1', label: 'How We Plan - Image 1' },
    { key: 'how_we_plan_2', label: 'How We Plan - Image 2' },
];

interface Props {
    venueImages: Record<string, string>;
    sectionImages: Record<string, string>;
}

export default function ConferenceVenues({ venueImages: initialVenueImages, sectionImages: initialSectionImages }: Props) {
    const [activeTab, setActiveTab] = useState<'venues' | 'section'>('venues');
    const [venueImages, setVenueImages] = useState<Record<string, string>>(initialVenueImages);
    const [sectionImages, setSectionImages] = useState<Record<string, string>>(initialSectionImages);
    const [uploading, setUploading] = useState<string | null>(null);
    const router = useRouter();

    const handleVenueUpload = async (key: string, file: File) => {
        setUploading(key);
        try {
            const webpFile = await toWebPClient(file);
            const blob = await upload(webpFile.name, webpFile, {
                access: 'public',
                handleUploadUrl: '/api/upload',
            });
            const fd = new FormData();
            fd.append('url', blob.url);
            const result = await setConferenceVenueImage(key, fd);
            setVenueImages(prev => ({ ...prev, [key]: result.url }));
            toast.success('Venue image updated!');
            router.refresh();
        } catch {
            toast.error('Upload failed');
        } finally {
            setUploading(null);
        }
    };

    const handleSectionUpload = async (key: string, file: File) => {
        setUploading(key);
        try {
            const webpFile = await toWebPClient(file);
            const blob = await upload(webpFile.name, webpFile, {
                access: 'public',
                handleUploadUrl: '/api/upload',
            });
            const fd = new FormData();
            fd.append('url', blob.url);
            const result = await setConferenceSectionImage(key, fd);
            setSectionImages(prev => ({ ...prev, [key]: result.url }));
            toast.success('Section image updated!');
            router.refresh();
        } catch {
            toast.error('Upload failed');
        } finally {
            setUploading(null);
        }
    };

    return (
        <div>
            {/* Tab switcher */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('venues')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'venues' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    <ImageIcon className="w-4 h-4 inline mr-2" />
                    Venue Images
                </button>
                <button
                    onClick={() => setActiveTab('section')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'section' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    <ImageIcon className="w-4 h-4 inline mr-2" />
                    How We Plan Section
                </button>
            </div>

            {/* Venue Images */}
            {activeTab === 'venues' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {VENUES.map(venue => {
                        const imageUrl = venueImages[venue.key];
                        const isUploading = uploading === venue.key;
                        return (
                            <div key={venue.key} className="border border-gray-200 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-medium text-[var(--text-dark)]">{venue.label}</h3>
                                    {imageUrl && (
                                        <span className="text-xs text-green-600 flex items-center gap-1">
                                            <span className="w-2 h-2 bg-green-500 rounded-full" />
                                            Image set
                                        </span>
                                    )}
                                </div>
                                <div className="rounded-lg overflow-hidden aspect-video bg-gray-100 mb-3">
                                    {imageUrl ? (
                                        <img src={imageUrl} alt={venue.label} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                                            No image uploaded
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    id={`venue-file-${venue.key}`}
                                    onChange={e => { const f = e.target.files?.[0]; if (f) handleVenueUpload(venue.key, f); }}
                                />
                                <label
                                    htmlFor={`venue-file-${venue.key}`}
                                    className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm cursor-pointer transition-colors"
                                >
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                    {isUploading ? 'Uploading...' : 'Upload Image'}
                                </label>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Section Images */}
            {activeTab === 'section' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {SECTION_IMAGES.map(img => {
                        const imageUrl = sectionImages[img.key];
                        const isUploading = uploading === img.key;
                        return (
                            <div key={img.key} className="border border-gray-200 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-medium text-[var(--text-dark)]">{img.label}</h3>
                                    {imageUrl && (
                                        <span className="text-xs text-green-600 flex items-center gap-1">
                                            <span className="w-2 h-2 bg-green-500 rounded-full" />
                                            Image set
                                        </span>
                                    )}
                                </div>
                                <div className="rounded-lg overflow-hidden aspect-video bg-gray-100 mb-3">
                                    {imageUrl ? (
                                        <img src={imageUrl} alt={img.label} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                                            No image uploaded
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    id={`section-file-${img.key}`}
                                    onChange={e => { const f = e.target.files?.[0]; if (f) handleSectionUpload(img.key, f); }}
                                />
                                <label
                                    htmlFor={`section-file-${img.key}`}
                                    className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm cursor-pointer transition-colors"
                                >
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                    {isUploading ? 'Uploading...' : 'Upload Image'}
                                </label>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}