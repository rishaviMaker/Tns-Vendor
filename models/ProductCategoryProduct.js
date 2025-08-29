const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const ProductCategoryProduct = sequelize.define(
  "ProductCategoryProduct",
  {
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  },
  {
    tableName: "ec_product_category_product",
    timestamps: false,
  }
);



module.exports = { ProductCategoryProduct };
