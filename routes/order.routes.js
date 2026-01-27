const router = require('express').Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');
const mailer = require('../config/mailer');
const User = require('../models/User');

// Place order
router.post('/', auth(['user']), async (req, res) => {
    const { items, deliveryLocation } = req.body;

    if (!deliveryLocation?.address) {
        return res.status(400).json({ message: "Delivery location required" });
    }

    // Helper function to calculate distance using Haversine formula
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    };

    // Helper function to calculate delivery charge
    const calculateDeliveryCharge = (distance) => {
        const baseCharge = 50; // Base delivery charge in NPR
        const perKmCharge = 20; // Charge per km in NPR
        return baseCharge + (distance * perKmCharge);
    };

    // Helper function to estimate delivery time
    const estimateDeliveryTime = (distance) => {
        const avgSpeed = 25; // Average speed in km/h in Kathmandu
        const prepTime = 15; // Preparation time in minutes
        const travelTime = (distance / avgSpeed) * 60; // Convert to minutes
        return Math.round(prepTime + travelTime);
    };

    // 1. Validate items and stock
    const validatedItems = [];
    const mainAdmin = await User.findOne({ role: 'admin' });
    if (!mainAdmin) return res.status(500).json({ message: "System Admin hub not found" });

    for (const item of items) {
        const product = await Product.findById(item.product);
        if (!product || !product.approved) return res.status(400).json({ message: `Invalid product: ${item.product}` });
        if (product.stock < item.quantity) return res.status(400).json({ message: `Out of stock: ${product.name}` });

        // Deduct stock
        product.stock -= item.quantity;
        await product.save();

        validatedItems.push({
            product: product._id,
            name: product.name,
            quantity: item.quantity,
            price: product.price
        });
    }

    // 2. Calculate totals and delivery
    const subtotal = validatedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    let deliveryCharge = 0;
    let distance = 0;
    let estimatedDeliveryTime = 0;

    if (deliveryLocation?.lat && deliveryLocation?.lng && mainAdmin.defaultLocation?.lat) {
        distance = calculateDistance(
            mainAdmin.defaultLocation.lat,
            mainAdmin.defaultLocation.lng,
            deliveryLocation.lat,
            deliveryLocation.lng
        );
        deliveryCharge = calculateDeliveryCharge(distance);
        estimatedDeliveryTime = estimateDeliveryTime(distance);
    }

    const total = subtotal + (subtotal >= 2000 ? 0 : deliveryCharge);

    // 3. Create Order
    const order = await Order.create({
        user: req.user.id,
        items: validatedItems.map(i => ({ product: i.product, quantity: i.quantity, price: i.price })),
        total,
        orderType: 'DELIVERY',
        deliveryLocation,
        deliveryCharge: subtotal >= 2000 ? 0 : deliveryCharge,
        distance: Math.round(distance * 100) / 100,
        estimatedDeliveryTime
    });

    const customer = await User.findById(req.user.id);

    // 4. Notifications
    // Notify Customer
    if (customer && customer.email) {
        await notificationService.notify({
            to: customer.email,
            userId: customer._id,
            subject: `Order Confirmed! 🍷`,
            message: `Hello ${customer.name},\n\nYour order has been placed successfully!\n\nDelivery Charge: रु ${subtotal >= 2000 ? 0 : deliveryCharge}\nTotal: रु ${total}\n\nThe hunt is on. You will receive updates as we move your inventory.\n\nThank you for choosing Daru Hunting!`,
            event: 'order:confirmed',
            data: order
        });
    }

    // Notify Admin
    await notificationService.notifyAdmin(
        `New Order Received! 🚀`,
        `A new delivery order (#${order._id.toString().slice(-6)}) has been placed.\nTotal Value: ${total} NPR`
    );

    res.json(order);
});

// Get user orders
router.get('/my', auth(['user']), async (req, res) => {
    res.json(await Order.find({ user: req.user.id }).populate('items.product').sort('-createdAt'));
});

const notificationService = require('../services/notification.service');

// Update status (Admin only)
router.put('/:id/status', auth(['admin']), async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user');
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = req.body.status;
    await order.save();

    // Notify User about progress
    if (order.user) {
        await notificationService.notifyOrderUpdate(order.user, order, req.body.status);
    }

    res.json(order);
});

// Calculate delivery estimate
router.post('/delivery-estimate', auth(['user']), async (req, res) => {
    const { vendorId, deliveryLocation } = req.body;

    if (!deliveryLocation?.lat || !deliveryLocation?.lng) {
        return res.status(400).json({ message: "Delivery location with coordinates required" });
    }

    // Helper functions
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const calculateDeliveryCharge = (distance) => {
        const baseCharge = 50;
        const perKmCharge = 20;
        return baseCharge + (distance * perKmCharge);
    };

    const estimateDeliveryTime = (distance) => {
        const avgSpeed = 25;
        const prepTime = 15;
        const travelTime = (distance / avgSpeed) * 60;
        return Math.round(prepTime + travelTime);
    };

    try {
        const vendor = await User.findById(vendorId);
        if (!vendor || !vendor.defaultLocation?.lat) {
            return res.status(404).json({ message: "Vendor location not available" });
        }

        const distance = calculateDistance(
            vendor.defaultLocation.lat,
            vendor.defaultLocation.lng,
            deliveryLocation.lat,
            deliveryLocation.lng
        );

        const estimatedTime = estimateDeliveryTime(distance);

        // Final charge based on threshold (this is an estimate, frontend should also know about this)
        const finalDeliveryCharge = 0; // We will handle this logic based on subtotal in frontend/checkout
        // Actually, let's just return the potential charge and let frontend decide based on cart

        res.json({
            vendorId,
            vendorName: vendor.shopName || vendor.name,
            distance: Math.round(distance * 100) / 100,
            deliveryCharge: Math.round(calculateDeliveryCharge(distance)), // Re-added calculation for deliveryCharge
            estimatedDeliveryTime: estimatedTime,
            canDeliver: distance <= 15
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
