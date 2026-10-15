/*
 * MOTOR DE CÁLCULO
 * Reproduce las fórmulas de los Excel de cotización (hojas COTIZACION,
 * IMPLEMENTOS DE DECORACION, PEDIDO FLORES) y del listado de precios
 * (SIMULADOR DE ARREGLOS), corrigiendo las referencias rotas (#REF!).
 * Son funciones puras: reciben datos y devuelven números. No tocan la pantalla.
 */
(function () {
  const n = (v) => {
    const x = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : v;
    return Number.isFinite(x) ? x : 0;
  };
  const sum = (arr, f) => arr.reduce((a, x) => a + n(f(x)), 0);

  /* ---------- 1. COTIZACIÓN PARA EL CLIENTE ---------- */

  // Vlr. Total = Vlr. Unit × Cant  (G14 = F14*B14). Cortesías valen 0.
  function lineTotal(item) {
    if (item.courtesy) return 0;
    return n(item.qty) * n(item.unitPrice);
  }

  // Totales de la cotización:
  //   TOTAL CEREMONIA / TOTAL RECEPCION / ... = SUM de cada sección
  //   TRANSPORTE, MONTAJE Y DESMONTAJE = cant × valor
  //   SUBTOTAL = secciones + transporte
  //   IVA = subtotal × %IVA  (en los Excel es 0)
  //   TOTAL = subtotal + IVA
  //   Depósito reembolsable: aparte (no es ingreso), se suma en "total a consignar".
  function quoteTotals(q) {
    const p = q.pct || {};
    const sections = (q.sections || []).map((s) => ({
      id: s.id,
      title: s.title,
      total: sum(s.items || [], lineTotal),
    }));
    const transporte = n(q.transport && q.transport.qty) * n(q.transport && q.transport.unitPrice);
    const totalSecciones = sum(sections, (s) => s.total);
    const subtotal = totalSecciones + transporte;
    const iva = subtotal * n(p.iva);
    const total = subtotal + iva;
    const deposito = n(q.deposito);
    return {
      sections,
      totalSecciones,
      transporte,
      subtotal,
      iva,
      total,
      deposito,
      totalConDeposito: total + deposito,
      anticipo: total * n(p.anticipo),
      saldo: total - total * n(p.anticipo),
    };
  }

  /* ---------- 2. COSTEO INTERNO POR ARREGLO ---------- */

  // Costo de materiales de UNA unidad del arreglo.
  // Flores: precio por paquete × cantidad de paquetes, + AJUSTE FLORES (15%).
  function materialsCost(cost, ajusteFlores) {
    const ins = (cost && cost.insumos) || [];
    let flores = 0, otros = 0, alquilados = 0;
    ins.forEach((i) => {
      const v = n(i.qty) * n(i.price);
      if (i.cat === 'flor') flores += v;
      else if (i.cat === 'alquilado') alquilados += v;
      else otros += v;
    });
    const ajuste = flores * n(ajusteFlores);
    return { flores, ajuste, otros, alquilados, total: flores + ajuste + otros + alquilados };
  }

  // COSTO UNITARIO (col. I): materiales + mano de obra (como en el simulador:
  // "COSTO DE REALIZACION" = mano de obra + oasis + implementos + alquilados + flores).
  // En modo "manual" se digita directamente, igual que en el Excel.
  function unitCost(cost, ajusteFlores) {
    if (!cost) return 0;
    if (cost.mode === 'manual') return n(cost.manualUnitCost);
    return materialsCost(cost, ajusteFlores).total + n(cost.labor);
  }

  // Fila de la tabla "Implementos" (columnas A..V del Excel):
  //   M montaje unit.   = J × L
  //   O comisión unit.  = J × K
  //   P retención unit. = J × %retención
  //   N ganancia unit.  = J − I − M − O − P
  //   Q,R,S,T,U,V       = cantidad × (N, O, M, H, I, P)
  // J (VALOR COTIZADO) = valor unitario real cotizado al cliente (0 si es cortesía).
  function lineFinance(item, pct) {
    const c = item.cost || {};
    const A = n(item.qty);
    const J = item.courtesy ? 0 : n(item.unitPrice);
    const I = unitCost(c, pct.ajusteFlores);
    const H = n(c.labor); // informativo: ya está incluido en I
    const K = c.commissionPct != null && c.commissionPct !== '' ? n(c.commissionPct) : n(pct.comision);
    const L = c.montajePct != null && c.montajePct !== '' ? n(c.montajePct) : n(pct.montaje);
    const M = J * L;
    const O = J * K;
    const P = J * n(pct.retencion);
    const N = J - I - M - O - P;
    return {
      qty: A, valorCotizado: J, costoUnit: I, manoObraUnit: H,
      montajeUnit: M, comisionUnit: O, retencionUnit: P, gananciaUnit: N,
      gananciaTotal: A * N, comisionTotal: A * O, montajeTotal: A * M,
      manoObraTotal: A * H, costoTotal: A * I, retencionTotal: A * P,
      ventaTotal: A * J,
      margen: J ? N / J : 0,
      sinCosteo: !I && !!J,
    };
  }

  /* ---------- 3. LOGÍSTICA (bloque LOGISTICA de IMPLEMENTOS) ---------- */
  //   VALOR DE RETENCION EN TRANSPORTE = transporte × %retención   (D16)
  //   VALOR DE LOGISTICA = transporte − retención transporte      (D18)
  //   COSTO = personal × (staff+ARL+almuerzo+desayuno) + viajes contratados
  //           + viajes propios + flete × cajas + otros
  //   IMPREVISTOS (lo que queda) = valor logística − costo        (D17)
  function logistics(q, rates) {
    const L = q.logistica || {};
    const p = q.pct || {};
    const transporte = n(q.transport && q.transport.qty) * n(q.transport && q.transport.unitPrice);
    const retencionTransporte = transporte * n(p.retencion);
    const valorLogistica = transporte - retencionTransporte;
    const personalUnit = n(rates.staff) + n(rates.arl) + n(rates.almuerzo) + n(rates.desayuno);
    const costoPersonal = n(L.personal) * personalUnit;
    const costoViajesContratados = n(L.viajesContratados) * n(rates.viajeContratado);
    const costoViajesPropios = n(L.viajesPropios) * n(rates.viajePropio);
    const costoFlete = n(L.cajasFlete) * n(rates.fleteCaja);
    const otros = n(L.otros);
    const costo = costoPersonal + costoViajesContratados + costoViajesPropios + costoFlete + otros;
    return {
      transporte, retencionTransporte, valorLogistica, personalUnit,
      costoPersonal, costoViajesContratados, costoViajesPropios, costoFlete, otros,
      costo, imprevistos: valorLogistica - costo,
    };
  }

  /* ---------- 4. RESUMEN FINANCIERO (encabezado de IMPLEMENTOS) ---------- */
  function financeSummary(q, rates) {
    const pct = q.pct || {};
    const t = quoteTotals(q);
    const lines = [];
    (q.sections || []).forEach((s) => (s.items || []).forEach((it) => {
      lines.push({ section: s.title, item: it, f: lineFinance(it, pct) });
    }));
    const tot = (k) => sum(lines, (l) => l.f[k]);
    const log = logistics(q, rates);
    const gananciaArreglos = tot('gananciaTotal');
    const comisiones = tot('comisionTotal');
    const montaje = tot('montajeTotal');
    const manoObra = tot('manoObraTotal');
    const costos = tot('costoTotal');
    const retencionArreglos = tot('retencionTotal');
    const retencion = retencionArreglos + log.retencionTransporte; // D8
    // Comisión planner/agencia (cotización 2347: (TOTAL − transporte) × 10%)
    const comisionPlanner = (t.subtotal - t.transporte) * n(pct.comisionPlanner);
    const utilidadNeta = gananciaArreglos + log.imprevistos - comisionPlanner;
    const base = t.subtotal || 1;
    const share = (v) => (t.subtotal ? v / base : 0);
    return {
      totals: t, lines, logistica: log,
      ventas: t.subtotal,
      costos, manoObra, comisiones, montaje,
      retencionArreglos, retencion, gananciaArreglos, comisionPlanner, utilidadNeta,
      iva: t.iva,
      pctCostos: share(costos), pctComisiones: share(comisiones), pctMontaje: share(montaje),
      pctRetencion: share(retencion), pctGanancia: share(gananciaArreglos),
      pctLogistica: share(log.valorLogistica), pctUtilidad: share(utilidadNeta),
      lineasSinCosteo: lines.filter((l) => l.f.sinCosteo).length,
    };
  }

  /* ---------- 5. PEDIDO DE FLORES (tabla dinámica PEDIDO FLORES) ---------- */
  // TOTAL = CANTIDAD UNIT × # ARREGLOS (F = D × A), agrupado por insumo.
  // FLORES UN = total paquetes × unidades por paquete (Y = D × X).
  function flowerOrder(q, pct) {
    const map = new Map();
    (q.sections || []).forEach((s) => (s.items || []).forEach((it) => {
      const c = it.cost;
      if (!c || c.mode === 'manual') return;
      (c.insumos || []).forEach((i) => {
        if (!i.name) return;
        const key = (i.catId || '') + '|' + i.name.trim().toUpperCase();
        const cur = map.get(key) || {
          name: i.name.trim(), cat: i.cat || 'otro', unit: i.unit || '', perPack: n(i.perPack) || 1,
          price: n(i.price), qty: 0, usos: [],
        };
        const q2 = n(i.qty) * n(it.qty);
        cur.qty += q2;
        cur.usos.push((it.desc || '').slice(0, 40) + ' (' + fmtQty(q2) + ')');
        map.set(key, cur);
      });
    }));
    const rows = [...map.values()].map((r) => {
      const costo = r.qty * r.price;
      const ajuste = r.cat === 'flor' ? costo * n(pct.ajusteFlores) : 0;
      return Object.assign(r, {
        compra: r.cat === 'flor' || r.unit === 'PQ' ? Math.ceil(r.qty - 1e-9) : r.qty,
        tallos: r.qty * r.perPack,
        costo, ajuste, costoConAjuste: costo + ajuste,
      });
    });
    const order = { flor: 0, oasis: 1, implemento: 2, alquilado: 2, manoobra: 4, otro: 5 }; // alquilados van dentro de Implementos
    rows.sort((a, b) => (order[a.cat] ?? 9) - (order[b.cat] ?? 9) || a.name.localeCompare(b.name, 'es'));
    return rows;
  }

  // Pedido para el proveedor: solo cantidades (sin precios). Las flores y lo que
  // se compra por paquete se redondea hacia arriba; "unidades" = paquetes × tallos por paquete.
  // cats (opcional): lista de categorías a incluir, ej. ['flor'] para el proveedor de flores
  // Los implementos alquilados se agrupan con los demás implementos (rented = true los marca).
  function supplierOrder(q, pct, cats) {
    const grp = (c) => (c === 'alquilado' ? 'implemento' : c);
    return flowerOrder(q, pct || q.pct || {})
      .filter((r) => r.cat !== 'manoobra' && r.qty > 0 && (!cats || cats.includes(grp(r.cat))))
      .map((r) => ({
        name: r.name, cat: grp(r.cat), rented: r.cat === 'alquilado', unit: r.unit || 'UN',
        cantidad: r.compra,
        unidades: r.perPack > 1 ? r.compra * r.perPack : null,
        exacto: r.qty,
      }));
  }

  /* ---------- 6. SIMULADOR DE PRECIO DE VENTA (hoja ARREGLOS) ---------- */
  //   COSTO DE REALIZACION (C) = mano de obra + oasis + implementos + alquilados + flores
  //   GANANCIA EN COSTOS       = (C − alquilados) × %ganancia
  //   BASE                     = C + ganancia + alquilados
  //   FLETE / COMISION / MONTAJE = BASE × %
  //   PRECIO SIN RETENCION     = BASE + flete + comisión + montaje
  //   RETENCION O ICA          = precio sin retención × %retención
  //   PRECIO DE VENTA UNITARIO = precio sin retención + retención
  //   GANANCIA UNITARIA        = precio − comisión − retención − flete − C
  function simulate(costoRealizacion, alquilados, s) {
    const C = n(costoRealizacion), alq = n(alquilados);
    const ganancia = (C - alq) * n(s.ganancia);
    const base = C + ganancia + alq;
    const flete = base * n(s.flete);
    const comision = base * n(s.comision);
    const montaje = base * n(s.montaje);
    const precioSinRetencion = base + flete + comision + montaje;
    const retencion = precioSinRetencion * n(s.retencion);
    const precio = precioSinRetencion + retencion;
    const gananciaUnitaria = precio - comision - retencion - flete - C;
    return {
      costo: C, ganancia, base, flete, comision, montaje, precioSinRetencion, retencion, precio,
      gananciaUnitaria, factor: C ? precio / C : 0,
      // Precio redondeado a miles hacia arriba, como se cotiza
      precioRedondeado: Math.ceil(precio / 1000) * 1000,
    };
  }

  // Costo de una plantilla de arreglo + desglose por categoría
  function recipeCost(recipe, ajusteFlores) {
    const m = materialsCost({ insumos: recipe.insumos || [] }, ajusteFlores);
    return Object.assign(m, { labor: n(recipe.labor), costo: m.total + n(recipe.labor) });
  }

  /* ---------- utilidades de formato ---------- */
  const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  function money(v) { return COP.format(Math.round(n(v))).replace(/\s/g, ' '); }
  function pctFmt(v, d = 1) { return (n(v) * 100).toFixed(d).replace('.', ',') + '%'; }
  function fmtQty(v) {
    const x = Math.round(n(v) * 100) / 100;
    return String(x).replace('.', ',');
  }

  window.Calc = {
    n, lineTotal, quoteTotals, materialsCost, unitCost, lineFinance, logistics,
    financeSummary, flowerOrder, supplierOrder, simulate, recipeCost, money, pctFmt, fmtQty,
  };
})();
