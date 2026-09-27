'use strict';

const Topic = {
  data: null,

  init() {
    UI.initHeader();
    UI.checkResume();
    const id = Router.params().get('topic');
    const topic = COURSE_TOPICS.find(item => item.id === id);
    if (!topic) { Router.toHome(); return; }
    this.data = topic;
    App.state.profile.lastTopicId = topic.id;
    saveState();

    const subject = getSubject(topic.subjectId);
    document.title = `${topic.title} — Учимся легко`;
    document.getElementById('topicTitle').textContent = topic.title;
    document.getElementById('topicDescription').textContent = topic.description;
    document.getElementById('topicSection').textContent = `${topic.grade} класс · ${topic.section}`;
    document.getElementById('topicGradeCrumb').textContent = `${topic.grade} класс`;
    document.getElementById('topicGradeCrumb').href = `grade.html?grade=${topic.grade}`;
    document.getElementById('topicSubjectCrumb').textContent = subject.title;
    document.getElementById('topicSubjectCrumb').href = `subject.html?grade=${topic.grade}&subject=${subject.id}`;
    document.getElementById('topicBack').href = `subject.html?grade=${topic.grade}&subject=${subject.id}`;
    document.getElementById('theoryContent').innerHTML = topic.theoryHtml;
    document.getElementById('topicMeta').innerHTML = `<span>${topic.practiceQuestions.length + topic.tests.reduce((sum, test) => sum + test.questions.length, 0)} заданий</span><span>Сложность: ${this.difficulty(topic.difficulty)}</span><span>${topic.tests.length} тест</span>`;

    const progress = App.getTopicProgress(topic.id);
    document.getElementById('topicTests').innerHTML = topic.tests.map(test => {
      const result = App.state.progress.testStats[test.id];
      const questions = test.questions || topic.practiceQuestions;
      return `<article class="card topic-test-card"><div class="topic-test-info"><span class="eyebrow">ТЕСТ ПО ТЕМЕ</span><h3>${test.title}</h3><p class="muted">${questions.length} вопросов · ${test.estimatedTime || 5} минут · ${result ? `Лучший результат ${result.best}/${questions.length}` : 'Ещё не пройден'}</p></div><div class="topic-test-actions"><label class="mode-select">Режим <select data-mode="${test.id}"><option value="exam">Экзамен</option><option value="learn">Обучение</option></select></label><button class="btn ghost" data-theory="${test.id}">Посмотреть теорию</button><button class="btn primary" data-test="${test.id}">Пройти тест</button></div></article>`;
    }).join('');

    const mistakes = progress.errorIds || [];
    document.getElementById('mistakeSummary').textContent = mistakes.length ? `Неразобранных вопросов: ${mistakes.length}.` : 'Ошибок по теме пока нет.';
    const retry = document.getElementById('retryMistakes');
    retry.disabled = !mistakes.length;
    retry.addEventListener('click', () => Router.toPractice(topic.id, mistakes));

    document.getElementById('startPractice').addEventListener('click', () => Router.toPractice(topic.id));
    document.querySelectorAll('[data-theory]').forEach(button => button.addEventListener('click', () => {
      const test = topic.tests.find(item => item.id === button.dataset.theory);
      const overlay = UI.showModal(`<div class="theory-modal-head"><span class="theory-mark">${icon('bulb')}</span><div><span class="eyebrow">ПОВТОРИ ПЕРЕД ТЕСТОМ</span><h2>${topic.title}</h2></div><button class="icon-btn" type="button" data-close aria-label="Закрыть теорию">×</button></div><div class="theory-modal-body">${topic.theoryHtml || '<p>Для этой темы теория пока не добавлена.</p>'}</div><div class="theory-modal-actions"><button class="btn ghost" type="button" data-close>Вернуться к тестам</button><button class="btn primary" type="button" data-start-test="${test.id}">Перейти к тесту</button></div>`);
      overlay.querySelector('[data-start-test]').addEventListener('click', () => {
        const testId = button.dataset.theory;
        const mode = document.querySelector(`[data-mode="${testId}"]`).value;
        overlay.remove();
        App.state.profile.learningMode = mode;
        saveState();
        Router.toQuiz(testId, mode, topic.id);
      });
    }));
    document.querySelectorAll('[data-test]').forEach(button => button.addEventListener('click', () => {
      const testId = button.dataset.test;
      const mode = document.querySelector(`[data-mode="${testId}"]`).value;
      App.state.profile.learningMode = mode;
      saveState();
      Router.toQuiz(testId, mode, topic.id);
    }));
    this.renderProgress(progress);
  },

  difficulty(level) {
    return ({ easy: 'легко', medium: 'средне', hard: 'сложно' })[level] || level;
  },

  renderProgress(progress) {
    const total = this.data.practiceQuestions.length + this.data.tests.reduce((sum, test) => sum + test.questions.length, 0);
    const percent = Math.min(100, Math.round((progress.completedQuestions || 0) / total * 100));
    document.getElementById('topicMeta').insertAdjacentHTML('beforeend', `<span class="topic-progress-chip">${progress.mastered ? 'Освоено' : `${percent}% прогресс`}</span>`);
  }
};
