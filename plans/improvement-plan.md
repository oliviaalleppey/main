# Olivia Hotel Website - Comprehensive Improvement Plan

## Executive Summary

This document outlines a complete improvement plan for the Olivia International Hotel website project. The analysis covers architecture, security, database, frontend, performance, testing, and feature enhancements.

---

## Table of Contents

1. [Architecture & Project Structure](#1-architecture--project-structure)
2. [Authentication & Security](#2-authentication--security)
3. [Database & Data Layer](#3-database--data-layer)
4. [Frontend & UI Components](#4-frontend--ui-components)
5. [API Routes & Backend Logic](#5-api-routes--backend-logic)
6. [Performance Optimization](#6-performance-optimization)
7. [Testing & Quality Assurance](#7-testing--quality-assurance)
8. [SEO & Metadata](#8-seo--metadata)
9. [Developer Experience](#9-developer-experience)
10. [Feature Additions](#10-feature-additions)
11. [Accessibility](#11-accessibility)
12. [DevOps & Deployment](#12-devops--deployment)

---

## 1. Architecture & Project Structure

### Current Issues

| Issue | Location | Severity |
|-------|----------|----------|
| Duplicate navigation components | [`navigation.tsx`](components/navigation.tsx) and [`rosewood-header.tsx`](components/layout/rosewood-header.tsx) | High |
| Duplicate footer components | [`footer.tsx`](components/footer.tsx) and [`rosewood-footer.tsx`](components/layout/rosewood-footer.tsx) | High |
| Missing error boundary components | N/A | Medium |
| No environment variable validation | [`lib/db/index.ts`](lib/db/index.ts:5) | High |
| Inconsistent component organization | Multiple files | Medium |

### Recommended Actions

#### 1.1 Consolidate Navigation Components
```
Current: navigation.tsx + rosewood-header.tsx
Action:  Merge into single Header component with variants
```

- Remove [`components/navigation.tsx`](components/navigation.tsx)
- Enhance [`rosewood-header.tsx`](components/layout/rosewood-header.tsx) to support both transparent and solid variants
- Create a unified navigation configuration

#### 1.2 Consolidate Footer Components
```
Current: footer.tsx + rosewood-footer.tsx
Action:  Merge into single Footer component
```

- Remove [`components/footer.tsx`](components/footer.tsx)
- Use [`rosewood-footer.tsx`](components/layout/rosewood-footer.tsx) as the primary footer
- Ensure all links are properly configured

#### 1.3 Add Environment Variable Validation
```typescript
// Suggested: lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  RAZORPAY_KEY_ID: z.string(),
  RAZORPAY_KEY_SECRET: z.string(),
  RESEND_API_KEY: z.string(),
  HOTEL_EMAIL: z.string().email(),
  HOTEL_PHONE: z.string(),
  NEXT_PUBLIC_WHATSAPP: z.string(),
});

export const env = envSchema.parse(process.env);
```

#### 1.4 Create Error Boundary Components
```
components/
  error-boundary.tsx        # Global error boundary
  not-found.tsx             # 404 page
  error.tsx                 # Error page
  loading.tsx               # Loading skeleton
```

#### 1.5 Reorganize Component Structure
```
components/
  layout/
    header.tsx              # Unified header
    footer.tsx              # Unified footer
    sidebar.tsx             # Admin sidebar
  home/
    hero-section.tsx
    booking-widget.tsx
    ...
  booking/
    booking-form.tsx
    date-picker.tsx
    guest-selector.tsx
  forms/
    contact-form.tsx
    inquiry-form.tsx
  ui/
    button.tsx
    card.tsx
    input.tsx
    ...
```

---

## 2. Authentication & Security

### Current Issues

| Issue | Location | Severity |
|-------|----------|----------|
| Upload route has no auth check | [`app/api/upload/route.ts`](app/api/upload/route.ts:14-15) | Critical |
| Admin panel lacks proper auth | [`app/admin/layout.tsx`](app/admin/layout.tsx) | High |
| No CSRF protection for forms | Multiple forms | Medium |
| Hardcoded admin role check | [`rosewood-header.tsx:37`](components/layout/rosewood-header.tsx:37) | Medium |
| Missing rate limiting | N/A | High |

### Recommended Actions

#### 2.1 Secure Upload API Route
```typescript
// app/api/upload/route.ts
import { auth } from '@/auth';

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... existing upload logic
}
```

#### 2.2 Add Admin Layout Authentication
```typescript
// app/admin/layout.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }) {
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    redirect('/auth/signin?callbackUrl=/admin');
  }
  // ... render layout
}
```

#### 2.3 Implement Rate Limiting
```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});
```

#### 2.4 Add Form CSRF Protection
- Use NextAuth's built-in CSRF tokens
- Add to all form submissions

#### 2.5 Remove ts-ignore Comments
```typescript
// Current (rosewood-header.tsx:36-37)
// @ts-ignore
{session?.user?.role === 'admin' && ...}

// Fix: Update types/next-auth.d.ts properly
```

#### 2.6 Add Security Headers
```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    }];
  },
};
```

---

## 3. Database & Data Layer

### Current Issues

| Issue | Location | Severity |
|-------|----------|----------|
| No database migrations | N/A | High |
| Missing indexes on tables | [`schema.ts`](lib/db/schema.ts) | Medium |
| No soft delete implementation | [`schema.ts`](lib/db/schema.ts) | Medium |
| Missing audit logging | N/A | Medium |
| No connection pooling config | [`lib/db/index.ts`](lib/db/index.ts) | Low |

### Recommended Actions

#### 3.1 Add Database Migrations
```bash
# Add drizzle-kit migration commands
npm install -D drizzle-kit
```

```json
// package.json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

#### 3.2 Add Database Indexes
```typescript
// lib/db/schema.ts - Add indexes
import { index } from 'drizzle-orm/pg-core';

export const bookings = pgTable('bookings', {
  // ... existing columns
}, (table) => ({
  emailIdx: index('bookings_email_idx').on(table.guestEmail),
  statusIdx: index('bookings_status_idx').on(table.status),
  checkInIdx: index('bookings_checkin_idx').on(table.checkIn),
}));
```

#### 3.3 Implement Soft Deletes
```typescript
// Add to relevant tables
deletedAt: timestamp('deleted_at'),
isDeleted: boolean('is_deleted').default(false),
```

#### 3.4 Add Audit Logging
```typescript
// New table: audit_logs
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tableName: varchar('table_name', { length: 100 }).notNull(),
  recordId: uuid('record_id').notNull(),
  action: varchar('action', { length: 20 }).notNull(), // CREATE, UPDATE, DELETE
  oldValues: json('old_values'),
  newValues: json('new_values'),
  userId: uuid('user_id'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

#### 3.5 Add Data Validation with Zod
```typescript
// lib/validations/booking.ts
import { z } from 'zod';

export const bookingSchema = z.object({
  guestName: z.string().min(2).max(255),
  guestEmail: z.string().email(),
  guestPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  checkIn: z.date(),
  checkOut: z.date(),
  adults: z.number().int().min(1).max(10),
  children: z.number().int().min(0).max(10),
  specialRequests: z.string().max(1000).optional(),
});
```

---

## 4. Frontend & UI Components

### Current Issues

| Issue | Location | Severity |
|-------|----------|----------|
| Hardcoded mock data in pages | [`app/rooms/page.tsx`](app/rooms/page.tsx:9-54), [`app/rooms/[slug]/page.tsx`](app/rooms/[slug]/page.tsx:13-83) | High |
| Missing loading states | Multiple components | Medium |
| No skeleton components | N/A | Medium |
| Duplicate hero section IDs | [`hero-section.tsx:126-129`](components/home/hero-section.tsx:126-129) | Low |
| Inconsistent styling patterns | Multiple files | Low |
| Missing form validation UI | Multiple forms | Medium |

### Recommended Actions

#### 4.1 Replace Mock Data with Database Queries
```typescript
// app/rooms/page.tsx - Convert to Server Component
import { db } from '@/lib/db';
import { roomTypes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function RoomsPage() {
  const rooms = await db.select()
    .from(roomTypes)
    .where(eq(roomTypes.status, 'active'));
  
  return <RoomsGrid rooms={rooms} />;
}
```

#### 4.2 Add Loading Skeletons
```typescript
// components/skeletons/room-card-skeleton.tsx
export function RoomCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-64 bg-gray-200 rounded-lg" />
      <div className="mt-4 h-6 bg-gray-200 rounded w-3/4" />
      <div className="mt-2 h-4 bg-gray-200 rounded w-1/2" />
    </div>
  );
}
```

#### 4.3 Add loading.tsx Files
```typescript
// app/rooms/loading.tsx
import { RoomCardSkeleton } from '@/components/skeletons/room-card-skeleton';

export default function Loading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <RoomCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

#### 4.4 Fix Duplicate IDs in Hero Section
```typescript
// hero-section.tsx - Remove duplicate id="booking-search"
// Line 126 and 129 have the same ID
```

#### 4.5 Add Form Validation with React Hook Form
```typescript
// components/forms/contact-form.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function ContactForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(contactSchema),
  });
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span className="text-red-500">{errors.email.message}</span>}
    </form>
  );
}
```

#### 4.6 Create Reusable Animation Variants
```typescript
// lib/animations.ts
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } },
};
```

---

## 5. API Routes & Backend Logic

### Current Issues

| Issue | Location | Severity |
|-------|----------|----------|
| Missing booking API routes | N/A | Critical |
| Missing inquiry submission API | N/A | High |
| No payment verification endpoint | N/A | High |
| Missing availability check API | N/A | High |
| No email queue system | [`lib/services/email.ts`](lib/services/email.ts) | Medium |

### Recommended Actions

#### 5.1 Create Booking API Routes
```
app/api/
  bookings/
    route.ts              # GET list, POST create
    [id]/
      route.ts            # GET, PUT, DELETE single booking
  availability/
    route.ts              # POST check availability
  payments/
    create-order/
      route.ts            # POST create Razorpay order
    verify/
      route.ts            # POST verify payment
  inquiries/
    route.ts              # POST submit inquiry
```

#### 5.2 Implement Booking Creation API
```typescript
// app/api/bookings/route.ts
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { bookings, bookingItems } from '@/lib/db/schema';
import { bookingSchema } from '@/lib/validations/booking';

export async function POST(request: Request) {
  const body = await request.json();
  const validated = bookingSchema.parse(body);
  
  // Check availability
  // Create booking
  // Send confirmation email
  
  return Response.json({ bookingId: newBooking.id });
}
```

#### 5.3 Add Payment Verification
```typescript
// app/api/payments/verify/route.ts
import { verifyRazorpaySignature } from '@/lib/services/payment';

export async function POST(request: Request) {
  const { orderId, paymentId, signature } = await request.json();
  
  const isValid = verifyRazorpaySignature({ orderId, paymentId, signature });
  
  if (!isValid) {
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  // Update booking status
  // Send confirmation email
}
```

#### 5.4 Create Server Actions for Forms
```typescript
// actions/inquiry.ts
'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { inquiries } from '@/lib/db/schema';
import { sendInquiryAcknowledgment } from '@/lib/services/email';

const inquirySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string(),
  type: z.enum(['event', 'wedding', 'general']),
  message: z.string().optional(),
});

export async function submitInquiry(formData: FormData) {
  const data = inquirySchema.parse(Object.fromEntries(formData));
  
  await db.insert(inquiries).values(data);
  await sendInquiryAcknowledgment(data);
  
  return { success: true };
}
```

---

## 6. Performance Optimization

### Current Issues

| Issue | Location | Severity |
|-------|----------|----------|
| No image optimization config | [`next.config.ts`](next.config.ts) | Medium |
| Missing dynamic imports | Multiple components | Medium |
| No caching strategy | N/A | High |
| Large bundle size potential | N/A | Medium |
| Missing font optimization | [`app/layout.tsx`](app/layout.tsx) | Low |

### Recommended Actions

#### 6.1 Configure Image Optimization
```typescript
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.vercel-storage.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
```

#### 6.2 Add Dynamic Imports for Heavy Components
```typescript
// components/home/photo-carousel.tsx
import dynamic from 'next/dynamic';

const PhotoCarousel = dynamic(() => import('./photo-carousel-client'), {
  loading: () => <PhotoCarouselSkeleton />,
  ssr: false,
});
```

#### 6.3 Implement Caching Strategy
```typescript
// lib/cache.ts
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  revalidate: number = 3600
): Promise<T> {
  // Use Next.js unstable_cache or implement with Redis
}

// Usage in server components
const rooms = await getCachedData('rooms:active', () => 
  db.select().from(roomTypes).where(eq(roomTypes.status, 'active'))
);
```

#### 6.4 Add Bundle Analysis
```json
// package.json
{
  "scripts": {
    "analyze": "ANALYZE=true next build"
  },
  "devDependencies": {
    "@next/bundle-analyzer": "^16.0.0"
  }
}
```

#### 6.5 Optimize Fonts
```typescript
// app/layout.tsx
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});
```

---

## 7. Testing & Quality Assurance

### Current Issues

| Issue | Location | Severity |
|-------|----------|----------|
| No test files | N/A | Critical |
| No testing framework | [`package.json`](package.json) | Critical |
| No E2E tests | N/A | High |
| No CI/CD pipeline | N/A | High |

### Recommended Actions

#### 7.1 Add Testing Framework
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

#### 7.2 Configure Vitest
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
});
```

#### 7.3 Add Unit Tests
```typescript
// __tests__/lib/services/booking.test.ts
import { describe, it, expect } from 'vitest';
import { calculateBookingPrice, validateDateRange } from '@/lib/services/booking';

describe('calculateBookingPrice', () => {
  it('should calculate correct price for 2 nights', () => {
    const result = calculateBookingPrice({
      basePrice: 100000, // ₹1000
      nights: 2,
      rooms: 1,
    });
    expect(result.subtotal).toBe(200000);
    expect(result.taxAmount).toBe(24000); // 12% GST
  });
});
```

#### 7.4 Add E2E Tests with Playwright
```bash
npm install -D @playwright/test
```

```typescript
// e2e/booking.spec.ts
import { test, expect } from '@playwright/test';

test('user can search for rooms', async ({ page }) => {
  await page.goto('/');
  await page.fill('[data-testid="check-in"]', '2026-03-01');
  await page.fill('[data-testid="check-out"]', '2026-03-03');
  await page.click('button:has-text("Search")');
  await expect(page).toHaveURL(/\/rooms\?/);
});
```

#### 7.5 Add GitHub Actions CI
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

---

## 8. SEO & Metadata

### Current Issues

| Issue | Location | Severity |
|-------|----------|----------|
| Static metadata only | [`app/layout.tsx`](app/layout.tsx:23-34) | Medium |
| No sitemap | N/A | High |
| No robots.txt | N/A | High |
| Missing structured data | N/A | Medium |
| No Open Graph images | N/A | Medium |

### Recommended Actions

#### 8.1 Add Dynamic Metadata
```typescript
// app/rooms/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const room = await getRoomBySlug(params.slug);
  
  return {
    title: `${room.name} - Olivia International Hotel`,
    description: room.shortDescription,
    openGraph: {
      title: room.name,
      description: room.shortDescription,
      images: [room.featuredImage],
    },
  };
}
```

#### 8.2 Create Sitemap
```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { roomTypes } from '@/lib/db/schema';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rooms = await db.select().from(roomTypes);
  
  return [
    { url: 'https://oliviahotel.com', lastModified: new Date() },
    { url: 'https://oliviahotel.com/rooms', lastModified: new Date() },
    ...rooms.map(room => ({
      url: `https://oliviahotel.com/rooms/${room.slug}`,
      lastModified: room.updatedAt,
    })),
  ];
}
```

#### 8.3 Add robots.txt
```typescript
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://oliviahotel.com/sitemap.xml',
  };
}
```

#### 8.4 Add Structured Data
```typescript
// components/structured-data.tsx
export function HotelStructuredData() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: 'Olivia International Hotel',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Alappuzha',
      addressRegion: 'Kerala',
      addressCountry: 'IN',
    },
    priceRange: '₹15,000 - ₹35,000',
    starRating: { '@type': 'Rating', ratingValue: '5' },
  };
  
  return <script type="application/ld+json">{JSON.stringify(data)}</script>;
}
```

---

## 9. Developer Experience

### Current Issues

| Issue | Location | Severity |
|-------|----------|----------|
| No pre-commit hooks | N/A | Medium |
| Missing TypeScript strict checks | Some files | Medium |
| No documentation | [`README.md`](README.md) is default | Medium |
| No storybook for components | N/A | Low |

### Recommended Actions

#### 9.1 Add Pre-commit Hooks
```bash
npm install -D husky lint-staged
npx husky init
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

