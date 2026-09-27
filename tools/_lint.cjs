/* Временная проверка curriculum-модулей.
   1) Артефакты: латинское слово, зажатое между кириллическими буквами («СкобкиFirst»).
   2) Структура: парные кавычки, вложенные массивы вариантов, число тем/тестов/вопросов.
   3) Дубли id тем и тестов по всем модулям. */
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'js', 'data');
const files = (process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(dir).filter(f => /^curriculum.*\.js$/.test(f))).sort();
const report = [];
const topicIds = new Map();
const testIds = new Map();

for (const file of files) {
  const src = fs.readFileSync(path.join(dir, file), 'utf8');
  const lines = src.split('\n');

  lines.forEach((line, i) => {
    const hits = line.match(/[\u0410-\u044F][A-Za-z][A-Za-z'’-]{2,}[\u0410-\u044F]/g) || [];
    hits.forEach(h => report.push(`${file}:${i + 1} ARTIFACT ${h}`));
    if (/'\s*\[\s*\[/.test(line)) report.push(`${file}:${i + 1} NESTED_ARRAY ${line.trim().slice(0, 110)}`);
    const quotes = (line.match(/(?<!\\)'/g) || []).length;
    if (quotes % 2 !== 0) report.push(`${file}:${i + 1} ODD_QUOTES(${quotes}) ${line.trim().slice(0, 110)}`);
  });

  // Темы: id, класс, предмет; тесты и вопросы.
  const topicRe = /^    id: '([^']+)', grade: (\d+), subjectId: '([^']+)'/gm;
  let m, count = 0, byGrade = {};
  while ((m = topicRe.exec(src))) {
    count++;
    byGrade[m[2]] = (byGrade[m[2]] || 0) + 1;
    if (topicIds.has(m[1])) report.push(`${file} DUP_TOPIC ${m[1]} vs ${topicIds.get(m[1])}`);
    topicIds.set(m[1], file);
  }
  // Проверка, что у каждой темы ровно 2 теста и по 5 вопросов.
  const topics = src.split(/^  \{$/m).slice(1);
  topics.forEach(block => {
    const id = (block.match(/^    id: '([^']+)'/m) || [])[1];
    if (!id) return;
    const tests = (block.match(/\{ title: '[^']*', difficulty: \d+, questions: \[/g) || []).length;
    if (tests !== 2) report.push(`${file} TOPIC ${id} tests=${tests}`);
    const perTest = block.split(/\{ title: '[^']*', difficulty: \d+, questions: \[/).slice(1);
    perTest.forEach((chunk, ti) => {
      const q = (chunk.match(/^\s{8}\['/gm) || []).length;
      if (q < 5) report.push(`${file} TOPIC ${id} test#${ti + 1} questions=${q}`);
    });
  });

  const testCount = (src.match(/\{ title: '[^']*', difficulty: \d+, questions: \[/g) || []).length;
  const qTotal = (src.match(/^\s{8}\['/gm) || []).length;
  report.push(`# ${file}: topics=${count} [${Object.entries(byGrade).map(([g, n]) => g + 'кл:' + n).join(' ')}] tests=${testCount} questions=${qTotal}`);
}

fs.writeFileSync(path.join(__dirname, '_lint.txt'), report.join('\n'), 'utf8');
console.log('ISSUES', report.filter(r => !r.startsWith('#')).length);
