// ════════ 수사 4과 사이트 공용 스크립트 ════════
// 페이지를 옮길 때 새로고침하지 않고 내용만 바꿔 끼워서,
// 화면 아래의 BGM 플레이어가 계속 살아 있게 한다.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var body = document.body;
  var pageCtl = null;     // 페이지마다 붙인 이벤트를 한꺼번에 떼기 위한 장치
  var timers = [];        // 페이지마다 만든 타이머

  // ─────────── 페이지별 초기화 ───────────
  function init() {
    if (pageCtl) pageCtl.abort();
    timers.forEach(clearInterval);
    timers = [];
    pageCtl = new AbortController();
    var sig = { signal: pageCtl.signal };
    var sigP = { signal: pageCtl.signal, passive: true };

    // 상단 바: 스크롤하면 진하게
    var bar = document.querySelector('.gbar');
    if (bar) {
      var onScroll = function () { bar.classList.toggle('solid', window.scrollY > 40); };
      onScroll();
      window.addEventListener('scroll', onScroll, sigP);
    }

    // 모바일 메뉴
    body.style.overflow = '';
    var btn = document.querySelector('.gmenu-btn');
    var menu = document.querySelector('.gmenu');
    if (btn && menu) {
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', String(open));
        menu.classList.toggle('open', open);
        body.style.overflow = open ? 'hidden' : '';
      }, sig);
    }

    // 큰 제목 글자 쪼개기
    document.querySelectorAll('.split').forEach(function (el) {
      if (el.dataset.done) return;
      el.dataset.done = '1';
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

    // 스크롤하면 나타나기
    var targets = document.querySelectorAll('[data-r], .split, [data-stagger], .shead, .tiles');
    if (reduce || !('IntersectionObserver' in window)) {
      targets.forEach(function (t) { t.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { (en.target.__target || en.target).classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
      pageCtl.signal.addEventListener('abort', function () { io.disconnect(); });
      targets.forEach(function (t) {
        // 잘려서 숨은 요소는 면적이 0이라 감지가 안 되므로 감싸는 요소로 감지
        if (t.getAttribute('data-r') === 'clip') {
          var w = document.createElement('div');
          t.parentNode.insertBefore(w, t);
          w.appendChild(t);
          w.__target = t;
          io.observe(w);
        } else io.observe(t);
      });
    }

    // 금가루
    var dust = document.querySelector('.dust');
    if (dust && !reduce && !dust.children.length) {
      for (var i = 0; i < 22; i++) {
        var d = document.createElement('i');
        d.style.left = (i * 47 % 100) + '%';
        d.style.animationDuration = (10 + i * 7 % 10) + 's';
        d.style.animationDelay = (i * 1.3 % 10).toFixed(1) + 's';
        dust.appendChild(d);
      }
    }

    // 홈 히어로: 마우스를 따라오는 빛과 배경
    var hero = document.querySelector('.hero');
    if (hero && !reduce && window.matchMedia('(pointer:fine)').matches) {
      var bg = hero.querySelector('.hero-bg');
      hero.addEventListener('mousemove', function (e) {
        var r = hero.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        hero.style.setProperty('--mx', (x * 100) + '%');
        hero.style.setProperty('--my', (y * 100) + '%');
        if (bg) bg.style.translate = ((0.5 - x) * 24) + 'px ' + ((0.5 - y) * 14) + 'px';
      }, sig);
    }

    // 큰 배경 글자: 스크롤에 따라 옆으로
    var words = document.querySelectorAll('.morgue .bgword');
    if (words.length && !reduce) {
      window.addEventListener('scroll', function () {
        words.forEach(function (w) {
          var r = w.parentElement.getBoundingClientRect();
          w.style.translate = (r.top * 0.25) + 'px 0';
        });
      }, sigP);
    }

    // 숫자 올라가기
    var nums = document.querySelectorAll('[data-countup]');
    if (nums.length && 'IntersectionObserver' in window) {
      var no = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target, end = +el.dataset.countup, t0 = null;
          no.unobserve(el);
          if (reduce) { el.textContent = end; return; }
          requestAnimationFrame(function step(ts) {
            t0 = t0 || ts; var k = Math.min((ts - t0) / 1600, 1);
            el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
            if (k < 1) requestAnimationFrame(step);
          });
        });
      }, { threshold: 0.5 });
      pageCtl.signal.addEventListener('abort', function () { no.disconnect(); });
      nums.forEach(function (n) { no.observe(n); });
    } else nums.forEach(function (n) { n.textContent = n.dataset.countup; });

    // 소개 페이지 목차: 지금 보는 구역 강조
    var sub = document.querySelector('.subnav');
    if (sub && 'IntersectionObserver' in window) {
      var links = sub.querySelectorAll('a');
      var so = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (l) {
            var on = l.getAttribute('href') === '#' + en.target.id;
            l.classList.toggle('on', on);
            if (on && l.scrollIntoView) sub.querySelector('.wrap').scrollLeft = l.offsetLeft - 20;
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      pageCtl.signal.addEventListener('abort', function () { so.disconnect(); });
      document.querySelectorAll('.wsec').forEach(function (s) { so.observe(s); });
    }

    // 도쿄 시각
    var clock = document.querySelector('[data-clock]');
    if (clock) {
      var tick = function () {
        clock.textContent = new Date().toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour12: false });
      };
      tick();
      timers.push(setInterval(tick, 1000));
    }
  }

  // ─────────── 새로고침 없는 페이지 이동 ───────────
  var busy = false;
  var lastPath = location.pathname;
  function isInternal(a) {
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || a.target === '_blank' || a.hasAttribute('download')) return false;
    var url = new URL(a.href, location.href);
    return url.origin === location.origin && /\.html$|\/$/.test(url.pathname);
  }

  function swap(html, url, push) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    document.title = doc.title;

    // BGM 플레이어만 남기고 나머지를 새 페이지 내용으로 교체
    Array.from(body.childNodes).forEach(function (n) {
      if (!(n.nodeType === 1 && n.classList.contains('bgm'))) body.removeChild(n);
    });
    var bgm = body.querySelector('.bgm');
    var inline = [];
    Array.from(doc.body.childNodes).forEach(function (n) {
      if (n.nodeType === 1 && n.tagName === 'SCRIPT') {
        if (!n.src) inline.push(n.textContent);   // 페이지 전용 스크립트는 다시 실행
        return;                                     // script.js 는 이미 실행 중
      }
      body.insertBefore(document.importNode(n, true), bgm);
    });
    body.className = doc.body.className;          // 클래스 교체 = leaving 도 같이 해제

    if (push) history.pushState({}, '', url);
    lastPath = location.pathname;
    var hash = new URL(url, location.href).hash;
    var target = hash && document.getElementById(hash.slice(1));
    window.scrollTo(0, target ? target.getBoundingClientRect().top + window.scrollY : 0);

    try { init(); } catch (err) { console.error(err); }
    inline.forEach(function (code) {
      var s = document.createElement('script');
      s.textContent = code;
      body.insertBefore(s, bgm);
    });
  }

  function go(url, push) {
    var done = false;
    // 어떤 이유로든 2.5초 안에 바뀌지 않으면 평소처럼 이동
    var guard = setTimeout(function () { if (!done) location.href = url; }, 2500);
    busy = true;
    if (!reduce) body.classList.add('leaving');
    var wait = new Promise(function (r) { setTimeout(r, reduce ? 0 : 480); });
    var load = fetch(url, { credentials: 'same-origin', cache: 'no-cache' }).then(function (res) {
      if (!res.ok) throw new Error(res.status);
      return res.text();
    });
    Promise.all([load, wait]).then(function (v) {
      if (done) return;
      if (v[0].indexOf('script.js') < 0) throw new Error('not a site page');
      swap(v[0], url, push);
      done = true;
      clearTimeout(guard);
      busy = false;
    }).catch(function () {
      done = true;
      location.href = url;   // 실패하면 평소처럼 이동
    });
  }

  document.addEventListener('click', function (e) {
    try {
      if (busy || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (!window.fetch || !window.history || !history.pushState) return;   // 오래된 브라우저는 평소처럼
      var a = e.target.closest && e.target.closest('a');
      if (!a || !isInternal(a)) return;
      var url = new URL(a.href, location.href);
      if (url.pathname === location.pathname && url.hash) return;   // 같은 페이지 안 이동
      e.preventDefault();
      go(url.href, true);
    } catch (err) { /* 문제가 생기면 링크가 평소처럼 작동하게 둔다 */ }
  });

  window.addEventListener('popstate', function () {
    if (location.pathname === lastPath) return;   // 같은 페이지 안의 # 이동은 무시
    go(location.href, false);
  });
  window.addEventListener('pageshow', function () { body.classList.remove('leaving'); });

  try { init(); } catch (err) { console.error(err); }
})();