#### 9.2 Add Prettier
```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

#### 9.3 Update README
```markdown
# Olivia International Hotel Website

A luxury hotel website built with Next.js 16, TypeScript, and Tailwind CSS.

## Features
- Room booking system
- Payment integration (Razorpay)
- Admin panel
- Email notifications

## Getting Started
...

## Environment Variables
...

## Database Setup
...
```

#### 9.4 Add JSDoc Comments
```typescript
/**
 * Calculates the total price for a booking
 * @param params - Booking parameters
 * @param params.basePrice - Base price per night in paise
 * @param params.nights - Number of nights
 * @param params.rooms - Number of rooms
 * @returns Object containing subtotal, tax, and total amounts
 */
export function calculateBookingPrice(params: {...}) {...}
```

---

## 10. Feature Additions

### Missing Features

| Feature | Priority | Complexity |
|---------|----------|------------|
| Complete booking flow | Critical | High |
| User dashboard | High | Medium |
| Room availability calendar | High | Medium |
| Review/testimonial system | Medium | Medium |
| Multi-language support | Medium | High |
| Push notifications | Low | Medium |
| Loyalty program | Low | High |

### Recommended Actions

#### 10.1 Complete Booking Flow
```
/book
  /book/details        # Guest details form
  /book/payment        # Payment page
  /book/confirmation   # Booking confirmation

