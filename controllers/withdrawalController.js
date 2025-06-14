const { CustomerWithdrawal } = require('../models/CustomerWithdrawal');
const { Vendor } = require('../models/Vendor');
const { Store } = require('../models/Store');
const { Payment } = require('../models/Payment');
const AppError = require('../utils/AppError');
const { Op } = require('sequelize');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const ExcelJS = require('exceljs');
const eventNotificationService = require('../services/eventNotificationService');
const revenueService = require('../services/revenueService');

/**
 * Parse bank info and add bank_details to withdrawal object
 * @param {Object} withdrawal - Withdrawal object
 * @returns {Object} - Withdrawal with added bank_details
 */
const addBankDetails = (withdrawal) => {
  if (!withdrawal) return null;
  
  let bankDetails = {
    bank_name: '',
    ifsc: '',
    account_number: ''
  };
  
  try {
    if (withdrawal.bank_info) {
      const bankInfo = typeof withdrawal.bank_info === 'string' 
        ? JSON.parse(withdrawal.bank_info) 
        : withdrawal.bank_info;
      
      bankDetails = {
        bank_name: bankInfo.bank_name || '',
        ifsc: bankInfo.ifsc || '',
        account_number: bankInfo.account_number || ''
      };
    }
  } catch (error) {
    console.error('Error parsing bank info:', error);
  }
  
  // Add bank_details to the withdrawal object
  if (withdrawal.dataValues) {
    withdrawal.dataValues.bank_details = bankDetails;
  } else {
    withdrawal.bank_details = bankDetails;
  }
  
  return withdrawal;
};

/**
 * Get all withdrawal requests for the authenticated vendor
 */
exports.getWithdrawals = async (req, res, next) => {
  try {
    const vendorId = req.user.id;
    const { status, startDate, endDate } = req.query;
    
    // Build the query conditions
    const whereClause = {
      customer_id: vendorId
    };
    
    // Add status filter if provided
    if (status && ['pending', 'processing', 'completed', 'failed'].includes(status)) {
      whereClause.status = status;
    }
    
    // Add date range filter if provided
    if (startDate && endDate) {
      whereClause.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    const withdrawals = await CustomerWithdrawal.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });
    
    // Add bank_details to each withdrawal
    const processedWithdrawals = withdrawals.map(withdrawal => addBankDetails(withdrawal));
    
    return res.status(200).json({
      status: 'success',
      results: processedWithdrawals.length,
      data: {
        withdrawals: processedWithdrawals
      }
    });
  } catch (error) {
    console.error('Error in getWithdrawals:', error);
    return next(new AppError(`Error fetching withdrawal requests: ${error.message}`, 500));
  }
};

/**
 * Get a specific withdrawal request by ID
 */
exports.getWithdrawalById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;
    
    const withdrawal = await CustomerWithdrawal.findOne({
      where: {
        id: id,
        customer_id: vendorId
      }
    });
    
    if (!withdrawal) {
      return next(new AppError('Withdrawal request not found or you do not have permission to view it', 404));
    }
    
    // Add bank_details to the withdrawal
    const processedWithdrawal = addBankDetails(withdrawal);
    
    return res.status(200).json({
      status: 'success',
      data: {
        withdrawal: processedWithdrawal
      }
    });
  } catch (error) {
    console.error('Error in getWithdrawalById:', error);
    return next(new AppError(`Error fetching withdrawal request: ${error.message}`, 500));
  }
};

/**
 * Create a new withdrawal request
 */
