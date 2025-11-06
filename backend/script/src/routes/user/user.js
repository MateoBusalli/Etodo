const express = require('express');
const router = express.Router();
const db = require('../../config/db.js');
const auth = require('../../middleware/auth.js');

router.get('/user/profile', auth, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name, firstname, email FROM users WHERE id = ?', [req.user.id]);
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.json({ message: 'Server error' });
    }
});

router.put('/user/profile', auth, async (req, res) => {
    const { name, firstname, email } = req.body;

    try {
        await db.query(
            'UPDATE users SET name = ?, firstname = ?, email = ? WHERE id = ?',
            [name, firstname, email, req.user.id]
        );

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error(error);
        res.json({ message: 'Server error' });
    }
});

module.exports = router;