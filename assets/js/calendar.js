/**
 * calendar.js — Calendar rendering engine
 * Plain script, no ES module syntax. Exposes window.CalendarModule.
 * Handles month / week / day / hour views.
 */
(function () {
  'use strict';

  /* -------------------------------------------------------
     CHINESE HOLIDAYS 2025-2026
  ------------------------------------------------------- */
  var CN_HOLIDAYS = {
    '2025-01-01':{ label:'元旦', type:'holiday' },
    '2025-01-28':{ label:'春节', type:'holiday' },
    '2025-01-29':{ label:'春节', type:'holiday' },
    '2025-01-30':{ label:'春节', type:'holiday' },
    '2025-01-31':{ label:'春节', type:'holiday' },
    '2025-02-01':{ label:'春节', type:'holiday' },
    '2025-02-02':{ label:'春节', type:'holiday' },
    '2025-02-03':{ label:'春节', type:'holiday' },
    '2025-02-08':{ label:'调休补班', type:'workday' },
    '2025-04-04':{ label:'清明', type:'holiday' },
    '2025-04-05':{ label:'清明', type:'holiday' },
    '2025-04-06':{ label:'清明', type:'holiday' },
    '2025-05-01':{ label:'劳动节', type:'holiday' },
    '2025-05-02':{ label:'劳动节', type:'holiday' },
    '2025-05-03':{ label:'劳动节', type:'holiday' },
    '2025-05-04':{ label:'劳动节', type:'holiday' },
    '2025-05-05':{ label:'劳动节', type:'holiday' },
    '2025-05-31':{ label:'端午', type:'holiday' },
    '2025-06-01':{ label:'端午', type:'holiday' },
    '2025-06-02':{ label:'端午', type:'holiday' },
    '2025-10-01':{ label:'国庆', type:'holiday' },
    '2025-10-02':{ label:'国庆', type:'holiday' },
    '2025-10-03':{ label:'国庆', type:'holiday' },
    '2025-10-04':{ label:'国庆', type:'holiday' },
    '2025-10-05':{ label:'国庆', type:'holiday' },
    '2025-10-06':{ label:'国庆', type:'holiday' },
    '2025-10-07':{ label:'国庆', type:'holiday' },
    '2026-01-01':{ label:'元旦', type:'holiday' },
    '2026-01-02':{ label:'元旦', type:'holiday' },
    '2026-02-17':{ label:'春节', type:'holiday' },
    '2026-02-18':{ label:'春节', type:'holiday' },
    '2026-02-19':{ label:'春节', type:'holiday' },
    '2026-02-20':{ label:'春节', type:'holiday' },
    '2026-02-21':{ label:'春节', type:'holiday' },
    '2026-02-22':{ label:'春节', type:'holiday' },
    '2026-02-23':{ label:'春节', type:'holiday' },
    '2026-04-06':{ label:'清明', type:'holiday' },
    '2026-05-01':{ label:'劳动节', type:'holiday' },
    '2026-05-02':{ label:'劳动节', type:'holiday' },
    '2026-05-03':{ label:'劳动节', type:'holiday' },
    '2026-05-04':{ label:'劳动节', type:'holiday' },
    '2026-05-05':{ label:'劳动节', type:'holiday' },
    '2026-06-19':{ label:'端午', type:'holiday' },
    '2026-06-20':{ label:'端午', type:'holiday' },
    '2026-06-21':{ label:'端午', type:'holiday' },
    '2026-10-01':{ label:'国庆', type:'holiday' },
    '2026-10-02':{ label:'国庆', type:'holiday' },
    '2026-10-03':{ label:'国庆', type:'holiday' },
    '2026-10-04':{ label:'国庆', type:'holiday' },
    '2026-10-05':{ label:'国庆', type:'holiday' },
    '2026-10-06':{ label:'国庆', type:'holiday' },
    '2026-10-07':{ label:'国庆', type:'holiday' },
  };

  var WESTERN = {
    '02-14':'情人节','03-08':'妇女节','04-01':'愚人节',
    '06-01':'儿童节','10-31':'万圣节','12-24':'平安夜','12-25':'圣诞节',
  };

  var JIEQI = ['小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨',
               '立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑',
               '白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至'];
  var JIEQI_C = [4.6295,19.4599,3.3872,18.8450,5.6300,20.6460,4.8107,20.9700,
                 6.3780,21.9300,6.6765,22.7250,7.1017,23.0172,7.1983,23.1350,
                 8.0044,23.6972,7.0625,22.6704,6.3306,21.9425,7.9214,21.9412];

  function getSolarTerms(year) {
    var r = {};
    for (var i = 0; i < 24; i++) {
      var m = Math.floor(i / 2) + 1;
      var day = Math.floor((year % 100) * 0.2422 + JIEQI_C[i]) - Math.floor((year % 100 - 1) / 4);
      var d = new Date(year, m - 1, day);
      if (!isNaN(d.getTime())) r[fmtDate(d)] = JIEQI[i];
    }
    return r;
  }

  function getNthWeekday(year, month, weekday, n) {
    var d = new Date(year, month - 1, 1), count = 0;
    while (count < n) {
      if (d.getDay() === weekday) count++;
      if (count < n) d.setDate(d.getDate() + 1);
    }
    return fmtDate(d);
  }

  function getVariableFestivals(year) {
    var r = {};
    r[getNthWeekday(year, 5, 0, 2)] = '母亲节';
    r[getNthWeekday(year, 6, 0, 3)] = '父亲节';
    r[getNthWeekday(year, 11, 4, 4)] = '感恩节';
    return r;
  }

  function getDayLabel(dateStr) {
    var d = new Date(dateStr + 'T00:00:00');
    var year = d.getFullYear();
    var mmdd = dateStr.slice(5);
    if (CN_HOLIDAYS[dateStr]) {
      var h = CN_HOLIDAYS[dateStr];
      return { label: h.label, type: h.type === 'workday' ? 'workday' : 'holiday' };
    }
    var st = getSolarTerms(year);
    if (st[dateStr]) return { label: st[dateStr], type: 'term' };
    var vf = getVariableFestivals(year);
    if (vf[dateStr]) return { label: vf[dateStr], type: 'festival' };
    if (WESTERN[mmdd]) return { label: WESTERN[mmdd], type: 'festival' };
    return null;
  }

  /* -------------------------------------------------------
     UTILITIES
  ------------------------------------------------------- */
  function fmtDate(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function todayStr() { return fmtDate(new Date()); }

  var MONTHS_ZH = ['一月','二月','三月','四月','五月','六月',
                   '七月','八月','九月','十月','十一月','十二月'];
  var DOW_ZH = ['日','一','二','三','四','五','六']; // index = 0=Sun
  var DOW_MON_FIRST = ['一','二','三','四','五','六','日'];

  /* -------------------------------------------------------
     STATE
  ------------------------------------------------------- */
  var state = {
    view: 'month',
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    selectedDate: todayStr(),
  };

  /* -------------------------------------------------------
     RENDER DISPATCH
  ------------------------------------------------------- */
  function render() {
    var body = document.getElementById('calendar-body');
    var title = document.getElementById('cal-title');
    if (!body) return;

    if (state.view === 'month') {
      title.textContent = state.year + '年' + MONTHS_ZH[state.month];
      renderMonth(body);
    } else if (state.view === 'week') {
      renderWeek(body);
    } else if (state.view === 'day') {
      renderDay(body);
    } else if (state.view === 'hour') {
      renderHour(body);
    }

    if (window.lucide) lucide.createIcons({ nodes: [body] });
  }

  /* -------------------------------------------------------
     MONTH VIEW
  ------------------------------------------------------- */
  function renderMonth(body) {
    var tasks = window.DataStore ? DataStore.getTasks() : [];
    var today = todayStr();

    // Build grid: always 6 rows x 7 cols (Mon-first)
    var firstDay = new Date(state.year, state.month, 1);
    var startDow = firstDay.getDay(); // 0=Sun
    var offset = (startDow - 1 + 7) % 7; // adjust to Mon-first
    var start = new Date(firstDay);
    start.setDate(start.getDate() - offset);

    var html = '<div class="cal-month">';
    // Header row
    html += '<div class="cal-month__header">';
    DOW_MON_FIRST.forEach(function (d) {
      html += '<div class="cal-dow">' + d + '</div>';
    });
    html += '</div>';
    // Days grid
    html += '<div class="cal-month__grid">';
    for (var i = 0; i < 42; i++) {
      var d = new Date(start);
      d.setDate(d.getDate() + i);
      var ds = fmtDate(d);
      var inMonth = d.getMonth() === state.month;
      var isToday = ds === today;
      var isSelected = ds === state.selectedDate;
      var dayLabel = getDayLabel(ds);
      var dayTasks = tasks.filter(function (t) { return t.ddl === ds; });
      var hasTask = dayTasks.length > 0;

      var cls = 'cal-day';
      if (!inMonth) cls += ' cal-day--out';
      if (isToday)  cls += ' cal-day--today';
      if (isSelected && !isToday) cls += ' cal-day--selected';
      if (d.getDay() === 0 || d.getDay() === 6) cls += ' cal-day--weekend';
      if (dayLabel && dayLabel.type === 'holiday') cls += ' cal-day--holiday';
      if (dayLabel && dayLabel.type === 'workday') cls += ' cal-day--workday';

      html += '<div class="' + cls + '" data-date="' + ds + '" role="button" tabindex="0" aria-label="' + ds + '">';
      html += '<div class="cal-day__num">' + d.getDate() + '</div>';
      if (dayLabel) {
        html += '<div class="cal-day__label cal-day__label--' + dayLabel.type + '">' + dayLabel.label + '</div>';
      }
      if (hasTask) {
        html += '<div class="cal-day__dots">';
        // Show up to 3 dots, coloured by quadrant
        var shown = dayTasks.slice(0, 3);
        shown.forEach(function (t) {
          html += '<span class="cal-dot cal-dot--' + (t.quadrant || 'q2') + '"></span>';
        });
        if (dayTasks.length > 3) html += '<span class="cal-dot-more">+' + (dayTasks.length - 3) + '</span>';
        html += '</div>';
      }
      html += '</div>';
    }
    html += '</div></div>';
    body.innerHTML = html;

    // Click handlers
    body.querySelectorAll('.cal-day').forEach(function (el) {
      el.addEventListener('click', function () { onDateClick(el.dataset.date); });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDateClick(el.dataset.date); }
      });
    });
  }

  /* -------------------------------------------------------
     WEEK VIEW
  ------------------------------------------------------- */
  function renderWeek(body) {
    var tasks = window.DataStore ? DataStore.getTasks() : [];
    var today = todayStr();
    var d = new Date(state.selectedDate + 'T00:00:00');
    var dow = d.getDay();
    var offset = (dow - 1 + 7) % 7;
    var start = new Date(d); start.setDate(d.getDate() - offset);

    var days = [];
    for (var i = 0; i < 7; i++) {
      var day = new Date(start); day.setDate(start.getDate() + i);
      days.push(fmtDate(day));
    }

    var title = document.getElementById('cal-title');
    title.textContent = days[0].slice(0,7).replace('-','\u5e74') + ' 周';

    var html = '<div class="cal-week">';
    // Header
    html += '<div class="cal-week__header"><div class="cal-week__time-gutter"></div>';
    days.forEach(function (ds) {
      var day = new Date(ds + 'T00:00:00');
      var isT = ds === today;
      var dl = getDayLabel(ds);
      html += '<div class="cal-week__col-hd' + (isT ? ' today' : '') + '">';
      html += '<div class="cal-week__dow">' + DOW_MON_FIRST[(day.getDay() + 6) % 7] + '</div>';
      html += '<div class="cal-week__date' + (isT ? ' today' : '') + '">' + day.getDate() + '</div>';
      if (dl) html += '<div class="cal-week__label cal-day__label--' + dl.type + '">' + dl.label + '</div>';
      html += '</div>';
    });
    html += '</div>';

    // All-day row
    html += '<div class="cal-week__allday"><div class="cal-week__time-gutter">全天</div>';
    days.forEach(function (ds) {
      var dayTasks = tasks.filter(function (t) { return t.ddl === ds; });
      html += '<div class="cal-week__allday-col" data-date="' + ds + '">';
      dayTasks.forEach(function (t) {
        html += '<div class="cal-week__task cal-week__task--' + (t.quadrant||'q2') + '" data-id="' + t.id + '">' + escH(t.name) + '</div>';
      });
      html += '</div>';
    });
    html += '</div>';

    html += '</div>';
    body.innerHTML = html;

    // Click on column header → open drawer
    body.querySelectorAll('.cal-week__col-hd').forEach(function (el, idx) {
      el.addEventListener('click', function () { onDateClick(days[idx]); });
    });
    // Click on task chip
    body.querySelectorAll('.cal-week__task').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        if (window.TasksModule) TasksModule.openEditModal(el.dataset.id);
      });
    });
  }

  /* -------------------------------------------------------
     DAY VIEW
  ------------------------------------------------------- */
  function renderDay(body) {
    var tasks = window.DataStore ? DataStore.getTasks() : [];
    var ds = state.selectedDate;
    var d = new Date(ds + 'T00:00:00');
    var title = document.getElementById('cal-title');
    var dl = getDayLabel(ds);
    title.textContent = state.year + '年' + (d.getMonth()+1) + '月' + d.getDate() + '日';

    var dayTasks = tasks.filter(function (t) { return t.ddl === ds; });

    var html = '<div class="cal-day-view">';
    html += '<div class="cal-day-view__header">';
    html += '<span class="cal-day-view__date">' + (d.getMonth()+1) + '月' + d.getDate() + '日 ' + DOW_ZH[d.getDay()] + '</span>';
    if (dl) html += '<span class="cal-day__label cal-day__label--' + dl.type + '">' + dl.label + '</span>';
    html += '</div>';

    if (dayTasks.length === 0) {
      html += '<div class="empty-state" style="padding:var(--space-12) var(--space-8)">';
      html += '<div class="empty-state__icon"><i data-lucide="sun"></i></div>';
      html += '<h3>这天还没有任务</h3><p>点击右上角 + 新建一个</p></div>';
    } else {
      html += '<div class="cal-day-view__tasks">';
      dayTasks.forEach(function (t) {
        html += window.App ? App.renderTaskCard(t) : '';
      });
      html += '</div>';
    }
    html += '</div>';
    body.innerHTML = html;

    if (window.lucide) lucide.createIcons({ nodes: [body] });
    // Attach card handlers
    body.querySelectorAll('.task-card__check').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        // delegate to tasks module
      });
    });
    body.querySelectorAll('.task-card__edit, .task-card').forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (e.target.closest('.task-card__check')) return;
        var id = el.dataset.id || el.closest('.task-card').dataset.id;
        if (window.TasksModule) TasksModule.openEditModal(id);
      });
    });
  }

  /* -------------------------------------------------------
     HOUR VIEW
  ------------------------------------------------------- */
  function renderHour(body) {
    var ds = state.selectedDate;
    var d = new Date(ds + 'T00:00:00');
    var title = document.getElementById('cal-title');
    title.textContent = (d.getMonth()+1) + '月' + d.getDate() + '日 时间轴';

    var html = '<div class="cal-hour-view">';
    for (var h = 0; h < 24; h++) {
      var label = (h < 10 ? '0' : '') + h + ':00';
      html += '<div class="cal-hour-row">';
      html += '<div class="cal-hour-label">' + label + '</div>';
      html += '<div class="cal-hour-col"></div>';
      html += '</div>';
    }
    html += '</div>';
    body.innerHTML = html;
  }

  /* -------------------------------------------------------
     DATE CLICK → open day drawer
  ------------------------------------------------------- */
  function onDateClick(dateStr) {
    state.selectedDate = dateStr;
    var d = new Date(dateStr + 'T00:00:00');
    state.year  = d.getFullYear();
    state.month = d.getMonth();

    var tasks = window.DataStore ? DataStore.getTasks() : [];
    var dayTasks = tasks.filter(function (t) { return t.ddl === dateStr; });

    if (window.App) App.openDayDrawer(dateStr, dayTasks);
    // Re-render to show selected highlight
    render();
  }

  /* -------------------------------------------------------
     REFRESH DOTS (called after task save/delete)
  ------------------------------------------------------- */
  function refreshDots(allTasks) {
    // In month view, re-render efficiently
    if (state.view === 'month') render();
  }

  /* -------------------------------------------------------
     NAV & VIEW BUTTONS
  ------------------------------------------------------- */
  function initControls() {
    var prev = document.getElementById('cal-prev');
    var next = document.getElementById('cal-next');
    var todayBtn = document.getElementById('cal-today');
    var viewBtns = document.querySelectorAll('.view-btn');

    if (prev) prev.addEventListener('click', function () { navigate(-1); });
    if (next) next.addEventListener('click', function () { navigate(1); });
    if (todayBtn) todayBtn.addEventListener('click', function () {
      state.selectedDate = todayStr();
      var n = new Date();
      state.year = n.getFullYear();
      state.month = n.getMonth();
      render();
    });

    viewBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        viewBtns.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-pressed','false'); });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed','true');
        state.view = btn.dataset.view;
        render();
      });
    });
  }

  function navigate(dir) {
    if (state.view === 'month') {
      state.month += dir;
      if (state.month > 11) { state.month = 0; state.year++; }
      if (state.month < 0)  { state.month = 11; state.year--; }
    } else if (state.view === 'week') {
      var d = new Date(state.selectedDate + 'T00:00:00');
      d.setDate(d.getDate() + dir * 7);
      state.selectedDate = fmtDate(d);
      state.year = d.getFullYear(); state.month = d.getMonth();
    } else {
      var d2 = new Date(state.selectedDate + 'T00:00:00');
      d2.setDate(d2.getDate() + dir);
      state.selectedDate = fmtDate(d2);
      state.year = d2.getFullYear(); state.month = d2.getMonth();
    }
    render();
  }

  /* -------------------------------------------------------
     HELPER
  ------------------------------------------------------- */
  function escH(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /* -------------------------------------------------------
     INIT
  ------------------------------------------------------- */
  function init() {
    initControls();
    render();
  }

  window.CalendarModule = {
    init: init,
    render: render,
    refreshDots: refreshDots,
  };

})();
