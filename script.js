
document.addEventListener("DOMContentLoaded", () => {
    const $ = selector => document.querySelector(selector);

    const dialog = $("#book-dialog");
    const form = $("#book-form");
    const grid = $("#book-grid");
    const searchInput = $("#search");
    const categoryFilter = $("#category-filter");
    const availabilityFilter = $("#availability-filter");
    const errorMessage = $("#form-error");
    const toast = $("#toast");

    const STORAGE_KEY = "bookcycle_books";

    const API_URL = "https://YOUR-BACKEND-NAME.onrender.com/api/books";

    let books = [];
    let toastTimer;

    function loadBooks() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            const parsed = saved ? JSON.parse(saved) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function saveBooks() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
            return true;
        } catch {
            showToast("Unable to save. Check your browser storage.");
            return false;
        }
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add("show");

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }

    function openForm(book = null) {
        form.reset();
        errorMessage.textContent = "";

        $("#book-id").value = book ? String(book.id) : "";
        $("#form-title").textContent = book ? "Edit book" : "Share a book";

        $("#title").value = book?.title || "";
        $("#author").value = book?.author || "";
        $("#category").value = book?.category || "Academic";
        $("#condition").value = book?.condition || "Like New";
        $("#description").value = book?.description || "";
        $("#offer").value = book?.offer || "Share";
        $("#image-url").value = book?.image || "";
        $("#contact").value = book?.contact || "";
        $("#owner").value = book?.owner || "";
        $("#status").value = book?.status || "Available";

        if (!dialog.open) {
            dialog.showModal();
        }
    }

    function closeForm() {
        dialog.close();
        errorMessage.textContent = "";
    }

    function getFilteredBooks() {
        const query = searchInput.value.trim().toLowerCase();
        const category = categoryFilter.value;
        const status = availabilityFilter.value;

        return books.filter(book => {
            const searchableText = [
                book.title,
                book.author,
                book.category,
                book.description,
                book.owner
            ].join(" ").toLowerCase();

            return searchableText.includes(query) &&
                (category === "All" || book.category === category) &&
                (status === "All" || book.status === status);
        });
    }

    function renderBooks() {
        const filteredBooks = getFilteredBooks();

        $("#total-books").textContent = books.length;

        $("#available-books").textContent =
            books.filter(book => book.status === "Available").length;

        $("#shared-books").textContent =
            books.filter(book =>
                ["Taken", "Exchanged"].includes(book.status)
            ).length;

        $("#empty-message").hidden = filteredBooks.length > 0;

        grid.innerHTML = filteredBooks.map(book => {
            const image = safeImageURL(book.image);

            return `
                <article class="book-card">
                    <div class="book-cover">
                        ${
                            image
                                ? `<img src="${escapeHTML(image)}"
                                        alt="${escapeHTML(book.title)}"
                                        loading="lazy">`
                                : `<div class="book-placeholder"
                                        aria-hidden="true">📚</div>`
                        }
                    </div>

                    <div class="book-info">
                        <span class="book-category">
                            ${escapeHTML(book.category)}
                        </span>

                        <h3>${escapeHTML(book.title)}</h3>

                        <p>By ${escapeHTML(book.author)}</p>

                        <p>Condition: ${escapeHTML(book.condition)}</p>

                        <p>Offer: ${escapeHTML(book.offer)}</p>

                        <p>${escapeHTML(book.description || "No description provided.")}</p>

                        <p class="book-status status-${book.status.toLowerCase()}">
                            ${escapeHTML(book.status)}
                        </p>

                        <p>Shared by ${escapeHTML(book.owner)}</p>

                        <div class="book-actions">
                            <button
                                type="button"
                                class="btn btn-outline"
                                data-action="contact"
                                data-id="${book.id}">
                                Contact owner
                            </button>

                            <button
                                type="button"
                                class="btn btn-outline"
                                data-action="edit"
                                data-id="${book.id}">
                                Edit
                            </button>

                            <button
                                type="button"
                                class="btn btn-outline"
                                data-action="delete"
                                data-id="${book.id}">
                                Delete
                            </button>

                            ${
                                book.status === "Available"
                                    ? `<button
                                            type="button"
                                            class="btn btn-primary"
                                            data-action="take"
                                            data-id="${book.id}">
                                            Mark as taken
                                       </button>`
                                    : ""
                            }
                        </div>
                    </div>
                </article>
            `;
        }).join("");
    }

    function safeImageURL(value) {
        if (!value) return "";

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

    function handleSave(event) {
        event.preventDefault();
        errorMessage.textContent = "";

        const book = {
            id: $("#book-id").value
                ? Number($("#book-id").value)
                : Date.now(),

            title: $("#title").value.trim(),
            author: $("#author").value.trim(),
            category: $("#category").value,
            condition: $("#condition").value,
            description: $("#description").value.trim(),
            offer: $("#offer").value,
            image: $("#image-url").value.trim(),
            contact: $("#contact").value.trim(),
            owner: $("#owner").value.trim(),
            status: $("#status").value
        };

        if (
            !book.title ||
            !book.author ||
            !book.category ||
            !book.contact ||
            !book.owner
        ) {
            errorMessage.textContent =
                "Please fill in all required fields.";
            return;
        }

        if (book.image && !safeImageURL(book.image)) {
            errorMessage.textContent =
                "Please enter a valid HTTP or HTTPS image URL.";
            return;
        }

        const editing = Boolean($("#book-id").value);
        const previousBooks = [...books];

        if (editing) {
            const index = books.findIndex(item => item.id === book.id);

            if (index === -1) {
                errorMessage.textContent =
                    "This book could not be found.";
                return;
            }

            books[index] = book;
        } else {
            books.unshift(book);
        }

        if (!saveBooks()) {
            books = previousBooks;
            return;
        }

        closeForm();
        renderBooks();

        showToast(
            editing
                ? "Book details updated successfully!"
                : "Your book has been shared successfully!"
        );

        if (!editing) {
            $("#books").scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }

    $("#open-form").addEventListener("click", () => openForm());
    $("#hero-share").addEventListener("click", () => openForm());
    $("#close-form").addEventListener("click", closeForm);
    $("#cancel-form").addEventListener("click", closeForm);

    form.addEventListener("submit", handleSave);

    dialog.addEventListener("click", event => {
        if (event.target === dialog) {
            closeForm();
        }
    });

    searchInput.addEventListener("input", renderBooks);
    categoryFilter.addEventListener("change", renderBooks);
    availabilityFilter.addEventListener("change", renderBooks);

    grid.addEventListener("click", event => {
        const button = event.target.closest("[data-action]");

        if (!button) return;

        const id = Number(button.dataset.id);
        const action = button.dataset.action;
        const book = books.find(item => item.id === id);

        if (!book) {
            showToast("Book not found.");
            return;
        }

        if (action === "edit") {
            openForm(book);
        }

        if (action === "delete") {
            if (!confirm(`Delete "${book.title}" from BookCycle?`)) {
                return;
            }

            const previousBooks = [...books];
            books = books.filter(item => item.id !== id);

            if (!saveBooks()) {
                books = previousBooks;
                return;
            }

            renderBooks();
            showToast("Book listing deleted.");
        }

        if (action === "take") {
            const previousStatus = book.status;
            book.status = "Taken";

            if (!saveBooks()) {
                book.status = previousStatus;
                return;
            }

            renderBooks();
            showToast("Book marked as taken.");
        }

        if (action === "contact") {
            const contact = book.contact.trim();

            if (!contact) {
                showToast("No contact details available.");
                return;
            }

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (emailPattern.test(contact)) {
                location.href = `mailto:${contact}`;
            } else {
                if (confirm(`Contact ${book.owner} using: ${contact}\n\nCopy these details?`)) {
                    const temporaryInput = document.createElement("textarea");
                    temporaryInput.value = contact;
                    document.body.appendChild(temporaryInput);
                    temporaryInput.select();

                    try {
                        document.execCommand("copy");
                        showToast("Contact details copied.");
                    } catch {
                        showToast(`Contact details: ${contact}`);
                    }

                    temporaryInput.remove();
                }
            }
        }
    });

    renderBooks();
});
