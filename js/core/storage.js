'use strict';

/* =========================================================
   storage.js — состояние приложения и LocalStorage.
   Схема v2: данные разложены по отдельным JSON-ключам
   с версионированием и автоматической миграцией с v1.

   Ключи:
     ul:profile    — профиль, XP, уровни, настройки
     ul:activity   — календарь, серия, ежедневные задания
     ul:progress   — освоение тем и лучшие результаты тестов
     ul:mistakes   — журнал ошибок (вопросы с датами и контекстом)
     ul:achievements — полученные достижения
   ========================================================= */

const STORAGE_VERSION = 2;

/* Ключи новой схемы (v2). */
const STORAGE_KEYS = {
  profile: 'ul:profile',
  activity: 'ul:activity',
  progress: 'ul:progress',
  mistakes: 'ul:mistakes',
  achievements: 'ul:achievements'
};

/* Устаревший монолитный ключ v1 — читается один раз при миграции. */
const LEGACY_STORAGE_KEY = 'uchimsya-legko-v1';

const DEFAULT_PROFILE = {
  name: 'Ученик',
  xp: 0,
  theme: 'light',
  soundEnabled: false,
  learningMode: 'exam',
  selectedGrade: null
};

const DEFAULT_ACTIVITY = {
  days: [],            // ISO-даты активных дней
  streak: 0,
  studySeconds: 0,
  dailyQuest: null,    // { date, target, progress, claimed }
  gameXPByDay: {}
};

const DEFAULT_PROGRESS = {
  testsCompleted: 0,
  totalCorrect: 0,
  bestScore: 0,
  bestGrade: null,
  grades: [],          // все полученные оценки
  testStats: {},       // { testId: { best, bestGrade, count, lastAt } }
  topicProgress: {},   // { topicId: { completedQuestions, mastered, mistakes, tests } }
  xpClaims: [],        // уникальные награды за ответы и тесты
  currentQuiz: null    // сохранённый прогресс незавершённого теста
};

const DEFAULT_MISTAKES = {
  // { [questionId]: { questionId, topicId, testId, text, correctAnswer,
  //                   userAnswer, explanation, count, firstAt, lastAt } }
  entries: {}
};

const DEFAULT_ACHIEVEMENTS = {
  unlocked: [],        // id достижений
  dates: {}            // { id: ISO-дата }
};

/** Одноразовая миграция монолитного v1 в схему v2. */
function migrateLegacyState() {
  let legacy = null;
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) legacy = JSON.parse(raw);
  } catch (error) { legacy = null; }
  if (!legacy) return;

  StorageService.save(STORAGE_KEYS.profile, {
    ...DEFAULT_PROFILE,
    name: legacy.profileName || DEFAULT_PROFILE.name,
    xp: legacy.xp || 0,
    theme: legacy.theme || 'light',
    soundEnabled: !!legacy.soundEnabled,
    learningMode: legacy.learningMode || 'exam',
    selectedGrade: legacy.selectedGrade ?? null
  });

  StorageService.save(STORAGE_KEYS.activity, {
    ...DEFAULT_ACTIVITY,
    days: legacy.activityDays || [],
    streak: legacy.streak || 0,
    studySeconds: legacy.studySeconds || 0,
    dailyQuest: legacy.dailyQuest || null,
    gameXPByDay: legacy.gameXPByDay || {}
  });

  StorageService.save(STORAGE_KEYS.progress, {
    ...DEFAULT_PROGRESS,
    testsCompleted: legacy.testsCompleted || 0,
    totalCorrect: legacy.totalCorrect || 0,
    bestScore: legacy.bestScore || 0,
    bestGrade: legacy.bestGrade || null,
    grades: legacy.grades || [],
    testStats: legacy.testStats || {},
    topicProgress: legacy.topicProgress || {},
    currentQuiz: legacy.currentQuiz || null
  });

  StorageService.save(STORAGE_KEYS.achievements, {
    ...DEFAULT_ACHIEVEMENTS,
    unlocked: legacy.achievements || [],
    dates: legacy.achievementDates || {}
  });

  // Ошибки в v1 хранились списками id по темам; переносим их как счётчики.
  const entries = {};
  Object.entries(legacy.mistakesByTopic || {}).forEach(([topicId, ids]) => {
    (ids || []).forEach(questionId => {
      entries[questionId] = {
        questionId, topicId, testId: null, text: null, correctAnswer: null,
        userAnswer: null, explanation: null, count: 1,
        firstAt: null, lastAt: null
      };
    });
  });
  StorageService.save(STORAGE_KEYS.mistakes, { ...DEFAULT_MISTAKES, entries });

  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

