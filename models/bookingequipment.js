'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BookingEquipment extends Model {
    static associate(models) {
      // foreignKey ຕ້ອງເປັນໂຕນ້ອຍຕາມ SQL Log
      this.belongsTo(models.Booking, { foreignKey: 'booking_id', as: 'booking' });
      this.belongsTo(models.Equipment, { foreignKey: 'equipment_id', as: 'details' });
    }
  }

  // models/bookingequipment.js
// ... ສ່ວນອື່ນໆຄືເກົ່າ ...
  // models/bookingequipment.js
// ... ສ່ວນອື່ນໆ ...
  BookingEquipment.init({
    booking_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    equipment_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    quantity: { // ⭐ ໃຊ້ quantity ໃຫ້ກົງກັບ Navicat ໃນ table bookingequipments
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