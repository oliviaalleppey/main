import { z } from 'zod';

export const roomTypeSchema = z
    .object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        slug: z.string().min(2, 'Slug must be at least 2 characters'),
        description: z.string().optional(),
        shortDescription: z.string().optional(),
        basePrice: z.coerce.number().min(0, 'Price must be positive'),
        currency: z.string().default('INR'),
        maxGuests: z.coerce.number().min(1, 'Must accommodate at least 1 guest'),
        maxAdults: z.coerce.number().min(1, 'Must accommodate at least 1 adult'),
        maxChildren: z.coerce.number().default(0),
        bedType: z.string().optional(),
        minOccupancy: z.coerce.number().min(1, 'Minimum occupancy must be at least 1').default(1),
        baseOccupancy: z.coerce.number().min(1, "Base occupancy must be at least 1").default(2),
        extraAdultPrice: z.coerce.number().min(0).default(0),
        extraChildPrice: z.coerce.number().min(0).default(0),
        size: z.coerce.number().optional(),
        sizeUnit: z.enum(['sqft', 'sqm']).default('sqft'),
        amenities: z.array(z.string()).default([]),
        images: z.array(z.string()).default([]),
        status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
        sortOrder: z.coerce.number().default(0),
    })
    .superRefine((data, ctx) => {
        if (data.minOccupancy > data.maxGuests) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['minOccupancy'],
                message: 'Min occupancy cannot be greater than max occupancy',
            });
        }

        if (data.baseOccupancy < data.minOccupancy) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['baseOccupancy'],
                message: 'Base occupancy cannot be less than min occupancy',
            });
        }

        if (data.baseOccupancy > data.maxGuests) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['baseOccupancy'],
                message: 'Base occupancy cannot be greater than max occupancy',
            });
        }

        if (data.maxAdults > data.maxGuests) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['maxAdults'],
                message: 'Max adults cannot be greater than max occupancy',
            });
        }

        if (data.maxChildren > data.maxGuests) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['maxChildren'],
                message: 'Max children cannot be greater than max occupancy',
            });
        }

    });

export type RoomTypeInput = z.infer<typeof roomTypeSchema>;
export type RoomTypeFormValues = z.input<typeof roomTypeSchema>;

export const roomSchema = z.object({
    roomTypeId: z.string().uuid('Room Type is required'),
    roomNumber: z.string().min(1, 'Room number is required'),
    floor: z.number().optional(),
    status: z.enum(['active', 'inactive', 'maintenance']),
    notes: z.string().optional(),
});

export type RoomInput = z.infer<typeof roomSchema>;
