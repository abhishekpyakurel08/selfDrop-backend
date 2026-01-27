# Delivery System Documentation

## Overview
The SelfDrop backend now supports both **Pickup** and **Delivery** order types with automatic calculation of delivery charges, distance, and estimated delivery time.

---

## Features Added

### 1. **Order Types**
- **PICKUP**: Customer picks up from a designated location
- **DELIVERY**: Vendor delivers to customer's location

### 2. **Delivery Calculations**
- **Distance**: Calculated using Haversine formula (in kilometers)
- **Delivery Charge**: Base charge (50 NPR) + Distance-based charge (20 NPR/km)
- **Estimated Time**: Based on average speed (25 km/h) + preparation time (15 min)
- **Delivery Radius**: Maximum 15km from vendor location

### 3. **Payment Methods**
- **STRIPE**: Online card payment
- **KHALTI**: Nepal digital wallet
- **ESEWA**: Nepal digital wallet
- **COD (Cash on Delivery)**: Pay upon delivery/pickup ✨ NEW

### 4. **Order Status Flow**

#### Pickup Orders:
```
CREATED → CONFIRMED → READY_FOR_PICKUP → COMPLETED
```

#### Delivery Orders:
```
CREATED → CONFIRMED → OUT_FOR_DELIVERY → DELIVERED → COMPLETED
```

---

## API Endpoints

### 1. **Create Order** (Updated)
**POST** `/api/orders`

**Request Body:**
```json
{
  "items": [
    {
      "product": "product_id",
      "quantity": 2
    }
  ],
  "orderType": "DELIVERY",  // or "PICKUP"
  "deliveryLocation": {      // Required for DELIVERY
    "address": "Thamel, Kathmandu",
    "lat": 27.7154,
    "lng": 85.3123,
    "note": "Near Kathmandu Guest House"
  },
  "pickupLocation": {        // Required for PICKUP
    "name": "Thamel Hub",
    "address": "Thamel Marg, Kathmandu",
    "lat": 27.7154,
    "lng": 85.3123
  }
}
```

**Response:**
```json
[
  {
    "_id": "order_id",
    "user": "user_id",
    "vendor": "vendor_id",
    "items": [...],
    "total": 2920,
    "orderType": "DELIVERY",
    "deliveryLocation": {...},
    "deliveryCharge": 120,
    "distance": 3.5,
    "estimatedDeliveryTime": 23,
    "status": "CREATED",
    "payment": {
      "method": null,
      "status": "PENDING"
    }
  }
]
```

---

### 2. **Calculate Delivery Estimate** ✨ NEW
**POST** `/api/orders/delivery-estimate`

**Request Body:**
```json
{
  "vendorId": "vendor_id",
  "deliveryLocation": {
    "lat": 27.7154,
    "lng": 85.3123
  }
}
```

**Response:**
```json
{
  "vendorId": "vendor_id",
  "vendorName": "Thamel Spirits & Wine",
  "distance": 3.5,
  "deliveryCharge": 120,
  "estimatedDeliveryTime": 23,
  "canDeliver": true
}
```

---

### 3. **Cash on Delivery (COD)** ✨ NEW
**POST** `/api/payment/cod/:orderId`

**Response:**
```json
{
  "message": "Cash on Delivery selected",
  "order": {...},
  "note": "Please pay the total amount upon delivery/pickup"
}
```

---

### 4. **Confirm COD Payment** (Vendor/Admin Only) ✨ NEW
**POST** `/api/payment/cod/:orderId/confirm`

**Response:**
```json
{
  "message": "COD payment confirmed",
  "order": {...}
}
```

---

## Database Schema Updates

### Order Model
```javascript
{
  // Existing fields...
  orderType: { type: String, enum: ['PICKUP', 'DELIVERY'], default: 'PICKUP' },
  
  // Pickup location (for self-pickup)
  pickupLocation: {
    address: String,
    lat: Number,
    lng: Number,
    note: String
  },
  
  // Delivery details (for home delivery)
  deliveryLocation: {
    address: String,
    lat: Number,
    lng: Number,
    note: String
  },
  deliveryCharge: { type: Number, default: 0 },
  distance: { type: Number, default: 0 }, // in kilometers
  estimatedDeliveryTime: { type: Number, default: 0 }, // in minutes
  
  status: {
    type: String,
    enum: ['CREATED', 'CONFIRMED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED'],
    default: 'CREATED'
  },
  
  payment: {
    method: { type: String, enum: ['STRIPE', 'KHALTI', 'ESEWA', 'COD'] },
    status: { type: String, enum: ['PENDING', 'PAID', 'FAILED'], default: 'PENDING' },
    reference: String
  }
}
```

