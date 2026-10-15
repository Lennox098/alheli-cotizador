# Alhelí · Cotizador y control de costos

Aplicación web que reemplaza las hojas de Excel de cotización de **Alhelí Floristería & Eventos**:

| Módulo | Qué hace | Equivale en Excel a |
|---|---|---|
| **Inicio** | Tablero: total cotizado, aprobado, tasa de cierre, utilidad, gráfico por mes, "¿a dónde va cada peso?", próximos eventos | — (nuevo) |
| **Cotizaciones** | Datos del cliente y del evento, ítems por sección (Ceremonia, Recepción, Mobiliario…), **fotos por ítem y foto de portada**, cortesías, transporte, IVA, anticipo y depósito reembolsable | Hoja `COTIZACION` (con sus fotos en la columna E) |
| **Costos internos** | Costo de cada arreglo por insumos (flores, follajes, oasis, velas, alquilados) + mano de obra, comisión, montaje, retención/ICA, ajuste de flores y ganancia | Hoja `IMPLEMENTOS DE DECORACION` |
| **Pedido de flores** | Suma automática de todos los insumos del evento (qué comprar y cuánto cuesta) | Tabla dinámica `PEDIDO FLORES` |
| **Resumen financiero** | Totales de costos, comisiones, montaje, retención, logística y utilidad, con % sobre la venta | Encabezado de `IMPLEMENTOS` (que tenía `#REF!`) |
| **Descargar PDF o Excel** | PDF listo para el cliente (logo, fotos, términos, cuentas Bancolombia y Davivienda) y **Excel .xlsx con fórmulas vivas y fotos** (hojas COTIZACION, RESUMEN, COSTOS INTERNOS, INSUMOS, PEDIDO FLORES); envío por WhatsApp o email | Hoja `PARA IMPRIMIR` y todo el libro |
| **Contabilidad** | Resumen de todas las cotizaciones (por estado y fechas) con gráfico, exportable a Excel o CSV | — (nuevo) |
| **Catálogo de precios** | Precios de costo de flores, oasis, implementos, alquilados y mano de obra | `LISTADO DE PRECIOS NUEVO` |
| **Plantillas + simulador** | Recetas de arreglos (altar, aro, bouquet, centro de mesa…) y precio de venta sugerido | `SIMULADOR DE ARREGLOS` |

No necesita instalar nada: es HTML + JavaScript. Funciona con doble clic y se puede publicar gratis en internet.

---

## 1. Probarla ya en su computador (1 minuto)

1. Abra la carpeta `aplicasion` y haga **doble clic en `index.html`** (se abre en Chrome/Edge).
2. Pulse uno de los ejemplos:
   - **Ejemplo 1 – Boda Hilton (2428)**: mismos valores del Excel (total $17.767.000), costos digitados como en la hoja IMPLEMENTOS.
   - **Ejemplo 2 – Boda Catedral con planner (2347)**: total $10.665.000, cada arreglo costeado por insumos (flores, oasis, velas) con el catálogo actual, comisión planner del 10%, pedido de flores completo y las **fotos reales** que estaban en ese Excel (altar, camino de velas, bouquet, centros de mesa, torta…).
3. Recorra las pestañas de la cotización y pruebe **Descargar ▾ → PDF / Excel**.

### Aprender a usarla
- **Tutorial en video:** abra `tutorial.html` (o el menú *Tutorial en video*). Un cursor animado crea una cotización completa sobre la app real, con subtítulos y 9 capítulos; se puede pausar, adelantar y cambiar la velocidad. Usa datos de práctica: no toca sus cotizaciones.
- **Video MP4:** `Tutorial Alheli - como hacer una cotizacion.mp4` es el mismo tutorial grabado, listo para enviar por WhatsApp.
- **Manual:** `manual-de-usuario.html` explica cada pantalla paso a paso.

### Fotos en la cotización
- En **Ítems y fotos**, cada ítem tiene el botón 🖼 **Foto**. También puede **arrastrar** una imagen sobre el ítem o **pegarla con Ctrl+V** (haga clic en la descripción y pegue). Se pueden poner varias fotos por ítem; clic en una foto la amplía.
- En **Cliente y evento → Fotos en la cotización** elige cómo salen en el PDF y el Excel: **Sin fotos**, **Junto a cada ítem** o **Galería al final**, y opcionalmente una **foto de portada**.
- Las fotos se comprimen automáticamente (máx. 1000 px) para que el PDF y los datos no pesen.
- Las plantillas de arreglos también pueden tener foto: al crear un ítem desde la plantilla, la foto se copia.

### Otras mejoras de la interfaz
Tablero de inicio con gráficos, tarjetas con foto en la lista de cotizaciones, reordenar ítems arrastrando la manija ⠿, barra fija con subtotal/total/utilidad, ventanas de confirmación, visor de fotos, **modo oscuro** (botón abajo a la izquierda) y diseño adaptado a celular.

> En este modo los datos se guardan **solo en ese navegador** (IndexedDB, con espacio para muchas fotos). Use *Ajustes → Descargar respaldo* con frecuencia, o active la nube (paso 3) para compartir con el contador.

