import './style.css';
import { loadProperties } from './properties.js';

// Identificador asignado al preparar una versión para QA.
// Se conserva al promover la versión aprobada a producción.
import { releaseId } from '../package.json';

// Identifica el ambiente sin modificar el número de versión.
// Localhost y QA muestran Preview; producción muestra Release.
const isPreview =
  import.meta.env.DEV ||
  import.meta.env.VITE_DEPLOY_CHANNEL === 'preview';

/** Estado de navegación. Los textos, las imágenes y las URLs vienen de .properties. */
const app = document.querySelector('#app');

/** Estado de la interfaz y referencia del último prompt copiado. */
const state = { 
  config: {},
  translations: {},
  language: '',
  current: 0,
  carousel: 0,
  toast: false,
  copiedText: null
};

const val = (key) => state.translations[key] ?? `[${key}]`;
const conf = (key) => state.config[key] ?? '';
const imageUrl = (name) => `${import.meta.env.BASE_URL}${conf('site.imagesPath').replace(/^\//, '').replace(/\/$/, '')}/${name}`;
const safe = (text) => String(text).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const num = (i) => String(i + 1).padStart(2, '0');

/** Construye tablas a partir de las celdas localizadas, sin valores hardcodeados. */
function makeTable(prefix, rows, cols) {
  let html = '<div class="table-scroll"><table><thead><tr>';
  for (let c = 0; c < cols; c++) html += `<th>${safe(val(`${prefix}.0.${c}`))}</th>`;
  html += '</tr></thead><tbody>';
  for (let r = 1; r < rows; r++) {
    html += '<tr>';
    for (let c = 0; c < cols; c++) html += `<td>${safe(val(`${prefix}.${r}.${c}`))}</td>`;
    html += '</tr>';
  }
  return html + '</tbody></table></div>';
}

/**
 * Muestra las notas de cada prompt.
 * El prompt 10 utiliza una etiqueta específica para su nota de uso.
 * Los textos se obtienen de los archivos .properties
 * AMU-Chatia, lun 12/oct/2026
 */
function notes(id) {
  return ['note', 'tip']
    .filter((kind) => state.translations[`prompt.${id}.${kind}`])
    .map((kind) => {
      const labelKey =
        kind === 'tip'
          ? 'label.tips'
          : id === '10'
            ? 'label.practicalNote'
            : 'label.note';

      return `<div class="note">
        <strong>${safe(val(labelKey))}</strong>
        <p>${safe(val(`prompt.${id}.${kind}`))}</p>
      </div>`;
    })
    .join('');
}

