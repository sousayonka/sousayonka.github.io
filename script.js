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
