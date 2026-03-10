const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");

const app = express();

app.use(cors({ origin: "*" }));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Load Routes
try {
    const equipmentRoutes = require('./routes/equipment');
    const usersRoutes     = require('./routes/users');
    const roomsRoutes     = require('./routes/rooms');
    const cateringRoutes  = require('./routes/catering');
    const bookingRoutes   = require('./routes/bookings');
    const roomEquipmentRoutes = require('./routes/roomEquipmentRoute');
    const approvalRoutes  = require('./routes/approvalRoute'); 

    app.use('/api/equipment', equipmentRoutes);
    app.use('/api/users', usersRoutes);
    app.use('/api/rooms', roomsRoutes);
    app.use('/api/catering', cateringRoutes);
    app.use('/api/bookings', bookingRoutes);
    app.use('/api/roomequipment', roomEquipmentRoutes);
    app.use('/api/approvals', approvalRoutes);

    console.log("🚀 [System] Load All Active Routes Success!");
} catch (error) {
    console.error("❌ [System] Error Loading Routes:", error.message);
}

app.use((req, res) => {
    res.status(404).json({ success: false, message: "404 Not Found" });
});

module.exports = app;