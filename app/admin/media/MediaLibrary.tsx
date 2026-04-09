'use client';

import { useState, useRef } from 'react';
import { uploadMedia, bulkImportMedia, deleteMedia } from './actions';
import { MEDIA_CATEGORIES } from './constants';
import { UploadCloud, Download, Trash2, Image as ImageIcon, Video, Filter, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface MediaItem {
    id: string;
    title: string;
    imageUrl: string;
    category: string;
    createdAt: Date;
}

function getItemType(url: string): 'video' | 'image' {
    return /\.(mp4|webm)/i.test(url) ? 'video' : 'image';
}

export default function MediaLibrary({ items }: { items: MediaItem[] }) {
    const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [showUpload, setShowUpload] = useState(false);
    const [showBulkImport, setShowBulkImport] = useState(false);

    // Upload state
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadCategory, setUploadCategory] = useState('general');
    const [uploadTitle, setUploadTitle] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Bulk import state
    const [bulkUrls, setBulkUrls] = useState('');
    const [bulkCategory, setBulkCategory] = useState('general');
    const [isImporting, setIsImporting] = useState(false);

    const router = useRouter();

    // Filtering
    let filtered = [...items];
    if (typeFilter !== 'all') filtered = filtered.filter(i => getItemType(i.imageUrl) === typeFilter);
    if (categoryFilter !== 'all') filtered = filtered.filter(i => (i.category || 'general') === categoryFilter);
    if (sortOrder === 'oldest') filtered = filtered.reverse();

    const usedCategories = [...new Set(items.map(i => i.category || 'general'))];

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            toast.error('Only images and videos are supported');
            return;
        }
        setIsUploading(true);
        try {
            const fd = new FormData();
            fd.append('media', file);
            fd.append('category', uploadCategory);
            fd.append('page', uploadCategory);
            fd.append('title', uploadTitle || file.name);
            await uploadMedia(fd);
            toast.success('Uploaded successfully!');
            setUploadTitle('');
            setShowUpload(false);
            router.refresh();
        } catch {
            toast.error('Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleBulkImport = async () => {
        const urls = bulkUrls.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'));
        if (!urls.length) { toast.error('No valid URLs found'); return; }
        setIsImporting(true);
        try {
            const result = await bulkImportMedia(urls, bulkCategory);
            toast.success(`Imported ${result.count} item${result.count !== 1 ? 's' : ''}!`);
            setBulkUrls('');
            setShowBulkImport(false);
            router.refresh();
        } catch {
            toast.error('Import failed');
        } finally {
            setIsImporting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this media?')) return;
        await deleteMedia(id);
        toast.success('Deleted');
        window.location.reload();
    };

    return (
        <div>
            {/* Top action bar */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => { setShowBulkImport(o => !o); setShowUpload(false); }}
                    className="flex items-center gap-2 px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-[var(--text-dark)] hover:border-amber-300 hover:text-amber-600 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Bulk Import
                    {showBulkImport ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                <button
                    onClick={() => { setShowUpload(o => !o); setShowBulkImport(false); }}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    <UploadCloud className="w-4 h-4" />
                    {showUpload ? 'Close' : 'Upload Media'}
                </button>
            </div>

            {/* Upload form */}
            {showUpload && (
                <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-100">
                    <h3 className="text-sm font-semibold text-[var(--text-dark)] mb-4">Upload New Media</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                            <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)}
                                className="w-full p-2 border border-[#E8E0D5] rounded-lg bg-white text-sm focus:border-[#C9A84C] focus:outline-none">
                                {MEDIA_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Title (optional)</label>
                            <input type="text" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)}
                                placeholder="Enter a title"
                                className="w-full p-2 border border-[#E8E0D5] rounded-lg bg-white text-sm focus:border-[#C9A84C] focus:outline-none" />
                        </div>
                    </div>
                    <div
                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors
                            ${isDragging ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
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
                                <p className="text-sm font-medium">Uploading to cloud...</p>
                            </div>
                        ) : (
                            <>
                                <UploadCloud className="w-8 h-8 text-amber-400 mb-2" />
                                <p className="text-sm text-[var(--text-dark)] font-medium">Click or drag file here</p>
                                <p className="text-xs text-gray-400 mt-1">Images auto-converted to WebP · Videos supported</p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Bulk import form */}
            {showBulkImport && (
                <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-100">
                    <h3 className="text-sm font-semibold text-[var(--text-dark)] mb-4">Bulk Import from URLs</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Category for all</label>
                            <select value={bulkCategory} onChange={e => setBulkCategory(e.target.value)}
                                className="w-full p-2 border border-[#E8E0D5] rounded-lg bg-white text-sm focus:border-[#C9A84C] focus:outline-none">
                                {MEDIA_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">URLs — one per line</label>
                            <textarea value={bulkUrls} onChange={e => setBulkUrls(e.target.value)} rows={6}
                                placeholder={"https://your-blob-url.com/photo1.jpg\nhttps://your-blob-url.com/photo2.jpg"}
                                className="w-full p-2 border border-[#E8E0D5] rounded-lg bg-white text-xs font-mono focus:border-[#C9A84C] focus:outline-none resize-none" />
                            {bulkUrls.split('\n').filter(u => u.trim().startsWith('http')).length > 0 && (
                                <p className="text-xs text-gray-400 mt-1">
                                    {bulkUrls.split('\n').filter(u => u.trim().startsWith('http')).length} URL(s) detected
                                </p>
                            )}
                        </div>
                        <button onClick={handleBulkImport} disabled={isImporting}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                            {isImporting
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</>
                                : <><Download className="w-4 h-4" /> Import</>}
                        </button>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-5 pb-5 border-b border-gray-100">
                <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as 'all' | 'image' | 'video')}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:border-amber-400 focus:outline-none">
                    <option value="all">All Types</option>
                    <option value="image">Images</option>
                    <option value="video">Videos</option>
                </select>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:border-amber-400 focus:outline-none">
                    <option value="all">All Categories</option>
                    {MEDIA_CATEGORIES.filter(c => usedCategories.includes(c.value)).map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                </select>
                <select value={sortOrder} onChange={e => setSortOrder(e.target.value as 'newest' | 'oldest')}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:border-amber-400 focus:outline-none">
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                </select>
                <span className="ml-auto text-xs text-gray-400">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Grid */}
            {items.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No media uploaded yet</p>
                    <p className="text-sm mt-1">Click "Upload Media" to get started</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                    No media matches the current filters.
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filtered.map(item => {
                        const isVideo = getItemType(item.imageUrl) === 'video';
                        return (
                            <div key={item.id} className="group">
                                <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video mb-2">
                                    {isVideo ? (
                                        <video src={item.imageUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                                    )}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button onClick={() => handleDelete(item.id)}
                                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {isVideo && (
                                        <div className="absolute top-1.5 left-1.5 bg-black/60 rounded px-1.5 py-0.5 flex items-center gap-1">
                                            <Video className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-[var(--text-dark)] font-medium truncate leading-tight">
                                    {item.title || 'Untitled'}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5 capitalize">{item.category || 'general'}</p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
