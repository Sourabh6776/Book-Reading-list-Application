"use strict";

/* ==========================================
   ReadSpace - Book Reading List Application
   ========================================== */

const STORAGE_KEY = "readspace-books-v1";

const elements = {
    totalBooks: document.getElementById("total-books"),
    readingBooks: document.getElementById("reading-books"),
    completedBooks: document.getElementById("completed-books"),
    readingPercentage: document.getElementById("reading-percentage"),

    openAddForm: document.getElementById("open-add-form"),
    closeAddForm: document.getElementById("close-add-form"),
    addBookPanel: document.getElementById("add-book-panel"),
    bookForm: document.getElementById("book-form"),

    bookTitle: document.getElementById("book-title"),
    bookAuthor: document.getElementById("book-author"),
    bookGenre: document.getElementById("book-genre"),
    bookStatus: document.getElementById("book-status"),

    cancelAdd: document.getElementById("cancel-add"),
    bookSearch: document.getElementById("book-search"),
    statusFilter: document.getElementById("status-filter"),

    libraryCount: document.getElementById("library-count"),
    bookList: document.getElementById("book-list"),
    emptyState: document.getElementById("empty-state"),
    emptyAddButton: document.getElementById("empty-add-button"),

    currentYear: document.getElementById("current-year"),
    toast: document.getElementById("toast")
};

const STATUS_LABELS = {
    "to-read": "Want to Read",
    "reading": "Currently Reading",
    "completed": "Completed"
};

const COVER_CLASSES = [
    "cover-1",
    "cover-2",
    "cover-3",
    "cover-4",
    "cover-5",
    "cover-6"
];

let books = [];
let toastTimer = null;

/* ==========================================
   CHECK HTML CONNECTIONS
   ========================================== */

function checkRequiredElements() {
    for (const [name, element] of Object.entries(elements)) {
        if (!element) {
            console.error(
                `ReadSpace error: HTML element "${name}" was not found.`
            );
            return false;
        }
    }

    return true;
}

/* ==========================================
   LOAD AND SAVE BOOKS
   ========================================== */

function loadBooks() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (!savedData) {
            return [];
        }

        const parsedData = JSON.parse(savedData);

        if (!Array.isArray(parsedData)) {
            return [];
        }

        return parsedData.filter((book) => {
            return (
                book &&
                typeof book.id === "string" &&
                typeof book.title === "string" &&
                typeof book.author === "string" &&
                typeof book.genre === "string" &&
                Object.prototype.hasOwnProperty.call(
                    STATUS_LABELS,
                    book.status
                )
            );
        });
    } catch (error) {
        console.error("Error loading books:", error);
        showToast("Could not load saved books.", "error");
        return [];
    }
}

function saveBooks() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(books)
        );

        return true;
    } catch (error) {
        console.error("Error saving books:", error);
        showToast("Could not save changes in this browser.", "error");
        return false;
    }
}

/* ==========================================
   NOTIFICATIONS
   ========================================== */

function showToast(message, type = "success") {
    if (!elements.toast) {
        console.log(message);
        return;
    }

    clearTimeout(toastTimer);

    elements.toast.textContent = message;
    elements.toast.classList.remove("show", "error");

    if (type === "error") {
        elements.toast.classList.add("error");
    }

    elements.toast.classList.add("show");

    toastTimer = setTimeout(() => {
        elements.toast.classList.remove("show", "error");
    }, 3000);
}

/* ==========================================
   OPEN AND CLOSE THE FORM
   ========================================== */

function openAddForm() {
    /*
       IMPORTANT:
       The HTML panel has the CSS class "hidden".
       Removing that class makes the form visible.
    */

    elements.addBookPanel.classList.remove("hidden");
    elements.addBookPanel.hidden = false;

    elements.addBookPanel.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });

    elements.bookTitle.focus();
}

function closeAddForm() {
    elements.addBookPanel.classList.add("hidden");
    elements.addBookPanel.hidden = true;
}

function resetBookForm() {
    elements.bookForm.reset();
    elements.bookStatus.value = "to-read";
}

