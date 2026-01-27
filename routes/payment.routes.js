const router = require('express').Router();
const Stripe = require('stripe');
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');
const axios = require('axios');

const stripe = Stripe(process.env.STRIPE_SECRET);

router.post('/stripe/:orderId', auth(['user']), async (req, res) => {
    const order = await Order.findById(req.params.orderId).populate('items.product');
    if (!order) return res.status(404).json({ message: "Order not found" });

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: order.items.map(i => ({
            price_data: {
                currency: 'usd',
                product_data: { name: i.product.name },
                unit_amount: i.price * 100
            },
            quantity: i.quantity
        })),
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/success`,
        cancel_url: `${process.env.FRONTEND_URL}/cancel`
    });

    order.payment = { method: 'STRIPE', status: 'PENDING', reference: session.id };
    await order.save();

    res.json({ url: session.url });
});

router.post('/khalti/:orderId', auth(['user']), async (req, res) => {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    try {
        const response = await axios.post('https://khalti.com/api/v2/epayment/initiate/', {
            return_url: process.env.FRONTEND_URL + '/success',
            website_url: process.env.FRONTEND_URL,
            amount: order.total * 100, // Khalti expects paisa
            purchase_order_id: order.id,
            purchase_order_name: 'Daru Hunting Order'
        }, {
            headers: { Authorization: `Key ${process.env.KHALTI_SECRET}` }
        });

        order.payment = { method: 'KHALTI', status: 'PENDING', reference: response.data.pidx };
        await order.save();

        res.json(response.data);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

router.post('/esewa/:orderId', auth(['user']), async (req, res) => {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const ref = `ES${Date.now()}`;
    order.payment = { method: 'ESEWA', status: 'PENDING', reference: ref };
    await order.save();

    res.json({
        amount: order.total,
        productId: order.id,
        ref
    });
});

// Verify Payment and Notify
router.post('/verify/:orderId', auth(['user', 'vendor', 'admin']), async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId).populate('user vendor');
        if (!order) return res.status(404).json({ message: "Order not found" });

        // Update status to PAID
        order.payment.status = 'PAID';
        await order.save();

        // Notify User
        await notificationService.notify({
            to: order.user.email,
            userId: order.user._id,
            subject: 'Payment Successful! ✅',
            message: `Hello ${order.user.name},\n\nYour payment of ${order.total} NPR for Order #${order._id.toString().slice(-6).toUpperCase()} was successful!\n\nThe vendor (${order.vendor.shopName}) has been notified to prepare your items.`,
            event: 'payment:success',
            data: order
        });

        // Notify Vendor
        await notificationService.notify({
            to: order.vendor.email,
            userId: order.vendor._id,
            subject: 'Payment Received for Order! 💰',
            message: `Hello ${order.vendor.shopName},\n\nPayment has been confirmed for Order #${order._id.toString().slice(-6).toUpperCase()}.\n\nYou can now proceed with fulfillment.`,
            event: 'payment:received',
            data: order
        });

        res.json({ message: 'Payment verified and notifications sent', order });
    } catch (err) {
        res.status(500).json({ message: 'Verification failed', error: err.message });
    }
});

// Cash on Delivery (COD)
router.post('/cod/:orderId', auth(['user']), async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });

        // Set payment method to COD
        order.payment = {
            method: 'COD',
            status: 'PENDING',
            reference: `COD${Date.now()}`
        };
        await order.save();

        res.json({
            message: 'Cash on Delivery selected',
            order,
            note: 'Please pay the total amount upon delivery/pickup'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mark COD as paid (admin only)
router.post('/cod/:orderId/confirm', auth(['admin']), async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId).populate('user vendor');
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (order.payment.method !== 'COD') {
            return res.status(400).json({ message: "This is not a COD order" });
        }

        order.payment.status = 'PAID';
        await order.save();

        // Notify User
        const notificationService = require('../services/notification.service');
        await notificationService.notify({
            to: order.user.email,
            userId: order.user._id,
            subject: 'Payment Confirmed! ✅',
            message: `Hello ${order.user.name},\n\nYour cash payment of ${order.total} NPR has been confirmed.\n\nThank you for your order!`,
            event: 'payment:cod_confirmed',
            data: order
        });

        res.json({ message: 'COD payment confirmed', order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
