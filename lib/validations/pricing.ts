import { z } from 'zod';

export const pricingRuleSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(255),
    roomTypeId: z.string().uuid().optional().nullable(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    priceModifier: z.number().int().min(0).max(500, 'Price modifier must be between 0-500%'),
    minimumStay: z.number().int().min(1),
    priority: z.number().int().min(0),
    isActive: z.boolean(),
});

export const occupancyPricingSchema = z.object({
    roomTypeId: z.string().uuid(),
    minOccupancy: z.number().int().min(0).max(100, 'Must be between 0-100%'),
    maxOccupancy: z.number().int().min(0).max(100, 'Must be between 0-100%'),
    priceModifier: z.number().int().min(0).max(500, 'Price modifier must be between 0-500%'),
    isActive: z.boolean().default(true),
}).refine(data => data.minOccupancy <= data.maxOccupancy, {
    message: 'Min occupancy must be less than or equal to max occupancy',
    path: ['minOccupancy'],
});

export type PricingRuleInput = z.infer<typeof pricingRuleSchema>;
export type OccupancyPricingInput = z.infer<typeof occupancyPricingSchema>;
