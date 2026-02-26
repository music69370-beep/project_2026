'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('equipment', {
      item_id: { // ປ່ຽນຈາກ id ເປັນ item_id ຕາມເອກະສານ
        allowNull: false,
        autoIncrement: true,
        primary_key: true,
        type: Sequelize.INTEGER
      },
      item_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      unit: {
        type: Sequelize.STRING(50) // ເຊັ່ນ: ອັນ, ເຄື່ອງ, ຊຸດ
      },
      item_type: {
        type: Sequelize.ENUM('equipment', 'consumable'), // ປ່ຽນເປັນ ENUM ຕາມເອກະສານ
        defaultValue: 'equipment'
      },
      total_quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('equipment');
  }
};