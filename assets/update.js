(() => {
  'use strict';
  // Change this version only when there is a new announcement to show.
  const version = '2026-11-13-feinschliff';
  const cookie = 'welten_update_seen=' + encodeURIComponent(version);
  const base = new URL('../', document.currentScript.src);
  try {
    if (document.cookie.split(';').some(part => part.trim() === cookie)) return;
  } catch { /* The notice remains usable if cookies are blocked. */ }

  const dialog = document.createElement('dialog');
  dialog.className = 'update-dialog';
  dialog.setAttribute('aria-labelledby', 'updateTitle');
  dialog.setAttribute('aria-describedby', 'updateDescription');
  dialog.innerHTML = `
    <div class="update-content">
      <p class="update-eyebrow">Ein kleines Update</p>
      <h2 id="updateTitle" tabindex="-1" autofocus>Deine Welten<br><em>strahlen neu.</em></h2>
      <p class="update-description" id="updateDescription">Alle Welten haben einen Feinschliff erhalten: feinere Details, sanftere Animationen und noch mehr Atmosphäre.</p>
      <div class="update-world">
        <span class="update-planet" aria-hidden="true"></span>
        <div><p class="update-new">Eine neue Welt</p><h3>Nordlicht</h3><p>Tanzende Polarlichter über einem stillen See.</p></div>
      </div>
      <a class="update-discover" data-update-link>Nordlicht entdecken <span aria-hidden="true">↗</span></a>
      <button class="update-dismiss" type="button" data-update-close>Weiter entdecken</button>
    </div>`;
  dialog.querySelector('[data-update-link]').href = new URL('northern_lights/index.html', base).href;
  dialog.querySelector('[data-update-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('has-update-dialog');
    dialog.remove();
  });
  document.body.appendChild(dialog);
  try {
    dialog.showModal();
    document.documentElement.classList.add('has-update-dialog');
  } catch {
    dialog.remove();
    return;
  }
  // Mark as seen only after the notice has actually been displayed.
  try {
    document.cookie = cookie + '; Max-Age=31536000; Path=' + base.pathname + '; SameSite=Lax' + (base.protocol === 'https:' ? '; Secure' : '');
  } catch { /* Navigation and dismissal still work without cookie storage. */ }
})();
