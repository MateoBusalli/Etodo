const express = require('express');
const router = express.Router();
const db = require('../../config/db.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

router.post('/register', async (req, res) => {
    const { name, firstname, email, password } = req.body;

    if (!name || !firstname || !email || !password) {
        return res.json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
        return res.json({ message: 'Password must be at least 6 characters' });
    }

    try {
        const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (existingUsers.length > 0) {
            return res.json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            'INSERT INTO users (name, firstname, email, password) VALUES (?, ?, ?, ?)',
            [name, firstname, email, hashedPassword]
        );

        const token = jwt.sign({ id: result.insertId, email: email }, JWT_SECRET, { expiresIn: '7d' });

        return res.json({
            id: result.insertId,
            name,
            firstname,
            email,
            token
        });

    } catch (error) {
        console.error(error);
        return res.json({ message: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({ message: 'Email and password required' });
    }

    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.json({ message: 'Invalid email or password' });
        }

        const user = rows[0];

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        return res.json({
            id: user.id,
            name: user.name,
            firstname: user.firstname,
            email: user.email,
            token
        });

    } catch (error) {
        console.error(error);
        return res.json({ message: 'Server error' });
    }
});

module.exports = router;