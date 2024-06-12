const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bodyParser = require('body-parser');
const { swaggerUi, specs } = require('./swagger');

const prisma = new PrismaClient();
const app = express();
const port = 3000;

app.use(bodyParser.json());

// Swagger setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));


const bookExistsMiddleware = async (req, res, next) => {
    const { id } = req.params;
    try {
        const book = await prisma.book.findUnique({
            where: { id: parseInt(id) }
        });

        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        req.book = book;
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: `An error occurred while checking the book ${error}` });
    }
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Book:
 *       type: object
 *       required:
 *         - title
 *         - pageCount
 *         - publishedDate
 *         - thumbnailUrl
 *         - shortDescription
 *         - longDescription
 *         - status
 *         - authors
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the book
 *         title:
 *           type: string
 *           description: The title of the book
 *         pageCount:
 *           type: integer
 *           description: The number of pages in the book
 *         publishedDate:
 *           type: string
 *           format: date-time
 *           description: The date the book was published
 *         thumbnailUrl:
 *           type: string
 *           description: The URL of the book's thumbnail
 *         shortDescription:
 *           type: string
 *           description: A short description of the book
 *         longDescription:
 *           type: string
 *           description: A detailed description of the book
 *         status:
 *           type: string
 *           description: The publication status of the book
 *         authors:
 *           type: array
 *           items:
 *             type: string
 *           description: The authors of the book
 *       example:
 *         id: 1
 *         title: "Unlocking Android"
 *         pageCount: 416
 *         publishedDate: "2009-04-01T00:00:00.000-0700"
 *         thumbnailUrl: "https://s3.amazonaws.com/AKIAJC5RLADLUMVRPFDQ.book-thumb-images/ableson.jpg"
 *         shortDescription: "Unlocking Android: A Developer's Guid ..."
 *         longDescription: "Android is an open source mobile phone platform based os..."
 *         status: "PUBLISH"
 *         authors: ["W. Frank Ableson", "Charlie Collins", "Robi Sen"]
 */

/**
 * @swagger
 * tags:
 *   name: Books
 *   description: The books managing API
 */

/**
 * @swagger
 * /books:
 *   get:
 *     summary: Returns the list of all the books
 *     tags: [Books]
 *     responses:
 *       200:
 *         description: The list of the books
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 */

app.get('/books', async (req, res) => {
    try {
        const books = await prisma.book.findMany({
            include: {
                authors: {
                    select: {
                        name: true
                    }
                }
            }
        });
        const booksWithAuthorNames = books.map(book => ({
            ...book,
            authors: book.authors.map(author => author.name)
        }));

        res.json(booksWithAuthorNames);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while retrieving the books' });
    }
});

/**
 * @swagger
 * /books/{id}:
 *   get:
 *     summary: Get the book by id
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The book id
 *     responses:
 *       200:
 *         description: The book description by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       404:
 *         description: The book was not found
 */

app.get('/books/:id', bookExistsMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        let book = await prisma.book.findUnique({
            where: { id: parseInt(id) },
            include: {
                authors: {
                    select: {
                        name: true
                    }
                }
            }
        });
        book.authors = book.authors.map(author => author.name);
        res.json(book);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching the book' });
    }
});


/**
 * @swagger
 * /books:
 *   post:
 *     summary: Create a new book
 *     tags: [Books]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Book'
 *     responses:
 *       200:
 *         description: The book was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       500:
 *         description: Some server error
 */

app.post('/books', async (req, res) => {
    try {
        const { title, pageCount, publishedDate, thumbnailUrl, shortDescription, longDescription, status, authors } = req.body;
        const authorConnectOrCreate = []

        if (authors) {
            for (let authorName of authors) {
                let author = await prisma.author.findUnique({
                    where: { name: authorName },
                })

                if (!author) {
                    author = await prisma.author.create({
                        data: { name: authorName }
                    });
                }

                authorConnectOrCreate.push({
                    id: author.id
                });
            }
        }

        const book = await prisma.book.create({
            data: {
                title,
                pageCount,
                publishedDate: new Date(publishedDate),
                thumbnailUrl,
                shortDescription,
                longDescription,
                status,
                authors: {
                    connect: authorConnectOrCreate
                }
            },
            include: {
                authors: {
                    select: {
                        name: true
                    }
                }
            }
        });

        book.authors = book.authors.map(author => author.name);
        res.json(book);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while creating the book' });
    }
});

/**
 * @swagger
 * /books/{id}:
 *   put:
 *     summary: Update the book by the id
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The book id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Book'
 *     responses:
 *       200:
 *         description: The book was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       404:
 *         description: The book was not found
 *       500:
 *         description: Some error happened
 */

app.put('/books/:id', bookExistsMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, pageCount, publishedDate, thumbnailUrl, shortDescription, longDescription, status, authors } = req.body;
        const authorConnectOrCreate = [];

        if (!authors || authors.length === 0) {
            throw new Error('At least one author is required for the book');
        }

        for (let authorName of authors) {
            let author = await prisma.author.findUnique({
                where: { name: authorName },
            });

            if (!author) {
                author = await prisma.author.create({
                    data: { name: authorName }
                });
            }

            authorConnectOrCreate.push({
                id: author.id
            });
        }

        let book = await prisma.book.update({
            where: { id: parseInt(id) },
            data: {
                title,
                pageCount,
                publishedDate: new Date(publishedDate),
                thumbnailUrl,
                shortDescription,
                longDescription,
                status,
                authors: {
                    connect: authorConnectOrCreate
                }
            },
            include: {
                authors: true
            }
        });

        const currentAuthorIds = book.authors.map(author => author.id);
        const authorsToRemove = currentAuthorIds.filter(authorId => !authorConnectOrCreate.some(author => author.id === authorId));
        if (authorsToRemove.length > 0) {
            await prisma.book.update({
                where: { id: parseInt(id) },
                data: {
                    authors: {
                        disconnect: authorsToRemove.map(id => ({ id }))
                    }
                }
            });
            book = await prisma.book.findUnique({
                where: { id: parseInt(id) },
                include: {
                    authors: true
                }
            });
        }
        book.authors = book.authors.map(author => author.name);
        res.json(book);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while updating the book' });
    }
});



/**
 * @swagger
 * /books/{id}:
 *   delete:
 *     summary: Remove the book by id
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The book id
 *     responses:
 *       200:
 *         description: The book was deleted
 *       404:
 *         description: The book was not found
 */

app.delete('/books/:id', bookExistsMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const deletedBook = await prisma.book.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Book deleted successfully', deletedBook });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while deleting the book' });
    }
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`Swagger docs are available at http://localhost:${port}/api-docs`);
});
