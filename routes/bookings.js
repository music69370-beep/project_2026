const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, bookingController.index);
router.post('/', authMiddleware, bookingController.insert);

module.exports = router;