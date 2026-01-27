const router = require('express').Router();
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Expense = require('../models/Expense');
const { auth } = require('../middleware/auth');

// Middleware to ensure admin only
const adminOnly = auth(['admin']);

// GET /api/admin/stats
router.get('/stats', adminOnly, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });

        // Revenue Analysis
        const completedOrders = await Order.find({ status: 'COMPLETED' });
        const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
        const deliveryRevenue = completedOrders.reduce((sum, o) => sum + (o.deliveryCharge || 0), 0);

        // Expense Analysis
        const allExpenses = await Expense.find();
        const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);

        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ status: { $in: ['CREATED', 'CONFIRMED', 'OUT_FOR_DELIVERY'] } });
        const cancelledOrders = await Order.countDocuments({ status: 'CANCELLED' });

        // Daily Analytics (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyAnalytics = await Order.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo }, status: 'COMPLETED' } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    income: { $sum: "$total" }
                }
            },
            { $sort: { _id: 1 } },
            { $project: { date: "$_id", income: 1, _id: 0 } }
        ]);

        const lowStockProducts = await Product.find({ stock: { $lt: 10 } }).limit(5);

        res.json({
            totalRevenue,
            deliveryRevenue,
            totalExpenses,
            netProfit: totalRevenue - totalExpenses,
            totalOrders,
            pendingOrders,
            completedOrders: completedOrders.length,
            cancelledOrders,
            totalUsers,
            dailyAnalytics,
            lowStockProducts,
            orderDistribution: await Order.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
                { $project: { name: '$_id', value: '$count' } }
            ]),
            categoryDistribution: await Order.aggregate([
                { $match: { status: 'COMPLETED' } },
                { $unwind: '$items' },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'items.product',
                        foreignField: '_id',
                        as: 'productInfo'
                    }
                },
                { $unwind: '$productInfo' },
                {
                    $group: {
                        _id: '$productInfo.category',
                        value: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                    }
                },
                { $project: { name: '$_id', value: 1 } }
            ]),
            paymentDistribution: await Order.aggregate([
                { $group: { _id: '$payment.method', value: { $sum: 1 } } },
                { $project: { name: '$_id', value: 1 } }
            ])
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/admin/expenses
router.get('/expenses', adminOnly, async (req, res) => {
    try {
        const expenses = await Expense.find().sort('-date');
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/admin/expenses
router.post('/expenses', adminOnly, async (req, res) => {
    try {
        const expense = await Expense.create({
            ...req.body,
            createdBy: req.user.id
        });
        res.status(201).json(expense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/admin/users
router.get('/users', adminOnly, async (req, res) => {
    try {
        const users = await User.find({}, '-password -refreshToken').sort('-createdAt');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/admin/orders
router.get('/orders', adminOnly, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'name email')
            .populate('items.product')
            .sort('-createdAt');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/admin/products
router.get('/products', adminOnly, async (req, res) => {
    try {
        const products = await Product.find()
            .sort('-createdAt');
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/admin/users/:id
router.put('/users/:id', adminOnly, async (req, res) => {
    try {
        const { role, verifiedVendor, shopName } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role, verifiedVendor, shopName },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/admin/users/:id/orders
router.get('/users/:id/orders', adminOnly, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.params.id })
            .populate('items.product')
            .sort('-createdAt');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
