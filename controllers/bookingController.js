const db = require('../models');
// ດຶງຄ່າຕ່າງໆອອກມາຈາກ db object ໃຫ້ຄົບຖ້ວນ
const { Booking, Room, User, BookingEquipment, Equipment, sequelize } = db;
const { Op } = db.Sequelize;

// --- Helper Function: ກວດເຊັກເວລາຊ້ຳ ---
const checkOverlap = async (room_id, start_time, end_time, excludeBookingId = null) => {
    const now = new Date();
    return await Booking.findOne({
        where: {
            room_id,
            status: { [Op.in]: ['Pending', 'Approved'] },
            end_time: { [Op.gt]: now },
            ...(excludeBookingId && { id: { [Op.ne]: excludeBookingId } }),
            [Op.and]: [
                {
                    start_time: { [Op.lt]: new Date(end_time) },
                    end_time: { [Op.gt]: new Date(start_time) }
                }
            ]
        }
    });
};

// 1. ດຶງຂໍ້ມູນການຈອງ + ຂໍ້ມູນອຸປະກອນທີ່ຢືມ
exports.index = async (req, res) => {
    try {
        const { room_name, start_date, end_date, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        let whereCondition = {};

        if (start_date && end_date) {
            whereCondition.start_time = { [Op.between]: [new Date(start_date), new Date(end_date)] };
        }

        const { count, rows } = await Booking.findAndCountAll({
            where: whereCondition,
            limit: parseInt(limit),
            offset: parseInt(offset),
            include: [
                {
                    model: Room,
                    as: 'room',
                    where: room_name ? { room_name: { [Op.like]: `%${room_name}%` } } : null,
                    attributes: ['room_name', 'location']
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['full_name', 'department']
                },
                {
                    model: BookingEquipment,
                    as: 'equipments',
                    include: [{ model: Equipment, as: 'details' }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        const now = new Date();
        const updatedRows = rows.map(item => {
            const booking = item.get({ plain: true });
            const startTime = new Date(booking.start_time);
            const endTime = new Date(booking.end_time);

            if (booking.status === 'Approved') {
                if (now >= startTime && now <= endTime) {
                    booking.status = 'In Progress';
                } else if (now > endTime) {
                    booking.status = 'Completed';
                }
            } else if (booking.status === 'Pending' && now > endTime) {
                booking.status = 'Expired';
            }
            return booking;
        });

        res.status(200).json({
            success: true,
            data: updatedRows,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. ສ້າງການຈອງໃໝ່ + ບັນທຶກອຸປະກອນ (Transaction)
exports.insert = async (req, res) => {
    // ເລີ່ມ Transaction
    const t = await sequelize.transaction();

    try {
        const { room_id, start_time, end_time, attendeeCount, title, equipments } = req.body;
        const startDateObj = new Date(start_time);
        const endDateObj = new Date(end_time);

        if (startDateObj < new Date()) {
            await t.rollback();
            return res.status(400).json({ message: "ບໍ່ສາມາດຈອງເວລາຍ້ອນຫຼັງໄດ້" });
        }

        const room = await Room.findByPk(room_id);
        if (!room) {
            await t.rollback();
            return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນຫ້ອງ" });
        }

        if (attendeeCount > room.capacity) {
            await t.rollback();
            return res.status(400).json({ message: `ຫ້ອງຮັບໄດ້ສູງສຸດ ${room.capacity} ຄົນ` });
        }

        const isConflict = await checkOverlap(room_id, startDateObj, endDateObj);
        if (isConflict) {
            await t.rollback();
            return res.status(400).json({ message: "ຫ້ອງນີ້ຖືກຈອງແລ້ວໃນຊ່ວງເວລານີ້" });
        }

        // --- 1. ບັນທຶກການຈອງຫ້ອງ ---
        const newBooking = await Booking.create({
            title,
            room_id,
            start_time: startDateObj,
            end_time: endDateObj,
            attendeeCount,
            user_id: req.user.id,
            status: 'Pending'
        }, { transaction: t });

        // --- 2. ບັນທຶກອຸປະກອນ (ຖ້າມີ) ---
        if (equipments && Array.isArray(equipments) && equipments.length > 0) {
            const equipmentData = equipments.map(item => ({
                booking_id: newBooking.id,
                equipment_id: item.equipment_id,
                quantity: item.quantity || 1
            }));
            await BookingEquipment.bulkCreate(equipmentData, { transaction: t });
        }

        await t.commit(); 

        res.status(201).json({
            success: true,
            message: "ສົ່ງຄຳຂໍຈອງຫ້ອງ ແລະ ອຸປະກອນສຳເລັດ",
            data: newBooking
        });

    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. ອັບເດດການຈອງ
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findByPk(id);
        if (!booking) return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນການຈອງ" });

        if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
            return res.status(403).json({ message: "ທ່ານບໍ່ມີສິດແກ້ໄຂການຈອງນີ້" });
        }

        const { room_id, start_time, end_time } = req.body;
        if (start_time || end_time || room_id) {
            const isConflict = await checkOverlap(
                room_id || booking.room_id,
                start_time || booking.start_time,
                end_time || booking.end_time,
                id
            );
            if (isConflict) return res.status(400).json({ message: "ເວລາໃໝ່ມີຄົນຈອງແລ້ວ" });
        }

        await Booking.update(req.body, { where: { id } });
        res.status(200).json({ success: true, message: "ອັບເດດສຳເລັດ" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Admin ອະນຸມັດ
exports.approve = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: "ສະເພາະ Admin ເທົ່ານັ້ນ" });

        const booking = await Booking.findByPk(req.params.id);
        if (!booking) return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນ" });

        await Booking.update(req.body, { where: { id: req.params.id } });
        res.status(200).json({ success: true, message: "ປ່ຽນສະຖານະສຳເລັດ" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. ລຶບການຈອງ
exports.destroy = async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id);
        if (!booking) return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນ" });

        if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
            return res.status(403).json({ message: "ບໍ່ມີສິດລຶບ" });
        }

        await Booking.destroy({ where: { id: req.params.id } });
        res.status(200).json({ success: true, message: "ລຶບສຳເລັດ" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 6. ກວດສອບຫ້ອງຫວ່າງ
exports.checkAvailableRooms = async (req, res) => {
    try {
        const { start_time, end_time } = req.query;
        const busyBookings = await Booking.findAll({
            where: {
                status: { [Op.in]: ['Approved', 'Pending'] },
                end_time: { [Op.gt]: new Date() },
                [Op.and]: [
                    {
                        start_time: { [Op.lt]: new Date(end_time) },
                        end_time: { [Op.gt]: new Date(start_time) }
                    }
                ]
            },
            attributes: ['room_id'],
            raw: true
        });

        const busyRoomIds = busyBookings.map(b => b.room_id);
        const availableRooms = await Room.findAll({
            where: {
                id: { [Op.notIn]: busyRoomIds.length > 0 ? busyRoomIds : [0] }
            }
        });

        res.status(200).json({ success: true, data: availableRooms });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};