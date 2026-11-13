/* StickStudio 2 – detailed parametric character engine.
 * Every figure = character (layered outfit + proportions + hair/gear) × pose (joint angles) × expression × effects.
 * Angles are absolute, in degrees: 0 = straight down, 90 = forward (+x), -90 = backward, 180 = up.
 * Figures are drawn facing right; flipping is done by the item transform.
 */
(function () {
  const NW = 120, NH = 220;           // native box
  const GROUND = 212;                 // ground line inside native box
  const PAPER = '#ffffff';
  const SKIN = '#fde2c8';
  const SKIN_SHADE = '#f3c39d';

  const PROPORTIONS = {
    adult: { torso: 52, neck: 7, upper: 29, lower: 28, thigh: 38, shin: 38, head: 17 },
    kid:   { torso: 40, neck: 6, upper: 23, lower: 22, thigh: 29, shin: 29, head: 18 }
  };

  // ---------------------------------------------------------------- poses (preserved)
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

  // ---------------------------------------------------------------- completely new detailed character cast
  const CHARACTERS = {
    maya:      { name: 'Maya',        prop: 'adult', skin: '#fde2c8', top: '#6366f1', pants: '#2c3e50', shoes: '#ffffff', hair: 'bob',    hairCol: '#3b2820', style: 'hoodie',   glasses: true },
    leo:       { name: 'Leo',         prop: 'adult', skin: '#f5cfa8', top: '#3b82f6', pants: '#34495e', shoes: '#e17055', hair: 'spiky',  hairCol: '#2d231e', style: 'jacket',   collar: true },
    zoe:       { name: 'Zoe',         prop: 'kid',   skin: '#fde2c8', top: '#f59e0b', pants: '#2980b9', shoes: '#ef4444', hair: 'buns',   hairCol: '#6b3e26', style: 'overalls' },
    sam:       { name: 'Sam',         prop: 'kid',   skin: '#d9a06c', top: '#10b981', pants: '#34495e', shoes: '#ffffff', hair: 'curly',  hairCol: '#1f1916', style: 'tee',      hat: 'cap', backpack: true },
    exec:      { name: 'Executive',   prop: 'adult', skin: '#f5cfa8', top: '#1e293b', pants: '#1e293b', shoes: '#111827', hair: 'parted', hairCol: '#4a3728', style: 'suit',     tie: '#ef4444', handR: 'briefcase' },
    prof:      { name: 'Professor',   prop: 'adult', skin: '#fde2c8', top: '#8d6e63', pants: '#4e342e', shoes: '#2d1e18', hair: 'wavy',   hairCol: '#cbd5e1', style: 'tweed',    beard: 'trim', glasses: true, handR: 'book' },
    cyber:     { name: 'Cyberpunk',   prop: 'adult', skin: '#f3d2b8', top: '#1e1b4b', pants: '#0f172a', shoes: '#06b6d4', hair: 'mohawk', hairCol: '#ec4899', style: 'tech',     visor: '#06b6d4', accent: '#22d3ee' },
    ranger:    { name: 'Space Ranger',prop: 'adult', skin: '#fde2c8', top: '#f8fafc', pants: '#e2e8f0', shoes: '#334155', hair: 'none',   hairCol: '#333',    style: 'spacesuit',hat: 'astro', jetpack: true, accent: '#f97316' },
    android:   { name: 'Android',     prop: 'adult', skin: '#e2e8f0', top: '#475569', pants: '#334155', shoes: '#1e293b', hair: 'none',   hairCol: '#333',    style: 'cyber',    robot: true, accent: '#38bdf8' },
    agent:     { name: 'Secret Agent',prop: 'adult', skin: '#f5cfa8', top: '#334155', pants: '#1e293b', shoes: '#0f172a', hair: 'slick',  hairCol: '#1e1b18', style: 'trench',   shades: true, ear: true },
    shinobi:   { name: 'Shinobi',     prop: 'adult', skin: '#f5cfa8', top: '#1e293b', pants: '#0f172a', shoes: '#1e293b', hair: 'spiky',  hairCol: '#0f172a', style: 'shinobi',  hat: 'ninja', scarf: '#ef4444', handR: 'sword' },
    paladin:   { name: 'Paladin',     prop: 'adult', skin: '#fde2c8', top: '#cbd5e1', pants: '#94a3b8', shoes: '#475569', hair: 'none',   hairCol: '#333',    style: 'plate',    hat: 'helmet', cape: '#2563eb', handR: 'sword', handL: 'shield' },
    archmage:  { name: 'Archmage',    prop: 'adult', skin: '#f5cfa8', top: '#4c1d95', pants: '#2e1065', shoes: '#1e1b4b', hair: 'long',   hairCol: '#e2e8f0', style: 'mage',     hat: 'wizard', beard: 'long', handL: 'staff' },
    rogue:     { name: 'Rogue',       prop: 'adult', skin: '#e6b89c', top: '#374151', pants: '#1f2937', shoes: '#111827', hair: 'bob',    hairCol: '#1f2937', style: 'leather',  hood: '#1f2937', cape: '#374151', handR: 'cutlass' },
    valkyrie:  { name: 'Valkyrie',    prop: 'adult', skin: '#fde2c8', top: '#e2e8f0', pants: '#334155', shoes: '#475569', hair: 'long',   hairCol: '#fbbf24', style: 'plate',    hat: 'valkyrie', cape: '#dc2626', handR: 'spear' },
    barista:   { name: 'Barista',     prop: 'adult', skin: '#d9a06c', top: '#f8fafc', pants: '#334155', shoes: '#451a03', hair: 'curly',  hairCol: '#291d18', style: 'apron',    hat: 'beanie', accent: '#15803d', handR: 'cup' },
    medic:     { name: 'Field Medic', prop: 'adult', skin: '#fde2c8', top: '#0ea5e9', pants: '#0284c7', shoes: '#ffffff', hair: 'ponytail',hairCol: '#5c3a21', style: 'scrubs',   stethoscope: true },
    chef:      { name: 'Master Chef', prop: 'adult', skin: '#f5cfa8', top: '#ffffff', pants: '#1e293b', shoes: '#111827', hair: 'parted', hairCol: '#3e2723', style: 'chef',     hat: 'chef', mustache: true, handR: 'pan' },
    rockstar:  { name: 'Rockstar',    prop: 'adult', skin: '#fde2c8', top: '#18181b', pants: '#3f3f46', shoes: '#09090b', hair: 'rock',   hairCol: '#be185d', style: 'leather',  shades: true, scarf: '#a855f7' },
    explorer:  { name: 'Explorer',    prop: 'adult', skin: '#e6b89c', top: '#d6b88d', pants: '#785a3c', shoes: '#451a03', hair: 'parted', hairCol: '#4a3728', style: 'safari',   hat: 'safari', backpack: true, handR: 'magnifier' },
    detective: { name: 'Detective',   prop: 'adult', skin: '#f5cfa8', top: '#b48a5a', pants: '#4a3f35', shoes: '#2d241e', hair: 'parted', hairCol: '#2d231e', style: 'trench',   hat: 'deerstalker', handR: 'magnifier' },
    monarch:   { name: 'Monarch',     prop: 'adult', skin: '#fde2c8', top: '#7c2d12', pants: '#451a03', shoes: '#78350f', hair: 'wavy',   hairCol: '#4a3728', style: 'royal',    hat: 'crown', cape: '#991b1b', handR: 'scepter' },
    pirate:    { name: 'Corsair',     prop: 'adult', skin: '#e6b89c', top: '#f8fafc', pants: '#1e293b', shoes: '#451a03', hair: 'long',   hairCol: '#291d18', style: 'corsair',  hat: 'pirate', patch: true, beard: 'trim', handR: 'cutlass' },
    angel:     { name: 'Celestial',   prop: 'adult', skin: '#fde2c8', top: '#f8fafc', pants: '#e2e8f0', shoes: '#fbbf24', hair: 'wavy',   hairCol: '#fef08a', style: 'tunic',    hat: 'halo', wings: 'angel' },
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
    paintbrush: 'Paintbrush', trident: 'Trident', scroll: 'Diploma / Scroll'
  };

  // ---------------------------------------------------------------- math helpers
  const rad = a => a * Math.PI / 180;
  const vec = (a, l) => [Math.sin(rad(a)) * l, Math.cos(rad(a)) * l];
  const add = (p, v) => [p[0] + v[0], p[1] + v[1]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const len = v => Math.hypot(v[0], v[1]) || 1;
  const norm = v => { const l = len(v); return [v[0] / l, v[1] / l]; };
  const f = n => Math.round(n * 10) / 10;
  const P = p => f(p[0]) + ',' + f(p[1]);

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

  // Draw a tapered/volumetric limb segment with outline + fill
  function limbSeg(a, b, w1, w2, fill, stroke, sw) {
    const d = norm(sub(b, a));
    const n = [-d[1], d[0]];
    const p1 = add(a, [n[0] * w1, n[1] * w1]);
    const p2 = add(b, [n[0] * w2, n[1] * w2]);
    const p3 = add(b, [-n[0] * w2, -n[1] * w2]);
    const p4 = add(a, [-n[0] * w1, -n[1] * w1]);
    return `<path d="M${P(p1)} L${P(p2)} A${f(w2)},${f(w2)} 0 0 1 ${P(p3)} L${P(p4)} A${f(w1)},${f(w1)} 0 0 1 ${P(p1)} Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  }

  // ---------------------------------------------------------------- detailed faces
  function face(expr, c, r, side, stroke, ch) {
    if (expr === 'none') return '';
    const [cx0, cy] = c;
    const cx = cx0 + (side ? r * 0.28 : 0);
    const ex = r * 0.36, ey = cy - r * 0.14, my = cy + r * 0.38;
    const L = (x1, y1, x2, y2, w = 2) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke-width="${w}"/>`;
    const dot = (x, y, rr = 2) => `<circle cx="${f(x)}" cy="${f(y)}" r="${rr}" fill="${stroke}" stroke="none"/>`;

    // Detailed eye with sclera, pupil, and catchlight
    const eye = (x, y = ey, rx = 2.7, ry = 3.2) => ch.robot
      ? `<circle cx="${f(x)}" cy="${f(y)}" r="3.2" fill="#0f172a" stroke="${stroke}" stroke-width="1.2"/><circle cx="${f(x)}" cy="${f(y)}" r="1.6" fill="${ch.accent || '#38bdf8'}" stroke="none"/>`
      : `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${rx}" ry="${ry}" fill="${PAPER}" stroke="${stroke}" stroke-width="1.4"/><circle cx="${f(x + (side ? 0.6 : 0))}" cy="${f(y)}" r="${f(rx * 0.58)}" fill="${stroke}" stroke="none"/><circle cx="${f(x + 0.8)}" cy="${f(y - 0.9)}" r="0.85" fill="${PAPER}" stroke="none"/>`;

    const eyes = () => eye(cx - ex) + eye(cx + ex);
    const nose = `<path d="M${f(cx + (side ? 1.5 : 0))},${f(ey + 2.5)} q${side ? 3 : 1.8},2.5 0,4.2" stroke-width="1.5" opacity="0.55"/>`;
    const blush = `<ellipse cx="${f(cx - ex - 2)}" cy="${f(ey + 5.2)}" rx="3" ry="1.6" fill="#fda4af" opacity="0.6" stroke="none"/><ellipse cx="${f(cx + ex + 2)}" cy="${f(ey + 5.2)}" rx="3" ry="1.6" fill="#fda4af" opacity="0.6" stroke="none"/>`;
    const smile = (w, d) => `<path d="M${f(cx - w)},${f(my - d / 3)} Q${f(cx)},${f(my + d)} ${f(cx + w)},${f(my - d / 3)}" stroke-width="2.1"/>`;
    const frown = (w, d) => `<path d="M${f(cx - w)},${f(my + d / 2)} Q${f(cx)},${f(my - d)} ${f(cx + w)},${f(my + d / 2)}" stroke-width="2.1"/>`;
    const brows = (inner, outer) => L(cx - ex - 3.8, ey - 5.2 + outer, cx - ex + 3.2, ey - 5.2 + inner, 1.8) + L(cx + ex + 3.8, ey - 5.2 + outer, cx + ex - 3.2, ey - 5.2 + inner, 1.8);
    const closedEye = (x, up) => `<path d="M${f(x - 3.5)},${f(ey)} Q${f(x)},${f(ey + (up ? -4 : 3))} ${f(x + 3.5)},${f(ey)}" stroke-width="2"/>`;

    let out = nose;
    switch (expr) {
      case 'neutral': out += eyes() + brows(0, 0) + L(cx - 4.5, my + 1, cx + 4.5, my + 1, 2); break;
      case 'grin': out += eyes() + brows(-1, 0) + `<path d="M${f(cx - 7.5)},${f(my - 2)} Q${f(cx)},${f(my + 9)} ${f(cx + 7.5)},${f(my - 2)} Z" fill="${PAPER}" stroke-width="2"/>` + L(cx - 6, my + 0.5, cx + 6, my + 0.5, 1.1); break;
      case 'laugh': out += blush + closedEye(cx - ex, true) + closedEye(cx + ex, true) + `<path d="M${f(cx - 8)},${f(my - 3)} Q${f(cx)},${f(my + 11)} ${f(cx + 8)},${f(my - 3)} Z" fill="#991b1b" stroke-width="1.8"/><path d="M${f(cx - 5)},${f(my + 4)} Q${f(cx)},${f(my + 1)} ${f(cx + 5)},${f(my + 4)} Q${f(cx)},${f(my + 7)} ${f(cx - 5)},${f(my + 4)} Z" fill="#fb7185" stroke="none"/>`; break;
      case 'sad': out += eyes() + brows(-3, 1) + frown(5.5, 4); break;
      case 'cry': out += closedEye(cx - ex, false) + closedEye(cx + ex, false) + brows(-3, 1) + frown(6, 5)
        + `<path d="M${f(cx - ex)},${f(ey + 3.5)} q-2,6 0,8 q2,-2 0,-8" fill="#60a5fa" stroke="#2563eb" stroke-width="1.1"/><path d="M${f(cx + ex)},${f(ey + 3.5)} q-2,6 0,8 q2,-2 0,-8" fill="#60a5fa" stroke="#2563eb" stroke-width="1.1"/>`; break;
      case 'angry': out += eyes() + brows(3.2, -2) + frown(5.5, 3.2); break;
      case 'yell': out += eyes() + brows(4, -2) + `<ellipse cx="${f(cx)}" cy="${f(my + 1)}" rx="6" ry="5" fill="#991b1b" stroke-width="1.6"/>`; break;
      case 'surprised': out += eye(cx - ex, ey, 3.4, 3.8) + eye(cx + ex, ey, 3.4, 3.8) + brows(-2.5, -1) + `<ellipse cx="${f(cx)}" cy="${f(my + 1)}" rx="3.4" ry="4.4" fill="#991b1b" stroke-width="1.8"/>`; break;
      case 'scared': out += eye(cx - ex, ey, 3.5, 4) + eye(cx + ex, ey, 3.5, 4) + brows(-4, 1)
        + `<path d="M${f(cx - 7)},${f(my + 1)} l2.3,-2.5 l2.3,2.5 l2.3,-2.5 l2.3,2.5 l2.3,-2.5" stroke-width="1.8"/>`; break;
      case 'wink': out += blush + eye(cx - ex) + closedEye(cx + ex, true) + brows(-0.5, 0) + smile(6, 4.2); break;
      case 'cool': out += `<path d="M${f(cx - ex - 5)},${f(ey - 3)} h${f(2 * ex + 10)} v2 q-1,5 -5,5 h-${f(ex * 0.5)} q-3,0 -4,-4 h-2 q-1,4 -4,4 h-${f(ex * 0.5)} q-4,0 -5,-5 z" fill="#0f172a" stroke-width="1.4"/><line x1="${f(cx - ex - 3)}" y1="${f(ey - 1.5)}" x2="${f(cx - ex + 1)}" y2="${f(ey + 1.5)}" stroke="#94a3b8" stroke-width="1.1"/>` + `<path d="M${f(cx - 4)},${f(my)} Q${f(cx + 2)},${f(my + 4)} ${f(cx + 6)},${f(my - 2)}" stroke-width="2"/>`; break;
      case 'sleepy': out += L(cx - ex - 3, ey + 1, cx - ex + 3, ey + 1, 2) + L(cx + ex - 3, ey + 1, cx + ex + 3, ey + 1, 2) + `<ellipse cx="${f(cx)}" cy="${f(my + 1)}" rx="2.5" ry="2" stroke-width="1.7"/>`; break;
      case 'love': {
        const h = (x) => `<path d="M${f(x)},${f(ey + 3)} l-3.6,-3.6 a2,2 0 0 1 3.6,-2.6 a2,2 0 0 1 3.6,2.6 z" fill="#e11d48" stroke="#be123c" stroke-width="1"/>`;
        out += blush + h(cx - ex) + h(cx + ex) + smile(6, 5);
        break;
      }
      case 'smirk': out += eyes() + brows(-0.5, 1) + `<path d="M${f(cx - 5)},${f(my + 1)} Q${f(cx + 2)},${f(my + 3)} ${f(cx + 6)},${f(my - 3)}" stroke-width="2.1"/>`; break;
      case 'dizzy': {
        const x = (x0) => L(x0 - 2.8, ey - 2.8, x0 + 2.8, ey + 2.8, 1.9) + L(x0 - 2.8, ey + 2.8, x0 + 2.8, ey - 2.8, 1.9);
        out += x(cx - ex) + x(cx + ex) + `<path d="M${f(cx - 6)},${f(my + 1)} q3,-4 6,0 q3,4 6,0" stroke-width="1.9"/>`;
        break;
      }
      default: out += blush + eyes() + brows(-0.5, 0) + smile(6, 5);
    }
    return out;
  }

  // ---------------------------------------------------------------- detailed hand items
  function handItem(kind, hand, stroke) {
    const [x, y] = hand.h, a = hand.a;
    const T = `translate(${f(x)},${f(y)})`;
    const along = inner => `<g transform="${T} rotate(${f(-a)})">${inner}</g>`;
    const up = inner => `<g transform="${T}">${inner}</g>`;
    switch (kind) {
      case 'sword': return along(`<path d="M-3,6 L-2.5,52 L0,60 L2.5,52 L3,6 Z" fill="#e2e8f0" stroke-width="1.8"/><line x1="0" y1="8" x2="0" y2="52" stroke="#94a3b8" stroke-width="1.2"/><rect x="-10" y="3" width="20" height="4" rx="1.5" fill="#fbbf24" stroke-width="1.6"/><line x1="0" y1="-7" x2="0" y2="3" stroke-width="3.2"/><circle cx="0" cy="-9" r="3" fill="#fbbf24" stroke-width="1.5"/>`);
      case 'cutlass': return along(`<path d="M-2,6 L-3,40 Q2,56 9,50 Q4,38 3,6 Z" fill="#cbd5e1" stroke-width="1.8"/><path d="M-8,5 Q0,-8 9,5" stroke="#fbbf24" stroke-width="2.4"/><line x1="0" y1="-6" x2="0" y2="5" stroke-width="3"/>`);
      case 'shield': return up(`<path d="M-18,-23 L18,-23 L18,0 Q18,20 0,28 Q-18,20 -18,0 Z" fill="#3b82f6" stroke-width="2.4"/><path d="M-13,-18 L13,-18 L13,-1 Q13,15 0,22 Q-13,15 -13,-1 Z" fill="#eff6ff" stroke-width="1.4"/><path d="M0,-18 L0,22 M-13,-5 L13,-5" stroke="#fbbf24" stroke-width="2.4"/>`);
      case 'staff': return up(`<line x1="0" y1="-76" x2="0" y2="62" stroke="#78350f" stroke-width="3.4"/><circle cx="0" cy="-84" r="8" fill="#a855f7" stroke-width="2"/><circle cx="-2" cy="-86" r="2.5" fill="#f3e8ff" stroke="none"/><path d="M-8,-76 Q0,-70 8,-76" stroke="#fbbf24" stroke-width="2.2"/>`);
      case 'scepter': return up(`<line x1="0" y1="-34" x2="0" y2="18" stroke="#d97706" stroke-width="3"/><circle cx="0" cy="-40" r="6" fill="#fbbf24" stroke-width="2"/><circle cx="0" cy="-40" r="2.5" fill="#ef4444" stroke="none"/>`);
      case 'spear': return up(`<line x1="0" y1="-92" x2="0" y2="70" stroke="#78350f" stroke-width="3"/><path d="M0,-110 L-6,-90 L0,-94 L6,-90 Z" fill="#e2e8f0" stroke-width="2"/>`);
      case 'wand': return along(`<line x1="0" y1="0" x2="0" y2="24" stroke="#78350f" stroke-width="2.6"/><path d="M0,26 l2,5 5,0 -4,3 2,5 -5,-3 -5,3 2,-5 -4,-3 5,0z" fill="#fbbf24" stroke-width="1.4"/>`);
      case 'bag': return up(`<path d="M-7,2 Q0,-6 7,2" stroke-width="2.2"/><path d="M-11,2 L11,2 L9,20 L-9,20 Z" fill="#ec4899" stroke-width="2.2"/><rect x="-3" y="8" width="6" height="4" rx="1" fill="#fbbf24" stroke-width="1"/>`);
      case 'briefcase': return up(`<path d="M-5,2 v-4 h10 v4" stroke-width="2.2"/><rect x="-15" y="2" width="30" height="20" rx="2.5" fill="#78350f" stroke-width="2.2"/><line x1="-15" y1="10" x2="15" y2="10" stroke="#451a03" stroke-width="1.6"/><rect x="-3" y="8" width="6" height="4" fill="#fbbf24" stroke-width="1"/>`);
      case 'flower': return up(`<path d="M0,6 Q-3,-10 0,-24" stroke="#16a34a" stroke-width="2.2"/><path d="M0,-12 q6,-6 9,-2 q-5,4 -9,2" fill="#4ade80" stroke="#16a34a" stroke-width="1.2"/>${[0, 72, 144, 216, 288].map(r => `<ellipse cx="0" cy="-30" rx="3.2" ry="5.5" transform="rotate(${r} 0 -24)" fill="#f472b6" stroke-width="1.3"/>`).join('')}<circle cx="0" cy="-24" r="3" fill="#facc15" stroke-width="1.2"/>`);
      case 'book': return up(`<path d="M-14,-6 L0,-2 L14,-6 L14,12 L0,16 L-14,12 Z" fill="#3b82f6" stroke-width="2"/><path d="M-11,-4 L0,0 L11,-4 L11,10 L0,14 L-11,10 Z" fill="${PAPER}" stroke-width="1.2"/><line x1="0" y1="0" x2="0" y2="14" stroke-width="1.4"/>`);
      case 'cup': return up(`<path d="M-6,-10 L6,-10 L5,4 L-5,4 Z" fill="#f8fafc" stroke-width="2"/><rect x="-6.5" y="-12" width="13" height="3" rx="1" fill="#78350f" stroke-width="1.4"/><rect x="-5.5" y="-5" width="11" height="5" fill="#d97706" stroke-width="1"/><path d="M-2,-15 q2,-3 0,-6 M2,-15 q2,-3 0,-6" stroke="#94a3b8" stroke-width="1.2"/>`);
      case 'phone': return up(`<rect x="-5" y="-13" width="10" height="17" rx="2" fill="#1e293b" stroke-width="1.8"/><rect x="-3.5" y="-10" width="7" height="11" fill="#38bdf8" stroke="none"/>`);
      case 'umbrella': return up(`<line x1="0" y1="8" x2="0" y2="-56" stroke-width="2.4"/><path d="M0,8 q0,5 -5,4" stroke-width="2.4"/><path d="M-34,-50 Q0,-88 34,-50 Q25,-56 17,-50 Q9,-57 0,-50 Q-9,-57 -17,-50 Q-25,-56 -34,-50 Z" fill="#ef4444" stroke-width="2.2"/>`);
      case 'sign': return up(`<line x1="0" y1="10" x2="0" y2="-48" stroke="#78350f" stroke-width="3"/><rect x="-30" y="-82" width="60" height="36" rx="3" fill="#fef3c7" stroke-width="2.4"/>`);
      case 'balloon': return up(`<path d="M0,0 q-6,-20 0,-40 q6,-12 0,-22" stroke-width="1.4"/><ellipse cx="0" cy="-76" rx="13" ry="16" fill="#ef4444" stroke-width="2"/><ellipse cx="-4" cy="-82" rx="3" ry="5" fill="#fca5a5" stroke="none"/>`);
      case 'torch': return up(`<path d="M-3,10 L-4,-22 L4,-22 L3,10 Z" fill="#78350f" stroke-width="2"/><path d="M-6,-22 Q-9,-34 0,-46 Q2,-36 6,-38 Q10,-30 6,-22 Z" fill="#fb923c" stroke="#ea580c" stroke-width="1.8"/>`);
      case 'magnifier': return along(`<line x1="0" y1="0" x2="0" y2="14" stroke="#78350f" stroke-width="3.2"/><circle cx="0" cy="23" r="9" fill="#bae6fd" stroke-width="2.6"/><path d="M-4,19 A6,6 0 0 1 2,17" stroke="${PAPER}" stroke-width="1.6"/>`);
      case 'flag': return up(`<line x1="0" y1="12" x2="0" y2="-70" stroke-width="2.6"/><path d="M0,-70 Q14,-76 28,-68 Q20,-60 28,-50 Q14,-56 0,-50 Z" fill="#3b82f6" stroke-width="2"/>`);
      case 'pan': return along(`<line x1="0" y1="0" x2="0" y2="18" stroke="#78350f" stroke-width="3.2"/><ellipse cx="0" cy="30" rx="11" ry="12" fill="#334155" stroke-width="2.2"/><ellipse cx="0" cy="30" rx="8" ry="9" fill="#475569" stroke="none"/>`);
      case 'ball': return up(`<circle cx="0" cy="-10" r="10" fill="#f97316" stroke-width="2"/><path d="M-10,-10 h20 M0,-20 v20" stroke-width="1.4"/>`);
      case 'letter': return up(`<rect x="-12" y="-12" width="24" height="16" rx="1.5" fill="${PAPER}" stroke-width="2"/><path d="M-12,-12 L0,-3 L12,-12" stroke-width="1.6"/>`);
      case 'paintbrush': return along(`<line x1="0" y1="0" x2="0" y2="24" stroke="#78350f" stroke-width="2.8"/><path d="M-2,24 L2,24 L3,31 Q0,35 -3,31 Z" fill="#ef4444" stroke-width="1.6"/>`);
      case 'trident': return up(`<line x1="0" y1="-82" x2="0" y2="62" stroke="#d97706" stroke-width="3"/><path d="M-10,-96 L-10,-80 Q0,-74 10,-80 L10,-96 M0,-102 L0,-77" stroke="#fbbf24" stroke-width="2.6"/>`);
      case 'scroll': return along(`<rect x="-4" y="-8" width="8" height="24" rx="3" fill="#fef3c7" stroke-width="2"/><line x1="-4" y1="4" x2="4" y2="4" stroke="#ef4444" stroke-width="2.6"/>`);
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
          const bx = Math.min(s.hip[0], s.neck[0]) - 26;
          [[-20, 0], [-5, 16], [10, 8], [25, 22], [-35, 12]].forEach(([dy, dl], i) => {
            const y = s.hip[1] - 10 + dy * 1.1;
            out += `<line x1="${f(bx - dl)}" y1="${f(y)}" x2="${f(bx - 38 - dl - i * 4)}" y2="${f(y)}" stroke-width="2.2"/>`;
          });
          break;
        }
        case 'sweat':
          [[r + 7, -r * 0.2, 0.9], [r + 2, -r - 2, 0.75], [-r - 6, -r * 0.4, 0.7]].forEach(([dx, dy, k]) => {
            out += `<path transform="translate(${f(hx + dx)},${f(hy + dy)}) scale(${k})" d="M0,-6 Q5,2 0,5 Q-5,2 0,-6 Z" fill="#60a5fa" stroke="#2563eb" stroke-width="1.4"/>`;
          });
          break;
        case 'anger': {
          const x = hx + r + 8, y = hy - r - 4;
          out += `<g transform="translate(${f(x)},${f(y)})" stroke="#dc2626" stroke-width="2.6"><path d="M-7,-2 q5,0 5,-5 M2,-7 q0,5 5,5 M7,2 q-5,0 -5,5 M-2,7 q0,-5 -5,-5"/></g>`;
          break;
        }
        case 'steam':
          [hx - r - 14, hx + r + 14].forEach(x => {
            const y = hy - r - 6;
            out += `<path d="M${f(x)},${f(y)} q-6,-2 -4,-8 q2,-6 8,-4 q4,-6 10,-1 q5,4 0,9 q-2,6 -8,4 q-6,3 -6,0 z" fill="${PAPER}" stroke-width="2"/>`;
          });
          break;
        case 'shock':
          [-55, -20, 20, 55].forEach(ang => {
            const a = rad(ang);
            out += `<line x1="${f(hx + Math.sin(a) * (r + 8))}" y1="${f(hy - Math.cos(a) * (r + 8))}" x2="${f(hx + Math.sin(a) * (r + 18))}" y2="${f(hy - Math.cos(a) * (r + 18))}" stroke-width="2.4"/>`;
          });
          break;
        case 'question': out += txt(hx + r + 10, hy - r - 6, '?', 20, '#6366f1', 10); break;
        case 'exclaim': out += txt(hx + r + 10, hy - r - 6, '!?', 20, '#ef4444', 8); break;
        case 'love':
          [[hx - r - 10, hy - r - 2, 0.9], [hx + r + 11, hy - r - 10, 1.1], [hx + 2, hy - r - 18, 0.7]].forEach(([x, y, k]) => {
            out += `<path transform="translate(${f(x)},${f(y)}) scale(${k})" d="M0,4 l-5,-5 a3,3 0 0 1 5,-4 a3,3 0 0 1 5,4 z" fill="#f43f5e" stroke="#e11d48" stroke-width="1"/>`;
          });
          break;
        case 'zzz':
          out += txt(hx + r + 8, hy - r - 2, 'z', 13, stroke, -8) + txt(hx + r + 18, hy - r - 13, 'Z', 17, stroke, -6) + txt(hx + r + 30, hy - r - 26, 'Z', 22, stroke, -4);
          break;
        case 'sparkle':
          [[hx - r - 10, hy - r, 0.9], [hx + r + 12, hy - r - 6, 1.1], [hx - r - 14, hy + 8, 0.7]].forEach(([x, y, k]) => {
            out += `<path transform="translate(${f(x)},${f(y)}) scale(${k})" d="M0,-9 L2.2,-2.2 L9,0 L2.2,2.2 L0,9 L-2.2,2.2 L-9,0 L-2.2,-2.2 Z" fill="#facc15" stroke="#ca8a04" stroke-width="1"/>`;
          });
          break;
        case 'dizzy': {
          const y = hy - r - 12;
          out += `<ellipse cx="${f(hx)}" cy="${f(y)}" rx="18" ry="5" stroke-width="1.4" stroke-dasharray="3 3"/>`;
          [-16, 0, 16].forEach(dx => {
            out += `<path transform="translate(${f(hx + dx)},${f(y + (dx === 0 ? -4 : 3))}) scale(0.5)" d="M0,-8 l2.4,5 5.6,.8 -4,3.9 1,5.5 -5,-2.6 -5,2.6 1,-5.5 -4,-3.9 5.6,-.8z" fill="#facc15" stroke-width="1.4"/>`;
          });
          break;
        }
        case 'bulb': {
          const x = hx + r + 12, y = hy - r - 16;
          out += `<path d="M${f(x - 4)},${f(y + 8)} q-4,-5 -4,-9 a8,8 0 1 1 16,0 q0,4 -4,9 z" fill="#fef08a" stroke-width="2"/><rect x="${f(x - 3)}" y="${f(y + 8)}" width="6" height="4" fill="#cbd5e1" stroke-width="1.6"/>`
            + `<line x1="${f(x)}" y1="${f(y - 12)}" x2="${f(x)}" y2="${f(y - 17)}" stroke="#eab308" stroke-width="1.8"/><line x1="${f(x - 11)}" y1="${f(y - 5)}" x2="${f(x - 15)}" y2="${f(y - 8)}" stroke="#eab308" stroke-width="1.8"/><line x1="${f(x + 11)}" y1="${f(y - 5)}" x2="${f(x + 15)}" y2="${f(y - 8)}" stroke="#eab308" stroke-width="1.8"/>`;
          break;
        }
      }
    }
    return out;
  }

  // ---------------------------------------------------------------- main character renderer
  function drawFigure(it) {
    const ch = CHARACTERS[it.char] || CHARACTERS.maya;
    const pose = POSES[it.pose] || POSES.stand;
    const L = PROPORTIONS[ch.prop];
    const s = skeleton(pose, L);
    const stroke = it.color || '#1d1d1d';
    const lw = Math.max(1.8, (it.lw || 4) * 0.55);
    const topCol = it.cloth || ch.top;
    const pantsCol = ch.pants || '#334155';
    const skinCol = ch.skin || SKIN;
    const hairCol = it.hairColor || ch.hairCol || '#2d231e';
    const side = pose.view === 'side';
    const r = L.head;
    const [hx, hy] = s.headC;
    let back = '', body = '', front = '', head = '', over = '';

    const tdir = a => vec(180 - s.lean, a);
    const perp = a => vec(90 - s.lean, a);

    // --- Back gear: wings, cape, backpack, jetpack
    if (ch.wings === 'angel') {
      const sh = s.shoulder;
      const wSide = (d) => `<path d="M${P(sh)} Q${f(sh[0] + d * 26)},${f(sh[1] - 30)} ${f(sh[0] + d * 40)},${f(sh[1] - 8)} Q${f(sh[0] + d * 36)},${f(sh[1] + 12)} ${f(sh[0] + d * 22)},${f(sh[1] + 14)} Q${f(sh[0] + d * 26)},${f(sh[1] + 20)} ${f(sh[0] + d * 14)},${f(sh[1] + 20)} Q${f(sh[0] + d * 8)},${f(sh[1] + 14)} ${P(sh)} Z" fill="#f8fafc" stroke-width="${lw}"/>`;
      back += side ? wSide(-1) : (wSide(-1) + wSide(1));
    }
    if (ch.cape) {
      const top = s.shoulder;
      const bl = [s.hip[0] - 32 + s.lean * 0.4, Math.max(s.ll.f[1], s.rl.f[1]) - 6];
      const br = [s.hip[0] + 28 + s.lean * 0.6, bl[1] + 2];
      back += `<path d="M${P(add(top, perp(-10)))} Q${P([bl[0] + 6, (top[1] + bl[1]) / 2])} ${P(bl)} Q${P([(bl[0] + br[0]) / 2, bl[1] + 7])} ${P(br)} Q${P([br[0] - 8, (top[1] + br[1]) / 2])} ${P(add(top, perp(10)))} Z" fill="${ch.cape}" stroke-width="${lw}"/>`;
    }
    if (ch.backpack || ch.jetpack) {
      const p = add(s.shoulder, perp(side ? -11 : 0));
      if (side) {
        back += `<rect x="${f(p[0] - 8)}" y="${f(p[1] + 2)}" width="14" height="28" rx="4" fill="${ch.jetpack ? '#94a3b8' : '#d97706'}" stroke-width="${lw}"/>`;
        if (ch.jetpack) back += `<path d="M${f(p[0] - 5)},${f(p[1] + 30)} l3,9 l4,-9 z" fill="#f97316" stroke="none"/>`;
      }
    }

    // --- Volumetric Legs + Boots/Shoes
    const shoe = (leg, dir) => {
      const d = side ? 1 : dir;
      const [fx, fy] = leg.f;
      return `<path d="M${f(fx - d * 3)},${f(fy - 5)} L${f(fx + d * 9)},${f(fy - 3)} Q${f(fx + d * 12)},${f(fy)} ${f(fx + d * 10)},${f(fy + 3)} L${f(fx - d * 4)},${f(fy + 3)} Z" fill="${ch.shoes}" stroke="${stroke}" stroke-width="${lw}"/>`;
    };
    const drawLeg = (leg, dir) => {
      let sLeg = limbSeg(s.hip, leg.k, 5.5, 4.4, pantsCol, stroke, lw)
               + limbSeg(leg.k, leg.f, 4.3, 3.4, pantsCol, stroke, lw);
      if (ch.style === 'plate') {
        sLeg += `<circle cx="${f(leg.k[0])}" cy="${f(leg.k[1])}" r="4.5" fill="#e2e8f0" stroke="${stroke}" stroke-width="1.6"/>`;
      }
      return sLeg + shoe(leg, dir);
    };
    body += drawLeg(s.ll, -1) + drawLeg(s.rl, 1);

    // --- Volumetric Torso & Layered Outfit
    const a = add(s.neck, tdir(-3)), b = add(s.hip, tdir(2));
    const wTop = ch.prop === 'kid' ? 10 : 12;
    const wBot = ch.prop === 'kid' ? 9 : 10.5;
    if (ch.style === 'mage' || ch.style === 'royal') {
      const g = Math.max(s.ll.f[1], s.rl.f[1]) - 3;
      const spread = Math.max(20, Math.abs(s.ll.f[0] - s.rl.f[0]) / 2 + 12);
      const cxr = (s.ll.f[0] + s.rl.f[0]) / 2;
      body += `<path d="M${P(add(a, perp(-wTop)))} L${f(cxr - spread)},${f(g)} Q${f(cxr)},${f(g + 6)} ${f(cxr + spread)},${f(g)} L${P(add(a, perp(wTop)))} Z" fill="${topCol}" stroke-width="${lw}"/>`;
      body += `<path d="M${P(a)} L${f(cxr)},${f(g + 3)}" stroke="#fbbf24" stroke-width="2" opacity="0.8"/>`;
    } else {
      body += `<path d="M${P(add(a, perp(-wTop)))} L${P(add(a, perp(wTop)))} L${P(add(b, perp(wBot)))} L${P(add(b, perp(-wBot)))} Z" fill="${topCol}" stroke-width="${lw}"/>`;
    }

    // Outfit details
    if (ch.style === 'hoodie') {
      const c = add(a, tdir(-8));
      body += `<path d="M${P(add(a, perp(-7)))} Q${P(c)} ${P(add(a, perp(7)))}" stroke-width="1.8"/><rect x="${f(b[0] - 7)}" y="${f(b[1] - 12)}" width="14" height="9" rx="2" fill="rgba(255,255,255,0.18)" stroke-width="1.4"/>`;
    }
    if (ch.style === 'suit' || ch.style === 'trench') {
      body += `<path d="M${P(add(a, perp(-5)))} L${P(add(a, tdir(-18)))} L${P(add(a, perp(5)))} Z" fill="${PAPER}" stroke-width="1.4"/>`;
      if (ch.tie) body += `<path d="M${P(add(a, tdir(-4)))} L${P(add(a, tdir(-22)))} L${P(add(a, tdir(-26)))} L${P(add(a, tdir(-22)))}" stroke="${ch.tie}" stroke-width="3.2"/>`;
    }
    if (ch.style === 'overalls') {
      const m = add(a, tdir(-14));
      body += `<path d="M${P(add(m, perp(-8)))} L${P(add(m, perp(8)))} L${P(add(b, perp(wBot)))} L${P(add(b, perp(-wBot)))} Z" fill="${pantsCol}" stroke-width="1.6"/>`
        + `<line x1="${f(add(a, perp(-5))[0])}" y1="${f(add(a, perp(-5))[1])}" x2="${f(add(m, perp(-5))[0])}" y2="${f(add(m, perp(-5))[1])}" stroke="${pantsCol}" stroke-width="3"/>`
        + `<line x1="${f(add(a, perp(5))[0])}" y1="${f(add(a, perp(5))[1])}" x2="${f(add(m, perp(5))[0])}" y2="${f(add(m, perp(5))[1])}" stroke="${pantsCol}" stroke-width="3"/>`;
    }
    if (ch.style === 'jacket' || ch.style === 'leather' || ch.style === 'tech') {
      body += `<line x1="${f(a[0])}" y1="${f(a[1] - 2)}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${ch.accent || '#cbd5e1'}" stroke-width="2"/>`;
    }
    if (ch.style === 'apron') {
      const m = add(a, tdir(-10));
      body += `<path d="M${P(add(m, perp(-7)))} L${P(add(m, perp(7)))} L${P(add(b, perp(9)))} L${P(add(b, perp(-9)))} Z" fill="${ch.accent || '#15803d'}" stroke-width="1.6"/>`;
    }
    if (ch.style === 'plate' || ch.style === 'cyber' || ch.style === 'spacesuit') {
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      body += `<rect x="${f(mid[0] - 6)}" y="${f(mid[1] - 6)}" width="12" height="10" rx="2" fill="${ch.accent || '#94a3b8'}" stroke-width="1.5"/>`;
    }
    if (ch.stethoscope) {
      const m = add(a, tdir(-6));
      body += `<path d="M${P(add(m, perp(-6)))} Q${P(add(m, tdir(-16)))} ${P(add(m, perp(6)))}" stroke="#1e293b" stroke-width="2"/><circle cx="${f(m[0] + 6)}" cy="${f(m[1] + 10)}" r="3" fill="#cbd5e1" stroke-width="1.4"/>`;
    }
    if (ch.scarf) {
      body += `<path d="M${P(add(s.neck, perp(-9)))} Q${P(add(s.neck, [0, 5]))} ${P(add(s.neck, perp(9)))}" stroke="${ch.scarf}" stroke-width="6"/>`;
    }
    // Belt
    if (!ch.style.match(/mage|royal|overalls/)) {
      body += `<line x1="${f(add(b, perp(-wBot))[0])}" y1="${f(add(b, perp(-wBot))[1])}" x2="${f(add(b, perp(wBot))[0])}" y2="${f(add(b, perp(wBot))[1])}" stroke="#1e293b" stroke-width="3.4"/>`;
    }

    // --- Left hand item (behind)
    const hL = it.handL !== undefined ? it.handL : (ch.handL || 'none');
    const hR = it.handR !== undefined ? it.handR : (ch.handR || 'none');
    if (hL && hL !== 'none' && hL !== 'shield') back += handItem(hL, s.la, stroke);

    // --- Volumetric Arms + Hands
    const sleeveCol = (ch.style === 'tee' || ch.style === 'overalls') ? skinCol : topCol;
    const drawArm = (arm) => {
      const seg1 = limbSeg(s.shoulder, arm.e, 4.4, 3.8, topCol, stroke, lw);
      const seg2 = limbSeg(arm.e, arm.h, 3.6, 3.0, sleeveCol, stroke, lw);
      const handCol = (ch.style === 'plate' || ch.style === 'spacesuit' || ch.robot) ? '#cbd5e1' : skinCol;
      const handCircle = `<circle cx="${f(arm.h[0])}" cy="${f(arm.h[1])}" r="3.6" fill="${handCol}" stroke="${stroke}" stroke-width="${lw}"/>`;
      return seg1 + seg2 + handCircle;
    };
    front += drawArm(s.la) + drawArm(s.ra);
    if (hR && hR !== 'none' && hR !== 'shield') front += handItem(hR, s.ra, stroke);
    if (hL === 'shield') front += handItem('shield', s.la, stroke);
    if (hR === 'shield') front += handItem('shield', s.ra, stroke);

    // --- Neck & Head
    head += limbSeg(s.neck, [hx, hy + r * 0.6], 4, 4, skinCol, stroke, lw);
    if (ch.hair === 'long' || ch.hair === 'wavy') {
      head += `<path d="M${f(hx - r - 3)},${f(hy - 2)} Q${f(hx - r - 7)},${f(hy + r + 14)} ${f(hx - r + 2)},${f(hy + r + 18)} L${f(hx + r - 2)},${f(hy + r + 18)} Q${f(hx + r + 7)},${f(hy + r + 14)} ${f(hx + r + 3)},${f(hy - 2)} Z" fill="${hairCol}" stroke-width="${lw}"/>`;
    }
    if (ch.hair === 'bob') {
      head += `<path d="M${f(hx - r - 3)},${f(hy - 2)} Q${f(hx - r - 5)},${f(hy + r + 3)} ${f(hx - r + 2)},${f(hy + r + 5)} L${f(hx + r - 2)},${f(hy + r + 5)} Q${f(hx + r + 5)},${f(hy + r + 3)} ${f(hx + r + 3)},${f(hy - 2)} Z" fill="${hairCol}" stroke-width="${lw}"/>`;
    }
    // Ears
    if (!side) {
      head += `<circle cx="${f(hx - r + 1)}" cy="${f(hy + 1)}" r="3.5" fill="${SKIN_SHADE}" stroke="${stroke}" stroke-width="1.4"/>`
            + `<circle cx="${f(hx + r - 1)}" cy="${f(hy + 1)}" r="3.5" fill="${SKIN_SHADE}" stroke="${stroke}" stroke-width="1.4"/>`;
    }

    if (ch.robot) {
      head += `<rect x="${f(hx - r)}" y="${f(hy - r)}" width="${f(2 * r)}" height="${f(2 * r)}" rx="6" fill="${skinCol}" stroke-width="${lw * 1.2}"/>`
            + `<line x1="${f(hx)}" y1="${f(hy - r)}" x2="${f(hx)}" y2="${f(hy - r - 8)}" stroke-width="2.2"/><circle cx="${f(hx)}" cy="${f(hy - r - 10)}" r="3" fill="${ch.accent || '#38bdf8'}" stroke-width="1.5"/>`;
    } else {
      head += `<circle cx="${f(hx)}" cy="${f(hy)}" r="${r}" fill="${skinCol}" stroke-width="${lw * 1.2}"/>`;
    }

    // Ninja mask
    if (ch.hat === 'ninja') {
      head += `<path d="M${f(hx - r)},${f(hy - 5)} A${r},${r} 0 0 1 ${f(hx + r)},${f(hy - 5)} Z" fill="#1e293b" stroke-width="1.8"/>`
            + `<path d="M${f(hx - r)},${f(hy + 1)} A${r},${r} 0 0 0 ${f(hx + r)},${f(hy + 1)} Z" fill="#1e293b" stroke-width="1.8"/>`
            + `<path d="M${f(hx - r - 1)},${f(hy - 6)} l-10,-3 m10,5 l-9,3" stroke="#ef4444" stroke-width="2.4"/>`;
    }

    // Face
    head += face(it.expr || 'happy', s.headC, r, side, stroke, ch);

    // Glasses / Visor / Shades / Eyepatch
    const fx = hx + (side ? r * 0.28 : 0), fy = hy - r * 0.14;
    if (ch.glasses) {
      head += `<circle cx="${f(fx - r * 0.36)}" cy="${f(fy)}" r="5" fill="none" stroke="#1e293b" stroke-width="1.6"/>`
            + `<circle cx="${f(fx + r * 0.36)}" cy="${f(fy)}" r="5" fill="none" stroke="#1e293b" stroke-width="1.6"/>`
            + `<line x1="${f(fx - 1.5)}" y1="${f(fy)}" x2="${f(fx + 1.5)}" y2="${f(fy)}" stroke="#1e293b" stroke-width="1.6"/>`;
    }
    if (ch.visor) {
      head += `<rect x="${f(fx - r * 0.72)}" y="${f(fy - 4)}" width="${f(r * 1.44)}" height="8" rx="3" fill="${ch.visor}" fill-opacity="0.82" stroke="#0f172a" stroke-width="1.5"/>`;
    }
    if (ch.shades) {
      head += `<path d="M${f(fx - r * 0.7)},${f(fy - 3)} h${f(r * 1.4)} v2 q-1,5 -5,5 h-3 q-2,0 -3,-3 h-2 q-1,3 -3,3 h-3 q-4,0 -5,-5 z" fill="#0f172a" stroke-width="1.2"/>`;
    }
    if (ch.patch) {
      head += `<line x1="${f(hx - r + 2)}" y1="${f(hy - 9)}" x2="${f(hx + r - 1)}" y2="${f(hy - 3)}" stroke-width="1.6"/><ellipse cx="${f(fx + r * 0.36)}" cy="${f(fy)}" rx="4.5" ry="4" fill="#0f172a"/>`;
    }

    // Hair styles (front)
    if (ch.hair === 'spiky') {
      head += `<path d="M${f(hx - r)},${f(hy - 4)} L${f(hx - r - 2)},${f(hy - r - 2)} L${f(hx - 6)},${f(hy - r - 6)} L${f(hx - 2)},${f(hy - r - 2)} L${f(hx + 3)},${f(hy - r - 8)} L${f(hx + 8)},${f(hy - r - 2)} L${f(hx + r + 2)},${f(hy - r)} L${f(hx + r)},${f(hy - 4)} Q${f(hx)},${f(hy - r + 5)} ${f(hx - r)},${f(hy - 4)} Z" fill="${hairCol}" stroke-width="1.8"/>`;
    } else if (ch.hair === 'parted' || ch.hair === 'slick') {
      head += `<path d="M${f(hx - r)},${f(hy - 3)} Q${f(hx - r + 2)},${f(hy - r - 6)} ${f(hx + 2)},${f(hy - r - 2)} Q${f(hx + r - 2)},${f(hy - r - 5)} ${f(hx + r)},${f(hy - 3)} Q${f(hx + 4)},${f(hy - r + 5)} ${f(hx - r)},${f(hy - 3)} Z" fill="${hairCol}" stroke-width="1.8"/>`;
    } else if (ch.hair === 'curly') {
      head += `<path d="M${f(hx - r)},${f(hy - 3)} q-2,-9 6,-10 q4,-8 12,-4 q8,-4 10,4 q8,2 6,10 q-6,-4 -16,-3 q-10,-1 -18,3 Z" fill="${hairCol}" stroke-width="1.8"/>`;
    } else if (ch.hair === 'bob' || ch.hair === 'long' || ch.hair === 'wavy' || ch.hair === 'ponytail') {
      head += `<path d="M${f(hx - r)},${f(hy - 3)} Q${f(hx - r + 2)},${f(hy - r - 5)} ${f(hx)},${f(hy - r - 1)} Q${f(hx + r - 2)},${f(hy - r - 5)} ${f(hx + r)},${f(hy - 3)} Q${f(hx + 5)},${f(hy - r + 6)} ${f(hx - r)},${f(hy - 3)} Z" fill="${hairCol}" stroke-width="1.8"/>`;
      if (ch.hair === 'ponytail') head += `<path d="M${f(hx - r + 1)},${f(hy - 4)} q-12,0 -11,16 q6,-4 9,-9" fill="${hairCol}" stroke-width="1.8"/>`;
    } else if (ch.hair === 'buns') {
      head += `<circle cx="${f(hx - r + 2)}" cy="${f(hy - r + 2)}" r="6.5" fill="${hairCol}" stroke-width="1.8"/><circle cx="${f(hx + r - 2)}" cy="${f(hy - r + 2)}" r="6.5" fill="${hairCol}" stroke-width="1.8"/>`
            + `<path d="M${f(hx - r)},${f(hy - 3)} Q${f(hx)},${f(hy - r - 3)} ${f(hx + r)},${f(hy - 3)} Q${f(hx)},${f(hy - r + 6)} ${f(hx - r)},${f(hy - 3)} Z" fill="${hairCol}" stroke-width="1.8"/>`;
    } else if (ch.hair === 'mohawk') {
      head += `<path d="M${f(hx - 4)},${f(hy - r + 2)} L${f(hx - 6)},${f(hy - r - 12)} L${f(hx)},${f(hy - r - 8)} L${f(hx + 5)},${f(hy - r - 13)} L${f(hx + 4)},${f(hy - r + 2)} Z" fill="${hairCol}" stroke-width="1.8"/>`;
    } else if (ch.hair === 'rock') {
      head += `<path d="M${f(hx - r - 2)},${f(hy)} L${f(hx - r - 4)},${f(hy - r - 4)} L${f(hx - 2)},${f(hy - r - 9)} L${f(hx + 8)},${f(hy - r - 6)} L${f(hx + r + 3)},${f(hy - 2)} Q${f(hx)},${f(hy - r + 5)} ${f(hx - r - 2)},${f(hy)} Z" fill="${hairCol}" stroke-width="1.8"/>`;
    }

    // Facial hair
    if (ch.mustache) {
      head += `<path d="M${f(fx)},${f(hy + r * 0.16)} q-5,-4 -10,-1 q-3,2 -2,-2 q4,3 12,1 q8,2 12,-1 q1,4 -2,2 q-5,-3 -10,1 z" fill="${hairCol}" stroke-width="1.1"/>`;
    }
    if (ch.beard === 'trim') {
      head += `<path d="M${f(hx - r + 2)},${f(hy + 3)} Q${f(hx - r + 4)},${f(hy + r + 6)} ${f(hx + 2)},${f(hy + r + 5)} Q${f(hx + r)},${f(hy + r + 3)} ${f(hx + r - 1)},${f(hy + 3)} Q${f(hx)},${f(hy + r - 2)} ${f(hx - r + 2)},${f(hy + 3)} Z" fill="${hairCol}" stroke-width="1.6"/>`;
    }
    if (ch.beard === 'long') {
      head += `<path d="M${f(hx - r + 3)},${f(hy + 4)} Q${f(hx - 8)},${f(hy + r + 30)} ${f(hx + 4)},${f(hy + r + 38)} Q${f(hx + 4)},${f(hy + r + 20)} ${f(hx + r - 2)},${f(hy + 4)} Q${f(hx)},${f(hy + r - 2)} ${f(hx - r + 3)},${f(hy + 4)} Z" fill="${hairCol}" stroke-width="2"/>`;
    }

    // Hats & Helmets
    const hatT = `translate(${f(hx)},${f(hy)}) rotate(${f(s.lean * 0.4)})`;
    const hat = inner => `<g transform="${hatT}">${inner}</g>`;
    switch (ch.hat) {
      case 'cap': over += hat(`<path d="M-15,-${r - 4} A15,15 0 0 1 15,-${r - 4} Z" fill="${topCol}" stroke-width="2"/><path d="M-2,-${r - 4} Q12,-${r - 7} 23,-${r - 2}" stroke-width="3"/>`); break;
      case 'beanie': over += hat(`<path d="M-15,-${r - 5} A15,16 0 0 1 15,-${r - 5} Z" fill="#15803d" stroke-width="2"/><rect x="-16" y="-${r - 1}" width="32" height="6" rx="3" fill="#166534" stroke-width="1.8"/>`); break;
      case 'crown': over += hat(`<path d="M-13,-${r - 4} L-15,-${r + 14} L-7,-${r + 5} L0,-${r + 16} L7,-${r + 5} L15,-${r + 14} L13,-${r - 4} Z" fill="#fbbf24" stroke-width="2"/><circle cx="0" cy="-${r + 1}" r="2.2" fill="#ef4444" stroke-width="1"/>`); break;
      case 'wizard': over += hat(`<path d="M-26,-${r - 4} Q0,-${r + 2} 26,-${r - 4}" stroke-width="3"/><path d="M-15,-${r - 2} Q-4,-${r + 26} 4,-${r + 46} Q14,-${r + 50} 18,-${r + 40} Q10,-${r + 36} 15,-${r - 2} Z" fill="${topCol}" stroke-width="2.2"/><path transform="translate(1,-${r + 16}) scale(0.6)" d="M0,-8 l2.4,5 5.6,.8 -4,3.9 1,5.5 -5,-2.6 -5,2.6 1,-5.5 -4,-3.9 5.6,-.8z" fill="#fbbf24" stroke-width="2"/>`); break;
      case 'chef': over += hat(`<path d="M-12,-${r - 3} L-12,-${r + 8} Q-22,-${r + 14} -14,-${r + 22} Q-8,-${r + 32} 0,-${r + 25} Q8,-${r + 32} 14,-${r + 22} Q22,-${r + 14} 12,-${r + 8} L12,-${r - 3} Z" fill="${PAPER}" stroke-width="2"/>`); break;
      case 'pirate': over += hat(`<path d="M-26,-${r - 6} Q-20,-${r + 20} 0,-${r + 12} Q20,-${r + 20} 26,-${r - 6} Q0,-${r + 2} -26,-${r - 6} Z" fill="#1e293b" stroke-width="2.2"/><circle cx="0" cy="-${r + 2}" r="3" fill="${PAPER}" stroke="none"/>`); break;
      case 'helmet': over += hat(`<path d="M-${r + 2},4 Q-${r + 3},-${r + 4} 0,-${r + 3} Q${r + 3},-${r + 4} ${r + 2},4 L${r + 2},-3 L-${r + 2},-3 Z" fill="#cbd5e1" stroke-width="2.2"/><rect x="-${r + 2}" y="-3" width="${2 * r + 4}" height="${f(r * 0.45)}" fill="#0f172a"/><path d="M0,-${r + 3} Q-10,-${r + 18} -22,-${r + 10} Q-12,-${r + 12} -8,-${r + 2}" fill="#2563eb" stroke-width="1.8"/>`); break;
      case 'valkyrie': over += hat(`<path d="M-${r + 1},-${r - 4} Q0,-${r + 8} ${r + 1},-${r - 4} Z" fill="#e2e8f0" stroke-width="2"/><path d="M-${r},-${r - 2} Q-${r + 14},-${r + 16} -${r + 8},-${r + 22} Q-${r + 2},-${r + 10} -${r - 3},-${r - 2} Z" fill="#f8fafc" stroke-width="1.6"/><path d="M${r},-${r - 2} Q${r + 14},-${r + 16} ${r + 8},-${r + 22} Q${r + 2},-${r + 10} ${r - 3},-${r - 2} Z" fill="#f8fafc" stroke-width="1.6"/>`); break;
      case 'astro': over += hat(`<circle cx="0" cy="0" r="${r + 7}" fill="#bae6fd" fill-opacity="0.28" stroke="#64748b" stroke-width="2.4"/><path d="M-${r + 1},-${r - 2} Q-${r - 3},-${r + 3} -${r - 7},-${r + 1}" stroke="${PAPER}" stroke-width="2"/>`); break;
      case 'safari': over += hat(`<path d="M-24,-${r - 3} Q0,-${r - 6} 24,-${r - 3}" stroke-width="3"/><path d="M-13,-${r - 3} Q-12,-${r + 14} 0,-${r + 14} Q12,-${r + 14} 13,-${r - 3} Z" fill="#d6b88d" stroke-width="2"/>`); break;
      case 'deerstalker': over += hat(`<path d="M-16,-${r - 4} Q-14,-${r + 14} 0,-${r + 14} Q14,-${r + 14} 16,-${r - 4} Z" fill="#a0826d" stroke-width="2"/><path d="M-22,-${r - 3} Q-14,-${r - 7} -10,-${r - 4} M10,-${r - 4} Q14,-${r - 7} 22,-${r - 3}" stroke-width="2.6"/>`); break;
      case 'halo': over += hat(`<ellipse cx="0" cy="-${r + 11}" rx="13" ry="4" fill="none" stroke="#facc15" stroke-width="2.8"/>`); break;
    }

    const fxList = (it.fx || []).slice();
    const fxSvg = effects(fxList, s, r, stroke, it.flipX);

    const scale = ch.scale || 1;
    const inner = back + body + front + head + over + fxSvg;
    return `<g transform="translate(${NW / 2},${GROUND}) scale(${scale})" fill="none" stroke="${stroke}" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;
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
