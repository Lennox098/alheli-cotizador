/*
 * TUTORIAL GUIADO: "Cómo hacer una cotización"
 * Se reproduce sobre la aplicación real (tutorial.html). Un cursor animado hace
 * clic y escribe, y los subtítulos explican cada paso. Usa un espacio de datos
 * aparte (modo tutorial), así que no toca las cotizaciones reales.
 */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------------- estado del reproductor ---------------- */
  let speed = 1;
  let paused = true;
  let fast = false;          // al saltar de capítulo se avanza sin animaciones
  let runId = 0;
  let stepIdx = 0;
  const ABORT = new Error('abort');

  /* ---------------- interfaz del reproductor ---------------- */
  const ui = document.createElement('div');
  ui.className = 'tut';
  ui.innerHTML = `
    <div class="tut-cursor" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24"><path d="M4 2l15 9.5-6.6 1.3 3.9 7.4-3 1.6-3.9-7.4L4 19z" fill="#fff" stroke="#2a2326" stroke-width="1.6" stroke-linejoin="round"/></svg></div>
    <div class="tut-ring" aria-hidden="true"></div>
    <div class="tut-ripple" aria-hidden="true"></div>
    <img class="tut-fly" alt="" aria-hidden="true">
    <div class="tut-poster">
      <div class="tut-poster-card">
        <p class="tut-eyebrow">Tutorial en video · 4 minutos</p>
        <h2>Cómo hacer una cotización en Alhelí</h2>
        <p>Mire cómo se crea una cotización completa: datos del cliente, arreglos con plantillas, fotos, costos internos, pedido de flores y descarga en PDF o Excel. Se usa un espacio de práctica: sus cotizaciones reales no se tocan.</p>
        <button class="tut-big" data-t="play">▶ Ver el tutorial</button>
        <div class="tut-chapters"></div>
      </div>
    </div>
    <div class="tut-bar" role="region" aria-label="Tutorial">
      <div class="tut-caption"><span class="tut-ch"></span><p class="tut-text">Pulse ▶ para empezar.</p></div>
      <div class="tut-ctrl">
        <button data-t="prev" title="Capítulo anterior">⏮</button>
        <button data-t="play" class="tut-play" title="Reproducir / pausar">▶</button>
        <button data-t="next" title="Capítulo siguiente">⏭</button>
        <div class="tut-track"><i></i></div>
        <select data-t="speed" title="Velocidad"><option value="0.75">0,75×</option><option value="1" selected>1×</option><option value="1.5">1,5×</option><option value="2">2×</option></select>
        <button data-t="restart" title="Volver a empezar">↺</button>
        <button data-t="close" title="Salir del tutorial e ir a la aplicación">✕ Salir</button>
      </div>
    </div>`;
  document.body.appendChild(ui);
  document.body.classList.add('tut-on');
  const cursor = $('.tut-cursor', ui), ring = $('.tut-ring', ui), ripple = $('.tut-ripple', ui), fly = $('.tut-fly', ui);
  const textEl = $('.tut-text', ui), chEl = $('.tut-ch', ui), track = $('.tut-track i', ui), playBtn = $('.tut-play', ui);

  /* ---------------- utilidades de tiempo ---------------- */
  async function sleep(ms) {
    const id = runId;
    let left = fast ? 0 : ms / speed;
    while (true) {
      if (id !== runId) throw ABORT;
      if (paused && !fast) { await new Promise((r) => setTimeout(r, 120)); continue; }
      if (left <= 0) break;
      const d = Math.min(left, 100);
      await new Promise((r) => setTimeout(r, d));
      left -= d;
    }
    if (id !== runId) throw ABORT;
  }
  const until = async (fn, max = 4000) => { const t0 = Date.now(); while (!fn() && Date.now() - t0 < max) await new Promise((r) => setTimeout(r, 60)); return fn(); };

  /* ---------------- acciones del cursor ---------------- */
  function center(el) { const r = el.getBoundingClientRect(); return { x: r.left + Math.min(r.width / 2, 60), y: r.top + r.height / 2 }; }
  async function show(el) {
    if (!el) throw new Error('No se encontró un elemento del tutorial');
    const r = el.getBoundingClientRect();
    const barH = $('.tut-bar', ui).offsetHeight + 20;
    if (r.top < 70 || r.bottom > innerHeight - barH) { el.scrollIntoView({ block: 'center', behavior: fast ? 'auto' : 'smooth' }); await sleep(550); }
  }
  async function move(el) {
    await show(el);
    const p = center(el);
    cursor.style.transition = fast ? 'none' : `transform ${0.7 / speed}s cubic-bezier(.4,.1,.2,1)`;
    cursor.style.transform = `translate(${p.x}px, ${p.y}px)`;
    await sleep(750);
  }
  async function highlight(el, ms = 1600) {
    await show(el);
    const r = el.getBoundingClientRect();
    Object.assign(ring.style, { left: r.left - 6 + 'px', top: r.top - 6 + 'px', width: r.width + 12 + 'px', height: r.height + 12 + 'px' });
    ring.classList.add('on');
    await sleep(ms);
    ring.classList.remove('on');
  }
  async function click(el) {
    await move(el);
    const p = center(el);
    ripple.style.transform = `translate(${p.x}px, ${p.y}px)`;
    ripple.classList.remove('go'); void ripple.offsetWidth; ripple.classList.add('go');
    el.click();
    await sleep(500);
  }
  async function type(el, text) {
    await move(el);
    el.focus();
    el.value = '';
    for (const ch of String(text)) {
      el.value += ch;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(fast ? 0 : 55);
    }
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.blur();
    await sleep(250);
  }
  async function setVal(el, v) { // fechas y similares
    await move(el);
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(350);
  }
  async function choose(sel, label) {
    await move(sel);
    const opt = [...sel.options].find((o) => o.text.trim() === label || o.value === label);
    sel.value = opt ? opt.value : sel.value;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(600);
  }
  async function say(text, ms) {
    textEl.textContent = text;
    textEl.classList.remove('tut-in'); void textEl.offsetWidth; textEl.classList.add('tut-in');
    await sleep(ms || Math.max(2600, text.length * 55));
  }
  async function scrollTo(y) { window.scrollTo({ top: y, behavior: fast ? 'auto' : 'smooth' }); await sleep(700); }
  async function dropPhoto(row, dataUrl) {
    if (!fast) {
      const r = row.getBoundingClientRect();
      fly.src = dataUrl;
      fly.style.transition = 'none';
      fly.style.transform = `translate(${innerWidth - 220}px, ${innerHeight - 330}px) scale(1)`;
      fly.classList.add('on'); void fly.offsetWidth;
      fly.style.transition = `transform ${0.9 / speed}s cubic-bezier(.4,.1,.2,1)`;
      fly.style.transform = `translate(${r.left + 120}px, ${r.top + 20}px) scale(.45)`;
      cursor.style.transition = fly.style.transition;
      cursor.style.transform = `translate(${r.left + 170}px, ${r.top + 60}px)`;
      await sleep(1000);
      fly.classList.remove('on');
    }
    const count = () => Store.state.quotes.reduce((a, q) => a + q.sections.reduce((b, s) => b + s.items.reduce((c, i) => c + (i.photos || []).length, 0), 0), 0);
    const before = count();
    const blob = await (await fetch(dataUrl)).blob();
    const dt = new DataTransfer();
    dt.items.add(new File([blob], 'foto.jpg', { type: 'image/jpeg' }));
    row.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
    await until(() => count() > before, 5000); // la foto se comprime y la pantalla se vuelve a dibujar
    await sleep(700);
  }
  // Espera a que un elemento exista (después de cambiar de pestaña o de pantalla)
  async function need(sel) { await until(() => $(sel), 5000); const el = $(sel); if (!el) throw new Error('No apareció ' + sel); return el; }

  // Atajos para encontrar partes de la app
  const sec = (i) => $$('main section.sec')[i];
  const lastRow = (s) => $$('.item-row[data-drag]', s).pop();
  const tab = (k) => $(`.step[data-tab="${k}"]`);
  const recipeSel = (s) => $('select[data-ac="addFromRecipe"]', s);
  const recipeLabel = (name) => name;

  /* ---------------- guion ---------------- */
  const CH = [
    'Conocer la aplicación', 'Nueva cotización y cliente', 'Arreglos con plantillas', 'Fotos de referencia',
    'Transporte y total', 'Costos internos', 'Pedido de flores y resumen', 'Vista del cliente y descarga', 'Seguimiento',
  ];
  const S = [];
  const step = (ch, fn) => S.push({ ch, fn });

  // 1. Conocer
  step(0, async () => {
    location.hash = '#/'; await sleep(700);
    await say('Bienvenida al cotizador de Alhelí. Esta es la pantalla de Inicio: aquí verá el total cotizado, lo aprobado, la utilidad y los próximos eventos.');
    await highlight($('.nav'), 1800);
    await say('A la izquierda está el menú: Cotizaciones, Contabilidad para el contador, el Catálogo de precios, las Plantillas de arreglos y los Ajustes.');
  });
  // 2. Nueva cotización
  step(1, async () => {
    await say('Vamos a cotizar una boda. Pulse "Nueva cotización".', 2600);
    await click($('.new-btn'));
    await until(() => $('[data-b="cliente.nombre"]'));
    await say('La app le pone el número siguiente y la fecha de vencimiento automáticamente. Empezamos con los datos del cliente.');
    await type($('[data-b="cliente.nombre"]'), 'María Fernanda Ríos');
    await type($('[data-b="cliente.correo"]'), 'mafe.rios@correo.com');
    await type($('[data-b="cliente.celular"]'), '3001234567');
    await say('El celular sirve para enviarle la cotización por WhatsApp con un clic.', 2600);
  });
  step(1, async () => {
    await say('Ahora los datos del evento: lugar de la ceremonia, de la recepción, fecha, hora e invitados.');
    await type($('[data-b="evento.ceremonia"]'), 'Iglesia San Pedro Claver');
    await type($('[data-b="evento.recepcion"]'), 'Hotel Las Américas');
    await setVal($('[data-b="evento.fecha"]'), '2026-12-12');
    await type($('[data-b="evento.hora"]'), '5:00 p.m.');
    await type($('[data-b="evento.pax"]'), '80');
    await say('Todo se guarda solo mientras escribe: mire el aviso "Guardado" junto al número.', 2800);
    await highlight($('#saveInd'), 1400);
  });
  // 3. Arreglos con plantillas
  step(2, async () => {
    await click(tab('items'));
    await until(() => sec(0));
    await say('En "Ítems y fotos" se arma lo que el cliente compra. La forma más rápida es crear cada ítem desde una plantilla.');
    await choose(recipeSel(sec(0)), recipeLabel('Altar / pie de padre'));
    await until(() => lastRow(sec(0)));
    await say('Se creó el arreglo con su descripción, sus insumos y un precio sugerido calculado desde el costo. Son dos altares, así que cambiamos la cantidad a 2.');
    await type($('[data-t="num"]', lastRow(sec(0))), '2');
    await highlight($('.c-total', lastRow(sec(0))), 1500);
  });
  step(2, async () => {
    await say('Agregamos el bouquet de la novia, también desde su plantilla.', 2400);
    await choose(recipeSel(sec(0)), recipeLabel('Bouquet de novia'));
    await say('Si quiere cobrar otro valor, escríbalo encima del precio sugerido.', 2400);
    await type($('[data-t="money"]', lastRow(sec(0))), '290000');
  });
  step(2, async () => {
    await say('También se pueden agregar ítems a mano. Este será un regalo: la boutonniere del novio.', 2800);
    await click($('[data-a="addItem"]', sec(0)));
    await until(() => document.activeElement && document.activeElement.tagName === 'TEXTAREA');
    await type($('textarea', lastRow(sec(0))), 'BOUTONNIERE PARA EL NOVIO EN MINI ROSA BLANCA');
    await say('Active "Cortesía": sale en el PDF como CORTESÍA y no suma al total.', 2600);
    await click($('.switch', lastRow(sec(0))));
  });
  step(2, async () => {
    await say('En la recepción van los centros de mesa. Son 10 mesas.', 2400);
    await choose(recipeSel(sec(1)), recipeLabel('Centro de mesa redondo bajo'));
    await type($('[data-t="num"]', lastRow(sec(1))), '10');
    await say('Para cambiar el orden, arrastre la manija de puntos a la izquierda de cada ítem. Con "Agregar sección" puede crear MOBILIARIO u otras.', 3200);
    await highlight($('.grip', lastRow(sec(1))), 1300);
  });
  // 4. Fotos
  step(3, async () => {
    await say('Fotos de referencia, como en su Excel: arrastre una imagen sobre el ítem, péguela con Ctrl+V o use el botón "Foto".');
    await dropPhoto(lastRow(sec(1)), window.DEMO_PHOTOS && window.DEMO_PHOTOS.centro);
    await highlight($('.photos', lastRow(sec(1))), 1400);
    await say('Agregamos también la foto del bouquet de la novia.', 2200);
    await dropPhoto($$('.item-row[data-drag]', sec(0))[1], window.DEMO_PHOTOS && window.DEMO_PHOTOS.bouquet);
    await say('Haga clic en una foto para verla en grande. Las fotos se reducen solas para que el PDF pese poco.', 2800);
  });
  // 5. Transporte y total
  step(4, async () => {
    await say('Abajo está el transporte, montaje y desmontaje. Escribimos su valor.', 2600);
    await type($('[data-b="transport.unitPrice"]'), '900000');
    await say('Debajo puede cambiar el IVA, el anticipo del 50% y el depósito reembolsable de garantía.', 2800);
    await highlight($('[data-b="deposito"]').closest('.card'), 1600);
    const bar = $('.total-bar') && getComputedStyle($('.total-bar')).display !== 'none' ? $('.total-bar') : $('.totals');
    await say('El total se actualiza en vivo. La utilidad estimada es solo para usted: nunca sale en el PDF.', 3000);
    await highlight(bar, 2000);
  });
  // 6. Costos
  step(5, async () => {
    await scrollTo(0);
    await click(tab('costos'));
    await until(() => $('.cost-sum'));
    await say('"Costos internos" reemplaza la hoja IMPLEMENTOS. Cada arreglo muestra venta, costo, ganancia y margen por unidad.');
    await click($$('.cost-sum')[0]);
    await until(() => $('.cost-body'));
    await say('Adentro está la receta: cada flor, follaje u oasis con su cantidad y precio del catálogo, más la mano de obra.');
    await highlight($('.ins-table'), 1800);
    await say('Así se calcula el costo unitario: flores más el 15% de ajuste, oasis, alquilados y mano de obra.', 2800);
    await highlight($('.breakdown'), 1800);
    await say('Y la ganancia, con la misma fórmula del Excel: valor cotizado menos costo, montaje, comisión y retención.', 3000);
    await highlight($('.kpi-mini.sug').closest('.grid'), 2000);
  });
  step(5, async () => {
    await say('Al final de esta pestaña se anota la logística: personal y viajes. La app le dice si el transporte que cobró alcanza.', 3000);
    await type($('[data-b="logistica.personal"]'), '4');
    await type($('[data-b="logistica.viajesContratados"]'), '1');
    await highlight($('[data-o="log:imp"]').closest('tr'), 1800);
  });
  // 7. Pedido y resumen
  step(6, async () => {
    await scrollTo(0);
    await click(tab('pedido'));
    const order = await need('.order-top');
    await say('"Pedido de flores" suma todos los insumos del evento: cuántos paquetes comprar y cuánto cuestan. Se puede exportar a Excel.', 3400);
    await highlight(order, 1800);
    await click(tab('resumen'));
    const fin = await need('.fin-grid');
    await say('El "Resumen financiero" muestra a dónde va cada peso: costos, comisiones, montaje, retención, logística y utilidad.', 3400);
    await highlight(fin, 2200);
  });
  // 8. Vista y descarga
  step(7, async () => {
    await scrollTo(0);
    await click(tab('documento'));
    await need('#doc');
    await say('"Vista para el cliente" es exactamente lo que recibirá: logo, datos, arreglos con su foto, totales, términos y cuentas.', 3200);
    await scrollTo(380);
    await sleep(1200);
    await scrollTo(1100);
    await sleep(1200);
    await scrollTo(0);
    await say('Con "Descargar" obtiene el PDF para el cliente o el Excel con fórmulas, fotos y costos para el contador.', 3000);
    await click($('[data-menu]'));
    await move($('.menu [data-a="pdf"]'));
    await sleep(700);
    await move($('.menu [data-a="xlsx"]'));
    await sleep(900);
    document.body.click();
    await say('"WhatsApp" envía el PDF al celular del cliente y "Email" prepara el correo.', 2600);
    await highlight($('.btn.wa'), 1300);
  });
  // 9. Seguimiento
  step(8, async () => {
    await say('Cuando el cliente acepte, cambie el estado a "Aprobada". Al descargar el PDF, la app la marca como "Enviada" sola.', 3200);
    await choose($('.status-sel'), 'Aprobada');
    await click(await need('.back'));
    await need('.qcards, .tbl');
    await say('En "Cotizaciones" verá todas sus propuestas con foto, estado y total. Puede buscar y filtrar.', 3000);
    await click($('.nav a[data-page="inicio"]'));
    await need('.hero');
    await sleep(400);
    await say('Y el Inicio ya muestra el evento aprobado, la tasa de cierre y los días que faltan. ¡Listo! Así se hace una cotización completa.', 3600);
    await say('Consulte el manual de usuario para más detalles. Pulse ↺ para ver el tutorial otra vez.', 3000);
  });

  /* ---------------- control de reproducción ---------------- */
  const chapterStart = (c) => S.findIndex((s) => s.ch === c);
  function paint() {
    track.style.width = (stepIdx / S.length) * 100 + '%';
    chEl.textContent = `Capítulo ${S[Math.min(stepIdx, S.length - 1)].ch + 1} de ${CH.length} · ${CH[S[Math.min(stepIdx, S.length - 1)].ch]}`;
    playBtn.textContent = paused ? '▶' : '❚❚';
    $$('.tut-chapters button', ui).forEach((b, i) => b.classList.toggle('on', S[Math.min(stepIdx, S.length - 1)].ch === i));
  }
  $('.tut-chapters', ui).innerHTML = CH.map((c, i) => `<button data-t="chapter" data-c="${i}"><b>${i + 1}</b>${c}</button>`).join('');

  async function freshApp() {
    await until(() => window.Store && Store.state, 8000);
    await Store.resetTutorial();
    if (!window.DEMO_PHOTOS) await new Promise((r) => { const s = document.createElement('script'); s.src = 'js/demo-fotos.js'; s.onload = s.onerror = r; document.head.appendChild(s); });
    location.hash = '#/cotizaciones'; await new Promise((r) => setTimeout(r, 60));
    location.hash = '#/'; await new Promise((r) => setTimeout(r, 200));
    window.scrollTo(0, 0);
  }
  async function run(fromChapter) {
    const id = ++runId;
    const target = chapterStart(fromChapter || 0);
    try {
      fast = true; stepIdx = 0; paint();
      await freshApp();
      for (let i = 0; i < S.length; i++) {
        if (id !== runId) return;
        fast = i < target;
        stepIdx = i; paint();
        await S[i].fn();
      }
      fast = false;
      stepIdx = S.length; paused = true; paint();
      track.style.width = '100%';
    } catch (e) {
      fast = false;
      if (e !== ABORT) { console.error(e); textEl.textContent = 'El tutorial se detuvo: ' + e.message + '. Pulse ↺ para reiniciarlo.'; paused = true; paint(); }
    }
  }
  function start(ch) { $('.tut-poster', ui).classList.add('gone'); paused = false; paint(); run(ch); }

  ui.addEventListener('click', (e) => {
    const b = e.target.closest('[data-t]');
    if (!b) return;
    const t = b.dataset.t;
    const curCh = S[Math.min(stepIdx, S.length - 1)].ch;
    if (t === 'play') {
      if ($('.tut-poster', ui).classList.contains('gone') === false) { start(0); return; }
      if (stepIdx >= S.length) { start(0); return; }
      paused = !paused; paint();
    } else if (t === 'restart') start(0);
    else if (t === 'next') start(Math.min(CH.length - 1, curCh + 1));
    else if (t === 'prev') start(Math.max(0, curCh - (stepIdx === chapterStart(curCh) ? 1 : 0)));
    else if (t === 'chapter') start(+b.dataset.c);
    else if (t === 'close') { runId++; location.href = 'index.html'; } // vuelve a la app real
  });
  $('[data-t="speed"]', ui).addEventListener('change', (e) => { speed = +e.target.value; });
  document.addEventListener('keydown', (e) => { if (e.key === ' ' && e.target === document.body) { e.preventDefault(); $('.tut-play', ui).click(); } });

  // Para generar el video: tutorial.html#auto inicia solo
  window.AlheliTutorial = { start, steps: S.length, chapters: CH, get stepIdx() { return stepIdx; }, get done() { return stepIdx >= S.length; } };
  paint();
  textEl.textContent = 'Pulse ▶ para empezar el tutorial.';
})();