Para comprobar que los cálculos coinciden con el Excel, abra `tests.html` con doble clic: deben salir **45 pruebas en verde** (incluye el archivo Excel generado).

---

## 2. Publicarla gratis en internet (5 minutos) — Netlify

1. Entre a **https://app.netlify.com/drop** (cree una cuenta gratis con su correo o Google).
2. **Arrastre la carpeta `aplicasion` completa** a la página.
3. En segundos le da una dirección tipo `https://alheli-xxxx.netlify.app`. Puede cambiarla en *Site configuration → Change site name* (ej. `alheli-cotizador.netlify.app`).
4. Ábrala desde el celular y use *"Agregar a la pantalla de inicio"* para tenerla como app.

Para actualizar: vuelva a arrastrar la carpeta en *Deploys → Drag and drop*.

### Opción GitHub + GitHub Pages
1. En **https://github.com/new** cree un repositorio (ej. `alheli-cotizador`) **sin** README ni .gitignore.
2. En la carpeta `aplicasion` ejecute:
   ```
   git remote add origin https://github.com/SU-USUARIO/alheli-cotizador.git
   git push -u origin main
   ```
3. En el repositorio: **Settings → Pages → Build and deployment → Deploy from a branch → main / (root) → Save**. En 1–2 minutos queda en `https://SU-USUARIO.github.io/alheli-cotizador/`.

> En el plan gratis de GitHub, Pages requiere que el repositorio sea **público**: cualquiera puede ver el código, pero no sus cotizaciones, que viven en Supabase protegidas con usuario y contraseña. La clave de `js/config.js` es la pública de Supabase, hecha para ir en el navegador. Los ejemplos usan clientes ficticios.

**Alternativas gratuitas equivalentes:** Cloudflare Pages (*Workers & Pages → Create → Pages → Upload assets*) o GitHub Pages (subir la carpeta a un repositorio y activar *Settings → Pages*).

> Publicada sin el paso 3, cada persona/navegador tiene sus propios datos (no se comparten).

---

## 3. Compartir los datos con el contador (nube gratis con Supabase)

1. Cree una cuenta en **https://supabase.com** → *New project* (plan Free). Anote la contraseña de la base de datos.
2. En el proyecto: **SQL Editor → New query**, pegue el contenido de `supabase.sql` y pulse **Run**.
3. **Authentication → Sign In / Providers → Email**: desactive **"Allow new users to sign up"** (así nadie más puede registrarse).
4. **Authentication → Users → Add user → Create new user**: cree un usuario para usted y otro para el contador (correo + contraseña, marque *Auto confirm*).
5. **Project Settings → API**: copie **Project URL** y la clave **anon public**.
6. Abra `js/config.js` y péguelas:
   ```js
   window.APP_CONFIG = {
     SUPABASE_URL: 'https://xxxxxxxx.supabase.co',
     SUPABASE_ANON_KEY: 'eyJhbGciOi...',
   };
   ```
7. Vuelva a publicar la carpeta (paso 2). Ahora la app pide correo y contraseña, y ambos ven las mismas cotizaciones.

Si ya tenía datos en modo local: antes del paso 7 descargue *Ajustes → Descargar respaldo* y, ya con la nube activa, *Ajustes → Restaurar respaldo*.

> La clave *anon* es pública por diseño; la protección la dan las reglas de `supabase.sql` (solo usuarios con sesión) y el registro desactivado.
> En el plan gratis, Supabase **pausa el proyecto tras 7 días sin uso**; se reactiva con un clic en el panel. Descargue respaldos de vez en cuando.

---

## 4. Cómo calcula (fórmulas tomadas de sus Excel)

### Cotización al cliente (hoja COTIZACION)
- `Vlr. total = Cantidad × Vlr. unitario` (cortesías = $0).
- `Total sección = suma de sus ítems` (Ceremonia, Recepción, Mobiliario…).
- `Subtotal = secciones + Transporte, montaje y desmontaje`.
- `IVA = Subtotal × %IVA` (0% por defecto, como en sus cotizaciones). `Total = Subtotal + IVA`.
- `Anticipo = Total × 50%`. El **depósito reembolsable** ($600.000) se muestra aparte: no es ingreso.

### Costeo por arreglo (hoja IMPLEMENTOS DE DECORACION)
- `Costo unitario (I) = flores × (1 + ajuste flores 15%) + oasis/implementos + alquilados + mano de obra`
  (o se digita a mano, como en el Excel).
- `Montaje (M) = Vlr. cotizado × % montaje (10%)`
- `Comisión (O) = Vlr. cotizado × % comisión (10%)`
- `Retención (P) = Vlr. cotizado × 8%`
- `Ganancia unitaria (N) = Vlr. cotizado − Costo − Montaje − Comisión − Retención`
- Totales = cantidad × cada valor (Q, R, S, T, U, V).

### Logística
- `Retención transporte = Transporte × 8%` · `Valor logística = Transporte − retención`
- `Costo = personal × (staff + ARL + almuerzo + desayuno) + viajes + flete + otros`
- `Imprevistos / margen = Valor logística − Costo`

