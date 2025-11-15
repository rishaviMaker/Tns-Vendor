const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const { ProductLabelsProduct } = require("./ProductLabelsProduct");

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

ProductLabel.hasMany(ProductLabelsProduct, { foreignKey: "product_label_id" });
ProductLabelsProduct.belongsTo(ProductLabel, { foreignKey: "product_label_id" });


module.exports = { ProductLabel };
