const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HESK API Scraper',
      version: '1.0.0',
      description: 'API de scraping HESK pour afficher les demandes d\'assistance',
      contact: {
        name: 'Support API'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Serveur de développement'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        HeskConfig: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            url: { type: 'string', example: 'https://hesk.example.com' },
            username: { type: 'string', example: 'admin' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Screen: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string', example: 'Écran Support IT' },
            unique_id: { type: 'string', example: 'abc123def456' },
            filters: {
              type: 'object',
              properties: {
                status: { type: 'array', items: { type: 'string' } },
                category: { type: 'array', items: { type: 'string' } },
                priority: { type: 'array', items: { type: 'string' } }
              }
            },
            refresh_interval: { type: 'integer', example: 60 },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Ticket: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            subject: { type: 'string' },
            status: { type: 'string' },
            priority: { type: 'string' },
            category: { type: 'string' },
            created_at: { type: 'string' },
            updated_at: { type: 'string' },
            owner: { type: 'string' }
          }
        }
      }
    },
    security: []
  },
  apis: ['./src/routes/*.js']
};

module.exports = swaggerJsdoc(options);
