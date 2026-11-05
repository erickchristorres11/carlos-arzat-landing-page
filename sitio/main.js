/* =========================================================
   Carlos Arzat · Interacciones
   Sin librerías: IntersectionObserver + transiciones CSS,
   igual que el sitio de referencia.
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');

  var WA = 'https://wa.me/529991392123?text=';
  var fmt = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 });
  var money = function (n) { return '$' + fmt.format(Math.round(n)); };

  /* Lee un campo de dinero: acepta "30,000", "30000" o "$30 000" */
  function readMoney(input) {
    var n = parseInt(String(input.value).replace(/[^\d]/g, ''), 10);
    return isNaN(n) ? 0 : Math.min(n, 99999999);
  }
  /* Reescribe el campo con separadores de miles sin mover el cursor al final */
  function formatField(input) {
    var n = readMoney(input);
    input.value = n ? fmt.format(n) : '';
  }

  /* ---------- 1. Retrato: si falta el PNG, se muestra el espacio reservado ---------- */
  var hero = document.querySelector('.hero-card');
  var photo = document.querySelector('.portrait img');
  if (photo) {
    var missing = function () { hero.classList.add('no-photo'); };
    if (photo.complete && photo.naturalWidth === 0) missing();
    photo.addEventListener('error', missing);
  }

  /* ---------- 2. Selector de tema → mensaje de WhatsApp ---------- */
  var pick = document.getElementById('pick');
  var waText = document.getElementById('wa-text');
  var note = document.getElementById('pick-note');
  var floatWa = document.getElementById('float-wa');
  var footWa = document.getElementById('f-wa');

  function setTema(tema) {
    var msg = 'Hola Carlos, quiero agendar un diagnóstico para ' + tema + '.';
    waText.value = msg;
    note.innerHTML = 'Se abrirá WhatsApp con tu tema: <b>' + tema + '</b>.';
    // El tema elegido viaja también al botón flotante y al del footer
    floatWa.href = WA + encodeURIComponent(msg);
    footWa.href = WA + encodeURIComponent(msg);
  }
  pick.addEventListener('change', function (e) {
    if (e.target.name === 'tema') setTema(e.target.value);
  });
  // Al enviar, abrimos solo con el texto (sin el parámetro "tema")
  pick.addEventListener('submit', function (e) {
    e.preventDefault();
    window.open(WA + encodeURIComponent(waText.value), '_blank', 'noopener');
  });

  // Los enlaces "Quiero…" de cada tarjeta preseleccionan su tema
  document.querySelectorAll('.more[data-tema]').forEach(function (a) {
    a.addEventListener('click', function () {
      var tema = a.getAttribute('data-tema');
      var radio = pick.querySelector('input[value="' + tema + '"]');
      if (radio) radio.checked = true;
      setTema(tema);
    });
  });

  /* ---------- 3. Calculadora 50/30/20 ---------- */
  var ingreso = document.getElementById('ingreso');
  function calc() {
    var n = readMoney(ingreso);
    document.getElementById('r50').textContent = money(n * 0.5);
    document.getElementById('r30').textContent = money(n * 0.3);
    document.getElementById('r20').textContent = money(n * 0.2);
    // Meta: meses para juntarla con el 20 % y fecha aproximada
    var meta = readMoney(metaIn), ahorro = n * 0.2;
    var mesesEl = document.getElementById('r-meses'), fechaEl = document.getElementById('r-fecha');
    if (!ahorro || !meta) { mesesEl.textContent = '—'; fechaEl.textContent = '—'; return; }
    var m = Math.ceil(meta / ahorro), d = new Date();
    d.setMonth(d.getMonth() + m);
    mesesEl.textContent = m === 1 ? '1 mes' : fmt.format(m) + ' meses';
    fechaEl.textContent = d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  }
  var metaIn = document.getElementById('meta');
  metaIn.addEventListener('input', calc);
  metaIn.addEventListener('blur', function () { formatField(metaIn); });
  ingreso.addEventListener('input', calc);
  ingreso.addEventListener('blur', function () { formatField(ingreso); });
  calc();

  /* ---------- 4. Simulador de inflación ----------
     costo futuro = gasto × (1 + inflación)^años. Ilustrativo, inflación constante. */
  var gasto = document.getElementById('gasto');
  var anos = document.getElementById('anos');
  var inf = document.getElementById('inf');
  var line = document.getElementById('curve-line');
  var area = document.getElementById('curve-area');

  function fill(range) {
    var p = (range.value - range.min) / (range.max - range.min) * 100;
    range.style.setProperty('--p', p + '%');
  }

  function sim() {
    var g = readMoney(gasto);
    var n = +anos.value;
    var r = +inf.value / 100;
    var fut = g * Math.pow(1 + r, n);

    document.getElementById('o-anos').textContent = n;
    document.getElementById('o-inf').textContent = (+inf.value).toFixed(1) + ' %';
    document.getElementById('futuro').textContent = money(fut);
    document.getElementById('axis-end').textContent = 'En ' + n + ' años';
    fill(anos); fill(inf);

    document.getElementById('axis-start').textContent = money(g);
    // Curva: la base es el gasto de hoy (a 40 % de altura) y el techo
    // se ajusta al resultado, así siempre se lee cuánto crece
    var W = 320, H = 118, maxF = Math.max(Math.pow(1 + r, n), 2.2), pts = [];
    for (var i = 0; i <= n; i++) {
      var x = (i / n) * W;
      var y = H - (Math.pow(1 + r, i) / maxF) * (H - 6);
      pts.push(x.toFixed(1) + ' ' + y.toFixed(1));
    }
    line.setAttribute('d', 'M' + pts.join(' L'));
    area.setAttribute('d', 'M0 ' + H + ' L' + pts.join(' L') + ' L' + W + ' ' + H + ' Z');
  }
  [gasto, anos, inf].forEach(function (el) { el.addEventListener('input', sim); });
  gasto.addEventListener('blur', function () { formatField(gasto); });
  sim();

  /* ---------- 5. Entrada escalonada ----------
     Hijos del hero: --sd = 90 ms × índice (CSS hace la animación al cargar).
     Lo demás: solo espera lo que está fuera de la primera pantalla. */
  document.querySelectorAll('[data-seq-group]').forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (el, i) {
      el.style.setProperty('--sd', (90 * i) + 'ms');
    });
  });
  var items = [].slice.call(document.querySelectorAll('.seq'));
  if (!reduce && 'IntersectionObserver' in window) {
    items.forEach(function (el) {
      if (el.getBoundingClientRect().top > innerHeight * 0.9) el.classList.add('wait');
    });
    var io = new IntersectionObserver(function (entries) {
      // Si entran varios a la vez, se escalonan 120 ms en orden del documento
      var batch = entries.filter(function (e) { return e.isIntersecting; });
      batch.forEach(function (e, i) {
        e.target.style.setProperty('--sd', (i * 120) + 'ms');
        e.target.classList.remove('wait');
        io.unobserve(e.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { if (el.classList.contains('wait')) io.observe(el); });
  }

  /* ---------- 5b. La curva de inflación se dibuja una vez al entrar en pantalla ---------- */
  var curve = document.getElementById('curve');
  if (!reduce && 'IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { curve.classList.add('drawn'); co.disconnect(); }
    }, { threshold: 0.5 });
    co.observe(curve);
  } else curve.classList.add('drawn');

  /* ---------- 6. Botón flotante ----------
     Aparece cuando el botón del hero sale de pantalla y se oculta en el footer. */
  if ('IntersectionObserver' in window) {
    var heroBtn = document.querySelector('.btn-wa');
    var footer = document.getElementById('contacto');
    var heroVisible = true, footVisible = false;
    var update = function () { floatWa.classList.toggle('off', heroVisible || footVisible); };
    new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; update(); }).observe(heroBtn);
    new IntersectionObserver(function (e) { footVisible = e[0].isIntersecting; update(); }, { threshold: 0.1 }).observe(footer);
    update();
  }
})();
