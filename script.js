
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

    const API_URL = "https://bookcycle-backend-9d12.onrender.com/api/books";

    let books = [];
    let toastTimer;

    async function apiRequest(url, options = {}) {
        const response = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options.headers
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Something went wrong.");
        }

        return data;
    }

    async function loadBooks() {
        try {
            const data = await apiRequest(API_URL);

            books = data.map(book => ({
                ...book,
                id: book._id,
                status: book.status === "Available" ? "Available" : "Taken"
            }));

            renderBooks();
        } catch (error) {
            showToast("Unable to load books: " + error.message);
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
        $("#contact-number").value = book?.contactNumber || "";
        $("#email").value = book?.email || "";
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

    function safeImageURL(value) {
        if (!value || typeof value !== "string") {
            return "";
        }

        try {
            const url = new URL(value.trim());

            if (
                (url.protocol === "https:" || url.protocol === "http:") &&
                url.hostname.includes(".")
            ) {
                return url.href;
            }
        } catch {
            return "";
        }

        return "";
    }

    function renderBooks() {
        const filteredBooks = getFilteredBooks();

        $("#total-books").textContent = books.length;

        $("#available-books").textContent =
            books.filter(book => book.status === "Available").length;

        $("#shared-books").textContent =
            books.filter(book => book.status === "Taken").length;

        $("#empty-message").hidden = filteredBooks.length > 0;

        grid.innerHTML = filteredBooks.map(book => {
            const image = safeImageURL(book.image);
            const available = book.status === "Available";

            return `
                <article class="book-card">
                    <div class="book-cover">
                        ${
                            image
                                ? `<img
                                        src="${escapeHTML(image)}"
                                        alt="${escapeHTML(book.title)}"
                                        loading="lazy"
                                        onerror="this.onerror=null; this.remove(); this.parentElement.innerHTML='<div class=&quot;book-placeholder&quot; aria-hidden=&quot;true&quot;>📚</div>';"
                                    >`
                                : `<div class="book-placeholder" aria-hidden="true">📚</div>`
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

                        <p class="book-status ${available ? "status-available" : "status-taken"}">
                            ${available ? "Available" : "Not Available"}
                        </p>

                    <p<div class="owner-contact">
    <a
        class="contact-button phone-button"
        href="tel:${escapeHTML(book.contactNumber)}">
        📞 Contact Number
    </a>

    <a
        class="contact-button email-button"
        href="https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(book.email || "")}"
        target="_blank"
        rel="noopener noreferrer">
        ✉️ Email Owner
    </a>
</div>
                        <div class="book-actions">
                            

                            <button
                                type="button"
                                class="btn btn-outline"
                                data-action="edit"
                                data-id="${escapeHTML(book.id)}">
                                Edit
                            </button>

                            ${
                                available
                                    ? `<button
                                            type="button"
                                            class="btn btn-primary"
                                            data-action="take"
                                            data-id="${escapeHTML(book.id)}">
                                            Mark as Taken
                                        </button>`
                                    : ""
                            }
                        </div>
                    </div>
                </article>
            `;
        }).join("");
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
            contactNumber: $("#contact-number").value.trim(),
            email: $("#email").value.trim(),
            owner: $("#owner").value.trim(),
            status: $("#status").value
        };

        if (
            !book.title ||
            !book.author ||
            !book.contactNumber ||
            !book.email ||
            !book.owner
        ) {
            errorMessage.textContent = "Please fill in all required fields.";
            return;
        }

        if (!/^\+?[0-9]{10,15}$/.test(book.contactNumber)) {
            errorMessage.textContent = "Enter a valid contact number with 10 to 15 digits.";
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(book.email)) {
            errorMessage.textContent = "Enter a valid email address.";
            return;
        }

        if (book.image && !safeImageURL(book.image)) {
            errorMessage.textContent = "Please enter a valid HTTP or HTTPS image URL.";
            return;
        }

        const id = $("#book-id").value;
        const editing = Boolean(id);

        try {
            if (editing) {
                await apiRequest(`${API_URL}/${encodeURIComponent(id)}`, {
                    method: "PUT",
                    body: JSON.stringify(book)
                });
            } else {
                book.status = "Available";

                await apiRequest(API_URL, {
                    method: "POST",
                    body: JSON.stringify(book)
                });
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

        const book = books.find(
            item => String(item.id) === String(id)
        );

        if (!book) {
            showToast("Book not found.");
            return;
        }

        if (action === "edit") {
            openForm(book);
            return;
        }

        if (action === "take") {
            if (book.status !== "Available") {
                showToast("This book is already marked as taken.");
                return;
            }

            button.disabled = true;

            try {
                await apiRequest(`${API_URL}/${encodeURIComponent(id)}`, {
                    method: "PUT",
                    body: JSON.stringify({
                        status: "Taken"
                    })
                });

                await loadBooks();
                showToast("Book marked as not available.");
            } catch (error) {
                button.disabled = false;
                showToast(error.message);
            }

            return;
        }

         

           
    });

    loadBooks();
});
