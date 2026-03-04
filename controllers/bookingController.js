const db = require('../models');
const { Booking, Room, User, BookingEquipment, Equipment, sequelize } = db;
const { Op } = db.Sequelize;

// --- Helper Function: ກວດເຊັກເວລາທັບຊ້ອນ (Overlap) ---
const checkOverlap = async (room_id, start_time, end_time, excludeBookingId = null) => {
    return await Booking.findOne({
        where: {
            room_id,
            status: { [Op.in]: ['Pending', 'Approved'] },
            [Op.and]: [
                {
                    start_time: { [Op.lt]: new Date(end_time) },
                    end_time: { [Op.gt]: new Date(start_time) }
                }
            ],
            ...(excludeBookingId && { id: { [Op.ne]: excludeBookingId } })
        }
    });
};

// 1. ດຶງຂໍ້ມູນການຈອງທັງໝົດ (ພ້ອມລາຍຊື່ອຸປະກອນ)
exports.index = async (req, res) => {
    try {
        const rows = await Booking.findAll({
            include: [
                { model: Room, as: 'room', attributes: ['room_name', 'location'] },
                { model: User, as: 'user', attributes: ['full_name', 'department'] },
                { 
                    model: BookingEquipment, 
                    as: 'equipments', 
                    include: [{ model: Equipment, as: 'details' }] 
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. ສ້າງການຈອງໃໝ່ + ບັນທຶກອຸປະກອນ (ໃຊ້ Transaction)
exports.insert = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { room_id, start_time, end_time, attendeeCount, title, equipments } = req.body;

        // Validation: ກວດເວລາຊ້ຳ
        const isConflict = await checkOverlap(room_id, start_time, end_time);
        if (isConflict) {
            await t.rollback();
            return res.status(400).json({ message: "ເວລານີ້ມີຄົນຈອງແລ້ວ" });
        }

        // Validation: ກວດຄວາມຈຸຫ້ອງ
        const room = await Room.findByPk(room_id);
        if (!room) {
            await t.rollback();
            return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນຫ້ອງ" });
        }
        if (attendeeCount > room.capacity) {
            await t.rollback();
            return res.status(400).json({ message: `ຫ້ອງນີ້ຮັບໄດ້ສູງສຸດ ${room.capacity} ຄົນ` });
        }

        // A. ບັນທຶກລົງ Table bookings
        const newBooking = await Booking.create({
            title,
            room_id,
            start_time: new Date(start_time),
            end_time: new Date(end_time),
            attendeeCount,
            user_id: req.user.id,
            status: 'Pending'
        }, { transaction: t });

        // B. ບັນທຶກລົງ Table bookingequipments (ໃຊ້ຊື່ Field ໃຫ້ກົງກັບ Model ທີ່ແກ້)
        if (equipments && Array.isArray(equipments) && equipments.length > 0) {
            const equipmentData = equipments.map(item => ({
                Bookingid: newBooking.id,      // ອ້າງອີງຕາມ Model: Bookingid
                Equipmentid: item.equipment_id, // ອ້າງອີງຕາມ Model: Equipmentid
                quantity: item.quantity || 1
            }));
            await BookingEquipment.bulkCreate(equipmentData, { transaction: t });
        }

        await t.commit();
        res.status(201).json({ success: true, message: "ບັນທຶກການຈອງສຳເລັດ", data: newBooking });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. ອັບເດດຂໍ້ມູນການຈອງ
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findByPk(id);
        if (!booking) return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນການຈອງ" });

        // ກວດສອບສິດ (Admin ຫຼື ເຈົ້າຂອງ)
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
            if (isConflict) return res.status(400).json({ message: "ເວລາໃໝ່ທີ່ເລືອກມີຄົນຈອງແລ້ວ" });
        }

        await Booking.update(req.body, { where: { id } });
        res.status(200).json({ success: true, message: "ອັບເດດຂໍ້ມູນສຳເລັດ" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. ລຶບການຈອງ
exports.destroy = async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id);
        if (!booking) return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນ" });

        if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
            return res.status(403).json({ message: "ທ່ານບໍ່ມີສິດລຶບລາຍການນີ້" });
        }

        await Booking.destroy({ where: { id: req.params.id } });
        res.status(200).json({ success: true, message: "ລຶບການຈອງສຳເລັດ" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. Admin ອະນຸມັດ ຫຼື ປະຕິເສດ
exports.approve = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "ສະເພາະ Admin ເທົ່ານັ້ນທີ່ສາມາດອະນຸມັດໄດ້" });
        }
        const { status, admin_comment } = req.body;
        const booking = await Booking.findByPk(req.params.id);
        if (!booking) return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນ" });

        await Booking.update({ status, admin_comment }, { where: { id: req.params.id } });
        res.status(200).json({ success: true, message: `ປ່ຽນສະຖານະເປັນ ${status} ສຳເລັດ` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 6. ກວດສອບຫ້ອງຫວ່າງຕາມຊ່ວງເວລາ
exports.checkAvailableRooms = async (req, res) => {
    try {
        const { start_time, end_time } = req.query;
        if (!start_time || !end_time) {
            return res.status(400).json({ message: "ກະລຸນາລະບຸເວລາ start_time ແລະ end_time" });
        }

        const busyBookings = await Booking.findAll({
            where: {
                status: { [Op.in]: ['Approved', 'Pending'] },
                start_time: { [Op.lt]: new Date(end_time) },
                end_time: { [Op.gt]: new Date(start_time) }
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