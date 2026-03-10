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

// --- 1. ດຶງຂໍ້ມູນການຈອງທີ່ Pending (GET) ---
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.findAll({
            where: { status: 'Pending' },
            include: [
                { model: User, as: 'user', attributes: ['user_id', 'full_name', 'email'] },
                { model: Room, as: 'room', attributes: ['id', 'room_name'] },
                {
                    model: BookingEquipment, as: 'equipments',
                    include: [{ model: Equipment, as: 'details' }]
                },
                {
                    model: BookingCatering, as: 'caterings',
                    include: [{ model: CateringItem, as: 'item_details' }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        console.error("🔥 Error getAllBookings:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- 2. ອະນຸມັດ ຫຼື ປະຕິເສດການຈອງ (POST) ---
exports.submitApproval = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { booking_id, status, comment } = req.body;
        
        // ⭐ ດຶງ ID ຈາກ Token ທີ່ Middleware ຖອດລະຫັດມາໃຫ້
        const admin_id = req.user ? req.user.id : null;

        // ⭐ ດຶງຂໍ້ມູນການຈອງ ພ້ອມທັງຂໍ້ມູນ User ແລະ Room ເພື່ອໃຊ້ໃນ Email
        const booking = await Booking.findByPk(booking_id, {
            include: [
                { model: User, as: 'user' },
                { model: Room, as: 'room' }
            ]
        });
        
        if (!booking) {
            await t.rollback();
            return res.status(404).json({ success: false, message: "❌ ບໍ່ພົບລາຍການຈອງ" });
        }

        // A. ອັບເດດສະຖານະໃນ Table Bookings
        await Booking.update({ status }, { where: { id: booking_id }, transaction: t });

        // B. ສ້າງການແຈ້ງເຕືອນໃຫ້ຜູ້ຈອງ
        await Notification.create({
            user_id: booking.user_id,
            booking_id: booking.id,
            message: `ການຈອງ "${booking.title}" ຂອງທ່ານແມ່ນ: ${status === 'Approved' ? '✅ ອະນຸມັດແລ້ວ' : '❌ ປະຕິເສດ'}`,
            is_read: false
        }, { transaction: t });

        // C. ບັນທຶກປະຫວັດການອະນຸມັດ (Approvals)
        await Approval.create({
            booking_id,
            user_id: admin_id,
            status,
            comment: comment || (status === 'Approved' ? 'ຜ່ານການພິຈາລະນາ' : 'ບໍ່ຜ່ານການພິຈາລະນາ'),
            approval_date: new Date()
        }, { transaction: t });

        await t.commit();

        // D. ສົ່ງ Email ແຈ້ງຜົນແບບ HTML (ສວຍງາມ)
        if (booking.user && booking.user.email) {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'pern69370@gmail.com',
                    pass: 'ebrk mixc jwvm ndxj' // ⭐ App Password ຂອງເຈົ້າ
                }
            });

            const mailOptions = {
                from: '"ລະບົບຈອງຫ້ອງປະຊຸມ" <pern69370@gmail.com>',
                to: booking.user.email,
                subject: `ແຈ້ງຜົນການຈອງ: ${booking.title}`,
                html: `
                    <div style="font-family: 'Noto Sans Lao', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                        <h2 style="color: #2c3e50; text-align: center;">ຜົນການພິຈາລະນາການຈອງຫ້ອງປະຊຸມ</h2>
                        <p>ສະບາຍດີ ທ່ານ <b>${booking.user.full_name}</b>,</p>
                        <p>ພວກເຮົາຂໍແຈ້ງຜົນການຈອງຫ້ອງປະຊຸມຂອງທ່ານ ໂດຍມີລາຍລະອຽດດັ່ງນີ້:</p>
                        
                        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><b>ຫົວຂໍ້:</b> ${booking.title}</p>
                            <p style="margin: 5px 0;"><b>ຫ້ອງປະຊຸມ:</b> ${booking.room ? booking.room.room_name : 'ບໍ່ລະບຸ'}</p>
                            <p style="margin: 5px 0;"><b>ເວລາ:</b> ${new Date(booking.start_time).toLocaleString('lo-LA')} - ${new Date(booking.end_time).toLocaleString('lo-LA')}</p>
                            <p style="margin: 5px 0;"><b>ສະຖານະ:</b> 
                                <span style="color: ${status === 'Approved' ? '#27ae60' : '#e74c3c'}; font-weight: bold;">
                                    ${status === 'Approved' ? '✅ ອະນຸມັດແລ້ວ' : '❌ ປະຕິເສດ'}
                                </span>
                            </p>
                            <p style="margin: 5px 0;"><b>ໝາຍເຫດຈາກ Admin:</b> ${comment || '-'}</p>
                        </div>

                        <p>ທ່ານສາມາດກວດສອບລາຍລະອຽດເພີ່ມເຕີມໄດ້ທີ່ເວັບໄຊທ໌ຂອງພວກເຮົາ.</p>
                        <p style="text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 30px;">
                            --- ນີ້ແມ່ນການແຈ້ງເຕືອນອັດຕະໂນມັດ ຈາກລະບົບຈອງຫ້ອງປະຊຸມ ---
                        </p>
                    </div>
                `
            };

            transporter.sendMail(mailOptions).catch(err => console.error("📧 Email Error:", err));
        }

        res.status(200).json({ success: true, message: `✅ ດຳເນີນການ ${status} ສຳເລັດ!` });
    } catch (error) {
        if (t) await t.rollback();
        console.error("🔥 Approval Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};