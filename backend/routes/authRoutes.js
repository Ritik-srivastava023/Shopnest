const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUsers, verifyOtp, resendOtp } = require('../controllers/authcontroller.js');
const { protect } = require('../middleware/authmiddleware');
const { admin } = require('../middleware/adminmiddleware');





router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.get('/users',protect,admin,getUsers);
module.exports = router;