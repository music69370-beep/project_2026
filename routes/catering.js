const express = require('express');
const router = express.Router();
const cateringController = require('../controllers/cateringController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, cateringController.getAllItems);
router.post('/', authMiddleware, cateringController.createItem);

// ເພີ່ມ 2 ແຖວນີ້
router.put('/:id', authMiddleware, cateringController.updateItem);    // PUT /api/catering/1
router.delete('/:id', authMiddleware, cateringController.deleteItem); // DELETE /api/catering/1

module.exports = router;