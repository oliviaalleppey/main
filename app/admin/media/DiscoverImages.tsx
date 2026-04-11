'use client';

import { useState } from 'react';
import { setDiscoverExperienceImage } from './actions';
import { UploadCloud, Loader2 } from 'lucide-react';
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
                    resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }));
                },
                'image/webp', 0.85,
            );
        };
        img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Failed to load image')); };
        img.src = objectUrl;
    });
}

const EXPERIENCES = [
    { key: 'spa', label: 'The Spa at Olivia', tag: 'Wellness' },
    { key: 'dining', label: 'Kerala Cuisine', tag: 'Dining' },
    { key: 'backwater', label: 'Backwater Cruises', tag: 'Experiences' },
    { key: 'yoga', label: 'Yoga & Meditation', tag: 'Wellness' },
    { key: 'membership', label: 'Lifestyle Membership', tag: 'Membership' },
];

interface Props {
    images: Record<string, string>;
}

export default function DiscoverImages({ images: initialImages }: Props) {
    const [images, setImages] = useState<Record<string, string>>(initialImages);
    const [uploading, setUploading] = useState<string | null>(null);
    const router = useRouter();

    const handleUpload = async (key: string, file: File) => {
        setUploading(key);
        try {
            const webpFile = await toWebPClient(file);
            const blob = await upload(webpFile.name, webpFile, {
                access: 'public',
                handleUploadUrl: '/api/upload',
            });
            const fd = new FormData();
            fd.append('url', blob.url);
            const result = await setDiscoverExperienceImage(key, fd);
            setImages(prev => ({ ...prev, [key]: result.url }));
            toast.success('Image updated!');
            router.refresh();
        } catch {
            toast.error('Upload failed');
        } finally {
            setUploading(null);
        }
    };

    return (
        <div>
            <p className="text-sm text-gray-500 mb-6">Upload images for the "Curated for You" experience cards on the Discover page.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {EXPERIENCES.map(exp => {
                    const imageUrl = images[exp.key];
                    const isUploading = uploading === exp.key;
                    return (
                        <div key={exp.key} className="border border-gray-200 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="font-medium text-[var(--text-dark)]">{exp.label}</h3>
                                {imageUrl && (
                                    <span className="text-xs text-green-600 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                                        Set
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-400 mb-3">{exp.tag}</p>
                            <div className="rounded-lg overflow-hidden bg-gray-100 mb-3" style={{ aspectRatio: '4/5' }}>
                                {imageUrl ? (
                                    <img src={imageUrl} alt={exp.label} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                                        No image uploaded
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id={`discover-file-${exp.key}`}
                                onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(exp.key, f); }}
                            />
                            <label
                                htmlFor={`discover-file-${exp.key}`}
                                className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm cursor-pointer transition-colors"
                            >
                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                {isUploading ? 'Uploading...' : 'Upload Image'}
                            </label>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
