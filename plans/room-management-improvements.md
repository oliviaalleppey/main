# Room Management System - 5-Star Hotel Improvements

## Current System Analysis

### What You Have ✅
1. **Room Types** - Categories with base pricing
2. **Individual Rooms** - Room numbers with status
3. **Room Inventory** - Daily availability tracking
4. **Pricing Rules** - Seasonal/date-based pricing
5. **Occupancy Pricing** - Demand-based adjustments
6. **Bookings** - Guest reservations

### What's Missing for 5-Star Standards ❌

---

## 1. ROOM ATTRIBUTES & FEATURES

### Problem
Currently, all rooms of the same type are treated identically. In luxury hotels, individual rooms have different attributes that affect guest experience and sometimes pricing.

### Solution: Room Attribute System

```typescript
// New schema additions
roomAttributes: pgTable('room_attributes', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(), // "Lake View", "High Floor", "Corner Room"
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  priceModifier: integer('price_modifier').default(0), // percentage adjustment
  category: varchar('category', { length: 50 }), // 'view', 'location', 'feature'
});

roomAttributeValues: pgTable('room_attribute_values', {
  id: uuid('id').defaultRandom().primaryKey(),
  roomId: uuid('room_id').references(() => rooms.id).notNull(),
  attributeId: uuid('attribute_id').references(() => roomAttributes.id).notNull(),
  value: boolean('value').default(true),
});
```

### Examples:
- **Lake View** - Premium attribute (+10% price)
- **Canal View** - Standard attribute
- **High Floor** (Floor 3+) - Premium attribute
- **Corner Room** - More space, premium
- **Connecting Rooms** - Family-friendly
- **Renovated** - Modern amenities
- **Balcony** - Outdoor space

---

## 2. RATE PLANS (Multiple Pricing per Room Type)

### Problem
Currently one base price per room type. Luxury hotels offer multiple rate plans for the same room.

### Solution: Rate Plan System

```typescript
ratePlans: pgTable('rate_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  roomTypeId: uuid('room_type_id').references(() => roomTypes.id).notNull(),
  
  // Pricing
  basePriceModifier: integer('base_price_modifier').default(100), // % of room type base price
  minLOS: integer('min_los').default(1), // Minimum length of stay
  maxLOS: integer('max_los'), // Maximum length of stay
  
  // Inclusions
  includesBreakfast: boolean('includes_breakfast').default(false),
  includesAirportTransfer: boolean('includes_airport_transfer').default(false),
  includesLateCheckout: boolean('includes_late_checkout').default(false),
  includesSpa: boolean('includes_spa').default(false),
  
  // Conditions
  cancellationPolicy: varchar('cancellation_policy', { length: 50 }), // 'flexible', 'moderate', 'strict', 'non_refundable'
  cancellationDays: integer('cancellation_days').default(1), // days before check-in
  depositRequired: integer('deposit_required').default(0), // percentage
  
  // Availability
  isActive: boolean('is_active').default(true),
  bookableFrom: date('bookable_from'),
  bookableTo: date('bookable_to'),
  
  // Display
  isDefault: boolean('is_default').default(false),
  isPromotional: boolean('is_promotional').default(false),
  displayOrder: integer('display_order').default(0),
});
```

### Example Rate Plans:
1. **Best Available Rate (BAR)** - Flexible cancellation, no inclusions
2. **Bed & Breakfast** - Includes daily breakfast (+15%)
3. **Romance Package** - Breakfast + Late checkout + Spa discount (+25%)
4. **Non-Refundable** - 20% discount, full prepayment
5. **Extended Stay** - 15% discount for 3+ nights
6. **Corporate Rate** - Fixed corporate pricing

---

## 3. CHANNEL MANAGEMENT

### Problem
No integration with OTAs (Online Travel Agencies) or GDS systems.

### Solution: Channel Management

```typescript
bookingChannels: pgTable('booking_channels', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(), // 'direct', 'booking.com', 'expedia', 'makemytrip'
  code: varchar('code', { length: 50 }).notNull().unique(),
  type: varchar('type', { length: 50 }), // 'direct', 'ota', 'gds', 'agent'
  
  // Commission
  commissionType: varchar('commission_type', { length: 20 }), // 'percentage', 'fixed'
  commissionValue: integer('commission_value').default(0),
  
  // Settings
  isActive: boolean('is_active').default(true),
  autoConfirm: boolean('auto_confirm').default(true),
  paymentMode: varchar('payment_mode', { length: 50 }), // 'hotel_collect', 'channel_collect'
  
  // Integration
  apiEndpoint: text('api_endpoint'),
  apiKey: text('api_key'),
  syncInventory: boolean('sync_inventory').default(true),
  syncRates: boolean('sync_rates').default(true),
});

// Track which channel each booking came from
// Add to bookings table:
channelId: uuid('channel_id').references(() => bookingChannels.id),
channelBookingId: varchar('channel_booking_id', { length: 100 }), // External reference
```

