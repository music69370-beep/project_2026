const { Booking, Room, User, Equipment, CateringItem, BookingEquipment, BookingCatering, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getStats = async (req, res) => {
    try {
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

        // 1. Pending ທັງໝົດ
        const totalPending = await Booking.count({ where: { status: 'Pending' } });

        // 2. ການຈອງມື້ນີ້
        const todayBookings = await Booking.count({
            where: { start_time: { [Op.between]: [todayStart, todayEnd] } }
        });

        // 3. ອັດຕາການອະນຸມັດ (%)
        const allCount = await Booking.count();
        const approvedCount = await Booking.count({ where: { status: 'Approved' } });
        const approvalRate = allCount > 0 ? ((approvedCount / allCount) * 100).toFixed(2) : 0;

        // 4. ຫ້ອງທີ່ຮັອດທີ່ສຸດ
        const topRoom = await Booking.findAll({
            attributes: ['room_id', [sequelize.fn('COUNT', sequelize.col('room_id')), 'count']],
            group: ['room_id'], order: [[sequelize.literal('count'), 'DESC']], limit: 1,
            include: [{ model: Room, as: 'room', attributes: ['room_name'] }]
        });

        // 5. ອຸປະກອນທີ່ໃຊ້ຫຼາຍທີ່ສຸດ
        const topEquipment = await BookingEquipment.findAll({
            attributes: ['equipment_id', [sequelize.fn('SUM', sequelize.col('quantity')), 'total_qty']],
            group: ['equipment_id'], order: [[sequelize.literal('total_qty'), 'DESC']], limit: 1,
            include: [{ model: Equipment, as: 'details', attributes: ['item_name'] }]
        });

        // 6. ຜູ້ໃຊ້ທັງໝົດ
        const totalUsers = await User.count();

        // 7. Recurring vs Single
        const recurringCount = await Booking.count({ where: { is_recurring: true } });
        const singleCount = await Booking.count({ where: { is_recurring: false } });

        // 8. ລາຍການທີ່ຖືກ Reject
        const totalRejected = await Booking.count({ where: { status: 'Rejected' } });

        // 9. ອາຫານທີ່ສັ່ງຫຼາຍທີ່ສຸດ (⭐ ແກ້ບ່ອນນີ້)
        const topCatering = await BookingCatering.findAll({
            attributes: ['cateringItem_id', [sequelize.fn('SUM', sequelize.col('quantity')), 'total_qty']],
            group: ['cateringItem_id'], order: [[sequelize.literal('total_qty'), 'DESC']], limit: 1,
            include: [{ 
                model: CateringItem, 
                as: 'item_details', 
                attributes: ['Name'] // <--- ປ່ຽນຈາກ item_name ເປັນ Name ຕາມ DB ຂອງເຈົ້າ
            }]
        });

        // 10. ລາຍການທີ່ກຳລັງຈະມາຮອດ (5 ອັນລ່າສຸດ)
        const upcoming = await Booking.findAll({
            where: { start_time: { [Op.gt]: new Date() }, status: 'Approved' },
            limit: 5, order: [['start_time', 'ASC']],
            include: [{ model: Room, as: 'room', attributes: ['room_name'] }]
        });

        res.json({
            success: true,
            stats: {
                totalPending, approvalRate: `${approvalRate}%`,
                todayBookings, totalUsers,
                topRoom: topRoom[0] || null,
                topEquipment: topEquipment[0] || null,
                topCatering: topCatering[0] || null,
                bookingTypes: { recurring: recurringCount, single: singleCount },
                totalRejected, upcoming
            }
        });
    } catch (error) {
        console.error("🔥 Dashboard Stats Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};