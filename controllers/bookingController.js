const models = require('../models');
const { Op } = require('sequelize');

// --- Helper Function ສຳລັບກວດເຊັກເວລາຊ້ຳ (ເພື່ອບໍ່ໃຫ້ຂຽນ Code ຊ້ຳຊ້ອນ) ---
const checkOverlap = async (room_id, start_time, end_time, excludeBookingId = null) => {
    return await models.Booking.findOne({
        where: {
            room_id,
            status: { [Op.ne]: 'Rejected' },
            // ກໍລະນີ 4: ຖ້າແມ່ນການ Update ໃຫ້ຂ້າມ ID ຂອງໂຕມັນເອງ
            ...(excludeBookingId && { id: { [Op.ne]: excludeBookingId } }),
            [Op.or]: [
                {
                    // ກໍລະນີ 1: ເວລາເລີ່ມຕົ້ນໃໝ່ ຕົກຢູ່ໃນຊ່ວງເວລາທີ່ມີຄົນຈອງແລ້ວ
                    start_time: { [Op.between]: [start_time, end_time] }
                },
                {
                    // ກໍລະນີ 2: ເວລາສິ້ນສຸດໃໝ່ ຕົກຢູ່ໃນຊ່ວງເວລາທີ່ມີຄົນຈອງແລ້ວ
                    end_time: { [Op.between]: [start_time, end_time] }
                },
                {
                    // ກໍລະນີ 3: ເວລາທີ່ຈອງໃໝ່ ກວມເອົາຊ່ວງເວລາທີ່ມີຄົນຈອງແລ້ວທັງໝົດ
                    [Op.and]: [
                        { start_time: { [Op.lte]: start_time } },
                        { end_time: { [Op.gte]: end_time } }
                    ]
                }
            ]
        }
    });
};

// 1. ດຶງຂໍ້ມູນການຈອງ (Pagination & Search)
exports.index = async (req, res) => {
    try {
        const { room_name, start_date, end_date, page = 1, limit = 10 } = req.query; 
        const offset = (page - 1) * limit;
        let whereCondition = {};

        if (start_date && end_date) {
            whereCondition.start_time = { [Op.between]: [new Date(start_date), new Date(end_date)] };
        }

        const { count, rows } = await models.Booking.findAndCountAll({
            where: whereCondition,
            limit: parseInt(limit),
            offset: parseInt(offset),
            include: [
                {
                    model: models.Room,
                    as: 'room',
                    where: room_name ? { room_name: { [Op.like]: `%${room_name}%` } } : null, 
                    attributes: ['room_name', 'location']
                },
                {
                    model: models.User,
                    as: 'user',
                    attributes: ['full_name', 'department']
                }
            ],
            order: [['createdAt', 'DESC']] 
        });

        res.status(200).json({ 
            success: true, 
            data: rows,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. ສ້າງການຈອງໃໝ່
exports.insert = async (req, res) => {
    try {
        const { room_id, start_time, end_time, attendeeCount, title } = req.body;
        const userIdFromToken = req.user.id; 

        // ເງື່ອນໄຂພື້ນຖານ
        if (new Date(start_time) < new Date()) {
            return res.status(400).json({ message: "ບໍ່ສາມາດຈອງເວລາຍ້ອນຫຼັງໄດ້" });
        }
        if (new Date(end_time) <= new Date(start_time)) {
            return res.status(400).json({ message: "ເວລາສິ້ນສຸດຕ້ອງຫຼັງຈາກເວລາເລີ່ມຕົ້ນ" });
        }

        // ກວດເຊັກ Capacity
        const room = await models.Room.findByPk(room_id);
        if (!room) return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນຫ້ອງ" });
        if (attendeeCount > room.capacity) {
            return res.status(400).json({ message: `ຫ້ອງນີ້ຮັບໄດ້ສູງສຸດ ${room.capacity} ຄົນ` });
        }

        // 🛠 ໃຊ້ Helper Function ກວດເຊັກ Overlap (ຄົບ 4 ກໍລະນີ)
        const isConflict = await checkOverlap(room_id, start_time, end_time);
        if (isConflict) {
            return res.status(400).json({ message: "ຫ້ອງນີ້ຖືກຈອງແລ້ວໃນຊ່ວງເວລານີ້" });
        }

        const newBooking = await models.Booking.create({
            title, room_id, start_time, end_time, attendeeCount,
            user_id: userIdFromToken,
            status: 'Pending'
        });

        res.status(201).json({ success: true, message: "ສົ່ງຄຳຂໍຈອງສຳເລັດ", data: newBooking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. ອັບເດດການຈອງ
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, start_time, end_time, room_id, attendeeCount, status } = req.body;
        const userIdFromToken = req.user.id;
        const userRole = req.user.role;

        const booking = await models.Booking.findByPk(id);
        if (!booking) return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນການຈອງ" });

        // ກວດເຊັກສິດ
        if (userRole !== 'admin' && booking.user_id !== userIdFromToken) {
            return res.status(403).json({ message: "ທ່ານບໍ່ມີສິດແກ້ໄຂການຈອງຂອງຜູ້ອື່ນ" });
        }

        // 🛠 ຖ້າມີການປ່ຽນເວລາ ຫຼື ຫ້ອງ, ຕ້ອງກວດເຊັກ Overlap ໃໝ່ (ໂດຍຂ້າມ ID ໂຕເອງ)
        if (start_time || end_time || room_id) {
            const checkRoom = room_id || booking.room_id;
            const checkStart = start_time || booking.start_time;
            const checkEnd = end_time || booking.end_time;

            const isConflict = await checkOverlap(checkRoom, checkStart, checkEnd, id);
            if (isConflict) {
                return res.status(400).json({ message: "ເວລາໃໝ່ທີ່ທ່ານເລືອກ ມີຄົນຈອງແລ້ວ" });
            }
        }

        await models.Booking.update(req.body, { where: { id } });
        res.status(200).json({ success: true, message: "ອັບເດດສຳເລັດ" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. ລຶບການຈອງ
exports.destroy = async (req, res) => {
    try {
        const { id } = req.params;
        const userIdFromToken = req.user.id;
        const userRole = req.user.role;

        const booking = await models.Booking.findByPk(id);
        if (!booking) return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນການຈອງ" });

        if (userRole !== 'admin' && booking.user_id !== userIdFromToken) {
            return res.status(403).json({ message: "ທ່ານບໍ່ມີສິດລຶບການຈອງຂອງຜູ້ອື່ນ" });
        }

        await models.Booking.destroy({ where: { id: id } });
        res.status(200).json({ success: true, message: "ລຶບການຈອງສຳເລັດ" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};