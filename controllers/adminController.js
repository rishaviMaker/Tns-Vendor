const { User } = require("../models/User");
const { Product } = require("../models/Product");
const { ProductRequest } = require("../models/ProductRequest");
const { Warehouse } = require("../models/Warehouse");
const { ProductCategoryProduct } = require("../models/ProductCategoryProduct");
const { ProductLabelsProduct } = require("../models/ProductLabelsProduct");
const {
  ProductCollectionProduct,
} = require("../models/ProductCollectionProduct");
const { ProductCategory } = require("../models/ProductCategory");
const { Warehouse } = require("../models/Warehouse");
const { ProductCategoryProduct } = require("../models/ProductCategoryProduct");
const { ProductCategory } = require("../models/ProductCategory");
const { Vendor } = require("../models/Vendor");
const { Payment } = require("../models/Payment");
const { Order } = require("../models/Order");
const { OrderHistory } = require("../models/OrderHistory");
const { Customer } = require("../models/Customer");
const { Tax } = require("../models/Tax");
const bcrypt = require("bcryptjs");
const AppError = require("../utils/AppError");
const jwt = require("jsonwebtoken");
const cashfreeService = require("../services/cashfreeService");
const { Store } = require("../models/Store");
const {
  uploadProductImagesToRemote,
} = require("../services/remoteImageService");

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

