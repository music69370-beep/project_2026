// migrations/xxxx-create-booking-catering.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('BookingCaterings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      booking_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'bookings', key: 'id' }, // ເຊື່ອມຫາ Table ການຈອງ
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      cateringItem_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        // ສົມມຸດວ່າ Table ຫຼັກຂອງເຈົ້າຊື່ CateringItems (ກວດຊື່ໃນ Navicat ອີກບາດເດີ້)
        references: { model: 'CateringItems', key: 'id' }, 
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('BookingCaterings');
  }
};