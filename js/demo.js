/*
 * Cotización de ejemplo basada en la COTIZACIÓN 2428 (cliente anonimizado).
 * Los valores al cliente son idénticos al Excel (total 17.767.000).
 * Los costos internos vienen de la hoja IMPLEMENTOS DE DECORACION; donde el
 * Excel no tenía costo, se dejó sin costear (la app lo marca con ⚠).
 */
window.buildDemoQuote = function (settings, catalog) {
  const S = window.Store;
  const q = S.newQuote(settings);
  const find = (name) => catalog.find((c) => c.name.toLowerCase() === name.toLowerCase());
  const ins = (name, qty) => {
    const c = find(name) || { id: '', name, cat: 'otro', unit: 'UN', perPack: 1, price: 0 };
    return { catId: c.id, name: c.name, cat: c.cat, unit: c.unit, perPack: c.perPack, price: c.price, qty };
  };
  const item = (qty, desc, unitPrice, cost, courtesy) => {
    const it = S.newItem();
    Object.assign(it, { qty, desc, unitPrice, courtesy: !!courtesy });
    if (cost && cost.manual != null) Object.assign(it.cost, { mode: 'manual', manualUnitCost: cost.manual, labor: cost.labor || 0 });
    else if (cost && cost.insumos) Object.assign(it.cost, { mode: 'insumos', insumos: cost.insumos, labor: cost.labor || 0 });
    return it;
  };
  const copas = { insumos: [ins('Cristaleria', 3), ins('Vela # 4', 3)] };

  Object.assign(q, {
    number: 2428,
    fechaElaboracion: '2024-05-31',
    fechaVencimiento: '2024-06-16',
    cliente: { nombre: 'ANA SOFÍA MEJÍA (EJEMPLO)', correo: 'ana.mejia@ejemplo.com', celular: '' },
    evento: { tipo: 'Boda', ceremonia: 'HOTEL HILTON - PLAYA', recepcion: 'HOTEL HILTON - REST. TINAJERO', fecha: '2024-11-30', hora: 'POR DEFINIR', pax: 50 },
    transport: { desc: 'TRANSPORTE, MONTAJE Y DESMONTAJE', qty: 1, unitPrice: 1500000 },
    logistica: { personal: 4, viajesContratados: 2, viajesPropios: 1, cajasFlete: 3, otros: 0 },
  });
  q.sections = [
    { id: S.uid(), title: 'CEREMONIA', items: [
      item(1, 'ARO DECORADO CON FLORES SURTIDAS EN TONOS SOLICITADOS', 1800000, { manual: 759200, labor: 60000 }),
      item(6, 'MINI BOUQUETS ATADOS A LAS BANCAS INTERCALADOS, CON FOLLAJE SURTIDO Y TOQUES DE FLORES', 98000, { manual: 42500, labor: 7500 }),
      item(1, 'BOUQUET DE NOVIA TIPO CAROLINA HERRERA CON ROSAS, MINI ROSAS Y FLORES SURTIDAS EN LOS TONOS MANEJADOS', 220000, { manual: 77267, labor: 15000 }),
      item(1, 'BOUTONNIERE NOVIO', 0, { insumos: [ins('Minirosas', 0.1)] }, true),
      item(3, 'BOUTONNIERES ADICIONALES', 18000, { insumos: [ins('Minirosas', 0.1)] }),
      item(1, 'BOUQUET DE DAMA SENCILLO EN LOS TONOS MANEJADOS', 95000),
      item(1, 'CORONITA EN GHIPSOFILIA PARA DAMITA', 45000),
      item(1, 'CANASTICA PARA DAMITA CON FLORES', 0, null, true),
    ] },
    { id: S.uid(), title: 'RECEPCIÓN', items: [
      item(2, 'DECORACION DE MESA IMPERIAL CON ARREGLO TIPO SEMBRADO, CON FOLLAJE SURTIDO Y TOQUES DE FLORES EN LOS TONOS SOLICITADOS (2 MESAS)', 540000, { manual: 223700, labor: 15000 }),
      item(2, 'COMPLEMENTO CENTRO DE MESA DE NOVIOS CON 3 COPAS CON VELAS', 30000, copas),
      item(5, 'CENTRO DE MESA REDONDO BAJO SOBRE LAMINA CON FOLLAJE Y FLORES SURTIDAS EN LOS TONOS SOLICITADOS', 290000, { manual: 115800, labor: 15000 }),
      item(5, 'COMPLEMENTOS PARA CENTRO DE MESA REDONDA CON JUEGO DE 3 COPAS CON VELAS', 30000, copas),
      item(1, 'ARCO TIPO CENEFA PARA ENTRADA AL SALON EN LOS TONOS MANEJADOS', 1300000, { manual: 432200, labor: 25000 }),
      item(3, 'DECORACION DE CENEFAS DE VENTANAS CON FLORES SURTIDAS EN LOS TONOS MANEJADOS', 540000, { manual: 223700, labor: 15000 }),
      item(1, 'DECORACION DE CENEFA DE FONDO DE ESTACION DE POSTRES (3 METROS APROXIMADAMENTE)', 1600000, { manual: 671100, labor: 45000 }),
      item(2, 'JARRON CON FLORES PARA COLOCAR EN EL MUEBLE DE ENTRADA Y EN LA MESA DEL ESPEJO', 280000, { manual: 114100, labor: 7500 }),
      item(1, 'JUEGO DE 12 CILINDROS CON VELAS PARA COMPLEMENTAR MUEBLE DE ENTRADA', 120000, { insumos: [ins('Velas led', 12)] }),
      item(1, 'JUEGO DE 6 CILINDROS CON VELAS PARA COMPLEMENTAR MESA PEQUEÑA DE ENTRADA', 60000, { insumos: [ins('Velas led', 6)] }),
      item(1, 'ALQUILER DE ESPEJO DE BIENVENIDA MARCADO EN VINILO', 280000),
      item(1, 'DECORACION DE FUENTE, TODA LA PARTE METALICA', 1240000, { manual: 519600, labor: 45000 }),
      item(1, 'FONDO PARA MESA IMPERIAL DECORADA CON TRES ESTRUCTURAS DE MADERA, FORRADAS EN FOLLAJE ARTIFICIAL, CON FLORES EN LA PARTE SUPERIOR DE CADA ESTRUCTURA', 2600000, { manual: 1032000, labor: 80000 }),
    ] },
    { id: S.uid(), title: 'MOBILIARIO', items: [
      item(5, 'ALQUILER DE SOBREMANTEL REDONDO (POR DEFINIR)', 35000),
      item(50, 'ALQUILER DE PLATO BASE (POR DEFINIR)', 13000),
      item(2, 'ALQUILER DE SOBREMANTEL RECTANGULAR PARA MESAS IMPERIALES', 35000),
      item(1, 'TRANSPORTE MOBILIARIO', 450000),
    ] },
  ];
  return q;
};