Components needed:
- BookingSummary component
- PaymentForm component
- BookingConfirmation component
```

#### 10.2 User Dashboard
```
/dashboard
  /dashboard/bookings  # View past/upcoming bookings
  /dashboard/profile   # Edit profile
  /dashboard/settings  # Notification preferences
```

#### 10.3 Room Availability Calendar
```typescript
// components/booking/availability-calendar.tsx
// Visual calendar showing available dates
// Integration with room inventory table
```

#### 10.4 Review System
```typescript
// New tables in schema
export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingId: uuid('booking_id').references(() => bookings.id),
  rating: integer('rating').notNull(),
  title: varchar('title', { length: 255 }),
  comment: text('comment'),
  isVerified: boolean('is_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## 11. Accessibility

### Current Issues

| Issue | Location | Severity |
|-------|----------|----------|
| Missing skip links | N/A | High |
| No focus trap in modals | [`luxury-date-picker.tsx`](components/ui/luxury-date-picker.tsx) | Medium |
| Missing ARIA labels | Multiple components | Medium |
| No keyboard navigation for carousel | [`photo-carousel.tsx`](components/home/photo-carousel.tsx) | Medium |

### Recommended Actions

#### 11.1 Add Skip Links
```typescript
// components/layout/skip-link.tsx
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-white"
    >
      Skip to main content
    </a>
  );
}
```

#### 11.2 Add Focus Trap to Date Picker
```typescript
// Use @radix-ui/react-focus-trap or similar
import { FocusTrap } from '@radix-ui/react-focus-trap';

<FocusTrap>
  <div className="date-picker-content">
    ...
  </div>
</FocusTrap>
```

#### 11.3 Add ARIA Labels
```typescript
// Navigation buttons
<button aria-label="Previous slide" onClick={prevSlide}>
  <ChevronLeft />
</button>

// Form inputs
<input
  aria-label="Email address"
  aria-describedby="email-error"
  aria-invalid={!!errors.email}
/>
```

#### 11.4 Add Keyboard Navigation
```typescript
// photo-carousel.tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') scrollRow('left');
    if (e.key === 'ArrowRight') scrollRow('right');
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

## 12. DevOps & Deployment

### Current Issues

| Issue | Location | Severity |
|-------|----------|----------|
| No CI/CD pipeline | N/A | High |
| No monitoring/logging | N/A | High |
| No backup strategy | N/A | High |
| Missing health check endpoint | N/A | Medium |

### Recommended Actions

#### 12.1 Add Health Check Endpoint
```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return Response.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (error) {
    return Response.json({ status: 'unhealthy' }, { status: 503 });
  }
}
```

#### 12.2 Add Logging
```typescript
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});

