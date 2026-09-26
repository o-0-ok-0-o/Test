'use strict';

/* =========================================================
   storage.js — состояние приложения и LocalStorage
   ========================================================= */

const STORAGE_KEY = 'uchimsya-legko-v1';

const DEFAULT_STATE = {
  xp: 0,              // опыт
  testsCompleted: 0,  // пройдено тестов
  bestScore: 0,       // лучший результат (вопросов)
  bestGrade: null,    // лучшая оценка
  grades: [],         // все оценки
  totalCorrect: 0,    // всего правильных ответов
  achievements: [],   // id полученных достижений
  theme: 'light',     // тема: 'light' | 'dark'
  testStats: {},      // лучшие результаты ПО ТЕСТАМ: { testId: {best, bestGrade, count} }
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

  /** Оценка по 5-балльной шкале (для 20 вопросов). */
  gradeFor(correct, total) {
    const ratio = correct / total;
    if (ratio >= 0.9) return 5;
    if (ratio >= 0.7) return 4;
    if (ratio >= 0.5) return 3;
    if (ratio >= 0.3) return 2;
    return 1;
  },

  /** Сброс прогресса (тема сохраняется). */
  reset() {
    const theme = this.state.theme;
    this.state = Object.assign({}, DEFAULT_STATE, { theme });
    saveState();
  }
};
