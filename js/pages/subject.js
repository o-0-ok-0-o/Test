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

  const topics = COURSE_TOPICS.filter(topic => topic.grade === grade && topic.subjectId === subject.id);
  const list = document.getElementById('testList');
  const allTests = topics.flatMap(topic => topic.tests);
  const completed = allTests.filter(test => App.state.progress.testStats[test.id]?.count).length;
  const mastered = topics.filter(topic => App.state.progress.topicProgress[topic.id]?.mastered).length;
  const attempted = allTests.filter(test => App.state.progress.testStats[test.id]);
  const average = attempted.length ? Math.round(attempted.reduce((sum, test) => sum + App.state.progress.testStats[test.id].best / test.questions.length, 0) / attempted.length * 100) : '—';
  document.getElementById('subjectOverview').innerHTML = `<div class="overview-stat"><strong>${topics.length}</strong><span>тем</span></div><div class="overview-stat"><strong>${mastered}/${topics.length}</strong><span>освоено</span></div><div class="overview-stat"><strong>${completed}/${allTests.length}</strong><span>тестов пройдено</span></div><div class="overview-stat"><strong>${average}${average === '—' ? '' : '%'}</strong><span>средний результат</span></div><div class="overview-stat"><strong>${App.state.profile.xp}</strong><span>XP всего</span></div>`;

  if (!topics.length) {
    list.innerHTML = '<div class="card empty-card"><p>Для этого класса пока нет учебных тем.</p></div>';
    return;
  }

  const sections = [...new Set(topics.map(topic => topic.section))];
  list.innerHTML = sections.map(section => {
    const sectionTopics = topics.filter(topic => topic.section === section);
    return `<section class="topic-section"><h2>${section}</h2>${sectionTopics.map((topic, index) => {
      const progress = App.state.progress.topicProgress[topic.id];
      const masteredTopic = Boolean(progress?.mastered);
      const locked = index > 0 && !App.state.progress.topicProgress[sectionTopics[index - 1].id]?.mastered;
      const state = masteredTopic ? 'Освоено' : locked ? 'Откроется после предыдущей темы' : progress ? 'Изучается' : 'Доступно';
      const percent = progress ? Math.min(100, Math.round((progress.completedQuestions || 0) / (topic.practiceQuestions.length + topic.tests.reduce((sum, test) => sum + test.questions.length, 0)) * 100)) : 0;
      const duration = Math.max(...topic.tests.map(test => test.estimatedTime || 5));
      return `<a class="topic-row card ${masteredTopic ? 'mastered' : ''}" data-topic="${topic.id}" data-difficulty="${topic.difficulty}" data-duration="${duration}" href="topic.html?topic=${topic.id}">
        <span class="topic-status">${masteredTopic ? icon('check') : icon('arrow-right')}</span><span class="topic-row-main"><strong>${topic.title}</strong><small>${topic.description}</small><span class="topic-inline-meta">${topic.tests.reduce((total, test) => total + test.questions.length, 0)} вопросов · сложность: ${topic.difficulty === 'easy' ? 'легко' : topic.difficulty === 'hard' ? 'сложно' : 'средне'}</span></span>
        <span class="topic-progress"><span>${state}</span><i><b style="width:${percent}%"></b></i></span></a>`;
    }).join('')}</section>`;
  }).join('');

  const topicFilter = document.getElementById('topicFilter');
  topicFilter.insertAdjacentHTML('beforeend', topics.map(topic => `<option value="${topic.id}">${topic.title}</option>`).join(''));
  const applyFilters = () => {
    const topicId = topicFilter.value;
    const difficulty = document.getElementById('difficultyFilter').value;
    const duration = document.getElementById('durationFilter').value;
    let visible = 0;
    list.querySelectorAll('[data-topic]').forEach(row => {
      const show = (topicId === 'all' || row.dataset.topic === topicId) && (difficulty === 'all' || row.dataset.difficulty === difficulty) && (duration === 'all' || Number(row.dataset.duration) <= Number(duration));
      row.hidden = !show;
      if (show) visible++;
    });
    list.querySelectorAll('.topic-section').forEach(section => { section.hidden = !section.querySelector('[data-topic]:not([hidden])'); });
    document.getElementById('filterEmpty').hidden = visible > 0;
  };
  [topicFilter, document.getElementById('difficultyFilter'), document.getElementById('durationFilter')].forEach(select => select.addEventListener('change', applyFilters));

})();