/* ==========================================
   CREATE UNIQUE BOOK ID
   ========================================== */

function createBookId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/* ==========================================
   ADD A NEW BOOK
   ========================================== */

function handleAddBook(event) {
    event.preventDefault();

    const title = elements.bookTitle.value.trim();
    const author = elements.bookAuthor.value.trim();
    const genre = elements.bookGenre.value;
    const status = elements.bookStatus.value;

    if (!title || !author || !genre) {
        showToast("Please enter all book details.", "error");
        return;
    }

    if (!Object.prototype.hasOwnProperty.call(STATUS_LABELS, status)) {
        showToast("Please select a valid reading status.", "error");
        return;
    }

    const newBook = {
        id: createBookId(),
        title: title,
        author: author,
        genre: genre,
        status: status,
        createdAt: new Date().toISOString()
    };

    books.unshift(newBook);

    if (!saveBooks()) {
        books.shift();
        return;
    }

    resetBookForm();
    closeAddForm();
    renderBooks();

    showToast("Book added successfully!");
}

/* ==========================================
   UPDATE READING STATISTICS
   ========================================== */

function updateStatistics() {
    const total = books.length;

    const currentlyReading = books.filter(
        (book) => book.status === "reading"
    ).length;

    const completed = books.filter(
        (book) => book.status === "completed"
    ).length;

    const completionRate = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    elements.totalBooks.textContent = total;
    elements.readingBooks.textContent = currentlyReading;
    elements.completedBooks.textContent = completed;
    elements.readingPercentage.textContent = `${completionRate}%`;
}

/* ==========================================
   SEARCH AND FILTER
   ========================================== */

function getFilteredBooks() {
    const searchTerm = elements.bookSearch.value
        .trim()
        .toLowerCase();

    const selectedStatus = elements.statusFilter.value;

    return books.filter((book) => {
        const matchesSearch =
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm);

        const matchesStatus =
            selectedStatus === "all" ||
            book.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });
}

/* ==========================================
   CREATE SAFE HTML ELEMENTS
   ========================================== */

function createElement(tagName, className = "", text = "") {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    element.textContent = text;

    return element;
}

/* ==========================================
   CREATE A BOOK CARD
   ========================================== */

function createBookCard(book, index) {
    const card = createElement("article", "book-card");

    const top = createElement("div", "book-card-top");

    const coverClass = COVER_CLASSES[index % COVER_CLASSES.length];

    const cover = createElement(
        "div",
        `book-cover ${coverClass}`
    );

    const coverTitle = createElement(
        "span",
        "book-cover-title",
        book.title
    );

    cover.appendChild(coverTitle);

    const genre = createElement(
        "span",
        "book-genre",
        book.genre
    );

    top.appendChild(cover);
    top.appendChild(genre);

    const title = createElement(
        "h3",
        "book-title",
        book.title
    );

    const author = createElement(
        "p",
        "book-author",
        `by ${book.author}`
    );

    const statusBadge = createElement(
        "span",
        `book-status ${book.status}`,
        STATUS_LABELS[book.status]
    );

    const actions = createElement(
        "div",
        "book-card-actions"
    );

    const statusLabel = createElement(
        "label",
        "",
        "Reading status"
    );

    const statusSelect = document.createElement("select");

    statusSelect.className = "book-status-select";
    statusSelect.setAttribute(
        "aria-label",
        `Reading status for ${book.title}`
    );

    const options = [
        ["to-read", "Want to Read"],
        ["reading", "Currently Reading"],
        ["completed", "Completed"]
    ];

    options.forEach(([value, label]) => {
        const option = document.createElement("option");

        option.value = value;
        option.textContent = label;
        option.selected = book.status === value;

        statusSelect.appendChild(option);
    });

    statusLabel.appendChild(statusSelect);

    statusSelect.addEventListener("change", () => {
        updateBookStatus(book.id, statusSelect.value);
    });

    const deleteButton = createElement(
        "button",
        "delete-button",
        "Delete"
    );

    deleteButton.type = "button";

    deleteButton.setAttribute(
        "aria-label",
        `Delete ${book.title}`
    );

    deleteButton.addEventListener("click", () => {
        deleteBook(book.id);
    });

    actions.appendChild(statusLabel);
    actions.appendChild(deleteButton);

    card.appendChild(top);
    card.appendChild(title);
    card.appendChild(author);
    card.appendChild(statusBadge);
    card.appendChild(actions);

    return card;
}

