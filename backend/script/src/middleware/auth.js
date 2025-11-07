const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler.js');
const JWT_SECRET = process.env.JWT_SECRET;

const auth_middleware = (req, res, next) => {
    const token = req.headers['authorization'];
    
    if (!token) {
        return next(new AppError('No token provided', 401));
    }
    
    const tokenValue = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    jwt.verify(tokenValue, JWT_SECRET, (err, decoded) => {
        if (err) {
            return next(new AppError('Invalid or expired token', 401));
        }
        req.user = decoded;
        next();
    });
};

module.exports = auth_middleware;