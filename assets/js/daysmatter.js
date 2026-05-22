/**
 * daysmatter.js — Important Dates (Days Matter) module
 *
 * Each entry: { id, name, date (ISO), note, emoji }
 * Shows: how many days until / since the date
 * Exposes: window.DMModule
 */

(function () {
  'use strict';

  /* -------------------------------------------------------
     STATE
  ------------------------------------------------------- */
  let entries = [];

  /* -------------------------------------------------------
     LOAD & SAVE
  ------------------------------------------------------- */
  function load() {
    if (window.DataStore) entries = DataStore.getDaysMatter();
  }

  function save() {
    if (window.DataStore) DataStore.saveDaysMatter(entries);
  }

  /* -------------------------------------------------------
     DAYS CALCULATION
  ------------------------------------------------------- */
  function daysFrom(isoDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(isoDate + 'T00:00:00');
    const ms = target - today;
    return Math.round(ms / 86400000); // positive = future, negative = past
  }

  function formatDaysLabel(days) {
    if (days === 0) return { text: '就是今天', cls: 'today' };
    if (days > 0)  return { text: `还有4天`, cls: 'future' };
    return            { text: `已过${Math.abs(days)}天`, cls: 'past' };
  }

  // Workaround: template literal with variable
  function daysLabel(days) {
    if (days === 0) return { text: '就是今天', cls: 'today' };
    if (days > 0)  return { text: `还有4{days}天`.replace('{days}', days), cls: 'future' };
    return            { text: `已过{abs}天`.replace('{abs}', Math.abs(days)), cls: 'past' };
  }

  /* -------------------------------------------------------
     CRUD
  ------------------------------------------------------- */
  function createEntry(data) {
    const entry = {
      id:    crypto.randomUUID(),
      name:  data.name.trim(),
      date:  data.date,
      note:  (data.note || '').trim(),
      emoji: data.emoji || '⭐',
    };
    entries.push(entry);
    entries.sort((a, b) => {
      // Sort by absolute days from today (closest first)
      return Math.abs(daysFrom(a.date)) - Math.abs(daysFrom(b.date));
    });
    save();
    return entry;
  }

  function updateEntry(id, data) {
    const idx = entries.findIndex(e => e.id === id);
    if (idx === -1) return null;
    entries[idx] = { ...entries[idx], ...data };
    save();
    return entries[idx];
  }

  function deleteEntry(id) {
    entries = entries.filter(e => e.id !== id);
    save();
  }

  /* -------------------------------------------------------
     RENDERING
  ------------------------------------------------------- */
  function renderList() {
    const container = document.getElementById('daysmatter-list') || document.getElementById('dm-list');
    if (!container) return;
    const items = Store.getDM ? Store.getDM() : entries;
    if (!items.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon"><i data-lucide="star"></i></div>
          <h3>还没有重要日子</h3>
          <p>添加一个值得铭记的日子，比如生日、纪念日或即将到来的大事</p>
        </div>`;
      if (window.lucide) lucide.createIcons({ nodes: [container] });
      return;
    }
    const today = new Date(); today.setHours(0,0,0,0);
    const future = items.filter(e => new Date(e.date + 'T00:00:00') >= today)
      .sort((a,b) => new Date(a.date) - new Date(b.date));
    const past = items.filter(e => new Date(e.date + 'T00:00:00') < today)
      .sort((a,b) => new Date(b.date) - new Date(a.date));

    let html = '';
    if (future.length) {
      html += `<div class="dm-section">
        <div class="dm-section-title dm-section-title--future">Upcoming</div>
        <div class="dm-grid">${future.map(renderCard).join('')}</div>
      </div>`;
    }
    if (past.length) {
      html += `<div class="dm-section">
        <div class="dm-section-title dm-section-title--past">Memory</div>
        <div class="dm-grid">${past.map(renderCard).join('')}</div>
      </div>`;
    }
    container.innerHTML = html;
    if (window.lucide) lucide.createIcons({ nodes: [container] });
    attachHandlers(container);
  }

  function renderCard(entry) {
    const days = daysFrom(entry.date);
    const label = daysLabel(days);
    const dateFormatted = new Date(entry.date + 'T00:00:00')
      .toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

    const esc = window.App ? App.escapeHTML : (s => s);

    return `
      <div class="dm-card dm-card--${label.cls}" data-id="${entry.id}">
        <div class="dm-card__emoji">${entry.emoji}</div>
        <div class="dm-card__body">
          <h3 class="dm-card__name">${esc(entry.name)}</h3>
          <p class="dm-card__date">${dateFormatted}</p>
          ${entry.note ? `<p class="dm-card__note">${esc(entry.note)}</p>` : ''}
        </div>
        <div class="dm-card__counter dm-card__counter--${label.cls}">
          <span class="dm-counter__num">${Math.abs(days)}</span>
          <span class="dm-counter__unit">${days === 0 ? '' : '天'}</span>
          <span class="dm-counter__label">${label.text}</span>
        </div>
        <div class="dm-card__actions">
          <button class="btn btn-ghost btn-icon dm-edit" data-id="${entry.id}" aria-label="编辑">
            <i data-lucide="pencil"></i>
          </button>
          <button class="btn btn-ghost btn-icon dm-delete" data-id="${entry.id}" aria-label="删除">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>`;
  }

  function attachHandlers(container) {
    container.querySelectorAll('.dm-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.App?.openDMModal({ dmId: btn.dataset.id });
      });
    });

    container.querySelectorAll('.dm-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('确定要删除这个日子吗？')) {
          deleteEntry(btn.dataset.id);
          renderList();
          window.App?.showToast('已删除');
        }
      });
    });
  }

  /* -------------------------------------------------------
     FORM
  ------------------------------------------------------- */
  function populateForm(options = {}) {
    // Reset emoji selection
    document.querySelectorAll('.dm-emoji-opt').forEach(el => el.classList.remove('selected'));

    if (options.dmId) {
      const entry = entries.find(e => e.id === options.dmId);
      if (!entry) return;
      document.getElementById('dm-id').value   = entry.id;
      document.getElementById('dm-name').value  = entry.name;
      document.getElementById('dm-date').value  = entry.date;
      document.getElementById('dm-note').value  = entry.note || '';
      document.getElementById('dm-emoji').value = entry.emoji;
      const emojiOpt = document.querySelector(`.dm-emoji-opt[data-emoji="${entry.emoji}"]`);
      if (emojiOpt) emojiOpt.classList.add('selected');
    } else {
      document.getElementById('dm-id').value   = '';
      document.getElementById('dm-name').value  = '';
      document.getElementById('dm-date').value  = '';
      document.getElementById('dm-note').value  = '';
      document.getElementById('dm-emoji').value = '⭐';
      const defaultOpt = document.querySelector('.dm-emoji-opt[data-emoji="⭐"]');
      if (defaultOpt) defaultOpt.classList.add('selected');
    }
  }

  function resetForm() {
    document.getElementById('daysmatter-form')?.reset();
    document.getElementById('dm-id').value = '';
    document.getElementById('dm-emoji').value = '⭐';
    document.querySelectorAll('.dm-emoji-opt').forEach((el, i) => {
      el.classList.toggle('selected', i === 0);
    });
  }

  function handleFormSubmit() {
    const nameEl = document.getElementById('dm-name');
    const dateEl = document.getElementById('dm-date');
    const name = nameEl.value.trim();
    const date = dateEl.value;

    if (!name) {
      nameEl.focus();
      nameEl.style.borderColor = 'var(--color-error)';
      setTimeout(() => nameEl.style.borderColor = '', 1200);
      return;
    }
    if (!date) {
      dateEl.focus();
      dateEl.style.borderColor = 'var(--color-error)';
      setTimeout(() => dateEl.style.borderColor = '', 1200);
      return;
    }

    const id    = document.getElementById('dm-id').value;
    const note  = document.getElementById('dm-note').value;
    const emoji = document.getElementById('dm-emoji').value || '⭐';

    if (id) {
      updateEntry(id, { name, date, note, emoji });
      window.App?.showToast('已更新 ✓', 'success');
    } else {
      createEntry({ name, date, note, emoji });
      window.App?.showToast('已添加 ✓', 'success');
    }

    window.App?.closeDMModal();
    renderList();
  }

  /* -------------------------------------------------------
     EMOJI PICKER INIT
  ------------------------------------------------------- */
  function initEmojiPicker() {
    document.querySelectorAll('.dm-emoji-opt').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.dm-emoji-opt').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
        document.getElementById('dm-emoji').value = el.dataset.emoji;
      });
    });
  }

  /* -------------------------------------------------------
     AUTO-REFRESH (update day counters every minute)
  ------------------------------------------------------- */
  function startAutoRefresh() {
    setInterval(() => {
      const panel = document.getElementById('panel-daysmatter');
      if (panel && panel.classList.contains('active')) renderList();
    }, 60000);
  }

  /* -------------------------------------------------------
     INIT
  ------------------------------------------------------- */
  function init() {
    load();
    renderList();
    initEmojiPicker();
    startAutoRefresh();
  }

  window.DMModule = {
    init,
    populateForm,
    resetForm,
    handleFormSubmit,
    renderList,
  };

})();