/* Миграция выполняется при загрузке модуля — до первого обращения к App. */
(function initStorage() {
  const marker = 'ul:schema-version';
  const current = Number(localStorage.getItem(marker) || 0);
  if (current < STORAGE_VERSION) {
    migrateLegacyState();
    try { localStorage.setItem(marker, String(STORAGE_VERSION)); } catch (error) { /* ignore */ }
  }
})();

/** Загружает раздел состояния с дефолтами (глубокое слияние верхнего уровня). */
function loadSection(key, fallback) {
  return StorageService.load(key, fallback);
}

/** Сохраняет состояние целиком (все разделы сразу). */
function saveState() {
  StorageService.save(STORAGE_KEYS.profile, App.state.profile);
  StorageService.save(STORAGE_KEYS.activity, App.state.activity);
  StorageService.save(STORAGE_KEYS.progress, App.state.progress);
  StorageService.save(STORAGE_KEYS.mistakes, App.state.mistakes);
  StorageService.save(STORAGE_KEYS.achievements, App.state.achievements);
}

/**
 * Пространство имён приложения.
 * Разделы состояния: profile, activity, progress, mistakes, achievements.
 */
const App = {
  state: {
    profile: loadSection(STORAGE_KEYS.profile, DEFAULT_PROFILE),
    activity: loadSection(STORAGE_KEYS.activity, DEFAULT_ACTIVITY),
    progress: loadSection(STORAGE_KEYS.progress, DEFAULT_PROGRESS),
    mistakes: loadSection(STORAGE_KEYS.mistakes, DEFAULT_MISTAKES),
    achievements: loadSection(STORAGE_KEYS.achievements, DEFAULT_ACHIEVEMENTS)
  },

  /* ---------- Совместимость (геттеры для старых обращений) ---------- */

  get xp() { return this.state.profile.xp; },
  get theme() { return this.state.profile.theme; },
  get streak() { return this.state.activity.streak; },

  /** Добавляет опыт и обновляет бейдж. silent=true — без тоста. */
  addXP(amount, silent = false) {
    this.state.profile.xp += amount;
    saveState();
    if (this.state.profile.xp >= 1000) this.unlockAchievement('thousandXP');
    if (this.state.profile.xp >= 5000) this.unlockAchievement('fiveThousandXP');
    UI.updateXPBadge();
    if (!silent) UI.showToast(`+${amount} XP`);
  },

  /** Разблокирует достижение (однократно). */
  unlockAchievement(id) {
    const unlocked = this.state.achievements.unlocked;
    if (unlocked.includes(id)) return;
    unlocked.push(id);
    this.state.achievements.dates[id] = new Date().toISOString();
    saveState();
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (ach) UI.showToast(`${icon(ach.icon, 'ic-sm')} Достижение: ${ach.name}!`);
  },

  levelInfo() {
    const thresholds = [0, 200, 500, 900, 1400, 2000, 2800];
    let level = 1;
    for (let i = 1; i < thresholds.length; i++) if (this.state.profile.xp >= thresholds[i]) level = i + 1;
    const current = thresholds[level - 1];
    const next = thresholds[level] || current + 1000;
    return { level, title: ['Новичок', 'Ученик', 'Практик', 'Знаток', 'Продвинутый', 'Эксперт', 'Мастер'][level - 1] || 'Мастер', current: this.state.profile.xp - current, needed: next - current, next };
  },

  markStudyDay() {
    const today = new Date().toISOString().slice(0, 10);
    const days = this.state.activity.days;
    if (!days.includes(today)) days.push(today);
    const sorted = days.slice().sort();
    this.state.activity.streak = 1;
    for (let index = sorted.length - 1; index > 0; index--) {
      const previous = new Date(sorted[index - 1] + 'T00:00:00');
      const current = new Date(sorted[index] + 'T00:00:00');
      if ((current - previous) / 86400000 !== 1) break;
      this.state.activity.streak++;
    }
    if (this.state.activity.streak >= 5) this.unlockAchievement('fiveDays');
    if (this.state.activity.streak >= 10) this.unlockAchievement('tenDays');
    this._updateDailyQuest();
    saveState();
    UI.updateXPBadge();
  },

  _updateDailyQuest() {
    const today = new Date().toISOString().slice(0, 10);
    const quest = this.state.activity.dailyQuest;
    if (!quest || quest.date !== today) {
      this.state.activity.dailyQuest = { date: today, target: 10, progress: 0, claimed: false };
    }
  },

  recordAnsweredQuestion() {
    this.markStudyDay();
    this._updateDailyQuest();
    const quest = this.state.activity.dailyQuest;
    if (quest.progress < quest.target) quest.progress++;
    if (quest.progress >= quest.target && !quest.claimed) {
      quest.claimed = true;
      this.addXP(100, true);
      UI.showToast('Ежедневная цель выполнена: +100 XP');
    }
    saveState();
  },

  claimGameXP(amount) {
    const day = new Date().toISOString().slice(0, 10);
    const byDay = this.state.activity.gameXPByDay;
    const awarded = byDay[day] || 0;
    const grant = Math.min(amount, Math.max(0, 100 - awarded));
    if (grant) {
      byDay[day] = awarded + grant;
      this.addXP(grant, true);
    }
    return grant;
  },

  claimReward(actionKey, amount) {
    const day = new Date().toISOString().slice(0, 10);
    const key = `${day}:${actionKey}`;
    const claims = this.state.progress.xpClaims || (this.state.progress.xpClaims = []);
    if (claims.includes(key)) return 0;
    claims.push(key);
    this.addXP(amount, true);
    return amount;
  },

  getTopicProgress(topicId) {
    const tp = this.state.progress.topicProgress;
    if (!tp[topicId]) tp[topicId] = { completedQuestions: 0, mastered: false, mistakes: 0, tests: {} };
    return tp[topicId];
  },

  /** Записывает ошибку в журнал: текст, ответы, счётчик повторений. */
  recordMistake(question, userAnswer) {
    const entries = this.state.mistakes.entries;
    const entry = entries[question.id];
    const now = new Date().toISOString();
    if (entry) {
      entry.count++;
      entry.userAnswer = userAnswer ?? null;
      entry.lastAt = now;
    } else {
      entries[question.id] = {
        questionId: question.id,
        topicId: question.topicId || null,
        testId: question.testId || null,
        text: question.question,
        correctAnswer: this._formatCorrect(question),
        userAnswer: userAnswer ?? null,
        explanation: question.explanation || null,
        count: 1,
        firstAt: now,
        lastAt: now
      };
    }
    saveState();
  },

  /** Убирает вопрос из журнала ошибок (после верного ответа). */
  resolveMistake(questionId) {
    if (this.state.mistakes.entries[questionId]) {
      delete this.state.mistakes.entries[questionId];
      saveState();
    }
  },

  _formatCorrect(question) {
    if (question.type === 'input') {
      return Array.isArray(question.correctAnswer) ? question.correctAnswer.join(' или ') : String(question.correctAnswer);
    }
    if (Array.isArray(question.correctAnswer)) {
      return question.correctAnswer.map(i => (question.answers || [])[i]).filter(Boolean).join(', ');
    }
    return question.answers ? String(question.answers[question.correctAnswer]) : String(question.correctAnswer);
  },

  /** Оценка по 5-балльной шкале. */
  gradeFor(correct, total) {
    const ratio = correct / total;
    if (ratio >= 0.9) return 5;
    if (ratio >= 0.7) return 4;
    if (ratio >= 0.5) return 3;
    if (ratio >= 0.3) return 2;
    return 1;
  },

  /** Сброс прогресса (настройки профиля сохраняются). */
  reset() {
    const { name, theme } = this.state.profile;
    this.state.profile = { ...DEFAULT_PROFILE, name, theme };
    this.state.activity = { ...DEFAULT_ACTIVITY };
    this.state.progress = { ...DEFAULT_PROGRESS };
    this.state.mistakes = { ...DEFAULT_MISTAKES, entries: {} };
    this.state.achievements = { ...DEFAULT_ACHIEVEMENTS };
    saveState();
  }
};