'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Room extends Model {
    static associate(models) {
      // ບ່ອນນີ້ເອົາໄວ້ເຊື່ອມກັບ Booking ໃນອະນາຄົດ
    }
  }
  // models/rooms.js
// models/rooms.js
Room.init({
  room_name: {
    type: DataTypes.STRING,
    unique: true, // <--- ຫ້າມມີຊື່ຊໍ້າກັນໃນ Database
    allowNull: false
  },
  location: DataTypes.STRING,
  capacity: DataTypes.INTEGER,
  image_url: DataTypes.STRING,
  status: DataTypes.STRING
}, {
  sequelize,
  modelName: 'Room',
  tableName: 'rooms',
  underscored: true,
  timestamps: false, // ປ່ຽນເປັນ false ຕາມທີ່ເຮົາລົມກັນກ່ອນໜ້ານີ້
});
  return Room;
};


