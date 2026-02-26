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

// 2. Load Routes ແບບບັງຄັບ (ໃຫ້ເຈົ້າກວດຊື່ Folder ແລະ ໄຟລ໌ໃຫ້ດີ)
// ຖ້າ Folder ເຈົ້າຊື່ "routes" (ມີ s) ແລະ ໄຟລ໌ຊື່ "rooms.js" (ມີ s) ໃຫ້ໃຊ້ Code ນີ້:
// ຕ້ອງມີແຖວ Import ກ່ອນຈຶ່ງເອົາໄປ use ໄດ້
try {
    const equipmentRoutes = require('./routes/equipment'); // ກວດຊື່ໄຟລ໌ໃຫ້ຖືກ
    app.use('/api/equipment', equipmentRoutes);
    console.log("✅ Load Equipment Route Success!");
} catch (error) {
    console.log("⚠️ ຍັງບໍ່ທັນມີໄຟລ໌ Equipment Route, ຂ້າມໄປກ່ອນ...");
}
try {
    const users = require('./routes/users');
    const rooms = require('./routes/rooms');
    
    app.use('/api/users', users);
    app.use('/api/rooms', rooms);
    
    console.log("✅ Load Routes Success!");
} catch (error) {
    console.log("❌ Error Loading Routes:", error.message);
}

// 3. Error 404
app.use((req, res) => {
    res.status(404).json({ message: "404 Not Found - ຫາ Path ນີ້ບໍ່ເຫັນ" });
});

module.exports = app;