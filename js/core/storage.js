'use strict';

/* =========================================================
   storage.js — состояние приложения и LocalStorage
   ========================================================= */

const STORAGE_KEY = 'uchimsya-legko-v1';

const DEFAULT_STATE = {
  xp: 0,              // опыт
  testsCompleted: 0,  // пройдено тестов
  bestScore: 0,       // лучший результат (из 20)
  bestGrade: null,    // лучшая оценка
  grades: [],         // все оценки
  totalCorrect: 0,    // всего правильных ответов
  achievements: [],   // id полученных достижений
  theme: 'light',     // тема: 'light' | 'dark'
  currentQuiz: null   // сохранённый прогресс незавершённого теста
};

/** Загружает состояние из LocalStorage или возвращает дефолтное. */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? Object.assign({}, DEFAULT_STATE, JSON.parse(raw)) : Object.assign({}, DEFAULT_STATE);
  } catch (e) {
    return Object.assign({}, DEFAULT_STATE);
  }
}

/** Сохраняет состояние в LocalStorage (безопасно). */
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(App.state)); } catch (e) { /* игнорируем */ }
}

/**
 * Пространство имён приложения.
 * Все модули работают с App.state и его вспомогательными методами.
 */
const App = {
  state: loadState(),

  /** Добавляет опыт и обновляет бейдж. silent=true — без тоста. */
  addXP(amount, silent = false) {
    this.state.xp += amount;
    saveState();
    UI.updateXPBadge();
    if (!silent) UI.showToast(`+${amount} XP`);
  },

  /** Разблокирует достижение (однократно). */
  unlockAchievement(id) {
    if (this.state.achievements.includes(id)) return;
    this.state.achievements.push(id);
    saveState();
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (ach) UI.showToast(`${icon(ach.icon, 'ic-sm')} Достижение: ${ach.name}!`);
  },

  /** Оценка по 5-балльной шкале. */
  gradeFor(correct, total) {
    if (correct >= 18) return 5;
    if (correct >= 14) return 4;
    if (correct >= 10) return 3;
    if (correct >= 6) return 2;
    return 1;
  }
};