exports.createWithdrawal = async (req, res, next) => {
  try {
    const vendorId = req.user.id;
    
    const {
      amount,
      payment_channel,
      transaction_id,
      description,
      bank_info
    } = req.body;
    
    // Validate the request
    if (!amount || amount <= 0) {
      return next(new AppError('Please provide a valid withdrawal amount', 400));
    }
    
    if (!payment_channel) {
      return next(new AppError('Please provide a payment channel', 400));
    }
    
    // Validate against available revenue
    const validation = await revenueService.validateWithdrawalAmount(vendorId, amount);
    console.log(validation);
    if (!validation.isValid) {
      return next(new AppError(
        `Insufficient funds. Available balance: ₹${validation.available.toFixed(2)}, ` +
        `requested: ₹${Number(validation.requested).toFixed(2)}, ` +
        `shortfall: ₹${validation.shortfall.toFixed(2)}`,
        400
      ));
    }
    
    // Bank details validation for Bank Transfer payment channel
    if (payment_channel === 'Bank Transfer') {
      // Parse bank_info if it's a string
      const bankInfo = typeof bank_info === 'string' ? JSON.parse(bank_info) : bank_info;
      
      if (!bankInfo || !bankInfo.bank_name || !bankInfo.ifsc || !bankInfo.account_number) {
        return next(new AppError('Please provide complete bank information for bank transfers', 400));
      }
    }
    const totalWithdrawals = await CustomerWithdrawal.sum('amount', {
      where: {
        customer_id: vendorId,
        status: 'completed'
      }
    }) || 0;
    
    // Get total fees paid
    const totalFees = await CustomerWithdrawal.sum('fee', {
      where: {
        customer_id: vendorId,
        status: 'completed'
      }
    }) || 0;
    const currentBalance = validation?.available - totalWithdrawals - totalFees;

    console.log("dsadsacurrentBalance", currentBalance);
    
    // Create the withdrawal record
    const withdrawal = await CustomerWithdrawal.create({
      customer_id: vendorId,
      amount,
      fee: 0, // You may calculate a fee based on your business rules
      payment_channel,
      transaction_id,
      description,
      current_balance: currentBalance,
      bank_info: bank_info ? JSON.stringify(bank_info) : null,
      status: 'pending'
    });
    
    // Send notification about the new withdrawal request
    try {
      await eventNotificationService.notifyWithdrawalStatusChanged(
        withdrawal, 
        null,  // No old status since this is a new withdrawal
        'pending',
        vendorId,
        {
          payment_channel: payment_channel,
          description: description || 'Withdrawal request submitted'
        }
      );
      console.log('Withdrawal creation notification sent');
    } catch (notifError) {
      console.error('Error sending withdrawal notification:', notifError);
      // Continue with the response even if notification fails
    }
    
    // Add bank_details to the withdrawal
    const processedWithdrawal = addBankDetails(withdrawal);
    
    return res.status(201).json({
      status: 'success',
      data: {
        withdrawal: processedWithdrawal
      }
    });
  } catch (error) {
    console.error('Error in createWithdrawal:', error);
    return next(new AppError(`Error creating withdrawal request: ${error.message}`, 500));
  }
};

/**
 * Cancel a pending withdrawal request
 */
exports.cancelWithdrawal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;
    
    // Check if the withdrawal exists and belongs to the vendor
    const withdrawal = await CustomerWithdrawal.findOne({
      where: {
        id: id,
        customer_id: vendorId
      }
    });
    
    if (!withdrawal) {
      return next(new AppError('Withdrawal request not found or you do not have permission to modify it', 404));
    }
    
    // Check if the withdrawal is in a state that can be cancelled
    if (withdrawal.status !== 'pending' && withdrawal.status !== 'processing') {
      return next(new AppError(`Cannot cancel withdrawal request in ${withdrawal.status} status`, 400));
    }
    
    // Store the old status before updating
    const oldStatus = withdrawal.status;
    
    // Update withdrawal status to cancelled
    withdrawal.status = 'cancelled';
    withdrawal.updated_at = new Date();
    await withdrawal.save();
    
    // Send notification about the cancelled withdrawal
    try {
      await eventNotificationService.notifyWithdrawalStatusChanged(
        withdrawal, 
        oldStatus,
        'cancelled',
        vendorId,
        {
          reason: 'Cancellation requested by vendor',
          cancelled_at: new Date().toISOString()
        }
      );
      console.log('Withdrawal cancellation notification sent');
    } catch (notifError) {
      console.error('Error sending withdrawal cancellation notification:', notifError);
      // Continue with the response even if notification fails
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        withdrawal: addBankDetails(withdrawal)
      }
    });
  } catch (error) {
    console.error('Error in cancelWithdrawal:', error);
    return next(new AppError(`Error cancelling withdrawal request: ${error.message}`, 500));
  }
};

/**
 * Retry a failed withdrawal request
 */
exports.retryWithdrawal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;
    
    // Check if the withdrawal exists and belongs to the vendor
    const oldWithdrawal = await CustomerWithdrawal.findOne({
      where: {
        id: id,
        customer_id: vendorId
      }
    });
    
    if (!oldWithdrawal) {
      return next(new AppError('Withdrawal request not found or you do not have permission to modify it', 404));
    }
    
    // Check if the withdrawal is in a state that can be retried
    if (oldWithdrawal.status !== 'failed') {
      return next(new AppError(`Cannot retry withdrawal request in ${oldWithdrawal.status} status`, 400));
    }
    
    // Create a new withdrawal with the same details
    const newWithdrawal = await CustomerWithdrawal.create({
      customer_id: vendorId,
      amount: oldWithdrawal.amount,
      payment_channel: oldWithdrawal.payment_channel,
      transaction_id: req.body.transaction_id || oldWithdrawal.transaction_id,
      description: oldWithdrawal.description,
      bank_info: oldWithdrawal.bank_info,
      status: 'pending',
      fee: oldWithdrawal.fee,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // Send notification about the retried withdrawal
    try {
      await eventNotificationService.notifyWithdrawalStatusChanged(
        newWithdrawal, 
        'failed', // Previous withdrawal was failed
        'pending', // New withdrawal status
        vendorId,
        {
          retry_of: oldWithdrawal.id.toString(),
          original_withdrawal_date: oldWithdrawal.created_at,
          reason: 'Withdrawal retried by vendor'
        }
      );
      console.log('Withdrawal retry notification sent');
    } catch (notifError) {
      console.error('Error sending withdrawal retry notification:', notifError);
      // Continue with the response even if notification fails
    }
    
    // Add bank_details to the new withdrawal
    const processedWithdrawal = addBankDetails(newWithdrawal);
    
    return res.status(201).json({
      status: 'success',
      message: 'Withdrawal request retried successfully',
      data: {
        withdrawal: processedWithdrawal
      }
    });
  } catch (error) {
    console.error('Error in retryWithdrawal:', error);
    return next(new AppError(`Error retrying withdrawal request: ${error.message}`, 500));
  }
};

