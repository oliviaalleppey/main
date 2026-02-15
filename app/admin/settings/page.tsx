'use client';

import { useState, useEffect } from 'react';
import { upload } from '@vercel/blob/client';
import { getHeroImages, updateHeroImages, type HeroImage } from '@/lib/db/actions/settings-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Upload, Loader2, Save } from 'lucide-react';
import Image from 'next/image';

export default function SettingsPage() {
    const [images, setImages] = useState<HeroImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadImages();
    }, []);

    async function loadImages() {
        try {
            const data = await getHeroImages();
            // Ensure data is an array
            if (Array.isArray(data)) {
                setImages(data);
            } else {
                setImages([]);
            }
        } catch (error) {
            console.error('Failed to load images:', error);
            setImages([]);
        } finally {
            setLoading(false);
        }
    }

    async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        if (!event.target.files || event.target.files.length === 0) {
            return;
        }

        const file = event.target.files[0];
        setUploading(true);

        try {
            const newBlob = await upload(file.name, file, {
                access: 'public',
                handleUploadUrl: '/api/upload',
            });

            const newImage: HeroImage = {
                url: newBlob.url,
                alt: 'Hero Image', // Default alt
            };

            setImages((prev) => [...prev, newImage]);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed. Please try again.');
        } finally {
            setUploading(false);
            // Clear the input
            event.target.value = '';
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            await updateHeroImages(images);
            alert('Changes saved successfully!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save changes.');
        } finally {
            setSaving(false);
        }
    }

    function removeImage(index: number) {
        setImages((prev) => prev.filter((_, i) => i !== index));
    }

    function updateAltText(index: number, text: string) {
        setImages((prev) => {
            const newImages = [...prev];
            newImages[index].alt = text;
            return newImages;
        });
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Site Appearance</h1>
                    <p className="text-muted-foreground">Manage your website's hero images and visual settings.</p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Hero Section Images</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {images.map((image, index) => (
                            <div key={index} className="group relative aspect-video overflow-hidden rounded-lg border bg-gray-100">
                                <Image
                                    src={image.url}
                                    alt={image.alt || 'Hero Image'}
                                    fill
                                    className="object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />

                                <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => removeImage(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="absolute bottom-2 left-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                                    <Input
                                        value={image.alt}
                                        onChange={(e) => updateAltText(index, e.target.value)}
                                        placeholder="Image description (Alt text)"
                                        className="bg-white/90"
                                    />
                                </div>
                            </div>
                        ))}

                        {/* Upload Button */}
                        <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed hover:bg-gray-50">
                            <Label
                                htmlFor="hero-image-upload"
                                className="flex cursor-pointer flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground hover:text-foreground"
                            >
                                {uploading ? (
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                ) : (
                                    <Upload className="h-8 w-8" />
                                )}
                                <span>{uploading ? 'Uploading...' : 'Upload New Image'}</span>
                                <Input
                                    id="hero-image-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    disabled={uploading}
                                />
                            </Label>
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        Supported formats: JPG, PNG, WEBP. Max size: 4.5MB per file.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
