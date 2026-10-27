
const STORAGE_KEY = "bookcycle_books";

const sampleBooks = [
    {
        id: "sample-1",
        title: "Engineering Mathematics",
        author: "B. S. Grewal",
        category: "Academic",
        condition: "Good",
        description: "A useful reference for engineering mathematics and problem-solving practice.",
        offer: "Share",
        imageUrl: "",
        contact: "maths.student@example.com",
        owner: "Rahul",
        status: "Available"
    },
    {
        id: "sample-2",
        title: "Atomic Habits",
        author: "James Clear",
        category: "Novels",
        condition: "Like New",
        description: "A popular book about building better habits and improving every day.",
        offer: "Exchange",
        imageUrl: "",
        contact: "reader@example.com",
        owner: "Ananya",
        status: "Available"
    },
    {
        id: "sample-3",
        title: "Quantitative Aptitude",
        author: "R. S. Aggarwal",
        category: "Competitive Exams",
        condition: "Used",
        description: "Practice material for quantitative aptitude and competitive examinations.",
        offer: "Donate",
        imageUrl: "",
        contact: "student@example.com",
        owner: "Arjun",
        status: "Taken"
    },
    {
        id: "sample-4",
        title: "Introduction to Algorithms",
        author: "Thomas H. Cormen",
        category: "Reference",
        condition: "Good",
        description: "A detailed reference for algorithms, data structures, and computer science.",
        offer: "Share",
        imageUrl: "",
        contact: "cs.student@example.com",
        owner: "Priya",
        status: "Available"
    },
    {
        id: "sample-5",
        title: "The Alchemist",
        author: "Paulo Coelho",
        category: "Novels",
        condition: "Good",
        description: "An inspiring story about following your dreams and finding your purpose.",
        offer: "Exchange",
        imageUrl: "",
        contact: "books@example.com",
        owner: "Kiran",
        status: "Exchanged"
    },
    {
        id: "sample-6",
        title: "Computer Networks",
        author: "Andrew S. Tanenbaum",
        category: "Academic",
        condition: "Like New",
        description: "Networking concepts, protocols, and useful computer science fundamentals.",
        offer: "Sell",
        imageUrl: "",
        contact: "networking@example.com",
        owner: "Meera",
        status: "Available"
    }
];

const bookGrid = document.getElementById("book-grid");
const searchInput = document.getElementById("search");
const categoryFilter = document.getElementById("category-filter");
const availabilityFilter = document.getElementById("availability-filter");
const bookDialog = document.getElementById("book-dialog");
const bookForm = document.getElementById("book-form");
const formTitle = document.getElementById("form-title");
const formError = document.getElementById("form-error");
const emptyMessage = document.getElementById("empty-message");
const toast = document.getElementById("toast");

let books = loadBooks();
let toastTimeout;

function loadBooks() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);

        if (stored === null) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleBooks));
            return sampleBooks.map(book => ({ ...book }));
        }

        const parsed = JSON.parse(stored);

        if (
            !Array.isArray(parsed) ||
            !parsed.every(book =>
                book &&
                typeof book.id === "string" &&
                typeof book.title === "string" &&
                typeof book.author === "string"
            )
        ) {
            return [];
        }

        return parsed;
    } catch {
        return [];
    }
}

function saveBooks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
        return true;
    } catch {
        showToast("Unable to save. Check browser storage settings.");
        return false;
    }
}

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function safeImageUrl(value) {
    try {
        const url = new URL(value);

        if (url.protocol === "https:" || url.protocol === "http:") {
            return url.href;
        }
    } catch {
        return "";
    }

    return "";
}

function showToast(message) {
    clearTimeout(toastTimeout);
    toast.textContent = message;
    toast.classList.add("show");

    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}

function updateStats() {
    document.getElementById("total-books").textContent = books.length;

    document.getElementById("available-books").textContent =
        books.filter(book => book.status === "Available").length;

    document.getElementById("shared-books").textContent =
        books.filter(book =>
            book.status === "Taken" || book.status === "Exchanged"
        ).length;
}

function getFilteredBooks() {
    const query = searchInput.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const status = availabilityFilter.value;

    return books.filter(book => {
        const matchesSearch =
            book.title.toLowerCase().includes(query) ||
            book.author.toLowerCase().includes(query);

        const matchesCategory =
            category === "All" || book.category === category;

        const matchesStatus =
            status === "All" || book.status === status;

        return matchesSearch && matchesCategory && matchesStatus;
    });
}

