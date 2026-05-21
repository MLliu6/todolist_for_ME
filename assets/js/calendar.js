/**
 * calendar.js — Calendar rendering engine
 * Handles month/week/day/hour views, holiday/solar-term data, and DOM updates.
 */

import { getTasksByDate, getTasks, getSettings } from './data.js';

// ── Chinese Holidays (2024-2027) ────────────────────
// Format: 'YYYY-MM-DD': { label, type: 'holiday'|'workday' }
// 'holiday' = legal day off; 'workday' = compensatory work day
export const CN_HOLIDAYS = {
  // 2025
  '2025-01-01': { label: '元旦', type: 'holiday' },
  '2025-01-28': { label: '春节', type: 'holiday' },
  '2025-01-29': { label: '春节', type: 'holiday' },
  '2025-01-30': { label: '春节', type: 'holiday' },
  '2025-01-31': { label: '春节', type: 'holiday' },
  '2025-02-01': { label: '春节', type: 'holiday' },
  '2025-02-02': { label: '春节', type: 'holiday' },
  '2025-02-03': { label: '春节', type: 'holiday' },
  '2025-02-08': { label: '调休补班', type: 'workday' },
  '2025-04-04': { label: '清明', type: 'holiday' },
  '2025-04-05': { label: '清明', type: 'holiday' },
  '2025-04-06': { label: '清明', type: 'holiday' },
  '2025-04-27': { label: '调休补班', type: 'workday' },
  '2025-05-01': { label: '劳动节', type: 'holiday' },
  '2025-05-02': { label: '劳动节', type: 'holiday' },
  '2025-05-03': { label: '劳动节', type: 'holiday' },
  '2025-05-04': { label: '劳动节', type: 'holiday' },
  '2025-05-05': { label: '劳动节', type: 'holiday' },
  '2025-05-31': { label: '端午', type: 'holiday' },
  '2025-06-01': { label: '端午', type: 'holiday' },
  '2025-06-02': { label: '端午', type: 'holiday' },
  '2025-10-01': { label: '国庆', type: 'holiday' },
  '2025-10-02': { label: '国庆', type: 'holiday' },
  '2025-10-03': { label: '国庆', type: 'holiday' },
  '2025-10-04': { label: '国庆', type: 'holiday' },
  '2025-10-05': { label: '国庆', type: 'holiday' },
  '2025-10-06': { label: '国庆', type: 'holiday' },
  '2025-10-07': { label: '国庆', type: 'holiday' },
  '2025-10-11': { label: '调休补班', type: 'workday' },
  // 2026
  '2026-01-01': { label: '元旦', type: 'holiday' },
  '2026-01-02': { label: '元旦', type: 'holiday' },
  '2026-02-17': { label: '春节', type: 'holiday' },
  '2026-02-18': { label: '春节', type: 'holiday' },
  '2026-02-19': { label: '春节', type: 'holiday' },
  '2026-02-20': { label: '春节', type: 'holiday' },
  '2026-02-21': { label: '春节', type: 'holiday' },
  '2026-02-22': { label: '春节', type: 'holiday' },
  '2026-02-23': { label: '春节', type: 'holiday' },
  '2026-04-06': { label: '清明', type: 'holiday' },
  '2026-05-01': { label: '劳动节', type: 'holiday' },
  '2026-05-02': { label: '劳动节', type: 'holiday' },
  '2026-05-03': { label: '劳动节', type: 'holiday' },
  '2026-05-04': { label: '劳动节', type: 'holiday' },
  '2026-05-05': { label: '劳动节', type: 'holiday' },
  '2026-06-19': { label: '端午', type: 'holiday' },
  '2026-06-20': { label: '端午', type: 'holiday' },
  '2026-06-21': { label: '端午', type: 'holiday' },
  '2026-10-01': { label: '国庆', type: 'holiday' },
  '2026-10-02': { label: '国庆', type: 'holiday' },
  '2026-10-03': { label: '国庆', type: 'holiday' },
  '2026-10-04': { label: '国庆', type: 'holiday' },
  '2026-10-05': { label: '国庆', type: 'holiday' },
  '2026-10-06': { label: '国庆', type: 'holiday' },
  '2026-10-07': { label: '国庆', type: 'holiday' },
};

