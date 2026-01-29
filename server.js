require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const reviewRoutes = require('./routes/review.routes');
const orderRoutes = require('./routes/order.routes');
const uploadRoutes = require('./routes/upload.routes');
const paymentRoutes = require('./routes/payment.routes');
const refundRoutes = require('./routes/refund.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const reportRoutes = require('./routes/report.routes');
const adminRoutes = require('./routes/admin.routes');
const locationRoutes = require('./routes/location.routes');
const notificationService = require('./services/notification.service');
const initLocationSuggestionJob = require('./jobs/location-suggestion.job');

const app = express();
const server = http.createServer(app);

const logger = require('./middleware/logger.middleware');
const errorHandler = require('./middleware/error.middleware');

app.use(logger);

const allowedOrigins = [,
    process.env.FRONTEND_URL
].filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Set to false if you have trouble with external scripts/images
}));
app.use(mongoSanitize());
app.use(compression());

// Rate Limiting Hub
const createLimiter = (windowMs, max, message) => rateLimit({
    windowMs,
    max,
    message: { message },
    standardHeaders: true,
    legacyHeaders: false,
});

// 1. Global API Limiter (Standard Browsing)
app.get('/api/keep-alive', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is awake',
    time: new Date().toISOString()
  });
});
const globalLimiter = createLimiter(15 * 60 * 1000, 300, 'System busy. Please try again in 15 minutes.');
app.use('/api/', globalLimiter);

// 2. Auth Limiter (Brute-force protection for Login/OTP)
const authLimiter = createLimiter(15 * 60 * 1000, 10, 'Too many login attempts. Please wait 15 minutes.');
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/verify-otp', authLimiter);

// 3. Order Limiter (Spam protection)
const orderLimiter = createLimiter(60 * 60 * 1000, 20, 'Order limit reached. Please contact support if this is an error.');
app.use('/api/orders', orderLimiter);

// 4. Media Upload Limiter (Resource abuse protection)
const uploadLimiter = createLimiter(60 * 60 * 1000, 15, 'Upload limit reached. Please try again in an hour.');
app.use('/api/upload', uploadLimiter);

app.set('trust proxy', 1); // Respect X-Forwarded-For headers in production

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: '10kb' })); // Body limit for security
app.use(cookieParser());

// Make io accessible in routes and service
app.set('io', io);
notificationService.init(io);

// Initialize Cron Jobs
initLocationSuggestionJob();

// Route Mounting
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/location', locationRoutes);

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Path ${req.originalUrl} not found`
    });
});

// Global Error Handler
app.use(errorHandler);

// Socket.IO Connection
io.on('connection', socket => {
    console.log('Client connected:', socket.id);

    socket.on('join:product', (productId) => {
        socket.join(`product:${productId}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on 0.0.0.0:${PORT}`));
