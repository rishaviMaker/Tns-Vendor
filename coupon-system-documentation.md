# Vendor Coupon Management System Documentation

## Coupon Types

The system supports three types of coupons:

1. **Percentage Discount** - A percentage off the total order or specific products (e.g., 10% off)
2. **Fixed Amount Discount** - A fixed amount off the total order or specific products (e.g., $50 off)
3. **Shipping Discount** - Free or discounted shipping

## API Endpoints

### 1. Generate Coupon Code

Generates a unique coupon code automatically.

**Request:**
- **URL:** `GET /api/coupons/generate-code`
- **Method:** GET
- **Headers:** 
  ```
  Authorization: Bearer {your_jwt_token}
  ```

**Response:**
```json
{
  "status": "success",
  "data": {
    "code": "XYZ12345"
  }
}
```

### 2. Create Coupon

Creates a new coupon with the specified parameters.

**Request:**
- **URL:** `POST /api/coupons`
- **Method:** POST
- **Headers:** 
  ```
  Authorization: Bearer {your_jwt_token}
  Content-Type: application/json
  ```
- **Payload:**
  ```json
  {
    "title": "Summer Sale",
    "code": "SUMMER25",
    "discount_type": "percentage", 
    "value": 25,
    "quantity": 100,
    "start_date": "2025-06-04T00:00:00.000Z",
    "end_date": "2025-07-04T23:59:59.000Z",
    "can_use_with_promotion": false,
    "product_scope": "all_products",
    "product_quantity": 1,
    "min_order_price": 1000
  }
  ```

**Response:**
```json
{
  "status": "success",
  "data": {
    "coupon": {
      "id": 5,
      "title": "Summer Sale",
      "code": "SUMMER25",
      "type": "coupon",
      "type_option": "percentage",
      "value": 25,
      "quantity": 100,
      "start_date": "2025-06-04T00:00:00.000Z",
      "end_date": "2025-07-04T23:59:59.000Z",
      "total_used": 0,
      "can_use_with_promotion": false,
      "discount_on": "all-orders",
      "product_quantity": 1,
      "target": "all-orders",
      "min_order_price": 1000,
      "store_id": 1,
      "created_at": "2025-06-04T12:35:08.000Z",
      "updated_at": "2025-06-04T12:35:08.000Z"
    }
  }
}
```

### 3. Get All Coupons

Retrieves all coupons for the vendor's store.

**Request:**
- **URL:** `GET /api/coupons`
- **Method:** GET
- **Headers:** 
  ```
  Authorization: Bearer {your_jwt_token}
  ```

**Response:**
```json
{
  "status": "success",
  "results": 2,
  "data": {
    "coupons": [
      {
        "id": 5,
        "title": "Summer Sale",
        "code": "SUMMER25",
        "type": "coupon",
        "type_option": "percentage",
        "value": 25,
        "quantity": 100,
        "start_date": "2025-06-04T00:00:00.000Z",
        "end_date": "2025-07-04T23:59:59.000Z",
        "total_used": 0,
        "can_use_with_promotion": false,
        "discount_on": "all-orders",
        "product_quantity": 1,
        "target": "all-orders",
        "min_order_price": 1000,
        "store_id": 1,
        "created_at": "2025-06-04T12:35:08.000Z",
        "updated_at": "2025-06-04T12:35:08.000Z"
      },
      {
        "id": 4,
        "title": "Free Shipping",
        "code": "FREESHIP",
        "type": "coupon",
        "type_option": "shipping",
        "value": 100,
        "quantity": 50,
        "start_date": "2025-05-01T00:00:00.000Z",
        "end_date": "2025-06-30T23:59:59.000Z",
        "total_used": 5,
        "can_use_with_promotion": false,
        "discount_on": "all-orders",
        "product_quantity": 1,
        "target": "all-orders",
        "min_order_price": 500,
        "store_id": 1,
        "created_at": "2025-05-01T10:00:00.000Z",
        "updated_at": "2025-06-01T15:30:00.000Z"
      }
    ]
  }
}
```

### 4. Get Coupon by ID

Retrieves a specific coupon by its ID.

**Request:**
- **URL:** `GET /api/coupons/{id}`
- **Method:** GET
- **Headers:** 
  ```
  Authorization: Bearer {your_jwt_token}
  ```