---

## 4. ROOM STATUS WORKFLOW

### Problem
Simple active/inactive/maintenance status. Luxury hotels need detailed status tracking.

### Solution: Comprehensive Room Status

```typescript
// Enhanced room status enum
roomStatusEnum: ['available', 'occupied', 'reserved', 'maintenance', 'out_of_order', 'cleaning', 'inspection']

// Add to rooms table:
currentStatus: roomStatusEnum('current_status').default('available'),
statusUpdatedAt: timestamp('status_updated_at'),
statusNotes: text('status_notes'),
nextAvailableAt: timestamp('next_available_at'),

// Housekeeping integration
housekeepingStatus: pgTable('housekeeping_status', {
  id: uuid('id').defaultRandom().primaryKey(),
  roomId: uuid('room_id').references(() => rooms.id).notNull(),
  status: varchar('status', { length: 50 }), // 'clean', 'dirty', 'touch_up', 'inspect'
  assignedTo: varchar('assigned_to', { length: 100 }),
  priority: integer('priority').default(0),
  notes: text('notes'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### Status Workflow:
```
Available → Reserved → Occupied → Cleaning → Inspection → Available
                ↓
          Cancelled → Available
                ↓
          Maintenance → Available
```

---

## 5. OVERBOOKING MANAGEMENT

### Problem
No overbooking strategy. Hotels intentionally overbook based on historical no-show data.

### Solution: Overbooking Rules

```typescript
overbookingRules: pgTable('overbooking_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  roomTypeId: uuid('room_type_id').references(() => roomTypes.id),
  
  // Overbooking percentage
  maxOverbooking: integer('max_overbooking').default(10), // % overbooking allowed
  
  // Date-based rules
  startDate: date('start_date'),
  endDate: date('end_date'),
  dayOfWeek: json('day_of_week').$type<number[]>(), // [0,1,2,3,4,5,6]
  
  // Historical data
  averageNoShowRate: integer('average_no_show_rate').default(5), // %
  averageCancellationRate: integer('average_cancellation_rate').default(10),
  
  isActive: boolean('is_active').default(true),
});
```

---

## 6. WAITLIST MANAGEMENT

### Problem
When fully booked, potential guests are lost.

### Solution: Waitlist System

```typescript
waitlist: pgTable('waitlist', {
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
  
  // Priority
  priority: integer('priority').default(0),
  notes: text('notes'),
  
  // Status
  status: varchar('status', { length: 20 }).default('waiting'), // 'waiting', 'offered', 'confirmed', 'expired'
  offeredAt: timestamp('offered_at'),
  expiresAt: timestamp('expires_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## 7. ROOM BLOCKING & ALLOTMENTS

### Problem
No way to block rooms for groups, events, or maintenance in bulk.

### Solution: Room Blocks

```typescript
roomBlocks: pgTable('room_blocks', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }), // 'group', 'event', 'maintenance', 'contract'
  
  // Date range
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  
  // Rooms
  roomTypeId: uuid('room_type_id').references(() => roomTypes.id),
  totalRooms: integer('total_rooms').notNull(),
  releasedRooms: integer('released_rooms').default(0), // Rooms released back to inventory
  
  // Release rules
  releaseDate: date('release_date'), // Date when unbooked rooms are released
  cutOffDate: date('cut_off_date'), // Booking deadline
  
  // Pricing
  negotiatedRate: integer('negotiated_rate'),
  
  // Contact
  contactName: varchar('contact_name', { length: 255 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 20 }),
  
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## 8. RESERVATION WORKFLOW & PERMISSIONS

### Problem
No role-based access or approval workflows.

### Solution: Staff Roles & Actions

```typescript
staffRoles: pgTable('staff_roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  permissions: json('permissions').$type<string[]>().default([]),
  // ['view_bookings', 'create_bookings', 'modify_bookings', 'cancel_bookings', 
  //  'override_pricing', 'approve_discounts', 'manage_inventory', 'view_reports']
});

// Add to bookings table:
createdBy: uuid('created_by').references(() => users.id),
modifiedBy: uuid('modified_by').references(() => users.id),
approvedBy: uuid('approved_by').references(() => users.id),
discountApprovedBy: uuid('discount_approved_by').references(() => users.id),

// Booking modification log
bookingHistory: pgTable('booking_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingId: uuid('booking_id').references(() => bookings.id).notNull(),
  action: varchar('action', { length: 50 }).notNull(), // 'created', 'modified', 'cancelled', 'confirmed'
  changes: json('changes'), // { field: { old: '', new: '' } }
  performedBy: uuid('performed_by').references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## 9. GUEST HISTORY & PREFERENCES

### Problem
No guest profile or preference tracking.

### Solution: Guest CRM

```typescript
guestProfiles: pgTable('guest_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  
  // Personal info
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }),
  
  // Preferences
  preferredRoomType: uuid('preferred_room_type').references(() => roomTypes.id),
  preferredFloor: integer('preferred_floor'),
  bedPreference: varchar('bed_preference', { length: 50 }), // 'king', 'twin'
  smokingPreference: varchar('smoking_preference', { length: 20 }), // 'smoking', 'non_smoking', 'no_preference'
  dietaryRestrictions: text('dietary_restrictions'),
  specialRequests: text('special_requests'),
  
  // Stats
  totalStays: integer('total_stays').default(0),
  totalSpent: integer('total_spent').default(0),
  lastStayAt: timestamp('last_stay_at'),
  
  // VIP
  isVIP: boolean('is_vip').default(false),
  vipLevel: varchar('vip_level', { length: 50 }), // 'silver', 'gold', 'platinum'
  notes: text('notes'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

---

## 10. REPORTING & ANALYTICS

### Problem
No revenue or occupancy reporting.

### Solution: Dashboard & Reports

### Key Reports Needed:
1. **Occupancy Report** - Daily/Weekly/Monthly occupancy %
2. **Revenue Report** - ADR (Average Daily Rate), RevPAR (Revenue Per Available Room)
3. **Booking Source Report** - Revenue by channel
4. **Room Type Performance** - Most/least booked room types
5. **Cancellation Report** - Cancellation rate by channel/date
6. **Forecast Report** - Predicted occupancy for next 30/60/90 days

```typescript
// Daily snapshot for reporting
dailyStats: pgTable('daily_stats', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: date('date').notNull(),
  roomTypeId: uuid('room_type_id').references(() => roomTypes.id),
  
  // Inventory
  totalRooms: integer('total_rooms').notNull(),
  availableRooms: integer('available_rooms').notNull(),
  occupiedRooms: integer('occupied_rooms').notNull(),
  
  // Revenue
  roomRevenue: integer('room_revenue').default(0),
  addonRevenue: integer('addon_revenue').default(0),
  totalRevenue: integer('total_revenue').default(0),
  
  // Metrics
  occupancyRate: integer('occupancy_rate').default(0), // %
  adr: integer('adr').default(0), // Average Daily Rate
  revpar: integer('revpar').default(0), // Revenue Per Available Room
  
  // Bookings
  newBookings: integer('new_bookings').default(0),
  cancellations: integer('cancellations').default(0),
  checkIns: integer('check_ins').default(0),
  checkOuts: integer('check_outs').default(0),
  
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## Implementation Priority

### Phase 1: Essential (Week 1-2)
1. ✅ Rate Plans - Multiple pricing options
2. ✅ Room Status Workflow - Better status tracking
3. ✅ Booking History - Audit trail

### Phase 2: Important (Week 3-4)
4. ✅ Room Attributes - Individual room features
5. ✅ Guest Profiles - CRM basics
6. ✅ Waitlist Management

### Phase 3: Advanced (Week 5-6)
7. ✅ Channel Management - OTA integration
8. ✅ Room Blocks - Group bookings
9. ✅ Overbooking Rules

### Phase 4: Analytics (Week 7-8)
10. ✅ Daily Stats & Reporting
11. ✅ Dashboard improvements
12. ✅ Forecast reports

---

## Quick Wins (Can implement now)

### 1. Add Rate Plans Table
This immediately enables:
- Non-refundable rates (discount)
- Breakfast included rates
- Corporate rates

### 2. Add Booking Source Tracking
Simple field to track where bookings come from:
- Direct website
- Phone
- Walk-in
- OTA (future)

### 3. Add Guest Notes Field
Allow staff to add notes about guests:
- Preferences
- Issues
- VIP status

### 4. Improve Room Status
Add more status options and last-updated tracking.

---

## Questions to Consider

1. **Do you want to implement rate plans first?** This is the most impactful change.

2. **Do you need OTA integration?** This requires API work with Booking.com/Expedia.

3. **Do you want a guest loyalty program?** This ties into guest profiles.

4. **What reports are most important?** I can build a reporting dashboard.
