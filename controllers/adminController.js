const { User } = require("../models/User");
const { Product } = require("../models/Product");
const { ProductRequest } = require("../models/ProductRequest");
const { Vendor } = require("../models/Vendor");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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

    const token = jwt.sign(
      { id: user.id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    res.status(200).json({
      status: "success",
      data: {
        user,
        token,
      },
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
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllVendors = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const vendors = await Vendor.findAll({
      attributes: { exclude: ["password"] },
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [["createdAt", "DESC"]],
    });
    const count = await Vendor.count();
    res.status(200).json({
      status: "success",
      results: vendors.length,
      total: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        vendors,
      },
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.approveVendor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findByPk(id);
    if (!vendor) {
      return next(new AppError("Vendor not found", 404));
    }
    const updatedVendor = await vendor.update({
      isVerified: true,
      status: "approved",
    });
    res.status(200).json({
      status: "success",
      message: "Vendor approved successfully",
      data: {
        vendor: updatedVendor,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createVendor = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      password,
      confirmPassword,
      businessType,
      mobileNumber,
      alternativeMobileNumber,
      position,
      idProofType,
      idProofNumber,
      companyName,
      shopUrl,
      gstinNumber,
      panNumber,
      establishedYear,
      shopPhoneNumber,
      street,
      city,
      state,
      postalCode,
      country,
      deviceToken,
      dob, // Date of birth for DL verification
    } = req.body;

    // Validate required fields
    if (!fullName) {
      return next(new AppError("Full name is required", 400));
    }

    if (!email) {
      return next(new AppError("Email is required", 400));
    }

    if (!password) {
      return next(new AppError("Password is required", 400));
    }

    if (!businessType) {
      return next(new AppError("Business type is required", 400));
    }

    if (!mobileNumber) {
      return next(new AppError("Mobile number is required", 400));
    }

    if (!companyName) {
      return next(new AppError("Company name is required", 400));
    }

    // Validate password match
    if (password !== confirmPassword) {
      return next(new AppError("Passwords do not match", 400));
    }

    // Validate password strength
    if (password.length < 8) {
      return next(
        new AppError("Password must be at least 8 characters long", 400)
      );
    }

    if (!email) {
      return next(new AppError("Email is required", 400));
    }

    if (!password) {
      return next(new AppError("Password is required", 400));
    }

    if (!businessType) {
      return next(new AppError("Business type is required", 400));
    }

    if (!mobileNumber) {
      return next(new AppError("Mobile number is required", 400));
    }

    if (!companyName) {
      return next(new AppError("Company name is required", 400));
    }

    // Validate password match
    if (password !== confirmPassword) {
      return next(new AppError("Passwords do not match", 400));
    }

    // Validate password strength
    if (password.length < 8) {
      return next(
        new AppError("Password must be at least 8 characters long", 400)
      );
    }

    // Check if vendor already exists with this email
    const existingVendorByEmail = await Vendor.findOne({ where: { email } });
    if (existingVendorByEmail) {
      return next(new AppError("Email already in use", 400));
    }

    // Check if vendor already exists with this mobile number
    const existingVendorByMobile = await Vendor.findOne({
      where: { mobileNumber },
    });
    if (existingVendorByMobile) {
      return next(new AppError("Mobile number already in use", 400));
    }

    // Validate ID proof type
    if (
      idProofType &&
      !["Aadhar Card", "PAN Card", "Driving License", "Voter ID"].includes(
        idProofType
      )
    ) {
      return next(
        new AppError(
          "Invalid ID proof type. Must be one of: Aadhar Card, PAN Card, Driving License, Voter ID",
          400
        )
      );
    }

    // Perform KYC verification based on the provided documents
    let kycVerificationData = {};
    let isPanVerified = false;
    let isAadharVerified = false;
    let isDlVerified = false;
    let isGstinVerified = false;
    let isVoterIdVerified = false;

    try {
      // Verify PAN if provided
      if (panNumber) {
        const panVerification = await cashfreeService.verifyPAN(
          panNumber,
          fullName
        );
        isPanVerified = panVerification.verified;
        kycVerificationData.pan = panVerification;

        // If PAN verification fails, we'll still create the account but mark it unverified
        if (!isPanVerified) {
          console.log(
            `PAN verification failed for ${panNumber}:`,
            panVerification.message
          );
        }
      }

      // Verify Aadhaar if that's the ID proof type
      if (idProofType === "Aadhar Card" && idProofNumber) {
        const aadharVerification = await cashfreeService.verifyAadhaar(
          idProofNumber,
          fullName
        );
        isAadharVerified = aadharVerification.verified;
        kycVerificationData.aadhar = aadharVerification;

        if (!isAadharVerified) {
          console.log(
            `Aadhaar verification failed for ${idProofNumber}:`,
            aadharVerification.message
          );
        }
      }

      // Verify Driving License if that's the ID proof type
      if (idProofType === "Driving License" && idProofNumber) {
        const dlVerification = await cashfreeService.verifyDL(
          idProofNumber,
          dob
        );
        isDlVerified = dlVerification.verified;
        kycVerificationData.dl = dlVerification;

        if (!isDlVerified) {
          console.log(
            `DL verification failed for ${idProofNumber}:`,
            dlVerification.message
          );
        }
      }

      // Verify Voter ID if that's the ID proof type
      if (idProofType === "Voter ID" && idProofNumber) {
        const voterIdVerification = await cashfreeService.verifyVoterId(
          idProofNumber,
          { name: fullName }
        );
        isVoterIdVerified = voterIdVerification.verified;
        kycVerificationData.voterId = voterIdVerification;

        if (!isVoterIdVerified) {
          console.log(
            `Voter ID verification failed for ${idProofNumber}:`,
            voterIdVerification.message
          );
        }
      }

      // Verify GSTIN if provided
      if (gstinNumber) {
        const gstinVerification = await cashfreeService.verifyGSTIN(
          gstinNumber
        );
        isGstinVerified = gstinVerification.verified;
        kycVerificationData.gstin = gstinVerification;

        if (!isGstinVerified) {
          console.log(
            `GSTIN verification failed for ${gstinNumber}:`,
            gstinVerification.message
          );
        }
      }
    } catch (error) {
      console.error("Error during KYC verification:", error);
      // We'll continue with registration even if verification fails
      // The message in the response will indicate there was an issue
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Get ID proof URL from request file if it exists
    const idProofUrl = req.file
      ? `/uploads/id_proofs/${req.file.filename}`
      : null;

    // Create new vendor with pending status and KYC verification status
    const newVendor = await Vendor.create({
      fullName,
      email,
      password: hashedPassword,
      businessType,
      mobileNumber,
      alternativeMobileNumber,
      position,
      idProofType,
      idProofNumber,
      idProofUrl,
      companyName,
      shopUrl,
      gstinNumber,
      panNumber,
      establishedYear,
      shopPhoneNumber,
      street,
      city,
      state,
      postalCode,
      country: country || "India",
      status: "pending",
      isMobileVerified: false,
      // KYC Verification data
      isPanVerified,
      isAadharVerified,
      isDlVerified,
      isGstinVerified,
      isVoterIdVerified,
      kycVerificationData: kycVerificationData,
      kycVerifiedAt:
        Object.keys(kycVerificationData).length > 0 ? new Date() : null,
    });

    // Save device token if provided
    if (deviceToken) {
      newVendor.deviceToken = deviceToken;
      newVendor.notificationsEnabled = true;
    }

    // Save the vendor to the database
    await newVendor.save();

    // Create a new store associated with this vendor
    const store = await Store.create({
      name: companyName,
      customer_id: newVendor.id,
      phone: shopPhoneNumber || mobileNumber,
      address: street,
      city,
      state,
      country,
      postal_code: postalCode,
      established_year: establishedYear,
      gstin: gstinNumber,
      pan: panNumber,
      business_type: businessType,
      description: "",
      status: "pending",
      vendor_verified_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Exclude password from response
    const vendorResponse = newVendor.toJSON();
    delete vendorResponse.password;

    // Build a detailed response message about verification status
    let verificationMessage = "";

    if (panNumber && !isPanVerified) {
      verificationMessage += "PAN verification failed. ";
    }

    if (idProofType === "Aadhar Card" && idProofNumber && !isAadharVerified) {
      verificationMessage += "Aadhaar verification failed. ";
    }

    if (idProofType === "Driving License" && idProofNumber && !isDlVerified) {
      verificationMessage += "Driving License verification failed. ";
    }

    if (gstinNumber && !isGstinVerified) {
      verificationMessage += "GSTIN verification failed. ";
    }

    if (verificationMessage) {
      fullMessage +=
        verificationMessage +
        "Please ensure your documents are valid or contact support.";
    } else if (Object.keys(kycVerificationData).length > 0) {
      fullMessage += "All provided documents were successfully verified.";
    }
    
    res.status(201).json({
      status: "success",
      message: fullMessage,
      data: {
        vendor: vendorResponse,
        store: store,
        verificationStatus: {
          isPanVerified,
          isAadharVerified,
          isDlVerified,
          isGstinVerified,
        },
      },
    });
  } catch (error) {
    console.error("Error in registerVendor:", error);
    next(error);
  }
};

exports.rejectVendor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findByPk(id);
    if (!vendor) {
      return next(new AppError("Vendor not found", 404));
    }
    const updatedVendor = await vendor.update({
      isVerified: false,
      status: "rejected",
    });
    res.status(200).json({
      status: "success",
      message: "Vendor rejected successfully",
      data: {
        vendor: updatedVendor,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getVendor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findByPk(id, {
      attributes: { exclude: ["password"] },
    });
    if (!vendor) {
      return next(new AppError("Vendor not found", 404));
    }
    res.status(200).json({
      status: "success",
      data: {
        vendor,
      },
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
      return next(new AppError("Vendor not found", 404));
    }
    const updatedVendor = await vendor.update(req.body);
    res.status(200).json({
      status: "success",
      data: {
        vendor: updatedVendor,
      },
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
      order: [["created_at", "DESC"]],
    });
    const count = await ProductRequest.count();
    res.status(200).json({
      status: "success",
      results: productRequests.length,
      total: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        productRequests,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getProductRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const productRequest = await ProductRequest.findByPk(id, {
      attributes: { exclude: ["password"] },
    });
    if (!productRequest) {
      return next(new AppError("Product request not found", 404));
    }
    res.status(200).json({
      status: "success",
      data: {
        productRequest,
      },
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
      return next(new AppError("Product request not found", 404));
    }
    const updatedProductRequest = await productRequest.update({
      status: "approved",
    });
    res.status(200).json({
      status: "success",
      data: {
        productRequest: updatedProductRequest,
      },
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
      return next(new AppError("Product request not found", 404));
    }
    const updatedProductRequest = await productRequest.update({
      status: "rejected",
    });
    res.status(200).json({
      status: "success",
      data: {
        productRequest: updatedProductRequest,
      },
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
      return next(new AppError("Product request not found", 404));
    }
    const deletedProductRequest = await productRequest.destroy();
    res.status(200).json({
      status: "success",
      data: {
        productRequest: deletedProductRequest,
      },
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
      return next(new AppError("Product not found", 404));
    }
    const deletedProduct = await product.destroy();
    res.status(200).json({
      status: "success",
      data: {
        product: deletedProduct,
      },
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
      order: [["created_at", "DESC"]],
    });
    const count = await Product.count();
    res.status(200).json({
      status: "success",
      results: products.length,
      total: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        products,
      },
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
      return next(new AppError("Product not found", 404));
    }
    res.status(200).json({
      status: "success",
      data: {
        product,
      },
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
      return next(new AppError("Product not found", 404));
    }
    const updatedProduct = await product.update(req.body);
    res.status(200).json({
      status: "success",
      data: {
        product: updatedProduct,
      },
    });
  } catch (error) {
    next(error);
  }
};
