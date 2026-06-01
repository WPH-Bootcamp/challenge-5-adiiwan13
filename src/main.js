// =========================================================================
// 1. MEMODELKAN DATA DENGAN CLASS
// =========================================================================
// Tanggung jawab Class Todo:
// Mempresentasikan SATU buah tugas (Task)
class Todo {
  constructor(text, completed = false) {
    this.id = crypto.randomUUID();
    this.text = text;
    this.completed = completed;
  }
}

// Tanggung jawab Class TodoList:
// Mengelola SEKUMPULAN tugas (Business Logic)
class TodoList {
  constructor() {
    this.todos = []; // Menyimpan instance dari class Todo
    this.loadFromStorage();
  }

  addTodo(text) {
    const newTodo = new Todo(text);
    this.todos.push(newTodo);
    this.saveToStorage();
    return newTodo;
  }

  toggleTodo(id) {
    const todo = this.todos.find((item) => item.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      this.saveToStorage();
    }
  }

  deleteTodo(id) {
    this.todos = this.todos.filter((item) => item.id !== id);
    this.saveToStorage();
  }

  saveToStorage() {
    localStorage.setItem('todos', JSON.stringify(this.todos));
  }

  loadFromStorage() {
    const savedTodos = localStorage.getItem('todos');

    if (savedTodos) {
      this.todos = JSON.parse(savedTodos);
    }
  }

  // Mengisi data awal dari API external
  populateFromAPI(apiData) {
    // Mengambil 5 data pertama saja sebagai contoh data awal
    this.todos = apiData
      .slice(0, 5)
      .map((item) => new Todo(item.title, item.completed));

    this.saveToStorage();
  }
}

// Inisialisasi object utama penyimpanan data global
const myTodoList = new TodoList();

// =========================================================================
// 2. MENANGKAP ELEMEN DOM
// =========================================================================

const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const todoList = document.getElementById('todoList');
const submitButton = todoForm.querySelector('button[type="submit"]');

// Elemen feedback dinamis
const feedbackMessage = document.createElement('div');
feedbackMessage.className = 'mt-2 text-sm hidden';
todoForm.parentNode.insertBefore(feedbackMessage, todoForm.nextSibling);

// =========================================================================
// 3. ASYNC & DATA HANDLING (FETCH API)
// =========================================================================
// Fungsi Async untuk mengambil data dari Public API
async function fetchInitialTodos() {
  //Jika sudah ada data LocalStorage, langsung render
  if (myTodoList.todos.length > 0) {
    renderTodos();
    return;
  }

  // A. Loading state dan anti-race condition
  showFeedback(
    'Sedang menyelaraskan data dengan server...',
    'text-blue-500 animate-pulse'
  );
  submitButton.disabled = true; // Kunci tombol agar user tidak double-submit
  todoList.innerHTML =
    '<li class="text-gray-400 italic p-3 text-center">Sinkronisasi data...</li>';

  try {
    // Memanggil Public API (JSONPlaceholder)
    const response = await fetch('https://jsonplaceholder.typicode.com/todos');

    // Validasi apakah respon network-nya sukses
    if (!response.ok) {
      throw new Error(`Koneksi gagal (Status: ${response.status})`);
    }

    const data = await response.json();

    // B. Memasukkan Data hasil fetch ke dalam class TodoList
    myTodoList.populateFromAPI(data);
    hideFeedback();
  } catch (error) {
    // C. Error Handling (User diberi tahu alternatif solusi)
    console.error('Log teknis untuk developer:', error);

    showFeedback(
      'Server sedang offline. Tapi tenang, kamu tetap bisa menggunakan aplikasi secara lokal!',
      'text-amber-600 bg-amber-50 p-2 rounded border border-amber-200'
    );
  } finally {
    // Mengembalikan status tombol dan menggambar UI
    submitButton.disabled = false;
    renderTodos();
  }
}

// =========================================================================
// 4. DOM MANIPULATION & RENDER
// =========================================================================

function renderTodos() {
  todoList.innerHTML = '';

  // Edge case : List kosong
  if (myTodoList.todos.length === 0) {
    todoList.innerHTML = `
    <li class="text-center text-gray-400 italic p-4 bg-gray-50 rounded border border-dashed border-gray-200">
          Belum ada tugas hari ini. Yuk, produktif dan tambah baru!
      </li>`;
    return;
  }

  // Menggambar ulang list berdasarkan state data terbaru di Class TodoList
  myTodoList.todos.forEach((todo) => {
    const li = document.createElement('li');

    li.className =
      'flex justify-between items-center bg-gray-100 p-3 rounded mb-2 shadow-sm transition';

    // Span tugas
    const span = document.createElement('span');
    span.className = `flex-1 cursor-pointer select-none ${
      todo.completed ? 'line-through text-gray-400' : 'text-gray-800'
    }`;

    span.textContent = todo.text;

    // Toggle status
    span.addEventListener('click', () => {
      myTodoList.toggleTodo(todo.id);
      renderTodos();
    });

    // Tombol hapus
    const button = document.createElement('button');

    button.className =
      'bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition ml-2';

    button.textContent = 'Hapus';

    button.addEventListener('click', () => {
      myTodoList.deleteTodo(todo.id);
      renderTodos();
    });

    li.appendChild(span);
    li.appendChild(button);

    todoList.appendChild(li);
  });
}

// =========================================================================
// 5. VALIDASI & INTERAKSI USER
// =========================================================================

// Event Listener saat tambah tugas
todoForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const todoText = todoInput.value.trim(); // .trim() menghapus spasi kosong di depan/belakang

  // Edge Case: Validasi jika kosong
  if (todoText === '') {
    showFeedback('Tugas tidak boleh kosong.', 'text-red-500 font-medium');
    return;
  }

  // Validasi panjang maksimal
  if (todoText.length > 50) {
    showFeedback('Tugas maksimal 50 karakter.', 'text-red-500 font-medium');
    return;
  }

  myTodoList.addTodo(todoText);

  todoInput.value = '';
  hideFeedback();

  renderTodos();
});

// =========================================================================
// 6. HELPER FUNCTIONS
// =========================================================================
function showFeedback(text, colorClass) {
  feedbackMessage.textContent = text;
  feedbackMessage.className = `mt-2 text-sm ${colorClass}`;
}

function hideFeedback() {
  feedbackMessage.className = 'mt-2 text-sm hidden';
}

// =========================================================================
// 7. START APP
// =========================================================================

fetchInitialTodos();
