const express = require('express');
const { getAdminStats } = require('../controllers/analyticsController.js');
const { protect } = require('../middleware/authmiddleware');
const { admin } = require('../middleware/adminmiddleware');

const router = express.Router();

router.get('/', protect, admin, getAdminStats);

module.exports = router;
