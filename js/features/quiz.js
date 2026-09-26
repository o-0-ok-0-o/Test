'use strict';

/* =========================================================
   quiz.js — логика теста
   ВАЖНО: правильность ответов НЕ показывается во время теста.
   Ответ фиксируется, и пользователь сразу переходит дальше.
   Полный разбор с объяснениями показывается в конце (review.js).
   ========================================================= */

const Quiz = {
  active: false,
  questions: [],
  index: 0,
  results: [],   // { question, userAnswer, isCorrect }
  streak: 0,     // серия правильных ответов подряд
  answered: false,

  /** Начинает тест (можно передать подмножество вопросов — для «Повторить ошибки»). */
  start(questionsOverride) {
    const test = TESTS[0];
    this.active = true;
    this.questions = questionsOverride || test.questions.slice();
    this.index = 0;
    this.results = [];
    this.streak = 0;
    this.answered = false;
    this._saveProgress();
    this._render();
    UI.showScreen('quiz');
  },

  /** Сохраняет прогресс теста в LocalStorage (для продолжения после обновления). */
  _saveProgress() {
    if (!this.active) {
      App.state.currentQuiz = null;
    } else {
      App.state.currentQuiz = {
        questionIds: this.questions.map(q => q.id),
        index: this.index,
        results: this.results,
        streak: this.streak
      };
    }
    saveState();
  },

  /** Восстанавливает сохранённый тест (после обновления страницы). */
  _restore(saved) {
    const all = TESTS[0].questions;
    const questions = saved.questionIds.map(id => all.find(q => q.id === id)).filter(Boolean);
    if (!questions.length) return false;
    this.active = true;
    this.questions = questions;
    this.index = saved.index;
    this.results = saved.results || [];
    this.streak = saved.streak || 0;
    return true;
  },

  /* ---------- Отрисовка вопроса ---------- */

  _render() {
    this.answered = false;
    const q = this.questions[this.index];
    const total = this.questions.length;
    const card = document.getElementById('questionCard');

    document.getElementById('quizCounter').textContent = `Вопрос ${this.index + 1} из ${total}`;
    document.getElementById('progressFill').style.width = `${(this.index / total) * 100}%`;

    // перезапуск CSS-анимации появления карточки
    card.style.animation = 'none';
    void card.offsetWidth;
    card.style.animation = '';

    let html = `<p class="question-text">${q.question}</p>`;
    if (q.hint) html += `<p class="question-hint">${q.hint}</p>`;

    if (q.type === 'single' || q.type === 'multi' || q.type === 'select') {
      html += `<div class="answer-list" role="group">`;
      q.answers.forEach((a, i) => {
        const letter = String.fromCharCode(1040 + i); // А, Б, В, Г
        html += `<button class="answer-btn" data-idx="${i}" aria-label="Вариант: ${a}">
          <span class="letter">${letter}</span><span>${a}</span></button>`;
      });
      html += `</div>`;
    } else if (q.type === 'find') {
      html += `<div class="word-row" role="group">`;
      q.words.forEach((w, i) => {
        html += `<button class="word-btn" data-idx="${i}">${w}</button>`;
      });
      html += `</div>`;
    } else if (q.type === 'match') {
      html += `<div class="match-grid">`;
      q.pairs.forEach((p, i) => {
        html += `<div class="match-row"><span class="match-label">${p.label}</span>
          <select data-idx="${i}" aria-label="Характеристика для ${p.label}">
            <option value="-1">— выбери —</option>
            ${p.options.map((o, j) => `<option value="${j}">${o}</option>`).join('')}
          </select></div>`;
      });
      html += `</div>`;
    }

    card.innerHTML = html;

    const answerBtn = document.getElementById('answerBtn');
    answerBtn.disabled = true;
    answerBtn.classList.remove('hidden');
    answerBtn.textContent = 'Ответить';
    document.getElementById('nextBtn').classList.add('hidden');

    this._bindSelection(q, card);
  },

  /** Навешивает обработчики выбора ответа (Set — для вариантов, Map — для сопоставления). */
  _bindSelection(q, card) {
    // Для match используем Map (idx пары -> выбранный вариант),
    // для остальных — Set выбранных индексов.
    const selected = (q.type === 'match') ? new Map() : new Set();
    card._selected = selected;

    const toggleBtn = (btn, isMulti) => {
      const idx = Number(btn.dataset.idx);
      if (isMulti && selected.has(idx)) {
        selected.delete(idx);
        btn.classList.remove('selected');
      } else {
        if (!isMulti) {
          card.querySelectorAll('.answer-btn.selected').forEach(b => b.classList.remove('selected'));
          selected.clear();
        }
        if (q.type === 'match') selected.set(idx, Number(btn.value));
        else selected.add(idx);
        btn.classList.add('selected');
      }
    };

    if (q.type === 'single' || q.type === 'select') {
      card.querySelectorAll('.answer-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (this.answered) return;
          toggleBtn(btn, false);
          document.getElementById('answerBtn').disabled = false;
        });
      });
    } else if (q.type === 'multi') {
      card.querySelectorAll('.answer-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (this.answered) return;
          toggleBtn(btn, true);
          document.getElementById('answerBtn').disabled = selected.size === 0;
        });
      });
    } else if (q.type === 'find') {
      card.querySelectorAll('.word-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (this.answered) return;
          toggleBtn(btn, true);
          document.getElementById('answerBtn').disabled = selected.size === 0;
        });
      });
    } else if (q.type === 'match') {
      card.querySelectorAll('select').forEach(sel => {
        sel.addEventListener('change', () => {
          if (sel.value === '-1') selected.delete(Number(sel.dataset.idx));
          else selected.set(Number(sel.dataset.idx), Number(sel.value));
          const allChosen = q.pairs.every((p, i) => selected.has(i));
          document.getElementById('answerBtn').disabled = !allChosen;
        });
      });
    }
  },

  /* ---------- Проверка ответа (без показа результата) ---------- */

  _checkAnswer() {
    const q = this.questions[this.index];
    const selected = document.getElementById('questionCard')._selected;
    let userAnswer, isCorrect;

    if (q.type === 'single' || q.type === 'select') {
      if (selected.size === 0) return;
      userAnswer = [...selected][0];
      isCorrect = userAnswer === q.correctAnswer;
    } else if (q.type === 'multi' || q.type === 'find') {
      if (selected.size === 0) return;
      const correct = new Set(q.correctAnswer);
      userAnswer = [...selected].sort((a, b) => a - b);
      isCorrect = userAnswer.length === correct.size && userAnswer.every(i => correct.has(i));
    } else if (q.type === 'match') {
      if (selected.size < q.pairs.length) {
        UI.showToast('Выбери вариант для каждого слова');
        return;
      }
      userAnswer = q.pairs.map((p, i) => selected.get(i));
      isCorrect = q.pairs.every((p, i) => selected.get(i) === p.correct);
    }

    // Ответ фиксируется, но НЕ показываем правильно ли он
    this.answered = true;
    this.results.push({ question: q, userAnswer, isCorrect });

    // XP и серия считаются «в фоне»
    if (isCorrect) {
      this.streak++;
      App.addXP(10, true);
      if (this.streak >= 10) App.unlockAchievement('streak');
    } else {
      this.streak = 0;
    }

    // Блокируем выбор и сразу предлагаем перейти дальше
    const card = document.getElementById('questionCard');
    card.querySelectorAll('.answer-btn, .word-btn, select').forEach(el => el.disabled = true);

    const answerBtn = document.getElementById('answerBtn');
    answerBtn.classList.add('hidden');
    const nextBtn = document.getElementById('nextBtn');
    nextBtn.textContent = this.index === this.questions.length - 1 ? 'Завершить' : 'Следующий вопрос';
    nextBtn.classList.remove('hidden');
    nextBtn.focus();
  },

  /* ---------- Переход дальше / завершение ---------- */

  _next() {
    this.index++;
    this._saveProgress();
    if (this.index >= this.questions.length) this._finish();
    else this._render();
  },

  _finish() {
    this.active = false;
    App.state.currentQuiz = null;

    const total = this.questions.length;
    const correct = this.results.filter(r => r.isCorrect).length;
    const wrong = total - correct;
    const percent = Math.round((correct / total) * 100);
    const grade = App.gradeFor(correct, total);
    const isFullTest = total === TESTS[0].questions.length;
    const wasCompleted = App.state.testsCompleted > 0;

    App.state.testsCompleted++;
    App.state.totalCorrect += correct;
    App.state.grades.push(grade);
    if (isFullTest && correct > App.state.bestScore) {
      App.state.bestScore = correct;
      App.state.bestGrade = grade;
    }
    saveState();

    let xp = 50 + correct * 10;
    if (correct === total && isFullTest) xp += 100;
    App.addXP(xp);

    App.unlockAchievement('first');
    if (correct >= 15) App.unlockAchievement('accuracy');
    if (correct === total && isFullTest) App.unlockAchievement('perfect');
    if (wasCompleted && isFullTest) App.unlockAchievement('repeat');

    this._renderResult(correct, total, percent, grade, wrong, xp);
    Progress.renderHomeStats();
    UI.showScreen('result');
  },

  _renderResult(correct, total, percent, grade, wrong, xp) {
    const perfect = correct === total;
    let html = `<div class="card result-card">`;

    if (perfect) {
      html += `<div class="result-emoji medal-glow">${icon('trophy', 'ic-xl')}</div>
        <h2 class="perfect-title">ИДЕАЛЬНО!</h2>
        <p class="result-score">${correct} из ${total}</p>
        <p class="muted">Ты не допустил ни одной ошибки!</p>
        <p class="muted" style="margin-top:6px"><strong>Мастер местоимений</strong></p>`;
    } else {
      html += `<div class="result-emoji">${icon('celebrate', 'ic-xl')}</div>
        <h2>Тест завершён!</h2>
        <p class="result-score">${correct} / ${total}</p>
        <p class="result-percent">${percent}%</p>
        <div class="result-grade" aria-label="Оценка ${grade}">${grade}</div>`;
    }

    html += `
      <div class="result-stats">
        <div class="stat-box"><div class="value">${correct}</div><div class="label">Правильных</div></div>
        <div class="stat-box"><div class="value">${wrong}</div><div class="label">Ошибок</div></div>
        <div class="stat-box"><div class="value">${grade}</div><div class="label">Оценка</div></div>
        <div class="stat-box"><div class="value">+${xp}</div><div class="label">XP</div></div>
      </div>
      <div class="btn-row">
        <button class="btn secondary" data-res="review">Посмотреть разбор</button>
        ${wrong > 0 ? `<button class="btn secondary" data-res="retry">${icon('repeat', 'ic-sm')} Повторить ошибки (${wrong})</button>` : ''}
        <button class="btn primary" data-res="restart">Пройти заново</button>
        <button class="btn ghost" data-res="home">На главную</button>
      </div>
    </div>`;

    const screen = document.getElementById('screen-result');
    screen.innerHTML = html;

    screen.querySelector('[data-res="review"]').addEventListener('click', () => {
      Review.render();
      UI.showScreen('review');
    });
    const retryBtn = screen.querySelector('[data-res="retry"]');
    if (retryBtn) retryBtn.addEventListener('click', () => this.retryMistakes());
    screen.querySelector('[data-res="restart"]').addEventListener('click', () => this.start());
    screen.querySelector('[data-res="home"]').addEventListener('click', () => {
      Progress.renderHomeStats();
      UI.showScreen('home');
    });

    if (perfect) UI.launchConfetti();
  },

  /** Мини-тест только из ошибочных вопросов. */
  retryMistakes() {
    const mistakes = this.results.filter(r => !r.isCorrect).map(r => r.question);
    if (!mistakes.length) return;
    const word = mistakes.length === 1 ? 'ошибка' : (mistakes.length < 5 ? 'ошибки' : 'ошибок');
    UI.showToast(`У тебя ${mistakes.length} ${word}. Давай попробуем ещё раз.`);
    this.start(mistakes);
  },

  /* ---------- Форматирование ответов (для разбора) ---------- */

  formatCorrectAnswer(q) {
    if (q.type === 'single' || q.type === 'select') return q.answers[q.correctAnswer];
    if (q.type === 'multi') return q.correctAnswer.map(i => q.answers[i]).join(', ');
    if (q.type === 'find') return q.correctAnswer.map(i => q.words[i]).join(', ');
    if (q.type === 'match') return q.pairs.map(p => `${p.label} — ${p.options[p.correct]}`).join('; ');
    return '';
  },

  formatUserAnswer(q, userAnswer) {
    if (q.type === 'single' || q.type === 'select') return q.answers[userAnswer] ?? '— нет ответа —';
    if (q.type === 'multi') return (userAnswer || []).map(i => q.answers[i]).join(', ') || '— нет ответа —';
    if (q.type === 'find') return (userAnswer || []).map(i => q.words[i]).join(', ') || '— нет ответа —';
    if (q.type === 'match') return q.pairs.map((p, i) => `${p.label} — ${p.options[userAnswer[i]]}`).join('; ');
    return '';
  },

  /** Инициализация кнопок теста. */
  init() {
    document.getElementById('answerBtn').addEventListener('click', () => this._checkAnswer());
    document.getElementById('nextBtn').addEventListener('click', () => this._next());
  }
};
