const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const ProductBrand = sequelize.define(
  "ProductBrand",
  {
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "ec_brands",
    timestamps: false,
  }
);

module.exports = { ProductBrand };
