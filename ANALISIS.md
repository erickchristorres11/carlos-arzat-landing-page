# Paso 1 — Análisis de los sitios de referencia

Proyecto: landing personal de **Carlos Geovanny Arzat Torres**, asesor patrimonial.
Fecha: 4 nov 2026.

---

## 0. Qué había en la carpeta `ejemplo/`

| Archivo | Qué es realmente |
|---|---|
| `ejemplo-estructura/view-source_…dinesh-revunuru.html` | Vista "view-source" guardada de `https://dineshrevunuru.com/` (Next.js 16 + Turbopack + Tailwind v4). Extraje el HTML real de las celdas `line-content`. |
| `ejemplo-estructura/*.png` (2) | Hero (tarjeta + retrato que sobresale) y grid de tarjetas de proyecto con colores pastel. |
| `ejemplo-Alianz/view-source_…allianzoptimaxxplus….html` | Vista "view-source" de `https://networth.mx/allianzoptimaxxplus` (React 18 UMD sin build + Tailwind 3.4 precompilado inline). |
| `ejemplo-Alianz/*.png` (3) | Bloque de título + chips, tabla "Información institucional", tarjetas reto/alternativa, formulario y botones flotantes. |

Descargué completos los 2 CSS y los 11 chunks JS de dineshrevunuru.com (≈ 800 KB). El sitio de netWorth no enlaza CSS/JS propios: todo está inline (≈ 23 KB de Tailwind + 211 KB de JSX compilado), además de React/ReactDOM desde unpkg.

**No hay assets del cliente en el proyecto** (foto de Carlos, logotipo, logos de aseguradoras). Ver §5.

---

## 1. Librerías detectadas

| | dineshrevunuru.com | networth.mx |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) + React | React 18.3.1 UMD (unpkg), sin bundler |
| CSS | Tailwind v4 + CSS propio (tokens en `:root`) | Tailwind v3.4.13 precompilado + `<style>` propio |
| Fuentes | `next/font`: **Playfair Display** (serif) + **Poppins** | **Poppins** 400–800 (Google Fonts) |
| Animación | **Ninguna librería** (sin GSAP, ScrollTrigger, Lenis ni Framer Motion). `IntersectionObserver` + transiciones CSS + `requestAnimationFrame` | **Ninguna librería**. Transiciones Tailwind + `IntersectionObserver` |
| Otros | Web Audio API (sonido del "bubble wrap"), Canvas (aurora del banner "Lorem") | Calendly, GTM/GA4, localStorage para métricas |

Conclusión: "usar las mismas librerías" significa **HTML + CSS + JavaScript sin dependencias**. No hace falta GSAP ni Lenis; meterlos añadiría peso sin reproducir nada que los originales hagan.

---

## 2. Efectos visuales y su implementación

### dineshrevunuru.com (estructura)

1. **Entrada escalonada `.seq`** (el efecto principal)
   - CSS: `.seq{opacity:0; transform:translateY(30px); transition: opacity 1s, transform 1s cubic-bezier(.16,1,.3,1); transition-delay: var(--sd)}` y `.seq.in{opacity:1; transform:none}`. Envuelto en `@media (prefers-reduced-motion: no-preference)`.
   - JS: a los hijos de cada `[data-seq-group]` les asigna `--sd = 90ms × índice`. Lo que ya está en pantalla al cargar (top < 90 % del viewport) entra de inmediato; el resto lo vigila un `IntersectionObserver` (`threshold .1`, `rootMargin 0 0 -8% 0`) y, si entran varios a la vez, los reordena por posición en el DOM y los escalona a 140 ms.
   - Clase `html.seq-restore` para no re-animar al volver con "atrás".
