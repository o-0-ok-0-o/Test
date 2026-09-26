'use strict';

/* =========================================================
   ui.js — навигация по экранам, тосты, тема, XP-бейдж, конфетти
   ========================================================= */

const SCREENS = ['home', 'theory', 'quiz', 'result', 'review', 'games', 'progress'];

const UI = {
  /** Показывает экран по имени и обновляет активную навигацию. */
  showScreen(name) {
    SCREENS.forEach(s => {
      const el = document.getElementById('screen-' + s);
      el.classList.toggle('active', s === name);
      el.hidden = s !== name;
    });
    document.querySelectorAll('.nav-item').forEach(b =>
      b.classList.toggle('active', b.dataset.nav === name));
    window.scrollTo({ top: 0 });
  },

  /** Всплывающее уведомление. */
  showToast(text) {
    const toast = document.getElementById('toast');
    toast.innerHTML = text;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 2600);
  },

  /** Обновляет бейдж XP в шапке. */
  updateXPBadge() {
    document.getElementById('xpValue').textContent = App.state.xp;
  },

  /** Применяет сохранённую тему. */
  applyTheme() {
    document.documentElement.dataset.theme = App.state.theme;
    document.getElementById('themeIcon').innerHTML =
      `<use href="#icon-${App.state.theme === 'dark' ? 'sun' : 'moon'}"/>`;
  },

  /** Переключает светлую/тёмную тему. */
  toggleTheme() {
    App.state.theme = App.state.theme === 'dark' ? 'light' : 'dark';
    saveState();
    this.applyTheme();
  },

  /** Лёгкие конфетти за идеальный результат (без библиотек). */
  launchConfetti() {
    const layer = document.getElementById('confettiLayer');
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

  /** Показывает модальное окно (используется для «Продолжить тест?»). */
  showModal(html) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal">${html}</div>`;
    document.body.appendChild(overlay);
    return overlay;
  },

  /** Инициализация общих обработчиков интерфейса. */
  init() {
    // Нижняя навигация
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.nav;
        if (target === 'quiz' && !Quiz.active) {
          this.showScreen('home');
          this.showToast('Нажми «Начать тренировку» на главной');
          return;
        }
        this.showScreen(target);
      });
    });

    // Кнопки с data-action
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'theory') this.showScreen('theory');
        else if (action === 'start') Quiz.start();
        else if (action === 'home') { Progress.renderHomeStats(); this.showScreen('home'); }
        else if (action === 'result') this.showScreen('result');
      });
    });

    // Переключатель темы
    document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

    // Клавиатура: 1–4 выбирают вариант в тесте
    document.addEventListener('keydown', (e) => {
      const quizScreen = document.getElementById('screen-quiz');
      if (!quizScreen.classList.contains('active')) return;
      const n = Number(e.key);
      if (n >= 1 && n <= 4) {
        const btn = document.getElementById('questionCard').querySelectorAll('.answer-btn')[n - 1];
        if (btn && !btn.disabled) btn.click();
      }
    });
  }
};
