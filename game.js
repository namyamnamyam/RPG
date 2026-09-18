import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const gameEl = document.getElementById('game');
const dashPipsEl = document.getElementById('dash-pips');
const hpEl = document.getElementById('dummy-hp');
const dummyModeBtn = document.getElementById('dummy-mode');
const autoBtn = document.getElementById('auto-btn');
const lockBtn = document.getElementById('lock-btn');
const lockMarker = document.getElementById('lock-marker');
const toast = document.getElementById('toast');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9eb8c5);
scene.fog = new THREE.Fog(0x9eb8c5, 38, 95);

const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 160);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
gameEl.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xdbefff, 0x50604d, 2.0));
const sun = new THREE.DirectionalLight(0xfff0d2, 2.6);
sun.position.set(-18, 28, 15);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -28;
sun.shadow.camera.right = 28;
sun.shadow.camera.top = 28;
sun.shadow.camera.bottom = -28;
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(56, 96),
  new THREE.MeshStandardMaterial({ color: 0x5d7352, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const yard = new THREE.Mesh(
  new THREE.CircleGeometry(15, 64),
  new THREE.MeshStandardMaterial({ color: 0x8a7e66, roughness: .95 })
);
yard.rotation.x = -Math.PI / 2;
yard.position.y = .01;
yard.receiveShadow = true;
scene.add(yard);

const stoneMat = new THREE.MeshStandardMaterial({ color: 0x777a78, roughness: .92 });
for (let i = 0; i < 18; i++) {
  const a = (i / 18) * Math.PI * 2;
  const r = 15.8 + (i % 2) * .25;
  const block = new THREE.Mesh(new THREE.BoxGeometry(3.1, 1.15, .85), stoneMat);
  block.position.set(Math.sin(a) * r, .55, Math.cos(a) * r);
  block.rotation.y = a;
  block.castShadow = block.receiveShadow = true;
  scene.add(block);
}

function addTree(x, z, s = 1) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(.22 * s, .32 * s, 2.8 * s, 7),
    new THREE.MeshStandardMaterial({ color: 0x5a3c28, roughness: 1 })
  );
  trunk.position.set(x, 1.4 * s, z);
  trunk.castShadow = true;
  scene.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.ConeGeometry(1.35 * s, 3.6 * s, 9),
    new THREE.MeshStandardMaterial({ color: 0x36583d, roughness: 1 })
  );
  crown.position.set(x, 3.7 * s, z);
  crown.castShadow = true;
  scene.add(crown);
}

for (let i = 0; i < 24; i++) {
  const a = i * 2.399;
  const r = 22 + (i % 7) * 3.2;
  addTree(Math.sin(a) * r, Math.cos(a) * r, .75 + (i % 4) * .12);
}

function mesh(geo, mat, parent, pos, rot = [0, 0, 0]) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos);
  m.rotation.set(...rot);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

const skinMat = new THREE.MeshStandardMaterial({ color: 0xe7bea3, roughness: .68 });
const clothMat = new THREE.MeshStandardMaterial({ color: 0x263a55, roughness: .74 });
const clothLightMat = new THREE.MeshStandardMaterial({ color: 0x38577a, roughness: .76 });
const leatherMat = new THREE.MeshStandardMaterial({ color: 0x49382d, roughness: .82 });
const bootMat = new THREE.MeshStandardMaterial({ color: 0x241d1a, roughness: .88 });
const hairMat = new THREE.MeshStandardMaterial({ color: 0x3a261b, roughness: .92 });
const metalMat = new THREE.MeshStandardMaterial({ color: 0xbfc4c7, metalness: .72, roughness: .28 });
const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x5f676d, metalness: .62, roughness: .34 });

const player = new THREE.Group();
scene.add(player);
player.position.set(0, 0, 8);
player.rotation.y = Math.PI;

const hipsRig = new THREE.Group();
hipsRig.position.set(0, 1.7, 0);
player.add(hipsRig);

const pelvisMesh = mesh(new THREE.BoxGeometry(.72, .34, .42), leatherMat, hipsRig, [0, 0, 0]);
const beltMesh = mesh(new THREE.BoxGeometry(.82, .11, .47), darkMetalMat, hipsRig, [0, .19, 0]);

