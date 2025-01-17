// adminRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Admin middleware
const isAdmin = (req, res, next) => {
    if (!req.session.isAdmin) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
};

// Admin login
router.post('/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // In production, use environment variables for admin credentials
        if (username === 'admin' && password === 'admin123') {
            req.session.isAdmin = true;
            res.json({ message: 'Admin login successful' });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add new voter
router.post('/admin/add-voter', isAdmin, async (req, res) => {
    try {
        const { uid, password, name, constituency, voterId } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ uid });
        if (existingUser) {
            return res.status(400).json({ message: 'UID already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            uid,
            password: hashedPassword,
            name,
            constituency,
            voterId,
            hasVoted: false
        });

        await user.save();
        res.json({ message: 'Voter added successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all voters
router.get('/admin/voters', isAdmin, async (req, res) => {
    try {
        const voters = await User.find({}, '-password');
        res.json(voters);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete voter
router.delete('/admin/voter/:uid', isAdmin, async (req, res) => {
    try {
        await User.findOneAndDelete({ uid: req.params.uid });
        res.json({ message: 'Voter deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
