#!/bin/bash

# SelfDrop Delivery System - Test Script
# This script demonstrates the new delivery features

echo "🚀 SelfDrop Delivery System Test Script"
echo "========================================"
echo ""

# Configuration
BASE_URL="http://localhost:5000/api"
TOKEN="YOUR_AUTH_TOKEN_HERE"

echo "📝 Prerequisites:"
echo "1. Server should be running (npm run dev)"
echo "2. Update TOKEN variable with your auth token"
echo "3. Update VENDOR_ID and PRODUCT_ID with actual IDs"
echo ""

# Test 1: Calculate Delivery Estimate
echo "Test 1: Calculate Delivery Estimate"
echo "------------------------------------"
echo "POST $BASE_URL/orders/delivery-estimate"
echo ""
curl -X POST "$BASE_URL/orders/delivery-estimate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "VENDOR_ID_HERE",
    "deliveryLocation": {
      "lat": 27.7154,
      "lng": 85.3123
    }
  }' | jq '.'
echo ""
echo ""

# Test 2: Create Delivery Order
echo "Test 2: Create Delivery Order"
echo "------------------------------"
echo "POST $BASE_URL/orders"
echo ""
curl -X POST "$BASE_URL/orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "product": "PRODUCT_ID_HERE",
        "quantity": 2
      }
    ],
    "orderType": "DELIVERY",
    "deliveryLocation": {
      "address": "Thamel, Kathmandu",
      "lat": 27.7154,
      "lng": 85.3123,
      "note": "Near Kathmandu Guest House"
    }
  }' | jq '.'
echo ""
echo ""

# Test 3: Create Pickup Order
echo "Test 3: Create Pickup Order"
echo "---------------------------"
echo "POST $BASE_URL/orders"
echo ""
curl -X POST "$BASE_URL/orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "product": "PRODUCT_ID_HERE",
        "quantity": 1
      }
    ],
    "orderType": "PICKUP",
    "pickupLocation": {
      "name": "Thamel Hub",
      "address": "Thamel Marg, Kathmandu",
      "lat": 27.7154,
      "lng": 85.3123
    }
  }' | jq '.'
echo ""
echo ""

# Test 4: Select Cash on Delivery
echo "Test 4: Select Cash on Delivery (COD)"
echo "--------------------------------------"
echo "POST $BASE_URL/payment/cod/ORDER_ID"
echo ""
echo "Replace ORDER_ID with actual order ID from previous test"
echo ""
# curl -X POST "$BASE_URL/payment/cod/ORDER_ID_HERE" \
#   -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""
echo ""

# Test 5: Confirm COD Payment (Vendor/Admin)
echo "Test 5: Confirm COD Payment (Vendor/Admin)"
echo "-------------------------------------------"
echo "POST $BASE_URL/payment/cod/ORDER_ID/confirm"
echo ""
echo "Replace ORDER_ID with actual order ID"
echo ""
# curl -X POST "$BASE_URL/payment/cod/ORDER_ID_HERE/confirm" \
#   -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""
echo ""

# Test 6: Update Order Status
echo "Test 6: Update Order Status"
echo "---------------------------"
echo "PUT $BASE_URL/orders/ORDER_ID/status"
echo ""
echo "Available statuses:"
echo "  - CREATED"
echo "  - CONFIRMED"
echo "  - READY_FOR_PICKUP (for pickup orders)"
echo "  - OUT_FOR_DELIVERY (for delivery orders)"
echo "  - DELIVERED (for delivery orders)"
echo "  - COMPLETED"
echo "  - CANCELLED"
echo ""
# curl -X PUT "$BASE_URL/orders/ORDER_ID_HERE/status" \
#   -H "Authorization: Bearer $TOKEN" \
#   -H "Content-Type: application/json" \
#   -d '{"status": "OUT_FOR_DELIVERY"}' | jq '.'
echo ""
echo ""

echo "✅ Test script completed!"
echo ""
echo "📚 For more information, see:"
echo "   - docs/DELIVERY_SYSTEM.md"
echo "   - docs/DELIVERY_IMPLEMENTATION_SUMMARY.md"
echo ""
