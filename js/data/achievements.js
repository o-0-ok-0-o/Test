'use strict';

/* =========================================================
   achievements.js — список достижений
   id — ключ в LocalStorage, icon — имя SVG-иконки из спрайта
   ========================================================= */

const ACHIEVEMENTS = [
  { id: 'first', icon: 'medal', name: 'Первый тест', desc: 'Заверши первую проверку знаний' },
  { id: 'perfect', icon: 'trophy', name: 'Идеальный результат', desc: 'Ответь правильно на все вопросы теста' },
  { id: 'streak', icon: 'fire', name: 'Серия из 10', desc: 'Ответь правильно на 10 вопросов подряд' },
  { id: 'streak20', icon: 'fire', name: 'Без остановки', desc: 'Ответь правильно на 20 вопросов подряд' },
  { id: 'fiveDays', icon: 'clock', name: 'Пять дней учёбы', desc: 'Занимайся 5 дней подряд' },
  { id: 'tenDays', icon: 'clock', name: 'Привычка учиться', desc: 'Занимайся 10 дней подряд' },
  { id: 'firstTopic', icon: 'check', name: 'Первая тема освоена', desc: 'Получи 80% или больше за тест по теме' },
  { id: 'tenTopics', icon: 'layers', name: 'Знаток программы', desc: 'Освой 10 тем' },
  { id: 'thousandXP', icon: 'star', name: 'Тысяча опыта', desc: 'Набери 1000 XP' },
  { id: 'fiveThousandXP', icon: 'star', name: 'Пять тысяч опыта', desc: 'Набери 5000 XP' },
  { id: 'accuracy', icon: 'target', name: 'Точность', desc: 'Ответь правильно на 15 вопросов за тест' },
  { id: 'repeat', icon: 'repeat', name: 'Повторение', desc: 'Пройди тест повторно' },
  { id: 'gamer', icon: 'gamepad', name: 'Игрок', desc: 'Сыграй в любую мини-игру' }
];