2. **Retrato que rompe la tarjeta del hero**: `.hero-card` (fondo `#fcf9f8`, radio 24 px, alto 440 px) y `.hero-portrait` en `position:absolute; top:-22px; right:60px; height:462px` con PNG recortado (`object-fit:contain; object-position:bottom`). La cabeza sobresale por arriba de la tarjeta.
3. **Tarjetas de proyecto pastel**: cada `.project-card` tiene su par de tokens `--color-card-X-bg / -ink` (fondo pastel + título y texto del mismo tono saturado). Hover: `translateY(-4px)` en .3 s; la imagen interna escala a 1.02 en 500 ms. La imagen "sangra" fuera del padding con márgenes negativos (`.thumb-tall`, `.thumb-wide`).
4. **Flecha de CTA `.warrow`**: `→` que se desplaza 4 px al hacer hover sobre el grupo, `cubic-bezier(.2,.7,.2,1)`.
5. **Tarjetas "fun" (enterprise)**: grid de 4, fondo `#e0eefd`, radio 12 px, hover `-2px` + `box-shadow 0 6px 20px #0000000f`.
6. **Nav que se transforma en píldora** (solo en case studies): variable `--m` 0→1 según scroll que interpola ancho, padding, fondo y sombra vía `calc()`.
7. **Footer azul + "bubble wrap"**: footer `#1c7cf5` con nombre grande, correo, teléfono y redes en mayúsculas espaciadas. Debajo, una franja de burbujas hechas con gradientes cónicos/radiales que se "revientan" al clic con un sonido sintetizado (Web Audio: ruido blanco con envolvente). Es un guiño lúdico; **no lo recomiendo para un asesor financiero**.
8. Banner "Lorem" (asistente de voz) con aurora en canvas: no aplica a este proyecto.

### networth.mx/allianzoptimaxxplus (fuente, color, patrón de asesor)

1. **Header sticky que se oculta al bajar**: guarda `lastScrollY`; si baja y pasó 100 px aplica `-translate-y-full`, si sube vuelve a `translate-y-0` (300 ms). Fondo `bg-white/95` + `backdrop-blur-lg` (efecto vidrio).
2. **Franja superior** azul oscuro con el producto/credencial.
3. **Chips** redondeados (`rounded-full`, borde gris, `shadow-sm`) bajo el título.
4. **Tabla "Información institucional"**: cabecera azul oscuro `#002269` con radio superior y 4 celdas con etiqueta en mayúsculas gris + valor en negrita azul.
5. **Tarjetas reto vs. alternativa**: fondo `red-50` con borde izquierdo rojo de 4 px e íconos ✕, frente a fondo `#eef5ff` con borde izquierdo azul e íconos ✓.
6. **Gráfica de barras animada**: barras con `transition: height 1.5s ease-out` que pasan de 0 % a su altura cuando un observer marca `visible`.
7. **Botones flotantes** (`fixed bottom-6 right-6`): "Llama ahora" (azul oscuro), "Agendar cita" (verde `#16a34a`), "Solicitar proyección" (azul). Se esconden mientras el formulario está en pantalla (`IntersectionObserver` sobre `#lead-form`). En móvil se convierten en barra fija inferior con `backdrop-blur`.
8. **FAQ con `<details>`**: el ícono rota 180° con `group-open:rotate-180`.
9. **Slider personalizado** (`.nw-range`) con relleno de progreso vía `--range-progress`.
10. `scroll-behavior: smooth` en `html`. Sombras grandes `0 20px 50px rgba(0,0,0,.15)` para el formulario.

---

## 3. Sistema de diseño propuesto (combinación)

**Regla de mezcla:** estructura y ritmo de Dinesh (hero en tarjeta con retrato saliente, tarjetas pastel por servicio, grid de 4 tarjetas, footer azul con datos de contacto) + tipografía, colores y patrones de confianza de Allianz/netWorth (franja superior, tabla institucional, reto/propuesta, pasos numerados, botones flotantes).

### Color
| Token | Valor | Origen | Uso |
|---|---|---|---|
| `--navy` | `#002269` | Allianz dark blue | Títulos, footer, cabecera de tabla, franja superior |
| `--blue` | `#0033a0` | Allianz brand blue | Botón primario, acento de profesión, ✓ |
| `--teal` | `#00afb9` | Allianz teal | Punto del logo, detalles, hover de enlaces |
| `--soft` | `#eef5ff` | Allianz soft blue | Fondo del hero y tarjeta "propuesta" |
| `--gray-bg` | `#f4f7fb` | Allianz light gray | Bandas alternas de sección |
| `--ink` | `#333333` | Allianz dark gray | Texto corrido |
| `--green` | `#16a34a` | Botón "Agendar cita" | WhatsApp / CTA de conversión |
| `--red` | `#991b1b` / `#fef2f2` | Tarjeta "reto" | Solo semántico |

Pastel por pilar (estilo `--color-card-*` de Dinesh, en la gama Allianz):
Finanzas personales `#eef5ff / #0033a0` · Retiro `#e3f6f7 / #00737a` · Previsión `#eaeefb / #002269`.

