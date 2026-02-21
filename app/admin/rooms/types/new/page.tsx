import { RoomTypeForm } from '@/components/admin/room-type-form';

export default function NewRoomTypePage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Create Room Type</h1>
                <p className="text-gray-600">Add a new category of rooms to your hotel</p>
            </div>
            <RoomTypeForm />
        </div>
    );
}