exports.getDashboard = async (req, res, next) => {
  try {
    const totalOrders = await Order.count();
    const totalVendors = await Vendor.count();
    const totalProducts = await Product.count();
    const totalCustomers = await Customer.count();
    const totalRevenue = await Payment.sum("amount", {
      where: { status: "completed" },
    });
    const pendingOrders = await Order.count({ where: { status: "pending" } });

    const OrderHistoryData = await OrderHistory.findAll({
      limit: 10,
      order: [["created_at", "DESC"]],
      include: [
        {
          model: User,
          as: "user",
        },
      ],
    });

    res.status(200).json({
      status: "success",
      data: {
        totalOrders,
        totalVendors,
        totalProducts,
        totalCustomers,
        totalRevenue,
        pendingOrders,
        recentActivity: OrderHistoryData,
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
    // console.log(vendor);
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

    // try {
    //   // Verify PAN if provided
    //   if (panNumber) {
    //     const panVerification = await cashfreeService.verifyPAN(
    //       panNumber,
    //       fullName
    //     );
    //     isPanVerified = panVerification.verified;
    //     kycVerificationData.pan = panVerification;

    //     // If PAN verification fails, we'll still create the account but mark it unverified
    //     if (!isPanVerified) {
    //       console.log(
    //         `PAN verification failed for ${panNumber}:`,
    //         panVerification.message
    //       );
    //     }
    //   }

    //   // Verify Aadhaar if that's the ID proof type
    //   if (idProofType === "Aadhar Card" && idProofNumber) {
    //     const aadharVerification = await cashfreeService.verifyAadhaar(
    //       idProofNumber,
    //       fullName
    //     );
    //     isAadharVerified = aadharVerification.verified;
    //     kycVerificationData.aadhar = aadharVerification;

    //     if (!isAadharVerified) {
    //       console.log(
    //         `Aadhaar verification failed for ${idProofNumber}:`,
    //         aadharVerification.message
    //       );
    //     }
    //   }

    //   // Verify Driving License if that's the ID proof type
    //   if (idProofType === "Driving License" && idProofNumber) {
    //     const dlVerification = await cashfreeService.verifyDL(
    //       idProofNumber,
    //       dob
    //     );
    //     isDlVerified = dlVerification.verified;
    //     kycVerificationData.dl = dlVerification;

    //     if (!isDlVerified) {
    //       console.log(
    //         `DL verification failed for ${idProofNumber}:`,
    //         dlVerification.message
    //       );
    //     }
    //   }

    //   // Verify Voter ID if that's the ID proof type
    //   if (idProofType === "Voter ID" && idProofNumber) {
    //     const voterIdVerification = await cashfreeService.verifyVoterId(
    //       idProofNumber,
    //       { name: fullName }
    //     );
    //     isVoterIdVerified = voterIdVerification.verified;
    //     kycVerificationData.voterId = voterIdVerification;

    //     if (!isVoterIdVerified) {
    //       console.log(
    //         `Voter ID verification failed for ${idProofNumber}:`,
    //         voterIdVerification.message
    //       );
    //     }
    //   }

    //   // Verify GSTIN if provided
    //   if (gstinNumber) {
    //     const gstinVerification = await cashfreeService.verifyGSTIN(
    //       gstinNumber
    //     );
    //     isGstinVerified = gstinVerification.verified;
    //     kycVerificationData.gstin = gstinVerification;

    //     if (!isGstinVerified) {
    //       console.log(
    //         `GSTIN verification failed for ${gstinNumber}:`,
    //         gstinVerification.message
    //       );
    //     }
    //   }
    // } catch (error) {
    //   console.error("Error during KYC verification:", error);
    //   // We'll continue with registration even if verification fails
    //   // The message in the response will indicate there was an issue
    // }

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
      businessType,
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
    // let verificationMessage = "";

    // if (panNumber && !isPanVerified) {
    //   verificationMessage += "PAN verification failed. ";
    // }

    // if (idProofType === "Aadhar Card" && idProofNumber && !isAadharVerified) {
    //   verificationMessage += "Aadhaar verification failed. ";
    // }

    // if (idProofType === "Driving License" && idProofNumber && !isDlVerified) {
    //   verificationMessage += "Driving License verification failed. ";
    // }

    // if (gstinNumber && !isGstinVerified) {
    //   verificationMessage += "GSTIN verification failed. ";
    // }

    // if (verificationMessage) {
    //   fullMessage +=
    //     verificationMessage +
    //     "Please ensure your documents are valid or contact support.";
    // } else if (Object.keys(kycVerificationData).length > 0) {
    //   fullMessage += "All provided documents were successfully verified.";
    // }

    res.status(201).json({
      status: "success",
      // message: fullMessage,
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
      return next(new AppError("Vendor profile not found", 404));
    }

    // Track changed fields for notification
    const changedFields = [];

    const {
      // Original fields
      vendorName,
      businessName,
      businessDescription,
      website,
      phone,
      taxId,
      bankAccountDetails,

      // Fields from registerVendor
      fullName,
      email,
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

      // Address fields
      street,
      city,
      state,
      country,
      postalCode,

      // Bank details
      preferredPaymentMethod,
      bankName,
      ifscCode,
      accountNumber,
      paypalId,
      upiId,
      paymentDescription,

      // Social media links
      facebookLink,
      twitterLink,
      instagramLink,
      youtubeLink,
      linkedinLink,
      whatsappLink,
    } = req.body;

    // Update vendor details and track changes
    // Original fields
    if (vendorName && vendor.vendorName !== vendorName) {
      vendor.vendorName = vendorName;
      changedFields.push("vendorName");
    }
    if (businessName && vendor.businessName !== businessName) {
      vendor.businessName = businessName;
      changedFields.push("businessName");
    }
    if (
      businessDescription &&
      vendor.businessDescription !== businessDescription
    ) {
      vendor.businessDescription = businessDescription;
      changedFields.push("businessDescription");
    }
    if (website && vendor.website !== website) {
      vendor.website = website;
      changedFields.push("website");
    }
    if (phone && vendor.phone !== phone) {
      vendor.phone = phone;
      changedFields.push("phone");
    }
    if (taxId && vendor.taxId !== taxId) {
      vendor.taxId = taxId;
      changedFields.push("taxId");
    }
    if (
      bankAccountDetails &&
      JSON.stringify(vendor.bankAccountDetails) !==
        JSON.stringify(bankAccountDetails)
    ) {
      vendor.bankAccountDetails = bankAccountDetails;
      changedFields.push("bankAccountDetails");
    }

    // Fields from registerVendor
    if (fullName && vendor.fullName !== fullName) {
      vendor.fullName = fullName;
      changedFields.push("fullName");
    }
    if (email && vendor.email !== email) {
      vendor.email = email;
      changedFields.push("email");
    }
    if (businessType && vendor.businessType !== businessType) {
      vendor.businessType = businessType;
      changedFields.push("businessType");
    }
    if (mobileNumber && vendor.mobileNumber !== mobileNumber) {
      vendor.mobileNumber = mobileNumber;
      changedFields.push("mobileNumber");
    }
    if (
      alternativeMobileNumber &&
      vendor.alternativeMobileNumber !== alternativeMobileNumber
    ) {
      vendor.alternativeMobileNumber = alternativeMobileNumber;
      changedFields.push("alternativeMobileNumber");
    }
    if (position && vendor.position !== position) {
      vendor.position = position;
      changedFields.push("position");
    }
    if (idProofType && vendor.idProofType !== idProofType) {
      vendor.idProofType = idProofType;
      changedFields.push("idProofType");
    }
    if (idProofNumber && vendor.idProofNumber !== idProofNumber) {
      vendor.idProofNumber = idProofNumber;
      changedFields.push("idProofNumber");
    }
    if (companyName && vendor.companyName !== companyName) {
      vendor.companyName = companyName;
      changedFields.push("companyName");
    }
    if (shopUrl && vendor.shopUrl !== shopUrl) {
      vendor.shopUrl = shopUrl;
      changedFields.push("shopUrl");
    }
    if (gstinNumber && vendor.gstinNumber !== gstinNumber) {
      vendor.gstinNumber = gstinNumber;
      changedFields.push("gstinNumber");
    }
    if (panNumber && vendor.panNumber !== panNumber) {
      vendor.panNumber = panNumber;
      changedFields.push("panNumber");
    }
    if (establishedYear && vendor.establishedYear !== establishedYear) {
      vendor.establishedYear = establishedYear;
      changedFields.push("establishedYear");
    }
    if (shopPhoneNumber && vendor.shopPhoneNumber !== shopPhoneNumber) {
      vendor.shopPhoneNumber = shopPhoneNumber;
      changedFields.push("shopPhoneNumber");
    }

    // Address fields
    if (street && vendor.street !== street) {
      vendor.street = street;
      changedFields.push("street");
    }
    if (city && vendor.city !== city) {
      vendor.city = city;
      changedFields.push("city");
    }
    if (state && vendor.state !== state) {
      vendor.state = state;
      changedFields.push("state");
    }
    if (country && vendor.country !== country) {
      vendor.country = country;
      changedFields.push("country");
    }
    if (postalCode && vendor.postalCode !== postalCode) {
      vendor.postalCode = postalCode;
      changedFields.push("postalCode");
    }

    await vendor.save();

    // Update related store if it exists
    let store = null;
    const storeChangedFields = [];

    if (vendor.id) {
      store = await Store.findOne({ where: { customer_id: vendor.id } });
      if (store) {
        // Update store information and track changes
        if (companyName && store.name !== companyName) {
          store.name = companyName;
          storeChangedFields.push("name");
        }
        if (shopPhoneNumber && store.phone !== shopPhoneNumber) {
          store.phone = shopPhoneNumber;
          storeChangedFields.push("phone");
        }
        if (street && store.address !== street) {
          store.address = street;
          storeChangedFields.push("address");
        }
        if (city && store.city !== city) {
          store.city = city;
          storeChangedFields.push("city");
        }
        if (state && store.state !== state) {
          store.state = state;
          storeChangedFields.push("state");
        }
        if (postalCode && store.postal_code !== postalCode) {
          store.postal_code = postalCode;
          storeChangedFields.push("postal_code");
        }
        if (country && store.country !== country) {
          store.country = country;
          storeChangedFields.push("country");
        }
        if (businessDescription && store.description !== businessDescription) {
          store.description = businessDescription;
          storeChangedFields.push("description");
        }
        if (website && store.website !== website) {
          store.website = website;
          storeChangedFields.push("website");
        }
        if (gstinNumber && store.gstin !== gstinNumber) {
          store.gstin = gstinNumber;
          storeChangedFields.push("gstin");
        }
        if (panNumber && store.pan !== panNumber) {
          store.pan = panNumber;
          storeChangedFields.push("pan");
        }
        if (establishedYear && store.established_year !== establishedYear) {
          store.established_year = establishedYear;
          storeChangedFields.push("established_year");
        }
        if (businessType && store.business_type !== businessType) {
          store.business_type = businessType;
          storeChangedFields.push("business_type");
        }
        // Bank
        if (
          preferredPaymentMethod &&
          store.preferred_payment_method !== preferredPaymentMethod
        ) {
          store.preferred_payment_method = preferredPaymentMethod;
          storeChangedFields.push("preferred_payment_method");
        }
        if (bankName && store.bank_name !== bankName) {
          store.bank_name = bankName;
          storeChangedFields.push("bank_name");
        }
        if (ifscCode && store.ifsc_code !== ifscCode) {
          store.ifsc_code = ifscCode;
          storeChangedFields.push("ifsc_code");
        }
        if (accountNumber && store.account_number !== accountNumber) {
          store.account_number = accountNumber;
          storeChangedFields.push("account_number");
        }
        if (paypalId && store.paypal_id !== paypalId) {
          store.paypal_id = paypalId;
          storeChangedFields.push("paypal_id");
        }
        if (upiId && store.upi_id !== upiId) {
          store.upi_id = upiId;
          storeChangedFields.push("upi_id");
        }
        if (
          paymentDescription &&
          store.payment_description !== paymentDescription
        ) {
          store.payment_description = paymentDescription;
          storeChangedFields.push("payment_description");
        }
        // Social media links
        if (facebookLink && store.facebook_link !== facebookLink) {
          store.facebook_link = facebookLink;
          storeChangedFields.push("facebook_link");
        }
        if (twitterLink && store.twitter_link !== twitterLink) {
          store.twitter_link = twitterLink;
          storeChangedFields.push("twitter_link");
        }
        if (instagramLink && store.instagram_link !== instagramLink) {
          store.instagram_link = instagramLink;
          storeChangedFields.push("instagram_link");
        }
        if (youtubeLink && store.youtube_link !== youtubeLink) {
          store.youtube_link = youtubeLink;
          storeChangedFields.push("youtube_link");
        }
        if (linkedinLink && store.linkedin_link !== linkedinLink) {
          store.linkedin_link = linkedinLink;
          storeChangedFields.push("linkedin_link");
        }
        if (whatsappLink && store.whatsapp_link !== whatsappLink) {
          store.whatsapp_link = whatsappLink;
          storeChangedFields.push("whatsapp_link");
        }

        store.updated_at = new Date();

        await store.save();
      }
    }

    // Send notifications if there were changes
    const eventNotificationService = require("../services/eventNotificationService");

    // Send vendor profile update notification if fields were changed
    if (changedFields.length > 0) {
      await eventNotificationService.notifyVendorProfileUpdated(
        vendor,
        changedFields
      );
    }

    // Send store update notification if store fields were changed
    if (store && storeChangedFields.length > 0) {
      await eventNotificationService.notifyStoreUpdated(
        store,
        vendor.id,
        storeChangedFields
      );
    }

    // Exclude password from response
    const vendorResponse = vendor.toJSON();
    delete vendorResponse.password;

    res.status(200).json({
      status: "success",
      data: {
        vendor: vendorResponse,
        store: vendor.id
          ? await Store.findOne({ where: { customer_id: vendor.id } })
          : null,
      },
    });
  } catch (error) {
    console.error("Error in updateVendorProfile:", error);
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
    const productRequest = await ProductRequest.findByPk(id);
    if (!productRequest) {
      return next(new AppError("Product request not found", 404));
    }
    const category = await ProductCategory.findByPk(productRequest.category);
    productRequest.category = category;
    const vendor = await Vendor.findByPk(productRequest.vendor_id);
    const warehouse = await Warehouse.findByPk(productRequest.warehouse_id);
    res.status(200).json({
      status: "success",
      data: {
        productRequest,
        vendor,
        warehouse,
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
    const category = await ProductCategory.findByPk(productRequest.category);
    productRequest.category = category;
    const vendor = await Vendor.findByPk(productRequest.vendor_id);
    const warehouse = await Warehouse.findByPk(productRequest.warehouse_id);
    res.status(200).json({
      status: "success",
      data: {
        productRequest: updatedProductRequest,
        vendor,
        warehouse,
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
    const category = await ProductCategory.findByPk(productRequest.category);
    productRequest.category = category;
    const vendor = await Vendor.findByPk(productRequest.vendor_id);
    const warehouse = await Warehouse.findByPk(productRequest.warehouse_id);
    res.status(200).json({
      status: "success",
      data: {
        productRequest: updatedProductRequest,
        vendor,
        warehouse,
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
    const category = await ProductCategory.findByPk(productRequest.category);
    productRequest.category = category;
    const vendor = await Vendor.findByPk(productRequest.vendor_id);
    const warehouse = await Warehouse.findByPk(productRequest.warehouse_id);
    res.status(200).json({
      status: "success",
      data: {
        productRequest: deletedProductRequest,
        vendor,
        warehouse,
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
    products.forEach((product) => {
      product.images = JSON.parse(product.images);
    });
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
    const category = await ProductCategory.findByPk(product.category);
    product.category = category;
    const vendor = await Vendor.findByPk(product.vendor_id);
    const warehouse = await Warehouse.findByPk(product.warehouse_id);
    product.images = JSON.parse(product.images);

    const productLabels = await ProductLabelsProduct.findAll({
      where: { product_id: id },
    });
    const productCollections = await ProductCollectionProduct.findAll({
      where: { product_id: id },
    });
    res.status(200).json({
      status: "success",
      data: {
        product,
        vendor,
        warehouse,
        productLabels,
        productCollections,
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
    const updatedProduct = await Product.update(
      {
        name: req.body.name || product.name,
        description: req.body.description || product.description,
        sku: req.body.sku || product.sku,
        quantity: req.body.quantity || product.quantity,
        status: req.body.status || product.status,
        sku: req.body.sku || product.sku,
        allow_checkout_when_out_of_stock:
          req.body.allow_checkout_when_out_of_stock ||
          product.allow_checkout_when_out_of_stock,
        brand_id: req.body.brand_id || product.brand_id,
        price: req.body.price || product.price,
        sale_price: req.body.sale_price || product.sale_price,
        tax_id: req.body.tax_id || product.tax_id,
        stock_status: req.body.stock_status || product.stock_status,
        shipping_charges: req.body.shipping_charges || product.shipping_charges,
      },
      { where: { id } }
    );
    const updatedProductData = await Product.findByPk(id);
    updatedProductData.images = JSON.parse(updatedProductData.images);
    const warehouse = await Warehouse.findByPk(updatedProductData.warehouse_id);
    const vendor = await Vendor.findByPk(updatedProductData.vendor_id);
    const category = await ProductCategory.findByPk(
      updatedProductData.category_id
    );
    updatedProductData.category = category;
    const tax = await Tax.findByPk(updatedProductData.tax_id);

    const collectionData = JSON.parse(collections).map((collection) => ({
      product_id: updatedProductData.id,
      product_collection_id: collection,
    }));
    const collectionProduct = await ProductCollectionProduct.bulkCreate(collectionData);
    
    const labelsData = JSON.parse(labels).map((label) => ({
      product_id: updatedProductData.id,
      product_label_id: label,
    }));
    const labelProduct = await ProductLabelsProduct.bulkCreate(labelsData);
    
    res.status(200).json({
      status: "success",
      data: {
        product: updatedProductData,
        warehouse,
        vendor,
        tax,
        collectionProduct,
        labelProduct,
      },
    });
  } catch (error) {
    next(error);
  }
};
