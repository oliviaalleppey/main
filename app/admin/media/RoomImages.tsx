'use client';

import { useRef, useState } from 'react';
import { updateRoomTypeImages, uploadRoomImageFile } from './actions';
import { RefreshCw, Trash2, Star, ChevronUp, ChevronDown, Loader2, ImagePlus, BedDouble } from 'lucide-react';
import { toast } from 'sonner';

interface RoomType {
    id: string;
    name: string;
    images: string[] | null;
}

interface Props {
    rooms: RoomType[];
}

export default function RoomImages({ rooms }: Props) {
    // Local copy of all room data so UI updates instantly without page reload
    const [roomData, setRoomData] = useState<RoomType[]>(rooms);
    // Track which image slot is currently uploading: `${roomId}:${index}`
    const [uploading, setUploading] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pendingReplaceRef = useRef<{ roomId: string; index: number } | null>(null);

    const save = async (roomId: string, newImages: string[]) => {
        try {
            await updateRoomTypeImages(roomId, newImages);
        } catch {
            toast.error('Failed to save changes');
        }
    };

    const updateImages = (roomId: string, newImages: string[]) => {
        setRoomData(prev =>
            prev.map(r => r.id === roomId ? { ...r, images: newImages } : r)
        );
        save(roomId, newImages);
    };

    const handleMakePrimary = (roomId: string, index: number) => {
        const room = roomData.find(r => r.id === roomId)!;
        const imgs = [...(room.images ?? [])];
        const [item] = imgs.splice(index, 1);
        imgs.unshift(item);
        updateImages(roomId, imgs);
        toast.success('Set as primary photo');
    };

    const handleMoveUp = (roomId: string, index: number) => {
        if (index === 0) return;
        const room = roomData.find(r => r.id === roomId)!;
        const imgs = [...(room.images ?? [])];
        [imgs[index - 1], imgs[index]] = [imgs[index], imgs[index - 1]];
        updateImages(roomId, imgs);
    };

    const handleMoveDown = (roomId: string, index: number) => {
        const room = roomData.find(r => r.id === roomId)!;
        const imgs = [...(room.images ?? [])];
        if (index >= imgs.length - 1) return;
        [imgs[index], imgs[index + 1]] = [imgs[index + 1], imgs[index]];
        updateImages(roomId, imgs);
    };

    const handleDelete = (roomId: string, index: number) => {
        if (!confirm('Remove this image from the room?')) return;
        const room = roomData.find(r => r.id === roomId)!;
        const imgs = [...(room.images ?? [])];
        imgs.splice(index, 1);
        updateImages(roomId, imgs);
        toast.success('Image removed');
    };

    const triggerReplace = (roomId: string, index: number) => {
        pendingReplaceRef.current = { roomId, index };
        fileInputRef.current?.click();
    };

    const handleReplaceFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !pendingReplaceRef.current) return;
        const { roomId, index } = pendingReplaceRef.current;
        pendingReplaceRef.current = null;
        e.target.value = '';

        const key = `${roomId}:${index}`;
        setUploading(key);
        try {
            const fd = new FormData();
            fd.append('media', file);
            const { url } = await uploadRoomImageFile(fd);
            const room = roomData.find(r => r.id === roomId)!;
            const imgs = [...(room.images ?? [])];
            imgs[index] = url;
            updateImages(roomId, imgs);
            toast.success('Image replaced!');
        } catch (err) {
            console.error('Upload failed:', err);
            toast.error('Replace failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally {
            setUploading(null);
        }
    };

    const totalImages = roomData.reduce((sum, r) => sum + (r.images?.length ?? 0), 0);

    if (totalImages === 0) {
        return (
            <div className="text-center py-16 text-gray-400">
                <BedDouble className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No room images found</p>
                <p className="text-sm mt-1">Add images to your room types from the Rooms admin section</p>
            </div>
        );
    }

    return (
        <div>
            {/* Hidden file input for replace */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleReplaceFileSelected}
            />

            <p className="text-sm text-gray-500 mb-6">
                {totalImages} image{totalImages !== 1 ? 's' : ''} across {roomData.filter(r => (r.images?.length ?? 0) > 0).length} room type{roomData.filter(r => (r.images?.length ?? 0) > 0).length !== 1 ? 's' : ''}.
                Hover an image to replace, reorder, or remove it.
            </p>

            <div className="space-y-8">
                {roomData.filter(r => (r.images?.length ?? 0) > 0).map(room => (
                    <div key={room.id}>
                        <div className="flex items-center gap-2 mb-3">
                            <BedDouble className="w-4 h-4 text-amber-500" />
                            <h3 className="text-sm font-semibold text-[var(--text-dark)]">{room.name}</h3>
                            <span className="text-xs text-gray-400">({room.images?.length ?? 0} photos)</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {(room.images ?? []).map((url, index) => {
                                const key = `${room.id}:${index}`;
                                const isUploading = uploading === key;

                                return (
                                    <div key={`${url}-${index}`} className="group relative">
                                        <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video">
                                            <img
                                                src={url}
                                                alt={`${room.name} photo ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />

                                            {/* Primary badge */}
                                            {index === 0 && (
                                                <div className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                                                    Primary
                                                </div>
                                            )}

                                            {/* Loading overlay */}
                                            {isUploading && (
                                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                                    <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                                                </div>
                                            )}

                                            {/* Action overlay on hover */}
                                            {!isUploading && (
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                                                    {/* Replace */}
                                                    <button
                                                        onClick={() => triggerReplace(room.id, index)}
                                                        className="w-full flex items-center justify-center gap-1 py-1 bg-white/90 hover:bg-white text-[var(--text-dark)] text-xs font-medium rounded transition-colors"
                                                    >
                                                        <RefreshCw className="w-3 h-3" /> Replace
                                                    </button>

                                                    {/* Set as Primary (only if not already) */}
                                                    {index !== 0 && (
                                                        <button
                                                            onClick={() => handleMakePrimary(room.id, index)}
                                                            className="w-full flex items-center justify-center gap-1 py-1 bg-amber-500/90 hover:bg-amber-500 text-white text-xs font-medium rounded transition-colors"
                                                        >
                                                            <Star className="w-3 h-3" /> Set Primary
                                                        </button>
                                                    )}

                                                    {/* Reorder + Delete row */}
                                                    <div className="flex gap-1 w-full">
                                                        <button
                                                            onClick={() => handleMoveUp(room.id, index)}
                                                            disabled={index === 0}
                                                            className="flex-1 flex items-center justify-center py-1 bg-white/80 hover:bg-white disabled:opacity-30 text-[var(--text-dark)] rounded transition-colors"
                                                            title="Move left"
                                                        >
                                                            <ChevronUp className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleMoveDown(room.id, index)}
                                                            disabled={index === (room.images?.length ?? 0) - 1}
                                                            className="flex-1 flex items-center justify-center py-1 bg-white/80 hover:bg-white disabled:opacity-30 text-[var(--text-dark)] rounded transition-colors"
                                                            title="Move right"
                                                        >
                                                            <ChevronDown className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(room.id, index)}
                                                            className="flex-1 flex items-center justify-center py-1 bg-red-500/80 hover:bg-red-500 text-white rounded transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Index label below */}
                                        <p className="text-xs text-gray-400 mt-1 text-center">
                                            {index === 0 ? 'Primary' : `#${index + 1}`}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
