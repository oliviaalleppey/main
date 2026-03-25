'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { GripVertical, ImagePlus, X } from 'lucide-react';
import Image from 'next/image';
import { upload } from '@vercel/blob/client';

interface ImageUploadProps {
    value: string[];
    onChange: (value: string[]) => void;
    onRemove: (value: string) => void;
    disabled?: boolean;
}

export function ImageUpload({
    value,
    onChange,
    onRemove,
    disabled
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragFromIndexRef = useRef<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    useEffect(() => {
        if (dragOverIndex != null && dragOverIndex >= value.length) {
            setDragOverIndex(null);
        }
    }, [dragOverIndex, value.length]);

    const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const newBlob = await upload(file.name, file, {
                access: 'public',
                handleUploadUrl: '/api/upload',
            });

            onChange([...value, newBlob.url]);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload image');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const reorder = (from: number, to: number) => {
        if (from === to) return;
        const next = [...value];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        onChange(next);
    };

    return (
        <div>
            {value.length > 1 && (
                <p className="mb-3 text-[11px] text-gray-500">
                    Drag images to reorder. The first image is used as the primary photo.
                </p>
            )}
            <div className="mb-4 flex items-center gap-4 flex-wrap">
                {value.map((url, index) => (
                    <div
                        key={url}
                        className={`relative w-[200px] h-[200px] rounded-md overflow-hidden border transition-colors ${dragOverIndex === index ? 'border-[var(--brand-primary)]' : 'border-transparent'
                            }`}
                        draggable={!disabled && !isUploading}
                        onDragStart={(e) => {
                            if (disabled || isUploading) return;
                            dragFromIndexRef.current = index;
                            setDragOverIndex(null);
                            e.dataTransfer.effectAllowed = 'move';
                            // Required for Firefox to initiate dragging.
                            e.dataTransfer.setData('text/plain', String(index));
                        }}
                        onDragOver={(e) => {
                            if (disabled || isUploading) return;
                            e.preventDefault();
                            setDragOverIndex(index);
                            e.dataTransfer.dropEffect = 'move';
                        }}
                        onDragLeave={() => setDragOverIndex(null)}
                        onDrop={(e) => {
                            if (disabled || isUploading) return;
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
                        aria-label={`Image ${index + 1} of ${value.length}. Drag to reorder.`}
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
                                disabled={disabled || isUploading}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <Image
                            fill
                            className="object-cover"
                            alt="Image"
                            src={url}
                        />
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-4">
                <Button
                    type="button"
                    disabled={disabled || isUploading}
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <ImagePlus className="h-4 w-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Upload an Image'}
                </Button>
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={onUpload}
                    disabled={disabled || isUploading}
                />
            </div>
        </div>
    );
}

export default ImageUpload;
