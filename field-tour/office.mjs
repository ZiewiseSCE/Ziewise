// Local station coordinates: Y is up; the open side faces +Z.
const libraries = new WeakMap();
const PI = Math.PI;
const ink = '#132d2c';
const muted = '#546a63';
const cream = '#f2eddb';
const lime = '#c5e963';
const font = '"Malgun Gothic","Noto Sans KR",Arial,sans-serif';
const digits = '"Arial","Malgun Gothic",sans-serif';

function canvas(width, height, draw) {
  let surface;
  if (typeof document !== 'undefined') {
    surface = document.createElement('canvas');
    surface.width = width;
    surface.height = height;
  } else if (typeof OffscreenCanvas !== 'undefined') {
    surface = new OffscreenCanvas(width, height);
  } else {
    return null;
  }
  const ctx = surface.getContext('2d');
  if (!ctx) return null;
  draw(ctx, width, height);
  return surface;
}

function swatch(T, surface) {
  if (!surface) return null;
  const map = new T.CanvasTexture(surface);
  map.colorSpace = T.SRGBColorSpace;
  map.anisotropy = 4;
  return map;
}

function library(T) {
  if (libraries.has(T)) return libraries.get(T);
  const make = (color, roughness, metalness = 0) =>
    new T.MeshStandardMaterial({ color, roughness, metalness });
  const grain = swatch(T, canvas(256, 128, (c, w, h) => {
    const background = c.createLinearGradient(0, 0, 0, h);
    background.addColorStop(0, '#bf9365');
    background.addColorStop(.56, '#d0a477');
    background.addColorStop(1, '#bc9060');
    c.fillStyle = background;
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 155; i++) {
      const y = i * .87;
      c.beginPath();
      c.moveTo(0, y);
      for (let x = 0; x <= w; x += 8) {
        c.lineTo(x, y + .73 * Math.sin(x * .025 + i * .29) + .55 * Math.sin(x * .046 + i * .12));
      }
      c.strokeStyle = i % 7 === 0 ? 'rgba(93,53,29,.19)' : 'rgba(240,206,151,.18)';
      c.lineWidth = i % 7 === 0 ? .8 : .45;
      c.stroke();
    }
  }));
  const M = {
    oak: new T.MeshStandardMaterial({ color: grain ? 0xffffff : 0xc5a078, map: grain, roughness: .52 }),
    walnut: make(0x795239, .54), slate: make(0x283235, .55, .22), dark: make(0x233233, .45),
    teal: make(0x335b55, .62), deep: make(0x193b3a, .48), fabric: make(0x697971, .91),
    cream: make(0xe7e2d0, .64), paper: make(0xf6efda, .85), kraft: make(0xc99f75, .72),
    silver: make(0xaeb7b4, .29, .63), steel: make(0x6f7d7d, .38, .48),
    brass: make(0xb89960, .32, .60), rubber: make(0x22292a, .87),
    white: make(0xe6ece9, .38, .18), red: make(0xa86251, .5), softGreen: make(0xa3b79b, .72),
    marker: new T.MeshStandardMaterial({ color: 0xc9e77d, emissive: 0x516522, emissiveIntensity: .22, roughness: .47 }),
    lens: make(0x102c31, .13, .46),
    glass: new T.MeshStandardMaterial({
      color: 0xb4d7d0, roughness: .12, metalness: .16, transparent: true, opacity: .22, depthWrite: false,
    }),
  };
  const kit = { M, geo: new Map(), printed: new Map() };
  libraries.set(T, kit);
  return kit;
}

function eased(progress, start, end) {
  const f = Math.max(0, Math.min(1, (progress - start) / (end - start)));
  return f * f * (3 - 2 * f);
}

function label(c, text, x, y, size, color = ink, weight = 600, family = font) {
  c.fillStyle = color;
  c.font = String(weight) + ' ' + size + 'px ' + family;
  c.textBaseline = 'alphabetic';
  c.fillText(text, x, y);
}

function rule(c, x, y, width, color = '#bdc6b5', height = 2) {
  c.fillStyle = color;
  c.fillRect(x, y, width, height);
}

function noteSurface(title, rows, tag, dark = false) {
  return (c, w, h) => {
    const bg = dark ? '#25413f' : cream, fg = dark ? '#f2f1de' : ink;
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);
    rule(c, 0, 0, w, dark ? '#a8c6a0' : '#54766d', Math.max(4, h * .020));
    const margin = w * .082;
    if (tag) label(c, tag, margin, h * .17, Math.round(Math.min(w * .050, h * .085)), dark ? lime : muted, 700);
    label(c, title, margin, h * .36, Math.round(Math.min(w * .115, h * .16)), fg, 750);
    rule(c, margin, h * .425, w - 2 * margin, dark ? '#68847a' : '#a5b0a1');
    rows.forEach((item, index) => {
      const y = h * (.57 + index * (.36 / Math.max(1, rows.length - 1)));
      label(c, item, margin, y, Math.round(Math.min(w * .063, h * .071)), fg, index === 0 ? 650 : 520);
    });
  };
}

