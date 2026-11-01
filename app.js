
const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();

app.use(express.json());

// Database file path
const databasePath = path.join(__dirname, "library.db");

let db;

// Initialize database and start server
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    console.log("Database connected successfully");

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.log(`Database Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// ------------------------------------
// GET: Retrieve all books
// URL: /books/
// ------------------------------------
app.get("/books/", async (request, response) => {
  try {
    const books = await db.all("SELECT * FROM book");

    response.status(200).send(books);
  } catch (error) {
    response.status(500).send({
      error: error.message,
    });
  }
});

// ------------------------------------
// GET: Retrieve a book by ID
// URL: /books/:bookId/
// ------------------------------------
app.get("/books/:bookId/", async (request, response) => {
  try {
    const { bookId } = request.params;

    const book = await db.get(
      "SELECT * FROM book WHERE id = ?",
      [bookId]
    );

    if (book === undefined) {
      return response.status(404).send({
        error: "Book not found",
      });
    }

    response.status(200).send(book);
  } catch (error) {
    response.status(500).send({
      error: error.message,
    });
  }
});

// ------------------------------------
// POST: Add a new book
// URL: /books/
// ------------------------------------
app.post("/books/", async (request, response) => {
  try {
    const { title, author, price, pages } = request.body;

    if (
      !title ||
      !author ||
      price === undefined ||
      pages === undefined
    ) {
      return response.status(400).send({
        error: "Title, author, price and pages are required",
      });
    }

    const query = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?)
    `;

    const result = await db.run(query, [
      title,
      author,
      price,
      pages,
    ]);

    response.status(201).send({
      message: "Book added successfully",
      bookId: result.lastID,
    });
  } catch (error) {
    response.status(500).send({
      error: error.message,
    });
  }
});

// ------------------------------------
// PUT: Update a book by ID
// URL: /books/:bookId/
// ------------------------------------
app.put("/books/:bookId/", async (request, response) => {
  try {
    const { bookId } = request.params;
    const { title, author, price, pages } = request.body;

    const existingBook = await db.get(
      "SELECT * FROM book WHERE id = ?",
      [bookId]
    );

    if (existingBook === undefined) {
      return response.status(404).send({
        error: "Book not found",
      });
    }

    if (
      !title ||
      !author ||
      price === undefined ||
      pages === undefined
    ) {
      return response.status(400).send({
        error: "Title, author, price and pages are required",
      });
    }

    const query = `
      UPDATE book
      SET title = ?, author = ?, price = ?, pages = ?
      WHERE id = ?
    `;

    await db.run(query, [
      title,
      author,
      price,
      pages,
      bookId,
    ]);

    response.status(200).send({
      message: "Book updated successfully",
    });
  } catch (error) {
    response.status(500).send({
      error: error.message,
    });
  }
});

// ------------------------------------
// DELETE: Delete a book by ID
// URL: /books/:bookId/
// ------------------------------------
app.delete("/books/:bookId/", async (request, response) => {
  try {
    const { bookId } = request.params;

    const existingBook = await db.get(
      "SELECT * FROM book WHERE id = ?",
      [bookId]
    );

    if (existingBook === undefined) {
      return response.status(404).send({
        error: "Book not found",
      });
    }

    await db.run(
      "DELETE FROM book WHERE id = ?",
      [bookId]
    );

    response.status(200).send({
      message: "Book deleted successfully",
    });
  } catch (error) {
    response.status(500).send({
      error: error.message,
    });
  }
});
