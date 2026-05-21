/**
 * data.js — Data persistence layer
 * Plain script (no ES module syntax) — exposes window.DataStore
 * Uses localStorage as primary store.
 */
(function () {
  'use strict';

  const KEYS = {
    tasks:      'tdm_tasks',
    daysmatter: 'tdm_daysmatter',
    tags:       'tdm_tags',
  };

  const DEFAULT_TAGS = ['工作', '学习', '生活', '健康', '财务', '社交', '创作'];

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  window.DataStore = {
    // Tasks
    getTasks:    function () { return read(KEYS.tasks, []); },
    saveTasks:   function (arr) { write(KEYS.tasks, arr); },

    // Tags (stored as plain string array)
    getTags:     function () { return read(KEYS.tags, DEFAULT_TAGS.slice()); },
    saveTags:    function (arr) { write(KEYS.tags, arr); },

    // DaysMatter
    getDaysMatter:  function () { return read(KEYS.daysmatter, []); },
    saveDaysMatter: function (arr) { write(KEYS.daysmatter, arr); },
  };

})();
