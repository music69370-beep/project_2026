const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approvalController');
const authMiddleware = require('../middlewares/authMiddleware');

// 1. ສົ່ງຜົນການອະນຸມັດ (POST)
router.post('/submit', authMiddleware, approvalController.submitApproval);

// 2. ດຶງລາຍການຈອງທັງໝົດມາໂຊ (GET) ⭐ ເພີ່ມໂຕນີ້
router.get('/', authMiddleware, approvalController.getAllBookings);

module.exports = router;