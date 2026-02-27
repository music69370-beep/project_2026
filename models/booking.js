'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    static associate(models) {
      // ເຊື່ອມຫາ Room (room_id -> rooms.id)
      Booking.belongsTo(models.Room, { 
        foreignKey: 'room_id', 
        as: 'room' 
      });
      
      // ເຊື່ອມຫາ User (user_id -> users.id)
      Booking.belongsTo(models.User, { 
        foreignKey: 'user_id', 
        as: 'user' 
      });
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
    }
  }, {
    sequelize,
    modelName: 'Booking',
    tableName: 'bookings', // ໃຊ້ໂຕນ້ອຍໃຫ້ກົງກັບ users ແລະ rooms
    timestamps: true,      // ເພື່ອໃຫ້ມີ createdAt ແລະ updatedAt
  });

  return Booking;
};