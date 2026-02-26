const db = require('../models'); 
const Room = db.Room;

// 1. ດຶງຂໍ້ມູນຫ້ອງທັງໝົດ
exports.getAllRooms = async (req, res) => {
    try {
        if (!Room) {
            return res.status(500).json({ message: "Error: Model Room ຫາບໍ່ເຫັນ!" });
        }
        
        const rooms = await Room.findAll({
            order: [['id', 'DESC']] 
        });
        res.status(200).json(rooms);
    } catch (error) {
        console.error("❌ Error at getAllRooms:", error);
        res.status(500).json({ message: error.message });
    }
};

// 2. ບັນທຶກຂໍ້ມູນຫ້ອງໃໝ່ (ເພີ່ມລະບົບກວດເຊັກຊື່ຊໍ້າ)
exports.createRoom = async (req, res) => {
    try {
        const { room_name } = req.body;

        // ກວດສອບກ່ອນວ່າໄດ້ສົ່ງຂໍ້ມູນມາບໍ່
        if (!room_name) {
            return res.status(400).json({ message: "ກະລຸນາປ້ອນຊື່ຫ້ອງ (room_name)!" });
        }

        // --- ສ່ວນທີ່ເພີ່ມໃໝ່: ກວດເຊັກຊື່ຊໍ້າ ---
        const existingRoom = await Room.findOne({ where: { room_name: room_name } });
        if (existingRoom) {
            return res.status(400).json({ 
                message: `ບັນທຶກບໍ່ໄດ້: ຊື່ຫ້ອງ "${room_name}" ນີ້ມີຢູ່ໃນລະບົບແລ້ວ!` 
            });
        }
        // ----------------------------------

        const newRoom = await Room.create(req.body);
        
        res.status(201).json({
            message: "ບັນທຶກຫ້ອງສຳເລັດ!",
            data: newRoom
        });
    } catch (error) {
        console.error("❌ Error at createRoom:", error);
        res.status(400).json({ 
            message: "ບັນທຶກບໍ່ໄດ້: " + error.message
        });
    }
};