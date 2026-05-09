'use client';

import { useState, useRef } from 'react';
import { uploadMedia, deleteMedia, reorderGalleryImages, updateGalleryImageTab } from '../media/actions';
import { Upload, X, Loader2, Image as ImageIcon, GripVertical, Save } from 'lucide-react';
import Image from 'next/image';

interface GalleryImage {
    id: string;
    title: string;
    imageUrl: string;
    category: string;
    tab?: string | null;
}

const TABS = ['All', 'Rooms', 'Dining', 'Spa', 'Pool', 'Events'] as const;
type Tab = typeof TABS[number];

const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new window.Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1920; const MAX_HEIGHT = 1920;
                let width = img.width; let height = img.height;
                if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
                else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
                canvas.width = width; canvas.height = height;
                canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    if (blob) resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' }));
                    else reject(new Error('Blob failed'));
                }, 'image/jpeg', 0.85);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
};

export default function GalleryAdminManager({ initialImages }: { initialImages: GalleryImage[] }) {
    const [images, setImages] = useState<GalleryImage[]>(initialImages);
    const [activeTab, setActiveTab] = useState<Tab>('All');
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [savedMsg, setSavedMsg] = useState(false);
    const [tabDragOver, setTabDragOver] = useState<Tab | null>(null);

    const dragIndex = useRef<number | null>(null);
    const dragId = useRef<string | null>(null);
    const dragOverIndex = useRef<number | null>(null);

    const filteredImages = activeTab === 'All'
        ? images
        : images.filter(img => (img.tab || '').toLowerCase() === activeTab.toLowerCase());

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setIsUploading(true);
        try {
            for (let i = 0; i < files.length; i++) {
                const originalFile = files[i];
                const compressedFile = await compressImage(originalFile);
                const formData = new FormData();
                formData.append('media', compressedFile);
                formData.append('category', 'gallery');
                let title = originalFile.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
                formData.append('title', title);
                const result = await uploadMedia(formData);
                if (result.success && result.url) {
                    setImages(prev => [{ id: result.id!, title, imageUrl: result.url!, category: 'gallery', tab: null }, ...prev]);
                }
            }
        } catch { alert('Failed to upload some images. Please try again.'); }
        finally { setIsUploading(false); e.target.value = ''; }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this image?')) return;
        try {
            await deleteMedia(id);
            setImages(images.filter(img => img.id !== id));
        } catch { alert('Failed to delete image.'); }
    };

    // Drag within grid (reorder)
    const handleDragStart = (index: number, id: string) => {
        dragIndex.current = index;
        dragId.current = id;
    };

    const handleDragOverGrid = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        dragOverIndex.current = index;
    };

    const handleDropGrid = () => {
        if (dragIndex.current === null || dragOverIndex.current === null) return;
        if (dragIndex.current === dragOverIndex.current) return;
        const reordered = [...images];
        const srcId = dragId.current;
        const srcGlobalIdx = reordered.findIndex(img => img.id === srcId);
        const targetImg = filteredImages[dragOverIndex.current];
        const targetGlobalIdx = reordered.findIndex(img => img.id === targetImg.id);
        const [moved] = reordered.splice(srcGlobalIdx, 1);
        reordered.splice(targetGlobalIdx, 0, moved);
        setImages(reordered);
        setIsDirty(true);
        dragIndex.current = null; dragOverIndex.current = null; dragId.current = null;
    };

    // Drag onto a tab to assign category
    const handleDropOnTab = async (tab: Tab) => {
        setTabDragOver(null);
        if (!dragId.current) return;
        const id = dragId.current;
        dragId.current = null;
        const newTab = tab === 'All' ? null : tab.toLowerCase();
        setImages(prev => prev.map(img => img.id === id ? { ...img, tab: newTab } : img));
        await updateGalleryImageTab(id, newTab);
    };

    const handleSaveOrder = async () => {
        setIsSaving(true);
        try {
            await reorderGalleryImages(images.map(img => img.id));
            setIsDirty(false);
            setSavedMsg(true);
            setTimeout(() => setSavedMsg(false), 2500);
        } catch { alert('Failed to save order.'); }
        finally { setIsSaving(false); }
    };

    return (
        <div className="space-y-6">
            {/* Upload */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-10 bg-gray-50 hover:bg-gray-100 transition-colors relative">
                    <input type="file" accept="image/*" multiple onChange={handleFileUpload} disabled={isUploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                    {isUploading ? (
                        <div className="flex flex-col items-center gap-3 text-amber-600">
                            <Loader2 className="w-10 h-10 animate-spin" />
                            <p className="font-medium">Uploading and converting to WebP...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 text-gray-500">
                            <Upload className="w-10 h-10 text-gray-400" />
                            <p className="font-medium">Click or drag images to upload</p>
                            <p className="text-xs text-gray-400">Multiple files supported. Automatically converted to WebP.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs — also drop targets */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-1 px-4 pt-4 pb-0 border-b border-gray-100">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            onDragOver={e => { e.preventDefault(); setTabDragOver(tab); }}
                            onDragLeave={() => setTabDragOver(null)}
                            onDrop={() => handleDropOnTab(tab)}
                            className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-all ${
                                activeTab === tab
                                    ? 'border-gray-900 text-gray-900'
                                    : 'border-transparent text-gray-400 hover:text-gray-700'
                            } ${tabDragOver === tab ? 'bg-emerald-50 border-emerald-400 text-emerald-700 scale-105' : ''}`}
                        >
                            {tab}
                            <span className="ml-1.5 text-xs text-gray-400">
                                ({tab === 'All' ? images.length : images.filter(i => (i.tab || '').toLowerCase() === tab.toLowerCase()).length})
                            </span>
                        </button>
                    ))}
                    <div className="flex-1" />
                    {isDirty && (
                        <button onClick={handleSaveOrder} disabled={isSaving}
                            className="mb-2 inline-flex items-center gap-2 px-4 py-1.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-60 transition-colors">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isSaving ? 'Saving...' : 'Save Order'}
                        </button>
                    )}
                    {savedMsg && <span className="mb-2 text-sm text-emerald-600 font-semibold">Order saved!</span>}
                </div>

                <div className="p-4">
                    <p className="text-xs text-gray-400 mb-4">Drag an image onto a tab above to assign it to that category. Drag within the grid to reorder.</p>

                    {filteredImages.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            {activeTab === 'All' ? 'No images yet.' : `No images in ${activeTab} yet. Drag images here from the All tab.`}
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                            {filteredImages.map((image, index) => (
                                <div
                                    key={image.id}
                                    draggable
                                    onDragStart={() => handleDragStart(index, image.id)}
                                    onDragOver={e => handleDragOverGrid(e, index)}
                                    onDrop={handleDropGrid}
                                    className="group relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square cursor-grab active:cursor-grabbing"
                                >
                                    <Image src={image.imageUrl} alt={image.title} fill
                                        className="object-cover pointer-events-none"
                                        sizes="(max-width: 768px) 25vw, 12vw" />
                                    {image.tab && (
                                        <div className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded capitalize">
                                            {image.tab}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="absolute top-2 left-2 p-1 bg-black/50 text-white rounded">
                                            <GripVertical className="w-3 h-3" />
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                            <p className="text-white text-[9px] font-medium truncate">{image.title}</p>
                                        </div>
                                        <button onClick={() => handleDelete(image.id)}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
