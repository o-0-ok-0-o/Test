'use strict';

/* =========================================================
   pages/home.js — главная: выбор класса + быстрые действия
   ========================================================= */

(function initHomePage() {
  UI.initHeader();
  UI.checkResume();

  const s = App.state;
  const progress = s.progress;
  const level = App.levelInfo();
  const resumeTopic = s.progress.currentQuiz?.topicId && COURSE_TOPICS.find(topic => topic.id === s.progress.currentQuiz.topicId);
  const welcome = document.getElementById('welcomeCopy');
  welcome.textContent = progress.testsCompleted || Object.keys(progress.topicProgress).length
    ? 'Продолжай с того места, где остановился.'
    : 'Выбери класс, чтобы начать обучение.';

  const resume = document.getElementById('resumeCard');
  if (resumeTopic) {
    const subject = getSubject(resumeTopic.subjectId);
    const tp = progress.topicProgress[resumeTopic.id];
    const percent = tp ? Math.min(100, Math.round((tp.completedQuestions || 0) / (resumeTopic.practiceQuestions.length + resumeTopic.tests.reduce((sum, t) => sum + (t.questions || []).length, 0)) * 100)) : 0;
    resume.hidden = false;
    resume.innerHTML = `<div><span class="eyebrow">ПРОДОЛЖИТЬ ОБУЧЕНИЕ</span><h2>${subject.title}</h2><p>${resumeTopic.title}</p><div class="progress"><div class="progress-fill" style="width:${percent}%"></div></div><small>${percent}% темы</small></div><a class="btn primary" href="topic.html?topic=${resumeTopic.id}">Продолжить</a>`;
  } else resume.hidden = true;

  const grid = document.getElementById('gradeGrid');
  grid.addEventListener('click', event => {
    const card = event.target.closest('[href*="grade.html"]');
    if (!card) return;
    const grade = Number(new URL(card.href).searchParams.get('grade'));
    App.state.profile.selectedGrade = grade;
    saveState();
  });
  grid.innerHTML = GRADES.map(grade => {
    const topics = COURSE_TOPICS.filter(topic => topic.grade === grade.id);
    const done = topics.filter(topic => progress.topicProgress[topic.id]?.mastered).length;
    const percent = topics.length ? Math.round(done / topics.length * 100) : 0;
    const subjectCount = new Set(topics.map(topic => topic.subjectId)).size;
    return `<a class="class-card" href="grade.html?grade=${grade.id}" aria-label="${grade.title}">
      <span class="class-num">${grade.id}</span><span class="class-label">класс</span>
      <small>${subjectCount} предметов · ${topics.length} тем</small>
      <span class="mini-progress"><i style="width:${percent}%"></i></span></a>`;
  }).join('');

  document.getElementById('quickGames').addEventListener('click', () => Router.toGames());
  document.getElementById('quickProfile').addEventListener('click', () => Router.toProfile());
  document.getElementById('globalSearch').addEventListener('input', event => {
    const query = event.target.value.trim().toLocaleLowerCase('ru');
    const results = document.getElementById('searchResults');
    if (!query) { results.hidden = true; results.innerHTML = ''; return; }
    const matches = COURSE_TOPICS.flatMap(topic => {
      const subject = getSubject(topic.subjectId);
      const found = [];
      if (`${topic.title} ${topic.description} ${topic.section} ${subject.title} ${topic.grade} класс ${topic.theoryHtml}`.toLocaleLowerCase('ru').includes(query)) {
        found.push({ href: `topic.html?topic=${topic.id}`, title: topic.title, detail: `${topic.grade} класс · ${subject.title} · тема` });
      }
      topic.tests.forEach(test => {
        if (`${test.title} ${topic.title} ${subject.title} ${topic.grade} класс`.toLocaleLowerCase('ru').includes(query)) {
          found.push({ href: `quiz.html?test=${test.id}&mode=exam&topic=${topic.id}`, title: test.title, detail: `${topic.grade} класс · ${subject.title} · тест` });
        }
      });
      return found;
    }).slice(0, 8);
    results.innerHTML = matches.length ? matches.map(item => `<a href="${item.href}"><strong>${item.title}</strong><span>${item.detail}</span></a>`).join('') : '<p>Ничего не найдено</p>';
    results.hidden = false;
  });

  document.getElementById('levelBadge').textContent = `Уровень ${level.level} · ${level.title}`;
  document.getElementById('levelProgress').innerHTML = `<span>${level.current} / ${level.needed} XP</span><div class="progress"><div class="progress-fill" style="width:${Math.min(100, level.current / level.needed * 100)}%"></div></div>`;
  document.getElementById('streakValue').textContent = `${s.activity.streak || 0} дней`;
  document.getElementById('homeStats').innerHTML = `
    <div class="stat-box"><div class="value">${progress.testsCompleted}</div><div class="label">Пройдено тестов</div></div>
    <div class="stat-box"><div class="value">${Object.values(progress.topicProgress).filter(p => p.mastered).length}</div><div class="label">Освоено тем</div></div>
    <div class="stat-box"><div class="value">${progress.totalCorrect}</div><div class="label">Правильных ответов</div></div>
    <div class="stat-box"><div class="value">${s.profile.xp}</div><div class="label">Всего XP</div></div>`;
})();
