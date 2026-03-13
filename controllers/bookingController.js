const db = require('../models');
// ⭐ ຕື່ມ BookingCatering ແລະ CateringItem ໃສ່ໃນວົງເລັບນີ້
const { Booking, Room, User, BookingEquipment, Equipment, BookingCatering, CateringItem, sequelize } = db;
const { Op } = require('sequelize');
const { addDays, addWeeks, addMonths } = require('date-fns');
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
// 1. ດຶງຂໍ້ມູນການຈອງທັງໝົດ (ປັບປຸງໃໝ່)
exports.index = async (req, res) => {
    try {
        const rows = await Booking.findAll({
            include: [
                { model: Room, as: 'room', attributes: ['room_name', 'location'] },
                { model: User, as: 'user', attributes: ['full_name', 'department'] },
                { 
                    model: BookingEquipment, 
                    as: 'equipments', 
                    include: [{ 
                        model: Equipment, 
                        as: 'details', 
                        attributes: ['item_name', 'unit'] 
                    }] 
                },
                {
                    model: BookingCatering,
                    as: 'caterings',
                    include: [
                        {
                            model: CateringItem,
                            as: 'item_details',
                            attributes: ['Name', 'Unit']
                        }
                    ]
                },
                // ເພີ່ມ Approval ເຂົ້າໃນ include list
                {
                    model: db.Approval, // ⭐ ດຶງຂໍ້ມູນການອະນຸມັດມາໂຊນຳ
                    as: 'approval_details',
                    include: [
                        { model: User, as: 'admin_details', attributes: ['full_name'] }
                    ]
                }
        ],
        order: [['createdAt', 'DESC']]
    });
        res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error("❌ Error index:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Insert ການຈອງໃໝ່ (Transaction)
exports.insert = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { 
            room_id, start_time, end_time, attendeeCount, title, 
            equipments, caterings,
            is_recurring, recur_pattern, recur_count 
        } = req.body;

        // 1. ກວດສອບຫ້ອງ (Capacity) ຄືເກົ່າ... (ຂ້າມມາບ່ອນ Logic ຈອງຊ້ຳເລີຍ)
        
        const bookingsToCreate = [];
        let currentStart = new Date(start_time);
        let currentEnd = new Date(end_time);
        const count = is_recurring ? Math.min(recur_count, 10) : 1; // ກັນຄົນໃສ່ຫຼາຍເກີນ (Max 10)

        // --- 🚀 LOOP ສ້າງວັນທີ ແລະ ກວດ Overlap ---
        for (let i = 0; i < count; i++) {
            // ກວດ Overlap ຂອງວັນທີໃນຮອບນີ້
            const isBusy = await Booking.findOne({
                where: {
                    room_id,
                    status: { [Op.in]: ['Approved', 'Pending'] },
                    [Op.and]: [
                        { start_time: { [Op.lt]: currentEnd } },
                        { end_time: { [Op.gt]: currentStart } }
                    ]
                }
            });

            if (isBusy) {
                throw new Error(`❌ ຫ້ອງບໍ່ຫວ່າງໃນວັນທີ ${currentStart.toLocaleDateString()}`);
            }

            // ເກັບຂໍ້ມູນໄວ້ໃນ Array ກ່ອນ
            bookingsToCreate.push({
                title, room_id, user_id: req.user.id,
                start_time: new Date(currentStart),
                end_time: new Date(currentEnd),
                attendeeCount, status: 'Pending',
                is_recurring, recur_pattern
            });

            // ບວກວັນທີເພີ່ມຕາມ Pattern
            if (recur_pattern === 'daily') {
                currentStart = addDays(currentStart, 1);
                currentEnd = addDays(currentEnd, 1);
            } else if (recur_pattern === 'weekly') {
                currentStart = addWeeks(currentStart, 1);
                currentEnd = addWeeks(currentEnd, 1);
            } else if (recur_pattern === 'monthly') {
                currentStart = addMonths(currentStart, 1);
                currentEnd = addMonths(currentEnd, 1);
            }
        }

        // --- 2. ບັນທຶກລາຍການທັງໝົດ ---
        const createdBookings = await Booking.bulkCreate(bookingsToCreate, { transaction: t, returning: true });
        
        // ຜູກ parent_booking_id ໃຫ້ທຸກໂຕ (ໃຊ້ ID ໂຕທຳອິດ)
        const firstId = createdBookings[0].id;
        await Booking.update(
            { parent_booking_id: firstId },
            { where: { id: createdBookings.map(b => b.id) }, transaction: t }
        );

        // --- 3. ບັນທຶກອຸປະກອນ ແລະ ອາຫານ (Loop ໃສ່ທຸກ Booking ທີ່ສ້າງໃໝ່) ---
        for (const b of createdBookings) {
            if (equipments?.length > 0) {
                const eqData = equipments.map(item => ({ booking_id: b.id, equipment_id: item.equipment_id, quantity: item.quantity }));
                await BookingEquipment.bulkCreate(eqData, { transaction: t });
            }
            if (caterings?.length > 0) {
                const catData = caterings.map(item => ({ booking_id: b.id, cateringItem_id: item.cateringItem_id, quantity: item.quantity }));
                await BookingCatering.bulkCreate(catData, { transaction: t });
            }
        }

        await t.commit();
        res.status(201).json({ success: true, message: `✅ ຈອງຊ້ຳສຳເລັດ ${count} ລາຍການ!` });

    } catch (error) {
        if (t) await t.rollback();
        res.status(400).json({ success: false, message: error.message });
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
    const t = await sequelize.transaction();
    try {
        const { status, admin_comment } = req.body;
        const bookingId = req.params.id;
        const adminId = req.user.id; // ດຶງຈາກ Token

        // 1. ອັບເດດສະຖານະການຈອງ
        await Booking.update({ status, admin_comment }, { where: { id: bookingId }, transaction: t });

        // 2. ບັນທຶກປະຫວັດການຕັດສິນລົງ Table approvals
        await db.Approval.create({
            booking_id: bookingId,
            user_id: adminId,
            status: status,
            comment: admin_comment,
            approval_date: new Date()
        }, { transaction: t });

        await t.commit();
        res.status(200).json({ success: true, message: `ດຳເນີນການ ${status} ສຳເລັດ` });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ success: false, message: error.message });
    }
};

