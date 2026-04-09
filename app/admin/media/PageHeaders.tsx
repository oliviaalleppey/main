'use client';

import { useState, useRef } from 'react';
import { setPageHeader, uploadMedia, deleteMedia, setAmenityImage, setDiningImage, saveMediaUrl } from './actions';
import { MEDIA_PAGES } from './constants';
import { UploadCloud, Loader2, Image as ImageIcon, Video, Film, Trash2, Plus, Layers } from 'lucide-react';
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

interface PageHeader {
    type: 'video' | 'image';
    url: string;
}

interface MediaItem {
    id: string;
    title: string;
    imageUrl: string;
    category: string;
}

const AMENITY_ITEMS = [
    { key: 'pool', label: 'Atrium Pool' },
    { key: 'gym', label: 'State-of-the-Art Gym' },
    { key: 'spa', label: 'The Spa' },
    { key: 'yoga', label: 'Yoga & Meditation' },
    { key: 'editorial', label: 'Our Story (About Section)' },
    { key: 'wellness_spa', label: 'Wellness - The Spa' },
    { key: 'wellness_pool', label: 'Wellness - Atrium Pool' },
    { key: 'wellness_gym', label: 'Wellness - Gym' },
    { key: 'wellness_steam', label: 'Wellness - Steam & Sauna' },
    { key: 'wellness_yoga', label: 'Wellness - Yoga & Meditation' },
];

const DINING_OUTLETS = [
    { slug: 'in-room-dining', label: 'In-Room Dining' },
    { slug: 'finishing-point', label: 'Finishing Point' },
    { slug: 'brew-bar', label: 'Brew & Bite' },
    { slug: 'aqua-pool-lounge', label: 'Aqua Pool Lounge' },
    { slug: 'club-9', label: 'Club 9' },
    { slug: 'kaayal', label: 'Kaayal' },
];

interface Props {
    headers: Record<string, PageHeader>;
    homeSlides: MediaItem[];
    amenityImages: Record<string, string>;
    diningImages: Record<string, string>;
}

