'use strict';

/* =========================================================
   icons.js — хелпер для SVG-иконок (эмодзи запрещены)
   Иконки объявлены в SVG-спрайте в начале каждого HTML-файла
   ========================================================= */

/**
 * Возвращает HTML-строку с SVG-иконкой.
 * @param {string} name - имя иконки из спрайта (без префикса "icon-")
 * @param {string} [size] - класс размера: '', 'ic-sm', 'ic-lg', 'ic-xl'
 * @returns {string}
 */
function icon(name, size = '') {
  return `<svg class="ic ${size}" aria-hidden="true"><use href="#icon-${name}"/></svg>`;
}
