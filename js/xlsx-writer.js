/*
 * GENERADOR DE ARCHIVOS EXCEL (.xlsx) SIN LIBRERÍAS EXTERNAS
 * Crea libros con varias hojas, estilos, fórmulas (con su resultado), celdas
 * combinadas, anchos/altos, paneles inmovilizados, configuración de impresión
 * e imágenes (fotos/logo). Funciona sin internet.
 *
 * Uso:
 *   const wb = new XW.Workbook();
 *   const ws = wb.addSheet('HOJA', { cols: [10, 40], gridLines: false, freeze: 3 });
 *   ws.set('A1', 'Texto', { font: { bold: true } });
 *   ws.set('B2', { f: 'A2*2', v: 10 }, { numFmt: '"$" #,##0' });
 *   ws.merge('A1:B1'); ws.height(1, 28);
 *   ws.image({ dataUrl, col: 0, row: 0, dx: 4, dy: 4, w: 120, h: 90 });
 *   const blob = await wb.toBlob();
 */
(function () {
  const enc = new TextEncoder();
  const xesc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

  /* ---------- utilidades de celdas ---------- */
  function colLetter(n) { // 1 -> A
    let s = '';
    while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
    return s;
  }
  function parseRef(ref) {
    const m = /^([A-Z]+)(\d+)$/.exec(ref);
    let c = 0;
    for (const ch of m[1]) c = c * 26 + (ch.charCodeAt(0) - 64);
    return { c, r: +m[2] };
  }

  /* ---------- ZIP (sin compresión) ---------- */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(buf) { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(files) { // [{name, data:Uint8Array}]
    const d = new Date();
    const time = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF;
    const date = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
    const parts = []; const central = []; let offset = 0;
    for (const f of files) {
      const name = enc.encode(f.name); const crc = crc32(f.data); const size = f.data.length;
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, time, true); h.setUint16(12, date, true); h.setUint32(14, crc, true); h.setUint32(18, size, true); h.setUint32(22, size, true);
      h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), name, f.data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, time, true); c.setUint16(14, date, true); c.setUint32(16, crc, true); c.setUint32(20, size, true); c.setUint32(24, size, true);
      c.setUint16(28, name.length, true); c.setUint32(42, offset, true);
      central.push(new Uint8Array(c.buffer), name);
      offset += 30 + name.length + size;
    }
    const cdSize = central.reduce((a, p) => a + p.length, 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
    e.setUint32(12, cdSize, true); e.setUint32(16, offset, true);
    return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  function b64bytes(dataUrl) {
    const b = atob(String(dataUrl).split(',')[1] || '');
    const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    return u;
  }

  /* ---------- estilos ---------- */
  class Styles {
    constructor() {
      this.fonts = ['<font><sz val="10"/><color rgb="FF2A2326"/><name val="Calibri"/><family val="2"/></font>'];
      this.fills = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>'];
      this.borders = ['<border><left/><right/><top/><bottom/><diagonal/></border>'];
      this.numFmts = [];
      this.xfs = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'];
      this.cache = new Map();
    }
    idx(list, xml) { let i = list.indexOf(xml); if (i < 0) { list.push(xml); i = list.length - 1; } return i; }
    fmtId(code) {
      const builtin = { General: 0, '0': 1, '0.00': 2, '#,##0': 3, '0%': 9, '0.00%': 10 };
      if (code in builtin) return builtin[code];
      let f = this.numFmts.find((x) => x.code === code);
      if (!f) { f = { id: 164 + this.numFmts.length, code }; this.numFmts.push(f); }
      return f.id;
    }
    get(st) {
      if (!st) return 0;
      const key = JSON.stringify(st);
      if (this.cache.has(key)) return this.cache.get(key);
      const f = st.font || {};
      const fontXml = `<font>${f.bold ? '<b/>' : ''}${f.italic ? '<i/>' : ''}<sz val="${f.size || 10}"/><color rgb="${f.color || 'FF2A2326'}"/><name val="${xesc(f.name || 'Calibri')}"/><family val="2"/></font>`;
      const fontId = this.idx(this.fonts, fontXml);
      const fillId = st.fill ? this.idx(this.fills, `<fill><patternFill patternType="solid"><fgColor rgb="${st.fill}"/><bgColor indexed="64"/></patternFill></fill>`) : 0;
      let borderId = 0;
      if (st.border) {
        const side = (k) => (st.border[k] ? `<${k} style="${st.border[k]}"><color rgb="${st.border.color || 'FFE4D8DB'}"/></${k}>` : `<${k}/>`);
        borderId = this.idx(this.borders, `<border>${side('left')}${side('right')}${side('top')}${side('bottom')}<diagonal/></border>`);
      }
      const numFmtId = st.numFmt ? this.fmtId(st.numFmt) : 0;
      const a = st.align || {};
      const align = (a.h || a.v || a.wrap) ? `<alignment${a.h ? ` horizontal="${a.h}"` : ''}${a.v ? ` vertical="${a.v}"` : ''}${a.wrap ? ' wrapText="1"' : ''}/>` : '';
      const xf = `<xf numFmtId="${numFmtId}" fontId="${fontId}" fillId="${fillId}" borderId="${borderId}" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"${align ? ' applyAlignment="1">' + align + '</xf>' : '/>'}`;
      const id = this.idx(this.xfs, xf);
      this.cache.set(key, id);
      return id;
    }
    xml() {
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
${this.numFmts.length ? `<numFmts count="${this.numFmts.length}">${this.numFmts.map((f) => `<numFmt numFmtId="${f.id}" formatCode="${xesc(f.code)}"/>`).join('')}</numFmts>` : ''}
<fonts count="${this.fonts.length}">${this.fonts.join('')}</fonts>
<fills count="${this.fills.length}">${this.fills.join('')}</fills>
<borders count="${this.borders.length}">${this.borders.join('')}</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="${this.xfs.length}">${this.xfs.join('')}</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
    }
  }

  /* ---------- hoja ---------- */
  class Sheet {
    constructor(wb, name, opt = {}) {
      this.wb = wb; this.name = name; this.opt = opt;
      this.rows = new Map(); this.heights = new Map(); this.merges = []; this.images = [];
    }
    set(ref, value, style) {
      const { c, r } = parseRef(ref);
      if (!this.rows.has(r)) this.rows.set(r, new Map());
      this.rows.get(r).set(c, { value, s: this.wb.styles.get(style) });
      return this;
    }
    style(ref, style) { // aplica estilo a una celda vacía (para fondos/bordes)
      const { c, r } = parseRef(ref);
      const row = this.rows.get(r);
      if (row && row.has(c)) row.get(c).s = this.wb.styles.get(style);
      else this.set(ref, null, style);
      return this;
    }
    merge(range) { this.merges.push(range); return this; }
    height(r, pt) { this.heights.set(r, pt); return this; }
    image(o) { this.images.push(o); return this; }
    cellXml(ref, { value, s }) {
      const sa = s ? ` s="${s}"` : '';
      if (value == null || value === '') return `<c r="${ref}"${sa}/>`;
      if (typeof value === 'number') return Number.isFinite(value) ? `<c r="${ref}"${sa}><v>${value}</v></c>` : `<c r="${ref}"${sa}/>`;
      if (typeof value === 'object' && value.f != null) {
        const v = value.v;
        if (typeof v === 'string') return `<c r="${ref}"${sa} t="str"><f>${xesc(value.f)}</f><v>${xesc(v)}</v></c>`;
        return `<c r="${ref}"${sa}><f>${xesc(value.f)}</f>${Number.isFinite(v) ? `<v>${v}</v>` : ''}</c>`;
      }
      if (typeof value === 'object' && value.rich) {
        return `<c r="${ref}"${sa} t="inlineStr"><is>${value.rich.map((p) => {
          const f = p.font || {};
          return `<r><rPr>${f.bold ? '<b/>' : ''}${f.italic ? '<i/>' : ''}<sz val="${f.size || 10}"/><color rgb="${f.color || 'FF2A2326'}"/><rFont val="Calibri"/><family val="2"/></rPr><t xml:space="preserve">${xesc(p.text)}</t></r>`;
        }).join('')}</is></c>`;
      }
      return `<c r="${ref}"${sa} t="inlineStr"><is><t xml:space="preserve">${xesc(value)}</t></is></c>`;
    }
    xml(index) {
      const o = this.opt;
      const rowsNums = [...new Set([...this.rows.keys(), ...this.heights.keys()])].sort((a, b) => a - b);
      const data = rowsNums.map((r) => {
        const cells = this.rows.get(r) || new Map();
        const ht = this.heights.get(r);
        const cs = [...cells.keys()].sort((a, b) => a - b).map((c) => this.cellXml(colLetter(c) + r, cells.get(c))).join('');
        return `<row r="${r}"${ht ? ` ht="${ht}" customHeight="1"` : ''}>${cs}</row>`;
      }).join('');
      const pane = o.freeze ? `<pane ySplit="${o.freeze}" topLeftCell="A${o.freeze + 1}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A${o.freeze + 1}" sqref="A${o.freeze + 1}"/>` : '';
      const cols = (o.cols || []).map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('');
      const ps = o.page || {};
      const m = ps.margins || { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 };
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetPr>${o.tab ? `<tabColor rgb="${o.tab}"/>` : ''}<pageSetUpPr fitToPage="1"/></sheetPr>
<sheetViews><sheetView workbookViewId="0"${index === 0 ? ' tabSelected="1"' : ''}${o.gridLines === false ? ' showGridLines="0"' : ''}${o.zoom ? ` zoomScale="${o.zoom}"` : ''}>${pane}</sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="15"/>
${cols ? `<cols>${cols}</cols>` : ''}
<sheetData>${data}</sheetData>
${this.merges.length ? `<mergeCells count="${this.merges.length}">${this.merges.map((x) => `<mergeCell ref="${x}"/>`).join('')}</mergeCells>` : ''}
${ps.center ? '<printOptions horizontalCentered="1"/>' : ''}
<pageMargins left="${m.left}" right="${m.right}" top="${m.top}" bottom="${m.bottom}" header="${m.header}" footer="${m.footer}"/>
<pageSetup paperSize="1" orientation="${ps.landscape ? 'landscape' : 'portrait'}" fitToWidth="1" fitToHeight="0"/>
${ps.footer ? `<headerFooter><oddFooter>${xesc(ps.footer)}</oddFooter></headerFooter>` : ''}
${this.images.length ? '<drawing r:id="rId1"/>' : ''}
</worksheet>`;
    }
  }

  /* ---------- libro ---------- */
  class Workbook {
    constructor() { this.sheets = []; this.styles = new Styles(); this.printAreas = []; }
    addSheet(name, opt) { const s = new Sheet(this, name, opt); this.sheets.push(s); return s; }
    printArea(sheet, range) { this.printAreas.push({ i: this.sheets.indexOf(sheet), name: sheet.name, range }); }
    async toBlob() {
      const files = [];
      const add = (name, text) => files.push({ name, data: enc.encode(text) });
      const media = [];
      let drawN = 0;
      const sheetRels = [];
      this.sheets.forEach((s, i) => {
        if (!s.images.length) { sheetRels.push(null); return; }
        drawN++;
        const rels = [];
        const anchors = s.images.map((im, k) => {
          const ext = /^data:image\/png/.test(im.dataUrl) ? 'png' : 'jpeg';
          media.push({ name: `image${media.length + 1}.${ext}`, data: b64bytes(im.dataUrl) });
          rels.push(`<Relationship Id="rId${k + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${media[media.length - 1].name}"/>`);
          const E = 9525, cx = Math.round(im.w * E), cy = Math.round(im.h * E);
          return `<xdr:oneCellAnchor><xdr:from><xdr:col>${im.col}</xdr:col><xdr:colOff>${Math.round((im.dx || 0) * E)}</xdr:colOff><xdr:row>${im.row}</xdr:row><xdr:rowOff>${Math.round((im.dy || 0) * E)}</xdr:rowOff></xdr:from><xdr:ext cx="${cx}" cy="${cy}"/>
<xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${k + 2}" name="Foto ${k + 1}"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId${k + 1}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>`;
        }).join('');
        add(`xl/drawings/drawing${drawN}.xml`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${anchors}</xdr:wsDr>`);
        add(`xl/drawings/_rels/drawing${drawN}.xml.rels`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.join('')}</Relationships>`);
        sheetRels.push(drawN);
      });
      this.sheets.forEach((s, i) => {
        add(`xl/worksheets/sheet${i + 1}.xml`, s.xml(i));
        if (sheetRels[i]) add(`xl/worksheets/_rels/sheet${i + 1}.xml.rels`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${sheetRels[i]}.xml"/></Relationships>`);
      });
      media.forEach((m) => files.push({ name: 'xl/media/' + m.name, data: m.data }));
      const names = this.printAreas.map((p) => `<definedName name="_xlnm.Print_Area" localSheetId="${p.i}">'${xesc(p.name)}'!${p.range}</definedName>`).join('');
      add('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<bookViews><workbookView activeTab="0"/></bookViews>
<sheets>${this.sheets.map((s, i) => `<sheet name="${xesc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets>
${names ? `<definedNames>${names}</definedNames>` : ''}
<calcPr calcId="191029" fullCalcOnLoad="1"/>
</workbook>`);
      add('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${this.sheets.map((s, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${this.sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
      add('xl/styles.xml', this.styles.xml());
      add('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
      add('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Default Extension="jpeg" ContentType="image/jpeg"/>
<Default Extension="png" ContentType="image/png"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${this.sheets.map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}
${Array.from({ length: drawN }, (_, i) => `<Override PartName="/xl/drawings/drawing${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`).join('')}
</Types>`);
      // [Content_Types].xml primero
      files.unshift(files.pop());
      return zip(files);
    }
  }

  window.XW = { Workbook, colLetter, parseRef };
})();