const torsoRig = new THREE.Group();
torsoRig.position.set(0, .16, 0);
hipsRig.add(torsoRig);
mesh(new THREE.BoxGeometry(.92, .92, .46), clothMat, torsoRig, [0, .55, 0]);
mesh(new THREE.BoxGeometry(.98, .18, .5), clothLightMat, torsoRig, [0, .93, 0]);

const neckRig = new THREE.Group();
neckRig.position.set(0, 1.03, 0);
torsoRig.add(neckRig);
mesh(new THREE.CylinderGeometry(.12, .14, .18, 10), skinMat, neckRig, [0, .06, 0]);

const headRig = new THREE.Group();
headRig.position.set(0, .19, 0);
neckRig.add(headRig);
mesh(new THREE.SphereGeometry(.34, 18, 14), skinMat, headRig, [0, .28, 0]);
const hair = mesh(new THREE.SphereGeometry(.35, 16, 10, 0, Math.PI * 2, 0, Math.PI * .56), hairMat, headRig, [0, .38, -.015]);
hair.scale.set(1.02, .82, 1.02);

function buildArm(side) {
  const sign = side === 'left' ? -1 : 1;
  const shoulder = new THREE.Group();
  shoulder.position.set(sign * .56, .91, 0);
  torsoRig.add(shoulder);

  mesh(new THREE.SphereGeometry(.17, 10, 8), clothLightMat, shoulder, [0, 0, 0]);
  mesh(new THREE.CapsuleGeometry(.135, .42, 4, 8), clothMat, shoulder, [0, -.34, 0]);

  const elbow = new THREE.Group();
  elbow.position.set(0, -.72, 0);
  shoulder.add(elbow);
  mesh(new THREE.SphereGeometry(.13, 10, 8), leatherMat, elbow, [0, 0, 0]);
  mesh(new THREE.CapsuleGeometry(.115, .38, 4, 8), clothLightMat, elbow, [0, -.31, 0]);

  const wrist = new THREE.Group();
  wrist.position.set(0, -.66, 0);
  elbow.add(wrist);
  mesh(new THREE.SphereGeometry(.115, 10, 8), skinMat, wrist, [0, -.03, 0]);

  const hand = new THREE.Group();
  hand.position.set(0, -.11, 0);
  wrist.add(hand);
  mesh(new THREE.BoxGeometry(.19, .24, .17), skinMat, hand, [0, -.08, 0]);

  return { shoulder, elbow, wrist, hand };
}

const leftArmRig = buildArm('left');
const rightArmRig = buildArm('right');

function buildLeg(side) {
  const sign = side === 'left' ? -1 : 1;
  const thigh = new THREE.Group();
  thigh.position.set(sign * .23, -.15, 0);
  hipsRig.add(thigh);

  mesh(new THREE.CapsuleGeometry(.18, .48, 4, 8), leatherMat, thigh, [0, -.4, 0]);

  const knee = new THREE.Group();
  knee.position.set(0, -.8, 0);
  thigh.add(knee);
  mesh(new THREE.SphereGeometry(.15, 10, 8), darkMetalMat, knee, [0, 0, 0]);
  mesh(new THREE.CapsuleGeometry(.155, .44, 4, 8), bootMat, knee, [0, -.37, 0]);

  const ankle = new THREE.Group();
  ankle.position.set(0, -.75, 0);
  knee.add(ankle);
  const foot = mesh(new THREE.BoxGeometry(.32, .2, .58), bootMat, ankle, [0, .06, .16]);
  foot.rotation.x = -.04;

  return { thigh, knee, ankle };
}

const leftLegRig = buildLeg('left');
const rightLegRig = buildLeg('right');

const swordRoot = new THREE.Group();
swordRoot.position.set(.02, -.18, .01);
rightArmRig.hand.add(swordRoot);
mesh(new THREE.CylinderGeometry(.045, .045, .28, 8), leatherMat, swordRoot, [0, -.12, 0]);
mesh(new THREE.BoxGeometry(.46, .055, .09), darkMetalMat, swordRoot, [0, -.29, 0]);
mesh(new THREE.BoxGeometry(.085, 1.45, .12), metalMat, swordRoot, [0, -1.02, 0]);
mesh(new THREE.BoxGeometry(.045, .18, .16), metalMat, swordRoot, [0, -1.77, 0]);

