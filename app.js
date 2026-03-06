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
    const usersRoutes     = require('./routes/users');
    const roomsRoutes     = require('./routes/rooms');
    const cateringRoutes  = require('./routes/catering');
    const bookingRoutes   = require('./routes/bookings');
    // ⭐ ແກ້ບ່ອນນີ້ໃຫ້ກົງກັບຊື່ໄຟລ໌ແທ້ຂອງເຈົ້າ
    const roomEquipmentRoutes = require('./routes/roomEquipmentRoute'); 

    // ປະກາດໃຊ້ API Paths
    app.use('/api/equipment', equipmentRoutes);
    app.use('/api/users', usersRoutes);
    app.use('/api/rooms', roomsRoutes);
    app.use('/api/catering', cateringRoutes);
    app.use('/api/bookings', bookingRoutes);
    // ⭐ ປະກາດໃຊ້ Path ສຳລັບຈັດການອຸປະກອນໃນຫ້ອງ
    app.use('/api/roomequipment', roomEquipmentRoutes);

    console.log("🚀 Load All Active Routes Success!");
} catch (error) {
    console.log("❌ Error Loading Routes:", error.message);
}

// 3. Error 404
app.use((req, res) => {
    res.status(404).json({ message: "404 Not Found - ຫາ Path ນີ້ບໍ່ເຫັນ" });
});

module.exports = app;