### Tipografía
Solo **Poppins** (400/500/600/700/800). Escala tomada de Dinesh adaptada:
hero 52/56 px 800 · subtítulo hero 40/44 px 700 · título de tarjeta 30/38 px 700 · sección 30 px 700 · cuerpo grande 18/28 · cuerpo 15/24 · etiqueta 12 px mayúsculas +0.08em.

### Forma y profundidad
Radios: 24 px (hero), 16 px (tarjetas), 12 px (tarjetas chicas), 999 px (chips y botones flotantes).
Sombras: `0 1px 2px rgba(0,0,0,.05)` (chips) · `0 6px 20px rgba(0,0,0,.06)` (hover) · `0 20px 50px rgba(0,34,105,.15)` (tarjeta de contacto).

### Movimiento
Easing de entrada `cubic-bezier(.16,1,.3,1)`, 1 s, escalón de 90 ms. Hover de tarjetas 300 ms. Header oculto 300 ms. Barras 1.5 s ease-out. Todo desactivado con `prefers-reduced-motion`.

### Layout
Contenedor 1440 px con padding lateral 100 px (24 px en móvil). Grid de servicios 3 columnas → 1. Hero `1.2fr 1fr` → apilado en < 1024 px con retrato arriba.

---

## 4. Mapa de secciones de la landing

| # | Sección | Patrón tomado de |
|---|---|---|
| 0 | Franja superior: "Asesor certificado CNSF · C371460" | Allianz (top bar) |
| 1 | Header sticky con logo "CA." y enlaces, se oculta al bajar | Dinesh (nav) + Allianz (comportamiento) |
| 2 | Hero: "Hola, soy Carlos Arzat", profesión, lema, chips de credenciales, CTAs, retrato saliente | Dinesh (hero-card) + Allianz (chips) |
| 3 | Tabla de credenciales: Actuaría 12355703 · CNSF C371460 · 6 años · +$10 MDP | Allianz (información institucional) |
| 4 | Sobre mí: filosofía, propósito, reto vs. propuesta | Allianz (reto/alternativa) |
| 5 | Lado humano: 4 tarjetas (familia, ajedrez, Chivas, música) | Dinesh (fun-cards) |
| 6 | Servicios: 3 tarjetas pastel con visual propio (barra 50/30/20, proyección de retiro, escudo) | Dinesh (project-cards) |
| 7 | Metodología: 3 pasos numerados | Allianz (proceso 1-2-3) |
| 8 | Aliados: Allianz, AXA, Mapfre | Dinesh (logos enterprise) |
| 9 | Contacto + footer azul oscuro | Dinesh (footer) en paleta Allianz |
| — | Botones flotantes WhatsApp / Llamar | Allianz |

---

## 5. Assets necesarios (pendientes del cliente)

1. **Foto de Carlos** en PNG con fondo transparente, de la cintura hacia arriba, mínimo 1200 × 1500 px. Es la pieza que hace funcionar el efecto del retrato que sobresale.
2. **Logotipos de Allianz, AXA y Mapfre** en SVG o PNG (versión monocroma de preferencia). Conviene confirmar que Carlos tiene permiso de cada aseguradora para mostrarlos (Allianz, por ejemplo, entrega un distintivo de "distribuidor autorizado").
3. **URLs reales** de Facebook e Instagram ("Carlos Arzat – Asesoría Patrimonial").
4. Opcional: favicon/monograma, imagen para Open Graph (1200 × 630), aviso de privacidad (obligatorio si luego se agrega un formulario que recoja datos).

Mientras no lleguen, la maqueta usa un retrato ilustrado y los nombres de las aseguradoras como texto.

---

## 6. Puntos a validar antes del Paso 2

- ¿Fuente única Poppins (como Allianz) o mantener el contraste serif + sans de Dinesh con Playfair Display solo en el saludo?
- ¿Se incluye formulario (como netWorth) o solo WhatsApp/correo? Un formulario necesita destino (Formspree, correo, CRM) y aviso de privacidad.
- ¿Se descarta la franja "bubble wrap"? (recomendación: sí).
- Texto del lema de filosofía: el original dice "Creo firmemente que vida solo una…"; propongo corregirlo a "Creo firmemente que la vida es solo una…".
