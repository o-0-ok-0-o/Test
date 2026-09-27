/* Валидатор учебных данных: загружает модули каталога в общем скоупе и проверяет целостность. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'js', 'data');
const files = ['grades.js', 'subjects.js', 'topics.js', 'curriculum.js', 'curriculum-3-4.js', 'curriculum-5-7.js', 'curriculum-8.js', 'curriculum-9-11.js', 'tests.js'];

const ctx = { console, Math, JSON, Date, Number, String, Array, Object, Set, Boolean };
vm.createContext(ctx);

// Все модули выполняются одним скриптом: в браузере они делят один глобальный
// скоуп, а const-объявления в vm не попадают в объект контекста.
const loaded = [];
let source = '';
for (const file of files) {
  const full = path.join(dataDir, file);
  if (!fs.existsSync(full)) { console.log('SKIP (нет файла):', file); continue; }
  source += `\n/* ==== ${file} ==== */\n` + fs.readFileSync(full, 'utf8');
  loaded.push(file);
}
source += '\n;globalThis.__snapshot = { COURSE_TOPICS: typeof COURSE_TOPICS !== "undefined" ? COURSE_TOPICS : [], TESTS: typeof TESTS !== "undefined" ? TESTS : [], GRADES: typeof GRADES !== "undefined" ? GRADES : [], SUBJECTS: typeof SUBJECTS !== "undefined" ? SUBJECTS : [] };';
try {
  vm.runInContext(source, ctx, { filename: 'bundle' });
} catch (e) {
  console.error('ОШИБКА ЗАГРУЗКИ ->', e.message);
  process.exit(1);
}
Object.assign(ctx, ctx.__snapshot);

const topics = ctx.COURSE_TOPICS || [];
const tests = ctx.TESTS || [];
const grades = ctx.GRADES || [];
const subjects = ctx.SUBJECTS || [];
const errors = [];
const warnings = [];
const topicsBelowTestMinimum = [];
const testsBelowQuestionMinimum = [];

const topicIds = new Set();
const testIds = new Set();
const gradeIds = new Set(grades.map(g => Number(g.id !== undefined ? g.id : g.grade)));
const subjectIds = new Set(subjects.map(s => s.id));
const QUIZ_TYPES = new Set(['single', 'multi', 'select', 'find', 'match', 'input', 'boolean', 'true-false', 'order']);

const asList = v => (Array.isArray(v) ? v : typeof v === 'number' ? [v] : []);

topics.forEach((t, i) => {
  const where = `topic[${i}] ${t && t.id}`;
  if (!t || typeof t !== 'object') { errors.push(`${where}: не объект`); return; }
  ['id', 'grade', 'subjectId', 'title', 'theoryHtml', 'tests'].forEach(f => {
    if (t[f] === undefined || t[f] === null || t[f] === '') errors.push(`${where}: пусто поле ${f}`);
  });
  if (topicIds.has(t.id)) errors.push(`${where}: дубликат id темы`);
  topicIds.add(t.id);
  if (!gradeIds.has(Number(t.grade))) errors.push(`${where}: класс ${t.grade} отсутствует в GRADES`);
  if (!subjectIds.has(t.subjectId)) errors.push(`${where}: предмет ${t.subjectId} отсутствует в SUBJECTS`);
  const subject = subjects.find(s => s.id === t.subjectId);
  if (subject && Array.isArray(subject.grades) && !subject.grades.includes(Number(t.grade))) {
    errors.push(`${where}: предмет ${t.subjectId} недоступен в классе ${t.grade}`);
  }
  if (!Array.isArray(t.tests) || t.tests.length === 0) { errors.push(`${where}: нет тестов`); return; }
  if (t.tests.length < 5) {
    const item = { id: t.id, grade: t.grade, subjectId: t.subjectId, title: t.title, count: t.tests.length };
    topicsBelowTestMinimum.push(item);
    warnings.push(`${where}: ${t.tests.length} тестов (требуется не менее 5)`);
  }
  if (!Array.isArray(t.practiceQuestions) || t.practiceQuestions.length === 0) warnings.push(`${where}: нет practiceQuestions`);

  t.tests.forEach(test => {
    if (!Array.isArray(test.questions) || test.questions.length < 20) {
      const item = { id: test.id, title: test.title, topicId: t.id, topicTitle: t.title, grade: t.grade, subjectId: t.subjectId, count: test.questions ? test.questions.length : 0 };
      testsBelowQuestionMinimum.push(item);
    }
    if (testIds.has(test.id)) errors.push(`${where}: дубликат id теста ${test.id}`);
    testIds.add(test.id);
    if (!test.title) errors.push(`${test.id}: пустой title`);
    if (!Array.isArray(test.questions) || test.questions.length < 20) warnings.push(`${test.id}: вопросов ${test.questions ? test.questions.length : 0} (требуется не менее 20)`);
    (test.questions || []).forEach(q => {
      if (!q.id) errors.push(`${test.id}: вопрос без id`);
      if (!QUIZ_TYPES.has(q.type)) errors.push(`${q.id}: неизвестный тип ${q.type}`);
      if (!q.question) errors.push(`${q.id}: пустой текст вопроса`);
      if (!q.explanation) warnings.push(`${q.id}: нет объяснения`);
      if (q.type === 'single') {
        if (!Array.isArray(q.answers) || q.answers.length < 2) errors.push(`${q.id}: нет вариантов`);
        else {
          if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer >= q.answers.length) errors.push(`${q.id}: корректный индекс вне диапазона: ${q.correctAnswer}`);
          if (new Set(q.answers).size !== q.answers.length) errors.push(`${q.id}: дубликаты вариантов: ${JSON.stringify(q.answers)}`);
        }
      }
    if (q.type === 'multi') {
      const correct = asList(q.correctAnswer);
      if (!Array.isArray(q.answers) || !correct.length) errors.push(`${q.id}: multi без данных`);
      else {
        correct.forEach(c => { if (typeof c !== 'number' || c < 0 || c >= q.answers.length) errors.push(`${q.id}: индекс multi вне диапазона: ${c}`); });
        if (new Set(q.answers).size !== q.answers.length) errors.push(`${q.id}: дубликаты вариантов: ${JSON.stringify(q.answers)}`);
      }
    }
    if (['single', 'select', 'boolean', 'true-false'].includes(q.type)) {
      if (!Array.isArray(q.answers) || q.answers.length < 2) errors.push(`${q.id}: нет вариантов ответа`);
      else if (!Number.isInteger(q.correctAnswer) || q.correctAnswer < 0 || q.correctAnswer >= q.answers.length) errors.push(`${q.id}: корректный индекс вне диапазона: ${q.correctAnswer}`);
    }
    if (q.type === 'find' && (!Array.isArray(q.words) || !asList(q.correctAnswer).length || asList(q.correctAnswer).some(index => index < 0 || index >= q.words.length))) errors.push(`${q.id}: некорректные слова или индексы ответа find`);
    if (q.type === 'order' && (!Array.isArray(q.answers) || !Array.isArray(q.correctAnswer) || q.correctAnswer.length !== q.answers.length || q.correctAnswer.some(index => !Number.isInteger(index) || index < 0 || index >= q.answers.length))) errors.push(`${q.id}: некорректный порядок ответов`);
    if (q.type === 'match' && (!Array.isArray(q.pairs) || !q.pairs.length || q.pairs.some((pair, index) => !Array.isArray(pair.options || q.pairs.map(item => item.right)) || (pair.correct ?? index) < 0 || (pair.correct ?? index) >= (pair.options || q.pairs.map(item => item.right)).length))) errors.push(`${q.id}: некорректные данные сопоставления`);

      if (q.type === 'input' && (q.correctAnswer === undefined || q.correctAnswer === null || q.correctAnswer === '')) errors.push(`${q.id}: input без correctAnswer`);
    });
  });
});

const stats = {};
topics.forEach(t => {
  const g = t.grade;
  stats[g] = stats[g] || { topics: 0, tests: 0, questions: 0 };
  stats[g].topics += 1;
  t.tests.forEach(test => { stats[g].tests += 1; stats[g].questions += (test.questions || []).length; });
});

const auditReport = [
  '# Аудит наполнения учебного каталога',
  '',
  `Проверка выполнена: ${new Date().toISOString().slice(0, 10)}.`,
  '',
  '## Критерии',
  '',
  '- В каждой теме должно быть не менее 5 тестов.',
  '- В каждом тесте должно быть не менее 20 вопросов.',
  '- В отчёте перечислены только темы и тесты, не достигающие этих минимумов.',
  '',
  `Всего в каталоге: ${topics.length} тем и ${testIds.size} тестов.`,
  `Не соответствует минимуму тестов: ${topicsBelowTestMinimum.length} тем.`,
  `Не соответствует минимуму вопросов: ${testsBelowQuestionMinimum.length} тестов.`,
  '',
  '## Темы: менее 5 тестов',
  '',
  ...(topicsBelowTestMinimum.length ? topicsBelowTestMinimum.map(item => `- ${item.grade} класс · ${item.subjectId} · **${item.title}** (\`${item.id}\`): ${item.count} ${item.count === 1 ? 'тест' : 'тестов'}.`) : ['- Нет нарушений.']),
  '',
  '## Тесты: менее 20 вопросов',
  '',
  ...(testsBelowQuestionMinimum.length ? testsBelowQuestionMinimum.map(item => `- ${item.grade} класс · ${item.subjectId} · ${item.topicTitle} → **${item.title}** (\`${item.id}\`): ${item.count} вопросов.`) : ['- Нет нарушений.']),
  '',
  'Отчёт сформирован командой `node tools/validate-data.cjs`.'
].join('\n') + '\n';
fs.writeFileSync(path.join(root, 'docs', 'CONTENT_AUDIT.md'), auditReport, 'utf8');

console.log('Загружено файлов:', loaded.join(', '));
console.log('Тем:', topics.length, '| Тестов (из тем):', testIds.size, '| TESTS всего:', tests.length);
console.log('По классам:');
Object.keys(stats).sort((a, b) => a - b).forEach(g => console.log(`  ${g} класс: тем ${stats[g].topics}, тестов ${stats[g].tests}, вопросов ${stats[g].questions}`));
console.log('Ошибок:', errors.length, '| Предупреждений:', warnings.length);
console.log(`Тем с количеством тестов менее 5: ${topicsBelowTestMinimum.length} (полный список: docs/CONTENT_AUDIT.md)`);
console.log(`Тестов с количеством вопросов менее 20: ${testsBelowQuestionMinimum.length} (полный список: docs/CONTENT_AUDIT.md)`);
errors.slice(0, 60).forEach(e => console.error('  ERROR', e));
warnings.slice(0, 40).forEach(w => console.warn('  WARN ', w));
process.exit(errors.length ? 1 : 0);
