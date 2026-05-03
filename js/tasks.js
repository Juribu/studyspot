/**
 * Task Management Module
 * Handles todo list functionality including adding, editing, deleting, and organizing tasks
 * @module TaskModule
 */
const TaskModule = (function() {
  const STORAGE_KEY = 'studyspot_tasks';
  const todoItems = document.querySelector('.todo-items');
  const addTaskBtn = document.getElementById('add-task');
  let taskCounter = 2;

  /** Maximum indent level for subtask visual grouping */
  const MAX_DEPTH = 3;
  /** Pixels of indent applied per depth level */
  const DEPTH_PX = 24;

  /**
   * Applies a depth level to a task element (visual indent + dataset).
   * @param {HTMLElement} task - .todo-item element
   * @param {number} depth - 0 = root, up to MAX_DEPTH
   */
  const setDepth = (task, depth) => {
    task.dataset.depth = String(depth);
    task.style.paddingLeft = depth > 0 ? `${depth * DEPTH_PX}px` : '';
  };

  /**
   * Reads a task's current depth, defaulting to 0.
   * @param {HTMLElement} task - .todo-item element
   * @returns {number}
   */
  const getDepth = (task) => parseInt(task.dataset.depth, 10) || 0;

  /**
   * Serializes current tasks from the DOM to a plain array
   * @returns {Array<{text: string, completed: boolean, depth: number}>}
   */
  const serializeTasks = () => {
    return Array.from(todoItems.querySelectorAll('.todo-item')).map(item => ({
      text: item.querySelector('.task-label').textContent,
      completed: item.querySelector('.task-checkbox').checked,
      depth: getDepth(item)
    }));
  };

  /**
   * Persists current task list to localStorage
   */
  const saveTasks = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeTasks()));
    } catch (e) {
      console.warn('Could not save tasks', e);
    }
  };

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
  const handleCheckboxChange = () => {
    saveTasks();
    setTimeout(moveCompletedTasksToBottom, 150);
  };

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
   * Creates a new task DOM element with checkbox, label, and options menu.
   * The label is a span (not a <label for>) so clicking the row no longer
   * toggles completion — only direct checkbox clicks do, and label clicks
   * enter inline edit mode.
   * @param {string} taskId - Unique identifier for the task
   * @param {string} [taskText='New Task'] - Display text for the task
   * @param {number} [depth=0] - Indent level for visual subtask grouping
   * @returns {HTMLElement} Complete task element ready for insertion
   */
  const createTaskElement = (taskId, taskText = 'New Task', depth = 0) => {
    const task = document.createElement('div');
    task.className = 'todo-item';
    task.innerHTML = `
      <input type="checkbox" id="${taskId}" class="task-checkbox">
      <span class="task-label">${taskText}</span>
      <div class="task-options-container">
        <button class="task-options">⋮</button>
        <div class="dropdown dropdown--small task-dropdown">
          <button class="delete-btn">Delete</button>
        </div>
      </div>
    `;
    setDepth(task, depth);
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
   * Enables inline editing of task label.
   * Tab/Shift+Tab while editing adjusts the task's indent depth in place.
   * @param {HTMLElement} taskLabel - Label element to edit
   */
  const editTask = (taskLabel) => {
    const task = taskLabel.closest('.todo-item');
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

    const handleBlur = () => saveEdit();

    const saveEdit = (chainNew = false) => {
      input.removeEventListener('blur', handleBlur);
      const newText = input.value.trim();
      if (newText) {
        taskLabel.textContent = newText;
        saveTasks();
      }
      taskLabel.style.display = '';
      input.remove();
      if (chainNew) addNewTask(task, getDepth(task));
    };

    const cancelEdit = () => {
      input.removeEventListener('blur', handleBlur);
      taskLabel.style.display = '';
      input.remove();
    };

    input.addEventListener('blur', handleBlur);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveEdit(true);
      else if (e.key === 'Escape') cancelEdit();
      else if (e.key === 'Tab') {
        e.preventDefault();
        const current = getDepth(task);
        const next = e.shiftKey
          ? Math.max(0, current - 1)
          : Math.min(MAX_DEPTH, current + 1);
        if (next !== current) {
          setDepth(task, next);
          saveTasks();
        }
      }
    });
  };

  /**
   * Adds event listeners to a task element.
   * Clicking the label enters edit mode; only direct checkbox clicks toggle
   * completion (the label is a <span>, not <label for>).
   * @param {HTMLElement} task - Task element to add listeners to
   */
  const addTaskEventListeners = (task) => {
    const elements = {
      checkbox: task.querySelector('.task-checkbox'),
      optionsBtn: task.querySelector('.task-options'),
      dropdown: task.querySelector('.task-dropdown'),
      deleteBtn: task.querySelector('.delete-btn'),
      taskLabel: task.querySelector('.task-label')
    };

    elements.checkbox.addEventListener('change', handleCheckboxChange);
    elements.taskLabel.addEventListener('click', () => editTask(elements.taskLabel));
    elements.optionsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown(elements.dropdown);
    });
    elements.deleteBtn.addEventListener('click', () => {
      task.remove();
      saveTasks();
    });
  };

  /**
   * Creates and shows input field for adding new task.
   * Tab/Shift+Tab adjusts a pending depth that's applied when the task is saved.
   * @param {HTMLElement} [insertAfter=null] - When set, the input is placed
   *   directly below this task (and the saved task lands at that position),
   *   so chained Enter creates siblings inline rather than at the top.
   * @param {number} [initialDepth=0] - Starting indent level for the input.
   */
  const addNewTask = (insertAfter = null, initialDepth = 0) => {
    if (document.querySelector('.add-task-input')) return;

    const input = document.createElement('input');
    Object.assign(input, {
      type: 'text',
      className: 'add-task-input',
      placeholder: 'Enter task name...'
    });
    input.style.cssText = ADD_INPUT_STYLE;
    input.dataset.depth = String(initialDepth);

    const reflectDepth = () => {
      const d = parseInt(input.dataset.depth, 10) || 0;
      input.style.marginLeft = d > 0 ? `${d * DEPTH_PX}px` : '';
    };

    if (insertAfter && insertAfter.parentNode) {
      insertAfter.parentNode.insertBefore(input, insertAfter.nextSibling);
    } else {
      document.querySelector('.todo-header').appendChild(input);
    }
    reflectDepth();
    input.focus();

    const handleBlur = () => discard();

    const discard = () => {
      input.removeEventListener('blur', handleBlur);
      input.remove();
    };

    const saveTask = (chainNew = false) => {
      input.removeEventListener('blur', handleBlur);
      let createdTask = null;
      const taskName = input.value.trim();
      if (taskName) {
        const depth = parseInt(input.dataset.depth, 10) || 0;
        createdTask = createTaskElement(`task${++taskCounter}`, taskName, depth);
        addTaskEventListeners(createdTask);
        if (insertAfter && insertAfter.parentNode) {
          input.parentNode.insertBefore(createdTask, input);
        } else {
          addTaskToList(createdTask);
        }
        saveTasks();
      }
      input.remove();
      if (chainNew && createdTask) {
        addNewTask(createdTask, getDepth(createdTask));
      }
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveTask(true);
      else if (e.key === 'Escape') discard();
      else if (e.key === 'Tab') {
        e.preventDefault();
        const current = parseInt(input.dataset.depth, 10) || 0;
        const next = e.shiftKey
          ? Math.max(0, current - 1)
          : Math.min(MAX_DEPTH, current + 1);
        input.dataset.depth = String(next);
        reflectDepth();
      }
    });
    input.addEventListener('blur', handleBlur);
  };

  /**
   * Initializes event listeners for existing tasks on page load
   */
  const initializeExistingTasks = () => {
    document.querySelectorAll('.todo-item').forEach(addTaskEventListeners);
  };

  /**
   * Replaces hardcoded sample tasks with persisted tasks, if any exist.
   * Returns true if saved tasks were loaded (so init can skip sample wiring).
   */
  const loadSavedTasks = () => {
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (e) {
      return false;
    }
    if (saved === null || !Array.isArray(saved)) return false;

    todoItems.innerHTML = '';
    saved.forEach(({ text, completed, depth = 0 }) => {
      const task = createTaskElement(`task${++taskCounter}`, text, depth);
      if (completed) task.querySelector('.task-checkbox').checked = true;
      addTaskEventListeners(task);
      todoItems.appendChild(task);
    });
    moveCompletedTasksToBottom();
    return true;
  };

  return {
    /**
     * Initializes the task module
     */
    init() {
      if (!loadSavedTasks()) {
        initializeExistingTasks();
      }
      addTaskBtn.addEventListener('click', addNewTask);
      document.addEventListener('click', closeAllDropdowns);
    }
  };
})();
