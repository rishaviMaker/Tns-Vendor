const { Warehouse } = require("../models/Warehouse");
const { WarehousePincode } = require("../models/Pincode");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

/**
 * Get all stores
 * @route GET /api/stores
 * @access Admin
 */
exports.getAllWarehousePincode = async (req, res, next) => {
  const { warehouse_id } = req.params;
  try {
    const warehouse = await WarehousePincode.findAll({
      where: { warehouse_id }
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

exports.getWarehousePincodeById = async (req, res, next) => {
  try {
    const pincode = await WarehousePincode.findByPk(req.params.id);
    if (!pincode)
      return res.status(404).json({ status: "fail", message: "Not found" });
    res.status(200).json({ status: "success", data: pincode });
  } catch (error) {
    next(error);
  }
};

// ✅ Create
exports.createWarehousePincode = async (req, res, next) => {
  try {
    const newPincode = await WarehousePincode.create(req.body);
    res.status(201).json({ status: "success", data: newPincode });
  } catch (error) {
    next(error);
  }
};

// ✅ Update
exports.updateWarehousePincode = async (req, res, next) => {
  try {
    const updated = await WarehousePincode.update(req.body, {
      where: { id: req.params.id },
    });
    if (!updated[0])
      return res.status(404).json({ status: "fail", message: "Not found" });
    res
      .status(200)
      .json({ status: "success", message: "Updated successfully" });
  } catch (error) {
    next(error);
  }
};

// ✅ Delete
exports.deleteWarehousePincode = async (req, res, next) => {
  try {
    const deleted = await WarehousePincode.destroy({
      where: { id: req.params.id },
    });
    if (!deleted)
      return res.status(404).json({ status: "fail", message: "Not found" });
    res.json({ status: "success", message: "Deleted successfully" });
  } catch (error) {
    next(error);
  }
};

exports.uploadExcel = async (req, res, next) => {
  try {
    const { warehouse_id } = req.params;

    if (!req.file) {
      return res
        .status(400)
        .json({ status: "fail", message: "No file uploaded" });
    }

    // ✅ Check if warehouse exists
    const warehouse = await Warehouse.findByPk(warehouse_id);
    if (!warehouse) {
      fs.unlinkSync(req.file.path);
      return res
        .status(404)
        .json({ status: "fail", message: "Warehouse not found" });
    }

    const filePath = path.join(__dirname, `../${req.file.path}`);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (data.length === 0) {
      fs.unlinkSync(filePath);
      return res
        .status(400)
        .json({ status: "fail", message: "Excel file is empty" });
    }

    // ✅ Expected columns: pincode, location
    const pincodes = data.map((item) => ({
      pincode: String(item.pincode).trim(),
      location: item.location ? String(item.location).trim() : null,
      warehouse_id: warehouse_id,
    }));

    // ✅ Fetch existing pincodes for this warehouse
    const existingPincodes = await WarehousePincode.findAll({
      where: { warehouse_id },
      attributes: ["pincode"],
    });
    const existingPincodeSet = new Set(existingPincodes.map((p) => p.pincode));

    // ✅ Filter new pincodes (skip duplicates)
    const newPincodes = [];
    const skippedPincodes = [];

    pincodes.forEach((item) => {
      if (!existingPincodeSet.has(item.pincode)) {
        newPincodes.push(item);
      } else {
        skippedPincodes.push(item.pincode);
      }
    });

    // ✅ Bulk insert only new pincodes
    if (newPincodes.length > 0) {
      await WarehousePincode.bulkCreate(newPincodes);
    }

    fs.unlinkSync(filePath); // Delete uploaded file

    res.status(201).json({
      status: "success",
      message: "Excel processed successfully",
      warehouse_id: warehouse_id,
      inserted_records: newPincodes.length,
      skipped_duplicates: skippedPincodes.length,
      skipped_list: skippedPincodes,
    });
  } catch (error) {
    next(error);
  }
};
