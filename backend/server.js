
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL
}));

app.use(express.json({ limit: "1mb" }));

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    author: {
        type: String,
        required: true,
        trim: true,
        maxlength: 80
    },
    category: {
        type: String,
        required: true,
        enum: [
            "Academic",
            "Competitive Exams",
            "Novels",
            "Reference",
            "Other"
        ]
    },
    condition: {
        type: String,
        required: true,
        enum: ["Like New", "Good", "Used"]
    },
    description: {
        type: String,
        maxlength: 400,
        default: ""
    },
    offer: {
        type: String,
        required: true,
        enum: ["Share", "Exchange", "Donate", "Sell"]
    },
    image: {
        type: String,
        default: ""
    },
    contact: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120
    },
    owner: {
        type: String,
        required: true,
        trim: true,
        maxlength: 60
    },
    status: {
        type: String,
        enum: ["Available", "Taken", "Exchanged"],
        default: "Available"
    }
}, {
    timestamps: true
});

const Book = mongoose.model("Book", bookSchema);

app.get("/", (req, res) => {
    res.json({ message: "BookCycle API is running" });
});

app.get("/api/books", async (req, res) => {
    try {
        const books = await Book.find().sort({ createdAt: -1 });
        res.json(books);
    } catch {
        res.status(500).json({ message: "Failed to fetch books" });
    }
});

app.post("/api/books", async (req, res) => {
    try {
        const book = await Book.create(req.body);
        res.status(201).json(book);
    } catch (error) {
        res.status(400).json({
            message: error.message || "Invalid book details"
        });
    }
});

app.put("/api/books/:id", async (req, res) => {
    try {
        const book = await Book.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!book) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        res.json(book);
    } catch (error) {
        res.status(400).json({
            message: error.message || "Unable to update book"
        });
    }
});

app.delete("/api/books/:id", async (req, res) => {
    try {
        const book = await Book.findByIdAndDelete(req.params.id);

        if (!book) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        res.json({ message: "Book deleted successfully" });
    } catch {
        res.status(400).json({ message: "Invalid book ID" });
    }
});

app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("Connected to MongoDB");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(error => {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    });
