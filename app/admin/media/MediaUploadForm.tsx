'use client';

import { useState, useRef } from 'react';
import { uploadHeroMedia } from './actions';
import { UploadCloud, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MediaUploadForm() {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('video/') && !file.type.startsWith('image/')) {
            toast.error('Only images and videos are supported');
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('media', file);
            await uploadHeroMedia(formData);
            toast.success('Media successfully updated!');
        } catch (error) {
            toast.error('Failed to upload media');
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div 
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors h-[250px] cursor-pointer
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
                    <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-amber-500">
                        <UploadCloud className="w-8 h-8" />
                    </div>
                    <p className="text-[var(--text-dark)] font-medium mb-1">Click or drag media here</p>
                    <p className="text-gray-500 text-sm">Supports Video (.mp4, .webm) or Image</p>
                </>
            )}
        </div>
    );
}
