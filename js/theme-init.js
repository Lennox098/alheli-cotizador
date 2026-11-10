/*
 * Se ejecuta antes de pintar la página:
 *  1) aplica el tema guardado (claro u oscuro) para evitar el parpadeo;
 *  2) impide que la aplicación se muestre dentro de un marco de otro sitio (clickjacking).
 *     La cabecera X-Frame-Options no se puede configurar en GitHub Pages; esto es la mitigación posible.
 */
(function () {
  try {
    var t = localStorage.getItem('alheli_theme');
    if (t) document.documentElement.dataset.theme = t;
  } catch (e) { /* sin almacenamiento disponible */ }

  if (window.top !== window.self) {
    document.documentElement.style.display = 'none';
    try { window.top.location.href = window.self.location.href; } catch (e) { /* bloqueado: la página queda oculta */ }
  }
})();
