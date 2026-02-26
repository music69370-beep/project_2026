const { CateringItem } = require('../models');

// 1. ດຶງລາຍການທັງໝົດ
exports.getAllItems = async (req, res) => {
    try {
        const items = await CateringItem.findAll();
        res.status(200).json(items);
    } catch (error) {
        console.error("❌ Error GetAllItems:", error);
        res.status(500).json({ message: error.message });
    }
};

// 2. ເພີ່ມລາຍການໃໝ່
exports.createItem = async (req, res) => {
    try {
        // ເບິ່ງຂໍ້ມູນທີ່ Postman ສົ່ງມາໃນ Terminal
        console.log("📩 Data from Postman:", req.body);

        const { Name } = req.body;

        // ກວດເຊັກວ່າສົ່ງ Name ມາຫຼືບໍ່ (ຕ້ອງເປັນ N ໃຫຍ່ຕາມ Model)
        if (!Name) {
            return res.status(400).json({ 
                message: "ບັນທຶກບໍ່ໄດ້: ກະລຸນາປ້ອນ 'Name' (N ໂຕໃຫຍ່) ໃຫ້ກົງກັບ Model!" 
            });
        }

        // ກວດເຊັກຊື່ຊໍ້າ
        const existing = await CateringItem.findOne({ where: { Name: Name } });
        if (existing) {
            return res.status(400).json({ message: "ລາຍການນີ້ມີຢູ່ໃນລະບົບແລ້ວ!" });
        }

        const newItem = await CateringItem.create(req.body);
        res.status(201).json({ 
            message: "ບັນທຶກສຳເລັດ!", 
            data: newItem 
        });

    } catch (error) {
        console.error("❌ Error CreateItem:", error);
        res.status(500).json({ 
            message: "ເກີດຂໍ້ຜິດພາດ: " + error.message 
        });
    }
};
// 3. ແກ້ໄຂຂໍ້ມູນ (Update)
exports.updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await CateringItem.findByPk(id);

        if (!item) {
            return res.status(404).json({ message: "ບໍ່ພົບລາຍການທີ່ຕ້ອງການແກ້ໄຂ!" });
        }

        // ກວດເຊັກຖ້າ User ພະຍາຍາມປ່ຽນຊື່ໄປຊໍ້າກັບລາຍການອື່ນ
        if (req.body.Name && req.body.Name !== item.Name) {
            const existing = await CateringItem.findOne({ where: { Name: req.body.Name } });
            if (existing) return res.status(400).json({ message: "ຊື່ລາຍການນີ້ມີຢູ່ໃນລະບົບແລ້ວ!" });
        }

        await item.update(req.body);
        res.status(200).json({
            message: "ແກ້ໄຂສຳເລັດ!",
            data: item
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 4. ລຶບຂໍ້ມູນ (Delete)
exports.deleteItem = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await CateringItem.findByPk(id);

        if (!item) {
            return res.status(404).json({ message: "ບໍ່ພົບລາຍການທີ່ຕ້ອງການລຶບ!" });
        }

        await item.destroy();
        res.status(200).json({ message: "ລຶບລາຍການສຳເລັດແລ້ວ!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};