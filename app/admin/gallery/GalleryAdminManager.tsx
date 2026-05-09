'use client';

import { useState, useRef } from 'react';
import { uploadMedia, deleteMedia, reorderGalleryImages } from '../media/actions';
import { Upload, X, Loader2, Image as ImageIcon, GripVertical, Save } from 'lucide-react';
import Image from 'next/image';

interface GalleryImage {
    id: string;
    title: string;
    imageUrl: string;
    category: string;
}

const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new window.Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1920;
                const MAX_HEIGHT = 1920;
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                } else {
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const newName = file.name.replace(/\.[^/.]+$/, ".jpg");
                        resolve(new File([blob], newName, { type: 'image/jpeg' }));
                    } else {
                        reject(new Error('Canvas to Blob failed'));
                    }
                }, 'image/jpeg', 0.85);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

export default function GalleryAdminManager({ initialImages }: { initialImages: GalleryImage[] }) {
    const [images, setImages] = useState<GalleryImage[]>(initialImages);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [savedMsg, setSavedMsg] = useState(false);

    const dragIndex = useRef<number | null>(null);
    const dragOverIndex = useRef<number | null>(null);

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
                let title = originalFile.name.replace(/\.[^/.]+$/, "");
                title = title.replace(/_/g, ' ');
                formData.append('title', title);
                const result = await uploadMedia(formData);
                if (result.success && result.url) {
                    setImages((prev) => [
                        { id: result.id!, title, imageUrl: result.url!, category: 'gallery' },
                        ...prev,
                    ]);
                }
            }
        } catch (error) {
            console.error('Failed to upload images:', error);
            alert('Failed to upload some images. Please try again.');
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this image?')) return;
        try {
            await deleteMedia(id);
            setImages(images.filter((img) => img.id !== id));
        } catch (error) {
            console.error('Failed to delete media:', error);
            alert('Failed to delete image.');
        }
    };

    const handleDragStart = (index: number) => {
        dragIndex.current = index;
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        dragOverIndex.current = index;
    };

    const handleDrop = () => {
        if (dragIndex.current === null || dragOverIndex.current === null) return;
        if (dragIndex.current === dragOverIndex.current) return;

        const reordered = [...images];
        const [moved] = reordered.splice(dragIndex.current, 1);
        reordered.splice(dragOverIndex.current, 0, moved);
        setImages(reordered);
        setIsDirty(true);
        dragIndex.current = null;
        dragOverIndex.current = null;
    };

    const handleSaveOrder = async () => {
        setIsSaving(true);
        try {
            await reorderGalleryImages(images.map((img) => img.id));
            setIsDirty(false);
            setSavedMsg(true);
            setTimeout(() => setSavedMsg(false), 2500);
        } catch {
            alert('Failed to save order. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Upload Area */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-10 bg-gray-50 hover:bg-gray-100 transition-colors relative">
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
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

            {/* Gallery Grid */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                        <h2 className="text-lg font-semibold text-gray-900">Gallery Images ({images.length})</h2>
                        <span className="text-xs text-gray-400">Drag images to reorder</span>
                    </div>
                    {isDirty && (
                        <button
                            onClick={handleSaveOrder}
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-60 transition-colors"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isSaving ? 'Saving...' : 'Save Order'}
                        </button>
                    )}
                    {savedMsg && (
                        <span className="text-sm text-emerald-600 font-semibold">Order saved!</span>
                    )}
                </div>

                {images.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        No images in the gallery yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {images.map((image, index) => (
                            <div
                                key={image.id}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDrop={handleDrop}
                                className="group relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square cursor-grab active:cursor-grabbing"
                            >
                                <Image
                                    src={image.imageUrl}
                                    alt={image.title}
                                    fill
                                    className="object-cover pointer-events-none"
                                    sizes="(max-width: 768px) 50vw, 25vw"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="absolute top-2 left-2 p-1.5 bg-black/50 text-white rounded-lg">
                                        <GripVertical className="w-4 h-4" />
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                        <p className="text-white text-xs font-medium truncate">{image.title}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(image.id)}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                                        title="Delete image"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
