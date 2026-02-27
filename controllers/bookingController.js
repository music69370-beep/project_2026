const { Booking, Room, User } = require('../models');
const { Op } = require('sequelize');

// 1. ດຶງຂໍ້ມູນການຈອງທັງໝົດ
exports.index = async (req, res) => {
    try {
        const bookings = await Booking.findAll({
            include: [
                { model: Room, attributes: ['room_name', 'location'] },
                { model: User, attributes: ['full_name', 'department'] }
            ],
            order: [['start_time', 'DESC']]
        });
        res.status(200).json({ message: "success", data: bookings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. ສ້າງການຈອງໃໝ່ (ພ້ອມກວດເຊັກເວລາຊ້ຳ)
exports.insert = async (req, res) => {
    try {
        const { room_id, start_time, end_time } = req.body;

        // --- Logic: ກວດເຊັກເວລາຊ້ຳ (Overlap Check) ---
        const isConflict = await Booking.findOne({
            where: {
                room_id,
                status: { [Op.ne]: 'Rejected' }, // ບໍ່ນັບລາຍການທີ່ຖືກປະຕິເສດແລ້ວ
                [Op.or]: [
                    {
                        start_time: { [Op.between]: [start_time, end_time] }
                    },
                    {
                        end_time: { [Op.between]: [start_time, end_time] }
                    }
                ]
            }
        });

        if (isConflict) {
            return res.status(400).json({ 
                message: "ຂໍອະໄພ! ຫ້ອງນີ້ຖືກຈອງແລ້ວໃນຊ່ວງເວລາດັ່ງກ່າວ." 
            });
        }

        const newBooking = await Booking.create(req.body);
        res.status(201).json({ message: "ສົ່ງຄຳຂໍຈອງສຳເລັດ!", data: newBooking });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};