function makeStation(T, id) {
  const { M, geo, printed } = library(T);
  const group = new T.Group();
  group.name = 'office-' + id;
  const changes = [];

  function cached(key, build) {
    if (!geo.has(key)) geo.set(key, build());
    return geo.get(key);
  }
  function mesh(parent, geometry, mat, x, y, z) {
    const item = new T.Mesh(geometry, mat);
    item.position.set(x, y, z);
    item.castShadow = !mat.transparent;
    item.receiveShadow = !mat.transparent;
    parent.add(item);
    return item;
  }
  function frame(parent, x = 0, y = 0, z = 0) {
    const item = new T.Group();
    item.position.set(x, y, z);
    parent.add(item);
    return item;
  }
  function box(parent, x, y, z, w, h, d, mat) {
    const item = mesh(parent, cached('unit-box', () => new T.BoxGeometry(1, 1, 1)), mat, x, y, z);
    item.scale.set(w, h, d);
    return item;
  }
  function cylinder(parent, x, y, z, rx, h, rz, mat, sides = 28) {
    const geom = cached('cyl' + sides, () => new T.CylinderGeometry(1, 1, 1, sides));
    const item = mesh(parent, geom, mat, x, y, z);
    item.scale.set(rx, h, rz);
    return item;
  }
  function rod(parent, a, b, radius, mat, sides = 12) {
    const d = new T.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const item = cylinder(parent, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2,
      radius, d.length(), radius, mat, sides);
    item.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
    return item;
  }
  function roundedGeometry(w, h, depth, radius) {
    const key = ['rnd', w, h, depth, radius].join('/');
    return cached(key, () => {
      const bevel = Math.min(.012, depth * .18, radius * .25);
      const x = w / 2 - bevel, y = h / 2 - bevel;
      const r = Math.min(x, y, radius), shape = new T.Shape();
      shape.moveTo(-x + r, -y);
      shape.lineTo(x - r, -y); shape.quadraticCurveTo(x, -y, x, -y + r);
      shape.lineTo(x, y - r); shape.quadraticCurveTo(x, y, x - r, y);
      shape.lineTo(-x + r, y); shape.quadraticCurveTo(-x, y, -x, y - r);
      shape.lineTo(-x, -y + r); shape.quadraticCurveTo(-x, -y, -x + r, -y);
      const thickness = depth - 2 * bevel;
      const shapeGeo = new T.ExtrudeGeometry(shape, {
        depth: thickness, steps: 1, curveSegments: 3, bevelEnabled: true, bevelSegments: 2,
        bevelSize: bevel, bevelThickness: bevel,
      });
      shapeGeo.translate(0, 0, -thickness / 2);
      return shapeGeo;
    });
  }
  function rounded(parent, x, y, z, w, h, d, radius, mat) {
    return mesh(parent, roundedGeometry(w, h, d, radius), mat, x, y, z);
  }
  function slab(parent, x, y, z, w, h, d, radius, mat) {
    const item = rounded(parent, x, y, z, w, d, h, radius, mat);
    item.rotation.x = -PI / 2;
    return item;
  }
  function print(key, w, h, draw, lit = false) {
    const name = key + (lit ? '/screen' : '/print');
    if (!printed.has(name)) {
      const map = swatch(T, canvas(w, h, draw));
      const mat = lit
        ? new T.MeshBasicMaterial({ color: map ? 0xffffff : 0x315553, map, toneMapped: false })
        : new T.MeshStandardMaterial({ color: map ? 0xffffff : 0xe1d9bd, map, roughness: .78, metalness: .015 });
      printed.set(name, mat);
    }
    return printed.get(name);
  }
  function face(parent, x, y, z, w, h, mat) {
    const item = mesh(parent, cached('unit-plane', () => new T.PlaneGeometry(1, 1)), mat, x, y, z);
    item.scale.set(w, h, 1);
    item.castShadow = false;
    return item;
  }
  function tabletopFace(parent, x, y, z, w, d, mat) {
    const item = face(parent, x, y, z, w, d, mat);
    item.rotation.x = -PI / 2;
    return item;
  }
  function textCard(key, title, rows, tag, dark = false, lit = false, width = 512, height = 448) {
    return print(key, width, height, noteSurface(title, rows, tag, dark), lit);
  }
  function dynamic(item, apply) {
    item.traverse(child => { child.userData.dynamic = true; });
    changes.push(apply);
    return item;
  }
  function stateScreen(item, late, threshold) {
    const early = item.material;
    dynamic(item, p => { item.material = p < threshold ? early : late; });
  }
  function terminal(parent, x, surface, z, w, h, material, tilt = -.09) {
    const stand = frame(parent, x, surface, z);
    slab(stand, 0, .018, .02, w * .41, .036, .24, .044, M.slate);
    box(stand, 0, .15, -.025, .10, .27, .087, M.steel);
    const housing = frame(stand, 0, .18 + h / 2, -.014);
    housing.rotation.x = tilt;
    rounded(housing, 0, 0, 0, w, h, .062, .036, M.slate);
    const screen = face(housing, 0, 0, .032, w * .951, h * .898, material);
    return { stand, screen };
  }
  function documentSheet(parent, x, y, z, w, d, material, yaw = 0) {
    const bundle = frame(parent, x, y, z);
    bundle.rotation.y = yaw;
    slab(bundle, 0, .006, 0, w, .012, d, .012, M.paper);
    tabletopFace(bundle, 0, .0125, 0, w * .985, d * .985, material);
    return bundle;
  }
  function table(parent, x, z, w, d, height, top = M.oak, legs = M.slate) {
    slab(parent, x, height - .034, z, w, .068, d, .048, top);
    box(parent, x, height - .094, z - d * .28, w - .17, .08, .054, legs);
    for (const side of [-1, 1]) {
      const lx = x + side * (w / 2 - .12);
      box(parent, lx, height / 2 - .025, z - d * .32, .065, height - .066, .065, legs);
      box(parent, lx, height / 2 - .025, z + d * .32, .065, height - .066, .065, legs);
      box(parent, lx, .13, z, .048, .035, d * .71, legs);
    }
  }
  function pencil(parent, x, y, z, length, yaw = 0) {
    const a = [x - Math.cos(yaw) * length / 2, y, z + Math.sin(yaw) * length / 2];
    const b = [x + Math.cos(yaw) * length / 2, y, z - Math.sin(yaw) * length / 2];
    rod(parent, a, b, .009, M.brass, 8);
    rod(parent, b, [b[0] + Math.cos(yaw) * .024, y, b[2] - Math.sin(yaw) * .024], .005, M.slate, 8);
  }
  function rail(parent, x, y, z, width) {
    box(parent, x, y, z, width, .035, .044, M.brass);
  }
  function marker(parent, x, y, z, threshold) {
    const rim = cylinder(parent, x, y, z, .049, .016, .049, M.brass, 20);
    rim.rotation.x = PI / 2;
    const light = cylinder(parent, x, y, z + .009, .032, .017, .032, M.lens, 20);
    light.rotation.x = PI / 2;
    stateScreen(light, M.marker, threshold);
  }
  function finish(anchors) {
    const update = (p, time) => {
      const progress = Math.max(0, Math.min(1, Number.isFinite(p) ? p : 0));
      for (const change of changes) change(progress, time);
    };
    update(0, 0);
    return { group, anchors: anchors.map(a => new T.Vector3(...a)), update };
  }
  return { T, M, group, frame, box, rounded, slab, cylinder, rod, mesh, cached, print, face,
    tabletopFace, textCard, terminal, documentSheet, pencil, table, rail, marker, dynamic, stateScreen, finish };
}

