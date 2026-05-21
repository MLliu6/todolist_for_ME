/**
 * quadrant.js — Four-quadrant interactive picker
 *
 * Visual: A 2×2 grid. Each quadrant contains floating dot-particles
 * representing existing tasks in that quadrant.
 * When the user hovers/drags inside the picker, all particles
 * are gently attracted toward the cursor (like Starbucks stars),
 * but are constrained within their own quadrant.
 * Clicking a quadrant selects it as the task's priority.
 *
 * Exposes: window.QuadrantModule
 */

(function () {
  'use strict';

  /* -------------------------------------------------------
     QUADRANT METADATA
  ------------------------------------------------------- */
  const QUADRANTS = [
    { id: 'q1', label: '紧急且重要', sub: 'Do First', col: 1, row: 1 },
    { id: 'q2', label: '重要不紧急', sub: 'Schedule',  col: 2, row: 1 },
    { id: 'q3', label: '紧急不重要', sub: 'Delegate',  col: 1, row: 2 },
    { id: 'q4', label: '不紧急不重要', sub: 'Eliminate', col: 2, row: 2 },
  ];

  /* particles per quadrant — represents tasks already in that quadrant */
  const PARTICLES_PER_Q = 6;  // base dots; more are added dynamically
  const ATTRACTION_STRENGTH = 0.35;  // 0–1: how strongly particles move toward cursor
  const RETURN_STRENGTH     = 0.08;  // how strongly they drift back to origin
  const MAX_PULL_RADIUS     = 120;   // px: cursor influence radius

  /* -------------------------------------------------------
     STATE
  ------------------------------------------------------- */
  let selected   = 'q2';
  let pickerEl   = null;
  let particles  = [];   // { el, qId, ox, oy, cx, cy, vx, vy }
  let cursor     = { x: -9999, y: -9999 };
  let rafId      = null;
  let pickerRect = null;

  /* -------------------------------------------------------
     BUILD DOM
  ------------------------------------------------------- */
  function buildPicker(container) {
    pickerEl = container;
    pickerEl.innerHTML = '';
    pickerEl.style.position = 'relative';
    particles = [];

    // Axis labels
    const axisX = document.createElement('div');
    axisX.className = 'qp-axis qp-axis--x';
    axisX.innerHTML = '<span>不紧急</span><div class="qp-axis__line"></div><span>紧急</span>';
    pickerEl.appendChild(axisX);

    const axisY = document.createElement('div');
    axisY.className = 'qp-axis qp-axis--y';
    axisY.innerHTML = '<span>重要</span><div class="qp-axis__line"></div><span>不重要</span>';
    pickerEl.appendChild(axisY);

    // Quadrant cells
    QUADRANTS.forEach(q => {
      const cell = document.createElement('div');
      cell.className = `qp-cell qp-cell--${q.id}${selected === q.id ? ' selected' : ''}`;
      cell.dataset.qid = q.id;
      cell.setAttribute('role', 'radio');
      cell.setAttribute('aria-checked', selected === q.id);
      cell.setAttribute('aria-label', q.label);
      cell.tabIndex = 0;

      // Label
      const lbl = document.createElement('div');
      lbl.className = 'qp-cell__label';
      lbl.innerHTML = `<strong>${q.label}</strong><em>${q.sub}</em>`;
      cell.appendChild(lbl);

      // Particle canvas layer
      const particleLayer = document.createElement('div');
      particleLayer.className = 'qp-particles';
      cell.appendChild(particleLayer);

      // Create initial particles
      for (let i = 0; i < PARTICLES_PER_Q; i++) {
        addParticle(particleLayer, q.id);
      }

      pickerEl.appendChild(cell);
    });

    // Crosshair
    const cross = document.createElement('div');
    cross.className = 'qp-cross';
    pickerEl.appendChild(cross);

    // Events
    pickerEl.addEventListener('mousemove', onMouseMove);
    pickerEl.addEventListener('mouseleave', onMouseLeave);
    pickerEl.addEventListener('click', onCellClick);
    pickerEl.addEventListener('keydown', onKeydown);

    // Start animation loop
    startLoop();
  }

  function addParticle(layer, qId) {
    const dot = document.createElement('div');
    dot.className = 'qp-dot';

    // Random position within the layer (as %)
    const px = 15 + Math.random() * 70;  // 15%–85%
    const py = 20 + Math.random() * 60;
    dot.style.left = px + '%';
    dot.style.top  = py + '%';

    layer.appendChild(dot);
    particles.push({ el: dot, qId, px, py, ox: px, oy: py, vx: 0, vy: 0 });
  }

  /* -------------------------------------------------------
     ANIMATION LOOP (GSAP-free fallback: pure rAF)
     We use GSAP only if available; otherwise pure CSS transforms.
  ------------------------------------------------------- */
  function startLoop() {
    if (rafId) cancelAnimationFrame(rafId);
    tick();
  }

  function stopLoop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  function tick() {
    rafId = requestAnimationFrame(tick);
    updateParticles();
  }

  function updateParticles() {
    if (!pickerEl) return;

    // Lazily measure cells
    const cells = {};
    pickerEl.querySelectorAll('.qp-cell').forEach(cell => {
      cells[cell.dataset.qid] = cell.getBoundingClientRect();
    });

    particles.forEach(p => {
      const cellRect = cells[p.qId];
      if (!cellRect) return;

      const layer = p.el.parentElement;
      const layerRect = layer.getBoundingClientRect();

      // Current absolute position of particle
      const absPx = layerRect.left + (p.px / 100) * layerRect.width;
      const absPy = layerRect.top  + (p.py / 100) * layerRect.height;

      // Vector from particle to cursor
      const dx = cursor.x - absPx;
      const dy = cursor.y - absPy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < MAX_PULL_RADIUS && dist > 1) {
        // Attraction force (falls off with distance)
        const force = (1 - dist / MAX_PULL_RADIUS) * ATTRACTION_STRENGTH;
        p.vx += (dx / dist) * force * 2.5;
        p.vy += (dy / dist) * force * 2.5;
      }

      // Spring back toward origin
      const toOriginX = p.ox - p.px;
      const toOriginY = p.oy - p.py;
      p.vx += toOriginX * RETURN_STRENGTH;
      p.vy += toOriginY * RETURN_STRENGTH;

      // Damping
      p.vx *= 0.78;
      p.vy *= 0.78;

      // Update position (in % units relative to layer size)
      const layerW = layerRect.width  || 1;
      const layerH = layerRect.height || 1;
      p.px += (p.vx / layerW) * 100;
      p.py += (p.vy / layerH) * 100;

      // Clamp within layer bounds (with padding)
      const pad = 8;
      const maxPx = 100 - (pad / layerW * 100);
      const maxPy = 100 - (pad / layerH * 100);
      const minP  = pad / Math.min(layerW, layerH) * 100;
      p.px = Math.max(minP, Math.min(maxPx, p.px));
      p.py = Math.max(minP, Math.min(maxPy, p.py));

      p.el.style.left = p.px + '%';
      p.el.style.top  = p.py + '%';
    });
  }

  /* -------------------------------------------------------
     EVENTS
  ------------------------------------------------------- */
  function onMouseMove(e) {
    cursor.x = e.clientX;
    cursor.y = e.clientY;
  }

  function onMouseLeave() {
    cursor.x = -9999;
    cursor.y = -9999;
  }

  function onCellClick(e) {
    const cell = e.target.closest('.qp-cell');
    if (!cell) return;
    setSelected(cell.dataset.qid);
  }

  function onKeydown(e) {
    const cell = e.target.closest('.qp-cell');
    if (!cell) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelected(cell.dataset.qid);
    }
  }

  /* -------------------------------------------------------
     SET SELECTED
  ------------------------------------------------------- */
  function setSelected(qId) {
    selected = qId;

    // Update hidden input
    const input = document.getElementById('task-quadrant');
    if (input) input.value = qId;

    // Update cell styles
    pickerEl?.querySelectorAll('.qp-cell').forEach(cell => {
      const isActive = cell.dataset.qid === qId;
      cell.classList.toggle('selected', isActive);
      cell.setAttribute('aria-checked', isActive);
    });

    // Burst animation: scatter particles in selected quadrant
    if (window.gsap) {
      particles
        .filter(p => p.qId === qId)
        .forEach(p => {
          gsap.to(p.el, {
            scale: 1.6,
            opacity: 1,
            duration: 0.18,
            ease: 'back.out(2)',
            onComplete: () => gsap.to(p.el, { scale: 1, opacity: 0.7, duration: 0.4 }),
          });
        });
    }
  }

  /* -------------------------------------------------------
     SYNC TASK COUNT DOTS
     Call this whenever tasks change so each quadrant shows
     the right number of particles.
  ------------------------------------------------------- */
  function syncTaskCounts(allTasks) {
    if (!pickerEl) return;
    const counts = { q1: 0, q2: 0, q3: 0, q4: 0 };
    allTasks.forEach(t => { if (counts[t.quadrant] !== undefined) counts[t.quadrant]++; });

    QUADRANTS.forEach(q => {
      const cell = pickerEl.querySelector(`.qp-cell--${q.id}`);
      if (!cell) return;
      const layer = cell.querySelector('.qp-particles');
      if (!layer) return;

      const current = particles.filter(p => p.qId === q.id).length;
      const target  = Math.min(Math.max(counts[q.id], 3), 12); // 3–12 dots

      // Add missing
      for (let i = current; i < target; i++) addParticle(layer, q.id);

      // Remove excess
      if (current > target) {
        const toRemove = particles.filter(p => p.qId === q.id).slice(target);
        toRemove.forEach(p => { p.el.remove(); });
        particles = particles.filter(p => !toRemove.includes(p));
      }
    });
  }

  /* -------------------------------------------------------
     INIT
  ------------------------------------------------------- */
  function init() {
    const container = document.getElementById('quadrant-picker');
    if (!container) return;
    buildPicker(container);

    // Sync dots with current task data
    if (window.TasksModule) syncTaskCounts(TasksModule.getAllTasks());
  }

  /* Rebuild picker when task modal opens (so dot counts are fresh) */
  document.addEventListener('DOMContentLoaded', () => {
    // Watch for modal opening
    const observer = new MutationObserver(() => {
      const modal = document.getElementById('modal-task');
      if (modal && modal.classList.contains('open')) {
        if (!pickerEl) init();
        else if (window.TasksModule) syncTaskCounts(TasksModule.getAllTasks());
      }
    });
    const modal = document.getElementById('modal-task');
    if (modal) observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
  });

  window.QuadrantModule = {
    init,
    setSelected,
    syncTaskCounts,
    stopLoop,
  };

})();
