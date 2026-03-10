const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, equipmentController.getAllEquipment);
router.post('/', authMiddleware, equipmentController.createEquipment);
router.put('/:id', authMiddleware, equipmentController.updateEquipment);    // PUT /api/equipment/1
router.delete('/:id', authMiddleware, equipmentController.deleteEquipment); // DELETE /api/equipment/1

module.exports = router;