function archive(s) {
  const { M, group: g, frame, box, rounded, slab, rod, cylinder, face, terminal, textCard, print, pencil, dynamic, stateScreen } = s;
  // Heavy bookcase with full-depth, individually bound folders and brass index rails.
  const shelving = frame(g, -1.26, 0, -.93);
  box(shelving, 0, 1.32, -.35, 1.10, 2.57, .045, M.deep);
  for (const side of [-1, 1]) box(shelving, side * .56, 1.31, -.035, .064, 2.62, .67, M.oak);
  for (const y of [.13, .71, 1.30, 1.89, 2.53]) {
    box(shelving, 0, y, -.03, 1.12, .054, .68, M.oak);
    box(shelving, 0, y + .005, .316, 1.08, .020, .012, M.brass);
  }
  const indexNames = ['품질', '공정', '설비', '안전'];
  const colors = [M.teal, M.cream, M.softGreen, M.walnut, M.slate];
  for (let row = 0; row < 4; row++) {
    for (let book = 0; book < 5; book++) {
      const x = -.390 + book * .166;
      const spine = frame(shelving, x, .164 + row * .589, .058);
      spine.rotation.z = book === 4 ? -.076 : 0;
      const h = .385 + ((book + row * 2) % 3) * .030;
      box(spine, 0, h / 2, 0, .135, h, .39, colors[(row + book) % colors.length]);
      box(spine, 0, h * .74, .198, .101, .068, .007, M.paper);
      box(spine, 0, h * .69, .204, .062, .006, .004, M.steel);
      if (book % 2 === 0) {
        const hole = cylinder(spine, 0, .088, .201, .022, .007, .022, M.brass, 14);
        hole.rotation.x = PI / 2;
      }
    }
    const strip = print('archive-index-' + row, 240, 52, (c, w, h) => {
      c.fillStyle = '#c1aa79'; c.fillRect(0, 0, w, h);
      label(c, indexNames[row] + ' 기록', 20, 38, 28);
    });
    face(shelving, .21, .139 + row * .589, .323, .262, .057, strip);
  }
  s.table(g, .35, -.23, 1.53, .90, .835, M.oak);
  const query = textCard('archive-question', '설비 점검 절차', ['열람 권한 확인', '현행 절차서 · 설비팀'], 'ZiewLLM   /   사내 문서', true, true, 640, 400);
  const answer = textCard('archive-result', '점검 전 확인 사항', ['근거   설비 점검 절차서', '개정 03   ·   12쪽'], 'ZiewLLM   /   검색 결과', true, true, 640, 400);
  const display = terminal(g, .26, .835, -.40, 1.13, .65, query).screen;
  stateScreen(display, answer, .43);
  s.documentSheet(g, .09, .841, .05, .39, .21,
    textCard('archive-request', '현장 문의', ['설비 점검 절차'], '설비팀', false, false), -.06);
  pencil(g, .57, .864, .10, .27, .08);
  // Source manual is a physical, inclined open folio held under a brass task lamp.
  const lectern = frame(g, 1.31, 0, -.03);
  slab(lectern, 0, .055, -.10, .79, .10, .66, .04, M.deep);
  box(lectern, 0, .51, -.18, .16, .91, .17, M.steel);
  const rest = frame(lectern, 0, 1.05, -.06);
  rest.rotation.x = -.98;
  rounded(rest, 0, 0, 0, .93, .68, .060, .035, M.walnut);
  const left = frame(rest, -.208, 0, .043), right = frame(rest, .208, 0, .043);
  left.rotation.y = -.055; right.rotation.y = .055;
  for (const [page, title, rows, id] of [
    [left, '점검 절차', ['01  이력 확인', '02  운전 상태', '03  점검 기록'], 'l'],
    [right, '점검 전 확인', ['압력 변화', '최근 정비 이력', '담당자 서명'], 'r'],
  ]) {
    rounded(page, 0, 0, 0, .411, .56, .035, .012, M.paper);
    face(page, 0, 0, .018, .40, .54, textCard('archive-book-' + id, title, rows, id === 'l' ? '설비 절차서' : '개정 03  ·  12쪽', false, false, 362, 488));
  }
  const tab = box(right, .179, -.08, .021, .046, .17, .006, M.marker);
  dynamic(tab, p => { tab.scale.y = .17 * (.08 + .92 * eased(p, .43, .65)); });
  rod(lectern, [.39, .64, -.17], [.39, 1.68, -.17], .016, M.brass);
  rod(lectern, [.39, 1.68, -.17], [.05, 1.68, -.10], .016, M.brass);
  slab(lectern, -.015, 1.656, -.10, .24, .032, .067, .025, M.brass);
  s.marker(lectern, .005, .95, .264, .79);
  return s.finish([[-1.30, 1.59, -.65], [.26, 1.39, -.31], [1.34, 1.06, .20]]);
}

function onboarding(s) {
  const { M, group: g, frame, box, rounded, slab, rod, face, textCard, print, dynamic, stateScreen } = s;
  // A reception counter, badge fitting rail, self-service reader and first-day dispatch board.
  rounded(g, -.82, .51, .10, 1.84, 1.02, .72, .09, M.teal);
  slab(g, -.82, 1.036, .085, 1.94, .08, .86, .11, M.oak);
  for (let n = 0; n < 13; n++) box(g, -1.63 + n * .135, .5, .474, .032, .76, .020, M.deep);
  s.rail(g, -.82, .905, .482, 1.68);
  const tray = frame(g, -1.12, 1.085, .035);
  slab(tray, 0, .018, 0, .72, .036, .51, .045, M.kraft);
  for (const side of [-1, 1]) box(tray, side * .345, .058, 0, .023, .082, .49, M.kraft);
  box(tray, 0, .057, -.242, .70, .084, .018, M.kraft);
  const pack = textCard('hr-kit', '입사 서류', ['배정 부서', '서류 목록'], '온보딩', false, false, 280, 348);
  s.documentSheet(tray, -.11, .044, .018, .31, .38, pack, .06);
  slab(tray, .205, .056, .04, .14, .038, .21, .019, M.dark);
  s.tabletopFace(tray, .205, .079, .04, .123, .18,
    textCard('hr-kit-id', 'ID', ['임시 출입증'], '방문 등록', true, false, 170, 248));
  // Clipped lanyards sit proud of the backboard and cast independent shadows.
  const badges = frame(g, -1.22, 1.08, -.65);
  box(badges, 0, .58, -.089, .93, .94, .016, M.glass);
  for (const x of [-.47, .47]) {
    rod(badges, [x, -1.035, 0], [x, .97, 0], .018, M.brass);
    slab(badges, x, -1.057, 0, .162, .046, .238, .027, M.walnut);
    rod(badges, [x, .91, 0], [x, .91, -.092], .011, M.brass);
  }
  rod(badges, [-.49, .96, 0], [.49, .96, 0], .022, M.brass);
  for (let i = 0; i < 3; i++) {
    const x = -.29 + i * .29;
    rod(badges, [x - .059, .95, 0], [x, .60, .02], .012, i === 1 ? M.walnut : M.teal);
    rod(badges, [x + .059, .95, 0], [x, .60, .02], .012, i === 1 ? M.walnut : M.teal);
    box(badges, x, .58, .023, .06, .047, .027, M.brass);
    rounded(badges, x, .46, .017, .18, .22, .022, .014, i === 1 ? M.kraft : M.cream);
    face(badges, x, .46, .029, .157, .184, textCard('hr-id-' + i, ['ID', '사원증', '방문증'][i], ['출입 관리'], 'ACCESS', false, false, 180, 225));
  }
  const kiosk = frame(g, .095, 0, -.52);
  slab(kiosk, 0, .041, 0, .64, .08, .49, .09, M.slate);
  rounded(kiosk, 0, .79, -.02, .41, 1.49, .22, .067, M.cream);
  const top = frame(kiosk, 0, 1.57, .015);
  top.rotation.x = -.17;
  rounded(top, 0, 0, 0, .60, .78, .08, .055, M.slate);
  const screen = face(top, 0, 0, .042, .546, .69,
    textCard('hr-policy-in', '입사 서류', ['직무·부서 확인', '현재 권한 확인'], '사내 LLM', true, true, 420, 500));
  stateScreen(screen, textCard('hr-policy-out', '인사 규정 대조', ['확인할 항목 표시', '인사팀 검토 요청'], '사내 LLM', true, true, 420, 500), .39);
  box(kiosk, 0, 1.049, .11, .23, .026, .025, M.lens);
  const board = frame(g, 1.27, 0, -.68);
  for (const x of [-.49, .49]) {
    box(board, x, 1.16, -.07, .060, 2.30, .075, M.oak);
    slab(board, x, .026, -.07, .17, .052, .33, .034, M.walnut);
  }
  rounded(board, 0, 1.47, 0, 1.15, 1.35, .079, .042, M.oak);
  const surface = print('hr-board', 515, 610, (c, w, h) => {
    c.fillStyle = '#e1dfc9'; c.fillRect(0, 0, w, h);
    label(c, '첫 출근 업무', 38, 88, 52); rule(c, 39, 114, w - 78, '#7a8e7a', 3);
    label(c, '인사팀 승인', 42, 184, 30, muted); label(c, '업무 등록', 42, 385, 30, muted);
  });
  face(board, 0, 1.47, .041, 1.08, 1.27, surface);
  for (const y of [1.61, 1.16]) s.rail(board, .02, y, .072, .92);
  const tasks = frame(board, .08, 1.70, .092);
  rounded(tasks, 0, 0, 0, .74, .218, .026, .025, M.paper);
  const card = print('hr-registered-task', 460, 142, (c, w, h) => {
    c.fillStyle = '#fbf5df'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#55796c'; c.fillRect(0, 0, 16, h);
    label(c, '계정 발급 요청', 38, 61, 37); label(c, '첫 출근 업무', 39, 107, 24, muted);
  });
  face(tasks, 0, 0, .014, .718, .204, card);
  dynamic(tasks, p => { tasks.position.y = 1.70 - .45 * eased(p, .73, .91); });
  s.marker(board, .441, 1.14, .090, .74);
  return s.finish([[-1.19, 1.50, -.56], [.10, 1.59, -.43], [1.32, 1.32, -.53]]);
}

