const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Book Directory API',
            version: '1.0.0',
            description: 'A simple Express Book Directory API',
        },
        servers: [
            {
                url: 'http://localhost:3000',
            },
        ],
    },
    apis: ['./index.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