**Response:**
```json
{
  "status": "success",
  "data": {
    "coupon": {
      "id": 5,
      "title": "Summer Sale",
      "code": "SUMMER25",
      "type": "coupon",
      "type_option": "percentage",
      "value": 25,
      "quantity": 100,
      "start_date": "2025-06-04T00:00:00.000Z",
      "end_date": "2025-07-04T23:59:59.000Z",
      "total_used": 0,
      "can_use_with_promotion": false,
      "discount_on": "all-orders",
      "product_quantity": 1,
      "target": "all-orders",
      "min_order_price": 1000,
      "store_id": 1,
      "created_at": "2025-06-04T12:35:08.000Z",
      "updated_at": "2025-06-04T12:35:08.000Z"
    }
  }
}
```

### 5. Update Coupon

Updates an existing coupon.

**Request:**
- **URL:** `PATCH /api/coupons/{id}`
- **Method:** PATCH
- **Headers:** 
  ```
  Authorization: Bearer {your_jwt_token}
  Content-Type: application/json
  ```
- **Payload:**
  ```json
  {
    "value": 30,
    "title": "Better Summer Sale",
    "product_quantity": 2,
    "min_order_price": 1500
  }
  ```

**Response:**
```json
{
  "status": "success",
  "data": {
    "coupon": {
      "id": 5,
      "title": "Better Summer Sale",
      "code": "SUMMER25",
      "type": "coupon",
      "type_option": "percentage",
      "value": 30,
      "quantity": 100,
      "start_date": "2025-06-04T00:00:00.000Z",
      "end_date": "2025-07-04T23:59:59.000Z",
      "total_used": 0,
      "can_use_with_promotion": false,
      "discount_on": "all-orders",
      "product_quantity": 2,
      "target": "all-orders",
      "min_order_price": 1500,
      "store_id": 1,
      "created_at": "2025-06-04T12:35:08.000Z",
      "updated_at": "2025-06-04T12:40:15.000Z"
    }
  }
}
```

### 6. Delete Coupon

Deletes a coupon.

**Request:**
- **URL:** `DELETE /api/coupons/{id}`
- **Method:** DELETE
- **Headers:** 
  ```
  Authorization: Bearer {your_jwt_token}
  ```

**Response:**
```json
{
  "status": "success",
  "message": "Coupon deleted successfully"
}
```

## Example Use Cases

### 1. Percentage Discount for All Products

```json
{
  "title": "Summer Sale",
  "code": "SUMMER25",
  "discount_type": "percentage",
  "value": 25,
  "quantity": 100,
  "start_date": "2025-06-04T00:00:00.000Z",
  "end_date": "2025-07-04T23:59:59.000Z",
  "product_scope": "all_products"
}
```

### 2. Fixed Amount Discount with Minimum Order Value

```json
{
  "title": "Save $50",
  "code": "SAVE50",
  "discount_type": "amount",
  "value": 50,
  "quantity": 200,
  "start_date": "2025-06-04T00:00:00.000Z",
  "end_date": "2025-07-04T23:59:59.000Z",
  "product_scope": "all_products",
  "min_order_price": 200
}
```

### 3. Free Shipping

```json
{
  "title": "Free Shipping",
  "code": "FREESHIP",
  "discount_type": "shipping",
  "value": 100,
  "quantity": 50,
  "start_date": "2025-06-04T00:00:00.000Z",
  "end_date": "2025-07-04T23:59:59.000Z",
  "product_scope": "all_products",
  "min_order_price": 500
}
```

### 4. Product-Specific Discount

```json
{
  "title": "Cement Discount",
  "code": "CEMENT20",
  "discount_type": "percentage",
  "value": 20,
  "quantity": 50,
  "start_date": "2025-06-04T00:00:00.000Z",
  "end_date": "2025-08-04T23:59:59.000Z",
  "product_scope": "specific_product",
  "target_products": [111, 112, 113],
  "product_quantity": 2
}
```

## Implementation Notes

1. All coupon operations require vendor authentication
2. Vendors can only manage coupons for their own store
3. Coupon codes must be unique across the entire system
4. Percentage discounts must have values between 1 and 100
5. When targeting specific products, the products must exist and belong to the vendor's store
6. The system automatically tracks coupon usage via the `total_used` field

## Error Handling

The API returns appropriate error messages for common issues:

- 400: Bad Request (invalid input data)
- 401: Unauthorized (not authenticated)
- 404: Not Found (coupon not found)
- 500: Server Error (database or other internal errors)

## Security Considerations

- All endpoints are protected with JWT authentication
- Vendors can only access and manage their own coupons
- Input validation is performed on all fields
- Coupon codes are validated for uniqueness
