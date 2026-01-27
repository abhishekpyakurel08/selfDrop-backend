const router = require('express').Router();
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

// Admin only: Create product
router.post('/', auth(['admin']), async (req, res) => {
    const product = await Product.create({
        ...req.body
    });
    res.json(product);
});

router.get('/', async (req, res) => {
    const { category, search } = req.query;
    let query = { approved: true };

    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };

    res.json(await Product.find(query));
});

router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json(product);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Admin only: Update stock/details
router.put('/:id', auth(['admin']), async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
});

module.exports = router;
