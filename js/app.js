'use strict';

/* =========================================================
   app.js — точка входа: инициализация всех модулей
   ========================================================= */

(function initApp() {
  // Общие элементы интерфейса (навигация, тема, клавиатура)
  UI.init();

  // Функциональные модули
  Quiz.init();
  Games.init();
  Progress.init();

  // Начальное состояние интерфейса
  UI.applyTheme();
  UI.updateXPBadge();
  Progress.renderHomeStats();
  Progress.renderScreen();

  // Если тест был прерван — предлагаем продолжить
  checkResume();
})();

/** Показывает окно «Продолжить тест?» при наличии сохранённого прогресса. */
function checkResume() {
  const saved = App.state.currentQuiz;
  if (!saved) return;

  const total = saved.questionIds.length;
  const overlay = UI.showModal(`
    <h3 style="margin-bottom:8px">Продолжить тест?</h3>
    <p class="muted" style="margin-bottom:14px">Ты остановился на вопросе ${saved.index + 1} из ${total}.</p>
    <div class="btn-row">
      <button class="btn primary" id="resumeYes">Продолжить</button>
      <button class="btn ghost" id="resumeNo">Начать заново</button>
    </div>`);

  document.getElementById('resumeYes').addEventListener('click', () => {
    overlay.remove();
    if (Quiz._restore(saved)) {
      Quiz._render();
      UI.showScreen('quiz');
    }
  });

  document.getElementById('resumeNo').addEventListener('click', () => {
    overlay.remove();
    App.state.currentQuiz = null;
    saveState();
  });
}
