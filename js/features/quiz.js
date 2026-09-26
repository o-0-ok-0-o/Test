'use strict';

/* =========================================================
   quiz.js — логика теста на странице quiz.html
   Ключевые решения:
   1. ОДНА кнопка «Следующий вопрос»: неактивна, пока не выбран
      ответ; клик фиксирует ответ и сразу показывает следующий.
   2. Правильность НЕ показывается во время теста — полный
      разбор только после завершения (Review.render).
   3. Экраны quiz/result/review — секции внутри quiz.html.
   ========================================================= */

const Quiz = {
  active: false,
  testId: null,   // id теста из TESTS (null — мини-тест из ошибок)
  questions: [],
  index: 0,
  results: [],    // { question, userAnswer, isCorrect }
  streak: 0,      // серия правильных ответов подряд

  /** Начинает тест по id. questionsOverride — мини-тест из ошибок. */
  start(testId, questionsOverride) {
    const test = TESTS.find(t => t.id === testId);
    if (!test) { UI.showToast('Тест не найден'); Router.toHome(); return; }

    this.active = true;
    this.testId = questionsOverride ? null : test.id;
    this.questions = questionsOverride || test.questions.slice();
    this.index = 0;
    this.results = [];
    this.streak = 0;
    this._saveProgress();
    this._render();
    this._show('quiz');
  },

  /** Сохраняет прогресс теста в LocalStorage (продолжение после обновления). */
  _saveProgress() {
    if (!this.active) {
      App.state.currentQuiz = null;
    } else {
      App.state.currentQuiz = {
        testId: this.testId,
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
    const test = TESTS.find(t => t.id === saved.testId);
    if (!test) return false;
    const questions = saved.questionIds
      .map(id => test.questions.find(q => q.id === id))
      .filter(Boolean);
    if (!questions.length) return false;
    this.active = true;
    this.testId = saved.testId;
    this.questions = questions;
    this.index = saved.index;
    this.results = saved.results || [];
    this.streak = saved.streak || 0;
    return true;
  },

  /* ---------- Экраны внутри quiz.html ---------- */

  _show(name) {
    ['quiz', 'result', 'review'].forEach(s => {
      const el = document.getElementById('screen-' + s);
      el.classList.toggle('active', s === name);
      el.hidden = s !== name;
    });
    window.scrollTo({ top: 0 });
  },

  /* ---------- Отрисовка вопроса ---------- */

  _render() {
    const q = this.questions[this.index];
    const total = this.questions.length;
    const card = document.getElementById('questionCard');
    const nextBtn = document.getElementById('nextBtn');

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

    // Кнопка «Далее» неактивна, пока не выбран ответ
    nextBtn.disabled = true;
    nextBtn.textContent = this.index === total - 1 ? 'Завершить' : 'Следующий вопрос';

    this._bindSelection(q, card, nextBtn);
  },

  /** Навешивает обработчики выбора. Map — для match, Set — для остальных. */
  _bindSelection(q, card, nextBtn) {
    const selected = (q.type === 'match') ? new Map() : new Set();
    card._selected = selected;

    const updateBtnState = () => {
      if (q.type === 'match') {
        nextBtn.disabled = !q.pairs.every((p, i) => selected.has(i));
      } else {
        nextBtn.disabled = selected.size === 0;
      }
    };

    const toggleAnswer = (btn, isMulti) => {
      const idx = Number(btn.dataset.idx);
      if (isMulti && selected.has(idx)) {
        selected.delete(idx);
        btn.classList.remove('selected');
      } else {
        if (!isMulti) {
          card.querySelectorAll('.answer-btn.selected, .word-btn.selected')
            .forEach(b => b.classList.remove('selected'));
          selected.clear();
        }
        selected.add(idx);
        btn.classList.add('selected');
      }
      updateBtnState();
    };

    if (q.type === 'match') {
      card.querySelectorAll('select').forEach(sel => {
        sel.addEventListener('change', () => {
          if (sel.value === '-1') selected.delete(Number(sel.dataset.idx));
          else selected.set(Number(sel.dataset.idx), Number(sel.value));
          updateBtnState();
        });
      });
    } else {
      const isMulti = q.type === 'multi' || q.type === 'find';
      const selector = q.type === 'find' ? '.word-btn' : '.answer-btn';
      card.querySelectorAll(selector).forEach(btn => {
        btn.addEventListener('click', () => toggleAnswer(btn, isMulti));
      });
    }
  },

  /* ---------- Фиксация ответа и переход дальше ---------- */

  _next() {
    const q = this.questions[this.index];
    const selected = document.getElementById('questionCard')._selected;
    let userAnswer, isCorrect;

    if (q.type === 'single' || q.type === 'select') {
      userAnswer = [...selected][0];
      isCorrect = userAnswer === q.correctAnswer;
    } else if (q.type === 'multi' || q.type === 'find') {
      const correct = new Set(q.correctAnswer);
      userAnswer = [...selected].sort((a, b) => a - b);
      isCorrect = userAnswer.length === correct.size && userAnswer.every(i => correct.has(i));
    } else if (q.type === 'match') {
      userAnswer = q.pairs.map((p, i) => selected.get(i));
      isCorrect = q.pairs.every((p, i) => selected.get(i) === p.correct);
    }

    // Ответ фиксируется молча — правильность НЕ показывается
    this.results.push({ question: q, userAnswer, isCorrect });

    // XP и серия считаются «в фоне»
    if (isCorrect) {
      this.streak++;
      App.addXP(10, true);
      if (this.streak >= 10) App.unlockAchievement('streak');
    } else {
      this.streak = 0;
    }

    this.index++;
    this._saveProgress();
    if (this.index >= this.questions.length) this._finish();
    else this._render();
  },

  /* ---------- Завершение ---------- */

  _finish() {
    this.active = false;
    App.state.currentQuiz = null;

    const total = this.questions.length;
    const correct = this.results.filter(r => r.isCorrect).length;
    const wrong = total - correct;
    const percent = Math.round((correct / total) * 100);
    const grade = App.gradeFor(correct, total);
    const isFullTest = this.testId !== null;
    const wasCompleted = App.state.testsCompleted > 0;

    App.state.testsCompleted++;
    App.state.totalCorrect += correct;
    App.state.grades.push(grade);

    // Лучший результат конкретного теста
    if (isFullTest) {
      const ts = App.state.testStats[this.testId] || { best: 0, bestGrade: null, count: 0 };
      ts.count++;
      if (correct > ts.best) { ts.best = correct; ts.bestGrade = grade; }
      App.state.testStats[this.testId] = ts;

      if (correct > App.state.bestScore) {
        App.state.bestScore = correct;
        App.state.bestGrade = grade;
      }
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
    this._show('result');
  },

  _renderResult(correct, total, percent, grade, wrong, xp) {
    const perfect = correct === total;
    const test = TESTS.find(t => t.id === this.testId);
    const testTitle = test ? test.title : 'Тест по ошибкам';

    let html = `<div class="card result-card">`;

    if (perfect) {
      html += `<div class="result-emoji medal-glow">${icon('trophy', 'ic-xl')}</div>
        <h2 class="perfect-title">ИДЕАЛЬНО!</h2>
        <p class="result-score">${correct} из ${total}</p>
        <p class="muted">Ты не допустил ни одной ошибки!</p>
        <p class="muted" style="margin-top:6px"><strong>Тема пройдена: ${testTitle}</strong></p>`;
    } else {
      html += `<div class="result-emoji">${icon('celebrate', 'ic-xl')}</div>
        <h2>Тест завершён!</h2>
        <p class="muted">${testTitle}</p>
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
        ${test ? `<button class="btn primary" data-res="restart">Пройти заново</button>` : ''}
        ${test ? `<button class="btn ghost" data-res="tests">${icon('arrow-left', 'ic-sm')} К тестам</button>` : `<button class="btn ghost" data-res="home">На главную</button>`}
      </div>
    </div>`;

    const screen = document.getElementById('screen-result');
    screen.innerHTML = html;

    screen.querySelector('[data-res="review"]').addEventListener('click', () => {
      Review.render();
      this._show('review');
    });
    const retryBtn = screen.querySelector('[data-res="retry"]');
    if (retryBtn) retryBtn.addEventListener('click', () => this.retryMistakes());
    const restartBtn = screen.querySelector('[data-res="restart"]');
    if (restartBtn) restartBtn.addEventListener('click', () => this.start(this.testId));
    // «К тестам» — обратно на страницу предмета, где пользователь запускал тест
    const testsBtn = screen.querySelector('[data-res="tests"]');
    if (testsBtn) testsBtn.addEventListener('click', () => {
      const t = TESTS.find(x => x.id === this.testId);
      if (t) Router.toSubject(t.grade, t.subjectId);
      else Router.toHome();
    });
    screen.querySelector('[data-res="home"]').addEventListener('click', () => Router.toHome());

    if (perfect) UI.launchConfetti();
  },

  /** Мини-тест только из ошибочных вопросов. */
  retryMistakes() {
    const mistakes = this.results.filter(r => !r.isCorrect).map(r => r.question);
    if (!mistakes.length) return;
    const word = mistakes.length === 1 ? 'ошибка' : (mistakes.length < 5 ? 'ошибки' : 'ошибок');
    UI.showToast(`У тебя ${mistakes.length} ${word}. Давай попробуем ещё раз.`);
    this.start(null, mistakes);
  },

  /** Выход из теста с подтверждением (прогресс сохранится). */
  exit() {
    if (!confirm('Выйти из теста? Прогресс сохранится — сможешь продолжить позже.')) return;
    Router.toHome();
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

  init() {
    document.getElementById('nextBtn').addEventListener('click', () => {
      if (!document.getElementById('nextBtn').disabled) this._next();
    });
    document.getElementById('quizExit').addEventListener('click', () => this.exit());
  }
};
