/*
 * ALMACENAMIENTO
 * - Modo local: guarda todo en este navegador (localStorage). Funciona sin internet.
 * - Modo nube: si config.js tiene SUPABASE_URL y SUPABASE_ANON_KEY, guarda en
 *   Supabase (gratis) para compartir los datos con el contador.
 * Tabla en la nube: registros(id, tipo, datos, actualizado). Ver supabase.sql.
 */
(function () {
  // En modo tutorial (index.html?tutorial) se usa un espacio de datos aparte, para no tocar las cotizaciones reales
  const TUTORIAL = !!window.ALHELI_TUTORIAL || /[?&]tutorial\b/.test(location.search);
  const LS_KEY = 'alheli_cotizador_v1' + (TUTORIAL ? '_tutorial' : '');
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const clone = (o) => JSON.parse(JSON.stringify(o));

  // Mezcla profunda: completa settings guardados con claves nuevas de DEFAULT_SETTINGS
  function withDefaults(saved, defs) {
    if (Array.isArray(defs)) return Array.isArray(saved) ? saved : clone(defs);
    if (defs && typeof defs === 'object') {
      const out = {};
      Object.keys(defs).forEach((k) => { out[k] = withDefaults(saved ? saved[k] : undefined, defs[k]); });
      if (saved) Object.keys(saved).forEach((k) => { if (!(k in out)) out[k] = saved[k]; });
      return out;
    }
    return saved === undefined || saved === null ? defs : saved;
  }

  /* ---------- Plantillas de arreglo iniciales (recetas tomadas de las cotizaciones 2347 y 2428) ---------- */
  function seedRecipes(catalog) {
    const find = (name) => catalog.find((c) => c.name.toLowerCase() === name.toLowerCase());
    const ins = (name, qty) => {
      const c = find(name);
      return c ? { catId: c.id, name: c.name, cat: c.cat, unit: c.unit, perPack: c.perPack, price: c.price, qty }
               : { catId: '', name, cat: 'otro', unit: 'UN', perPack: 1, price: 0, qty };
    };
    const labor = (name) => { const c = find(name); return c ? c.price : 0; };
    const R = (name, laborName, list, desc) => ({
      id: uid(), name, laborName, labor: labor(laborName), desc: desc || '',
      insumos: list.map(([a, b]) => ins(a, b)),
    });
    return [
      R('Altar / pie de padre', 'ALTAR Y PIE DE PADRE', [['Gigante deluxe', 1], ['Hortensia selecta', 1], ['Rosa', 1], ['Phitosporum', 2], ['Rusco', 6], ['Eucalipto baby', 1], ['Eucalipto Hoja larga', 3], ['Silver dólar', 3]],
        'ARREGLO CON VARIEDAD DE FOLLAJE Y TOQUES DE FLORES PARA ALTAR'),
      R('Aro / arco decorado', 'HUPA, ARCO Y ESTRUCTURA', [['Doble', 10], ['Rosa', 2], ['Eucalipto Hoja larga', 6], ['Rusco', 15], ['Clavel', 2], ['Astromelia', 4], ['Chispitas', 4], ['Eucalipto baby', 6], ['Minirosas', 6], ['Silver dólar', 5], ['Hiedra', 4], ['Phitosporum', 4]],
        'ARO DECORADO CON FLORES SURTIDAS EN TONOS SOLICITADOS'),
      R('Mini bouquet camino / bancas', 'MINI BOUQUET', [['Rosa', 0.25], ['Astromelia', 0.5], ['Eucalipto baby', 0.25], ['Rusco', 0.5], ['Alheli', 1]],
        'MINI BOUQUETS ATADOS A LAS BANCAS, CON FOLLAJE SURTIDO Y TOQUES DE FLORES'),
      R('Bouquet de novia', 'BOUQUET', [['Rosa', 0.92], ['Minirosas', 0.75], ['Protea', 0.25], ['Rusco', 0.25], ['Silver dólar', 0.5], ['Eucalipto baby', 0.25], ['Iperico', 0.125], ['Porta Bouquet Mediano', 1]],
        'BOUQUET DE NOVIA CON ROSAS, MINI ROSAS Y FLORES SURTIDAS EN LOS TONOS MANEJADOS'),
      R('Boutonniere', 'MINI BOUQUET', [['Minirosas', 0.1]], 'BOUTONNIERE EN MINI ROSA'),
      R('Mesa imperial tipo sembrado (por mesa)', 'SEMBRADOS', [['Sencillo Deluxe', 3], ['Rusco', 2], ['Eucalipto baby', 1], ['Silver dólar', 2], ['Eucalipto Hoja larga', 1], ['Rosa', 2], ['Minirosas', 2], ['Cremon de colores', 0.5], ['Phitosporum', 2], ['Estatis', 0.25], ['Alheli', 0.5], ['Bocas dragon', 0.5]],
        'DECORACION DE MESA IMPERIAL CON ARREGLO TIPO SEMBRADO, CON FOLLAJE SURTIDO Y TOQUES DE FLORES'),
      R('Centro de mesa redondo bajo', 'CENTRO DE MESA BAJO TUPIDO', [['Lamina de oasis (20 x 20)', 1.6], ['Rosa', 1], ['Alheli', 0.5], ['Bocas dragon', 0.5], ['Silver dólar', 0.5], ['Phitosporum', 1], ['Rusco', 2], ['Estatis', 0.2], ['Minirosas', 0.5], ['Protea', 0.32], ['Cremon de colores', 0.32], ['Eucalipto baby', 0.4]],
        'CENTRO DE MESA REDONDO BAJO CON FOLLAJE Y FLORES SURTIDAS EN LOS TONOS SOLICITADOS'),
      R('Complemento 3 copas con velas', '', [['Copas', 3], ['Vela # 4', 3]],
        'COMPLEMENTO PARA CENTRO DE MESA CON JUEGO DE 3 COPAS CON VELAS'),
      R('Jarrón de entrada', 'ARREGLO ALTO', [['Doble', 1], ['Rosa', 0.5], ['Minirosas', 1], ['Rusco', 2], ['Phitosporum', 1], ['Campanola', 2], ['Jazmin', 2], ['Bases', 1]],
        'JARRON CON FLORES PARA MUEBLE DE ENTRADA'),
      R('Fondo / cenefa floral', 'HUPA, ARCO Y ESTRUCTURA', [['Hortensia Ricardo', 3], ['Rosa', 2], ['Minirosas', 3], ['Eucalipto Hoja larga', 3], ['Hiedra', 3], ['Rusco', 6], ['Coculos (follaje)', 5], ['Doble', 8], ['Alheli', 6]],
        'DECORACION DE CENEFA CON FLORES SURTIDAS EN LOS TONOS MANEJADOS'),
    ];
  }

  function seedState() {
    const catalog = clone(window.SEED_CATALOG || []);
    return { settings: clone(window.DEFAULT_SETTINGS), catalog, recipes: seedRecipes(catalog), quotes: [] };
  }

  /* ---------- Nueva cotización vacía ---------- */
  function newQuote(settings) {
    const today = new Date();
    const due = new Date(today.getTime() + (settings.diasVencimiento || 15) * 86400000);
    const iso = (d) => d.toISOString().slice(0, 10);
    return {
      id: uid(),
      number: settings.numeracion.siguiente,
      status: 'borrador',
      fechaElaboracion: iso(today),
      fechaVencimiento: iso(due),
      cliente: { nombre: '', correo: '', celular: '' },
      evento: { tipo: 'Boda', ceremonia: '', recepcion: '', fecha: '', hora: '', pax: '' },
      sections: [
        { id: uid(), title: 'CEREMONIA', items: [] },
        { id: uid(), title: 'RECEPCIÓN', items: [] },
      ],
      transport: { desc: 'TRANSPORTE, MONTAJE Y DESMONTAJE', qty: 1, unitPrice: 0 },
      photoMode: 'thumb',   // 'none' | 'thumb' (junto al ítem) | 'gallery' (galería al final)
      coverPhoto: '',       // foto de portada opcional

      pct: clone(settings.pct),
      deposito: settings.deposito,
      logistica: { personal: 0, viajesContratados: 0, viajesPropios: 0, cajasFlete: 0, otros: 0 },
      notas: '',
      creada: new Date().toISOString(),
      actualizada: new Date().toISOString(),
    };
  }

  function newItem() {
    return {
      id: uid(), qty: 1, desc: '', unitPrice: 0, courtesy: false, photos: [],
      cost: { mode: 'insumos', recipeName: '', labor: 0, manualUnitCost: 0, commissionPct: '', montajePct: '', insumos: [] },
    };
  }

  /* ---------- Backend local ----------
   * IndexedDB (cientos de MB, ideal para fotos). Si el navegador no lo permite,
   * usa localStorage (≈5 MB). Migra automáticamente los datos de la versión anterior.
   */
  const IDB = {
    db: null,
    open() {
      if (this.db) return Promise.resolve(this.db);
      return new Promise((res, rej) => {
        if (!window.indexedDB) return rej(new Error('sin IndexedDB'));
        const r = indexedDB.open('alheli_cotizador' + (TUTORIAL ? '_tutorial' : ''), 1);
        r.onupgradeneeded = () => r.result.createObjectStore('kv');
        r.onsuccess = () => { this.db = r.result; res(this.db); };
        r.onerror = () => rej(r.error);
      });
    },
    async get(k) {
      const db = await this.open();
      return new Promise((res, rej) => { const t = db.transaction('kv').objectStore('kv').get(k); t.onsuccess = () => res(t.result); t.onerror = () => rej(t.error); });
    },
    async set(k, v) {
      const db = await this.open();
      return new Promise((res, rej) => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
    },
  };
  const Local = {
    useIDB: true,
    async load() {
      try {
        const st = await IDB.get('state');
        if (st) return st;
        const raw = localStorage.getItem(LS_KEY); // migración desde la versión anterior
        if (raw) { const old = JSON.parse(raw); await IDB.set('state', old); return old; }
        return null;
      } catch (e) {
        this.useIDB = false;
        try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : null; } catch (e2) { return null; }
      }
    },
    async saveAll(state) {
      if (this.useIDB) {
        try { await IDB.set('state', JSON.parse(JSON.stringify(state))); return; } catch (e) { this.useIDB = false; }
      }
      try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {
        Store.onError && Store.onError('No hay espacio para guardar (demasiadas fotos). Descargue un respaldo y elimine fotos o active la nube.');
      }
    },
  };

  /* ---------- Backend nube (Supabase) ---------- */
  const Cloud = {
    client: null,
    async load() {
      const { data, error } = await this.client.from('registros').select('id,tipo,datos');
      if (error) throw error;
      if (!data.length) return null;
      const st = { settings: null, catalog: [], recipes: [], quotes: [] };
      data.forEach((r) => {
        if (r.tipo === 'settings') st.settings = r.datos;
        else if (r.tipo === 'catalog') st.catalog = r.datos;
        else if (r.tipo === 'recipes') st.recipes = r.datos;
        else if (r.tipo === 'quote') st.quotes.push(r.datos);
      });
      return st;
    },
    async upsert(rows) {
      const { error } = await this.client.from('registros').upsert(
        rows.map((r) => Object.assign({ actualizado: new Date().toISOString() }, r)));
      if (error) { console.error(error); Store.onError && Store.onError('Error guardando en la nube: ' + error.message); }
    },
    async remove(id) {
      const { error } = await this.client.from('registros').delete().eq('id', id);
      if (error) Store.onError && Store.onError('Error borrando en la nube: ' + error.message);
    },
  };

  const Store = {
    state: null,
    mode: 'local',
    user: null,
    onError: null,
    uid, clone, newQuote, newItem, seedRecipes,

    cloudConfigured() {
      const c = window.APP_CONFIG || {};
      return !TUTORIAL && !!(c.SUPABASE_URL && c.SUPABASE_ANON_KEY && window.supabase);
    },
    tutorial: TUTORIAL,
    // Borra los datos del modo tutorial (solo funciona en modo tutorial)
    async resetTutorial() {
      if (!TUTORIAL) return;
      try { localStorage.removeItem(LS_KEY); } catch (e) { /* nada */ }
      try { await IDB.set('state', null); } catch (e) { /* nada */ }
      this.state = null;
      await this.reload();
    },

    async init() {
      const c = window.APP_CONFIG || {};
      // Nube configurada pero la librería no cargó: avisar en vez de guardar en el navegador por error
      if (!TUTORIAL && c.SUPABASE_URL && c.SUPABASE_ANON_KEY && !window.supabase) {
        throw new Error('No se pudo cargar la conexión con la nube. Revise su conexión a internet y vuelva a abrir la aplicación.');
      }
      if (this.cloudConfigured()) {
        this.mode = 'cloud';
        Cloud.client = window.supabase.createClient(APP_CONFIG.SUPABASE_URL, APP_CONFIG.SUPABASE_ANON_KEY);
        const { data } = await Cloud.client.auth.getSession();
        this.user = data.session ? data.session.user : null;
        if (!this.user) return 'login';
      }
      await this.reload();
      return 'ok';
    },

    async signIn(email, password) {
      const { data, error } = await Cloud.client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      this.user = data.user;
      await this.reload();
    },
    async signOut() { await Cloud.client.auth.signOut(); location.reload(); },

    async reload() {
      let st = this.mode === 'cloud' ? await Cloud.load() : await Local.load();
      const fresh = !st;
      if (!st) st = seedState();
      st.settings = withDefaults(st.settings, window.DEFAULT_SETTINGS);
      if (!st.catalog || !st.catalog.length) st.catalog = clone(window.SEED_CATALOG || []);
      if (!st.recipes) st.recipes = [];
      st.quotes = st.quotes || [];
      this.state = st;
      if (fresh) await this.saveEverything();
    },

    async saveEverything() {
      if (this.mode === 'cloud') {
        await Cloud.upsert([
          { id: 'settings', tipo: 'settings', datos: this.state.settings },
          { id: 'catalog', tipo: 'catalog', datos: this.state.catalog },
          { id: 'recipes', tipo: 'recipes', datos: this.state.recipes },
          ...this.state.quotes.map((q) => ({ id: 'q_' + q.id, tipo: 'quote', datos: q })),
        ]);
      } else await Local.saveAll(this.state);
    },

    async saveQuote(q) {
      q.actualizada = new Date().toISOString();
      const i = this.state.quotes.findIndex((x) => x.id === q.id);
      if (i < 0) this.state.quotes.push(q); else this.state.quotes[i] = q;
      // Numeración automática: el siguiente número siempre es mayor al último usado
      const s = this.state.settings;
      const num = parseInt(q.number, 10);
      let settingsChanged = false;
      if (Number.isFinite(num) && num >= s.numeracion.siguiente) { s.numeracion.siguiente = num + 1; settingsChanged = true; }
      if (this.mode === 'cloud') {
        const rows = [{ id: 'q_' + q.id, tipo: 'quote', datos: q }];
        if (settingsChanged) rows.push({ id: 'settings', tipo: 'settings', datos: s });
        await Cloud.upsert(rows);
      } else await Local.saveAll(this.state);
    },
    async deleteQuote(id) {
      this.state.quotes = this.state.quotes.filter((q) => q.id !== id);
      if (this.mode === 'cloud') await Cloud.remove('q_' + id); else await Local.saveAll(this.state);
    },
    async saveKey(key) {
      if (this.mode === 'cloud') await Cloud.upsert([{ id: key, tipo: key, datos: this.state[key] }]);
      else await Local.saveAll(this.state);
    },
    saveSettings() { return this.saveKey('settings'); },
    saveCatalog() { return this.saveKey('catalog'); },
    saveRecipes() { return this.saveKey('recipes'); },

    exportJSON() {
      return JSON.stringify({ app: 'alheli-cotizador', version: 1, exportado: new Date().toISOString(), ...this.state }, null, 2);
    },
    async importJSON(obj) {
      if (!obj || !Array.isArray(obj.quotes) || !Array.isArray(obj.catalog)) throw new Error('Archivo no válido');
      this.state = {
        settings: withDefaults(obj.settings, window.DEFAULT_SETTINGS),
        catalog: obj.catalog, recipes: obj.recipes || [], quotes: obj.quotes,
      };
      await this.saveEverything();
    },
  };

  window.Store = Store;
})();
