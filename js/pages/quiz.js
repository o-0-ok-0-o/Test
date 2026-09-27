'use strict';

/* =========================================================
   pages/quiz.js — инициализация страницы теста
   URL: quiz.html?test=pronouns
   Если есть сохранённый прогресс этого теста — продолжает его.
   ========================================================= */

(function initQuizPage() {
  UI.initHeader();
  Quiz.init();

  const params = Router.params();
  const testId = params.get('test');
  const topicId = params.get('topic') || params.get('practice');
  const mode = params.get('mode') || App.state.profile.learningMode || 'exam';
  const saved = App.state.progress.currentQuiz;
  const topic = topicId && COURSE_TOPICS.find(item => item.id === topicId);

  if (saved && saved.testId === (testId || null) && saved.topicId === topicId && Quiz._restore(saved)) {
    Quiz._render();
    Quiz._show('quiz');
    UI.showToast('Продолжаем с того места, где ты остановился');
  } else if (params.has('practice') && topic) {
    const retryIds = (params.get('retry') || '').split(',').filter(Boolean);
    const questionBank = [...topic.practiceQuestions, ...topic.tests.flatMap(test => test.questions || [])];
    const retryQuestions = retryIds.length ? questionBank.filter(question => retryIds.includes(String(question.id))) : topic.practiceQuestions;
    Quiz.start(null, retryQuestions, { practice: true, mode: 'learn', topicId: topic.id });
  } else {
    Quiz.start(testId, null, { mode, topicId });
  }

  // Горячие клавиши теста, не перехватывая ввод в полях ответа.
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && Quiz.active) { Quiz.exit(); return; }
    if (document.getElementById('screen-quiz').hidden) return;
    const editing = event.target.matches('input, textarea, select, [contenteditable="true"]');
    if (editing && !['Enter', 'Escape'].includes(event.key)) return;
    const letterKeys = { a: 1, b: 2, c: 3, d: 4 };
    const number = Number(event.key) || letterKeys[event.key.toLowerCase()];
    if (number >= 1 && number <= 9) {
      const button = document.getElementById('questionCard').querySelectorAll('.answer-btn')[number - 1];
      if (button && !button.disabled) button.click();
    } else if (event.key === 'Enter' || event.code === 'Space') {
      const nextButton = document.getElementById('nextBtn');
      if (nextButton && !nextButton.disabled) {
        event.preventDefault();
        nextButton.click();
      }
    }
  });

  // «К результату» на экране разбора
  document.getElementById('backToResult').addEventListener('click', () => Quiz._show('result'));
})();
