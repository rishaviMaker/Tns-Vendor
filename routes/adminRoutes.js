const express = require("express");
const adminController = require("../controllers/adminController");
const productController = require("../controllers/productController");
const orderController = require("../controllers/orderController");
const warehouseController = require("../controllers/warehouseController");
const customerController = require("../controllers/customerController");
const storeController = require("../controllers/storeController");
const withdrawalController = require("../controllers/withdrawalController");
const { authenticate } = require("../middlewares/adminAuth");

const router = express.Router();

router.post("/login", adminController.login);
router.get("/dashboard", authenticate, adminController.getDashboard);
router.get(
  "/all-warehouses",
  authenticate,
  warehouseController.getAllAdminWarehouse
);
router.get("/all-vendors", authenticate, adminController.getAllVendors);
router.put("/vendor/:id/approve", authenticate, adminController.approveVendor);
router.put("/vendor/:id/reject", authenticate, adminController.rejectVendor);
router.post("/vendor/create", authenticate, adminController.createVendor);
router.get(
  "/all-product-requests",
  authenticate,
  adminController.getAllProductRequests
);
router.get("/all-products", authenticate, adminController.getAllProducts);
router.get("/product/:id", authenticate, adminController.getProduct);
router.get("/vendor/:id", authenticate, adminController.getVendor);
router.put("/vendor/:id", authenticate, adminController.updateVendor);
router.get(
  "/product-request/:id",
  authenticate,
  adminController.getProductRequest
);
router.put(
  "/product-request/:id/approve",
  authenticate,
  adminController.ApproveProductRequest
);
router.put(
  "/product-request/:id/reject",
  authenticate,
  adminController.RejectProductRequest
);
router.delete(
  "/product-request/:id",
  authenticate,
  adminController.DeleteProductRequest
);
router.delete("/product/:id", authenticate, adminController.DeleteProduct);
router.put(
  "/product/:id",
  authenticate,
  productController.upload,
  productController.updateProductAdmin
);
router.post(
  "/product/create",
  authenticate,
  productController.upload,
  productController.createAdminProduct
);

///////////////ORDER//////////////////////////
router.get("/all-orders", authenticate, orderController.getAllOrderList);
router.get("/order/:id", authenticate, orderController.getOrder);
router.post("/order/:id", authenticate, orderController.updateOrder);
router.put("/order/:id/confirm", authenticate, orderController.confirmOrder);

///////////////CUSTOMER//////////////////////////
router.get("/all-customers", authenticate, customerController.getAllCustomer);
router.get("/customer/:id", authenticate, customerController.getCustomerById);
router.put("/customer/:id/lock", authenticate, customerController.LockCustomer);
router.put(
  "/customer/:id/active",
  authenticate,
  customerController.UnlockCustomer
);

//////////////Store/////////////////////////////////////////
router.get("/all-stores", authenticate, storeController.getAllStores);

////////////////Withdrawal//////////////////////////////////////
router.get(
  "/all-withdrawals",
  authenticate,
  withdrawalController.getAllWithdrawals
);
router.get(
  "/withdrawal/:id",
  authenticate,
  withdrawalController.getWithdrawalByIdAdmin
);

module.exports = router;
