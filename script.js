// 글자 크기 버튼 (경시청 홈페이지의 文字サイズ 기능) — 페이지를 옮겨도 유지됨
(function () {
  var root = document.documentElement;
  var saved = 'normal';
  try { saved = localStorage.getItem('fontSize') || 'normal'; } catch (e) {}
  function apply(size) {
    root.classList.toggle('large', size === 'large');
    document.querySelectorAll('.fs button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.size === size));
    });
  }
  apply(saved);
  document.querySelectorAll('.fs button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      apply(btn.dataset.size);
      try { localStorage.setItem('fontSize', btn.dataset.size); } catch (e) {}
    });
  });
})();
