const db = require('../models');
const { Booking, Room, User, BookingEquipment, Equipment, sequelize } = db;
// Helper Function: ກວດເຊັກເວລາທັບຊ້ອນ
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

// 1. ດຶງຂໍ້ມູນການຈອງທັງໝົດ
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

// 2. Insert ການຈອງໃໝ່ (Transaction)
exports.insert = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { room_id, start_time, end_time, attendeeCount, title, equipments } = req.body;

        // 1. ສ້າງຂໍ້ມູນການຈອງຫຼັກ
        const newBooking = await Booking.create({
            title,
            room_id,         // ໃຊ້ room_id ຕາມທີ່ເຈົ້າບອກ
            user_id: req.user.id, // ໃຊ້ user_id ຕາມທີ່ເຈົ້າບອກ
            start_time,
            end_time,
            attendeeCount,
            status: 'Pending'
        }, { transaction: t });

        // 2. ຖ້າມີການເລືອກອຸປະກອນ
        // ຫາສ່ວນ bulkCreate ໃນ insert function ແລ້ວແກ້ບ່ອນ map ແບບນີ້:
        // ໃນ controllers/bookingController.js ສ່ວນ insert
            // ໃນ controllers/bookingController.js (ສ່ວນ insert)
        if (equipments && Array.isArray(equipments) && equipments.length > 0) {
            const equipmentData = equipments.map(item => ({
                booking_id: newBooking.id,
                equipment_id: item.equipment_id,
                quantity: item.quantity || 1 // ⭐ ສົ່ງໄປຫາ column quantity ໃນ table bookingequipments
            }));
            
            await BookingEquipment.bulkCreate(equipmentData, { transaction: t });
        }
        await t.commit();
        res.status(201).json({ success: true, message: "ບັນທຶກການຈອງ ແລະ ອຸປະກອນສຳເລັດ!", data: newBooking });

    } catch (error) {
        if (t) await t.rollback();
        console.error("Error Insert:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// 3. ອັບເດດ
exports.update = async (req, res) => {
    try {
        await Booking.update(req.body, { where: { id: req.params.id } });
        res.status(200).json({ success: true, message: "ອັບເດດສຳເລັດ" });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// 4. ລຶບ
exports.destroy = async (req, res) => {
    try {
        await Booking.destroy({ where: { id: req.params.id } });
        res.status(200).json({ success: true, message: "ລຶບສຳເລັດ" });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// 5. Admin Approve
exports.approve = async (req, res) => {
    try {
        const { status, admin_comment } = req.body;
        await Booking.update({ status, admin_comment }, { where: { id: req.params.id } });
        res.status(200).json({ success: true, message: "ປ່ຽນສະຖານະສຳເລັດ" });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// 6. ກວດຫ້ອງຫວ່າງ
exports.checkAvailableRooms = async (req, res) => {
    try {
        const { start_time, end_time } = req.query;
        const busyBookings = await Booking.findAll({
            where: {
                status: { [Op.in]: ['Approved', 'Pending'] },
                start_time: { [Op.lt]: new Date(end_time) },
                end_time: { [Op.gt]: new Date(start_time) }
            },
            attributes: ['room_id'], raw: true
        });
        const busyRoomIds = busyBookings.map(b => b.room_id);
        const availableRooms = await Room.findAll({
            where: { id: { [Op.notIn]: busyRoomIds.length > 0 ? busyRoomIds : [0] } }
        });
        res.status(200).json({ success: true, data: availableRooms });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};