### Utilidad estimada
`Ganancia en arreglos + margen de logística − comisión planner` (la comisión de agencia/planner de la cotización 2347: 10% sobre el total sin transporte).

### Simulador de precio (hoja ARREGLOS)
`Costo de realización (C)` → `Ganancia = (C − alquilados) × 100%` → `Base = C + ganancia + alquilados` →
`+ flete 10% + comisión 10% + montaje 40%` → `+ retención 8%` = **precio sugerido** (redondeado a miles).
Todos los porcentajes se cambian en *Ajustes*.

---

## 5. Correcciones respecto a los Excel

- Las celdas `E2…E18` y `D8, D16, D17, D18` de `IMPLEMENTOS` apuntaban a `COTIZACION!#REF!`: ahora los % y la retención en transporte se calculan sobre el total real.
- En la cotización 2347 algunas filas (`Q32…V32`) multiplicaban por `#REF!`: aquí cada línea tiene su cantidad.
- En la 2428 `TOTAL CEREMONIA = SUM(G13:G20)` dejaba por fuera la fila 21 (la canastica de cortesía no afectaba, pero un ítem cobrado en esa fila se habría perdido). Aquí la suma incluye siempre todos los ítems.
- En la 2347 la fecha de elaboración era `=TODAY()` (cambiaba cada vez que se abría y quedaba posterior al vencimiento). Aquí se guarda fija.
- En el Excel el "VALOR COTIZADO" de costos (col. J) era un precio distinto al cotizado al cliente (ej. aro: $1.567.305 vs $1.800.000). Aquí la ganancia se calcula con **el precio real que se le cobró al cliente**.
- El "AJUSTE FLORES 15%" existía pero ninguna fórmula lo usaba: aquí se suma al costo de las flores (se puede poner en 0%).

---

## 6. Estructura de archivos

```
aplicasion/
├── index.html        Página principal
├── tests.html        Pruebas: cálculos de la app vs. valores del Excel
├── supabase.sql      Script de la base de datos en la nube (opcional)
├── css/styles.css    Diseño (pantalla, celular e impresión)
├── assets/logo.jpg   Logo
└── js/
    ├── config.js     Datos de empresa, cuentas, términos, % y nube  ← lo único que se edita a mano
    ├── calc.js       Motor de cálculo (todas las fórmulas)
    ├── store.js      Guardado local / Supabase, plantillas iniciales
    ├── app.js        Pantallas
    ├── ui.js         Íconos, ventanas, visor de fotos, gráficos, compresión de fotos
    ├── excel.js      Exportación a Excel (hojas, fórmulas, fotos)
    ├── xlsx-writer.js Generador de archivos .xlsx propio (no necesita internet)
    ├── catalog.js    Catálogo inicial (221 precios del listado nuevo)
    ├── demo.js       Cotizaciones de ejemplo 2428 y 2347
    ├── demo-fotos.js Fotos del ejemplo 2347 (se cargan solo al usar ese ejemplo)
    └── logo.js       Logo embebido para el PDF y el Excel
```

## El archivo Excel que descarga la app
| Hoja | Contenido |
|---|---|
| **COTIZACION** | Igual a la del cliente: logo, portada, datos, ítems con foto, `Vlr. total = Cant × Vlr. unit`, totales por sección con `SUM`, subtotal, IVA, total, depósito, anticipo, términos, cuentas y firma. Lista para imprimir en carta. |
| **RESUMEN** | Venta, costos, comisiones, montaje, retención, ganancia, logística y utilidad con % sobre la venta (las celdas amarillas de logística y % planner se pueden cambiar). |
| **COSTOS INTERNOS** | La tabla de `IMPLEMENTOS` con todas sus fórmulas (montaje, comisión, retención, ganancia unitaria y totales). Parámetros editables arriba (retención, ajuste flores…). |
| **INSUMOS** | Desglose de flores/insumos por arreglo; el costo del arreglo sale de aquí con `SUMIF`. |
| **PEDIDO FLORES** | Lo que hay que comprar (`SUMIF` + `ROUNDUP`) y su costo. |

Validado abriéndolo en Microsoft Excel 16: 0 errores de fórmula y valores idénticos a la app.

## Preguntas frecuentes

- **¿El PDF no se descarga?** La librería de PDF se descarga de internet la primera vez (luego queda en caché). Sin internet use *Imprimir → Guardar como PDF*. El **Excel funciona siempre, incluso sin internet**.
- **WhatsApp:** en el celular comparte el PDF directo al chat. En computador descarga el PDF y abre WhatsApp Web con el mensaje listo; arrastre el PDF al chat.
- **Correo:** descarga el PDF y abre su programa de correo con asunto y mensaje; adjunte el PDF.
- **Cambiar logo:** reemplace `assets/logo.jpg` y en `js/logo.js` pegue la imagen en base64 (o pídale a su desarrollador que lo regenere).
- **Numeración:** cada cotización nueva toma el siguiente número (después de la 2428 → 2429). Se puede escribir otro a mano.
# alheli-cotizador
