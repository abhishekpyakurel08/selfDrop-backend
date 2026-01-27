const router = require('express').Router();
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');

// User requests refund
router.post('/:orderId/request', auth(['user']), async (req, res) => {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.refund = { status: 'REQUESTED', reason: req.body.reason };
    await order.save();
    res.json(order);
});

// Admin approves/rejects
router.put('/:orderId/approve', auth(['admin']), async (req, res) => {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.refund.status = req.body.approved ? 'APPROVED' : 'REJECTED';
    order.refund.processedAt = new Date();
    await order.save();
    res.json(order);
});

module.exports = router;
