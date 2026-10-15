/*
 * EXPORTAR A EXCEL (.xlsx) con fórmulas vivas, fotos y logo — sin internet.
 * Hojas: COTIZACION · RESUMEN · COSTOS INTERNOS · INSUMOS · PEDIDO FLORES
 * Usa el generador propio js/xlsx-writer.js.
 */
(function () {
  const C = window.Calc;
  const n = C.n;
  const L = (c) => window.XW.colLetter(c);

  const imgSize = (src) => new Promise((res) => {
    const i = new Image(); i.onload = () => res({ w: i.naturalWidth, h: i.naturalHeight }); i.onerror = () => res({ w: 4, h: 3 }); i.src = src;
  });

  // Colores y formatos
  const BRAND = 'FFC93C64', INK = 'FF2A2326', SOFT = 'FFFBE9EE', MUTED = 'FF8B8085', WHITE = 'FFFFFFFF', LIGHT = 'FFFBF6F7', YELLOW = 'FFFFF4C2', RED = 'FFFFE1E1';
  const MONEY = '"$" #,##0;[Red]-"$" #,##0;"$" 0';
  const COURTESY = '"CORTESÍA";"CORTESÍA";"CORTESÍA"';
  const PCT = '0.0%';
  const F = (f, v) => ({ f, v: Number.isFinite(v) ? Math.round(v * 100) / 100 : v });
  const font = (o = {}) => Object.assign({ size: 10, color: INK }, o);
  const S = {
    title: { font: font({ size: 22, bold: true }), align: { h: 'right' } },
    num: { font: font({ size: 14, bold: true, color: BRAND }), align: { h: 'right' } },
    label: { font: font({ color: MUTED }), align: { h: 'right' } },
    right: { font: font(), align: { h: 'right' } },
    info: { fill: LIGHT, align: { v: 'center', wrap: true } },
    head: { fill: INK, font: font({ bold: true, size: 9, color: WHITE }), align: { h: 'center', v: 'center', wrap: true } },
    sec: { fill: SOFT, font: font({ bold: true, size: 11, color: BRAND }), align: { v: 'center' } },
    sub: { fill: 'FFFDFAFB', font: font({ bold: true }), border: { bottom: 'medium' } },
    subMoney: { fill: 'FFFDFAFB', font: font({ bold: true }), border: { bottom: 'medium' }, numFmt: MONEY, align: { h: 'right' } },
    cellQty: { font: font(), align: { h: 'center', v: 'top' }, border: { bottom: 'thin', color: 'FFF0E8EA' } },
    cellText: { font: font(), align: { v: 'top', wrap: true }, border: { bottom: 'thin', color: 'FFF0E8EA' } },
    cellBlank: { border: { bottom: 'thin', color: 'FFF0E8EA' } },
    cellMoney: { font: font(), numFmt: MONEY, align: { h: 'right', v: 'top' }, border: { bottom: 'thin', color: 'FFF0E8EA' } },
    cellCourtesy: { font: font({ bold: true, color: BRAND }), numFmt: COURTESY, align: { h: 'right', v: 'top' }, border: { bottom: 'thin', color: 'FFF0E8EA' } },
    totLabel: { font: font({ bold: true }), align: { h: 'right' } },
    totMoney: { font: font({ bold: true }), numFmt: MONEY, align: { h: 'right' } },
    mutedLabel: { font: font({ color: MUTED }), align: { h: 'right' } },
    mutedMoney: { font: font({ color: MUTED }), numFmt: MONEY, align: { h: 'right' } },
    mutedPct: { font: font({ color: MUTED }), numFmt: '0%', align: { h: 'right' } },
    grandLabel: { fill: INK, font: font({ bold: true, size: 12, color: WHITE }), align: { h: 'right', v: 'center' } },
    grandMoney: { fill: INK, font: font({ bold: true, size: 12, color: WHITE }), numFmt: MONEY, align: { h: 'right', v: 'center' } },
    blockTitle: { font: font({ bold: true, size: 11, color: BRAND }) },
    para: { font: font({ size: 9.5 }), align: { v: 'top', wrap: true } },
    foot: { font: font({ size: 8, color: MUTED }), align: { h: 'center', v: 'center', wrap: true } },
    big: { font: font({ bold: true, size: 14, color: BRAND }) },
    note: { font: font({ italic: true, size: 9, color: MUTED }) },
    money: { numFmt: MONEY, font: font() },
    pct0: { numFmt: '0%', font: font() },
    input: { fill: YELLOW, font: font({ bold: true }) },
    inputPct: { fill: YELLOW, font: font({ bold: true }), numFmt: '0%' },
    inputMoney: { fill: YELLOW, font: font({ bold: true }), numFmt: MONEY },
    wrapTop: { font: font(), align: { v: 'top', wrap: true } },
  };

  function fechaLarga(iso) {
    if (!iso) return '';
    const M = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const [y, m, d] = iso.split('-').map(Number);
    return y && m && d ? `${d} de ${M[m - 1]} de ${y}` : iso;
  }

  async function quoteWorkbook(q, settings) {
    const wb = new window.XW.Workbook();
    const t = C.quoteTotals(q);
    const pct = q.pct;
    const showPhotos = (q.photoMode || 'thumb') !== 'none';
    const CAT = window.CAT_LABELS || {};
    const fs = C.financeSummary(q, settings.logistica);

    /* =================== HOJA 1: COTIZACION =================== */
    const ws = wb.addSheet('COTIZACION', {
      cols: [8, 58, showPhotos ? 22 : 3, 17, 19], gridLines: false, tab: BRAND,
      page: { center: true, footer: `&L&8${settings.empresa.nombre}&R&8Página &P de &N` },
    });
    if (window.LOGO_DATA_URI) ws.image({ dataUrl: window.LOGO_DATA_URI, col: 0, row: 0, dx: 6, dy: 4, w: 150, h: 125 });
    ws.merge('D1:E1').set('D1', 'COTIZACIÓN', S.title).height(1, 30);
    ws.merge('D2:E2').set('D2', 'No. ' + q.number, S.num).height(2, 22);
    ws.set('D3', 'Fecha de elaboración', S.label).set('E3', fechaLarga(q.fechaElaboracion), S.right);
    ws.set('D4', 'Válida hasta', S.label).set('E4', fechaLarga(q.fechaVencimiento), S.right);
    for (let r = 5; r <= 7; r++) ws.height(r, 15);
    let r = 8;
    if (q.coverPhoto && showPhotos) {
      const sz = await imgSize(q.coverPhoto);
      // ancho total de la hoja (1 unidad de ancho de columna ≈ 7 px)
      const W = Math.round([8, 58, showPhotos ? 22 : 3, 17, 19].reduce((a, b) => a + b, 0) * 7) - 8;
      const H = Math.min(260, Math.round((W * sz.h) / sz.w));
      ws.image({ dataUrl: q.coverPhoto, col: 0, row: r - 1, dx: 4, dy: 3, w: W, h: H });
      ws.height(r, H * 0.75 + 6);
      r += 2;
    }
    const rich = (label, value) => ({ rich: [{ text: label + '  ', font: { bold: true, size: 8.5, color: BRAND } }, { text: String(value || '—'), font: { bold: true, size: 10 } }] });
    [
      ['NOMBRE DEL CLIENTE:', q.cliente.nombre, 'CORREO:', q.cliente.correo],
      ['CELULAR:', q.cliente.celular, 'PAX:', q.evento.pax ? q.evento.pax + ' PAX' : ''],
      ['EVENTO:', (q.evento.tipo || '').toUpperCase(), 'FECHA EVENTO:', fechaLarga(q.evento.fecha).toUpperCase() || 'POR DEFINIR'],
      ['CEREMONIA:', q.evento.ceremonia, 'HORA:', q.evento.hora],
      ['RECEPCIÓN:', q.evento.recepcion, '', ''],
    ].forEach((row) => {
      ws.merge(`A${r}:C${r}`).set('A' + r, rich(row[0], row[1]), S.info).style('B' + r, S.info).style('C' + r, S.info);
      ws.merge(`D${r}:E${r}`).set('D' + r, row[2] ? rich(row[2], row[3]) : '', S.info).style('E' + r, S.info);
      ws.height(r, 20); r++;
    });
    r++;
    ['CANT', 'CONCEPTO', showPhotos ? 'FOTO' : '', 'VLR. UNIT.', 'VLR. TOTAL'].forEach((h, i) => ws.set(L(i + 1) + r, h, S.head));
    ws.height(r, 22); r++;

    const secRefs = [];
    for (let si = 0; si < q.sections.length; si++) {
      const s = q.sections[si];
      if (!s.items.length) continue;
      ws.merge(`A${r}:E${r}`).set('A' + r, s.title, S.sec).height(r, 22);
      ['B', 'C', 'D', 'E'].forEach((c) => ws.style(c + r, S.sec));
      r++;
      const first = r;
      for (const it of s.items) {
        const desc = (it.desc || '') + (it.courtesy ? '  (CORTESÍA)' : '');
        ws.set('A' + r, n(it.qty), S.cellQty).set('B' + r, desc, S.cellText).style('C' + r, S.cellBlank);
        ws.set('D' + r, it.courtesy ? 0 : n(it.unitPrice), it.courtesy ? S.cellCourtesy : S.cellMoney);
        ws.set('E' + r, F(`A${r}*D${r}`, C.lineTotal(it)), it.courtesy ? S.cellCourtesy : S.cellMoney);
        let h = Math.max(18, Math.ceil((desc.length || 1) / 54) * 13.5 + 7);
        const photos = showPhotos ? (it.photos || []) : [];
        if (photos.length) {
          const PH = 92; let y = 4;
          for (const p of photos) {
            const sz = await imgSize(p);
            const w = Math.min(150, Math.round((PH * sz.w) / sz.h));
            ws.image({ dataUrl: p, col: 2, row: r - 1, dx: Math.max(4, (155 - w) / 2), dy: y, w, h: PH });
            y += PH + 6;
          }
          h = Math.max(h, (photos.length * (PH + 6) + 6) * 0.75);
        }
        ws.height(r, Math.round(h * 10) / 10);
        r++;
      }
      ws.set('B' + r, 'TOTAL ' + s.title, S.sub).style('A' + r, S.sub).style('C' + r, S.sub).style('D' + r, S.sub);
      ws.set('E' + r, F(`SUM(E${first}:E${r - 1})`, t.sections[si].total), S.subMoney);
      secRefs.push('E' + r); r++;
    }
    let transRef = null;
    if (t.transporte) {
      ws.merge(`A${r}:E${r}`).set('A' + r, 'LOGÍSTICA', S.sec).height(r, 22);
      ['B', 'C', 'D', 'E'].forEach((c) => ws.style(c + r, S.sec));
      r++;
      ws.set('A' + r, n(q.transport.qty), S.cellQty).set('B' + r, q.transport.desc, S.cellText).style('C' + r, S.cellBlank)
        .set('D' + r, n(q.transport.unitPrice), S.cellMoney).set('E' + r, F(`A${r}*D${r}`, t.transporte), S.cellMoney);
      transRef = 'E' + r; r++;
    }
    r++;
    const pctTxt = (v) => String(Math.round(n(v) * 1000) / 10).replace('.', ',') + '%';
    const tot = (label, value, kind) => {
      ws.merge(`C${r}:D${r}`);
      ws.set('C' + r, label, kind === 'grand' ? S.grandLabel : kind === 'muted' ? S.mutedLabel : S.totLabel);
      if (kind === 'grand') ws.style('D' + r, S.grandLabel);
      ws.set('E' + r, value, kind === 'grand' ? S.grandMoney : kind === 'muted' ? S.mutedMoney : S.totMoney);
      if (kind === 'grand') ws.height(r, 24);
      return 'E' + r++;
    };
    const subRef = tot('SUBTOTAL', F([...secRefs, ...(transRef ? [transRef] : [])].join('+') || '0', t.subtotal));
    const ivaRef = tot(`IVA (${pctTxt(pct.iva)})`, F(`${subRef}*${n(pct.iva)}`, t.iva), 'muted');
    const totRef = tot('TOTAL COTIZACIÓN', F(`${subRef}+${ivaRef}`, t.total), 'grand');
    if (t.deposito) tot('Depósito reembolsable de garantía', t.deposito, 'muted');
    if (n(pct.anticipo)) tot(`Anticipo para reservar (${pctTxt(pct.anticipo)})`, F(`${totRef}*${n(pct.anticipo)}`, t.anticipo), 'muted');
    r++;
    const block = (title, lines) => {
      ws.merge(`A${r}:E${r}`).set('A' + r, title, S.blockTitle); r++;
      lines.forEach((l) => { ws.merge(`A${r}:E${r}`).set('A' + r, l, S.para).height(r, Math.max(15, Math.ceil(l.length / 118) * 12.5 + 3)); r++; });
      r++;
    };
    if (q.notas) block('NOTAS', q.notas.split('\n'));
    block('TÉRMINOS Y CONDICIONES', settings.terminos.map((x) => '•  ' + x.replace('{deposito}', C.money(q.deposito))));
    block('FORMAS DE PAGO', ['Consignar en las cuentas: ' + settings.cuentas.map((c) => `${c.banco} ${String(c.tipo || '').toLowerCase()} # ${c.numero}`).join('   ·   ')]);
    const e = settings.empresa;
    ['Atentamente,', '', e.gerente, e.cargo, e.nombre].forEach((l, i) => { if (l) ws.set('A' + r, l, { font: font({ bold: i === 2 }) }); r++; });
    r++;
    ws.merge(`A${r}:E${r}`).set('A' + r, [e.direccion + (e.ciudad ? ', ' + e.ciudad : ''), 'Tel. ' + e.telefono, e.web, e.email, 'Instagram ' + e.instagram, 'Facebook ' + e.facebook].join('   ·   '), S.foot).height(r, 26);
    wb.printArea(ws, `$A$1:$E$${r}`);

    /* Hojas restantes (se crean en el orden en que aparecerán) */
    const wr = wb.addSheet('RESUMEN', { cols: [44, 18, 12, 4, 46, 16], gridLines: false, tab: 'FF4F8A6E' });
    const wc = wb.addSheet('COSTOS INTERNOS', { cols: [6, 13, 46, 8, 14, 13, 14, 9, 9, 13, 13, 13, 14, 15, 14, 14, 14, 15, 14, 15], freeze: 8, tab: 'FFE8A33D', page: { landscape: true } });
    const wi = wb.addSheet('INSUMOS', { cols: [6, 44, 11, 30, 24, 12, 9, 10, 13, 15, 11, 12], freeze: 1, tab: 'FF5B7FC7', page: { landscape: true } });
    const wp = wb.addSheet('PEDIDO FLORES', { cols: [32, 26, 9, 11, 11, 13, 15, 11, 13], freeze: 2, tab: 'FF9B6BC4' });

    /* =================== COSTOS INTERNOS =================== */
    wc.merge('A1:T1').set('A1', `COSTOS INTERNOS — Cotización ${q.number} · ${q.cliente.nombre || ''}`, S.big).height(1, 24);
    wc.set('A2', 'Uso interno. Cambie los valores en amarillo y todo se recalcula.', S.note);
    [['RETENCIÓN O ICA', n(pct.retencion)], ['AJUSTE FLORES', n(pct.ajusteFlores)], ['% COMISIÓN (defecto)', n(pct.comision)], ['% MONTAJE (defecto)', n(pct.montaje)]].forEach(([k, v], i) => {
      const rr = 3 + i;
      wc.merge(`B${rr}:C${rr}`).set('B' + rr, k, { font: font({ bold: true, size: 9 }) }).set('D' + rr, v, S.inputPct);
    });
    const RET = "'COSTOS INTERNOS'!$D$3", AJ = "'COSTOS INTERNOS'!$D$4";
    ['REF', 'SECCIÓN', 'ARREGLO', 'CANT.', 'VLR. COTIZADO', 'MANO OBRA U.', 'COSTO UNIT.', '% COMIS.', '% MONT.', 'MONTAJE U.', 'COMISIÓN U.', 'RETENCIÓN U.', 'GANANCIA U.', 'GANANCIA TOTAL', 'COMISIÓN TOTAL', 'MONTAJE TOTAL', 'M. OBRA TOTAL', 'COSTOS TOTAL', 'RETENCIÓN TOTAL', 'VENTA TOTAL']
      .forEach((h, i) => wc.set(L(i + 1) + 8, h, S.head));
    wc.height(8, 30);
    ['REF', 'ARREGLO', '# ARREGLOS', 'INSUMO', 'CATEGORÍA', 'CANT. POR ARREGLO', 'UNIDAD', 'TOTAL', 'PRECIO UNIT.', 'COSTO POR ARREGLO', 'UND / PAQUETE', 'FLORES / UND.']
      .forEach((h, i) => wi.set(L(i + 1) + 1, h, S.head));
    wi.height(1, 30);
    const flLabel = CAT.flor || 'flor';
    let cr = 9, ir = 2, ref = 0, matTotal = 0;
    q.sections.forEach((s) => s.items.forEach((it) => {
      ref++;
      const f = C.lineFinance(it, pct);
      const c = it.cost || {};
      const ins = c.mode !== 'manual' ? (c.insumos || []) : [];
      ins.forEach((x) => {
        const isF = x.cat === 'flor';
        const unitC = n(x.qty) * n(x.price) * (isF ? 1 + n(pct.ajusteFlores) : 1);
        matTotal += unitC * n(it.qty);
        wi.set('A' + ir, ref).set('B' + ir, (it.desc || '').slice(0, 90)).set('C' + ir, F(`'COSTOS INTERNOS'!D${cr}`, n(it.qty)))
          .set('D' + ir, x.name).set('E' + ir, CAT[x.cat] || x.cat).set('F' + ir, n(x.qty)).set('G' + ir, x.unit)
          .set('H' + ir, F(`F${ir}*C${ir}`, n(x.qty) * n(it.qty))).set('I' + ir, n(x.price), S.money)
          .set('J' + ir, F(`F${ir}*I${ir}*(1+IF(E${ir}="${flLabel}",${AJ},0))`, unitC), S.money)
          .set('K' + ir, n(x.perPack) || 1).set('L' + ir, F(`H${ir}*K${ir}`, n(x.qty) * n(it.qty) * (n(x.perPack) || 1)));
        ir++;
      });
      const K = c.commissionPct !== '' && c.commissionPct != null ? n(c.commissionPct) : null;
      const Lm = c.montajePct !== '' && c.montajePct != null ? n(c.montajePct) : null;
      wc.set('A' + cr, ref).set('B' + cr, s.title).set('C' + cr, (it.desc || '') + (it.courtesy ? ' (CORTESÍA)' : ''), S.wrapTop)
        .set('D' + cr, n(it.qty)).set('E' + cr, it.courtesy ? 0 : n(it.unitPrice), S.money).set('F' + cr, n(c.labor), S.money)
        .set('G' + cr, c.mode === 'manual' ? n(c.manualUnitCost) : F(`SUMIF(INSUMOS!$A:$A,A${cr},INSUMOS!$J:$J)+F${cr}`, f.costoUnit),
          Object.assign({}, S.money, c.mode === 'manual' ? { fill: YELLOW } : f.sinCosteo ? { fill: RED } : {}))
        .set('H' + cr, K != null ? K : F('$D$5', n(pct.comision)), S.pct0).set('I' + cr, Lm != null ? Lm : F('$D$6', n(pct.montaje)), S.pct0)
        .set('J' + cr, F(`E${cr}*I${cr}`, f.montajeUnit), S.money).set('K' + cr, F(`E${cr}*H${cr}`, f.comisionUnit), S.money)
        .set('L' + cr, F(`E${cr}*${RET}`, f.retencionUnit), S.money).set('M' + cr, F(`E${cr}-G${cr}-J${cr}-K${cr}-L${cr}`, f.gananciaUnit), S.money)
        .set('N' + cr, F(`D${cr}*M${cr}`, f.gananciaTotal), S.money).set('O' + cr, F(`D${cr}*K${cr}`, f.comisionTotal), S.money)
        .set('P' + cr, F(`D${cr}*J${cr}`, f.montajeTotal), S.money).set('Q' + cr, F(`D${cr}*F${cr}`, f.manoObraTotal), S.money)
        .set('R' + cr, F(`D${cr}*G${cr}`, f.costoTotal), S.money).set('S' + cr, F(`D${cr}*L${cr}`, f.retencionTotal), S.money)
        .set('T' + cr, F(`D${cr}*E${cr}`, f.ventaTotal), S.money);
      cr++;
    }));
    const lastC = Math.max(9, cr - 1);
    const totStyle = Object.assign({}, S.money, { font: font({ bold: true }), fill: 'FFF5EEF0' });
    for (let k = 1; k <= 20; k++) wc.style(L(k) + cr, { fill: 'FFF5EEF0', font: font({ bold: true }) });
    wc.set('C' + cr, 'TOTALES', { fill: 'FFF5EEF0', font: font({ bold: true }) });
    const totals = { N: fs.gananciaArreglos, O: fs.comisiones, P: fs.montaje, Q: fs.manoObra, R: fs.costos, S: fs.retencionArreglos, T: fs.ventas - fs.totals.transporte };
    Object.entries(totals).forEach(([col, v]) => wc.set(col + cr, F(`SUM(${col}9:${col}${lastC})`, v), totStyle));
    const TOT = (col) => `'COSTOS INTERNOS'!${col}${cr}`;
    wc.set('A' + (cr + 2), 'Amarillo: valores editables (costo manual o parámetros). Rojo: arreglo con precio pero sin costo cargado.', S.note);
    const ilast = Math.max(2, ir - 1);
    wi.set('D' + ir, 'TOTAL INSUMOS (costo por arreglo × # arreglos)', { font: font({ bold: true }) })
      .set('J' + ir, F(`SUMPRODUCT(J2:J${ilast},C2:C${ilast})`, matTotal), totStyle);

    /* =================== PEDIDO FLORES =================== */
    wp.merge('A1:I1').set('A1', `PEDIDO DE FLORES E INSUMOS — Cotización ${q.number}`, S.big).height(1, 24);
    ['INSUMO', 'CATEGORÍA', 'UNIDAD', 'TOTAL', 'COMPRAR', 'PRECIO', 'COSTO', 'UND / PAQ.', 'FLORES / UND.'].forEach((h, i) => wp.set(L(i + 1) + 2, h, S.head));
    wp.height(2, 24);
    const order = C.flowerOrder(q, pct);
    let pr = 3;
    order.forEach((o) => {
      wp.set('A' + pr, o.name).set('B' + pr, CAT[o.cat] || o.cat).set('C' + pr, o.unit)
        .set('D' + pr, F(`SUMIF(INSUMOS!$D:$D,A${pr},INSUMOS!$H:$H)`, o.qty))
        .set('E' + pr, F(o.cat === 'flor' || o.unit === 'PQ' ? `ROUNDUP(D${pr},0)` : `D${pr}`, o.compra), { font: font({ bold: true, color: BRAND }) })
        .set('F' + pr, o.price, S.money).set('G' + pr, F(`D${pr}*F${pr}*(1+IF(B${pr}="${flLabel}",${AJ},0))`, o.costoConAjuste), S.money)
        .set('H' + pr, o.perPack).set('I' + pr, F(`D${pr}*H${pr}`, o.tallos));
      pr++;
    });
    wp.set('A' + pr, 'TOTAL ESTIMADO DE COMPRA', { font: font({ bold: true }) })
      .set('G' + pr, F(`SUM(G3:G${Math.max(3, pr - 1)})`, order.reduce((a, o) => a + o.costoConAjuste, 0)), totStyle);

    /* =================== RESUMEN =================== */
    wr.merge('A1:F1').set('A1', `RESUMEN FINANCIERO — Cotización ${q.number} · ${q.cliente.nombre || ''}`, S.big).height(1, 26);
    wr.set('A2', 'Equivale al encabezado de "IMPLEMENTOS DE DECORACION", con los porcentajes sobre la venta (en el Excel original daban #REF!).', S.note);
    ['CONCEPTO', 'VALOR', '% VENTA'].forEach((h, i) => wr.set(L(i + 1) + 3, h, S.head));
    ['LOGÍSTICA', 'VALOR'].forEach((h, i) => wr.set(L(i + 5) + 3, h, S.head));
    wr.height(3, 22);
    const Lg = q.logistica || {};
    const rates = settings.logistica;
    const lg = fs.logistica;
    [
      ['Personal requerido', n(Lg.personal), 0], ['Valor por persona (staff + ARL + almuerzo + desayuno)', lg.personalUnit, 1],
      ['Viajes transporte contratado', n(Lg.viajesContratados), 0], ['Valor por viaje contratado', n(rates.viajeContratado), 1],
      ['Viajes camioneta propia', n(Lg.viajesPropios), 0], ['Valor por viaje propio', n(rates.viajePropio), 1],
      ['Cajas de flete (flores)', n(Lg.cajasFlete), 0], ['Valor flete por caja', n(rates.fleteCaja), 1], ['Otros gastos', n(Lg.otros), 1],
    ].forEach(([k, v, m], i) => wr.set('E' + (4 + i), k).set('F' + (4 + i), v, m ? S.inputMoney : S.input));
    const tRef = transRef ? `COTIZACION!${transRef}` : '0';
    [
      ['Transporte cotizado', F(tRef, lg.transporte)],
      ['− Retención en transporte', F(`F13*${RET}`, lg.retencionTransporte)],
      ['= Valor de logística', F('F13-F14', lg.valorLogistica)],
      ['Costo de logística', F('F4*F5+F6*F7+F8*F9+F10*F11+F12', lg.costo)],
      ['Imprevistos / margen logística', F('F15-F16', lg.imprevistos)],
    ].forEach(([k, v], i) => {
      const rr = 13 + i; const bold = i === 2 || i === 4;
      wr.set('E' + rr, k, bold ? { font: font({ bold: true }) } : null).set('F' + rr, v, bold ? Object.assign({}, S.money, { font: font({ bold: true }) }) : S.money);
    });
    const rows = [
      ['Venta (subtotal sin IVA)', F(`COTIZACION!${subRef}`, fs.ventas)],
      ['IVA por pagar (no es ingreso)', F(`COTIZACION!${ivaRef}`, fs.iva)],
      ['Costos totales', F(TOT('R'), fs.costos)],
      ['Mano de obra (incluida en costos)', F(TOT('Q'), fs.manoObra)],
      ['Comisiones', F(TOT('O'), fs.comisiones)],
      ['Montaje evento', F(TOT('P'), fs.montaje)],
      ['Retención o ICA (arreglos + transporte)', F(`${TOT('S')}+F14`, fs.retencion)],
      ['Ganancia en arreglos', F(TOT('N'), fs.gananciaArreglos)],
      ['Imprevistos / margen logística', F('F17', lg.imprevistos)],
      ['Comisión planner / agencia', F(`(B4-${tRef})*B16`, fs.comisionPlanner)],
      ['UTILIDAD ESTIMADA', F('B11+B12-B13', fs.utilidadNeta)],
    ];
    rows.forEach(([k, v], i) => {
      const rr = 4 + i;
      const strong = i === 0 || i === rows.length - 1;
      const base = strong ? { font: font({ bold: true, size: 12, color: i ? WHITE : INK }), fill: i ? BRAND : undefined, border: { bottom: 'thin' } } : { border: { bottom: 'thin' } };
      wr.set('A' + rr, k, base).set('B' + rr, v, Object.assign({}, base, { numFmt: MONEY }));
      if (i !== 1) wr.set('C' + rr, F(`IF($B$4=0,0,B${rr}/$B$4)`, fs.ventas ? (v.v || 0) / fs.ventas : 0), Object.assign({}, base, { numFmt: PCT }));
      else wr.style('C' + rr, base);
      if (strong) wr.height(rr, 22);
    });
    wr.set('A16', '% comisión planner / agencia').set('B16', n(pct.comisionPlanner), S.inputPct);
    wr.set('A18', 'Ganancia = Vlr cotizado − Costo − Montaje − Comisión − Retención (hoja COSTOS INTERNOS). Utilidad = Ganancia + margen logística − comisión planner.', S.note);
    return wb;
  }

  // Pedido para el proveedor: solo cantidades, sin precios
  // meta: { cats, title, proveedor, file } (si no viene: todo el pedido)
  function supplierWorkbook(q, settings, meta) {
    meta = meta || { cats: null, title: 'PEDIDO DE FLORES E INSUMOS', proveedor: '', file: `Pedido proveedor - cotizacion ${q.number}` };
    const wb = new window.XW.Workbook();
    const CAT = window.CAT_LABELS || {};
    const e = settings.empresa;
    const rows = C.supplierOrder(q, q.pct, meta.cats);
    const ws = wb.addSheet('PEDIDO', { cols: [5, 36, 24, 13, 10, 14, 12], gridLines: false, tab: BRAND, page: { center: true, footer: `&L&8${e.nombre} · Tel. ${e.telefono}&R&8Página &P de &N` } });
    if (window.LOGO_DATA_URI) ws.image({ dataUrl: window.LOGO_DATA_URI, col: 0, row: 0, dx: 4, dy: 4, w: 110, h: 92 });
    ws.merge('C1:G1').set('C1', meta.title, Object.assign({}, S.title, { font: font({ size: meta.title.length > 30 ? 14 : 18, bold: true }) })).height(1, 28);
    ws.merge('C2:G2').set('C2', `Cotización No. ${q.number}`, S.num).height(2, 20);
    for (let r = 3; r <= 5; r++) ws.height(r, 15);
    const hoy = new Date();
    const iso = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const rich = (label, value) => ({ rich: [{ text: label + '  ', font: { bold: true, size: 8.5, color: BRAND } }, { text: String(value || '—'), font: { bold: true, size: 10 } }] });
    let r = 7;
    if (meta.proveedor) {
      ws.merge(`A${r}:G${r}`).set('A' + r, rich('PARA (PROVEEDOR):', meta.proveedor), Object.assign({}, S.info, { fill: SOFT }));
      ['B', 'C', 'D', 'E', 'F', 'G'].forEach((c) => ws.style(c + r, Object.assign({}, S.info, { fill: SOFT })));
      ws.height(r, 22); r++;
    }
    [
      ['EVENTO:', [(q.evento.tipo || '').toUpperCase(), q.evento.recepcion || q.evento.ceremonia].filter(Boolean).join(' · '), 'FECHA DEL EVENTO:', fechaLarga(q.evento.fecha).toUpperCase() || 'POR DEFINIR'],
      ['PEDIDO POR:', `${e.gerente} · ${e.nombre}`, 'FECHA DEL PEDIDO:', fechaLarga(iso).toUpperCase()],
      ['TELÉFONO:', e.telefono, 'CORREO:', e.email],
    ].forEach((row) => {
      ws.merge(`A${r}:C${r}`).set('A' + r, rich(row[0], row[1]), S.info).style('B' + r, S.info).style('C' + r, S.info);
      ws.merge(`D${r}:G${r}`).set('D' + r, rich(row[2], row[3]), S.info);
      ['E', 'F', 'G'].forEach((c) => ws.style(c + r, S.info));
      ws.height(r, 20); r++;
    });
    r++;
    ['#', 'INSUMO', 'CATEGORÍA', 'CANTIDAD', 'UNIDAD', 'TALLOS / UNID.', 'RECIBIDO'].forEach((h, i) => ws.set(L(i + 1) + r, h, S.head));
    ws.height(r, 24); r++;
    const qtyStyle = { font: font({ bold: true, size: 12, color: BRAND }), numFmt: 'General', align: { h: 'center', v: 'center' }, border: { bottom: 'thin', color: 'FFF0E8EA' } };
    const cell = { font: font(), align: { v: 'center' }, border: { bottom: 'thin', color: 'FFF0E8EA' } };
    const center = Object.assign({}, cell, { align: { h: 'center', v: 'center' } });
    const box = { border: { left: 'thin', right: 'thin', top: 'thin', bottom: 'thin', color: 'FFB9AAB0' } };
    let lastCat = '', k = 0;
    rows.forEach((x) => {
      if (x.cat !== lastCat) {
        ws.merge(`A${r}:G${r}`).set('A' + r, (CAT[x.cat] || x.cat).toUpperCase(), S.sec).height(r, 20);
        ['B', 'C', 'D', 'E', 'F', 'G'].forEach((c) => ws.style(c + r, S.sec));
        r++; lastCat = x.cat;
      }
      k++;
      ws.set('A' + r, k, center).set('B' + r, x.name, Object.assign({}, cell, { font: font({ bold: true }) })).set('C' + r, CAT[x.cat] || x.cat, Object.assign({}, cell, { font: font({ color: MUTED }) }))
        .set('D' + r, x.cantidad, qtyStyle).set('E' + r, x.unit, center).set('F' + r, x.unidades == null ? '—' : x.unidades, Object.assign({}, center, { numFmt: '#,##0' }))
        .style('G' + r, box);
      ws.height(r, 20); r++;
    });
    r++;
    ws.merge(`A${r}:G${r}`).set('A' + r, `${rows.length} insumo(s). Las flores están redondeadas al paquete completo. Por favor confirmar disponibilidad, precio y fecha de entrega.`, S.note);
    r += 2;
    ws.merge(`A${r}:C${r}`).set('A' + r, 'Recibido por: ______________________________', { font: font() });
    ws.merge(`D${r}:G${r}`).set('D' + r, 'Fecha de entrega: ____________________', { font: font() });
    wb.printArea(ws, `$A$1:$G$${r}`);
    return wb;
  }

  // Resumen contable de varias cotizaciones
  function accountingWorkbook(rows, title) {
    const wb = new window.XW.Workbook();
    const ncol = rows[0].length;
    const ws = wb.addSheet('CONTABILIDAD', { cols: rows[0].map((h, i) => (i === 1 ? 34 : i === 0 ? 8 : 15)), freeze: 2, tab: BRAND, page: { landscape: true } });
    ws.merge(`A1:${L(ncol)}1`).set('A1', title, S.big).height(1, 26);
    rows[0].forEach((h, i) => ws.set(L(i + 1) + 2, h, S.head));
    ws.height(2, 30);
    const body = rows.slice(1, -1);
    const totals = rows[rows.length - 1];
    const vCol = L(6), uCol = L(ncol - 1), mCol = L(ncol);
    body.forEach((row, k) => {
      const rr = 3 + k;
      row.forEach((v, i) => {
        if (i === ncol - 1) ws.set(mCol + rr, F(`IF(${vCol}${rr}=0,0,${uCol}${rr}/${vCol}${rr})`, (v || 0) / 100), { numFmt: PCT });
        else {
          const iso = typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
          ws.set(L(i + 1) + rr, iso ? v.split('-').reverse().join('/') : v == null ? '' : v, i >= 5 ? S.money : null);
        }
      });
    });
    const last = 2 + body.length, tr = last + 1;
    const ts = Object.assign({}, S.money, { font: font({ bold: true }), fill: 'FFF5EEF0' });
    ws.set('A' + tr, 'TOTAL', { font: font({ bold: true }), fill: 'FFF5EEF0' });
    for (let i = 5; i < ncol - 1; i++) ws.set(L(i + 1) + tr, F(`SUM(${L(i + 1)}3:${L(i + 1)}${Math.max(3, last)})`, totals[i]), ts);
    ws.set(mCol + tr, F(`IF(${vCol}${tr}=0,0,${uCol}${tr}/${vCol}${tr})`, (totals[ncol - 1] || 0) / 100), Object.assign({}, ts, { numFmt: PCT }));
    return wb;
  }

  function save(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return blob;
  }

  window.ExcelExport = {
    async quote(q, settings) {
      const blob = await (await quoteWorkbook(q, settings)).toBlob();
      return save(blob, `Cotizacion ${q.number} - ${String(q.cliente.nombre || 'Alheli').replace(/[\\/:*?"<>|]+/g, '').trim()}.xlsx`);
    },
    async quoteBlob(q, settings) { return (await quoteWorkbook(q, settings)).toBlob(); },
    async supplier(q, settings, meta) {
      const blob = await supplierWorkbook(q, settings, meta).toBlob();
      return save(blob, (meta && meta.file ? meta.file : `Pedido proveedor - cotizacion ${q.number}`) + '.xlsx');
    },
    async supplierBlob(q, settings, meta) { return supplierWorkbook(q, settings, meta).toBlob(); },
    async accounting(rows, title, filename) { return save(await accountingWorkbook(rows, title).toBlob(), filename); },
  };
})();
