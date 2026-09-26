'use strict';

/* =========================================================
   review.js — полный разбор ответов после завершения теста
   Именно здесь пользователь узнаёт, где ошибся и почему.
   ========================================================= */

const Review = {
  /** Рисует список всех вопросов с результатами и объяснениями. */
  render() {
    const list = document.getElementById('reviewList');
    list.innerHTML = Quiz.results.map((r, i) => {
      const q = r.question;
      const userText = Quiz.formatUserAnswer(q, r.userAnswer);
      const correctText = Quiz.formatCorrectAnswer(q);
      const ok = r.isCorrect;

      let head = `<p class="review-head">${icon(ok ? 'check' : 'cross', 'ic-sm')}
        <span class="${ok ? 'ok-text' : 'bad-text'}">${ok ? 'Правильно' : 'Ошибка'}</span></p>`;

      let body = `<p class="review-q">${q.question}</p>
        <p><strong>Твой ответ:</strong> ${userText}</p>`;

      if (!ok) {
        body += `<p><strong>Правильный ответ:</strong> ${correctText}</p>
          <p><strong>Почему твой ответ неверный:</strong> ${q.explanation}</p>`;
      } else {
        body += `<p><strong>Пояснение:</strong> ${q.explanation}</p>`;
      }

      body += `<div class="rule-box">${icon('bulb', 'ic-sm')}<span><strong>Запомни:</strong> ${q.rule}</span></div>`;

      return `<div class="card review-item ${ok ? '' : 'wrong'}">${head}${body}</div>`;
    }).join('');
  }
};
