'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Equipment extends Model {
    static associate(models) {
      // define association here
    }
  }
  // models/equipment.js
  Equipment.init({
    item_name: DataTypes.STRING,      // ປ່ຽນຈາກ equipment_name
    unit: DataTypes.STRING,           // ເພີ່ມຕາມ Navicat
    item_type: DataTypes.STRING,      // ເພີ່ມຕາມ Navicat
    total_quantity: DataTypes.INTEGER // ເພີ່ມຕາມ Navicat
  }, {
    sequelize,
    modelName: 'Equipment',
    tableName: 'equipment',           // ຕ້ອງເປັນ 'equipment' (ບໍ່ມີ s) ຕາມ Navicat
    underscored: false,               // ປ່ຽນເປັນ false ເພາະໃນ Navicat ໃຊ້ createdAt (ໂຕໃຫຍ່)
    timestamps: true,                 // ໃຊ້ true ເພາະໃນ Navicat ມີ Column ນີ້ແລ້ວ
  });
  return Equipment;
};