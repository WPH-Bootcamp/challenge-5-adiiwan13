// =========================================================================
// 1. MEMODELKAN DATA DENGAN CLASS
// =========================================================================
// Tanggung jawab Class Todo: Mengurus identitas SATU buah tugas (Task)
class Todo {
  constructor(text, completed = false) {
    // Unique ID dibuat menggabungkan timestamp + string acak agar tidak pernah kembar
    this.id = 'todo_' + Date.now() + Math.random().toString(36).substr(2, 4);
    this.text = text;
    this.completed = completed;
  }
}

// Tanggung jawab Class TodoList: Mengelola SEKUMPULAN data tugas (Business Logic)
class TodoList {
  constructor() {
    this.todos = []; // Menyimpan instance dari class Todo
  }

  addTodo(text) {
    const newTodo = new Todo(text);
    this.todos.push(newTodo);
    return newTodo;
  }

  toggleTodo(id) {
    const todo = this.todos.find((item) => item.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  }

  deleteTodo(id) {
    this.todos = this.todos.filter((item) => item.id !== id);
  }

  // Mengisi data awal yang bersumber dari API external
  populateFromAPI(apiData) {
    // Mengambil 5 data pertama saja sebagai contoh data awal
    this.todos = apiData
      .slice(0, 5)
      .map((item) => new Todo(item.title, item.completed));
  }
}

// Inisialisasi object utama penyimpanan data global
const myTodoList = new TodoList();

// =========================================================================
// 2. MENANGKAP ELEMEN DOM & ELEMENT TAMBAHAN
// =========================================================================

const todoForm = document.getElementById('todoForm');
const todoList = document.getElementById('todoList');
const submitButton = todoForm.querySelector('button[type="submit"]');

// Elemen feedback pesan dinamis (loading / error)
const feedbackMessage = document.createElement('div');
feedbackMessage.className = 'mt-2 text-sm hidden';
todoForm.parentNode.insertBefore(feedbackMessage, todoForm.nextSibling);

// =========================================================================
// 3. ASYNC & DATA HANDLING (FETCH API)
// =========================================================================
// Fungsi Async untuk mengambil data dari Public API
async function fetchInitialTodos() {
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

    // B. Memasukkan Data hasik fetch ke dalam class TodoList
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
const todoInput = document.getElementById('todoInput');

// Fungsi Render Utama (DOM Manipulation)
function renderTodos() {
  todoList.innerHTML = ''; // Mengosongkan list lama sebelum digambar ulang

  // CONDITION EDGE CASE: Jika list data kosong
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

    // Menyusun isi item (Menggunakan Unique ID, bukan index array lagi)
    li.innerHTML = `
      <span 
        class="flex-1 cursor-pointer select-none ${todo.completed ? 'line-through text-gray-400' : 'text-gray-800'}" 
        onclick="handleToggle('${todo.id}')"
      >
        ${escapeHTML(todo.text)}
      </span>
      <button 
        onclick="handleDelete('${todo.id}')" 
        class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition ml-2"
      >
        Hapus
      </button>
    `;

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

  // Edge Case: Validasi jika user hanya memasukkan spasi kosong
  if (todoText === '') {
    showFeedback(
      'Tuliskan sesuatu! Tugas tidak boleh kosong atau hanya berisi spasi.',
      'text-red-500 font-medium'
    );
    return;
  }

  // Masukkan ke data Class, reset input, bersihkan feedback, render ulang layar
  myTodoList.addTodo(todoText);
  todoInput.value = '';
  hideFeedback();
  renderTodos();
});

// INTERAKSI USER (Dibuat global agar bisa dibaca oleh atribut onclick pada string HTML)
window.handleToggle = function (id) {
  myTodoList.toggleTodo(id);
  renderTodos(); // Sinkronisasi ulang tampilan
};

window.handleDelete = function (id) {
  myTodoList.deleteTodo(id);
  renderTodos(); // Sinkronisasi ulang tampilan
};

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

// Proteksi Keamanan XSS (Mencegah user iseng memasukkan kode HTML/Script berbahaya)
function escapeHTML(str) {
  return str.replace(
    /[&<>'"]/g,
    (tag) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[
        tag
      ] || tag
  );
}

// Jalankan render awal kosong
renderTodos();
