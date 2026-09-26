'use strict';

/* =========================================================
   achievements.js — список достижений
   id — ключ в LocalStorage, icon — имя SVG-иконки из спрайта
   ========================================================= */

const ACHIEVEMENTS = [
  { id: 'first', icon: 'medal', name: 'Первый шаг', desc: 'Пройди первый тест' },
  { id: 'accuracy', icon: 'target', name: 'Точность', desc: 'Ответь правильно на 15 вопросов за тест' },
  { id: 'streak', icon: 'fire', name: 'Серия', desc: 'Ответь правильно на 10 вопросов подряд' },
  { id: 'perfect', icon: 'trophy', name: 'Идеал', desc: 'Ответь правильно на все 20 вопросов' },
  { id: 'repeat', icon: 'repeat', name: 'Повторение', desc: 'Пройди тест повторно' }
];
