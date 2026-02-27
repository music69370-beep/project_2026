'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // ເຊື່ອມຫາ Booking ໂດຍໃຊ້ user_id ໃຫ້ກົງກັບຖານຂໍ້ມູນ
      User.hasMany(models.Booking, { foreignKey: 'user_id', as: 'bookings' });
    }
  }

  User.init({
    // ຕ້ອງໃຊ້ user_id ຕາມທີ່ປາກົດໃນ Navicat ຂອງເຈົ້າ
    user_id: { 
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    full_name: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'user'),
      defaultValue: 'user'
    },
    department: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: false,
    timestamps: true 
  });

  return User;
};