rightArmRig.shoulder.rotation.z = -.08;
leftArmRig.shoulder.rotation.z = .08;
rightArmRig.elbow.rotation.x = -.12;
leftArmRig.elbow.rotation.x = -.08;
swordRoot.rotation.z = .03;

function createDummy() {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x8c623e, roughness: .92 });
  mesh(new THREE.CylinderGeometry(.34, .4, 2.0, 10), wood, g, [0, 1.05, 0]);
  mesh(new THREE.SphereGeometry(.36, 12, 8), wood, g, [0, 2.22, 0]);
  mesh(new THREE.BoxGeometry(2.1, .15, .15), wood, g, [0, 1.55, 0]);
  const base = mesh(new THREE.CylinderGeometry(.72, .85, .24, 14), stoneMat, g, [0, .12, 0]);
  base.receiveShadow = true;
  g.position.set(0, 0, -2.5);
  scene.add(g);
  return g;
}

const dummy = createDummy();
let dummyHP = 100;
let dummyInfinite = true;
let dummyAlive = true;
let dummyRespawn = 0;
let dummyFlash = 0;

const keys = new Set();
let joystick = new THREE.Vector2();
let cameraYaw = 0;
let cameraPitch = .34;
let manualCamHold = 0;
let autoCamera = true;
let locked = false;
let velocityY = 0;
let grounded = true;
const moveSpeed = 5.7;
let playerYaw = Math.PI;
let dashCharges = 3;
let dashRecharge = 0;
let dashTime = 0;
let dashDir = new THREE.Vector3(0, 0, -1);
let invulnTime = 0;
let attack = null;
let comboNext = 0;
let comboExpire = 0;
let queuedAttack = false;
let hitPause = 0;
let shake = 0;
let elapsed = 0;

const DASH_RECHARGE = 1.5;
const DASH_DURATION = .16;
const DASH_SPEED = 22.5;
const IFRAME = .18;
const gravity = 22;

for (let i = 0; i < 3; i++) {
  const p = document.createElement('div');
  p.className = 'pip';
  const fill = document.createElement('i');
  p.appendChild(fill);
  dashPipsEl.appendChild(p);
}

function updateDashUI() {
  [...dashPipsEl.children].forEach((pip, i) => {
    const fill = pip.firstElementChild;
    if (i < dashCharges) fill.style.transform = 'scaleX(1)';
    else if (i === dashCharges && dashCharges < 3) {
      fill.style.transform = `scaleX(${Math.min(1, dashRecharge / DASH_RECHARGE)})`;
    } else fill.style.transform = 'scaleX(0)';
  });
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast.t);
  showToast.t = setTimeout(() => toast.classList.remove('show'), 850);
}

function updateDummyUI() {
  hpEl.style.width = `${dummyInfinite ? 100 : Math.max(0, dummyHP)}%`;
  dummyModeBtn.textContent = dummyInfinite ? '∞ 무한 HP' : '♥ 100 HP';
}

updateDummyUI();
updateDashUI();

dummyModeBtn.addEventListener('click', () => {
  dummyInfinite = !dummyInfinite;
  dummyHP = 100;
  dummyAlive = true;
  dummy.visible = true;
  updateDummyUI();
  showToast(dummyInfinite ? '더미: 무한 체력' : '더미: HP 모드');
});

function toggleAutoCamera() {
  autoCamera = !autoCamera;
  autoBtn.classList.toggle('active', autoCamera);
  showToast(`자동 카메라 ${autoCamera ? 'ON' : 'OFF'}`);
}

function toggleLock() {
  if (!dummyAlive) return;
  locked = !locked;
  lockBtn.classList.toggle('active', locked);
  lockMarker.style.display = locked ? 'block' : 'none';
  showToast(locked ? '더미 락온' : '락온 해제');
}

autoBtn.addEventListener('pointerdown', e => {
  e.preventDefault();
  toggleAutoCamera();
});

lockBtn.addEventListener('pointerdown', e => {
  e.preventDefault();
  toggleLock();
});

function playerForward(out = new THREE.Vector3()) {
  return out.set(Math.sin(playerYaw), 0, Math.cos(playerYaw));
}

