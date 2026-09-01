/* Общий хелпер для гида — используется и на devices.html (1 шаг), и на
   device_create.html (4 шага). Логика кольца/выреза/стрелки — прямой
   порт из Mock-Stand (static/tour/verifix-tour.js), тот же визуальный
   язык, чтобы оба концепта выглядели одной семьёй продуктов. */
var VTourCommon = (function () {
  function ensureRoot() {
    var root = document.getElementById('vtour-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'vtour-root';
      document.body.appendChild(root);
    }
    return root;
  }

  function positionBox(el, rect, pad) {
    pad = pad || 6;
    el.style.top = (rect.top - pad) + 'px';
    el.style.left = (rect.left - pad) + 'px';
    el.style.width = (rect.width + pad * 2) + 'px';
    el.style.height = (rect.height + pad * 2) + 'px';
  }

  // Кольцо + вырез-затемнение вокруг targetEl. Возвращает {ring, dim},
  // чтобы вызывающий код мог подвинуть их дальше (updateHighlight) или
  // убрать (removeHighlight).
  function showHighlight(targetEl) {
    var root = ensureRoot();
    var ring = document.createElement('div');
    ring.className = 'vtour-highlight-ring';
    var dim = document.createElement('div');
    dim.className = 'vtour-highlight-dim';
    var rect = targetEl.getBoundingClientRect();
    positionBox(ring, rect);
    positionBox(dim, rect);
    root.appendChild(dim);
    root.appendChild(ring);
    return { ring: ring, dim: dim };
  }

  function updateHighlight(highlight, targetEl) {
    if (!highlight) return;
    var rect = targetEl.getBoundingClientRect();
    positionBox(highlight.ring, rect);
    positionBox(highlight.dim, rect);
  }

  function removeHighlight(highlight) {
    if (!highlight) return;
    if (highlight.ring && highlight.ring.parentNode) highlight.ring.parentNode.removeChild(highlight.ring);
    if (highlight.dim && highlight.dim.parentNode) highlight.dim.parentNode.removeChild(highlight.dim);
  }

  // Изогнутая SVG-стрелка от from к to — 1:1 портировано из Mock-Stand
  // (verifix-tour.js drawArrow): заходит с левого края обоих элементов,
  // дуга уводится влево за их пределы, а не поперёк.
  function drawArrow(from, to) {
    var root = ensureRoot();
    var fr = from.getBoundingClientRect();
    var tr = to.getBoundingClientRect();

    var x1 = fr.left, y1 = fr.top + fr.height / 2;
    var x2 = tr.left, y2 = tr.top + tr.height / 2;
    var swing = Math.max(90, Math.min(160, Math.abs(y2 - y1) * 0.7));
    var cx = Math.min(x1, x2) - swing;
    var cy = (y1 + y2) / 2;

    var minX = Math.min(x1, x2, cx) - 20, minY = Math.min(y1, y2, cy) - 20;
    var maxX = Math.max(x1, x2, cx) + 20, maxY = Math.max(y1, y2, cy) + 20;
    var w = maxX - minX, h = maxY - minY;

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'vtour-arrow');
    svg.style.top = minY + 'px'; svg.style.left = minX + 'px';
    svg.setAttribute('width', w); svg.setAttribute('height', h);
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M' + (x1 - minX) + ' ' + (y1 - minY) + ' Q ' + (cx - minX) + ' ' + (cy - minY) + ' ' + (x2 - minX) + ' ' + (y2 - minY));
    svg.appendChild(path);
    var angle = Math.atan2(y2 - cy, x2 - cx);
    var hx = x2 - minX, hy = y2 - minY;
    var head = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    var a1 = angle + 2.6, a2 = angle - 2.6;
    head.setAttribute('points',
      hx + ',' + hy + ' ' +
      (hx + 9 * Math.cos(a1)) + ',' + (hy + 9 * Math.sin(a1)) + ' ' +
      (hx + 9 * Math.cos(a2)) + ',' + (hy + 9 * Math.sin(a2)));
    head.setAttribute('class', 'vtour-arrow-head');
    svg.appendChild(head);
    root.appendChild(svg);
    return svg;
  }

  function removeArrow(svg) {
    if (svg && svg.parentNode) svg.parentNode.removeChild(svg);
  }

  function showCard(targetEl, opts) {
    var root = ensureRoot();
    var card = document.createElement('div');
    card.className = 'vtour-card';
    card.innerHTML =
      (opts.step ? '<div class="vtour-card__step">' + opts.step + '</div>' : '') +
      '<div class="vtour-card__title">' + opts.title + '</div>' +
      '<div class="vtour-card__text">' + opts.text + '</div>' +
      (opts.btnLabel ? '<div class="vtour-card__actions"><button type="button" class="vtour-card__btn">' + opts.btnLabel + '</button></div>' : '');
    root.appendChild(card);
    positionCard(card, targetEl);
    requestAnimationFrame(function () { card.classList.add('is-visible'); });
    if (opts.btnLabel && opts.onClick) {
      card.querySelector('.vtour-card__btn').addEventListener('click', opts.onClick);
    }
    return card;
  }

  function positionCard(card, targetEl) {
    var r = targetEl.getBoundingClientRect();
    var top = r.bottom + 14;
    var left = r.left;
    // Ширина карточки ещё не финализирована в момент первого вызова
    // (только что вставлена в DOM) — 320 берём из CSS max-width как
    // достаточную оценку для проверки выхода за правый край экрана.
    if (left + 320 > window.innerWidth) left = window.innerWidth - 336;
    if (left < 12) left = 12;
    if (top + 170 > window.innerHeight) top = Math.max(12, r.top - 170);
    card.style.top = top + 'px';
    card.style.left = left + 'px';
  }

  function removeCard(card) {
    if (card && card.parentNode) card.parentNode.removeChild(card);
  }

  return {
    showHighlight: showHighlight,
    updateHighlight: updateHighlight,
    removeHighlight: removeHighlight,
    drawArrow: drawArrow,
    removeArrow: removeArrow,
    showCard: showCard,
    positionCard: positionCard,
    removeCard: removeCard,
  };
})();
