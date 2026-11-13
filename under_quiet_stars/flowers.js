(() => {
  const button = document.getElementById('startBtn');
  const back = document.getElementById('backBtn');
  const frame = document.getElementById('flowerScene');
  const intro = document.getElementById('flowerIntro');
  const caption = document.getElementById('flowerCaption');
  button.addEventListener('click', () => {
    intro.hidden = true;
    caption.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    frame.inert = false;
    frame.setAttribute('aria-hidden', 'false');
    frame.classList.add('visible', 'started');
    back.setAttribute('aria-label', 'Blumen schließen');
    document.getElementById('catBtn').focus({ preventScroll: true });
  });
  back.addEventListener('click', () => {
    if (!frame.classList.contains('started')) {
      location.href = '../index.html';
      return;
    }
    frame.classList.remove('visible', 'started');
    frame.inert = true;
    frame.setAttribute('aria-hidden', 'true');
    intro.hidden = false;
    caption.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    back.setAttribute('aria-label', 'Zurück zu deinen Welten');
    button.focus({ preventScroll: true });
  });
})();