function tryDash() {
  if (dashCharges <= 0 || dashTime > 0) return;
  dashCharges--;
  updateDashUI();
  const m = getMoveVector();
  if (m.lengthSq() > .04) dashDir.copy(m).normalize();
  else playerForward(dashDir);
  dashTime = DASH_DURATION;
  invulnTime = IFRAME;
}

function tryJump() {
  if (!grounded) return;
  velocityY = 8.2;
  grounded = false;
}

const attackData = [
  { duration: .48, hitAt: .28, damage: 10, range: 2.5, arc: 1.75, finisher: false },
  { duration: .46, hitAt: .26, damage: 12, range: 2.55, arc: 1.85, finisher: false },
  { duration: .58, hitAt: .34, damage: 14, range: 2.75, arc: 1.65, finisher: false },
  { duration: .72, hitAt: .42, damage: 22, range: 3.25, arc: 2.75, finisher: true }
];

function tryAttack() {
  const now = performance.now() / 1000;
  if (attack) {
    queuedAttack = true;
    return;
  }
  if (now > comboExpire) comboNext = 0;
  startAttack(comboNext);
}

function startAttack(index) {
  const d = attackData[index];
  attack = { index, t: 0, hit: false, ...d };
  queuedAttack = false;
  comboNext = (index + 1) % 4;
  if (index === 3) comboNext = 0;
}

function damageDummy(amount, finisher = false) {
  if (!dummyAlive) return;
  dummyFlash = .14;
  hitPause = .045;
  shake = finisher ? .18 : .08;

  if (!dummyInfinite) {
    dummyHP -= amount;
    if (dummyHP <= 0) {
      dummyHP = 0;
      dummyAlive = false;
      dummy.visible = false;
      dummyRespawn = 2.2;
      locked = false;
      lockBtn.classList.remove('active');
      lockMarker.style.display = 'none';
      showToast('더미 처치');
    }
    updateDummyUI();
  }

  if (finisher && dummyAlive) {
    const away = dummy.position.clone().sub(player.position).setY(0).normalize();
    dummy.position.addScaledVector(away, .55);
  }
}

function testAttackHit(a) {
  if (!dummyAlive) return;
  const to = dummy.position.clone().sub(player.position);
  to.y = 0;
  const dist = to.length();
  if (dist > a.range) return;
  to.normalize();
  const f = playerForward();
  const angle = Math.acos(THREE.MathUtils.clamp(f.dot(to), -1, 1));
  if (angle <= a.arc / 2) damageDummy(a.damage, a.finisher);
}

function getMoveInput() {
  let x = joystick.x;
  let y = joystick.y;
  if (keys.has('KeyA')) x -= 1;
  if (keys.has('KeyD')) x += 1;
  if (keys.has('KeyW')) y += 1;
  if (keys.has('KeyS')) y -= 1;
  const v = new THREE.Vector2(x, y);
  if (v.length() > 1) v.normalize();
  return v;
}

function getMoveVector() {
  const input = getMoveInput();
  const forward = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
  const right = new THREE.Vector3(-forward.z, 0, forward.x);
  return forward.multiplyScalar(input.y).add(right.multiplyScalar(input.x));
}

const joyBase = document.getElementById('joystick-base');
const joyKnob = document.getElementById('joystick-knob');
let joyPointer = null;

function updateJoy(e) {
  const r = joyBase.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  let dx = e.clientX - cx;
  let dy = e.clientY - cy;
  const max = r.width * .35;
  const len = Math.hypot(dx, dy) || 1;
  if (len > max) {
    dx = dx / len * max;
    dy = dy / len * max;
  }
  joyKnob.style.transform = `translate(${dx}px,${dy}px)`;
  joystick.set(dx / max, -dy / max);
}

joyBase.addEventListener('pointerdown', e => {
  e.preventDefault();
  joyPointer = e.pointerId;
  joyBase.setPointerCapture(e.pointerId);
  updateJoy(e);
});

joyBase.addEventListener('pointermove', e => {
  if (e.pointerId === joyPointer) updateJoy(e);
});

function endJoy(e) {
  if (e.pointerId !== joyPointer) return;
  joyPointer = null;
  joystick.set(0, 0);
  joyKnob.style.transform = 'translate(0,0)';
}

joyBase.addEventListener('pointerup', endJoy);
joyBase.addEventListener('pointercancel', endJoy);

const camZone = document.getElementById('camera-zone');
let camPointer = null;
let lastX = 0;
let lastY = 0;

