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
// --- [Auto-Mapping Routes] ---
try {
    const routes = ['equipment', 'users', 'rooms', 'dashboard', 'catering', 'bookings', ['roomequipment', 'roomEquipmentRoute'], ['approvals', 'approvalRoute']];

    routes.forEach(r => app.use(`/api/${Array.isArray(r) ? r[0] : r}`, require(`./routes/${Array.isArray(r) ? r[1] : r}`)));

    console.log("🚀 [System] Load All Active Routes Success!");
} catch (error) {
    console.error("❌ [System] Error Loading Routes:", error.message);
}

app.use((req, res) => {
    res.status(404).json({ success: false, message: "404 Not Found" });
});

module.exports = app;