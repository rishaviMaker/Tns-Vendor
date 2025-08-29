# Admin API Documentation

## Authentication
All endpoints except `/login` require authentication. Include the JWT token in the `Authorization` header as `Bearer <token>`.

## Base URL
`http://localhost:6000/admin`

## Endpoints

### 1. Admin Login
- **URL**: `/login`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "admin@example.com",
    "password": "yourpassword"
  }
  ```
- **Success Response**:
  ```json
  {
    "status": "success",
    "data": {
      "token": "jwt.token.here"
    }
  }
  ```

### 2. Get All Vendors
- **URL**: `/all-vendors`
- **Method**: `GET`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)
- **Success Response**:
  ```json
  {
    "status": "success",
    "results": 10,
    "data": {
      "vendors": [
        {
          "id": 1,
          "name": "Vendor Name",
          "email": "vendor@example.com",
          "status": "active"
        }
      ]
    }
  }
  ```

### 3. Get Vendor Details
- **URL**: `/vendor/:id`
- **Method**: `GET`
- **Success Response**:
  ```json
  {
    "status": "success",
    "data": {
      "vendor": {
        "id": 1,
        "name": "Vendor Name",
        "email": "vendor@example.com",
        "status": "active"
      }
    }
  }
  ```

### 4. Update Vendor
- **URL**: `/vendor/:id`
- **Method**: `PUT`
- **Request Body**:
  ```json
  {
    "status": "suspended"
  }
  ```
- **Success Response**:
  ```json
  {
    "status": "success",
    "data": {
      "vendor": {
        "id": 1,
        "status": "suspended"
      }
    }
  }
  ```

### 5. Get All Products
- **URL**: `/all-products`
- **Method**: `GET`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)
- **Success Response**: Similar to vendors but with product data

### 6. Get Product Details
- **URL**: `/product/:id`
- **Method**: `GET`
- **Success Response**:
  ```json
  {
    "status": "success",
    "data": {
      "product": {
        "id": 1,
        "name": "Product Name",
        "price": 99.99,
        "status": "active"
      }
    }
  }
  ```

### 7. Update Product
- **URL**: `/product/:id`
- **Method**: `PUT`
- **Request Body**:
  ```json
  {
    "status": "inactive"
  }
  ```
- **Success Response**:
  ```json
  {
    "status": "success",
    "data": {
      "product": {
        "id": 1,
        "status": "inactive"
      }
    }
  }
  ```

### 8. Delete Product
- **URL**: `/product/:id`
- **Method**: `DELETE`
- **Success Response**:
  ```json
  {
    "status": "success",
    "data": null
  }
  ```

### 9. Get All Product Requests
- **URL**: `/all-product-requests`
- **Method**: `GET`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)
- **Success Response**: Similar to vendors but with product request data

### 10. Approve Product Request
- **URL**: `/product-request/:id/approve`
- **Method**: `PUT`
- **Success Response**:
  ```json
  {
    "status": "success",
    "message": "Product request approved successfully"
  }
  ```

### 11. Reject Product Request
- **URL**: `/product-request/:id/reject`
- **Method**: `PUT`
- **Success Response**:
  ```json
  {
    "status": "success",
    "message": "Product request rejected"
  }
  ```

### 12. Delete Product Request
- **URL**: `/product-request/:id`
- **Method**: `DELETE`
- **Success Response**:
  ```json
  {
    "status": "success",
    "data": null
  }
  ```

## Error Responses

### 401 Unauthorized
```json
{
  "status": "fail",
  "message": "Invalid token"
}
```

### 403 Forbidden
```json
{
  "status": "fail",
  "message": "You do not have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "status": "fail",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "Something went wrong on the server"
}
```

## Rate Limiting
- 100 requests per 15 minutes per IP address

## Versioning
- API Version: 1.0.0
- Header: `X-API-Version: 1.0.0`
