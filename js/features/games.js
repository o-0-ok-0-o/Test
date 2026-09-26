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
    { id: 'replace', icon: 'repeat', title: 'Замени слово', desc: 'Существительное — местоимение: он, она или оно?' }
  ],

  /** Запускает игру по id. */
  start(id) {
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
      truefalse: () => this._gameTrueFalse(area)
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
            b.classList.add('correct'); score++; App.addXP(10, true);
            UI.showToast(`${icon('check', 'ic-sm')} Правильно! +10 XP`);
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
      if (allRight) { App.addXP(20); UI.showToast(`${icon('check', 'ic-sm')} Отлично! Все местоимения найдены! +20 XP`); }
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
            b.classList.add('correct'); score++; App.addXP(10, true);
            UI.showToast(`${icon('check', 'ic-sm')} Правильно! +10 XP`);
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
        if (ok) { score++; App.addXP(10, true); UI.showToast(`${icon('check', 'ic-sm')} Верно! +10 XP`); }
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
      <p class="muted">+${score * 5} XP</p>
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
