const mongoose = require('mongoose');

const AreaSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    maxDistanceKm: { type: Number, default: 7.5 },
    active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Area', AreaSchema);
