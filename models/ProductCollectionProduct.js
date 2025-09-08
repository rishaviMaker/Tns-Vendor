const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const ProductCollectionProduct = sequelize.define(
  "ProductCollectionProduct",
  {
    product_collection_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  },
  {
    tableName: "ec_product_collection_products",
    timestamps: false,
  }
);



module.exports = { ProductCollectionProduct };
