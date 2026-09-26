'use strict';

/* =========================================================
   progress.js — экраны статистики, достижений и сброс прогресса
   ========================================================= */

const Progress = {
  /** Статистика на главной странице. */
  renderHomeStats() {
    const best = App.state.bestScore > 0 ? `${App.state.bestScore}/20` : '—';
    const grade = App.state.bestGrade ? String(App.state.bestGrade) : '—';
    document.getElementById('homeStats').innerHTML = `
      <div class="stat-box"><div class="value">${App.state.testsCompleted}</div><div class="label">Тестов пройдено</div></div>
      <div class="stat-box"><div class="value">${grade}</div><div class="label">Лучшая оценка</div></div>
      <div class="stat-box"><div class="value">${App.state.totalCorrect}</div><div class="label">Правильных ответов</div></div>
      <div class="stat-box"><div class="value">${App.state.xp}</div><div class="label">XP</div></div>`;
  },

  /** Полный экран «Мой прогресс». */
  renderScreen() {
    const avg = App.state.grades.length
      ? (App.state.grades.reduce((a, b) => a + b, 0) / App.state.grades.length).toFixed(1)
      : '—';
    const best = App.state.bestScore > 0 ? `${App.state.bestScore}/20` : '—';
    document.getElementById('progressStats').innerHTML = `
      <div class="stat-box"><div class="value">${App.state.testsCompleted}</div><div class="label">Пройдено тестов</div></div>
      <div class="stat-box"><div class="value">${avg}</div><div class="label">Средняя оценка</div></div>
      <div class="stat-box"><div class="value">${best}</div><div class="label">Лучший результат</div></div>
      <div class="stat-box"><div class="value">${App.state.totalCorrect}</div><div class="label">Правильных ответов</div></div>
      <div class="stat-box"><div class="value">${App.state.xp}</div><div class="label">XP</div></div>
      <div class="stat-box"><div class="value">${App.state.grades.join(', ') || '—'}</div><div class="label">Оценки</div></div>`;

    document.getElementById('achievementsList').innerHTML = ACHIEVEMENTS.map(a => {
      const got = App.state.achievements.includes(a.id);
      return `<div class="ach-item ${got ? '' : 'locked'}">
        <span class="ach-icon">${icon(a.icon)}</span>
        <div><div class="ach-name">${a.name}</div><div class="ach-desc">${a.desc}</div></div>
      </div>`;
    }).join('');
  },

  init() {
    // Экран прогресса обновляется при каждом открытии
    document.querySelector('[data-nav="progress"]').addEventListener('click', () => this.renderScreen());

    document.getElementById('resetProgress').addEventListener('click', () => {
      if (!confirm('Сбросить весь прогресс? Это действие нельзя отменить.')) return;
      const theme = App.state.theme;
      App.state = Object.assign({}, DEFAULT_STATE, { theme });
      saveState();
      UI.updateXPBadge();
      this.renderHomeStats();
      this.renderScreen();
      UI.showToast('Прогресс сброшен');
    });
  }
};
