/* Вставляет теги подключения curriculum-модулей во все HTML-страницы:
   сразу после topics.js и до tests.js (tests.js собирает TESTS из COURSE_TOPICS). */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pages = ['index.html', 'grade.html', 'subject.html', 'quiz.html', 'topic.html', 'games.html', 'profile.html', 'results.html', 'mistakes.html'];
const modules = ['curriculum.js', 'curriculum-3-4.js', 'curriculum-5-7.js', 'curriculum-8.js', 'curriculum-9-11.js'];

const present = modules.filter(m => fs.existsSync(path.join(root, 'js', 'data', m)));
const anchor = '<script src="js/data/topics.js"></script>';
const block = present.map(m => `<script src="js/data/${m}"></script>`).join('\n  ');

pages.forEach(page => {
  const file = path.join(root, page);
  let html = fs.readFileSync(file, 'utf8');
  // topic.html держит все теги в одну строку — вставляем компактно, без переносов.
  const singleLine = !html.includes('\n  <script src="js/data/topics.js"></script>');
  const injection = singleLine ? present.map(m => `<script src="js/data/${m}"></script>`).join('') : '\n  ' + block;
  const already = html.includes('js/data/curriculum.js');
  if (already) {
    // Обновляем набор существующих тегов до актуального.
    html = html.replace(/(?:<script src="js\/data\/curriculum[^"]*\.js"><\/script>\s*)+/g, '');
    html = html.replace(anchor, anchor + injection);
  } else {
    html = html.replace(anchor, anchor + injection);
  }
  fs.writeFileSync(file, html);
  console.log('OK', page, singleLine ? '(inline)' : '(multiline)');
});
