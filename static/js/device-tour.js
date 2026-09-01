(function () {
  // ============================================================
  // Обычная интерактивность формы (работает всегда, вне зависимости
  // от того, запущен гид или нет) — переключатели, условные поля.
  // ============================================================

  var deviceTypeRadios = document.querySelectorAll('input[name=deviceType]');
  var fieldModel = document.getElementById('fieldModel');
  var fieldAdmins = document.getElementById('fieldAdmins');
  var fieldUseMain = document.getElementById('fieldUseMain');
  var timepadAppBlock = document.getElementById('timepadAppBlock');

  function syncDeviceType() {
    var checked = document.querySelector('input[name=deviceType]:checked');
    var isTimepad = checked && checked.value === 'timepad';
    fieldModel.style.display = isTimepad ? 'none' : '';
    fieldAdmins.style.display = isTimepad ? '' : 'none';
    fieldUseMain.style.display = isTimepad ? '' : 'none';
    timepadAppBlock.style.display = isTimepad ? '' : 'none';
  }
  deviceTypeRadios.forEach(function (r) { r.addEventListener('change', syncDeviceType); });
  syncDeviceType();

  var toggleSingleKind = document.getElementById('toggleSingleKind');
  var toggleSingleKindText = document.getElementById('toggleSingleKindText');
  var singleKindRadio = document.getElementById('singleKindRadio');
  var globalToggleBlock = document.getElementById('globalToggleBlock');
  function syncSingleKind() {
    toggleSingleKindText.textContent = toggleSingleKind.checked ? 'да' : 'нет';
    singleKindRadio.style.display = toggleSingleKind.checked ? '' : 'none';
    globalToggleBlock.style.display = toggleSingleKind.checked ? 'none' : '';
  }
  toggleSingleKind.addEventListener('change', syncSingleKind);
  syncSingleKind();

  var toggleGlobalIn = document.getElementById('toggleGlobalIn');
  var toggleGlobalInText = document.getElementById('toggleGlobalInText');
  var inRadio = document.getElementById('inRadio');
  function syncGlobalIn() {
    toggleGlobalInText.textContent = toggleGlobalIn.checked ? 'да' : 'нет';
    inRadio.style.display = toggleGlobalIn.checked ? 'none' : '';
  }
  toggleGlobalIn.addEventListener('change', syncGlobalIn);
  syncGlobalIn();

  var toggleGlobalOut = document.getElementById('toggleGlobalOut');
  var toggleGlobalOutText = document.getElementById('toggleGlobalOutText');
  var outRadio = document.getElementById('outRadio');
  function syncGlobalOut() {
    toggleGlobalOutText.textContent = toggleGlobalOut.checked ? 'да' : 'нет';
    outRadio.style.display = toggleGlobalOut.checked ? 'none' : '';
  }
  toggleGlobalOut.addEventListener('change', syncGlobalOut);
  syncGlobalOut();

  // Остальные простые тумблеры (без своей условной логики) — просто
  // синхронизируем текст да/нет; те, что уже обработаны выше (есть id),
  // пропускаем, чтобы не навесить обработчик дважды.
  document.querySelectorAll('.toggle-field').forEach(function (tf) {
    var input = tf.querySelector('input[type=checkbox]');
    var text = tf.querySelector('.toggle-field__text');
    if (!input || !text || input.id) return;
    input.addEventListener('change', function () { text.textContent = input.checked ? 'да' : 'нет'; });
  });

  // Вкладки мини-гида "как достать серийный номер"
  document.querySelectorAll('.serial-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.serial-tab').forEach(function (t) { t.classList.remove('is-active'); });
      document.querySelectorAll('.serial-panel').forEach(function (p) { p.classList.remove('is-active'); });
      tab.classList.add('is-active');
      document.getElementById(tab.dataset.tab).classList.add('is-active');
    });
  });

  // ============================================================
  // Вопрос "приходы/уходы/оба" — по ответу заполняет правую панель
  // ТОЧНО так, как в реальном Verifix (см. три референс-скрина):
  // - Приходы: глобальные настройки прихода=ДА, ухода=НЕТ (раскрывается
  //   "Уход" -> Первая отметка)
  // - Уходы: зеркально — прихода=НЕТ (раскрывается "Приход" -> Первая
  //   отметка), ухода=ДА
  // - Приходы и Уходы: "Отправлять только один тип трекинга"=ДА,
  //   "Типы трекинга"=Отметка, ОБА чекбокса авто-генерации включены
  // ============================================================
  var autoIn = document.getElementById('autoIn');
  var autoOut = document.getElementById('autoOut');
  var colRight = document.getElementById('colRight');

  function applyKindAnswer(answer) {
    if (answer === 'in') {
      toggleSingleKind.checked = false; syncSingleKind();
      toggleGlobalIn.checked = true; syncGlobalIn();
      toggleGlobalOut.checked = false; syncGlobalOut();
      var outFirst = document.querySelector('input[name=outRule][value=first]');
      if (outFirst) outFirst.checked = true;
    } else if (answer === 'out') {
      toggleSingleKind.checked = false; syncSingleKind();
      toggleGlobalIn.checked = false; syncGlobalIn();
      var inFirst = document.querySelector('input[name=inRule][value=first]');
      if (inFirst) inFirst.checked = true;
      toggleGlobalOut.checked = true; syncGlobalOut();
    } else if (answer === 'both') {
      toggleSingleKind.checked = true; syncSingleKind();
      var markRadio = document.querySelector('input[name=trackKind][value=mark]');
      if (markRadio) markRadio.checked = true;
      autoIn.checked = true;
      autoOut.checked = true;
    }
  }

  var ANSWER_LABELS = { in: 'Приходы', out: 'Уходы', both: 'Приходы и Уходы' };

  document.querySelectorAll('.kind-question__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyKindAnswer(btn.dataset.answer);
      document.getElementById('kindQuestionOptions').style.display = 'none';
      var answered = document.getElementById('kindQuestionAnswered');
      answered.textContent = '✓ Настройки применены: «' + ANSWER_LABELS[btn.dataset.answer] + '»';
      answered.style.display = 'block';
      colRight.classList.add('tour-highlight');
      colRight.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(function () { colRight.classList.remove('tour-highlight'); }, 1600);
    });
  });

  // ============================================================
  // Сам гид — запускается, только если пришли по ссылке ?tour=1
  // (её ставит devices.html после клика "Интеграция с HikVision" ->
  // "Создать"). Подсвечивает НАСТОЯЩИЕ поля формы кольцом+затемнением,
  // не схематичный макет — тот же принцип, что в Mock-Stand.
  // ============================================================
  var params = new URLSearchParams(window.location.search);
  if (params.get('tour') !== '1') return;

  var dim = document.getElementById('tourDim');
  var card = document.getElementById('tourCard');
  var cardStep = document.getElementById('tourCardStep');
  var cardTitle = document.getElementById('tourCardTitle');
  var cardText = document.getElementById('tourCardText');
  var cardNext = document.getElementById('tourCardNext');

  var steps = [
    {
      el: document.getElementById('fieldDeviceType'), step: 'Шаг 1 из 4',
      title: 'Выберите тип устройства',
      text: 'Отметьте «Hikvision» — форма подстроится под это устройство.',
      waitFor: function () {
        var c = document.querySelector('input[name=deviceType]:checked');
        return !!c && c.value === 'hikvision';
      },
    },
    {
      el: document.getElementById('fieldName'), step: 'Шаг 2 из 4',
      title: 'Название',
      text: 'Как устройство будет называться в списке — например, по месту установки.',
      waitFor: function () { return document.getElementById('inputName').value.trim().length > 0; },
    },
    {
      el: document.getElementById('fieldLocation'), step: 'Шаг 3 из 4',
      title: 'Локация',
      text: 'К какой локации относится устройство.',
      waitFor: function () { return document.getElementById('inputLocation').value.trim().length > 0; },
    },
    {
      el: document.getElementById('fieldSerial'), step: 'Шаг 4 из 4',
      title: 'Серийный номер',
      text: 'Ниже появится пошаговая инструкция, как достать серийный номер устройства.',
      waitFor: function () { return document.getElementById('inputSerial').value.trim().length > 0; },
      onEnter: function () { document.getElementById('serialGuideBox').classList.add('is-open'); },
    },
  ];

  var idx = 0;
  var pollTimer = null;

  function clearHighlight() {
    document.querySelectorAll('.tour-highlight').forEach(function (e) { e.classList.remove('tour-highlight'); });
  }

  function positionCard(target) {
    // .tour-card — position:fixed, значит координаты уже относительно
    // окна просмотра (viewport) — getBoundingClientRect ничего
    // добавлять не нужно, в отличие от position:absolute.
    var r = target.getBoundingClientRect();
    var top = r.bottom + 12;
    var left = r.left;
    if (left + 340 > window.innerWidth) left = window.innerWidth - 356;
    if (top + 170 > window.innerHeight) top = Math.max(12, r.top - 170);
    card.style.top = top + 'px';
    card.style.left = left + 'px';
  }

  function pollWait(s) {
    clearInterval(pollTimer);
    if (s.waitFor()) { cardNext.style.display = ''; return; }
    cardNext.style.display = 'none';
    pollTimer = setInterval(function () {
      if (s.waitFor()) {
        clearInterval(pollTimer);
        cardNext.style.display = '';
        positionCard(s.el);
      }
    }, 350);
  }

  function showStep(i) {
    clearHighlight();
    var s = steps[i];
    if (!s) { finish(); return; }
    s.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(function () {
      s.el.classList.add('tour-highlight');
      dim.classList.add('is-visible');
      cardStep.textContent = s.step;
      cardTitle.textContent = s.title;
      cardText.textContent = s.text;
      positionCard(s.el);
      card.classList.add('is-visible');
      if (s.onEnter) s.onEnter();
      pollWait(s);
    }, 320);
  }

  function next() {
    idx += 1;
    showStep(idx);
  }

  function finish() {
    clearInterval(pollTimer);
    clearHighlight();
    dim.classList.remove('is-visible');
    card.classList.remove('is-visible');
    var q = document.getElementById('kindQuestion');
    q.style.display = 'block';
    q.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  cardNext.addEventListener('click', next);

  // Дополнительно к общему поллингу — реагируем на клик по радио сразу,
  // чтобы кнопка "Понятно" не ждала до 350мс лишний раз.
  deviceTypeRadios.forEach(function (r) {
    r.addEventListener('change', function () {
      if (steps[idx] === steps[0]) pollWait(steps[0]);
    });
  });

  showStep(0);
})();
