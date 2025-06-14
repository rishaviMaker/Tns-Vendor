/**
 * Migration to create the vendor_notifications table
 */

const { Sequelize } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    // Create the vendor_notifications table
    await queryInterface.createTable('vendor_notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      vendor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Type of notification (e.g. order, payment, product, etc.)'
      },
      entity_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'ID of the related entity (e.g. order_id, payment_id, etc.)'
      },
      entity_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Type of the related entity (e.g. order, payment, etc.)'
      },
      data: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON string with additional notification data'
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes
    await queryInterface.addIndex('vendor_notifications', ['vendor_id']);
    await queryInterface.addIndex('vendor_notifications', ['type']);
    await queryInterface.addIndex('vendor_notifications', ['is_read']);
    await queryInterface.addIndex('vendor_notifications', ['created_at']);
  },

  down: async (queryInterface) => {
    // Drop the table
    await queryInterface.dropTable('vendor_notifications');
  }
};
