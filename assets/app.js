(() => {
  'use strict';
  const root = document.documentElement;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let manuallyPaused = false;
  try { manuallyPaused = sessionStorage.getItem('welten-paused') === 'true'; } catch { /* Optional storage. */ }
  const isStill = () => preference.matches || manuallyPaused;
  function updateMotion() {
    root.dataset.motion = isStill() ? 'still' : 'moving';
    root.dataset.background = String(document.hidden);
    document.querySelectorAll('[data-motion-toggle]').forEach(button => {
      button.setAttribute('aria-pressed', String(isStill()));
      const label = preference.matches ? 'Bewegung durch Systemeinstellung reduziert' : manuallyPaused ? 'Animationen fortsetzen' : 'Animationen pausieren';
      button.setAttribute('aria-label', label);
      button.title = label;
      button.disabled = preference.matches;
    });
    document.dispatchEvent(new Event('welten:motionchange'));
  }
  document.querySelectorAll('[data-motion-toggle]').forEach(button => button.addEventListener('click', () => {
    manuallyPaused = !manuallyPaused;
    try { sessionStorage.setItem('welten-paused', String(manuallyPaused)); } catch { /* Optional storage. */ }
    updateMotion();
  }));
  preference.addEventListener('change', updateMotion);
  document.addEventListener('visibilitychange', updateMotion);
  window.addEventListener('pageshow', updateMotion);
  function createScene(canvas, render, fps = 30) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return { invalidate() {} };
    let width = 0, height = 0, frame = 0, last = null, time = 0;
    function draw() { render({ ctx, width, height, time, still: isStill() }); }
    function tick(now) {
      frame = 0;
      if (document.hidden || isStill()) return;
      if (last === null || now - last >= 1000 / fps) {
        if (last !== null) time += Math.min((now - last) / 1000, .1);
        last = now;
        draw();
      }
      frame = requestAnimationFrame(tick);
    }
    function sync() {
      cancelAnimationFrame(frame);
      frame = 0;
      last = null;
      if (!document.hidden) {
        draw();
        if (!isStill()) frame = requestAnimationFrame(tick);
      }
    }
    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = rect.width; height = rect.height;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      sync();
    }
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('welten:motionchange', sync);
    window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); frame = 0; });
    window.addEventListener('pageshow', sync);
    resize();
    return { invalidate: sync };
  }
  window.Welten = { createScene, isStill };
  updateMotion();
  document.querySelectorAll('[data-stars]').forEach(layer => {
    const canvas = document.createElement('canvas');
    layer.appendChild(canvas);
    const mode = layer.dataset.stars;
    const count = innerWidth < 600 ? 100 : 190;
    const stars = Array.from({ length: count }, () => ({ x: Math.random(), y: Math.random(), radius: .35 + Math.random() * 1.05, phase: Math.random() * Math.PI * 2, speed: .3 + Math.random() * .5 }));
    createScene(canvas, ({ ctx, width, height, time }) => {
      ctx.clearRect(0, 0, width, height);
      for (const star of stars) {
        if (mode === 'night' && star.x > .16 && star.x < .84 && star.y > .23 && star.y < .61) continue;
        ctx.globalAlpha = .22 + (.5 + Math.sin(time * star.speed + star.phase) * .5) * .48;
        ctx.fillStyle = star.radius > 1.1 ? '#dfd2f4' : '#eef1ff';
        ctx.beginPath(); ctx.arc(star.x * width, star.y * height, star.radius, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }, 24);
  });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    const script = document.querySelector('script[src$="assets/app.js"]');
    const worker = new URL('../sw.js', script.src);
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(worker.href).catch(() => { /* Site remains usable without offline storage. */ });
    });
  }
})();
