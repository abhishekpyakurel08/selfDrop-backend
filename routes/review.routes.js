const router = require('express').Router();
const Review = require('../models/Review');
const { auth } = require('../middleware/auth');
const { upload, uploadAndOptimize } = require('../config/upload');

// Post a review (with up to 5 images)
router.post('/:productId', auth(['user']), upload.array('images', 5), async (req, res) => {
    const images = [];
    if (req.files) {
        for (const file of req.files) {
            const url = await uploadAndOptimize(file);
            images.push(url);
        }
    }

    const review = await Review.create({
        product: req.params.productId,
        user: req.user.id,
        rating: req.body.rating,
        comment: req.body.comment,
        images
    });

    // Real-time update for reviews could be emitted here
    req.app.get('io').to(`product:${req.params.productId}`).emit('review:new', review);

    res.json(review);
});

router.get('/:productId', async (req, res) => {
    res.json(await Review.find({ product: req.params.productId }).populate('user', 'name'));
});

module.exports = router;
