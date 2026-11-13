(() => {
  'use strict';
  const canvas = document.getElementById('auroraCanvas');
  const button = document.getElementById('lightButton');
  const status = document.getElementById('lightStatus');
  const buffer = document.createElement('canvas');
  const sky = buffer.getContext('2d');
  if (!sky || !canvas.getContext('2d')) {
    button.hidden = true;
    document.querySelector('.lake-hint').hidden = true;
    return;
  }
  const ripples = [];
  let lastTime = 0;
  let scene;

  function curtains(ctx, width, height, time) {
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'screen';
    for (let band = 0; band < 3; band++) {
      const rgb = band === 1 ? '161,142,216' : band === 2 ? '102,181,207' : '119,229,185';
      const gradient = ctx.createLinearGradient(0, height * .12, 0, height * .7);
      gradient.addColorStop(0, `rgba(${rgb},0)`);
      gradient.addColorStop(.38, `rgba(${rgb},.03)`);
      gradient.addColorStop(.68, `rgba(${rgb},.3)`);
      gradient.addColorStop(1, `rgba(${rgb},0)`);
      const wave = x => height * (.37 + band * .055 + .07 * Math.sin(x / width * 5 + time * .12 + band * 1.8) + .035 * Math.sin(x / width * 10 - time * .07));
      ctx.fillStyle = gradient;
      ctx.beginPath();
      for (let x = -20; x <= width + 20; x += 10) {
        const y = wave(x);
        if (x === -20) ctx.moveTo(x, y - height * .2); else ctx.lineTo(x, y - height * .2);
      }
      for (let x = width + 20; x >= -20; x -= 10) ctx.lineTo(x, wave(x) + height * .04);
      ctx.closePath(); ctx.fill();
      for (let i = 0; i < 70; i++) {
        const x = width * i / 69;
        const y = wave(x);
        const length = height * (.13 + .07 * Math.sin(i * .15 + time * .1 + band));
        const strand = ctx.createLinearGradient(x, y - length, x, y + height * .04);
        strand.addColorStop(0, `rgba(${rgb},0)`);
        strand.addColorStop(.8, `rgba(${rgb},${.04 + .08 * (.5 + .5 * Math.sin(i * 1.6))})`);
        strand.addColorStop(1, `rgba(${rgb},0)`);
        ctx.strokeStyle = strand;
        ctx.lineWidth = Math.max(1, width / 180);
        ctx.beginPath(); ctx.moveTo(x - width * .045, y - length);
        ctx.quadraticCurveTo(x - width * .02, y - length * .3, x, y + height * .04);
        ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  scene = window.Welten.createScene(canvas, ({ ctx, width, height, time, still }) => {
    if (!width || !height) return;
    const scale = Math.min(1, 1000 / width);
    const bw = Math.round(width * scale), bh = Math.round(height * scale);
    if (buffer.width !== bw || buffer.height !== bh) { buffer.width = bw; buffer.height = bh; }
    curtains(sky, bw, bh, time);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(buffer, 0, 0, width, height);
    const horizon = height * .68;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, horizon, width, height - horizon); ctx.clip();
    ctx.translate(0, horizon * 2); ctx.scale(1, -1); ctx.globalAlpha = .3;
    ctx.drawImage(buffer, 0, 0, width, height);
    ctx.restore();
    const fade = ctx.createLinearGradient(0, horizon, 0, height);
    fade.addColorStop(0, '#080f1c33'); fade.addColorStop(1, '#080f1ce6');
    ctx.fillStyle = fade; ctx.fillRect(0, horizon, width, height - horizon);
    const delta = Math.max(0, time - lastTime); lastTime = time;
    for (let i = ripples.length - 1; i >= 0; i--) {
      const ripple = ripples[i];
      if (!still) ripple.age += delta;
      if (ripple.age > 5) { ripples.splice(i, 1); continue; }
      const age = still ? .9 : ripple.age;
      const x = ripple.x * width, y = ripple.y * height;
      const radius = 10 + age * 34;
      ctx.strokeStyle = `rgba(174,238,212,${Math.max(0, 1 - age / 5) * .55})`;
      ctx.lineWidth = 1;
      for (let ring = 0; ring < 3; ring++) {
        ctx.beginPath(); ctx.ellipse(x, y, radius + ring * 13, (radius + ring * 13) * .22, 0, 0, Math.PI * 2); ctx.stroke();
      }
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 14);
      glow.addColorStop(0, '#d9fff2aa'); glow.addColorStop(1, '#d9fff200');
      ctx.fillStyle = glow; ctx.fillRect(x - 14, y - 14, 28, 28);
    }
  }, 24);

  function addLight(x, y) {
    if (ripples.length >= 6) ripples.shift();
    ripples.push({ x, y, age: 0 });
    status.textContent = 'Ein kleines Licht. Nur für dich.';
    scene.invalidate();
  }
  canvas.addEventListener('click', event => {
    const rect = canvas.getBoundingClientRect();
    const y = (event.clientY - rect.top) / rect.height;
    if (y >= .69) addLight((event.clientX - rect.left) / rect.width, y);
  });
  button.addEventListener('click', () => addLight(.3 + Math.random() * .4, .76));
})();
