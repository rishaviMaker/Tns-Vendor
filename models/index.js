const { Customer } = require("./Customer");
const { Payment } = require("./Payment");
const { OrderProduct } = require("./OrderProduct");
const { OrderHistory } = require("./OrderHistory");
const { OrderAddress } = require("./OrderAddress");
const { User } = require("./User");
const { Order } = require("./Order");
const { Product } = require("./Product");
const { ProductCategoryProduct } = require("./ProductCategoryProduct");
const { ProductLabelsProduct } = require("./ProductLabelsProduct");
const { ProductCollectionProduct } = require("./ProductCollectionProduct");

// Order ↔ Customer
Order.belongsTo(Customer, { foreignKey: "user_id", as: "customer" });
Customer.hasMany(Order, { foreignKey: "user_id", as: "orders" });

// Order ↔ Payment
Order.belongsTo(Payment, { foreignKey: "payment_id", as: "payment" });
Payment.hasOne(Order, { foreignKey: "payment_id", as: "order" });

// Order ↔ OrderProduct
Order.hasMany(OrderProduct, { foreignKey: "order_id", as: "orderProducts" });
OrderProduct.belongsTo(Order, { foreignKey: "order_id", as: "order" });

// Order ↔ OrderHistory
Order.hasMany(OrderHistory, { foreignKey: "order_id", as: "orderHistories" });
OrderHistory.belongsTo(Order, { foreignKey: "order_id", as: "order" });

// OrderHistory ↔ User
OrderHistory.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Order ↔ OrderAddress
Order.hasMany(OrderAddress, { foreignKey: "order_id", as: "orderAddresses" });
OrderAddress.belongsTo(Order, { foreignKey: "order_id", as: "order" });

module.exports = {
  Customer,
  Payment,
  Order,
  OrderProduct,
  OrderHistory,
  OrderAddress,
  User,
};
