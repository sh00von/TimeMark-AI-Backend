const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'YouTube Subtitle API',
      version: '1.0.0',
      description: 'API for extracting and analyzing YouTube video subtitles'
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
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
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string'
            },
            details: {
              type: 'string'
            }
          }
        },
        Video: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            video_id: {
              type: 'string'
            },
            video_title: {
              type: 'string'
            },
            language: {
              type: 'string'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            is_auto_generated: {
              type: 'boolean'
            }
          }
        },
        Analysis: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            chapters: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  timestamp: {
                    type: 'string'
                  },
                  title: {
                    type: 'string'
                  }
                }
              }
            },
            subtitles: {
              $ref: '#/components/schemas/Video'
            }
          }
        }
      }
    }
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

const generateOpenApiSpec = () => {
  try {
    const swaggerSpec = swaggerJsdoc(options);
    const outputPath = path.join(__dirname, 'openapi.json');
    
    fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));
    console.log('OpenAPI specification generated successfully!');
  } catch (error) {
    console.error('Error generating OpenAPI specification:', error);
  }
};

// Generate on import
generateOpenApiSpec();

module.exports = generateOpenApiSpec; 