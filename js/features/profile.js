'use strict';

/* =========================================================
   profile.js — страница профиля: статистика, календарь,
   прогресс по предметам, достижения, ссылки на разделы
   «Результаты по тестам» и «Мои ошибки» (отдельные страницы)
   ========================================================= */

const Profile = {
  render() {
    const p = App.state.profile;
    const progress = App.state.progress;
    const mistakes = Object.values(App.state.mistakes.entries);
    const attempted = Object.keys(progress.testStats).length;

    const avg = progress.grades.length
      ? (progress.grades.reduce((a, b) => a + b, 0) / progress.grades.length).toFixed(1)
      : '—';
    const best = progress.bestScore > 0 ? `${progress.bestScore}` : '—';

    const level = App.levelInfo();
    document.getElementById('profileHero').innerHTML = `<div class="profile-avatar">${icon('book', 'ic-lg')}</div><div class="profile-identity"><label for="profileName">Имя ученика</label><input id="profileName" maxlength="24"><span>${level.title} · уровень ${level.level}</span></div><div class="profile-xp"><strong>${p.xp} XP</strong><div class="progress"><div class="progress-fill" style="width:${Math.min(100, level.current / level.needed * 100)}%"></div></div><small>${level.current} / ${level.needed} до следующего уровня</small></div>`;
    document.getElementById('profileName').value = p.name;
    document.getElementById('profileName').addEventListener('change', event => { p.name = event.target.value.trim() || 'Ученик'; saveState(); });

    document.getElementById('profileStats').innerHTML = `
      <div class="stat-box"><div class="value">${progress.testsCompleted}</div><div class="label">Пройдено тестов</div></div>
      <div class="stat-box"><div class="value">${avg}</div><div class="label">Средняя оценка</div></div>
      <div class="stat-box"><div class="value">${best}</div><div class="label">Лучший результат</div></div>
      <div class="stat-box"><div class="value">${progress.totalCorrect}</div><div class="label">Правильных ответов</div></div>
      <div class="stat-box"><div class="value">${Math.round((App.state.activity.studySeconds || 0) / 60)}</div><div class="label">Минут обучения</div></div>
      <div class="stat-box"><div class="value">${Object.values(progress.topicProgress).filter(t => t.mastered).length}</div><div class="label">Освоено тем</div></div>`;

    App._updateDailyQuest();
    const quest = App.state.activity.dailyQuest;
    document.getElementById('dailyPanel').innerHTML = `<span class="eyebrow">ЗАДАНИЕ ДНЯ</span><h2>Пройди 10 вопросов</h2><div class="daily-progress"><strong>${Math.min(quest.progress, quest.target)} / ${quest.target}</strong><span>${quest.claimed ? 'Выполнено' : 'Награда: +100 XP'}</span></div><div class="progress"><div class="progress-fill" style="width:${Math.min(100, quest.progress / quest.target * 100)}%"></div></div><a class="btn secondary" href="index.html">${quest.claimed ? 'Продолжить учёбу' : 'Продолжить'}</a>`;
    this._renderCalendar();
    this._renderSubjectProgress();

    /* Разделы-ссылки на отдельные структурированные страницы */
    document.getElementById('profileSections').innerHTML = `
      <a class="section-link card" href="results.html">
        <span class="section-icon">${icon('chart')}</span>
        <span><strong>Результаты по тестам</strong><small>Лучший счёт, оценка и попытки по каждому тесту — по классам и предметам</small></span>
        <span class="section-count">${attempted} пройдено</span>
      </a>
      <a class="section-link card" href="mistakes.html">
        <span class="section-icon">${icon('cross')}</span>
        <span><strong>Мои ошибки</strong><small>Журнал ошибок по темам с правильными ответами и объяснениями</small></span>
        <span class="section-count">${mistakes.length} ошибок</span>
      </a>`;

    this._renderAchievements();
  },

  _renderCalendar() {
    const activeDays = new Set(App.state.activity.days || []);
    const today = new Date();
    const cells = Array.from({ length: 14 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (13 - index));
      const key = date.toISOString().slice(0, 10);
      return `<span class="calendar-day ${activeDays.has(key) ? 'active' : ''}" title="${key}">${date.toLocaleDateString('ru', { weekday: 'short' })}<i>${date.getDate()}</i></span>`;
    }).join('');
    document.getElementById('activityCalendar').innerHTML = `<div class="calendar-days">${cells}</div><p class="streak-total">Текущая серия: <strong>${App.state.activity.streak || 0} дней</strong></p>`;
  },

  _renderSubjectProgress() {
    const chart = document.getElementById('subjectProgress');
    const rows = SUBJECTS.map(subject => {
      const topics = COURSE_TOPICS.filter(topic => topic.subjectId === subject.id);
      const mastered = topics.filter(topic => App.state.progress.topicProgress[topic.id]?.mastered).length;
      return { subject, total: topics.length, percent: topics.length ? Math.round(mastered / topics.length * 100) : 0 };
    }).filter(item => item.total).sort((a, b) => b.percent - a.percent || a.subject.title.localeCompare(b.subject.title, 'ru'));
    chart.innerHTML = rows.length ? rows.map(({ subject, total, percent }) => `<div class="subject-chart-row"><span>${subject.title}</span><div class="progress" role="progressbar" aria-label="${subject.title}: ${percent}% освоено" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><div class="progress-fill" style="width:${percent}%"></div></div><small>${percent}% · ${total} тем</small></div>`).join('') : '<p class="muted">Пока нет доступных тем.</p>';
  },

  /** Сетка достижений. */
  _renderAchievements() {
    const unlocked = App.state.achievements.unlocked;
    const dates = App.state.achievements.dates || {};
    document.getElementById('achievementsList').innerHTML = ACHIEVEMENTS.map(a => {
      const got = unlocked.includes(a.id);
      const date = dates[a.id];
      return `<div class="ach-item ${got ? '' : 'locked'}">
        <span class="ach-icon">${icon(a.icon)}</span>
        <div><div class="ach-name">${a.name}</div><div class="ach-desc">${a.desc}</div>${got ? `<small>Получено ${new Date(date || Date.now()).toLocaleDateString('ru')}</small>` : '<small>Ещё не получено</small>'}</div>
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