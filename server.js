
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
const adminRoutes = require('./adminRoutes'); // The admin routes we created earlier
const User = require('./models/User');


const app = express();

// Middleware setup
app.use(express.json());
app.use(express.static('public'));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/voting_system', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});



// Define Vote Schema
const VoteSchema = new mongoose.Schema({
    candidateId: { type: String, required: true },
    constituency: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});


const Vote = mongoose.model('Vote', VoteSchema);

// Use admin routes
app.use(adminRoutes);

// Basic routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/vote', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'us.html'));
});
app.get('/api/user', (req, res) => {
    console.log("Session Data:", req.session);  // Debugging line to check the session
    if (req.session.userId) {
        User.findById(req.session.userId)
            .then(user => {
                if (user) {
                    res.json({ constituency: user.constituency });
                } else {
                    res.status(404).json({ message: 'User not found' });
                }
            })
            .catch(error => {
                console.error('Error fetching user:', error);
                res.status(500).json({ message: 'Error retrieving user' });
            });
    } else {
        console.log('User is not logged in');
        res.status(401).json({ message: 'User not logged in' });
    }
});


// Login route
app.post('/api/login', async (req, res) => {
    try {
        const { uid, password } = req.body;
        
        const user = await User.findOne({ uid });
        if (!user) {
            return res.status(401).json({ message: 'Invalid UID or password' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid UID or password' });
        }

        if (user.hasVoted) {
            return res.status(403).json({ message: 'You have already cast your vote' });
        }

        req.session.userId = user._id;
        req.session.constituency = user.constituency;

        res.json({ 
            message: 'Login successful',
            constituency: user.constituency 
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Voting route
app.post('/api/vote', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Please login first' });
        }

        const { candidateId } = req.body;
        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.hasVoted) {
            return res.status(403).json({ message: 'You have already cast your vote' });
        }

        // Record the vote
        const vote = new Vote({
            candidateId,
            constituency: user.constituency
        });
        await vote.save();

        // Update user's voting status
        user.hasVoted = true;
        await user.save();

        // Clear session
        req.session.destroy();

        res.json({ message: 'Vote cast successfully' });

    } catch (error) {
        console.error('Voting error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something broke!' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
