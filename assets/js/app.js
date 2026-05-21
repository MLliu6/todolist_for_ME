/**
 * app.js — Main application controller
 * Responsibilities:
 *   - Tab switching with animated transitions
 *   - Drawer (day detail) open / close
 *   - Modal (task form, daysmatter form) open / close
 *   - Global keyboard shortcuts (Escape to close)
 *   - Toast notifications
 *   - Lucide icon initialisation
 */

/* =========================================================
   STATE
   ========================================================= */
const AppState = {
  activeTab: 'calendar',   // 'calendar' | 'tasks' | 'daysmatter'
  drawerOpen: false,
  activeModal: null,       // null | 'task' | 'daysmatter'
  drawerDate: null,        // ISO date string when drawer is for a specific day
};

/* =========================================================
   DOM REFS  (resolved after DOMContentLoaded)
   ========================================================= */
let DOM = {};

function resolveDOM() {
  DOM = {
    // Tabs
    tabBtns:         document.querySelectorAll('.tab-btn'),
    tabPanels:       document.querySelectorAll('.tab-panel'),

    // Backdrop
    backdrop:        document.getElementById('overlay-backdrop'),

    // Drawer — day detail
    drawerDay:       document.getElementById('drawer-day'),
    drawerDayTitle:  document.getElementById('drawer-day-title'),
    drawerDayBody:   document.getElementById('drawer-day-body'),
    drawerDayClose:  document.getElementById('drawer-day-close'),
    drawerDayAdd:    document.getElementById('drawer-day-add'),

    // Modal — task form
    modalTask:       document.getElementById('modal-task'),
    modalTaskTitle:  document.getElementById('modal-task-title'),
    modalTaskClose:  document.getElementById('modal-task-close'),
    modalTaskCancel: document.getElementById('modal-task-cancel'),
    taskForm:        document.getElementById('task-form'),

    // Modal — daysmatter form
    modalDM:         document.getElementById('modal-daysmatter'),
    modalDMClose:    document.getElementById('modal-dm-close'),
    modalDMCancel:   document.getElementById('modal-dm-cancel'),
    dmForm:          document.getElementById('daysmatter-form'),

    // Nav buttons
    btnNewTask:      document.getElementById('btn-new-task'),
    btnNewDM:        document.getElementById('btn-new-daysmatter'),
  };
}

/* =========================================================
   TAB SWITCHING
   ========================================================= */
function switchTab(tabName) {
  if (AppState.activeTab === tabName) return;
  AppState.activeTab = tabName;

  DOM.tabBtns.forEach(btn => {
    const isActive = btn.dataset.tab === tabName;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive);
  });

  DOM.tabPanels.forEach(panel => {
    const isActive = panel.id === `panel-${tabName}`;
    panel.classList.toggle('active', isActive);
    panel.setAttribute('aria-hidden', !isActive);
  });

  // Show / hide the global "new task" button based on tab
  DOM.btnNewTask.style.display = tabName === 'daysmatter' ? 'none' : '';
  if (DOM.btnNewDM) DOM.btnNewDM.closest('.daysmatter-header') && (DOM.btnNewDM.style.display = '');
}

