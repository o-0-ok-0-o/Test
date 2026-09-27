'use strict';

/* =========================================================
   games.js — 6 мини-игр на странице games.html
   Все игры работают в карточке #gameArea.
   ========================================================= */

const Games = {
  /** Список игр для сетки на странице. */
  list: [
    { id: 'face', icon: 'mask', title: 'Определи лицо', desc: 'К какому лицу относится местоимение?' },
    { id: 'number', icon: 'layers', title: 'Единственное или множественное', desc: 'Определи число местоимения' },
    { id: 'find', icon: 'search', title: 'Найди местоимения', desc: 'Нажимай на местоимения в предложении' },
    { id: 'insert', icon: 'pencil', title: 'Вставь местоимение', desc: 'Выбери подходящее слово' },
    { id: 'truefalse', icon: 'check', title: 'Верно или неверно', desc: 'Оцени утверждение о местоимениях' },
    { id: 'replace', icon: 'repeat', title: 'Замени слово', desc: 'Существительное — местоимение: он, она или оно?' },
    { id: 'quick', icon: 'quiz', title: 'Быстрый ответ', desc: '10 вопросов из разных тем за одну серию' },
    { id: 'lightning', icon: 'fire', title: 'Молния', desc: 'Решай примеры, пока не истекли 30 секунд' },
    { id: 'pairs', icon: 'layers', title: 'Найди пару', desc: 'Соедини термин с правильным определением' },
    { id: 'mathblitz', icon: 'calculator', title: 'Математический блиц', desc: 'Устный счёт на скорость' }
  ],

  /** Запускает игру по id. */
  start(id) {
    clearInterval(this.timer);
    const area = document.getElementById('gameArea');
    area.hidden = false;
    App.unlockAchievement('gamer');
    ({
      face: () => this._choiceGame(area, 'face', 'mask', 'Определи лицо', GAME_DATA.face.words,
        GAME_DATA.face.faces, GAME_DATA.face.faceOf, 8),
      number: () => this._choiceGame(area, 'number', 'layers', 'Единственное или множественное',
        GAME_DATA.number.words, GAME_DATA.number.numbers, GAME_DATA.number.numberOf, 8),
      replace: () => this._choiceGame(area, 'replace', 'repeat', 'Замени слово',
        GAME_DATA.replace.items.map(i => i.word), GAME_DATA.replace.pronouns,
        Object.fromEntries(GAME_DATA.replace.items.map(i => [i.word, i.correct])), 10),
      find: () => this._gameFind(area),
      insert: () => this._gameInsert(area),
      truefalse: () => this._gameTrueFalse(area),
      quick: () => this._questionSprint(area, 10, null),
      lightning: () => this._questionSprint(area, 100, 30),
      mathblitz: () => this._mathBlitz(area),
      pairs: () => this._findPair(area)
    })[id]();
    area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  /* ---------- Универсальная игра «слово → вариант» ---------- */

  _choiceGame(area, gameId, ico, title, words, options, answerOf, totalRounds) {
    let score = 0, round = 0;
    const shuffled = words.slice().sort(() => Math.random() - 0.5);

    const next = () => {
      if (round >= totalRounds) {
        area.innerHTML = this._gameOverHtml(ico, title, score, totalRounds);
        document.getElementById('gameAgain').addEventListener('click', () => this.start(gameId));
        return;
      }
      const word = shuffled[round % shuffled.length];
      area.innerHTML = `<h3>${icon(ico, 'ic-sm')} ${title}</h3>
        <p class="game-score">Счёт: ${score} / ${round}</p>
        <div class="game-word-big">${word}</div>
        <div class="answer-list" id="choiceOptions">
          ${options.map((o, i) =>
            `<button class="answer-btn" data-i="${i}"><span class="letter">${i + 1}</span><span>${o}</span></button>`).join('')}
        </div>`;
      area.querySelectorAll('#choiceOptions .answer-btn').forEach(b => {
        b.addEventListener('click', () => {
          const chosen = Number(b.dataset.i);
          const correct = answerOf[word];
          area.querySelectorAll('#choiceOptions .answer-btn').forEach(x => x.disabled = true);
          if (chosen === correct) {
            b.classList.add('correct'); score++;
            const awarded = App.claimGameXP(10);
            UI.showToast(`${icon('check', 'ic-sm')} Правильно!${awarded ? ` +${awarded} XP` : ' Дневной лимит XP достигнут.'}`);
          } else {
            b.classList.add('wrong');
            area.querySelector(`#choiceOptions [data-i="${correct}"]`).classList.add('correct');
            UI.showToast(`${icon('cross', 'ic-sm')} Правильно: ${options[correct]}`);
          }
          round++;
          setTimeout(next, 900);
        });
      });
    };
    next();
  },

  _questionSprint(area, total, seconds) {
    const bank = COURSE_TOPICS.flatMap(topic => topic.tests.flatMap(test => test.questions || []))
      .filter(question => ['single', 'boolean', 'true-false'].includes(question.type) && question.answers);
    const questions = bank.sort(() => Math.random() - 0.5).slice(0, 10);
    let index = 0, score = 0, timeLeft = seconds;
    if (!questions.length) { area.innerHTML = '<p>Нет доступных вопросов для игры.</p>'; return; }
    const finish = () => {
      clearInterval(this.timer);
      area.innerHTML = this._gameOverHtml('quiz', seconds ? 'Молния' : 'Быстрый ответ', score, questions.length);
      document.getElementById('gameAgain').addEventListener('click', () => this.start(seconds ? 'lightning' : 'quick'));
    };
    const render = () => {
      if (index >= questions.length || (seconds && timeLeft <= 0)) { finish(); return; }
      const question = questions[index];
      const answers = question.type === 'boolean' || question.type === 'true-false' ? ['Верно', 'Неверно'] : question.answers.map(answer => typeof answer === 'string' ? answer : answer.text);
      area.innerHTML = `<h3>${seconds ? 'Молния' : 'Быстрый ответ'}</h3><p class="game-score">Вопрос ${index + 1} из ${questions.length} · Счёт ${score}${seconds ? ` · ${timeLeft} сек.` : ''}</p><p class="question-text">${question.question}</p><div class="answer-list">${answers.map((answer, i) => `<button class="answer-btn" data-i="${i}"><span class="letter">${i + 1}</span><span>${answer}</span></button>`).join('')}</div>`;
      area.querySelectorAll('.answer-btn').forEach(button => button.addEventListener('click', () => {
        const choice = Number(button.dataset.i);
        const correct = question.type === 'boolean' || question.type === 'true-false'
          ? (choice === 0) === (question.correctAnswer === 0 || question.correctAnswer === true)
          : choice === question.correctAnswer;
        if (correct) { score++; App.claimGameXP(10); }
        index++;
        setTimeout(render, 250);
      }));
    };
    render();
    if (seconds) this.timer = setInterval(() => {
      timeLeft--;
      const scoreLabel = area.querySelector('.game-score');
      if (scoreLabel) scoreLabel.textContent = `Вопрос ${Math.min(index + 1, questions.length)} из ${questions.length} · Счёт ${score} · ${timeLeft} сек.`;
      if (timeLeft <= 0) finish();
    }, 1000);
  },

  _mathBlitz(area) {
    const questions = GAME_DATA.mathBlitz.slice().sort(() => Math.random() - 0.5).slice(0, 8);
    let index = 0, score = 0;
    const render = () => {
      if (index >= questions.length) {
        area.innerHTML = this._gameOverHtml('calculator', 'Математический блиц', score, questions.length);
        document.getElementById('gameAgain').addEventListener('click', () => this.start('mathblitz'));
        return;
      }
      const item = questions[index];
      area.innerHTML = `<h3>Математический блиц</h3><p class="game-score">Пример ${index + 1} из ${questions.length} · Счёт ${score}</p><div class="game-word-big">${item.prompt}</div><form id="mathBlitzForm"><label class="input-answer-label" for="mathBlitzAnswer">Ответ</label><input class="answer-input" id="mathBlitzAnswer" inputmode="numeric" autocomplete="off"><button class="btn primary" type="submit">Проверить</button></form>`;
      const input = document.getElementById('mathBlitzAnswer');
      input.focus();
      document.getElementById('mathBlitzForm').addEventListener('submit', event => {
        event.preventDefault();
        if (Number(input.value) === item.answer) { score++; App.claimGameXP(10); }
        index++;
        render();
      });
    };
    render();
  },

  _findPair(area) {
    const pairs = GAME_DATA.pairs.slice(0, 4).sort(() => Math.random() - 0.5);
    const options = pairs.map(pair => pair.definition).sort(() => Math.random() - 0.5);
    let selected = null, matched = 0;
    area.innerHTML = `<h3>Найди пару: термин и определение</h3><p class="question-hint">Сначала выбери термин, затем соответствующее определение.</p><div class="pair-grid">${pairs.map((pair, index) => `<button class="answer-btn pair-term" data-pair="${index}">${pair.term}</button>`).join('')}${options.map((definition, index) => `<button class="answer-btn pair-definition" data-definition="${index}">${definition}</button>`).join('')}</div><p id="pairStatus" class="game-score">Найдено: 0 / ${pairs.length}</p>`;
    area.querySelectorAll('.pair-term').forEach(button => button.addEventListener('click', () => {
      area.querySelectorAll('.pair-term').forEach(item => item.classList.remove('selected'));
      selected = Number(button.dataset.pair); button.classList.add('selected');
    }));
    area.querySelectorAll('.pair-definition').forEach(button => button.addEventListener('click', () => {
      if (selected === null) { UI.showToast('Сначала выбери термин'); return; }
      const correct = pairs[selected].definition === options[Number(button.dataset.definition)];
      if (correct) {
        button.disabled = true; area.querySelector(`.pair-term[data-pair="${selected}"]`).disabled = true;
        button.classList.add('correct'); matched++; App.claimGameXP(20);
        document.getElementById('pairStatus').textContent = `Найдено: ${matched} / ${pairs.length}`;
        if (matched === pairs.length) UI.showToast('Все пары найдены');
      } else { button.classList.add('wrong'); setTimeout(() => button.classList.remove('wrong'), 600); }
      selected = null; area.querySelectorAll('.pair-term').forEach(item => item.classList.remove('selected'));
    }));
  },

  /* ---------- Найди местоимения ---------- */

  _gameFind(area) {
    const sentence = GAME_DATA.find.sentences[Math.floor(Math.random() * GAME_DATA.find.sentences.length)];
    const correctSet = new Set(sentence.correct);
    const selected = new Set();

    area.innerHTML = `<h3>${icon('search', 'ic-sm')} Найди местоимения</h3>
      <p class="question-hint">Нажимай на все местоимения в предложении:</p>
      <div class="word-row" id="findWords">
        ${sentence.words.map((w, i) => `<button class="word-btn" data-i="${i}">${w}</button>`).join('')}
      </div>
      <div style="margin-top:14px"><button class="btn primary" id="findDone">Проверить</button></div>`;

    area.querySelectorAll('#findWords .word-btn').forEach(b => {
      b.addEventListener('click', () => {
        const i = Number(b.dataset.i);
        if (selected.has(i)) { selected.delete(i); b.classList.remove('selected'); }
        else { selected.add(i); b.classList.add('selected'); }
      });
    });

    document.getElementById('findDone').addEventListener('click', () => {
      let allRight = true;
      area.querySelectorAll('#findWords .word-btn').forEach(b => {
        const i = Number(b.dataset.i);
        b.disabled = true;
        if (correctSet.has(i)) {
          b.classList.add('correct');
          if (!selected.has(i)) allRight = false;
        } else if (selected.has(i)) {
          b.classList.add('wrong');
          allRight = false;
        }
      });
      if (allRight) { const awarded = App.claimGameXP(20); UI.showToast(`${icon('check', 'ic-sm')} Отлично! Все местоимения найдены!${awarded ? ` +${awarded} XP` : ''}`); }
      else UI.showToast(`${icon('cross', 'ic-sm')} Есть ошибки. Зелёным подсвечены местоимения.`);
    });
  },

  /* ---------- Вставь местоимение ---------- */

  _gameInsert(area) {
    const items = GAME_DATA.insert.items.slice().sort(() => Math.random() - 0.5);
    let score = 0, idx = 0;

    const next = () => {
      if (idx >= items.length) {
        area.innerHTML = this._gameOverHtml('pencil', 'Вставь местоимение', score, items.length);
        document.getElementById('gameAgain').addEventListener('click', () => this.start('insert'));
        return;
      }
      const item = items[idx];
      area.innerHTML = `<h3>${icon('pencil', 'ic-sm')} Вставь местоимение</h3>
        <p class="game-score">Счёт: ${score} / ${idx}</p>
        <p class="question-text">${item.text}</p>
        <div class="answer-list" id="insertOptions">
          ${item.options.map((o, i) =>
            `<button class="answer-btn" data-i="${i}"><span class="letter">${i + 1}</span><span>${o}</span></button>`).join('')}
        </div>`;
      area.querySelectorAll('#insertOptions .answer-btn').forEach(b => {
        b.addEventListener('click', () => {
          const chosen = Number(b.dataset.i);
          area.querySelectorAll('#insertOptions .answer-btn').forEach(x => x.disabled = true);
          if (chosen === item.correct) {
            b.classList.add('correct'); score++;
            const awarded = App.claimGameXP(10);
            UI.showToast(`${icon('check', 'ic-sm')} Правильно!${awarded ? ` +${awarded} XP` : ' Дневной лимит XP достигнут.'}`);
          } else {
            b.classList.add('wrong');
            area.querySelector(`#insertOptions [data-i="${item.correct}"]`).classList.add('correct');
            UI.showToast(`${icon('cross', 'ic-sm')} ${item.explain}`);
          }
          idx++;
          setTimeout(next, 1000);
        });
      });
    };
    next();
  },

  /* ---------- Верно / неверно ---------- */

  _gameTrueFalse(area) {
    const items = GAME_DATA.truefalse.statements.slice().sort(() => Math.random() - 0.5).slice(0, 8);
    let score = 0, idx = 0;

    const next = () => {
      if (idx >= items.length) {
        area.innerHTML = this._gameOverHtml('check', 'Верно или неверно', score, items.length);
        document.getElementById('gameAgain').addEventListener('click', () => this.start('truefalse'));
        return;
      }
      const item = items[idx];
      area.innerHTML = `<h3>${icon('check', 'ic-sm')} Верно или неверно</h3>
        <p class="game-score">Счёт: ${score} / ${idx}</p>
        <div class="card statement-card">${item.text}</div>
        <div class="btn-row tf-row">
          <button class="btn secondary" id="tfTrue">Верно</button>
          <button class="btn danger" id="tfFalse">Неверно</button>
        </div>`;
      const answer = (value) => {
        const ok = value === item.correct;
        if (ok) { score++; const awarded = App.claimGameXP(10); UI.showToast(`${icon('check', 'ic-sm')} Верно!${awarded ? ` +${awarded} XP` : ''}`); }
        else UI.showToast(`${icon('cross', 'ic-sm')} ${item.explain}`);
        idx++;
        setTimeout(next, 1000);
      };
      document.getElementById('tfTrue').addEventListener('click', () => answer(true));
      document.getElementById('tfFalse').addEventListener('click', () => answer(false));
    };
    next();
  },

  /* ---------- Общий экран конца игры ---------- */

  _gameOverHtml(ico, title, score, total) {
    return `<h3>${icon(ico, 'ic-sm')} ${title}</h3>
      <p class="game-score">Игра окончена! Счёт: ${score} из ${total}</p>
      <p class="muted">Опыт за правильные ответы учтён. Лимит мини-игр: 100 XP в день.</p>
      <button class="btn primary" id="gameAgain">Играть снова</button>`;
  },

  /** Рендер сетки игр и обработчики. */
  init() {
    const grid = document.getElementById('gamesGrid');
    grid.innerHTML = this.list.map(g => `
      <button class="card game-card" data-game="${g.id}">
        <span class="game-icon">${icon(g.icon, 'ic-lg')}</span>
        <h3>${g.title}</h3><p class="muted">${g.desc}</p>
      </button>`).join('');

    grid.addEventListener('click', (e) => {
      const card = e.target.closest('[data-game]');
      if (card) this.start(card.dataset.game);
    });
  }
};
