'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Adding Bank Details fields
      await queryInterface.addColumn('mp_stores', 'preferred_payment_method', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });
      
      await queryInterface.addColumn('mp_stores', 'bank_name', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });
      
      await queryInterface.addColumn('mp_stores', 'ifsc_code', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });
      
      await queryInterface.addColumn('mp_stores', 'account_number', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });
      
      await queryInterface.addColumn('mp_stores', 'paypal_id', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });
      
      await queryInterface.addColumn('mp_stores', 'upi_id', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });
      
      await queryInterface.addColumn('mp_stores', 'payment_description', {
        type: Sequelize.TEXT,
        allowNull: true
      }, { transaction });
      
      // Adding Social Media fields
      await queryInterface.addColumn('mp_stores', 'facebook_link', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });
      
      await queryInterface.addColumn('mp_stores', 'twitter_link', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });
      
      await queryInterface.addColumn('mp_stores', 'instagram_link', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });
      
      await queryInterface.addColumn('mp_stores', 'youtube_link', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });
      
      await queryInterface.addColumn('mp_stores', 'linkedin_link', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });
      
      await queryInterface.addColumn('mp_stores', 'whatsapp_link', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Removing Bank Details fields
      await queryInterface.removeColumn('mp_stores', 'preferred_payment_method', { transaction });
      await queryInterface.removeColumn('mp_stores', 'bank_name', { transaction });
      await queryInterface.removeColumn('mp_stores', 'ifsc_code', { transaction });
      await queryInterface.removeColumn('mp_stores', 'account_number', { transaction });
      await queryInterface.removeColumn('mp_stores', 'paypal_id', { transaction });
      await queryInterface.removeColumn('mp_stores', 'upi_id', { transaction });
      await queryInterface.removeColumn('mp_stores', 'payment_description', { transaction });
      
      // Removing Social Media fields
      await queryInterface.removeColumn('mp_stores', 'facebook_link', { transaction });
      await queryInterface.removeColumn('mp_stores', 'twitter_link', { transaction });
      await queryInterface.removeColumn('mp_stores', 'instagram_link', { transaction });
      await queryInterface.removeColumn('mp_stores', 'youtube_link', { transaction });
      await queryInterface.removeColumn('mp_stores', 'linkedin_link', { transaction });
      await queryInterface.removeColumn('mp_stores', 'whatsapp_link', { transaction });
    });
  }
};
