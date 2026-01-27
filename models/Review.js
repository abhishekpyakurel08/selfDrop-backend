const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    rating: Number,
    comment: String,
    images: [String]
}, { timestamps: true });

ReviewSchema.statics.getAverageRating = async function (productId) {
    const stats = await this.aggregate([
        { $match: { product: productId } },
        {
            $group: {
                _id: '$product',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    if (stats.length > 0) {
        await mongoose.model('Product').findByIdAndUpdate(productId, {
            reviewCount: stats[0].nRating,
            averageRating: Math.round(stats[0].avgRating * 10) / 10
        });
    } else {
        await mongoose.model('Product').findByIdAndUpdate(productId, {
            reviewCount: 0,
            averageRating: 0
        });
    }
};

// Call getAverageRating after save
ReviewSchema.post('save', function () {
    this.constructor.getAverageRating(this.product);
});

// Call getAverageRating before remove
ReviewSchema.post('remove', function () {
    this.constructor.getAverageRating(this.product);
});

module.exports = mongoose.model('Review', ReviewSchema);
