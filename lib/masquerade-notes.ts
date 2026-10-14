// Reads back the booking notes the 31st Night checkout writes (see describeRoom in masquerade-booking.ts), so the
// confirmation page can show who is in which room without a new database column.

export interface MasqueradeRoomNote {
    number: number;
    roomType: string;
    guests: string;
}

export interface MasqueradeNotes {
    isMasquerade: boolean;
    isTest: boolean;
    rooms: MasqueradeRoomNote[];
    /** Visiting guests and drivers, who stay outside the hotel. */
    outside: string[];
    guestNote: string | null;
}

const ROOM_LINE = /^Room (\d+) \((.+?)\): (.+)$/;

export function parseMasqueradeNotes(specialRequests: string | null | undefined): MasqueradeNotes {
    const lines = (specialRequests ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
    const rooms: MasqueradeRoomNote[] = [];
    const outside: string[] = [];
    let guestNote: string | null = null;

    for (const line of lines) {
        const room = ROOM_LINE.exec(line);
        if (room) {
            rooms.push({ number: Number(room[1]), roomType: room[2], guests: room[3] });
        } else if (line.endsWith('(outside the hotel)')) {
            outside.push(line.replace(/\s*\(outside the hotel\)$/, ''));
        } else if (line.startsWith('Guest note: ')) {
            guestNote = line.slice('Guest note: '.length);
        }
    }

    return {
        isMasquerade: lines.some((l) => l.startsWith('THE GRAND MASQUERADE')),
        isTest: lines.some((l) => l.startsWith('TEST BOOKING')),
        rooms,
        outside,
        guestNote,
    };
}