---

## Pricing Formula

### Delivery Charge Calculation
```
Base Charge: 50 NPR
Per KM Charge: 20 NPR/km

Total Delivery Charge = 50 + (distance × 20)

Examples:
- 1 km  → 50 + 20 = 70 NPR
- 3 km  → 50 + 60 = 110 NPR
- 5 km  → 50 + 100 = 150 NPR
- 10 km → 50 + 200 = 250 NPR
```

### Estimated Delivery Time
```
Average Speed: 25 km/h
Preparation Time: 15 minutes

Estimated Time = 15 + (distance / 25 × 60)

Examples:
- 1 km  → 15 + 2.4 = 17 minutes
- 3 km  → 15 + 7.2 = 22 minutes
- 5 km  → 15 + 12 = 27 minutes
- 10 km → 15 + 24 = 39 minutes
```

---

## Vendor Capabilities

Vendors can now:
✅ Accept both pickup and delivery orders
✅ See delivery distance and estimated time
✅ Receive delivery address in notifications
✅ Update order status including delivery statuses
✅ Confirm COD payments upon delivery
✅ Manage all products (not just their own)

---

## Email Notifications

### For Delivery Orders:
**Vendor receives:**
```
Subject: New Delivery Order Received! 📦

Hello Thamel Spirits & Wine,

You have received a new delivery order!

Order ID: 507f1f77bcf86cd799439011
Subtotal: 2800 NPR
Delivery Charge: 120 NPR
Total: 2920 NPR

Items:
Old Durbar Black Chimney x 1
Sula Vineyards Red x 2

Delivery Address: Thamel, Kathmandu
Distance: 3.50 km
Delivery Charge: 120 NPR
Estimated Time: 23 minutes

Please prepare the items for delivery.
```

**Customer receives:**
```
Subject: Order Confirmed! 🍷

Hello Customer,

Your delivery order has been placed successfully!

Delivery Charge: 120 NPR
Total: 2920 NPR
Vendors involved: 1

You will receive updates as the vendors prepare your items.

Thank you for using SelfDrop!
```

---

## Testing

### Test Delivery Order
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"product": "PRODUCT_ID", "quantity": 2}],
    "orderType": "DELIVERY",
    "deliveryLocation": {
      "address": "Thamel, Kathmandu",
      "lat": 27.7154,
      "lng": 85.3123
    }
  }'
```

### Test Delivery Estimate
```bash
curl -X POST http://localhost:5000/api/orders/delivery-estimate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "VENDOR_ID",
    "deliveryLocation": {
      "lat": 27.7154,
      "lng": 85.3123
    }
  }'
```

### Test COD Payment
```bash
curl -X POST http://localhost:5000/api/payment/cod/ORDER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Configuration

You can adjust these values in `/routes/order.routes.js`:

```javascript
// Delivery charge calculation
const baseCharge = 50;        // Base delivery charge in NPR
const perKmCharge = 20;       // Charge per km in NPR

// Delivery time estimation
const avgSpeed = 25;          // Average speed in km/h
const prepTime = 15;          // Preparation time in minutes

// Delivery radius (in delivery-estimate endpoint)
canDeliver: distance <= 15    // Max 15km delivery radius
```

---

## Summary

✅ **Delivery Support**: Full delivery system with automatic calculations
✅ **COD Payment**: Cash on Delivery option for users without online payment
✅ **Distance & Time**: Real-time calculation based on vendor and customer location
✅ **Flexible Pricing**: Configurable base charge and per-km rates
✅ **Vendor Control**: Vendors can manage deliveries and confirm payments
✅ **Smart Notifications**: Different messages for pickup vs delivery orders

The system is now production-ready for both pickup and delivery operations! 🚀
