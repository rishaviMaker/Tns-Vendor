const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const { ProductCollectionProduct } = require("./ProductCollectionProduct");

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

ProductCollection.hasMany(ProductCollectionProduct, { foreignKey: "product_collection_id" });
ProductCollectionProduct.belongsTo(ProductCollection, { foreignKey: "product_collection_id" });

module.exports = { ProductCollection };
