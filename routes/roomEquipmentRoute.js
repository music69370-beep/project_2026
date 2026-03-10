const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController'); //
const authMiddleware = require('../middlewares/authMiddleware');

// ສ້າງ Path ສຳລັບການ Insert ຂໍ້ມູນອຸປະກອນເຂົ້າຫ້ອງ
router.post('/insert', authMiddleware, roomController.addEquipmentToRoom); //

module.exports = router;