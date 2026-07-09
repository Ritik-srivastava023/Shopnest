const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOtpEmail = async (user, otp) => {
  const message = `
    <h2>Welcome to ShopNest, ${user.name}!</h2>
    <p>Thank you for registering on our platform.</p>
    <p>Your one-time verification OTP is: <strong>${otp}</strong></p>
    <p>This code will expire in 10 minutes.</p>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Welcome to ShopNest - Your OTP',
      message
    });
    return { sent: true };
  } catch (error) {
    console.error(`Failed to send OTP email to ${user.email}:`, error.message);
    return { sent: false, error: error.message };
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = generateOtp();

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      isVerified: false,
      otp,
      otpExpiresAt: Date.now() + 10 * 60 * 1000
    });

    if (user) {
      const emailResult = await sendOtpEmail(user, otp);

      res.status(201).json({
        message: emailResult.sent
          ? 'Registration successful. Please verify your email with the OTP sent to your inbox.'
          : 'Registration successful. The email could not be delivered, but the OTP is below for you to use.',
        email: user.email,
        otp: emailResult.sent ? null : otp
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(200).json({ message: 'Email already verified' });
    if (!user.otp || !user.otpExpiresAt || Date.now() > user.otpExpiresAt) {
      user.otp = null;
      user.otpExpiresAt = null;
      await user.save();
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }

    const storedOtp = String(user.otp || '').trim();
    const submittedOtp = String(otp || '').trim();

    console.log('OTP verify attempt', { email, storedOtp, submittedOtp });

    if (storedOtp !== submittedOtp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Email already verified' });

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiresAt = Date.now() + 10 * 60 * 1000;
    await user.save();
    const emailResult = await sendOtpEmail(user, otp);

    res.json({
      message: emailResult.sent
        ? 'A new OTP has been sent to your email.'
        : 'A new OTP was generated. The email could not be delivered, but the OTP is below for you to use.',
      otp: emailResult.sent ? null : otp
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (user && (await bcrypt.compare(password, user.password))) {
      if (!user.isVerified) {
        return res.status(403).json({ message: 'Please verify your email before logging in.' });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, getUsers, verifyOtp, resendOtp };