const db = require('../models');
// ⭐ ປ່ຽນຈາກ const Room = db.Room; ມາເປັນແບບລຸ່ມນີ້:
const { Room, RoomEquipment, Equipment } = db;

// 1. ດຶງຂໍ້ມູນຫ້ອງທັງໝົດ
// 1. ດຶງຂໍ້ມູນຫ້ອງທັງໝົດ (ແບບປັບປຸງໃໝ່)
exports.getAllRooms = async (req, res) => {
    try {
        if (!Room) {
            return res.status(500).json({ message: "Error: Model Room ຫາບໍ່ເຫັນ!" });
        }
        
        const rooms = await Room.findAll({
            // ⭐ ເພີ່ມ include ເຂົ້າໄປບ່ອນນີ້
            include: [
                {
                    model: RoomEquipment,
                    as: 'room_equipments', // ໃຫ້ກົງກັບ as ທີ່ຕັ້ງໄວ້ໃນ models/room.js
                    include: [
                        {
                            model: Equipment,
                            as: 'equipment_details', // ໃຫ້ກົງກັບ as ທີ່ຕັ້ງໄວ້ໃນ models/roomequipment.js
                            attributes: ['item_name', 'unit'] // ດຶງເອົາແຕ່ຊື່ ແລະ ຫົວໜ່ວຍ
                        }
                    ]
                }
            ],
            order: [['id', 'DESC']] 
        });

        res.status(200).json({
            success: true,
            data: rooms
        });
    } catch (error) {
        console.error("❌ Error at getAllRooms:", error);
        res.status(500).json({ success: false, message: error.message });
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
// 3. ແກ້ໄຂຂໍ້ມູນຫ້ອງ (Update)
exports.updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const room = await Room.findByPk(id);

        if (!room) {
            return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນຫ້ອງທີ່ຕ້ອງການແກ້ໄຂ!" });
        }

        await room.update(req.body);
        res.status(200).json({
            message: "ແກ້ໄຂຂໍ້ມູນຫ້ອງສຳເລັດ!",
            data: room
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 4. ລຶບຂໍ້ມູນຫ້ອງ (Delete)
exports.deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const room = await Room.findByPk(id);

        if (!room) {
            return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນຫ້ອງທີ່ຕ້ອງການລຶບ!" });
        }

        await room.destroy();
        res.status(200).json({ message: "ລຶບຂໍ້ມູນຫ້ອງສຳເລັດແລ້ວ!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.addEquipmentToRoom = async (req, res) => {
    try {
        const { room_id, equipment_id, quantity } = req.body;
        
        // ບັນທຶກລົງ Table RoomEquipments ເລີຍ
        const data = await RoomEquipment.create({ room_id, equipment_id, quantity });
        
        res.status(201).json({ success: true, message: "ເພີ່ມອຸປະກອນເຂົ້າຫ້ອງສຳເລັດ", data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};