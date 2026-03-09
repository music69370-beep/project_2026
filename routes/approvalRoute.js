const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approvalController');

// 1. ສົ່ງຜົນການອະນຸມັດ (POST)
router.post('/submit', approvalController.submitApproval);

// 2. ດຶງລາຍການຈອງທັງໝົດມາໂຊ (GET) ⭐ ເພີ່ມໂຕນີ້
router.get('/', approvalController.getAllBookings);

module.exports = router;