/*
 * Segundo ejemplo: COTIZACIÓN 2347 – agencia de bodas (cliente anonimizado) (boda en la Catedral,
 * recepción en Casa Fernández, 8 de marzo de 2024, 48 PAX).
 * Valores al cliente idénticos al Excel (total 10.665.000).
 * Aquí cada arreglo se costea con SUS INSUMOS (las recetas de la hoja
 * IMPLEMENTOS de esa cotización) y los precios del catálogo actual, para que
 * se llenen el "Pedido de flores" y el desglose de costos. Al ser una agencia
 * (wedding planner), se aplica la comisión planner del 10% (celda J38).
 */
window.buildDemoQuote2347 = function (settings, catalog) {
  const S = window.Store;
  const q = S.newQuote(settings);
  const find = (name) => catalog.find((c) => c.name.toLowerCase() === name.toLowerCase());
  // ins(nombre en catálogo, cantidad por arreglo, nombre a mostrar en el pedido)
  const ins = (name, qty, label) => {
    const c = find(name) || { id: '', name, cat: 'otro', unit: 'UN', perPack: 1, price: 0 };
    return { catId: c.id, name: label || c.name, cat: c.cat, unit: c.unit, perPack: c.perPack, price: c.price, qty };
  };
  const item = (qty, desc, unitPrice, cost, courtesy) => {
    const it = S.newItem();
    Object.assign(it, { qty, desc, unitPrice, courtesy: !!courtesy });
    if (cost && cost.manual != null) Object.assign(it.cost, { mode: 'manual', manualUnitCost: cost.manual, labor: cost.labor || 0 });
    else if (cost && cost.insumos) Object.assign(it.cost, { mode: 'insumos', insumos: cost.insumos, labor: cost.labor || 0, recipeName: cost.recipe || '' });
    return it;
  };
  const altar = () => ({ recipe: 'Altar / pie de padre', labor: 25000, insumos: [
    ins('Gigante deluxe', 1, 'Oasis gigante'), ins('Hortensia Ricardo', 0.5, 'Hortensia blanca'), ins('Rosa', 1, 'Rosa Mondial'),
    ins('Phitosporum', 2), ins('Rusco', 6), ins('Eucalipto baby', 1, 'Eucalipto'), ins('Eucalipto Hoja larga', 3), ins('Silver dólar', 3)] });
  const juegoCilindros = (n) => [ins('Cristaleria', 3 * n, 'Cilindros de vidrio'), ins('Vela # 5', 3 * n, 'Velón para cilindro')];

  Object.assign(q, {
    number: 2347,
    status: 'realizada',
    fechaElaboracion: '2024-02-29',
    fechaVencimiento: '2024-03-15',
    cliente: { nombre: 'AGENCIA DE BODAS (EJEMPLO)', correo: '', celular: '' },
    evento: { tipo: 'Boda', ceremonia: 'CATEDRAL', recepcion: 'CASA FERNANDEZ', fecha: '2024-03-08', hora: '', pax: 48 },
    transport: { desc: 'TRANSPORTE, MONTAJE Y DESMONTAJE', qty: 1, unitPrice: 650000 },
    logistica: { personal: 4, viajesContratados: 1, viajesPropios: 1, cajasFlete: 2, otros: 0 },
    notas: 'Propuesta para la agencia de bodas. Flores en tonos blancos y rosados pastel; bouquet de novia con ranúnculo y un toque azul (espidia).',
  });
  q.pct.comisionPlanner = 0.10;
  q.sections = [
    { id: S.uid(), title: 'CEREMONIA', items: [
      item(2, 'ARREGLOS CON VARIEDAD DE FOLLAJE Y TOQUES DE FLORES BLANCAS PARA ALTAR MAYOR', 395000, altar()),
      item(1, 'ARREGLO CON VARIEDAD DE FOLLAJE Y TOQUES DE FLORES BLANCAS PARA PIE DE PADRE', 395000, altar()),
      item(60, 'JUEGOS DE TRES CILINDROS CON VELON COMO COMPLEMENTO DE CAMINO DE NOVIA', 30000, { insumos: juegoCilindros(1) }),
      item(1, 'BOUQUET PARA NOVIA EN VARIEDAD DE FLORES Y FOLLAJE (INCLUYE RANUNCULO)', 290000, { recipe: 'Bouquet de novia', labor: 15000, insumos: [
        ins('Rosa', 0.5, 'Rosa Mondial'), ins('Rosa', 0.5, 'Rosa Arena'), ins('Rosa', 0.5, 'Rosa rosado pálido'),
        ins('Ranunculo (peonia)', 0.5, 'Ranúnculo rosado pálido'), ins('Ranunculo (peonia)', 0.5, 'Ranúnculo rosado fuerte'),
        ins('espidia', 1, 'Espidia (toque azul)'), ins('Porta Bouquet Mediano', 1)] }),
      item(3, 'BOUQUET SENCILLO PARA DAMAS DE HONOR EN LOS TONOS MANEJADOS', 98000, { labor: 7500, insumos: [
        ins('Rosa', 0.5, 'Rosa rosada'), ins('Alheli', 0.5, 'Alhelí blanco'), ins('Rusco', 0.5), ins('Silver dólar', 0.25), ins('Porta Bouquet Mediano', 1)] }),
      item(1, 'BOUTONNIERE DE NOVIO', 0, { insumos: [ins('Minirosas', 0.1, 'Mini rosa blanca')] }, true),
      item(6, 'BOUTONNIERES PARA CABALLEROS EN MINI ROSA', 15000, { insumos: [ins('Minirosas', 0.1, 'Mini rosa blanca')] }),
      item(1, 'ALQUILER DE DIVAN EN MADERA', 60000, { manual: 35000 }),
      item(2, 'ALQUILER DE RECLINATORIOS PARA CEREMONIA EN MADERA', 30000, { manual: 15000 }),
    ] },
    { id: S.uid(), title: 'RECEPCIÓN', items: [
      item(6, 'ARREGLO SENCILLO TIPO MINI BOUQUET EN BASE DORADA PARA MESAS COCTELERAS', 55000, { labor: 5000, insumos: [
        ins('Bases', 1, 'Base dorada pequeña'), ins('Rosa', 0.17, 'Rosa Mondial'), ins('Eucalipto baby', 0.2, 'Eucalipto'),
        ins('Sencillo Deluxe', 0.125, 'Oasis sencillo'), ins('Rusco', 0.2)] }),
      item(1, 'DECORACION DE ENTRADA COMPUESTO POR: ARREGLO ALTO SOBRE COLUMNA (DE UN SOLO LADO), 20 PECERITAS COLGANTES CON VELITA LED Y DOS JUEGOS DE CILINDROS EN BASES DE DIFERENTES ALTURAS', 590000, { labor: 15000, insumos: [
        ins('Gigante deluxe', 1, 'Oasis gigante'), ins('Bocas dragon', 2, 'Boca de dragón rosada'), ins('Rosa', 1.5, 'Rosa Mondial'),
        ins('Clavel', 1, 'Mini clavel rosado'), ins('Rusco', 6), ins('Eucalipto baby', 1, 'Eucalipto'), ins('Eucalipto Hoja larga', 3),
        ins('Silver dólar', 1), ins('Candelabros', 1, 'Columna dorada'), ins('Cristaleria', 20, 'Peceritas colgantes'),
        ins('Velas led', 20, 'Velita LED'), ...juegoCilindros(2)] }),
      item(1, 'COMPLEMENTO DE ENTRADA A SALON CON CILINDROS, VELONES Y FAROLES DECORADOS (INCLUYE UN FAROL DECORADO Y UN JUEGO DE CILINDRO CON VELON DE UN SOLO LADO)', 95000, { labor: 5000, insumos: [
        ins('Bases', 1, 'Farol blanco'), ins('Velas led', 1, 'Vela LED'), ins('Rusco', 1), ins('Eucalipto baby', 0.5, 'Eucalipto'),
        ins('Minirosas', 0.5, 'Mini rosa rosada'), ins('Hortensia Ricardo', 0.33, 'Hortensia blanca'), ins('Rosa', 0.25, 'Rosa rosado pálido'),
        ins('Silver dólar', 0.3), ...juegoCilindros(1)] }),
      item(6, 'CENTRO DE MESA REDONDO BAJO CON FLORES SURTIDAS EN TONOS PASTELES, INCLUYE ROSA DE JARDIN', 661000, { recipe: 'Centro de mesa redondo bajo', labor: 15000, insumos: [
        ins('Bases', 1, 'Base blanca'), ins('Doble', 0.5, 'Oasis doble'), ins('Rosa', 0.5, 'Rosa Mondial'), ins('Rosa', 0.25, 'Rosa Arena'),
        ins('Rusco', 1), ins('Phitosporum', 1), ins('Minirosas', 0.75, 'Mini rosa blanca'), ins('Rosa Jardin', 1, 'Rosa de jardín rosada')] }),
      item(6, 'COMPLEMENTO DE CENTRO DE MESA CON CILINDROS BAJOS CON VELA O COPAS CON VELA', 30000, { insumos: [ins('Cristaleria', 3, 'Copas'), ins('Vela # 4', 3)] }),
      item(1, 'DECORACION DE ESCALERAS CON 30 CILINDROS CON VELON EN DIFERENTES ALTURAS', 300000, { insumos: juegoCilindros(10) }),
      item(1, 'DECORACION DE POZO CON 4 MINI BOUQUETS INTERCALADOS CON LOS POSTRES', 320000, { labor: 30000, insumos: [
        ins('Silver dólar', 2), ins('Rusco', 2), ins('Gipso', 0.5, 'Sprinyer'), ins('Eucalipto baby', 1.2, 'Eucalipto'),
        ins('Rosa', 1, 'Rosa rosado pálido'), ins('Sencillo Deluxe', 2, 'Oasis sencillo'), ins('Clavel', 1, 'Mini clavel blanco'),
        ins('Clavel', 1, 'Mini clavel rosado'), ins('Minirosas', 1, 'Mini rosa blanca')] }),
      item(1, 'ALQUILER DE ESPEJO DORADO GRANDE CON IMPRESIÓN PARA SIGNACION DE PUESTOS (NO INCLUYE FLORES NI COMPLEMENTOS DE VELA)', 300000, { manual: 83475, labor: 15000 }),
      item(1, 'DECORACION DE TORTA CON ROSAS TIPO CASCADA (NO INCLUYE HORTENSIAS NI ORQUIDEAS)', 155000, { labor: 10000, insumos: [ins('Rosa', 1.5, 'Rosa Arena')] }),
    ] },
  ];
  // Fotos de referencia en las mismas filas donde estaban en el Excel (columna E)
  const P = window.DEMO_PHOTOS || {};
  const ph = (si, ii, ...keys) => { q.sections[si].items[ii].photos = keys.map((k) => P[k]).filter(Boolean); };
  ph(0, 0, 'altar'); ph(0, 1, 'altar'); ph(0, 2, 'camino'); ph(0, 3, 'bouquet');
  ph(1, 0, 'cocteleras'); ph(1, 1, 'entrada'); ph(1, 2, 'farol'); ph(1, 3, 'centro', 'rosaJardin'); ph(1, 8, 'torta');
  q.photoMode = 'thumb';
  q.coverPhoto = P.camino || '';
  return q;
};
