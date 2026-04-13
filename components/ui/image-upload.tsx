'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { GripVertical, ImagePlus, X, ImageOff, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { upload } from '@vercel/blob/client';
import { toast } from 'sonner';
import { toWebPClient } from '@/app/admin/media/webp-utils';

function ImageWithFallback({ url }: { url: string }) {
    const [error, setError] = useState(false);

    if (error) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400 gap-1">
                <ImageOff className="w-8 h-8" />
                <span className="text-[10px]">Image unavailable</span>
            </div>
        );
    }

    return (
        <Image
            fill
            className="object-cover"
            alt="Room image"
            src={url}
            onError={() => setError(true)}
        />
    );
}

interface ImageUploadProps {
    value: string[];
    onChange: (value: string[]) => void;
    onRemove: (value: string) => void;
    disabled?: boolean;
}

export function ImageUpload({ value, onChange, onRemove, disabled }: ImageUploadProps) {
    const [uploadState, setUploadState] = useState<'idle' | 'converting' | 'uploading'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragFromIndexRef = useRef<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const isBusy = uploadState !== 'idle';

    useEffect(() => {
        if (dragOverIndex != null && dragOverIndex >= value.length) {
            setDragOverIndex(null);
        }
    }, [dragOverIndex, value.length]);

    const handleFileSelected = async (file: File) => {
        try {
            // Step 1: Convert to WebP in browser
            setUploadState('converting');
            const webpFile = await toWebPClient(file);

            // Step 2: Upload directly to Vercel Blob (bypasses serverless body size limit)
            setUploadState('uploading');
            const blob = await upload(webpFile.name, webpFile, {
                access: 'public',
                handleUploadUrl: '/api/upload',
            });

            onChange([...value, blob.url]);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploadState('idle');
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const reorder = (from: number, to: number) => {
        if (from === to) return;
        const next = [...value];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        onChange(next);
    };

    const statusLabel =
        uploadState === 'converting' ? 'Converting to WebP...' :
        uploadState === 'uploading'  ? 'Uploading...' :
        null;

    return (
        <div>
            {value.length > 1 && (
                <p className="mb-3 text-[11px] text-gray-500">
                    Drag images to reorder. The first image is used as the primary photo.
                </p>
            )}

            {/* Image grid */}
            <div className="mb-4 flex items-center gap-4 flex-wrap">
                {value.map((url, index) => (
                    <div
                        key={url}
                        className={`relative w-[200px] h-[200px] rounded-md overflow-hidden border transition-colors
                            ${dragOverIndex === index ? 'border-[var(--brand-primary)]' : 'border-transparent'}`}
                        draggable={!disabled && !isBusy}
                        onDragStart={(e) => {
                            if (disabled || isBusy) return;
                            dragFromIndexRef.current = index;
                            setDragOverIndex(null);
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', String(index));
                        }}
                        onDragOver={(e) => {
                            if (disabled || isBusy) return;
                            e.preventDefault();
                            setDragOverIndex(index);
                            e.dataTransfer.dropEffect = 'move';
                        }}
                        onDragLeave={() => setDragOverIndex(null)}
                        onDrop={(e) => {
                            if (disabled || isBusy) return;
                            e.preventDefault();
                            const from = dragFromIndexRef.current;
                            dragFromIndexRef.current = null;
                            setDragOverIndex(null);
                            if (from == null) return;
                            reorder(from, index);
                        }}
                        onDragEnd={() => {
                            dragFromIndexRef.current = null;
                            setDragOverIndex(null);
                        }}
                    >
                        <div className="z-10 absolute top-2 left-2">
                            <div className="inline-flex items-center gap-1 rounded-full bg-white/90 border border-gray-200 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-gray-700 shadow-sm">
                                <GripVertical className="h-3.5 w-3.5" />
                                <span>{index === 0 ? 'Primary' : `#${index + 1}`}</span>
                            </div>
                        </div>
                        <div className="z-10 absolute top-2 right-2">
                            <Button
                                type="button"
                                onClick={() => onRemove(url)}
                                variant="destructive"
                                size="sm"
                                disabled={disabled || isBusy}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <ImageWithFallback url={url} />
                    </div>
                ))}
            </div>

            {/* Upload button */}
            <div className="flex items-center gap-3">
                <Button
                    type="button"
                    disabled={disabled || isBusy}
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {isBusy ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {uploadState === 'converting' ? 'Converting...' : 'Uploading...'}
                        </>
                    ) : (
                        <>
                            <ImagePlus className="h-4 w-4 mr-2" />
                            Upload an Image
                        </>
                    )}
                </Button>
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelected(f); }}
                    disabled={disabled || isBusy}
                />
                {statusLabel && (
                    <p className="text-xs text-gray-400">{statusLabel}</p>
                )}
            </div>
        </div>
    );
}

export default ImageUpload;
