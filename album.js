/* ============================================================
   album.js · NO necesitas tocar este archivo.
   Lee los datos que pusiste en el archivo de cada cumpleaños
   (la etiqueta <body data-...>), arma la página y la conecta a
   Supabase: guarda las fotos en la nube y las muestra en vivo.

   Usa solo la clave PÚBLICA de Supabase (la "publishable").
   Esa clave puede verla cualquiera; lo que protege tus datos son
   las reglas que creó crear-todo.sql, no esconder la clave.
   ============================================================ */
(function () {
  'use strict'

  var TABLA = 'album_fotos'
  var CARPETA = 'album'                  // nombre de la carpeta (bucket) en Storage
  var TIPOS = ['image/jpeg', 'image/png', 'image/webp']
  var MAX_ORIGINAL = 12 * 1024 * 1024    // foto original del teléfono: máx. 12 MB (luego se reduce)
  var MAX_ENVIO = 3 * 1024 * 1024        // lo que realmente se sube: máx. 3 MB (igual que la carpeta)
  var SLUG_RE = /^[a-z0-9][a-z0-9-]{1,40}$/
  var COLOR_RE = /^#[0-9a-f]{6}$/i

  var D = document.body.dataset         // los datos del cumpleaños
  var CFG = window.SUPABASE_CONFIG || {}
  var slug = String(D.evento || '').toLowerCase()

  // ---------- Pequeñas utilidades ----------
  function el(tag, cls, text) {
    var n = document.createElement(tag)
    if (cls) n.className = cls
    if (text) n.textContent = text
    return n
  }
  function $(id) { return document.getElementById(id) }
  function rgb(h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16) }) }
  function mezclar(a, b, t) {            // mezcla el color a con el color b (t = cuánto de b, 0 a 1)
    var x = rgb(a), y = rgb(b)
    return '#' + x.map(function (v, i) { return ('0' + Math.round(v + (y[i] - v) * t).toString(16)).slice(-2) }).join('')
  }

  // ---------- Colores (de los data-color-... del archivo) ----------
  function color(nombre, porDefecto) { return COLOR_RE.test(D[nombre] || '') ? D[nombre] : porDefecto }
  var P = color('colorPrincipal', '#c8431c')   // botones y títulos
  var A = color('colorAcento', '#d9588a')      // detalles (rosa)
  var F = color('colorFondo', '#fbe4ea')       // fondo de la página
  var S = color('colorFranjas', '#f9d9a8')     // franjas de arriba
  var R = color('colorRotulo', '#f3cdd5')      // óvalo con el nombre
  var N = color('colorNombre', P)              // color del nombre
  var raiz = document.documentElement.style
  raiz.setProperty('--green-900', P)
  raiz.setProperty('--green-800', mezclar(P, '#000000', 0.12))
  raiz.setProperty('--green-700', mezclar(P, '#000000', 0.22))
  raiz.setProperty('--gold', A)
  raiz.setProperty('--gold-soft', mezclar(A, '#ffffff', 0.65))
  raiz.setProperty('--cream', F)
  raiz.setProperty('--cream-2', mezclar(F, A, 0.14))
  raiz.setProperty('--peach', S)
  raiz.setProperty('--pink', R)
  raiz.setProperty('--rotulo-borde', mezclar(R, '#ffffff', 0.6))
  raiz.setProperty('--rotulo-linea', mezclar(R, A, 0.35))
  raiz.setProperty('--nombre', N)

  // ---------- Letra bonita (si no carga, se usa otra parecida) ----------
  var fuente = el('link')
  fuente.rel = 'stylesheet'
  fuente.href = 'https://fonts.googleapis.com/css2?family=Kaushan+Script&display=swap'
  document.head.appendChild(fuente)

  // ---------- Stickers (dibujos con borde blanco) ----------
  function petalos(relleno, extra) {
    var s = ''
    for (var i = 0; i < 12; i++) s += '<ellipse cx="50" cy="24" rx="8.5" ry="21" fill="' + relleno + '" ' + (extra || '') + ' transform="rotate(' + (i * 30) + ' 50 50)"/>'
    return s
  }
  var gajos = ''
  for (var g = 0; g < 8; g++) gajos += '<line x1="50" y1="50" x2="50" y2="17" stroke="#ffe2b8" stroke-width="2.6" transform="rotate(' + (g * 45 + 22.5) + ' 50 50)"/>'
  var SPRITE =
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
    '<symbol id="naranja" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#fff"/><circle cx="50" cy="50" r="43" fill="#f08a24"/><circle cx="50" cy="50" r="38" fill="#ffc27a"/><circle cx="50" cy="50" r="35" fill="#ffa73d"/>' + gajos + '<circle cx="50" cy="50" r="4" fill="#ffe2b8"/></symbol>' +
    '<symbol id="margarita" viewBox="0 0 100 100">' + petalos('#fff', 'stroke="#fff" stroke-width="7"') + petalos('#e8b24a') + '<circle cx="50" cy="50" r="13" fill="#6b5a1e"/><circle cx="50" cy="50" r="7" fill="#8a7a2c"/></symbol>' +
    '<symbol id="margaritaRosa" viewBox="0 0 100 100">' + petalos('#fff', 'stroke="#fff" stroke-width="7"') + petalos('#e0679a') + '<circle cx="50" cy="50" r="12" fill="#f0a21f"/><circle cx="50" cy="50" r="6" fill="#c97a0a"/></symbol>' +
    '<symbol id="gorro" viewBox="0 0 100 100"><polygon points="50,8 90,90 10,90" fill="#fff" stroke="#fff" stroke-width="9" stroke-linejoin="round"/><polygon points="50,8 88,88 12,88" fill="#e2679b"/><g fill="#f7a8c8"><circle cx="50" cy="38" r="3"/><circle cx="42" cy="56" r="3"/><circle cx="60" cy="58" r="3"/><circle cx="34" cy="74" r="3"/><circle cx="52" cy="76" r="3"/><circle cx="68" cy="76" r="3"/></g><rect x="10" y="80" width="80" height="14" rx="7" fill="#f48fb9" stroke="#fff" stroke-width="3"/><circle cx="50" cy="9" r="9" fill="#f48fb9" stroke="#fff" stroke-width="3"/></symbol>' +
    '</defs></svg>'
  var conStickers = String(D.stickers || 'si').toLowerCase() !== 'no'
  var STICKERS = conStickers
    ? ['naranja', 'margarita', 'gorro', 'margaritaRosa', 'naranja', 'margarita'].map(function (n, i) {
        return '<svg class="sticker s' + (i + 1) + '" aria-hidden="true"><use href="#' + n + '"/></svg>'
      }).join('')
    : ''

  // ---------- La página ----------
  document.body.insertAdjacentHTML('afterbegin',
    SPRITE +
    '<main class="shell">' +
    '<header class="hero">' +
      '<div class="rotulo">' + STICKERS +
        '<h1 class="titulo"><span id="tituloNombre"></span></h1>' +
        '<p class="birthday" id="etiqueta"></p>' +
        '<p class="edad" id="edad" hidden></p>' +
      '</div>' +
      '<p class="eyebrow" id="fechaLugar"></p>' +
      '<p class="lead" id="mensaje"></p>' +
      '<div class="hero-btns" id="botonesInicio">' +
        '<a class="btn primary" href="#subir">📷 Subir mi foto</a>' +
        '<a class="btn ghost" href="#album">Ver el álbum</a>' +
      '</div>' +
    '</header>' +
    '<section id="estadoPagina" class="card estado" hidden role="status"><h2 id="estadoTitulo"></h2><p id="estadoTexto"></p></section>' +
    '<section id="subir" class="card">' +
      '<h2>Comparte tu foto</h2>' +
      '<form id="formFoto" novalidate>' +
        '<p class="trampa" aria-hidden="true"><label>No llenar: <input name="web" id="trampa" tabindex="-1" autocomplete="off" /></label></p>' +
        '<div id="paso1" class="dropzone">' +
          '<button type="button" class="btn primary big" id="btnElegir">Elegir una foto</button>' +
          '<button type="button" class="btn ghost" id="btnCamara">Tomar una foto ahora</button>' +
          '<p class="fine">JPG, PNG o WebP</p>' +
        '</div>' +
        '<input type="file" id="archivo" accept="image/jpeg,image/png,image/webp" hidden />' +
        '<input type="file" id="camara" accept="image/*" capture="environment" hidden />' +
        '<div id="paso2" hidden>' +
          '<div class="preview"><img id="previa" alt="Vista previa de tu foto" /><span>Así se verá en el álbum</span></div>' +
          '<label class="field"><span>Tu nombre</span><input type="text" id="nombre" maxlength="60" placeholder="Ej. Tía Lupita" autocomplete="name" /></label>' +
          '<label class="field"><span>Dedicatoria <em>(opcional)</em></span><textarea id="dedicatoria" rows="3" maxlength="250" placeholder="Unas palabras para el festejado…"></textarea><small class="count" id="contador">0 / 250</small></label>' +
          '<div class="btn-row">' +
            '<button type="submit" class="btn primary" id="btnEnviar">Enviar foto</button>' +
            '<button type="button" class="btn ghost" id="btnOtra">Elegir otra foto</button>' +
            '<button type="button" class="btn link" id="btnCancelar">Cancelar</button>' +
          '</div>' +
        '</div>' +
        '<p class="error" id="error" role="alert" hidden></p>' +
      '</form>' +
      '<div id="exito" class="exito" role="status" hidden>' +
        '<div class="check" aria-hidden="true">✓</div>' +
        '<h3>¡Gracias, <span id="exitoNombre"></span>!</h3><p id="exitoTexto"></p>' +
        '<div class="btn-row center"><button type="button" class="btn primary" id="btnNueva">Subir otra foto</button><a class="btn ghost" href="#album">Ver el álbum</a></div>' +
      '</div>' +
    '</section>' +
    '<section id="album">' +
      '<h2 class="titulo-seccion">El álbum de la fiesta</h2>' +
      '<p class="envivo" id="envivo" hidden><span class="punto" aria-hidden="true"></span><span id="envivoTexto">En vivo</span></p>' +
      '<div class="muro" id="muro"></div>' +
      '<div class="vacio" id="vacio" hidden><div class="vacio-marco" aria-hidden="true"></div><h3>El álbum aún está vacío</h3><p>Las fotos aparecerán aquí en cuanto se publiquen.</p></div>' +
    '</section>' +
    '<footer class="brand"><p class="brand-line">Tu celebración también puede tener su propio álbum digital.</p><p class="brand-by">Hecho por <strong>Tap Nova Studio</strong></p></footer>' +
    '</main>' +
    '<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Foto ampliada" hidden><div class="lb-card">' +
      '<button type="button" class="lb-close" id="lbCerrar" aria-label="Cerrar">×</button><img id="lbImg" alt="" />' +
      '<div class="lb-texto"><span class="p-nombre" id="lbNombre"></span><span class="p-dedic" id="lbDedic"></span><time class="p-fecha" id="lbFecha"></time></div>' +
      '<div class="lb-nav"><button type="button" class="btn ghost small" id="lbPrev">← Anterior</button><span id="lbPos"></span><button type="button" class="btn ghost small" id="lbNext">Siguiente →</button></div>' +
    '</div></div>')

  // ---------- Datos del cumpleaños (se escriben con textContent: son texto, nunca código) ----------
  var nombreFiesta = D.nombre || 'Mi fiesta'
  document.title = 'Cumpleaños de ' + nombreFiesta
  $('tituloNombre').textContent = nombreFiesta
  $('etiqueta').textContent = D.etiqueta === undefined ? 'Birthday' : D.etiqueta
  $('etiqueta').hidden = !$('etiqueta').textContent
  $('fechaLugar').textContent = [D.fecha, D.lugar].filter(Boolean).join(' · ')
  $('mensaje').textContent = D.mensaje || ''
  if (D.edad) { $('edad').textContent = String(D.edad); $('edad').hidden = false }

  // ---------- Pantallas de aviso (algo falta o falló) ----------
  function mostrarEstado(titulo, texto) {
    $('estadoTitulo').textContent = titulo
    $('estadoTexto').textContent = texto
    $('estadoPagina').hidden = false
    $('subir').hidden = true
    $('album').hidden = true
    $('botonesInicio').hidden = true
  }

  var url = String(CFG.url || '').trim().replace(/\/+$/, '')
  var clave = String(CFG.key || '').trim()
  function rolDeJwt(t) {
    try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role } catch (e) { return null }
  }
  if (!/^https:\/\/[a-z0-9.-]+\.supabase\.co$/i.test(url) || !clave || /PEGA_AQUI/i.test(url + clave)) {
    mostrarEstado('Falta conectar la base de datos', 'Abre el archivo conexion.js y pega tus dos datos de Supabase (la dirección y la clave pública). La guía te dice cómo.')
    return
  }
  if (/^sb_secret_/i.test(clave) || rolDeJwt(clave) === 'service_role') {
    console.error('Pegaste una clave SECRETA de Supabase en conexion.js. Bórrala y usa la clave PÚBLICA (publishable).')
    mostrarEstado('¡Alto! Esa clave es secreta', 'En conexion.js hay una clave SECRETA de Supabase. Bórrala ya y usa la clave pública ("publishable"). Si ya la publicaste en GitHub, cámbiala en Supabase.')
    return
  }
  if (!SLUG_RE.test(slug)) {
    mostrarEstado('Falta el nombre del evento', 'En el archivo de este cumpleaños, data-evento solo puede tener letras minúsculas, números y guiones (ejemplo: karely-34).')
    return
  }
  if (!window.supabase || !window.supabase.createClient) {
    mostrarEstado('No pudimos cargar la página', 'Revisa tu conexión a internet e intenta de nuevo.')
    return
  }

  var sb = window.supabase.createClient(url, clave, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  var fotos = {}   // id → foto
  var nodos = {}   // id → <figure>
  var orden = []   // fotos de la más nueva a la más vieja

  var fmt = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  function fecha(s) { var d = new Date(s); return isNaN(d) ? '' : fmt.format(d) }
  function urlFoto(ruta) { return sb.storage.from(CARPETA).getPublicUrl(ruta).data.publicUrl }
  var inclinaciones = [-2.2, 1.6, -1, 2.2, -1.8, 1]
  function inclinacion(id) {
    var h = 0
    for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
    return inclinaciones[h % inclinaciones.length]
  }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID()
    var b = new Uint8Array(16)
    crypto.getRandomValues(b)
    b[6] = (b[6] & 15) | 64
    b[8] = (b[8] & 63) | 128
    var h = Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2) }).join('')
    return [h.slice(0, 8), h.slice(8, 12), h.slice(12, 16), h.slice(16, 20), h.slice(20)].join('-')
  }

  // ---------- Álbum ----------
  var muro = $('muro')
  function reordenar() {
    orden = Object.keys(fotos).map(function (k) { return fotos[k] })
    orden.sort(function (a, b) { return new Date(b.creado_en) - new Date(a.creado_en) })
    $('vacio').hidden = orden.length > 0
  }
  function crearNodo(f, animar) {
    var fig = el('figure', 'polaroid' + (animar ? ' nueva' : ''))
    fig.style.setProperty('--tilt', inclinacion(f.id) + 'deg')
    var btn = el('button', 'polaroid-btn')
    btn.type = 'button'
    btn.setAttribute('aria-label', 'Ampliar foto de ' + f.nombre)
    var img = el('img')
    img.src = urlFoto(f.ruta)
    img.alt = 'Foto compartida por ' + f.nombre
    img.loading = 'lazy'
    btn.appendChild(img)
    btn.addEventListener('click', function () { abrir(f.id) })
    var cap = el('figcaption')
    cap.appendChild(el('span', 'p-nombre', f.nombre))
    if (f.dedicatoria) cap.appendChild(el('span', 'p-dedic', f.dedicatoria))
    cap.appendChild(el('time', 'p-fecha', fecha(f.creado_en)))
    fig.appendChild(btn)
    fig.appendChild(cap)
    return fig
  }
  function agregarFoto(f, animar) {
    if (!f || fotos[f.id] || f.evento_slug && f.evento_slug !== slug || f.visible === false) return
    fotos[f.id] = { id: f.id, nombre: f.nombre, dedicatoria: f.dedicatoria, ruta: f.ruta, creado_en: f.creado_en }
    reordenar()
    var nodo = crearNodo(fotos[f.id], animar)
    nodos[f.id] = nodo
    var idx = orden.findIndex(function (x) { return x.id === f.id })
    var siguiente = orden[idx + 1] && nodos[orden[idx + 1].id]
    muro.insertBefore(nodo, siguiente || null)
  }
  function quitarFoto(id) {
    if (!fotos[id]) return
    if (nodos[id] && nodos[id].parentNode) nodos[id].parentNode.removeChild(nodos[id])
    delete fotos[id]
    delete nodos[id]
    reordenar()
    if (!lb.hidden) { if (orden.length === 0) cerrar(); else if (actualId === id) mostrar(Math.min(actualIdx, orden.length - 1)) }
  }

  // Pide la lista oficial y deja la pantalla igual a ella. Sirve de respaldo si el
  // "en vivo" se cae, y para quitar las fotos que tú escondiste o borraste.
  // (Las reglas de la base de datos ya filtran: solo llegan las fotos visibles.)
  var primeraCarga = true
  function sincronizar() {
    return sb.from(TABLA)
      .select('id,evento_slug,nombre,dedicatoria,ruta,creado_en')
      .eq('evento_slug', slug)
      .order('creado_en', { ascending: false }).limit(300)
      .then(function (r) {
        if (r.error) throw r.error
        var vigentes = {}
        r.data.forEach(function (f) { vigentes[f.id] = true })
        Object.keys(fotos).forEach(function (id) { if (!vigentes[id]) quitarFoto(id) })
        r.data.slice().reverse().forEach(function (f) { agregarFoto(f, !primeraCarga) })
        primeraCarga = false
        $('vacio').hidden = Object.keys(fotos).length > 0
        return true
      })
      .catch(function (e) { console.error('No se pudo actualizar el álbum', e); return false })
  }

  // ---------- En vivo: las fotos nuevas aparecen solas ----------
  function enVivo(texto, ok) {
    $('envivo').hidden = false
    $('envivo').className = 'envivo' + (ok ? '' : ' off')
    $('envivoTexto').textContent = texto
  }
  var yaConectado = false
  function iniciarEnVivo() {
    var filtro = 'evento_slug=eq.' + slug
    sb.channel('album-' + slug)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLA, filter: filtro }, function (p) { agregarFoto(p.new, true) })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: TABLA, filter: filtro }, function (p) {
        if (p.new.visible) agregarFoto(p.new, true); else quitarFoto(p.new.id)
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: TABLA }, function (p) { if (p.old && p.old.id) quitarFoto(p.old.id) })
      .subscribe(function (estado) {
        if (estado === 'SUBSCRIBED') {
          enVivo('En vivo', true)
          if (yaConectado) sincronizar()
          yaConectado = true
        } else if (estado === 'CHANNEL_ERROR' || estado === 'TIMED_OUT' || estado === 'CLOSED') {
          enVivo('Reconectando…', false)
        }
      })
  }
  setInterval(function () { if (!document.hidden) sincronizar() }, 30000)
  document.addEventListener('visibilitychange', function () { if (!document.hidden) sincronizar() })

  // ---------- Foto ampliada ----------
  var lb = $('lightbox')
  var actualIdx = 0
  var actualId = ''
  function mostrar(i) {
    actualIdx = i
    var f = orden[i]
    if (!f) return
    actualId = f.id
    $('lbImg').src = urlFoto(f.ruta)
    $('lbImg').alt = 'Foto compartida por ' + f.nombre
    $('lbNombre').textContent = f.nombre
    $('lbDedic').textContent = f.dedicatoria || ''
    $('lbFecha').textContent = fecha(f.creado_en)
    $('lbPos').textContent = (i + 1) + ' / ' + orden.length
    $('lbPrev').disabled = i === 0
    $('lbNext').disabled = i === orden.length - 1
  }
  function abrir(id) {
    var i = orden.findIndex(function (x) { return x.id === id })
    if (i < 0) return
    mostrar(i); lb.hidden = false; document.body.classList.add('no-scroll')
  }
  function cerrar() { lb.hidden = true; document.body.classList.remove('no-scroll') }
  $('lbCerrar').addEventListener('click', cerrar)
  lb.addEventListener('click', function (e) { if (e.target === lb) cerrar() })
  $('lbPrev').addEventListener('click', function () { if (actualIdx > 0) mostrar(actualIdx - 1) })
  $('lbNext').addEventListener('click', function () { if (actualIdx < orden.length - 1) mostrar(actualIdx + 1) })
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return
    if (e.key === 'Escape') cerrar()
    if (e.key === 'ArrowLeft' && actualIdx > 0) mostrar(actualIdx - 1)
    if (e.key === 'ArrowRight' && actualIdx < orden.length - 1) mostrar(actualIdx + 1)
  })

  // ---------- Subir una foto ----------
  var form = $('formFoto')
  var inputArchivo = $('archivo')
  var inputCamara = $('camara')
  var archivoElegido = null
  var urlPrevia = ''

  function mostrarError(msg) { var e = $('error'); e.textContent = msg; e.hidden = !msg }
  function paso(n) { $('paso1').hidden = n !== 1; $('paso2').hidden = n !== 2 }
  function reiniciar() {
    archivoElegido = null
    if (urlPrevia) URL.revokeObjectURL(urlPrevia)
    urlPrevia = ''
    inputArchivo.value = ''
    inputCamara.value = ''
    $('nombre').value = ''
    $('dedicatoria').value = ''
    $('contador').textContent = '0 / 250'
    mostrarError('')
    paso(1)
    form.hidden = false
    $('exito').hidden = true
  }
  function elegida(f) {
    if (!f) return
    if (TIPOS.indexOf(f.type) === -1) return mostrarError('Ese formato no está permitido. Usa una foto JPG, PNG o WebP.')
    if (f.size > MAX_ORIGINAL) return mostrarError('La foto pesa más de 12 MB. Elige otra o tómala de nuevo.')
    mostrarError('')
    archivoElegido = f
    if (urlPrevia) URL.revokeObjectURL(urlPrevia)
    urlPrevia = URL.createObjectURL(f)
    $('previa').src = urlPrevia
    paso(2)
  }
  $('btnElegir').addEventListener('click', function () { inputArchivo.click() })
  $('btnCamara').addEventListener('click', function () { inputCamara.click() })
  inputArchivo.addEventListener('change', function () { elegida(inputArchivo.files[0]) })
  inputCamara.addEventListener('change', function () { elegida(inputCamara.files[0]) })
  $('btnOtra').addEventListener('click', function () {
    archivoElegido = null
    inputArchivo.value = ''
    inputCamara.value = ''
    mostrarError('')
    paso(1)
  })
  $('btnCancelar').addEventListener('click', reiniciar)
  $('btnNueva').addEventListener('click', reiniciar)
  $('dedicatoria').addEventListener('input', function (e) { $('contador').textContent = e.target.value.length + ' / 250' })

  // Reduce la foto a ~1100 px y la convierte a JPEG (ahorra datos y espacio).
  function reducir(file) {
    return new Promise(function (resolve, reject) {
      var u = URL.createObjectURL(file)
      var img = new Image()
      img.onload = function () {
        var k = Math.min(1, 1100 / Math.max(img.naturalWidth, img.naturalHeight))
        var w = Math.max(1, Math.round(img.naturalWidth * k))
        var h = Math.max(1, Math.round(img.naturalHeight * k))
        var c = document.createElement('canvas')
        c.width = w; c.height = h
        var ctx = c.getContext('2d')
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
        URL.revokeObjectURL(u)
        c.toBlob(function (b) { b ? resolve(b) : reject(new Error('blob')) }, 'image/jpeg', 0.82)
      }
      img.onerror = function () { URL.revokeObjectURL(u); reject(new Error('No se pudo leer la imagen')) }
      img.src = u
    })
  }

  function mensajeError(err) {
    var m = String(err && err.message || '').toLowerCase()
    if (!navigator.onLine) return 'Parece que no tienes internet. Revisa tu conexión e inténtalo de nuevo.'
    if (m.indexOf('límite') > -1) return 'Este álbum ya alcanzó su límite de fotos.'
    if (m.indexOf('exceeded') > -1 || m.indexOf('too large') > -1 || m.indexOf('maximum allowed') > -1) return 'La foto es demasiado grande. Elige otra.'
    if (m.indexOf('mime') > -1) return 'Ese formato de imagen no está permitido.'
    return 'No pudimos enviar tu foto. Inténtalo de nuevo en unos segundos.'
  }

  // 1) sube el archivo a la carpeta en la nube; 2) anota la foto en la tabla.
  function enviar(blob, nombre, dedicatoria) {
    var ruta = slug + '/' + uuid() + '.jpg'
    return sb.storage.from(CARPETA).upload(ruta, blob, { contentType: 'image/jpeg', upsert: false, cacheControl: '31536000' })
      .then(function (r) {
        if (r.error) throw r.error
        return sb.from(TABLA).insert({ evento_slug: slug, nombre: nombre, dedicatoria: dedicatoria, ruta: ruta })
      })
      .then(function (r) { if (r.error) throw r.error; return ruta })
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault()
    var nombre = $('nombre').value.trim()
    var dedic = $('dedicatoria').value.trim()
    if (!archivoElegido) return mostrarError('Primero elige una foto.')
    if (!nombre) return mostrarError('Escribe tu nombre para que sepamos quién la compartió.')
    mostrarError('')
    var btn = $('btnEnviar')
    btn.disabled = true
    btn.textContent = 'Enviando…'

    var falsoExito = !!$('trampa').value   // un robot llenó el campo oculto: fingimos éxito y no guardamos nada
    var trabajo = falsoExito ? Promise.resolve(null) : reducir(archivoElegido).then(function (blob) {
      if (blob.size > MAX_ENVIO) throw new Error('too large')
      return enviar(blob, nombre, dedic)
    })

    trabajo.then(function (ruta) {
      // ¿La foto ya se ve en el álbum? (depende de si tú revisas antes de publicar o no)
      return (ruta ? sincronizar() : Promise.resolve()).then(function () {
        var yaSeVe = !ruta || Object.keys(fotos).some(function (id) { return fotos[id].ruta === ruta })
        $('exitoNombre').textContent = nombre
        $('exitoTexto').textContent = yaSeVe
          ? 'Tu foto ya está en el álbum. ¡Míralo aquí abajo!'
          : 'Tu foto fue enviada. Aparecerá en el álbum cuando el anfitrión la publique.'
        form.hidden = true
        $('exito').hidden = false
      })
    }).catch(function (err) {
      console.error('Error al enviar la foto', err)
      mostrarError(mensajeError(err))
    }).then(function () {
      btn.disabled = false
      btn.textContent = 'Enviar foto'
    })
  })

  // ---------- Arranque ----------
  sincronizar().then(function (ok) {
    if (!ok && primeraCarga) {
      mostrarEstado('No pudimos cargar el álbum', 'Revisa tu conexión a internet. Si eres quien administra el sitio, confirma que ejecutaste crear-todo.sql en Supabase.')
      return
    }
    iniciarEnVivo()
  })
})()
