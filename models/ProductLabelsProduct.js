const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const ProductLabelsProduct = sequelize.define(
  "ProductLabelsProduct",
  {
    label_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  },
  {
    tableName: "ec_product_label_products",
    timestamps: false,
  }
);



module.exports = { ProductLabelsProduct };
