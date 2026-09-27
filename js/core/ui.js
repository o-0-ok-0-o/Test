'use strict';

/* =========================================================
   ui.js — общие элементы всех страниц: шапка, тема, тосты,
   модалки, конфетти, возобновление теста
   ========================================================= */

const UI = {
  /* ---------- Шапка и навигация ---------- */

  /** Инициализация шапки: тема, XP, активный пункт навигации. */
  initHeader() {
    this.applyTheme();
    this.updateXPBadge();
    const level = App.levelInfo();
    const levelEl = document.getElementById('headerLevel');
    const streakEl = document.getElementById('headerStreak');
    if (levelEl) levelEl.textContent = `Ур. ${level.level}`;
    if (streakEl) streakEl.textContent = App.state.activity.streak || 0;

    document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

    // Активный пункт навигации по data-page на <body>
    const page = document.body.dataset.page;
    document.querySelectorAll('[data-nav]').forEach(el => {
      if (el.dataset.nav === page) el.classList.add('active');
      else el.classList.remove('active');
    });
  },

  /* ---------- Тема ---------- */

  applyTheme() {
    document.documentElement.dataset.theme = App.state.profile.theme;
    const t = document.getElementById('themeIcon');
    if (t) t.innerHTML = `<use href="#icon-${App.state.profile.theme === 'dark' ? 'sun' : 'moon'}"/>`;
  },

  toggleTheme() {
    App.state.profile.theme = App.state.profile.theme === 'dark' ? 'light' : 'dark';
    saveState();
    this.applyTheme();
  },

  /* ---------- XP ---------- */

  updateXPBadge() {
    const el = document.getElementById('xpValue');
    if (el) el.textContent = App.state.profile.xp;
    const level = App.levelInfo();
    const levelEl = document.getElementById('headerLevel');
    const streakEl = document.getElementById('headerStreak');
    if (levelEl) levelEl.textContent = `Ур. ${level.level}`;
    if (streakEl) streakEl.textContent = App.state.activity.streak || 0;
  },

  /* ---------- Тосты ---------- */

  showToast(text) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerHTML = text;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 2600);
  },

  /* ---------- Модальные окна ---------- */

  /** Показывает модалку. Возвращает overlay (для закрытия: overlay.remove()). */
  showModal(html, { closable = true } = {}) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
    document.body.appendChild(overlay);

    if (closable) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
      });
      // Кнопки закрытия внутри модалки
      overlay.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => overlay.remove());
      });
    }
    return overlay;
  },

  /** Модалка «Продолжить тест?» — вызывается на любой странице. */
  checkResume() {
    const saved = App.state.progress.currentQuiz;
    if (!saved) return;
    const test = TESTS.find(t => t.id === saved.testId);
    const topic = saved.topicId && COURSE_TOPICS.find(item => item.id === saved.topicId);
    if (!test && !topic) { App.state.progress.currentQuiz = null; saveState(); return; }

    const total = saved.questionIds.length;
    const overlay = this.showModal(`
      <h3>Продолжить тест?</h3>
      <p class="muted">Материал «${test?.title || topic.title}». Ты остановился на вопросе ${saved.index + 1} из ${total}.</p>
      <div class="btn-row">
        <button class="btn primary" id="resumeYes">Продолжить</button>
        <button class="btn ghost" id="resumeNo">Начать заново</button>
      </div>`, { closable: false });

    document.getElementById('resumeYes').addEventListener('click', () => {
      overlay.remove();
      if (saved.practice) Router.toPractice(saved.topicId, saved.questionIds);
      else Router.toQuiz(saved.testId, saved.mode, saved.topicId);
    });
    document.getElementById('resumeNo').addEventListener('click', () => {
      overlay.remove();
      App.state.progress.currentQuiz = null;
      saveState();
    });
  },

  /* ---------- Конфетти (за идеальный результат) ---------- */

  launchConfetti() {
    const layer = document.getElementById('confettiLayer');
    if (!layer) return;
    const colors = ['#6c5ce7', '#27ae60', '#f5b301', '#e74c3c', '#0984e3'];
    for (let i = 0; i < 28; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.background = colors[i % colors.length];
      piece.style.animationDuration = (2 + Math.random() * 2) + 's';
      piece.style.animationDelay = (Math.random() * 0.6) + 's';
      layer.appendChild(piece);
      setTimeout(() => piece.remove(), 5000);
    }
  },

  /* ---------- Общие хелперы ---------- */

  /** Точки сложности (1..5). */
  difficultyDots(level) {
    let out = `<span class="difficulty" role="img" aria-label="Сложность ${level} из 5">`;
    for (let i = 1; i <= 5; i++) out += `<span class="dot ${i <= level ? 'on' : ''}"></span>`;
    return out + '</span>';
  }
};