function renderBooks() {
    const filteredBooks = getFilteredBooks();

    emptyMessage.hidden = filteredBooks.length !== 0;

    bookGrid.innerHTML = filteredBooks.map(book => {
        const imageUrl = safeImageUrl(book.imageUrl || "");
        const available = book.status === "Available";

        const cover = imageUrl
            ? `<img src="${escapeHTML(imageUrl)}" alt="Cover of ${escapeHTML(book.title)}" loading="lazy">`
            : `<div class="cover-placeholder">
                   <div>
                       <span>${escapeHTML(book.category)}</span>
                       <strong>${escapeHTML(book.title)}</strong>
                   </div>
               </div>`;

        return `
            <article class="book-card">
                <div class="book-cover">${cover}</div>

                <div class="book-info">
                    <div class="card-topline">
                        <span class="category-tag">${escapeHTML(book.category)}</span>
                        <span class="availability-tag ${available ? "available" : "unavailable"}">
                            ${escapeHTML(book.status)}
                        </span>
                    </div>

                    <h3>${escapeHTML(book.title)}</h3>
                    <p class="book-author">by ${escapeHTML(book.author)}</p>
                    <p class="book-description">${escapeHTML(book.description || "No description provided.")}</p>

                    <div class="book-meta">
                        <span>Condition: ${escapeHTML(book.condition || "Not specified")}</span>
                        <span>${escapeHTML(book.offer || "Share")}</span>
                    </div>

                    <div class="book-meta">
                        <span>Listed by ${escapeHTML(book.owner || "Student")}</span>
                    </div>

                    <div class="card-actions">
                        <button type="button" data-action="contact" data-id="${escapeHTML(book.id)}">Contact</button>
                        <button type="button" data-action="edit" data-id="${escapeHTML(book.id)}">Edit</button>
                        <button type="button" data-action="status" data-id="${escapeHTML(book.id)}">Status</button>
                        <button type="button" data-action="delete" data-id="${escapeHTML(book.id)}">Delete</button>
                    </div>
                </div>
            </article>
        `;
    }).join("");

    updateStats();
}

function openBookForm(book = null) {
    bookForm.reset();
    formError.textContent = "";

    document.getElementById("book-id").value = book ? book.id : "";

    formTitle.textContent = book ? "Edit book" : "Share a book";

    document.getElementById("title").value = book?.title || "";
    document.getElementById("author").value = book?.author || "";
    document.getElementById("category").value = book?.category || "Academic";
    document.getElementById("condition").value = book?.condition || "Good";
    document.getElementById("description").value = book?.description || "";
    document.getElementById("offer").value = book?.offer || "Share";
    document.getElementById("image-url").value = book?.imageUrl || "";
    document.getElementById("contact").value = book?.contact || "";
    document.getElementById("owner").value = book?.owner || "";
    document.getElementById("status").value = book?.status || "Available";

    bookDialog.showModal();
}

function closeBookForm() {
    bookDialog.close();
    formError.textContent = "";
}

document.getElementById("open-form").addEventListener("click", () => {
    openBookForm();
});

document.getElementById("hero-share").addEventListener("click", () => {
    openBookForm();
});

document.getElementById("close-form").addEventListener("click", closeBookForm);
document.getElementById("cancel-form").addEventListener("click", closeBookForm);

bookDialog.addEventListener("click", event => {
    if (event.target === bookDialog) {
        closeBookForm();
    }
});

searchInput.addEventListener("input", renderBooks);
categoryFilter.addEventListener("change", renderBooks);
availabilityFilter.addEventListener("change", renderBooks);

bookForm.addEventListener("submit", event => {
    event.preventDefault();
    formError.textContent = "";

    const id = document.getElementById("book-id").value;

    const title = document.getElementById("title").value.trim();
    const author = document.getElementById("author").value.trim();
    const imageInput = document.getElementById("image-url").value.trim();
    const contact = document.getElementById("contact").value.trim();
    const owner = document.getElementById("owner").value.trim();

    if (!title || !author || !contact || !owner) {
        formError.textContent = "Please fill in all required fields.";
        return;
    }

    if (imageInput && !safeImageUrl(imageInput)) {
        formError.textContent = "Enter a valid HTTP or HTTPS image URL.";
        return;
    }

    const existingBook = books.find(book => book.id === id);

    const book = {
        id: existingBook ? existingBook.id : (
            typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2)}`
        ),
        title,
        author,
        category: document.getElementById("category").value,
        condition: document.getElementById("condition").value,
        description: document.getElementById("description").value.trim(),
        offer: document.getElementById("offer").value,
        imageUrl: imageInput ? safeImageUrl(imageInput) : "",
        contact,
        owner,
        status: document.getElementById("status").value
    };

    const previousBooks = books;

    if (existingBook) {
        books = books.map(item => item.id === id ? book : item);
    } else {
        books = [book, ...books];
    }

    if (!saveBooks()) {
        books = previousBooks;
        return;
    }

    closeBookForm();
    renderBooks();
    showToast(existingBook ? "Book updated successfully." : "Book added successfully.");
});

bookGrid.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const book = books.find(item => item.id === button.dataset.id);

    if (!book) return;

    const action = button.dataset.action;

    if (action === "contact") {
        alert(
            `Book: ${book.title}\n` +
            `Owner: ${book.owner}\n` +
            `Contact: ${book.contact}\n` +
            `Offer: ${book.offer}\n` +
            `Availability: ${book.status}`
        );
    }

    if (action === "edit") {
        openBookForm(book);
    }

    if (action === "status") {
        const options = ["Available", "Taken", "Exchanged"];
        const currentIndex = options.indexOf(book.status);
        const nextStatus = options[(currentIndex + 1) % options.length];

        const previousBooks = books;
        books = books.map(item =>
            item.id === book.id ? { ...item, status: nextStatus } : item
        );

        if (!saveBooks()) {
            books = previousBooks;
            return;
        }

        renderBooks();
        showToast(`Book marked as ${nextStatus}.`);
    }

    if (action === "delete") {
        if (!confirm(`Delete "${book.title}" from your local collection?`)) {
            return;
        }

        const previousBooks = books;
        books = books.filter(item => item.id !== book.id);

        if (!saveBooks()) {
            books = previousBooks;
            return;
        }

        renderBooks();
        showToast("Book deleted successfully.");
    }
});

renderBooks();
