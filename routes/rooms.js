const express = require('express');
const router = express.Router();
// ຕ້ອງໝັ້ນໃຈວ່າ Path ນີ້ຖືກ (ຖອຍອອກໄປ 1 ຊັ້ນ ແລ້ວເຂົ້າ controllers)
const roomController = require('../controllers/roomController'); 

router.get('/', roomController.getAllRooms);
router.post('/', roomController.createRoom);
router.put('/:id', roomController.updateRoom);    // ແກ້ໄຂ: PUT http://localhost:3000/api/rooms/1
router.delete('/:id', roomController.deleteRoom); // ລຶບ: DELETE http://localhost:3000/api/rooms/1

module.exports = router;

module.exports = router; // ຕ້ອງມີແຖວນີ້ສະເໝີ!