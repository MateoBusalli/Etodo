const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const auth_middleware = (req, res, next) => {
    const token = req.headers['authorization'];
    
    if (!token) {
        return res.json({ message: 'No token provided' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.json({ message: 'Invalid token' });
        }
        req.user = decoded;
        next();
    });
};

module.exports = auth_middleware;