const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, bookingController.index);
router.post('/', authMiddleware, bookingController.insert);
router.put('/:id', authMiddleware, bookingController.update);
router.delete('/:id', authMiddleware, bookingController.destroy);
router.patch('/approve/:id', authMiddleware, bookingController.approve);
router.get('/check-availability', authMiddleware, bookingController.checkAvailableRooms);

module.exports = router;