const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const ProductRequestLabelsProduct = sequelize.define(
  "ProductRequestLabelsProduct",
  {
    product_request_id: {
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
    tableName: "product_request_label_products",
    timestamps: false,
  }
);



module.exports = { ProductRequestLabelsProduct };
