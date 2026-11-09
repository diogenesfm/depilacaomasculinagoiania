/* Clínica Elementus — scripts do site (sem dependências).
 * - Menu móvel
 * - Consentimento de cookies (Google Consent Mode v2) e carregamento das tags
 * - Eventos de clique (whatsapp_click, booking_click, phone_click, directions_click)
 * - Mapa sob demanda e busca do blog
 */
(function () {
  var CFG = window.ELEMENTUS || {}
  var KEY = 'elementus_consent_v1'
  window.dataLayer = window.dataLayer || []
  function gtag() { window.dataLayer.push(arguments) }
  window.gtag = window.gtag || gtag

  // Consent Mode v2: tudo negado por padrão até a escolha do visitante
  gtag('consent', 'default', { ad_storage: 'denied', analytics_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', wait_for_update: 500 })

  function store(v) { try { localStorage.setItem(KEY, v) } catch (e) {} }
  function read() { try { return localStorage.getItem(KEY) } catch (e) { return null } }

  var loaded = false
  function loadTags() {
    if (loaded) return; loaded = true
    var id = CFG.gtm || CFG.ga4 || CFG.ads
    if (!id) return
    if (CFG.gtm) {
      window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
      inject('https://www.googletagmanager.com/gtm.js?id=' + CFG.gtm)
    } else {
      inject('https://www.googletagmanager.com/gtag/js?id=' + (CFG.ga4 || CFG.ads))
      gtag('js', new Date())
      var opt = { linker: { domains: ['clinicaelementus.com', 'depilacaomasculinagoiania.com.br'] } }
      if (CFG.ga4) gtag('config', CFG.ga4, opt)
      if (CFG.ads) gtag('config', CFG.ads, opt)
    }
    if (CFG.pixel) {
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s) }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
      window.fbq('init', CFG.pixel); window.fbq('track', 'PageView')
    }
  }
  function inject(src) { var s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s) }

  function apply(choice) {
    if (choice === 'accept') {
      gtag('consent', 'update', { ad_storage: 'granted', analytics_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' })
      loadTags()
    }
  }

  function track(name, params) {
    window.dataLayer.push(Object.assign({ event: name }, params))
    if (loaded && CFG.ga4 && !CFG.gtm) gtag('event', name, params)
    if (loaded && CFG.ads && name === 'whatsapp_click') gtag('event', 'conversion_intent_whatsapp', params) // configure a conversão no Google Ads
    if (loaded && window.fbq && name === 'whatsapp_click') window.fbq('track', 'Contact')
  }
  window.ELEMENTUS_TRACK = track

  document.addEventListener('DOMContentLoaded', function () {
    // Consentimento
    var banner = document.getElementById('consent')
    var saved = read()
    if (saved) apply(saved); else if (banner) banner.hidden = false
    document.querySelectorAll('[data-consent]').forEach(function (b) {
      b.addEventListener('click', function () { var v = b.getAttribute('data-consent'); store(v); apply(v); banner.hidden = true })
    })
    document.querySelectorAll('[data-open-consent]').forEach(function (b) {
      b.addEventListener('click', function () { banner.hidden = false; var f = banner.querySelector('button'); if (f) f.focus() })
    })

    // Menu móvel
    var tg = document.querySelector('.nav-toggle'), nav = document.getElementById('menu')
    if (tg && nav) tg.addEventListener('click', function () {
      var open = tg.getAttribute('aria-expanded') === 'true'
      tg.setAttribute('aria-expanded', String(!open)); nav.classList.toggle('open', !open)
      document.body.style.overflow = open ? '' : 'hidden'
    })

    // Eventos de clique (delegação)
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a,button')
      if (!a) return
      var ev = a.getAttribute('data-track')
      var href = a.getAttribute('href') || ''
      if (!ev) {
        if (href.indexOf('wa.me') > -1) ev = 'whatsapp_click'
        else if (href.indexOf('tel:') === 0) ev = 'phone_click'
        else if (href.indexOf('clini.site') > -1) ev = 'booking_click'
      }
      if (ev) track(ev, { cta_position: a.getAttribute('data-position') || '', procedure: a.getAttribute('data-procedure') || '', page_path: location.pathname })
    })

    // Mapa sob demanda
    document.querySelectorAll('[data-load-map]').forEach(function (b) {
      b.addEventListener('click', function () {
        var box = b.closest('[data-map-src]')
        var f = document.createElement('iframe')
        f.src = box.getAttribute('data-map-src'); f.title = 'Mapa da localização da Clínica Elementus'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade'
        box.innerHTML = ''; box.appendChild(f)
      })
    })

    // Busca do blog
    var q = document.querySelector('[data-blog-search]')
    if (q) {
      var cards = document.querySelectorAll('[data-blog-list] [data-search]'), empty = document.querySelector('[data-blog-empty]')
      var norm = function (s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() }
      q.addEventListener('input', function () {
        var t = norm(q.value.trim()), n = 0
        cards.forEach(function (c) { var ok = !t || norm(c.getAttribute('data-search')).indexOf(t) > -1; c.hidden = !ok; if (ok) n++ })
        if (empty) empty.hidden = n > 0
      })
    }
  })
})()

