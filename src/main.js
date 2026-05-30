// Menangkap elemen HTML
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-List');

// Array untuk menampung data tugas
let todos = [];

// Fungsi untuk menampilkan tugas ke layar (render)
function renderTodos() {
  todoList.innerHTML = ''; //Mengosongkan list lama
  todos.forEach((todo, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${todo.text}</span>
      <button onclick="deleteTodo(${index})">Hapus</button>
    `;
    todoList.appendChild(li);
  });
}

// Fungsi Tambah Tugas
todoForm.addEventListener("submit", (e) => {
  e.preventDefault(); untuk mencegah halaman reload

const todoText = todoInput.value.trim();
    if (todoText !== '') {
        todos.push({ text: todoText, completed: false });
        todoInput.value = ''; // Kosongkan input
        renderTodos(); // Gambar ulang list
    }
});

// Fungsi Hapus Tugas (dibuat global agar bisa diakses onclick HTML)
window.deleteTodo = function(index) {
    todos.splice(index, 1); // Hapus 1 item berdasarkan index
    renderTodos(); // Gambar ulang list
};