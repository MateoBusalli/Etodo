const router = express.Router();
const express = require('express');
const db = require('../../config/db.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
    const {username, email, password} = req.body;
    if (!username || !email || !password) {
        return res.json({message: 'Username, email and password required.'});
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);
        return res.json({message:'User registered succesfully.'});
    } catch (error) {
        console.error(error);
        return res.json({message:'Server error.'});
    }
});

router.post('/login', async (req, res)=> {
    const {email,password}=req.body;
    if (!email || !password) {
        return res.json({message:'Email and password required.'});
    }
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.json({message:'Invalid email or password.'});
        }
    } catch (error) {
        console.error(error);
        return res.json({message:'Server error.'});
    }
});
module.exports = router;