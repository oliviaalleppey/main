'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PartyPopper, Loader2, Save } from 'lucide-react';
import { getPartyPopup, updatePartyPopup } from '@/lib/db/actions/settings-actions';
import { DEFAULT_PARTY_POPUP, type PartyPopupSettings } from '@/lib/config/party-popup';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PartyPopupCard() {
    const [settings, setSettings] = useState<PartyPopupSettings>(DEFAULT_PARTY_POPUP);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getPartyPopup()
            .then(setSettings)
            .catch(() => setSettings(DEFAULT_PARTY_POPUP))
            .finally(() => setLoading(false));
    }, []);

    async function save(next: PartyPopupSettings, message: string) {
        setSaving(true);
        try {
            setSettings(await updatePartyPopup(next));
            toast.success(message);
        } catch {
            toast.error('Could not save. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    function toggle(enabled: boolean) {
        const next = { ...settings, enabled };
        setSettings(next);
        void save(next, enabled ? '31st Night pop-up is on' : '31st Night pop-up is off');
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <PartyPopper className="h-5 w-5" />
                            31st Night Pop-up
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Shows the party pop-up on the homepage a few seconds after it opens. It stops by itself after the night.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{settings.enabled ? 'On' : 'Off'}</span>
                        <Switch
                            checked={settings.enabled}
                            onCheckedChange={toggle}
                            disabled={loading || saving}
                            aria-label="Show the 31st Night pop-up"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="party-price">Price per couple (₹)</Label>
                        <Input
                            id="party-price"
                            type="number"
                            min={1}
                            value={settings.pricePerCouple}
                            disabled={loading}
                            onChange={(e) => setSettings({ ...settings, pricePerCouple: Number(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="party-delay">Show after (seconds)</Label>
                        <Input
                            id="party-delay"
                            type="number"
                            min={0}
                            max={60}
                            value={settings.delaySeconds}
                            disabled={loading}
                            onChange={(e) => setSettings({ ...settings, delaySeconds: Number(e.target.value) })}
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <Button onClick={() => save(settings, 'Pop-up details saved')} disabled={loading || saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save details
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
