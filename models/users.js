'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // define association here
    }
  }
  User.init({
    // 1. ເພີ່ມ user_id ໃຫ້ເປັນ Primary Key
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    full_name: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true // ປ້ອງກັນ email ຊໍ້າກັນ
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // 2. ປ່ຽນ role ໃຫ້ເປັນ ENUM ຕາມທີ່ອອກແບບໄວ້
    role: {
      type: DataTypes.ENUM('admin', 'user'),
      defaultValue: 'user'
    },
    department: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users', // ໃຫ້ກົງກັບຊື່ Table ໃນ Database
    timestamps: true    // ເກັບ createdAt ແລະ updatedAt ໄວ້ຕາມທີ່ຕົກລົງ
  });
  return User;
};