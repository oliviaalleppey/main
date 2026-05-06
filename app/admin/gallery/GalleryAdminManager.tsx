'use client';

import { useState } from 'react';
import { uploadMedia, deleteMedia } from '../media/actions';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface GalleryImage {
    id: string;
    title: string;
    imageUrl: string;
    category: string;
}

export default function GalleryAdminManager({ initialImages }: { initialImages: GalleryImage[] }) {
    const [images, setImages] = useState<GalleryImage[]>(initialImages);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const formData = new FormData();
                formData.append('media', file);
                formData.append('category', 'gallery');
                
                // Format the filename for the title:
                // e.g., "Boat_Race_Finish_Line.jpg" -> "Boat Race Finish Line"
                let title = file.name.replace(/\.[^/.]+$/, ""); // remove extension
                title = title.replace(/_/g, ' '); // replace underscores with spaces
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
            // Reset the input
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
                <div className="flex items-center gap-3 mb-6">
                    <ImageIcon className="w-5 h-5 text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-900">Gallery Images ({images.length})</h2>
                </div>

                {images.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        No images in the gallery yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {images.map((image) => (
                            <div key={image.id} className="group relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square">
                                <Image
                                    src={image.imageUrl}
                                    alt={image.title}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 50vw, 25vw"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
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
