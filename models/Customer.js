const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Customer = sequelize.define(
  "Customer",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Name of customer",
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Email of customer",
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Phone number of customer",
    },
    fcm_token: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "FCM token of customer",
    },
    remember_token: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Remember token of customer",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    confirmed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Confirmed at of customer",
    },
    status: {
      type: DataTypes.ENUM("activated", "locked"),
      defaultValue: "activated",
    },
  },
  {
    tableName: "ec_customers",
    timestamps: false,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);


module.exports = { Customer };
