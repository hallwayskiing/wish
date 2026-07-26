/* ==========================================================================
   Minimal Starfield Particles
   ========================================================================== */

(function() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  let meteors = [];

  function initCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    createParticles();
  }

  function createParticles() {
    particles = [];
    // Rich starfield density
    const count = Math.floor((width * height) / 9000);

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.6 + 0.3,
        color: getColor(),
        alpha: Math.random() * 0.8 + 0.15,
        twinkleSpeed: (Math.random() * 0.012 + 0.003) * (Math.random() < 0.5 ? 1 : -1),
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1,
        glow: Math.random() < 0.18  // ~18% of stars get a soft glow
      });
    }
  }

  function getColor() {
    // Warm neutral palette only
    const colors = [
      'rgba(255, 255, 255, 1)',
      'rgba(255, 255, 255, 0.8)',
      'rgba(232, 220, 198, 0.9)',
      'rgba(207, 176, 126, 0.6)',
      'rgba(200, 200, 210, 0.7)'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function maybeCreateMeteor() {
    if (Math.random() < 0.015 && meteors.length < 2) {
      meteors.push({
        x: Math.random() * width * 0.8,
        y: -10,
        length: Math.random() * 80 + 40,
        speed: Math.random() * 5 + 3,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
        alpha: 0.8
      });
    }
  }

  function update() {
    particles.forEach(p => {
      p.alpha += p.twinkleSpeed;
      if (p.alpha >= 0.7 || p.alpha <= 0.08) {
        p.twinkleSpeed = -p.twinkleSpeed;
      }
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;
    });

    maybeCreateMeteor();
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += Math.cos(m.angle) * m.speed;
      m.y += Math.sin(m.angle) * m.speed;
      m.alpha -= 0.008;
      if (m.alpha <= 0 || m.y > height || m.x > width) {
        meteors.splice(i, 1);
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      if (p.glow) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(232, 220, 198, 0.6)';
      }
      ctx.fill();
      ctx.restore();
    });

    meteors.forEach(m => {
      ctx.save();
      ctx.globalAlpha = m.alpha;
      const endX = m.x - Math.cos(m.angle) * m.length;
      const endY = m.y - Math.sin(m.angle) * m.length;
      const grad = ctx.createLinearGradient(m.x, m.y, endX, endY);
      grad.addColorStop(0, 'rgba(232, 220, 198, 0.8)');
      grad.addColorStop(1, 'transparent');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.restore();
    });
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', initCanvas);
  initCanvas();
  loop();
})();
