'use strict';

/* =========================================================
   pages/quiz.js — инициализация страницы теста
   URL: quiz.html?test=pronouns
   Если есть сохранённый прогресс этого теста — продолжает его.
   ========================================================= */

(function initQuizPage() {
  UI.initHeader();
  Quiz.init();

  const testId = Router.params().get('test');
  const saved = App.state.currentQuiz;

  // Продолжение сохранённого теста или старт нового
  if (saved && saved.testId === testId && Quiz._restore(saved)) {
    Quiz._render();
    Quiz._show('quiz');
    UI.showToast('Продолжаем с того места, где ты остановился');
  } else {
    Quiz.start(testId);
  }

  // Клавиатура: 1–9 — выбор варианта, Enter — «Следующий вопрос»
  document.addEventListener('keydown', (e) => {
    const n = Number(e.key);
    if (n >= 1 && n <= 9) {
      const btn = document.getElementById('questionCard').querySelectorAll('.answer-btn')[n - 1];
      if (btn && !btn.disabled) btn.click();
    } else if (e.key === 'Enter') {
      const nextBtn = document.getElementById('nextBtn');
      if (nextBtn && !nextBtn.disabled && !document.getElementById('screen-quiz').hidden) nextBtn.click();
    }
  });

  // «К результату» на экране разбора
  document.getElementById('backToResult').addEventListener('click', () => Quiz._show('result'));
})();
