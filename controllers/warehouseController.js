const { Warehouse } = require("../models/Warehouse");
const { Vendor } = require("../models/Vendor");

/**
 * Get all stores
 * @route GET /api/stores
 * @access Admin
 */
exports.getAllWarehouse = async (req, res, next) => {
  try {
    const { id } = req.user;
    const warehouse = await Warehouse.findAll({
      where: { vendor_id: id },
    });

    res.status(200).json({
      status: "success",
      results: warehouse.length,
      data: {
        warehouse,
      },
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
exports.getWarehouseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const warehouse = await Warehouse.findByPk(id);

    if (!warehouse) {
      return res.status(404).json({
        status: "fail",
        message: "Warehouse not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        warehouse,
      },
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
exports.getWarehouseByVendorId = async (req, res, next) => {
  try {
    const { vendorId } = req.params;

    // Ensure vendor exists
    const vendor = await Vendor.findByPk(vendorId);
    if (!vendor) {
      return res.status(404).json({
        status: "fail",
        message: "Vendor not found",
      });
    }

    // Find store by customer_id (vendor ID)
    const warehouse = await Warehouse.findOne({
      where: { vendor_id: vendorId },
    });

    if (!warehouse) {
      return res.status(404).json({
        status: "fail",
        message: "Warehouse not found for this vendor",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        warehouse,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createWarehouse = async (req, res, next) => {
  try {
    const {
      name,
      address,
      latitude,
      longitude,
      capacity,
      contact_person,
      contact_number,
      status,
      vendor_id,
      store_id,
    } = req.body;

    // Validate required fields
    if (!name || !address || !vendor_id) {
      return res.status(400).json({
        status: "fail",
        message: "name, address, and vendor_id are required",
      });
    }

    // Check if vendor exists
    const vendor = await Vendor.findByPk(vendor_id);
    if (!vendor) {
      return res.status(404).json({
        status: "fail",
        message: "Vendor not found",
      });
    }

    // Create warehouse
    const newWarehouse = await Warehouse.create({
      name,
      address,
      latitude,
      longitude,
      capacity,
      contact_person,
      contact_number,
      status: status || "draft",
      vendor_id,
      store_id: store_id || null,
    });

    res.status(201).json({
      status: "success",
      data: {
        warehouse: newWarehouse,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update warehouse by ID
 * @route PUT /api/stores/:id
 * @access Admin or Store Owner
 */
exports.updateWarehouse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      address,
      latitude,
      longitude,
      capacity,
      contact_person,
      contact_number,
      status,
      vendor_id,
      store_id,
    } = req.body;

    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) {
      return res.status(404).json({
        status: "fail",
        message: "Warehouse not found",
      });
    }

    // If vendor_id is updated, check if vendor exists
    if (vendor_id) {
      const vendor = await Vendor.findByPk(vendor_id);
      if (!vendor) {
        return res.status(404).json({
          status: "fail",
          message: "Vendor not found",
        });
      }
    }

    await warehouse.update({
      name: name !== undefined ? name : warehouse.name,
      address: address !== undefined ? address : warehouse.address,
      latitude: latitude !== undefined ? latitude : warehouse.latitude,
      longitude: longitude !== undefined ? longitude : warehouse.longitude,
      capacity: capacity !== undefined ? capacity : warehouse.capacity,
      contact_person:
        contact_person !== undefined
          ? contact_person
          : warehouse.contact_person,
      contact_number:
        contact_number !== undefined
          ? contact_number
          : warehouse.contact_number,
      status: status !== undefined ? status : warehouse.status,
      vendor_id: vendor_id !== undefined ? vendor_id : warehouse.vendor_id,
      store_id: store_id !== undefined ? store_id : warehouse.store_id,
    });

    res.status(200).json({
      status: "success",
      data: {
        warehouse,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete warehouse by ID
 * @route DELETE /api/stores/:id
 * @access Admin
 */
exports.deleteWarehouse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) {
      return res.status(404).json({
        status: "fail",
        message: "Warehouse not found",
      });
    }

    await warehouse.destroy();

    res.status(200).json({
      status: "success",
      message: "Warehouse deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
