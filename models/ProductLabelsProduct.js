const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const ProductLabelsProduct = sequelize.define(
  "ProductLabelsProduct",
  {
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      primaryKey: true,
    },
    product_label_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      primaryKey: true,
    }
  },
  {
    tableName: "ec_product_label_products",
    timestamps: false,
  }
);



module.exports = { ProductLabelsProduct };
