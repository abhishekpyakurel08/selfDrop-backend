const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
    address: String,
    lat: Number,
    lng: Number,
    note: String,
    area: { type: mongoose.Schema.Types.ObjectId, ref: 'Area' }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number,
        price: Number
    }],
    total: Number,

    // Delivery only
    orderType: { type: String, enum: ['DELIVERY'], default: 'DELIVERY' },

    // Delivery details (for home delivery)
    deliveryLocation: LocationSchema,
    deliveryCharge: { type: Number, default: 0 },
    distance: { type: Number, default: 0 }, // in kilometers
    estimatedDeliveryTime: { type: Number, default: 0 }, // in minutes

    status: {
        type: String,
        enum: ['CREATED', 'CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED'],
        default: 'CREATED'
    },
    payment: {
        method: { type: String, enum: ['COD'], default: 'COD' },
        status: { type: String, enum: ['PENDING', 'PAID', 'FAILED'], default: 'PENDING' },
        reference: String
    },
    refund: {
        status: { type: String, enum: ['NONE', 'REQUESTED', 'APPROVED', 'REJECTED', 'PROCESSED'], default: 'NONE' },
        reason: String,
        processedAt: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
