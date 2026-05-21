/**
 * data.js — Data persistence layer
 * Uses localStorage as primary store (works offline, no server needed).
 * Keys are prefixed with 'tdm_' to avoid collisions.
 */

const KEYS = {
  tasks:      'tdm_tasks',
  daysmatter: 'tdm_daysmatter',
  tags:       'tdm_tags',
  settings:   'tdm_settings',
};

// Default tags shipped with the app
const DEFAULT_TAGS = [
  { id: 'work',     label: '工作',     color: '#2a7d6f' },
  { id: 'study',    label: '学习',     color: '#006494' },
  { id: 'life',     label: '生活',     color: '#4a7c3f' },
  { id: 'health',   label: '健康',     color: '#e67e22' },
  { id: 'social',   label: '社交',     color: '#9a6c1a' },
  { id: 'finance',  label: '财务',     color: '#7a39bb' },
  { id: 'creative', label: '创作',     color: '#a03030' },
];

const DEFAULT_SETTINGS = {
  firstDayOfWeek: 1, // 0=Sunday, 1=Monday
  defaultView: 'month',
};

/** Generic read/write helpers */
function read(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Generate a random id */
export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── TASKS ──────────────────────────────────────────
/**
 * Task schema:
 * {
 *   id: string,
 *   title: string,
 *   content: string,
 *   status: 'todo' | 'doing' | 'done',
 *   quadrant: 1 | 2 | 3 | 4 | null,
 *   tags: string[],   // tag ids
 *   ddl: string|null, // ISO date 'YYYY-MM-DD'
 *   createdAt: number // timestamp
 * }
 */

export function getTasks() {
  return read(KEYS.tasks, []);
}

export function saveTask(task) {
  const tasks = getTasks();
  const idx = tasks.findIndex(t => t.id === task.id);
  if (idx >= 0) {
    tasks[idx] = { ...tasks[idx], ...task };
  } else {
    tasks.unshift({ createdAt: Date.now(), ...task });
  }
  write(KEYS.tasks, tasks);
  return tasks;
}

export function deleteTask(id) {
  const tasks = getTasks().filter(t => t.id !== id);
  write(KEYS.tasks, tasks);
  return tasks;
}

export function getTasksByDate(dateStr) {
  // Returns tasks where ddl matches the date, or tasks created on that day
  return getTasks().filter(t => t.ddl === dateStr);
}

export function getUpcomingTasks(days = 7) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const future = new Date(today);
  future.setDate(future.getDate() + days);

  return getTasks()
    .filter(t => {
      if (!t.ddl || t.status === 'done') return false;
      const d = new Date(t.ddl + 'T00:00:00');
      return d >= today && d <= future;
    })
    .sort((a, b) => (a.ddl > b.ddl ? 1 : -1));
}

// ── TAGS ───────────────────────────────────────────
export function getTags() {
  return read(KEYS.tags, DEFAULT_TAGS);
}

export function saveTag(tag) {
  const tags = getTags();
  const idx = tags.findIndex(t => t.id === tag.id);
  if (idx >= 0) {
    tags[idx] = tag;
  } else {
    tags.push(tag);
  }
  write(KEYS.tags, tags);
  return tags;
}

export function deleteTag(id) {
  const tags = getTags().filter(t => t.id !== id);
  write(KEYS.tags, tags);
  return tags;
}

// ── DAYSMATTER ────────────────────────────────────
/**
 * DaysMatter schema:
 * {
 *   id: string,
 *   name: string,
 *   date: string,   // 'YYYY-MM-DD'
 *   emoji: string,
 *   note: string
 * }
 */

export function getDaysMatter() {
  return read(KEYS.daysmatter, DEFAULT_DM);
}

export function saveDaysMatter(item) {
  const list = getDaysMatter();
  const idx = list.findIndex(i => i.id === item.id);
  if (idx >= 0) {
    list[idx] = item;
  } else {
    list.push(item);
  }
  write(KEYS.daysmatter, list);
  return list;
}

export function deleteDaysMatter(id) {
  const list = getDaysMatter().filter(i => i.id !== id);
  write(KEYS.daysmatter, list);
  return list;
}

const DEFAULT_DM = [
  { id: 'bday', name: '我的生日', date: '', emoji: '🎂', note: '输入你的生日' },
];

// ── SETTINGS ──────────────────────────────────────
export function getSettings() {
  return read(KEYS.settings, DEFAULT_SETTINGS);
}

export function saveSettings(patch) {
  const current = getSettings();
  const next = { ...current, ...patch };
  write(KEYS.settings, next);
  return next;
}
