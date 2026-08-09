import { pgTable, text, varchar, integer, timestamp, boolean, decimal, pgEnum, uuid, date, json, primaryKey, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// ENUMS
// ============================================

export const roomStatusEnum = pgEnum('room_status', ['active', 'inactive', 'maintenance']);
export const bookingStatusEnum = pgEnum('booking_status', [
    'pending', 'confirmed', 'cancelled', 'completed',
    'initiated', 'pending_payment', 'payment_success', 'booking_requested', 'failed', 'refunded', 'expired'
]);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'success', 'failed', 'refunded']);
export const addOnTypeEnum = pgEnum('addon_type', ['per_person', 'per_unit']);

// New enums for 5-star hotel features
export const cancellationPolicyEnum = pgEnum('cancellation_policy', ['flexible', 'moderate', 'strict', 'non_refundable']);
export const channelTypeEnum = pgEnum('channel_type', ['direct', 'ota', 'gds', 'agent', 'walk_in']);
export const paymentModeEnum = pgEnum('payment_mode', ['hotel_collect', 'channel_collect', 'prepaid']);
export const housekeepingStatusEnum = pgEnum('housekeeping_status', ['clean', 'dirty', 'touch_up', 'inspect', 'out_of_service']);
export const vipLevelEnum = pgEnum('vip_level', ['regular', 'silver', 'gold', 'platinum', 'diamond']);
export const outletStatusEnum = pgEnum('outlet_status', ['operational', 'upcoming', 'temporarily_closed']);
export const venueTypeEnum = pgEnum('venue_type', ['ballroom', 'meeting_room', 'outdoor', 'boardroom', 'conference_hall']);
export const seatingStyleEnum = pgEnum('seating_style', ['theatre', 'cluster', 'classroom', 'u_shape', 'boardroom', 'banquet', 'cocktail']);

// ============================================
// INVENTORY LOCKS (Production Hardening)
// ============================================

