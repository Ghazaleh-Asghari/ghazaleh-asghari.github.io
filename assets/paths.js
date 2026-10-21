// Hero figure: Brownian sample paths fanning out from one point,
// with the Gaussian density of their endpoints drawn at the right edge.
(function () {
  const canvas = document.getElementById("paths");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Seeded generator so the picture is the same on every visit.
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gaussian(rand) {
    const u = 1 - rand(), v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  const N = 42, STEPS = 240;
  const rand = mulberry32(20260521);
  const paths = [];
  for (let i = 0; i < N; i++) {
    const p = [0];
    for (let s = 1; s <= STEPS; s++) p.push(p[s - 1] + gaussian(rand) / Math.sqrt(STEPS));
    paths.push(p);
  }
  // Highlight the path whose endpoint is closest to one standard deviation.
  let hi = 0;
  paths.forEach((p, i) => { if (Math.abs(p[STEPS] - 1) < Math.abs(paths[hi][STEPS] - 1)) hi = i; });

  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  let progress = reduce ? 1 : 0, start = null;

  function draw() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const accent = css("--accent"), warm = css("--warm"), rule = css("--rule"), muted = css("--muted");
    const left = 8, right = w * 0.78, mid = h / 2, scale = h / 6.4; // ~3 standard deviations each side
    const x = (s) => left + (right - left) * (s / STEPS);
    const y = (v) => mid - v * scale;
    const upto = Math.max(1, Math.floor(STEPS * progress));

    // axis
    ctx.strokeStyle = rule; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(left, mid); ctx.lineTo(w - 8, mid); ctx.stroke();

    // paths
    paths.forEach((p, i) => {
      if (i === hi) return;
      ctx.strokeStyle = accent; ctx.globalAlpha = 0.16; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x(0), y(p[0]));
      for (let s = 1; s <= upto; s++) ctx.lineTo(x(s), y(p[s]));
      ctx.stroke();
    });
    ctx.globalAlpha = 1; ctx.strokeStyle = warm; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x(0), y(paths[hi][0]));
    for (let s = 1; s <= upto; s++) ctx.lineTo(x(s), y(paths[hi][s]));
    ctx.stroke();

    // endpoint density: standard normal, drawn sideways
    if (progress > 0.98) {
      const base = right + 10, amp = Math.max(0, w - base - 10);
      ctx.strokeStyle = accent; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.9;
      ctx.beginPath();
      for (let v = -3.2; v <= 3.2; v += 0.05) {
        const d = Math.exp(-v * v / 2);
        const px = base + amp * d, py = y(v);
        v === -3.2 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.globalAlpha = 0.08; ctx.fillStyle = accent; ctx.lineTo(base, y(3.2)); ctx.lineTo(base, y(-3.2)); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = muted; ctx.font = "11px Consolas, monospace";
      ctx.fillText("N(0, 1)", base + 4, y(-2.9));
    }
    ctx.globalAlpha = 1;
  }

  function frame(t) {
    if (start === null) start = t;
    progress = Math.min(1, (t - start) / 2200);
    draw();
    if (progress < 1) requestAnimationFrame(frame);
  }

  if (reduce) draw(); else requestAnimationFrame(frame);
  if ("ResizeObserver" in window) new ResizeObserver(draw).observe(canvas);
  else window.addEventListener("resize", draw);
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", draw);
})();
