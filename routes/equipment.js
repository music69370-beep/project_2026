const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');

// ກວດເບິ່ງວ່າ 'getAllEquipment' ສະກົດກົງກັບໃນ Controller ບໍ່
// ຖ້າທ່ານພິມຜິດ ຫຼື ຟັງຊັນນັ້ນບໍ່ມີໃນ Controller, ມັນຈະຂຶ້ນ Error 'apply' ທັນທີ
router.get('/', equipmentController.getAllEquipment); 
router.post('/', equipmentController.createEquipment);

module.exports = router;