const router = require('express').Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');
const mailer = require('../config/mailer');
const User = require('../models/User');
const Area = require('../models/Area');

// Place order
const mongoose = require('mongoose');

// Place order
router.post('/', auth(['user']), async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { items, deliveryLocation } = req.body;

        if (!deliveryLocation?.address) {
            await session.abortTransaction();
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
        const calculateDeliveryCharge = () => {
            return 40; // Flat delivery charge 40 NPR
        };

        // Helper function to estimate delivery time
        const estimateDeliveryTime = (distance) => {
            const avgSpeed = 25; // Average speed in km/h in Kathmandu
            const prepTime = 15; // Preparation time in minutes
            const travelTime = (distance / avgSpeed) * 60; // Convert to minutes
            return Math.round(prepTime + travelTime);
        };

        // 1. Get Admin for Location Reference (Read outside transaction usually okay, but inside ensures consistency if admin changes)
        const mainAdmin = await User.findOne({ role: 'admin' }).session(session);
        if (!mainAdmin) {
            await session.abortTransaction();
            return res.status(500).json({ message: "System Admin hub not found" });
        }

        // 2. Validate items and stock & Deduct Stock
        const validatedItems = [];

        for (const item of items) {
            // Lock the product document
            const product = await Product.findById(item.product).session(session);

            if (!product || !product.approved) {
                await session.abortTransaction();
                return res.status(400).json({ message: `Invalid product: ${item.product}` });
            }

            if (product.stock < item.quantity) {
                await session.abortTransaction();
                return res.status(400).json({ message: `Out of stock: ${product.name}. Available: ${product.stock}` });
            }

            // Deduct stock
            product.stock -= item.quantity;
            await product.save({ session });

            validatedItems.push({
                product: product._id,
                name: product.name,
                quantity: item.quantity,
                price: product.price
            });
        }

        // 3. Calculate totals and delivery
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

        // 3.5 Check Area specific limit
        let maxDistance = 15; // default
        if (deliveryLocation?.area) {
            const area = await Area.findById(deliveryLocation.area).session(session);
            if (area) maxDistance = area.maxDistanceKm;
        }

        if (distance > maxDistance) {
            await session.abortTransaction();
            return res.status(400).json({ message: `Delivery exceeded maximum distance of ${maxDistance}km for this area.` });
        }

        const total = subtotal + (subtotal >= 2000 ? 0 : deliveryCharge);

        // 4. Create Order
        const order = await Order.create([{
            user: req.user.id,
            items: validatedItems.map(i => ({ product: i.product, quantity: i.quantity, price: i.price })),
            total,
            orderType: 'DELIVERY',
            deliveryLocation,
            deliveryCharge: subtotal >= 2000 ? 0 : deliveryCharge,
            estimatedDeliveryTime
        }], { session });

        await session.commitTransaction();

        // 5. Post-Transaction Notification (Non-blocking)
        try {
            const customer = await User.findById(req.user.id);
            if (customer && customer.email) {
                await notificationService.notify({
                    to: customer.email,
                    userId: customer._id,
                    subject: `Order Confirmed! 🍷`,
                    message: `Hello ${customer.name},\n\nYour order has been placed successfully!\n\nDelivery Charge: रु ${subtotal >= 2000 ? 0 : deliveryCharge}\nTotal: रु ${total}\n\nThe hunt is on. You will receive updates as we move your inventory.\n\nThank you for choosing Daru Hunting!`,
                    event: 'order:confirmed',
                    data: order[0]
                });
            }

            await notificationService.notifyAdmin(
                `New Order Received! 🚀`,
                `A new delivery order (#${order[0]._id.toString().slice(-6)}) has been placed.\nTotal Value: ${total} NPR`
            );
        } catch (emailError) {
            console.error('Notification failed but order placed:', emailError);
            // Don't fail the request, order is already committed
        }

        res.json(order[0]);

    } catch (error) {
        await session.abortTransaction();
        console.error('Order Transaction Error:', error);
        res.status(500).json({ message: error.message });
    } finally {
        session.endSession();
    }
});

// Get user orders
router.get('/my', auth(['user']), async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id })
            .populate({
                path: 'items.product',
                select: 'name price image'
            })
            .sort('-createdAt');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
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
    const { vendorId, deliveryLocation, subtotal = 0 } = req.body;

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

    const calculateDeliveryCharge = () => {
        return 40;
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

        let maxDistance = 15;
        if (deliveryLocation?.area) {
            const area = await Area.findById(deliveryLocation.area);
            if (area) maxDistance = area.maxDistanceKm;
        }

        res.json({
            vendorId,
            vendorName: vendor.shopName || vendor.name,
            deliveryCharge: subtotal >= 2000 ? 0 : Math.round(calculateDeliveryCharge()),
            estimatedDeliveryTime: estimatedTime,
            canDeliver: distance <= maxDistance,
            maxDistance
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
