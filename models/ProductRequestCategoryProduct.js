const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const ProductRequestCategoryProduct = sequelize.define(
  "ProductRequestCategoryProduct",
  {
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    product_request_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  },
  {
    tableName: "product_request_category_product",
    timestamps: false,
  }
);



module.exports = { ProductRequestCategoryProduct };
