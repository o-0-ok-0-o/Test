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
  toSubject(grade, subjectId) { this.go('subject.html', { grade, subject: subjectId }); },
  toQuiz(testId, mode = 'exam', topicId = '') { this.go('quiz.html', { test: testId, mode, topic: topicId }); },
  toPractice(topicId, questionIds = []) { this.go('quiz.html', { practice: topicId, mode: 'learn', topic: topicId, ...(questionIds.length ? { retry: questionIds.join(',') } : {}) }); },
  toTopic(topicId) { this.go('topic.html', { topic: topicId }); },
  toGames() { this.go('games.html'); },
  toProfile() { this.go('profile.html'); },
  toResults() { this.go('results.html'); },
  toMistakes() { this.go('mistakes.html'); },

  /** Предмет по id (или null). */
  subject(id) {
    return SUBJECTS.find(s => s.id === id) || null;
  },

  /** Тесты предмета для класса. */
  testsFor(subjectId, grade) {
    return TESTS.filter(t => t.subjectId === subjectId && t.grade === Number(grade));
  }
};
