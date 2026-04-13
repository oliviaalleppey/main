'use client';

import { useState } from 'react';
import { setDiscoverExperienceImage } from './actions';
import { UploadCloud, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import { toWebPClient } from './webp-utils';

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
    type UploadState = { key: string; status: 'converting' | 'uploading'; progress: number } | null;
    const [uploadState, setUploadState] = useState<UploadState>(null);
    const router = useRouter();

    const handleUpload = async (key: string, file: File) => {
        setUploadState({ key, status: 'converting', progress: 0 });

        try {
            const fileToUpload = await toWebPClient(file);
            setUploadState({ key, status: 'uploading', progress: 0 });

            const blob = await upload(fileToUpload.name, fileToUpload, {
                access: 'public',
                handleUploadUrl: '/api/upload',
                onUploadProgress: (progressEvent) => {
                    setUploadState(prev => prev ? { ...prev, progress: Math.round(progressEvent.percentage) } : prev);
                }
            });
            const fd = new FormData();
            fd.append('url', blob.url);
            const result = await setDiscoverExperienceImage(key, fd);
            setImages(prev => ({ ...prev, [key]: result.url }));
            toast.success('Image updated!');
            router.refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploadState(null);
        }
    };

    return (
        <div>
            <p className="text-sm text-gray-500 mb-6">Upload images for the "Curated for You" experience cards on the Discover page.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {EXPERIENCES.map(exp => {
                    const imageUrl = images[exp.key];
                    const isUploading = uploadState?.key === exp.key;
                    
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
                                disabled={isUploading}
                            />
                            <label
                                htmlFor={`discover-file-${exp.key}`}
                                className={`flex items-center justify-center gap-2 w-full px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm cursor-pointer transition-colors relative overflow-hidden ${isUploading ? 'pointer-events-none' : ''}`}
                            >
                                {isUploading ? (
                                    <>
                                        <div 
                                            className="absolute left-0 top-0 bottom-0 bg-amber-700/30 transition-all duration-300"
                                            style={{ width: `${uploadState.status === 'converting' ? 100 : uploadState.progress}%` }}
                                        />
                                        <Loader2 className="w-4 h-4 animate-spin relative z-10" />
                                        <span className="relative z-10 w-24 text-left">
                                            {uploadState.status === 'converting' ? 'Converting...' : `Uploading ${uploadState.progress}%`}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud className="w-4 h-4" />
                                        <span>Upload Image</span>
                                    </>
                                )}
                            </label>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