// ── Western / notable festivals ──────────────────────
// These are fixed-date each year
export const WESTERN_FESTIVALS = {
  '02-14': '情人节',
  '03-08': '妇女节',
  '04-01': '愚人节',
  '05-04': '青年节',
  '06-01': '儿童节',
  '10-31': '万圣节',
  '12-24': '平安夜',
  '12-25': '圣诞节',
  '12-31': '年度最后一天',
};

// Variable-date Western festivals (compute per year)
function getVariableFestivals(year) {
  const result = {};
  // Mother's Day: 2nd Sunday of May
  result[getNthWeekday(year, 5, 0, 2)] = '母亲节';
  // Father's Day: 3rd Sunday of June
  result[getNthWeekday(year, 6, 0, 3)] = '父亲节';
  // Thanksgiving: 4th Thursday of November
  result[getNthWeekday(year, 11, 4, 4)] = '感恩节';
  return result;
}

/** Get the Nth occurrence of weekday (0=Sun) in a given month */
function getNthWeekday(year, month, weekday, n) {
  const d = new Date(year, month - 1, 1);
  let count = 0;
  while (count < n) {
    if (d.getDay() === weekday) count++;
    if (count < n) d.setDate(d.getDate() + 1);
  }
  return fmtDate(d);
}

// ── 24 Solar Terms (Jieqi) ─────────────────────────
// Using the C value method to estimate solar term dates
const JIEQI_NAMES = [
  '小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨',
  '立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑',
  '白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至',
];

// C values for solar term calculation (simplified for 2000-2100)
const JIEQI_C = [
  [5.4055, 20.12, 3.87, 18.73, 5.63, 20.646, 4.81, 20.1,
   5.52, 21.04, 5.678, 21.37, 7.108, 22.83, 7.5, 23.13,
   7.646, 23.042, 8.318, 23.438, 7.438, 22.36, 7.18, 21.94],
];

export function getSolarTerms(year) {
  const result = {};
  for (let i = 0; i < 24; i++) {
    const month = Math.floor(i / 2) + 1;
    // Simple approximation formula
    const c = i % 2 === 0 ?
      [4.6295, 19.4599, 3.3872, 18.8450, 5.6300, 20.6460,
       4.8107, 20.9700, 6.3780, 21.9300, 6.6765, 22.7250,
       7.1017, 23.0172, 7.1983, 23.1350, 8.0044, 23.6972,
       7.0625, 22.6704, 6.3306, 21.9425, 7.9214, 21.9412][i] :
      [20.9200, 4.3300, 18.8450, 20.7690, 20.6250, 5.6800,
       21.0400, 6.1100, 21.1900, 5.6670, 21.9200, 6.4700,
       23.0250, 7.9300, 23.1350, 7.1200, 23.2100, 8.2300,
       22.8360, 7.5000, 21.8950, 6.1100, 22.1700, 21.8200][i];
    const day = Math.floor((year % 100) * 0.2422 + c) - Math.floor((year % 100 - 1) / 4);
    const date = new Date(year, month - 1, day);
    if (!isNaN(date)) {
      result[fmtDate(date)] = JIEQI_NAMES[i];
    }
  }
  return result;
}

// ── Date Utilities ─────────────────────────────────
export function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function today() {
  return fmtDate(new Date());
}