/**
 * Generate and download withdrawal data in CSV format
 */
exports.exportWithdrawalsCSV = async (req, res, next) => {
  try {
    const vendorId = req.user.id;
    const { status, startDate, endDate } = req.query;
    
    // Build the query conditions
    const whereClause = {
      customer_id: vendorId
    };
    
    // Add status filter if provided
    if (status && ['pending', 'processing', 'completed', 'failed'].includes(status)) {
      whereClause.status = status;
    }
    
    // Add date range filter if provided
    if (startDate && endDate) {
      whereClause.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    const withdrawals = await CustomerWithdrawal.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });
    
    if (withdrawals.length === 0) {
      return next(new AppError('No withdrawal data to export', 404));
    }
    
    // Process withdrawals to include bank_details
    const processedWithdrawals = withdrawals.map(withdrawal => addBankDetails(withdrawal));
    
    // Create a temporary file path for the CSV
    const tempFilePath = `./temp-withdrawals-${Date.now()}.csv`;
    
    // Create CSV writer
    const csvWriter = createCsvWriter({
      path: tempFilePath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'amount', title: 'Amount' },
        { id: 'fee', title: 'Fee' },
        { id: 'payment_channel', title: 'Payment Channel' },
        { id: 'status', title: 'Status' },
        { id: 'transaction_id', title: 'Transaction ID' },
        { id: 'description', title: 'Description' },
        { id: 'bank_info', title: 'Bank Information' },
        { id: 'bank_name', title: 'Bank Name' },
        { id: 'ifsc', title: 'IFSC Code' },
        { id: 'account_number', title: 'Account Number' },
        { id: 'created_at', title: 'Created At' },
        { id: 'updated_at', title: 'Updated At' }
      ]
    });
        
    // Format withdrawals data for CSV
    const records = processedWithdrawals.map(withdrawal => {
      const { bank_details } = withdrawal.dataValues;
      const formattedBankInfo = `Bank: ${bank_details.bank_name || ''}, IFSC: ${bank_details.ifsc || ''}, Account: ${bank_details.account_number || ''}`;
      
      return {
        id: withdrawal.id,
        amount: withdrawal.amount,
        fee: withdrawal.fee,
        payment_channel: withdrawal.payment_channel,
        status: withdrawal.status,
        transaction_id: withdrawal.transaction_id || '',
        description: withdrawal.description || '',
        bank_info: formattedBankInfo,
        bank_name: bank_details.bank_name || '',
        ifsc: bank_details.ifsc || '',
        account_number: bank_details.account_number || '',
        created_at: withdrawal.created_at ? new Date(withdrawal.created_at).toISOString() : '',
        updated_at: withdrawal.updated_at ? new Date(withdrawal.updated_at).toISOString() : ''
      };
    });
    
    // Write records to CSV file
    await csvWriter.writeRecords(records);
    
    // Send the CSV file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="withdrawals.csv"');
    
    // Read the file and send it
    const fs = require('fs');
    const fileContent = fs.readFileSync(tempFilePath);
    res.status(200).send(fileContent);
    
    // Delete the temporary file
    fs.unlinkSync(tempFilePath);
  } catch (error) {
    console.error('Error in exportWithdrawalsCSV:', error);
    return next(new AppError(`Error exporting withdrawal data: ${error.message}`, 500));
  }
};

/**
 * Generate and download withdrawal data in Excel format
 */
/**
 * Admin - Update the status of a withdrawal request
 * This endpoint should only be accessible to admins
 */
