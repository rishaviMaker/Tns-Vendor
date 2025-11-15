const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const ProductRequestCollectionProduct = sequelize.define(
  "ProductRequestCollectionProduct",
  {
    product_collection_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    product_request_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  },
  {
    tableName: "product_request_collection_products",
    timestamps: false,
  }
);



module.exports = { ProductRequestCollectionProduct };
