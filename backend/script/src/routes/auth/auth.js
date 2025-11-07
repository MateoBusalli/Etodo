const express = require('express');
const router = express.Router();
const db = require('../../config/db.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { asyncHandler, AppError } = require('../../middleware/errorHandler.js');
const auth_middleware = require('../../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET;

router.post('/register', asyncHandler(async (req, res, next) => {
    const { name, firstname, email, password } = req.body;

    if (!name || !firstname || !email || !password) {
        throw new AppError('All fields are required', 400);
    }

    if (password.length < 6) {
        throw new AppError('Password must be at least 6 characters', 400);
    }

    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (existingUsers.length > 0) {
        throw new AppError('Email already registered', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
        'INSERT INTO users (name, firstname, email, password) VALUES (?, ?, ?, ?)',
        [name, firstname, email, hashedPassword]
    );

    const token = jwt.sign({ id: result.insertId, email: email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
        success: true,
        data: {
            id: result.insertId,
            name,
            firstname,
            email,
            token
        }
    });
}));

router.post('/login', asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new AppError('Email and password required', 400);
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
        throw new AppError('Invalid email or password', 401);
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new AppError('Invalid email or password', 401);
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
        success: true,
        data: {
            id: user.id,
            name: user.name,
            firstname: user.firstname,
            email: user.email,
            token
        }
    });
}));

//Recuperer l'utilisateur connecté
router.get('/me', auth_middleware, asyncHandler(async (req, res, next) => {
    const [rows] = await db.query(
        'SELECT id, name, firstname, email FROM users WHERE id = ?', 
        [req.user.id]
    );

    if (rows.length === 0) {
        throw new AppError('User not found', 404);
    }

    res.json({
        success: true,
        data: rows[0]
    });
}));

module.exports = router;