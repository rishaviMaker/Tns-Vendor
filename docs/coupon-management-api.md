# Coupon Management API Documentation

This document outlines the API endpoints, request payloads, and responses for the coupon management system.

## Table of Contents

- [Overview](#overview)
- [Coupon Types](#coupon-types)
- [API Endpoints](#api-endpoints)
  - [Create Coupon](#create-coupon)
  - [Get All Coupons](#get-all-coupons)
  - [Get Coupon By ID](#get-coupon-by-id)
  - [Update Coupon](#update-coupon)
  - [Delete Coupon](#delete-coupon)
  - [Generate Coupon Code](#generate-coupon-code)
- [Field Descriptions](#field-descriptions)

## Overview

The coupon management system allows vendors to create and manage various types of discount coupons for their stores. The system supports percentage discounts, fixed amount discounts, and shipping discounts that can be applied store-wide or to specific products, categories, or subcategories.

## Coupon Types

1. **Percentage Discount**: Applies a percentage discount to the order or specific products
2. **Fixed Amount Discount**: Applies a fixed amount discount to the order or specific products
3. **Shipping Discount**: Applies a discount to shipping costs

## API Endpoints

### Create Coupon

Creates a new coupon in the system.

**URL**: `POST /api/coupons`  
**Access**: Private (Requires vendor authentication)

**Request Body Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | String | No | Title of the coupon (defaults to auto-generated title if not provided) |
| code | String | Yes | Unique coupon code |
| discount_type | String | Yes | Type of discount: 'percentage', 'amount', or 'shipping' |
| value | Number | Yes | Value of the discount (percentage or amount) |
| quantity | Number | No | Number of times the coupon can be used (null if unlimited_used is true) |
| start_date | Date | No | Start date of the coupon (defaults to current date) |
| end_date | Date | No | End date of the coupon (null if never_expire is true) |
| can_use_with_promotion | Boolean | No | Whether the coupon can be used with other promotions (defaults to false) |
| product_scope | String | No | Scope of the coupon: 'all_products', 'specific_product', 'categories', or 'subcategories' |
| product_quantity | Number | No | Minimum quantity of products required for the coupon to apply (defaults to 1) |
| target_products | Array | No | Array of product IDs when product_scope is 'specific_product' |
| target_categories | Array | No | Array of category IDs when product_scope is 'categories' |
| target_subcategories | Array | No | Array of subcategory IDs when product_scope is 'subcategories' |
| min_order_price | Number | No | Minimum order price required for the coupon to apply |
| never_expire | Boolean | No | Whether the coupon never expires (defaults to false) |
| unlimited_used | Boolean | No | Whether the coupon can be used unlimited times (defaults to false) |

**Example Request**:
```json
{
  "title": "Summer Sale",
  "code": "SUMMER25",
  "discount_type": "percentage",
  "value": 25,
  "quantity": 100,
  "start_date": "2025-06-07T00:00:00Z",
  "end_date": "2025-08-31T23:59:59Z",
  "can_use_with_promotion": false,
  "product_scope": "all_products",
  "product_quantity": 1,
  "min_order_price": 50,
  "never_expire": false,
  "unlimited_used": false
}
```

**Example Response**:
```json
{
  "status": "success",
  "data": {
    "coupon": {
      "id": 1,
      "title": "Summer Sale",
      "code": "SUMMER25",
      "type": "coupon",
      "type_option": "percentage",
      "value": 25,
      "quantity": 100,
      "start_date": "2025-06-07T00:00:00.000Z",
      "end_date": "2025-08-31T23:59:59.000Z",
      "total_used": 0,
      "can_use_with_promotion": false,
      "discount_on": "all-orders",
      "product_quantity": 1,
      "target": "all-orders",
      "min_order_price": 50,
      "never_expire": false,
      "unlimited_used": false,
      "categories": null,
      "subcategories": null,
      "store_id": 123,
      "created_at": "2025-06-07T05:35:27.000Z",
      "updated_at": "2025-06-07T05:35:27.000Z"
    }
  }
}
```

### Get All Coupons

Retrieves all coupons for the vendor's store.

**URL**: `GET /api/coupons`  
**Access**: Private (Requires vendor authentication)

**Example Response**:
```json
{
  "status": "success",
  "results": 5,
  "data": {
    "coupons": [
      {
        "id": 1,
        "title": "Summer Sale",
        "code": "SUMMER25",
        "type": "coupon",
        "type_option": "percentage",
        "value": 25,
        "quantity": 100,
        "start_date": "2025-06-07T00:00:00.000Z",
        "end_date": "2025-08-31T23:59:59.000Z",
        "total_used": 0,
        "can_use_with_promotion": false,
        "discount_on": "all-orders",
        "product_quantity": 1,
        "target": "all-orders",
        "min_order_price": 50,
        "never_expire": false,
        "unlimited_used": false,
        "categories": null,
        "subcategories": null,
        "store_id": 123,
        "created_at": "2025-06-07T05:35:27.000Z",
        "updated_at": "2025-06-07T05:35:27.000Z"
      },
      // Other coupons...
    ]
  }
}
```

### Get Coupon By ID

Retrieves a specific coupon by its ID.

**URL**: `GET /api/coupons/:id`  
**Access**: Private (Requires vendor authentication)

**Example Response**:
```json
{
  "status": "success",
  "data": {
    "coupon": {
      "id": 3,
      "title": "Electronics Sale",
      "code": "ELEC15",
      "type": "coupon",
      "type_option": "percentage",
      "value": 15,
      "quantity": 50,
      "start_date": "2025-06-07T05:35:27.000Z",
      "end_date": null,
      "total_used": 0,
      "can_use_with_promotion": false,
      "discount_on": "categories",
      "product_quantity": 1,
      "target": "all-orders",
      "min_order_price": 100,
      "never_expire": false,
      "unlimited_used": false,
      "categories": "[5,8]",
      "subcategories": null,
      "store_id": 123,
      "created_at": "2025-06-07T05:35:27.000Z",
      "updated_at": "2025-06-07T05:35:27.000Z"
    }
  }
}
```

### Update Coupon

Updates an existing coupon.

**URL**: `PATCH /api/coupons/:id`  
**Access**: Private (Requires vendor authentication)

**Request Body Parameters**: Same as Create Coupon, but all fields are optional.

**Example Request**:
```json
{
  "title": "Updated Product Discount",
  "value": 75,
  "never_expire": false,
  "end_date": "2025-12-31T23:59:59Z",
  "unlimited_used": false,
  "quantity": 50
}
```

**Example Response**:
```json
{
  "status": "success",
  "data": {
    "coupon": {
      "id": 2,
      "title": "Updated Product Discount",
      "code": "PROD50",
      "type": "coupon",
      "type_option": "amount",
      "value": 75,
      "quantity": 50,
      "start_date": "2025-06-07T05:35:27.000Z",
      "end_date": "2025-12-31T23:59:59.000Z",
      "total_used": 0,
      "can_use_with_promotion": false,
      "discount_on": "product",
      "product_quantity": 1,
      "target": "[101,102,103]",
      "min_order_price": null,
      "never_expire": false,
      "unlimited_used": false,
      "categories": null,
      "subcategories": null,
      "store_id": 123,
      "created_at": "2025-06-07T05:35:27.000Z",
      "updated_at": "2025-06-07T05:35:27.000Z"
    }
  }
}
```

### Delete Coupon

Deletes a coupon by its ID.

**URL**: `DELETE /api/coupons/:id`  
**Access**: Private (Requires vendor authentication)

**Example Response**:
```json
{
  "status": "success",
  "message": "Coupon deleted successfully"
}
```

### Generate Coupon Code

Generates a unique coupon code.

**URL**: `GET /api/coupons/generate-code`  
**Access**: Private (Requires vendor authentication)

**Example Response**:
```json
{
  "status": "success",
  "data": {
    "code": "XY4Z9P7R"
  }
}
```

## Field Descriptions

| Field | Description |
|-------|-------------|
| title | The display name of the coupon |
| code | Unique code that customers enter to apply the coupon |
| discount_type | The type of discount (percentage, amount, shipping) |
| value | The value of the discount (percentage or amount) |
| quantity | The number of times the coupon can be used |
| start_date | The date from which the coupon is valid |
| end_date | The date until which the coupon is valid |
| total_used | The number of times the coupon has been used |
| can_use_with_promotion | Whether the coupon can be combined with other promotions |
| discount_on | Where the discount applies (all-orders, product, categories, subcategories) |
| product_quantity | The minimum quantity of products required for the coupon to apply |
| target | For product-specific coupons, contains JSON string of product IDs |
| min_order_price | The minimum order price required for the coupon to apply |
| never_expire | Whether the coupon has no expiration date |
| unlimited_used | Whether the coupon can be used unlimited times |
| categories | For category-specific coupons, contains JSON string of category IDs |
| subcategories | For subcategory-specific coupons, contains JSON string of subcategory IDs |

## Special Use Cases

### Creating a Never-Expiring Coupon

Set `never_expire` to `true` and the system will automatically set `end_date` to `null`.

```json
{
  "title": "Loyalty Discount",
  "code": "LOYAL10",
  "discount_type": "percentage",
  "value": 10,
  "never_expire": true
}
```

### Creating an Unlimited-Use Coupon

Set `unlimited_used` to `true` and the system will automatically set `quantity` to `null`.

```json
{
  "title": "Referral Bonus",
  "code": "REFER20",
  "discount_type": "percentage",
  "value": 20,
  "unlimited_used": true
}
```

### Creating a Category-Specific Coupon

Set `product_scope` to `categories` and provide `target_categories` as an array of category IDs.

```json
{
  "title": "Electronics Sale",
  "code": "ELEC15",
  "discount_type": "percentage",
  "value": 15,
  "product_scope": "categories",
  "target_categories": [5, 8]
}
```

### Creating a Subcategory-Specific Coupon

Set `product_scope` to `subcategories` and provide `target_subcategories` as an array of subcategory IDs.

```json
{
  "title": "Smartphones Discount",
  "code": "PHONE10",
  "discount_type": "percentage",
  "value": 10,
  "product_scope": "subcategories",
  "target_subcategories": [12, 15]
}
```

### Creating a Product-Specific Coupon

Set `product_scope` to `specific_product` and provide `target_products` as an array of product IDs.

```json
{
  "title": "Product Discount",
  "code": "PROD50",
  "discount_type": "amount",
  "value": 50,
  "product_scope": "specific_product",
  "target_products": [101, 102, 103]
}
```

### Creating a Minimum Purchase Quantity Coupon

Set `product_quantity` to the minimum number of products required for the coupon to apply.

```json
{
  "title": "Buy 3 Get 20% Off",
  "code": "BUY3GET20",
  "discount_type": "percentage",
  "value": 20,
  "product_quantity": 3
}
```
