'use strict';

/* =========================================================
   mistakes.js — страница «Мои ошибки»: журнал ошибок,
   сгруппированный по темам, с фильтром по предметам
   ========================================================= */

const Mistakes = {
  filter: 'all',

  /** Записи журнала, сгруппированные по темам (только с известной темой). */
  _byTopic() {
    const entries = Object.values(App.state.mistakes.entries);
    return entries
      .filter(e => e.topicId && (this.filter === 'all' || this._subjectOf(e.topicId) === this.filter))
      .reduce((acc, e) => {
        (acc[e.topicId] = acc[e.topicId] || []).push(e);
        return acc;
      }, {});
  },

  _subjectOf(topicId) {
    const topic = COURSE_TOPICS.find(t => t.id === topicId);
    return topic ? topic.subjectId : null;
  },

  _summary() {
    const entries = Object.values(App.state.mistakes.entries);
    const total = entries.length;
    const topics = new Set(entries.map(e => e.topicId).filter(Boolean)).size;
    const repeats = entries.reduce((a, e) => a + Math.max(0, (e.count || 1) - 1), 0);
    document.getElementById('mistakesSummary').innerHTML = `
      <div class="stats-grid">
        <div class="stat-box"><div class="value">${total}</div><div class="label">Ошибочных вопросов</div></div>
        <div class="stat-box"><div class="value">${topics}</div><div class="label">Затронуто тем</div></div>
        <div class="stat-box"><div class="value">${repeats}</div><div class="label">Повторных ошибок</div></div>
      </div>`;
  },

  _filters() {
    const used = [...new Set(Object.values(App.state.mistakes.entries).map(e => this._subjectOf(e.topicId)).filter(Boolean))];
    if (used.length < 2) {
      document.getElementById('mistakesFilters').innerHTML = '';
      return;
    }
    const chips = ['all', ...used].map(id => {
      const label = id === 'all' ? 'Все предметы' : (Router.subject(id)?.title || id);
      return `<button class="chip ${this.filter === id ? 'chip-active' : ''}" data-filter="${id}">${label}</button>`;
    }).join('');
    document.getElementById('mistakesFilters').innerHTML = chips;
    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.filter = btn.dataset.filter;
        this.render();
      });
    });
  },

  _list() {
    const byTopic = this._byTopic();
    const topicIds = Object.keys(byTopic);
    if (!topicIds.length) {
      document.getElementById('mistakesByTopic').innerHTML = '<p class="muted empty-state">Ошибок пока нет. Ошибочные вопросы появятся здесь после тестирования.</p>';
      return;
    }
    document.getElementById('mistakesByTopic').innerHTML = topicIds.map(topicId => {
      const topic = COURSE_TOPICS.find(t => t.id === topicId);
      if (!topic) return '';
      const subject = getSubject(topic.subjectId);
      const items = byTopic[topicId].sort((a, b) => (b.count || 1) - (a.count || 1)).map(e => `
        <div class="mistake-item">
          <div class="mistake-q">${e.text || 'Вопрос недоступен (тест обновлён)'}</div>
          ${e.correctAnswer ? `<p class="mistake-correct"><strong>Верно:</strong> ${e.correctAnswer}</p>` : ''}
          ${e.explanation ? `<p class="mistake-explain">${e.explanation}</p>` : ''}
          <div class="mistake-meta">
            ${e.count > 1 ? `<span class="chip">Ошибок: ${e.count}</span>` : ''}
            ${e.lastAt ? `<small>${new Date(e.lastAt).toLocaleDateString('ru')}</small>` : ''}
          </div>
        </div>`).join('');
      return `<section class="card errors-panel">
        <div class="errors-head">
          <div><h2>${topic.title}</h2><p class="muted">${subject ? subject.title : ''}, ${topic.grade} класс · ошибок: ${byTopic[topicId].length}</p></div>
          <a class="btn primary" href="topic.html?topic=${topic.id}">Тренировать</a>
        </div>
        ${items}
      </section>`;
    }).join('');
  },

  render() {
    this._summary();
    this._filters();
    this._list();
  },

  init() {
    UI.initHeader();
    this.render();
  }
};
