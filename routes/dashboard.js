const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');

// ເອີ້ນໃຊ້ API ນີ້ຜ່ານ /api/dashboard/stats
router.get('/stats', authMiddleware, dashboardController.getStats);

module.exports = router;