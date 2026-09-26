'use strict';

/* =========================================================
   profile.js — страница профиля: статистика, результаты
   по тестам, достижения, сброс прогресса
   ========================================================= */

const Profile = {
  render() {
    const s = App.state;
    const avg = s.grades.length
      ? (s.grades.reduce((a, b) => a + b, 0) / s.grades.length).toFixed(1)
      : '—';
    const best = s.bestScore > 0 ? `${s.bestScore}` : '—';

    document.getElementById('profileStats').innerHTML = `
      <div class="stat-box"><div class="value">${s.testsCompleted}</div><div class="label">Пройдено тестов</div></div>
      <div class="stat-box"><div class="value">${avg}</div><div class="label">Средняя оценка</div></div>
      <div class="stat-box"><div class="value">${best}</div><div class="label">Лучший результат</div></div>
      <div class="stat-box"><div class="value">${s.totalCorrect}</div><div class="label">Правильных ответов</div></div>
      <div class="stat-box"><div class="value">${s.xp}</div><div class="label">XP</div></div>
      <div class="stat-box"><div class="value">${s.grades.join(', ') || '—'}</div><div class="label">Оценки</div></div>`;

    this._renderTestResults();
    this._renderAchievements();
  },

  /** Таблица лучших результатов по каждому тесту. */
  _renderTestResults() {
    const list = document.getElementById('testResultsList');
    if (!TESTS.length) {
      list.innerHTML = '<p class="muted">Пока нет доступных тестов.</p>';
      return;
    }
    list.innerHTML = TESTS.map(t => {
      const ts = App.state.testStats[t.id];
      const subject = Router.subject(t.subjectId);
      const best = ts ? `${ts.best}/${t.questions.length}` : '—';
      const grade = ts && ts.bestGrade ? ts.bestGrade : '—';
      const count = ts ? ts.count : 0;
      return `<div class="test-result-row">
        <div><strong>${t.title}</strong>
          <p class="muted">${subject ? subject.title : ''}, ${t.grade} класс</p></div>
        <div class="test-result-stats">
          <span class="chip">Лучший: ${best}</span>
          <span class="chip">Оценка: ${grade}</span>
          <span class="chip">Пройден: ${count}×</span>
        </div>
      </div>`;
    }).join('');
  },

  /** Сетка достижений. */
  _renderAchievements() {
    document.getElementById('achievementsList').innerHTML = ACHIEVEMENTS.map(a => {
      const got = App.state.achievements.includes(a.id);
      return `<div class="ach-item ${got ? '' : 'locked'}">
        <span class="ach-icon">${icon(a.icon)}</span>
        <div><div class="ach-name">${a.name}</div><div class="ach-desc">${a.desc}</div></div>
      </div>`;
    }).join('');
  },

  init() {
    this.render();

    document.getElementById('resetProgress').addEventListener('click', () => {
      if (!confirm('Сбросить весь прогресс? Это действие нельзя отменить.')) return;
      App.reset();
      UI.updateXPBadge();
      this.render();
      UI.showToast('Прогресс сброшен');
    });
  }
};