// Usage
logger.info({ bookingId: '123' }, 'Booking created');
```

#### 12.3 Add Error Tracking
```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});
```

#### 12.4 Database Backup Strategy
```yaml
# Neon provides automatic backups
# Document restore procedures
# Add backup verification script
```

---

## Implementation Priority

### Phase 1: Critical Security & Core Features
1. Secure upload API route
2. Add admin authentication
3. Create booking API routes
4. Implement payment verification
5. Add environment validation

### Phase 2: Data & Performance
1. Add database migrations
2. Replace mock data with real queries
3. Implement caching
4. Add loading states
5. Create error boundaries

### Phase 3: Quality & Testing
1. Add testing framework
2. Write unit tests
3. Add E2E tests
4. Set up CI/CD
5. Add monitoring

### Phase 4: UX & Features
1. Complete booking flow
2. Add user dashboard
3. Implement availability calendar
4. Add review system
5. Improve accessibility

### Phase 5: Polish & Optimization
1. SEO improvements
2. Performance optimization
3. Add analytics
4. Documentation
5. Multi-language support

---

## Summary Statistics

| Category | Issues Found | Critical | High | Medium | Low |
|----------|-------------|----------|------|--------|-----|
| Architecture | 5 | 0 | 2 | 2 | 1 |
| Security | 5 | 1 | 2 | 2 | 0 |
| Database | 5 | 0 | 1 | 3 | 1 |
| Frontend | 6 | 0 | 1 | 3 | 2 |
| API | 5 | 2 | 2 | 1 | 0 |
| Performance | 5 | 0 | 1 | 3 | 1 |
| Testing | 4 | 2 | 2 | 0 | 0 |
| SEO | 5 | 0 | 2 | 2 | 1 |
| DevEx | 4 | 0 | 0 | 4 | 0 |
| Features | 7 | 1 | 2 | 2 | 2 |
| Accessibility | 4 | 0 | 1 | 3 | 0 |
| DevOps | 4 | 0 | 2 | 1 | 1 |
| **Total** | **59** | **6** | **18** | **26** | **9** |

---

## Next Steps

1. Review this plan with stakeholders
2. Prioritize issues based on business needs
3. Create GitHub issues for each task
4. Set up project board for tracking
5. Begin Phase 1 implementation

---

*Document generated: February 2026*
*Project: Olivia International Hotel Website*
*Framework: Next.js 16.1.6*
