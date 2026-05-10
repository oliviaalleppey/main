'use client';

import { useState, useRef } from 'react';
import { uploadMedia, deleteMedia, reorderGalleryImages, addGalleryImageTab, removeGalleryImageTab, clearTabFromImages, saveGalleryTabLabels } from '../media/actions';
import { Upload, X, Loader2, GripVertical, Save, Pencil, Check, Plus } from 'lucide-react';
import Image from 'next/image';

interface GalleryImage {
    id: string;
    title: string;
    imageUrl: string;
    category: string;
    tabs?: string[] | null;
}

interface TabDef { slug: string; label: string; }

const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new window.Image();
            img.src = e.target?.result as string;
            img.onload = () => {
                const MAX = 1920;
                let w = img.width, h = img.height;
                if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
                else { if (h > MAX) { w *= MAX / h; h = MAX; } }
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
                canvas.toBlob(blob => {
                    if (blob) resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' }));
                    else reject(new Error('Blob failed'));
                }, 'image/jpeg', 0.85);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
};

const getImageTabs = (img: GalleryImage): string[] => {
    if (!img.tabs) return [];
    if (Array.isArray(img.tabs)) return img.tabs;
    return [];
};

export default function GalleryAdminManager({ initialImages, initialTabs }: { initialImages: GalleryImage[]; initialTabs: TabDef[] }) {
    const [images, setImages] = useState<GalleryImage[]>(initialImages);
    const [tabs, setTabs] = useState<TabDef[]>(initialTabs);
    const [activeTab, setActiveTab] = useState<string>('all');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [savedMsg, setSavedMsg] = useState(false);
    const [tabDragOver, setTabDragOver] = useState<string | null>(null);
    const [editingTab, setEditingTab] = useState<string | null>(null);
    const [editingLabel, setEditingLabel] = useState('');

    const dragIds = useRef<string[]>([]);
    const dragIndex = useRef<number | null>(null);
    const dragOverIndex = useRef<number | null>(null);
    const isDraggingToTab = useRef(false);

    const filteredImages = activeTab === 'all'
        ? images
        : images.filter(img => getImageTabs(img).includes(activeTab));

    const tabCount = (slug: string) =>
        slug === 'all' ? images.length : images.filter(i => getImageTabs(i).includes(slug)).length;

    // ── Upload ──────────────────────────────────────────────────────────────
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length) return;
        setIsUploading(true);
        try {
            for (let i = 0; i < files.length; i++) {
                const compressed = await compressImage(files[i]);
                const formData = new FormData();
                formData.append('media', compressed);
                formData.append('category', 'gallery');
                const title = files[i].name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
                formData.append('title', title);
                const result = await uploadMedia(formData);
                if (result.success && result.url)
                    setImages(prev => [{ id: result.id!, title, imageUrl: result.url!, category: 'gallery', tabs: [] }, ...prev]);
            }
        } catch { alert('Failed to upload some images.'); }
        finally { setIsUploading(false); e.target.value = ''; }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this image?')) return;
        try {
            await deleteMedia(id);
            setImages(prev => prev.filter(i => i.id !== id));
            setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
        } catch { alert('Failed to delete.'); }
    };

    // ── Selection ───────────────────────────────────────────────────────────
    const toggleSelect = (id: string) => {
        setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
    };
    const clearSelection = () => setSelected(new Set());

    // ── Drag within grid (reorder) ──────────────────────────────────────────
    const handleDragStart = (index: number, id: string) => {
        isDraggingToTab.current = false;
        dragIndex.current = index;
        dragIds.current = selected.has(id) && selected.size > 1 ? [...selected] : [id];
    };

    const handleDragOverGrid = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        dragOverIndex.current = index;
    };

    const handleDropGrid = () => {
        if (isDraggingToTab.current) return;
        if (dragIndex.current === null || dragOverIndex.current === null || dragIndex.current === dragOverIndex.current) return;
        const reordered = [...images];
        const targetImg = filteredImages[dragOverIndex.current];
        const movingIds = new Set(dragIds.current);
        const moving = reordered.filter(i => movingIds.has(i.id));
        const rest = reordered.filter(i => !movingIds.has(i.id));
        const insertAt = rest.findIndex(i => i.id === targetImg?.id);
        rest.splice(insertAt >= 0 ? insertAt : rest.length, 0, ...moving);
        setImages(rest);
        setIsDirty(true);
        dragIndex.current = null; dragOverIndex.current = null;
    };

    // ── Drag onto tab — ADDS to tabs array ─────────────────────────────────
    const handleDropOnTab = async (slug: string) => {
        isDraggingToTab.current = true;
        setTabDragOver(null);
        if (!dragIds.current.length || slug === 'all') return;
        const ids = [...dragIds.current];
        dragIds.current = [];
        // Optimistic update — add slug to each image's tabs array
        setImages(prev => prev.map(img =>
            ids.includes(img.id)
                ? { ...img, tabs: [...new Set([...getImageTabs(img), slug])] }
                : img
        ));
        clearSelection();
        await addGalleryImageTab(ids, slug);
    };

    // ── Remove image from a specific tab ───────────────────────────────────
    const handleRemoveFromTab = async (imageId: string, slug: string) => {
        setImages(prev => prev.map(img =>
            img.id === imageId ? { ...img, tabs: getImageTabs(img).filter(t => t !== slug) } : img
        ));
        await removeGalleryImageTab(imageId, slug);
    };

    // ── Save reorder ────────────────────────────────────────────────────────
    const handleSaveOrder = async () => {
        setIsSaving(true);
        try {
            await reorderGalleryImages(images.map(i => i.id));
            setIsDirty(false);
            setSavedMsg(true);
            setTimeout(() => setSavedMsg(false), 2500);
        } catch { alert('Failed to save order.'); }
        finally { setIsSaving(false); }
    };

    // ── Add / Rename / Remove tabs ──────────────────────────────────────────
    const handleAddTab = async () => {
        const slug = `tab_${Date.now()}`;
        const newTabs = [...tabs, { slug, label: 'New Tab' }];
        setTabs(newTabs);
        await saveGalleryTabLabels(newTabs);
        setEditingTab(slug);
        setEditingLabel('New Tab');
    };

    const commitEditTab = async () => {
        if (!editingTab || !editingLabel.trim()) { setEditingTab(null); return; }
        const newTabs = tabs.map(t => t.slug === editingTab ? { ...t, label: editingLabel.trim() } : t);
        setTabs(newTabs);
        setEditingTab(null);
        await saveGalleryTabLabels(newTabs);
    };

    const handleRemoveTab = async (slug: string) => {
        if (!confirm(`Remove this tab? Images will stay but lose this tab assignment.`)) return;
        const newTabs = tabs.filter(t => t.slug !== slug);
        setImages(prev => prev.map(img => ({ ...img, tabs: getImageTabs(img).filter(t => t !== slug) })));
        setTabs(newTabs);
        if (activeTab === slug) setActiveTab('all');
        await Promise.all([clearTabFromImages(slug), saveGalleryTabLabels(newTabs)]);
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

            {/* Main panel */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                {/* Tab bar */}
                <div className="flex items-center gap-1 px-4 pt-4 border-b border-gray-100 overflow-x-auto">
                    {/* ALL */}
                    <button onClick={() => setActiveTab('all')}
                        onDragOver={e => e.preventDefault()}
                        className={`relative flex-shrink-0 px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-all duration-200 ${activeTab === 'all' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
                        All <span className="ml-1 text-xs opacity-60">({tabCount('all')})</span>
                    </button>

                    {/* Custom tabs */}
                    {tabs.map(tab => (
                        <div key={tab.slug}
                            onDragOver={e => { e.preventDefault(); setTabDragOver(tab.slug); }}
                            onDragLeave={() => setTabDragOver(null)}
                            onDrop={() => handleDropOnTab(tab.slug)}
                            className={`group relative flex-shrink-0 flex items-center gap-1 px-3 py-2.5 rounded-t-lg border-b-2 transition-all duration-200
                                ${activeTab === tab.slug ? 'border-gray-900' : 'border-transparent'}
                                ${tabDragOver === tab.slug ? 'scale-125 bg-emerald-50 border-emerald-500 shadow-xl z-10 ring-2 ring-emerald-400 ring-offset-1' : ''}`}>
                            {editingTab === tab.slug ? (
                                <div className="flex items-center gap-1">
                                    <input autoFocus value={editingLabel}
                                        onChange={e => setEditingLabel(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') commitEditTab(); if (e.key === 'Escape') setEditingTab(null); }}
                                        className="w-24 text-sm font-semibold border-b border-gray-400 outline-none bg-transparent" />
                                    <button onClick={commitEditTab} className="text-emerald-600 hover:text-emerald-700"><Check className="w-3.5 h-3.5" /></button>
                                </div>
                            ) : (
                                <>
                                    <button onClick={() => setActiveTab(tab.slug)}
                                        className={`text-sm font-semibold ${activeTab === tab.slug ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'}`}>
                                        {tab.label} <span className="ml-1 text-xs opacity-60">({tabCount(tab.slug)})</span>
                                    </button>
                                    <button onClick={() => { setEditingTab(tab.slug); setEditingLabel(tab.label); }}
                                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-600 transition-opacity" title="Rename">
                                        <Pencil className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => handleRemoveTab(tab.slug)}
                                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity" title="Remove tab">
                                        <X className="w-3 h-3" />
                                    </button>
                                </>
                            )}
                        </div>
                    ))}

                    <button onClick={handleAddTab}
                        className="flex-shrink-0 mb-1 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Add Tab
                    </button>

                    <div className="flex-1" />

                    {selected.size > 0 && (
                        <div className="mb-2 flex items-center gap-2">
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                {selected.size} selected — drag to a tab
                            </span>
                            <button onClick={clearSelection} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
                        </div>
                    )}
                    {isDirty && (
                        <button onClick={handleSaveOrder} disabled={isSaving}
                            className="mb-2 inline-flex items-center gap-2 px-4 py-1.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-60 transition-colors">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isSaving ? 'Saving...' : 'Save Order'}
                        </button>
                    )}
                    {savedMsg && <span className="mb-2 text-sm text-emerald-600 font-semibold">Saved!</span>}
                </div>

                <div className="p-4">
                    <p className="text-xs text-gray-400 mb-4">
                        Click to select · Drag selected onto a tab to add (same image can be in multiple tabs) · Click × on a badge to remove from that tab
                    </p>

                    {filteredImages.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            {activeTab === 'all' ? 'No images yet.' : 'No images in this tab. Drag images onto the tab to assign them.'}
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                            {filteredImages.map((image, index) => {
                                const isSelected = selected.has(image.id);
                                const imageTabs = getImageTabs(image);
                                return (
                                    <div key={image.id}
                                        draggable
                                        onDragStart={() => handleDragStart(index, image.id)}
                                        onDragOver={e => handleDragOverGrid(e, index)}
                                        onDrop={handleDropGrid}
                                        onClick={() => toggleSelect(image.id)}
                                        className={`group relative rounded-xl overflow-hidden border-2 bg-gray-50 aspect-square cursor-grab active:cursor-grabbing transition-all duration-150 ${
                                            isSelected ? 'border-blue-500 ring-2 ring-blue-300 scale-95' : 'border-gray-200 hover:border-gray-400'
                                        }`}>
                                        <Image src={image.imageUrl} alt={image.title} fill
                                            className="object-cover pointer-events-none"
                                            sizes="(max-width: 768px) 25vw, 12vw" />

                                        {isSelected && (
                                            <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center z-10">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        )}

                                        {/* Tab badges with × to remove */}
                                        {imageTabs.length > 0 && (
                                            <div className="absolute top-1 left-1 flex flex-col gap-0.5 z-10">
                                                {imageTabs.map(slug => {
                                                    const label = tabs.find(t => t.slug === slug)?.label || slug;
                                                    return (
                                                        <div key={slug} className="flex items-center gap-0.5 bg-emerald-600/90 text-white text-[7px] font-bold px-1 py-0.5 rounded">
                                                            <span className="capitalize">{label}</span>
                                                            <button
                                                                onClick={e => { e.stopPropagation(); handleRemoveFromTab(image.id, slug); }}
                                                                className="hover:text-red-200 leading-none">×</button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="absolute top-2 left-2 p-1 bg-black/50 text-white rounded">
                                                <GripVertical className="w-3 h-3" />
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                                <p className="text-white text-[9px] font-medium truncate">{image.title}</p>
                                            </div>
                                            <button onClick={e => { e.stopPropagation(); handleDelete(image.id); }}
                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