camZone.addEventListener('pointerdown', e => {
  camPointer = e.pointerId;
  lastX = e.clientX;
  lastY = e.clientY;
  camZone.setPointerCapture(e.pointerId);
  camZone.classList.add('dragging');
});

camZone.addEventListener('pointermove', e => {
  if (e.pointerId !== camPointer) return;
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;
  cameraYaw -= dx * .006;
  cameraPitch = THREE.MathUtils.clamp(cameraPitch + dy * .004, -.05, .78);
  manualCamHold = .85;
});

function endCam(e) {
  if (e.pointerId !== camPointer) return;
  camPointer = null;
  camZone.classList.remove('dragging');
}

camZone.addEventListener('pointerup', endCam);
camZone.addEventListener('pointercancel', endCam);

document.getElementById('attack-btn').addEventListener('pointerdown', e => {
  e.preventDefault();
  tryAttack();
});

document.getElementById('dash-btn').addEventListener('pointerdown', e => {
  e.preventDefault();
  tryDash();
});

document.getElementById('jump-btn').addEventListener('pointerdown', e => {
  e.preventDefault();
  tryJump();
});

addEventListener('keydown', e => {
  keys.add(e.code);
  if (e.repeat) return;
  if (e.code === 'KeyJ') tryAttack();
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') tryDash();
  if (e.code === 'Space') {
    e.preventDefault();
    tryJump();
  }
  if (e.code === 'KeyL') toggleLock();
  if (e.code === 'KeyC') toggleAutoCamera();
});

addEventListener('keyup', e => keys.delete(e.code));

function angleLerp(a, b, t) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function damp(current, target, speed, dt) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-speed * dt));
}

function dampRot(obj, x, y, z, speed, dt) {
  obj.rotation.x = damp(obj.rotation.x, x, speed, dt);
  obj.rotation.y = damp(obj.rotation.y, y, speed, dt);
  obj.rotation.z = damp(obj.rotation.z, z, speed, dt);
}

function phase(p, start, end) {
  return THREE.MathUtils.smoothstep(THREE.MathUtils.clamp((p - start) / (end - start), 0, 1), 0, 1);
}

function keyed(neutral, windup, follow, wind, cut, recover) {
  let v = THREE.MathUtils.lerp(neutral, windup, wind);
  v = THREE.MathUtils.lerp(v, follow, cut);
  return THREE.MathUtils.lerp(v, neutral, recover);
}

