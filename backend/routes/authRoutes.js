const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Generate tokens
const generateAccessToken = (userId, isAdmin) => {
  return jwt.sign({ userId, isAdmin }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { username, password, businessName, accessCode } = req.body;

    if (!username || !password || !businessName || !accessCode) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate access code
    if (accessCode !== process.env.ACCESS_CODE) {
      return res.status(401).json({ error: 'Invalid access code' });
    }

    // Check if username already exists
    const existing = await User.findOne({ username: username.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if this is the first user ever
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      username: username.toLowerCase().trim(),
      password: hashedPassword,
      businessName,
      isAdmin: isFirstUser  // first user = admin
    });

    await user.save();

    const accessToken = generateAccessToken(user._id, user.isAdmin);
    const refreshToken = generateRefreshToken(user._id, user.isAdmin);

    user.refreshTokens.push(refreshToken);
    await user.save();

    res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        businessName: user.businessName,
        isAdmin: user.isAdmin
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid username or password' });

    const accessToken = generateAccessToken(user._id, user.isAdmin);
const refreshToken = generateRefreshToken(user._id, user.isAdmin);

    user.refreshTokens.push(refreshToken);
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }
    await user.save();

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        businessName: user.businessName,
        isAdmin: user.isAdmin 
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REFRESH TOKEN
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expired — please login again' });
    }
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// LOGOUT
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.userId);
        if (user) {
          user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
          await user.save();
        }
      } catch (err) {
        // Token already expired
      }
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.json({ message: 'Logged out' });
  }
});

// CHANGE PASSWORD
router.post('/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { currentPassword, newPassword } = req.body;
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ error: 'Current password is incorrect' });

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    user.refreshTokens = [];
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// GET access code — must be after authMiddleware
router.get('/access-code', authMiddleware, async (req, res) => {
  try {
    console.log('req.user:', req.user); // debug
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    res.json({ accessCode: process.env.ACCESS_CODE });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/access-code/regenerate', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const newCode = 'WH' + Math.random().toString(36).substring(2, 8).toUpperCase();
    process.env.ACCESS_CODE = newCode;
    res.json({ accessCode: newCode, message: 'Access code regenerated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;