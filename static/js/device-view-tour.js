(function () {
  // Кнопки копирования — реально копируют в буфер обмена, с коротким
  // визуальным подтверждением (галочка на 1.2с).
  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var value = btn.dataset.copy;
      function showCopied() {
        var original = btn.textContent;
        btn.textContent = '✓';
        btn.classList.add('is-copied');
        setTimeout(function () { btn.textContent = original; btn.classList.remove('is-copied'); }, 1200);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(showCopied).catch(showCopied);
      } else {
        showCopied();
      }
    });
  });

  // ============================================================
  // Гид — запускается по ?tour=1 (ссылку ставит devices.html после
  // клика "Просмотр" во втором гиде, продолжающем сценарий после
  // сохранения устройства).
  // ============================================================
  var params = new URLSearchParams(window.location.search);
  if (params.get('tour') !== '1') return;

  var isupBlock = document.getElementById('isupBlock');
  var setupGuide = document.getElementById('setupGuideBox');

  isupBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });

  setTimeout(function () {
    var highlight = VTourCommon.showHighlight(isupBlock);
    var card = VTourCommon.showCard(isupBlock, {
      step: 'Что дальше',
      title: 'Вот данные для ISUP-подключения',
      text: 'Эти 4 значения нужно перенести на само устройство — адрес и порт совпадают у всех, ID и ключ уникальны для этого устройства.',
      btnLabel: 'Понятно, дальше',
      onClick: function () {
        VTourCommon.removeHighlight(highlight);
        VTourCommon.removeCard(card);
        setupGuide.classList.add('is-open');
        setTimeout(function () { setupGuide.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 350);
      },
    });

    window.addEventListener('resize', function () {
      VTourCommon.updateHighlight(highlight, isupBlock);
      VTourCommon.positionCard(card, isupBlock);
    });
  }, 350);
})();
