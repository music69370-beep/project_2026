// models/equipment.js
// models/equipment.js
module.exports = (sequelize, DataTypes) => {
  const Equipment = sequelize.define('Equipment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    item_name: DataTypes.STRING,
    item_type: DataTypes.STRING,
    unit: DataTypes.STRING,
    total_quantity: { // ⭐ ໃຊ້ total_quantity ໃຫ້ກົງກັບ Navicat ໃນ table equipment
        type: DataTypes.INTEGER
    }
  }, {
    tableName: 'equipment'
  });

  Equipment.associate = (models) => {
    Equipment.hasMany(models.BookingEquipment, { foreignKey: 'equipment_id', as: 'bookings' });
  };

  return Equipment;
};
 