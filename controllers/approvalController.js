// 1. Import Model ໂດຍກົງເພື່ອແກ້ "db is not defined"
const { 
    Approval, 
    Booking, 
    Notification, 
    User, 
    Room, 
    BookingEquipment, 
    Equipment, 
    BookingCatering, 
    CateringItem, 
    sequelize 
} = require('../models');

const nodemailer = require('nodemailer');

// --- ດຶງຂໍ້ມູນການຈອງ (GET) ---
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.findAll({
            where: { status: 'Pending' },
            include: [
                { 
                    model: User, 
                    as: 'user', 
                    attributes: ['user_id', 'full_name', 'email'] 
                },
                { 
                    model: Room, 
                    as: 'room', 
                    attributes: ['id', 'room_name'] 
                },
                {
                    model: BookingEquipment,
                    as: 'equipments',
                    include: [
                        { 
                            model: Equipment, 
                            as: 'details'
                            // attributes: ['equipment_name'] // ⚠️ ປິດໄວ້ກ່ອນເພື່ອແກ້ Unknown Column
                        }
                    ]
                },
                {
                    model: BookingCatering,
                    as: 'caterings',
                    include: [
                        { 
                            model: CateringItem, 
                            as: 'item_details'
                            // attributes: ['item_name'] // ⚠️ ປິດໄວ້ກ່ອນເພື່ອຄວາມປອດໄພ
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        console.error("🔥 Error Detail:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// --- ອະນຸມັດການຈອງ (POST) ---
exports.submitApproval = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { booking_id, status, comment } = req.body;
        const admin_id = 7; 

        const booking = await Booking.findByPk(booking_id, {
            include: [{ model: User, as: 'user' }]
        });
        
        if (!booking) {
            await t.rollback();
            return res.status(404).json({ success: false, message: "❌ ບໍ່ພົບລາຍການຈອງ" });
        }

        await Booking.update({ status }, { where: { id: booking_id }, transaction: t });

        await Notification.create({
            user_id: booking.user_id,
            booking_id: booking.id,
            message: `ການຈອງ "${booking.title}" ຂອງທ່ານແມ່ນ: ${status}`,
            is_read: false
        }, { transaction: t });

        await Approval.create({
            booking_id,
            user_id: admin_id,
            status,
            comment,
            approval_date: new Date()
        }, { transaction: t });

        await t.commit();

        // ສົ່ງ Email (ກວດສອບ Email ຜູ້ຮັບໃຫ້ຖືກຕ້ອງເພື່ອບໍ່ໃຫ້ Bounce Back)
        if (booking.user && booking.user.email) {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'pern69370@gmail.com',
                    pass: 'ebrk mixc jwvm ndxj'
                }
            });

            const mailOptions = {
                from: '"ລະບົບຈອງຫ້ອງປະຊຸມ" <pern69370@gmail.com>',
                to: booking.user.email,
                subject: `ແຈ້ງຜົນການຈອງ: ${booking.title}`,
                text: `ການຈອງຂອງທ່ານແມ່ນ ${status}. ເຫດຜົນ: ${comment}`
            };

            transporter.sendMail(mailOptions).catch(err => console.log("📧 Email Error:", err));
        }

        res.status(200).json({ success: true, message: "✅ ດຳເນີນການສຳເລັດ!" });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ success: false, message: error.message });
    }
};