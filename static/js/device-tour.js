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
    fieldModel.classList.toggle('is-hidden', isTimepad);
    fieldAdmins.classList.toggle('is-hidden', !isTimepad);
    fieldUseMain.classList.toggle('is-hidden', !isTimepad);
    timepadAppBlock.classList.toggle('is-hidden', !isTimepad);
  }
  deviceTypeRadios.forEach(function (r) { r.addEventListener('change', syncDeviceType); });
  syncDeviceType();

  var toggleSingleKind = document.getElementById('toggleSingleKind');
  var toggleSingleKindText = document.getElementById('toggleSingleKindText');
  var singleKindRadio = document.getElementById('singleKindRadio');
  var globalToggleBlock = document.getElementById('globalToggleBlock');
  function syncSingleKind() {
    toggleSingleKindText.textContent = toggleSingleKind.checked ? 'да' : 'нет';
    singleKindRadio.classList.toggle('is-hidden', !toggleSingleKind.checked);
    globalToggleBlock.classList.toggle('is-hidden', toggleSingleKind.checked);
  }
  toggleSingleKind.addEventListener('change', syncSingleKind);
  syncSingleKind();

  var toggleGlobalIn = document.getElementById('toggleGlobalIn');
  var toggleGlobalInText = document.getElementById('toggleGlobalInText');
  var inRadio = document.getElementById('inRadio');
  function syncGlobalIn() {
    toggleGlobalInText.textContent = toggleGlobalIn.checked ? 'да' : 'нет';
    inRadio.classList.toggle('is-hidden', toggleGlobalIn.checked);
  }
  toggleGlobalIn.addEventListener('change', syncGlobalIn);
  syncGlobalIn();

  var toggleGlobalOut = document.getElementById('toggleGlobalOut');
  var toggleGlobalOutText = document.getElementById('toggleGlobalOutText');
  var outRadio = document.getElementById('outRadio');
  function syncGlobalOut() {
    toggleGlobalOutText.textContent = toggleGlobalOut.checked ? 'да' : 'нет';
    outRadio.classList.toggle('is-hidden', toggleGlobalOut.checked);
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

  // Выпадающий список "Локация" — хардкод 3 варианта для концепта.
  (function () {
    var input = document.getElementById('inputLocation');
    var list = document.getElementById('locationDropdownList');
    var wrap = document.getElementById('locationDropdownWrap');

    function open() { list.classList.add('is-open'); }
    function close() { list.classList.remove('is-open'); }

    input.addEventListener('click', function (e) { e.stopPropagation(); open(); });
    list.querySelectorAll('.dropdown-input__option').forEach(function (opt) {
      opt.addEventListener('click', function () {
        input.value = opt.dataset.value;
        list.querySelectorAll('.dropdown-input__option').forEach(function (o) { o.classList.remove('is-selected'); });
        opt.classList.add('is-selected');
        close();
        input.dispatchEvent(new Event('change'));
      });
    });
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) close();
    });
  })();

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
      // По фидбоку: авто-генерация — настройка, актуальная только для
      // варианта "Приходы и Уходы". При переключении на "Приходы"/
      // "Уходы" её нужно явно выключать, а не оставлять как есть
      // (раньше, если до этого выбрали "оба", чекбоксы так и оставались
      // включёнными после переключения на один из вариантов).
      autoIn.checked = false;
      autoOut.checked = false;
    } else if (answer === 'out') {
      toggleSingleKind.checked = false; syncSingleKind();
      toggleGlobalIn.checked = false; syncGlobalIn();
      var inFirst = document.querySelector('input[name=inRule][value=first]');
      if (inFirst) inFirst.checked = true;
      toggleGlobalOut.checked = true; syncGlobalOut();
      autoIn.checked = false;
      autoOut.checked = false;
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
      document.querySelectorAll('.kind-question__btn').forEach(function (b) { b.classList.remove('is-selected'); });
      btn.classList.add('is-selected');
      var answered = document.getElementById('kindQuestionAnswered');
      answered.textContent = 'Настройки применены: «' + ANSWER_LABELS[btn.dataset.answer] + '». Можно выбрать другой вариант в любой момент.';
      answered.style.display = 'block';
      // По фидбеку: без затемнения/подсветки справа — настройки просто
      // плавно переключаются (см. .reveal transitions), никакого
      // дополнительного акцента не нужно.
    });
  });

  // Кнопки "Сохранить"/"Сохранить и синхронизировать" — по фидбеку
  // должны реально срабатывать и уводить на список устройств, откуда
  // продолжается гид (см. devices.html: ?device_created=1). Раз это
  // мок без бэкенда — просто редирект с этим сигналом, без реального
  // сохранения куда-либо.
  ['saveBtn', 'saveSyncBtn'].forEach(function (id) {
    var btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', function () { window.location.href = '/?device_created=1'; });
  });

  // ============================================================
  // Сам гид — запускается, только если пришли по ссылке ?tour=1
  // (её ставит devices.html после клика "Интеграция с HikVision" ->
  // "Создать"). Подсвечивает НАСТОЯЩИЕ поля формы — переиспользует
  // общий хелпер VTourCommon (см. tour-common.js), тот же визуальный
  // язык, что в Mock-Stand: кольцо + вырез-затемнение, не сплошной
  // оверлей поверх z-index.
  // ============================================================
  var params = new URLSearchParams(window.location.search);
  if (params.get('tour') !== '1') return;

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
      // По фидбоку — только для этого шага: маловероятно, что пользователь
      // додумается вписать реальный серийник только ради появления кнопки
      // "Понятно". Достаточно клика/фокуса на поле — сразу показываем
      // кнопку И убираем затемнение (рамка остаётся тихим ориентиром),
      // чтобы инструкцию ниже было удобно читать без тёмного слоя поверх.
      instantOnFocus: true,
    },
  ];

  var idx = 0;
  var pollTimer = null;
  var highlight = null;
  var card = null;

  function clearVisuals() {
    VTourCommon.removeHighlight(highlight);
    VTourCommon.removeCard(card);
    highlight = card = null;
  }

  function pollWait(s) {
    clearInterval(pollTimer);
    var btn = card ? card.querySelector('.vtour-card__btn') : null;
    function sync() {
      if (!btn) return;
      btn.style.display = s.waitFor() ? '' : 'none';
    }
    sync();
    pollTimer = setInterval(function () {
      if (s.waitFor()) { clearInterval(pollTimer); sync(); }
    }, 350);
  }

  function showStep(i) {
    clearVisuals();
    var s = steps[i];
    if (!s) { finish(); return; }
    s.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(function () {
      highlight = VTourCommon.showHighlight(s.el);
      card = VTourCommon.showCard(s.el, {
        step: s.step, title: s.title, text: s.text,
        btnLabel: 'Понятно', onClick: next,
      });
      if (s.onEnter) s.onEnter();
      pollWait(s);

      if (s.instantOnFocus) {
        var focusTarget = s.el.querySelector('input');
        if (focusTarget) {
          var onFocus = function () {
            clearInterval(pollTimer);
            VTourCommon.fadeDim(highlight);
            var btn = card ? card.querySelector('.vtour-card__btn') : null;
            if (btn) btn.style.display = '';
            focusTarget.removeEventListener('focus', onFocus);
          };
          focusTarget.addEventListener('focus', onFocus);
        }
      }
    }, 320);
  }

  function next() {
    idx += 1;
    showStep(idx);
  }

  function finish() {
    clearInterval(pollTimer);
    clearVisuals();
    var q = document.getElementById('kindQuestion');
    q.style.display = 'block';
    q.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function repositionCurrent() {
    if (!highlight) return;
    var s = steps[idx];
    VTourCommon.updateHighlight(highlight, s.el);
    VTourCommon.positionCard(card, s.el);
  }
  window.addEventListener('resize', repositionCurrent);
  // scrollIntoView({behavior:'smooth'}) не мгновенный — кольцо/карточка
  // раньше позиционировались ОДИН раз через 320мс после старта скролла
  // и потом "отставали", если плавная прокрутка ещё продолжалась
  // (или пользователь сам прокрутил страницу). На capture:true, чтобы
  // ловить scroll и на вложенных прокручиваемых контейнерах тоже.
  window.addEventListener('scroll', repositionCurrent, true);

  // Реагируем на клик по радио "Тип устройства" сразу, не дожидаясь
  // 350мс интервала опроса — отзывчивее для самого частого случая.
  deviceTypeRadios.forEach(function (r) {
    r.addEventListener('change', function () {
      if (idx === 0) pollWait(steps[0]);
    });
  });

  showStep(0);
})();
