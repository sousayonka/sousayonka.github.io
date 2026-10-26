(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var body = document.body;

  // ── 화면 전환: 사이트 안 링크를 누르면 커튼이 닫힌 뒤 이동 ──
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a || reduce) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (!/\.html(#.*)?$/.test(href)) return;
    e.preventDefault();
    body.classList.add('leaving');
    setTimeout(function () { location.href = href; }, 520);
  });
  window.addEventListener('pageshow', function () { body.classList.remove('leaving'); });

  // ── 상단 바: 스크롤하면 진하게 ──
  var bar = document.querySelector('.gbar');
  if (bar) {
    var onScroll = function () { bar.classList.toggle('solid', window.scrollY > 40); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ── 모바일 메뉴 ──
  var btn = document.querySelector('.gmenu-btn');
  var menu = document.querySelector('.gmenu');
  if (btn && menu) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('open', open);
      body.style.overflow = open ? 'hidden' : '';
    });
  }

  // ── 큰 제목 글자 쪼개기 ──
  document.querySelectorAll('.split').forEach(function (el) {
    var text = el.textContent;
    el.setAttribute('aria-label', text);
    el.textContent = '';
    Array.from(text).forEach(function (c, i) {
      var s = document.createElement('span');
      s.className = 'ch';
      s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--i', i);
      s.textContent = c;
      el.appendChild(s);
    });
  });

  // ── 스크롤하면 나타나기 ──
  var targets = document.querySelectorAll('[data-r], .split, [data-stagger], .shead, .tiles');
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(function (t) { t.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { (en.target.__target || en.target).classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(function (t) {
      // 잘려서 숨겨진 요소는 면적이 0이라 감지가 안 되므로 감싸는 요소로 감지
      if (t.getAttribute('data-r') === 'clip') {
        var w = document.createElement('div');
        t.parentNode.insertBefore(w, t);
        w.appendChild(t);
        w.__target = t;
        io.observe(w);
      } else io.observe(t);
    });
  }

  // ── 금가루 ──
  var dust = document.querySelector('.dust');
  if (dust && !reduce) {
    for (var i = 0; i < 22; i++) {
      var d = document.createElement('i');
      d.style.left = (i * 47 % 100) + '%';
      d.style.animationDuration = (10 + i * 7 % 10) + 's';
      d.style.animationDelay = (i * 1.3 % 10).toFixed(1) + 's';
      dust.appendChild(d);
    }
  }

  // ── 히어로: 마우스를 따라오는 빛과 배경 ──
  var hero = document.querySelector('.hero');
  if (hero && !reduce && window.matchMedia('(pointer:fine)').matches) {
    var bg = hero.querySelector('.hero-bg');
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      hero.style.setProperty('--mx', (x * 100) + '%');
      hero.style.setProperty('--my', (y * 100) + '%');
      if (bg) bg.style.translate = ((0.5 - x) * 24) + 'px ' + ((0.5 - y) * 14) + 'px';
    });
  }

  // ── 큰 배경 글자: 스크롤에 따라 옆으로 ──
  var words = document.querySelectorAll('.morgue .bgword');
  if (words.length && !reduce) {
    window.addEventListener('scroll', function () {
      words.forEach(function (w) {
        var r = w.parentElement.getBoundingClientRect();
        w.style.translate = (r.top * 0.25) + 'px 0';
      });
    }, { passive: true });
  }

  // ── 도쿄 시각 ──
  var clock = document.querySelector('[data-clock]');
  if (clock) {
    var tick = function () {
      clock.textContent = new Date().toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour12: false });
    };
    tick();
    setInterval(tick, 1000);
  }
})();
