const swaggerJsDoc = require('swagger-jsdoc');
const path = require('path');

// Get absolute paths for better resolution
const routesPath = path.resolve(__dirname, '../routes/*.js');
const modelsPath = path.resolve(__dirname, '../models/*.js');
const componentsPath = path.resolve(__dirname, './components/*.js');

// Swagger Definition
const swaggerOptions = {
  failOnErrors: true, // This will cause the build to fail if there are errors in the swagger specs
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vendor API',
      version: '1.0.0',
      description: 'API documentation for the Vendor Backend System',
      contact: {
        name: 'API Support',
        email: 'support@vendorapi.com'
      },
      license: {
        name: 'Apache 2.0',
        url: 'https://www.apache.org/licenses/LICENSE-2.0.html'
      }
    },
    servers: [
      {
        url: 'http://localhost:6000',
        description: 'Development server'
      },
      {
        url: 'https://api.vendorapi.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    routesPath,
    modelsPath,
    componentsPath
  ],
  // Ensure proper file loading and reduce timeouts
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'list'
  }
};

console.log('Swagger configured with paths:', {
  routesPath,
  modelsPath,
  componentsPath
});

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsDoc(swaggerOptions);

module.exports = swaggerSpec;
