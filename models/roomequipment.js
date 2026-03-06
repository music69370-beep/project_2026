'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RoomEquipment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
  static associate(models) {
    this.belongsTo(models.Room, { foreignKey: 'room_id', as: 'room' });
    this.belongsTo(models.Equipment, { foreignKey: 'equipment_id', as: 'equipment_details' });
  }
  }
  RoomEquipment.init({
    room_id: DataTypes.INTEGER,
    equipment_id: DataTypes.INTEGER,
    quantity: DataTypes.INTEGER
  // ໃນ models/roomequipment.js
  }, {
    sequelize,
    modelName: 'RoomEquipment',
    tableName: 'roomequipments',
    timestamps: false, // ⭐ ຖ້າໃນ Navicat ບໍ່ມີ createdAt/updatedAt ໃຫ້ໃສ່ false
  });
  return RoomEquipment;
};