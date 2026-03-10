const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middlewares/authMiddleware');

// --- 1. ພວກ Static Routes (ເອົາໄວ້ເທິງສຸດ) ---
router.get('/search', authMiddleware, bookingController.searchBooking);
router.get('/check-availability', authMiddleware, bookingController.checkAvailableRooms);

// --- 2. ພວກ Base Routes ---
router.get('/', authMiddleware, bookingController.index);
router.post('/', authMiddleware, bookingController.insert);

// --- 3. ພວກ Dynamic Routes (ທີ່ມີ /:id ໃຫ້ໄວ້ລຸ່ມສຸດ) ---
router.put('/:id', authMiddleware, bookingController.update);
router.delete('/:id', authMiddleware, bookingController.destroy);
router.patch('/approve/:id', authMiddleware, bookingController.approve);

module.exports = router;