function accounts(s) {
  const { M, group: g, frame, box, rounded, slab, cylinder, face, print, textCard, dynamic, stateScreen } = s;
  // The paper trail proceeds left to right across a continuous records counter.
  s.table(g, 0, -.24, 3.62, 1.02, .89, M.cream, M.steel);
  box(g, -1.22, .49, -.49, .73, .69, .49, M.deep);
  for (const y of [.32, .64]) {
    rounded(g, -1.22, y, -.235, .67, .267, .031, .016, M.teal);
    box(g, -1.22, y + .032, -.207, .22, .018, .028, M.brass);
  }
  const invoice = print('finance-invoice', 458, 590, (c, w, h) => {
    c.fillStyle = '#fcf3de'; c.fillRect(0, 0, w, h);
    label(c, '구매 청구서', 34, 81, 51); label(c, '거래처   세광 부품', 35, 144, 28, muted);
    rule(c, 34, 170, w - 68, '#93a49b', 2);
    for (const [i, a] of ['부품 공급', '공급가액', '세액'].entries()) {
      label(c, a, 35, 235 + i * 56, 25);
      rule(c, 200, 232 + i * 56, 196, '#bac1ac', 3);
    }
    rule(c, 33, 389, w - 66, '#738f83', 2);
    label(c, '합계', 35, 450, 28); label(c, '₩ 128,000', 121, 455, 43, ink, 700, digits);
  });
  const receipt = print('finance-receipt', 234, 483, (c, w, h) => {
    c.fillStyle = '#f5f0d7'; c.fillRect(0, 0, w, h);
    label(c, '영수증', 22, 62, 35);
    for (let i = 0; i < 6; i++) rule(c, 21, 100 + i * 38, i % 3 === 0 ? 140 : 182, '#758477', 2);
    label(c, '128,000', 21, 398, 37, ink, 700, digits);
    for (let i = 0; i < 26; i++) rule(c, 22 + i * 7, 422, i % 3 === 0 ? 4 : 2, '#45594f', 32);
  });
  const clip = frame(g, -1.17, 1.26, -.315);
  clip.rotation.x = -.33; clip.rotation.y = .07;
  rounded(clip, 0, 0, 0, .68, .79, .035, .035, M.kraft);
  face(clip, -.035, -.025, .019, .53, .68, invoice);
  box(clip, -.02, .337, .034, .23, .074, .034, M.steel);
  const small = frame(clip, .22, -.082, .048);
  small.rotation.z = -.12;
  rounded(small, 0, 0, 0, .20, .44, .009, .006, M.paper);
  face(small, 0, 0, .006, .194, .434, receipt);
  s.documentSheet(g, -1.32, .895, .061, .23, .36, receipt, -.13);
  // Hinged flatbed lid, dark glass platen, moving optical carriage and sheet.
  const scan = frame(g, -.12, .90, -.11);
  slab(scan, 0, .083, 0, 1.03, .164, .67, .074, M.deep);
  slab(scan, 0, .175, 0, .92, .048, .55, .044, M.silver);
  slab(scan, 0, .202, -.017, .82, .014, .45, .018, M.lens);
  s.documentSheet(scan, .02, .207, -.009, .49, .36, invoice, -.026);
  const front = frame(scan, 0, .27, -.296);
  front.rotation.x = -.21;
  rounded(front, 0, .226, 0, .965, .49, .063, .054, M.slate);
  rounded(front, 0, .226, .038, .849, .39, .016, .035, M.paper);
  for (const x of [-.356, .356]) {
    const hinge = cylinder(scan, x, .225, -.282, .030, .11, .030, M.steel);
    hinge.rotation.z = PI / 2;
  }
  const carriage = box(scan, 0, .227, -.18, .74, .006, .018, M.marker);
  dynamic(carriage, p => {
    carriage.position.z = -.18 + .34 * eased(p, .26, .61);
    carriage.visible = p >= .24 && p < .68;
  });
  const posted = textCard('finance-posted', '전표 초안', ['합계  ₩128,000', '증빙 연결 완료'], 'ERP   /   재무 담당 승인', true, true, 535, 350);
  const review = textCard('finance-review', '증빙 대조', ['거래처  세광 부품', '원문 금액 확인'], 'ERP   /   검토함', true, true, 535, 350);
  const terminal = s.terminal(g, 1.18, .89, -.34, .91, .59, review);
  stateScreen(terminal.screen, posted, .77);
  const docket = frame(g, 1.19, .901, .031);
  slab(docket, 0, .023, 0, .64, .046, .32, .038, M.walnut);
  for (const x of [-.30, .30]) box(docket, x, .070, 0, .021, .085, .305, M.brass);
  s.documentSheet(docket, -.025, .048, 0, .41, .25, invoice, .035);
  return s.finish([[-1.19, 1.28, -.22], [-.12, 1.13, .08], [1.18, 1.36, -.27]]);
}

