'use strict';

/* =========================================================
   pages/home.js — главная: выбор класса + быстрые действия
   ========================================================= */

(function initHomePage() {
  UI.initHeader();
  UI.checkResume();

  // Сетка классов 1–11
  const grid = document.getElementById('gradeGrid');
  grid.innerHTML = Array.from({ length: 11 }, (_, i) => i + 1).map(grade => `
    <a class="class-card" href="grade.html?grade=${grade}" aria-label="${grade} класс">
      <span class="class-num">${grade}</span>
      <span class="class-label">класс</span>
    </a>`).join('');

  // Быстрые действия
  document.getElementById('quickGames').addEventListener('click', () => Router.toGames());
  document.getElementById('quickProfile').addEventListener('click', () => Router.toProfile());

  // Мини-статистика
  const s = App.state;
  document.getElementById('homeStats').innerHTML = `
    <div class="stat-box"><div class="value">${s.testsCompleted}</div><div class="label">Тестов пройдено</div></div>
    <div class="stat-box"><div class="value">${s.bestGrade ?? '—'}</div><div class="label">Лучшая оценка</div></div>
    <div class="stat-box"><div class="value">${s.totalCorrect}</div><div class="label">Правильных ответов</div></div>
    <div class="stat-box"><div class="value">${s.xp}</div><div class="label">XP</div></div>`;
})();
