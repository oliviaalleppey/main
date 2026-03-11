import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount / 100);
}

export function formatRoomName(name?: string | null) {
    const normalized = typeof name === 'string'
        ? name.trim().replace(/\s+/g, ' ')
        : '';

    if (!normalized) return 'Room';

    if (/rooms$/i.test(normalized)) {
        return normalized.replace(/rooms$/i, 'Room');
    }

    if (/room$/i.test(normalized)) {
        return normalized.replace(/room$/i, 'Room');
    }

    return `${normalized} Room`;
}
