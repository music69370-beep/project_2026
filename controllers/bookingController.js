const models = require('../models');
const { Op } = require('sequelize');

// --- Helper Function: ກວດເຊັກເວລາຊ້ຳ (ປັບປຸງໃຫ້ Ignore ລາຍການທີ່ໝົດເວລາແລ້ວ) ---
const checkOverlap = async (room_id, start_time, end_time, excludeBookingId = null) => {
    const now = new Date();
    return await models.Booking.findOne({
        where: {
            room_id,
            // ກວດສະເພາະລາຍການທີ່ຍັງ 'Pending' ຫຼື 'Approved'
            status: { [Op.in]: ['Pending', 'Approved'] }, 
            // ແລະ ຕ້ອງແມ່ນລາຍການທີ່ "ຍັງບໍ່ທັນໝົດເວລາ" (ເວລາສິ້ນສຸດ > ປັດຈຸບັນ)
            // ຖ້າໝົດເວລາແລ້ວ ຖືວ່າຫ້ອງນັ້ນຫວ່າງ ສາມາດຈອງຕໍ່ໄດ້
            end_time: { [Op.gt]: now }, 
            ...(excludeBookingId && { id: { [Op.ne]: excludeBookingId } }),
            [Op.and]: [
                {
                    // Logic ກວດສອບການທັບຊ້ອນຂອງເວລາ
                    start_time: { [Op.lt]: end_time }, 
                    end_time: { [Op.gt]: start_time }
                }
            ]
        }
    });
};

