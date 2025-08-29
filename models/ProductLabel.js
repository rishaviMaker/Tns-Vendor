const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const ProductLabel = sequelize.define(
  "ProductLabel",
  {
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "ec_product_labels",
    timestamps: false,
  }
);



module.exports = { ProductLabel };