function sourcing(s) {
  const { M, group: g, frame, box, rounded, slab, cylinder, rod, face, textCard, print, dynamic, stateScreen } = s;
  const common = frame(g, 0, 0, -.20);
  s.table(common, .02, -.10, 3.49, 1.00, .87, M.oak, M.deep);
  // Quotes occupy separate angled pockets; a physical materials rack gives context.
  const materialRack = frame(common, -1.16, 1.59, -.89);
  for (const x of [-.416, .416]) {
    box(materialRack, x, -.795, -.033, .065, 1.59, .087, M.walnut);
    slab(materialRack, x, -1.564, -.033, .173, .052, .304, .036, M.slate);
  }
  rounded(materialRack, 0, 0, 0, 1.17, 1.37, .076, .040, M.teal);
  const rackFace = print('purchase-rack', 480, 550, (c, w, h) => {
    c.fillStyle = '#385951'; c.fillRect(0, 0, w, h);
    for (let x = 27; x < w; x += 33) for (let y = 31; y < h; y += 33) {
      c.fillStyle = '#213e39'; c.beginPath(); c.arc(x, y, 3, 0, PI * 2); c.fill();
    }
    c.fillStyle = '#d4c9a0'; c.fillRect(25, 26, 185, 50);
    label(c, '자재 견본', 41, 62, 28, ink);
  });
  face(materialRack, 0, 0, .039, 1.13, 1.32, rackFace);
  for (const [i, mat] of [M.silver, M.brass, M.steel].entries()) {
    const x = -.36 + i * .36;
    box(materialRack, x, -.13, .14, .275, .033, .19, M.walnut);
    if (i === 0) {
      const disk = cylinder(materialRack, x, .110, .125, .134, .086, .134, mat);
      disk.rotation.x = PI / 2;
      const core = cylinder(materialRack, x, .110, .17, .047, .011, .047, M.dark);
      core.rotation.x = PI / 2;
    } else if (i === 1) {
      const plate = rounded(materialRack, x, .074, .105, .197, .32, .048, .027, mat);
      plate.rotation.z = -.10;
    } else {
      box(materialRack, x, .059, .14, .17, .27, .12, mat);
      for (const off of [-.057, .06]) rod(materialRack, [x + off, -.05, .206], [x + off, .15, .206], .013, M.silver);
    }
  }
  const quoteColors = ['#5a7668', '#a47b43', '#606f72'];
  for (let i = 0; i < 3; i++) {
    const material = print('procurement-sheet-' + i, 272, 372, (c, w, h) => {
      c.fillStyle = '#faf3dd'; c.fillRect(0, 0, w, h);
      rule(c, 0, 0, w, quoteColors[i], 18);
      label(c, ['견적 A', '견적 B', '견적 C'][i], 22, 77, 38);
      ['규격', '납기', '결제 조건'].forEach((t, a) => {
        label(c, t, 23, 143 + a * 59, 22, muted); rule(c, 23, 155 + a * 59, w - 46);
      });
    });
    const folder = frame(common, -1.53 + i * .305, 1.145, .034 + i * .015);
    folder.rotation.x = -.29; folder.rotation.z = -.045 + i * .027;
    rounded(folder, 0, 0, 0, .304, .45, .027, .016, M.kraft);
    face(folder, 0, 0, .015, .285, .424, material);
    box(folder, 0, .197, .023, .086, .021, .014, M.brass);
  }
  const comparison = frame(common, .22, 1.59, -.70);
  for (const x of [-.47, .47]) {
    rod(comparison, [x, -.71, .16], [x, .38, -.05], .028, M.brass);
    slab(comparison, x, -.704, .16, .137, .032, .130, .024, M.slate);
  }
  rounded(comparison, 0, 0, 0, 1.38, .89, .067, .043, M.slate);
  function quotes(active) {
    return print('procurement-comparison-' + active, 700, 444, (c, w, h) => {
      c.fillStyle = '#e9e8d7'; c.fillRect(0, 0, w, h);
      label(c, '견적 비교', 37, 70, 47);
      label(c, '304 계열  /  예시 자재', 345, 62, 22, muted);
      rule(c, 36, 94, w - 72, '#8a9d8d');
      const xs = [45, 169, 311, 447, 558];
      ['공급사', '규격', '단가', '납기', '결제'].forEach((v, i) => label(c, v, xs[i], 148, 25, muted));
      [['A', '304', '1,280', '5일', '익월'], ['B', '304', '1,350', '3일', '익월'], ['C', '316', '1,480', '7일', '선금']].forEach((row, j) => {
        const y = 211 + j * 72;
        if (active && j === 1) {
          c.fillStyle = '#c5d29f'; c.fillRect(31, y - 40, w - 62, 57);
          c.fillStyle = '#51765e'; c.fillRect(31, y - 40, 7, 57);
        }
        row.forEach((v, i) => label(c, v, xs[i], y, i ? 26 : 31, ink, i ? 520 : 720));
        rule(c, 36, y + 24, w - 72, '#b5bfac', 1);
      });
    }, true);
  }
  const screen = face(comparison, 0, 0, .035, 1.315, .822, quotes(false));
  stateScreen(screen, quotes(true), .54);
  const printer = frame(common, 1.36, .88, -.12);
  slab(printer, 0, .12, 0, .67, .24, .53, .072, M.cream);
  slab(printer, 0, .24, -.022, .60, .055, .45, .056, M.deep);
  box(printer, 0, .14, .27, .49, .056, .010, M.rubber);
  box(printer, 0, .106, .30, .49, .024, .132, M.steel);
  const order = frame(printer, 0, .139, .24);
  s.documentSheet(order, 0, 0, .098, .36, .22, textCard('procurement-order', '발주서', ['ERP 등록'], '구매 승인', false, false, 310, 198));
  dynamic(order, p => {
    const f = eased(p, .74, .95);
    order.visible = f > .01;
    order.position.z = .20 + .12 * f;
    order.scale.z = .14 + .86 * f;
  });
  const orderTag = textCard('procurement-erp-flag', '발주 승인', ['ERP 등록 이력'], '구매 담당', false, false, 340, 255);
  slab(common, 1.35, .889, -.49, .24, .038, .168, .026, M.deep);
  rod(common, [1.35, .902, -.49], [1.35, 1.54, -.61], .019, M.brass);
  const ticket = frame(common, 1.35, 1.49, -.60);
  ticket.rotation.x = -.09;
  rounded(ticket, 0, 0, 0, .61, .45, .028, .025, M.kraft);
  face(ticket, 0, 0, .015, .582, .42, orderTag);
  return s.finish([[-1.22, 1.18, -.09], [.22, 1.61, -.84], [1.34, 1.13, .13]]);
}

