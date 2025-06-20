/**
 * Task Management Module
 * Handles todo list functionality including adding, editing, deleting, and organizing tasks
 * @module TaskModule
 */
const TaskModule = (function() {
  const todoItems = document.querySelector('.todo-items');
  const addTaskBtn = document.getElementById('add-task');
  let taskCounter = 2;

  /** CSS styles for inline task editing */
  const EDIT_INPUT_STYLE = `
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 4px;
    padding: 4px 8px;
    color: white;
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    width: 100%;
  `;

  /** CSS styles for new task input */
  const ADD_INPUT_STYLE = `
    background: rgba(40, 40, 40, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 8px;
    padding: 12px 16px;
    color: white;
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    width: 100%;
    margin-top: 8px;
    outline: none;
  `;

  /**
   * Moves all completed tasks to the bottom of the task list
   * Maintains visual separation between completed and incomplete tasks
   */
  const moveCompletedTasksToBottom = () => {
    const allTasks = Array.from(todoItems.querySelectorAll('.todo-item'));
    const { completedTasks, incompleteTasks } = allTasks.reduce((acc, task) => {
      const isCompleted = task.querySelector('.task-checkbox').checked;
      acc[isCompleted ? 'completedTasks' : 'incompleteTasks'].push(task);
      return acc;
    }, { completedTasks: [], incompleteTasks: [] });
    
    todoItems.innerHTML = '';
    [...incompleteTasks, ...completedTasks].forEach(task => todoItems.appendChild(task));
  };

  /**
   * Handles checkbox change with animation delay
   */
  const handleCheckboxChange = () => setTimeout(moveCompletedTasksToBottom, 150);

  /**
   * Closes all open dropdown menus
   */
  const closeAllDropdowns = () => {
    document.querySelectorAll('.task-dropdown').forEach(d => d.classList.remove('show'));
  };

  /**
   * Positions dropdown to avoid viewport overflow
   * @param {HTMLElement} dropdown - Dropdown element to position
   */
  const positionDropdown = (dropdown) => {
    const optionsBtn = dropdown.closest('.todo-item').querySelector('.task-options');
    if (!optionsBtn) return;
    
    const btnRect = optionsBtn.getBoundingClientRect();
    const dropdownHeight = 80;
    const dropdownWidth = 100;
    
    const spaceBelow = window.innerHeight - btnRect.bottom;
    const top = spaceBelow >= dropdownHeight 
      ? btnRect.bottom + 4 
      : btnRect.top - dropdownHeight - 4;
    
    const left = Math.max(8, Math.min(btnRect.right - dropdownWidth, window.innerWidth - dropdownWidth - 8));
    
    Object.assign(dropdown.style, {
      top: `${top}px`,
      left: `${left}px`
    });
  };

  /**
   * Toggles dropdown visibility, closes others first
   * @param {HTMLElement} dropdown - Dropdown to toggle
   */
  const toggleDropdown = (dropdown) => {
    closeAllDropdowns();
    if (!dropdown.classList.contains('show')) {
      dropdown.classList.add('show');
      positionDropdown(dropdown);
    }
  };

  /**
   * Creates a new task DOM element with checkbox, label, and options menu
   * @param {string} taskId - Unique identifier for the task
   * @param {string} [taskText='New Task'] - Display text for the task
   * @returns {HTMLElement} Complete task element ready for insertion
   */
  const createTaskElement = (taskId, taskText = 'New Task') => {
    const task = document.createElement('div');
    task.className = 'todo-item';
    task.innerHTML = `
      <input type="checkbox" id="${taskId}" class="task-checkbox">
      <label for="${taskId}" class="task-label">${taskText}</label>
      <div class="task-options-container">
        <button class="task-options">⋮</button>
        <div class="task-dropdown">
          <button class="edit-btn">Edit</button>
          <button class="delete-btn">Delete</button>
        </div>
      </div>
    `;
    return task;
  };

  /**
   * Adds a task to the list, positioning it above completed tasks
   * @param {HTMLElement} task - Task element to add to the list
   */
  const addTaskToList = (task) => {
    const firstCompletedTask = todoItems.querySelector('.todo-item .task-checkbox:checked')?.closest('.todo-item');
    firstCompletedTask ? todoItems.insertBefore(task, firstCompletedTask) : todoItems.appendChild(task);
  };

  /**
   * Enables inline editing of task label
   * @param {HTMLElement} taskLabel - Label element to edit
   */
  const editTask = (taskLabel) => {
    const input = document.createElement('input');
    Object.assign(input, {
      type: 'text',
      value: taskLabel.textContent,
      className: 'task-edit-input'
    });
    input.style.cssText = EDIT_INPUT_STYLE;
    
    taskLabel.style.display = 'none';
    taskLabel.parentNode.insertBefore(input, taskLabel.nextSibling);
    input.focus();
    input.select();
    
    const saveEdit = () => {
      const newText = input.value.trim();
      if (newText) taskLabel.textContent = newText;
      taskLabel.style.display = 'block';
      input.remove();
    };

    const cancelEdit = () => {
      taskLabel.style.display = 'block';
      input.remove();
    };
    
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveEdit();
      else if (e.key === 'Escape') cancelEdit();
    });
  };

  /**
   * Adds event listeners to a task element
   * @param {HTMLElement} task - Task element to add listeners to
   */
  const addTaskEventListeners = (task) => {
    // Cache all selectors at once for better performance
    const elements = {
      checkbox: task.querySelector('.task-checkbox'),
      optionsBtn: task.querySelector('.task-options'),
      dropdown: task.querySelector('.task-dropdown'),
      editBtn: task.querySelector('.edit-btn'),
      deleteBtn: task.querySelector('.delete-btn'),
      taskLabel: task.querySelector('.task-label')
    };
    
    elements.checkbox.addEventListener('change', handleCheckboxChange);
    elements.optionsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown(elements.dropdown);
    });
    elements.editBtn.addEventListener('click', () => {
      elements.dropdown.classList.remove('show');
      editTask(elements.taskLabel);
    });
    elements.deleteBtn.addEventListener('click', () => task.remove());
  };

  /**
   * Creates and shows input field for adding new task
   */
  const addNewTask = () => {
    if (document.querySelector('.add-task-input')) return;

    const input = document.createElement('input');
    Object.assign(input, {
      type: 'text',
      className: 'add-task-input',
      placeholder: 'Enter task name...'
    });
    input.style.cssText = ADD_INPUT_STYLE;

    document.querySelector('.todo-header').appendChild(input);
    input.focus();

    const saveTask = () => {
      const taskName = input.value.trim();
      if (taskName) {
        const newTask = createTaskElement(`task${++taskCounter}`, taskName);
        addTaskEventListeners(newTask);
        addTaskToList(newTask);
      }
      input.remove();
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveTask();
      else if (e.key === 'Escape') input.remove();
    });
    input.addEventListener('blur', () => input.remove());
  };

  /**
   * Initializes event listeners for existing tasks on page load
   */
  const initializeExistingTasks = () => {
    document.querySelectorAll('.todo-item').forEach(addTaskEventListeners);
  };

  return {
    /**
     * Initializes the task module
     */
    init() {
      initializeExistingTasks();
      addTaskBtn.addEventListener('click', addNewTask);
      document.addEventListener('click', closeAllDropdowns);
    }
  };
})();
