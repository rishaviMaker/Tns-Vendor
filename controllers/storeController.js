const { Store } = require('../models/Store');
const { Vendor } = require('../models/Vendor');

/**
 * Get all stores
 * @route GET /api/stores
 * @access Admin
 */
exports.getAllStores = async (req, res, next) => {
  try {
    const stores = await Store.findAll();

    res.status(200).json({
      status: 'success',
      results: stores.length,
      data: {
        stores
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get store by ID
 * @route GET /api/stores/:id
 * @access Admin or Store Owner
 */
exports.getStoreById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const store = await Store.findByPk(id);
    
    if (!store) {
      return res.status(404).json({
        status: 'fail',
        message: 'Store not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        store
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get store by vendor ID
 * @route GET /api/stores/vendor/:vendorId
 * @access Admin or Store Owner
 */
exports.getStoreByVendorId = async (req, res, next) => {
  try {
    const { vendorId } = req.params;
    
    // Ensure vendor exists
    const vendor = await Vendor.findByPk(vendorId);
    if (!vendor) {
      return res.status(404).json({
        status: 'fail',
        message: 'Vendor not found'
      });
    }
    
    // Find store by customer_id (vendor ID)
    const store = await Store.findOne({ where: { customer_id: vendorId } });
    
    if (!store) {
      return res.status(404).json({
        status: 'fail',
        message: 'Store not found for this vendor'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        store
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update store details
 * @route PATCH /api/stores/:id
 * @access Admin or Store Owner
 */
exports.updateStore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      address,
      city,
      state,
      country,
      gst_no,
      pan_no,
      established_year,
      business_type,
      logo,
      description,
      content,
      status
    } = req.body;
    
    const store = await Store.findByPk(id);
    
    if (!store) {
      return res.status(404).json({
        status: 'fail',
        message: 'Store not found'
      });
    }
    
    // Update store fields
    if (name) store.name = name;
    if (phone) store.phone = phone;
    if (address) store.address = address;
    if (city) store.city = city;
    if (state) store.state = state;
    if (country) store.country = country;
    if (gst_no) store.gst_no = gst_no;
    if (pan_no) store.pan_no = pan_no;
    if (established_year) store.established_year = established_year;
    if (business_type) store.business_type = business_type;
    if (logo) store.logo = logo;
    if (description) store.description = description;
    if (content) store.content = content;
    if (status && ['pending', 'published'].includes(status)) store.status = status;
    
    // Update timestamp
    store.updated_at = new Date();
    
    await store.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        store
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update store status
 * @route PATCH /api/stores/:id/status
 * @access Admin
 */
exports.updateStoreStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['pending', 'published'].includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid status. Must be either "pending" or "published"'
      });
    }
    
    const store = await Store.findByPk(id);
    
    if (!store) {
      return res.status(404).json({
        status: 'fail',
        message: 'Store not found'
      });
    }
    
    store.status = status;
    store.updated_at = new Date();
    
    // If status is being set to published, update vendor_verified_at timestamp
    if (status === 'published' && !store.vendor_verified_at) {
      store.vendor_verified_at = new Date();
    }
    
    await store.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        store
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify vendor
 * @route PATCH /api/stores/:id/verify-vendor
 * @access Admin
 */
exports.verifyVendor = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const store = await Store.findByPk(id);
    
    if (!store) {
      return res.status(404).json({
        status: 'fail',
        message: 'Store not found'
      });
    }
    
    // Set vendor verification timestamp
    store.vendor_verified_at = new Date();
    store.updated_at = new Date();
    
    // Also update status to published if it's pending
    if (store.status === 'pending') {
      store.status = 'published';
    }
    
    await store.save();
    
    // Also update the vendor's verification status if needed
    const vendor = await Vendor.findByPk(store.customer_id);
    if (vendor && !vendor.isVerified) {
      vendor.isVerified = true;
      await vendor.save();
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Vendor verified successfully',
      data: {
        store
      }
    });
  } catch (error) {
    next(error);
  }
};
