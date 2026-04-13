'use client';

import { useState } from 'react';
import { setMembershipImage } from './actions';
import { UploadCloud, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import { toWebPClient } from './webp-utils';

const PRIVILEGES = [
    { key: 'wellness', label: 'Everyday Access', sub: 'Wellness & Facilities' },
    { key: 'dining', label: 'Dining Privileges', sub: 'Food & Beverage' },
    { key: 'stay', label: 'Stay Privileges', sub: 'Rooms & Suites' },
    { key: 'spa', label: 'Spa & Wellness', sub: 'Treatments & Therapies' },
    { key: 'events', label: 'Events & Celebrations', sub: 'Banquets & Catering' },
];

interface Props {
    images: Record<string, string>;
}

export default function MembershipImages({ images: initialImages }: Props) {
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
            const result = await setMembershipImage(key, fd);
            setImages(prev => ({ ...prev, [key]: result.url }));
            toast.success('Image updated!');
            router.refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(null);
        }
    };

    return (
        <div>
            <p className="text-sm text-gray-500 mb-6">Upload images for each membership privilege section on the membership page.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {PRIVILEGES.map(p => {
                    const imageUrl = images[p.key];
                    const isUploading = uploading === p.key;
                    return (
                        <div key={p.key} className="border border-gray-200 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="font-medium text-[var(--text-dark)]">{p.label}</h3>
                                {imageUrl && (
                                    <span className="text-xs text-green-600 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                                        Set
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-400 mb-3">{p.sub}</p>
                            <div className="rounded-lg overflow-hidden aspect-video bg-gray-100 mb-3">
                                {imageUrl ? (
                                    <img src={imageUrl} alt={p.label} className="w-full h-full object-cover" />
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
                                id={`membership-file-${p.key}`}
                                onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(p.key, f); }}
                            />
                            <label
                                htmlFor={`membership-file-${p.key}`}
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