// 6. ກວດຫ້ອງຫວ່າງ
exports.checkAvailableRooms = async (req, res) => {
    try {
        const { start_time, end_time } = req.query;

        if (!start_time || !end_time) {
            return res.status(400).json({ 
                success: false, 
                message: "ກະລຸນາລະບຸ start_time ແລະ end_time" 
            });
        }

        // 1. ຫາ ID ຂອງຫ້ອງທີ່ "ບໍ່ຫວ່າງ" (ມີຄົນຈອງທີ່ຖືກ Approved ຫຼື Pending ໄວ້ແລ້ວ)
        const busyBookings = await Booking.findAll({
            where: {
                status: { [Op.in]: ['Approved', 'Pending'] }, // ເອົາສະເພາະການຈອງທີ່ມີຜົນ
                [Op.and]: [
                    {
                        // Logic ກວດສອບເວລາຄາບກັນ (Overlap Logic)
                        start_time: { [Op.lt]: end_time },
                        end_time: { [Op.gt]: start_time }
                    }
                ]
            },
            attributes: ['room_id'],
            raw: true
        });

        // ດຶງເອົາ ID ທີ່ບໍ່ຊ້ຳກັນອອກມາ
        const busyRoomIds = [...new Set(busyBookings.map(b => b.room_id))];
        
        console.log("🚫 ຫ້ອງທີ່ບໍ່ຫວ່າງໃນຊ່ວງເວລານີ້:", busyRoomIds);

        // 2. ຫາຫ້ອງທັງໝົດທີ່ "ບໍ່ຢູ່ໃນ" ລາຍຊື່ busyRoomIds
        const availableRooms = await Room.findAll({
            where: {
                id: {
                    [Op.notIn]: busyRoomIds.length > 0 ? busyRoomIds : [0]
                },
                // ⭐ ໃຊ້ [Op.or] ເພື່ອໃຫ້ມັນຫາທັງ 'Available', 'active', ຫຼື 'Active' ກັນພາດ
                [Op.or]: [
                    { status: 'Available' },
                    { status: 'active' },
                    { status: 'Active' }
                ]
            }
        });

        res.status(200).json({ 
            success: true, 
            count: availableRooms.length,
            busy_ids: busyRoomIds,
            data: availableRooms 
        });

    } catch (error) {
        console.error("❌ Error ໃນ checkAvailableRooms:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.searchBooking = async (req, res) => {
    try {
        // 1. ຮັບຄ່າ title ຈາກ Query Params
        const searchTitle = req.query.title;

        // 2. ຖ້າບໍ່ມີການສົ່ງ title ມາ ຫຼື ເປັນຄ່າຫວ່າງ ໃຫ້ແຈ້ງເຕືອນ
        if (!searchTitle || searchTitle.trim() === "") {
            return res.status(400).json({ 
                success: false, 
                message: "ກະລຸນາລະບຸຊື່ຫົວຂໍ້ທີ່ຕ້ອງການຄົ້ນຫາ" 
            });
        }

        // 3. ຄົ້ນຫາໂດຍໃຊ້ Op.like ແລະ ໃສ່ % ກຸ່ມໄວ້ທັງທາງໜ້າ ແລະ ທາງຫຼັງ
        const data = await Booking.findAll({
            where: {
                title: {
                    [Op.like]: `%${searchTitle}%` 
                }
            },
            include: [
                { model: Room, as: 'room', attributes: ['room_name', 'location'] },
                { model: User, as: 'user', attributes: ['full_name', 'department'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        // 4. ສົ່ງຜົນການຄົ້ນຫາ (ຖ້າບໍ່ເຈີ data ຈະເປັນ [])
        res.status(200).json({
            success: true,
            count: data.length,
            data: data
        });

    } catch (error) {
        console.error("❌ Search Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};