const errorMiddleware = (err, req, res, next) => {
    console.error(`[Error] ${err.name}: ${err.message}`);
    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }

    let status = err.status || 500;
    let message = err.message || 'Internal Server Error';

    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
        status = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
    }

    // Mongoose Duplicate Key Error
    if (err.code === 11000) {
        status = 400;
        message = `Duplicate field value entered: ${Object.keys(err.keyValue).join(', ')}`;
    }

    // Mongoose Cast Error (Invalid ID)
    if (err.name === 'CastError') {
        status = 400;
        message = `Invalid format for ${err.path}: ${err.value}`;
    }

    // JWT Authentication Error
    if (err.name === 'JsonWebTokenError') {
        status = 401;
        message = 'Invalid token. Please log in again.';
    }

    if (err.name === 'TokenExpiredError') {
        status = 401;
        message = 'Your token has expired. Please log in again.';
    }

    res.status(status).json({
        success: false,
        status,
        message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorMiddleware;
