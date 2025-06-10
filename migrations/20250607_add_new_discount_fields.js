'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new columns to ec_discounts table
    return Promise.all([
      queryInterface.addColumn('ec_discounts', 'never_expire', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      }),
      queryInterface.addColumn('ec_discounts', 'unlimited_used', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      }),
      queryInterface.addColumn('ec_discounts', 'categories', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON string of category IDs'
      }),
      queryInterface.addColumn('ec_discounts', 'subcategories', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON string of subcategory IDs'
      })
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove columns in case of rollback
    return Promise.all([
      queryInterface.removeColumn('ec_discounts', 'never_expire'),
      queryInterface.removeColumn('ec_discounts', 'unlimited_used'),
      queryInterface.removeColumn('ec_discounts', 'categories'),
      queryInterface.removeColumn('ec_discounts', 'subcategories')
    ]);
  }
};
