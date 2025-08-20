require('dotenv').config();
const { sequelize, testConnection } = require('../config/db');
const { ProductRequest } = require('../models/ProductRequest');
const { Vendor } = require('../models/Vendor');

async function getVendor(preferredId) {
  if (preferredId) {
    const v = await Vendor.findByPk(preferredId);
    if (!v) throw new Error(`Vendor with id ${preferredId} not found`);
    return v;
  }

  const existing = await Vendor.findOne();
  if (existing) return existing;

  // Create a demo vendor if none exists
  const ts = Date.now();
  const demoVendor = await Vendor.create({
    fullName: 'Demo Vendor',
    email: `demo_vendor_${ts}@example.com`,
    password: 'Temp@12345',
    businessType: 'Retailer',
    mobileNumber: `9${ts}`.slice(0, 10),
    alternativeMobileNumber: null,
    position: 'Owner',
    idProofType: 'PAN Card',
    idProofUrl: null,
    idProofNumber: `PAN${ts}`,
    companyName: 'Demo Company Pvt Ltd',
    shopUrl: null,
    gstinNumber: null,
    panNumber: `PAN${ts}`,
    establishedYear: 2020,
    shopPhoneNumber: null,
    street: '123 Demo Street',
    city: 'DemoCity',
    state: 'DemoState',
    postalCode: '123456',
    country: 'India',
    isVerified: false,
    status: 'pending',
    isMobileVerified: false
  });
  console.log(`Created demo vendor with id ${demoVendor.id}`);
  return demoVendor;
}

async function main() {
  await testConnection();

  const vendorArg = process.argv[2];
  const vendorId = vendorArg ? parseInt(vendorArg, 10) : null;
  const vendor = await getVendor(vendorId);

  const demoData = {
    vendor_id: vendor.id,
    name: 'Demo Product',
    description: 'This is a demo product request created by seed script.',
    content: '<p>Demo long content</p>',
    sku: 'DEMO-001',
    price: 199.99,
    sale_price: 149.99,
    quantity: 10,
    shipping_charges: 0,
    shipping_included: true,
    allow_checkout_when_out_of_stock: false,
    with_storehouse_management: true,
    is_featured: true,
    brand_id: 1,
    is_variation: false,
    sale_type: 0,
    start_date: new Date(),
    end_date: null,
    length: 10.5,
    wide: 5.2,
    height: 2.3,
    weight: 0.7,
    tax_id: 2,
    views: 0,
    stock_status: 'in_stock',
    store_id: null,
    created_by_id: vendor.id,
    created_by_type: 'vendor',
    approved_by: null,
    image: 'https://cdn.example.com/primary.jpg',
    category: 'Electronics',
    sub_category: 'Accessories',
    videos: ['https://example.com/v1.mp4'],
    purchase_price: 120.0,
    hsn_sac_code: '8517',
    applicable_tax: '18%',
    unit: 'Piece',
    is_quotable: false,
    images: [
      '/uploads/product-requests/demo1.jpg',
      '/uploads/product-requests/demo2.jpg'
    ]
  };

  const created = await ProductRequest.create(demoData);
  console.log('Created ProductRequest:', {
    id: created.id,
    vendor_id: created.vendor_id,
    name: created.name,
    status: created.status
  });
}

main()
  .then(() => sequelize.close())
  .catch(async (err) => {
    console.error('Seed failed:', err);
    try { await sequelize.close(); } catch (_) {}
    process.exit(1);
  });
