'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BookingCatering extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    // models/bookingcatering.js
    static associate(models) {
      // ເຊື່ອມຫາການຈອງ
      this.belongsTo(models.Booking, { foreignKey: 'booking_id', as: 'booking' });
      // ເຊື່ອມຫາລາຍການອາຫານ/ເຄື່ອງດື່ມ
      this.belongsTo(models.CateringItem, { foreignKey: 'cateringItem_id', as: 'item_details' });
    }
  }
  BookingCatering.init({
    booking_id: DataTypes.INTEGER,
    cateringItem_id: DataTypes.INTEGER,
    quantity: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'BookingCatering',
  });
  return BookingCatering;
};