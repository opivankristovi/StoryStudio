/* StickStudio 2 – cartoon character engine.
 * Bold-outline chibi cartoon style: big round heads with large white eyes, chunky tube limbs,
 * flat-coloured layered outfits. Every figure = character × pose (joint angles) × expression × effects.
 * Angles are absolute, in degrees: 0 = straight down, 90 = forward (+x), -90 = backward, 180 = up.
 * Figures are drawn facing right; flipping is done by the item transform.
 */
(function () {
  const NW = 120, NH = 220;           // native box
  const GROUND = 212;                 // ground line inside native box
  const PAPER = '#ffffff';

  // sw/hw = shoulder / hip half-width, arm/leg = limb half-thickness
  const PROPORTIONS = {
    adult: { torso: 44, neck: 3, upper: 23, lower: 21, thigh: 30, shin: 28, head: 24, sw: 15, hw: 12.5, arm: 5, leg: 6 },
    kid:   { torso: 34, neck: 2, upper: 18, lower: 16, thigh: 22, shin: 21, head: 23, sw: 12.5, hw: 11, arm: 4.4, leg: 5.3 }
  };

  // ---------------------------------------------------------------- poses (unchanged from StickStudio)
  // la/ra = left/right arm [upper, forearm], ll/rl = legs [thigh, shin]
  const POSES = {
    stand:    { name: 'Stand',        view: 'front', la: [-14, -8],  ra: [14, 8],    ll: [-9, -5],  rl: [9, 5] },
    hips:     { name: 'Hands on hips',view: 'front', la: [-55, 35],  ra: [55, -35],  ll: [-11, -6], rl: [11, 6] },
    walk:     { name: 'Walk',         view: 'side', lean: 4, la: [-28, -12], ra: [28, 45], ll: [-22, -12], rl: [24, 6] },
    run:      { name: 'Run',          view: 'side', lean: 18, la: [-55, -110], ra: [55, 140], ll: [-35, -85], rl: [75, 10], fxAuto: ['speed'] },
    panic:    { name: 'Panic run',    view: 'side', lean: 14, la: [150, 175], ra: [-150, -175], ll: [-35, -85], rl: [70, 5] },
    jump:     { name: 'Jump for joy', view: 'front', la: [-140, -165], ra: [140, 165], ll: [-55, 15], rl: [55, -15], lift: 26 },
    cheer:    { name: 'Cheer',        view: 'front', la: [-150, -170], ra: [150, 170], ll: [-12, -6], rl: [12, 6] },
    wave:     { name: 'Wave / Hello', view: 'front', la: [-14, -8], ra: [125, 170], ll: [-9, -5], rl: [9, 5] },
    point:    { name: 'Point',        view: 'side', la: [-18, -6], ra: [88, 90], ll: [-12, -6], rl: [12, 4] },
    think:    { name: 'Think',        view: 'front', la: [-40, 50], ra: [25, 168], ll: [-9, -5], rl: [9, 5] },
    scratch:  { name: 'Confused',     view: 'front', la: [-16, -10], ra: [150, -120], ll: [-9, -5], rl: [9, 5] },
    shock:    { name: 'Shocked',      view: 'front', la: [-45, 160], ra: [45, -160], ll: [-10, -4], rl: [10, 4] },
    shrug:    { name: 'Shrug',        view: 'front', la: [-70, -150], ra: [70, 150], ll: [-9, -5], rl: [9, 5] },
    angry:    { name: 'Angry',        view: 'front', la: [-60, 5],   ra: [60, -5],   ll: [-24, -10], rl: [24, 10] },
    fight:    { name: 'Fight stance', view: 'side', lean: 6, la: [30, 150], ra: [70, 160], ll: [-24, -14], rl: [26, 6] },
    punch:    { name: 'Punch',        view: 'side', lean: 12, la: [-30, 150], ra: [90, 90], ll: [-30, -20], rl: [30, 5] },
    kick:     { name: 'Kick',         view: 'side', lean: -12, la: [-80, -120], ra: [60, 140], ll: [-4, -4], rl: [85, 95] },
    carry:    { name: 'Hold out',     view: 'side', la: [45, 95], ra: [55, 95], ll: [-10, -5], rl: [10, 5] },
    sit:      { name: 'Sit (chair)',  view: 'side', la: [25, 85], ra: [35, 90], ll: [88, 2], rl: [92, -2] },
    sitfloor: { name: 'Sit (floor)',  view: 'side', lean: -8, dx: -18, la: [40, 95], ra: [50, 100], ll: [120, 60], rl: [112, 52], ground: 'hip' },
    kneel:    { name: 'Kneel',        view: 'side', la: [-15, -5], ra: [20, 8], ll: [2, -92], rl: [90, 0] },
    pray:     { name: 'Kneel & bow',  view: 'side', lean: 25, head: 20, la: [70, 150], ra: [75, 150], ll: [2, -92], rl: [90, 0] },
    lean:     { name: 'Lean on wall', view: 'side', lean: -6, la: [-20, -10], ra: [150, 172], ll: [16, -8], rl: [-6, 6] },
    dance:    { name: 'Dance',        view: 'front', la: [-60, 30], ra: [140, 170], ll: [-6, -4], rl: [55, 10] },
    tiptoe:   { name: 'Sneak',        view: 'side', lean: 18, la: [60, 130], ra: [40, 110], ll: [-25, -60], rl: [40, -10] },
    fall:     { name: 'Fall over',    view: 'side', lean: -35, dx: 16, la: [-160, -130], ra: [150, 120], ll: [40, 70], rl: [70, 100], lift: 10 },
    sad:      { name: 'Sad / slump',  view: 'side', lean: 10, head: 28, la: [8, 14], ra: [14, 20], ll: [-6, -3], rl: [6, 3] },
    bow:      { name: 'Bow',          view: 'side', lean: 55, head: 25, dx: -22, la: [5, 15], ra: [25, 35], ll: [-4, -2], rl: [4, 2] },
    hug:      { name: 'Arms open',    view: 'front', la: [-100, -125], ra: [100, 125], ll: [-9, -5], rl: [9, 5] },
    fly:      { name: 'Fly / super',  view: 'side', lean: 78, dx: -34, la: [70, 60], ra: [100, 100], ll: [-80, -88], rl: [-72, -95], lift: 40 },
    victory:  { name: 'Victory',      view: 'front', la: [-25, -15], ra: [155, 175], ll: [-20, -10], rl: [20, 10] },
    flex:     { name: 'Flex',         view: 'front', la: [-85, 165], ra: [85, -165], ll: [-16, -8], rl: [16, 8] },
    crossed:  { name: 'Arms crossed', view: 'front', la: [-35, 95], ra: [35, -95], ll: [-8, -4], rl: [8, 4] },
    facepalm: { name: 'Facepalm',     view: 'front', lean: 6, head: 16, la: [-14, -8], ra: [110, -135], ll: [-9, -5], rl: [9, 5] },
    dab:      { name: 'Dab',          view: 'side', lean: 8, head: 24, la: [105, 115], ra: [65, -135], ll: [-18, -10], rl: [22, 6] },
    salute:   { name: 'Salute',       view: 'front', la: [-12, -6], ra: [80, -145], ll: [-7, -4], rl: [7, 4] },
    clap:     { name: 'Clap',         view: 'side', la: [45, 115], ra: [60, 130], ll: [-9, -5], rl: [9, 5] },
    meditate: { name: 'Meditate',     view: 'front', la: [-45, -15], ra: [45, 15], ll: [-75, 70], rl: [75, -70], ground: 'hip', lift: 14 },
    crouch:   { name: 'Crouch',       view: 'side', lean: 32, head: 15, la: [-30, 20], ra: [40, 110], ll: [75, -55], rl: [95, -25] },
    reach:    { name: 'Reach up',     view: 'side', lean: 10, la: [130, 165], ra: [155, 178], ll: [-20, -45], rl: [45, 10] },
    splitjump:{ name: 'Star jump',    view: 'front', la: [-130, -155], ra: [130, 155], ll: [-85, -80], rl: [85, 80], lift: 32 },
    sleep:    { name: 'Sleep / Lie',  view: 'side', lean: 84, dx: -10, la: [95, 110], ra: [85, 100], ll: [-88, -90], rl: [-82, -85], ground: 'hip', fxAuto: ['zzz'] },
  };

  // ---------------------------------------------------------------- cast
  // style = outfit; robe-length styles: mage, royal, monk. sleeve: long (default) | short
  const CHARACTERS = {
    maya:      { name: 'Maya',         prop: 'adult', skin: '#fcd9b8', top: '#8b5cf6', pants: '#475569', shoes: '#f1f5f9', hair: 'bob',      hairCol: '#3b2820', style: 'sweater' },
    leo:       { name: 'Leo',          prop: 'adult', skin: '#f5cfa8', top: '#1e3a5f', inner: '#f8fafc', pants: '#3b4f6b', shoes: '#78350f', hair: 'parted', hairCol: '#4a2f1d', style: 'jacket' },
    zoe:       { name: 'Zoe',          prop: 'kid',   skin: '#fcd9b8', top: '#fbbf24', pants: '#3b82f6', shoes: '#ef4444', hair: 'buns',     hairCol: '#4a2f1d', style: 'overalls', sleeve: 'short' },
    sam:       { name: 'Sam',          prop: 'kid',   skin: '#d9a06c', top: '#16a34a', pants: '#334155', shoes: '#f8fafc', hair: 'curly',    hairCol: '#1f1916', style: 'hoodie', hat: 'cap', hatCol: '#16a34a', backpack: '#b45309' },
    exec:      { name: 'Executive',    prop: 'adult', skin: '#f5cfa8', top: '#1e293b', pants: '#1e293b', shoes: '#111827', hair: 'parted',   hairCol: '#3b2a1e', style: 'suit', tie: '#dc2626', handR: 'briefcase' },
    prof:      { name: 'Professor',    prop: 'adult', skin: '#fcd9b8', top: '#6b6b3a', inner: '#f1f5f9', pants: '#4e342e', shoes: '#2d1e18', hair: 'balding', hairCol: '#e5e7eb', style: 'tweed', glasses: true, scarf: '#dc2626' },
    cyber:     { name: 'Cyberpunk',    prop: 'adult', skin: '#f3d2b8', top: '#1e1b4b', pants: '#1e293b', shoes: '#14b8a6', hair: 'mohawk',   hairCol: '#ec4899', style: 'tech', visor: '#a855f7', accent: '#22d3ee' },
    ranger:    { name: 'Space Ranger', prop: 'adult', skin: '#c68a5e', top: '#f8fafc', pants: '#f1f5f9', shoes: '#94a3b8', hair: 'none',     hairCol: '#1f1916', style: 'spacesuit', hat: 'astro', gloves: '#e2e8f0', accent: '#ef4444', boots: true },
    android:   { name: 'Android',      prop: 'adult', skin: '#94a3b8', top: '#64748b', pants: '#475569', shoes: '#334155', hair: 'none',     hairCol: '#333',    style: 'cyber', robot: true, accent: '#38bdf8' },
    agent:     { name: 'Secret Agent', prop: 'adult', skin: '#f5cfa8', top: '#111827', pants: '#111827', shoes: '#000000', hair: 'slick',    hairCol: '#1e1b18', style: 'suit', tie: '#111827', shades: true },
    shinobi:   { name: 'Shinobi',      prop: 'adult', skin: '#f5cfa8', top: '#1e293b', pants: '#1e293b', shoes: '#111827', hair: 'none',     hairCol: '#0f172a', style: 'shinobi', hat: 'ninja', belt: '#dc2626', headband: '#dc2626', handR: 'sword' },
    paladin:   { name: 'Paladin',      prop: 'adult', skin: '#fcd9b8', top: '#cbd5e1', pants: '#94a3b8', shoes: '#64748b', hair: 'none',     hairCol: '#333',    style: 'plate', hat: 'helmet', cape: '#2563eb', gloves: '#cbd5e1', boots: true, handR: 'sword', handL: 'shield' },
    archmage:  { name: 'Archmage',     prop: 'adult', skin: '#f5cfa8', top: '#6d28d9', pants: '#4c1d95', shoes: '#3b0764', hair: 'long',     hairCol: '#e5e7eb', style: 'mage', hat: 'wizard', hatCol: '#6d28d9', beard: 'long', handL: 'staff' },
    rogue:     { name: 'Rogue',        prop: 'adult', skin: '#e6b89c', top: '#1f2937', pants: '#111827', shoes: '#111827', hair: 'none',     hairCol: '#1f2937', style: 'leather', hood: '#1f2937', cape: '#374151', boots: true, handR: 'cutlass' },
    valkyrie:  { name: 'Valkyrie',     prop: 'adult', skin: '#fcd9b8', top: '#facc15', pants: '#ca8a04', shoes: '#78350f', hair: 'long',     hairCol: '#fde047', style: 'tunic', hat: 'valkyrie', wings: true, boots: true, belt: '#78350f', handR: 'spear' },
    barista:   { name: 'Barista',      prop: 'adult', skin: '#d9a06c', top: '#f8fafc', pants: '#334155', shoes: '#1e293b', hair: 'curly',    hairCol: '#291d18', style: 'apron', apron: '#15803d', hat: 'cap', hatCol: '#15803d', handL: 'cup' },
    medic:     { name: 'Field Medic',  prop: 'adult', skin: '#fcd9b8', top: '#60a5fa', pants: '#3b82f6', shoes: '#f8fafc', hair: 'ponytail', hairCol: '#5c3a21', style: 'scrubs', hat: 'scrubcap', hatCol: '#60a5fa', sleeve: 'short' },
    chef:      { name: 'Master Chef',  prop: 'adult', skin: '#f5cfa8', top: '#f8fafc', pants: '#1f2937', shoes: '#111827', hair: 'parted',   hairCol: '#3e2723', style: 'chef', hat: 'chef', mustache: true },
    rockstar:  { name: 'Rockstar',     prop: 'adult', skin: '#fcd9b8', top: '#18181b', pants: '#27272a', shoes: '#09090b', hair: 'rock',     hairCol: '#ec4899', style: 'leather', shades: true, belt: '#3f3f46', handR: 'guitar' },
    explorer:  { name: 'Explorer',     prop: 'adult', skin: '#e6b89c', top: '#d6b88d', pants: '#b59a6e', shoes: '#78350f', hair: 'parted',   hairCol: '#4a3728', style: 'safari', hat: 'safari', boots: true, belt: '#78350f', camera: true },
    detective: { name: 'Detective',    prop: 'adult', skin: '#f5cfa8', top: '#b08d57', pants: '#5b4a3a', shoes: '#2d241e', hair: 'parted',   hairCol: '#2d231e', style: 'trench', hat: 'fedora', hatCol: '#8b6b43', handR: 'magnifier' },
    monarch:   { name: 'Monarch',      prop: 'adult', skin: '#fcd9b8', top: '#b91c1c', pants: '#7f1d1d', shoes: '#78350f', hair: 'wavy',     hairCol: '#6b4423', style: 'royal', hat: 'crown', beard: 'trim', handR: 'scepter' },
    pirate:    { name: 'Corsair',      prop: 'adult', skin: '#e6b89c', top: '#1f2937', inner: '#f8fafc', pants: '#374151', shoes: '#111827', hair: 'long', hairCol: '#1f1916', style: 'corsair', hat: 'pirate', patch: true, beard: 'trim', belt: '#b91c1c', boots: true, handR: 'cutlass' },
    angel:     { name: 'Celestial',    prop: 'adult', skin: '#fcd9b8', top: '#facc15', pants: '#eab308', shoes: '#ca8a04', hair: 'none',     hairCol: '#fde047', style: 'monk', hat: 'halo' },
  };

  const EXPRESSIONS = {
    happy: 'Happy', neutral: 'Neutral', grin: 'Big grin', laugh: 'Laugh', sad: 'Sad', cry: 'Crying',
    angry: 'Angry', yell: 'Yelling', surprised: 'Surprised', scared: 'Scared', wink: 'Wink',
    cool: 'Cool', sleepy: 'Sleepy', love: 'In love', smirk: 'Smirk', dizzy: 'Dizzy', none: 'No face'
  };

  const FX = {
    speed: 'Speed lines', sweat: 'Sweat', anger: 'Anger mark', steam: 'Steam', shock: 'Shock lines',
    question: '?', exclaim: '!?', love: 'Hearts', zzz: 'Zzz', sparkle: 'Sparkle', dizzy: 'Dizzy stars', bulb: 'Idea bulb'
  };

  const HAND_ITEMS = {
    none: 'Nothing', sword: 'Sword', cutlass: 'Cutlass', shield: 'Shield', staff: 'Staff', scepter: 'Scepter',
    spear: 'Spear', wand: 'Magic wand', bag: 'Handbag', briefcase: 'Briefcase', flower: 'Flower',
    book: 'Book', cup: 'Cup', phone: 'Phone', umbrella: 'Umbrella', sign: 'Sign', balloon: 'Balloon',
    torch: 'Torch', magnifier: 'Magnifier', flag: 'Flag', pan: 'Frying pan', ball: 'Ball', letter: 'Letter',
    paintbrush: 'Paintbrush', trident: 'Trident', scroll: 'Diploma / Scroll', guitar: 'Guitar'
  };

  // ---------------------------------------------------------------- helpers
  const rad = a => a * Math.PI / 180;
  const vec = (a, l) => [Math.sin(rad(a)) * l, Math.cos(rad(a)) * l];
  const add = (p, v) => [p[0] + v[0], p[1] + v[1]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const f = n => Math.round(n * 10) / 10;
  const P = p => f(p[0]) + ',' + f(p[1]);
  function shade(hex, amt) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return hex;
    const n = parseInt(m[1], 16), t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v + (t - v) * p));
    return '#' + ((1 << 24) | (c[0] << 16) | (c[1] << 8) | c[2]).toString(16).slice(1);
  }

  function skeleton(pose, L) {
    const lean = pose.lean || 0;
    const up = 180 - lean;
    const hip = [0, 0];
    const neck = add(hip, vec(up, L.torso));
    const shoulder = add(hip, vec(up, L.torso - 5));
    const headDir = up - (pose.head || 0);
    const headC = add(neck, vec(headDir, L.neck + L.head));
    const arm = a => { const e = add(shoulder, vec(a[0], L.upper)); return { e, h: add(e, vec(a[1], L.lower)), a: a[1] }; };
    const leg = a => { const k = add(hip, vec(a[0], L.thigh)); return { k, f: add(k, vec(a[1], L.shin)) }; };
    const s = { hip, neck, shoulder, headC, headDir, lean, la: arm(pose.la), ra: arm(pose.ra), ll: leg(pose.ll), rl: leg(pose.rl) };
    let maxY = Math.max(s.ll.f[1], s.rl.f[1], s.ll.k[1], s.rl.k[1]);
    if (pose.ground === 'hip') maxY = Math.max(maxY, 0);
    const dy = -maxY - (pose.lift || 0), dx = pose.dx || 0;
    const sh = p => [p[0] + dx, p[1] + dy];
    ['hip', 'neck', 'shoulder', 'headC'].forEach(k => s[k] = sh(s[k]));
    ['la', 'ra'].forEach(k => { s[k].e = sh(s[k].e); s[k].h = sh(s[k].h); });
    ['ll', 'rl'].forEach(k => { s[k].k = sh(s[k].k); s[k].f = sh(s[k].f); });
    return s;
  }

  // ---------------------------------------------------------------- faces (head-local, radius 25)
  function face(expr, fx, ink, so, side, skin, opt = {}) {
    if (expr === 'none') return '';
    const ex = side ? 5.4 : 6.2, ey = -3, erx = side ? 4.7 : 5.3, ery = 6.4, my = 11;
    const lx = fx - ex, rx = fx + ex, look = side ? 1.7 : 0.4;
    const F = f;
    if (opt.robot) {
      const closed = ['laugh', 'cry', 'sleepy', 'wink'].includes(expr);
      const reye = x => closed ? `<path d="M${F(x - 4)},${ey} H${F(x + 4)}" stroke="${opt.accent}" stroke-width="2.4"/>`
        : `<circle cx="${F(x)}" cy="${ey}" r="5" fill="#0f172a" stroke-width="${so}"/><circle cx="${F(x)}" cy="${ey}" r="2.6" fill="${opt.accent}" stroke="none"/><circle cx="${F(x + 1)}" cy="${ey - 1.2}" r="0.9" fill="#fff" stroke="none"/>`;
      const tall = ['yell', 'surprised', 'scared', 'laugh'].includes(expr);
      return reye(lx) + reye(rx) + `<rect x="${F(fx - 7)}" y="${my - 2}" width="14" height="${tall ? 8 : 5}" rx="1.5" fill="#1e293b" stroke-width="${so}"/><path d="M${F(fx - 3.5)},${my - 2} v${tall ? 8 : 5} M${F(fx)},${my - 2} v${tall ? 8 : 5} M${F(fx + 3.5)},${my - 2} v${tall ? 8 : 5}" stroke="${opt.accent}" stroke-width="0.9"/>`;
    }
    const open = (x, k = 1, pr = 2.6, dy = 0.8) => `<ellipse cx="${F(x)}" cy="${ey}" rx="${F(erx * k)}" ry="${F(ery * k)}" fill="#fff" stroke-width="${so}"/><circle cx="${F(x + look)}" cy="${F(ey + dy)}" r="${pr}" fill="${ink}" stroke="none"/><circle cx="${F(x + look + 0.9)}" cy="${F(ey + dy - 1.1)}" r="${F(Math.min(0.9, pr * 0.35))}" fill="#fff" stroke="none"/>`;
    const eyes = (k, pr, dy) => open(lx, k, pr, dy) + open(rx, k, pr, dy);
    const closedUp = x => `<path d="M${F(x - 4.5)},${ey + 1} Q${F(x)},${ey - 4.5} ${F(x + 4.5)},${ey + 1}" stroke-width="${so}"/>`;
    const closedDown = x => `<path d="M${F(x - 4.5)},${ey - 1} Q${F(x)},${ey + 3.5} ${F(x + 4.5)},${ey - 1}" stroke-width="${so}"/>`;
    const brow = (x, inner, outer) => { const d = x < fx ? 1 : -1; return `<path d="M${F(x - d * 5)},${F(ey - 9 + outer)} L${F(x + d * 4)},${F(ey - 9 + inner)}" stroke-width="${F(so * 1.15)}"/>`; };
    const brows = (i, o) => brow(lx, i, o) + brow(rx, i, o);
    const blush = `<ellipse cx="${F(fx - 13)}" cy="7" rx="3.6" ry="2" fill="#fb7185" stroke="none" opacity="0.45"/><ellipse cx="${F(fx + 13)}" cy="7" rx="3.6" ry="2" fill="#fb7185" stroke="none" opacity="0.45"/>`;
    const mouthOff = opt.noMouth;
    const M = s => mouthOff ? '' : s;
    const smile = (w = 5, d = 3.5) => M(`<path d="M${F(fx - w)},${my - 1} Q${F(fx)},${F(my - 1 + d * 1.6)} ${F(fx + w)},${my - 1}" stroke-width="${so}"/>`);
    const frown = (w = 4.5, d = 3) => M(`<path d="M${F(fx - w)},${my + 2} Q${F(fx)},${F(my + 2 - d * 1.6)} ${F(fx + w)},${my + 2}" stroke-width="${so}"/>`);
    const openMouth = (w, h) => M(`<path d="M${F(fx - w)},${my - 2} Q${F(fx)},${F(my - 2 + h * 2)} ${F(fx + w)},${my - 2} Z" fill="#7f1d1d" stroke-width="${so}"/><ellipse cx="${F(fx)}" cy="${F(my - 2 + h * 0.75)}" rx="${F(w * 0.45)}" ry="${F(h * 0.32)}" fill="#fb7185" stroke="none"/>`);
    switch (expr) {
      case 'neutral': return eyes() + M(`<path d="M${F(fx - 4)},${my + 1} H${F(fx + 4)}" stroke-width="${so}"/>`);
      case 'grin': return blush + eyes() + M(`<path d="M${F(fx - 7)},${my - 3} Q${F(fx)},${my + 9} ${F(fx + 7)},${my - 3} Z" fill="#fff" stroke-width="${so}"/><path d="M${F(fx - 6)},${my} H${F(fx + 6)}" stroke-width="${F(so * 0.6)}"/>`);
      case 'laugh': return blush + closedUp(lx) + closedUp(rx) + openMouth(7, 5.5);
      case 'sad': return eyes(1, 2.6, 1.8) + brows(-3, 1) + frown();
      case 'cry': return closedDown(lx) + closedDown(rx) + brows(-3, 1) + frown(5, 3.5)
        + `<path d="M${F(lx)},${ey + 3} q-1.8,6 0,10 q1.8,-4 0,-10" fill="#7dd3fc" stroke="#0284c7" stroke-width="1"/><path d="M${F(rx)},${ey + 3} q-1.8,6 0,10 q1.8,-4 0,-10" fill="#7dd3fc" stroke="#0284c7" stroke-width="1"/>`;
      case 'angry': return eyes(1, 2.6, 1.4) + brows(3.5, -2) + frown(4.5, 2.5);
      case 'yell': return eyes(1, 2, 1) + brows(4, -2) + M(`<ellipse cx="${F(fx)}" cy="${my + 1.5}" rx="6" ry="5" fill="#7f1d1d" stroke-width="${so}"/><ellipse cx="${F(fx)}" cy="${my + 4}" rx="3" ry="1.6" fill="#fb7185" stroke="none"/>`);
      case 'surprised': return eyes(1.1, 1.9, 0) + brows(-3, -2) + M(`<ellipse cx="${F(fx)}" cy="${my + 1}" rx="3" ry="4" fill="#7f1d1d" stroke-width="${so}"/>`);
      case 'scared': return eyes(1.1, 1.5, 0.4) + brows(-4, 0) + M(`<path d="M${F(fx - 6)},${my + 1} l2,-2 l2,2 l2,-2 l2,2 l2,-2 l2,2" stroke-width="${F(so * 0.85)}"/>`);
      case 'wink': return blush + open(lx) + closedUp(rx) + smile();
      case 'cool': return `<path d="M${F(fx - 13)},${ey - 6} H${F(fx + 13)} V${ey - 1} C${F(fx + 13)},${ey + 6} ${F(fx + 2)},${ey + 6} ${F(fx + 1)},${ey} H${F(fx - 1)} C${F(fx - 2)},${ey + 6} ${F(fx - 13)},${ey + 6} ${F(fx - 13)},${ey - 1} Z" fill="#0f172a" stroke-width="${so}"/><path d="M${F(fx - 10)},${ey - 3} l3,3" stroke="#94a3b8" stroke-width="1.2"/>` + M(`<path d="M${F(fx - 4)},${my} Q${F(fx + 1)},${my + 3} ${F(fx + 6)},${my - 2}" stroke-width="${so}"/>`);
      case 'sleepy': {
        const lid = x => `<ellipse cx="${F(x)}" cy="${ey}" rx="${erx}" ry="${ery}" fill="#fff" stroke-width="${so}"/><circle cx="${F(x + look)}" cy="${ey + 2.5}" r="2.3" fill="${ink}" stroke="none"/><path d="M${F(x - erx)},${ey + 0.5} A${erx},${ery} 0 0 1 ${F(x + erx)},${ey + 0.5} Z" fill="${skin}" stroke-width="${so}"/>`;
        return lid(lx) + lid(rx) + M(`<ellipse cx="${F(fx)}" cy="${my + 1}" rx="2.2" ry="1.8" stroke-width="${F(so * 0.8)}"/>`);
      }
      case 'love': {
        const h = x => `<path d="M${F(x)},${ey + 4} l-4.6,-4.6 a2.7,2.7 0 0 1 4.6,-3.4 a2.7,2.7 0 0 1 4.6,3.4 z" fill="#e11d48" stroke-width="${F(so * 0.7)}"/>`;
        return blush + h(lx) + h(rx) + smile(5.5, 4);
      }
      case 'smirk': return eyes(1, 2.6, 1) + brow(rx, -1.5, 1) + M(`<path d="M${F(fx - 5)},${my + 1} Q${F(fx + 1)},${my + 3} ${F(fx + 6)},${my - 3}" stroke-width="${so}"/>`);
      case 'dizzy': {
        const x = x0 => `<path d="M${F(x0 - 3.2)},${ey - 3.2} L${F(x0 + 3.2)},${ey + 3.2} M${F(x0 - 3.2)},${ey + 3.2} L${F(x0 + 3.2)},${ey - 3.2}" stroke-width="${so}"/>`;
        return x(lx) + x(rx) + M(`<path d="M${F(fx - 6)},${my + 1} q3,-4 6,0 q3,4 6,0" stroke-width="${so}"/>`);
      }
      default: return blush + eyes() + smile();
    }
  }

  // ---------------------------------------------------------------- hand items
  function handItem(kind, hand) {
    const [x, y] = hand.h, a = hand.a;
    const T = `translate(${f(x)},${f(y)})`;
    const along = inner => `<g transform="${T} rotate(${f(-a)})">${inner}</g>`;
    const up = inner => `<g transform="${T}">${inner}</g>`;
    switch (kind) {
      case 'sword': return along(`<path d="M-3.2,7 L-3,54 L0,62 L3,54 L3.2,7 Z" fill="#e2e8f0"/><line x1="0" y1="10" x2="0" y2="53" stroke="#94a3b8" stroke-width="1.2"/><rect x="-10" y="3" width="20" height="5" rx="2" fill="#fbbf24"/><rect x="-2" y="-7" width="4" height="10" fill="#78350f"/><circle cx="0" cy="-9" r="3" fill="#fbbf24"/>`);
      case 'cutlass': return along(`<path d="M-2.5,7 L-3.5,40 Q2,57 10,50 Q4,38 3,7 Z" fill="#e2e8f0"/><path d="M-8,5 Q0,-8 9,5" stroke="#fbbf24" stroke-width="2.6"/><rect x="-2" y="-6" width="4" height="11" fill="#78350f"/>`);
      case 'shield': return up(`<path d="M-18,-23 L18,-23 L18,0 Q18,20 0,28 Q-18,20 -18,0 Z" fill="#2563eb"/><path d="M-13,-18 L13,-18 L13,-1 Q13,15 0,22 Q-13,15 -13,-1 Z" fill="#eff6ff" stroke-width="1.4"/><path d="M0,-18 L0,22 M-13,-5 L13,-5" stroke="#fbbf24" stroke-width="3"/>`);
      case 'staff': return up(`<line x1="0" y1="-76" x2="0" y2="62" stroke-width="6"/><line x1="0" y1="-76" x2="0" y2="62" stroke="#92400e" stroke-width="3.4"/><circle cx="0" cy="-84" r="8.5" fill="#a855f7"/><circle cx="-2.5" cy="-86.5" r="2.6" fill="#f3e8ff" stroke="none"/><path d="M-8,-76 Q0,-70 8,-76" stroke="#fbbf24" stroke-width="2.4"/>`);
      case 'scepter': return up(`<line x1="0" y1="-34" x2="0" y2="18" stroke-width="5.5"/><line x1="0" y1="-34" x2="0" y2="18" stroke="#d97706" stroke-width="3"/><circle cx="0" cy="-40" r="6.5" fill="#fbbf24"/><circle cx="0" cy="-40" r="2.8" fill="#ef4444" stroke="none"/>`);
      case 'spear': return up(`<line x1="0" y1="-92" x2="0" y2="70" stroke-width="5.5"/><line x1="0" y1="-92" x2="0" y2="70" stroke="#92400e" stroke-width="3"/><path d="M0,-112 L-6.5,-90 L0,-94 L6.5,-90 Z" fill="#e2e8f0"/>`);
      case 'wand': return along(`<line x1="0" y1="0" x2="0" y2="24" stroke-width="4.6"/><line x1="0" y1="0" x2="0" y2="24" stroke="#78350f" stroke-width="2.4"/><path d="M0,25 l2.2,5.2 5.4,0 -4.3,3.3 2,5.3 -5.3,-3.2 -5.3,3.2 2,-5.3 -4.3,-3.3 5.4,0z" fill="#fbbf24" stroke-width="1.4"/>`);
      case 'bag': return up(`<path d="M-7,2 Q0,-7 7,2" stroke-width="2.4"/><path d="M-11,2 L11,2 L9,20 L-9,20 Z" fill="#ec4899"/><rect x="-3" y="8" width="6" height="4" rx="1" fill="#fbbf24" stroke-width="1"/>`);
      case 'briefcase': return up(`<path d="M-5,2 v-4 h10 v4" stroke-width="2.4"/><rect x="-15" y="2" width="30" height="21" rx="3" fill="#92400e"/><line x1="-15" y1="10" x2="15" y2="10" stroke-width="1.6"/><rect x="-3" y="8" width="6" height="4.5" fill="#fbbf24" stroke-width="1"/>`);
      case 'flower': return up(`<path d="M0,6 Q-3,-10 0,-24" stroke="#16a34a" stroke-width="2.4"/><path d="M0,-12 q6,-6 9,-2 q-5,4 -9,2" fill="#4ade80" stroke-width="1.2"/>${[0, 72, 144, 216, 288].map(r => `<ellipse cx="0" cy="-30" rx="3.4" ry="5.6" transform="rotate(${r} 0 -24)" fill="#f472b6" stroke-width="1.3"/>`).join('')}<circle cx="0" cy="-24" r="3.2" fill="#facc15" stroke-width="1.2"/>`);
      case 'book': return up(`<path d="M-14,-6 L0,-2 L14,-6 L14,12 L0,16 L-14,12 Z" fill="#2563eb"/><path d="M-11,-4 L0,0 L11,-4 L11,10 L0,14 L-11,10 Z" fill="${PAPER}" stroke-width="1.2"/><line x1="0" y1="0" x2="0" y2="14" stroke-width="1.4"/>`);
      case 'cup': return up(`<path d="M-6,-11 L6,-11 L5,5 L-5,5 Z" fill="#f8fafc"/><rect x="-7" y="-13.5" width="14" height="3.5" rx="1.2" fill="#15803d" stroke-width="1.4"/><circle cx="0" cy="-3" r="3" fill="#15803d" stroke="none"/><path d="M-2,-17 q2,-3 0,-6 M2,-17 q2,-3 0,-6" stroke="#94a3b8" stroke-width="1.2"/>`);
      case 'phone': return up(`<rect x="-5" y="-13" width="10" height="17" rx="2" fill="#1e293b"/><rect x="-3.5" y="-10" width="7" height="11" fill="#38bdf8" stroke="none"/>`);
      case 'umbrella': return up(`<line x1="0" y1="8" x2="0" y2="-56" stroke-width="2.6"/><path d="M0,8 q0,5 -5,4" stroke-width="2.6"/><path d="M-34,-50 Q0,-88 34,-50 Q25,-56 17,-50 Q9,-57 0,-50 Q-9,-57 -17,-50 Q-25,-56 -34,-50 Z" fill="#ef4444"/>`);
      case 'sign': return up(`<line x1="0" y1="10" x2="0" y2="-48" stroke-width="5.5"/><line x1="0" y1="10" x2="0" y2="-48" stroke="#92400e" stroke-width="3"/><rect x="-30" y="-82" width="60" height="36" rx="4" fill="#fef3c7"/>`);
      case 'balloon': return up(`<path d="M0,0 q-6,-20 0,-40 q6,-12 0,-22" stroke-width="1.4"/><ellipse cx="0" cy="-76" rx="13" ry="16" fill="#ef4444"/><ellipse cx="-4" cy="-82" rx="3" ry="5" fill="#fca5a5" stroke="none"/>`);
      case 'torch': return up(`<path d="M-3,10 L-4,-22 L4,-22 L3,10 Z" fill="#92400e"/><path d="M-6,-22 Q-9,-34 0,-46 Q2,-36 6,-38 Q10,-30 6,-22 Z" fill="#fb923c" stroke="#ea580c" stroke-width="1.8"/>`);
      case 'magnifier': return along(`<line x1="0" y1="0" x2="0" y2="14" stroke-width="5.5"/><line x1="0" y1="0" x2="0" y2="14" stroke="#78350f" stroke-width="3"/><circle cx="0" cy="23" r="9.5" fill="#bae6fd" stroke-width="2.8"/><path d="M-4.5,19 A6,6 0 0 1 2,16.5" stroke="${PAPER}" stroke-width="1.8"/>`);
      case 'flag': return up(`<line x1="0" y1="12" x2="0" y2="-70" stroke-width="2.8"/><path d="M0,-70 Q14,-76 28,-68 Q20,-60 28,-50 Q14,-56 0,-50 Z" fill="#3b82f6"/>`);
      case 'pan': return along(`<line x1="0" y1="0" x2="0" y2="18" stroke-width="5.5"/><line x1="0" y1="0" x2="0" y2="18" stroke="#78350f" stroke-width="3"/><ellipse cx="0" cy="30" rx="11.5" ry="12.5" fill="#334155"/><ellipse cx="0" cy="30" rx="8" ry="9" fill="#475569" stroke="none"/>`);
      case 'ball': return up(`<circle cx="0" cy="-10" r="10" fill="#f97316"/><path d="M-10,-10 h20 M0,-20 v20" stroke-width="1.4"/>`);
      case 'letter': return up(`<rect x="-12" y="-12" width="24" height="16" rx="1.5" fill="${PAPER}"/><path d="M-12,-12 L0,-3 L12,-12" stroke-width="1.6"/>`);
      case 'paintbrush': return along(`<line x1="0" y1="0" x2="0" y2="24" stroke-width="4.8"/><line x1="0" y1="0" x2="0" y2="24" stroke="#78350f" stroke-width="2.6"/><path d="M-2.5,24 L2.5,24 L3.5,31 Q0,36 -3.5,31 Z" fill="#ef4444" stroke-width="1.6"/>`);
      case 'trident': return up(`<line x1="0" y1="-82" x2="0" y2="62" stroke-width="5.5"/><line x1="0" y1="-82" x2="0" y2="62" stroke="#d97706" stroke-width="3"/><path d="M-10,-96 L-10,-80 Q0,-74 10,-80 L10,-96 M0,-102 L0,-77" stroke="#fbbf24" stroke-width="3"/>`);
      case 'scroll': return along(`<rect x="-4.5" y="-8" width="9" height="24" rx="3" fill="#fef3c7"/><line x1="-4.5" y1="4" x2="4.5" y2="4" stroke="#ef4444" stroke-width="2.6"/>`);
      case 'guitar': return up(`<g transform="rotate(-50)"><rect x="-2.6" y="-50" width="5.2" height="44" fill="#1e293b"/><rect x="-4.5" y="-58" width="9" height="9" rx="1.5" fill="#1e293b"/><path d="M0,-8 C-10,-14 -20,-6 -14,4 C-22,10 -16,26 -4,22 L0,30 L4,22 C16,26 22,10 14,4 C20,-6 10,-14 0,-8 Z" fill="#db2777"/><rect x="-6" y="6" width="12" height="4" rx="1" fill="#1e293b"/><circle cx="0" cy="-1" r="2.2" fill="#f8fafc" stroke-width="1"/></g>`);
      default: return '';
    }
  }

  // ---------------------------------------------------------------- fx
  function effects(list, s, r, stroke, flipX) {
    if (!list || !list.length) return '';
    const [hx, hy] = s.headC;
    const txt = (x, y, t, size, fill = stroke, rot = 0) =>
      `<g transform="translate(${f(x)},${f(y)}) scale(${flipX ? -1 : 1},1) rotate(${rot})"><text x="0" y="0" text-anchor="middle" font-family="Segoe UI, system-ui, sans-serif" font-weight="800" font-size="${size}" fill="${fill}" stroke="none">${t}</text></g>`;
    let out = '';
    for (const fx of list) {
      switch (fx) {
        case 'speed': {
          const bx = Math.min(s.hip[0], s.neck[0]) - 28;
          [[-20, 0], [-5, 16], [10, 8], [25, 22], [-35, 12]].forEach(([dy, dl], i) => {
            const y = s.hip[1] - 10 + dy * 1.1;
            out += `<line x1="${f(bx - dl)}" y1="${f(y)}" x2="${f(bx - 38 - dl - i * 4)}" y2="${f(y)}" stroke-width="2.4"/>`;
          });
          break;
        }
        case 'sweat':
          [[r + 7, -r * 0.2, 1], [r + 2, -r - 2, 0.8], [-r - 6, -r * 0.4, 0.75]].forEach(([dx, dy, k]) => {
            out += `<path transform="translate(${f(hx + dx)},${f(hy + dy)}) scale(${k})" d="M0,-6 Q5,2 0,5 Q-5,2 0,-6 Z" fill="#7dd3fc" stroke="#0284c7" stroke-width="1.4"/>`;
          });
          break;
        case 'anger': {
          const x = hx + r + 6, y = hy - r - 2;
          out += `<g transform="translate(${f(x)},${f(y)})" stroke="#dc2626" stroke-width="2.8"><path d="M-7,-2 q5,0 5,-5 M2,-7 q0,5 5,5 M7,2 q-5,0 -5,5 M-2,7 q0,-5 -5,-5"/></g>`;
          break;
        }
        case 'steam':
          [hx - r - 14, hx + r + 14].forEach(x => {
            const y = hy - r - 4;
            out += `<path d="M${f(x)},${f(y)} q-6,-2 -4,-8 q2,-6 8,-4 q4,-6 10,-1 q5,4 0,9 q-2,6 -8,4 q-6,3 -6,0 z" fill="${PAPER}" stroke-width="2"/>`;
          });
          break;
        case 'shock':
          [-55, -20, 20, 55].forEach(ang => {
            const a = rad(ang);
            out += `<line x1="${f(hx + Math.sin(a) * (r + 8))}" y1="${f(hy - Math.cos(a) * (r + 8))}" x2="${f(hx + Math.sin(a) * (r + 18))}" y2="${f(hy - Math.cos(a) * (r + 18))}" stroke-width="2.6"/>`;
          });
          break;
        case 'question': out += txt(hx + r + 10, hy - r - 4, '?', 22, '#6366f1', 10); break;
        case 'exclaim': out += txt(hx + r + 10, hy - r - 4, '!?', 22, '#ef4444', 8); break;
        case 'love':
          [[hx - r - 10, hy - r, 0.9], [hx + r + 11, hy - r - 8, 1.1], [hx + 2, hy - r - 16, 0.7]].forEach(([x, y, k]) => {
            out += `<path transform="translate(${f(x)},${f(y)}) scale(${k})" d="M0,4 l-5,-5 a3,3 0 0 1 5,-4 a3,3 0 0 1 5,4 z" fill="#f43f5e" stroke="#be123c" stroke-width="1"/>`;
          });
          break;
        case 'zzz':
          out += txt(hx + r + 6, hy - r, 'z', 13, stroke, -8) + txt(hx + r + 16, hy - r - 11, 'Z', 17, stroke, -6) + txt(hx + r + 28, hy - r - 24, 'Z', 22, stroke, -4);
          break;
        case 'sparkle':
          [[hx - r - 10, hy - r, 0.9], [hx + r + 12, hy - r - 4, 1.1], [hx - r - 14, hy + 8, 0.7]].forEach(([x, y, k]) => {
            out += `<path transform="translate(${f(x)},${f(y)}) scale(${k})" d="M0,-9 L2.2,-2.2 L9,0 L2.2,2.2 L0,9 L-2.2,2.2 L-9,0 L-2.2,-2.2 Z" fill="#facc15" stroke="#ca8a04" stroke-width="1"/>`;
          });
          break;
        case 'dizzy': {
          const y = hy - r - 10;
          out += `<ellipse cx="${f(hx)}" cy="${f(y)}" rx="20" ry="5" stroke-width="1.4" stroke-dasharray="3 3"/>`;
          [-18, 0, 18].forEach(dx => {
            out += `<path transform="translate(${f(hx + dx)},${f(y + (dx === 0 ? -4 : 3))}) scale(0.55)" d="M0,-8 l2.4,5 5.6,.8 -4,3.9 1,5.5 -5,-2.6 -5,2.6 1,-5.5 -4,-3.9 5.6,-.8z" fill="#facc15" stroke-width="1.4"/>`;
          });
          break;
        }
        case 'bulb': {
          const x = hx + r + 12, y = hy - r - 14;
          out += `<path d="M${f(x - 4)},${f(y + 8)} q-4,-5 -4,-9 a8,8 0 1 1 16,0 q0,4 -4,9 z" fill="#fef08a" stroke-width="2"/><rect x="${f(x - 3)}" y="${f(y + 8)}" width="6" height="4" fill="#cbd5e1" stroke-width="1.6"/>`
            + `<line x1="${f(x)}" y1="${f(y - 12)}" x2="${f(x)}" y2="${f(y - 17)}" stroke="#eab308" stroke-width="1.8"/><line x1="${f(x - 11)}" y1="${f(y - 5)}" x2="${f(x - 15)}" y2="${f(y - 8)}" stroke="#eab308" stroke-width="1.8"/><line x1="${f(x + 11)}" y1="${f(y - 5)}" x2="${f(x + 15)}" y2="${f(y - 8)}" stroke="#eab308" stroke-width="1.8"/>`;
          break;
        }
      }
    }
    return out;
  }

  // ---------------------------------------------------------------- head (local coords: centre 0,0, radius 25, facing +x)
  function drawHead(ch, it, o, side, ink, skin, hairCol, topCol) {
    const so = f(o * 0.85);
    const fx = side ? 7 : 0;
    const hatCol = ch.hatCol || topCol;
    const covered = ch.hat === 'helmet' || ch.hat === 'ninja' || ch.hood;
    let s = '';

    // --- behind the head
    if (ch.hood) s += `<path d="M-31,26 C-37,-8 -25,-38 0,-42 C25,-38 37,-8 31,26 Z" fill="${ch.hood}"/>`;
    if (ch.hat === 'astro') s += `<path d="M-23,20 Q0,30 23,20 L25,30 Q0,41 -25,30 Z" fill="#e2e8f0"/>`;
    if (!covered) {
      switch (ch.hair) {
        case 'bob': s += `<path d="M-27,-2 C-30,-34 30,-34 27,-2 L27,20 Q22,26 16,22 L-16,22 Q-22,26 -27,20 Z" fill="${hairCol}"/>`; break;
        case 'long': s += `<path d="M-27,-2 C-30,-34 30,-34 27,-2 L29,34 Q20,40 12,33 L-12,33 Q-20,40 -29,34 Z" fill="${hairCol}"/>`; break;
        case 'wavy': s += `<path d="M-27,-2 C-30,-34 30,-34 27,-2 C31,8 25,14 29,24 Q20,30 14,24 L-14,24 Q-20,30 -29,24 C-25,14 -31,8 -27,-2 Z" fill="${hairCol}"/>`; break;
        case 'ponytail': s += `<path d="M-18,-16 C-36,-14 -40,10 -32,28 C-28,16 -24,6 -16,-2 Z" fill="${hairCol}"/>`; break;
        case 'buns': s += `<circle cx="-20" cy="-20" r="9" fill="${hairCol}"/><circle cx="20" cy="-20" r="9" fill="${hairCol}"/>`; break;
        case 'rock': s += `<path d="M-26,-4 C-30,-30 28,-34 27,-4 L28,18 L22,12 L18,22 L-18,22 L-22,12 L-28,18 Z" fill="${hairCol}"/>`; break;
      }
    }
    if (ch.hat === 'ninja' && ch.headband) s += `<path d="M-22,-13 C-32,-14 -38,-6 -44,-2 C-36,-12 -30,-16 -22,-9 Z M-22,-11 C-30,-8 -34,2 -40,8 C-30,0 -26,-4 -21,-7 Z" fill="${ch.headband}"/>`;
    // ears (front view – behind the head)
    if (!side && !covered && !ch.robot && ch.hat !== 'astro') s += `<circle cx="-24" cy="2" r="5" fill="${skin}"/><circle cx="24" cy="2" r="5" fill="${skin}"/><path d="M-25,0 q-2,2 0,4 M25,0 q2,2 0,4" stroke-width="${f(o * 0.6)}"/>`;

    // --- head
    if (ch.robot) {
      s += `<line x1="0" y1="-23" x2="0" y2="-33" stroke-width="2.4"/><circle cx="0" cy="-35" r="3.4" fill="${ch.accent}"/>`
        + `<rect x="-27" y="-6" width="6" height="12" rx="2" fill="#64748b"/><rect x="21" y="-6" width="6" height="12" rx="2" fill="#64748b"/>`
        + `<rect x="-22" y="-23" width="44" height="44" rx="8" fill="${skin}"/><path d="M-18,-19 H12" stroke="#cbd5e1" stroke-width="2.4"/>`;
    } else {
      s += `<circle cx="0" cy="0" r="25" fill="${ch.hat === 'ninja' ? '#1e293b' : skin}"/>`;
    }
    if (side && !covered && !ch.robot && ch.hat !== 'astro') s += `<ellipse cx="-4" cy="2" rx="4" ry="5.2" fill="${skin}"/><path d="M-4.5,0 q-1.6,2 0,4" stroke-width="${f(o * 0.6)}"/>`;
    if (ch.hat === 'ninja') s += `<path d="M-23,-11 H23 Q25.5,-4 23,4 H-23 Q-25.5,-4 -23,-11 Z" fill="${skin}"/>`;

    // --- beard (under the mouth)
    if (!covered) {
      if (ch.beard === 'trim') s += `<path d="M-24,0 C-24,18 -12,29 ${fx},29 C12,29 24,18 24,0 C20,6 16,10 10,12 C6,8 -6,8 -10,12 C-16,10 -20,6 -24,0 Z" fill="${hairCol}"/>`;
      if (ch.beard === 'long') s += `<path d="M-22,2 C-26,30 -10,52 2,58 C6,46 18,36 22,2 C16,10 8,13 0,13 C-8,13 -16,10 -22,2 Z" fill="${hairCol}"/><path d="M-6,30 q2,8 0,14 M6,28 q-2,8 2,14" stroke-width="${f(o * 0.5)}"/>`;
    }

    // --- face
    if (ch.hat !== 'helmet') {
      const expr = it.expr || 'happy';
      s += face(expr, fx, ink, so, side, ch.hat === 'ninja' ? skin : skin, { robot: ch.robot, accent: ch.accent, noMouth: ch.hat === 'ninja' || ch.hood });
    }
    if (ch.mustache) s += `<path d="M${fx},6 C${fx - 4},3 ${fx - 11},4 ${fx - 13},9 C${fx - 8},7 ${fx - 4},9 ${fx},8 C${fx + 4},9 ${fx + 8},7 ${fx + 13},9 C${fx + 11},4 ${fx + 4},3 ${fx},6 Z" fill="${hairCol}"/>`;
    if (ch.hood) s += `<path d="M-20,4 Q0,9 20,4 L19,15 Q0,27 -19,15 Z" fill="${shade(ch.hood, -0.25)}"/>`;

    // --- hair on top
    if (!covered) {
      const H = (d) => `<path d="${d}" fill="${hairCol}"/>`;
      switch (ch.hair) {
        case 'bob': case 'long': case 'wavy':
          s += H('M-25,-2 C-27,-30 27,-30 25,-2 C22,-10 16,-14 10,-14 C4,-10 -6,-10 -10,-15 C-16,-12 -22,-8 -25,-2 Z'); break;
        case 'spiky':
          s += H('M-25,-4 C-27,-20 -20,-28 -14,-30 L-10,-36 L-4,-30 L2,-37 L7,-30 L14,-35 L16,-27 C23,-23 27,-14 25,-4 C18,-12 8,-14 0,-12 C-8,-14 -18,-12 -25,-4 Z'); break;
        case 'curly':
          s += H('M-25,-2 C-30,-8 -28,-18 -22,-20 C-22,-30 -12,-32 -6,-28 C-2,-34 8,-34 11,-28 C18,-32 26,-26 24,-18 C30,-14 28,-6 25,-2 C18,-10 8,-12 0,-11 C-8,-12 -18,-10 -25,-2 Z'); break;
        case 'parted':
          s += H('M-25,-2 C-28,-28 -6,-34 8,-30 C20,-28 27,-18 25,-4 C20,-12 14,-15 4,-15 C-2,-15 -6,-17 -9,-21 C-12,-14 -20,-8 -25,-2 Z'); break;
        case 'slick': case 'ponytail':
          s += H('M-25,-4 C-26,-31 26,-33 25,-4 C16,-14 -16,-16 -25,-4 Z'); break;
        case 'buns':
          s += H('M-25,-4 C-26,-31 26,-31 25,-4 C18,-12 6,-14 0,-18 C-6,-14 -18,-12 -25,-4 Z'); break;
        case 'mohawk':
          s += H('M-5,-24 C-9,-34 -7,-42 -1,-47 C1,-41 5,-39 8,-45 C10,-36 8,-28 5,-24 Z'); break;
        case 'balding':
          s += H('M-25,2 C-28,-8 -26,-15 -20,-18 C-22,-10 -20,-5 -17,1 Z') + H('M25,2 C28,-8 26,-15 20,-18 C22,-10 20,-5 17,1 Z'); break;
        case 'rock':
          s += H('M-26,0 C-30,-30 10,-38 26,-16 C28,-8 26,-2 25,2 C20,-8 14,-12 6,-12 C0,-4 -6,2 -14,4 C-16,-4 -20,-4 -26,0 Z'); break;
      }
    }

    // --- eyewear
    if (ch.glasses) s += `<circle cx="${fx - 6.2}" cy="-3" r="7.2" stroke-width="${f(o * 0.7)}"/><circle cx="${fx + 6.2}" cy="-3" r="7.2" stroke-width="${f(o * 0.7)}"/><path d="M${fx - 13.4},-4 L-24,-6 M${fx + 13.4},-4 L24,-6" stroke-width="${f(o * 0.6)}"/>`;
    if (ch.visor) s += `<path d="M-24,-11 H24 V2 Q0,6 -24,2 Z" fill="${ch.visor}"/><path d="M-20,-7 H8" stroke="#f5d0fe" stroke-width="2"/>`;
    if (ch.shades && (it.expr || 'happy') !== 'cool') s += `<path d="M${fx - 13},-9 H${fx + 13} V-4 C${fx + 13},3 ${fx + 2},3 ${fx + 1},-3 H${fx - 1} C${fx - 2},3 ${fx - 13},3 ${fx - 13},-4 Z" fill="#0f172a" stroke-width="${so}"/><path d="M${fx - 10},-6 l3,3" stroke="#94a3b8" stroke-width="1.2"/>`;
    if (ch.patch) s += `<path d="M-24,-15 L24,-1" stroke-width="${f(o * 0.7)}"/><ellipse cx="${fx + 6.2}" cy="-3" rx="6.5" ry="7" fill="#0f172a"/>`;

    // --- hats
    switch (ch.hat) {
      case 'cap':
        s += `<path d="M-24.5,-6 C-25.5,-35 25.5,-35 24.5,-6 Q0,-11 -24.5,-6 Z" fill="${hatCol}"/><circle cx="0" cy="-29" r="2.2" fill="${shade(hatCol, -0.25)}"/>`;
        s += side ? `<path d="M8,-9 Q30,-13 37,-5 Q24,-1 6,-5 Z" fill="${shade(hatCol, -0.15)}"/>` : `<path d="M-21,-8 Q0,0 21,-8 Q0,-3 -21,-8 Z" fill="${shade(hatCol, -0.2)}"/>`;
        break;
      case 'scrubcap':
        s += `<path d="M-25,-4 C-26,-33 26,-33 25,-4 Q0,-12 -25,-4 Z" fill="${hatCol}"/><path d="M-2.2,-24 h4.4 v3.8 h3.8 v4.4 h-3.8 v3.8 h-4.4 v-3.8 h-3.8 v-4.4 h3.8 Z" fill="#ef4444" stroke-width="1"/>`;
        break;
      case 'crown':
        s += `<path d="M-17,-17 L-19,-40 L-9,-28 L0,-44 L9,-28 L19,-40 L17,-17 Z" fill="#fbbf24"/><rect x="-18" y="-22" width="36" height="7" rx="2" fill="#f59e0b"/><circle cx="0" cy="-18.5" r="2.4" fill="#ef4444" stroke-width="1"/><circle cx="-10" cy="-18.5" r="1.8" fill="#3b82f6" stroke-width="1"/><circle cx="10" cy="-18.5" r="1.8" fill="#3b82f6" stroke-width="1"/><circle cx="0" cy="-44" r="2.4" fill="#fbbf24"/>`;
        break;
      case 'wizard':
        s += `<path d="M-35,-13 Q0,-27 35,-13 Q0,-4 -35,-13 Z" fill="${shade(hatCol, -0.15)}"/><path d="M-20,-16 Q-8,-40 6,-62 Q14,-67 23,-56 Q13,-53 12,-46 Q16,-30 20,-16 Q0,-12 -20,-16 Z" fill="${hatCol}"/><path d="M-19,-21 Q0,-17 19,-21" stroke="#fbbf24" stroke-width="3"/><path transform="translate(2,-36) scale(0.7)" d="M0,-8 l2.4,5 5.6,.8 -4,3.9 1,5.5 -5,-2.6 -5,2.6 1,-5.5 -4,-3.9 5.6,-.8z" fill="#fbbf24" stroke-width="1.6"/>`;
        break;
      case 'chef':
        s += `<path d="M-16,-17 L-16,-30 C-31,-32 -29,-53 -14,-50 C-12,-63 12,-63 14,-50 C29,-53 31,-32 16,-30 L16,-17 Z" fill="#fff"/><path d="M-16,-24 H16 M-6,-30 V-40 M6,-30 V-40" stroke-width="${f(o * 0.6)}"/>`;
        break;
      case 'pirate':
        s += `<path d="M-33,-11 C-27,-41 -10,-35 0,-41 C10,-35 27,-41 33,-11 C14,-20 -14,-20 -33,-11 Z" fill="#111827"/><path d="M-30,-13 C-12,-21 12,-21 30,-13" stroke="#fbbf24" stroke-width="2"/><circle cx="0" cy="-28" r="4" fill="#fff" stroke-width="1"/><path d="M-5,-21 L5,-25 M5,-21 L-5,-25" stroke="#fff" stroke-width="1.4"/>`;
        break;
      case 'helmet':
        s += `<path d="M-27,8 C-28,-35 28,-35 27,8 L24,22 Q0,31 -24,22 Z" fill="#cbd5e1"/><path d="M-21,-5 H21 Q22,-1 21,3 H-21 Q-22,-1 -21,-5 Z" fill="#1e293b"/><path d="M0,-31 V-6 M0,4 V24" stroke-width="${f(o * 0.7)}"/><path d="M-14,10 h4 M-14,15 h4 M10,10 h4 M10,15 h4" stroke-width="1.4"/><path d="M-18,-22 Q-6,-30 6,-30" stroke="#f8fafc" stroke-width="2.4"/>`
          + `<path d="M0,-31 C-6,-48 -22,-50 -31,-40 C-21,-42 -11,-38 -6,-29 Z" fill="${ch.cape || '#2563eb'}"/>`;
        break;
      case 'valkyrie':
        s += `<path d="M-26,-4 C-27,-33 27,-33 26,-4 Q0,-12 -26,-4 Z" fill="#e2e8f0"/><path d="M-3,-10 h6 v14 l-3,3 l-3,-3 Z" fill="#cbd5e1"/><path d="M-25,-14 C-38,-22 -42,-38 -36,-46 C-34,-34 -28,-28 -22,-24 Z" fill="#fff"/><path d="M25,-14 C38,-22 42,-38 36,-46 C34,-34 28,-28 22,-24 Z" fill="#fff"/><path d="M-30,-26 l-4,-4 M30,-26 l4,-4" stroke-width="1"/>`;
        break;
      case 'astro':
        s += `<circle cx="0" cy="0" r="31" fill="#e0f2fe" fill-opacity="0.32"/><path d="M-21,-19 Q-14,-27 -4,-29" stroke="#fff" stroke-width="3.2"/><circle cx="20" cy="-20" r="2" fill="#fff" stroke="none"/>`;
        break;
      case 'safari':
        s += `<path d="M-31,-11 Q0,-23 31,-11 Q0,-3 -31,-11 Z" fill="${shade(hatCol, -0.1)}"/><path d="M-20,-14 C-21,-42 21,-42 20,-14 Q0,-19 -20,-14 Z" fill="${hatCol}"/><path d="M-20,-17 Q0,-22 20,-17" stroke="${shade(hatCol, -0.35)}" stroke-width="3"/><circle cx="0" cy="-38" r="2" fill="${shade(hatCol, -0.2)}"/>`;
        break;
      case 'fedora':
        s += `<path d="M-31,-12 Q0,-21 31,-12 Q0,-4 -31,-12 Z" fill="${shade(hatCol, -0.12)}"/><path d="M-18,-14 C-21,-35 -8,-39 0,-34 C8,-39 21,-35 18,-14 Q0,-18 -18,-14 Z" fill="${hatCol}"/><path d="M-18,-18 Q0,-22 18,-18 L18,-15 Q0,-19 -18,-15 Z" fill="${shade(hatCol, -0.45)}" stroke-width="1"/>`;
        break;
      case 'halo':
        s += `<ellipse cx="0" cy="-37" rx="16" ry="4.6" stroke-width="5.6"/><ellipse cx="0" cy="-37" rx="16" ry="4.6" stroke="#fde047" stroke-width="3"/>`;
        break;
      case 'ninja':
        s += `<path d="M-24,-15 Q0,-19 24,-15 L24.5,-10 Q0,-14 -24.5,-10 Z" fill="${ch.headband || '#dc2626'}"/>`;
        break;
    }
    if (ch.hood) s += `<path d="M-28,22 C-32,-10 -20,-34 0,-36 C20,-34 32,-10 28,22 L20,22 C22,0 16,-18 0,-19 C-16,-18 -22,0 -20,22 Z" fill="${ch.hood}"/>`;
    return s;
  }

  // ---------------------------------------------------------------- main renderer
  function drawFigure(it) {
    const ch = CHARACTERS[it.char] || CHARACTERS.maya;
    const pose = POSES[it.pose] || POSES.stand;
    const L = PROPORTIONS[ch.prop];
    const s = skeleton(pose, L);
    const ink = it.color || '#1d1d1d';
    const o = Math.max(1.3, (it.lw || 4) * 0.6);
    const side = pose.view === 'side';
    const skin = ch.skin;
    const top = it.cloth || ch.top;
    const dk = shade(top, -0.22), lt = shade(top, 0.22);
    const legCol = ch.pants, shoes = ch.shoes;
    const hairCol = it.hairColor || ch.hairCol;
    const H = L.torso;
    const sw = L.sw * (side ? 0.74 : 1), hw = L.hw * (side ? 0.74 : 1);
    const [hx, hy] = s.headC;
    const tdir = a => vec(180 - s.lean, a), perp = a => vec(90 - s.lean, a);
    const T = (u, v) => add(add(s.hip, tdir(u)), perp(v));
    const pts = arr => arr.map(P).join(' ');
    const path = (arr, fill, close = true) => `<path d="M${arr.map(P).join(' L')}${close ? ' Z' : ''}" fill="${fill}"/>`;
    const tube = (arr, w, col) => `<polyline points="${pts(arr)}" stroke="${ink}" stroke-width="${f(w + 2 * o)}"/><polyline points="${pts(arr)}" stroke="${col}" stroke-width="${f(w)}"/>`;
    const band = (u1, u2, w1, w2, fill) => path([T(u1, -w1), T(u1, w1), T(u2, w2), T(u2, -w2)], fill);
    const robeStyle = ['mage', 'royal', 'monk'].includes(ch.style);

    // limbs (re-rooted at shoulders / hips for a chunky body)
    const armRoot = d => side ? T(H - 6, d * 1.5) : T(H - 6, d * (sw - 4.5));
    const legRoot = d => side ? T(0, d) : T(0, d * hw * 0.42);
    const mkArm = (ang, d) => { const r = armRoot(d), e = add(r, vec(ang[0], L.upper)); return { r, e, h: add(e, vec(ang[1], L.lower)), a: ang[1] }; };
    const mkLeg = (ang, d) => { const r = legRoot(d), k = add(r, vec(ang[0], L.thigh)); return { r, k, f: add(k, vec(ang[1], L.shin)), d }; };
    const LA = mkArm(pose.la, -1), RA = mkArm(pose.ra, 1), LL = mkLeg(pose.ll, -1), RL = mkLeg(pose.rl, 1);

    const armCol = ch.robot ? '#94a3b8' : top;
    const handCol = ch.robot ? '#64748b' : (ch.gloves || skin);
    const aw = L.arm * 2, lwid = L.leg * 2;

    const armSvg = A => {
      let out = `<polyline points="${pts([A.r, A.e, A.h])}" stroke="${ink}" stroke-width="${f(aw + 2 * o)}"/>`;
      if (ch.sleeve === 'short') {
        const se = lerp(A.r, A.e, 0.45);
        out += `<polyline points="${pts([A.r, A.e, A.h])}" stroke="${skin}" stroke-width="${f(aw)}"/>`
          + `<polyline points="${pts([A.r, se])}" stroke="${ink}" stroke-width="${f(aw + o)}"/><polyline points="${pts([A.r, se])}" stroke="${armCol}" stroke-width="${f(aw)}"/>`;
      } else {
        out += `<polyline points="${pts([A.r, A.e, A.h])}" stroke="${armCol}" stroke-width="${f(aw)}"/>`;
        if (ch.robot) out += `<circle cx="${f(A.e[0])}" cy="${f(A.e[1])}" r="${f(L.arm * 0.9)}" fill="#475569" stroke-width="${f(o * 0.7)}"/>`;
        if (ch.style === 'plate' || ch.style === 'spacesuit') { const c = lerp(A.e, A.h, 0.7); out += `<polyline points="${pts([c, A.h])}" stroke="${ink}" stroke-width="${f(aw + o)}"/><polyline points="${pts([c, A.h])}" stroke="${handCol}" stroke-width="${f(aw)}"/>`; }
      }
      return out;
    };
    const handSvg = A => `<circle cx="${f(A.h[0])}" cy="${f(A.h[1])}" r="${f(L.arm * 1.15)}" fill="${handCol}"/>`;
    const hL = it.handL !== undefined ? it.handL : (ch.handL || 'none');
    const hR = it.handR !== undefined ? it.handR : (ch.handR || 'none');
    const fullArm = (A, item) => armSvg(A) + (item && item !== 'none' ? handItem(item, A) : '') + handSvg(A);

    const shoeSvg = G => {
      const sx = G.f[0] + (side ? 3.5 : G.d * 2), sy = G.f[1] - 2.6;
      return `<ellipse cx="${f(sx)}" cy="${f(sy)}" rx="${f(L.leg * 1.4)}" ry="${f(L.leg * 0.85)}" fill="${shoes}"/><path d="M${f(sx - L.leg * 0.9)},${f(sy - 1.6)} q${f(L.leg * 0.5)},-1.6 ${f(L.leg)},-1" stroke="#fff" stroke-width="1.2" opacity="0.6"/>`;
    };
    const legSvg = G => {
      let out = tube([G.r, G.k, G.f], lwid, ch.robot ? '#64748b' : legCol);
      if (ch.boots) { const b0 = lerp(G.k, G.f, 0.4); out += `<polyline points="${pts([b0, G.f])}" stroke="${ink}" stroke-width="${f(lwid + o)}"/><polyline points="${pts([b0, G.f])}" stroke="${shoes}" stroke-width="${f(lwid)}"/>`; }
      if (ch.robot || ch.style === 'plate') out += `<circle cx="${f(G.k[0])}" cy="${f(G.k[1])}" r="${f(L.leg * 0.95)}" fill="${ch.robot ? '#475569' : '#e2e8f0'}" stroke-width="${f(o * 0.8)}"/>`;
      return out + shoeSvg(G);
    };

    let back = '', legs = '', torso = '', front = '', late = '';

    // ---- back layer: wings, cape, packs, hood
    if (ch.wings) {
      const p = T(H - 10, 0);
      const wing = d => `<path d="M${P(p)} L${P(add(p, [d * 8, -14]))} Q${P(add(p, [d * 36, -38]))} ${P(add(p, [d * 46, -22]))} Q${P(add(p, [d * 42, -10]))} ${P(add(p, [d * 32, -8]))} Q${P(add(p, [d * 36, 0]))} ${P(add(p, [d * 25, 3]))} Q${P(add(p, [d * 27, 10]))} ${P(add(p, [d * 14, 9]))} Z" fill="#fff"/><path d="M${P(add(p, [d * 14, -6]))} Q${P(add(p, [d * 28, -14]))} ${P(add(p, [d * 38, -18]))} M${P(add(p, [d * 12, 1]))} Q${P(add(p, [d * 22, -2]))} ${P(add(p, [d * 30, -4]))}" stroke-width="${f(o * 0.6)}"/>`;
      back += side ? wing(-1) : wing(-1) + wing(1);
    }
    if (ch.cape) {
      const bot = -(L.thigh + L.shin) + 6;
      const a = T(H - 2, -sw + 2), b = T(H - 2, sw - 2);
      const bl = T(bot, side ? -sw - 16 : -sw - 7), br = T(bot, side ? sw - 4 : sw + 7);
      back += `<path d="M${P(a)} Q${P(T(H * 0.3, side ? -sw - 10 : -sw - 4))} ${P(bl)} Q${P(T(bot - 4, side ? -6 : 0))} ${P(br)} Q${P(T(H * 0.3, side ? sw - 2 : sw + 4))} ${P(b)} Z" fill="${ch.cape}"/>`;
    }
    if (ch.backpack && side) back += path([T(H - 4, -sw + 2), T(H - 4, -sw - 9), T(10, -sw - 9), T(10, -sw + 2)], ch.backpack) + path([T(22, -sw - 9), T(22, -sw - 3), T(12, -sw - 3), T(12, -sw - 9)], shade(ch.backpack, -0.2));
    if (ch.style === 'spacesuit') back += side ? path([T(H - 2, -sw + 2), T(H - 2, -sw - 8), T(8, -sw - 8), T(8, -sw + 2)], '#cbd5e1') : path([T(H - 2, -sw - 4), T(H - 2, sw + 4), T(10, sw + 4), T(10, -sw - 4)], '#cbd5e1');
    if (side) back += fullArm(LA, hL === 'shield' ? 'none' : hL);

    // ---- legs
    legs += legSvg(LL) + legSvg(RL);

    // ---- long robes and coat skirts (over the legs)
    if (robeStyle) {
      const c = lerp(LL.f, RL.f, 0.5);
      const spread = Math.max(hw + 9, Math.hypot(LL.f[0] - RL.f[0], LL.f[1] - RL.f[1]) / 2 + 10);
      const hemL = add(add(c, perp(-spread)), [0, 1]), hemR = add(add(c, perp(spread)), [0, 1]);
      torso += `<path d="M${P(T(H - 9, -sw))} Q${P(T(H - 1, -sw))} ${P(T(H - 1, -sw + 7))} L${P(T(H - 1, sw - 7))} Q${P(T(H - 1, sw))} ${P(T(H - 9, sw))} L${P(hemR)} Q${P(add(c, [0, 5]))} ${P(hemL)} Z" fill="${top}"/>`;
      if (ch.style === 'royal') torso += path([T(H - 2, -4), T(H - 2, 4), add(add(c, perp(5)), [0, 3]), add(add(c, perp(-5)), [0, 3])], '#fff')
        + [0.3, 0.55, 0.8].map(t => { const p = lerp(T(H - 2, 0), add(c, [0, 3]), t); return `<path d="M${f(p[0])},${f(p[1] - 2)} v3" stroke-width="1.8"/>`; }).join('');
      if (ch.style === 'mage') torso += [[0.55, -0.5], [0.75, 0.45], [0.4, 0.5]].map(([t, v]) => { const p = add(lerp(T(H, 0), c, t), perp(v * spread)); return `<path transform="translate(${P(p)}) scale(0.45)" d="M0,-8 l2.4,5 5.6,.8 -4,3.9 1,5.5 -5,-2.6 -5,2.6 1,-5.5 -4,-3.9 5.6,-.8z" fill="#fbbf24" stroke-width="2"/>`; }).join('');
      torso += shoeSvg(LL) + shoeSvg(RL);
    }
    const skirt = { trench: 0.85, corsair: 0.6, tunic: 0.5 }[ch.style];
    if (skirt) {
      const u = -L.thigh * skirt;
      torso += `<path d="M${P(T(9, -hw - 1))} L${P(T(9, hw + 1))} L${P(T(u, hw + 5))} Q${P(T(u - 2, 0))} ${P(T(u, -hw - 5))} Z" fill="${ch.style === 'tunic' ? shade(top, -0.08) : top}"/>`;
      if (ch.style === 'trench') torso += `<path d="M${P(T(8, 1))} L${P(T(u + 1, 2))}" stroke-width="${f(o * 0.7)}"/>`;
    }

    // ---- pelvis + top
    if (!robeStyle) {
      torso += path([T(10, -hw), T(10, hw), T(-1, hw), T(-1, -hw)], ch.robot ? '#64748b' : legCol).replace('/>', ' stroke="none"/>')
        + `<path d="M${P(T(10, -hw))} L${P(T(-1, -hw))} M${P(T(10, hw))} L${P(T(-1, hw))}"/>`;
      torso += `<path d="M${P(T(5, -hw))} L${P(T(H - 9, -sw))} Q${P(T(H - 1, -sw))} ${P(T(H - 1, -sw + 7))} L${P(T(H - 1, sw - 7))} Q${P(T(H - 1, sw))} ${P(T(H - 9, sw))} L${P(T(5, hw))} Q${P(T(3, 0))} ${P(T(5, -hw))} Z" fill="${top}"/>`;
    }

    // ---- outfit details
    const ln = (a, b, w = o * 0.75, col) => `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke-width="${f(w)}"${col ? ` stroke="${col}"` : ''}/>`;
    const dot = (p, r, fill) => `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${r}" fill="${fill}" stroke="none"/>`;
    const neckArc = `<path d="M${P(T(H - 1, -6))} Q${P(T(H - 7, 0))} ${P(T(H - 1, 6))}" stroke-width="${f(o * 0.8)}"/>`;
    const wide = side ? 0.6 : 1;
    switch (ch.style) {
      case 'sweater': torso += neckArc + ln(T(9, -hw + 1), T(9, hw - 1), o * 0.6); break;
      case 'tee': torso += neckArc; break;
      case 'jacket':
        torso += path([T(H - 1, -6 * wide), T(6, -4 * wide), T(6, 4 * wide), T(H - 1, 6 * wide)], ch.inner || '#fff')
          + path([T(H - 1, -sw + 5), T(H - 1, -4 * wide), T(H - 13, -2 * wide)], dk) + path([T(H - 1, sw - 5), T(H - 1, 4 * wide), T(H - 13, 2 * wide)], dk)
          + ln(T(14, -hw + 3), T(14, -hw + 8)) + ln(T(14, hw - 3), T(14, hw - 8));
        break;
      case 'hoodie':
        torso += path([T(18, -8 * wide), T(18, 8 * wide), T(8, 10 * wide), T(8, -10 * wide)], dk)
          + ln(T(H - 3, -3), T(H - 13, -3.5)) + ln(T(H - 3, 3), T(H - 13, 3.5)) + `<path d="M${P(T(H, -sw + 4))} Q${P(T(H + 5, 0))} ${P(T(H, sw - 4))}" fill="${dk}"/>`;
        break;
      case 'overalls':
        torso += neckArc + band(H - 14, 6, 8 * wide, hw, legCol)
          + `<polyline points="${pts([T(H - 14, -6 * wide), T(H - 1, -sw + 5)])}" stroke-width="${f(3.6 + o * 2)}"/><polyline points="${pts([T(H - 14, -6 * wide), T(H - 1, -sw + 5)])}" stroke="${legCol}" stroke-width="3.6"/>`
          + `<polyline points="${pts([T(H - 14, 6 * wide), T(H - 1, sw - 5)])}" stroke-width="${f(3.6 + o * 2)}"/><polyline points="${pts([T(H - 14, 6 * wide), T(H - 1, sw - 5)])}" stroke="${legCol}" stroke-width="3.6"/>`
          + dot(T(H - 15, -6 * wide), 1.8, '#fbbf24') + dot(T(H - 15, 6 * wide), 1.8, '#fbbf24') + band(H - 20, H - 28, 4 * wide, 4 * wide, shade(legCol, -0.15));
        break;
      case 'suit': case 'tweed':
        torso += path([T(H - 1, -6.5 * wide), T(H - 17, 0), T(H - 1, 6.5 * wide)], ch.inner || '#fff');
        if (ch.tie) torso += path([T(H - 3, -2), T(H - 3, 2), T(H - 6, 2.4), T(H - 18, 2.8), T(H - 22, 0), T(H - 18, -2.8), T(H - 6, -2.4)], ch.tie);
        torso += `<path d="M${P(T(H - 1, -7.5 * wide))} L${P(T(H - 19, -1))} M${P(T(H - 1, 7.5 * wide))} L${P(T(H - 19, 1))}" stroke-width="${f(o * 0.8)}"/>` + dot(T(12, 0), 1.5, ink);
        if (ch.style === 'tweed') torso += ln(T(16, -hw + 2), T(16, -hw + 7)) + ln(T(16, hw - 2), T(16, hw - 7));
        break;
      case 'tech':
        torso += path([T(H - 1, -8 * wide), T(H + 3, -7 * wide), T(H + 3, 7 * wide), T(H - 1, 8 * wide)], dk)
          + ln(T(H - 1, 1), T(6, 1), 1.8, ch.accent) + ln(T(H - 13, -sw + 2), T(H - 13, -4), 1.6, ch.accent) + ln(T(14, hw - 2), T(14, 4), 1.6, ch.accent);
        break;
      case 'spacesuit':
        torso += band(H - 9, H - 23, 7 * wide, 7 * wide, '#e2e8f0') + dot(T(H - 16, -3.5 * wide), 1.6, ch.accent) + dot(T(H - 16, 0), 1.6, '#3b82f6') + dot(T(H - 16, 3.5 * wide), 1.6, '#facc15')
          + band(9, 5, hw, hw, '#94a3b8') + ln(T(H - 3, -sw + 3), T(14, -hw + 2), 2.2, ch.accent);
        break;
      case 'cyber':
        torso += band(H - 6, H - 22, 10 * wide, 9 * wide, shade(top, 0.25)) + `<circle cx="${f(T(H - 14, 0)[0])}" cy="${f(T(H - 14, 0)[1])}" r="3.6" fill="${ch.accent}"/>`
          + ln(T(15, -hw + 2), T(15, hw - 2)) + ln(T(10, -hw + 2), T(10, hw - 2));
        break;
      case 'shinobi':
        torso += `<path d="M${P(T(H - 1, -7 * wide))} L${P(T(14, 5 * wide))} M${P(T(H - 1, 7 * wide))} L${P(T(H - 10, 1))}" stroke-width="${f(o * 0.8)}"/>` + band(12, 4, hw + 0.5, hw + 0.5, ch.belt);
        break;
      case 'plate':
        torso += path([T(H - 4, -sw + 4), T(H - 4, sw - 4), T(14, hw - 2), T(10, 0), T(14, -hw + 2)], lt) + ln(T(H - 4, 0), T(11, 0))
          + band(10, 5, hw, hw, '#475569') + band(10, 5, 2.5, 2.5, '#fbbf24');
        break;
      case 'leather':
        torso += ln(T(H - 2, -3 * wide), T(7, 4 * wide), o * 0.8) + path([T(H - 1, -sw + 5), T(H - 1, -3 * wide), T(H - 11, -5 * wide)], dk) + path([T(H - 1, sw - 5), T(H - 1, 4 * wide), T(H - 9, 7 * wide)], dk);
        break;
      case 'apron':
        torso += neckArc + path([T(H - 12, -7 * wide), T(H - 12, 7 * wide), T(-6, hw + 1), T(-6, -hw - 1)], ch.apron)
          + ln(T(H - 12, -6 * wide), T(H - 1, -6 * wide), 2.2, ch.apron) + ln(T(H - 12, 6 * wide), T(H - 1, 6 * wide), 2.2, ch.apron)
          + `<circle cx="${f(T(H - 18, 0)[0])}" cy="${f(T(H - 18, 0)[1])}" r="2.8" fill="#fff" stroke-width="1"/>`;
        break;
      case 'scrubs':
        torso += path([T(H - 1, -6 * wide), T(H - 11, 0), T(H - 1, 6 * wide)], dk) + band(H - 14, H - 21, 3, 3, dk).replace(/T/, '')
          + path([T(H - 14, -sw + 6), T(H - 14, -sw + 9), T(H - 17, -sw + 9), T(H - 17, -sw + 6)], '#ef4444');
        break;
      case 'chef':
        torso += path([T(H - 1, -6), T(H + 2, -6), T(H + 2, 6), T(H - 1, 6)], '#fff') + [H - 10, H - 18, H - 26].map(u => dot(T(u, -4 * wide), 1.4, ink) + dot(T(u, 4 * wide), 1.4, ink)).join('');
        break;
      case 'safari':
        torso += path([T(H - 1, -sw + 5), T(H - 1, -2), T(H - 9, -4)], dk) + path([T(H - 1, sw - 5), T(H - 1, 2), T(H - 9, 4)], dk)
          + band(H - 11, H - 19, sw - 4, sw - 5, dk).replace(' fill', ' fill-opacity="0.5" fill') + ln(T(H - 3, 0), T(8, 0), o * 0.6);
        if (ch.camera) torso += band(H - 17, H - 26, 6 * wide, 6 * wide, '#1e293b') + `<circle cx="${f(T(H - 21.5, 0)[0])}" cy="${f(T(H - 21.5, 0)[1])}" r="2.6" fill="#38bdf8" stroke-width="1"/>`;
        break;
      case 'trench':
        torso += path([T(H - 1, -7 * wide), T(H - 20, -1), T(H - 8, -sw + 3)], dk) + path([T(H - 1, 7 * wide), T(H - 20, 1), T(H - 8, sw - 3)], dk)
          + band(11, 6, hw + 0.5, hw + 0.5, dk) + dot(T(17, -4 * wide), 1.4, ink) + dot(T(17, 4 * wide), 1.4, ink);
        break;
      case 'corsair':
        torso += path([T(H - 1, -6 * wide), T(8, -3 * wide), T(8, 3 * wide), T(H - 1, 6 * wide)], ch.inner || '#fff')
          + `<path d="M${P(T(H - 4, 0))} l-2,3 l4,2 l-4,2 l4,2" stroke-width="1"/>` + band(12, 5, hw + 0.5, hw + 0.5, ch.belt) + band(11, 6, 2.6, 2.6, '#fbbf24');
        break;
      case 'tunic':
        torso += neckArc + path([T(H - 2, -sw + 4), T(H - 2, sw - 4), T(H - 16, sw - 6), T(H - 20, 0), T(H - 16, -sw + 6)], '#e2e8f0');
        break;
      case 'mage':
        torso += path([T(H - 1, -6), T(H - 12, 0), T(H - 1, 6)], dk) + band(11, 7, hw + 1, hw + 1, '#fbbf24');
        break;
      case 'royal':
        torso += `<path d="M${P(T(H + 1, -sw - 1))} Q${P(T(H - 16, 0))} ${P(T(H + 1, sw + 1))} Q${P(T(H + 4, 0))} ${P(T(H + 1, -sw - 1))} Z" fill="#fff"/>` + [-8, 0, 8].map(v => dot(T(H - 4, v * wide), 1.2, ink)).join('')
          + `<path d="M${P(T(H - 4, -8 * wide))} Q${P(T(H - 16, 0))} ${P(T(H - 4, 8 * wide))}" stroke="#fbbf24" stroke-width="2"/>`;
        break;
      case 'monk':
        torso += `<polyline points="${pts([T(H - 1, -sw + 4), T(6, hw)])}" stroke-width="${f(5 + 2 * o)}"/><polyline points="${pts([T(H - 1, -sw + 4), T(6, hw)])}" stroke="#f97316" stroke-width="5"/>`;
        break;
    }
    if (ch.belt && !['shinobi', 'corsair', 'tunic'].includes(ch.style)) torso += band(10, 6, hw + 0.4, hw + 0.4, ch.belt) + band(10.5, 5.5, 2.4, 2.4, '#fbbf24');
    if (ch.style === 'tunic') torso += band(11, 6, hw + 0.5, hw + 0.5, ch.belt || '#78350f');
    if (ch.scarf) torso += tube([T(H - 1, -sw + 5), T(H - 3, 0), T(H - 1, sw - 5)], 5, ch.scarf) + tube([T(H - 3, 4 * wide), T(H - 22, 6 * wide)], 5, ch.scarf);
    if (ch.backpack && !side) torso += ln(T(H - 1, -sw + 5), T(12, -hw + 2), 3, shade(ch.backpack, -0.2)) + ln(T(H - 1, sw - 5), T(12, hw - 2), 3, shade(ch.backpack, -0.2));

    // ---- arms (in front of the body; hands near the face go over the head)
    const nearHead = A => Math.hypot(A.h[0] - hx, A.h[1] - hy) < L.head * 1.2;
    const frontArms = side ? [[RA, hR]] : [[LA, hL], [RA, hR]];
    for (const [A, item] of frontArms) (nearHead(A) ? (late += fullArm(A, item)) : (front += fullArm(A, item)));
    if (side && hL === 'shield') front += handItem('shield', LA);
    if (ch.style === 'plate') front += (side ? [1] : [-1, 1]).map(d => { const p = armRoot(d); return `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="7.5" fill="#e2e8f0"/><path d="M${f(p[0] - 4)},${f(p[1] - 3)} q3,-3 7,-1" stroke="#fff" stroke-width="1.6"/>`; }).join('');

    // ---- neck + head
    const tilt = pose.ground === 'hip' ? s.lean + (pose.head || 0) : Math.max(-40, Math.min(45, s.lean + (pose.head || 0)));
    const k = L.head / 25;
    let head = tube([T(H - 3, 0), T(H + 5, 0)], 9, skin);
    head += `<g transform="translate(${f(hx)},${f(hy)}) rotate(${f(tilt)}) scale(${f(k * 100) / 100})">${drawHead(ch, it, o / k, side, ink, skin, hairCol, top)}</g>`;

    const fxSvg = effects((it.fx || []).slice(), s, L.head, ink, it.flipX);
    const scale = ch.scale || 1;
    return `<g transform="translate(${NW / 2},${GROUND}) scale(${scale})" fill="none" stroke="${ink}" stroke-width="${f(o)}" stroke-linecap="round" stroke-linejoin="round">${back + legs + torso + front + head + late + fxSvg}</g>`;
  }

  function headAt(char, pose) {
    const ch = CHARACTERS[char] || CHARACTERS.maya;
    const s = skeleton(POSES[pose] || POSES.stand, PROPORTIONS[ch.prop]);
    const k = ch.scale || 1;
    return [NW / 2 + s.headC[0] * k, GROUND + s.headC[1] * k, PROPORTIONS[ch.prop].head * k];
  }

  function hipAt(char, pose) {
    const ch = CHARACTERS[char] || CHARACTERS.maya;
    const s = skeleton(POSES[pose] || POSES.stand, PROPORTIONS[ch.prop]);
    const k = ch.scale || 1;
    return [NW / 2 + s.hip[0] * k, GROUND + s.hip[1] * k];
  }

  window.FIG = { NW, NH, GROUND, POSES, CHARACTERS, EXPRESSIONS, FX, HAND_ITEMS, draw: drawFigure, headAt, hipAt };
})();
