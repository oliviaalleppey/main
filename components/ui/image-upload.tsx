'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { GripVertical, ImagePlus, X, ImageOff, Loader2, ArrowRight } from 'lucide-react';
import Image from 'next/image';

function formatBytes(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface SizeInfo {
    original: number;
    converted: number;
}

function ImageWithFallback({ url, sizeInfo }: { url: string; sizeInfo?: SizeInfo }) {
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
        <>
            <Image
                fill
                className="object-cover"
                alt="Room image"
                src={url}
                onError={() => setError(true)}
            />
            {sizeInfo && (
                <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-black/65 text-white text-[10px] flex items-center justify-center gap-1">
                    <span className="opacity-70">{formatBytes(sizeInfo.original)}</span>
                    <ArrowRight className="w-2.5 h-2.5 opacity-50" />
                    <span className="font-semibold">{formatBytes(sizeInfo.converted)}</span>
                    <span className="text-green-400 font-semibold ml-0.5">
                        -{Math.round((1 - sizeInfo.converted / sizeInfo.original) * 100)}%
                    </span>
                </div>
            )}
        </>
    );
}

type Phase =
    | { type: 'idle' }
    | { type: 'confirming'; file: File }
    | { type: 'uploading'; originalSize: number; progress: number }
    | { type: 'converting'; originalSize: number };

interface ImageUploadProps {
    value: string[];
    onChange: (value: string[]) => void;
    onRemove: (value: string) => void;
    disabled?: boolean;
}

export function ImageUpload({ value, onChange, onRemove, disabled }: ImageUploadProps) {
    const [phase, setPhase] = useState<Phase>({ type: 'idle' });
    const [sizeMap, setSizeMap] = useState<Record<string, SizeInfo>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragFromIndexRef = useRef<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const isBusy = phase.type === 'uploading' || phase.type === 'converting';

    useEffect(() => {
        if (dragOverIndex != null && dragOverIndex >= value.length) {
            setDragOverIndex(null);
        }
    }, [dragOverIndex, value.length]);

    const handleFileSelected = (file: File) => {
        setPhase({ type: 'confirming', file });
    };

    const doUpload = (file: File, convertToWebP: boolean) => {
        const originalSize = file.size;
        setPhase({ type: 'uploading', originalSize, progress: 0 });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('convert', String(convertToWebP));

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const pct = Math.min(95, Math.round((e.loaded / e.total) * 100));
                setPhase({ type: 'uploading', originalSize, progress: pct });
            }
        });

        xhr.upload.addEventListener('load', () => {
            if (convertToWebP) {
                setPhase({ type: 'converting', originalSize });
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const data: { url: string; originalSize: number; convertedSize?: number } =
                    JSON.parse(xhr.responseText);
                onChange([...value, data.url]);
                if (data.convertedSize) {
                    setSizeMap(prev => ({
                        ...prev,
                        [data.url]: { original: originalSize, converted: data.convertedSize! },
                    }));
                }
            } else {
                alert('Upload failed. Please try again.');
            }
            setPhase({ type: 'idle' });
            if (fileInputRef.current) fileInputRef.current.value = '';
        });

        xhr.addEventListener('error', () => {
            alert('Network error. Please try again.');
            setPhase({ type: 'idle' });
            if (fileInputRef.current) fileInputRef.current.value = '';
        });

        xhr.open('POST', '/api/admin/upload-image');
        xhr.send(formData);
    };

    const cancel = () => {
        setPhase({ type: 'idle' });
        if (fileInputRef.current) fileInputRef.current.value = '';
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
                                disabled={disabled || isBusy}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <ImageWithFallback url={url} sizeInfo={sizeMap[url]} />
                    </div>
                ))}
            </div>

            {/* Upload button */}
            <div className="flex items-center gap-4">
                <Button
                    type="button"
                    disabled={disabled || isBusy || phase.type === 'confirming'}
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <ImagePlus className="h-4 w-4 mr-2" />
                    Upload an Image
                </Button>
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelected(f); }}
                    disabled={disabled || isBusy}
                />
            </div>

            {/* Confirmation dialog */}
            {phase.type === 'confirming' && (
                <div className="mt-4 p-4 rounded-xl border border-gray-200 bg-gray-50 max-w-xs">
                    <p className="text-sm font-semibold text-gray-800 mb-0.5">Convert to WebP?</p>
                    <p className="text-xs text-gray-500 mb-0.5 truncate font-medium">{phase.file.name}</p>
                    <p className="text-xs text-gray-500 mb-4">
                        Original size: <span className="font-semibold text-gray-700">{formatBytes(phase.file.size)}</span>
                        <br />
                        <span className="text-green-600">WebP reduces size by 50–70%</span> with no visible quality loss.
                    </p>
                    <div className="flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={() => doUpload(phase.file, true)}
                            className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                            Convert to WebP &amp; Upload
                        </button>
                        <button
                            type="button"
                            onClick={() => doUpload(phase.file, false)}
                            className="w-full py-2 px-3 border border-gray-300 text-gray-600 text-xs rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            Upload original ({formatBytes(phase.file.size)})
                        </button>
                        <button
                            type="button"
                            onClick={cancel}
                            className="w-full py-1.5 text-gray-400 text-xs rounded-lg hover:text-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Uploading progress */}
            {phase.type === 'uploading' && (
                <div className="mt-4 p-4 rounded-xl border border-gray-200 bg-gray-50 max-w-xs">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-700">Uploading...</p>
                        <span className="text-sm font-semibold text-amber-600">{phase.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                            className="bg-amber-500 h-2 rounded-full transition-all duration-200"
                            style={{ width: `${phase.progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-400">
                        Original: <span className="font-medium">{formatBytes(phase.originalSize)}</span>
                    </p>
                </div>
            )}

            {/* Converting progress */}
            {phase.type === 'converting' && (
                <div className="mt-4 p-4 rounded-xl border border-amber-100 bg-amber-50 max-w-xs">
                    <div className="flex items-center gap-2 mb-2">
                        <Loader2 className="w-4 h-4 text-amber-500 animate-spin flex-shrink-0" />
                        <p className="text-sm font-medium text-amber-700">Converting to WebP...</p>
                    </div>
                    <div className="w-full bg-amber-100 rounded-full h-2 mb-2 overflow-hidden">
                        <div className="bg-amber-400 h-2 rounded-full w-3/4 animate-pulse" />
                    </div>
                    <p className="text-xs text-amber-600">
                        Original: <span className="font-medium">{formatBytes(phase.originalSize)}</span>
                        {' · '}Optimizing file size...
                    </p>
                </div>
            )}
        </div>
    );
}

export default ImageUpload;
