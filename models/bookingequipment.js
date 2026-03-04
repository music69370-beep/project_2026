'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BookingEquipment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Booking, { foreignKey: 'booking_id' });
      this.belongsTo(models.Equipment, { foreignKey: 'equipment_id', as: 'details' });
    }
  }
  BookingEquipment.init({
    booking_id: DataTypes.INTEGER,
    equipment_id: DataTypes.INTEGER,
    quantity: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'BookingEquipment',
  });
  return BookingEquipment;
};