const router = require('express').Router();
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');

router.get('/summary', auth(['admin']), async (req, res) => {
    const orders = await Order.find({ 'payment.status': 'PAID' });

    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    const byMethod = {};
    orders.forEach(o => {
        byMethod[o.payment.method] = (byMethod[o.payment.method] || 0) + o.total;
    });

    res.json({
        totalOrders: orders.length,
        totalRevenue,
        byMethod
    });
});

module.exports = router;