// ════════ BGM 플레이어 (유튜브) ════════
(function () {
  var VIDEO = 'qz7fLH1mXxM';
  var KEY = 'sid04-bgm';
  var box = document.createElement('div');
  box.className = 'bgm';
  box.innerHTML =
    '<span class="bgm-hint">▶ 눌러서 이어 듣기</span>' +
    '<button class="bgm-btn" type="button" aria-pressed="false" aria-label="배경음악 재생">' +
      '<span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' +
      '<span class="bgm-txt"><b>BGM</b><small>OFF</small></span>' +
    '</button>' +
    '<div class="bgm-more">' +
      '<div class="bgm-title" aria-live="polite"><span>SPECIAL INVESTIGATION DIVISION 04</span></div>' +
      '<input class="bgm-vol" type="range" min="0" max="100" step="1" aria-label="음량">' +
    '</div>' +
    '<div class="bgm-frame" aria-hidden="true"><div id="bgm-yt"></div></div>';
  document.body.appendChild(box);

  var btn = box.querySelector('.bgm-btn');
  var label = box.querySelector('.bgm-txt small');
  var title = box.querySelector('.bgm-title span');
  var vol = box.querySelector('.bgm-vol');
  var state = { on: false, t: 0, vol: 40 };
  try { Object.assign(state, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  vol.value = state.vol;
  vol.style.setProperty('--v', state.vol + '%');

  var player = null, ready = false;
  function setUI(playing) {
    box.classList.toggle('playing', playing);
    btn.setAttribute('aria-pressed', String(playing));
    btn.setAttribute('aria-label', playing ? '배경음악 정지' : '배경음악 재생');
    label.textContent = playing ? 'ON AIR' : 'OFF';
  }

  // 유튜브 API 불러오기
  var tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
  var prev = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = function () {
    if (prev) prev();
    player = new YT.Player('bgm-yt', {
      width: 200, height: 200, videoId: VIDEO,
      playerVars: { autoplay: 0, controls: 0, loop: 1, playlist: VIDEO, playsinline: 1, rel: 0 },
      events: {
        onReady: function () {
          ready = true;
          player.setVolume(state.vol);
          try { var d = player.getVideoData(); if (d && d.title) title.textContent = d.title; } catch (e) {}
          // 다른 페이지에서 듣던 중이었다면 이어서 재생 시도
          if (state.on) {
            player.seekTo(state.t || 0, true);
            player.playVideo();
            setTimeout(function () {
              if (player.getPlayerState() !== YT.PlayerState.PLAYING) {
                setUI(false);
                box.classList.add('hint');
                setTimeout(function () { box.classList.remove('hint'); }, 5000);
              }
            }, 1500);
          }
        },
        onStateChange: function (e) {
          var playing = e.data === YT.PlayerState.PLAYING;
          if (e.data === YT.PlayerState.PLAYING || e.data === YT.PlayerState.PAUSED) setUI(playing);
          try { var d = player.getVideoData(); if (d && d.title) title.textContent = d.title; } catch (err) {}
        }
      }
    });
  };

  btn.addEventListener('click', function () {
    box.classList.remove('hint');
    if (!ready) return;
    if (player.getPlayerState() === YT.PlayerState.PLAYING) {
      player.pauseVideo(); state.on = false;
    } else {
      player.playVideo(); state.on = true;
    }
    save();
  });
  vol.addEventListener('input', function () {
    state.vol = +vol.value;
    vol.style.setProperty('--v', state.vol + '%');
    if (ready) player.setVolume(state.vol);
    save();
  });

  // 재생 위치 저장 (페이지를 옮겨도 이어 듣기)
  setInterval(function () {
    if (ready && player.getPlayerState() === YT.PlayerState.PLAYING) { state.t = player.getCurrentTime(); save(); }
  }, 1000);
  window.addEventListener('pagehide', function () {
    if (ready) { try { state.t = player.getCurrentTime(); } catch (e) {} save(); }
  });
})();
