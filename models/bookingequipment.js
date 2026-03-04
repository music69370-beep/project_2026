'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BookingEquipment extends Model {
    static associate(models) {
      this.belongsTo(models.Booking, { foreignKey: 'Bookingid', as: 'booking' });
      this.belongsTo(models.Equipment, { foreignKey: 'Equipmentid', as: 'details' });
    }
  }

  BookingEquipment.init({
    Bookingid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'booking_id' // ⭐ ບອກໃຫ້ Sequelize ໄປຫາ column booking_id ໃນ DB
    },
    Equipmentid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'equipment_id' // ⭐ ບອກໃຫ້ Sequelize ໄປຫາ column equipment_id ໃນ DB
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  }, {
    sequelize,
    modelName: 'BookingEquipment',
    tableName: 'bookingequipments',
    timestamps: true
  });

  return BookingEquipment;
};