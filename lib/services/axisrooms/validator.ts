import { AvailabilityResponse, PricingResponse } from './types';

export class AvailabilityValidator {
    static validate(
        currentResponse: AvailabilityResponse,
        snapshot: AvailabilityResponse,
        requestedRoomId: string,
        requestedQuantity: number = 1
    ): { isValid: boolean; message?: string } {

        // Find room in current response
        const currentRoom = currentResponse.rooms.find(r => r.roomId === requestedRoomId);

        if (!currentRoom) {
            return { isValid: false, message: 'Room is no longer available (not found in current availability).' };
        }

        if (currentRoom.availableCount < requestedQuantity) {
            return { isValid: false, message: `Only ${currentRoom.availableCount} rooms left. You requested ${requestedQuantity}.` };
        }

        return { isValid: true };
    }
}

export class PricingValidator {
    static validate(
        currentPrice: PricingResponse,
        snapshotPrice: PricingResponse
    ): { isValid: boolean; message?: string; newPrice?: number } {

        if (Math.abs(currentPrice.totalAmount - snapshotPrice.totalAmount) > 100) { // Allow minor rounding diff (e.g. 1 rupee)
            return {
                isValid: false,
                message: `Price has changed from ${snapshotPrice.currency} ${snapshotPrice.totalAmount} to ${currentPrice.currency} ${currentPrice.totalAmount}`,
                newPrice: currentPrice.totalAmount
            };
        }

        return { isValid: true };
    }
}