function customers(s) {
  const { M, group: g, frame, box, rounded, slab, cylinder, rod, face, print, textCard, dynamic, stateScreen } = s;
  // A conversation setting with an oval pedestal table, two upholstered guest chairs
  // and a glazed partition. The outlook board is separate from the meeting laptop.
  const glazing = frame(g, -.09, 0, -1.23);
  box(glazing, 0, 1.24, 0, 3.55, 2.43, .031, M.glass);
  for (const x of [-1.73, -.47, .88, 1.73]) box(glazing, x, 1.25, 0, .036, 2.5, .058, M.steel);
  for (const y of [.09, .92, 2.45]) box(glazing, 0, y, 0, 3.50, .028, .060, y === .92 ? M.brass : M.slate);
  for (let i = 0; i < 6; i++) box(glazing, -1.66 + i * .104, 1.23, .055, .044, 2.40, .045, M.oak);
  slab(g, -.53, .010, .01, 2.36, .020, 1.48, .21, M.fabric);
  const table = frame(g, -.47, 0, .14);
  cylinder(table, 0, .051, 0, .442, .075, .31, M.slate, 44);
  cylinder(table, 0, .404, 0, .132, .674, .12, M.walnut, 32);
  cylinder(table, 0, .746, 0, .493, .047, .27, M.slate, 44);
  cylinder(table, 0, .801, 0, 1.055, .081, .54, M.oak, 60);
  function chair(x, z, yaw) {
    const seat = frame(g, x, 0, z); seat.rotation.y = yaw;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      rod(seat, [sx * .225, .017, sz * .196], [sx * .169, .438, sz * .134], .021, M.walnut);
    }
    slab(seat, 0, .465, 0, .50, .078, .43, .115, M.teal);
    const back = frame(seat, 0, .668, -.172); back.rotation.x = -.15;
    rounded(back, 0, 0, 0, .503, .338, .081, .095, M.fabric);
    for (const sx of [-1, 1]) {
      rod(seat, [sx * .235, .455, -.10], [sx * .236, .61, .10], .014, M.brass);
      slab(seat, sx * .236, .615, .06, .051, .03, .215, .014, M.walnut);
    }
  }
  chair(-1.50, -.20, 1.13);
  chair(.180, -.51, -.58);
  const notes = textCard('sales-notes', '미팅 메모', ['현장 요청 사항', '회신 예정일'], '상담 기록', false, false, 333, 416);
  const prices = textCard('sales-prices', '승인 가격표', ['기준 단가', '할인 승인 조건'], '영업 기준', false, false, 330, 400);
  const folio = frame(table, -.465, .844, .045);
  folio.rotation.y = -.21;
  slab(folio, 0, .013, .01, .53, .026, .37, .031, M.walnut);
  s.documentSheet(folio, -.122, .03, .012, .227, .33, notes);
  s.documentSheet(folio, .118, .03, .012, .227, .33, prices);
  s.pencil(table, -.50, .858, .335, .248, -.13);
  const laptop = frame(table, .423, .846, .058);
  laptop.rotation.y = -.095;
  slab(laptop, 0, .025, .018, .66, .045, .42, .041, M.silver);
  const keyboard = print('sales-keyboard', 380, 174, (c, w, h) => {
    c.fillStyle = '#778581'; c.fillRect(0, 0, w, h);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 12; i++) {
      c.fillStyle = '#31413e'; c.fillRect(13 + i * 30 + (j % 2) * 3, 11 + j * 23, 24, 17);
    }
    c.strokeStyle = '#9faea9'; c.strokeRect(135, 113, 110, 48);
  });
  s.tabletopFace(laptop, 0, .049, .012, .577, .315, keyboard);
  const lid = frame(laptop, 0, .048, -.164);
  lid.rotation.x = -.21;
  rounded(lid, 0, .190, 0, .657, .38, .028, .029, M.slate);
  const screen = face(lid, 0, .190, .016, .616, .337,
    textCard('sales-input', '상담 자료', ['미팅 메모 + 승인 가격표'], '사내 LLM', true, true, 440, 245));
  stateScreen(screen, textCard('sales-quote', '견적 초안', ['할인 조건 검토', '회신 일정 확인'], '영업 담당', true, true, 440, 245), .37);
  // The CRM wall leaf has one continuous pipeline and a movable dated follow-up card.
  const crm = frame(g, 1.30, 0, -.90);
  box(crm, 0, 1.12, -.06, .11, 2.24, .106, M.walnut);
  slab(crm, 0, .037, -.12, .68, .074, .60, .087, M.slate);
  rounded(crm, 0, 1.47, 0, .99, 1.15, .068, .062, M.walnut);
  const faceMat = print('sales-crm', 515, 572, (c, w, h) => {
    c.fillStyle = '#dddccd'; c.fillRect(0, 0, w, h);
    label(c, 'CRM', 38, 86, 59, ink, 700, digits);
    label(c, '고객 상담 이력', 43, 139, 31, muted);
    rule(c, 39, 170, w - 78, '#859789');
    rule(c, 76, 217, 3, '#849987', 227);
    for (const [j, name] of ['미팅 기록', '견적 검토', '후속 연락'].entries()) {
      c.fillStyle = j < 2 ? '#517767' : '#a8b4a0'; c.beginPath(); c.arc(77, 228 + j * 99, 10, 0, PI * 2); c.fill();
      label(c, name, 110, 239 + j * 99, 32, ink, j === 2 ? 700 : 540);
    }
  });
  face(crm, 0, 1.47, .037, .923, 1.085, faceMat);
  const stamp = frame(crm, .203, 1.158, .056);
  rounded(stamp, 0, 0, 0, .360, .112, .019, .025, M.softGreen);
  const stampPrint = print('sales-task-tag', 266, 73, (c, w, h) => {
    c.fillStyle = '#b4cb9b'; c.fillRect(0, 0, w, h); label(c, '일정 등록', 28, 53, 39);
  });
  face(stamp, 0, 0, .011, .34, .098, stampPrint);
  dynamic(stamp, p => {
    const f = eased(p, .72, .89);
    stamp.visible = f > .01; stamp.position.x = .295 - .092 * f;
  });
  return s.finish([[-.93, .902, .26], [-.04, 1.09, .01], [1.33, 1.45, -.82]]);
}

