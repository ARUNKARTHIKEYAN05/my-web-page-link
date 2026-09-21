/**
 * Interactive Background Constellation & Particle Mesh Canvas
 * ARUNKARTHIKEYAN M Portfolio
 * Features: High-performance 60fps rendering, dual tech (cyan) & cinema (amber) nodes,
 * mouse parallax reactivity, and battery/reduced-motion friendly lifecycle.
 */

(function () {
  'use strict';

  // Check reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let dpr = window.devicePixelRatio || 1;
  let animationFrameId = null;
  let isVisible = true;

  // Particle configuration
  const particles = [];
  const PARTICLE_COUNT_DESKTOP = 65;
  const PARTICLE_COUNT_MOBILE = 30;
  const MAX_CONNECT_DISTANCE = 140;
  const MOUSE_RADIUS = 150;

  const mouse = {
    x: null,
    y: null,
    radius: MOUSE_RADIUS
  };

  // Color tokens matching CSS variables
  const COLOR_CYAN = { r: 56, g: 189, b: 248 };   // #38bdf8
  const COLOR_AMBER = { r: 245, g: 158, b: 11 };  // #f59e0b
  const COLOR_PURPLE = { r: 168, g: 85, b: 247 }; // #a855f7

  class Particle {
    constructor(w, h) {
      this.reset(w, h, true);
    }

    reset(w, h, initial = false) {
      this.x = initial ? Math.random() * w : (Math.random() > 0.5 ? 0 : w);
      this.y = initial ? Math.random() * h : (Math.random() > 0.5 ? 0 : h);
      this.radius = Math.random() * 1.8 + 1.2;
      this.vx = (Math.random() - 0.5) * 0.65;
      this.vy = (Math.random() - 0.5) * 0.65;
      
      // Assign dual identity colors (70% tech cyan, 25% cinema amber, 5% purple)
      const rand = Math.random();
      if (rand < 0.65) {
        this.color = COLOR_CYAN;
      } else if (rand < 0.90) {
        this.color = COLOR_AMBER;
      } else {
        this.color = COLOR_PURPLE;
      }
      this.alpha = Math.random() * 0.5 + 0.3;
      this.baseAlpha = this.alpha;
    }

    update(w, h) {
      this.x += this.vx;
      this.y += this.vy;

      // Bounce smoothly off boundaries
      if (this.x < 0 || this.x > w) this.vx *= -1;
      if (this.y < 0 || this.y > h) this.vy *= -1;

      // Mouse interaction
      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          // Gentle push away
          this.x -= Math.cos(angle) * force * 1.8;
          this.y -= Math.sin(angle) * force * 1.8;
          this.alpha = Math.min(1, this.baseAlpha + force * 0.4);
        } else {
          this.alpha = this.baseAlpha;
        }
      }
    }

    draw(context) {
      context.beginPath();
      context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha})`;
      context.fill();
    }
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.scale(dpr, dpr);

    // Initialize or adjust particle count
    const targetCount = width < 768 ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP;
    particles.length = 0;
    for (let i = 0; i < targetCount; i++) {
      particles.push(new Particle(width, height));
    }
  }

  function drawConnections() {
    const pLen = particles.length;
    for (let i = 0; i < pLen; i++) {
      const p1 = particles[i];
      for (let j = i + 1; j < pLen; j++) {
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MAX_CONNECT_DISTANCE) {
          const lineAlpha = (1 - dist / MAX_CONNECT_DISTANCE) * 0.18;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(${p1.color.r}, ${p1.color.g}, ${p1.color.b}, ${lineAlpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // Connect to mouse if close
      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - p1.x;
        const dy = mouse.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const mouseLineAlpha = (1 - dist / mouse.radius) * 0.25;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(56, 189, 248, ${mouseLineAlpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    if (!isVisible) return;

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      particles[i].update(width, height);
      particles[i].draw(ctx);
    }

    drawConnections();

    animationFrameId = requestAnimationFrame(animate);
  }

  // Event Listeners
  let resizeTimeout;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 150);
  });

  window.addEventListener('mousemove', function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseleave', function () {
    mouse.x = null;
    mouse.y = null;
  });

  // Optimize performance: pause loop when tab is hidden
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      isVisible = false;
      cancelAnimationFrame(animationFrameId);
    } else {
      isVisible = true;
      animate();
    }
  });

  // Kickoff
  resize();
  animate();
})();
