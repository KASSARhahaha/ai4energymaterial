/* 能源材料智研官网：首屏场景、导航、进场动画、截图切换与「计算 vs 实验」对比图。无依赖。 */
'use strict';
(() => {
  // 颜色模式：暗灰色（默认）/ 白色。初始主题已由 index.html 头部脚本按 localStorage 写入 data-theme。
  const root = document.documentElement;
  const themeBtn = document.querySelector('.theme-btn');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const syncTheme = () => {
    const light = root.dataset.theme === 'light';
    const label = light ? '切换到暗灰色模式' : '切换到白色模式';
    if (themeBtn) { themeBtn.setAttribute('aria-label', label); themeBtn.title = label; }
    if (themeMeta) themeMeta.content = light ? '#ffffff' : '#151412';
  };
  syncTheme();
  if (themeBtn) themeBtn.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!calm) {
      root.classList.add('theme-anim');
      window.setTimeout(() => root.classList.remove('theme-anim'), 450);
    }
    root.dataset.theme = next;
    syncTheme();
    try { localStorage.setItem('ai4em-site-theme', next); } catch (e) { /* 无法存储（如隐私模式）时只在当前页面生效 */ }
  });

  // 首屏等距场景（概念示意）
  const stage = document.getElementById('hero-stage');
  if (stage && window.HeroScene) stage.innerHTML = window.HeroScene.markup();

  // 导航：滚动后加底色；移动端菜单；当前分区高亮
  const nav = document.querySelector('.site-nav');
  const menu = nav.querySelector('.menu-btn');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  const setOpen = open => { nav.classList.toggle('open', open); menu.setAttribute('aria-expanded', String(open)); };
  menu.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
  nav.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });

  const links = [...nav.querySelectorAll('.nav-links a[href^="#"]')];
  const reveal = [...document.querySelectorAll('.reveal')];
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean).forEach(s => spy.observe(s));
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    reveal.forEach(el => io.observe(el));
  } else {
    reveal.forEach(el => el.classList.add('in'));
  }

  // 工作台截图切换（七步闭环 / 研发智能体）
  const tabs = [...document.querySelectorAll('.shot-tabs [role="tab"]')];
  const select = tab => tabs.forEach(t => {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    const cap = document.getElementById(t.dataset.cap);
    if (cap) cap.hidden = !on;
  });
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      select(next); next.focus();
    });
  });

  // 计算 vs 实验：5 种溶剂的电化学窗口（V）。
  // 数值读自团队成员合作论文 Adv. Funct. Mater. 2023 图 (a)，按坐标刻度像素标定，约 ±0.1 V，以原文为准。
  const ECW = {
    solvents: ['DMSO', 'ACN', 'DMF', 'PC', 'EC'],
    series: [
      { name: '实验值', cls: 'exp', v: [4.8, 6.5, 4.6, 6.1, 6.7], label: true },
      { name: '计算值（论文口径）', cls: 'comp', v: [5.2, 7.0, 4.8, 6.7, 6.9], label: true },
      { name: 'HOMO/LUMO 估算', cls: 'homo', v: [6.4, 9.0, 6.8, 8.1, 8.2], label: false },
    ],
  };
  const chart = document.getElementById('ecw-chart');
  const n = v => v.toFixed(1);
  // 宽屏：640 宽画布并在柱顶标数值；窄屏：360 宽画布，字号随之放大，不标柱顶数值（数值见下方结论与悬停提示）。
  const drawEcw = narrow => {
    const W = narrow ? 360 : 640, H = narrow ? 250 : 290, L = narrow ? 24 : 30, R = 6, T = narrow ? 12 : 22, B = 34;
    const MAX = 10, BW = narrow ? 15 : 26, GAP = narrow ? 3 : 6;
    const pw = W - L - R, ph = H - T - B, gw = pw / ECW.solvents.length;
    const y = v => T + ph - (v / MAX) * ph;
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="ecw-t ecw-d">`
      + '<title id="ecw-t">5 种溶剂的电化学窗口：实验值、论文计算值与 HOMO/LUMO 估算（V）</title>'
      + `<desc id="ecw-d">${ECW.solvents.map((sv, i) => `${sv}：实验 ${n(ECW.series[0].v[i])} V，计算 ${n(ECW.series[1].v[i])} V，HOMO/LUMO ${n(ECW.series[2].v[i])} V`).join('；')}</desc>`;
    for (let t = 0; t <= MAX; t += 2) {
      s += `<line class="${t ? 'g' : 'base'}" x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/>`
        + `<text class="ax" x="${L - 7}" y="${y(t) + 4}" text-anchor="end">${t}</text>`;
    }
    ECW.solvents.forEach((sv, i) => {
      const gx = L + gw * i + (gw - (3 * BW + 2 * GAP)) / 2;
      ECW.series.forEach((se, k) => {
        const x = gx + k * (BW + GAP), v = se.v[i], top = y(v);
        s += `<rect class="b ${se.cls}" x="${x}" y="${top}" width="${BW}" height="${T + ph - top}" rx="${narrow ? 2 : 3}" style="transition-delay:${(i * 3 + k) * 45}ms">`
          + `<title>${sv} · ${se.name}：${n(v)} V</title></rect>`;
        if (se.label && !narrow) s += `<text class="vl ${se.cls}" x="${x + BW / 2}" y="${top - 7}" text-anchor="middle">${n(v)}</text>`;
      });
      s += `<text class="cat" x="${L + gw * i + gw / 2}" y="${H - 9}" text-anchor="middle">${sv}</text>`;
    });
    chart.innerHTML = s + '</svg>';
  };
  if (chart) {
    let narrow = null;
    const fit = () => {
      const now = chart.clientWidth < 520;
      if (now !== narrow) { narrow = now; drawEcw(now); }
    };
    fit();
    window.addEventListener('resize', fit, { passive: true });
  }

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
