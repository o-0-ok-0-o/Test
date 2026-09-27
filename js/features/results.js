'use strict';

/* =========================================================
   results.js — страница «Результаты по тестам»:
   сводка, фильтр по предметам, группировка по классам
   ========================================================= */

const Results = {
  filter: 'all',

  /** Тесты, сгруппированные по классам и предметам. */
  _grouped() {
    const stats = App.state.progress.testStats;
    const byGrade = new Map();
    TESTS
      .filter(t => this.filter === 'all' || t.subjectId === this.filter)
      .forEach(t => {
        if (!byGrade.has(t.grade)) byGrade.set(t.grade, []);
        byGrade.get(t.grade).push(t);
      });
    return [...byGrade.entries()].sort((a, b) => a[0] - b[0])
      .map(([grade, tests]) => ({
        grade,
        bySubject: Object.entries(tests.reduce((acc, t) => {
          (acc[t.subjectId] = acc[t.subjectId] || []).push(t);
          return acc;
        }, {}))
      }));
  },

  _summary() {
    const stats = App.state.progress.testStats;
    const attempted = Object.keys(stats).length;
    const total = TESTS.length;
    const avgGrade = attempted
      ? (Object.values(stats).filter(s => s.bestGrade).reduce((a, s) => a + s.bestGrade, 0) / Object.values(stats).filter(s => s.bestGrade).length).toFixed(1)
      : '—';
    const perfect = Object.values(stats).filter(s => s.best !== undefined && s.total !== undefined && s.best === s.total).length;
    document.getElementById('resultsSummary').innerHTML = `
      <div class="stats-grid">
        <div class="stat-box"><div class="value">${attempted}</div><div class="label">Пройдено тестов</div></div>
        <div class="stat-box"><div class="value">${total}</div><div class="label">Всего тестов</div></div>
        <div class="stat-box"><div class="value">${avgGrade}</div><div class="label">Средняя оценка</div></div>
        <div class="stat-box"><div class="value">${perfect}</div><div class="label">Идеальных</div></div>
      </div>`;
  },

  _filters() {
    const used = [...new Set(TESTS.map(t => t.subjectId))];
    const chips = ['all', ...used].map(id => {
      const label = id === 'all' ? 'Все предметы' : (Router.subject(id)?.title || id);
      return `<button class="chip ${this.filter === id ? 'chip-active' : ''}" data-filter="${id}">${label}</button>`;
    }).join('');
    document.getElementById('resultsFilters').innerHTML = chips;
    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.filter = btn.dataset.filter;
        this.render();
      });
    });
  },

  _list() {
    const stats = App.state.progress.testStats;
    const html = this._grouped().map(({ grade, bySubject }) => `
      <section class="card">
        <h2>${grade} класс</h2>
        ${bySubject.map(([subjectId, tests]) => {
          const subject = Router.subject(subjectId);
          return `<h3 class="results-subject">${subject ? subject.title : subjectId}</h3>
          <div class="test-results-list">${tests.map(t => {
            const ts = stats[t.id];
            const best = ts ? `${ts.best}/${ts.total ?? t.questions.length}` : '—';
            const gradeVal = ts && ts.bestGrade ? ts.bestGrade : '—';
            const count = ts ? ts.count : 0;
            return `<div class="test-result-row ${ts ? '' : 'not-attempted'}">
              <div><strong>${t.title}</strong></div>
              <div class="test-result-stats">
                <span class="chip">Лучший: ${best}</span>
                <span class="chip">Оценка: ${gradeVal}</span>
                <span class="chip">Пройден: ${count}×</span>
                ${ts ? `<a class="btn ghost" href="quiz.html?test=${t.id}&mode=exam">Повторить</a>` : `<a class="btn primary" href="quiz.html?test=${t.id}&mode=exam">Пройти</a>`}
              </div>
            </div>`;
          }).join('')}</div>`;
        }).join('')}
      </section>`).join('');
    document.getElementById('resultsByGrade').innerHTML = html || '<p class="muted empty-state">Тестов по выбранному предмету пока нет.</p>';
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
