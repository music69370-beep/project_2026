const { Approval, Booking, Notification, User, Room, sequelize } = require('../models');
const nodemailer = require('nodemailer');

// 1. Function ສຳລັບການອະນຸມັດ ແລະ ສົ່ງ Email
exports.submitApproval = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { booking_id, status, comment } = req.body;
        const admin_id = 7; // ID ຂອງ Admin ທີ່ເຮັດລາຍການ

        // ກວດສອບຂໍ້ມູນການຈອງ ພ້ອມດຶງຂໍ້ມູນ User ແລະ Room ເພື່ອໃຊ້ສົ່ງ Email
        const booking = await Booking.findByPk(booking_id, {
            include: [
                { model: User, as: 'user' },
                { model: Room, as: 'room' }
            ]
        });
        
        if (!booking) {
            await t.rollback();
            return res.status(404).json({ success: false, message: "❌ ບໍ່ພົບລາຍການຈອງນີ້" });
        }

        // ກວດສອບວ່າເຄີຍອະນຸມັດໄປແລ້ວຫຼືບໍ່
        if (booking.status !== 'Pending') {
            await t.rollback();
            return res.status(400).json({ 
                success: false, 
                message: `❌ ລາຍການນີ້ຖືກດຳເນີນການໄປແລ້ວ (ສະຖານະປັດຈຸບັນ: ${booking.status})` 
            });
        }

        // A. ອັບເດດສະຖານະໃນ Table bookings
        await Booking.update(
            { status: status }, 
            { where: { id: booking_id }, transaction: t }
        );

        // B. ບັນທຶກແຈ້ງເຕືອນລົງໃນ Table notifications
        await Notification.create({
            user_id: booking.user_id,
            booking_id: booking.id,
            message: `ການຈອງຫ້ອງ "${booking.room ? booking.room.room_name : booking.title}" ຂອງທ່ານແມ່ນ: ${status === 'Approved' ? 'ອະນຸມັດ' : 'ປະຕິເສດ'}.`,
            is_read: false
        }, { transaction: t });

        // C. ບັນທຶກປະຫວັດລົງໃນ Table approvals
        await Approval.create({
            booking_id,
            user_id: admin_id,
            status,
            comment,
            approval_date: new Date()
        }, { transaction: t });

        // ຢືນຢັນການບັນທຶກລົງ Database
        await t.commit(); 

        // 🚀 ເລີ່ມສົ່ງ Gmail ແຈ້ງເຕືອນ
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
                html: `
                    <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                        <h2 style="color: ${status === 'Approved' ? '#28a745' : '#dc3545'};">
                            ຜົນການຈອງ: ${status}
                        </h2>
                        <p><b>ຫົວຂໍ້:</b> ${booking.title}</p>
                        <p><b>ຫ້ອງ:</b> ${booking.room ? booking.room.room_name : 'ບໍ່ລະບຸ'}</p>
                        <p><b>ໝາຍເຫດຈາກ Admin:</b> ${comment || 'ບໍ່ມີ'}</p>
                        <hr>
                        <p style="font-size: 12px; color: #888;">ກະລຸນາກວດສອບລາຍລະອຽດເພີ່ມເຕີມໃນລະບົບ.</p>
                    </div>
                `
            };

            // ສົ່ງ Email (Background process)
            transporter.sendMail(mailOptions).catch(err => console.log("🔥 Email Error: ", err));
        }

        res.status(200).json({ success: true, message: "✅ ດຳເນີນການສຳເລັດ ແລະ ສົ່ງ Email ແລ້ວ!" });

    } catch (error) {
        if (t) await t.rollback();
        console.error("Error: ", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Function ສຳລັບດຶງລາຍການຈອງທັງໝົດ (ສຳລັບໜ້າ Admin)
// ດຶງລາຍການຈອງທີ່ "ຍັງບໍ່ທັນອະນຸມັດ" (Pending) ເທົ່ານັ້ນ
// ດຶງລາຍການຈອງທີ່ສະຖານະເປັນ 'Pending' ເທົ່ານັ້ນ
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.findAll({
            // ⭐ ກັ່ນຕອງເອົາສະເພາະ Pending
            where: { 
                status: 'Pending' 
            },
            include: [
                { 
                    model: User, 
                    as: 'user', 
                    // ດຶງຂໍ້ມູນພື້ນຖານຂອງຜູ້ຈອງ
                    attributes: ['user_id', 'full_name', 'email'] 
                },
                { 
                    model: Room, 
                    as: 'room', 
                    // ກວດສອບຊື່ Column ໃນຖານຂໍ້ມູນເຈົ້າອີກຄັ້ງ (ຖ້າ Error ໃຫ້ຕັດ room_number ອອກ)
                    attributes: ['id', 'room_name'] 
                }
            ],
            // ເອົາລາຍການໃໝ່ລົງທະບຽນກ່ອນ (ລຽງຕາມເວລາສ້າງ)
            order: [['createdAt', 'DESC']] 
        });

        res.status(200).json({
            success: true,
            total_pending: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.error("🔥 Error fetching pending bookings:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};