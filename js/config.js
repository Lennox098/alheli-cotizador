/*
 * CONFIGURACIÓN INICIAL
 * Estos valores son los que trae la app la primera vez. Después se editan
 * desde la pantalla "Ajustes" y quedan guardados (no hace falta tocar este archivo).
 *
 * NUBE (opcional): para que usted y el contador vean los mismos datos desde
 * cualquier computador/celular, llene SUPABASE_URL y SUPABASE_ANON_KEY
 * (ver README.md, paso 3). Si se dejan vacíos, la app guarda en este navegador.
 */
window.APP_CONFIG = {
  SUPABASE_URL: 'https://binzygcyvkqsxenmhczf.supabase.co',
  // Clave pública ("publishable" / anon). Es segura en el navegador: la protección
  // la dan las reglas de supabase.sql (solo usuarios con sesión pueden leer y escribir).
  SUPABASE_ANON_KEY: 'sb_publishable_sQMgFfYSJKcrghStFhDsiA_ziDsPSRj',
};

window.DEFAULT_SETTINGS = {
  empresa: {
    nombre: 'Alhelí, Floristería & Eventos',
    gerente: 'XIOMARA ANGULO',
    cargo: 'Gerente',
    direccion: 'Manga Cra 24 #26-06',
    ciudad: 'Cartagena',
    telefono: '6787135 - 3175097732',
    web: 'www.alhelieventos.com.co',
    email: 'alhelifloristeriayeventos@gmail.com',
    facebook: 'alhelifloristeria&eventos',
    instagram: '@alheli_eventos',
    twitter: '@alheli_eventos',
    pinterest: 'Alheli_eventos',
  },
  cuentas: [
    { banco: 'Davivienda', tipo: 'Ahorros', numero: '4884-2851269-0' },
    { banco: 'Bancolombia', tipo: 'Ahorros', numero: '789-252449-28' },
  ],
  terminos: [
    'La actual propuesta NO garantiza reserva de fecha. Para reservar la fecha es necesaria la elaboración de un contrato y el pago del 50%; el saldo se paga 15 días antes del evento.',
    'Se concede de cortesía una muestra de arreglo floral, que solo se elabora una vez firmado el contrato. Cualquier cambio solicitado a la propuesta será recotizado.',
    'Los cultivos de flores se producen por temporada. Si las flores y follajes cotizados no se encuentran disponibles, podremos reemplazarlos por otros de características similares en paleta de colores y referencias.',
    'Adicional al presupuesto se cobra un depósito de {deposito} para cubrir imprevistos y como garantía de alquiler de las bases decorativas. Este valor es reembolsable con la devolución del material en buen estado.',
    'NOTA: al tomar el servicio de coordinación incluida la iglesia, este tendrá un recargo de $500.000 por el personal adicional.',
  ],
  numeracion: { siguiente: 2429 },
  diasVencimiento: 15,

  // Porcentajes por defecto (hoja "IMPLEMENTOS DE DECORACION" y "ARREGLOS")
  pct: {
    retencion: 0.08,     // RETENCION O ICA (C8)
    ajusteFlores: 0.15,  // AJUSTE FLORES (C9) -> se suma al costo de las flores
    comision: 0.10,      // % DE COMISION por arreglo (col. K)
    montaje: 0.10,       // % MONTAJE PRODUCTO por arreglo (col. L)
    iva: 0,              // IVA sobre el subtotal (0 = no se cobra)
    anticipo: 0.50,      // anticipo para reservar
    comisionPlanner: 0,  // comisión a agencia/planner sobre (total - transporte)
  },
  deposito: 600000,      // depósito reembolsable de garantía

  // Simulador de precio de venta (hoja ARREGLOS, "SIMULADOR DE ARREGLOS")
  simulador: { ganancia: 1.0, flete: 0.10, comision: 0.10, montaje: 0.40, retencion: 0.08 },

  // Tarifas de logística ("GASTOS VARIOS PARA MATRIMONIO")
  logistica: {
    staff: 80000,        // valor staff unitario
    arl: 35000,
    almuerzo: 16000,
    desayuno: 6000,
    viajeContratado: 150000, // camión (centro 100.000 – Radisson nocturno 250.000)
    viajePropio: 30000,      // transporte particular
    fleteCaja: 35000,        // flete de flores por caja
  },
};

window.STATUS = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aprobada: 'Aprobada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
};

// Categorías que ve el usuario. Un implemento alquilado NO es otra categoría:
// es un implemento con el interruptor "Alquilado" activado (internamente cat = 'alquilado').
window.CAT_LABELS = {
  flor: 'Flores y follajes',
  oasis: 'Oasis',
  implemento: 'Implementos',
  manoobra: 'Mano de obra (decorador)',
  otro: 'Otros',
};
window.groupCat = (c) => (c === 'alquilado' ? 'implemento' : c);
window.catLabel = (c) => window.CAT_LABELS[window.groupCat(c)] || c;
