const STORAGE_KEY = 'simple-todo.tasks';

const state = {
  tasks: [],
  filter: 'all',
};

const elements = {
  form: document.querySelector('#todo-form'),
  input: document.querySelector('#todo-input'),
  list: document.querySelector('#todo-list'),
  empty: document.querySelector('#empty-state'),
  counter: document.querySelector('#task-count'),
  filters: Array.from(document.querySelectorAll('[data-filter]')),
};

init();

function init() {
  state.tasks = loadTasks();
  bindEvents();
  updateFilterButtons();
  render();
  elements.input?.focus();
}

function bindEvents() {
  elements.form?.addEventListener('submit', handleSubmit);
  elements.list?.addEventListener('click', handleListClick);
  elements.list?.addEventListener('change', handleCheckboxChange);
  elements.filters.forEach((button) =>
    button.addEventListener('click', handleFilterClick),
  );
}

function handleSubmit(event) {
  event.preventDefault();
  if (!elements.input) return;

  const text = elements.input.value.trim();
  if (!text) {
    elements.input.focus();
    return;
  }

  addTask(text);
  elements.form.reset();
  elements.input.focus();
}

function handleCheckboxChange(event) {
  if (!event.target.matches('input[type="checkbox"]')) {
    return;
  }

  const listItem = event.target.closest('.todo-item');
  const taskId = listItem?.dataset.id;
  if (!taskId) return;

  toggleTask(taskId, event.target.checked);
}

function handleListClick(event) {
  const actionButton = event.target.closest('button[data-action]');
  if (!actionButton) return;

  const listItem = actionButton.closest('.todo-item');
  const taskId = listItem?.dataset.id;
  if (!taskId) return;

  if (actionButton.dataset.action === 'delete') {
    deleteTask(taskId);
  }

  if (actionButton.dataset.action === 'edit') {
    editTask(taskId);
  }
}

function handleFilterClick(event) {
  const { filter } = event.currentTarget.dataset;
  if (!filter || filter === state.filter) return;

  state.filter = filter;
  updateFilterButtons();
  render();
}

function addTask(text) {
  state.tasks.push({
    id: Date.now().toString(),
    text,
    completed: false,
  });
  saveTasks();
  render();
}

function toggleTask(id, completed) {
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;

  task.completed = completed;
  saveTasks();
  render();
}

function editTask(id) {
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;

  const updated = prompt('Edit task', task.text);
  if (updated === null) {
    return;
  }

  const trimmed = updated.trim();
  if (!trimmed) {
    return;
  }

  task.text = trimmed;
  saveTasks();
  render();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter((task) => task.id !== id);
  saveTasks();
  render();
}

function getVisibleTasks() {
  if (state.filter === 'active') {
    return state.tasks.filter((task) => !task.completed);
  }

  if (state.filter === 'completed') {
    return state.tasks.filter((task) => task.completed);
  }

  return state.tasks;
}

function render() {
  const visibleTasks = getVisibleTasks();
  renderList(visibleTasks);
  updateCounter();
  updateEmptyState(visibleTasks);
}

function renderList(tasks) {
  if (!elements.list) return;
  elements.list.innerHTML = '';

  tasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = 'todo-item';
    item.dataset.id = task.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;

    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;
    if (task.completed) {
      text.classList.add('is-complete');
    }

    const actions = document.createElement('div');
    actions.className = 'item-actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'btn';
    editButton.dataset.action = 'edit';
    editButton.textContent = 'Edit';

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'btn';
    deleteButton.dataset.action = 'delete';
    deleteButton.textContent = 'Delete';

    actions.append(editButton, deleteButton);
    item.append(checkbox, text, actions);
    elements.list.append(item);
  });
}

function updateCounter() {
  if (!elements.counter) return;

  const total = state.tasks.length;
  const remaining = state.tasks.filter((task) => !task.completed).length;

  if (total === 0) {
    elements.counter.textContent = 'No tasks yet.';
  } else if (remaining === 0) {
    elements.counter.textContent = 'All tasks are complete!';
  } else {
    elements.counter.textContent = `${remaining} of ${total} task${
      total === 1 ? '' : 's'
    } remaining.`;
  }
}

function updateEmptyState(visibleTasks) {
  if (!elements.empty) return;

  const hasTasks = state.tasks.length > 0;
  elements.empty.hidden = hasTasks && visibleTasks.length > 0;

  if (!hasTasks) {
    elements.empty.textContent = 'Start by adding your first task.';
  } else if (visibleTasks.length === 0) {
    if (state.filter === 'active') {
      elements.empty.textContent = 'All tasks are done. Great job!';
    } else if (state.filter === 'completed') {
      elements.empty.textContent = 'No tasks have been completed yet.';
    } else {
      elements.empty.textContent = 'No tasks to show right now.';
    }
  }
}

function updateFilterButtons() {
  elements.filters.forEach((button) => {
    const isActive = button.dataset.filter === state.filter;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function loadTasks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => ({
        id: String(item.id ?? ''),
        text: typeof item.text === 'string' ? item.text : '',
        completed: Boolean(item.completed),
      }))
      .filter((item) => item.id && item.text);
  } catch (error) {
    console.error('Could not read saved tasks:', error);
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
  } catch (error) {
    console.error('Could not save tasks:', error);
  }
}
