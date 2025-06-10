# Vendor Withdrawal Management System

## Overview

The withdrawal management system allows vendors to request withdrawals of their funds, track the status of their requests, and export withdrawal data for reporting purposes. This system provides a complete solution for managing the financial transaction flow between the platform and vendors.

## Features

- Create withdrawal requests with bank details and other payment information
- View all withdrawal requests with filtering by status and date
- View detailed information for a specific withdrawal request
- Cancel pending withdrawal requests
- Retry failed withdrawal requests 
- Export withdrawal data in CSV and Excel formats
- Full tracking of withdrawal status (pending, processing, completed, failed)

## API Endpoints

### Get All Withdrawals

Retrieve a list of all withdrawal requests for the authenticated vendor with optional filtering.

- **URL**: `/api/withdrawals`
- **Method**: `GET`
- **Authentication**: Required (Vendor token)
- **Query Parameters**:
  - `status` - Filter by withdrawal status (pending, processing, completed, failed)
  - `startDate` - Filter by start date (YYYY-MM-DD)
  - `endDate` - Filter by end date (YYYY-MM-DD)

#### Success Response

```json
{
  "status": "success",
  "results": 3,
  "data": {
    "withdrawals": [
      {
        "id": 125868485,
        "customer_id": 42,
        "amount": 1250.00,
        "fee": 50.00,
        "status": "pending",
        "payment_channel": "Bank Transfer",
        "transaction_id": "#216516516516",
        "bank_info": "{\"bank_name\":\"YES BANK\",\"ifsc\":\"YES00011000002\",\"account_number\":\"621652621161161155\"}",
        "created_at": "2024-06-15T00:00:00.000Z",
        "updated_at": "2024-06-15T00:00:00.000Z"
      },
      // More withdrawal records...
    ]
  }
}
```

### Get Withdrawal by ID

Retrieve details of a specific withdrawal request.

- **URL**: `/api/withdrawals/:id`
- **Method**: `GET`
- **Authentication**: Required (Vendor token)
- **URL Parameters**:
  - `id` - Withdrawal request ID

#### Success Response

```json
{
  "status": "success",
  "data": {
    "withdrawal": {
      "id": 125868485,
      "customer_id": 42,
      "amount": 1250.00,
      "fee": 50.00,
      "status": "pending",
      "payment_channel": "Bank Transfer",
      "transaction_id": "#216516516516",
      "description": "Short Description",
      "bank_info": "{\"bank_name\":\"YES BANK\",\"ifsc\":\"YES00011000002\",\"account_number\":\"621652621161161155\"}",
      "created_at": "2024-06-15T00:00:00.000Z",
      "updated_at": "2024-06-15T00:00:00.000Z",
      "bank_details": {
        "bank_name": "YES BANK",
        "ifsc": "YES00011000002",
        "account_number": "621652621161161155"
      }
    }
  }
}
```

### Create Withdrawal Request

Create a new withdrawal request.

- **URL**: `/api/withdrawals`
- **Method**: `POST`
- **Authentication**: Required (Vendor token)
- **Request Body**:
  ```json
  {
    "amount": 1250.00,
    "payment_channel": "Bank Transfer",
    "transaction_id": "#216516516516",
    "description": "Short Description",
    "bank_info": {
      "bank_name": "YES BANK",
      "ifsc": "YES00011000002",
      "account_number": "621652621161161155"
    }
  }
  ```

#### Success Response

```json
{
  "status": "success",
  "data": {
    "withdrawal": {
      "id": 125868485,
      "customer_id": 42,
      "amount": 1250.00,
      "fee": 50.00,
      "status": "pending",
      "payment_channel": "Bank Transfer",
      "transaction_id": "#216516516516",
      "description": "Short Description",
      "bank_info": "{\"bank_name\":\"YES BANK\",\"ifsc\":\"YES00011000002\",\"account_number\":\"621652621161161155\"}",
      "created_at": "2024-06-15T00:00:00.000Z",
      "updated_at": "2024-06-15T00:00:00.000Z"
    }
  }
}
```

### Cancel Withdrawal Request

Cancel a pending or processing withdrawal request.

- **URL**: `/api/withdrawals/:id/cancel`
- **Method**: `PATCH`
- **Authentication**: Required (Vendor token)
- **URL Parameters**:
  - `id` - Withdrawal request ID

#### Success Response

```json
{
  "status": "success",
  "message": "Withdrawal request cancelled successfully",
  "data": {
    "withdrawal": {
      "id": 125868485,
      "status": "failed",
      // other withdrawal data...
    }
  }
}
```

### Retry Failed Withdrawal

Retry a failed withdrawal request by creating a new one with the same details.

- **URL**: `/api/withdrawals/:id/retry`
- **Method**: `POST`
- **Authentication**: Required (Vendor token)
- **URL Parameters**:
  - `id` - Withdrawal request ID
- **Request Body** (optional):
  ```json
  {
    "transaction_id": "#NEW216516516516"
  }
  ```

#### Success Response

```json
{
  "status": "success",
  "message": "Withdrawal request retried successfully",
  "data": {
    "withdrawal": {
      "id": 125868486,
      "status": "pending",
      // other withdrawal data...
    }
  }
}
```

### Export Withdrawals as CSV

Export withdrawal data as a CSV file.

- **URL**: `/api/withdrawals/export-csv`
- **Method**: `GET`
- **Authentication**: Required (Vendor token)
- **Query Parameters**:
  - `status` - Filter by withdrawal status (pending, processing, completed, failed)
  - `startDate` - Filter by start date (YYYY-MM-DD)
  - `endDate` - Filter by end date (YYYY-MM-DD)
- **Response**: CSV file download

### Export Withdrawals as Excel

Export withdrawal data as an Excel file.

- **URL**: `/api/withdrawals/export-excel`
- **Method**: `GET`
- **Authentication**: Required (Vendor token)
- **Query Parameters**:
  - `status` - Filter by withdrawal status (pending, processing, completed, failed)
  - `startDate` - Filter by start date (YYYY-MM-DD)
  - `endDate` - Filter by end date (YYYY-MM-DD)
- **Response**: Excel file download

## Error Responses

### Authentication Error

```json
{
  "status": "fail",
  "message": "Please log in to access this resource"
}
```

### Not Found Error

```json
{
  "status": "fail",
  "message": "Withdrawal request not found or you do not have permission to view it"
}
```

### Validation Error

```json
{
  "status": "fail",
  "message": "Please provide a valid withdrawal amount"
}
```

### Status Change Error

```json
{
  "status": "fail",
  "message": "Cannot cancel withdrawal request in completed status"
}
```

## Implementation Notes

- The withdrawal system uses the `CustomerWithdrawal` model that maps to the existing `mp_customer_withdrawals` table
- Bank details are stored as a JSON string in the `bank_info` field
- All withdrawal requests are associated with the authenticated vendor's ID
- A standard fee of ₹50.00 is applied to each withdrawal request
- The withdrawal status lifecycle is: pending -> processing -> completed/failed
- Vendors can only cancel withdrawals in 'pending' or 'processing' status
- Vendors can only retry withdrawals in 'failed' status
