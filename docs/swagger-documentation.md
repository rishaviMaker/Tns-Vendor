# Swagger API Documentation Guide

## Overview

This document explains how to access, maintain, and extend the Swagger API documentation for the Vendor API platform.

## Accessing the Documentation

The Swagger documentation is available at two endpoints:

- **UI Documentation**: `/api-docs` - Interactive OpenAPI documentation with a user-friendly interface
- **JSON Schema**: `/api-docs.json` - Raw OpenAPI schema in JSON format

## Project Structure

The Swagger documentation is organized in a modular way:

```
swagger/
├── config.js            # Main Swagger configuration
├── components/
│   ├── schemas.js       # Data models/schemas definitions
│   ├── parameters.js    # Common API parameters
│   ├── responses.js     # Standard API responses
│   └── security.js      # Authentication schemes and security endpoints
```

## Adding New Endpoints

Follow these steps to document a new API endpoint:

1. Use JSDoc comments directly above the route declaration:

```javascript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     summary: Brief description
 *     description: Detailed description
 *     tags: [YourTag]
 *     parameters:
 *       - $ref: '#/components/parameters/someParameter'
 *     responses:
 *       200:
 *         description: Success response description
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YourResponseSchema'
 */
router.get('/', yourController.yourMethod);
```

2. If you need new schemas or components, add them to the appropriate files in the `swagger/components/` directory.

## Best Practices

1. **Group Related Endpoints**: Use tags to group related endpoints.
2. **Reuse Components**: Reference common parameters, responses, and schemas.
3. **Include Examples**: Provide example values to make the documentation more useful.
4. **Keep Documentation Updated**: Update the Swagger comments when you change the API.
5. **Test Documentation**: Regularly verify that the Swagger UI works and accurately reflects your APIs.

## Authentication

All protected routes are documented with the `bearerAuth` security scheme. Users will need to:

1. Authenticate using the login endpoint
2. Copy the returned JWT token
3. Click the "Authorize" button in Swagger UI
4. Enter the token with the format `Bearer your-token`

## Extending Documentation

To add new sections or enhance the documentation:

1. **New Models**: Add to `swagger/components/schemas.js`
2. **Common Parameters**: Add to `swagger/components/parameters.js`
3. **Standard Responses**: Add to `swagger/components/responses.js`
4. **New API Groups**: Add a new tag declaration at the top of the relevant router file

## Troubleshooting

If the Swagger documentation is not showing correctly:

1. Check that all JSDoc comments are properly formatted
2. Verify that the API paths in the Swagger documentation match your actual routes
3. Ensure all referenced components (schemas, parameters, etc.) are defined
4. Restart the server after making changes to Swagger documentation
