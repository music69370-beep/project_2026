'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Equipment extends Model {
    static associate(models) {
      // define association here
    }
  }
  Equipment.init({
    equipment_name: DataTypes.STRING,
    description: DataTypes.TEXT,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Equipment',
    tableName: 'equipment', // ຖ້າໃນ DB ບໍ່ມີ s, ບ່ອນນີ້ກໍຫ້າມມີ s
    underscored: true,      // ໃຊ້ created_at, updated_at (ມີ _)
  });
  return Equipment;
};