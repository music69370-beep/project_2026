const express = require('express');
const router = express.Router();
const cateringController = require('../controllers/cateringController');

router.get('/', cateringController.getAllItems);
router.post('/', cateringController.createItem);

// ເພີ່ມ 2 ແຖວນີ້
router.put('/:id', cateringController.updateItem);    // PUT /api/catering/1
router.delete('/:id', cateringController.deleteItem); // DELETE /api/catering/1

module.exports = router;