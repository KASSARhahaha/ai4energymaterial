/* 官网首屏：自主研发闭环的等距概念场景 + 四张层级卡片。
   场景几何沿用研发工作台（research-workbench/dist/hero-scene.js）；官网版不显示任何项目记录数字，
   卡片只链接到页面内的对应分区。场景为概念示意，不代表已建设备。 */
'use strict';
window.HeroScene = (() => {
  // Isometric projection into a 1260 x 520 viewBox. x runs right-down, y runs left-down, z up.
  const VW = 1260, VH = 520, W = 10, D = 8, U = 37, OX = 806, OY = 92;
  const C = 0.8660254, S = 0.5;
  const P = (x, y, z = 0) => [OX + (x - y) * U * C, OY + (x + y) * U * S - z * U];
  const f = n => n.toFixed(1);
  const pts = list => list.map(p => P(...p).map(f).join(',')).join(' ');
  const poly = (list, cls) => `<polygon class="${cls}" points="${pts(list)}"/>`;
  const add = (a, b) => a.map((v, i) => v + b[i]);

  // A box shows its top, its +y face (front-left) and its +x face (front-right).
  const box = (x, y, z, w, d, h, tone, extra = '') => `<g class="bx ${tone}">`
    + poly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]], 'fl')
    + poly([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]], 'fr')
    + poly([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], 'ft') + extra + '</g>';
  const paneY = (x, y, z, w, h, cls) => poly([[x, y, z], [x + w, y, z], [x + w, y, z + h], [x, y, z + h]], cls);
  const paneX = (x, y, z, d, h, cls) => poly([[x, y, z], [x, y + d, z], [x, y + d, z + h], [x, y, z + h]], cls);
  const ellipse = (x, y, z, r, cls, extra = '') => {
    const [cx, cy] = P(x, y, z);
    return `<ellipse class="${cls}" cx="${f(cx)}" cy="${f(cy)}" rx="${f(1.2247449 * r * U)}" ry="${f(0.7071068 * r * U)}"${extra}/>`;
  };
  const cyl = (x, y, z, r, h, tone) => {
    const [cx, cyB] = P(x, y, z), rx = 1.2247449 * r * U, ry = 0.7071068 * r * U, cyT = cyB - h * U;
    return `<g class="cy ${tone}"><path class="fl" d="M${f(cx - rx)},${f(cyT)}V${f(cyB)}A${f(rx)},${f(ry)} 0 0 0 ${f(cx + rx)},${f(cyB)}V${f(cyT)}Z"/>`
      + `<path class="sh" d="M${f(cx - rx * .55)},${f(cyT + ry * .84)}V${f(cyB + ry * .84)}"/>`
      + `<ellipse class="ft" cx="${f(cx)}" cy="${f(cyT)}" rx="${f(rx)}" ry="${f(ry)}"/></g>`;
  };
  // A circle drawn on the vertical plane x = const (ports on a front-right face).
  const portX = (x, y, z, r) => {
    const ring = Array.from({ length: 18 }, (_, i) => { const t = i / 18 * Math.PI * 2; return [x, y + Math.cos(t) * r, z + Math.sin(t) * r]; });
    return poly(ring, 'port');
  };
  const seg = (a, b, w, cls) => { const [x1, y1] = P(...a), [x2, y2] = P(...b); return `<line class="${cls}" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke-width="${w}"/>`; };
  const joint = (p, r) => { const [cx, cy] = P(...p); return `<circle class="joint" cx="${f(cx)}" cy="${f(cy)}" r="${r}"/>`; };
  const arm = (x, y, z, pose) => {
    const j0 = [x, y, z + .34], j1 = add(j0, pose[0]), j2 = add(j1, pose[1]), j3 = add(j2, pose[2]);
    const link = (a, b, w) => seg(a, b, w + 3, 'arm-o') + seg(a, b, w, 'arm') + seg(a, b, Math.max(1.2, w * .3), 'arm-hl');
    return `<g class="robot">${cyl(x, y, z, .26, .16, 'tone-white')}${cyl(x, y, z + .16, .17, .18, 'tone-white')}`
      + link(j0, j1, 9) + joint(j1, 5.4) + link(j1, j2, 7) + joint(j2, 4.4) + link(j2, j3, 4)
      + seg(add(j3, [0, -.07, 0]), add(j3, [0, -.07, -.13]), 2.2, 'grip') + seg(add(j3, [0, .07, 0]), add(j3, [0, .07, -.13]), 2.2, 'grip') + '</g>';
  };

  // The closed loop drawn on the floor, with arrowheads and data packets travelling along it.
  const LOOP = { cx: 5.1, cy: 4.05, r: 3.25 };
  const loopAt = t => [LOOP.cx + Math.cos(t) * LOOP.r, LOOP.cy + Math.sin(t) * LOOP.r, .01];
  const loopPath = () => {
    const n = 96; let d = '';
    for (let i = 0; i <= n; i++) { const [sx, sy] = P(...loopAt(i / n * Math.PI * 2)); d += `${i ? 'L' : 'M'}${f(sx)},${f(sy)}`; }
    return d + 'Z';
  };
  const arrowAt = t => {
    const [ax, ay] = P(...loopAt(t)), [bx, by] = P(...loopAt(t + .02));
    const len = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / len, uy = (by - ay) / len;
    const tip = [ax + ux * 7, ay + uy * 7], l = [ax - ux * 4 - uy * 5, ay - uy * 4 + ux * 5], r = [ax - ux * 4 + uy * 5, ay - uy * 4 - ux * 5];
    return `<polygon class="arrow" points="${[tip, l, r].map(p => p.map(f).join(',')).join(' ')}"/>`;
  };

  // Screen anchors (viewBox units) where each layer card's leader line lands.
  const ANCHOR = {
    agent: P(2.05, 6.13, 1.12),
    compute: P(.85, .75, 2.1),
    experiment: P(6.9, .6, 2.15),
    data: P(...loopAt(.95)),
  };

  function scene(reduceMotion) {
    const o = [];
    const [cx, cy] = P(W / 2, D / 2, -.35);
    o.push('<defs>'
      + '<linearGradient id="hs-win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="hs-w0"/><stop offset=".55" class="hs-w1"/><stop offset="1" class="hs-w2"/></linearGradient>'
      + '<linearGradient id="hs-screen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="hs-s0"/><stop offset="1" class="hs-s1"/></linearGradient>'
      + '<radialGradient id="hs-pool" cx=".5" cy=".5" r=".5"><stop offset="0" class="hs-p0"/><stop offset="1" class="hs-p1"/></radialGradient>'
      + '<filter id="hs-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6"/></filter>'
      + '</defs>');
    // ripples under the platform
    [7.4, 8.6, 9.8, 11, 12.2, 13.4].forEach((r, i) => o.push(`<ellipse class="ripple" cx="${f(cx)}" cy="${f(cy)}" rx="${f(1.2247449 * r * U)}" ry="${f(0.7071068 * r * U)}" opacity="${f(1 - i * .14)}"/>`));
    // platform slab, grid and lit edge
    o.push(box(0, 0, -.35, W, D, .35, 'tone-floor'));
    for (let i = 1; i < W; i++) o.push(seg([i, 0, 0], [i, D, 0], 1, 'grid'));
    for (let j = 1; j < D; j++) o.push(seg([0, j, 0], [W, j, 0], 1, 'grid'));
    o.push(`<polygon class="slab-edge" points="${pts([[0, 0, 0], [W, 0, 0], [W, D, 0], [0, D, 0]])}"/>`);
    o.push(ellipse(5.1, 3.7, 0, 2.7, 'pool', ' fill="url(#hs-pool)"'));
    o.push(`<polygon class="zone" points="${pts([[3.25, 2.35, 0], [6.95, 2.35, 0], [6.95, 5.0, 0], [3.25, 5.0, 0]])}"/>`);
    // the loop on the floor
    const loop = loopPath();
    o.push(`<path class="loop-base" d="${loop}"/><path class="loop" d="${loop}"/>`);
    [.35, 1.95, 3.55, 5.15].forEach(t => o.push(arrowAt(t)));
    if (!reduceMotion) [0, 3, 6].forEach(b => o.push(`<circle class="packet" r="3.2"><animateMotion dur="9s" begin="-${b}s" repeatCount="indefinite" path="${loop}"/></circle>`));

    // compute rack in the back corner
    let rack = '';
    for (let z = .32; z < 1.95; z += .2) rack += seg([1.36, .42, z], [1.36, 1.08, z], 1.5, z > 1.2 ? 'led g' : 'led');
    for (let z = .32; z < 1.95; z += .2) rack += seg([.48, 1.21, z], [1.2, 1.21, z], 1.5, 'led dim');
    o.push(box(.35, .3, 0, 1, .9, 2.1, 'tone-dark', rack));
    // back-left bench: vial shelf, glovebox, centrifuge
    o.push(box(.25, 1.6, 0, 1.25, 5.3, .82, 'tone-body'), box(.2, 1.55, .82, 1.35, 5.4, .08, 'tone-top'));
    o.push(box(.38, 1.75, .9, .95, 1.55, .05, 'tone-metal'), box(.38, 1.75, 1.42, .95, 1.55, .05, 'tone-metal'));
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
      o.push(cyl(.62 + j * .45, 1.98 + i * .35, .95, .07, .26, (i + j) % 2 ? 'tone-white' : 'tone-gold'));
      o.push(cyl(.62 + j * .45, 1.98 + i * .35, 1.47, .07, .22, (i + j) % 3 ? 'tone-white' : 'tone-gold'));
    }
    o.push(box(.38, 1.75, 1.92, .95, 1.55, .05, 'tone-metal'));
    o.push(box(.32, 3.65, .9, 1.1, 1.85, .95, 'tone-glass', portX(1.421, 4.15, 1.28, .17) + portX(1.421, 4.95, 1.28, .17)));
    o.push(box(.3, 3.63, 1.85, 1.14, 1.89, .06, 'tone-metal'));
    o.push(cyl(.86, 6.2, .9, .38, .42, 'tone-white'), ellipse(.86, 6.2, 1.33, .22, 'lid'));
    // back-right bench: furnace, reactor, balance, hood
    o.push(box(1.7, .25, 0, 6.9, 1.25, .82, 'tone-body'), box(1.65, .2, .82, 7, 1.35, .08, 'tone-top'));
    o.push(box(2.05, .35, .9, 1.3, 1, .95, 'tone-white', paneY(2.25, 1.351, 1.05, .9, .5, 'win-glow') + paneY(2.25, 1.351, 1.05, .9, .5, 'win')));
    o.push(cyl(4.05, .85, .9, .36, 1.15, 'tone-metal'), ellipse(4.05, .85, 1.62, .37, 'band'));
    o.push(box(4.9, .4, .9, .75, .7, .2, 'tone-white'), box(4.98, .48, 1.1, .58, .54, .32, 'tone-glass'));
    o.push(box(6.2, .3, .9, 2.1, 1.1, 1.62, 'tone-white', paneY(6.36, 1.401, 1.02, 1.78, 1.18, 'glass-dark') + paneY(6.5, 1.402, 1.9, 1.5, .06, 'strip')));
    // centre island with plates and the main arm
    o.push(box(3.7, 2.8, 0, 2.8, 1.7, .78, 'tone-body'), box(3.65, 2.75, .78, 2.9, 1.8, .08, 'tone-top'));
    o.push(box(3.95, 3, .86, .95, .66, .07, 'tone-white'));
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) o.push(ellipse(4.08 + i * .21, 3.12 + j * .2, .935, .055, (i * 3 + j) % 4 ? 'well' : 'well hot'));
    o.push(box(3.95, 3.85, .86, .95, .55, .07, 'tone-white'));
    o.push(arm(5.6, 3.6, .86, [[-.1, -.2, .85], [-.62, -.05, -.12], [0, 0, -.34]]));
    // workstation front-left: the agent terminal
    let screens = '';
    screens += paneY(1.52, 6.171, .84, .86, .5, 'screen') + paneY(2.52, 6.171, .84, .76, .5, 'screen');
    const chart = [[1.58, .98], [1.7, 1.1], [1.82, 1.03], [1.94, 1.18], [2.06, 1.12], [2.18, 1.24], [2.3, 1.2]];
    screens += `<polyline class="trace" points="${chart.map(([x, z]) => P(x, 6.172, z).map(f).join(',')).join(' ')}"/>`;
    for (let i = 0; i < 4; i++) screens += seg([2.6 + i * .16, 6.172, .9], [2.6 + i * .16, 6.172, .98 + i * .07], 3, 'bar');
    o.push(box(1.3, 5.8, 0, 2.2, 1, .72, 'tone-body'), box(1.25, 5.75, .72, 2.3, 1.1, .06, 'tone-top'));
    o.push(box(1.5, 6.1, .78, .9, .07, .58, 'tone-dark'), box(2.5, 6.1, .78, .8, .07, .58, 'tone-dark'), `<g>${screens}</g>`);
    // mobile robot carrying samples
    o.push(ellipse(5.15, 6.02, .01, .95, 'agv-ring'));
    o.push(box(4.6, 5.6, 0, 1.1, .85, .32, 'tone-white'), box(4.66, 5.66, .32, .98, .73, .05, 'tone-top'));
    o.push(arm(5.15, 6.02, .37, [[.05, -.12, .7], [.42, -.28, -.08], [0, 0, -.28]]));
    // characterisation cabinet front-right
    o.push(box(7.5, 4.6, 0, 1.9, 1.6, 2.05, 'tone-white', paneY(7.7, 6.201, .85, 1.5, .9, 'win-glow') + paneY(7.7, 6.201, .85, 1.5, .9, 'win') + paneX(9.401, 4.85, 1.75, 1.1, .1, 'strip')));
    o.push(ellipse(8.45, 5.4, 2.06, .16, 'beacon'));
    return o.join('');
  }

  const CARDS = [
    { key: 'compute', n: '02', href: '#evidence', title: '高通量计算层', left: 40.2, top: 2.5 },
    { key: 'experiment', n: '03', href: '#services', title: '高通量实验层', left: 80.2, top: 3.5 },
    { key: 'data', n: '04', href: '#workbench', title: '数据飞轮层', left: 80.2, top: 64 },
    { key: 'agent', n: '01', href: '#workbench', title: 'AI 智能体层', left: 40.2, top: 66 },
  ];
  const DESC = {
    agent: '文献挖掘 · 候选生成 · 多目标优化',
    compute: 'xTB → MD → DFT 多保真调度',
    experiment: '合作实验验证 · 自动配液单元规划中',
    data: '结果回写候选，重训代理模型',
  };

  function leaders() {
    return CARDS.map(c => {
      const below = c.top > 50, x = (c.left + 9.5) / 100 * VW, y = (below ? c.top : c.top + 23) / 100 * VH;
      const [ax, ay] = ANCHOR[c.key];
      return `<path class="leader" d="M${f(x)},${f(y)}L${f(ax)},${f(ay)}"/><circle class="leader-dot" cx="${f(ax)}" cy="${f(ay)}" r="3"/>`;
    }).join('');
  }

  function markup() {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cards = CARDS.map(c => `<a class="layer-card lc-${c.key}" href="${c.href}" style="left:${c.left}%;top:${c.top}%">`
      + `<span class="lc-top"><span class="lc-index">${c.n}</span><strong>${c.title}</strong></span>`
      + `<span class="lc-desc">${DESC[c.key]}</span></a>`).join('');
    return `<div class="hero-canvas"><svg class="hero-scene" viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">`
      + scene(reduce) + `<g class="leaders">${leaders()}</g></svg></div>`
      + `<div class="layer-cards" role="group" aria-label="自主研发闭环的四个层级（概念示意）">${cards}</div>`
      + '<span class="hero-note">概念示意 · 不代表已建设备</span>';
  }

  return { markup };
})();
