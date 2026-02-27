const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middlewares/authMiddleware');

// ໃຊ້ authMiddleware ເພື່ອປ້ອງກັນຄວາມປອດໄພ
router.get('/', authMiddleware, bookingController.index);
router.post('/', authMiddleware, bookingController.insert);
router.put('/:id', authMiddleware, bookingController.update);    // <--- ສຳລັບການ Update
router.delete('/:id', authMiddleware, bookingController.destroy); // <--- ສຳລັບການ Delete

module.exports = router;