export default function PageHeaders({ headers, homeSlides: initialHomeSlides, amenityImages: initialAmenityImages, diningImages: initialDiningImages }: Props) {
    const [activeTab, setActiveTab] = useState<'pages' | 'amenities'>('pages');
    const [activePage, setActivePage] = useState('home');
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [manualUrl, setManualUrl] = useState('');
    const [isSavingUrl, setIsSavingUrl] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const homeFileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const [localHeaders, setLocalHeaders] = useState<Record<string, PageHeader>>(headers);
    const [homeSlides, setHomeSlides] = useState<MediaItem[]>(initialHomeSlides);
    const [amenityImages, setAmenityImages] = useState<Record<string, string>>(initialAmenityImages);
    const [diningImages, setDiningImages] = useState<Record<string, string>>(initialDiningImages);
    const [uploadingDining, setUploadingDining] = useState<string | null>(null);
    const currentHeader = localHeaders[activePage];

    // Upload for non-home page headers (single image/video saved to siteSettings)
    const handleFile = async (file: File) => {
        setIsUploading(true);
        try {
            const isVideo = file.type.startsWith('video/');
            
            if (isVideo) {
                const fd = new FormData();
                fd.append('media', file);
                const result = await setPageHeader(activePage, fd);
                setLocalHeaders(prev => ({ ...prev, [activePage]: { type: result.type, url: result.url } }));
            } else {
                const webpFile = await toWebPClient(file);
                const blob = await upload(webpFile.name, webpFile, {
                    access: 'public',
                    handleUploadUrl: '/api/upload',
                });
                const fd = new FormData();
                fd.append('url', blob.url);
                const result = await setPageHeader(activePage, fd);
                setLocalHeaders(prev => ({ ...prev, [activePage]: { type: 'image', url: result.url } }));
            }
            toast.success('Page header updated!');
            router.refresh();
        } catch {
            toast.error('Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    // Upload a new carousel slide for the home page
    const handleHomeSlideUpload = async (file: File) => {
        setIsUploading(true);
        try {
            const isVideo = file.type.startsWith('video/');
            
            if (isVideo) {
                const fd = new FormData();
                fd.append('media', file);
                fd.append('category', 'home');
                fd.append('title', file.name);
                const result = await uploadMedia(fd);
                setHomeSlides(prev => [...prev, { id: result.id, title: file.name, imageUrl: result.url, category: 'home' }]);
            } else {
                const webpFile = await toWebPClient(file);
                const blob = await upload(webpFile.name, webpFile, {
                    access: 'public',
                    handleUploadUrl: '/api/upload',
                });
                const result = await saveMediaUrl(blob.url, 'home', file.name);
                setHomeSlides(prev => [...prev, { id: result.id, title: file.name, imageUrl: blob.url, category: 'home' }]);
            }
            toast.success('Slide added to carousel!');
            router.refresh();
        } catch {
            toast.error('Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteSlide = async (id: string) => {
        if (!confirm('Remove this slide from the home page carousel?')) return;
        await deleteMedia(id);
        setHomeSlides(prev => prev.filter(s => s.id !== id));
        toast.success('Slide removed');
        router.refresh();
    };

    const handleSaveUrl = async () => {
        if (!manualUrl.startsWith('http')) { toast.error('Enter a valid URL starting with http'); return; }
        setIsSavingUrl(true);
        try {
            const fd = new FormData();
            fd.append('url', manualUrl);
            const result = await setPageHeader(activePage, fd);
            setLocalHeaders(prev => ({ ...prev, [activePage]: { type: result.type, url: result.url } }));
            toast.success('Page header updated!');
            setManualUrl('');
        } catch {
            toast.error('Failed to save');
        } finally {
            setIsSavingUrl(false);
        }
    };

    // Dining handlers
    const handleDiningUpload = async (slug: string, file: File) => {
        setUploadingDining(slug);
        try {
            const webpFile = await toWebPClient(file);
            const blob = await upload(webpFile.name, webpFile, {
                access: 'public',
                handleUploadUrl: '/api/upload',
            });
            const fd = new FormData();
            fd.append('url', blob.url);
            const result = await setDiningImage(slug, fd);
            setDiningImages(prev => ({ ...prev, [slug]: result.url }));
            toast.success('Dining image updated!');
            router.refresh();
        } catch {
            toast.error('Upload failed');
        } finally {
            setUploadingDining(null);
        }
    };

    const handleDiningUrl = async (slug: string) => {
        const url = (document.getElementById(`dining-url-${slug}`) as HTMLInputElement)?.value;
        if (!url?.startsWith('http')) { toast.error('Enter a valid URL'); return; }
        try {
            const fd = new FormData();
            fd.append('url', url);
            const result = await setDiningImage(slug, fd);
            setDiningImages(prev => ({ ...prev, [slug]: result.url }));
            toast.success('Dining image updated!');
            router.refresh();
        } catch {
            toast.error('Failed to save');
        }
    };

    // Amenity handlers
    const [uploadingAmenity, setUploadingAmenity] = useState<string | null>(null);
    const handleAmenityUpload = async (key: string, file: File) => {
        setUploadingAmenity(key);
        try {
            const webpFile = await toWebPClient(file);
            const blob = await upload(webpFile.name, webpFile, {
                access: 'public',
                handleUploadUrl: '/api/upload',
            });
            const fd = new FormData();
            fd.append('url', blob.url);
            const result = await setAmenityImage(key, fd);
            setAmenityImages(prev => ({ ...prev, [key]: result.url }));
            toast.success(`${AMENITY_ITEMS.find(a => a.key === key)?.label} image updated!`);
            router.refresh();
        } catch {
            toast.error('Upload failed');
        } finally {
            setUploadingAmenity(null);
        }
    };

    const handleAmenityUrl = async (key: string) => {
        const url = (document.getElementById(`amenity-url-${key}`) as HTMLInputElement)?.value;
        if (!url?.startsWith('http')) { toast.error('Enter a valid URL'); return; }
        try {
            const fd = new FormData();
            fd.append('url', url);
            const result = await setAmenityImage(key, fd);
            setAmenityImages(prev => ({ ...prev, [key]: result.url }));
            toast.success(`${AMENITY_ITEMS.find(a => a.key === key)?.label} image updated!`);
            router.refresh();
        } catch {
            toast.error('Failed to save');
        }
    };

    return (
        <div>
            <p className="text-sm text-gray-500 mb-6">
                Set the background image or video for each page header. Images are automatically converted to WebP.
            </p>

            {/* Tab switcher: Page Headers vs Home Page Amenities */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('pages')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'pages' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    <Layers className="w-4 h-4 inline mr-2" />
                    Page Headers
                </button>
                <button
                    onClick={() => setActiveTab('amenities')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'amenities' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    <ImageIcon className="w-4 h-4 inline mr-2" />
                    Home Page Amenities
                </button>
            </div>

            {/* AMENITIES SECTION */}
            {activeTab === 'amenities' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {AMENITY_ITEMS.map(item => {
                        const imageUrl = amenityImages[item.key];
                        return (
                            <div key={item.key} className="border border-gray-200 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-medium text-[var(--text-dark)]">{item.label}</h3>
                                    {imageUrl && (
                                        <span className="text-xs text-green-600 flex items-center gap-1">
                                            <span className="w-2 h-2 bg-green-500 rounded-full" />
                                            Image set
                                        </span>
                                    )}
                                </div>
                                {/* Preview */}
                                <div className="rounded-lg overflow-hidden aspect-video bg-gray-100 mb-3">
                                    {imageUrl ? (
                                        <img src={imageUrl} alt={item.label} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                                            No image uploaded
                                        </div>
                                    )}
                                </div>
                                {/* Upload */}
                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id={`amenity-file-${item.key}`}
                                        onChange={e => { const f = e.target.files?.[0]; if (f) handleAmenityUpload(item.key, f); }}
                                    />
                                    <label
                                        htmlFor={`amenity-file-${item.key}`}
                                        className="flex-1 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm text-center cursor-pointer transition-colors"
                                    >
                                        {uploadingAmenity === item.key ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Upload Image'}
                                    </label>
                                </div>
                                {/* OR divider */}
                                <div className="flex items-center gap-2 my-3">
                                    <div className="flex-1 border-t border-gray-200" />
                                    <span className="text-xs text-gray-400">OR</span>
                                    <div className="flex-1 border-t border-gray-200" />
                                </div>
                                {/* URL input */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        id={`amenity-url-${item.key}`}
                                        placeholder="Paste image URL..."
                                        className="flex-1 p-2 border border-gray-200 rounded-lg text-sm"
                                    />
                                    <button
                                        onClick={() => handleAmenityUrl(item.key)}
                                        className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* PAGE HEADERS SECTION */}
            {activeTab === 'pages' && (
                <>
                    {/* Page tabs */}
                    <div className="flex flex-wrap gap-2 mb-8">
                        {MEDIA_PAGES.map(page => (
                            <button
                                key={page.value}
                                onClick={() => { setActivePage(page.value); setManualUrl(''); }}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border
                                    ${activePage === page.value
                                        ? 'bg-amber-500 text-white border-amber-500'
                                        : 'bg-white text-[var(--text-dark)] border-gray-200 hover:border-amber-300 hover:text-amber-600'}`}
                            >
                                {page.label}
                                {page.value === 'home' ? (
                                    homeSlides.length > 0 && (
                                        <span className="ml-1.5 w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                                    )
                                ) : (
                                    localHeaders[page.value] && (
                                        <span className="ml-1.5 w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                                    )
                                )}
                            </button>
                        ))}
                    </div>

                    {/* HOME PAGE — Carousel Slide Manager */}
                    {activePage === 'home' ? (
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Layers className="w-4 h-4 text-amber-500" />
                                <h3 className="text-sm font-semibold text-[var(--text-dark)]">Home Page Hero Carousel</h3>
                            </div>
                            <p className="text-xs text-gray-500 mb-5">
                                These images appear as slides in the home page hero. Upload multiple images to create a carousel. First image is displayed first.
                            </p>

                            {/* Existing slides */}
                            {homeSlides.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                                    {homeSlides.map((slide, idx) => (
                                        <div key={slide.id} className="group relative">
                                            <div className="relative rounded-xl overflow-hidden aspect-video bg-gray-100">
                                                <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                        onClick={() => handleDeleteSlide(slide.id)}
                                                        className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="absolute top-2 left-2 bg-black/60 rounded-full px-2 py-0.5 text-white text-[10px] font-medium">
                                                    {idx === 0 ? 'First' : `#${idx + 1}`}
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1 truncate">{slide.title}</p>
                                        </div>
                                    ))}

                                    {/* Add slide button */}
                                    <div
                                        className={`relative rounded-xl border-2 border-dashed aspect-video flex flex-col items-center justify-center cursor-pointer transition-colors
                                            ${isDragging ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'}`}
                                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleHomeSlideUpload(f); }}
                                        onClick={() => !isUploading && homeFileInputRef.current?.click()}
                                    >
                                        <input ref={homeFileInputRef} type="file" className="hidden" accept="image/*"
                                            onChange={e => { const f = e.target.files?.[0]; if (f) handleHomeSlideUpload(f); }} />
                                        {isUploading ? (
                                            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                                        ) : (
                                            <>
                                                <Plus className="w-6 h-6 text-amber-400 mb-1" />
                                                <span className="text-xs text-gray-500">Add slide</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* Empty state — upload zone */
                                <div
                                    className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors mb-6
                                        ${isDragging ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}
                                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleHomeSlideUpload(f); }}
                                    onClick={() => !isUploading && homeFileInputRef.current?.click()}
                                >
                                    <input ref={homeFileInputRef} type="file" className="hidden" accept="image/*"
                                        onChange={e => { const f = e.target.files?.[0]; if (f) handleHomeSlideUpload(f); }} />
                                    {isUploading ? (
                                        <div className="flex flex-col items-center text-amber-600">
                                            <Loader2 className="w-8 h-8 mb-2 animate-spin" />
                                            <p className="text-sm font-medium">Uploading...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <UploadCloud className="w-8 h-8 text-amber-400 mb-2" />
                                            <p className="text-sm text-[var(--text-dark)] font-medium">Click or drag images here</p>
                                            <p className="text-xs text-gray-400 mt-1">Images auto-converted to WebP</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* OTHER PAGES — Single header manager */
                        <div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Current preview */}
                            <div>
                                <h3 className="text-sm font-semibold text-[var(--text-dark)] mb-3">
                                    Current Header
                                </h3>
                                {currentHeader ? (
                                    <div className="rounded-xl overflow-hidden aspect-video bg-gray-100 relative">
                                        {currentHeader.type === 'video' ? (
                                            <video
                                                src={currentHeader.url}
                                                className="w-full h-full object-cover"
                                                autoPlay muted loop playsInline
                                            />
                                        ) : (
                                            <img src={currentHeader.url} alt="Page header" className="w-full h-full object-cover" />
                                        )}
                                        <div className="absolute top-2 right-2 bg-black/60 rounded-full px-2.5 py-1 text-white text-xs flex items-center gap-1.5">
                                            {currentHeader.type === 'video'
                                                ? <><Video className="w-3 h-3" /> Video</>
                                                : <><ImageIcon className="w-3 h-3" /> Image</>}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-xl aspect-video bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200">
                                        <div className="text-center text-gray-400">
                                            <Film className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">No header set for this page</p>
                                        </div>
                                    </div>
                                )}
                                {currentHeader && (
                                    <p className="text-xs text-gray-400 mt-2 truncate">{currentHeader.url}</p>
                                )}
                            </div>

                            {/* Upload new */}
                            <div>
                                <h3 className="text-sm font-semibold text-[var(--text-dark)] mb-3">
                                    Upload New Header
                                </h3>

                                {/* Drag & drop */}
                                <div
                                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors mb-5
                                        ${isDragging ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}
                                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                                    onClick={() => !isUploading && fileInputRef.current?.click()}
                                >
                                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*"
                                        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                                    {isUploading ? (
                                        <div className="flex flex-col items-center text-amber-600">
                                            <Loader2 className="w-8 h-8 mb-2 animate-spin" />
                                            <p className="text-sm font-medium">Uploading...</p>
                                            <p className="text-xs opacity-70 mt-1">This may take a moment for videos</p>
                                        </div>
                                    ) : (
                                        <>
                                            <UploadCloud className="w-8 h-8 text-amber-400 mb-2" />
                                            <p className="text-sm text-[var(--text-dark)] font-medium">Click or drag file here</p>
                                            <p className="text-xs text-gray-400 mt-1">Image (auto-WebP) or Video (mp4, webm)</p>
                                        </>
                                    )}
                                </div>

                                {/* OR divider */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex-1 border-t border-gray-200" />
                                    <span className="text-xs text-gray-400">OR paste a URL</span>
                                    <div className="flex-1 border-t border-gray-200" />
                                </div>

                                {/* URL input */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={manualUrl}
                                        onChange={e => setManualUrl(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSaveUrl()}
                                        placeholder="https://your-image-or-video-url.com/..."
                                        className="flex-1 p-2.5 border border-[#E8E0D5] rounded-lg text-sm bg-white focus:border-[#C9A84C] focus:outline-none"
                                    />
                                    <button
                                        onClick={handleSaveUrl}
                                        disabled={isSavingUrl || !manualUrl}
                                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        {isSavingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* DINING OUTLETS — show below the header upload when on Dining page */}
                        {activePage === 'dining' && (
                            <div className="mt-8 pt-8 border-t border-gray-100">
                                <h3 className="text-sm font-semibold text-[var(--text-dark)] mb-1">Dining Outlet Images</h3>
                                <p className="text-xs text-gray-500 mb-5">Upload images for each restaurant shown on the Dining page.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {DINING_OUTLETS.map(outlet => {
                                        const imageUrl = diningImages[outlet.slug];
                                        return (
                                            <div key={outlet.slug} className="border border-gray-200 rounded-xl p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="font-medium text-sm text-[var(--text-dark)]">{outlet.label}</h4>
                                                    {imageUrl && (
                                                        <span className="text-xs text-green-600 flex items-center gap-1">
                                                            <span className="w-2 h-2 bg-green-500 rounded-full" />
                                                            Image set
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="rounded-lg overflow-hidden aspect-video bg-gray-100 mb-3">
                                                    {imageUrl ? (
                                                        <img src={imageUrl} alt={outlet.label} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image uploaded</div>
                                                    )}
                                                </div>
                                                <input type="file" accept="image/*" className="hidden"
                                                    id={`dining-file-${outlet.slug}`}
                                                    onChange={e => { const f = e.target.files?.[0]; if (f) handleDiningUpload(outlet.slug, f); }} />
                                                <label htmlFor={`dining-file-${outlet.slug}`}
                                                    className="block w-full px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm text-center cursor-pointer transition-colors mb-3">
                                                    {uploadingDining === outlet.slug ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Upload Image'}
                                                </label>
                                                <div className="flex gap-2">
                                                    <input type="text" id={`dining-url-${outlet.slug}`}
                                                        placeholder="Or paste image URL..."
                                                        className="flex-1 p-2 border border-gray-200 rounded-lg text-sm focus:border-amber-400 focus:outline-none" />
                                                    <button onClick={() => handleDiningUrl(outlet.slug)}
                                                        className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm">
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}