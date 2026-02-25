'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      user_id: { // ປ່ຽນຈາກ id ເປັນ user_id ຕາມຮູບອອກແບບ
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      full_name: { // ໃຫ້ແນ່ໃຈວ່າເປັນ full_name
        type: Sequelize.STRING(255)
      },
      email: {
        type: Sequelize.STRING(100)
      },
      password: {
        type: Sequelize.STRING(255)
      },
      role: { // ຕັ້ງຄ່າເປັນ ENUM
        type: Sequelize.ENUM('admin', 'user'),
        defaultValue: 'user'
      },
      department: {
        type: Sequelize.STRING(100)
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};