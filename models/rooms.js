'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Room extends Model {
    static associate(models) {
      // ຫ້ອງ 1 ຫ້ອງ ມີໄດ້ຫຼາຍການຈອງ (rooms.id -> bookings.room_id)
      Room.hasMany(models.Booking, { foreignKey: 'room_id', as: 'bookings' });
    }
  }

  Room.init({
    id: { // ໃຊ້ id ເປັນ Primary Key ຕາມມາດຕະຖານ
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    room_name: {
      type: DataTypes.STRING,
      unique: true,
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
    underscored: false, 
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });

  return Room;
};