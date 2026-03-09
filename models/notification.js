'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate(models) {
      // ⭐ ເຊື່ອມຫາ User: Notification ນີ້ແມ່ນສົ່ງຫາໃຜ
      Notification.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      
      // ⭐ ເຊື່ອມຫາ Booking: ແຈ້ງເຕືອນນີ້ກ່ຽວກັບການຈອງໃດ (Optional)
      Notification.belongsTo(models.Booking, { foreignKey: 'booking_id', as: 'booking' });
    }
  }

  Notification.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false // ບໍ່ໃຫ້ເປັນຄ່າຫວ່າງ
    },
    booking_id: {
      type: DataTypes.INTEGER,
      allowNull: true // ບາງແຈ້ງເຕືອນອາດຈະບໍ່ກ່ຽວກັບການຈອງກໍໄດ້
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false // ⭐ ໃຫ້ເປັນ false (ຍັງບໍ່ອ່ານ) ອັດຕະໂນມັດ
    }
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications', // ໃຊ້ໂຕນ້ອຍໃຫ້ກົງກັບມາດຕະຖານ table ອື່ນໆ
    timestamps: true,
  });

  return Notification;
};