function valueRoom(s) {
  const { M, group: g, frame, box, rounded, slab, face, rod, print, textCard, dynamic, stateScreen } = s;
  const board = frame(g, 0, 0, -.74);
  slab(board, 0, .043, -.12, 3.52, .086, .54, .061, M.deep);
  for (const x of [-1.48, 1.48]) {
    box(board, x, 1.15, -.12, .089, 2.27, .102, M.steel);
    rod(board, [x, .09, .12], [x, .85, -.135], .026, M.brass);
  }
  rounded(board, 0, 1.48, -.065, 3.54, 1.35, .126, .082, M.slate);
  rounded(board, -1.155, 1.48, .008, 1.034, 1.18, .023, .034, M.deep);
  rounded(board, .21, 1.48, .008, 1.57, 1.18, .023, .034, M.deep);
  rounded(board, 1.355, 1.48, .008, .635, 1.18, .023, .034, M.teal);
  const input = print('roi-input-dials', 428, 522, (c, w, h) => {
    c.fillStyle = '#254342'; c.fillRect(0, 0, w, h);
    label(c, '월 처리 건수', 33, 62, 32, '#e2e4cd'); rule(c, 32, 85, w - 64, '#6e8980');
    label(c, '2,000', 28, 173, 83, '#f6f1db', 700, digits); label(c, '건 / 월', 34, 214, 24, '#afc4b3');
    rule(c, 32, 257, w - 64, '#6e8980'); label(c, '건당 절약 시간', 33, 321, 30, '#e2e4cd');
    label(c, '8', 31, 424, 88, '#f6f1db', 700, digits); label(c, '분', 102, 422, 36, '#d2dfc1');
    label(c, '12분 → 4분', 34, 484, 30, '#b6c9b6');
  }, true);
  face(board, -1.155, 1.48, .022, .99, 1.13, input);
  const output = print('roi-capacity', 650, 504, (c, w, h) => {
    c.fillStyle = '#263d3b'; c.fillRect(0, 0, w, h);
    label(c, '예시로 계산한 업무 용량', 34, 68, 37, '#e2e7d0');
    label(c, '266.7', 28, 211, 126, '#e2ecbd', 700, digits);
    label(c, '시간 / 월', 380, 201, 36, '#c4d2bb');
    rule(c, 34, 242, w - 68, '#718477'); label(c, '연간 환산 가치', 34, 295, 25, '#c6d5be');
    label(c, '첫해 총비용', 34, 403, 25, '#c6d5be');
    label(c, '9,600만 원', 396, 292, 25, '#dbe4cf');
    label(c, '5,400만 원', 396, 400, 25, '#dbe4cf');
  }, true);
  face(board, .21, 1.48, .022, 1.51, 1.13, output);
  for (const [i, width] of [1.275, .717].entries()) {
    const x = -.438, y = i ? 1.031 : 1.272;
    box(board, x + .65, y, .035, 1.30, .050, .023, M.dark);
    const bar = box(board, x + .002, y, .062, .001, .043, .035, i ? M.brass : M.marker);
    dynamic(bar, p => {
      const w = width * (.001 + .999 * eased(p, i ? .37 : .22, i ? .64 : .50));
      bar.scale.x = w; bar.position.x = x + w / 2;
    });
  }
  function roiFace(reveal) {
    return print('roi-yield-' + reveal, 279, 514, (c, w, h) => {
      c.fillStyle = reveal ? '#c6d797' : '#34564d'; c.fillRect(0, 0, w, h);
      const fg = reveal ? ink : '#e1ecd4';
      label(c, '첫해', 25, 85, 34, fg); label(c, '투자수익률', 23, 138, 38, fg);
      rule(c, 24, 174, w - 48, reveal ? '#6f8769' : '#80988a');
      label(c, reveal ? '77.8' : '—', 18, 271, reveal ? 81 : 70, fg, 700, digits);
      label(c, '%', 28, 319, 40, fg, 600, digits);
      rule(c, 24, 369, w - 48, reveal ? '#6f8769' : '#80988a');
      label(c, reveal ? '순효익' : '비용 반영', 24, 416, 27, fg);
      if (reveal) label(c, '4,200만 원', 23, 467, 30, fg);
    }, true);
  }
  const roi = face(board, 1.355, 1.48, .022, .607, 1.13, roiFace(false));
  stateScreen(roi, roiFace(true), .59);
  // Actual expenditures are physically separated from the projected-capacity display.
  const ledger = frame(g, 1.16, 0, .08);
  slab(ledger, 0, .040, -.10, .74, .08, .51, .045, M.slate);
  box(ledger, 0, .43, -.154, .13, .82, .12, M.brass);
  const top = frame(ledger, 0, .885, -.008); top.rotation.x = -1.12;
  rounded(top, 0, 0, 0, .807, .56, .050, .039, M.oak);
  rounded(top, 0, 0, .033, .677, .431, .033, .019, M.paper);
  face(top, 0, 0, .051, .65, .408, textCard('roi-ledger', '실제 지출 기록', ['인건비  ·  외주비', '전후 지급액 확인'], '비용 장부', false, false, 430, 300));
  return s.finish([[-1.15, 1.53, -.68], [.18, 1.63, -.66], [1.33, 1.55, -.68]]);
}

