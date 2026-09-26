'use strict';

/* =========================================================
   router.js — переходы между страницами (многостраничный сайт)
   Страницы: index.html (классы) → grade.html (предметы) →
   subject.html (тесты) → quiz.html (тест), games.html, profile.html
   ========================================================= */

const Router = {
  /** Параметры текущего URL (?grade=5&subject=russian). */
  params() {
    return new URLSearchParams(window.location.search);
  },

  /** Переход на страницу с параметрами. */
  go(page, params = {}) {
    const q = new URLSearchParams(params).toString();
    window.location.href = page + (q ? '?' + q : '');
  },

  /* Шорткаты для типовых переходов */
  toHome() { this.go('index.html'); },
  toGrade(grade) { this.go('grade.html', { grade }); },
  toSubject(grade, subjectId) { this.go('subject.html', { grade, subject }); },
  toQuiz(testId) { this.go('quiz.html', { test: testId }); },
  toGames() { this.go('games.html'); },
  toProfile() { this.go('profile.html'); },

  /** Предмет по id (или null). */
  subject(id) {
    return SUBJECTS.find(s => s.id === id) || null;
  },

  /** Тесты предмета для класса. */
  testsFor(subjectId, grade) {
    return TESTS.filter(t => t.subjectId === subjectId && t.grade === Number(grade));
  }
};
