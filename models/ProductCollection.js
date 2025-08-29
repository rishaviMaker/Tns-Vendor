const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const ProductCollection = sequelize.define(
  "ProductCollection",
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
    tableName: "ec_product_collections",
    timestamps: false,
  }
);


module.exports = { ProductCollection };
