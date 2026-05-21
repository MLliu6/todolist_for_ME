/**
 * tasks.js — Task CRUD, tag management, list rendering
 * Exposes: window.TasksModule
 */

(function () {
  'use strict';

  /* -------------------------------------------------------
     CONSTANTS
  ------------------------------------------------------- */
  const DEFAULT_TAGS = ['工作', '学习', '生活', '健康', '财务', '社交', '创作'];

  /* -------------------------------------------------------
     STATE (in-memory, synced to DataStore)
  ------------------------------------------------------- */
  let tasks    = [];
  let allTags  = [...DEFAULT_TAGS];
  let selectedTags = [];       // tags selected in the current form
  let currentFilter = 'all';   // 'all' | 'todo' | 'doing' | 'done'

  /* -------------------------------------------------------
     LOAD & SAVE
  ------------------------------------------------------- */
  function load() {
    const store = window.DataStore;
    if (!store) return;
    tasks   = store.getTasks();
    allTags = store.getTags();
  }

  function save() {
    const store = window.DataStore;
    if (!store) return;
    store.saveTasks(tasks);
    store.saveTags(allTags);
  }

  /* -------------------------------------------------------
     TASK CRUD
  ------------------------------------------------------- */
  function createTask(data) {
    const task = {
      id:       crypto.randomUUID(),
      name:     data.name.trim(),
      desc:     (data.desc || '').trim(),
      ddl:      data.ddl || null,
      status:   data.status || 'todo',
      quadrant: data.quadrant || 'q2',
      tags:     data.tags || [],
      createdAt: new Date().toISOString(),
    };
    tasks.unshift(task);
    save();
    return task;
  }

  function updateTask(id, data) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    tasks[idx] = { ...tasks[idx], ...data };
    save();
    return tasks[idx];
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    save();
  }

  function toggleStatus(id) {
    const t = tasks.find(t => t.id === id);
    if (!t) return;
    const cycle = { todo: 'doing', doing: 'done', done: 'todo' };
    t.status = cycle[t.status] || 'todo';
    save();
    return t;
  }

  function getTasksByDate(dateStr) {
    return tasks.filter(t => t.ddl === dateStr);
  }

  function getFilteredTasks() {
    if (currentFilter === 'all') return [...tasks];
    return tasks.filter(t => t.status === currentFilter);
  }

  /* -------------------------------------------------------
     LIST RENDERING
  ------------------------------------------------------- */
  function renderTaskList() {
    const container = document.getElementById('tasks-list');
    if (!container) return;

    const filtered = getFilteredTasks();

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon"><i data-lucide="inbox"></i></div>
          <h3>还没有任务</h3>
          <p>点击「新建任务」按钮开始添加你的第一条待办事项</p>
        </div>`;
    } else {
      container.innerHTML = `
        <div class="task-list-inner">
          ${filtered.map(t => window.App ? App.renderTaskCard(t) : '').join('')}
        </div>`;
    }

    if (window.lucide) lucide.createIcons({ nodes: [container] });
    attachListHandlers(container);
  }

  function attachListHandlers(container) {
    // Check button: cycle status
    container.querySelectorAll('.task-card__check').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        toggleStatus(id);
        renderTaskList();
        // Also refresh drawer if open on a day that contains this task
        syncDrawer();
      });
    });

    // Edit button
    container.querySelectorAll('.task-card__edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(btn.dataset.id);
      });
    });

    // Card click — also opens edit
    container.querySelectorAll('.task-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.task-card__check') || e.target.closest('.task-card__edit')) return;
        openEditModal(card.dataset.id);
      });
    });
  }

  function syncDrawer() {
    if (!window.App) return;
    const dateStr = App.getDrawerDate();
    if (dateStr) App.refreshDrawerIfOpen(dateStr, getTasksByDate(dateStr));
    // Also tell calendar to re-mark dots
    if (window.CalendarModule) CalendarModule.refreshDots(tasks);
  }

  /* -------------------------------------------------------
     FILTER BAR
  ------------------------------------------------------- */
  function initFilterBar() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTaskList();
      });
    });
  }

  /* -------------------------------------------------------
     FORM: POPULATE & RESET
  ------------------------------------------------------- */
  function populateForm(options = {}) {
    selectedTags = [];

    if (options.taskId) {
      // Edit mode
      const t = tasks.find(t => t.id === options.taskId);
      if (!t) return;
      document.getElementById('task-id').value     = t.id;
      document.getElementById('task-name').value   = t.name;
      document.getElementById('task-desc').value   = t.desc || '';
      document.getElementById('task-ddl').value    = t.ddl || '';
      document.getElementById('task-quadrant').value = t.quadrant || 'q2';
      selectedTags = [...(t.tags || [])];
      setStatusSelector(t.status || 'todo');
    } else {
      // Create mode
      document.getElementById('task-id').value  = '';
      document.getElementById('task-name').value = '';
      document.getElementById('task-desc').value = '';
      document.getElementById('task-ddl').value  = options.prefillDate || '';
      document.getElementById('task-quadrant').value = 'q2';
      setStatusSelector('todo');
    }

    renderTagSelector();

    // Tell quadrant picker to show current selection
    if (window.QuadrantModule) {
      const q = document.getElementById('task-quadrant').value;
      QuadrantModule.setSelected(q);
    }
  }

  function resetForm() {
    document.getElementById('task-form').reset();
    document.getElementById('task-id').value = '';
    document.getElementById('task-quadrant').value = 'q2';
    selectedTags = [];
    setStatusSelector('todo');
    renderTagSelector();
    if (window.QuadrantModule) QuadrantModule.setSelected('q2');
  }

  /* -------------------------------------------------------
     STATUS SELECTOR
  ------------------------------------------------------- */
  function setStatusSelector(status) {
    document.querySelectorAll('#status-selector .status-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.status === status);
    });
  }

  function getStatusSelected() {
    const active = document.querySelector('#status-selector .status-btn.active');
    return active ? active.dataset.status : 'todo';
  }

  function initStatusSelector() {
    document.querySelectorAll('#status-selector .status-btn').forEach(btn => {
      btn.addEventListener('click', () => setStatusSelector(btn.dataset.status));
    });
  }

  /* -------------------------------------------------------
     TAG SELECTOR
  ------------------------------------------------------- */
  function renderTagSelector() {
    const container = document.getElementById('tag-selector');
    if (!container) return;
    container.innerHTML = allTags.map(tag => {
      const active = selectedTags.includes(tag);
      return `<button type="button" class="tag${active ? ' selected' : ''}" data-tag="${App.escapeHTML(tag)}">${App.escapeHTML(tag)}</button>`;
    }).join('');

    container.querySelectorAll('.tag').forEach(btn => {
      btn.addEventListener('click', () => toggleTagSelection(btn.dataset.tag, btn));
    });
  }

  function toggleTagSelection(tag, btnEl) {
    if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter(t => t !== tag);
      btnEl.classList.remove('selected');
    } else {
      selectedTags.push(tag);
      btnEl.classList.add('selected');
    }
  }

  function initTagInput() {
    const input = document.getElementById('tag-new-input');
    if (!input) return;
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const val = input.value.trim();
      if (!val) return;
      if (!allTags.includes(val)) {
        allTags.push(val);
        save();
      }
      if (!selectedTags.includes(val)) selectedTags.push(val);
      input.value = '';
      renderTagSelector();
    });
  }

  /* -------------------------------------------------------
     FORM SUBMIT
  ------------------------------------------------------- */
  function handleFormSubmit() {
    const nameEl = document.getElementById('task-name');
    const name = nameEl.value.trim();
    if (!name) {
      nameEl.focus();
      nameEl.style.borderColor = 'var(--color-error)';
      setTimeout(() => nameEl.style.borderColor = '', 1200);
      return;
    }

    const id       = document.getElementById('task-id').value;
    const desc     = document.getElementById('task-desc').value;
    const ddl      = document.getElementById('task-ddl').value || null;
    const quadrant = document.getElementById('task-quadrant').value || 'q2';
    const status   = getStatusSelected();

    if (id) {
      updateTask(id, { name, desc, ddl, quadrant, status, tags: [...selectedTags] });
      window.App?.showToast('任务已更新 ✓', 'success');
    } else {
      createTask({ name, desc, ddl, quadrant, status, tags: [...selectedTags] });
      window.App?.showToast('任务已创建 ✓', 'success');
    }

    window.App?.closeTaskModal();
    renderTaskList();
    syncDrawer();
    if (window.CalendarModule) CalendarModule.refreshDots(tasks);
  }

  /* -------------------------------------------------------
     OPEN EDIT MODAL
  ------------------------------------------------------- */
  function openEditModal(id) {
    window.App?.openTaskModal({ taskId: id });
  }

  /* -------------------------------------------------------
     PUBLIC API & INIT
  ------------------------------------------------------- */
  function init() {
    load();
    renderTaskList();
    initFilterBar();
    initStatusSelector();
    initTagInput();
  }

  window.TasksModule = {
    init,
    populateForm,
    resetForm,
    handleFormSubmit,
    openEditModal,
    renderTaskList,
    getTasksByDate,
    getAllTasks: () => tasks,
    deleteTask: (id) => { deleteTask(id); renderTaskList(); syncDrawer(); },
  };

})();
