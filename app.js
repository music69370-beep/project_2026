const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");

const app = express();

// 1. Config Middlewares
app.use(cors({ origin: "*" }));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// 2. Load Routes
try {
    // Import Routes
    const equipmentRoutes = require('./routes/equipment');
    const usersRoutes = require('./routes/users');
    const roomsRoutes = require('./routes/rooms');
    const cateringRoutes = require('./routes/catering');

    // ສໍາລັບ Booking ເຮົາຈະໃຊ້ try-catch ແຍກ ເພື່ອບໍ່ໃຫ້ມັນຢຸດການເຮັດວຽກຂອງ Route ອື່ນຖ້າຫາໄຟລ໌ບໍ່ເຫັນ
    app.use('/api/equipment', equipmentRoutes);
    app.use('/api/users', usersRoutes);
    app.use('/api/rooms', roomsRoutes);
    app.use('/api/catering', cateringRoutes);

    // ກວດສອບວ່າໄຟລ໌ bookings.js ມີແລ້ວຫຼືຍັງ
    try {
        const bookingRoutes = require('./routes/bookings');
        app.use('/api/bookings', bookingRoutes);
        console.log("✅ Load Booking Route Success!");
    } catch (e) {
        console.log("ℹ️ Booking Route ຍັງບໍ່ທັນໄດ້ສ້າງ, ຂ້າມໄປກ່ອນ...");
    }

    console.log("🚀 Load All Active Routes Success!");
} catch (error) {
    console.log("❌ Error Loading Routes:", error.message);
}

// 3. Error 404
app.use((req, res) => {
    res.status(404).json({ message: "404 Not Found - ຫາ Path ນີ້ບໍ່ເຫັນ" });
});

module.exports = app;