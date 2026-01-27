# Self-Drop E-Commerce Backend

Production-ready Node.js backend for Self-Drop E-Commerce platform with **full delivery system support** and **admin-only management**.

## Features

- **Authentication**: Google OAuth + JWT.
- **Roles**: User and Admin (vendor role inactive).
- **Products**: Admin-managed product catalog with ImageKit optimization.
- **Orders**: 
  - ✨ **Pickup & Delivery Support**
  - ✨ **Automatic delivery charge calculation**
  - ✨ **Distance & time estimation**
  - Location tracking (Leaflet/OSM compatible)
  - **Admin-only order management**
- **Payments**: 
  - Stripe, Khalti, eSewa integration
  - ✨ **Cash on Delivery (COD)**
  - **Admin confirms COD payments**
- **Real-time**: Socket.IO for live order/review updates.
- **Admin Panel API**: Analytics, Moderation, Approvals, Full Control.

## 🎯 Admin-Only System

This system is designed for **centralized admin control**:

✅ **Admins manage:**
- Product catalog (create, update, approve)
- Order processing and fulfillment
- Delivery coordination
- Payment confirmation (especially COD)
- Customer support

✅ **Users can:**
- Browse products
- Place pickup or delivery orders
- Select payment methods
- Track their orders

❌ **Vendors:**
- Vendor role exists in database but has no functional access
- All vendor operations are admin-controlled

## 🚀 Delivery System

### Order Types
- **PICKUP**: Customer picks up from designated location
- **DELIVERY**: Admin delivers to customer's address

### Automatic Calculations
- **Delivery Charge**: 50 NPR base + 20 NPR/km
- **Distance**: Haversine formula (accurate to 2 decimal places)
- **Estimated Time**: Based on 25 km/h avg speed + 15 min prep time
- **Delivery Radius**: Up to 15 km

### Payment Options
- **STRIPE** - Online card payment
- **KHALTI** - Nepal digital wallet
- **ESEWA** - Nepal digital wallet
- **COD** - Cash on Delivery (Admin confirms)

## Quick Start

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Configure Environment**
    Copy `.env.example` to `.env` and fill in the values.
    ```bash
    cp .env.example .env
    ```

3.  **Seed Database**
    Populates the DB with Admin and Demo Products.
    ```bash
    npm run seed
    ```

4.  **Start Server**
    ```bash
    npm run dev
    ```

5.  **Admin Login**
    ```
    Email: admin@selfdrop.com
    Password: admin123
    ```

## API Documentation

- **[ADMIN_ONLY_SYSTEM.md](docs/ADMIN_ONLY_SYSTEM.md)** - Admin-only system documentation
- **[DELIVERY_SYSTEM.md](docs/DELIVERY_SYSTEM.md)** - Complete delivery system documentation
- **[DELIVERY_IMPLEMENTATION_SUMMARY.md](docs/DELIVERY_IMPLEMENTATION_SUMMARY.md)** - Implementation summary
- **[EXTENDED_DOCS.md](docs/EXTENDED_DOCS.md)** - Detailed API endpoints

## Key Endpoints

### Admin Operations
```bash
# Create product (Admin only)
POST /api/products
Authorization: Bearer ADMIN_TOKEN

# Update order status (Admin only)
PUT /api/orders/:id/status

# Confirm COD payment (Admin only)
POST /api/payment/cod/:orderId/confirm
```

### User Operations
```bash
# Calculate delivery estimate
POST /api/orders/delivery-estimate

# Create delivery order
POST /api/orders
{
  "orderType": "DELIVERY",
  "deliveryLocation": { "address": "...", "lat": 27.7154, "lng": 85.3123 }
}

# Select Cash on Delivery
POST /api/payment/cod/:orderId
```

## Order Status Flow

**Pickup Orders:**
```
CREATED → CONFIRMED → READY_FOR_PICKUP → COMPLETED
```

**Delivery Orders:**
```
CREATED → CONFIRMED → OUT_FOR_DELIVERY → DELIVERED → COMPLETED
```

## Admin Capabilities

✅ Full product catalog management  
✅ Order processing and fulfillment  
✅ Delivery coordination  
✅ COD payment confirmation  
✅ Analytics and reporting  
✅ User management  

## Tech Stack

- **Runtime**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + Google OAuth
- **Payments**: Stripe, Khalti, eSewa, COD
- **Image Optimization**: ImageKit
- **Real-time**: Socket.IO
- **Email**: Nodemailer

---

**Built with ❤️ for Nepal's e-commerce ecosystem** 🇳🇵
