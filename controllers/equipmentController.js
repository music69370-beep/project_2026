const { Equipment } = require('../models');

// 1. ດຶງຂໍ້ມູນອຸປະກອນທັງໝົດ
exports.getAllEquipment = async (req, res) => {
    try {
        const data = await Equipment.findAll({
            order: [['id', 'DESC']]
        });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. ເພີ່ມອຸປະກອນໃໝ່ (ພ້ອມກວດເຊັກຊື່ຊໍ້າ)

exports.createEquipment = async (req, res) => {
    try {
        // 1. ປ່ຽນມາໃຊ້ item_name ໃຫ້ກົງກັບ Navicat ແລະ Postman
        const { item_name } = req.body;

        // 2. ກວດເຊັກຊື່ຊໍ້າໂດຍໃຊ້ Column item_name
        const existing = await Equipment.findOne({ where: { item_name: item_name } });
        if (existing) {
            return res.status(400).json({ message: "ຊື່ອຸປະກອນນີ້ມີຢູ່ໃນລະບົບແລ້ວ!" });
        }

        // 3. ບັນທຶກຂໍ້ມູນທັງໝົດ (item_name, unit, item_type, total_quantity)
        const newItem = await Equipment.create(req.body);
        res.status(201).json({ message: "ບັນທຶກສຳເລັດ!", data: newItem });
    } catch (error) {
        console.error("❌ Error at createEquipment:", error);
        res.status(400).json({ message: error.message });
    }
};

// 3. ແກ້ໄຂຂໍ້ມູນອຸປະກອນ
exports.updateEquipment = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await Equipment.findByPk(id);
        if (!item) return res.status(404).json({ message: "ບໍ່ພົບອຸປະກອນ!" });

        await item.update(req.body);
        res.status(200).json({ message: "ແກ້ໄຂສຳເລັດ!", data: item });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 4. ລຶບອຸປະກອນ
exports.deleteEquipment = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await Equipment.findByPk(id);
        if (!item) return res.status(404).json({ message: "ບໍ່ພົບອຸປະກອນ!" });

        await item.destroy();
        res.status(200).json({ message: "ລຶບສຳເລັດແລ້ວ!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};