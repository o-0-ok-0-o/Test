'use strict';

/* =========================================================
   games.js — мини-игры (3 игры)
   ========================================================= */

const Games = {
  /** Запускает игру по типу. */
  start(type) {
    const area = document.getElementById('gameArea');
    area.hidden = false;
    if (type === 'face') this._gameFace(area);
    else if (type === 'find') this._gameFind(area);
    else if (type === 'insert') this._gameInsert(area);
    area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  _header(area, title, score) {
    area.innerHTML = `<h3>${title}</h3><p class="game-score">Счёт: ${score}</p>`;
  },

  /* Игра 1: Определи лицо */
  _gameFace(area) {
    let score = 0, round = 0;
    const total = 8;
    const words = GAME_DATA.face.words.slice().sort(() => Math.random() - 0.5);

    const next = () => {
      if (round >= total) {
        area.innerHTML = `<h3>${icon('mask', 'ic-sm')} Определи лицо</h3>
          <p class="game-score">Игра окончена! Счёт: ${score} из ${total}</p>
          <p class="muted">+${score * 5} XP</p>
          <button class="btn primary" id="gameAgain">Играть снова</button>`;
        App.addXP(score * 5);
        document.getElementById('gameAgain').addEventListener('click', () => this._gameFace(area));
        return;
      }
      const word = words[round % words.length];
      this._header(area, `${icon('mask', 'ic-sm')} Определи лицо`, `${score} / ${round}`);
      area.insertAdjacentHTML('beforeend',
        `<div class="game-word-big">${word}</div>
         <div class="answer-list" id="faceOptions">
          ${GAME_DATA.face.faces.map((f, i) =>
            `<button class="answer-btn" data-i="${i}"><span class="letter">${i + 1}</span><span>${f}</span></button>`).join('')}
         </div>`);
      area.querySelectorAll('#faceOptions .answer-btn').forEach(b => {
        b.addEventListener('click', () => {
          const chosen = Number(b.dataset.i);
          const correct = GAME_DATA.face.faceOf[word];
          area.querySelectorAll('#faceOptions .answer-btn').forEach(x => x.disabled = true);
          if (chosen === correct) {
            b.classList.add('correct'); score++; App.addXP(10, true);
            UI.showToast(`${icon('check', 'ic-sm')} Правильно! +10 XP`);
          } else {
            b.classList.add('wrong');
            area.querySelector(`#faceOptions [data-i="${correct}"]`).classList.add('correct');
            UI.showToast(`${icon('cross', 'ic-sm')} Правильно: ${GAME_DATA.face.faces[correct]}`);
          }
          round++;
          setTimeout(next, 900);
        });
      });
    };
    next();
  },

  /* Игра 2: Найди местоимения */
  _gameFind(area) {
    const sentence = GAME_DATA.find.sentences[Math.floor(Math.random() * GAME_DATA.find.sentences.length)];
    const correctSet = new Set(sentence.correct);
    const selected = new Set();

    this._header(area, `${icon('search', 'ic-sm')} Найди местоимения`, '0');
    area.insertAdjacentHTML('beforeend',
      `<p class="question-hint">Нажимай на все местоимения в предложении:</p>
       <div class="word-row" id="findWords">
        ${sentence.words.map((w, i) => `<button class="word-btn" data-i="${i}">${w}</button>`).join('')}
       </div>
       <div style="margin-top:14px"><button class="btn primary" id="findDone">Проверить</button></div>`);

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

  /* Игра 3: Вставь местоимение */
  _gameInsert(area) {
    const items = GAME_DATA.insert.items.slice().sort(() => Math.random() - 0.5);
    let score = 0, idx = 0;

    const next = () => {
      if (idx >= items.length) {
        area.innerHTML = `<h3>${icon('pencil', 'ic-sm')} Вставь местоимение</h3>
          <p class="game-score">Игра окончена! Счёт: ${score} из ${items.length}</p>
          <button class="btn primary" id="gameAgain">Играть снова</button>`;
        App.addXP(score * 5);
        document.getElementById('gameAgain').addEventListener('click', () => this._gameInsert(area));
        return;
      }
      const item = items[idx];
      this._header(area, `${icon('pencil', 'ic-sm')} Вставь местоимение`, `${score} / ${idx}`);
      area.insertAdjacentHTML('beforeend',
        `<p class="question-text">${item.text}</p>
         <div class="answer-list" id="insertOptions">
          ${item.options.map((o, i) =>
            `<button class="answer-btn" data-i="${i}"><span class="letter">${i + 1}</span><span>${o}</span></button>`).join('')}
         </div>`);
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

  init() {
    document.querySelectorAll('.game-card').forEach(btn => {
      btn.addEventListener('click', () => this.start(btn.dataset.game));
    });
  }
};