function initTabs() {
  DOM.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

/* =========================================================
   BACKDROP
   ========================================================= */
function showBackdrop(zIndex = 100) {
  DOM.backdrop.style.zIndex = zIndex;
  DOM.backdrop.classList.add('visible');
  DOM.backdrop.setAttribute('aria-hidden', 'false');
}

function hideBackdrop() {
  DOM.backdrop.classList.remove('visible');
  DOM.backdrop.setAttribute('aria-hidden', 'true');
}

/* =========================================================
   DRAWER — Day Detail
   ========================================================= */
export function openDayDrawer(dateStr, tasksForDay) {
  AppState.drawerOpen = true;
  AppState.drawerDate = dateStr;

  // Format title
  const d = new Date(dateStr + 'T00:00:00');
  const opts = { month: 'long', day: 'numeric', weekday: 'short' };
  DOM.drawerDayTitle.textContent = d.toLocaleDateString('zh-CN', opts);

  // Render tasks inside drawer
  renderDayDrawerTasks(tasksForDay, dateStr);

  // Open
  DOM.drawerDay.classList.add('open');
  DOM.drawerDay.setAttribute('aria-hidden', 'false');
  showBackdrop(150);

  // Focus management
  DOM.drawerDayClose.focus();
}

export function closeDayDrawer() {
  AppState.drawerOpen = false;
  AppState.drawerDate = null;
  DOM.drawerDay.classList.remove('open');
  DOM.drawerDay.setAttribute('aria-hidden', 'true');
  if (!AppState.activeModal) hideBackdrop();
}

function renderDayDrawerTasks(tasks, dateStr) {
  const body = DOM.drawerDayBody;
  if (!tasks || tasks.length === 0) {
    body.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon"><i data-lucide="calendar-x"></i></div>
        <h3>这天还没有任务</h3>
        <p>点击右上角的 + 按钮，为这一天新建任务</p>
      </div>`;
  } else {
    body.innerHTML = tasks.map(t => renderTaskCard(t)).join('');
  }
  // Re-init lucide inside drawer
  if (window.lucide) lucide.createIcons({ nodes: [body] });

  // Attach card click handlers
  body.querySelectorAll('.task-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.task-card__check')) return; // handled by tasks.js
      const id = card.dataset.id;
      if (id && window.TasksModule) TasksModule.openEditModal(id);
    });
  });
}

function initDrawer() {
  DOM.drawerDayClose.addEventListener('click', closeDayDrawer);

  DOM.drawerDayAdd.addEventListener('click', () => {
    openTaskModal({ prefillDate: AppState.drawerDate });
  });
}

/* =========================================================
   MODAL — Task Form
   ========================================================= */
export function openTaskModal(options = {}) {
  AppState.activeModal = 'task';

  const isEdit = !!options.taskId;
  DOM.modalTaskTitle.textContent = isEdit ? '编辑任务' : '新建任务';

  // Populate form
  if (window.TasksModule) TasksModule.populateForm(options);

  DOM.modalTask.classList.add('open');
  DOM.modalTask.setAttribute('aria-hidden', 'false');
  showBackdrop(250);

  // Focus first input
  setTimeout(() => document.getElementById('task-name')?.focus(), 80);
}

export function closeTaskModal() {
  AppState.activeModal = null;
  DOM.modalTask.classList.remove('open');
  DOM.modalTask.setAttribute('aria-hidden', 'true');

  // Keep backdrop if drawer is still open
  if (!AppState.drawerOpen) hideBackdrop();
  else showBackdrop(150);

  // Reset form
  if (window.TasksModule) TasksModule.resetForm();
}

function initTaskModal() {
  [DOM.modalTaskClose, DOM.modalTaskCancel].forEach(el => {
    el.addEventListener('click', closeTaskModal);
  });

  DOM.btnNewTask.addEventListener('click', () => openTaskModal());

  DOM.taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (window.TasksModule) TasksModule.handleFormSubmit();
  });

  // Prevent closing modal by clicking inside the box
  DOM.modalTask.querySelector('.modal__box').addEventListener('click', e => e.stopPropagation());
}

/* =========================================================
   MODAL — Days Matter Form
   ========================================================= */
export function openDMModal(options = {}) {
  AppState.activeModal = 'daysmatter';
  const isEdit = !!options.dmId;
  document.getElementById('modal-dm-title').textContent = isEdit ? '编辑日子' : '添加重要日子';

  if (window.DMModule) DMModule.populateForm(options);

  DOM.modalDM.classList.add('open');
  DOM.modalDM.setAttribute('aria-hidden', 'false');
  showBackdrop(250);
  setTimeout(() => document.getElementById('dm-name')?.focus(), 80);
}

export function closeDMModal() {
  AppState.activeModal = null;
  DOM.modalDM.classList.remove('open');
  DOM.modalDM.setAttribute('aria-hidden', 'true');
  if (!AppState.drawerOpen) hideBackdrop();
  if (window.DMModule) DMModule.resetForm();
}

function initDMModal() {
  [DOM.modalDMClose, DOM.modalDMCancel].forEach(el => {
    el.addEventListener('click', closeDMModal);
  });

  if (DOM.btnNewDM) DOM.btnNewDM.addEventListener('click', () => openDMModal());

  DOM.dmForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (window.DMModule) DMModule.handleFormSubmit();
  });

  DOM.modalDM.querySelector('.modal__box').addEventListener('click', e => e.stopPropagation());
}

/* =========================================================
   BACKDROP CLICK — closes topmost layer
   ========================================================= */
function initBackdrop() {
  DOM.backdrop.addEventListener('click', () => {
    if (AppState.activeModal) {
      if (AppState.activeModal === 'task') closeTaskModal();
      else if (AppState.activeModal === 'daysmatter') closeDMModal();
    } else if (AppState.drawerOpen) {
      closeDayDrawer();
    }
  });
}

/* =========================================================
   GLOBAL KEYBOARD SHORTCUTS
   ========================================================= */
function initKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (AppState.activeModal) {
        if (AppState.activeModal === 'task') closeTaskModal();
        else if (AppState.activeModal === 'daysmatter') closeDMModal();
      } else if (AppState.drawerOpen) {
        closeDayDrawer();
      }
    }
    // Cmd/Ctrl+N — new task
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
      e.preventDefault();
      openTaskModal();
    }
  });
}

/* =========================================================
   TOAST NOTIFICATIONS
   ========================================================= */
export function showToast(message, type = '', duration = 2800) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast${type ? ' ' + type : ''}`;
  toast.textContent = message;
  toast.setAttribute('role', 'status');
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = `toast-out 280ms var(--ease-in) forwards`;
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

/* =========================================================
   HELPER: render a task card (shared between drawer & task list)
   ========================================================= */
export function renderTaskCard(task) {
  const statusIcon = {
    todo:  'circle',
    doing: 'loader-circle',
    done:  'circle-check',
  }[task.status] || 'circle';

  const statusLabel = { todo: '待办', doing: '进行中', done: '已完成' }[task.status] || '';

  const qLabel = {
    q1: '紧急重要',
    q2: '重要不紧急',
    q3: '紧急不重要',
    q4: '不紧急不重要',
  }[task.quadrant] || '';

  const tagsHTML = (task.tags || []).map(t =>
    `<span class="tag">${escapeHTML(t)}</span>`
  ).join('');

  const ddlHTML = task.ddl
    ? `<span class="task-card__ddl ${isDDLOverdue(task.ddl, task.status) ? 'overdue' : ''}">
         <i data-lucide="calendar-clock"></i>${formatDate(task.ddl)}
       </span>`
    : '';

  return `
    <div class="task-card task-card--${task.status} task-card--${task.quadrant}" data-id="${task.id}" role="article">
      <button class="task-card__check" data-id="${task.id}" aria-label="切换状态: ${statusLabel}" title="${statusLabel}">
        <i data-lucide="${statusIcon}"></i>
      </button>
      <div class="task-card__body">
        <p class="task-card__name${task.status === 'done' ? ' done' : ''}">${escapeHTML(task.name)}</p>
        ${task.desc ? `<p class="task-card__desc">${escapeHTML(task.desc)}</p>` : ''}
        <div class="task-card__meta">
          ${qLabel ? `<span class="task-card__q task-card__q--${task.quadrant}">${qLabel}</span>` : ''}
          ${tagsHTML}
          ${ddlHTML}
        </div>
      </div>
      <button class="task-card__edit btn btn-ghost btn-icon" data-id="${task.id}" aria-label="编辑任务">
        <i data-lucide="pencil"></i>
      </button>
    </div>`;
}

/* =========================================================
   UTILITIES
   ========================================================= */
export function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export function isDDLOverdue(ddl, status) {
  if (status === 'done') return false;
  const today = new Date(); today.setHours(0,0,0,0);
  return new Date(ddl + 'T00:00:00') < today;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/* =========================================================
   BOOT
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  resolveDOM();
  initTabs();
  initBackdrop();
  initDrawer();
  initTaskModal();
  initDMModal();
  initKeyboard();

  // Init Lucide icons
  if (window.lucide) lucide.createIcons();

  // Expose helpers globally so other modules can call them
  window.App = {
    openDayDrawer,
    closeDayDrawer,
    openTaskModal,
    closeTaskModal,
    openDMModal,
    closeDMModal,
    showToast,
    renderTaskCard,
    escapeHTML,
    formatDate,
    isDDLOverdue,
    todayISO,
    refreshDrawerIfOpen: (dateStr, tasks) => {
      if (AppState.drawerOpen && AppState.drawerDate === dateStr) {
        renderDayDrawerTasks(tasks, dateStr);
        if (window.lucide) lucide.createIcons({ nodes: [DOM.drawerDayBody] });
      }
    },
    getDrawerDate: () => AppState.drawerDate,
    switchTab,
  };

  // Init sub-modules (they self-init if window.lucide is ready)
  if (window.CalendarModule) CalendarModule.init();
  if (window.TasksModule)    TasksModule.init();
  if (window.QuadrantModule) QuadrantModule.init();
  if (window.DMModule)       DMModule.init();

  // Re-run lucide after sub-modules render
  setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 120);
});