function attackPose(index, p) {
  const wind = phase(p, 0, index === 3 ? .34 : .28);
  const cut = phase(p, index === 3 ? .28 : .22, index === 3 ? .68 : .66);
  const recover = phase(p, index === 3 ? .76 : .72, 1);

  const n = {
    hipY: 0,
    torsoX: 0,
    torsoY: 0,
    torsoZ: 0,
    shoulderX: -.08,
    shoulderY: 0,
    shoulderZ: -.08,
    elbowX: -.18,
    elbowZ: 0,
    wristX: 0,
    wristY: 0,
    wristZ: 0,
    leftX: .08,
    leftY: 0,
    leftZ: .08,
    leftElbow: -.12
  };

  let w, h;

  if (index === 0) {
    // 1타: 오른쪽 위에서 왼쪽 아래로 크게 내려베기
    w = { hipY: -.24, torsoX: -.04, torsoY: -.52, torsoZ: -.12,
      shoulderX: .28, shoulderY: -.45, shoulderZ: -1.78,
      elbowX: -.72, elbowZ: -.12, wristX: 0, wristY: 0, wristZ: -.28,
      leftX: .34, leftY: .08, leftZ: .32, leftElbow: -.28 };
    h = { hipY: .22, torsoX: .12, torsoY: .58, torsoZ: .14,
      shoulderX: -.82, shoulderY: .62, shoulderZ: -.28,
      elbowX: -.10, elbowZ: .12, wristX: 0, wristY: 0, wristZ: .42,
      leftX: -.08, leftY: -.16, leftZ: .18, leftElbow: -.18 };
  } else if (index === 1) {
    // 2타: 왼쪽 아래에서 오른쪽 위로 역대각 올려베기
    w = { hipY: .25, torsoX: .10, torsoY: .50, torsoZ: .14,
      shoulderX: -.86, shoulderY: .62, shoulderZ: -.18,
      elbowX: -.16, elbowZ: .10, wristX: 0, wristY: 0, wristZ: .35,
      leftX: -.04, leftY: -.14, leftZ: .18, leftElbow: -.16 };
    h = { hipY: -.24, torsoX: -.06, torsoY: -.58, torsoZ: -.16,
      shoulderX: .12, shoulderY: -.66, shoulderZ: -2.10,
      elbowX: -.62, elbowZ: -.12, wristX: 0, wristY: 0, wristZ: -.36,
      leftX: .30, leftY: .12, leftZ: .34, leftElbow: -.30 };
  } else if (index === 2) {
    // 3타: 머리 위까지 크게 들어 올린 뒤 정면 내려찍기
    w = { hipY: -.06, torsoX: -.16, torsoY: -.08, torsoZ: -.03,
      shoulderX: .08, shoulderY: -.12, shoulderZ: -2.92,
      elbowX: -.78, elbowZ: 0, wristX: 0, wristY: 0, wristZ: -.05,
      leftX: .42, leftY: .18, leftZ: -.42, leftElbow: -.50 };
    h = { hipY: .05, torsoX: .34, torsoY: .08, torsoZ: .02,
      shoulderX: -1.02, shoulderY: .12, shoulderZ: -.08,
      elbowX: -.04, elbowZ: 0, wristX: 0, wristY: 0, wristZ: .08,
      leftX: -.18, leftY: -.12, leftZ: .32, leftElbow: -.22 };
  } else {
    // 4타: 몸 전체를 감아 돌리는 대형 횡베기 마무리
    w = { hipY: -.72, torsoX: .10, torsoY: -.98, torsoZ: -.08,
      shoulderX: -.88, shoulderY: -1.18, shoulderZ: -1.02,
      elbowX: -.22, elbowZ: -.10, wristX: 0, wristY: 0, wristZ: -.18,
      leftX: .55, leftY: .20, leftZ: .62, leftElbow: -.36 };
    h = { hipY: .78, torsoX: .16, torsoY: 1.10, torsoZ: .10,
      shoulderX: -.72, shoulderY: 1.28, shoulderZ: -.70,
      elbowX: -.06, elbowZ: .12, wristX: 0, wristY: 0, wristZ: .22,
      leftX: -.35, leftY: -.25, leftZ: -.52, leftElbow: -.22 };
  }

  const out = {};
  for (const k of Object.keys(n)) out[k] = keyed(n[k], w[k], h[k], wind, cut, recover);
  return out;
}

