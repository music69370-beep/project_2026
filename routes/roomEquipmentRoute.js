const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController'); //

// ສ້າງ Path ສຳລັບການ Insert ຂໍ້ມູນອຸປະກອນເຂົ້າຫ້ອງ
router.post('/insert', roomController.addEquipmentToRoom); //

module.exports = router;