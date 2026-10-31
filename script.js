
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

    const API_URL = "https://bookcycle.onrender.com/api/books";

    let books = [];
    let toastTimer;

    async function loadBooks() {
        try {
            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error("Unable to load books.");
            }

            const data = await response.json();
            books = Array.isArray(data) ? data : [];
            renderBooks();
        } catch (error) {
            console.error(error);
            showToast("Unable to connect to BookCycle server.");
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

        $("#book-id").value = book ? book._id : "";
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
            const id = escapeHTML(book._id);
            const statusClass = ["Available", "Taken", "Exchanged"]
                .includes(book.status)
                ? book.status.toLowerCase()
                : "available";

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

                        <p>${escapeHTML(
                            book.description || "No description provided."
                        )}</p>

                        <p class="book-status status-${statusClass}">
                            ${escapeHTML(book.status)}
                        </p>

                        <p>Shared by ${escapeHTML(book.owner)}</p>

                        <div class="book-actions">
                            <button
                                type="button"
                                class="btn btn-outline"
                                data-action="contact"
                                data-id="${id}">
                                Contact owner
                            </button>

                            <button
                                type="button"
                                class="btn btn-outline"
                                data-action="edit"
                                data-id="${id}">
                                Edit
                            </button>

                            <button
                                type="button"
                                class="btn btn-outline"
                                data-action="delete"
                                data-id="${id}">
                                Delete
                            </button>

                            ${
                                book.status === "Available"
                                    ? `<button
                                            type="button"
                                            class="btn btn-primary"
                                            data-action="take"
                                            data-id="${id}">
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

            if (
                url.protocol === "https:" ||
                url.protocol === "http:"
            ) {
                return url.href;
            }
        } catch {
            return "";
        }

        return "";
    }

    async function handleSave(event) {
        event.preventDefault();
        errorMessage.textContent = "";

        const book = {
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

        const id = $("#book-id").value;
        const editing = Boolean(id);

        try {
            const response = await fetch(
                editing ? `${API_URL}/${id}` : API_URL,
                {
                    method: editing ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(book)
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Unable to save book."
                );
            }

            closeForm();
            await loadBooks();

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
        } catch (error) {
            errorMessage.textContent = error.message;
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

    grid.addEventListener("click", async event => {
        const button = event.target.closest("[data-action]");

        if (!button) return;

        const id = button.dataset.id;
        const action = button.dataset.action;
        const book = books.find(item => item._id === id);

        if (!book) {
            showToast("Book not found.");
            return;
        }

        if (action === "edit") {
            openForm(book);
            return;
        }

        if (action === "delete") {
            if (!confirm(`Delete "${book.title}" from BookCycle?`)) {
                return;
            }

            try {
                const response = await fetch(`${API_URL}/${id}`, {
                    method: "DELETE"
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || "Unable to delete book."
                    );
                }

                await loadBooks();
                showToast("Book listing deleted.");
            } catch (error) {
                showToast(error.message);
            }

            return;
        }

        if (action === "take") {
            try {
                const response = await fetch(`${API_URL}/${id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        status: "Taken"
                    })
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || "Unable to update availability."
                    );
                }

                await loadBooks();
                showToast("Book marked as taken.");
            } catch (error) {
                showToast(error.message);
            }

            return;
        }

        if (action === "contact") {
            const contact = (book.contact || "").trim();

            if (!contact) {
                showToast("No contact details available.");
                return;
            }

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (emailPattern.test(contact)) {
                location.href = `mailto:${contact}`;
            } else {
                if (
                    confirm(
                        `Contact ${book.owner} using: ${contact}\n\nCopy these details?`
                    )
                ) {
                    try {
                        await navigator.clipboard.writeText(contact);
                        showToast("Contact details copied.");
                    } catch {
                        showToast(`Contact details: ${contact}`);
                    }
                }
            }
        }
    });

    loadBooks();
});