function animateRig(dt, moving) {
  const speed = 13;
  const run = moving && grounded && dashTime <= 0 && !attack;
  const cycle = elapsed * 9.5;
  const step = run ? Math.sin(cycle) : 0;
  const step2 = run ? Math.sin(cycle + Math.PI) : 0;
  const bob = run ? Math.abs(Math.sin(cycle * .5)) * .045 : Math.sin(elapsed * 1.8) * .012;

  hipsRig.position.y = damp(hipsRig.position.y, 1.7 + bob, 10, dt);
  if (!attack) hipsRig.rotation.y = damp(hipsRig.rotation.y, run ? step * .035 : 0, 10, dt);
  hipsRig.rotation.z = damp(hipsRig.rotation.z, run ? -step * .02 : 0, 10, dt);

  let torsoX = 0;
  let torsoY = 0;
  let torsoZ = 0;
  let rSX = run ? step2 * .42 : -.08;
  let lSX = run ? step * .42 : .08;
  let rSY = 0, lSY = 0;
  let rSZ = -.08, lSZ = .08;
  let rEX = run ? -.28 - Math.max(0, step2) * .28 : -.18;
  let lEX = run ? -.22 - Math.max(0, step) * .2 : -.12;
  let rEZ = 0, lEZ = 0;
  let rWZ = 0;
  let lWZ = 0;

  let lTX = run ? step * .68 : 0;
  let rTX = run ? step2 * .68 : 0;
  let lKX = run ? Math.max(0, -step) * 1.0 : 0;
  let rKX = run ? Math.max(0, -step2) * 1.0 : 0;
  let lAX = run ? -Math.max(0, step) * .22 : 0;
  let rAX = run ? -Math.max(0, step2) * .22 : 0;

  if (!grounded) {
    torsoX = -.08;
    lTX = -.3;
    rTX = .2;
    lKX = .7;
    rKX = .45;
    lSX = -.22;
    rSX = -.28;
    lEX = -.45;
    rEX = -.52;
  }

  if (dashTime > 0) {
    // 낮게 몸을 앞으로 던지는 질주형 대쉬. 팔은 뒤로 빼고 한쪽 다리는 앞으로 접는다.
    torsoX = .46;
    torsoY = 0;
    torsoZ = 0;
    hipsRig.position.y = damp(hipsRig.position.y, 1.58, 18, dt);
    hipsRig.rotation.x = damp(hipsRig.rotation.x, .12, 18, dt);
    lTX = -.55;
    rTX = .42;
    lKX = 1.02;
    rKX = .30;
    lAX = -.15;
    rAX = .12;
    lSX = .74;
    rSX = .66;
    lSY = -.08;
    rSY = .10;
    lSZ = .18;
    rSZ = -.22;
    lEX = -.24;
    rEX = -.30;
  } else {
    hipsRig.rotation.x = damp(hipsRig.rotation.x, 0, 10, dt);
  }

  if (attack) {
    const p = Math.min(1, attack.t / attack.duration);
    const pose = attackPose(attack.index, p);
    hipsRig.rotation.y = damp(hipsRig.rotation.y, pose.hipY, 18, dt);
    torsoX = pose.torsoX;
    torsoY = pose.torsoY;
    torsoZ = pose.torsoZ;
    rSX = pose.shoulderX;
    rSY = pose.shoulderY;
    rSZ = pose.shoulderZ;
    rEX = pose.elbowX;
    rEZ = pose.elbowZ;
    rWZ = pose.wristZ;
    lSX = pose.leftX;
    lSY = pose.leftY;
    lSZ = pose.leftZ;
    lEX = pose.leftElbow;

    if (attack.index === 2) {
      lTX = -.16;
      rTX = .10;
      lKX = .22;
      rKX = .08;
    } else if (attack.index === 3) {
      lTX = -.28;
      rTX = .22;
      lKX = .30;
      rKX = .12;
    }
  }

  dampRot(torsoRig, torsoX, torsoY, torsoZ, speed, dt);
  dampRot(rightArmRig.shoulder, rSX, rSY, rSZ, speed, dt);
  dampRot(leftArmRig.shoulder, lSX, lSY, lSZ, speed, dt);
  dampRot(rightArmRig.elbow, rEX, 0, rEZ, speed, dt);
  dampRot(leftArmRig.elbow, lEX, 0, lEZ, speed, dt);
  dampRot(rightArmRig.wrist, 0, 0, rWZ, speed, dt);
  dampRot(leftArmRig.wrist, 0, 0, lWZ, speed, dt);

  dampRot(leftLegRig.thigh, lTX, 0, 0, 14, dt);
  dampRot(rightLegRig.thigh, rTX, 0, 0, 14, dt);
  dampRot(leftLegRig.knee, lKX, 0, 0, 16, dt);
  dampRot(rightLegRig.knee, rKX, 0, 0, 16, dt);
  dampRot(leftLegRig.ankle, lAX, 0, 0, 14, dt);
  dampRot(rightLegRig.ankle, rAX, 0, 0, 14, dt);

  headRig.rotation.y = damp(headRig.rotation.y, attack ? -torsoY * .32 : 0, 8, dt);
  headRig.rotation.x = damp(headRig.rotation.x, dashTime > 0 ? .16 : 0, 8, dt);
}

