const { Equipment } = require('../models'); // ເປີດໃຊ້ງານ Model

exports.getAllEquipment = async (req, res) => {
    try {
        const data = await Equipment.findAll();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createEquipment = async (req, res) => {
    try {
        // ບັນທຶກຂໍ້ມູນຈາກ Postman (req.body) ລົງ Database
        const newEquipment = await Equipment.create(req.body);
        res.status(201).json({
            message: "ບັນທຶກຂໍ້ມູນສຳເລັດ!",
            data: newEquipment
        });
    } catch (error) {
        // ຖ້າ Error ໃຫ້ບອກສາເຫດ (ເຊັ່ນ: ຊື່ Column ບໍ່ກົງ)
        res.status(400).json({ message: error.message });
    }
};