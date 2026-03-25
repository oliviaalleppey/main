'use client';

import { useState, useEffect, useCallback } from 'react';
import { upload } from '@vercel/blob/client';
import {
    getHeroImages,
    updateHeroImages,
    getColorPalette,
    updateColorPalette,
    type HeroImage,
} from '@/lib/db/actions/settings-actions';
import { DEFAULT_PALETTE, type ColorPalette } from '@/lib/config/palette';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2, Upload, Loader2, Save, Database, AlertCircle, Palette, RotateCcw } from 'lucide-react';
import Image from 'next/image';

// ── Color Picker Row ─────────────────────────────────────────
type PaletteKey = keyof ColorPalette;

const PALETTE_LABELS: { key: PaletteKey; label: string; description: string }[] = [
    { key: 'brandPrimary', label: 'Brand Color', description: 'Buttons, active nav, badges' },
    { key: 'brandPrimaryDark', label: 'Brand Hover', description: 'Hover states on buttons & links' },
    { key: 'brandPrimaryDeep', label: 'Brand Deep BG', description: 'Hero overlay backgrounds' },
    { key: 'goldAccent', label: 'Gold Accent', description: 'Premium accents, pricing highlights' },
    { key: 'goldAccentDark', label: 'Gold Text', description: 'Gold-colored text & icon fills' },
    { key: 'goldCta', label: 'Gold CTA Button', description: 'Book Now / CTA buttons (dining, experiences)' },
    { key: 'goldCtaDark', label: 'Gold CTA Hover', description: 'Hover state for gold CTA buttons' },
    { key: 'surfaceCream', label: 'Page Background', description: 'Main site background color' },
    { key: 'surfaceSoft', label: 'Card Background', description: 'Card & section backgrounds' },
    { key: 'textDark', label: 'Body Text', description: 'Primary text & headings color' },
    { key: 'btnDark', label: 'Dark Button', description: 'Dark/charcoal button backgrounds' },
];

