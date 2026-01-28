# Delivery System Documentation

## Overview
The SelfDrop backend now supports **Delivery-only** order types with flat delivery charges and simplified Cash on Delivery (COD) payments.

---

## Features

### 1. **Order Types**
- **DELIVERY**: Vendor delivers to customer's location (Default)

### 2. **Delivery Calculations**
- **Distance**: Calculated using Haversine formula (in kilometers)
- **Delivery Charge**: Flat रु 40 NPR
- **Estimated Time**: Based on average speed (25 km/h) + preparation time (15 min)
- **Delivery Radius**: Maximum 15km (or area-specific limit like Bhaktapur: 7km)

### 3. **Payment Methods**
- **COD (Cash on Delivery)**: Pay upon delivery ✨ EXCLUSIVE

### 4. **Order Status Flow**
```
CREATED → CONFIRMED → OUT_FOR_DELIVERY → DELIVERED → COMPLETED
```

---

## API Endpoints

### 1. **Create Order**
**POST** `/api/orders`

**Request Body:**
```json
{
  "items": [
    { "product": "product_id", "quantity": 2 }
  ],
  "deliveryLocation": {
    "address": "Thamel, Kathmandu",
    "lat": 27.7154,
    "lng": 85.3123,
    "area": "area_id_from_api"
  }
}
```

### 2. **Order History**
**GET** `/api/orders/my`
Returns a list of the user's past orders with populated product details.

### 3. **Cash on Delivery (COD)**
**POST** `/api/payment/cod/:orderId`

### 4. **Confirm COD Payment** (Admin Only)
**POST** `/api/payment/cod/:orderId/confirm`

---

## Pricing
- **Delivery Charge**: रु 40 (Flat)
- **Free Delivery**: For orders over रु 2,000

---

## Summary
✅ **Flat Delivery**: Constant रु 40 fee for all deliveries
✅ **COD-Only**: Removed digital payment complexities
✅ **Order History**: Detailed view of past orders
✅ **Area Limits**: Integration with serviceable zones (e.g., Bhaktapur 7km limit)
