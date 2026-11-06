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

  /* ---------- 1. Video de presentación ----------
     Botón propio para reproducir; al empezar aparecen los controles nativos. */
  var video = document.getElementById('hero-video');
  var frame = video.parentNode;
  document.getElementById('iv-play').addEventListener('click', function () {
    video.controls = true;
    video.play();
  });
  video.addEventListener('play', function () { frame.classList.add('playing'); });
  video.addEventListener('ended', function () { frame.classList.remove('playing'); video.controls = false; });
  video.addEventListener('loadedmetadata', function () {
    var t = Math.round(video.duration);
    if (t) document.getElementById('iv-dur').textContent = '· ' + Math.floor(t / 60) + ':' + ('0' + t % 60).slice(-2);
  });

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

  /* Pinta el relleno de un slider y devuelve su valor numérico */
  function fill(range) {
    var p = (range.value - range.min) / (range.max - range.min) * 100;
    range.style.setProperty('--p', p + '%');
    return +range.value;
  }
  var $ = function (id) { return document.getElementById(id); };
  var pct = function (n) { return (+n).toFixed(1) + ' %'; };
  var anosTxt = function (n) { return n === 1 ? '1 año' : n + ' años'; };

  /* Liga campos y sliders a una función de cálculo */
  function bind(ids, fn) {
    ids.forEach(function (id) {
      var el = $(id);
      el.addEventListener('input', fn);
      if (el.type === 'text') el.addEventListener('blur', function () { formatField(el); });
    });
    fn();
  }

  /* ---------- 3. Proyección de Afore + PPR ----------
     Todo en pesos de hoy con rendimientos reales (ya sin inflación).
     Valor futuro = saldo × (1 + r)^n + aportación × [(1 + r_m)^(12n) − 1] / r_m,
     con r_m = (1 + r)^(1/12) − 1 (capitalización mensual). */
  function fv(saldo, mensual, r, years) {
    var rm = Math.pow(1 + r, 1 / 12) - 1, m = years * 12;
    var crece = Math.pow(1 + rm, m);
    return saldo * crece + (rm ? mensual * (crece - 1) / rm : mensual * m);
  }

  var edad = $('edad'), edadRet = $('retiro-edad');
  function retiro() {
    var e = fill(edad), er = fill(edadRet);
    // La edad de retiro nunca queda por debajo de la edad actual + 1
    if (er <= e) { er = Math.min(70, e + 1); edadRet.value = er; fill(edadRet); }
    var n = Math.max(1, er - e);
    var saldo = readMoney($('afore-saldo')), apoA = readMoney($('afore-apo'));
    var rA = fill($('afore-r')) / 100, apoP = fill($('ppr-apo')), rP = fill($('ppr-r')) / 100;

    var afore = fv(saldo, apoA, rA, n), ppr = fv(0, apoP, rP, n), total = afore + ppr;

    $('o-edad').textContent = anosTxt(e);
    $('o-retiro').textContent = anosTxt(er);
    $('o-afore-r').textContent = pct(rA * 100);
    $('o-ppr').textContent = money(apoP);
    $('o-ppr-r').textContent = pct(rP * 100);
    $('r-edad-fin').textContent = er;
    $('r-total').textContent = money(total);
    $('r-anos').textContent = anosTxt(n);
    $('r-afore').textContent = money(afore);
    $('r-ppr').textContent = money(ppr);
    $('r-mes').textContent = money(total / 240);
    $('ch-end').textContent = er + ' años';

    // Gráfica apilada año con año
    var W = 320, H = 120, top = Math.max(total, 1), ptsA = [], ptsT = [];
    for (var i = 0; i <= n; i++) {
      var x = (i / n * W).toFixed(1);
      var a = fv(saldo, apoA, rA, i), t = a + fv(0, apoP, rP, i);
      ptsA.push(x + ' ' + (H - a / top * (H - 4)).toFixed(1));
      ptsT.push(x + ' ' + (H - t / top * (H - 4)).toFixed(1));
    }
    $('ch-afore').setAttribute('d', 'M0 ' + H + ' L' + ptsA.join(' L') + ' L' + W + ' ' + H + ' Z');
    $('ch-ppr').setAttribute('d', 'M' + ptsT.join(' L') + ' L' + ptsA.slice().reverse().join(' L') + ' Z');

    $('ret-wa').href = WA + encodeURIComponent(
      'Hola Carlos, hice la proyección de retiro: tengo ' + e + ' años, quiero retirarme a los ' + er +
      ' y me gustaría revisar mi Afore y un PPR de ' + money(apoP) + ' al mes.');
  }
  bind(['edad', 'retiro-edad', 'afore-saldo', 'afore-apo', 'afore-r', 'ppr-apo', 'ppr-r'], retiro);

  /* ---------- 4. Suma asegurada por método de necesidades ----------
     Suma = ingreso mensual × 12 × años + deudas + educación + gastos finales − lo que ya tienes. */
  function proteccion() {
    var ing = readMoney($('pro-ingreso')), anos = fill($('pro-anos'));
    var cIng = ing * 12 * anos, cDeu = readMoney($('pro-deudas')), cEdu = readMoney($('pro-edu'));
    var cFin = readMoney($('pro-finales')), tienes = readMoney($('pro-tienes'));
    var bruto = cIng + cDeu + cEdu + cFin, total = Math.max(0, bruto - tienes);

    $('o-pro-anos').textContent = anosTxt(anos);
    $('p-total').textContent = money(total);
    var veces = ing ? total / (ing * 12) : 0;
    var vr = veces >= 10 ? Math.round(veces) : Math.round(veces * 10) / 10;
    $('p-veces').textContent = vr + (vr === 1 ? ' año' : ' años');
    $('p-ing').textContent = money(cIng);
    $('p-deu').textContent = money(cDeu);
    $('p-edu').textContent = money(cEdu);
    $('p-fin').textContent = money(cFin);
    $('p-tienes').textContent = money(tienes);

    // Barra de composición proporcional a cada necesidad
    var parts = $('pro-bar').children, vals = [cIng, cDeu, cEdu, cFin];
    for (var i = 0; i < parts.length; i++) parts[i].style.flex = (bruto ? vals[i] / bruto : 0) + ' 1 0';

    $('pro-wa').href = WA + encodeURIComponent(
      'Hola Carlos, calculé una suma asegurada de ' + money(total) + ' y me gustaría cotizar mi protección.');
  }
  bind(['pro-ingreso', 'pro-anos', 'pro-deudas', 'pro-edu', 'pro-finales', 'pro-tienes'], proteccion);

  /* ---------- 4b. Solicitud de asesoría por correo ----------
     Se envía con FormSubmit (formsubmit.co), sin servidor propio.
     El primer envío dispara un correo de activación a LEAD_EMAIL: hay que confirmarlo
     una vez y desde entonces cada solicitud llega como tabla al correo. */
  var LEAD_EMAIL = 'erickarzat11@gmail.com'; // correo de prueba; cambiar por el de Carlos
  var form = $('lead-form');
  var submitBtn = $('lf-submit'), status = $('lf-status');
  var ingresosSel = $('lf-ingresos'), warn = $('lf-warn');

  function fieldBox(el) { return el.closest('.lf'); }
  function setError(el, msg) {
    var box = fieldBox(el), err = box && box.querySelector('.lf-err');
    if (!box) return;
    box.classList.toggle('invalid', !!msg);
    if (err) err.textContent = msg || '';
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  /* Reglas de cada campo; devuelve el mensaje de error o '' */
  var rules = {
    nombre: function (v) { return v.trim().split(/\s+/).length < 2 ? 'Escribe tu nombre y al menos un apellido.' : ''; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Revisa tu correo, por ejemplo nombre@correo.com.'; },
    edad: function (v) { var n = +v; return v && n >= 18 && n <= 65 ? '' : 'La edad debe estar entre 18 y 65 años.'; },
    profesion: function (v) { return v.trim().length >= 3 ? '' : 'Escribe tu profesión u ocupación.'; },
    telefono: function (v) { return v.replace(/\D/g, '').length === 10 ? '' : 'Escribe tu número a 10 dígitos.'; },
    ingresos: function (v) { return v ? '' : 'Selecciona tu rango de ingresos.'; }
  };
  function check(el) {
    var rule = rules[el.name];
    if (!rule) return true;
    var msg = rule(el.value);
    setError(el, msg);
    return !msg;
  }

  // Valida al salir del campo, y corrige en vivo cuando ya tenía error
  Object.keys(rules).forEach(function (name) {
    var el = form.elements[name];
    el.addEventListener('blur', function () { if (el.value) check(el); });
    el.addEventListener('input', function () { if (fieldBox(el).classList.contains('invalid')) check(el); });
  });

  // Teléfono: solo dígitos, agrupados 3-3-4
  var tel = form.elements.telefono;
  tel.addEventListener('input', function () {
    var d = tel.value.replace(/\D/g, '').slice(0, 10);
    tel.value = d.replace(/^(\d{3})(\d{1,3})?(\d{1,4})?$/, function (m, a, b, c) { return [a, b, c].filter(Boolean).join(' '); });
  });

  // Ingresos menores a $10,000: aviso y envío desactivado
  function lowIncome() { return ingresosSel.value === 'menos de $10,000'; }
  ingresosSel.addEventListener('change', function () {
    check(ingresosSel);
    var low = lowIncome();
    warn.hidden = !low;
    fieldBox(ingresosSel).classList.toggle('warn', low);
    submitBtn.disabled = low;
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (lowIncome()) return;

    var ok = true, first = null;
    Object.keys(rules).forEach(function (name) {
      var el = form.elements[name];
      if (!check(el)) { ok = false; first = first || el; }
    });
    var consent = form.elements.consentimiento, consentErr = form.querySelector('.lf-err-consent');
    consentErr.textContent = consent.checked ? '' : 'Necesitamos tu autorización para contactarte.';
    if (!consent.checked) { ok = false; first = first || consent; }
    if (!ok) { first.focus(); return; }
    if (form.elements._honey.value) return; // bot

    var f = form.elements;
    var data = {
      'Nombre completo': f.nombre.value.trim(),
      'Correo': f.email.value.trim(),
      'Edad': f.edad.value,
      'Profesión': f.profesion.value.trim(),
      'Teléfono': f.lada.value + ' ' + f.telefono.value,
      'Inversión mensual estimada': f.inversion.value + ' MXN',
      'Ingresos mensuales': f.ingresos.value + ' MXN',
      email: f.email.value.trim(), // FormSubmit lo usa como "responder a"
      _subject: 'Nueva solicitud de proyección de retiro: ' + f.nombre.value.trim(),
      _template: 'table',
      _captcha: 'false'
    };

    submitBtn.setAttribute('aria-busy', 'true');
    submitBtn.textContent = 'Enviando…';
    status.className = 'lf-status';
    status.textContent = '';

    fetch('https://formsubmit.co/ajax/' + LEAD_EMAIL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok || j.success === 'false' || j.success === false) throw j; return j; }); })
      .then(function () {
        form.reset();
        warn.hidden = true;
        status.className = 'lf-status ok';
        status.textContent = 'Listo, ' + data['Nombre completo'].split(' ')[0] + '. Recibí tu solicitud y te escribo por WhatsApp para agendar.';
      })
      .catch(function (err) {
        // FormSubmit responde success:false con un mensaje; lo dejamos en la consola para diagnosticar
        var msg = (err && err.message) ? String(err.message) : String(err || '');
        if (window.console) console.warn('FormSubmit:', err);
        status.className = 'lf-status bad';
        if (/activat/i.test(msg)) {
          // Primer envío: FormSubmit mandó el correo de activación a LEAD_EMAIL
          status.textContent = 'Formulario pendiente de activación: revisa la bandeja de ' + LEAD_EMAIL + ' (y spam), confirma el correo de FormSubmit y vuelve a enviar.';
          return;
        }
        if (location.protocol === 'file:' || /web server/i.test(msg)) {
          status.textContent = 'El formulario solo funciona con la página publicada o servida desde un servidor web, no abriendo el archivo directamente.';
          return;
        }
        status.innerHTML = 'No pudimos enviar tu solicitud. Inténtalo de nuevo o escríbeme directo por <a href="https://wa.me/529991392123" target="_blank" rel="noopener">WhatsApp</a>.';
      })
      .then(function () {
        submitBtn.removeAttribute('aria-busy');
        submitBtn.textContent = 'Solicitar mi proyección';
      });
  });

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

  /* ---------- 6. Agenda y botones de acción ----------
     AGENDA_URL: liga de la agenda de Carlos (Calendly, Google Calendar, etc.).
     Mientras esté vacía, "Agenda cita" abre WhatsApp con un mensaje para agendar. */
  var AGENDA_URL = '';
  var agendaHref = AGENDA_URL || WA + encodeURIComponent('Hola Carlos, quiero agendar una cita para mi asesoría.');
  document.querySelectorAll('[data-agenda]').forEach(function (a) {
    a.href = agendaHref;
    a.target = '_blank';
    a.rel = 'noopener';
  });

  // La barra aparece cuando el botón del hero sale de pantalla y se oculta en la sección de contacto y el footer
  if ('IntersectionObserver' in window) {
    var bar = document.getElementById('actions');
    var heroBtn = document.querySelector('.btn-wa');
    var zones = [document.getElementById('contacto-opciones'), document.getElementById('contacto')];
    var heroVisible = true, zoneVisible = {};
    var update = function () {
      var inZone = Object.keys(zoneVisible).some(function (k) { return zoneVisible[k]; });
      bar.classList.toggle('off', heroVisible || inZone);
    };
    new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; update(); }).observe(heroBtn);
    zones.forEach(function (z) {
      new IntersectionObserver(function (e) { zoneVisible[z.id] = e[0].isIntersecting; update(); }, { threshold: 0.05 }).observe(z);
    });
    update();
  }
})();
