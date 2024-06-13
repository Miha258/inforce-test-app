# Book Directory API

This is a simple REST API for managing a book directory, built using Node.js, Express.js, and Prisma. The API supports CRUD operations (Create, Read, Update, Delete) for books and authors. The application is containerized using Docker.

## Features

- Create, Read, Update, and Delete books
- Manage authors and associate them with books
- JSON-based API
- Containerized using Docker for easy setup and deployment
- Swagger documentation for API endpoints

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- Node.js (v20 or later)
- Docker (latest version recommended)

## Getting Started

### Install packages
`npm install`
`npm install -g prisma`

### Make migrations
`npx prisma migrate dev --name init`

### Generate prisma client
`npx prisma generate`

### Run app
`node index.js`

## Using Docker
`docker build -t my-node-app .`
`docker run -p 3000:3000 my-node-app`
