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
  if (!GRADES.some(item => item.id === grade)) { Router.toHome(); return; }

  document.getElementById('gradeTitle').textContent = `${grade} класс`;
  document.getElementById('gradeSubtitle').textContent =
    'Выбери предмет, чтобы увидеть доступные тесты';

  // Хлебные крошки
  document.getElementById('crumbGrade').textContent = `${grade} класс`;

  const topics = COURSE_TOPICS.filter(topic => topic.grade === grade);
  const subjects = SUBJECTS.filter(subject => topics.some(topic => topic.subjectId === subject.id));
  const stats = document.getElementById('gradeStats');
  const done = topics.filter(topic => App.state.progress.topicProgress[topic.id]?.mastered).length;
  stats.innerHTML = `<span>${subjects.length} предметов</span><span>${topics.length} тем</span><span>${done} освоено</span>`;

  const grid = document.getElementById('subjectGrid');
  grid.innerHTML = subjects.map(subject => {
    const subjectTopics = topics.filter(topic => topic.subjectId === subject.id);
    const mastered = subjectTopics.filter(topic => App.state.progress.topicProgress[topic.id]?.mastered).length;
    const testsDone = subjectTopics.reduce((count, topic) => count + topic.tests.filter(test => App.state.progress.testStats[test.id]?.count).length, 0);
    const percent = subjectTopics.length ? Math.round(mastered / subjectTopics.length * 100) : 0;
    return `<a class="card subject-card subject-${subject.color}" href="subject.html?grade=${grade}&subject=${subject.id}">
      <span class="subject-icon">${icon(subject.icon, 'ic-lg')}</span><div class="subject-body">
        <h3>${subject.title}</h3><p class="muted">${subject.desc}</p>
        <div class="subject-progress"><div class="progress"><div class="progress-fill" style="width:${percent}%"></div></div><span>${percent}%</span></div>
        <p class="subject-meta">${subjectTopics.length} тем · ${testsDone} тестов пройдено</p>
      </div>${icon('arrow-right', 'ic-sm')}</a>`;
  }).join('');
})();
