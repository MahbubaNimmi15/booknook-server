
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
    ],
  })
);

app.use(express.json());

// Verify requests from Next.js server
function verifyInternalApi(req, res, next) {
  const apiKey = req.headers["x-internal-api-key"];

  if (
    !process.env.INTERNAL_API_SECRET ||
    apiKey !== process.env.INTERNAL_API_SECRET
  ) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized request",
    });
  }

  next();
}

// Home Route
app.get("/", (req, res) => {
  res.send("BookNook Server is Running!");
});

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "BookNook API is working",
  });
});

// GET All Books
app.get("/api/books", async (req, res) => {
  try {
    const db = app.locals.db;

    const books = await db
      .collection("books")
      .find({})
      .sort({ _id: -1 })
      .toArray();

    return res.json({
      success: true,
      books,
    });
  } catch (error) {
    console.error("Error fetching books:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch books",
    });
  }
});

// GET Single Book Details
app.get("/api/books/:id", async (req, res) => {
  try {
    const db = app.locals.db;
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const book = await db.collection("books").findOne({
      _id: new ObjectId(id),
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    return res.json({
      success: true,
      book,
    });
  } catch (error) {
    console.error("Error fetching book:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch book details",
    });
  }
});

// POST Add New Book (Protected)
app.post("/api/books", verifyInternalApi, async (req, res) => {
  try {
    const db = app.locals.db;

    const {
      title,
      author,
      category,
      image,
      description,
      quantity,
      rating,
      addedBy,
    } = req.body || {};

    // Validate required fields
    if (
      [title, author, category, image, description].some(
        (value) =>
          typeof value !== "string" ||
          !value.trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields",
      });
    }

    // Validate book owner
    if (
      typeof addedBy !== "string" ||
      !addedBy.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Book owner is required",
      });
    }

    // Validate quantity and rating
    const bookQuantity = Number(quantity);
    const bookRating = Number(rating ?? 0);

    if (
      quantity === undefined ||
      quantity === null ||
      quantity === "" ||
      !Number.isInteger(bookQuantity) ||
      bookQuantity < 0 ||
      !Number.isFinite(bookRating) ||
      bookRating < 0 ||
      bookRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity or rating",
      });
    }

    // Prepare new book
    const newBook = {
      title: title.trim(),
      author: author.trim(),
      category: category.trim(),
      image: image.trim(),
      description: description.trim(),
      quantity: bookQuantity,
      rating: bookRating,
      addedBy: addedBy.trim().toLowerCase(),
      createdAt: new Date(),
    };

    // Save to MongoDB
    const result = await db
      .collection("books")
      .insertOne(newBook);

    return res.status(201).json({
      success: true,
      message: "Book added successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error adding book:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add book",
    });
  }
});

// POST Borrow Book (Protected)
app.post("/api/borrow", verifyInternalApi, async (req, res) => {
  const db = app.locals.db;
  const { bookId, userEmail } = req.body || {};

  if (
    typeof bookId !== "string" ||
    !ObjectId.isValid(bookId) ||
    typeof userEmail !== "string" ||
    !userEmail.trim()
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid book ID and user email are required",
    });
  }

  try {
    const bookObjectId = new ObjectId(bookId);
    const normalizedEmail = userEmail.trim().toLowerCase();

    const existingBorrow = await db
      .collection("borrows")
      .findOne({
        bookId: bookObjectId,
        userEmail: normalizedEmail,
        status: "borrowed",
      });

    if (existingBorrow) {
      return res.status(409).json({
        success: false,
        message: "You have already borrowed this book",
      });
    }

    const updatedBook = await db
      .collection("books")
      .updateOne(
        {
          _id: bookObjectId,
          quantity: { $gt: 0 },
        },
        {
          $inc: { quantity: -1 },
        }
      );

    if (updatedBook.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "Book is unavailable or not found",
      });
    }

    try {
      await db.collection("borrows").insertOne({
        bookId: bookObjectId,
        userEmail: normalizedEmail,
        status: "borrowed",
        borrowedAt: new Date(),
      });
    } catch (insertError) {
      await db.collection("books").updateOne(
        { _id: bookObjectId },
        { $inc: { quantity: 1 } }
      );

      throw insertError;
    }

    return res.status(201).json({
      success: true,
      message: "Book borrowed successfully",
    });
  } catch (error) {
    console.error("Borrow error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to borrow book",
    });
  }
});

