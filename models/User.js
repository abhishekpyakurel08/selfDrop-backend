const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, required: true },
    password: { type: String }, // Hashed password
    googleId: String,
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    shopName: String,
    shopDescription: String,
    defaultLocation: {
        address: String,
        lat: Number,
        lng: Number
    },
    // Security / 2FA Fields
    otp: String,
    otpExpires: Date,
    otpAttempts: { type: Number, default: 0 },
    lockedUntil: Date,
    refreshToken: String
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
