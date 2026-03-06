'use strict';
/** @type {import('sequelize-cli').Migration} */
// migrations/xxxx-create-approval.js
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('approvals', {
      approval_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      booking_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'bookings', // ຊື່ Table ປາຍທາງ
          key: 'id'          // ⭐ ຕ້ອງເປັນ 'id' ເພາະໃນ table bookings ເຈົ້າໃຊ້ຊື່ນີ້
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      // ... ໂຄ້ດສ່ວນເທິງ ...
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',    
          key: 'user_id'      // ⭐ ປ່ຽນຈາກ 'id' ເປັນ 'user_id' ໃຫ້ກົງກັບ Table users ຂອງເຈົ້າ
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
// ... ໂຄ້ດສ່ວນລຸ່ມ ...
      approval_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      status: {
        type: Sequelize.ENUM('Approved', 'Rejected'),
        allowNull: false
      },
      comment: {
        type: Sequelize.TEXT
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('approvals');
  }
};