// POST Return Book (Protected)
// FIXED: Handles both string and ObjectId book IDs.
app.post("/api/return", verifyInternalApi, async (req, res) => {
  const { borrowId, userEmail } = req.body || {};

  if (
    typeof borrowId !== "string" ||
    !ObjectId.isValid(borrowId) ||
    typeof userEmail !== "string" ||
    !userEmail.trim()
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid borrow ID and user email are required",
    });
  }

  try {
    const db = app.locals.db;
    const normalizedEmail = userEmail.trim().toLowerCase();

    const borrow = await db
      .collection("borrows")
      .findOneAndUpdate(
        {
          _id: new ObjectId(borrowId),
          userEmail: normalizedEmail,
          status: "borrowed",
        },
        {
          $set: {
            status: "returned",
            returnedAt: new Date(),
          },
        },
        { returnDocument: "before" }
      );

    if (!borrow) {
      return res.status(404).json({
        success: false,
        message: "Active borrow not found or already returned",
      });
    }

    try {
      // Convert string bookId to MongoDB ObjectId
      const bookId =
        typeof borrow.bookId === "string" &&
        ObjectId.isValid(borrow.bookId)
          ? new ObjectId(borrow.bookId)
          : borrow.bookId;

      if (!(bookId instanceof ObjectId)) {
        throw new Error(
          "Borrow record has an invalid book ID"
        );
      }

      // Increase quantity by 1
      const updateResult = await db
        .collection("books")
        .updateOne(
          { _id: bookId },
          { $inc: { quantity: 1 } }
        );

      // Check whether the book was found
      if (updateResult.matchedCount !== 1) {
        throw new Error(
          "Book not found while restoring quantity"
        );
      }
    } catch (error) {
      // Restore borrow status if quantity update fails
      await db.collection("borrows").updateOne(
        {
          _id: borrow._id,
          status: "returned",
        },
        {
          $set: { status: "borrowed" },
          $unset: { returnedAt: "" },
        }
      );

      throw error;
    }

    return res.json({
      success: true,
      message: "Book returned successfully",
    });
  } catch (error) {
    console.error("Return error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to return book",
    });
  }
});

// PATCH - Edit Book
app.patch("/api/books/:id", verifyInternalApi, async (req, res) => {
  try {
    const { id } = req.params;

    const {
      userEmail,
      title,
      author,
      category,
      image,
      description,
      quantity,
      rating,
    } = req.body || {};

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    if (!userEmail || typeof userEmail !== "string") {
      return res.status(400).json({
        success: false,
        message: "User email is required",
      });
    }

    if (
      [title, author, category, image, description].some(
        (value) =>
          typeof value !== "string" || !value.trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const bookQuantity = Number(quantity);
    const bookRating = Number(rating);

    if (
      !Number.isInteger(bookQuantity) ||
      bookQuantity < 0 ||
      !Number.isFinite(bookRating) ||
      bookRating < 0 ||
      bookRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity or rating",
      });
    }

    const db = app.locals.db;

    const result = await db.collection("books").updateOne(
      {
        _id: new ObjectId(id),
        addedBy: userEmail.trim().toLowerCase(),
      },
      {
        $set: {
          title: title.trim(),
          author: author.trim(),
          category: category.trim(),
          image: image.trim(),
          description: description.trim(),
          quantity: bookQuantity,
          rating: bookRating,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Book not found or not owned by you",
      });
    }

    return res.json({
      success: true,
      message: "Book updated successfully",
    });
  } catch (error) {
    console.error("Update Book Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update book",
    });
  }
});

// DELETE - Delete Book
app.delete("/api/books/:id", verifyInternalApi, async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.body || {};

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    if (!userEmail || typeof userEmail !== "string") {
      return res.status(400).json({
        success: false,
        message: "User email is required",
      });
    }

    const db = app.locals.db;

    const result = await db.collection("books").deleteOne({
      _id: new ObjectId(id),
      addedBy: userEmail.trim().toLowerCase(),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Book not found or not owned by you",
      });
    }

    return res.json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error("Delete Book Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete book",
    });
  }
});

// MongoDB Connection and Server
async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error(
        "MONGODB_URI is missing in .env"
      );
    }

    const client = new MongoClient(
      process.env.MONGODB_URI
    );

    await client.connect();

    const db = client.db(
      process.env.DB_NAME || "booknook"
    );

    await db.command({ ping: 1 });

    console.log("MongoDB Connected Successfully!");

    app.locals.db = db;

    app.listen(PORT, () => {
      console.log(
        `BookNook Server running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "MongoDB Connection Failed:",
      error.message
    );

    process.exit(1);
  }
}

startServer();
