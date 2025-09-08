const { Customer } = require("../models/Customer");
const { Op, fn, col, where } = require("sequelize");

exports.getAllCustomer = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const status = req.query.status;
    const search = req.query.search;

    let whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    if (search) {
      whereClause.name = {
        [Op.or]: [
          where(fn("LOWER", col("name")), {
            [Op.like]: `%${search.toLowerCase()}%`,
          }),
          where(fn("LOWER", col("email")), {
            [Op.like]: `%${search.toLowerCase()}%`,
          }),
          where(fn("LOWER", col("phone")), {
            [Op.like]: `%${search.toLowerCase()}%`,
          }),
        ],
      };
    }

    const customers = await Customer.findAll({
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [["created_at", "DESC"]],
      attributes: {
        exclude: ["password"],
      },
      where: whereClause,
    });
    const count = await Customer.count({
      where: whereClause,
    });
    res.status(200).json({
      status: "success",
      results: customers.length,
      total: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        customers,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getCustomerById = async (req, res, next) => {
  try {
    const customer_id = req.params.id
    const customer = await Customer.findByPk(customer_id,{
      attributes: {
        exclude: ["password"],
      },
    });
    if(!customer){
      return res.status(404).json({
        status: "fail",
        message: "Customer not found",
      });
    }
    res.status(200).json({
      status: "success",
      data: {
        customer,
      },
    });
  } catch (error) {
    next(error);
  }
}

exports.LockCustomer = async (req, res, next) => {
    try {
        const customerId = req.params.id;
        const customer = await Customer.findByPk(customerId);
        if(!customer){
            return res.status(404).json({
                status: "fail",
                message: "Customer not found",
            });
        }
        customer.status = "locked";
        await customer.save();
        res.status(200).json({
            status: "success",
            message: "Customer locked successfully",
        });
    } catch (error) {
        next(error);
    }
};

exports.UnlockCustomer = async (req, res, next) => {
    try {
        const customerId = req.params.id;
        const customer = await Customer.findByPk(customerId);
        if(!customer){
            return res.status(404).json({
                status: "fail",
                message: "Customer not found",
            });
        }
        customer.status = "active";
        await customer.save();
        res.status(200).json({
            status: "success",
            message: "Customer unlocked successfully",
        });
    } catch (error) {
        next(error);
    }
}