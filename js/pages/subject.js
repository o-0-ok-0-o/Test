'use strict';

/* =========================================================
   pages/subject.js — страница предмета: список тестов
   URL: subject.html?grade=5&subject=russian
   Теория открывается в модальном окне.
   ========================================================= */

(function initSubjectPage() {
  UI.initHeader();
  UI.checkResume();

  const params = Router.params();
  const grade = Number(params.get('grade'));
  const subjectId = params.get('subject');
  const subject = Router.subject(subjectId);

  // Кнопка «Назад» — к списку предметов этого класса
  document.getElementById('pageBack').addEventListener('click', () => Router.toGrade(grade));

  if (!subject || !grade) { Router.toHome(); return; }

  document.getElementById('subjectTitle').textContent = subject.title;
  document.getElementById('subjectSubtitle').textContent =
    `${grade} класс — выбери тест для тренировки`;
  document.getElementById('crumbGrade').textContent = `${grade} класс`;
  document.getElementById('crumbGrade').href = `grade.html?grade=${grade}`;
  document.getElementById('crumbSubject').textContent = subject.title;

  const tests = Router.testsFor(subject.id, grade);
  const list = document.getElementById('testList');

  if (!tests.length) {
    list.innerHTML = `<div class="card empty-card">
      <p class="muted">Для «${subject.title}» в ${grade} классе тесты скоро появятся.</p>
      <button class="btn secondary" id="backToGrade">Выбрать другой предмет</button>
    </div>`;
    document.getElementById('backToGrade').addEventListener('click', () => Router.toGrade(grade));
    return;
  }

  list.innerHTML = tests.map(test => {
    const ts = App.state.testStats[test.id];
    const best = ts ? `${ts.best}/${test.questions.length}` : '—';
    return `<article class="card test-card">
      <div class="test-info">
        <h3>${test.title}</h3>
        <p class="muted">${test.desc}</p>
        <div class="test-meta">
          <span class="test-meta-item">${icon('quiz', 'ic-sm')} ${test.questions.length} вопросов</span>
          <span class="test-meta-item">${UI.difficultyDots(test.difficulty || 3)}</span>
          <span class="test-meta-item">${icon('trophy', 'ic-sm')} Лучший: ${best}</span>
        </div>
      </div>
      <div class="test-actions">
        ${test.theoryHtml ? `<button class="btn ghost btn-theory" data-theory="${test.id}">${icon('bulb', 'ic-sm')} Теория</button>` : ''}
        <button class="btn primary" data-start="${test.id}">Начать ${icon('arrow-right', 'ic-sm')}</button>
      </div>
    </article>`;
  }).join('');

  // Делегирование кликов
  list.addEventListener('click', (e) => {
    const startBtn = e.target.closest('[data-start]');
    if (startBtn) { Router.toQuiz(startBtn.dataset.start); return; }

    const theoryBtn = e.target.closest('[data-theory]');
    if (theoryBtn) {
      const test = tests.find(t => t.id === theoryBtn.dataset.theory);
      if (!test) return;
      // Теория — в отдельном окошке (модалка)
      UI.showModal(`
        <div class="theory-modal-head">
          <h3>${icon('bulb', 'ic-sm')} Теория: ${test.title}</h3>
          <button class="icon-btn" data-close aria-label="Закрыть">${icon('cross', 'ic-sm')}</button>
        </div>
        <div class="theory-modal-body">${test.theoryHtml}</div>
        <button class="btn primary full" data-close>Понятно, к тесту!</button>`);
    }
  });
})();
