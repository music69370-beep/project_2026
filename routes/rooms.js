const express = require('express');
const router = express.Router();
// ຕ້ອງໝັ້ນໃຈວ່າ Path ນີ້ຖືກ (ຖອຍອອກໄປ 1 ຊັ້ນ ແລ້ວເຂົ້າ controllers)
const roomController = require('../controllers/roomController'); 

router.get('/', roomController.getAllRooms);
router.post('/', roomController.createRoom);

module.exports = router; // ຕ້ອງມີແຖວນີ້ສະເໝີ!