/* Avaliações do Google: rodízio diário com prioridade para avaliações masculinas */
;(function () {
  var track = document.querySelector('[data-rv-rotate]'); var data = document.getElementById('rv-data')
  if (track && data) {
    try {
      var all = JSON.parse(data.textContent); var seed = Math.floor(Date.now() / 864e5)
      var rnd = function () { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }
      var shuf = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t } return a }
      var pick = shuf(all.filter(function (r) { return r.m })).slice(0, 7).concat(shuf(all.filter(function (r) { return !r.m })).slice(0, 1))
      var cards = track.querySelectorAll('.rv-card')
      var tpl = cards[0]
      track.innerHTML = ''
      pick.forEach(function (r) {
        var c = tpl.cloneNode(true); var p = r.n.split(' ')
        c.querySelector('.rv-av').textContent = (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase()
        c.querySelector('strong').textContent = r.n
        c.querySelector('.rv-top span:not(.rv-av)').textContent = r.d
        c.querySelector('p').textContent = r.t
        track.appendChild(c)
      })
    } catch (e) {}
  }
  document.querySelectorAll('[data-rv-dir]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.closest('.wrap').querySelector('.rv-track')
      t.scrollBy({ left: +b.getAttribute('data-rv-dir') * t.clientWidth, behavior: 'smooth' })
    })
  })
})()

/* Slider da primeira tela */
;(function () {
  var root = document.querySelector('[data-slider]'); if (!root) return
  var slides = root.querySelectorAll('.slide'), dots = root.querySelectorAll('[data-slide-to]'), cur = 0, timer = null
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  function go(n) {
    cur = (n + slides.length) % slides.length
    slides.forEach(function (s, i) { s.classList.toggle('is-active', i === cur); if (i === cur) s.removeAttribute('aria-hidden'); else s.setAttribute('aria-hidden', 'true') })
    dots.forEach(function (d, i) { d.classList.toggle('is-active', i === cur) })
    var img = slides[cur].querySelector('img'); if (img && img.loading === 'lazy') img.loading = 'eager'
  }
  function play() { stop(); if (!reduce) timer = setInterval(function () { go(cur + 1) }, 6000) }
  function stop() { if (timer) clearInterval(timer); timer = null }
  root.querySelector('[data-slide-next]').addEventListener('click', function () { go(cur + 1); play() })
  root.querySelector('[data-slide-prev]').addEventListener('click', function () { go(cur - 1); play() })
  dots.forEach(function (d) { d.addEventListener('click', function () { go(+d.getAttribute('data-slide-to')); play() }) })
  root.addEventListener('mouseenter', stop); root.addEventListener('mouseleave', play)
  var x0 = null
  root.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX }, { passive: true })
  root.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) { go(cur + (dx < 0 ? 1 : -1)); play() } x0 = null })
  setTimeout(function () { slides.forEach(function (s) { var i = s.querySelector('img'); if (i) i.loading = 'eager' }) }, 2500)
  play()
})()

