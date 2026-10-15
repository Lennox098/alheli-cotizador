/*
 * COMPONENTES DE INTERFAZ: íconos SVG, ventanas de diálogo, visor de fotos,
 * gráficos (dona y barras), compresión de fotos y menús desplegables.
 */
(function () {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Íconos (trazos estilo "lucide") ---------- */
  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
    flower: '<circle cx="12" cy="9" r="2.5"/><path d="M12 6.5C12 4 13.5 3 15 3c0 2-1.2 3.5-3 3.5zM12 6.5C12 4 10.5 3 9 3c0 2 1.2 3.5 3 3.5zM14.5 9c2.5 0 3.5 1.5 3.5 3-2 0-3.5-1.2-3.5-3zM9.5 9C7 9 6 10.5 6 12c2 0 3.5-1.2 3.5-3z"/><path d="M12 11.5V21M12 17c-2-2-4-2-5-1M12 15c2-2 4-2 5-1"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    pdf: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 17v-4h1.5a1.5 1.5 0 0 1 0 3H8"/><path d="M13 13v4h1a2 2 0 0 0 0-4z"/>',
    excel: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
    whatsapp: '<path d="M3.5 20.5 5 16A8.5 8.5 0 1 1 8 19z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1c-1-.5-2-1.5-2.5-2.5l1-1-1-2z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    printer: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>',
    copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/>',
    up: '<path d="m6 15 6-6 6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    grip: '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="m5 12 5 5L20 7"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 21c0-4 3-6.5 7-6.5s7 2.5 7 6.5"/><path d="M16 4a3.5 3.5 0 0 1 0 7M22 21c0-3-1.5-5-4-6"/>',
    money: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
    alert: '<path d="M12 3 2 21h20z"/><path d="M12 10v5M12 18h.01"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    chevron: '<path d="m9 6 6 6-6 6"/>',
    back: '<path d="m15 6-6 6 6 6"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    tag: '<path d="M3 12V3h9l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
    box: '<path d="m21 8-9-5-9 5v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
    cloud: '<path d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 8z"/>',
    upload: '<path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M5 3h14"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  };
  function icon(name, size = 18, cls = '') {
    return `<svg class="ico ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
  }

  /* ---------- Ventanas de diálogo ---------- */
  function modal({ title, body, okText = 'Aceptar', cancelText = 'Cancelar', danger = false, wide = false, onOpen }) {
    return new Promise((resolve) => {
      const wrap = document.createElement('div');
      wrap.className = 'modal-back';
      wrap.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">
        <div class="modal-head"><h3>${esc(title || '')}</h3><button class="ib" data-x>${icon('x')}</button></div>
        <div class="modal-body">${body || ''}</div>
        <div class="modal-foot">${cancelText ? `<button class="btn ghost" data-x>${esc(cancelText)}</button>` : ''}<button class="btn ${danger ? 'danger-solid' : 'primary'}" data-ok>${esc(okText)}</button></div>
      </div>`;
      document.body.appendChild(wrap);
      requestAnimationFrame(() => wrap.classList.add('in'));
      const close = (v) => { wrap.classList.remove('in'); setTimeout(() => wrap.remove(), 180); document.removeEventListener('keydown', onKey); resolve(v); };
      const ok = () => {
        const inp = wrap.querySelector('[data-value]');
        close(inp ? inp.value : true);
      };
      const onKey = (e) => { if (e.key === 'Escape') close(false); if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); ok(); } };
      document.addEventListener('keydown', onKey);
      wrap.addEventListener('click', (e) => {
        if (e.target === wrap || e.target.closest('[data-x]')) close(false);
        else if (e.target.closest('[data-ok]')) ok();
      });
      const f = wrap.querySelector('[data-value], [data-ok]');
      setTimeout(() => { f && f.focus(); if (f && f.select) f.select(); }, 50);
      onOpen && onOpen(wrap);
    });
  }
  const confirmBox = (title, text, okText = 'Sí, continuar', danger = true) => modal({ title, body: `<p>${esc(text)}</p>`, okText, danger });
  const promptBox = (title, label, value = '') => modal({ title, body: `<label class="field"><span>${esc(label)}</span><input class="in" data-value value="${esc(value)}"></label>`, okText: 'Guardar' });

  /* ---------- Visor de fotos ---------- */
  function lightbox(photos, start = 0) {
    let i = start;
    const wrap = document.createElement('div');
    wrap.className = 'lightbox';
    const draw = () => {
      wrap.innerHTML = `<button class="lb-x" data-x>${icon('x', 26)}</button>
        ${photos.length > 1 ? `<button class="lb-nav prev" data-p>${icon('back', 30)}</button><button class="lb-nav next" data-n>${icon('chevron', 30)}</button>` : ''}
        <img src="${photos[i]}" alt=""><div class="lb-count">${i + 1} / ${photos.length}</div>`;
    };
    draw();
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('in'));
    const close = () => { wrap.remove(); document.removeEventListener('keydown', key); };
    const key = (e) => { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') { i = (i + 1) % photos.length; draw(); } if (e.key === 'ArrowLeft') { i = (i - 1 + photos.length) % photos.length; draw(); } };
    document.addEventListener('keydown', key);
    wrap.addEventListener('click', (e) => {
      if (e.target.closest('[data-n]')) { i = (i + 1) % photos.length; draw(); }
      else if (e.target.closest('[data-p]')) { i = (i - 1 + photos.length) % photos.length; draw(); }
      else if (e.target.tagName !== 'IMG') close();
    });
  }

  /* ---------- Compresión de fotos (máx. 1000 px, JPEG 80%) ---------- */
  function compressImage(file, max = 1000, quality = 0.8) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\//.test(file.type)) return reject(new Error('El archivo no es una imagen'));
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const s = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          const g = c.getContext('2d');
          g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
          g.drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('No se pudo leer la imagen'));
        img.src = fr.result;
      };
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(file);
    });
  }
  // Abre el selector de archivos y devuelve las fotos comprimidas
  function pickImages(multiple = true) {
    return new Promise((resolve) => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = multiple;
      inp.onchange = async () => {
        const out = [];
        for (const f of inp.files) { try { out.push(await compressImage(f)); } catch (e) { /* omitir */ } }
        resolve(out);
      };
      inp.click();
    });
  }
  const dataUrlKB = (d) => Math.round((String(d || '').length * 3) / 4 / 1024);

  /* ---------- Gráficos SVG ---------- */
  const PALETTE = ['#c93c64', '#e8a33d', '#4f8a6e', '#5b7fc7', '#9b6bc4', '#d9775b', '#7a8a99'];
  function donut(parts, { size = 180, thick = 26, center = '', sub = '' } = {}) {
    const tot = parts.reduce((a, p) => a + Math.max(0, p.value), 0) || 1;
    const r = (size - thick) / 2, c = size / 2, L = 2 * Math.PI * r;
    let off = 0;
    const segs = parts.filter((p) => p.value > 0).map((p, i) => {
      const len = (p.value / tot) * L;
      const s = `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${p.color || PALETTE[i % PALETTE.length]}" stroke-width="${thick}" stroke-dasharray="${len} ${L - len}" stroke-dashoffset="${-off}" transform="rotate(-90 ${c} ${c})"><title>${esc(p.label)}</title></circle>`;
      off += len; return s;
    }).join('');
    return `<div class="donut-wrap"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="donut">
      <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="var(--line)" stroke-width="${thick}"/>${segs}
      <text x="${c}" y="${c - 2}" text-anchor="middle" class="d-c1">${esc(center)}</text><text x="${c}" y="${c + 16}" text-anchor="middle" class="d-c2">${esc(sub)}</text></svg>
      <ul class="legend">${parts.map((p, i) => `<li><i style="background:${p.color || PALETTE[i % PALETTE.length]}"></i><span>${esc(p.label)}</span><b>${esc(p.text || '')}</b></li>`).join('')}</ul></div>`;
  }
  function bars(items, { height = 170, fmt = (v) => v } = {}) {
    const max = Math.max(1, ...items.map((i) => Math.max(i.value, i.value2 || 0)));
    return `<div class="bars" style="height:${height}px">${items.map((i) => `<div class="bar-col" title="${esc(i.label)}: ${esc(fmt(i.value))}">
      <div class="bar-stack"><div class="bar" style="height:${(i.value / max) * 100}%"></div>${i.value2 != null ? `<div class="bar b2" style="height:${(i.value2 / max) * 100}%"></div>` : ''}</div>
      <small>${esc(i.label)}</small></div>`).join('')}</div>`;
  }
  // Barra horizontal de progreso/participación
  const meter = (pct, cls = '') => `<div class="meter ${cls}"><i style="width:${Math.max(0, Math.min(100, pct * 100))}%"></i></div>`;

  /* ---------- Menú desplegable ---------- */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-menu]');
    document.querySelectorAll('.menu.open').forEach((m) => { if (!t || m !== t.nextElementSibling) m.classList.remove('open'); });
    if (t) { e.preventDefault(); t.nextElementSibling.classList.toggle('open'); }
  });

  window.UI = { icon, modal, confirmBox, promptBox, lightbox, compressImage, pickImages, dataUrlKB, donut, bars, meter, PALETTE, esc };
})();