// 1. ດຶງຂໍ້ມູນການຈອງ (Pagination & Search) + Virtual Status
exports.index = async (req, res) => {
    try {
        const { room_name, start_date, end_date, page = 1, limit = 10 } = req.query; 
        const offset = (page - 1) * limit;
        let whereCondition = {};

        if (start_date && end_date) {
            whereCondition.start_time = { [Op.between]: [new Date(start_date), new Date(end_date)] };
        }

        const { count, rows } = await models.Booking.findAndCountAll({
            where: whereCondition,
            limit: parseInt(limit),
            offset: parseInt(offset),
            include: [
                {
                    model: models.Room,
                    as: 'room',
                    where: room_name ? { room_name: { [Op.like]: `%${room_name}%` } } : null, 
                    attributes: ['room_name', 'location']
                },
                {
                    model: models.User,
                    as: 'user',
                    attributes: ['full_name', 'department']
                }
            ],
            order: [['createdAt', 'DESC']] 
        });

        // 🔥 ສ່ວນທີ່ປັບປຸງໃໝ່: Logic ການຈັດການ Status ແບບລະອຽດ
        const now = new Date();
        const updatedRows = rows.map(item => {
            const booking = item.get({ plain: true });
            const startTime = new Date(booking.start_time);
            const endTime = new Date(booking.end_time);

            // ເຮົາຈະປ່ຽນ Status ແບບ Virtual ສະເພາະລາຍການທີ່ Approved ແລ້ວ
            if (booking.status === 'Approved') {
                if (now >= startTime && now <= endTime) {
                    booking.status = 'In Progress'; // ຕອນນີ້ກຳລັງປະຊຸມຢູ່
                } else if (now > endTime) {
                    booking.status = 'Completed';   // ປະຊຸມສຳເລັດແລ້ວ
                }
            } else if (booking.status === 'Pending' && now > endTime) {
                booking.status = 'Expired'; // ຖ້າໝົດເວລາແລ້ວແຕ່ Admin ຍັງບໍ່ທັນກົດຫຍັງ
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

// 2. ສ້າງການຈອງໃໝ່
exports.insert = async (req, res) => {
    try {
        const { room_id, start_time, end_time, attendeeCount, title } = req.body;
        const userIdFromToken = req.user.id;

        // 1. ແປງຄ່າໃຫ້ເປັນ Date Object ເພື່ອປ້ອງກັນຄ່າ 0000-00-00
        const startDateObj = new Date(start_time);
        const endDateObj = new Date(end_time);

        // 2. ກວດສອບວ່າການແປງວັນທີສຳເລັດຫຼືບໍ່
        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
            return res.status(400).json({ message: "ຮູບແບບວັນທີບໍ່ຖືກຕ້ອງ" });
        }

        // 3. ເງື່ອນໄຂພື້ນຖານ (ກວດສອບເວລາຍ້ອນຫຼັງ)
        if (startDateObj < new Date()) {
            return res.status(400).json({ message: "ບໍ່ສາມາດຈອງເວລາຍ້ອນຫຼັງໄດ້" });
        }
        if (endDateObj <= startDateObj) {
            return res.status(400).json({ message: "ເວລາສິ້ນສຸດຕ້ອງຫຼັງຈາກເວລາເລີ່ມຕົ້ນ" });
        }

        // 4. ກວດເຊັກຂໍ້ມູນຫ້ອງ ແລະ Capacity
        const room = await models.Room.findByPk(room_id);
        if (!room) return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນຫ້ອງ" });
        
        if (attendeeCount > room.capacity) {
            return res.status(400).json({ message: `ຫ້ອງນີ້ຮັບໄດ້ສູງສຸດ ${room.capacity} ຄົນ` });
        }

        // 5. ກວດເຊັກເວລາທັບຊ້ອນ (Overlap)
        // ສົ່ງຄ່າທີ່ເປັນ Date Object ເຂົ້າໄປກວດສອບ
        const isConflict = await checkOverlap(room_id, startDateObj, endDateObj);
        if (isConflict) {
            return res.status(400).json({ message: "ຫ້ອງນີ້ຖືກຈອງແລ້ວໃນຊ່ວງເວລານີ້" });
        }

        // 6. ບັນທຶກລົງຖານຂໍ້ມູນ
        const newBooking = await models.Booking.create({
            title, 
            room_id, 
            start_time: startDateObj, // ໃຊ້ Date Object ທີ່ແປງແລ້ວ
            end_time: endDateObj, 
            attendeeCount,
            user_id: userIdFromToken,
            status: 'Pending'
        });

        res.status(201).json({ success: true, message: "ສົ່ງຄຳຂໍຈອງສຳເລັດ", data: newBooking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. ອັບເດດການຈອງ
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, start_time, end_time, room_id, attendeeCount } = req.body;
        const userIdFromToken = req.user.id;
        const userRole = req.user.role;

        const booking = await models.Booking.findByPk(id);
        if (!booking) return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນການຈອງ" });

        if (userRole !== 'admin' && booking.user_id !== userIdFromToken) {
            return res.status(403).json({ message: "ທ່ານບໍ່ມີສິດແກ້ໄຂການຈອງຂອງຜູ້ອື່ນ" });
        }

        if (start_time || end_time || room_id) {
            const checkRoom = room_id || booking.room_id;
            const checkStart = start_time || booking.start_time;
            const checkEnd = end_time || booking.end_time;

            const isConflict = await checkOverlap(checkRoom, checkStart, checkEnd, id);
            if (isConflict) {
                return res.status(400).json({ message: "ເວລາໃໝ່ທີ່ທ່ານເລືອກ ມີຄົນຈອງແລ້ວ" });
            }
        }

        await models.Booking.update(req.body, { where: { id } });
        res.status(200).json({ success: true, message: "ອັບເດດສຳເລັດ" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Admin ອະນຸມັດ ຫຼື ປະຕິເສດ
exports.approve = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_comment } = req.body;
        const userRole = req.user.role;

        if (userRole !== 'admin') {
            return res.status(403).json({ message: "ສະເພາະ Admin ເທົັ້ນທີ່ສາມາດອະນຸມັດໄດ້" });
        }

        const booking = await models.Booking.findByPk(id);
        if (!booking) return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນການຈອງ" });

        await models.Booking.update({ status, admin_comment }, { where: { id } });
        res.status(200).json({ success: true, message: `ປ່ຽນສະຖານະເປັນ ${status} ສຳເລັດ` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. ລຶບການຈອງ
exports.destroy = async (req, res) => {
    try {
        const { id } = req.params;
        const userIdFromToken = req.user.id;
        const userRole = req.user.role;

        const booking = await models.Booking.findByPk(id);
        if (!booking) return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນການຈອງ" });

        if (userRole !== 'admin' && booking.user_id !== userIdFromToken) {
            return res.status(403).json({ message: "ທ່ານບໍ່ມີສິດລຶບການຈອງຂອງຜູ້ອື່ນ" });
        }

        await models.Booking.destroy({ where: { id } });
        res.status(200).json({ success: true, message: "ລຶບການຈອງສຳເລັດ" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 6. ກວດສອບຫ້ອງຫວ່າງ ຕາມຊ່ວງເວລາ (Ignore ລາຍການທີ່ໝົດເວລາແລ້ວ)
// controllers/bookingController.js
exports.checkAvailableRooms = async (req, res) => {
    try {
        const { start_time, end_time } = req.query;

        // 1. ຫາລາຍຊື່ຫ້ອງທີ່ "ບໍ່ຫວ່າງ" (ມີຄົນຈອງ ແລະ ອະນຸມັດແລ້ວ)
        const busyBookings = await models.Booking.findAll({
        where: {
            // 1. ກວດສອບສະເພາະການຈອງທີ່ Admin ອະນຸມັດແລ້ວ ຫຼື ກຳລັງລໍຖ້າ
            status: { [Op.in]: ['Approved', 'Pending'] }, 

            // 2. ຫ້ອງຈະຖືກຖືວ່າ "ບໍ່ຫວ່າງ" ກໍຕໍ່ເມື່ອການຈອງນັ້ນ "ຍັງບໍ່ທັນໝົດເວລາ" 
            // (ຖ້າຮອດເວລາ 13:00 ແລ້ວ ຫ້ອງທີ່ຈອງ 11:00-12:00 ຄວນຈະຫວ່າງ)
            end_time: { [Op.gt]: new Date() }, 

            [Op.and]: [
                {
                    // 3. Logic ກວດສອບການທັບຊ້ອນ (Overlap Logic)
                    // ໃຊ້ lte (ໜ້ອຍກວ່າ ຫຼື ເທົ່າກັບ) ແລະ gte (ຫຼາຍກວ່າ ຫຼື ເທົ່າກັບ) 
                    // ເພື່ອປ້ອງກັນການຈອງ "ຊົນຂອບ" ເວລາວິນາທີດຽວກັນ
                    start_time: { [Op.lt]: new Date(end_time) },
                    end_time: { [Op.gt]: new Date(start_time) }
                }
            ]
        },
            attributes: ['room_id'],
            raw: true
        });

        const busyRoomIds = busyBookings.map(b => b.room_id);

        // 2. ດຶງຫ້ອງທັງໝົດທີ່ "ບໍ່ຢູ່ໃນລາຍຊື່ທີ່ບໍ່ຫວ່າງ"
        const availableRooms = await models.Room.findAll({
            where: {
                id: { [Op.notIn]: busyRoomIds.length > 0 ? busyRoomIds : [0] }
            }
        });

        res.status(200).json({ success: true, data: availableRooms });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};