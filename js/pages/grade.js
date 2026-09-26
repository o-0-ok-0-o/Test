'use strict';

/* =========================================================
   pages/grade.js — страница класса: список предметов
   URL: grade.html?grade=5
   ========================================================= */

(function initGradePage() {
  UI.initHeader();
  UI.checkResume();

  // Кнопка «Назад» — на главную
  document.getElementById('pageBack').addEventListener('click', () => Router.toHome());

  const grade = Number(Router.params().get('grade'));
  if (!grade || grade < 1 || grade > 11) { Router.toHome(); return; }

  document.getElementById('gradeTitle').textContent = `${grade} класс`;
  document.getElementById('gradeSubtitle').textContent =
    'Выбери предмет, чтобы увидеть доступные тесты';

  // Хлебные крошки
  document.getElementById('crumbGrade').textContent = `${grade} класс`;

  // Предметы, которые изучаются в этом классе
  const subjects = SUBJECTS.filter(s => s.grades.includes(grade));
  const grid = document.getElementById('subjectGrid');

  grid.innerHTML = subjects.map(subj => {
    const tests = Router.testsFor(subj.id, grade);
    const hasTests = tests.length > 0;
    return `<a class="card subject-card ${hasTests ? '' : 'soon'}"
      href="subject.html?grade=${grade}&subject=${subj.id}">
      <span class="subject-icon">${icon(subj.icon, 'ic-lg')}</span>
      <div class="subject-body">
        <h3>${subj.title}</h3>
        <p class="muted">${subj.desc}</p>
        <p class="subject-meta">${hasTests
          ? `${icon('quiz', 'ic-sm')} Тестов: ${tests.length}`
          : `${icon('clock', 'ic-sm')} Тесты скоро появятся`}</p>
      </div>
      ${hasTests ? '' : '<span class="soon-badge">Скоро</span>'}
    </a>`;
  }).join('');
})();
