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
   * Builds groups from the current DOM order: each group starts with a
   * depth-0 task and contains all immediately following greater-depth tasks
   * (its subtasks). A leading orphan subtask (no preceding depth-0) becomes
   * its own group so the partition stays total.
   * @returns {HTMLElement[][]}
   */
  const buildGroups = () => {
    const all = Array.from(todoItems.querySelectorAll('.todo-item'));
    const groups = [];
    let cur = null;
    all.forEach(t => {
      if (getDepth(t) === 0 || cur === null) {
        cur = [t];
        groups.push(cur);
      } else {
        cur.push(t);
      }
    });
    return groups;
  };

  /**
   * Collects a task and its descendants — all immediately following items
   * with strictly greater depth than the starting task. Used both to drag a
   * parent + its subtasks as one and to skip past a target's group on drop.
   * @param {HTMLElement} task
   * @returns {HTMLElement[]}
   */
  const collectGroup = (task) => {
    const group = [task];
    const baseDepth = getDepth(task);
    let next = task.nextElementSibling;
    while (next && next.classList.contains('todo-item') && getDepth(next) > baseDepth) {
      group.push(next);
      next = next.nextElementSibling;
    }
    return group;
  };

  /**
   * Group-aware reorganize: groups whose parent (depth-0 task) is completed
   * sink to the bottom; within each group the children are also partitioned
   * with completed subtasks at the bottom of the parent's subtask list.
   * Stable inside each partition so manual ordering survives.
   */
  const reorganizeTasks = () => {
    const groups = buildGroups();
    groups.forEach(group => {
      if (group.length <= 1) return;
      const [parent, ...children] = group;
      const incomplete = [];
      const completed = [];
      children.forEach(c => {
        (c.querySelector('.task-checkbox').checked ? completed : incomplete).push(c);
      });
      group.length = 0;
      group.push(parent, ...incomplete, ...completed);
    });
    const incompleteGroups = [];
    const completedGroups = [];
    groups.forEach(g => {
      (g[0].querySelector('.task-checkbox').checked ? completedGroups : incompleteGroups).push(g);
    });
    [...incompleteGroups, ...completedGroups].flat().forEach(t => todoItems.appendChild(t));
  };

  /**
   * Subtask checkbox changes only persist — they don't move the row, so a
   * checked subtask stays in place inside its parent's group. Only a depth-0
   * (parent) toggle triggers the group-aware reorganize, which is when the
   * group migrates to the bottom and its children also re-partition. Checking
   * a parent also cascades the checked state down to all its subtasks.
   * @param {Event} e
   */
  const handleCheckboxChange = (e) => {
    const task = e.target.closest('.todo-item');
    if (task && getDepth(task) === 0 && e.target.checked) {
      collectGroup(task).slice(1).forEach(sub => {
        sub.querySelector('.task-checkbox').checked = true;
      });
    }
    saveTasks();
    if (task && getDepth(task) === 0) {
      setTimeout(reorganizeTasks, 150);
    }
  };

  /**
   * Creates a new task DOM element with checkbox, label, and delete button.
   * The label is a span (not a <label for>) so clicking the row no longer
   * toggles completion — only direct checkbox clicks do, and label clicks
   * enter inline edit mode.
   * @param {string} taskId - Unique identifier for the task
   * @param {string} [taskText='New Task'] - Display text for the task
   * @param {number} [depth=0] - Indent level for visual subtask grouping
   * @returns {HTMLElement} Complete task element ready for insertion
   */
  /** Notion-style 6-dot drag handle markup, kept in one place so the
   *  template-rendered tasks and the static sample tasks stay in sync. */
  const DRAG_HANDLE_HTML = `
    <span class="task-drag-handle" aria-label="Drag to reorder">
      <svg viewBox="0 0 8 14" fill="currentColor" aria-hidden="true">
        <circle cx="2" cy="2" r="1"/><circle cx="6" cy="2" r="1"/>
        <circle cx="2" cy="7" r="1"/><circle cx="6" cy="7" r="1"/>
        <circle cx="2" cy="12" r="1"/><circle cx="6" cy="12" r="1"/>
      </svg>
    </span>
  `;

  const createTaskElement = (taskId, taskText = 'New Task', depth = 0) => {
    const task = document.createElement('div');
    task.className = 'todo-item';
    task.innerHTML = `
      ${DRAG_HANDLE_HTML}
      <input type="checkbox" id="${taskId}" class="task-checkbox">
      <span class="task-label">${taskText}</span>
      <button class="delete-btn" aria-label="Delete task">×</button>
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

  /** Items currently being dragged (parent + its subtasks, or just one
   *  subtask). Populated on dragstart, cleared on dragend. */
  let draggedItems = [];

  /**
   * Wires the row's drag handle. The row only flips to draggable=true while
   * the handle is pressed, so clicking elsewhere on the row (label, checkbox)
   * still works normally and you can still text-select inside the label.
   * On dragstart we collect the row's group so a parent and its subtasks
   * travel together as one block.
   * @param {HTMLElement} task
   */
  const setupDragForTask = (task) => {
    const handle = task.querySelector('.task-drag-handle');
    if (!handle) return;

    const disableDrag = () => { task.draggable = false; };

    handle.addEventListener('mousedown', () => {
      task.draggable = true;
      // Clear draggable on the next mouseup/dragend wherever it lands, so
      // a click-without-drag (or any aborted drag) doesn't leave the row in
      // a state where dragging from the label would also work.
      const cleanup = () => {
        disableDrag();
        document.removeEventListener('mouseup', cleanup);
        document.removeEventListener('dragend', cleanup);
      };
      document.addEventListener('mouseup', cleanup);
      document.addEventListener('dragend', cleanup);
    });

    task.addEventListener('dragstart', (e) => {
      draggedItems = collectGroup(task);
      draggedItems.forEach(t => t.classList.add('dragging'));
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', ''); } catch (_) {}
      }
    });

    task.addEventListener('dragend', () => {
      draggedItems.forEach(t => t.classList.remove('dragging'));
      todoItems.querySelectorAll('.drop-above, .drop-below').forEach(el => {
        el.classList.remove('drop-above', 'drop-below');
      });
      disableDrag();
      if (draggedItems.length) saveTasks();
      draggedItems = [];
    });
  };

  /**
   * Container-level dragover/drop. Hint shows above/below the hovered row by
   * comparing the cursor against the row midline. On drop we insert the
   * dragged group either right before the target, or after the target's full
   * group so we don't land mid-subtask-run inside someone else's parent.
   */
  const setupContainerDragHandlers = () => {
    todoItems.addEventListener('dragover', (e) => {
      if (!draggedItems.length) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      const target = e.target.closest('.todo-item');
      todoItems.querySelectorAll('.drop-above, .drop-below').forEach(el => {
        el.classList.remove('drop-above', 'drop-below');
      });
      if (!target || draggedItems.includes(target)) return;
      const rect = target.getBoundingClientRect();
      const above = e.clientY < rect.top + rect.height / 2;
      target.classList.add(above ? 'drop-above' : 'drop-below');
    });

    todoItems.addEventListener('drop', (e) => {
      if (!draggedItems.length) return;
      e.preventDefault();
      const target = e.target.closest('.todo-item');
      // No row under cursor → user dropped in the slack area below the last
      // task; append at the end so dragging to the bottom always works.
      if (!target) {
        draggedItems.forEach(item => todoItems.appendChild(item));
        return;
      }
      if (draggedItems.includes(target)) return;
      const rect = target.getBoundingClientRect();
      const above = e.clientY < rect.top + rect.height / 2;

      if (above) {
        draggedItems.forEach(item => todoItems.insertBefore(item, target));
      } else {
        const targetGroup = collectGroup(target);
        const lastOfTargetGroup = targetGroup[targetGroup.length - 1];
        const after = lastOfTargetGroup.nextSibling;
        if (after) {
          draggedItems.forEach(item => todoItems.insertBefore(item, after));
        } else {
          draggedItems.forEach(item => todoItems.appendChild(item));
        }
      }
    });
  };

  /**
   * Shows a modal warning that deleting this task will also delete its
   * subtasks. Resolves true if the user confirms, false if they cancel.
   * Esc / overlay-click cancels; Enter confirms.
   * @param {number} subtaskCount
   * @returns {Promise<boolean>}
   */
  const confirmDeleteWithSubtasks = (subtaskCount) => new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'delete-confirm-overlay';
    overlay.style.cssText = `
      position: fixed; inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex; align-items: center; justify-content: center;
      z-index: 10000;
      font-family: 'Inter', sans-serif;
    `;

    const plural = subtaskCount === 1 ? 'subtask' : 'subtasks';
    overlay.innerHTML = `
      <div class="delete-confirm-dialog" style="
        background: rgba(30, 30, 30, 0.96);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        padding: 24px;
        max-width: 360px;
        color: white;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      ">
        <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Delete task?</div>
        <div style="font-size: 14px; opacity: 0.85; margin-bottom: 20px; line-height: 1.5;">
          This task has ${subtaskCount} ${plural}. Deleting it will also delete all ${plural}.
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button class="confirm-cancel" style="
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            border-radius: 6px;
            padding: 8px 16px;
            font-family: inherit;
            font-size: 14px;
            cursor: pointer;
          ">Cancel</button>
          <button class="confirm-delete" style="
            background: rgba(220, 60, 60, 0.85);
            border: 1px solid rgba(255, 100, 100, 0.4);
            color: white;
            border-radius: 6px;
            padding: 8px 16px;
            font-family: inherit;
            font-size: 14px;
            cursor: pointer;
          ">Delete all</button>
        </div>
      </div>
    `;

    const close = (result) => {
      document.removeEventListener('keydown', handleKey);
      overlay.remove();
      resolve(result);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') close(false);
      else if (e.key === 'Enter') close(true);
    };

    overlay.querySelector('.confirm-cancel').addEventListener('click', () => close(false));
    overlay.querySelector('.confirm-delete').addEventListener('click', () => close(true));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
    document.addEventListener('keydown', handleKey);

    document.body.appendChild(overlay);
    overlay.querySelector('.confirm-delete').focus();
  });

  /**
   * Adds event listeners to a task element.
   * Clicking the label enters edit mode; only direct checkbox clicks toggle
   * completion (the label is a <span>, not <label for>).
   * @param {HTMLElement} task - Task element to add listeners to
   */
  const addTaskEventListeners = (task) => {
    const elements = {
      checkbox: task.querySelector('.task-checkbox'),
      deleteBtn: task.querySelector('.delete-btn'),
      taskLabel: task.querySelector('.task-label')
    };

    elements.checkbox.addEventListener('change', handleCheckboxChange);
    elements.taskLabel.addEventListener('click', () => editTask(elements.taskLabel));
    elements.deleteBtn.addEventListener('click', async () => {
      const group = collectGroup(task);
      const subtaskCount = group.length - 1;
      if (subtaskCount > 0) {
        const confirmed = await confirmDeleteWithSubtasks(subtaskCount);
        if (!confirmed) return;
        group.forEach(t => t.remove());
      } else {
        task.remove();
      }
      saveTasks();
    });
    setupDragForTask(task);
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
    reorganizeTasks();
    return true;
  };

  /**
   * The static sample tasks in index.html are written without a drag-handle
   * span (so the markup stays trivially readable). On boot we inject one if
   * it's missing — same DOM shape as createTaskElement output.
   */
  const ensureDragHandles = () => {
    document.querySelectorAll('.todo-item').forEach(task => {
      if (!task.querySelector('.task-drag-handle')) {
        task.insertAdjacentHTML('afterbegin', DRAG_HANDLE_HTML);
      }
    });
  };

  return {
    /**
     * Initializes the task module
     */
    init() {
      ensureDragHandles();
      if (!loadSavedTasks()) {
        initializeExistingTasks();
      }
      setupContainerDragHandlers();
      addTaskBtn.addEventListener('click', addNewTask);
    }
  };
})();
