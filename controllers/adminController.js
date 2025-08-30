const { User } = require("../models/User");
const { Product } = require("../models/Product");
const { ProductRequest } = require("../models/ProductRequest");
const { Vendor } = require("../models/Vendor");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//Auth Controller
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({
                status: "fail",
                message: "Invalid email or password",
            });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                status: "fail",
                message: "Invalid email or password",
            });
        }

        const token = jwt.sign({ id: user.id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.status(200).json({
            status: "success",
            data: {
                user,
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.findAll();
        res.status(200).json({
            status: "success",
            data: {
                users
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllVendors = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const vendors = await Vendor.findAll({
            attributes: { exclude: ['password'] },
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
            order: [['createdAt', 'DESC']]
        });
        const count = await Vendor.count();
        res.status(200).json({
            status: "success",
            results: vendors.length,
            total: count,
            totalPages: Math.ceil(count / parseInt(limit)),
            currentPage: parseInt(page),
            data: {
                vendors
            }
        });
    } catch (error) {
        console.log(error)
        next(error);
    }
};

exports.approveVendor = async (req, res, next) => {
    try {
        const { id } = req.params;
        const vendor = await Vendor.findByPk(id);
        if (!vendor) {
            return next(new AppError('Vendor not found', 404));
        }
        const updatedVendor = await vendor.update({ isVerified: true });
        res.status(200).json({
            status: "success",
            data: {
                vendor: updatedVendor
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.rejectVendor = async (req, res, next) => {
    try {
        const { id } = req.params;
        const vendor = await Vendor.findByPk(id);
        if (!vendor) {
            return next(new AppError('Vendor not found', 404));
        }
        const updatedVendor = await vendor.update({ isVerified: false });
        res.status(200).json({
            status: "success",
            data: {
                vendor: updatedVendor
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getVendor = async (req, res, next) => {
    try {
        const { id } = req.params;
        const vendor = await Vendor.findByPk(id, {
            attributes: { exclude: ['password'] }
        });
        if (!vendor) {
            return next(new AppError('Vendor not found', 404));
        }
        res.status(200).json({
            status: "success",
            data: {
                vendor
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.updateVendor = async (req, res, next) => {
    try {
        const { id } = req.params;
        const vendor = await Vendor.findByPk(id);
        if (!vendor) {
            return next(new AppError('Vendor not found', 404));
        }
        const updatedVendor = await vendor.update(req.body);
        res.status(200).json({
            status: "success",
            data: {
                vendor: updatedVendor
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllProductRequests = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const productRequests = await ProductRequest.findAll({
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
            order: [['created_at', 'DESC']]
        });
        const count = await ProductRequest.count();
        res.status(200).json({
            status: "success",
            results: productRequests.length,
            total: count,
            totalPages: Math.ceil(count / parseInt(limit)),
            currentPage: parseInt(page),
            data: {
                productRequests
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getProductRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const productRequest = await ProductRequest.findByPk(id, {
            attributes: { exclude: ['password'] }
        });
        if (!productRequest) {
            return next(new AppError('Product request not found', 404));
        }
        res.status(200).json({
            status: "success",
            data: {
                productRequest
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.ApproveProductRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const productRequest = await ProductRequest.findByPk(id);
        if (!productRequest) {
            return next(new AppError('Product request not found', 404));
        }
        const updatedProductRequest = await productRequest.update({ status: 'approved' });
        res.status(200).json({
            status: "success",
            data: {
                productRequest: updatedProductRequest
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.RejectProductRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const productRequest = await ProductRequest.findByPk(id);
        if (!productRequest) {
            return next(new AppError('Product request not found', 404));
        }
        const updatedProductRequest = await productRequest.update({ status: 'rejected' });
        res.status(200).json({
            status: "success",
            data: {
                productRequest: updatedProductRequest
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.DeleteProductRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const productRequest = await ProductRequest.findByPk(id);
        if (!productRequest) {
            return next(new AppError('Product request not found', 404));
        }
        const deletedProductRequest = await productRequest.destroy();
        res.status(200).json({
            status: "success",
            data: {
                productRequest: deletedProductRequest
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.DeleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);
        if (!product) {
            return next(new AppError('Product not found', 404));
        }
        const deletedProduct = await product.destroy();
        res.status(200).json({
            status: "success",
            data: {
                product: deletedProduct
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllProducts = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const products = await Product.findAll({
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
            order: [['created_at', 'DESC']]
        });
        const count = await Product.count();
        res.status(200).json({
            status: "success",
            results: products.length,
            total: count,
            totalPages: Math.ceil(count / parseInt(limit)),
            currentPage: parseInt(page),
            data: {
                products
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);
        if (!product) {
            return next(new AppError('Product not found', 404));
        }
        res.status(200).json({
            status: "success",
            data: {
                product
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);
        if (!product) {
            return next(new AppError('Product not found', 404));
        }
        const updatedProduct = await product.update(req.body);
        res.status(200).json({
            status: "success",
            data: {
                product: updatedProduct
            }
        });
    } catch (error) {
        next(error);
    }
};

