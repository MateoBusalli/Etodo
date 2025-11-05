import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;

const auth_middleware = (req, _res, next) => {
    const token = req.headers['authorization'];
    jwt.verify(token, JWT_SECRET, (_err, decoded) => {
        req.user = decoded;
        next();
    });
}
export default auth_middleware;