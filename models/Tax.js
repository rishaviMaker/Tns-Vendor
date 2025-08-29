const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Tax = sequelize.define(
  "Tax",
  {
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    percentage: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "ec_taxes",
    timestamps: false,
  }
);



module.exports = { Tax };
