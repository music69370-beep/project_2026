const { Approval, Booking, sequelize } = require('../models');

exports.submitApproval = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { booking_id, status, comment } = req.body;
        const admin_id = 7; // ໃຊ້ ID Admin ທີ່ເຈົ້າກຳນົດໄວ້

        // 1. ⭐ ກວດສອບກ່ອນວ່າ Booking ນີ້ມີຢູ່ແທ້ບໍ່ ແລະ ສະຖານະເປັນແນວໃດ
        const booking = await Booking.findByPk(booking_id);
        
        if (!booking) {
            await t.rollback();
            return res.status(404).json({ success: false, message: "❌ ບໍ່ພົບລາຍການຈອງນີ້" });
        }

        // 2. ⭐ ຖ້າສະຖານະບໍ່ແມ່ນ 'Pending' ແປວ່າມັນຖືກ Approved ຫຼື Rejected ໄປແລ້ວ
        if (booking.status !== 'Pending') {
            await t.rollback();
            return res.status(400).json({ 
                success: false, 
                message: `❌ ລາຍການນີ້ຖືກດຳເນີນການໄປແລ້ວ (ສະຖານະປັດຈຸບັນ: ${booking.status})` 
            });
        }

        // 3. ອັບເດດສະຖານະໃນ Table bookings
        await Booking.update(
            { status: status }, 
            { where: { id: booking_id }, transaction: t }
        );

        // 4. ບັນທຶກປະຫວັດລົງໃນ Table approvals
        await Approval.create({
            booking_id,
            user_id: admin_id,
            status,
            comment,
            approval_date: new Date()
        }, { transaction: t });

        await t.commit();
        res.status(200).json({ success: true, message: "✅ ດຳເນີນການສຳເລັດ!" });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ success: false, message: error.message });
    }
};