export function getDayLabel(dateStr) {
  // Returns holiday/festival/solar-term label for a date, or null
  const d = new Date(dateStr + 'T00:00:00');
  const year = d.getFullYear();
  const mmdd = dateStr.slice(5);

  // Priority: CN holiday > solar term > western festival
  if (CN_HOLIDAYS[dateStr]) {
    return { label: CN_HOLIDAYS[dateStr].label, type: CN_HOLIDAYS[dateStr].type === 'workday' ? 'workday' : 'holiday' };
  }

  const solarTerms = getSolarTerms(year);
  if (solarTerms[dateStr]) {
    return { label: solarTerms[dateStr], type: 'term' };
  }

  const variableFestivals = getVariableFestivals(year);
  if (variableFestivals[dateStr]) {
    return { label: variableFestivals[dateStr], type: 'festival' };
  }

  if (WESTERN_FESTIVALS[mmdd]) {
    return { label: WESTERN_FESTIVALS[mmdd], type: 'festival' };
  }

  return null;
}

// ── Calendar State ────────────────────────────────
export const calState = {
  view: 'month',      // 'month' | 'week' | 'day' | 'hour'
  year: new Date().getFullYear(),
  month: new Date().getMonth(),   // 0-indexed
  selectedDate: today(),
  weekStart: 1,       // Monday
};

export function calNavigate(dir) {
  // dir: -1 or +1
  if (calState.view === 'month') {
    calState.month += dir;
    if (calState.month > 11) { calState.month = 0; calState.year++; }
    if (calState.month < 0)  { calState.month = 11; calState.year--; }
  } else if (calState.view === 'week') {
    const d = new Date(calState.selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + dir * 7);
    calState.selectedDate = fmtDate(d);
    calState.year = d.getFullYear();
    calState.month = d.getMonth();
  } else {
    const d = new Date(calState.selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + dir);
    calState.selectedDate = fmtDate(d);
    calState.year = d.getFullYear();
    calState.month = d.getMonth();
  }
}

export function setView(v) {
  calState.view = v;
}

export function selectDate(dateStr) {
  calState.selectedDate = dateStr;
  const d = new Date(dateStr + 'T00:00:00');
  calState.year = d.getFullYear();
  calState.month = d.getMonth();
}

// ── Calendar Render Helpers ──────────────────────────

/** Get all days to display in the month grid (always 6 rows x 7 cols = 42 days) */
export function getMonthGridDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const startDow = firstDay.getDay(); // 0=Sun
  // Adjust for Monday-first week
  const offset = (startDow - calState.weekStart + 7) % 7;
  const start = new Date(firstDay);
  start.setDate(start.getDate() - offset);

  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push({
      dateStr: fmtDate(d),
      date: d.getDate(),
      month: d.getMonth(),
      year: d.getFullYear(),
      isCurrentMonth: d.getMonth() === month,
    });
  }
  return days;
}

/** Get 7 days of a week containing the given date */
export function getWeekDays(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const dow = d.getDay();
  const offset = (dow - calState.weekStart + 7) % 7;
  const start = new Date(d);
  start.setDate(start.getDate() - offset);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(day.getDate() + i);
    days.push(fmtDate(day));
  }
  return days;
}

/** Format month title */
export function fmtMonthTitle(year, month) {
  const MONTHS = ['一月','二月','三月','四月','五月','六月',
                  '七月','八月','九月','十月','十一月','十二月'];
  return `${year} 年 ${MONTHS[month]}`;
}

const DOW_LABELS_MON = ['一','二','三','四','五','六','日'];
export function getDowLabels() { return DOW_LABELS_MON; }

/** Quadrant color classes for chip backgrounds */
export const Q_CHIP_COLORS = {
  1: { bg: '#c0392b15', text: '#8b2020', border: '#c0392b' },
  2: { bg: '#2a7d6f15', text: '#1a5047', border: '#2a7d6f' },
  3: { bg: '#e67e2215', text: '#8b5000', border: '#e67e22' },
  4: { bg: '#7f8c8d15', text: '#4a5568', border: '#7f8c8d' },
  null: { bg: 'var(--color-surface-offset)', text: 'var(--color-text-muted)', border: 'var(--color-border)' },
};
