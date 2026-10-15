/*
 * INTERFAZ DE LA APLICACIÓN (JavaScript puro, sin compilación)
 * Vistas: Inicio (tablero), Cotizaciones, Editor de cotización (6 pestañas),
 * Contabilidad, Catálogo de precios, Plantillas de arreglos, Ajustes.
 */
(function () {
  'use strict';
  const C = window.Calc;
  const { money, pctFmt, fmtQty, n } = C;
  const { icon, modal, confirmBox, promptBox, lightbox, pickImages, compressImage, dataUrlKB, donut, bars, meter } = window.UI;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = window.UI.esc;
  const st = () => Store.state;
  const settings = () => Store.state.settings;
  const main = () => $('#main');

  /* ================= utilidades ================= */
  function getP(obj, path) { return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj); }
  function setP(obj, path, val) {
    const ks = path.split('.'); let o = obj;
    for (let i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null) o[ks[i]] = {}; o = o[ks[i]]; }
    o[ks[ks.length - 1]] = val;
  }
  const moneyInput = (v) => (v === '' || v == null || !Number.isFinite(+v) ? '' : Math.round(+v).toLocaleString('es-CO'));
  const pctInput = (v) => (v === '' || v == null ? '' : String(Math.round(+v * 10000) / 100).replace('.', ','));
  const numInput = (v) => (v === '' || v == null ? '' : String(v).replace('.', ','));
  const short = (v) => { // $ 12,5 M
    const a = Math.abs(n(v));
    if (a >= 1e9) return '$ ' + (v / 1e9).toFixed(1).replace('.', ',') + ' MM';
    if (a >= 1e6) return '$ ' + (v / 1e6).toFixed(1).replace('.', ',') + ' M';
    if (a >= 1e3) return '$ ' + Math.round(v / 1e3) + ' mil';
    return money(v);
  };

  function readInput(el) {
    const t = el.dataset.t;
    if (el.type === 'checkbox') return el.checked;
    if (t === 'money') { const d = el.value.replace(/[^\d-]/g, ''); return d === '' || d === '-' ? 0 : parseInt(d, 10); }
    if (t === 'num') { // acepta "0,25" o "0.25"
      const v = el.value.trim().replace(',', '.');
      const x = parseFloat(v);
      return v === '' || !Number.isFinite(x) ? '' : x;
    }
    if (t === 'pct') { const v = el.value.replace(',', '.').trim(); const x = parseFloat(v); return v === '' || !Number.isFinite(x) ? '' : x / 100; }
    return el.value;
  }

  // Campos enlazados (data-b = ruta dentro del objeto de la vista)
  function inp(path, val, o = {}) {
    const t = o.t || 'text';
    const cls = esc(o.cls || '');
    const ph = o.ph != null ? ` placeholder="${esc(o.ph)}"` : '';
    const extra = (o.rr ? ' data-rr="1"' : '') + (o.list ? ` list="${o.list}"` : '') + (o.attrs || '');
    if (t === 'money') return `<span class="money-wrap"><span>$</span><input class="in money ${cls}" data-b="${path}" data-t="money" inputmode="numeric" value="${moneyInput(val)}"${ph}${extra}></span>`;
    if (t === 'pct') return `<span class="pct-wrap"><input class="in pct ${cls}" data-b="${path}" data-t="pct" inputmode="decimal" value="${pctInput(val)}"${ph}${extra}><span>%</span></span>`;
    if (t === 'num') return `<input class="in num ${cls}" data-b="${path}" data-t="num" inputmode="decimal" value="${numInput(val)}"${ph}${extra}>`;
    if (t === 'date') return `<input class="in ${cls}" type="date" data-b="${path}" value="${esc(val || '')}"${extra}>`;
    if (t === 'area') return `<textarea class="in ${cls}" data-b="${path}" rows="${o.rows || 2}"${ph}${extra}>${esc(val || '')}</textarea>`;
    if (t === 'check') return `<input type="checkbox" data-b="${path}" ${val ? 'checked' : ''}${extra}>`;
    if (t === 'switch') return `<label class="switch ${cls}"><input type="checkbox" data-b="${path}" ${val ? 'checked' : ''}${extra}><i></i><span>${esc(o.label || '')}</span></label>`;
    if (t === 'select') return `<select class="in ${cls}" data-b="${path}"${extra}>${o.options.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    return `<input class="in ${cls}" data-b="${path}" value="${esc(val == null ? '' : val)}"${ph}${extra}>`;
  }
  const field = (label, html, cls = '') => `<label class="field ${cls}"><span>${label}</span>${html}</label>`;

  function toast(msg, kind = '') {
    const t = document.createElement('div');
    t.className = 'toast ' + kind;
    t.innerHTML = icon(kind === 'err' ? 'alert' : 'check', 16) + `<span>${esc(msg)}</span>`;
    $('#toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), 2800);
    setTimeout(() => t.remove(), 3300);
  }
  Store.onError = (m) => toast(m, 'err');

  function download(filename, content, type) {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  // CSV para Excel en español: separador ";" y BOM UTF-8
  function csv(rows) {
    const cell = (v) => {
      if (typeof v === 'number') return String(Math.round(v * 100) / 100).replace('.', ',');
      const s = String(v == null ? '' : v);
      return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    return '﻿' + rows.map((r) => r.map(cell).join(';')).join('\r\n');
  }
  const safeName = (s) => String(s || '').replace(/[\\/:*?"<>|]+/g, '').trim();

  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function fechaLarga(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return iso;
    return `${d} de ${MESES[m - 1]} de ${y}`;
  }
  const fechaCorta = (iso) => { if (!iso) return '—'; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
  const todayISO = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
  const daysUntil = (iso) => Math.round((new Date(iso + 'T00:00:00') - new Date(todayISO() + 'T00:00:00')) / 86400000);

  let saveTimer = null;
  function scheduleSave(fn) {
    const ind = $('#saveInd'); if (ind) { ind.innerHTML = '<i class="dot busy"></i>Guardando…'; }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      await fn();
      const i2 = $('#saveInd'); if (i2) i2.innerHTML = '<i class="dot"></i>Guardado';
    }, 450);
  }
  function autosize(t) { t.style.height = 'auto'; t.style.height = (t.scrollHeight + 2) + 'px'; }
  const firstPhoto = (q) => q.coverPhoto || (q.sections || []).flatMap((s) => s.items).map((i) => (i.photos || [])[0]).find(Boolean) || '';

  /* ================= vista actual y eventos delegados ================= */
  let view = { root: null };
  let drag = null; // ítem que se está arrastrando

  function bindGlobalEvents() {
    const m = main();
    const handle = (e, type) => {
      const el = e.target;
      if (!el.dataset || !el.dataset.b || !view.root) return;
      setP(view.root, el.dataset.b, readInput(el));
      view.onInput && view.onInput(el.dataset.b, el, type);
    };
    m.addEventListener('input', (e) => {
      if (e.target.tagName === 'TEXTAREA') autosize(e.target);
      if (e.target.type !== 'checkbox' && e.target.type !== 'radio' && e.target.tagName !== 'SELECT') handle(e, 'input');
    });
    new MutationObserver(() => $$('textarea.in', m).forEach(autosize)).observe(m, { childList: true });
    m.addEventListener('change', (e) => {
      const el = e.target;
      if (el.dataset && el.dataset.ac && view.actions && view.actions[el.dataset.ac]) { view.actions[el.dataset.ac](el, e); return; }
      handle(e, 'change');
    });
    m.addEventListener('focusout', (e) => {
      const el = e.target;
      if (el.dataset && el.dataset.t === 'money') el.value = moneyInput(readInput(el));
    });
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]');
      if (!b || b.disabled) return;
      const fn = (view.actions && view.actions[b.dataset.a]) || globalActions[b.dataset.a];
      if (fn) { e.preventDefault(); fn(b, e); }
    });
    // Arrastrar ítems (por la manija) y soltar fotos sobre un ítem
    m.addEventListener('mousedown', (e) => { const h = e.target.closest('.grip'); if (h) h.closest('[data-drag]').setAttribute('draggable', 'true'); });
    m.addEventListener('mouseup', () => $$('[data-drag][draggable]', m).forEach((x) => x.removeAttribute('draggable')));
    m.addEventListener('dragstart', (e) => {
      const r = e.target.closest && e.target.closest('[data-drag]');
      if (!r || r.getAttribute('draggable') !== 'true') { if (e.target.tagName === 'IMG') e.preventDefault(); return; }
      drag = { s: +r.dataset.s, i: +r.dataset.i };
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', 'item');
      setTimeout(() => r.classList.add('dragging'), 0);
    });
    m.addEventListener('dragend', (e) => {
      const r = e.target.closest && e.target.closest('[data-drag]');
      if (r) { r.classList.remove('dragging'); r.removeAttribute('draggable'); }
      $$('.drop-before,.drop-after,.drop-photo', m).forEach((x) => x.classList.remove('drop-before', 'drop-after', 'drop-photo'));
      drag = null;
    });
    m.addEventListener('dragover', (e) => {
      const r = e.target.closest('[data-drag], [data-dropphoto]');
      if (!r) return;
      const files = e.dataTransfer.types.includes('Files');
      if (!files && !drag) return;
      e.preventDefault();
      $$('.drop-before,.drop-after,.drop-photo', m).forEach((x) => x !== r && x.classList.remove('drop-before', 'drop-after', 'drop-photo'));
      if (files) { r.classList.add('drop-photo'); return; }
      if (!r.dataset.drag) return;
      const rect = r.getBoundingClientRect();
      const after = e.clientY > rect.top + rect.height / 2;
      r.classList.toggle('drop-after', after); r.classList.toggle('drop-before', !after);
    });
    m.addEventListener('dragleave', (e) => { const r = e.target.closest('[data-drag], [data-dropphoto]'); if (r && !r.contains(e.relatedTarget)) r.classList.remove('drop-before', 'drop-after', 'drop-photo'); });
    m.addEventListener('drop', async (e) => {
      const r = e.target.closest('[data-drag], [data-dropphoto]');
      if (!r) return;
      e.preventDefault();
      r.classList.remove('drop-before', 'drop-after', 'drop-photo');
      if (e.dataTransfer.files && e.dataTransfer.files.length && view.onDropPhotos) {
        const out = [];
        for (const f of e.dataTransfer.files) { try { out.push(await compressImage(f)); } catch (err) { toast(err.message, 'err'); } }
        if (out.length) view.onDropPhotos(r, out);
        return;
      }
      if (drag && view.onMoveItem && r.dataset.drag) {
        const rect = r.getBoundingClientRect();
        view.onMoveItem(drag, { s: +r.dataset.s, i: +r.dataset.i + (e.clientY > rect.top + rect.height / 2 ? 1 : 0) });
      }
    });
    // Pegar una foto (Ctrl+V) sobre el ítem enfocado
    document.addEventListener('paste', async (e) => {
      if (!view.onDropPhotos) return;
      const files = [...(e.clipboardData ? e.clipboardData.files : [])].filter((f) => /^image\//.test(f.type));
      if (!files.length) return;
      const target = document.activeElement && document.activeElement.closest('[data-drag], [data-dropphoto]');
      if (!target) { toast('Haga clic en la descripción de un ítem y pegue de nuevo para agregarle la foto'); return; }
      e.preventDefault();
      const out = [];
      for (const f of files) out.push(await compressImage(f));
      view.onDropPhotos(target, out);
    });
  }

  const globalActions = {
    toggleNav() { document.body.classList.toggle('nav-open'); },
    logout() { Store.signOut(); },
    theme() {
      const cur = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = cur;
      try { localStorage.setItem('alheli_theme', cur); } catch (e) { /* sin almacenamiento */ }
      $('#themeBtn').innerHTML = icon(cur === 'dark' ? 'sun' : 'moon', 18) + `<span>${cur === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>`;
    },
    newQuote() {
      const q = Store.newQuote(settings());
      Store.saveQuote(q).then(() => { location.hash = '#/cotizacion/' + q.id + '/datos'; });
    },
    async demo(b) {
      const ex = b && b.dataset.ex === '2347' ? '2347' : '2428';
      if (ex === '2347' && !window.DEMO_PHOTOS) await loadScript('js/demo-fotos.js');
      const q = (ex === '2347' ? window.buildDemoQuote2347 : window.buildDemoQuote)(settings(), st().catalog);
      await Store.saveQuote(q);
      toast('Ejemplo cargado');
      location.hash = '#/cotizacion/' + q.id + '/items';
    },
  };

  function setOutputs(map) {
    $$('[data-o]').forEach((el) => {
      const v = map[el.dataset.o];
      if (v === undefined) return;
      if (typeof v === 'object' && v) { el.textContent = v.text; el.classList.remove('neg', 'pos', 'warn'); if (v.cls) el.classList.add(v.cls); }
      else el.textContent = v;
    });
  }

  /* ================= ROUTER ================= */
  function route() {
    if (!Store.state) return;
    document.body.classList.remove('nav-open');
    const h = location.hash.replace(/^#\/?/, '');
    const [page, id, tab] = h.split('/');
    const navKey = page === 'cotizacion' ? 'cotizaciones' : (page || 'inicio');
    $$('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.page === navKey));
    window.scrollTo(0, 0);
    main().classList.remove('enter'); void main().offsetWidth; main().classList.add('enter');
    switch (page) {
      case 'cotizaciones': return renderQuoteList();
      case 'cotizacion': return renderQuote(id, tab || 'items');
      case 'contabilidad': return renderAccounting();
      case 'catalogo': return renderCatalog();
      case 'plantillas': return renderRecipes(id);
      case 'ajustes': return renderSettings();
      default: return renderDashboard();
    }
  }

  const statusBadge = (s) => `<span class="badge s-${s}">${STATUS[s] || s}</span>`;
  const emptyExamples = () => `
    <div class="actions center"><button class="btn primary lg" data-a="newQuote">${icon('plus')} Nueva cotización</button></div>
    <div class="examples">
      <button class="example" data-a="demo" data-ex="2428"><b>Ejemplo 1 · Boda Hilton (2428)</b><span>Ana Sofía Mejía · 50 PAX · costos digitados como en el Excel</span></button>
      <button class="example" data-a="demo" data-ex="2347"><b>Ejemplo 2 · Boda Catedral con planner (2347)</b><span>Agencia de bodas · 48 PAX · con fotos, insumos y pedido de flores</span></button>
    </div>`;

  /* =====================================================================
   * 0. INICIO (tablero)
   * ===================================================================== */
  function renderDashboard() {
    view = { root: {}, actions: { open(b) { location.hash = '#/cotizacion/' + b.dataset.id + '/items'; } } };
    const qs = st().quotes;
    const h = new Date().getHours();
    const saludo = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
    const hoy = new Date();
    const head = `<section class="hero">
      <div><p class="eyebrow">${hoy.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(/^./, (c) => c.toUpperCase())}</p>
      <h1>${saludo}, ${esc((settings().empresa.gerente || '').split(' ')[0].toLowerCase().replace(/^./, (c) => c.toUpperCase()) || 'equipo')}</h1>
      <p class="muted">Cotizaciones, costos y contabilidad de ${esc(settings().empresa.nombre)} en un solo lugar.</p></div>
      <div class="actions"><button class="btn primary lg" data-a="newQuote">${icon('plus')} Nueva cotización</button><a class="btn lg" href="#/cotizaciones">${icon('file')} Ver cotizaciones</a></div>
    </section>`;
    if (!qs.length) {
      main().innerHTML = head + `<div class="card empty"><img src="${window.LOGO_DATA_URI}" alt="" class="empty-logo"><h2>Empecemos</h2>
        <p class="muted">Cree su primera cotización o cargue un ejemplo basado en sus cotizaciones reales.</p>${emptyExamples()}</div>`;
      return;
    }
    const lg = settings().logistica;
    const data = qs.map((q) => ({ q, fs: C.financeSummary(q, lg) }));
    const won = data.filter((d) => ['aprobada', 'realizada'].includes(d.q.status));
    const sent = data.filter((d) => d.q.status !== 'borrador');
    const sum = (arr, f) => arr.reduce((a, d) => a + f(d), 0);
    const cotizado = sum(data, (d) => d.fs.totals.total);
    const ganado = sum(won, (d) => d.fs.totals.total);
    const utilidad = sum(won, (d) => d.fs.utilidadNeta);
    const cierre = sent.length ? won.length / sent.length : 0;
    // Ventas por mes (por fecha del evento): 12 meses que terminan en el último evento
    const months = data.map((d) => (d.q.evento.fecha || '').slice(0, 7)).filter(Boolean).sort();
    const endKey = months.length ? months[months.length - 1] : todayISO().slice(0, 7);
    let [ey, em] = endKey.split('-').map(Number);
    const keys = [];
    for (let k = 0; k < 12; k++) { keys.unshift(`${ey}-${String(em).padStart(2, '0')}`); em--; if (!em) { em = 12; ey--; } }
    const barData = keys.map((k) => ({
      label: MESES[+k.slice(5) - 1].slice(0, 3) + (k.slice(5) === '01' ? ' ' + k.slice(2, 4) : ''),
      value: sum(data.filter((d) => (d.q.evento.fecha || '').startsWith(k)), (d) => d.fs.totals.total),
      value2: sum(won.filter((d) => (d.q.evento.fecha || '').startsWith(k)), (d) => d.fs.totals.total),
    }));
    // Estructura del precio (cotizaciones aprobadas/realizadas; si no hay, todas)
    const base = won.length ? won : data;
    // Venta = costos + comisiones + montaje + retención + costo logística + comisión planner + utilidad
    const parts = [
      ['Costos (flores, insumos, mano de obra)', sum(base, (d) => d.fs.costos)],
      ['Comisiones', sum(base, (d) => d.fs.comisiones)],
      ['Montaje', sum(base, (d) => d.fs.montaje)],
      ['Retención / ICA', sum(base, (d) => d.fs.retencion)],
      ['Logística (costo)', sum(base, (d) => d.fs.logistica.costo)],
      ['Comisión planner', sum(base, (d) => d.fs.comisionPlanner)],
      ['Utilidad', sum(base, (d) => d.fs.utilidadNeta)],
    ].filter(([, v], i) => v > 0 || i === 6);
    const ventasBase = sum(base, (d) => d.fs.ventas) || 1;
    const upcoming = data.filter((d) => d.q.evento.fecha && d.q.evento.fecha >= todayISO() && d.q.status !== 'cancelada')
      .sort((a, b) => a.q.evento.fecha.localeCompare(b.q.evento.fecha)).slice(0, 5);
    const recent = [...data].sort((a, b) => (b.q.actualizada || '').localeCompare(a.q.actualizada || '')).slice(0, 5);
    const byStatus = Object.keys(STATUS).map((s) => ({ s, c: data.filter((d) => d.q.status === s).length, v: sum(data.filter((d) => d.q.status === s), (d) => d.fs.totals.total) }));
    const kpi = (ic, label, value, sub, cls = '') => `<div class="kpi big ${cls}"><span class="kpi-ico">${icon(ic, 20)}</span><small>${label}</small><b>${value}</b><span>${sub}</span></div>`;
    const qRow = (d, extra) => `<button class="list-row" data-a="open" data-id="${d.q.id}">
        ${firstPhoto(d.q) ? `<img src="${firstPhoto(d.q)}" alt="">` : `<span class="ph-empty">${icon('flower', 18)}</span>`}
        <span class="lr-main"><b>${esc(d.q.cliente.nombre || '(sin nombre)')}</b><small>No. ${esc(d.q.number)} · ${esc(d.q.evento.tipo || '')} · ${fechaCorta(d.q.evento.fecha)}</small></span>
        ${extra}</button>`;
    main().innerHTML = head + `
      <div class="kpis four">
        ${kpi('file', 'Total cotizado', short(cotizado), `${qs.length} cotización(es)`)}
        ${kpi('check', 'Aprobado / realizado', short(ganado), `${won.length} evento(s)`, 'accent')}
        ${kpi('star', 'Tasa de cierre', pctFmt(cierre, 0), `${won.length} de ${sent.length} enviadas`)}
        ${kpi('money', 'Utilidad estimada', short(utilidad), 'de lo aprobado/realizado', utilidad < 0 ? 'neg' : 'pos')}
      </div>
      <div class="dash-grid">
        <div class="card"><div class="card-head"><h3>${icon('chart')} Valor por mes del evento</h3><span class="legend-inline"><i class="l1"></i>Cotizado <i class="l2"></i>Aprobado</span></div>${bars(barData, { fmt: short })}</div>
        <div class="card"><div class="card-head"><h3>${icon('layers')} ¿A dónde va cada peso?</h3><span class="muted sm">${won.length ? 'Aprobadas y realizadas' : 'Todas las cotizaciones'}</span></div>
          ${donut(parts.map(([l, v]) => ({ label: l, value: Math.max(0, v), text: pctFmt(v / ventasBase, 0) })), { center: short(ventasBase), sub: 'ventas' })}</div>
        <div class="card"><div class="card-head"><h3>${icon('calendar')} Próximos eventos</h3></div>
          ${upcoming.length ? upcoming.map((d) => { const dd = daysUntil(d.q.evento.fecha); return qRow(d, `<span class="countdown ${dd <= 15 ? 'soon' : ''}"><b>${dd === 0 ? 'Hoy' : dd}</b>${dd === 0 ? '' : '<small>días</small>'}</span>`); }).join('') : '<p class="muted sm">No hay eventos próximos con fecha.</p>'}</div>
        <div class="card"><div class="card-head"><h3>${icon('layers')} Embudo de cotizaciones</h3></div>
          ${byStatus.map((b) => `<div class="pipe"><span>${statusBadge(b.s)}</span><b>${b.c}</b><span class="muted sm">${short(b.v)}</span>${meter(qs.length ? b.c / qs.length : 0, 's-' + b.s)}</div>`).join('')}</div>
        <div class="card span2"><div class="card-head"><h3>${icon('file')} Actividad reciente</h3><a href="#/cotizaciones" class="sm">Ver todas ${icon('chevron', 14)}</a></div>
          ${recent.map((d) => qRow(d, `<span class="lr-end">${statusBadge(d.q.status)}<b>${money(d.fs.totals.total)}</b></span>`)).join('')}</div>
      </div>`;
  }

  /* =====================================================================
   * 1. LISTADO DE COTIZACIONES
   * ===================================================================== */
  const listFilter = { q: '', status: '', mode: (() => { try { return localStorage.getItem('alheli_listmode') || 'cards'; } catch (e) { return 'cards'; } })() };
  function renderQuoteList() {
    const quotes = [...st().quotes].sort((a, b) => (+b.number || 0) - (+a.number || 0));
    view = {
      root: listFilter,
      onInput() { drawRows(); },
      actions: {
        open(b) { location.hash = '#/cotizacion/' + b.dataset.id + '/items'; },
        chip(b) { listFilter.status = b.dataset.k; renderQuoteList(); },
        mode(b) { listFilter.mode = b.dataset.k; try { localStorage.setItem('alheli_listmode', b.dataset.k); } catch (e) { /* nada */ } renderQuoteList(); },
      },
    };
    const counts = Object.keys(STATUS).reduce((o, s) => { o[s] = quotes.filter((q) => q.status === s).length; return o; }, {});
    main().innerHTML = `
      <div class="page-head">
        <div><p class="eyebrow">Cotizaciones</p><h1>Todas las cotizaciones</h1><p class="muted">${quotes.length} en total · siguiente número: <b>${settings().numeracion.siguiente}</b></p></div>
        <div class="actions"><button class="btn primary" data-a="newQuote">${icon('plus')} Nueva cotización</button></div>
      </div>
      <div class="toolbar card">
        <div class="search">${icon('search', 16)}${inp('q', listFilter.q, { ph: 'Buscar por cliente, número, lugar…', cls: 'grow' })}</div>
        <div class="chips">
          <button class="chip ${!listFilter.status ? 'on' : ''}" data-a="chip" data-k="">Todas <i>${quotes.length}</i></button>
          ${Object.entries(STATUS).map(([k, l]) => `<button class="chip ${listFilter.status === k ? 'on' : ''}" data-a="chip" data-k="${k}">${l} <i>${counts[k]}</i></button>`).join('')}
        </div>
        <div class="seg sm">
          <button class="${listFilter.mode === 'cards' ? 'on' : ''}" data-a="mode" data-k="cards" title="Tarjetas">${icon('image', 16)}</button>
          <button class="${listFilter.mode === 'table' ? 'on' : ''}" data-a="mode" data-k="table" title="Tabla">${icon('excel', 16)}</button>
        </div>
      </div>
      <div id="qrows"></div>`;
    function drawRows() {
      const term = listFilter.q.trim().toLowerCase();
      const rows = quotes.filter((q) => {
        if (listFilter.status && q.status !== listFilter.status) return false;
        if (!term) return true;
        return [q.number, q.cliente.nombre, q.evento.ceremonia, q.evento.recepcion, q.evento.tipo].join(' ').toLowerCase().includes(term);
      });
      if (!quotes.length) {
        $('#qrows').innerHTML = `<div class="empty card"><img src="${window.LOGO_DATA_URI}" alt="" class="empty-logo"><h2>Aún no hay cotizaciones</h2>
          <p class="muted">Cree la primera o cargue uno de los ejemplos (basados en sus cotizaciones reales).</p>${emptyExamples()}</div>`;
        return;
      }
      if (!rows.length) { $('#qrows').innerHTML = '<div class="card empty"><p class="muted">Sin resultados para este filtro.</p></div>'; return; }
      if (listFilter.mode === 'table') {
        $('#qrows').innerHTML = `<div class="card table-wrap"><table class="tbl click">
          <thead><tr><th>No.</th><th>Cliente</th><th>Evento</th><th>Fecha evento</th><th>Estado</th><th class="r">Total</th></tr></thead>
          <tbody>${rows.map((q) => `<tr data-a="open" data-id="${q.id}">
              <td><b>${esc(q.number)}</b></td>
              <td>${esc(q.cliente.nombre || '(sin nombre)')}<div class="muted sm">${esc(q.cliente.celular || q.cliente.correo || '')}</div></td>
              <td>${esc(q.evento.tipo)}<div class="muted sm">${esc([q.evento.ceremonia, q.evento.recepcion].filter(Boolean).join(' · '))}</div></td>
              <td>${fechaCorta(q.evento.fecha)}</td><td>${statusBadge(q.status)}</td>
              <td class="r"><b>${money(C.quoteTotals(q).total)}</b></td></tr>`).join('')}</tbody></table></div>`;
      } else {
        $('#qrows').innerHTML = `<div class="qcards">${rows.map((q) => {
          const ph = firstPhoto(q);
          const nItems = q.sections.reduce((a, s) => a + s.items.length, 0);
          return `<button class="qcard" data-a="open" data-id="${q.id}">
            <div class="qc-img ${ph ? '' : 'noimg'}">${ph ? `<img src="${ph}" alt="">` : icon('flower', 36)}<span class="qc-num">No. ${esc(q.number)}</span>${statusBadge(q.status)}</div>
            <div class="qc-body"><b>${esc(q.cliente.nombre || '(sin nombre)')}</b>
              <span class="muted sm">${icon('calendar', 13)} ${q.evento.fecha ? fechaLarga(q.evento.fecha) : 'Fecha por definir'}</span>
              <span class="muted sm">${icon('tag', 13)} ${esc(q.evento.tipo || '')} · ${nItems} ítem(s)${q.evento.pax ? ' · ' + esc(q.evento.pax) + ' PAX' : ''}</span>
              <span class="qc-total">${money(C.quoteTotals(q).total)}</span></div></button>`;
        }).join('')}</div>`;
      }
      $('#qrows').insertAdjacentHTML('beforeend', `<p class="center muted xs more-ex">Cargar un ejemplo:
        <button class="btn ghost xs" data-a="demo" data-ex="2428">Boda Hilton (2428)</button>
        <button class="btn ghost xs" data-a="demo" data-ex="2347">Boda Catedral con fotos (2347)</button></p>`);
    }
    drawRows();
  }

  /* =====================================================================
   * 2. EDITOR DE COTIZACIÓN
   * ===================================================================== */
  const openCost = new Set();
  const TABS = [
    ['datos', 'Cliente y evento', 'users'],
    ['items', 'Ítems y fotos', 'image'],
    ['costos', 'Costos internos', 'money'],
    ['pedido', 'Pedido de flores', 'flower'],
    ['resumen', 'Resumen financiero', 'chart'],
    ['documento', 'Vista para el cliente', 'eye'],
  ];

  function catalogByName(name) {
    const k = String(name || '').trim().toLowerCase();
    return st().catalog.find((c) => c.name.trim().toLowerCase() === k);
  }
  function insumoFromCatalog(c, qty) {
    return { catId: c.id, name: c.name, cat: c.cat, unit: c.unit, perPack: c.perPack, price: c.price, qty: qty == null ? 1 : qty };
  }
  function applyRecipe(item, r) {
    item.cost.mode = 'insumos';
    item.cost.recipeName = r.name;
    item.cost.labor = n(r.labor);
    item.cost.insumos = (r.insumos || []).map((i) => {
      const c = st().catalog.find((x) => x.id === i.catId) || catalogByName(i.name);
      return c ? Object.assign(insumoFromCatalog(c, i.qty), { name: i.name || c.name }) : Object.assign({}, i);
    });
    if (!item.desc) item.desc = r.desc || r.name.toUpperCase();
    if (r.photo && !(item.photos || []).length) item.photos = [r.photo];
  }
  function suggested(item, pct) {
    const m = C.materialsCost(item.cost, pct.ajusteFlores);
    const costo = item.cost.mode === 'manual' ? n(item.cost.manualUnitCost) : m.total + n(item.cost.labor);
    return C.simulate(costo, item.cost.mode === 'manual' ? 0 : m.alquilados, settings().simulador);
  }

  function quoteOutputs(q) {
    const o = {};
    const t = C.quoteTotals(q);
    const pct = q.pct;
    q.sections.forEach((s, si) => {
      o['st:' + s.id] = money(t.sections[si].total);
      s.items.forEach((it) => {
        o['lt:' + it.id] = it.courtesy ? 'CORTESÍA' : money(C.lineTotal(it));
        const f = C.lineFinance(it, pct);
        const m = C.materialsCost(it.cost, pct.ajusteFlores);
        o['uc:' + it.id] = money(f.costoUnit);
        o['gu:' + it.id] = { text: money(f.gananciaUnit), cls: f.gananciaUnit < 0 ? 'neg' : 'pos' };
        o['gt:' + it.id] = { text: money(f.gananciaTotal), cls: f.gananciaTotal < 0 ? 'neg' : 'pos' };
        o['mg:' + it.id] = { text: pctFmt(f.margen), cls: f.margen < 0.15 ? 'warn' : '' };
        o['mo:' + it.id] = money(f.montajeUnit);
        o['co:' + it.id] = money(f.comisionUnit);
        o['re:' + it.id] = money(f.retencionUnit);
        o['jv:' + it.id] = it.courtesy ? 'Cortesía' : money(f.valorCotizado);
        o['mf:' + it.id] = money(m.flores);
        o['ma:' + it.id] = money(m.ajuste);
        o['mx:' + it.id] = money(m.otros);
        o['ml:' + it.id] = money(m.alquilados);
        o['lb:' + it.id] = money(it.cost.labor);
        const sg = suggested(it, pct);
        o['sg:' + it.id] = money(sg.precioRedondeado);
        o['sf:' + it.id] = sg.factor ? '×' + sg.factor.toFixed(2).replace('.', ',') : '';
        (it.cost.insumos || []).forEach((i, k) => {
          o[`is:${it.id}:${k}`] = money(n(i.qty) * n(i.price));
          o[`it:${it.id}:${k}`] = fmtQty(n(i.qty) * n(it.qty)) + ' ' + (i.unit || '');
        });
      });
    });
    Object.assign(o, {
      transporte: money(t.transporte), subtotal: money(t.subtotal), iva: money(t.iva), total: money(t.total),
      deposito: money(t.deposito), totalDep: money(t.totalConDeposito), anticipo: money(t.anticipo), saldo: money(t.saldo),
    });
    const fs = C.financeSummary(q, settings().logistica);
    o.gan = { text: money(fs.utilidadNeta), cls: fs.utilidadNeta < 0 ? 'neg' : 'pos' };
    o.ganPct = pctFmt(fs.pctUtilidad);
    o.costos = money(fs.costos);
    const L = fs.logistica;
    Object.assign(o, {
      'log:ret': money(L.retencionTransporte), 'log:valor': money(L.valorLogistica), 'log:pu': money(L.personalUnit),
      'log:per': money(L.costoPersonal), 'log:vc': money(L.costoViajesContratados), 'log:vp': money(L.costoViajesPropios),
      'log:fl': money(L.costoFlete), 'log:costo': money(L.costo),
      'log:imp': { text: money(L.imprevistos), cls: L.imprevistos < 0 ? 'neg' : 'pos' },
    });
    return o;
  }

  function renderQuote(id, tab) {
    const q = st().quotes.find((x) => x.id === id);
    if (!q) { main().innerHTML = `<div class="card empty"><h2>No se encontró la cotización</h2><a class="btn" href="#/cotizaciones">Volver</a></div>`; return; }
    // migraciones suaves (cotizaciones de versiones anteriores)
    q.pct = Object.assign({}, settings().pct, q.pct || {});
    q.logistica = q.logistica || { personal: 0, viajesContratados: 0, viajesPropios: 0, cajasFlete: 0, otros: 0 };
    if (!q.photoMode) q.photoMode = 'thumb';
    q.sections.forEach((s) => s.items.forEach((it) => { if (!it.photos) it.photos = []; }));

    const rerender = () => { const y = window.scrollY; renderQuote(id, tab); window.scrollTo(0, y); };
    const save = () => scheduleSave(() => Store.saveQuote(q));
    const itemAt = (b) => q.sections[+b.dataset.s].items[+b.dataset.i];

    view = {
      root: q,
      onInput(path, el, type) {
        if (/\.insumos\.\d+\.name$/.test(path) && (type === 'change' || catalogByName(el.value))) {
          const c = catalogByName(el.value);
          if (c) {
            const cur = getP(q, path.replace(/\.name$/, ''));
            Object.assign(cur, insumoFromCatalog(c, cur.qty));
            if (type === 'change' || document.activeElement !== el) { save(); rerender(); return; }
            const row = el.closest('.ins-row');
            if (row) { const u = $('[data-b$=".unit"]', row); if (u) u.value = c.unit; const p = $('[data-b$=".price"]', row); if (p) p.value = moneyInput(c.price); }
          }
        }
        if (el.dataset.rr && type === 'change') { save(); rerender(); return; }
        setOutputs(quoteOutputs(q));
        save();
      },
      onMoveItem(from, to) {
        const it = q.sections[from.s].items.splice(from.i, 1)[0];
        let idx = to.i;
        if (from.s === to.s && from.i < to.i) idx--;
        q.sections[to.s].items.splice(idx, 0, it);
        save(); rerender();
      },
      onDropPhotos(target, photos) {
        if (target.dataset.dropphoto === 'cover') { q.coverPhoto = photos[0]; }
        else {
          const it = q.sections[+target.dataset.s].items[+target.dataset.i];
          it.photos = (it.photos || []).concat(photos);
        }
        save(); rerender(); toast(photos.length > 1 ? `${photos.length} fotos agregadas` : 'Foto agregada');
      },
      actions: {
        tab(b) { location.hash = `#/cotizacion/${q.id}/${b.dataset.tab}`; },
        addItem(b) {
          const it = Store.newItem();
          q.sections[+b.dataset.s].items.push(it); save(); rerender();
          setTimeout(() => { const el = $(`[data-item="${it.id}"] textarea`); el && el.focus(); }, 30);
        },
        addFromRecipe(el) {
          const r = st().recipes.find((x) => x.id === el.value);
          if (!r) return;
          const it = Store.newItem();
          applyRecipe(it, r);
          it.unitPrice = suggested(it, q.pct).precioRedondeado;
          q.sections[+el.dataset.s].items.push(it);
          save(); rerender(); toast('Ítem creado desde plantilla con precio sugerido');
        },
        async delItem(b) {
          const s = q.sections[+b.dataset.s];
          const it = s.items[+b.dataset.i];
          if (!(await confirmBox('Eliminar ítem', (it.desc || 'Ítem sin descripción').slice(0, 120), 'Eliminar'))) return;
          s.items.splice(+b.dataset.i, 1); save(); rerender();
        },
        dupItem(b) {
          const s = q.sections[+b.dataset.s];
          const c = Store.clone(s.items[+b.dataset.i]); c.id = Store.uid();
          s.items.splice(+b.dataset.i + 1, 0, c); save(); rerender();
        },
        async addPhoto(b) {
          const it = itemAt(b);
          const ph = await pickImages(true);
          if (!ph.length) return;
          it.photos = (it.photos || []).concat(ph); save(); rerender(); toast(ph.length > 1 ? `${ph.length} fotos agregadas` : 'Foto agregada');
        },
        delPhoto(b) { const it = itemAt(b); it.photos.splice(+b.dataset.k, 1); save(); rerender(); },
        viewPhoto(b) { lightbox(itemAt(b).photos, +b.dataset.k); },
        async addCover() { const ph = await pickImages(false); if (!ph.length) return; q.coverPhoto = ph[0]; save(); rerender(); },
        delCover() { q.coverPhoto = ''; save(); rerender(); },
        viewCover() { lightbox([q.coverPhoto]); },
        setPhotoMode(b) { q.photoMode = b.dataset.k; save(); rerender(); },
        async addSection() {
          const title = await promptBox('Nueva sección', 'Nombre (ej. MOBILIARIO, COCTEL, IGLESIA)', 'MOBILIARIO');
          if (!title) return;
          q.sections.push({ id: Store.uid(), title: title.toUpperCase(), items: [Store.newItem()] }); save(); rerender();
        },
        async delSection(b) {
          const s = q.sections[+b.dataset.s];
          if (!(await confirmBox('Eliminar sección', `Se eliminará "${s.title}" con sus ${s.items.length} ítem(s).`, 'Eliminar'))) return;
          q.sections.splice(+b.dataset.s, 1); save(); rerender();
        },
        moveSection(b) {
          const i = +b.dataset.s, j = i + (+b.dataset.d);
          if (j < 0 || j >= q.sections.length) return;
          [q.sections[i], q.sections[j]] = [q.sections[j], q.sections[i]]; save(); rerender();
        },
        // ---- costeo
        toggleCost(b) { const id2 = b.dataset.id; openCost.has(id2) ? openCost.delete(id2) : openCost.add(id2); rerender(); },
        expandAll() { q.sections.forEach((s) => s.items.forEach((it) => openCost.add(it.id))); rerender(); },
        collapseAll() { openCost.clear(); rerender(); },
        addIns(b) {
          const it = itemAt(b); it.cost.insumos = it.cost.insumos || [];
          it.cost.insumos.push({ catId: '', name: '', cat: 'otro', unit: 'UN', perPack: 1, price: 0, qty: 1 }); save(); rerender();
          setTimeout(() => { const rows = $$(`[data-item="${it.id}"] .ins-row input[list]`); rows.length && rows[rows.length - 1].focus(); }, 30);
        },
        delIns(b) { const it = itemAt(b); it.cost.insumos.splice(+b.dataset.k, 1); save(); rerender(); },
        async applyRecipe(el) {
          const r = st().recipes.find((x) => x.id === el.value); if (!r) return;
          const it = q.sections[+el.dataset.s].items[+el.dataset.i];
          if (it.cost.insumos && it.cost.insumos.length && !(await confirmBox('Aplicar plantilla', 'Se reemplazarán los insumos actuales del ítem por los de la plantilla.', 'Reemplazar', false))) { el.value = ''; return; }
          applyRecipe(it, r); save(); rerender(); toast('Plantilla aplicada');
        },
        setLabor(el) {
          const it = q.sections[+el.dataset.s].items[+el.dataset.i];
          const c = st().catalog.find((x) => x.id === el.value); if (!c) return;
          it.cost.labor = c.price; save(); rerender();
        },
        setMode(b) { const it = itemAt(b); it.cost.mode = b.dataset.k; save(); rerender(); },
        insRent(el) { toggleInsRent(q, el, save, rerender); },
        useSuggested(b) { const it = itemAt(b); it.unitPrice = suggested(it, q.pct).precioRedondeado; save(); rerender(); toast('Precio actualizado'); },
        refreshPrices() {
          let k = 0;
          q.sections.forEach((s) => s.items.forEach((it) => (it.cost.insumos || []).forEach((i) => {
            const c = st().catalog.find((x) => x.id === i.catId) || catalogByName(i.name);
            if (c && c.price !== i.price) { i.price = c.price; i.unit = c.unit; i.perPack = c.perPack; i.cat = c.cat; k++; }
          })));
          save(); rerender(); toast(k ? `${k} precio(s) actualizados desde el catálogo` : 'Los precios ya estaban al día');
        },
        // ---- archivo
        async pdf() { await withDoc(q, (el) => PDF.download(q, el)); },
        async xlsx(b) {
          b && (b.disabled = true);
          toast('Generando Excel…');
          try { await window.ExcelExport.quote(q, settings()); toast('Excel descargado'); }
          catch (err) { console.error(err); toast('No se pudo generar el Excel: ' + err.message, 'err'); }
          finally { b && (b.disabled = false); }
        },
        async whatsapp() { await withDoc(q, (el) => PDF.whatsapp(q, el)); },
        async email() { await withDoc(q, (el) => PDF.email(q, el)); },
        print() { location.hash = `#/cotizacion/${q.id}/documento`; setTimeout(() => window.print(), 400); },
        dup() {
          const c = Store.clone(q); c.id = Store.uid(); c.number = settings().numeracion.siguiente; c.status = 'borrador';
          c.creada = new Date().toISOString();
          c.sections.forEach((s) => { s.id = Store.uid(); s.items.forEach((it) => { it.id = Store.uid(); }); });
          Store.saveQuote(c).then(() => { toast('Cotización duplicada como No. ' + c.number); location.hash = '#/cotizacion/' + c.id + '/datos'; });
        },
        async del() {
          if (!(await confirmBox('Eliminar cotización', `La cotización No. ${q.number} se eliminará definitivamente. Esta acción no se puede deshacer.`, 'Eliminar'))) return;
          await Store.deleteQuote(q.id); toast('Cotización eliminada'); location.hash = '#/cotizaciones';
        },
        exportFinance() { exportQuoteFinanceCSV(q); },
        exportOrder() { exportOrderCSV(q); },
        // Pedidos para proveedores (solo cantidades): una categoría (data-cats="flor") o lo marcado (data-cats="sel")
        pedCat(el) {
          const all = orderGroups(q).map((g) => g.cat);
          const cur = new Set(selectedCats(q));
          if (el.checked) cur.add(el.dataset.k); else cur.delete(el.dataset.k);
          q.pedidoCats = all.filter((c) => cur.has(c));
          save(); rerender();
        },
        async orderPdf(b) {
          const cats = b.dataset.cats === 'sel' ? selectedCats(q) : [b.dataset.cats];
          if (!C.supplierOrder(q, null, cats).length) { toast('No hay insumos en esa selección', 'err'); return; }
          const meta = orderMeta(q, cats);
          b.disabled = true;
          const tmp = document.createElement('div');
          tmp.className = 'offscreen';
          tmp.innerHTML = `<div class="paper">${renderSupplierDoc(q, meta)}</div>`;
          document.body.appendChild(tmp);
          try {
            PDF.ensureLib();
            toast('Generando PDF del pedido…');
            await window.html2pdf().set(Object.assign(PDF.opts(q), { filename: meta.file + '.pdf' })).from($('.doc', tmp)).save();
          } catch (err) { console.error(err); toast('No se pudo generar el PDF: ' + err.message, 'err'); }
          finally { tmp.remove(); b.disabled = false; }
        },
        async orderXlsx(b) {
          const cats = b.dataset.cats === 'sel' ? selectedCats(q) : [b.dataset.cats];
          if (!C.supplierOrder(q, null, cats).length) { toast('No hay insumos en esa selección', 'err'); return; }
          b.disabled = true;
          try { await window.ExcelExport.supplier(q, settings(), orderMeta(q, cats)); toast('Excel del pedido descargado'); }
          catch (err) { console.error(err); toast('No se pudo generar el Excel: ' + err.message, 'err'); }
          finally { b.disabled = false; }
        },
      },
    };

    const t = C.quoteTotals(q);
    const wide = ['documento', 'resumen', 'pedido'].includes(tab);
    const tabIdx = TABS.findIndex(([k]) => k === tab);
    main().innerHTML = `
      <div class="editor-head">
        <a href="#/cotizaciones" class="back">${icon('back', 16)} Cotizaciones</a>
        <div class="eh-row">
          <div class="eh-title">
            <span class="eh-label">Cotización No.</span>${inp('number', q.number, { cls: 'num-title' })}
            ${inp('status', q.status, { t: 'select', options: Object.entries(STATUS), cls: 'status-sel s-' + q.status, rr: 1 })}
            <span id="saveInd" class="save-ind"><i class="dot"></i>Guardado</span>
          </div>
          <div class="actions">
            <div class="dd"><button class="btn primary" data-menu>${icon('download')} Descargar ${icon('down', 14)}</button>
              <div class="menu"><button data-a="pdf">${icon('pdf')} <span><b>PDF</b><small>Para enviar al cliente</small></span></button>
              <button data-a="xlsx">${icon('excel')} <span><b>Excel (.xlsx)</b><small>Con fórmulas, fotos y costos</small></span></button>
              <button data-a="print">${icon('printer')} <span><b>Imprimir</b><small>O guardar como PDF</small></span></button></div></div>
            <button class="btn wa" data-a="whatsapp">${icon('whatsapp')} WhatsApp</button>
            <button class="btn" data-a="email">${icon('mail')} Email</button>
            <div class="dd"><button class="btn ghost icon-only" data-menu title="Más">•••</button>
              <div class="menu right"><button data-a="dup">${icon('copy')} <span><b>Duplicar</b></span></button>
              <button data-a="del" class="danger">${icon('trash')} <span><b>Eliminar</b></span></button></div></div>
          </div>
        </div>
        <div class="muted sm eh-sub">${icon('users', 14)} ${esc(q.cliente.nombre || 'Cliente sin nombre')} · ${esc(q.evento.tipo || '')} ${q.evento.fecha ? '· ' + fechaLarga(q.evento.fecha) : ''} ${q.evento.pax ? '· ' + esc(q.evento.pax) + ' PAX' : ''}</div>
      </div>
      <nav class="steps">${TABS.map(([k, l, ic], i) => `<button class="step ${k === tab ? 'on' : ''} ${i < tabIdx ? 'done' : ''}" data-a="tab" data-tab="${k}"><i>${icon(ic, 16)}</i><span>${l}</span></button>`).join('')}</nav>
      <div class="editor-grid ${wide ? 'wide' : ''}">
        <div class="editor-main">${({ datos: tabDatos, items: tabItems, costos: tabCostos, pedido: tabPedido, resumen: tabResumen, documento: tabDocumento }[tab] || tabItems)(q)}</div>
        ${wide ? '' : asideTotals(q, t)}
      </div>
      ${wide ? '' : `<div class="total-bar"><span><small>Subtotal</small><b data-o="subtotal"></b></span><span class="tb-total"><small>TOTAL</small><b data-o="total"></b></span><span><small>Utilidad (interno)</small><b data-o="gan"></b></span></div>`}
      <datalist id="dl-cat">${st().catalog.map((c) => `<option value="${esc(c.name)}">${esc(catLabel(c.cat))}${c.cat === 'alquilado' ? ' (alquilado)' : ''} · ${money(c.price)}/${esc(c.unit)}</option>`).join('')}</datalist>
      <datalist id="dl-tipo">${['Boda', 'Corporativo', 'Quince años', 'Cumpleaños', 'Bautizo', 'Primera comunión', 'Grado', 'Aniversario', 'Baby shower', 'Funeral', 'Otro'].map((x) => `<option value="${x}">`).join('')}</datalist>`;
    setOutputs(quoteOutputs(q));
  }

  function asideTotals(q, t) {
    return `<aside class="totals card">
      <h3>Resumen</h3>
      ${q.sections.map((s) => `<div class="tl"><span>${esc(s.title)}</span><b data-o="st:${s.id}"></b></div>`).join('')}
      <div class="tl"><span>Transporte y montaje</span><b data-o="transporte"></b></div>
      <div class="tl strong"><span>Subtotal</span><b data-o="subtotal"></b></div>
      ${n(q.pct.iva) ? `<div class="tl"><span>IVA ${pctFmt(q.pct.iva, 0)}</span><b data-o="iva"></b></div>` : ''}
      <div class="tl grand"><span>TOTAL</span><b data-o="total"></b></div>
      <div class="tl muted"><span>Anticipo ${pctFmt(q.pct.anticipo, 0)}</span><b data-o="anticipo"></b></div>
      <div class="tl muted"><span>Depósito reembolsable</span><b data-o="deposito"></b></div>
      <div class="tl muted"><span>Total a consignar</span><b data-o="totalDep"></b></div>
      <div class="internal">
        <p class="eyebrow">${icon('eye', 13)} Solo interno</p>
        <div class="tl"><span>Costos</span><b data-o="costos"></b></div>
        <div class="tl"><span>Utilidad estimada</span><b data-o="gan"></b></div>
        <div class="tl"><span>Margen</span><b data-o="ganPct"></b></div>
      </div>
    </aside>`;
  }

  /* ---------- pestaña 1: datos ---------- */
  function tabDatos(q) {
    return `<div class="card">
      <div class="card-head"><h3>${icon('file')} Cotización</h3></div>
      <div class="grid g3">
        ${field('Fecha de elaboración', inp('fechaElaboracion', q.fechaElaboracion, { t: 'date' }))}
        ${field('Fecha de vencimiento', inp('fechaVencimiento', q.fechaVencimiento, { t: 'date' }))}
        ${field('Número', inp('number', q.number))}
      </div>
    </div>
    <div class="card">
      <div class="card-head"><h3>${icon('users')} Cliente</h3></div>
      <div class="grid g3">
        ${field('Nombre del cliente', inp('cliente.nombre', q.cliente.nombre, { ph: 'Ej. Ana Sofía Mejía' }))}
        ${field('Correo', inp('cliente.correo', q.cliente.correo, { ph: 'correo@ejemplo.com', attrs: ' type="email"' }))}
        ${field('Celular (WhatsApp)', inp('cliente.celular', q.cliente.celular, { ph: '3001234567', attrs: ' type="tel"' }))}
      </div>
    </div>
    <div class="card">
      <div class="card-head"><h3>${icon('calendar')} Evento</h3></div>
      <div class="grid g3">
        ${field('Tipo de evento', inp('evento.tipo', q.evento.tipo, { list: 'dl-tipo' }))}
        ${field('Ceremonia (lugar)', inp('evento.ceremonia', q.evento.ceremonia, { ph: 'Ej. Catedral' }))}
        ${field('Recepción (lugar)', inp('evento.recepcion', q.evento.recepcion, { ph: 'Ej. Hotel Hilton' }))}
        ${field('Fecha del evento', inp('evento.fecha', q.evento.fecha, { t: 'date' }))}
        ${field('Hora', inp('evento.hora', q.evento.hora, { ph: 'Ej. 6:00 p.m. / Por definir' }))}
        ${field('Número de invitados (PAX)', inp('evento.pax', q.evento.pax, { t: 'num' }))}
      </div>
    </div>
    ${photoSettingsCard(q)}
    <div class="card">
      <div class="card-head"><h3>${icon('mail')} Notas para el cliente</h3></div>
      ${inp('notas', q.notas, { t: 'area', rows: 3, ph: 'Aparecen en el PDF antes de los términos y condiciones (opcional).' })}
      <p class="actions end"><button class="btn primary" data-a="tab" data-tab="items">Siguiente: ítems y fotos ${icon('chevron', 16)}</button></p>
    </div>`;
  }

  function photoSettingsCard(q) {
    const modes = [['none', 'Sin fotos', 'x'], ['thumb', 'Junto a cada ítem', 'image'], ['gallery', 'Galería al final', 'layers']];
    const total = q.sections.reduce((a, s) => a + s.items.reduce((b, it) => b + (it.photos || []).length, 0), 0) + (q.coverPhoto ? 1 : 0);
    const kb = q.sections.reduce((a, s) => a + s.items.reduce((b, it) => b + (it.photos || []).reduce((c, p) => c + dataUrlKB(p), 0), 0), 0) + dataUrlKB(q.coverPhoto);
    return `<div class="card">
      <div class="card-head"><h3>${icon('image')} Fotos en la cotización</h3><span class="muted sm">${total} foto(s) · ${kb} KB</span></div>
      <p class="muted sm">Las fotos de referencia se agregan a cada ítem en la pestaña "Ítems y fotos". Elija cómo se muestran en el PDF y en el Excel:</p>
      <div class="seg big">${modes.map(([k, l, ic]) => `<button class="${q.photoMode === k ? 'on' : ''}" data-a="setPhotoMode" data-k="${k}">${icon(ic, 16)} ${l}</button>`).join('')}</div>
      <div class="cover-row">
        <div class="cover ${q.coverPhoto ? '' : 'empty'}" data-dropphoto="cover">
          ${q.coverPhoto ? `<img src="${q.coverPhoto}" alt="" data-a="viewCover"><button class="ph-del" data-a="delCover" title="Quitar">${icon('x', 14)}</button>`
            : `<button class="cover-add" data-a="addCover">${icon('upload', 22)}<b>Foto de portada (opcional)</b><small>Clic o arrastre una imagen aquí</small></button>`}
        </div>
        <p class="muted sm">La portada aparece como banner bajo el encabezado del PDF y del Excel. Si el modo es "Sin fotos", no se imprime ninguna foto, pero quedan guardadas.</p>
      </div>
    </div>`;
  }

  /* ---------- pestaña 2: ítems para el cliente ---------- */
  function recipeOptions(label) {
    return `<option value="">${label}</option>` + st().recipes.map((r) => `<option value="${r.id}">${esc(r.name)}</option>`).join('');
  }
  function photoStrip(it, si, ii) {
    return `<div class="photos">${(it.photos || []).map((p, k) => `<span class="ph"><img src="${p}" alt="" data-a="viewPhoto" data-s="${si}" data-i="${ii}" data-k="${k}"><button class="ph-del" data-a="delPhoto" data-s="${si}" data-i="${ii}" data-k="${k}" title="Quitar foto">${icon('x', 12)}</button></span>`).join('')}
      <button class="ph-add" data-a="addPhoto" data-s="${si}" data-i="${ii}" title="Agregar foto (también puede arrastrarla o pegarla con Ctrl+V)">${icon('image', 16)}<span>${(it.photos || []).length ? '+' : 'Foto'}</span></button></div>`;
  }
  function tabItems(q) {
    const secs = q.sections.map((s, si) => `
      <section class="card sec">
        <div class="sec-head">
          ${inp(`sections.${si}.title`, s.title, { cls: 'sec-title', rr: 1 })}
          <span class="sec-total">${s.items.length} ítem(s) · <b data-o="st:${s.id}"></b></span>
          <span class="icons">
            <button class="ib" data-a="moveSection" data-s="${si}" data-d="-1" title="Subir sección">${icon('up', 16)}</button>
            <button class="ib" data-a="moveSection" data-s="${si}" data-d="1" title="Bajar sección">${icon('down', 16)}</button>
            <button class="ib danger" data-a="delSection" data-s="${si}" title="Eliminar sección">${icon('trash', 16)}</button>
          </span>
        </div>
        <div class="items">
          <div class="item-row head"><span></span><span>Cant.</span><span>Concepto, descripción y fotos</span><span>Vlr. unitario</span><span>Vlr. total</span><span></span></div>
          ${s.items.map((it, ii) => `
            <div class="item-row ${it.courtesy ? 'courtesy' : ''}" data-item="${it.id}" data-drag="1" data-s="${si}" data-i="${ii}">
              <div class="grip" title="Arrastre para mover">${icon('grip', 16)}</div>
              <div class="c-qty">${inp(`sections.${si}.items.${ii}.qty`, it.qty, { t: 'num' })}</div>
              <div class="c-desc">${inp(`sections.${si}.items.${ii}.desc`, it.desc, { t: 'area', ph: 'Descripción que verá el cliente' })}${photoStrip(it, si, ii)}</div>
              <div class="c-price">${inp(`sections.${si}.items.${ii}.unitPrice`, it.unitPrice, { t: 'money' })}
                ${inp(`sections.${si}.items.${ii}.courtesy`, it.courtesy, { t: 'switch', rr: 1, label: 'Cortesía', cls: 'sm' })}</div>
              <div class="c-total"><b data-o="lt:${it.id}"></b></div>
              <div class="c-act">
                <button class="ib" data-a="dupItem" data-s="${si}" data-i="${ii}" title="Duplicar">${icon('copy', 15)}</button>
                <button class="ib danger" data-a="delItem" data-s="${si}" data-i="${ii}" title="Eliminar">${icon('trash', 15)}</button>
              </div>
            </div>`).join('')}
        </div>
        <div class="sec-foot">
          <button class="btn sm" data-a="addItem" data-s="${si}">${icon('plus', 15)} Ítem</button>
          <select class="in sm-sel" data-ac="addFromRecipe" data-s="${si}">${recipeOptions('✿ Ítem desde plantilla (con precio sugerido)…')}</select>
          <span class="muted xs hint">${icon('image', 13)} Arrastre fotos sobre un ítem o péguelas con Ctrl+V · ${icon('grip', 13)} arrastre la manija para reordenar</span>
        </div>
      </section>`).join('');
    return `${secs}
      <p><button class="btn dashed block" data-a="addSection">${icon('plus', 16)} Agregar sección (ej. MOBILIARIO)</button></p>
      <section class="card sec">
        <div class="sec-head"><h3>${icon('truck')} Logística</h3><span class="sec-total"><b data-o="transporte"></b></span></div>
        <div class="item-row transport">
          <div></div>
          <div class="c-qty">${inp('transport.qty', q.transport.qty, { t: 'num' })}</div>
          <div class="c-desc">${inp('transport.desc', q.transport.desc)}</div>
          <div class="c-price">${inp('transport.unitPrice', q.transport.unitPrice, { t: 'money' })}</div>
          <div class="c-total"><b data-o="transporte"></b></div><div></div>
        </div>
      </section>
      <section class="card">
        <div class="card-head"><h3>${icon('money')} Impuestos, anticipo y depósito</h3></div>
        <div class="grid g3">
          ${field('IVA sobre subtotal', inp('pct.iva', q.pct.iva, { t: 'pct', rr: 1 }))}
          ${field('Anticipo para reservar', inp('pct.anticipo', q.pct.anticipo, { t: 'pct', rr: 1 }))}
          ${field('Depósito reembolsable (garantía)', inp('deposito', q.deposito, { t: 'money' }))}
        </div>
        <p class="sm muted">El depósito no es ingreso: se muestra aparte y se devuelve con el material en buen estado.</p>
      </section>`;
  }

  // Interruptor "Alquilado" para un insumo que sea implemento (path = ruta del insumo en la vista)
  function rentSwitch(i, path) {
    if (i.cat !== 'implemento' && i.cat !== 'alquilado') return '';
    return `<label class="switch sm ins-rent" title="Alquilado a un tercero para este evento"><input type="checkbox" data-ac="insRent" data-path="${path}" ${i.cat === 'alquilado' ? 'checked' : ''}><i></i><span>Alquilado</span></label>`;
  }
  // Acción compartida: cambia el insumo entre propio y alquilado
  function toggleInsRent(root, el, save, rerender) {
    const ins = getP(root, el.dataset.path);
    if (!ins) return;
    ins.cat = el.checked ? 'alquilado' : 'implemento';
    save(); rerender();
  }

  /* ---------- pestaña 3: costos internos ---------- */
  function tabCostos(q) {
    const pct = q.pct;
    const laborOpts = `<option value="">Mano de obra según catálogo…</option>` + st().catalog.filter((c) => c.cat === 'manoobra').map((c) => `<option value="${c.id}">${esc(c.name)} · ${money(c.price)}</option>`).join('');
    const cards = q.sections.map((s, si) => `
      <h3 class="sec-label">${esc(s.title)}</h3>
      ${s.items.map((it, ii) => {
        const f = C.lineFinance(it, pct);
        const open = openCost.has(it.id);
        const P = `sections.${si}.items.${ii}`;
        const manual = it.cost.mode === 'manual';
        const ph = (it.photos || [])[0];
        return `<div class="card cost-card ${open ? 'open' : ''}" data-item="${it.id}">
          <button class="cost-sum" data-a="toggleCost" data-id="${it.id}">
            ${ph ? `<img class="cs-img" src="${ph}" alt="">` : `<span class="cs-img empty">${icon('flower', 18)}</span>`}
            <span class="cs-name"><b>${fmtQty(it.qty)} ×</b> ${esc((it.desc || '(sin descripción)').slice(0, 90))}
              ${f.sinCosteo ? ` <span class="badge warn">${icon('alert', 12)} sin costeo</span>` : ''}${it.courtesy ? ' <span class="badge">cortesía</span>' : ''}</span>
            <span class="cs-kpis">
              <span><small>Venta u.</small><b data-o="jv:${it.id}"></b></span>
              <span><small>Costo u.</small><b data-o="uc:${it.id}"></b></span>
              <span><small>Ganancia u.</small><b data-o="gu:${it.id}"></b></span>
              <span><small>Margen</small><b data-o="mg:${it.id}"></b>${meter(Math.max(0, f.margen), f.margen < 0.15 ? 'warn' : '')}</span>
            </span>
            <span class="chev ${open ? 'up' : ''}">${icon('down', 18)}</span>
          </button>
          ${open ? `<div class="cost-body">
            <div class="row-wrap">
              <div class="seg">
                <button class="${!manual ? 'on' : ''}" data-a="setMode" data-k="insumos" data-s="${si}" data-i="${ii}">Desglose de insumos</button>
                <button class="${manual ? 'on' : ''}" data-a="setMode" data-k="manual" data-s="${si}" data-i="${ii}">Costo unitario manual</button>
              </div>
              ${!manual ? `<select class="in sm-sel" data-ac="applyRecipe" data-s="${si}" data-i="${ii}">${recipeOptions('✿ Cargar plantilla de arreglo…')}</select>` : ''}
            </div>
            ${manual ? `<div class="grid g3">
                ${field('Costo unitario (incluye mano de obra)', inp(`${P}.cost.manualUnitCost`, it.cost.manualUnitCost, { t: 'money' }))}
                ${field('Mano de obra por unidad (informativo)', inp(`${P}.cost.labor`, it.cost.labor, { t: 'money' }))}
              </div>` : `
              <div class="ins-table">
                <div class="ins-row head"><span>Insumo (flor, follaje, oasis, vela…)</span><span>Cant. por arreglo</span><span>Unidad</span><span>Precio unit.</span><span>Costo</span><span>Total evento</span><span></span></div>
                ${(it.cost.insumos || []).map((i, k) => `<div class="ins-row">
                  <span>${inp(`${P}.cost.insumos.${k}.name`, i.name, { list: 'dl-cat', ph: 'Escriba para buscar…' })}${rentSwitch(i, `${P}.cost.insumos.${k}`)}</span>
                  <span>${inp(`${P}.cost.insumos.${k}.qty`, i.qty, { t: 'num' })}</span>
                  <span>${inp(`${P}.cost.insumos.${k}.unit`, i.unit, { cls: 'unit' })}</span>
                  <span>${inp(`${P}.cost.insumos.${k}.price`, i.price, { t: 'money' })}</span>
                  <span class="r" data-o="is:${it.id}:${k}"></span>
                  <span class="r muted" data-o="it:${it.id}:${k}"></span>
                  <span><button class="ib danger" data-a="delIns" data-s="${si}" data-i="${ii}" data-k="${k}" title="Quitar">${icon('x', 14)}</button></span>
                </div>`).join('')}
                <button class="btn sm" data-a="addIns" data-s="${si}" data-i="${ii}">${icon('plus', 14)} Insumo</button>
              </div>
              <div class="grid g3">
                ${field('Mano de obra por unidad', inp(`${P}.cost.labor`, it.cost.labor, { t: 'money' }))}
                ${field('…o tomarla del catálogo', `<select class="in" data-ac="setLabor" data-s="${si}" data-i="${ii}">${laborOpts}</select>`)}
              </div>
              <div class="breakdown">
                <span>Flores <b data-o="mf:${it.id}"></b></span>
                <span>+ Ajuste flores ${pctFmt(pct.ajusteFlores, 0)} <b data-o="ma:${it.id}"></b></span>
                <span>+ Oasis/implementos <b data-o="mx:${it.id}"></b></span>
                <span>+ Alquilados <b data-o="ml:${it.id}"></b></span>
                <span>+ Mano de obra <b data-o="lb:${it.id}"></b></span>
                <span class="eq">= Costo unitario <b data-o="uc:${it.id}"></b></span>
              </div>`}
            <div class="grid g4">
              ${field('% comisión', inp(`${P}.cost.commissionPct`, it.cost.commissionPct, { t: 'pct', ph: pctInput(pct.comision) }))}
              ${field('% montaje', inp(`${P}.cost.montajePct`, it.cost.montajePct, { t: 'pct', ph: pctInput(pct.montaje) }))}
              <div class="kpi-mini"><small>Montaje u.</small><b data-o="mo:${it.id}"></b></div>
              <div class="kpi-mini"><small>Comisión u.</small><b data-o="co:${it.id}"></b></div>
              <div class="kpi-mini"><small>Retención u.</small><b data-o="re:${it.id}"></b></div>
              <div class="kpi-mini"><small>Ganancia u.</small><b data-o="gu:${it.id}"></b></div>
              <div class="kpi-mini"><small>Ganancia total (×${fmtQty(it.qty)})</small><b data-o="gt:${it.id}"></b></div>
              <div class="kpi-mini sug"><small>${icon('sparkle', 13)} Precio sugerido <span data-o="sf:${it.id}"></span></small><b data-o="sg:${it.id}"></b>
                <button class="btn xs" data-a="useSuggested" data-s="${si}" data-i="${ii}">Usar este precio</button></div>
            </div>
          </div>` : ''}
        </div>`;
      }).join('') || '<p class="muted sm">Sin ítems.</p>'}`).join('');

    return `<div class="card">
        <div class="card-head"><h3>${icon('settings')} Parámetros de esta cotización</h3>
          <div class="actions"><button class="btn sm ghost" data-a="expandAll">Abrir todos</button><button class="btn sm ghost" data-a="collapseAll">Cerrar todos</button><button class="btn sm" data-a="refreshPrices">${icon('tag', 14)} Actualizar precios</button></div></div>
        <div class="grid g5">
          ${field('Retención o ICA', inp('pct.retencion', pct.retencion, { t: 'pct' }))}
          ${field('Ajuste flores', inp('pct.ajusteFlores', pct.ajusteFlores, { t: 'pct' }))}
          ${field('% comisión (defecto)', inp('pct.comision', pct.comision, { t: 'pct' }))}
          ${field('% montaje (defecto)', inp('pct.montaje', pct.montaje, { t: 'pct' }))}
          ${field('Comisión planner/agencia', inp('pct.comisionPlanner', pct.comisionPlanner, { t: 'pct' }))}
        </div>
        <p class="sm muted">Ganancia por arreglo = Valor cotizado − Costo unitario − Montaje − Comisión − Retención (hoja IMPLEMENTOS). El ajuste de flores se suma al costo de las flores (variación de precios y merma).</p>
      </div>
      ${cards}
      <div class="card">
        <div class="card-head"><h3>${icon('truck')} Logística (transporte, montaje y desmontaje)</h3></div>
        <div class="grid g5">
          ${field('Personal requerido', inp('logistica.personal', q.logistica.personal, { t: 'num' }))}
          ${field('Viajes transporte contratado', inp('logistica.viajesContratados', q.logistica.viajesContratados, { t: 'num' }))}
          ${field('Viajes camioneta propia', inp('logistica.viajesPropios', q.logistica.viajesPropios, { t: 'num' }))}
          ${field('Cajas de flete (flores)', inp('logistica.cajasFlete', q.logistica.cajasFlete, { t: 'num' }))}
          ${field('Otros gastos', inp('logistica.otros', q.logistica.otros, { t: 'money' }))}
        </div>
        <table class="tbl compact">
          <tr><td>Transporte cotizado al cliente</td><td class="r" data-o="transporte"></td></tr>
          <tr><td>− Retención en transporte (${pctFmt(q.pct.retencion, 0)})</td><td class="r" data-o="log:ret"></td></tr>
          <tr class="strong"><td>= Valor de logística</td><td class="r" data-o="log:valor"></td></tr>
          <tr><td>Personal (× <span data-o="log:pu"></span> c/u: staff + ARL + almuerzo + desayuno)</td><td class="r" data-o="log:per"></td></tr>
          <tr><td>Viajes transporte contratado</td><td class="r" data-o="log:vc"></td></tr>
          <tr><td>Viajes camioneta propia</td><td class="r" data-o="log:vp"></td></tr>
          <tr><td>Flete de flores</td><td class="r" data-o="log:fl"></td></tr>
          <tr class="strong"><td>= Costo de logística</td><td class="r" data-o="log:costo"></td></tr>
          <tr class="grand"><td>Imprevistos / margen de logística</td><td class="r" data-o="log:imp"></td></tr>
        </table>
        <p class="sm muted">Tarifas editables en Ajustes → Logística.</p>
      </div>`;
  }

  /* ---------- pestaña 4: pedido de flores ---------- */
  function tabPedido(q) {
    const rows = C.flowerOrder(q, q.pct);
    const tot = rows.reduce((a, r) => a + r.costoConAjuste, 0);
    const manuales = q.sections.reduce((a, s) => a + s.items.filter((it) => it.cost.mode === 'manual').length, 0);
    const byCat = {};
    rows.forEach((r) => { byCat[r.cat] = (byCat[r.cat] || 0) + r.costoConAjuste; });
    let lastCat = '';
    return `<div class="card">
      <div class="card-head"><div><h3>${icon('flower')} Pedido de flores e insumos</h3>
        <p class="muted sm">Suma de cada insumo en todos los arreglos (cantidad por arreglo × número de arreglos), como la tabla dinámica "PEDIDO FLORES".</p></div>
        </div></div>
      ${rows.length ? supplierBox(q) : ''}
      ${manuales ? `<p class="badge warn block">${icon('alert', 14)} ${manuales} ítem(s) están en costo manual y no aportan insumos a este pedido.</p>` : ''}
      ${rows.length ? `<div class="order-top">
        <div class="kpi"><small>Insumos distintos</small><b>${rows.length}</b></div>
        <div class="kpi"><small>Paquetes de flores a comprar</small><b>${fmtQty(rows.filter((r) => r.cat === 'flor').reduce((a, r) => a + r.compra, 0))}</b></div>
        <div class="kpi accent"><small>Costo estimado de compra</small><b>${money(tot)}</b></div>
        <div class="kpi">${Object.entries(byCat).map(([k, v]) => `<div class="tl sm"><span>${esc(k === 'alquilado' ? 'Implementos en alquiler' : catLabel(k))}</span><b>${money(v)}</b></div>`).join('')}</div>
      </div>
      <div class="table-wrap"><table class="tbl">
        <thead><tr><th>Insumo</th><th class="r">Total</th><th>Unidad</th><th class="r">Comprar</th><th class="r">Tallos / und.</th><th class="r">Precio</th><th class="r">Costo + ajuste</th></tr></thead>
        <tbody>${rows.map((r) => {
          const g = groupCat(r.cat);
          const head = g !== lastCat ? `<tr class="grp"><td colspan="7">${esc(catLabel(g))}</td></tr>` : '';
          lastCat = g;
          return head + `<tr title="${esc(r.usos.join('\n'))}"><td>${esc(r.name)}${r.cat === 'alquilado' ? ' <span class="tag-rent">alquiler</span>' : ''}<div class="muted xs">${esc(r.usos.length)} uso(s)</div></td><td class="r">${fmtQty(r.qty)}</td><td>${esc(r.unit)}</td><td class="r"><b class="pill">${fmtQty(r.compra)}</b></td><td class="r">${r.perPack > 1 ? fmtQty(r.tallos) : '—'}</td><td class="r">${money(r.price)}</td><td class="r">${money(r.costoConAjuste)}</td></tr>`;
        }).join('')}</tbody>
        <tfoot><tr><td colspan="6">Total estimado de compra</td><td class="r">${money(tot)}</td></tr></tfoot>
      </table></div>` : '<p class="muted">Aún no hay insumos. Agréguelos en la pestaña "Costos internos" (modo desglose de insumos).</p>'}
    </div>`;
  }

  /* ---------- Pedidos por proveedor (una categoría o varias juntas) ---------- */
  const ORDER_CATS = ['flor', 'oasis', 'implemento', 'otro']; // los alquilados van dentro de Implementos
  const ORDER_TITLES = { flor: 'FLORES Y FOLLAJES', oasis: 'OASIS', implemento: 'IMPLEMENTOS', otro: 'OTROS INSUMOS' };
  function orderGroups(q) {
    const all = C.supplierOrder(q);
    return ORDER_CATS.map((cat) => ({ cat, n: all.filter((r) => r.cat === cat).length, rent: all.filter((r) => r.cat === cat && r.rented).length })).filter((g) => g.n);
  }
  function selectedCats(q) {
    const groups = orderGroups(q).map((g) => g.cat);
    return Array.isArray(q.pedidoCats) ? groups.filter((c) => q.pedidoCats.includes(c)) : groups;
  }
  // Título, proveedor y nombre de archivo según las categorías elegidas
  function orderMeta(q, cats) {
    const prov = q.proveedores || {};
    const all = orderGroups(q).map((g) => g.cat);
    const single = cats.length === 1;
    const names = [...new Set(cats.map((c) => (prov[c] || '').trim()).filter(Boolean))];
    const title = single ? 'PEDIDO DE ' + ORDER_TITLES[cats[0]] : cats.length === all.length ? 'PEDIDO DE FLORES E INSUMOS' : 'PEDIDO DE ' + cats.map((c) => ORDER_TITLES[c]).join(' + ');
    const proveedor = names.length === 1 && cats.every((c) => (prov[c] || '').trim() === names[0]) ? names[0] : '';
    const SHORT = { flor: 'flores y follajes', oasis: 'oasis', implemento: 'implementos', otro: 'otros insumos' };
    const label = proveedor || (cats.length === all.length ? 'flores e insumos' : cats.map((c) => SHORT[c] || c).join(', '));
    return { cats, title, proveedor, file: `Pedido ${safeName(label).toLowerCase()} - cotizacion ${q.number}` };
  }
  function supplierBox(q) {
    const groups = orderGroups(q);
    const sel = selectedCats(q);
    const prov = q.proveedores || {};
    return `<div class="supplier-box">
      <div class="sb-head"><b>${icon('truck', 16)} Pedidos para proveedores</b>
        <span class="muted sm">Descargue un archivo por categoría para cada proveedor, o marque varias y descárguelas juntas. Solo cantidades, sin precios ni datos del cliente.</span></div>
      <div class="sb-rows">${groups.map((g) => `
        <div class="sb-row">
          <label class="sb-check"><input type="checkbox" data-ac="pedCat" data-k="${g.cat}" ${sel.includes(g.cat) ? 'checked' : ''}>
            <span><b>${esc(catLabel(g.cat))}</b><small>${g.n} insumo(s)${g.rent ? ` · ${g.rent} en alquiler` : ''}</small></span></label>
          <input class="in sb-prov" data-b="proveedores.${g.cat}" value="${esc(prov[g.cat] || '')}" placeholder="Proveedor (opcional), ej. Flores La Sabana">
          <div class="actions"><button class="btn sm" data-a="orderPdf" data-cats="${g.cat}">${icon('pdf', 15)} PDF</button><button class="btn sm" data-a="orderXlsx" data-cats="${g.cat}">${icon('excel', 15)} Excel</button></div>
        </div>`).join('')}
      </div>
      <div class="sb-foot">
        <span class="muted sm">${sel.length} de ${groups.length} categoría(s) marcadas para descargar juntas</span>
        <div class="actions"><button class="btn primary" data-a="orderPdf" data-cats="sel" ${sel.length ? '' : 'disabled'}>${icon('pdf')} PDF de lo marcado</button><button class="btn" data-a="orderXlsx" data-cats="sel" ${sel.length ? '' : 'disabled'}>${icon('excel')} Excel de lo marcado</button></div>
      </div>
    </div>`;
  }

  // Documento del pedido para el proveedor (PDF): cantidades, sin precios ni datos del cliente
  function renderSupplierDoc(q, meta) {
    const e = settings().empresa;
    meta = meta || orderMeta(q, selectedCats(q));
    const rows = C.supplierOrder(q, null, meta.cats);
    let lastCat = '', k = 0;
    return `<div class="doc">
      <header class="d-head">
        <img src="${window.LOGO_DATA_URI}" alt="Alhelí" class="d-logo">
        <div class="d-meta">
          <div class="d-title sm-title">${esc(meta.title)}</div>
          <div class="d-num">Cotización No. ${esc(q.number)}</div>
          <table>${meta.proveedor ? `<tr><td>Proveedor</td><td><b>${esc(meta.proveedor)}</b></td></tr>` : ''}<tr><td>Fecha del pedido</td><td>${esc(fechaLarga(todayISO()))}</td></tr>
          <tr><td>Fecha del evento</td><td>${esc(fechaLarga(q.evento.fecha) || 'Por definir')}</td></tr></table>
        </div>
      </header>
      <section class="d-info">
        <div><small>Pedido por</small><b>${esc(e.gerente)}</b><span>${esc(e.nombre)}</span></div>
        <div><small>Contacto</small><b>Tel. ${esc(e.telefono)}</b><span>${esc(e.email)}</span></div>
        <div><small>Evento</small><b>${esc((q.evento.tipo || '').toUpperCase())}</b><span>${esc(q.evento.recepcion || q.evento.ceremonia || '')}</span></div>
      </section>
      <table class="d-items d-order">
        <thead><tr><th class="c">#</th><th>INSUMO</th><th class="c">CANTIDAD</th><th class="c">UNIDAD</th><th class="c">TALLOS / UNID.</th><th class="c">RECIBIDO</th></tr></thead>
        <tbody>${rows.map((x) => {
          const head = x.cat !== lastCat ? `<tr class="d-sec"><td colspan="6">${esc(catLabel(x.cat))}</td></tr>` : '';
          lastCat = x.cat; k++;
          return head + `<tr><td class="c">${k}</td><td><b>${esc(x.name)}</b>${x.rented ? ' <span class="tag-rent">alquiler</span>' : ''}</td><td class="c qty">${fmtQty(x.cantidad)}</td><td class="c">${esc(x.unit)}</td><td class="c">${x.unidades == null ? '—' : fmtQty(x.unidades)}</td><td class="c"><span class="chkbox"></span></td></tr>`;
        }).join('')}</tbody>
      </table>
      <p class="d-order-note">${rows.length} insumo(s). Las flores están redondeadas al paquete completo. Por favor confirmar disponibilidad, precio y fecha de entrega.</p>
      <div class="d-order-sign"><span>Recibido por: ____________________________</span><span>Fecha de entrega: ____________________</span></div>
      <footer class="d-foot"><span>${esc(e.direccion)}${e.ciudad ? ', ' + esc(e.ciudad) : ''}</span><span>Tel. ${esc(e.telefono)}</span><span>${esc(e.email)}</span><span>${esc(e.web)}</span></footer>
    </div>`;
  }

  /* ---------- pestaña 5: resumen financiero ---------- */
  function tabResumen(q) {
    const fs = C.financeSummary(q, settings().logistica);
    const kpi = (label, v, p, cls = '') => `<div class="kpi ${cls}"><small>${label}</small><b>${money(v)}</b>${p != null ? `<span>${pctFmt(p)} de la venta</span>${meter(Math.abs(p))}` : ''}</div>`;
    const V = fs.ventas || 1;
    const parts = [
      { label: 'Costos', value: fs.costos, text: pctFmt(fs.costos / V, 0) },
      { label: 'Comisiones', value: fs.comisiones, text: pctFmt(fs.comisiones / V, 0) },
      { label: 'Montaje', value: fs.montaje, text: pctFmt(fs.montaje / V, 0) },
      { label: 'Retención / ICA', value: fs.retencion, text: pctFmt(fs.retencion / V, 0) },
      { label: 'Logística (costo)', value: fs.logistica.costo, text: pctFmt(fs.logistica.costo / V, 0) },
      { label: 'Comisión planner', value: fs.comisionPlanner, text: pctFmt(fs.comisionPlanner / V, 0) },
      { label: 'Utilidad', value: Math.max(0, fs.utilidadNeta), text: pctFmt(fs.utilidadNeta / V, 0) },
    ].filter((p) => p.value > 0 || p.label === 'Utilidad');
    const top = [...fs.lines].filter((l) => l.f.ventaTotal > 0).sort((a, b) => b.f.gananciaTotal - a.f.gananciaTotal).slice(0, 8);
    const maxG = Math.max(1, ...top.map((l) => Math.abs(l.f.gananciaTotal)));
    return `<div class="card">
      <div class="card-head"><div><h3>${icon('chart')} Resumen financiero — Cotización ${esc(q.number)}</h3>
        <p class="muted sm">Equivale al encabezado de la hoja "IMPLEMENTOS DE DECORACION", con los porcentajes calculados sobre el total vendido (en el Excel daban #REF!).</p></div>
        <div class="actions"><button class="btn" data-a="xlsx">${icon('excel')} Excel</button><button class="btn" data-a="exportFinance">CSV</button><button class="btn" onclick="window.print()">${icon('printer')}</button></div></div>
      ${fs.lineasSinCosteo ? `<p class="badge warn block">${icon('alert', 14)} ${fs.lineasSinCosteo} ítem(s) con precio pero sin costo cargado: su ganancia aparece inflada.</p>` : ''}
      <div class="fin-grid">
        <div>${donut(parts, { size: 200, center: short(fs.ventas), sub: 'venta' })}</div>
        <div class="kpis">
          ${kpi('Venta (subtotal sin IVA)', fs.ventas, null, 'accent')}
          ${kpi('Costos totales', fs.costos, fs.pctCostos)}
          ${kpi('Mano de obra (incluida)', fs.manoObra, fs.manoObra / V)}
          ${kpi('Comisiones', fs.comisiones, fs.pctComisiones)}
          ${kpi('Montaje evento', fs.montaje, fs.pctMontaje)}
          ${kpi('Retención o ICA', fs.retencion, fs.pctRetencion)}
          ${kpi('Ganancia en arreglos', fs.gananciaArreglos, fs.pctGanancia)}
          ${kpi('Margen de logística', fs.logistica.imprevistos, fs.logistica.imprevistos / V, fs.logistica.imprevistos < 0 ? 'neg' : '')}
          ${fs.comisionPlanner ? kpi('Comisión planner/agencia', -fs.comisionPlanner, fs.comisionPlanner / V) : ''}
          ${kpi('Utilidad estimada', fs.utilidadNeta, fs.pctUtilidad, fs.utilidadNeta < 0 ? 'neg accent' : 'pos accent')}
          ${fs.iva ? kpi('IVA por pagar (no es ingreso)', fs.iva, null) : ''}
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-head"><h3>${icon('star')} Arreglos que más ganancia dejan</h3></div>
      ${top.map((l) => `<div class="hbar"><span class="hb-l">${esc((l.item.desc || '').slice(0, 60))}</span><span class="hb-t"><i class="${l.f.gananciaTotal < 0 ? 'neg' : ''}" style="width:${Math.abs(l.f.gananciaTotal) / maxG * 100}%"></i></span><b class="${l.f.gananciaTotal < 0 ? 'neg' : ''}">${money(l.f.gananciaTotal)}</b><small class="muted">${pctFmt(l.f.margen, 0)}</small></div>`).join('') || '<p class="muted sm">Sin datos.</p>'}
    </div>
    <div class="card">
      <div class="card-head"><h3>${icon('excel')} Detalle por arreglo</h3></div>
      <div class="table-wrap"><table class="tbl compact nowrap">
        <thead><tr><th>Sección</th><th>Arreglo</th><th class="r">Cant.</th><th class="r">Vlr. cotizado</th><th class="r">Costo unit.</th><th class="r">M. obra u.</th><th class="r">Montaje u.</th><th class="r">Comisión u.</th><th class="r">Retención u.</th><th class="r">Ganancia u.</th><th class="r">Ganancia total</th><th class="r">Comisión total</th><th class="r">Montaje total</th><th class="r">M. obra total</th><th class="r">Costos total</th><th class="r">Retención total</th></tr></thead>
        <tbody>${fs.lines.map((l) => { const f = l.f; return `<tr>
          <td>${esc(l.section)}</td><td class="wrap">${esc((l.item.desc || '').slice(0, 70))}${f.sinCosteo ? ' ⚠' : ''}</td><td class="r">${fmtQty(f.qty)}</td>
          <td class="r">${money(f.valorCotizado)}</td><td class="r">${money(f.costoUnit)}</td><td class="r">${money(f.manoObraUnit)}</td>
          <td class="r">${money(f.montajeUnit)}</td><td class="r">${money(f.comisionUnit)}</td><td class="r">${money(f.retencionUnit)}</td>
          <td class="r ${f.gananciaUnit < 0 ? 'neg' : ''}">${money(f.gananciaUnit)}</td><td class="r ${f.gananciaTotal < 0 ? 'neg' : ''}">${money(f.gananciaTotal)}</td>
          <td class="r">${money(f.comisionTotal)}</td><td class="r">${money(f.montajeTotal)}</td><td class="r">${money(f.manoObraTotal)}</td><td class="r">${money(f.costoTotal)}</td><td class="r">${money(f.retencionTotal)}</td></tr>`; }).join('')}</tbody>
        <tfoot><tr><td colspan="10">Totales</td><td class="r">${money(fs.gananciaArreglos)}</td><td class="r">${money(fs.comisiones)}</td><td class="r">${money(fs.montaje)}</td><td class="r">${money(fs.manoObra)}</td><td class="r">${money(fs.costos)}</td><td class="r">${money(fs.retencionArreglos)}</td></tr></tfoot>
      </table></div>
    </div>
    <div class="card">
      <div class="card-head"><h3>${icon('truck')} Logística</h3></div>
      <table class="tbl compact">
        <tr><td>Transporte cotizado</td><td class="r">${money(fs.logistica.transporte)}</td></tr>
        <tr><td>Retención en transporte</td><td class="r">${money(fs.logistica.retencionTransporte)}</td></tr>
        <tr><td>Valor de logística</td><td class="r">${money(fs.logistica.valorLogistica)}</td></tr>
        <tr><td>Costo de logística</td><td class="r">${money(fs.logistica.costo)}</td></tr>
        <tr class="strong"><td>Imprevistos / margen</td><td class="r ${fs.logistica.imprevistos < 0 ? 'neg' : ''}">${money(fs.logistica.imprevistos)}</td></tr>
      </table>
    </div>`;
  }

  function quoteFinanceRows(q) {
    const fs = C.financeSummary(q, settings().logistica);
    const rows = [['Cotización', 'Cliente', 'Sección', 'Arreglo', 'Cantidad', 'Valor cotizado unit', 'Costo unit', 'Mano obra unit', 'Montaje unit', 'Comisión unit', 'Retención unit', 'Ganancia unit', 'Venta total', 'Ganancia total', 'Comisión total', 'Montaje total', 'Mano obra total', 'Costos total', 'Retención total', 'Sin costeo']];
    fs.lines.forEach((l) => { const f = l.f; rows.push([q.number, q.cliente.nombre, l.section, l.item.desc, f.qty, f.valorCotizado, f.costoUnit, f.manoObraUnit, f.montajeUnit, f.comisionUnit, f.retencionUnit, f.gananciaUnit, f.ventaTotal, f.gananciaTotal, f.comisionTotal, f.montajeTotal, f.manoObraTotal, f.costoTotal, f.retencionTotal, f.sinCosteo ? 'SI' : '']); });
    return { fs, rows };
  }
  function exportQuoteFinanceCSV(q) {
    const { fs, rows } = quoteFinanceRows(q);
    rows.push([]);
    [['Venta (subtotal)', fs.ventas], ['IVA', fs.iva], ['Costos totales', fs.costos], ['Mano de obra', fs.manoObra], ['Comisiones', fs.comisiones], ['Montaje', fs.montaje], ['Retención total', fs.retencion], ['Ganancia arreglos', fs.gananciaArreglos], ['Transporte', fs.logistica.transporte], ['Valor logística', fs.logistica.valorLogistica], ['Costo logística', fs.logistica.costo], ['Imprevistos logística', fs.logistica.imprevistos], ['Comisión planner', fs.comisionPlanner], ['Utilidad estimada', fs.utilidadNeta]]
      .forEach(([k, v]) => rows.push(['', '', '', k, '', '', '', '', '', '', '', '', v]));
    download(`Costos cotizacion ${q.number} - ${safeName(q.cliente.nombre)}.csv`, csv(rows), 'text/csv;charset=utf-8');
  }
  function exportOrderCSV(q) {
    const rows = [['Insumo', 'Categoría', 'Total', 'Unidad', 'Comprar', 'Tallos/unidades', 'Precio', 'Costo', 'Ajuste flores', 'Costo con ajuste']];
    C.flowerOrder(q, q.pct).forEach((r) => rows.push([r.name + (r.cat === 'alquilado' ? ' (alquiler)' : ''), catLabel(r.cat), r.qty, r.unit, r.compra, r.tallos, r.price, r.costo, r.ajuste, r.costoConAjuste]));
    download(`Pedido flores ${q.number} - ${safeName(q.cliente.nombre)}.csv`, csv(rows), 'text/csv;charset=utf-8');
  }

  /* ---------- pestaña 6: documento para el cliente ---------- */
  function tabDocumento(q) {
    const modes = [['none', 'Sin fotos'], ['thumb', 'Fotos junto al ítem'], ['gallery', 'Galería al final']];
    return `<div class="doc-toolbar card">
        <div class="seg">${modes.map(([k, l]) => `<button class="${q.photoMode === k ? 'on' : ''}" data-a="setPhotoMode" data-k="${k}">${l}</button>`).join('')}</div>
        <div class="actions"><button class="btn primary" data-a="pdf">${icon('pdf')} PDF</button><button class="btn" data-a="xlsx">${icon('excel')} Excel</button><button class="btn wa" data-a="whatsapp">${icon('whatsapp')} WhatsApp</button><button class="btn" data-a="email">${icon('mail')} Email</button><button class="btn" data-a="print">${icon('printer')}</button></div>
      </div>
      <div class="paper">${renderDocument(q)}</div>`;
  }

  function renderDocument(q) {
    const s = settings();
    const e = s.empresa;
    const t = C.quoteTotals(q);
    const mode = q.photoMode || 'thumb';
    const showThumb = mode === 'thumb' && q.sections.some((x) => x.items.some((it) => (it.photos || []).length));
    const terms = s.terminos.map((x) => x.replace('{deposito}', money(q.deposito)));
    const cols = showThumb ? 5 : 4;
    const row = (it) => `<tr class="${it.courtesy ? 'cortesia' : ''}"><td class="c">${fmtQty(it.qty)}</td><td>${esc(it.desc)}${it.courtesy ? ' <i>(cortesía)</i>' : ''}</td>
      ${showThumb ? `<td class="d-ph">${(it.photos || []).slice(0, 2).map((p) => `<img src="${p}" alt="">`).join('')}</td>` : ''}
      <td class="r">${it.courtesy ? '—' : money(it.unitPrice)}</td><td class="r">${it.courtesy ? 'CORTESÍA' : money(C.lineTotal(it))}</td></tr>`;
    const gallery = mode === 'gallery' ? q.sections.flatMap((sec) => sec.items.flatMap((it) => (it.photos || []).map((p) => ({ p, d: it.desc })))) : [];
    return `<div class="doc" id="doc">
      <header class="d-head">
        <img src="${window.LOGO_DATA_URI}" alt="Alhelí" class="d-logo">
        <div class="d-meta">
          <div class="d-title">COTIZACIÓN</div>
          <div class="d-num">No. ${esc(q.number)}</div>
          <table><tr><td>Fecha de elaboración</td><td>${esc(fechaLarga(q.fechaElaboracion))}</td></tr>
          <tr><td>Válida hasta</td><td>${esc(fechaLarga(q.fechaVencimiento))}</td></tr></table>
        </div>
      </header>
      ${q.coverPhoto && mode !== 'none' ? `<div class="d-cover"><img src="${q.coverPhoto}" alt=""></div>` : ''}
      <section class="d-info">
        <div><small>Cliente</small><b>${esc(q.cliente.nombre)}</b>${q.cliente.correo ? `<span>${esc(q.cliente.correo)}</span>` : ''}${q.cliente.celular ? `<span>Cel. ${esc(q.cliente.celular)}</span>` : ''}</div>
        <div><small>Evento</small><b>${esc((q.evento.tipo || '').toUpperCase())}</b>${q.evento.ceremonia ? `<span>Ceremonia: ${esc(q.evento.ceremonia)}</span>` : ''}${q.evento.recepcion ? `<span>Recepción: ${esc(q.evento.recepcion)}</span>` : ''}</div>
        <div><small>Fecha del evento</small><b>${esc(fechaLarga(q.evento.fecha).toUpperCase() || 'POR DEFINIR')}</b>${q.evento.hora ? `<span>Hora: ${esc(q.evento.hora)}</span>` : ''}${q.evento.pax ? `<span>${esc(q.evento.pax)} PAX</span>` : ''}</div>
      </section>
      <table class="d-items ${showThumb ? 'with-ph' : ''}">
        <thead><tr><th class="c">CANT</th><th>CONCEPTO</th>${showThumb ? '<th class="c">REFERENCIA</th>' : ''}<th class="r">VLR. UNIT.</th><th class="r">VLR. TOTAL</th></tr></thead>
        ${q.sections.filter((x) => x.items.length).map((sec) => `<tbody>
          <tr class="d-sec"><td colspan="${cols}">${esc(sec.title)}</td></tr>
          ${sec.items.map(row).join('')}
          <tr class="d-sub"><td></td><td colspan="${cols - 2}">TOTAL ${esc(sec.title)}</td><td class="r">${money(t.sections[q.sections.indexOf(sec)].total)}</td></tr>
        </tbody>`).join('')}
        ${t.transporte ? `<tbody><tr class="d-sec"><td colspan="${cols}">LOGÍSTICA</td></tr>
          <tr><td class="c">${fmtQty(q.transport.qty)}</td><td>${esc(q.transport.desc)}</td>${showThumb ? '<td></td>' : ''}<td class="r">${money(q.transport.unitPrice)}</td><td class="r">${money(t.transporte)}</td></tr></tbody>` : ''}
      </table>
      <div class="d-totals">
        <div><span>Subtotal</span><b>${money(t.subtotal)}</b></div>
        ${t.iva ? `<div><span>IVA (${pctFmt(q.pct.iva, 0)})</span><b>${money(t.iva)}</b></div>` : ''}
        <div class="grand"><span>TOTAL COTIZACIÓN</span><b>${money(t.total)}</b></div>
        ${t.deposito ? `<div class="dep"><span>Depósito reembolsable de garantía</span><b>${money(t.deposito)}</b></div>` : ''}
        ${n(q.pct.anticipo) ? `<div class="dep"><span>Anticipo para reservar (${pctFmt(q.pct.anticipo, 0)})</span><b>${money(t.anticipo)}</b></div>` : ''}
      </div>
      ${gallery.length ? `<section class="d-gallery"><h4>Referencias visuales</h4><div class="d-grid">${gallery.map((g) => `<figure><img src="${g.p}" alt=""><figcaption>${esc((g.d || '').slice(0, 70))}</figcaption></figure>`).join('')}</div></section>` : ''}
      ${q.notas ? `<section class="d-notes"><h4>Notas</h4><p>${esc(q.notas).replace(/\n/g, '<br>')}</p></section>` : ''}
      <section class="d-terms"><h4>Términos y condiciones</h4><ul>${terms.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
      <section class="d-bank"><h4>Formas de pago</h4>
        <div class="d-banks">${s.cuentas.map((c) => `<div><small>${esc(c.banco)}</small><b># ${esc(c.numero)}</b><span>Cuenta de ${esc(String(c.tipo || '').toLowerCase())}</span></div>`).join('')}</div>
      </section>
      <section class="d-sign"><p>Atentamente,</p><b>${esc(e.gerente)}</b><span>${esc(e.cargo)}</span><span>${esc(e.nombre)}</span></section>
      <footer class="d-foot">
        <span>${esc(e.direccion)}${e.ciudad ? ', ' + esc(e.ciudad) : ''}</span><span>Tel. ${esc(e.telefono)}</span><span>${esc(e.web)}</span><span>${esc(e.email)}</span>
        <span>Instagram ${esc(e.instagram)}</span><span>Facebook ${esc(e.facebook)}</span>
      </footer>
    </div>`;
  }

  async function withDoc(q, fn) {
    let el = $('#doc');
    let tmp = null;
    if (!el) {
      tmp = document.createElement('div');
      tmp.className = 'offscreen';
      tmp.innerHTML = `<div class="paper">${renderDocument(q)}</div>`;
      document.body.appendChild(tmp);
      el = $('#doc', tmp);
    }
    try { await fn(el); } catch (err) { console.error(err); toast('No se pudo generar el PDF: ' + err.message, 'err'); }
    finally { tmp && tmp.remove(); }
  }

  /* ================= PDF / WhatsApp / Email ================= */
  const PDF = {
    filename(q) { return `Cotizacion ${q.number} - ${safeName(q.cliente.nombre) || 'Alheli'}.pdf`; },
    opts(q) {
      return {
        margin: [10, 10, 12, 10], filename: this.filename(q),
        image: { type: 'jpeg', quality: 0.92 },
        // scrollX/scrollY en 0: sin esto, si la página está desplazada, el PDF sale con un espacio en blanco arriba
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', scrollX: 0, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.d-totals', '.d-sign', '.d-terms li', '.d-info', 'figure', '.d-cover', '.d-banks'] },
      };
    },
    ensureLib() {
      if (!window.html2pdf) throw new Error('No se cargó la librería de PDF (revise la conexión a internet). Puede usar "Imprimir" → Guardar como PDF.');
    },
    async blob(q, el) { this.ensureLib(); return window.html2pdf().set(this.opts(q)).from(el).outputPdf('blob'); },
    async download(q, el) {
      this.ensureLib();
      toast('Generando PDF…');
      await window.html2pdf().set(this.opts(q)).from(el).save();
      if (q.status === 'borrador') {
        q.status = 'enviada'; await Store.saveQuote(q);
        const sel = $('.status-sel'); if (sel) { sel.value = 'enviada'; sel.className = sel.className.replace(/s-\w+/, 's-enviada'); }
        toast('Estado cambiado a "Enviada"');
      }
    },
    message(q) {
      const t = C.quoteTotals(q);
      const e = settings().empresa;
      return `Hola ${q.cliente.nombre || ''}, te compartimos la cotización No. ${q.number} de ${e.nombre}` +
        (q.evento.fecha ? ` para tu ${String(q.evento.tipo || 'evento').toLowerCase()} del ${fechaLarga(q.evento.fecha)}` : '') +
        `. Valor total: ${money(t.total)}. Quedamos atentos a cualquier inquietud. ${e.gerente} – ${e.telefono}`;
    },
    phone(q) {
      let d = String(q.cliente.celular || '').replace(/\D/g, '');
      if (d.length === 10 && d.startsWith('3')) d = '57' + d;
      return d;
    },
    async whatsapp(q, el) {
      const msg = this.message(q);
      toast('Preparando PDF…');
      const blob = await this.blob(q, el);
      const file = new File([blob], this.filename(q), { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], text: msg, title: this.filename(q) }); return; } catch (e) { if (e.name === 'AbortError') return; }
      }
      download(this.filename(q), blob);
      window.open(`https://wa.me/${this.phone(q)}?text=${encodeURIComponent(msg + '\n\n(Adjunto PDF de la cotización)')}`, '_blank');
      toast('PDF descargado. Adjúntelo en el chat de WhatsApp que se abrió.');
    },
    async email(q, el) {
      toast('Preparando PDF…');
      const blob = await this.blob(q, el);
      download(this.filename(q), blob);
      const subj = `Cotización No. ${q.number} – ${settings().empresa.nombre}`;
      location.href = `mailto:${encodeURIComponent(q.cliente.correo || '')}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(this.message(q) + '\n\nAdjunto encontrará la cotización en PDF.')}`;
      toast('PDF descargado. Adjúntelo al correo que se abrió.');
    },
  };

  /* =====================================================================
   * 3. CONTABILIDAD (todas las cotizaciones)
   * ===================================================================== */
  const accFilter = { status: 'aprobada,realizada', desde: '', hasta: '' };
  function renderAccounting() {
    view = { root: accFilter, onInput() { draw(); }, actions: {
      csvSummary() { const { rows } = build(); download('Resumen contable Alheli.csv', csv(rows), 'text/csv;charset=utf-8'); },
      async xlsxSummary() {
        const { rows } = build();
        try { toast('Generando Excel…'); await window.ExcelExport.accounting(rows, `Resumen contable — ${settings().empresa.nombre}`, 'Resumen contable Alheli.xlsx'); }
        catch (err) { toast('No se pudo generar el Excel: ' + err.message, 'err'); }
      },
      csvDetail() {
        const { list } = build();
        let all = null;
        list.forEach((q) => { const { rows } = quoteFinanceRows(q); if (!all) all = rows; else all.push(...rows.slice(1)); });
        download('Detalle de costos por arreglo.csv', csv(all || [['Sin datos']]), 'text/csv;charset=utf-8');
      },
      open(b) { location.hash = '#/cotizacion/' + b.dataset.id + '/resumen'; },
    } };
    const opts = [['aprobada,realizada', 'Aprobadas y realizadas'], ['', 'Todas'], ...Object.entries(STATUS)];
    main().innerHTML = `
      <div class="page-head"><div><p class="eyebrow">Contabilidad</p><h1>Resumen financiero</h1><p class="muted">Todas las cotizaciones, sin fórmulas rotas. Exportable a Excel.</p></div>
        <div class="actions"><button class="btn primary" data-a="xlsxSummary">${icon('excel')} Excel</button><button class="btn" data-a="csvSummary">CSV resumen</button><button class="btn" data-a="csvDetail">CSV detalle</button><button class="btn" onclick="window.print()">${icon('printer')}</button></div></div>
      <div class="toolbar card">
        ${field('Estado', inp('status', accFilter.status, { t: 'select', options: opts }))}
        ${field('Evento desde', inp('desde', accFilter.desde, { t: 'date' }))}
        ${field('Evento hasta', inp('hasta', accFilter.hasta, { t: 'date' }))}
      </div>
      <div id="acc"></div>`;
    function build() {
      const sts = accFilter.status ? accFilter.status.split(',') : null;
      const list = st().quotes.filter((q) => (!sts || sts.includes(q.status))
        && (!accFilter.desde || (q.evento.fecha || '') >= accFilter.desde)
        && (!accFilter.hasta || (q.evento.fecha || '') <= accFilter.hasta))
        .sort((a, b) => (a.evento.fecha || '').localeCompare(b.evento.fecha || ''));
      const rows = [['No.', 'Cliente', 'Tipo', 'Fecha evento', 'Estado', 'Venta (subtotal)', 'IVA', 'Total', 'Costos', 'Mano de obra', 'Comisiones', 'Montaje', 'Retención/ICA', 'Ganancia arreglos', 'Logística neta', 'Comisión planner', 'Utilidad estimada', 'Margen %']];
      const T = { v: 0, iva: 0, t: 0, c: 0, mo: 0, com: 0, mon: 0, ret: 0, g: 0, l: 0, p: 0, u: 0 };
      const data = list.map((q) => {
        const fs = C.financeSummary(q, settings().logistica);
        T.v += fs.ventas; T.iva += fs.iva; T.t += fs.totals.total; T.c += fs.costos; T.mo += fs.manoObra; T.com += fs.comisiones; T.mon += fs.montaje;
        T.ret += fs.retencion; T.g += fs.gananciaArreglos; T.l += fs.logistica.imprevistos; T.p += fs.comisionPlanner; T.u += fs.utilidadNeta;
        rows.push([q.number, q.cliente.nombre, q.evento.tipo, q.evento.fecha, STATUS[q.status], fs.ventas, fs.iva, fs.totals.total, fs.costos, fs.manoObra, fs.comisiones, fs.montaje, fs.retencion, fs.gananciaArreglos, fs.logistica.imprevistos, fs.comisionPlanner, fs.utilidadNeta, Math.round(fs.pctUtilidad * 1000) / 10]);
        return { q, fs };
      });
      rows.push(['TOTAL', '', '', '', '', T.v, T.iva, T.t, T.c, T.mo, T.com, T.mon, T.ret, T.g, T.l, T.p, T.u, T.v ? Math.round(T.u / T.v * 1000) / 10 : 0]);
      return { list, data, T, rows };
    }
    function draw() {
      const { data, T } = build();
      const k = (l, v, cls = '') => `<div class="kpi ${cls}"><small>${l}</small><b>${money(v)}</b>${T.v ? `<span>${pctFmt(v / T.v)} de la venta</span>${meter(Math.abs(v / T.v))}` : ''}</div>`;
      const V = T.v || 1;
      $('#acc').innerHTML = `
        <div class="fin-grid card">
          <div>${donut([
            { label: 'Costos', value: T.c, text: pctFmt(T.c / V, 0) }, { label: 'Comisiones', value: T.com, text: pctFmt(T.com / V, 0) },
            { label: 'Montaje', value: T.mon, text: pctFmt(T.mon / V, 0) }, { label: 'Retención / ICA', value: T.ret, text: pctFmt(T.ret / V, 0) },
            { label: 'Comisión planner', value: T.p, text: pctFmt(T.p / V, 0) }, { label: 'Utilidad', value: Math.max(0, T.u), text: pctFmt(T.u / V, 0) }], { center: short(T.v), sub: 'ventas' })}</div>
          <div class="kpis">${k('Ventas', T.v, 'accent')}${k('Costos', T.c)}${k('Comisiones', T.com)}${k('Montaje', T.mon)}${k('Retención/ICA', T.ret)}${k('Ganancia arreglos', T.g)}${k('Logística neta', T.l, T.l < 0 ? 'neg' : '')}${k('Utilidad estimada', T.u, T.u < 0 ? 'neg accent' : 'pos accent')}${T.iva ? k('IVA por pagar', T.iva) : ''}</div>
        </div>
        <div class="card table-wrap"><table class="tbl compact nowrap click">
          <thead><tr><th>No.</th><th>Cliente</th><th>Fecha evento</th><th>Estado</th><th class="r">Venta</th><th class="r">Costos</th><th class="r">Comisiones</th><th class="r">Montaje</th><th class="r">Retención</th><th class="r">Ganancia arreglos</th><th class="r">Logística</th><th class="r">Utilidad</th><th class="r">Margen</th></tr></thead>
          <tbody>${data.map(({ q, fs }) => `<tr data-a="open" data-id="${q.id}"><td><b>${esc(q.number)}</b></td><td>${esc(q.cliente.nombre)}${fs.lineasSinCosteo ? ' <span class="badge warn" title="Ítems sin costeo">⚠ ' + fs.lineasSinCosteo + '</span>' : ''}</td><td>${fechaCorta(q.evento.fecha)}</td><td>${statusBadge(q.status)}</td>
            <td class="r">${money(fs.ventas)}</td><td class="r">${money(fs.costos)}</td><td class="r">${money(fs.comisiones)}</td><td class="r">${money(fs.montaje)}</td><td class="r">${money(fs.retencion)}</td><td class="r">${money(fs.gananciaArreglos)}</td><td class="r ${fs.logistica.imprevistos < 0 ? 'neg' : ''}">${money(fs.logistica.imprevistos)}</td><td class="r ${fs.utilidadNeta < 0 ? 'neg' : ''}"><b>${money(fs.utilidadNeta)}</b></td><td class="r">${pctFmt(fs.pctUtilidad)}</td></tr>`).join('') || '<tr><td colspan="13" class="muted center">No hay cotizaciones con este filtro. Cambie el estado a "Todas".</td></tr>'}</tbody>
          <tfoot><tr><td colspan="4">Totales (${data.length})</td><td class="r">${money(T.v)}</td><td class="r">${money(T.c)}</td><td class="r">${money(T.com)}</td><td class="r">${money(T.mon)}</td><td class="r">${money(T.ret)}</td><td class="r">${money(T.g)}</td><td class="r">${money(T.l)}</td><td class="r">${money(T.u)}</td><td class="r">${T.v ? pctFmt(T.u / T.v) : '—'}</td></tr></tfoot>
        </table></div>`;
    }
    draw();
  }

  /* =====================================================================
   * 4. CATÁLOGO DE PRECIOS
   * ===================================================================== */
  const catFilter = { cat: 'flor', q: '', rent: '' };
  const isImpl = (c) => c === 'implemento' || c === 'alquilado';
  function renderCatalog() {
    const cat = st().catalog;
    const save = () => scheduleSave(() => Store.saveCatalog());
    view = {
      root: { catalog: cat, f: catFilter },
      onInput(path) { if (path.startsWith('f.')) { draw(); return; } save(); if (/\.cat$/.test(path)) draw(); },
      actions: {
        // Formulario para agregar un insumo nuevo (flor, oasis, implemento propio o alquilado, mano de obra…)
        async add() {
          const start = catFilter.cat || 'flor';
          let w = null;
          const body = `<div class="add-form">
            <label class="field"><span>Nombre</span><input class="in" id="nf-name" placeholder="Ej. Cilindro de vidrio 10x30, Farol blanco, Rosa roja…"></label>
            <label class="field"><span>Categoría</span><select class="in" id="nf-cat">${Object.entries(CAT_LABELS).map(([k, l]) => `<option value="${k}" ${k === start ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
            <label class="switch nf-rent" id="nf-rent-wrap"><input type="checkbox" id="nf-rent" ${catFilter.rent === 'alquilado' ? 'checked' : ''}><i></i><span>Es <b>alquilado</b> (se le renta a un tercero y se devuelve)</span></label>
            <div class="grid g3">
              <label class="field"><span>Unidad</span><input class="in unit" id="nf-unit" value="${start === 'flor' ? 'PQ' : 'UN'}" placeholder="PQ, UN, DOC, TALLO…"></label>
              <label class="field"><span>Und. por paquete</span><input class="in num" id="nf-pack" inputmode="decimal" value="${start === 'flor' ? 10 : 1}"></label>
              <label class="field"><span>Precio de costo</span><input class="in money" id="nf-price" inputmode="numeric" placeholder="0"></label>
            </div>
            <p class="sm muted">Para flores, el precio es por paquete y "Und. por paquete" es cuántos tallos trae. Para implementos, normalmente la unidad es UN y el paquete es 1.</p>
          </div>`;
          const ok = await modal({ title: 'Agregar al catálogo', body, okText: 'Agregar', wide: true, onOpen: (wrap) => {
            w = wrap;
            const sync = () => { $('#nf-rent-wrap', wrap).style.display = $('#nf-cat', wrap).value === 'implemento' ? '' : 'none'; };
            $('#nf-cat', wrap).addEventListener('change', () => {
              const v = $('#nf-cat', wrap).value;
              $('#nf-unit', wrap).value = v === 'flor' ? 'PQ' : 'UN'; $('#nf-pack', wrap).value = v === 'flor' ? 10 : 1; sync();
            });
            sync();
            setTimeout(() => $('#nf-name', wrap).focus(), 60);
          } });
          if (!ok || !w) return;
          const name = $('#nf-name', w).value.trim();
          if (!name) { toast('Escriba el nombre del insumo', 'err'); return; }
          if (cat.some((x) => x.name.trim().toLowerCase() === name.toLowerCase())) { toast(`"${name}" ya existe en el catálogo`, 'err'); return; }
          const k = $('#nf-cat', w).value;
          const c = {
            id: 'c' + Store.uid(), name,
            cat: k === 'implemento' && $('#nf-rent', w).checked ? 'alquilado' : k,
            unit: ($('#nf-unit', w).value || 'UN').toUpperCase().trim(),
            perPack: parseFloat(String($('#nf-pack', w).value).replace(',', '.')) || 1,
            price: parseInt(String($('#nf-price', w).value).replace(/[^\d]/g, ''), 10) || 0,
          };
          cat.unshift(c);
          catFilter.cat = groupCat(c.cat); catFilter.rent = ''; catFilter.q = '';
          await Store.saveCatalog(); renderCatalog();
          toast(`"${c.name}" agregado a ${catLabel(c.cat)}${c.cat === 'alquilado' ? ' (alquilado)' : ''}`);
        },
        // Cambiar categoría desde la lista: un implemento alquilado conserva su marca si sigue siendo implemento
        setCat(el) {
          const c = cat[+el.dataset.i];
          const v = el.value;
          c.cat = v === 'implemento' && c.cat === 'alquilado' ? 'alquilado' : v;
          save(); draw();
        },
        async del(b) {
          const i = +b.dataset.i;
          if (!(await confirmBox('Eliminar del catálogo', `"${cat[i].name}" se quitará del catálogo. Las cotizaciones ya hechas conservan su precio.`, 'Eliminar'))) return;
          cat.splice(i, 1); save(); draw();
        },
        chip(b) { catFilter.cat = b.dataset.k; catFilter.rent = ''; renderCatalog(); },
        rentFilter(b) { catFilter.rent = b.dataset.k; renderCatalog(); },
        // Interruptor "Alquilado": pasa el implemento entre propio y alquilado
        rent(el) { const c = cat[+el.dataset.i]; c.cat = el.checked ? 'alquilado' : 'implemento'; save(); draw(); toast(el.checked ? `"${c.name}" marcado como alquilado` : `"${c.name}" marcado como propio`); },
        exportCsv() { download('Catalogo de precios Alheli.csv', csv([['Categoría', 'Nombre', 'Unidad', 'Unidades por paquete', 'Precio', 'Alquilado'], ...cat.map((c) => [groupCat(c.cat), c.name, c.unit, c.perPack, c.price, c.cat === 'alquilado' ? 'SI' : ''])]), 'text/csv;charset=utf-8'); },
        importCsv() { $('#csvFile').click(); },
        async updateRecipes() {
          let k = 0;
          st().recipes.forEach((r) => (r.insumos || []).forEach((i) => { const c = cat.find((x) => x.id === i.catId); if (c && c.price !== i.price) { Object.assign(i, { price: c.price, unit: c.unit, perPack: c.perPack, cat: c.cat }); k++; } }));
          await Store.saveRecipes(); toast(`${k} precio(s) actualizados en plantillas`);
        },
      },
    };
    const counts = Object.keys(CAT_LABELS).reduce((o, k) => { o[k] = cat.filter((c) => c.cat === k).length; return o; }, {});
    counts.alquilado = cat.filter((c) => c.cat === 'alquilado').length;
    main().innerHTML = `
      <div class="page-head"><div><p class="eyebrow">Catálogo</p><h1>Precios de costo</h1><p class="muted">Flores, oasis, implementos y mano de obra. Base: "LISTADO DE PRECIOS NUEVO". ${cat.length} insumos.</p></div>
        <div class="actions"><button class="btn primary" data-a="add">${icon('plus')} Agregar</button><button class="btn" data-a="exportCsv">Exportar CSV</button><button class="btn" data-a="importCsv">${icon('upload', 16)} Importar CSV</button><button class="btn" data-a="updateRecipes">Actualizar plantillas</button>
        <input type="file" id="csvFile" accept=".csv,text/csv" hidden></div></div>
      <div class="toolbar card">
        <div class="search">${icon('search', 16)}${inp('f.q', catFilter.q, { ph: 'Buscar insumo…', cls: 'grow' })}</div>
        <div class="chips">${[['', 'Todo', cat.length], ['flor', CAT_LABELS.flor, counts.flor], ['oasis', CAT_LABELS.oasis, counts.oasis],
          ['implemento', 'Implementos', counts.implemento + counts.alquilado], ['manoobra', CAT_LABELS.manoobra, counts.manoobra], ['otro', CAT_LABELS.otro, counts.otro]]
          .map(([k, l, c]) => `<button class="chip ${catFilter.cat === k ? 'on' : ''}" data-a="chip" data-k="${k}">${l} <i>${c}</i></button>`).join('')}</div>
      </div>
      ${catFilter.cat === 'implemento' ? `<div class="card rent-help">
        <div class="seg">${[['', 'Todos', counts.implemento + counts.alquilado], ['implemento', 'Propios', counts.implemento], ['alquilado', 'Alquilados', counts.alquilado]]
          .map(([k, l, n]) => `<button class="${catFilter.rent === k ? 'on' : ''}" data-a="rentFilter" data-k="${k}">${l} <small>${n}</small></button>`).join('')}</div>
        <p class="sm muted">Todos son <b>Implementos</b>. Active el interruptor <b>Alquilado</b> en los que se le rentan a un tercero para el evento y se devuelven (copas, candelabros, bases…); déjelo apagado en los propios o comprados (velas, cristalería). En los pedidos a proveedores los alquilados salen con la etiqueta "alquiler".</p>
      </div>` : ''}
      <div class="card table-wrap"><table class="tbl compact"><thead><tr><th>Nombre</th><th>Categoría</th><th>¿Alquilado?</th><th>Unidad</th><th class="r">Und. por paquete</th><th class="r">Precio de costo</th><th></th></tr></thead><tbody id="catRows"></tbody></table></div>`;
    $('#csvFile').addEventListener('change', async (e) => {
      const f = e.target.files[0]; if (!f) return;
      const text = await f.text();
      const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
      const sep = lines[0].includes(';') ? ';' : ',';
      let added = 0, updated = 0;
      lines.slice(1).forEach((ln) => {
        const [cg0, name, unit, perPack, price, rentCol] = ln.split(sep).map((x) => x.replace(/^"|"$/g, '').trim());
        if (!name) return;
        // Columna "Alquilado" (SI) convierte un implemento en alquilado; también se acepta la categoría antigua "alquilado"
        const cg = cg0 === 'implemento' && /^s[ií]/i.test(rentCol || '') ? 'alquilado' : cg0;
        const p = parseFloat(String(price).replace(/\./g, '').replace(',', '.')) || 0;
        const ex = cat.find((c) => c.name.toLowerCase() === name.toLowerCase());
        if (ex) { Object.assign(ex, { price: p, unit: unit || ex.unit, perPack: parseFloat(String(perPack).replace(',', '.')) || ex.perPack, cat: cg || ex.cat }); updated++; }
        else { cat.push({ id: 'c' + Store.uid(), cat: cg || 'otro', name, unit: unit || 'UN', perPack: parseFloat(String(perPack).replace(',', '.')) || 1, price: p }); added++; }
      });
      await Store.saveCatalog(); toast(`Importado: ${added} nuevos, ${updated} actualizados`); renderCatalog();
    });
    function draw() {
      const term = catFilter.q.trim().toLowerCase();
      const catOpts = Object.entries(CAT_LABELS);
      const inFilter = (c) => {
        if (!catFilter.cat) return true;
        if (catFilter.cat === 'implemento') return isImpl(c.cat) && (!catFilter.rent || c.cat === catFilter.rent);
        return c.cat === catFilter.cat;
      };
      $('#catRows').innerHTML = cat.map((c, i) => ({ c, i })).filter(({ c }) => inFilter(c) && (!term || c.name.toLowerCase().includes(term)))
        .map(({ c, i }) => `<tr>
          <td>${inp(`catalog.${i}.name`, c.name)}</td>
          <td><select class="in" data-ac="setCat" data-i="${i}">${catOpts.map(([k, l]) => `<option value="${k}" ${k === groupCat(c.cat) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></td>
          <td>${isImpl(c.cat) ? `<label class="switch sm" title="Alquilado a un tercero para el evento"><input type="checkbox" data-ac="rent" data-i="${i}" ${c.cat === 'alquilado' ? 'checked' : ''}><i></i><span>${c.cat === 'alquilado' ? 'Alquilado' : 'Propio'}</span></label>` : '<span class="muted">—</span>'}</td>
          <td>${inp(`catalog.${i}.unit`, c.unit, { cls: 'unit' })}</td>
          <td class="r">${inp(`catalog.${i}.perPack`, c.perPack, { t: 'num' })}</td>
          <td class="r">${inp(`catalog.${i}.price`, c.price, { t: 'money' })}</td>
          <td><button class="ib danger" data-a="del" data-i="${i}" title="Eliminar">${icon('trash', 15)}</button></td></tr>`).join('') || '<tr><td colspan="7" class="muted center">Sin resultados</td></tr>';
    }
    draw();
  }

  /* =====================================================================
   * 5. PLANTILLAS DE ARREGLOS + SIMULADOR
   * ===================================================================== */
  function renderRecipes(id) {
    const recipes = st().recipes;
    const r = id ? recipes.find((x) => x.id === id) : null;
    const save = () => scheduleSave(() => Store.saveRecipes());
    if (!r) {
      view = { root: {}, actions: {
        add() { const nr = { id: Store.uid(), name: 'Nuevo arreglo', desc: '', labor: 0, insumos: [], photo: '' }; recipes.push(nr); Store.saveRecipes().then(() => { location.hash = '#/plantillas/' + nr.id; }); },
        open(b) { location.hash = '#/plantillas/' + b.dataset.id; },
        async reseed() { recipes.push(...Store.seedRecipes(st().catalog)); await Store.saveRecipes(); renderRecipes(); },
      } };
      const ap = settings().pct.ajusteFlores;
      main().innerHTML = `<div class="page-head"><div><p class="eyebrow">Plantillas</p><h1>Recetas de arreglos</h1><p class="muted">Insumos + mano de obra de cada arreglo. Créelas una vez y úselas para cotizar con costo y precio sugerido en un clic.</p></div>
        <div class="actions"><button class="btn primary" data-a="add">${icon('plus')} Nueva plantilla</button>${!recipes.length ? '<button class="btn" data-a="reseed">Cargar ejemplos</button>' : ''}</div></div>
        <div class="rcards">${recipes.map((x) => {
          const c = C.recipeCost(x, ap); const sim = C.simulate(c.costo, c.alquilados, settings().simulador);
          return `<button class="rcard" data-a="open" data-id="${x.id}">
            <div class="rc-img ${x.photo ? '' : 'noimg'}">${x.photo ? `<img src="${x.photo}" alt="">` : icon('flower', 30)}</div>
            <div class="rc-body"><b>${esc(x.name)}</b><span class="muted xs">${(x.insumos || []).length} insumos · costo ${money(c.costo)}</span>
            <span class="rc-price"><small>Precio sugerido</small>${money(sim.precioRedondeado)}</span></div></button>`;
        }).join('') || '<div class="card empty"><p class="muted">Sin plantillas.</p></div>'}</div>`;
      return;
    }
    const rerender = () => { const y = scrollY; renderRecipes(id); scrollTo(0, y); };
    const outs = () => {
      const ap = settings().pct.ajusteFlores;
      const c = C.recipeCost(r, ap);
      const s = C.simulate(c.costo, c.alquilados, settings().simulador);
      const o = { 'r:fl': money(c.flores), 'r:aj': money(c.ajuste), 'r:ot': money(c.otros), 'r:al': money(c.alquilados), 'r:lb': money(c.labor), 'r:c': money(c.costo),
        's:g': money(s.ganancia), 's:b': money(s.base), 's:f': money(s.flete), 's:co': money(s.comision), 's:m': money(s.montaje), 's:ps': money(s.precioSinRetencion), 's:r': money(s.retencion), 's:p': money(s.precio), 's:pr': money(s.precioRedondeado), 's:gu': money(s.gananciaUnitaria), 's:x': '×' + (s.factor || 0).toFixed(2).replace('.', ',') };
      (r.insumos || []).forEach((i, k) => { o['ri:' + k] = money(n(i.qty) * n(i.price)); });
      setOutputs(o);
    };
    view = {
      root: { r, sim: settings().simulador },
      onInput(path, el, type) {
        if (/insumos\.\d+\.name$/.test(path)) {
          const c = catalogByName(el.value);
          if (c) { const cur = getP(view.root, path.replace(/\.name$/, '')); Object.assign(cur, insumoFromCatalog(c, cur.qty)); if (type === 'change') { save(); rerender(); return; } }
        }
        if (path.startsWith('sim.')) scheduleSave(() => Store.saveSettings()); else save();
        outs();
      },
      onDropPhotos(target, photos) { r.photo = photos[0]; save(); rerender(); },
      actions: {
        addIns() { r.insumos.push({ catId: '', name: '', cat: 'otro', unit: 'UN', perPack: 1, price: 0, qty: 1 }); save(); rerender(); setTimeout(() => { const l = $$('.ins-row input[list]'); l.length && l[l.length - 1].focus(); }, 30); },
        delIns(b) { r.insumos.splice(+b.dataset.k, 1); save(); rerender(); },
        insRent(el) { toggleInsRent(view.root, el, save, rerender); },
        setLabor(el) { const c = st().catalog.find((x) => x.id === el.value); if (c) { r.labor = c.price; r.laborName = c.name; save(); rerender(); } },
        async addPhoto() { const ph = await pickImages(false); if (ph.length) { r.photo = ph[0]; save(); rerender(); } },
        delPhoto() { r.photo = ''; save(); rerender(); },
        viewPhoto() { lightbox([r.photo]); },
        dup() { const c = Store.clone(r); c.id = Store.uid(); c.name += ' (copia)'; recipes.push(c); Store.saveRecipes().then(() => { location.hash = '#/plantillas/' + c.id; }); },
        async del() { if (!(await confirmBox('Eliminar plantilla', `Se eliminará "${r.name}".`, 'Eliminar'))) return; recipes.splice(recipes.indexOf(r), 1); await Store.saveRecipes(); location.hash = '#/plantillas'; },
      },
    };
    const sim = settings().simulador;
    const laborOpts = `<option value="">Elegir del catálogo…</option>` + st().catalog.filter((c) => c.cat === 'manoobra').map((c) => `<option value="${c.id}">${esc(c.name)} · ${money(c.price)}</option>`).join('');
    main().innerHTML = `
      <div class="page-head"><div><a href="#/plantillas" class="back">${icon('back', 16)} Plantillas</a><h1>${esc(r.name)}</h1></div>
        <div class="actions"><span id="saveInd" class="save-ind"><i class="dot"></i>Guardado</span><button class="btn" data-a="dup">${icon('copy', 16)} Duplicar</button><button class="btn ghost danger" data-a="del">${icon('trash', 16)} Eliminar</button></div></div>
      <div class="editor-grid">
        <div class="editor-main">
          <div class="card recipe-top">
            <div class="cover small ${r.photo ? '' : 'empty'}" data-dropphoto="recipe">
              ${r.photo ? `<img src="${r.photo}" alt="" data-a="viewPhoto"><button class="ph-del" data-a="delPhoto">${icon('x', 14)}</button>` : `<button class="cover-add" data-a="addPhoto">${icon('image', 22)}<b>Foto</b><small>Se copia al ítem</small></button>`}
            </div>
            <div class="grow">
              <div class="grid g2">
                ${field('Nombre de la plantilla', inp('r.name', r.name))}
                ${field('Mano de obra por unidad', inp('r.labor', r.labor, { t: 'money' }) + `<select class="in" data-ac="setLabor">${laborOpts}</select>`)}
              </div>
              ${field('Descripción para el cliente (se copia al ítem)', inp('r.desc', r.desc, { t: 'area' }))}
            </div>
          </div>
          <div class="card">
            <div class="card-head"><h3>${icon('flower')} Insumos por unidad de arreglo</h3></div>
            <div class="ins-table">
              <div class="ins-row head r5"><span>Insumo</span><span>Cantidad</span><span>Unidad</span><span>Precio unit.</span><span>Costo</span><span></span></div>
              ${(r.insumos || []).map((i, k) => `<div class="ins-row r5">
                <span>${inp(`r.insumos.${k}.name`, i.name, { list: 'dl-cat', ph: 'Escriba para buscar…' })}${rentSwitch(i, `r.insumos.${k}`)}</span>
                <span>${inp(`r.insumos.${k}.qty`, i.qty, { t: 'num' })}</span>
                <span>${inp(`r.insumos.${k}.unit`, i.unit, { cls: 'unit' })}</span>
                <span>${inp(`r.insumos.${k}.price`, i.price, { t: 'money' })}</span>
                <span class="r" data-o="ri:${k}"></span>
                <span><button class="ib danger" data-a="delIns" data-k="${k}">${icon('x', 14)}</button></span></div>`).join('')}
              <button class="btn sm" data-a="addIns">${icon('plus', 14)} Insumo</button>
            </div>
            <p class="sm muted">Para flores, la cantidad va en paquetes (ej. 0,25 PQ de rosa = 6 tallos si el paquete trae 24).</p>
          </div>
        </div>
        <aside class="totals card">
          <h3>${icon('sparkle', 16)} Simulador de precio</h3>
          <div class="tl"><span>Flores</span><b data-o="r:fl"></b></div>
          <div class="tl"><span>+ Ajuste flores</span><b data-o="r:aj"></b></div>
          <div class="tl"><span>+ Oasis / implementos</span><b data-o="r:ot"></b></div>
          <div class="tl"><span>+ Alquilados</span><b data-o="r:al"></b></div>
          <div class="tl"><span>+ Mano de obra</span><b data-o="r:lb"></b></div>
          <div class="tl strong"><span>Costo de realización</span><b data-o="r:c"></b></div>
          <div class="grid g2 sim-pcts">
            ${field('Ganancia', inp('sim.ganancia', sim.ganancia, { t: 'pct' }))}
            ${field('Flete', inp('sim.flete', sim.flete, { t: 'pct' }))}
            ${field('Comisión', inp('sim.comision', sim.comision, { t: 'pct' }))}
            ${field('Montaje', inp('sim.montaje', sim.montaje, { t: 'pct' }))}
            ${field('Retención/ICA', inp('sim.retencion', sim.retencion, { t: 'pct' }))}
          </div>
          <div class="tl"><span>Ganancia en costos</span><b data-o="s:g"></b></div>
          <div class="tl"><span>Costo + ganancia</span><b data-o="s:b"></b></div>
          <div class="tl"><span>+ Flete</span><b data-o="s:f"></b></div>
          <div class="tl"><span>+ Comisión</span><b data-o="s:co"></b></div>
          <div class="tl"><span>+ Montaje</span><b data-o="s:m"></b></div>
          <div class="tl"><span>Precio sin retención</span><b data-o="s:ps"></b></div>
          <div class="tl"><span>+ Retención/ICA</span><b data-o="s:r"></b></div>
          <div class="tl grand"><span>Precio de venta</span><b data-o="s:pr"></b></div>
          <div class="tl muted"><span>Exacto · factor sobre costo</span><b><span data-o="s:p"></span> <span data-o="s:x"></span></b></div>
          <div class="tl"><span>Ganancia unitaria</span><b data-o="s:gu"></b></div>
          <p class="sm muted">Los % del simulador son generales (se guardan en Ajustes).</p>
        </aside>
      </div>
      <datalist id="dl-cat">${st().catalog.map((c) => `<option value="${esc(c.name)}">${esc(catLabel(c.cat))}${c.cat === 'alquilado' ? ' (alquilado)' : ''} · ${money(c.price)}/${esc(c.unit)}</option>`).join('')}</datalist>`;
    outs();
  }

  /* =====================================================================
   * 6. AJUSTES
   * ===================================================================== */
  function renderSettings() {
    const s = settings();
    const save = () => scheduleSave(() => Store.saveSettings());
    view = {
      root: s,
      onInput(path, el, type) { save(); if (el.dataset.rr && type === 'change') renderSettings(); },
      actions: {
        addBank() { s.cuentas.push({ banco: '', tipo: 'Ahorros', numero: '' }); save(); renderSettings(); },
        delBank(b) { s.cuentas.splice(+b.dataset.i, 1); save(); renderSettings(); },
        addTerm() { s.terminos.push(''); save(); renderSettings(); },
        delTerm(b) { s.terminos.splice(+b.dataset.i, 1); save(); renderSettings(); },
        backup() { download(`Respaldo Alheli ${todayISO()}.json`, Store.exportJSON(), 'application/json'); },
        restore() { $('#restoreFile').click(); },
        async resetDefaults() {
          if (!(await confirmBox('Restaurar valores', 'Los porcentajes y tarifas volverán a los valores originales del Excel. No se borran cotizaciones.', 'Restaurar', false))) return;
          s.pct = Store.clone(DEFAULT_SETTINGS.pct); s.simulador = Store.clone(DEFAULT_SETTINGS.simulador); s.logistica = Store.clone(DEFAULT_SETTINGS.logistica);
          await Store.saveSettings(); renderSettings();
        },
      },
    };
    const e = s.empresa;
    const kb = Math.round(Store.exportJSON().length / 1024);
    main().innerHTML = `
      <div class="page-head"><div><p class="eyebrow">Ajustes</p><h1>Configuración</h1><p class="muted">Datos de la empresa, términos, cuentas y porcentajes por defecto para nuevas cotizaciones.</p></div><span id="saveInd" class="save-ind"><i class="dot"></i>Guardado</span></div>
      <div class="card"><div class="card-head"><h3>${icon('home')} Empresa (aparece en el PDF y el Excel)</h3></div><div class="grid g3">
        ${[['nombre', 'Nombre'], ['gerente', 'Firma (nombre)'], ['cargo', 'Cargo'], ['direccion', 'Dirección'], ['ciudad', 'Ciudad'], ['telefono', 'Teléfonos'], ['web', 'Sitio web'], ['email', 'Email'], ['instagram', 'Instagram'], ['facebook', 'Facebook'], ['twitter', 'Twitter'], ['pinterest', 'Pinterest']].map(([k, l]) => field(l, inp('empresa.' + k, e[k]))).join('')}
      </div></div>
      <div class="card"><div class="card-head"><h3>${icon('money')} Cuentas para consignar</h3><button class="btn sm" data-a="addBank">${icon('plus', 14)} Cuenta</button></div>
        ${s.cuentas.map((c, i) => `<div class="grid g4 row-line">${field('Banco', inp(`cuentas.${i}.banco`, c.banco))}${field('Tipo', inp(`cuentas.${i}.tipo`, c.tipo))}${field('Número', inp(`cuentas.${i}.numero`, c.numero))}<div class="end"><button class="ib danger" data-a="delBank" data-i="${i}">${icon('trash', 15)}</button></div></div>`).join('')}
      </div>
      <div class="card"><div class="card-head"><h3>${icon('file')} Términos y condiciones</h3><button class="btn sm" data-a="addTerm">${icon('plus', 14)} Término</button></div><p class="sm muted">Use {deposito} para insertar el valor del depósito de cada cotización.</p>
        ${s.terminos.map((t, i) => `<div class="term-row">${inp(`terminos.${i}`, t, { t: 'area', rows: 2 })}<button class="ib danger" data-a="delTerm" data-i="${i}">${icon('trash', 15)}</button></div>`).join('')}
      </div>
      <div class="card"><div class="card-head"><h3>${icon('settings')} Valores por defecto para nuevas cotizaciones</h3></div><div class="grid g4">
        ${field('Siguiente número de cotización', inp('numeracion.siguiente', s.numeracion.siguiente, { t: 'num' }))}
        ${field('Días de vigencia', inp('diasVencimiento', s.diasVencimiento, { t: 'num' }))}
        ${field('Depósito reembolsable', inp('deposito', s.deposito, { t: 'money' }))}
        ${field('Anticipo', inp('pct.anticipo', s.pct.anticipo, { t: 'pct' }))}
        ${field('IVA', inp('pct.iva', s.pct.iva, { t: 'pct' }))}
        ${field('Retención o ICA', inp('pct.retencion', s.pct.retencion, { t: 'pct' }))}
        ${field('Ajuste flores', inp('pct.ajusteFlores', s.pct.ajusteFlores, { t: 'pct' }))}
        ${field('% comisión por arreglo', inp('pct.comision', s.pct.comision, { t: 'pct' }))}
        ${field('% montaje por arreglo', inp('pct.montaje', s.pct.montaje, { t: 'pct' }))}
        ${field('Comisión planner/agencia', inp('pct.comisionPlanner', s.pct.comisionPlanner, { t: 'pct' }))}
      </div><p class="sm muted">Cada cotización guarda sus propios porcentajes al crearse; cambiarlos aquí no altera cotizaciones existentes.</p></div>
      <div class="card"><div class="card-head"><h3>${icon('sparkle')} Simulador de precio de venta</h3></div><div class="grid g5">
        ${field('Ganancia en costos', inp('simulador.ganancia', s.simulador.ganancia, { t: 'pct' }))}
        ${field('Flete', inp('simulador.flete', s.simulador.flete, { t: 'pct' }))}
        ${field('Comisión', inp('simulador.comision', s.simulador.comision, { t: 'pct' }))}
        ${field('Montaje', inp('simulador.montaje', s.simulador.montaje, { t: 'pct' }))}
        ${field('Retención/ICA', inp('simulador.retencion', s.simulador.retencion, { t: 'pct' }))}
      </div></div>
      <div class="card"><div class="card-head"><h3>${icon('truck')} Logística (tarifas)</h3><button class="btn sm ghost" data-a="resetDefaults">Restaurar valores del Excel</button></div><div class="grid g4">
        ${[['staff', 'Staff por persona'], ['arl', 'ARL por persona'], ['almuerzo', 'Almuerzo'], ['desayuno', 'Desayuno'], ['viajeContratado', 'Viaje transporte contratado'], ['viajePropio', 'Viaje camioneta propia'], ['fleteCaja', 'Flete por caja de flores']].map(([k, l]) => field(l, inp('logistica.' + k, s.logistica[k], { t: 'money' }))).join('')}
      </div></div>
      <div class="card"><div class="card-head"><h3>${icon('cloud')} Datos y respaldo</h3></div>
        <p>Almacenamiento: <b>${Store.mode === 'cloud' ? '☁ Nube (Supabase), compartido con el contador' : '💻 Este navegador (IndexedDB)'}</b>${Store.user ? ` · sesión: ${esc(Store.user.email)}` : ''} · tamaño de los datos: <b>${kb >= 1024 ? (kb / 1024).toFixed(1).replace('.', ',') + ' MB' : kb + ' KB'}</b></p>
        ${Store.mode === 'local' ? '<p class="sm muted">Para compartir con el contador desde otro equipo, active la nube (README, paso 3). Mientras tanto, descargue respaldos con frecuencia.</p>' : ''}
        <div class="actions"><button class="btn" data-a="backup">${icon('download', 16)} Descargar respaldo (.json)</button><button class="btn" data-a="restore">${icon('upload', 16)} Restaurar respaldo</button>${Store.mode === 'cloud' ? '<button class="btn ghost" data-a="logout">Cerrar sesión</button>' : ''}</div>
        <p class="sm muted" style="margin-top:14px">Cotizaciones de ejemplo (basadas en sus Excel):</p>
        <div class="actions"><button class="btn sm" data-a="demo" data-ex="2428">Boda Hilton (2428)</button><button class="btn sm" data-a="demo" data-ex="2347">Boda Catedral con fotos (2347)</button></div>
        <input type="file" id="restoreFile" accept=".json,application/json" hidden>
      </div>`;
    $('#restoreFile').addEventListener('change', async (ev) => {
      const f = ev.target.files[0]; if (!f) return;
      try {
        const obj = JSON.parse(await f.text());
        if (!(await confirmBox('Restaurar respaldo', `Se reemplazarán los datos actuales por el respaldo (${(obj.quotes || []).length} cotizaciones).`, 'Restaurar'))) return;
        await Store.importJSON(obj); toast('Respaldo restaurado'); renderSettings();
      } catch (err) { toast('Archivo no válido: ' + err.message, 'err'); }
    });
  }

  /* ================= LOGIN (modo nube) ================= */
  function renderLogin() {
    document.body.classList.add('login-mode');
    main().innerHTML = `<form class="card login" id="loginForm">
      <img src="${window.LOGO_DATA_URI}" alt="Alhelí" class="login-logo">
      <h2>Bienvenida</h2><p class="muted sm">Ingrese con el usuario que le asignaron.</p>
      <label class="field"><span>Correo</span><input class="in" type="email" name="email" required autocomplete="username"></label>
      <label class="field"><span>Contraseña</span><input class="in" type="password" name="password" required autocomplete="current-password"></label>
      <button class="btn primary block lg" type="submit">Entrar</button>
      <p class="sm muted center" id="loginMsg"></p></form>`;
    $('#loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      $('#loginMsg').textContent = 'Ingresando…';
      try { await Store.signIn(fd.get('email'), fd.get('password')); document.body.classList.remove('login-mode'); route(); }
      catch (err) { $('#loginMsg').textContent = 'No se pudo ingresar: ' + err.message; }
    });
  }

  /* ================= ARRANQUE ================= */
  function loadScript(src) {
    return new Promise((res) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = res; document.head.appendChild(s); });
  }
  async function start() {
    const th = document.documentElement.dataset.theme === 'dark';
    $('#themeBtn').innerHTML = icon(th ? 'sun' : 'moon', 18) + `<span>${th ? 'Modo claro' : 'Modo oscuro'}</span>`;
    $$('[data-ico]').forEach((el) => { el.innerHTML = icon(el.dataset.ico, +(el.dataset.size || 18)); });
    bindGlobalEvents();
    window.addEventListener('hashchange', route);
    if (APP_CONFIG.SUPABASE_URL && APP_CONFIG.SUPABASE_ANON_KEY) {
      await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js');
    }
    try {
      const r = await Store.init();
      $('#modeBadge').innerHTML = Store.mode === 'cloud' ? icon('cloud', 14) + ' Nube' : icon('home', 14) + ' Este equipo';
      if (r === 'login') return renderLogin();
    } catch (err) {
      console.error(err);
      main().innerHTML = `<div class="card empty"><h2>No se pudo conectar</h2><p>${esc(err.message)}</p><p class="muted">Revise la configuración de Supabase en js/config.js o su conexión a internet.</p></div>`;
      return;
    }
    route();
  }
  document.addEventListener('DOMContentLoaded', start);
})();
