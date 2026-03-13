'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    static associate(models) {
      // ເຊື່ອມຫາ Room ແລະ User (ມີແລ້ວ)
      Booking.belongsTo(models.Room, { foreignKey: 'room_id', as: 'room' });
      Booking.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });

      // ⭐ ຕ້ອງເພີ່ມ 2 ແຖວນີ້ເພື່ອໃຫ້ findAll ດຶງຂໍ້ມູນ Array ອອກມາໄດ້
      this.hasMany(models.BookingEquipment, { foreignKey: 'booking_id', as: 'equipments' });
      this.hasMany(models.BookingCatering, { foreignKey: 'booking_id', as: 'caterings' });
      // ໃນ models/booking.js ບ່ອນ static associate
      this.hasOne(models.Approval, { foreignKey: 'booking_id', as: 'approval_details' });
    }
  }

  Booking.init({
    // ກຳນົດ Primary Key ໃຫ້ຊັດເຈນ
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
      defaultValue: 'Pending'
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    attendeeCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // ເພີ່ມໃສ່ໃນ Booking.init (...)
    is_recurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    recur_pattern: {
      type: DataTypes.ENUM('none', 'daily', 'weekly', 'monthly'),
      defaultValue: 'none'
    },
    recur_count: { // ຈຳນວນຄັ້ງທີ່ຈະໃຫ້ຊ້ຳ
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    parent_booking_id: { // ເກັບ ID ຂອງແຖວທຳອິດ ເພື່ອມັດເປັນກຸ່ມດຽວກັນ
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Booking',
    tableName: 'bookings', // ໃຊ້ໂຕນ້ອຍໃຫ້ກົງກັບ users ແລະ rooms
    timestamps: true,      // ເພື່ອໃຫ້ມີ createdAt ແລະ updatedAt
  });

  return Booking;
};