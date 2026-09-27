'use strict';

/* Предметный каталог задаёт доступность и цвет; наполнение темами — в topics.js. */
const SUBJECTS = [
  { id: 'math', title: 'Математика', icon: 'calculator', desc: 'Числа, алгебра и геометрия', color: 'math', grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
  { id: 'algebra', title: 'Алгебра', icon: 'chart', desc: 'Выражения, уравнения и функции', color: 'algebra', grades: [7, 8, 9, 10, 11] },
  { id: 'geometry', title: 'Геометрия', icon: 'compass', desc: 'Фигуры, измерения и доказательства', color: 'geometry', grades: [7, 8, 9, 10, 11] },
  { id: 'physics', title: 'Физика', icon: 'target', desc: 'Законы природы и эксперименты', color: 'physics', grades: [7, 8, 9, 10, 11] },
  { id: 'chemistry', title: 'Химия', icon: 'bulb', desc: 'Вещества и химические реакции', color: 'chemistry', grades: [8, 9, 10, 11] },
  { id: 'biology', title: 'Биология', icon: 'leaf', desc: 'Живые системы и их разнообразие', color: 'biology', grades: [5, 6, 7, 8, 9, 10, 11] },
  { id: 'russian', title: 'Русский язык', icon: 'book', desc: 'Грамматика, орфография и речь', color: 'russian', grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
  { id: 'reading', title: 'Литературное чтение', icon: 'feather', desc: 'Сказки, рассказы и выразительное чтение', color: 'reading', grades: [1, 2, 3, 4] },
  { id: 'world', title: 'Окружающий мир', icon: 'globe', desc: 'Природа, человек и общество вокруг нас', color: 'world', grades: [1, 2, 3, 4] },
  { id: 'literature', title: 'Литература', icon: 'feather', desc: 'Произведения и литературные жанры', color: 'literature', grades: [5, 6, 7, 8, 9, 10, 11] },
  { id: 'history', title: 'История', icon: 'flag', desc: 'История России и мира', color: 'history', grades: [5, 6, 7, 8, 9, 10, 11] },
  { id: 'social', title: 'Обществознание', icon: 'layers', desc: 'Общество, право и экономика', color: 'social', grades: [6, 7, 8, 9, 10, 11] },
  { id: 'geography', title: 'География', icon: 'globe', desc: 'Земля, страны и природные системы', color: 'geography', grades: [5, 6, 7, 8, 9, 10, 11] },
  { id: 'english', title: 'Английский язык', icon: 'globe', desc: 'Грамматика, слова и общение', color: 'english', grades: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
  { id: 'informatics', title: 'Информатика', icon: 'chip', desc: 'Алгоритмы, данные и программирование', color: 'informatics', grades: [7, 8, 9, 10, 11] }
];

function subjectsForGrade(grade) {
  return SUBJECTS.filter(subject => subject.grades.includes(Number(grade)));
}

function getSubject(subjectId) {
  return SUBJECTS.find(subject => subject.id === subjectId) || null;
}

function getSubjectsForGrade(grade) {
  const ids = new Set(COURSE_TOPICS.filter(topic => topic.grade === Number(grade)).map(topic => topic.subjectId));
  return SUBJECTS.filter(subject => subject.grades.includes(Number(grade)) && ids.has(subject.id));
}