function media(id) {
  if (id !== '10') return `<figure><img loading="lazy" src="${safe(imageUrl(conf(`prompt.${id}.image`)))}" alt="${safe(val(`prompt.${id}.title`))}"/><figcaption>${safe(val('label.image'))}</figcaption></figure>`;
  const key = `carousel.${state.carousel + 1}.image`;
  return `<div class="carousel"><figure><img src="${safe(imageUrl(conf(key)))}" alt="${safe(val(`carousel.${state.carousel + 1}.label`))}"/><figcaption>${safe(val('label.image'))}</figcaption></figure><div class="carousel-nav"><button data-action="carousel-prev" ${state.carousel === 0 ? 'disabled' : ''}>← ${safe(val('action.previous'))}</button><span>${safe(val(`carousel.${state.carousel + 1}.label`))}</span><button data-action="carousel-next" ${state.carousel === Number(conf('site.carouselCount')) - 1 ? 'disabled' : ''}>${safe(val('action.next'))} →</button></div><p class="subtle">${safe(val('label.carousel_info'))}</p></div>`;
}
/** Pintado reactivo simple, sin dependencias de interfaz ni textos fijos. */
function render() {
  const count = Number(conf('site.promptCount'));
  const id = num(state.current);
  document.documentElement.lang = state.language;
  document.title = `${val('site.title')} | TDS`;
  document.documentElement.style.setProperty('--brand', conf('site.brandColour'));
  app.innerHTML = `<div class="shell" id="top"><header><div class="brand-mark">✦</div><span>${safe(val('site.brand'))}</span><div class="langs" aria-label="${safe(val('label.lang'))}">${conf('site.availableLanguages').split(',').map((lang) => `<button data-lang="${lang}" ${state.language === lang ? 'class="active" aria-pressed="true"' : 'aria-pressed="false"'}>${lang.toUpperCase()}</button>`).join('')}</div></header>
  <section class="hero"><span class="eyebrow">${safe(val('site.kicker'))}</span><h1>${safe(val('site.title'))}</h1><p>${safe(val('site.description'))}</p></section>
  <section class="ref intro-ref"><h2>${safe(val('label.aspect'))}</h2><div class="ratio-figs"><div><i class="ratio r11"></i><span>1:1</span></div><div><i class="ratio r45"></i><span>4:5</span></div><div><i class="ratio r916"></i><span>9:16</span></div><div><i class="ratio r169"></i><span>16:9</span></div></div>${makeTable('ratio', 5, 3)}<p class="small">${safe(val('label.ratio.note'))}</p></section>
  <section class="catalog"><h2>${safe(val('nav.techniques'))}</h2><nav class="tech-nav" aria-label="${safe(val('label.menu'))}">${Array.from({ length: count }, (_, i) => `<button data-prompt="${i}" class="${i === state.current ? 'active' : ''}" aria-label="${num(i)} ${safe(val(`prompt.${num(i)}.title`))}" title="${safe(val(`prompt.${num(i)}.title`))}" ${i === state.current ? 'aria-current="true"' : ''}>${num(i)}</button>`).join('')}</nav>
  <article class="tech"><div class="tech-title"><span>${id}</span><h2>${safe(val(`prompt.${id}.title`))}</h2></div><div class="tech-grid"><div class="tech-content"><h3>${safe(val('label.objective'))}</h3><p>${safe(val(`prompt.${id}.objective`))}</p><h3>${safe(val('label.prompt'))}</h3><div class="prompt-text" id="promptText">${safe(val(`prompt.${id}.body`))}</div><button class="copy" data-action="copy">${safe(val(state.toast ? 'action.copied' : 'action.copy'))}</button><p class="small clipboard-note">${safe(val('label.clipboard.note'))}</p>${notes(id)}</div><div class="tech-media">${media(id)}</div></div>
  ${id === '04' ? `<section class="dimensions"><h3>${safe(val('label.dims'))}</h3>${makeTable('dim', 4, 3)}<p class="small">${safe(val('label.dim.note'))}</p></section>` : ''}</article><div class="paging"><button data-action="prev" ${state.current === 0 ? 'disabled' : ''}>← ${safe(val('action.previous'))}</button><span>${state.current + 1} / ${count}</span><button data-action="next" ${state.current === count - 1 ? 'disabled' : ''}>${safe(val('action.next'))} →</button></div></section>
  <section class="ref sources"><h2>${safe(val('label.sources'))}</h2><div class="source-links">${Array.from({length: 4},(_,i) => `<a href="${safe(conf(`site.sources.${i+1}.url`))}" target="_blank" rel="noopener noreferrer">${safe(val(`source.${i+1}.title`))} ↗</a>`).join('')}</div></section><footer><span>${safe(val('label.footer'))}${releaseId ? ` | ${safe(val(isPreview ? 'label.preview' : 'label.release'))} ${safe(releaseId)}` : ''}</span><a href="#top">${safe(val('label.backtop'))} ↑</a></footer></div>`;
}
async function switchLanguage(lang) {
  if (!conf('site.availableLanguages').split(',').includes(lang)) return;
  state.translations = await loadProperties(`i18n/${lang}.properties`);
  state.language = lang;
  state.toast = false;
  render();
}

/**
 * Comprueba si el último prompt copiado permanece en el portapapeles.
 * No modifica el estado cuando el navegador impide leer su contenido.
 */
async function checkClipboard() {
  if (!state.toast || state.copiedText === null) return;
  if (!navigator.clipboard?.readText) return;

  const expectedText = state.copiedText;

  try {
    const clipboardText = await navigator.clipboard.readText();

    // Evita aplicar resultados antiguos si el usuario copió otro prompt.
    if (state.copiedText !== expectedText || !state.toast) return;

    if (clipboardText !== expectedText) {
      state.toast = false;
      state.copiedText = null;
      render();
    }
  } catch {
    // Sin permiso de lectura, conservamos el estado anterior.
  }
}

/** Comprueba el portapapeles cuando el usuario regresa a la pestaña. */
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) void checkClipboard();
});

window.addEventListener('focus', () => {
  void checkClipboard();
});

/** Delegación de eventos: los botones siguen funcionando tras cada actualización. */
app.addEventListener('click', async (event) => {
  const language = event.target.closest('[data-lang]');
  if (language) { await switchLanguage(language.dataset.lang); return; }
  const tab = event.target.closest('[data-prompt]');
  if (tab) { state.current = Number(tab.dataset.prompt); state.carousel = 0; state.toast = false; render(); return; }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;
  if (action === 'copy') {
    const body = val(`prompt.${num(state.current)}.body`);
    try { await navigator.clipboard.writeText(body);
      // Conserva el contenido que se copió correctamente.
      state.copiedText = body;
      state.toast = true;
      render(); }
    catch { window.alert(val('label.copy_error')); }
    return;
  }
  if (action === 'next' || action === 'prev') { state.current += action === 'next' ? 1 : -1; state.carousel = 0; }
  if (action === 'carousel-next' || action === 'carousel-prev') state.carousel += action === 'carousel-next' ? 1 : -1;
  state.toast = false; render();
});

/** Punto de arranque; Vite sirve public/ en la raíz tanto en local como al compilar. */
async function start() {
  try {
    state.config = await loadProperties('config/site.properties');
    await switchLanguage(conf('site.defaultLanguage'));
  } catch (err) {
    // Fallos técnicos se muestran sin inventar traducciones cuando los archivos aún no cargan.
    app.textContent = `Configuration error: ${err.message}`;
    console.error(err);
  }
}
start();
