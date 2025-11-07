const express = require('express');
const router = express.Router();
const db = require('../../config/db.js');
const auth = require('../../middleware/auth.js');
const { asyncHandler, AppError } = require('../../middleware/errorHandler.js');

router.get('/user/profile', auth, asyncHandler(async (req, res, next) => {
    const [rows] = await db.query('SELECT id, name, firstname, email FROM users WHERE id = ?', [req.user.id]);
    
    if (!rows || rows.length === 0) {
        throw new AppError('User not found', 404);
    }
    
    res.json({
        success: true,
        data: rows[0]
    });
}));

router.put('/user/profile', auth, asyncHandler(async (req, res, next) => {
    const { name, firstname, email } = req.body;

    if (!name || !firstname || !email) {
        throw new AppError('All fields are required', 400);
    }

    await db.query(
        'UPDATE users SET name = ?, firstname = ?, email = ? WHERE id = ?',
        [name, firstname, email, req.user.id]
    );

    res.json({
        success: true,
        message: 'Profile updated successfully'
    });
}));

module.exports = router;