function updatePlayer(dt) {
  elapsed += dt;
  manualCamHold = Math.max(0, manualCamHold - dt);
  invulnTime = Math.max(0, invulnTime - dt);

  if (dashCharges < 3) {
    dashRecharge += dt;
    while (dashRecharge >= DASH_RECHARGE && dashCharges < 3) {
      dashRecharge -= DASH_RECHARGE;
      dashCharges++;
    }
    if (dashCharges === 3) dashRecharge = 0;
    updateDashUI();
  }

  const move = getMoveVector();
  const moving = move.lengthSq() > .02;

  if (dashTime > 0) {
    dashTime -= dt;
    player.position.addScaledVector(dashDir, DASH_SPEED * dt);
    playerYaw = angleLerp(playerYaw, Math.atan2(dashDir.x, dashDir.z), Math.min(1, dt * 18));
  } else if (moving) {
    move.normalize();
    const slow = attack?.finisher ? .65 : attack ? .78 : 1;
    player.position.addScaledVector(move, moveSpeed * slow * dt);
    if (!locked) playerYaw = angleLerp(playerYaw, Math.atan2(move.x, move.z), Math.min(1, dt * 12));
  }

  player.position.x = THREE.MathUtils.clamp(player.position.x, -48, 48);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -48, 48);

  velocityY -= gravity * dt;
  player.position.y += velocityY * dt;
  if (player.position.y <= 0) {
    player.position.y = 0;
    velocityY = 0;
    grounded = true;
  }

  if (locked && dummyAlive) {
    const d = dummy.position.clone().sub(player.position);
    const targetYaw = Math.atan2(d.x, d.z);
    playerYaw = angleLerp(playerYaw, targetYaw, Math.min(1, dt * 13));
    cameraYaw = angleLerp(cameraYaw, targetYaw + Math.PI, Math.min(1, dt * 5.5));
  } else if (autoCamera && moving && manualCamHold <= 0 && dashTime <= 0) {
    cameraYaw = angleLerp(cameraYaw, playerYaw + Math.PI, Math.min(1, dt * 2.7));
  }

  player.rotation.y = playerYaw;

  if (attack) {
    attack.t += dt;

    if (!attack.hit && attack.t >= attack.hitAt) {
      attack.hit = true;
      testAttackHit(attack);
    }

    if (attack.t >= attack.duration) {
      const was = attack.index;
      attack = null;
      comboExpire = performance.now() / 1000 + .55;
      if (queuedAttack && was < 3) startAttack(was + 1);
      else if (was === 3) {
        comboNext = 0;
        queuedAttack = false;
      }
    }
  }

  animateRig(dt, moving);

}

function updateDummy(dt) {
  if (dummyFlash > 0) {
    dummyFlash -= dt;
    dummy.scale.setScalar(1 + Math.sin(dummyFlash * 65) * .035);
  } else {
    dummy.scale.setScalar(1);
  }

  if (!dummyAlive) {
    dummyRespawn -= dt;
    if (dummyRespawn <= 0) {
      dummyAlive = true;
      dummyHP = 100;
      dummy.position.set(0, 0, -2.5);
      dummy.visible = true;
      updateDummyUI();
    }
  }
}

const tmpV = new THREE.Vector3();

function updateCamera(dt) {
  const dist = 7.4;
  const height = 3.35;
  const horizontal = Math.cos(cameraPitch) * dist;
  const desired = new THREE.Vector3(
    player.position.x + Math.sin(cameraYaw) * horizontal,
    player.position.y + height + Math.sin(cameraPitch) * dist,
    player.position.z + Math.cos(cameraYaw) * horizontal
  );

  const smooth = 1 - Math.pow(.001, dt);
  camera.position.lerp(desired, smooth);

  const look = tmpV.copy(player.position).add(new THREE.Vector3(0, 2.05, 0));
  if (locked && dummyAlive) {
    look.lerp(dummy.position.clone().add(new THREE.Vector3(0, 1.2, 0)), .22);
  }
  camera.lookAt(look);

  if (shake > 0) {
    shake = Math.max(0, shake - dt * 1.6);
    camera.position.x += (Math.random() - .5) * shake;
    camera.position.y += (Math.random() - .5) * shake * .5;
  }

  if (locked && dummyAlive) {
    const p = dummy.position.clone().add(new THREE.Vector3(0, 2.65, 0)).project(camera);
    lockMarker.style.left = `${(p.x * .5 + .5) * innerWidth}px`;
    lockMarker.style.top = `${(-p.y * .5 + .5) * innerHeight}px`;
  }
}

let last = performance.now();

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.033, (now - last) / 1000);
  last = now;

  if (hitPause > 0) {
    hitPause -= dt;
    updateCamera(dt * .2);
    renderer.render(scene, camera);
    return;
  }

  updatePlayer(dt);
  updateDummy(dt);
  updateCamera(dt);
  renderer.render(scene, camera);
}

requestAnimationFrame(frame);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

showToast('프로토타입 로드 완료');
