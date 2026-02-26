const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');

router.get('/', equipmentController.getAllEquipment);
router.post('/', equipmentController.createEquipment);
router.put('/:id', equipmentController.updateEquipment);    // PUT /api/equipment/1
router.delete('/:id', equipmentController.deleteEquipment); // DELETE /api/equipment/1

module.exports = router;