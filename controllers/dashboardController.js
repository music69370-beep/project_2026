const { Booking, Room, User, Equipment, CateringItem, BookingEquipment, BookingCatering, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getStats = async (req, res) => {
    try {
        // --- 1. ກຽມຂໍ້ມູນເວລາ (ຍ້າຍມາໄວ້ໃນນີ້ເພື່ອໃຫ້ Update ຕະຫຼອດ) ---
        const now = new Date();
        const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); 
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // --- 2. ດຶງຂໍ້ມູນ Stats ທົ່ວໄປ (1-10) ---
        const totalPending = await Booking.count({ where: { status: 'Pending' } });

        const todayBookings = await Booking.count({
            where: { start_time: { [Op.between]: [todayStart, todayEnd] } }
        });

        const allCount = await Booking.count();
        const approvedCount = await Booking.count({ where: { status: 'Approved' } });
        const approvalRate = allCount > 0 ? ((approvedCount / allCount) * 100).toFixed(2) : 0;

        const topRoom = await Booking.findAll({
            attributes: ['room_id', [sequelize.fn('COUNT', sequelize.col('room_id')), 'count']],
            group: ['room_id'], order: [[sequelize.literal('count'), 'DESC']], limit: 1,
            include: [{ model: Room, as: 'room', attributes: ['room_name'] }]
        });

        const topEquipment = await BookingEquipment.findAll({
            attributes: ['equipment_id', [sequelize.fn('SUM', sequelize.col('quantity')), 'total_qty']],
            group: ['equipment_id'], order: [[sequelize.literal('total_qty'), 'DESC']], limit: 1,
            include: [{ model: Equipment, as: 'details', attributes: ['item_name'] }]
        });

        const totalUsers = await User.count();
        const recurringCount = await Booking.count({ where: { is_recurring: true } });
        const singleCount = await Booking.count({ where: { is_recurring: false } });
        const totalRejected = await Booking.count({ where: { status: 'Rejected' } });

        const topCatering = await BookingCatering.findAll({
            attributes: ['cateringItem_id', [sequelize.fn('SUM', sequelize.col('quantity')), 'total_qty']],
            group: ['cateringItem_id'], order: [[sequelize.literal('total_qty'), 'DESC']], limit: 1,
            include: [{ model: CateringItem, as: 'item_details', attributes: ['Name'] }]
        });

        const upcoming = await Booking.findAll({
            where: { start_time: { [Op.gt]: now }, status: 'Approved' },
            limit: 5, order: [['start_time', 'ASC']],
            include: [{ model: Room, as: 'room', attributes: ['room_name'] }]
        });

        // --- 3. ດຶງຂໍ້ມູນສຳລັບ Charts (ສະເພາະເດືອນນີ້) ---
        const dailyStats = await Booking.findAll({
            attributes: [
                [sequelize.fn('DATE', sequelize.col('start_time')), 'date'], 
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: { start_time: { [Op.between]: [startOfMonth, endOfMonth] } },
            group: [sequelize.fn('DATE', sequelize.col('start_time'))],
            order: [[sequelize.fn('DATE', sequelize.col('start_time')), 'ASC']]
        });

        const statusStats = await Booking.findAll({
            attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            where: { start_time: { [Op.between]: [startOfMonth, endOfMonth] } },
            group: ['status']
        });

        // --- 4. ສົ່ງ Response ---
        res.json({
            success: true,
            stats: {
                totalPending,
                todayBookings,
                approvalRate: `${approvalRate}%`,
                totalUsers,
                topRoom: topRoom[0] || null,
                topEquipment: topEquipment[0] || null,
                topCatering: topCatering[0] || null,
                bookingTypes: { recurring: recurringCount, single: singleCount },
                totalRejected,
                upcoming,
                charts: {
                    dailyTrend: dailyStats,
                    statusSummary: statusStats
                }
            }
        });
    } catch (error) {
        console.error("🔥 Dashboard Stats Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};