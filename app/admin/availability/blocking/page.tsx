'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Ban, Calendar } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface RoomType {
    id: string;
    name: string;
}

export default function BlockDatesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedRoomType = searchParams.get('roomType');

    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [roomTypeId, setRoomTypeId] = useState(preselectedRoomType || '');
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [roomsToBlock, setRoomsToBlock] = useState(1);

    // Fetch room types
    useEffect(() => {
        async function fetchRoomTypes() {
            try {
                const response = await fetch('/api/admin/rooms/types');
                if (response.ok) {
                    const data = await response.json();
                    setRoomTypes(data);
                    if (!preselectedRoomType && data.length > 0) {
                        setRoomTypeId(data[0].id);
                    }
                }
            } catch (error) {
                console.error('Error fetching room types:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchRoomTypes();
    }, [preselectedRoomType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch('/api/admin/availability/blocking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomTypeId,
                    startDate,
                    endDate,
                    reason,
                    notes,
                    roomsToBlock,
                }),
            });

            if (response.ok) {
                alert('Dates blocked successfully!');
                router.push('/admin/availability');
                router.refresh();
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to block dates');
            }
        } catch (error) {
            console.error('Error blocking dates:', error);
            alert('Failed to block dates');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Block Dates</h1>
                <p className="text-gray-600 mt-1">
                    Block rooms for maintenance, events, or other reasons
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Ban className="w-5 h-5" />
                            Block Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Room Type Selection */}
                        <div>
                            <Label htmlFor="roomTypeId">Room Type *</Label>
                            <select
                                id="roomTypeId"
                                value={roomTypeId}
                                onChange={(e) => setRoomTypeId(e.target.value)}
                                className="w-full border rounded-md p-2 mt-1"
                                required
                            >
                                <option value="">Select Room Type</option>
                                {roomTypes.map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="startDate">Start Date *</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="endDate">End Date *</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    min={startDate}
                                    required
                                />
                            </div>
                        </div>

                        {/* Rooms to Block */}
                        <div>
                            <Label htmlFor="roomsToBlock">Number of Rooms to Block *</Label>
                            <Input
                                id="roomsToBlock"
                                type="number"
                                min={1}
                                value={roomsToBlock}
                                onChange={(e) => setRoomsToBlock(parseInt(e.target.value) || 1)}
                                required
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                How many rooms of this type should be blocked?
                            </p>
                        </div>

                        {/* Reason */}
                        <div>
                            <Label htmlFor="reason">Reason *</Label>
                            <select
                                id="reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full border rounded-md p-2 mt-1"
                                required
                            >
                                <option value="">Select Reason</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="event">Private Event</option>
                                <option value="hold">Owner Hold</option>
                                <option value="renovation">Renovation</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Notes */}
                        <div>
                            <Label htmlFor="notes">Notes</Label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full border rounded-md p-2 mt-1"
                                rows={3}
                                placeholder="Additional details about this block..."
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex gap-3 mt-6">
                    <Button type="submit" disabled={submitting}>
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Blocking...
                            </>
                        ) : (
                            <>
                                <Ban className="w-4 h-4 mr-2" />
                                Block Dates
                            </>
                        )}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}
