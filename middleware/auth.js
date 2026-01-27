const jwt = require('jsonwebtoken');

exports.auth = (roles = []) => (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.cookies.accessToken;
        if (!token) return res.status(401).json({ message: "Authentication required" });

        jwt.verify(token, process.env.JWT_ACCESS_SECRET || "access_secret", (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({ message: "Token expired", code: "TOKEN_EXPIRED" });
                }
                return res.status(401).json({ message: "Invalid token" });
            }

            if (roles.length && !roles.includes(decoded.role)) {
                return res.status(403).json({ message: "Forbidden: Access denied" });
            }

            req.user = decoded;
            next();
        });
    } catch (error) {
        res.status(500).json({ message: "Internal Auth Error" });
    }
};
