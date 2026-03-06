'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Approval extends Model {
    static associate(models) {
      // ⭐ ເຊື່ອມຫາການຈອງ (Booking)
      this.belongsTo(models.Booking, { foreignKey: 'booking_id', as: 'booking_details' });
      // ⭐ ເຊື່ອມຫາ User (Admin ຜູ້ອະນຸມັດ)
      this.belongsTo(models.User, { foreignKey: 'user_id', as: 'admin_details' });
    }
  }

  Approval.init({
    // ⭐ ເພີ່ມ Primary Key ໃຫ້ກົງກັບຮູບທີ່ເຈົ້າຕ້ອງການ
    approval_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    booking_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    approval_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW // ໃຫ້ມັນບັນທຶກເວລາປັດຈຸບັນອັດຕະໂນມັດ
    },
    status: {
      type: DataTypes.STRING, // ຫຼື ENUM('Approved', 'Rejected')
      allowNull: false
    },
    comment: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Approval',
    tableName: 'approvals', // ⭐ ລະບຸຊື່ Table ໃຫ້ເປັນໂຕພິມນ້ອຍຕາມ Navicat
    timestamps: false       // ຖ້າເຈົ້າໃຊ້ approval_date ແລ້ວ ກໍບໍ່ຈຳເປັນຕ້ອງມີ createdAt/updatedAt ກໍໄດ້
  });

  return Approval;
};