function ColorRow({
    label,
    description,
    value,
    onChange,
}: {
    label: string;
    description: string;
    value: string;
    onChange: (v: string) => void;
}) {
    const [hex, setHex] = useState(value);

    useEffect(() => { setHex(value); }, [value]);

    function handleHexInput(raw: string) {
        setHex(raw);
        if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
            onChange(raw.toUpperCase());
        }
    }

    function handlePicker(e: React.ChangeEvent<HTMLInputElement>) {
        const v = e.target.value.toUpperCase();
        setHex(v);
        onChange(v);
    }

    return (
        <div className="flex items-center gap-4 py-3 border-b last:border-b-0">
            {/* Swatch + native picker */}
            <label className="cursor-pointer flex-shrink-0 relative group">
                <div
                    className="w-10 h-10 rounded-lg border-2 border-white shadow-md ring-1 ring-black/10 transition-transform group-hover:scale-110"
                    style={{ background: /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#888' }}
                />
                <input
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#888888'}
                    onChange={handlePicker}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
            </label>

            {/* Label + description */}
            <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900">{label}</div>
                <div className="text-xs text-gray-500 truncate">{description}</div>
            </div>

            {/* Hex input */}
            <Input
                value={hex}
                onChange={(e) => handleHexInput(e.target.value)}
                className="w-28 font-mono text-sm uppercase"
                maxLength={7}
                placeholder="#000000"
            />
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────
export default function SettingsPage() {
    // Hero images
    const [images, setImages] = useState<HeroImage[]>([]);
    const [imagesLoading, setImagesLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [savingImages, setSavingImages] = useState(false);

    // Color palette
    const [palette, setPalette] = useState<ColorPalette>(DEFAULT_PALETTE);
    const [paletteLoading, setPaletteLoading] = useState(true);
    const [savingPalette, setSavingPalette] = useState(false);
    const [paletteSaved, setPaletteSaved] = useState(false);

    useEffect(() => { loadImages(); loadPalette(); }, []);

    async function loadImages() {
        try {
            const data = await getHeroImages();
            setImages(Array.isArray(data) ? data : []);
        } catch { setImages([]); }
        finally { setImagesLoading(false); }
    }

    async function loadPalette() {
        try {
            const data = await getColorPalette();
            setPalette(data);
        } catch { setPalette(DEFAULT_PALETTE); }
        finally { setPaletteLoading(false); }
    }

    async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        if (!event.target.files?.length) return;
        const file = event.target.files[0];
        setUploading(true);
        try {
            const newBlob = await upload(file.name, file, {
                access: 'public',
                handleUploadUrl: '/api/upload',
            });
            setImages((prev) => [...prev, { url: newBlob.url, alt: 'Hero Image' }]);
        } catch { alert('Upload failed. Please try again.'); }
        finally { setUploading(false); event.target.value = ''; }
    }

    async function handleSaveImages() {
        setSavingImages(true);
        try {
            await updateHeroImages(images);
            alert('Hero images saved!');
        } catch { alert('Failed to save images.'); }
        finally { setSavingImages(false); }
    }

    async function handleSavePalette() {
        setSavingPalette(true);
        try {
            await updateColorPalette(palette);
            setPaletteSaved(true);
            setTimeout(() => setPaletteSaved(false), 2500);
        } catch { alert('Failed to save palette.'); }
        finally { setSavingPalette(false); }
    }

    function handleResetPalette() {
        if (confirm('Reset all colors to the default palette?')) {
            setPalette(DEFAULT_PALETTE);
        }
    }

    const updateColor = useCallback((key: PaletteKey) => (value: string) => {
        setPalette((prev) => ({ ...prev, [key]: value }));
    }, []);

    async function runMigration() {
        if (!confirm("Run database migrations? This is safe and won't affect your data.")) return;
        try {
            const response = await fetch('/api/admin/migrate', { method: 'POST' });
            const data = await response.json();
            alert(data.success ? 'Migration completed!' : 'Migration failed: ' + data.error);
        } catch { alert('Migration failed. Check console.'); }
    }

    if (imagesLoading || paletteLoading) {
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
                    <p className="text-muted-foreground">Manage hero images, brand colors, and visual settings.</p>
                </div>
            </div>

            {/* ── COLOR PALETTE ──────────────────────────────── */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="h-5 w-5" />
                                Color Palette
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Changes apply site-wide instantly on save. No rebuild needed.
                            </CardDescription>
                        </div>
                        {/* Mini preview strip */}
                        <div className="hidden sm:flex gap-1 rounded-lg overflow-hidden border shadow-sm">
                            {PALETTE_LABELS.slice(0, 5).map(({ key }) => (
                                <div
                                    key={key}
                                    className="w-7 h-7"
                                    style={{ background: palette[key] }}
                                    title={key}
                                />
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-1">
                    {PALETTE_LABELS.map(({ key, label, description }) => (
                        <ColorRow
                            key={key}
                            label={label}
                            description={description}
                            value={palette[key]}
                            onChange={updateColor(key)}
                        />
                    ))}

                    <div className="flex gap-3 pt-4">
                        <Button
                            onClick={handleSavePalette}
                            disabled={savingPalette}
                            className="flex-1"
                        >
                            {savingPalette
                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                                : paletteSaved
                                    ? <><Save className="mr-2 h-4 w-4" />Saved ✓</>
                                    : <><Save className="mr-2 h-4 w-4" />Save Palette</>
                            }
                        </Button>
                        <Button variant="outline" onClick={handleResetPalette} title="Reset to defaults">
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    </div>

                    <p className="text-xs text-muted-foreground pt-1">
                        Tip: Click any color swatch to open the color picker, or type a hex code directly.
                    </p>
                </CardContent>
            </Card>

            {/* ── HERO IMAGES ────────────────────────────────── */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Hero Section Images</CardTitle>
                        <Button onClick={handleSaveImages} disabled={savingImages}>
                            {savingImages && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {savingImages ? 'Saving...' : 'Save Images'}
                        </Button>
                    </div>
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
                                    <Button variant="destructive" size="icon" onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="absolute bottom-2 left-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                                    <Input
                                        value={image.alt}
                                        onChange={(e) => setImages((prev) => {
                                            const next = [...prev];
                                            next[index].alt = e.target.value;
                                            return next;
                                        })}
                                        placeholder="Image description (Alt text)"
                                        className="bg-white/90"
                                    />
                                </div>
                            </div>
                        ))}

                        <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed hover:bg-gray-50">
                            <Label
                                htmlFor="hero-image-upload"
                                className="flex cursor-pointer flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground hover:text-foreground"
                            >
                                {uploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8" />}
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

            {/* ── DATABASE MIGRATIONS ────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Database Migrations
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                            <p className="text-sm text-amber-800">
                                Run migrations to create new database tables. This is safe and won&apos;t affect existing data.
                            </p>
                        </div>
                    </div>
                    <Button onClick={runMigration} variant="outline" className="w-full">
                        <Database className="mr-2 h-4 w-4" />
                        Run Database Migrations
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
