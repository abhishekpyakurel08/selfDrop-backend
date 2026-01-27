const router = require('express').Router();
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const mailer = require('../config/mailer');
const axios = require('axios');

// Helper to generate tokens
const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_ACCESS_SECRET || "access_secret",
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRE || '15m' }
    );
    const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET || "refresh_secret",
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '7d' }
    );
    return { accessToken, refreshToken };
};

// Admin/User Password Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(401).json({ message: "Invalid credentials" });

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > Date.now()) {
            return res.status(403).json({ message: "Account locked. Try again later." });
        }

        // Only allow password login for users that have a password set (Manual accounts / Admins)
        if (!user.password && user.googleId) {
            return res.status(400).json({ message: "Please sign in with Google" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            user.otpAttempts = (user.otpAttempts || 0) + 1;
            if (user.otpAttempts >= 5) {
                user.lockedUntil = Date.now() + 15 * 60 * 1000; // 15 min
            }
            await user.save();
            return res.status(401).json({ message: "Invalid credentials" });
        }


        // Reset attempts on success
        user.otpAttempts = 0;
        await user.save();

        const { accessToken, refreshToken } = generateTokens(user);
        user.refreshToken = refreshToken;
        await user.save();

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({ accessToken, user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
        if (user) {
            user.otpAttempts += 1;
            if (user.otpAttempts >= 5) user.lockedUntil = Date.now() + 15 * 60 * 1000;
            await user.save();
        }
        return res.status(401).json({ message: "Invalid or expired OTP" });
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ accessToken, user });
});

// Refresh Token
router.post('/refresh-token', async (req, res) => {
    const rfToken = req.cookies.refreshToken;
    if (!rfToken) return res.status(401).json({ message: "Not authenticated" });

    try {
        const decoded = jwt.verify(rfToken, process.env.JWT_REFRESH_SECRET || "refresh_secret");
        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== rfToken) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const { accessToken, refreshToken } = generateTokens(user);
        user.refreshToken = refreshToken;
        await user.save();

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ accessToken });
    } catch (err) {
        res.status(401).json({ message: "Session expired" });
    }
});

// Google Login (Updated for Auth Code Flow)
router.post('/google', async (req, res) => {
    try {
        const { code } = req.body;
        const client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            'postmessage'
        );

        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);

        const googleRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
        });

        const { name, email, sub, picture } = googleRes.data;
        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                name,
                email,
                googleId: sub,
                profilePicture: picture,
                role: 'user' // Default role
            });
        } else {
            // Update googleId and picture if missing
            user.googleId = sub;
            if (picture) user.profilePicture = picture;
            await user.save();
        }

        const { accessToken, refreshToken } = generateTokens(user);
        user.refreshToken = refreshToken;
        await user.save();

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ accessToken, user });
    } catch (err) {
        console.error('Google Auth Error:', err);
        res.status(400).json({ message: "Google auth failed", error: err.message });
    }
});

router.get('/me', auth(), async (req, res) => {
    const user = await User.findById(req.user.id);
    res.json(user);
});

// Logout
router.post('/logout', auth(), async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user) {
            user.refreshToken = undefined;
            await user.save();
        }
        res.clearCookie('refreshToken');
        res.json({ message: "Logged out successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
