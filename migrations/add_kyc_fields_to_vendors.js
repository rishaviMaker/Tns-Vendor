/**
 * Migration to add KYC verification fields to the Vendors table
 * This migration adds fields for tracking Cashfree KYC verification status
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Add new columns to the Vendors table
      await queryInterface.addColumn('Vendors', 'isPanVerified', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'PAN card verification status',
        after: 'notificationsEnabled'
      });

      await queryInterface.addColumn('Vendors', 'isAadharVerified', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Aadhar card verification status',
        after: 'isPanVerified'
      });

      await queryInterface.addColumn('Vendors', 'isDlVerified', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Driving License verification status',
        after: 'isAadharVerified'
      });

      await queryInterface.addColumn('Vendors', 'isGstinVerified', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'GSTIN verification status',
        after: 'isDlVerified'
      });

      await queryInterface.addColumn('Vendors', 'isVoterIdVerified', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Voter ID verification status',
        after: 'isGstinVerified'
      });

      await queryInterface.addColumn('Vendors', 'kycVerificationData', {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Stores detailed verification responses from Cashfree API',
        after: 'isVoterIdVerified'
      });

      await queryInterface.addColumn('Vendors', 'kycVerifiedAt', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the KYC verification was last performed',
        after: 'kycVerificationData'
      });

      console.log('KYC verification fields added to Vendors table successfully');
      return Promise.resolve();
    } catch (error) {
      console.error('Error adding KYC verification fields to Vendors table:', error);
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Remove the columns in reverse order
      await queryInterface.removeColumn('Vendors', 'kycVerifiedAt');
      await queryInterface.removeColumn('Vendors', 'kycVerificationData');
      await queryInterface.removeColumn('Vendors', 'isVoterIdVerified');
      await queryInterface.removeColumn('Vendors', 'isGstinVerified');
      await queryInterface.removeColumn('Vendors', 'isDlVerified');
      await queryInterface.removeColumn('Vendors', 'isAadharVerified');
      await queryInterface.removeColumn('Vendors', 'isPanVerified');

      console.log('KYC verification fields removed from Vendors table successfully');
      return Promise.resolve();
    } catch (error) {
      console.error('Error removing KYC verification fields from Vendors table:', error);
      return Promise.reject(error);
    }
  }
};
