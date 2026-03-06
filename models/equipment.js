module.exports = (sequelize, DataTypes) => {
  class Equipment extends sequelize.Sequelize.Model { // ປ່ຽນມາໃຊ້ Class ໃຫ້ຄືກັບ Room
    static associate(models) {
      // ⭐ ຕ້ອງມີແຖວນີ້ເພື່ອໃຫ້ RoomEquipment ເຊື່ອມຫາມັນໄດ້
      this.hasMany(models.RoomEquipment, { foreignKey: 'equipment_id', as: 'room_items' });
      this.hasMany(models.BookingEquipment, { foreignKey: 'equipment_id', as: 'bookings' });
    }
  }

  Equipment.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    item_name: DataTypes.STRING,
    item_type: DataTypes.STRING,
    unit: DataTypes.STRING,
    total_quantity: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Equipment',
    tableName: 'equipment',
    timestamps: true
  });

  return Equipment;
};