/* Antes e depois: comparação e filtro */
;(function () {
  document.querySelectorAll('[data-compare]').forEach(function (c) {
    var r = c.querySelector('input'); r.addEventListener('input', function () { c.style.setProperty('--pos', r.value + '%') })
  })
  var btns = document.querySelectorAll('[data-ad-filter]')
  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-ad-filter')
      btns.forEach(function (x) { x.classList.toggle('is-active', x === b) })
      document.querySelectorAll('[data-ad-proc]').forEach(function (el) { el.hidden = !!f && el.getAttribute('data-ad-proc') !== f })
    })
  })
})()

;(function () {
  // Sua ficha de avaliação: monta a mensagem e abre o WhatsApp da clínica
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-ficha]').forEach(function (f) {
      var btn = f.querySelector('.ficha-btn'), help = f.querySelector('.ficha-help')
      var MSG_VAZIO = 'Escolha pelo menos um item para continuar.', MSG_OK = 'Pronto. Você vai abrir o WhatsApp com a mensagem escrita.'
      function marcados() { return Array.prototype.slice.call(f.querySelectorAll('input[type=checkbox]:checked')) }
      function atualiza() {
        var ok = marcados().length > 0
        btn.setAttribute('aria-disabled', ok ? 'false' : 'true')
        help.textContent = ok ? MSG_OK : MSG_VAZIO
      }
      f.addEventListener('change', atualiza)
      // radio opcional: clicar de novo no horário marcado desmarca
      f.querySelectorAll('input[type=radio]').forEach(function (r) {
        r.addEventListener('click', function () { if (r.dataset.was === '1') { r.checked = false; r.dataset.was = '' } else { f.querySelectorAll('input[type=radio]').forEach(function (o) { o.dataset.was = '' }); r.dataset.was = '1' } })
      })
      f.addEventListener('submit', function (e) {
        e.preventDefault()
        var itens = marcados()
        if (!itens.length) {
          help.textContent = ''
          setTimeout(function () { help.textContent = MSG_VAZIO }, 30)
          var first = f.querySelector('input[type=checkbox]'); if (first) first.focus()
          return
        }
        var vals = itens.map(function (i) { return i.getAttribute('data-value') })
        var hr = f.querySelector('input[type=radio]:checked')
        var msg = 'Olá! Quero agendar uma avaliação na ' + f.getAttribute('data-empresa') + '. Tenho interesse em: ' + vals.join(', ') + '.'
        if (hr) msg += ' Prefiro ' + hr.getAttribute('data-value') + '.'
        if (window.ELEMENTUS_TRACK) window.ELEMENTUS_TRACK('whatsapp_click', { cta_position: 'ficha_avaliacao', procedure: itens.map(function (i) { return i.getAttribute('data-slug') }).join(','), page_path: location.pathname })
        var w = window.open('https://wa.me/' + f.getAttribute('data-wa') + '?text=' + encodeURIComponent(msg), '_blank', 'noopener')
        if (w) w.opener = null
      })
      atualiza()
    })
  })
})();

/* Antes, durante e depois: transição entre 3 etapas (barra 0–200 ou botões) */
;(function () {
  document.querySelectorAll('[data-stages]').forEach(function (box) {
    var st = box.querySelectorAll('.ad-stage'), r = box.querySelector('input'), bs = box.querySelectorAll('[data-step]')
    function show(v) {
      v = Math.max(0, Math.min(200, +v))
      st.forEach(function (el, i) { var d = Math.abs(v - i * 100); el.style.opacity = String(Math.max(0, 1 - d / 100)) })
      var near = Math.round(v / 100)
      bs.forEach(function (b, i) { b.setAttribute('aria-pressed', String(i === near)) })
      r.setAttribute('aria-valuetext', ['Antes', 'Durante', 'Depois'][near])
    }
    r.addEventListener('input', function () { show(r.value) })
    bs.forEach(function (b) {
      b.addEventListener('click', function () {
        var to = +b.getAttribute('data-step') * 100, from = +r.value, t0 = null
        var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches
        if (reduce) { r.value = to; show(to); return }
        function step(ts) { if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / 450); var v = from + (to - from) * (1 - Math.pow(1 - k, 3)); r.value = v; show(v); if (k < 1) requestAnimationFrame(step) }
        requestAnimationFrame(step)
      })
    })
    show(0)
  })
})()