exports.updateWithdrawalStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note, transaction_id } = req.body;
    
    // Validate the request
    if (!status || !['pending', 'processing', 'approved', 'completed', 'rejected', 'cancelled'].includes(status)) {
      return next(new AppError('Please provide a valid status', 400));
    }
    
    // Check if admin authorization is present
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isAdmin) {
      return next(new AppError('You do not have permission to update withdrawal status', 403));
    }
    
    // Find the withdrawal
    const withdrawal = await CustomerWithdrawal.findByPk(id);
    
    if (!withdrawal) {
      return next(new AppError('Withdrawal request not found', 404));
    }
    
    // Store old status for notification
    const oldStatus = withdrawal.status;
    
    // Update withdrawal status and other fields
    withdrawal.status = status;
    
    if (transaction_id) {
      withdrawal.transaction_id = transaction_id;
    }
    
    // Add note to description if provided
    if (note) {
      const existingDescription = withdrawal.description || '';
      withdrawal.description = `${existingDescription}\n[${new Date().toISOString()}] Admin note: ${note}`;
    }
    
    withdrawal.updated_at = new Date();
    await withdrawal.save();
    
    // Send notification to the vendor about status change
    try {
      const vendorId = withdrawal.customer_id;
      
      // Prepare additional info for notification
      const additionalInfo = {
        updated_by: 'admin',
        admin_note: note || '',
        updated_at: new Date().toISOString()
      };
      
      if (transaction_id) {
        additionalInfo.transaction_id = transaction_id;
      }
      
      // If status is rejected, add reason to notification
      if (status === 'rejected') {
        additionalInfo.reason = note || 'Rejected by administrator';
      }
      
      // Send the notification
      await eventNotificationService.notifyWithdrawalStatusChanged(
        withdrawal,
        oldStatus,
        status,
        vendorId,
        additionalInfo
      );
      
      console.log(`Withdrawal status update notification sent to vendor ${vendorId}`);
    } catch (notifError) {
      console.error('Error sending withdrawal status update notification:', notifError);
      // Continue with the response even if notification fails
    }
    
    return res.status(200).json({
      status: 'success',
      message: `Withdrawal status updated to ${status} successfully`,
      data: {
        withdrawal: addBankDetails(withdrawal)
      }
    });
  } catch (error) {
    console.error('Error in updateWithdrawalStatus:', error);
    return next(new AppError(`Error updating withdrawal status: ${error.message}`, 500));
  }
};

exports.exportWithdrawalsExcel = async (req, res, next) => {
  try {
    const vendorId = req.user.id;
    const { status, startDate, endDate } = req.query;
    
    // Build the query conditions
    const whereClause = {
      customer_id: vendorId
    };
    
    // Add status filter if provided
    if (status && ['pending', 'processing', 'completed', 'failed'].includes(status)) {
      whereClause.status = status;
    }
    
    // Add date range filter if provided
    if (startDate && endDate) {
      whereClause.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    const withdrawals = await CustomerWithdrawal.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });
    
    if (withdrawals.length === 0) {
      return next(new AppError('No withdrawal data to export', 404));
    }
    
    // Process withdrawals to include bank_details
    const processedWithdrawals = withdrawals.map(withdrawal => addBankDetails(withdrawal));
    
    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Withdrawals');
    
    // Define columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Fee', key: 'fee', width: 10 },
      { header: 'Payment Channel', key: 'payment_channel', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Transaction ID', key: 'transaction_id', width: 25 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Bank Name', key: 'bank_name', width: 20 },
      { header: 'IFSC', key: 'ifsc', width: 15 },
      { header: 'Account Number', key: 'account_number', width: 20 },
      { header: 'Created At', key: 'created_at', width: 20 },
      { header: 'Updated At', key: 'updated_at', width: 20 }
    ];
    
    // Add styling to header row
    worksheet.getRow(1).font = { bold: true };
    
    // Add rows to the worksheet
    processedWithdrawals.forEach(withdrawal => {
      const { bank_details } = withdrawal.dataValues;
      
      worksheet.addRow({
        id: withdrawal.id,
        amount: withdrawal.amount,
        fee: withdrawal.fee,
        payment_channel: withdrawal.payment_channel,
        status: withdrawal.status,
        transaction_id: withdrawal.transaction_id || '',
        description: withdrawal.description || '',
        bank_name: bank_details.bank_name || '',
        ifsc: bank_details.ifsc || '',
        account_number: bank_details.account_number || '',
        created_at: withdrawal.created_at ? new Date(withdrawal.created_at).toISOString() : '',
        updated_at: withdrawal.updated_at ? new Date(withdrawal.updated_at).toISOString() : ''
      });
    });
    
    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="withdrawals.xlsx"');
    
    // Send the Excel file
    res.status(200).send(buffer);
  } catch (error) {
    console.error('Error in exportWithdrawalsExcel:', error);
    return next(new AppError(`Error exporting withdrawal data: ${error.message}`, 500));
  }
};
