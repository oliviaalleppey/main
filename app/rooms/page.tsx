import RoomsClient from "@/components/rooms/rooms-client";
import { getRoomTypes } from "@/lib/services/room-management";

export const revalidate = 0;

export default async function RoomsPage() {
    const rooms = await getRoomTypes();

    // Serialize dates to strings to avoid passing Date objects to client component
    const serializedRooms = rooms.map(room => ({
        ...room,
        createdAt: room.createdAt?.toISOString(),
        updatedAt: room.updatedAt?.toISOString(),
        images: room.images || [], // Ensure images is an array
    }));

    return (
        <main className="min-h-screen bg-[#FBFBF9] font-sans selection:bg-[#C9A961] selection:text-white">
            <RoomsClient rooms={serializedRooms} />
        </main>
    );
}
