// routes/auth.js

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const OTPRequest = require('../models/OTPRequest');
const nodemailer = require('nodemailer');

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Access Denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid Token' });
    }
};

// 📧 Send OTP Email
const sendOTP = async (email, otp) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    await transporter.sendMail({
        from: process.env.EMAIL,
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP is ${otp}. It will expire in 5 minutes.`
    });
};

// 📌 Register or Google Sign-In
router.post('/google-signin', async (req, res) => {
    const { name, email, googleId } = req.body;

    let user = await User.findOne({ email });
    if (!user) {
        user = new User({ name, email, googleId });
        await user.save();
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});
router.get('/test', (req, res) => {
    res.send('Test route is working!');
});


// 📌 Email Verification with OTP
router.post('/send-otp', async (req, res) => {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP

    const otpRequest = new OTPRequest({
        email,
        otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // Expires in 5 minutes
    });

    await otpRequest.save();
    await sendOTP(email, otp);

    res.json({ message: 'OTP sent successfully' });
});

// 📌 Verify OTP
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    const otpRequest = await OTPRequest.findOne({ email, otp });

    if (!otpRequest || otpRequest.expiresAt < new Date()) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    await OTPRequest.deleteOne({ _id: otpRequest._id });
    res.json({ message: 'OTP verified successfully' });
});

// 📌 Set Password
router.post('/set-password', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    user.password = password; // bcrypt will hash this in the pre-save hook
    await user.save();

    res.json({ message: 'Password set successfully' });
});

// 📌 Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.status(400).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});

// 📌 Protected Route Example
router.get('/protected', verifyToken, (req, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
});

module.exports = router;