/* ==========================================
   DISPLAY BOOKS
   ========================================== */

function renderBooks() {
    const filteredBooks = getFilteredBooks();

    elements.bookList.replaceChildren();

    filteredBooks.forEach((book, index) => {
        const card = createBookCard(book, index);
        elements.bookList.appendChild(card);
    });

    const count = filteredBooks.length;

    elements.libraryCount.textContent =
        `Showing ${count} ${count === 1 ? "book" : "books"}`;

    const hasVisibleBooks = count > 0;

    elements.bookList.hidden = !hasVisibleBooks;
    elements.emptyState.hidden = hasVisibleBooks;

    const emptyHeading = elements.emptyState.querySelector("h3");
    const emptyMessage = elements.emptyState.querySelector("p");

    if (books.length === 0) {
        if (emptyHeading) {
            emptyHeading.textContent = "Your library is waiting.";
        }

        if (emptyMessage) {
            emptyMessage.textContent =
                "Every great reading journey starts with one book. Add your first book to get started.";
        }

        elements.emptyAddButton.hidden = false;
    } else if (!hasVisibleBooks) {
        if (emptyHeading) {
            emptyHeading.textContent = "No matching books";
        }

        if (emptyMessage) {
            emptyMessage.textContent =
                "Try another search term or choose a different status filter.";
        }

        elements.emptyAddButton.hidden = true;
    }

    updateStatistics();
}

/* ==========================================
   CHANGE A BOOK'S STATUS
   ========================================== */

function updateBookStatus(bookId, newStatus) {
    if (!Object.prototype.hasOwnProperty.call(STATUS_LABELS, newStatus)) {
        showToast("Invalid reading status.", "error");
        renderBooks();
        return;
    }

    const book = books.find((item) => item.id === bookId);

    if (!book) {
        return;
    }

    const previousStatus = book.status;

    book.status = newStatus;

    if (!saveBooks()) {
        book.status = previousStatus;
        renderBooks();
        return;
    }

    renderBooks();
    showToast("Reading status updated!");
}

/* ==========================================
   DELETE A BOOK
   ========================================== */

function deleteBook(bookId) {
    const index = books.findIndex(
        (book) => book.id === bookId
    );

    if (index === -1) {
        return;
    }

    const deletedBook = books[index];

    books.splice(index, 1);

    if (!saveBooks()) {
        books.splice(index, 0, deletedBook);
        renderBooks();
        return;
    }

    renderBooks();
    showToast("Book deleted successfully.");
}

/* ==========================================
   CONNECT ALL BUTTONS AND INPUTS
   ========================================== */

function connectEvents() {
    elements.openAddForm.addEventListener(
        "click",
        openAddForm
    );

    elements.closeAddForm.addEventListener(
        "click",
        closeAddForm
    );

    elements.cancelAdd.addEventListener(
        "click",
        closeAddForm
    );

    elements.emptyAddButton.addEventListener(
        "click",
        openAddForm
    );

    elements.bookForm.addEventListener(
        "submit",
        handleAddBook
    );

    elements.bookSearch.addEventListener(
        "input",
        renderBooks
    );

    elements.statusFilter.addEventListener(
        "change",
        renderBooks
    );
}

/* ==========================================
   START APPLICATION
   ========================================== */

function initializeApp() {
    if (!checkRequiredElements()) {
        alert(
            "ReadSpace could not connect to its HTML elements. Please check the browser console."
        );
        return;
    }

    elements.currentYear.textContent = new Date().getFullYear();

    elements.bookStatus.value = "to-read";

    books = loadBooks();

    connectEvents();
    renderBooks();

    console.log("ReadSpace initialized successfully.");
}

initializeApp();