import { pgTable, text, varchar, integer, timestamp, boolean, decimal, pgEnum, uuid, date, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// ENUMS
// ============================================

export const roomStatusEnum = pgEnum('room_status', ['active', 'inactive', 'maintenance']);
export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'confirmed', 'cancelled', 'completed']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'success', 'failed', 'refunded']);
export const addOnTypeEnum = pgEnum('addon_type', ['per_person', 'per_unit']);

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
    maxGuests: integer('max_guests').notNull().default(2),
    size: integer('size'), // in sq ft
    bedType: varchar('bed_type', { length: 100 }),
    amenities: json('amenities').$type<string[]>().default([]),
    images: json('images').$type<string[]>().default([]),
    featuredImage: text('featured_image'),
    status: roomStatusEnum('status').default('active'),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const rooms = pgTable('rooms', {
    id: uuid('id').defaultRandom().primaryKey(),
    roomTypeId: uuid('room_type_id').references(() => roomTypes.id).notNull(),
    roomNumber: varchar('room_number', { length: 50 }).notNull().unique(),
    floor: integer('floor'),
    status: roomStatusEnum('status').default('active'),
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
    guestName: varchar('guest_name', { length: 255 }).notNull(),
    guestEmail: varchar('guest_email', { length: 255 }).notNull(),
    guestPhone: varchar('guest_phone', { length: 20 }).notNull(),
    guestAddress: text('guest_address'),

    // Booking details
    checkIn: date('check_in').notNull(),
    checkOut: date('check_out').notNull(),
    adults: integer('adults').notNull().default(1),
    children: integer('children').default(0),

    // Pricing
    subtotal: integer('subtotal').notNull(), // in paise
    taxAmount: integer('tax_amount').default(0),
    discountAmount: integer('discount_amount').default(0),
    totalAmount: integer('total_amount').notNull(),

    // Promo
    promoCode: varchar('promo_code', { length: 50 }),

    // Status
    status: bookingStatusEnum('status').default('pending'),

    // Special requests
    specialRequests: text('special_requests'),

    // Metadata
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const bookingItems = pgTable('booking_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    bookingId: uuid('booking_id').references(() => bookings.id).notNull(),
    roomTypeId: uuid('room_type_id').references(() => roomTypes.id).notNull(),
    roomId: uuid('room_id').references(() => rooms.id),
    quantity: integer('quantity').default(1),
    pricePerNight: integer('price_per_night').notNull(), // in paise
    nights: integer('nights').notNull(),
    subtotal: integer('subtotal').notNull(),
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

// ============================================
// PAYMENTS
// ============================================

export const payments = pgTable('payments', {
    id: uuid('id').defaultRandom().primaryKey(),
    bookingId: uuid('booking_id').references(() => bookings.id).notNull(),

    // Razorpay details
    razorpayOrderId: varchar('razorpay_order_id', { length: 255 }),
    razorpayPaymentId: varchar('razorpay_payment_id', { length: 255 }),
    razorpaySignature: varchar('razorpay_signature', { length: 255 }),

    // Payment details
    amount: integer('amount').notNull(), // in paise
    currency: varchar('currency', { length: 10 }).default('INR'),
    status: paymentStatusEnum('status').default('pending'),
    paymentMethod: varchar('payment_method', { length: 50 }),

    // Refund
    refundAmount: integer('refund_amount').default(0),
    refundReason: text('refund_reason'),
    refundedAt: timestamp('refunded_at'),

    // Metadata
    metadata: json('metadata'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
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
    sortOrder: integer('sort_order').default(0),
    isActive: boolean('is_active').default(true),
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
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
    roomType: one(roomTypes, {
        fields: [rooms.roomTypeId],
        references: [roomTypes.id],
    }),
    bookingItems: many(bookingItems),
}));

export const bookingsRelations = relations(bookings, ({ many }) => ({
    items: many(bookingItems),
    addOns: many(bookingAddOns),
    payments: many(payments),
}));

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
}));

export const addOnsRelations = relations(addOns, ({ many }) => ({
    bookingAddOns: many(bookingAddOns),
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
