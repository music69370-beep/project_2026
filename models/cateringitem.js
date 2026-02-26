'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CateringItem extends Model {
    static associate(models) {
      // ບ່ອນນີ້ສາມາດເຊື່ອມກັບ BookingCatering ໄດ້ໃນອະນາຄົດ
    }
  }
  CateringItem.init({
    Name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    Unit: DataTypes.STRING,
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  // models/cateringitem.js

// ... (Code ສ່ວນເທິງຄືເກົ່າ) ...
  }, {
    sequelize,
    modelName: 'CateringItem',
    tableName: 'CateringItems', // <--- ແກ້ຈາກ 'catering_items' ເປັນ 'CateringItems' ໃຫ້ກົງກັບ Migration
    underscored: false,          
    timestamps: true,
  });
  return CateringItem;
};