export const inventoryLocks = pgTable('inventory_locks', {
    id: uuid('id').defaultRandom().primaryKey(),
    roomTypeId: uuid('room_type_id').references(() => roomTypes.id).notNull(),
    roomId: uuid('room_id').references(() => rooms.id),
    checkIn: date('check_in').notNull(),
    checkOut: date('check_out').notNull(),
    lockedPrice: integer('locked_price'), // Price locked at time of check
    expiresAt: timestamp('expires_at').notNull(),
    sessionId: varchar('session_id', { length: 255 }),
    bookingId: uuid('booking_id').references(() => bookings.id),
    createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// ROOM TYPES & ROOMS
// ============================================

export const roomTypes = pgTable('room_types', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: text('description'),
    shortDescription: text('short_description'),
    basePrice: integer('base_price').notNull(), // in paise
    minOccupancy: integer('min_occupancy').notNull().default(1), // Minimum allowed guests
    baseOccupancy: integer('base_occupancy').notNull().default(2), // Guests included in base price
    maxGuests: integer('max_guests').notNull().default(2), // Absolute maximum occupancy
    extraAdultPrice: integer('extra_adult_price').default(0), // Price per extra adult in paise
    extraChildPrice: integer('extra_child_price').default(0), // Price per extra child in paise
    maxAdults: integer('max_adults').notNull().default(2),
    maxChildren: integer('max_children').default(0),
    size: integer('size'), // in sq ft
    sizeUnit: varchar('size_unit', { length: 10 }).default('sqft'),
    bedType: varchar('bed_type', { length: 100 }),
    amenities: json('amenities').$type<string[]>().default([]),
    // removing json images in favor of separate table below, but keeping for backward compat if needed? 
    // actually schema shows images json. I will keep it but add the new relation table.
    images: json('images').$type<string[]>().default([]),
    featuredImage: text('featured_image'),
    status: roomStatusEnum('status').default('active'),
    sortOrder: integer('sort_order').default(0),
    taxRate: integer('tax_rate').default(12), // GST % applied on top of base price (e.g. 12 = 12%)
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const roomImages = pgTable('room_images', {
    id: uuid('id').defaultRandom().primaryKey(),
    roomTypeId: uuid('room_type_id').references(() => roomTypes.id).notNull(),
    url: text('url').notNull(),
    alt: varchar('alt', { length: 255 }),
    sortOrder: integer('sort_order').default(0),
    isFeatured: boolean('is_featured').default(false),
    createdAt: timestamp('created_at').defaultNow(),
});

export const rooms = pgTable('rooms', {
    id: uuid('id').defaultRandom().primaryKey(),
    roomTypeId: uuid('room_type_id').references(() => roomTypes.id).notNull(),
    roomNumber: varchar('room_number', { length: 50 }).notNull().unique(),
    floor: integer('floor'),
    status: roomStatusEnum('status').default('active'),
    notes: text('notes'),
    // Enhanced room tracking
    housekeepingStatus: housekeepingStatusEnum('housekeeping_status').default('clean'),
    lastCleanedAt: timestamp('last_cleaned_at'),
    lastInspectedAt: timestamp('last_inspected_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// ROOM ATTRIBUTES (Individual Room Features)
// ============================================

export const roomAttributes = pgTable('room_attributes', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    code: varchar('code', { length: 50 }).notNull().unique(),
    description: text('description'),
    icon: varchar('icon', { length: 50 }),
    priceModifier: integer('price_modifier').default(0), // percentage adjustment
    category: varchar('category', { length: 50 }), // 'view', 'location', 'feature', 'accessibility'
    isActive: boolean('is_active').default(true),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at').defaultNow(),
});

export const roomAttributeValues = pgTable('room_attribute_values', {
    id: uuid('id').defaultRandom().primaryKey(),
    roomId: uuid('room_id').references(() => rooms.id).notNull(),
    attributeId: uuid('attribute_id').references(() => roomAttributes.id).notNull(),
    value: boolean('value').default(true),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// RATE PLANS (Multiple Pricing per Room Type)
// ============================================

export const ratePlans = pgTable('rate_plans', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 50 }).notNull().unique(),
    roomTypeId: uuid('room_type_id').references(() => roomTypes.id).notNull(),
    description: text('description'),

    // Pricing
    basePriceModifier: integer('base_price_modifier').default(100), // % of room type base price
    minLOS: integer('min_los').default(1), // Minimum length of stay
    maxLOS: integer('max_los'), // Maximum length of stay

    // Inclusions
    includesBreakfast: boolean('includes_breakfast').default(false),
    includesAirportTransfer: boolean('includes_airport_transfer').default(false),
    includesLateCheckout: boolean('includes_late_checkout').default(false),
    includesSpa: boolean('includes_spa').default(false),
    includesDinner: boolean('includes_dinner').default(false),
    inclusionsDescription: text('inclusions_description'),

    // Conditions
    cancellationPolicy: cancellationPolicyEnum('cancellation_policy').default('moderate'),
    cancellationDays: integer('cancellation_days').default(1), // days before check-in
    depositRequired: integer('deposit_required').default(0), // percentage
    depositAmount: integer('deposit_amount').default(0), // fixed amount in paise

    // Availability
    isActive: boolean('is_active').default(true),
    bookableFrom: date('bookable_from'),
    bookableTo: date('bookable_to'),

    // Display
    isDefault: boolean('is_default').default(false),
    isPromotional: boolean('is_promotional').default(false),
    displayOrder: integer('display_order').default(0),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// BOOKING CHANNELS (Source of Bookings)
// ============================================

export const bookingChannels = pgTable('booking_channels', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    code: varchar('code', { length: 50 }).notNull().unique(),
    type: channelTypeEnum('type').default('direct'),

    // Commission
    commissionType: varchar('commission_type', { length: 20 }), // 'percentage', 'fixed'
    commissionValue: integer('commission_value').default(0),

    // Settings
    isActive: boolean('is_active').default(true),
    autoConfirm: boolean('auto_confirm').default(true),
    paymentMode: paymentModeEnum('payment_mode').default('hotel_collect'),

    // Integration
    apiEndpoint: text('api_endpoint'),
    apiKey: text('api_key'),
    syncInventory: boolean('sync_inventory').default(true),
    syncRates: boolean('sync_rates').default(true),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// GUEST PROFILES (CRM)
// ============================================

export const guestProfiles = pgTable('guest_profiles', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),

    // Personal info
    firstName: varchar('first_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    phone: varchar('phone', { length: 20 }),
    alternatePhone: varchar('alternate_phone', { length: 20 }),
    address: text('address'),
    city: varchar('city', { length: 100 }),
    state: varchar('state', { length: 100 }),
    country: varchar('country', { length: 100 }),
    pincode: varchar('pincode', { length: 20 }),
    dateOfBirth: date('date_of_birth'),
    anniversary: date('anniversary'),
    companyName: varchar('company_name', { length: 255 }),
    gstNumber: varchar('gst_number', { length: 50 }),

    // Preferences
    preferredRoomTypeId: uuid('preferred_room_type_id').references(() => roomTypes.id),
    preferredFloor: integer('preferred_floor'),
    bedPreference: varchar('bed_preference', { length: 50 }), // 'king', 'twin', 'either'
    smokingPreference: varchar('smoking_preference', { length: 20 }), // 'smoking', 'non_smoking', 'no_preference'
    dietaryRestrictions: text('dietary_restrictions'),
    pillowPreference: varchar('pillow_preference', { length: 100 }),
    temperaturePreference: varchar('temperature_preference', { length: 50 }),
    specialRequests: text('special_requests'),

    // Stats
    totalStays: integer('total_stays').default(0),
    totalRoomNights: integer('total_room_nights').default(0),
    totalSpent: integer('total_spent').default(0),
    firstStayAt: timestamp('first_stay_at'),
    lastStayAt: timestamp('last_stay_at'),

    // VIP
    isVIP: boolean('is_vip').default(false),
    vipLevel: vipLevelEnum('vip_level').default('regular'),
    vipSince: timestamp('vip_since'),

    // Communication
    marketingOptIn: boolean('marketing_opt_in').default(false),
    communicationPreference: varchar('communication_preference', { length: 50 }), // 'email', 'phone', 'whatsapp'

    // Notes
    internalNotes: text('internal_notes'), // Staff notes
    guestNotes: text('guest_notes'), // Notes from guest

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// BOOKINGS
// ============================================

export const bookings = pgTable('bookings', {
    id: uuid('id').defaultRandom().primaryKey(),
    bookingNumber: varchar('booking_number', { length: 50 }).notNull().unique(),

    // Guest details
    guestProfileId: uuid('guest_profile_id').references(() => guestProfiles.id),
    guestName: varchar('guest_name', { length: 255 }).notNull(),
    guestEmail: varchar('guest_email', { length: 255 }).notNull(),
    guestPhone: varchar('guest_phone', { length: 20 }).notNull(),
    guestAddress: text('guest_address'),

    // Booking details
    checkIn: date('check_in').notNull(),
    checkOut: date('check_out').notNull(),
    adults: integer('adults').notNull().default(1),
    children: integer('children').default(0),

    // Rate Plan
    ratePlanId: uuid('rate_plan_id').references(() => ratePlans.id),
    roomId: uuid('room_id').references(() => rooms.id), // Added to link booking to specific room

    // Channel/Source
    channelId: uuid('channel_id').references(() => bookingChannels.id),
    channelBookingId: varchar('channel_booking_id', { length: 100 }), // External reference

    // Pricing
    baseAmount: integer('base_amount').default(0), // Base room charges
    subtotal: integer('subtotal').notNull(), // in paise
    taxAmount: integer('tax_amount').default(0),
    discountAmount: integer('discount_amount').default(0),
    discountReason: text('discount_reason'),
    totalAmount: integer('total_amount').notNull(),

    // Commission (for OTA bookings)
    commissionAmount: integer('commission_amount').default(0),
    netAmount: integer('net_amount').default(0), // After commission

    // Promo
    promoCode: varchar('promo_code', { length: 50 }),
    offerId: uuid('offer_id').references(() => offers.id),

    // Status
    status: bookingStatusEnum('status').default('pending'),
    paymentStatus: paymentStatusEnum('payment_status').default('pending'),

    // Special requests
    specialRequests: text('special_requests'),
    guestPreferences: text('guest_preferences'), // From guest profile

    // VIP
    isVIPBooking: boolean('is_vip_booking').default(false),
    vipBenefitsApplied: text('vip_benefits_applied'),

    // Audit
    createdBy: text('created_by'), // User ID
    modifiedBy: text('modified_by'),
    confirmedBy: text('confirmed_by'),
    cancelledBy: text('cancelled_by'),
    cancellationReason: text('cancellation_reason'),
    cancelledAt: timestamp('cancelled_at'),

    // Metadata
    version: integer('version').default(1),
    retryCount: integer('retry_count').default(0),
    confirmedAt: timestamp('confirmed_at'),
    checkInAt: timestamp('check_in_at'),
    checkOutAt: timestamp('check_out_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const bookingItems = pgTable('booking_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    bookingId: uuid('booking_id').references(() => bookings.id).notNull(),
    roomTypeId: uuid('room_type_id').references(() => roomTypes.id).notNull(),
    roomId: uuid('room_id').references(() => rooms.id),
    ratePlanId: uuid('rate_plan_id').references(() => ratePlans.id),
    quantity: integer('quantity').default(1),
    pricePerNight: integer('price_per_night').notNull(), // in paise
    nights: integer('nights').notNull(),
    subtotal: integer('subtotal').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// BOOKING HISTORY (Audit Trail)
// ============================================

export const bookingHistory = pgTable('booking_history', {
    id: uuid('id').defaultRandom().primaryKey(),
    bookingId: uuid('booking_id').references(() => bookings.id).notNull(),
    action: varchar('action', { length: 50 }).notNull(), // 'created', 'modified', 'cancelled', 'confirmed', 'checked_in', 'checked_out'
    changes: json('changes').$type<Record<string, { old: any; new: any }>>(),
    performedBy: text('performed_by'), // User ID
    performedByName: varchar('performed_by_name', { length: 255 }), // User name for display
    notes: text('notes'),
    ipAddress: varchar('ip_address', { length: 50 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// WAITLIST
// ============================================

export const waitlist = pgTable('waitlist', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Guest info
    guestName: varchar('guest_name', { length: 255 }).notNull(),
    guestEmail: varchar('guest_email', { length: 255 }).notNull(),
    guestPhone: varchar('guest_phone', { length: 20 }).notNull(),

    // Requirements
    roomTypeId: uuid('room_type_id').references(() => roomTypes.id),
    checkIn: date('check_in').notNull(),
    checkOut: date('check_out').notNull(),
    adults: integer('adults').default(1),
    children: integer('children').default(0),
    roomCount: integer('room_count').default(1),

    // Priority
    priority: integer('priority').default(0),
    notes: text('notes'),

    // Status
    status: varchar('status', { length: 20 }).default('waiting'), // 'waiting', 'offered', 'confirmed', 'expired', 'cancelled'
    offeredAt: timestamp('offered_at'),
    expiresAt: timestamp('expires_at'),
    convertedBookingId: uuid('converted_booking_id').references(() => bookings.id),

    // Source
    channelId: uuid('channel_id').references(() => bookingChannels.id),
    source: varchar('source', { length: 50 }), // 'website', 'phone', 'walk_in'

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// ROOM BLOCKS (Group Bookings)
// ============================================

export const roomBlocks = pgTable('room_blocks', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    type: varchar('type', { length: 50 }), // 'group', 'event', 'maintenance', 'contract'

    // Date range
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),

    // Rooms
    roomTypeId: uuid('room_type_id').references(() => roomTypes.id),
    totalRooms: integer('total_rooms').notNull(),
    bookedRooms: integer('booked_rooms').default(0),
    releasedRooms: integer('released_rooms').default(0),

    // Release rules
    releaseDate: date('release_date'), // Date when unbooked rooms are released
    cutOffDate: date('cut_off_date'), // Booking deadline

    // Pricing
    negotiatedRate: integer('negotiated_rate'),
    ratePlanId: uuid('rate_plan_id').references(() => ratePlans.id),

    // Contact
    contactName: varchar('contact_name', { length: 255 }),
    contactEmail: varchar('contact_email', { length: 255 }),
    contactPhone: varchar('contact_phone', { length: 20 }),

    // Status
    status: varchar('status', { length: 20 }).default('active'), // 'active', 'completed', 'cancelled'

    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// DAILY STATS (Reporting)
// ============================================

export const dailyStats = pgTable('daily_stats', {
    id: uuid('id').defaultRandom().primaryKey(),
    date: date('date').notNull(),
    roomTypeId: uuid('room_type_id').references(() => roomTypes.id),

    // Inventory
    totalRooms: integer('total_rooms').notNull(),
    availableRooms: integer('available_rooms').notNull(),
    occupiedRooms: integer('occupied_rooms').notNull(),
    blockedRooms: integer('blocked_rooms').default(0),

    // Revenue
    roomRevenue: integer('room_revenue').default(0),
    addonRevenue: integer('addon_revenue').default(0),
    foodRevenue: integer('food_revenue').default(0),
    totalRevenue: integer('total_revenue').default(0),

    // Metrics
    occupancyRate: integer('occupancy_rate').default(0), // %
    adr: integer('adr').default(0), // Average Daily Rate
    revpar: integer('revpar').default(0), // Revenue Per Available Room

    // Bookings
    newBookings: integer('new_bookings').default(0),
    cancellations: integer('cancellations').default(0),
    modifications: integer('modifications').default(0),
    checkIns: integer('check_ins').default(0),
    checkOuts: integer('check_outs').default(0),
    noShows: integer('no_shows').default(0),

    // Channel breakdown
    directBookings: integer('direct_bookings').default(0),
    otaBookings: integer('ota_bookings').default(0),
    agentBookings: integer('agent_bookings').default(0),

    createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// ADD-ONS
// ============================================

export const addOns = pgTable('add_ons', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    price: integer('price').notNull(), // in paise
    type: addOnTypeEnum('type').default('per_unit'),
    icon: varchar('icon', { length: 100 }),
    imageUrl: text('image_url'),
    taxRate: integer('tax_rate').default(18), // GST % applied on add-on price (e.g. 18 = 18%)
    isActive: boolean('is_active').default(true),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const bookingAddOns = pgTable('booking_add_ons', {
    id: uuid('id').defaultRandom().primaryKey(),
    bookingId: uuid('booking_id').references(() => bookings.id).notNull(),
    addOnId: uuid('add_on_id').references(() => addOns.id).notNull(),
    quantity: integer('quantity').default(1),
    price: integer('price').notNull(),
    subtotal: integer('subtotal').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

// Table to link add-ons to specific room types
// If empty/null, add-on applies to all rooms
export const addOnRoomTypes = pgTable('add_on_room_types', {
    id: uuid('id').defaultRandom().primaryKey(),
    addOnId: uuid('add_on_id').references(() => addOns.id).notNull(),
    roomTypeId: uuid('room_type_id').references(() => roomTypes.id).notNull(),
});

// Relations for addOnRoomTypes
export const addOnRoomTypesRelations = relations(addOnRoomTypes, ({ one }) => ({
    addOn: one(addOns, {
        fields: [addOnRoomTypes.addOnId],
        references: [addOns.id],
    }),
    roomType: one(roomTypes, {
        fields: [addOnRoomTypes.roomTypeId],
        references: [roomTypes.id],
    }),
}));

// ============================================
// PAYMENTS
// ============================================

export const payments = pgTable('payments', {
    id: uuid('id').defaultRandom().primaryKey(),
    bookingId: uuid('booking_id').references(() => bookings.id).notNull(),

    // Easebuzz details
    easebuzzOrderId: varchar('easebuzz_order_id', { length: 255 }), // Our unique ID sent to Easebuzz
    easebuzzTransactionId: varchar('easebuzz_transaction_id', { length: 255 }), // Their returned unique identifier
    easebuzzHash: varchar('easebuzz_hash', { length: 255 }), // Stored hash for verification

    // Payment details
    amount: integer('amount').notNull(), // in paise
    currency: varchar('currency', { length: 10 }).default('INR'),
    status: paymentStatusEnum('status').default('pending'),
    paymentMethod: varchar('payment_method', { length: 50 }),

    // Refund
    refundAmount: integer('refund_amount').default(0),
    refundReason: text('refund_reason'),
    refundedAt: timestamp('refunded_at'),
    refundStatus: varchar('refund_status', { length: 50 }), // 'pending', 'processed', 'failed'

    // AxisRooms / Gateway Specifics
    gatewayTransactionId: varchar('gateway_transaction_id', { length: 255 }),
    paymentVerifiedAt: timestamp('payment_verified_at'),

    // Metadata
    metadata: json('metadata'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// PRODUCTION HARDENING (New Tables)
// ============================================

export const bookingProcessingLock = pgTable('booking_processing_lock', {
    bookingId: uuid('booking_id').references(() => bookings.id).primaryKey(),
    lockedAt: timestamp('locked_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    processedBy: varchar('processed_by', { length: 255 }), // instance id or worker id
});

export const bookingAuditLogs = pgTable('booking_audit_logs', {
    id: uuid('id').defaultRandom().primaryKey(),
    bookingId: uuid('booking_id').references(() => bookings.id).notNull(),
    previousState: varchar('previous_state', { length: 50 }),
    newState: varchar('new_state', { length: 50 }).notNull(),
    reason: text('reason'),
    actor: varchar('actor', { length: 255 }), // 'system', 'user:ID', 'admin:ID'
    metadata: json('metadata'),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// ============================================
// LOGS EXTRA
// ============================================

export const bookingLogs = pgTable('booking_logs', {
    id: uuid('id').defaultRandom().primaryKey(),
    bookingId: uuid('booking_id').references(() => bookings.id),
    action: varchar('action', { length: 255 }).notNull(),
    endpoint: varchar('endpoint', { length: 255 }),
    requestPayload: json('request_payload'),
    responsePayload: json('response_payload'),
    responseHash: varchar('response_hash', { length: 64 }), // SHA256 of response for integrity check
    statusCode: integer('status_code'),
    durationMs: integer('duration_ms'),
    errorMessage: text('error_message'),
    level: varchar('level', { length: 20 }).default('info'), // 'info', 'warn', 'error'
    createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// INVENTORY MANAGEMENT
// ============================================

export const roomInventory = pgTable('room_inventory', {
    id: uuid('id').defaultRandom().primaryKey(),
    roomTypeId: uuid('room_type_id').references(() => roomTypes.id).notNull(),
    date: date('date').notNull(),
    totalRooms: integer('total_rooms').notNull(),
    availableRooms: integer('available_rooms').notNull(),
    blockedRooms: integer('blocked_rooms').default(0),
    price: integer('price').notNull(), // in paise, can override base price
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const rateLimits = pgTable('rate_limits', {
    id: uuid('id').defaultRandom().primaryKey(),
    ip: varchar('ip', { length: 50 }).notNull(),
    endpoint: varchar('endpoint', { length: 255 }).notNull(),
    hits: integer('hits').default(1),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// PRICING RULES
// ============================================

export const pricingRules = pgTable('pricing_rules', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    roomTypeId: uuid('room_type_id').references(() => roomTypes.id),

    // Date range
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),

    // Pricing
    priceModifier: integer('price_modifier').notNull(), // percentage (e.g., 120 = 20% increase)
    minimumStay: integer('minimum_stay').default(1),

    // Priority (higher = applied first)
    priority: integer('priority').default(0),

    // Metadata
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const occupancyPricing = pgTable('occupancy_pricing', {
    id: uuid('id').defaultRandom().primaryKey(),
    roomTypeId: uuid('room_type_id').references(() => roomTypes.id).notNull(),

    // Occupancy thresholds
    minOccupancy: integer('min_occupancy').notNull(), // percentage (e.g., 80 = 80%)
    maxOccupancy: integer('max_occupancy').notNull(),

    // Price adjustment
    priceModifier: integer('price_modifier').notNull(),

    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// OFFERS & PROMOTIONS
// ============================================

export const offers = pgTable('offers', {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    code: varchar('code', { length: 50 }).notNull().unique(),
    discountType: varchar('discount_type', { length: 20 }).notNull(), // 'percentage' or 'fixed'
    discountValue: integer('discount_value').notNull(),
    minBookingAmount: integer('min_booking_amount').default(0),
    maxDiscount: integer('max_discount'),
    validFrom: date('valid_from').notNull(),
    validTo: date('valid_to').notNull(),
    usageLimit: integer('usage_limit'),
    usageCount: integer('usage_count').default(0),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// INQUIRIES
// ============================================

export const inquiries = pgTable('inquiries', {
    id: uuid('id').defaultRandom().primaryKey(),
    type: varchar('type', { length: 50 }).notNull(), // 'event', 'wedding', 'general'
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    eventDate: date('event_date'),
    guestCount: integer('guest_count'),
    message: text('message'),
    status: varchar('status', { length: 20 }).default('new'), // 'new', 'contacted', 'converted', 'closed'
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// ADMIN USERS
// ============================================

export const adminUsers = pgTable('admin_users', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(), // hashed
    role: varchar('role', { length: 50 }).default('admin'),
    isActive: boolean('is_active').default(true),
    lastLogin: timestamp('last_login'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// GALLERY
// ============================================

export const galleryImages = pgTable('gallery_images', {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 255 }),
    description: text('description'),
    imageUrl: text('image_url').notNull(),
    category: varchar('category', { length: 100 }), // 'rooms', 'dining', 'spa', 'pool', 'events'
    tabs: json('tabs').$type<string[]>().default([]), // gallery sub-tabs: array of slugs e.g. ['rooms', 'dining']
    sortOrder: integer('sort_order').default(0),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// DINING OUTLETS
// ============================================

export const diningOutlets = pgTable('dining_outlets', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: text('description'),
    shortDescription: text('short_description'),

    // Operational Details
    capacity: integer('capacity'),
    openingTime: varchar('opening_time', { length: 20 }), // e.g., "07:00 HRS"
    closingTime: varchar('closing_time', { length: 20 }), // e.g., "23:00 HRS"
    operatingHours: varchar('operating_hours', { length: 100 }), // Full description

    // Cuisine & Type
    cuisineType: varchar('cuisine_type', { length: 255 }), // e.g., "Local & Global"
    outletType: varchar('outlet_type', { length: 50 }), // 'restaurant', 'cafe', 'bar', 'lounge', 'room_service'

    // Location
    location: varchar('location', { length: 100 }), // e.g., "Lobby Level", "3rd Floor"
    floor: integer('floor'),

    // Status
    status: outletStatusEnum('status').default('operational'),

    // Images
    featuredImage: text('featured_image'),
    images: json('images').$type<string[]>().default([]),

    // Contact
    phone: varchar('phone', { length: 20 }),
    email: varchar('email', { length: 255 }),

    // Display
    isFeatured: boolean('is_featured').default(false),
    sortOrder: integer('sort_order').default(0),
    isActive: boolean('is_active').default(true),

    // Menu
    menuUrl: text('menu_url'), // PDF or external link

    // Special Features
    specialFeatures: json('special_features').$type<string[]>().default([]),
    dressCode: varchar('dress_code', { length: 100 }),
    reservationRequired: boolean('reservation_required').default(false),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// CONFERENCE & EVENT VENUES
// ============================================

export const venues = pgTable('venues', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: text('description'),
    shortDescription: text('short_description'),

    // Venue Type
    venueType: venueTypeEnum('venue_type').notNull(),

    // Dimensions
    length: decimal('length', { precision: 10, scale: 2 }), // in feet
    width: decimal('width', { precision: 10, scale: 2 }), // in feet
    height: decimal('height', { precision: 10, scale: 2 }), // in feet
    area: integer('area'), // in sqft

    // Seating Capacities
    capacityTheatre: integer('capacity_theatre'),
    capacityCluster: varchar('capacity_cluster', { length: 50 }), // e.g., "180-200"
    capacityClassroom: integer('capacity_classroom'),
    capacityUShape: integer('capacity_u_shape'),
    capacityBoardroom: integer('capacity_boardroom'),
    capacityBanquet: integer('capacity_banquet'),
    capacityCocktail: integer('capacity_cocktail'),

    // Features
    isDivisible: boolean('is_divisible').default(false),
    hasNaturalLight: boolean('has_natural_light').default(false),
    hasAV: boolean('has_av').default(true),
    hasWifi: boolean('has_wifi').default(true),
    hasProjector: boolean('has_projector').default(false),
    hasWhiteboard: boolean('has_whiteboard').default(false),
    hasStage: boolean('has_stage').default(false),
    hasDanceFloor: boolean('has_dance_floor').default(false),

    // Location
    floor: integer('floor'),
    location: varchar('location', { length: 100 }),

    // Images
    featuredImage: text('featured_image'),
    images: json('images').$type<string[]>().default([]),
    floorPlan: text('floor_plan'), // URL to floor plan image/PDF

    // Pricing (optional)
    halfDayRate: decimal('half_day_rate', { precision: 10, scale: 2 }),
    fullDayRate: decimal('full_day_rate', { precision: 10, scale: 2 }),

    // Display
    isFeatured: boolean('is_featured').default(false),
    sortOrder: integer('sort_order').default(0),
    isActive: boolean('is_active').default(true),

    // Equipment & Amenities
    equipment: json('equipment').$type<string[]>().default([]),
    amenities: json('amenities').$type<string[]>().default([]),

    // Event Types Suitable For
    suitableFor: json('suitable_for').$type<string[]>().default([]), // e.g., ["wedding", "conference", "meeting"]

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// TESTIMONIALS
// ============================================

export const testimonials = pgTable('testimonials', {
    id: uuid('id').defaultRandom().primaryKey(),
    guestName: varchar('guest_name', { length: 255 }).notNull(),
    guestLocation: varchar('guest_location', { length: 255 }),
    rating: integer('rating').notNull().default(5),
    review: text('review').notNull(),
    avatar: text('avatar'),
    isActive: boolean('is_active').default(true),
    isFeatured: boolean('is_featured').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// SITE SETTINGS
// ============================================

export const siteSettings = pgTable('site_settings', {
    id: uuid('id').defaultRandom().primaryKey(),
    key: varchar('key', { length: 50 }).notNull().unique(), // e.g., 'hero_images', 'contact_email'
    value: json('value').notNull(), // Stores the actual setting data
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// RELATIONS
// ============================================

export const roomTypesRelations = relations(roomTypes, ({ many }) => ({
    rooms: many(rooms),
    bookingItems: many(bookingItems),
    inventory: many(roomInventory),
    images: many(roomImages),
    ratePlans: many(ratePlans),
    addOns: many(addOnRoomTypes),
}));

// ============================================
// AXISROOMS INTEGRATION & SYSTEM CORE
// ============================================

export const bookingSessions = pgTable('booking_sessions', {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
    userId: varchar('user_id', { length: 255 }), // Optional, if logged in
    step: varchar('step', { length: 50 }).default('search'), // search, rooms, details, payment, confirmation

    // Search Params
    checkIn: date('check_in'),
    checkOut: date('check_out'),
    adults: integer('adults').default(1),
    children: integer('children').default(0),

    // Selection
    selectedRoomTypeId: uuid('selected_room_type_id'), // Can reference roomTypes
    selectedRatePlanId: uuid('selected_rate_plan_id'),

    // Data Snapshots (for validation)
    cartData: json('cart_data'), // Stores current selection details

    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const bookingGuests = pgTable('booking_guests', {
    id: uuid('id').defaultRandom().primaryKey(),
    bookingId: uuid('booking_id').references(() => bookings.id).notNull(),
    guestType: varchar('guest_type', { length: 20 }).default('adult'), // adult, child
    title: varchar('title', { length: 20 }),
    firstName: varchar('first_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    age: integer('age'), // Important for children
    createdAt: timestamp('created_at').defaultNow(),
});

export const inventorySnapshots = pgTable('inventory_snapshots', {
    id: uuid('id').defaultRandom().primaryKey(),
    bookingSessionId: uuid('booking_session_id').references(() => bookingSessions.id),
    roomTypeId: uuid('room_type_id').references(() => roomTypes.id),
    checkIn: date('check_in').notNull(),
    checkOut: date('check_out').notNull(),
    availableCount: integer('available_count').notNull(),
    snapshotData: json('snapshot_data').notNull(), // Full API response
    createdAt: timestamp('created_at').defaultNow(),
});

export const rateSnapshots = pgTable('rate_snapshots', {
    id: uuid('id').defaultRandom().primaryKey(),
    bookingSessionId: uuid('booking_session_id').references(() => bookingSessions.id),
    roomTypeId: uuid('room_type_id').references(() => roomTypes.id),
    ratePlanId: uuid('rate_plan_id'),
    totalPrice: integer('total_price').notNull(),
    currency: varchar('currency', { length: 10 }).default('INR'),
    snapshotData: json('snapshot_data').notNull(), // Full API response
    createdAt: timestamp('created_at').defaultNow(),
});

export const idempotencyKeys = pgTable('idempotency_keys', {
    id: uuid('id').defaultRandom().primaryKey(),
    key: varchar('key', { length: 255 }).notNull().unique(),
    method: varchar('method', { length: 20 }).notNull(),
    path: varchar('path', { length: 255 }).notNull(),
    paramsHash: varchar('params_hash', { length: 255 }),
    responseData: json('response_data'),
    statusCode: integer('status_code'),
    lockedAt: timestamp('locked_at').defaultNow(),
    createdAt: timestamp('created_at').defaultNow(),
});



export const bookingConfirmations = pgTable('booking_confirmations', {
    id: uuid('id').defaultRandom().primaryKey(),
    bookingId: uuid('booking_id').references(() => bookings.id).notNull(),
    confirmationNumber: varchar('confirmation_number', { length: 100 }).notNull(),
    axisRoomsBookingId: varchar('axis_rooms_booking_id', { length: 100 }),
    voucherUrl: text('voucher_url'),
    apiResponse: json('api_response'), // Full confirmation payload
    confirmedAt: timestamp('confirmed_at').defaultNow(),
    createdAt: timestamp('created_at').defaultNow(),
});

export const roomImagesRelations = relations(roomImages, ({ one }) => ({
    roomType: one(roomTypes, {
        fields: [roomImages.roomTypeId],
        references: [roomTypes.id],
    }),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
    roomType: one(roomTypes, {
        fields: [rooms.roomTypeId],
        references: [roomTypes.id],
    }),
    bookingItems: many(bookingItems),
    attributeValues: many(roomAttributeValues),
}));

export const roomAttributesRelations = relations(roomAttributes, ({ many }) => ({
    attributeValues: many(roomAttributeValues),
}));

export const roomAttributeValuesRelations = relations(roomAttributeValues, ({ one }) => ({
    room: one(rooms, {
        fields: [roomAttributeValues.roomId],
        references: [rooms.id],
    }),
    attribute: one(roomAttributes, {
        fields: [roomAttributeValues.attributeId],
        references: [roomAttributes.id],
    }),
}));

export const ratePlansRelations = relations(ratePlans, ({ one, many }) => ({
    roomType: one(roomTypes, {
        fields: [ratePlans.roomTypeId],
        references: [roomTypes.id],
    }),
    bookingItems: many(bookingItems),
    roomBlocks: many(roomBlocks),
}));

export const bookingChannelsRelations = relations(bookingChannels, ({ many }) => ({
    bookings: many(bookings),
    waitlist: many(waitlist),
}));

export const guestProfilesRelations = relations(guestProfiles, ({ many }) => ({
    bookings: many(bookings),
}));

// Moved to end of file to avoid circular dependency


export const bookingItemsRelations = relations(bookingItems, ({ one }) => ({
    booking: one(bookings, {
        fields: [bookingItems.bookingId],
        references: [bookings.id],
    }),
    roomType: one(roomTypes, {
        fields: [bookingItems.roomTypeId],
        references: [roomTypes.id],
    }),
    room: one(rooms, {
        fields: [bookingItems.roomId],
        references: [rooms.id],
    }),
    ratePlan: one(ratePlans, {
        fields: [bookingItems.ratePlanId],
        references: [ratePlans.id],
    }),
}));

export const bookingHistoryRelations = relations(bookingHistory, ({ one }) => ({
    booking: one(bookings, {
        fields: [bookingHistory.bookingId],
        references: [bookings.id],
    }),
}));

export const waitlistRelations = relations(waitlist, ({ one }) => ({
    roomType: one(roomTypes, {
        fields: [waitlist.roomTypeId],
        references: [roomTypes.id],
    }),
    channel: one(bookingChannels, {
        fields: [waitlist.channelId],
        references: [bookingChannels.id],
    }),
    convertedBooking: one(bookings, {
        fields: [waitlist.convertedBookingId],
        references: [bookings.id],
    }),
}));

export const roomBlocksRelations = relations(roomBlocks, ({ one }) => ({
    roomType: one(roomTypes, {
        fields: [roomBlocks.roomTypeId],
        references: [roomTypes.id],
    }),
    ratePlan: one(ratePlans, {
        fields: [roomBlocks.ratePlanId],
        references: [ratePlans.id],
    }),
}));

export const dailyStatsRelations = relations(dailyStats, ({ one }) => ({
    roomType: one(roomTypes, {
        fields: [dailyStats.roomTypeId],
        references: [roomTypes.id],
    }),
}));

export const addOnsRelation = relations(addOns, ({ many }) => ({
    bookingAddOns: many(bookingAddOns),
    roomTypes: many(addOnRoomTypes),
}));

export const bookingAddOnsRelations = relations(bookingAddOns, ({ one }) => ({
    booking: one(bookings, {
        fields: [bookingAddOns.bookingId],
        references: [bookings.id],
    }),
    addOn: one(addOns, {
        fields: [bookingAddOns.addOnId],
        references: [addOns.id],
    }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
    booking: one(bookings, {
        fields: [payments.bookingId],
        references: [bookings.id],
    }),
}));
// ============================================
// AUTHENTICATION (NextAuth.js)
// ============================================

export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

export const users = pgTable("user", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email").notNull(),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
    role: userRoleEnum('role').default('user'),
});

export const accounts = pgTable(
    "account",
    {
        userId: text("userId")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: text("type").notNull(),
        provider: text("provider").notNull(),
        providerAccountId: text("providerAccountId").notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: integer("expires_at"),
        token_type: text("token_type"),
        scope: text("scope"),
        id_token: text("id_token"),
        session_state: text("session_state"),
    },
    (account) => ({
        compoundKey: primaryKey({
            columns: [account.provider, account.providerAccountId],
        }),
    })
);

export const sessions = pgTable("session", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
    "verificationToken",
    {
        identifier: text("identifier").notNull(),
        token: text("token").notNull(),
        expires: timestamp("expires", { mode: "date" }).notNull(),
    },
    (verificationToken) => ({
        compositePk: primaryKey({
            columns: [verificationToken.identifier, verificationToken.token],
        }),
    })
);

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
    guestProfile: one(guestProfiles, {
        fields: [bookings.guestProfileId],
        references: [guestProfiles.id],
    }),
    ratePlan: one(ratePlans, {
        fields: [bookings.ratePlanId],
        references: [ratePlans.id],
    }),
    room: one(rooms, {
        fields: [bookings.roomId],
        references: [rooms.id],
    }),
    channel: one(bookingChannels, {
        fields: [bookings.channelId],
        references: [bookingChannels.id],
    }),
    offer: one(offers, {
        fields: [bookings.offerId],
        references: [offers.id],
    }),
    items: many(bookingItems),
    addOns: many(bookingAddOns),
    payments: many(payments),
    history: many(bookingHistory),
}));

// ============================================
// MEMBERSHIP ENROLLMENT
// ============================================

export const membershipStatusEnum = pgEnum('membership_status', ['pending', 'contacted', 'approved', 'rejected']);

export const membershipApplications = pgTable('membership_applications', {
    id: uuid('id').defaultRandom().primaryKey(),
    
    // Personal Details
    fullName: varchar('full_name', { length: 255 }).notNull(),
    dateOfBirth: date('date_of_birth').notNull(),
    gender: varchar('gender', { length: 50 }),
    nationality: varchar('nationality', { length: 100 }),
    memberPhotographUrl: text('member_photograph_url'), // File upload URL
    
    // Contact Information
    mobileNumber: varchar('mobile_number', { length: 20 }).notNull(),
    emailAddress: varchar('email_address', { length: 255 }).notNull(),
    alternateContactNumber: varchar('alternate_contact_number', { length: 20 }),
    
    // Address Details
    residentialAddress: text('residential_address').notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 100 }).notNull(),
    country: varchar('country', { length: 100 }).notNull(),
    pinCode: varchar('pin_code', { length: 20 }).notNull(),
    
    // Identification Details
    idType: varchar('id_type', { length: 50 }).notNull(), // 'Aadhaar', 'Passport', 'Driving License', 'Other'
    idNumber: varchar('id_number', { length: 255 }).notNull(),
    
    // Communication Preferences
    preferredModeOfCommunication: varchar('preferred_mode', { length: 50 }), // 'Phone', 'Email', 'WhatsApp'
    
    // Emergency Contact
    emergencyName: varchar('emergency_name', { length: 255 }).notNull(),
    emergencyRelationship: varchar('emergency_relationship', { length: 100 }).notNull(),
    emergencyContactNumber: varchar('emergency_contact_number', { length: 20 }).notNull(),
    
    // Tracking/Admin
    status: membershipStatusEnum('status').default('pending'),
    notes: text('notes'),
    
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// WHATSAPP — Cloud API broadcast & guest messaging
// ============================================
//
// Design notes:
//  - `wa_messages` is BOTH the outbound queue and the permanent audit log. The
//    dispatcher claims rows with FOR UPDATE SKIP LOCKED, so no external queue
//    service is needed and overlapping cron invocations are safe.
//  - `idempotency_key` is unique per (campaign, contact). A retry can never
//    double-send or double-bill.
//  - Consent is append-only in `wa_consent_events`. `wa_contacts.consent_status`
//    is the fast-read projection of that ledger, never the sole record.
//  - All money is stored in paise (integer), matching formatCurrency() in
//    lib/utils.ts which divides by 100.

export const waConsentStatusEnum = pgEnum('wa_consent_status', [
    'pending',      // imported without a documented WhatsApp opt-in — re-permission template only
    'opted_in',     // documented consent; may receive marketing
    'opted_out',    // withdrew consent; utility only where a transaction justifies it
    'suppressed',   // permanent do-not-contact
]);

export const waContactSourceEnum = pgEnum('wa_contact_source', [
    'booking', 'guest_profile', 'inquiry', 'import', 'inbound', 'manual',
]);

export const waCampaignStatusEnum = pgEnum('wa_campaign_status', [
    'draft', 'pending_approval', 'scheduled', 'sending', 'paused', 'completed', 'halted', 'failed',
]);

export const waMessageStatusEnum = pgEnum('wa_message_status', [
    'queued', 'sending', 'sent', 'delivered', 'read', 'failed', 'skipped', 'cancelled',
]);

export const waTemplateStatusEnum = pgEnum('wa_template_status', [
    'draft',            // being written in our panel
    'internal_review',  // awaiting a manager's approval before we submit to Meta
    'pending_meta',     // submitted, awaiting Meta review
    'approved', 'rejected', 'paused', 'disabled',
]);

export const waTemplateCategoryEnum = pgEnum('wa_template_category', [
    'MARKETING', 'UTILITY', 'AUTHENTICATION',
]);

export const waDirectionEnum = pgEnum('wa_direction', ['inbound', 'outbound']);

// --------------------------------------------
// Contacts & consent
// --------------------------------------------

export const waContacts = pgTable('wa_contacts', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Always stored E.164 (e.g. +919847123456). Normalised on write by phone.ts.
    phone: varchar('phone', { length: 20 }).notNull().unique(),
    name: varchar('name', { length: 255 }),
    email: varchar('email', { length: 255 }),
    locale: varchar('locale', { length: 10 }).default('en'),

    source: waContactSourceEnum('source').notNull().default('import'),
    importId: uuid('import_id'),
    guestProfileId: uuid('guest_profile_id').references(() => guestProfiles.id, { onDelete: 'set null' }),

    // Consent — projection of wa_consent_events, kept here for fast filtering.
    consentStatus: waConsentStatusEnum('consent_status').notNull().default('pending'),
    consentSource: varchar('consent_source', { length: 255 }), // e.g. "booking form", "front desk card"
    consentAt: timestamp('consent_at'),
    consentProofUrl: text('consent_proof_url'),
    provenanceNote: text('provenance_note'), // mandatory on import — DPDP evidence
    optedOutAt: timestamp('opted_out_at'),
    optOutMethod: varchar('opt_out_method', { length: 50 }), // 'button' | 'stop_reply' | 'manual' | 'block_signal'

    // Engagement / rate-limiting counters
    lastInboundAt: timestamp('last_inbound_at'),
    lastOutboundAt: timestamp('last_outbound_at'),
    marketingSentCount: integer('marketing_sent_count').default(0),
    marketingSent30d: integer('marketing_sent_30d').default(0), // drives the frequency cap
    failureCount: integer('failure_count').default(0),
    isWhatsappUser: boolean('is_whatsapp_user'), // null = unknown until first send attempt

    tags: json('tags').$type<string[]>().default([]),
    notes: text('notes'),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
    index('wa_contacts_consent_idx').on(table.consentStatus),
    index('wa_contacts_source_idx').on(table.source),
    index('wa_contacts_guest_profile_idx').on(table.guestProfileId),
    index('wa_contacts_last_inbound_idx').on(table.lastInboundAt),
]);

// Append-only. Never updated or deleted — this is the proof of consent.
export const waConsentEvents = pgTable('wa_consent_events', {
    id: uuid('id').defaultRandom().primaryKey(),
    contactId: uuid('contact_id').notNull().references(() => waContacts.id, { onDelete: 'cascade' }),
    // Denormalised so consent history can be read by number without a join, and so
    // it stays correct if a contact's number is later corrected. It does NOT
    // survive erasure: this row cascades with the contact, which is the intended
    // DPDP behaviour — the proof that an erasure happened lives in wa_audit_log,
    // and the do-not-contact guarantee lives in wa_suppression.
    phone: varchar('phone', { length: 20 }).notNull(),
    fromStatus: waConsentStatusEnum('from_status'),
    toStatus: waConsentStatusEnum('to_status').notNull(),
    reason: text('reason'),
    source: varchar('source', { length: 100 }),
    actorId: uuid('actor_id'), // admin user who made the change; null = system/guest action
    actorEmail: varchar('actor_email', { length: 255 }),
    ip: varchar('ip', { length: 64 }),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
    index('wa_consent_events_contact_idx').on(table.contactId),
    index('wa_consent_events_phone_idx').on(table.phone),
]);

// Permanent do-not-contact. Survives re-imports — this is what stops an opt-out
// being resurrected by the next CSV upload.
export const waSuppression = pgTable('wa_suppression', {
    id: uuid('id').defaultRandom().primaryKey(),
    phone: varchar('phone', { length: 20 }).notNull().unique(),
    reason: varchar('reason', { length: 255 }),
    addedBy: uuid('added_by'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const waImports = pgTable('wa_imports', {
    id: uuid('id').defaultRandom().primaryKey(),
    filename: varchar('filename', { length: 255 }).notNull(),
    blobUrl: text('blob_url'),
    rowCount: integer('row_count').default(0),
    importedCount: integer('imported_count').default(0),
    updatedCount: integer('updated_count').default(0),
    rejectedCount: integer('rejected_count').default(0),
    duplicateCount: integer('duplicate_count').default(0),

    // What the operator declared about consent at import time. Required.
    consentDeclaration: json('consent_declaration').$type<{
        hasExplicitOptIn: boolean;
        source?: string;
        collectedAt?: string;
        proofUrl?: string;
    }>(),
    provenanceNote: text('provenance_note').notNull(),
    assignedStatus: waConsentStatusEnum('assigned_status').notNull().default('pending'),

    columnMapping: json('column_mapping').$type<Record<string, string>>(),
    errorReportUrl: text('error_report_url'),
    actorId: uuid('actor_id'),
    actorEmail: varchar('actor_email', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow(),
});

export const waAudiences = pgTable('wa_audiences', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    // 'dynamic' re-evaluates the filter at send time, so opt-outs auto-exclude.
    type: varchar('type', { length: 20 }).notNull().default('dynamic'),
    filter: json('filter').$type<Record<string, unknown>>().default({}),
    contactIds: json('contact_ids').$type<string[]>(), // static audiences only
    lastCount: integer('last_count').default(0),
    lastEvaluatedAt: timestamp('last_evaluated_at'),
    isSystem: boolean('is_system').default(false), // prebuilt, not user-deletable
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// --------------------------------------------
// Templates
// --------------------------------------------

export const waTemplates = pgTable('wa_templates', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(), // Meta requires lower_snake_case
    language: varchar('language', { length: 10 }).notNull().default('en'),
    category: waTemplateCategoryEnum('category').notNull().default('MARKETING'),
    status: waTemplateStatusEnum('status').notNull().default('draft'),

    metaTemplateId: varchar('meta_template_id', { length: 100 }),
    components: json('components').$type<unknown[]>().default([]),
    bodyText: text('body_text'),
    headerType: varchar('header_type', { length: 20 }), // text | image | document | none
    headerText: text('header_text'),
    footerText: text('footer_text'),
    buttons: json('buttons').$type<unknown[]>().default([]),
    variableCount: integer('variable_count').default(0),
    // Maps {{1}} -> a data source, e.g. { "1": "contact.firstName" }
    variableMap: json('variable_map').$type<Record<string, string>>().default({}),
    variableFallbacks: json('variable_fallbacks').$type<Record<string, string>>().default({}),

    rejectionReason: text('rejection_reason'),
    qualityScore: varchar('quality_score', { length: 20 }),

    submittedBy: uuid('submitted_by'),
    approvedBy: uuid('approved_by'),
    submittedAt: timestamp('submitted_at'),
    syncedAt: timestamp('synced_at'),

    sentCount: integer('sent_count').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
    uniqueIndex('wa_templates_name_lang_idx').on(table.name, table.language),
    index('wa_templates_status_idx').on(table.status),
]);

// --------------------------------------------
// Campaigns & the send queue
// --------------------------------------------

export const waCampaigns = pgTable('wa_campaigns', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    templateId: uuid('template_id').references(() => waTemplates.id),
    audienceId: uuid('audience_id').references(() => waAudiences.id),
    status: waCampaignStatusEnum('status').notNull().default('draft'),

    dailyCap: integer('daily_cap'),
    throttlePerMin: integer('throttle_per_min').default(60),
    scheduledAt: timestamp('scheduled_at'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),

    // Counters — updated by the dispatcher and the webhook.
    totalCount: integer('total_count').default(0),
    queuedCount: integer('queued_count').default(0),
    sentCount: integer('sent_count').default(0),
    deliveredCount: integer('delivered_count').default(0),
    readCount: integer('read_count').default(0),
    failedCount: integer('failed_count').default(0),
    skippedCount: integer('skipped_count').default(0),
    optedOutCount: integer('opted_out_count').default(0),

    // Paise.
    estimatedCost: integer('estimated_cost').default(0),
    actualCost: integer('actual_cost').default(0),

    // Static per-campaign variable values, e.g. { "2": "MONSOON30" }
    staticVariables: json('static_variables').$type<Record<string, string>>().default({}),

    // Where /w/<token> sends the guest. Read from here, never from the request —
    // a destination taken off the query string is an open redirect.
    destinationPath: text('destination_path'),
    // Emitted on the redirect so the hotel's GA lines up with ours. Never the
    // mechanism we attribute on.
    utmCampaign: varchar('utm_campaign', { length: 100 }),
    // The promo code this campaign advertises, auto-applied to the booking
    // session of a guest who arrives through its link.
    offerCode: varchar('offer_code', { length: 50 }),

    createdBy: uuid('created_by'),
    approvedBy: uuid('approved_by'), // two-person rule above the approval threshold
    haltReason: text('halt_reason'),
    variantOf: uuid('variant_of'), // A/B testing
    variantLabel: varchar('variant_label', { length: 20 }), // 'A' | 'B'; NULL when not a test

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
    index('wa_campaigns_status_idx').on(table.status),
    index('wa_campaigns_scheduled_idx').on(table.scheduledAt),
]);

// The queue AND the audit log. One row per recipient per send.
export const waMessages = pgTable('wa_messages', {
    id: uuid('id').defaultRandom().primaryKey(),
    campaignId: uuid('campaign_id').references(() => waCampaigns.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id').notNull().references(() => waContacts.id, { onDelete: 'cascade' }),
    templateId: uuid('template_id').references(() => waTemplates.id),
    automationKey: varchar('automation_key', { length: 100 }), // set for transactional sends

    direction: waDirectionEnum('direction').notNull().default('outbound'),
    status: waMessageStatusEnum('status').notNull().default('queued'),

    // Meta's message id. Nullable until sent; Postgres allows many NULLs in a unique index.
    wamid: varchar('wamid', { length: 128 }).unique(),
    // sha256 of (campaignId|contactId|templateId). Makes retries exactly-once.
    idempotencyKey: varchar('idempotency_key', { length: 128 }).notNull().unique(),
    conversationId: varchar('conversation_id', { length: 128 }),

    variables: json('variables').$type<Record<string, string>>().default({}),
    renderedBody: text('rendered_body'), // what the guest actually saw

    // 8 chars of Crockford base32, unique. Only set for campaign sends whose
    // template carries a dynamic URL button; NULL everywhere else.
    clickToken: varchar('click_token', { length: 16 }).unique(),

    attempts: integer('attempts').default(0),
    errorCode: integer('error_code'),
    errorDetail: text('error_detail'),
    skipReason: varchar('skip_reason', { length: 100 }), // why the consent gate blocked it

    cost: integer('cost').default(0), // paise
    pricingCategory: varchar('pricing_category', { length: 30 }),

    queuedAt: timestamp('queued_at').defaultNow(),
    sendAfter: timestamp('send_after'), // backoff / quiet-hours deferral
    sentAt: timestamp('sent_at'),
    deliveredAt: timestamp('delivered_at'),
    readAt: timestamp('read_at'),
    failedAt: timestamp('failed_at'),
}, (table) => [
    // The dispatcher's claim query. Order matters: status first, then due time.
    index('wa_messages_dispatch_idx').on(table.status, table.sendAfter),
    index('wa_messages_campaign_status_idx').on(table.campaignId, table.status),
    index('wa_messages_contact_idx').on(table.contactId),
    index('wa_messages_sent_at_idx').on(table.sentAt),
]);

// --------------------------------------------
// Two-way inbox
// --------------------------------------------

export const waInboxThreads = pgTable('wa_inbox_threads', {
    id: uuid('id').defaultRandom().primaryKey(),
    contactId: uuid('contact_id').notNull().references(() => waContacts.id, { onDelete: 'cascade' }).unique(),
    status: varchar('status', { length: 20 }).notNull().default('open'), // open | resolved
    assignedTo: uuid('assigned_to'),
    // Free-form replies are only allowed while this is in the future (Meta's 24h window).
    windowExpiresAt: timestamp('window_expires_at'),
    lastMessageAt: timestamp('last_message_at'),
    lastInboundAt: timestamp('last_inbound_at'),
    unreadCount: integer('unread_count').default(0),
    labels: json('labels').$type<string[]>().default([]),
    internalNotes: text('internal_notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
    index('wa_inbox_threads_status_idx').on(table.status),
    index('wa_inbox_threads_last_message_idx').on(table.lastMessageAt),
]);

export const waInboxMessages = pgTable('wa_inbox_messages', {
    id: uuid('id').defaultRandom().primaryKey(),
    threadId: uuid('thread_id').notNull().references(() => waInboxThreads.id, { onDelete: 'cascade' }),
    direction: waDirectionEnum('direction').notNull(),
    type: varchar('type', { length: 20 }).notNull().default('text'), // text | image | document | button | template
    body: text('body'),
    mediaUrl: text('media_url'),
    mediaMimeType: varchar('media_mime_type', { length: 100 }),
    wamid: varchar('wamid', { length: 128 }).unique(),
    status: waMessageStatusEnum('status').default('sent'),
    sentBy: uuid('sent_by'), // admin user for outbound; null for inbound
    errorDetail: text('error_detail'),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
    index('wa_inbox_messages_thread_idx').on(table.threadId, table.createdAt),
]);

export const waCannedReplies = pgTable('wa_canned_replies', {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    body: text('body').notNull(),
    category: varchar('category', { length: 100 }),
    sortOrder: integer('sort_order').default(0),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
});

// --------------------------------------------
// Automations, ops, audit
// --------------------------------------------

export const waAutomations = pgTable('wa_automations', {
    id: uuid('id').defaultRandom().primaryKey(),
    key: varchar('key', { length: 100 }).notNull().unique(), // 'booking_confirmation', 'prearrival', ...
    label: varchar('label', { length: 255 }).notNull(),
    description: text('description'),
    enabled: boolean('enabled').default(false),
    templateId: uuid('template_id').references(() => waTemplates.id),
    offsetHours: integer('offset_hours').default(0), // negative = before the event
    config: json('config').$type<Record<string, unknown>>().default({}),
    lastFiredAt: timestamp('last_fired_at'),
    fireCount: integer('fire_count').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Raw webhook payloads, append-only, for debugging and replay. Auto-purged.
export const waEvents = pgTable('wa_events', {
    id: uuid('id').defaultRandom().primaryKey(),
    eventType: varchar('event_type', { length: 50 }).notNull(),
    wamid: varchar('wamid', { length: 128 }),
    payload: json('payload').$type<Record<string, unknown>>(),
    processed: boolean('processed').default(false),
    processingError: text('processing_error'),
    receivedAt: timestamp('received_at').defaultNow(),
}, (table) => [
    index('wa_events_wamid_idx').on(table.wamid),
    index('wa_events_received_idx').on(table.receivedAt),
]);

// Singleton config row (key = 'default').
export const waSettings = pgTable('wa_settings', {
    key: varchar('key', { length: 50 }).primaryKey().default('default'),

    enabled: boolean('enabled').default(false),          // global kill switch
    testMode: boolean('test_mode').default(true),        // redirect all sends to testNumbers
    testNumbers: json('test_numbers').$type<string[]>().default([]),

    dailyCap: integer('daily_cap').default(250),
    throttlePerMin: integer('throttle_per_min').default(60),
    batchSize: integer('batch_size').default(100),
    maxConcurrency: integer('max_concurrency').default(10),
    maxAttempts: integer('max_attempts').default(3),

    quietHoursEnabled: boolean('quiet_hours_enabled').default(true),
    quietHoursStart: integer('quiet_hours_start').default(21), // IST hour, inclusive
    quietHoursEnd: integer('quiet_hours_end').default(9),      // IST hour, exclusive
    timezone: varchar('timezone', { length: 50 }).default('Asia/Kolkata'),

    frequencyCapPer30d: integer('frequency_cap_per_30d').default(2),

    monthlyBudget: integer('monthly_budget').default(2500000), // paise = ₹25,000
    budgetWarnPercent: integer('budget_warn_percent').default(80),

    // Auto-halt thresholds. Basis points to avoid floats: 300 = 3.00%.
    stopOptOutRateBp: integer('stop_opt_out_rate_bp').default(300),
    stopFailureRateBp: integer('stop_failure_rate_bp').default(1000),
    stopMinSample: integer('stop_min_sample').default(200),
    haltOnRedQuality: boolean('halt_on_red_quality').default(true),

    approvalThreshold: integer('approval_threshold').default(1000), // two-person rule above this

    // Attribution windows. 30 days for a click because a hotel stay is
    // deliberated over; 7 for a phone match, deliberately tighter, because a
    // loose window on a probabilistic signal invents attribution from coincidence.
    clickAttributionDays: integer('click_attribution_days').default(30),
    phoneAttributionDays: integer('phone_attribution_days').default(7),
    phoneAttributionEnabled: boolean('phone_attribution_enabled').default(true),

    // Cached account health, refreshed by the sync cron.
    qualityRating: varchar('quality_rating', { length: 20 }),
    messagingTier: varchar('messaging_tier', { length: 50 }),
    tokenExpiresAt: timestamp('token_expires_at'),
    lastWebhookAt: timestamp('last_webhook_at'),
    lastSyncAt: timestamp('last_sync_at'),
    lastHealthError: text('last_health_error'),

    updatedAt: timestamp('updated_at').defaultNow(),
});

export const waAuditLog = pgTable('wa_audit_log', {
    id: uuid('id').defaultRandom().primaryKey(),
    actorId: uuid('actor_id'),
    actorEmail: varchar('actor_email', { length: 255 }),
    action: varchar('action', { length: 100 }).notNull(),
    entityType: varchar('entity_type', { length: 50 }),
    entityId: varchar('entity_id', { length: 100 }),
    before: json('before').$type<Record<string, unknown>>(),
    after: json('after').$type<Record<string, unknown>>(),
    ip: varchar('ip', { length: 64 }),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
    index('wa_audit_log_created_idx').on(table.createdAt),
    index('wa_audit_log_actor_idx').on(table.actorId),
]);

// --------------------------------------------
// Attribution
// --------------------------------------------

// Every hit on /w/<token>, bots included. Bot hits are recorded rather than
// dropped so an implausible click count can be explained afterwards; they are
// excluded from every reported rate.
export const waClicks = pgTable('wa_clicks', {
    id: uuid('id').defaultRandom().primaryKey(),
    messageId: uuid('message_id').references(() => waMessages.id, { onDelete: 'cascade' }),
    campaignId: uuid('campaign_id').references(() => waCampaigns.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id').references(() => waContacts.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 16 }).notNull(),

    isBot: boolean('is_bot').notNull().default(false),
    botReason: varchar('bot_reason', { length: 50 }),
    userAgent: text('user_agent'),
    ipHash: varchar('ip_hash', { length: 64 }),
    referer: text('referer'),

    createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
    index('wa_clicks_message_idx').on(table.messageId),
    index('wa_clicks_campaign_idx').on(table.campaignId, table.isBot),
    index('wa_clicks_contact_idx').on(table.contactId),
    index('wa_clicks_created_idx').on(table.createdAt),
]);

// A join table rather than columns on `bookings`: it keeps a WhatsApp concern out
// of the core booking schema, lets one booking carry both a click record and a
// phone-match record so the tiers stay comparable, and means this module can be
// removed without a bookings migration.
export const waBookingAttribution = pgTable('wa_booking_attribution', {
    id: uuid('id').defaultRandom().primaryKey(),
    bookingId: uuid('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
    campaignId: uuid('campaign_id').references(() => waCampaigns.id, { onDelete: 'set null' }),
    messageId: uuid('message_id').references(() => waMessages.id, { onDelete: 'set null' }),
    contactId: uuid('contact_id').references(() => waContacts.id, { onDelete: 'set null' }),
    clickId: uuid('click_id').references(() => waClicks.id, { onDelete: 'set null' }),

    // 'click' — deterministic, they followed our link.
    // 'phone_match' — probabilistic, messaged then booked on a matching number
    // without clicking. The two are never summed without a label.
    kind: varchar('kind', { length: 20 }).notNull(),

    // Snapshot of bookings.totalAmount in paise (gotcha 6) at attribution time,
    // so a later cancellation cannot silently rewrite historic campaign revenue.
    revenue: integer('revenue').default(0),
    hoursToBook: integer('hours_to_book'),

    createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
    // At most one click attribution and one phone-match attribution per booking,
    // which is also what makes capture idempotent.
    uniqueIndex('wa_booking_attribution_booking_kind_idx').on(table.bookingId, table.kind),
    index('wa_booking_attribution_campaign_idx').on(table.campaignId, table.kind),
    index('wa_booking_attribution_created_idx').on(table.createdAt),
]);

// --------------------------------------------
// Relations
// --------------------------------------------

export const waContactsRelations = relations(waContacts, ({ one, many }) => ({
    guestProfile: one(guestProfiles, {
        fields: [waContacts.guestProfileId],
        references: [guestProfiles.id],
    }),
    messages: many(waMessages),
    consentEvents: many(waConsentEvents),
    thread: one(waInboxThreads, {
        fields: [waContacts.id],
        references: [waInboxThreads.contactId],
    }),
}));

export const waConsentEventsRelations = relations(waConsentEvents, ({ one }) => ({
    contact: one(waContacts, {
        fields: [waConsentEvents.contactId],
        references: [waContacts.id],
    }),
}));

export const waCampaignsRelations = relations(waCampaigns, ({ one, many }) => ({
    template: one(waTemplates, {
        fields: [waCampaigns.templateId],
        references: [waTemplates.id],
    }),
    audience: one(waAudiences, {
        fields: [waCampaigns.audienceId],
        references: [waAudiences.id],
    }),
    messages: many(waMessages),
}));

export const waMessagesRelations = relations(waMessages, ({ one }) => ({
    campaign: one(waCampaigns, {
        fields: [waMessages.campaignId],
        references: [waCampaigns.id],
    }),
    contact: one(waContacts, {
        fields: [waMessages.contactId],
        references: [waContacts.id],
    }),
    template: one(waTemplates, {
        fields: [waMessages.templateId],
        references: [waTemplates.id],
    }),
}));

export const waTemplatesRelations = relations(waTemplates, ({ many }) => ({
    campaigns: many(waCampaigns),
    messages: many(waMessages),
}));

export const waInboxThreadsRelations = relations(waInboxThreads, ({ one, many }) => ({
    contact: one(waContacts, {
        fields: [waInboxThreads.contactId],
        references: [waContacts.id],
    }),
    messages: many(waInboxMessages),
}));

export const waInboxMessagesRelations = relations(waInboxMessages, ({ one }) => ({
    thread: one(waInboxThreads, {
        fields: [waInboxMessages.threadId],
        references: [waInboxThreads.id],
    }),
}));
