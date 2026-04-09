'use client';

import { useState, useRef } from 'react';
import { uploadMedia } from './actions';
import { MEDIA_CATEGORIES, MEDIA_PAGES } from './constants';
import { UploadCloud, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface MediaItem {
    id: string;
    title: string;
    imageUrl: string;
    category: string;
    createdAt: Date;
}

interface MediaUploadFormProps {
    onUploadSuccess?: () => void;
    refreshTrigger?: number;
}

export default function MediaUploadForm() {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [category, setCategory] = useState('general');
    const [page, setPage] = useState('general');
    const [title, setTitle] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('video/') && !file.type.startsWith('image/')) {
            toast.error('Only images and videos are supported');
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('media', file);
            formData.append('category', category);
            formData.append('page', page);
            formData.append('title', title || file.name);
            
            const result = await uploadMedia(formData);
            toast.success('Media uploaded successfully!');
            setTitle('');
            router.refresh();
        } catch (error) {
            toast.error('Failed to upload media');
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Category and Page Selection */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--text-dark)] mb-1">Category</label>
                    <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-2.5 border border-[#E8E0D5] rounded-lg bg-white text-[var(--text-dark)] focus:border-[#C9A84C] focus:outline-none"
                    >
                        {MEDIA_CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--text-dark)] mb-1">Page</label>
                    <select 
                        value={page}
                        onChange={(e) => setPage(e.target.value)}
                        className="w-full p-2.5 border border-[#E8E0D5] rounded-lg bg-white text-[var(--text-dark)] focus:border-[#C9A84C] focus:outline-none"
                    >
                        {MEDIA_PAGES.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Title */}
            <div>
                <label className="block text-sm font-medium text-[var(--text-dark)] mb-1">Title (optional)</label>
                <input 
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter title for this media"
                    className="w-full p-2.5 border border-[#E8E0D5] rounded-lg bg-white text-[var(--text-dark)] focus:border-[#C9A84C] focus:outline-none"
                />
            </div>

            {/* Upload Area */}
            <div 
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors h-[180px] cursor-pointer
                    ${isDragging ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files[0];
                    if (file) handleFile(file);
                }}
                onClick={() => !isUploading && fileInputRef.current?.click()}
            >
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="video/*,image/*" 
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                    }}
                />
                {isUploading ? (
                    <div className="flex flex-col items-center text-amber-600">
                        <Loader2 className="w-10 h-10 mb-4 animate-spin" />
                        <p className="font-medium">Uploading to cloud...</p>
                        <p className="text-xs mt-2 opacity-70">This might take a minute for videos.</p>
                    </div>
                ) : (
                    <>
                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 text-amber-500">
                            <UploadCloud className="w-6 h-6" />
                        </div>
                        <p className="text-[var(--text-dark)] font-medium mb-1">Click or drag media here</p>
                        <p className="text-gray-500 text-xs">Supports Video (.mp4, .webm) or Image</p>
                    </>
                )}
            </div>
        </div>
    );
}