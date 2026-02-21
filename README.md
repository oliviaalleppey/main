# Olivia International: Direct Booking Engine

![System Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![Next.js](https://img.shields.io/badge/Next.js-15.1-black)
![Database](https://img.shields.io/badge/PostgreSQL-Neon-blue)

**A high-performance, commission-free OTA built exclusively for Olivia International.**

This system integrates directly with **AxisRooms** to sync inventory and rates in real-time, allowing the hotel to capture direct bookings with 0% commission while maintaining automated GST compliance.

---

## 🏗️ System Architecture

The application acts as a "Headless OTA", meaning it uses AxisRooms as the backend for Inventory/Pricing but manages the Guest Experience and Payments independently.

```mermaid
graph TD
    User[Guest] -->|1. Search Dates| Web[Website (Next.js)]
    Web -->|2. Check Live Inventory| Axis[AxisRooms Channel Manager]
    Axis -->|3. Return Dynamic Rates| Web
    User -->|4. Book & Pay| Razorpay[Razorpay Gateway]
    Razorpay -->|5. Webhook Success| Web
    Web -->|6. Create Invoice| DB[(PostgreSQL Database)]
    Web -->|7. PUSH Booking| Axis
    Axis -->|8. Block Inventory (OTA Sync)| OTAs[Booking.com / Agoda]
```

---

## 🔐 Key Features & Modules

### 1. The Booking State Machine (`lib/services/booking-state-machine.ts`)
To prevent "ghost bookings" or creating bookings without payment, the system enforces a strict lifecycle:
-   **`INITIATED`**: Guest enters details.
-   **`PENDING_PAYMENT`**: Inventory is **Locked** for 10 minutes.
-   **`PAYMENT_SUCCESS`**: Razorpay confirms receipt of funds.
-   **`CONFIRMED`**: PNR generated, Invoice created, AxisRooms synced.

### 2. Financial & Tax Engine (`app/book/invoice/`)
Automated GST compliance logic is built-in:
-   **< ₹7,500**: Charges 12% GST (6% CGST + 6% SGST).
-   **≥ ₹7,500**: Charges 18% GST (9% CGST + 9% SGST).
-   **Reverse Calculation**: The system treats AxisRooms rates as "Tax Inclusive" and automatically calculates the base rate for the invoice.

### 3. Inventory Locking (`lib/db/schema.ts` -> `inventory_locks`)
Prevents double-booking. When a guest clicks "Pay", a temporary lock is placed on the specific Room ID. If another guest tries to book the same room, they are blocked until the lock expires or the payment fails.

---

## 🚀 Setup & Configuration

To run this system in production, ensure the following `.env` variables are active:

### 1. AxisRooms Credentials (CRITICAL)
Without these, the system cannot sync.
```bash
AXISROOMS_API_KEY="Get from AxisRooms Support"
AXISROOMS_HOTEL_ID="Integer ID (e.g., 1024)"
AXISROOMS_ACCESS_KEY="Secret Key"
AXISROOMS_CHANNEL_ID="internal_website" (Default)
```

### 2. Payment Gateway
```bash
RAZORPAY_KEY_ID="rzp_live_..."
RAZORPAY_KEY_SECRET="secret..."
RAZORPAY_WEBHOOK_SECRET="secret..."
```

### 3. Database
```bash
DATABASE_URL="postgresql://..."
```

---

## 📖 Operational Playbook

### How to Verify a Booking
1.  Go to `/admin` dashboard.
2.  Check **"Booking Status"**. It must be `CONFIRMED`.
3.  Click **"View Invoice"** to see the tax breakdown.

### What if a Payment Fails?
1.  The system automatically releases the **Inventory Lock** after 10 minutes.
2.  The Booking Status will remain `PENDING_PAYMENT` or `FAILED`.
3.  **Action**: No action needed. The room allows new bookings automatically.

### How to Refund?
1.  Go to Razorpay Dashboard directly.
2.  Find the Transaction ID.
3.  Issue Refund.
4.  (Optional) Cancel booking in AxisRooms manually if it was already pushed.

---

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run Database Studio
npm run db:studio
```
