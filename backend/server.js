
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

const allowedOrigins = [
    process.env.FRONTEND_URL,
    "http://127.0.0.1:5500",
    "http://localhost:5500"
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        callback(new Error("Not allowed by CORS"));
    }
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
        default: "",
        validate: {
            validator: value => {
                if (!value) return true;

                try {
                    const url = new URL(value);
                    return ["http:", "https:"].includes(url.protocol);
                } catch {
                    return false;
                }
            },
            message: "Invalid image URL"
        }
    },
    contactNumber: {
        type: String,
        required: true,
        trim: true,
        match: [/^\+?[0-9]{10,15}$/, "Enter a valid contact number"]
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 120,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address"]
    },
    owner: {
        type: String,
        required: true,
        trim: true,
        maxlength: 60
    },
    status: {
        type: String,
        enum: ["Available", "Taken"],
        default: "Available"
    }
}, {
    timestamps: true
});

const Book = mongoose.model("Book", bookSchema);

app.get("/", (req, res) => {
    res.json({
        message: "BookCycle API is running"
    });
});

app.get("/api/books", async (req, res) => {
    try {
        const books = await Book.find().sort({ createdAt: -1 });

        res.json(books);
    } catch (error) {
        console.error("Fetch error:", error.message);

        res.status(500).json({
            message: "Failed to fetch books"
        });
    }
});

app.post("/api/books", async (req, res) => {
    try {
        const {
            title,
            author,
            category,
            condition,
            description,
            offer,
            image,
            contactNumber,
            email,
            owner
        } = req.body;

        const book = await Book.create({
            title,
            author,
            category,
            condition,
            description,
            offer,
            image,
            contactNumber,
            email,
            owner,
            status: "Available"
        });

        res.status(201).json(book);
    } catch (error) {
        console.error("Create error:", error.message);

        res.status(400).json({
            message: error.message || "Invalid book details"
        });
    }
});

app.put("/api/books/:id", async (req, res) => {
    try {
        const allowedFields = [
            "title",
            "author",
            "category",
            "condition",
            "description",
            "offer",
            "image",
            "contactNumber",
            "email",
            "owner",
            "status"
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: "No valid fields provided for update"
            });
        }

        if (
            updates.status &&
            !["Available", "Taken"].includes(updates.status)
        ) {
            return res.status(400).json({
                message: "Invalid availability status"
            });
        }

        const book = await Book.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
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
        console.error("Update error:", error.message);

        res.status(400).json({
            message: error.message || "Unable to update book"
        });
    }
});

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});

app.use((error, req, res, next) => {
    if (error.message === "Not allowed by CORS") {
        return res.status(403).json({
            message: "Origin not allowed"
        });
    }

    console.error(error);

    res.status(500).json({
        message: "Internal server error"
    });
});

const PORT = process.env.PORT || 5000;

if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is missing from environment variables");
    process.exit(1);
}

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
