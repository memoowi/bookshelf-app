const bookshelf = {
  books: [],
  findBookIndex: function (id) {
    for (const index in this.books) {
      if (this.books[index].id == id) {
        return index;
      }
    }

    return -1;
  },
  addBook: function (book) {
    this.books.push(book);
    this.saveToLocalStorage();
  },
  editBook: function (id) {
    const index = this.findBookIndex(id);

    if (index !== -1) {
      const book = this.books[index];
      return book;
    } else {
      throw new Error("Book not found");
    }
  },
  resetForm: function () {
    document.getElementById("inputBook").reset();
    document.getElementById("bookSubmit").setAttribute("data-id", "");
    document.getElementById("bookSubmit").innerHTML =
      "Insert New book to <span>Unfinished</span> shelf";
  },
  updateBook: function (id, updatedBook) {
    const index = this.findBookIndex(id);

    if (index !== -1) {
      this.books[index] = updatedBook;
      this.saveToLocalStorage();
    } else {
      throw new Error("Book not found");
    }
  },
  moveBook: function (id) {
    const index = this.findBookIndex(id);

    if (index !== -1) {
      this.books[index].isComplete = !this.books[index].isComplete;
      this.saveToLocalStorage();
    } else {
      throw new Error("Book not found");
    }
  },
  deleteBook: function (id) {
    const index = this.findBookIndex(id);

    if (index !== -1) {
      this.books.splice(index, 1);
      this.saveToLocalStorage();
    } else {
      throw new Error("Book not found");
    }
  },
  saveToLocalStorage: function () {
    localStorage.setItem("bookshelf", JSON.stringify(this.books));
  },
  loadFromLocalStorage: function () {
    const books = localStorage.getItem("bookshelf");
    if (books) {
      this.books = JSON.parse(books);
    }
  },
};

async function fetchSvgIcon(url) {
  const response = await fetch(url);
  const svgText = await response.text();
  return svgText;
}

async function renderBooks(books) {
  const incompleteBookshelfList = document.getElementById(
    "incompleteBookshelfList"
  );
  const completeBookshelfList = document.getElementById(
    "completeBookshelfList"
  );

  incompleteBookshelfList.innerHTML = "";
  completeBookshelfList.innerHTML = "";

  const trashIconText = await fetchSvgIcon("assets/icons8-trash.svg");
  const doneIconText = await fetchSvgIcon("assets/icons8-done.svg");
  const cancelIconText = await fetchSvgIcon("assets/icons8-cancel.svg");

  (books || bookshelf.books).forEach((book) => {
    const bookElement = document.createElement("article");
    bookElement.classList.add("book_item");
    bookElement.innerHTML = `
          <h3>${book.title}</h3>
          <p>Author: ${book.author}</p>
          <p>Year: ${book.year}</p>
          <div class="action">
            <button class="move" onclick="moveBook('${book.id}')" title="Move"></button>
            <button class="edit" onclick="editBook('${book.id}')" title="Edit">Edit</button>
            <button class="delete" onclick="deleteBook('${book.id}')" title="Delete">${trashIconText}</button>
          </div>
        `;

    if (book.isComplete) {
      bookElement.querySelector(".move").innerHTML = cancelIconText;
      completeBookshelfList.appendChild(bookElement);
    } else {
      bookElement.querySelector(".move").innerHTML = doneIconText;
      incompleteBookshelfList.appendChild(bookElement);
    }
  });
}

function addBook(event) {
  event.preventDefault();

  const id = +new Date();
  const title = document.getElementById("inputBookTitle").value;
  const author = document.getElementById("inputBookAuthor").value;
  const year = parseInt(document.getElementById("inputBookYear").value);
  const isComplete = document.getElementById("inputBookIsComplete").checked;

  const book = { id, title, author, year, isComplete };
  bookshelf.addBook(book);

  document.getElementById("inputBook").reset();
  document.getElementById("searchBook").reset();
  renderBooks();
}

function editBook(id) {
  const book = bookshelf.editBook(id);

  document.getElementById("inputBookTitle").value = book.title;
  document.getElementById("inputBookAuthor").value = book.author;
  document.getElementById("inputBookYear").value = book.year;

  if (book.isComplete) {
    document.getElementById("inputBookIsComplete").checked = true;
  } else {
    document.getElementById("inputBookIsComplete").checked = false;
  }

  const bookSubmitElement = document.getElementById("bookSubmit");
  bookSubmitElement.setAttribute("data-id", id);
  bookSubmitElement.setAttribute("onclick", "updateBook(event)");
  bookSubmitElement.innerHTML = "Update book";

  const resetButtonElement = document.createElement("button");
  resetButtonElement.setAttribute("id", "resetButton");
  resetButtonElement.setAttribute("type", "button");
  resetButtonElement.setAttribute("onclick", "resetForm(event)");
  resetButtonElement.innerHTML = "Reset";

  bookSubmitElement.insertAdjacentElement("afterend", resetButtonElement);

  document.getElementById("inputBookTitle").focus();
}

function resetForm(event) {
  event.preventDefault();

  bookshelf.resetForm();
  const resetButtonElement = document.getElementById("resetButton");
  resetButtonElement.remove();
}

function updateBook(event) {
  event.preventDefault();

  const id = event.target.dataset.id;
  const title = document.getElementById("inputBookTitle").value;
  const author = document.getElementById("inputBookAuthor").value;
  const year = parseInt(document.getElementById("inputBookYear").value);
  const isComplete = document.getElementById("inputBookIsComplete").checked;

  const book = {  id, title, author, year, isComplete };
  bookshelf.updateBook( id, book);

  document.getElementById("searchBook").reset();
  resetForm(event);

  renderBooks();
}

function moveBook(id, event) {
  bookshelf.moveBook(id);

  const isSearched = document.getElementById("searchBookTitle").value;

  if (isSearched !== "") {
    searchBook(event);
  } else {
    renderBooks();
  }
}

function deleteBook(id, event) {
  if (
    !confirm(
      "Are you sure you want to delete this book?\nThis action cannot be undone.\nBook Title: " +
        bookshelf.books[bookshelf.findBookIndex(id)].title
    )
  ) {
    return;
  } else {
    bookshelf.deleteBook(id);

    const isSearched = document.getElementById("searchBookTitle").value;

    if (isSearched !== "") {
      searchBook(event);
    } else {
      renderBooks();
    }
  }
}

function searchBook(event) {
  event.preventDefault();

  const keyword = document.getElementById("searchBookTitle").value;

  const filteredBooks = bookshelf.books.filter((book) => {
    return (
      book.title.toLowerCase().includes(keyword.toLowerCase()) ||
      book.author.toLowerCase().includes(keyword.toLowerCase())
    );
  });

  renderBooks(filteredBooks);
}

bookshelf.loadFromLocalStorage();
document
  .getElementById("inputBookIsComplete")
  .addEventListener("change", function () {
    const spanElement = document.getElementById("bookSubmit").getElementsByTagName("span")[0];
    if (this.checked) {
      if (spanElement) {
        spanElement.textContent = "Finished";
      }
    } else {
      if (spanElement) {
        span.textContent = "Unfinished";
      }
    }
  });

document.getElementById("inputBook").addEventListener("submit", addBook);
document.getElementById("searchBook").addEventListener("submit", searchBook);
renderBooks();