function pilot(s) {
  const { T, M, group: g, frame, box, rounded, slab, cylinder, rod, mesh, cached, face, print, textCard, dynamic, stateScreen } = s;
  const table = frame(g, -.38, 0, -.15);
  slab(table, 0, .816, -.03, 2.75, .16, 1.05, .075, M.slate);
  slab(table, 0, .908, -.03, 2.70, .043, 1.01, .055, M.steel);
  for (const x of [-1.17, 1.17]) for (const z of [-.43, .31]) {
    box(table, x, .42, z, .118, .75, .118, M.steel);
    cylinder(table, x, .052, z, .094, .09, .094, M.rubber);
    cylinder(table, x, .68, z, .11, .07, .11, M.slate);
  }
  box(table, 0, .295, -.39, 2.44, .062, .074, M.steel);
  const fixture = print('poc-fixture', 640, 300, (c, w, h) => {
    c.fillStyle = '#717c77'; c.fillRect(0, 0, w, h);
    for (let x = 17; x < w; x += 30) for (let y = 16; y < h; y += 30) {
      c.fillStyle = '#a3ada2'; c.beginPath(); c.arc(x, y, 4.2, 0, PI * 2); c.fill();
      c.fillStyle = '#324442'; c.beginPath(); c.arc(x, y + .9, 2.7, 0, PI * 2); c.fill();
    }
  });
  s.tabletopFace(table, .08, .931, -.023, 2.45, .86, fixture);
  function flange(parent, x, y, z, radius) {
    const shape = cached('pilot-flange', () => {
      const outline = new T.Shape();
      outline.absarc(0, 0, 1, 0, PI * 2, false);
      function hole(cx, cy, r) {
        const cut = new T.Path(); cut.absarc(cx, cy, r, 0, PI * 2, true); outline.holes.push(cut);
      }
      hole(0, 0, .44);
      for (let n = 0; n < 6; n++) {
        const angle = n * PI / 3; hole(.744 * Math.cos(angle), .744 * Math.sin(angle), .109);
      }
      const geo = new T.ExtrudeGeometry(outline, {
        depth: .225, curveSegments: 13, bevelEnabled: true, bevelThickness: .012, bevelSize: .012, bevelSegments: 2, steps: 1,
      });
      geo.rotateX(-PI / 2);
      return geo;
    });
    const part = mesh(parent, shape, M.silver, x, y, z);
    part.scale.setScalar(radius);
    const top = y + radius * .242;
    for (const ringRadius of [.55, .91]) {
      const ring = mesh(parent, cached('pilot-machine-ring', () => new T.TorusGeometry(1, .009, 4, 60)),
        M.steel, x, top + .0007, z);
      ring.rotation.x = -PI / 2; ring.scale.setScalar(radius * ringRadius);
    }
    return top;
  }
  const tray = frame(table, -.878, .945, .015);
  slab(tray, 0, .021, 0, .72, .042, .65, .064, M.kraft);
  slab(tray, 0, .043, 0, .65, .017, .55, .043, M.rubber);
  flange(tray, -.095, .053, -.05, .199);
  const sampleTag = textCard('poc-sample-tag', '고객 샘플', ['플랜지  /  대조품'], '시범 공정', false, false, 250, 188);
  s.documentSheet(tray, .189, .056, .111, .20, .15, sampleTag, .11);
  const stage = frame(table, .29, .936, -.021);
  slab(stage, 0, .044, .04, .69, .088, .566, .052, M.deep);
  slab(stage, 0, .095, .04, .59, .032, .47, .035, M.steel);
  const top = flange(stage, -.04, .114, .015, .206);
  rod(stage, [.064, top + .002, -.011], [.106, top + .002, .040], .0024, M.dark, 5);
  rod(stage, [.106, top + .002, .040], [.125, top + .002, .055], .0021, M.dark, 5);
  // A rigid optical bridge holds a downward objective and a separate raking illuminator.
  const bridge = frame(table, .27, .936, -.145);
  for (const x of [-.399, .399]) {
    slab(bridge, x, .035, -.22, .215, .07, .28, .032, M.slate);
    box(bridge, x, .522, -.22, .112, 1.01, .126, M.white);
    box(bridge, x, .52, -.149, .038, .88, .021, M.steel);
  }
  rounded(bridge, 0, .962, -.203, .98, .18, .185, .039, M.white);
  box(bridge, -.015, .958, -.093, .752, .036, .030, M.dark);
  const head = frame(bridge, -.020, .86, -.02);
  box(head, 0, .05, -.015, .171, .17, .25, M.slate);
  rounded(head, 0, -.031, .119, .21, .208, .165, .038, M.deep);
  cylinder(head, 0, -.171, .125, .085, .142, .085, M.silver);
  cylinder(head, 0, -.247, .125, .10, .054, .10, M.rubber);
  cylinder(head, 0, -.28, .125, .077, .031, .077, M.lens);
  rod(bridge, [.38, .63, -.14], [.22, .53, .19], .025, M.steel);
  const light = frame(bridge, .22, .50, .19); light.rotation.z = -.58;
  cylinder(light, 0, 0, 0, .061, .148, .061, M.slate);
  cylinder(light, 0, -.081, 0, .057, .018, .057, M.cream);
  dynamic(head, p => {
    const focus = eased(p, .26, .44) - eased(p, .68, .83);
    head.position.y = .86 - .085 * focus;
  });
  const findings = frame(g, 1.24, 0, -.34);
  slab(findings, 0, .05, -.075, .82, .10, .60, .061, M.deep);
  box(findings, 0, .615, -.12, .146, 1.15, .137, M.steel);
  const clipboard = frame(findings, 0, 1.45, -.09); clipboard.rotation.x = -.24;
  rounded(clipboard, 0, 0, 0, .90, .87, .106, .063, M.deep);
  rounded(clipboard, 0, 0, .062, .798, .745, .022, .033, M.paper);
  function criteria(approved) {
    return print('poc-criteria-' + approved, 454, 435, (c, w, h) => {
      c.fillStyle = '#edeedc'; c.fillRect(0, 0, w, h);
      label(c, '고객 검증표', 28, 67, 43); label(c, '고객 샘플 · 합의한 적용 기준', 30, 109, 23, muted);
      rule(c, 29, 129, w - 58, '#97aa96');
      for (const [i, text] of ['결함 검출', '재검 부담', '현장 응답 시간'].entries()) {
        const y = 180 + i * 54;
        c.strokeStyle = '#6c8676'; c.lineWidth = 2; c.strokeRect(33, y - 21, 21, 21);
        if (approved) {
          c.strokeStyle = '#436852'; c.lineWidth = 4;
          c.beginPath(); c.moveTo(35, y - 11); c.lineTo(41, y - 5); c.lineTo(52, y - 18); c.stroke();
        }
        label(c, text, 77, y, 26);
      }
      c.fillStyle = approved ? '#bacd9b' : '#d5d6bd'; c.fillRect(28, 330, w - 56, 67);
      label(c, approved ? '고객 확인 후 다음 라인 검토' : '담당자 확인 대기', 43, 372, 24);
    });
  }
  const form = face(clipboard, 0, 0, .075, .768, .709, criteria(false));
  stateScreen(form, criteria(true), .76);
  box(clipboard, 0, .365, .081, .228, .037, .029, M.brass);
  const lightPole = frame(findings, -.55, 0, -.32);
  rod(lightPole, [0, .02, 0], [0, 1.88, 0], .025, M.steel);
  cylinder(lightPole, 0, 1.90, 0, .085, .053, .085, M.slate);
  const lamp = cylinder(lightPole, 0, 2.013, 0, .073, .169, .073, M.teal);
  cylinder(lightPole, 0, 2.115, 0, .083, .036, .083, M.slate);
  stateScreen(lamp, M.marker, .78);
  return s.finish([[-1.31, 1.05, -.07], [-.13, 1.49, -.17], [1.24, 1.50, -.33]]);
}

const rooms = { knowledge: archive, hr: onboarding, finance: accounts, purchase: sourcing, sales: customers, roi: valueRoom, poc: pilot };

export function buildOffice(T, id) {
  const build = rooms[id];
  if (typeof build !== 'function') throw new RangeError('Unknown office tour station: ' + id);
  return build(makeStation(T, id));
}
