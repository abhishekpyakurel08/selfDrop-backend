const router = require('express').Router();
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');
const notificationService = require('../services/notification.service');

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
            note: 'Please pay the total amount upon delivery'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mark COD as paid (admin only)
router.post('/cod/:orderId/confirm', auth(['admin']), async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId).populate('user');
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (order.payment.method !== 'COD') {
            return res.status(400).json({ message: "This is not a COD order" });
        }

        order.payment.status = 'PAID';
        order.status = 'COMPLETED'; // Mark order as finished after cash is received
        await order.save();

        // Notify User
        if (order.user && order.user.email) {
            // Send payment confirmation
            await notificationService.notify({
                to: order.user.email,
                userId: order.user._id,
                subject: 'Payment Confirmed! ✅',
                message: `Hello ${order.user.name},\n\nYour cash payment of रु ${order.total} has been confirmed.\n\nThank you for your order!`,
                event: 'payment:cod_confirmed',
                data: order
            });

            // Also send status update notification
            await notificationService.notifyOrderUpdate(order.user, order, 'COMPLETED');
        }

        res.json({ message: 'COD payment confirmed', order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
