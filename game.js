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

// 화면/캐릭터 기준 좌우가 뒤집혀 보이던 문제 수정:
// 실제 보이는 오른팔을 rightArmRig로, 왼팔을 leftArmRig로 매핑한다.
const rightArmRig = buildArm('left');
const leftArmRig = buildArm('right');

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

// 화면/캐릭터 기준 좌우에 맞게 다리도 팔과 동일하게 매핑.
const rightLegRig = buildLeg('left');
const leftLegRig = buildLeg('right');

const swordRoot = new THREE.Group();
swordRoot.position.set(.02, -.18, .01);
rightArmRig.hand.add(swordRoot); // 장검은 오른손 고정
mesh(new THREE.CylinderGeometry(.045, .045, .28, 8), leatherMat, swordRoot, [0, -.12, 0]);
mesh(new THREE.BoxGeometry(.46, .055, .09), darkMetalMat, swordRoot, [0, -.29, 0]);
mesh(new THREE.BoxGeometry(.085, 1.45, .12), metalMat, swordRoot, [0, -1.02, 0]);
mesh(new THREE.BoxGeometry(.045, .18, .16), metalMat, swordRoot, [0, -1.77, 0]);

rightArmRig.shoulder.rotation.z = -.08;
leftArmRig.shoulder.rotation.z = .08;
rightArmRig.elbow.rotation.x = -.12;
leftArmRig.elbow.rotation.x = -.08;
swordRoot.rotation.z = .03;
const swordRestQuaternion = swordRoot.quaternion.clone();

// 아주 약한 대쉬 바람 이펙트: 캐릭터 뒤쪽에 짧은 반투명 속도선만 표시.
const dashWind = new THREE.Group();
player.add(dashWind);
dashWind.position.set(0, 1.25, 0);
dashWind.visible = false;
const dashWindLines = [];
for (let i = 0; i < 7; i++) {
  const mat = new THREE.MeshBasicMaterial({
    color: 0xd9f4ff,
    transparent: true,
    opacity: 0,
    depthWrite: false
  });
  const streak = new THREE.Mesh(new THREE.BoxGeometry(.018, .018, .95 + (i % 3) * .22), mat);
  streak.position.set(
    (i - 3) * .17,
    ((i % 4) - 1.5) * .18,
    -.55 - (i % 3) * .2
  );
  dashWind.add(streak);
  dashWindLines.push(streak);
}

function updateDashWind() {
  const active = dashTime > 0;
  dashWind.visible = active;
  if (!active) return;

  const progress = 1 - THREE.MathUtils.clamp(dashTime / DASH_DURATION, 0, 1);
  for (let i = 0; i < dashWindLines.length; i++) {
    const streak = dashWindLines[i];
    const travel = (elapsed * 8.5 + i * .31) % 1.0;
    streak.position.z = -.42 - travel * 1.15;
    streak.scale.z = .82 + travel * .55;
    streak.material.opacity = (0.055 + (1 - travel) * .055) * (1 - progress * .18);
  }
}

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
const DASH_DURATION = .24;
const DASH_SPEED = 22.0;
const IFRAME = .18;
const gravity = 22;

// 공격 모션 제작 단계: 큰 실루엣을 먼저 잡는다.
const USE_SELF_COLLISION = false;
const USE_ATTACK_IK = false;

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
  velocityY = 10.4;
  grounded = false;
}

const attackData = [
  { duration: 4.2, hitAt: 2.85, damage: 10, range: 2.5, arc: 1.75, finisher: false },
  { duration: .46, hitAt: .25, damage: 12, range: 2.55, arc: 1.85, finisher: false },
  { duration: .54, hitAt: .30, damage: 14, range: 2.75, arc: 1.65, finisher: false },
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

function moveScalarToward(current, target, maxStep) {
  const delta = target - current;
  return current + THREE.MathUtils.clamp(delta, -maxStep, maxStep);
}

function dampAxisLimited(current, target, damping, maxRate, dt) {
  const damped = damp(current, target, damping, dt);
  return moveScalarToward(current, damped, maxRate * dt);
}

function dampRot(obj, x, y, z, speed, dt, maxRate = 7.2) {
  obj.rotation.x = dampAxisLimited(obj.rotation.x, x, speed, maxRate, dt);
  obj.rotation.y = dampAxisLimited(obj.rotation.y, y, speed, maxRate, dt);
  obj.rotation.z = dampAxisLimited(obj.rotation.z, z, speed, maxRate, dt);
}

function rotateQuaternionToward(obj, targetQ, maxRate, dt) {
  let angle = obj.quaternion.angleTo(targetQ);
  if (!Number.isFinite(angle) || angle < 1e-5) {
    obj.quaternion.copy(targetQ);
    return;
  }
  const t = Math.min(1, (maxRate * dt) / angle);
  obj.quaternion.slerp(targetQ, t);
}

function phase(p, start, end) {
  return THREE.MathUtils.smoothstep(THREE.MathUtils.clamp((p - start) / (end - start), 0, 1), 0, 1);
}

function keyed(neutral, windup, follow, wind, cut, recover) {
  let v = THREE.MathUtils.lerp(neutral, windup, wind);
  v = THREE.MathUtils.lerp(v, follow, cut);
  return THREE.MathUtils.lerp(v, neutral, recover);
}

// 현재 단순 관절 리그에 맞춘 인간형 관절 제한.
// 실제 해부학 수치를 그대로 복제하기보다는, 사람에게 불가능한 방향/역관절을
// 절대 허용하지 않는 것을 우선한다.
const HUMAN_LIMITS = {
  shoulderX: [-1.95, 1.25],
  shoulderY: [-1.35, 1.35],
  rightShoulderZ: [-2.45, 2.45],
  leftShoulderZ: [-.72, 2.45],

  // 팔꿈치: 거의 한 축으로만 접힌다. 약 145도까지.
  elbowX: [-2.53, .03],
  elbowSide: [-.07, .07],

  wristX: [-.78, .78],
  wristY: [-.52, .52],
  wristZ: [-.58, .58],

  hipX: [-1.50, 1.30],
  kneeX: [0, 2.44],
  ankleX: [-.62, .55],

  torsoX: [-.62, .62],
  torsoY: [-1.18, 1.18],
  torsoZ: [-.48, .48],
  hipsX: [-.42, .62],
  hipsY: [-1.18, 1.18],
  hipsZ: [-.42, .42],

  headX: [-.62, .62],
  headY: [-1.25, 1.25]
};

function clampJoint(v, range) {
  return THREE.MathUtils.clamp(v, range[0], range[1]);
}

function constrainShoulder(rig, side) {
  rig.rotation.x = clampJoint(rig.rotation.x, HUMAN_LIMITS.shoulderX);
  rig.rotation.y = clampJoint(rig.rotation.y, HUMAN_LIMITS.shoulderY);
  rig.rotation.z = clampJoint(
    rig.rotation.z,
    side === 'right' ? HUMAN_LIMITS.rightShoulderZ : HUMAN_LIMITS.leftShoulderZ
  );
}

function constrainElbow(rig) {
  // 팔꿈치는 힌지처럼 앞뒤 굽힘만 허용한다.
  rig.rotation.x = clampJoint(rig.rotation.x, HUMAN_LIMITS.elbowX);
  rig.rotation.y = clampJoint(rig.rotation.y, HUMAN_LIMITS.elbowSide);
  rig.rotation.z = clampJoint(rig.rotation.z, HUMAN_LIMITS.elbowSide);
}

function constrainWrist(rig) {
  rig.rotation.x = clampJoint(rig.rotation.x, HUMAN_LIMITS.wristX);
  rig.rotation.y = clampJoint(rig.rotation.y, HUMAN_LIMITS.wristY);
  rig.rotation.z = clampJoint(rig.rotation.z, HUMAN_LIMITS.wristZ);
}

function applyHumanJointLimits() {
  constrainShoulder(rightArmRig.shoulder, 'right');
  constrainShoulder(leftArmRig.shoulder, 'left');

  constrainElbow(rightArmRig.elbow);
  constrainElbow(leftArmRig.elbow);

  constrainWrist(rightArmRig.wrist);
  constrainWrist(leftArmRig.wrist);

  leftLegRig.thigh.rotation.x = clampJoint(leftLegRig.thigh.rotation.x, HUMAN_LIMITS.hipX);
  rightLegRig.thigh.rotation.x = clampJoint(rightLegRig.thigh.rotation.x, HUMAN_LIMITS.hipX);

  // 무릎은 뒤로만 굽는다. 음수(역관절)는 절대 금지.
  leftLegRig.knee.rotation.x = clampJoint(leftLegRig.knee.rotation.x, HUMAN_LIMITS.kneeX);
  rightLegRig.knee.rotation.x = clampJoint(rightLegRig.knee.rotation.x, HUMAN_LIMITS.kneeX);
  leftLegRig.knee.rotation.y = 0;
  leftLegRig.knee.rotation.z = 0;
  rightLegRig.knee.rotation.y = 0;
  rightLegRig.knee.rotation.z = 0;

  leftLegRig.ankle.rotation.x = clampJoint(leftLegRig.ankle.rotation.x, HUMAN_LIMITS.ankleX);
  rightLegRig.ankle.rotation.x = clampJoint(rightLegRig.ankle.rotation.x, HUMAN_LIMITS.ankleX);
  leftLegRig.ankle.rotation.y = 0;
  leftLegRig.ankle.rotation.z = 0;
  rightLegRig.ankle.rotation.y = 0;
  rightLegRig.ankle.rotation.z = 0;

  torsoRig.rotation.x = clampJoint(torsoRig.rotation.x, HUMAN_LIMITS.torsoX);
  torsoRig.rotation.y = clampJoint(torsoRig.rotation.y, HUMAN_LIMITS.torsoY);
  torsoRig.rotation.z = clampJoint(torsoRig.rotation.z, HUMAN_LIMITS.torsoZ);

  hipsRig.rotation.x = clampJoint(hipsRig.rotation.x, HUMAN_LIMITS.hipsX);
  hipsRig.rotation.y = clampJoint(hipsRig.rotation.y, HUMAN_LIMITS.hipsY);
  hipsRig.rotation.z = clampJoint(hipsRig.rotation.z, HUMAN_LIMITS.hipsZ);

  headRig.rotation.x = clampJoint(headRig.rotation.x, HUMAN_LIMITS.headX);
  headRig.rotation.y = clampJoint(headRig.rotation.y, HUMAN_LIMITS.headY);
  headRig.rotation.z = 0;
}

function solveTwoBoneArmIK(shoulderRig, elbowRig, wristRig, target, pole, side = 'right', dt = 1 / 60) {
  const upperLen = .72;
  const lowerLen = .66;
  const shoulderPos = shoulderRig.position.clone();

  const toTarget = target.clone().sub(shoulderPos);
  let dist = toTarget.length();
  if (dist < .0001) return;

  const targetDir = toTarget.clone().normalize();
  dist = THREE.MathUtils.clamp(
    dist,
    Math.abs(upperLen - lowerLen) + .06,
    upperLen + lowerLen - .04
  );

  const a = (upperLen * upperLen - lowerLen * lowerLen + dist * dist) / (2 * dist);
  const h = Math.sqrt(Math.max(.0001, upperLen * upperLen - a * a));

  const poleVec = pole.clone().sub(shoulderPos);
  poleVec.addScaledVector(targetDir, -poleVec.dot(targetDir));
  if (poleVec.lengthSq() < .0001) {
    poleVec.set(side === 'right' ? -1 : 1, .2, .5);
  }
  poleVec.normalize();

  const elbowPos = shoulderPos.clone()
    .addScaledVector(targetDir, a)
    .addScaledVector(poleVec, h);

  const upperDir = elbowPos.clone().sub(shoulderPos).normalize();
  const lowerDir = target.clone().sub(elbowPos).normalize();

  let bendNormal = new THREE.Vector3().crossVectors(upperDir, lowerDir);
  if (bendNormal.lengthSq() < .0001) {
    bendNormal = new THREE.Vector3().crossVectors(upperDir, poleVec);
  }
  bendNormal.normalize();

  const xAxis = bendNormal.clone().multiplyScalar(-1).normalize();
  const yAxis = upperDir.clone().multiplyScalar(-1).normalize();
  const zAxis = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize();
  xAxis.crossVectors(yAxis, zAxis).normalize();

  const basis = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
  const shoulderTargetQ = new THREE.Quaternion().setFromRotationMatrix(basis);

  // Temporarily apply only to clamp the desired shoulder pose to human limits.
  const currentShoulderQ = shoulderRig.quaternion.clone();
  shoulderRig.quaternion.copy(shoulderTargetQ);
  constrainShoulder(shoulderRig, side);
  shoulderTargetQ.copy(shoulderRig.quaternion);
  shoulderRig.quaternion.copy(currentShoulderQ);

  // No teleport: shoulder has a maximum angular velocity.
  rotateQuaternionToward(shoulderRig, shoulderTargetQ, 6.4, dt);

  const bendAngle = Math.acos(
    THREE.MathUtils.clamp(upperDir.dot(lowerDir), -1, 1)
  );
  const elbowTarget = -THREE.MathUtils.clamp(bendAngle, 0, 2.53);

  // Elbow is a hinge and also has a maximum flex/extend speed.
  elbowRig.rotation.x = moveScalarToward(
    elbowRig.rotation.x,
    elbowTarget,
    7.4 * dt
  );
  elbowRig.rotation.y = moveScalarToward(elbowRig.rotation.y, 0, 5.5 * dt);
  elbowRig.rotation.z = moveScalarToward(elbowRig.rotation.z, 0, 5.5 * dt);
  constrainElbow(elbowRig);

  // IK never snaps/twists the wrist to cheat the reach.
  wristRig.rotation.x = moveScalarToward(wristRig.rotation.x, 0, 6.0 * dt);
  wristRig.rotation.y = moveScalarToward(wristRig.rotation.y, 0, 6.0 * dt);
  wristRig.rotation.z = moveScalarToward(wristRig.rotation.z, 0, 6.0 * dt);
  constrainWrist(wristRig);
}

function firstAttackIKFrame(p) {
  // 1타는 최단거리 보간이 아니라 세 개의 명확한 키 포즈를 반드시 통과한다.
  // A: 왼쪽 어깨 뒤 준비 -> B: 정면 적을 베는 접촉 -> C: 오른쪽 아래 팔로스루.
  const neutralTarget = new THREE.Vector3(-.56, -.42, .02);
  const windTarget = new THREE.Vector3(.34, 1.08, -.24);
  const contactTarget = new THREE.Vector3(.04, .50, .88);
  const finishTarget = new THREE.Vector3(-.72, -.20, .44);

  const neutralPole = new THREE.Vector3(-.82, .42, .54);
  const windPole = new THREE.Vector3(-.18, 1.00, .42);
  const contactPole = new THREE.Vector3(-.74, .58, .86);
  const finishPole = new THREE.Vector3(-.94, .18, .64);

  let target;
  let pole;
  let hipY;
  let torsoY;
  let torsoX;
  let torsoZ;

  if (p < .34) {
    // 오른쪽 팔꿈치를 크게 접으며 검을 왼쪽 어깨 뒤로 재낀다.
    const t = phase(p, 0, .34);
    target = neutralTarget.clone().lerp(windTarget, t);
    pole = neutralPole.clone().lerp(windPole, t);
    hipY = THREE.MathUtils.lerp(0, -.24, t);
    torsoY = THREE.MathUtils.lerp(0, -.34, t);
    torsoX = THREE.MathUtils.lerp(0, -.035, t);
    torsoZ = THREE.MathUtils.lerp(0, -.035, t);
  } else if (p < .59) {
    // 팔꿈치는 절반 정도 펴지고, 허리는 거의 정면으로 돌아온다.
    // 손/검이 반드시 캐릭터 정면의 적 위치를 통과한다.
    const t = phase(p, .34, .59);
    target = windTarget.clone().lerp(contactTarget, t);
    pole = windPole.clone().lerp(contactPole, t);
    hipY = THREE.MathUtils.lerp(-.24, -.015, t);
    torsoY = THREE.MathUtils.lerp(-.34, -.02, t);
    torsoX = THREE.MathUtils.lerp(-.035, .045, t);
    torsoZ = THREE.MathUtils.lerp(-.035, 0, t);
  } else if (p < .82) {
    // 적을 벤 뒤 오른팔을 거의 다 펴면서 오른쪽 아래까지 크게 내려간다.
    // 허리는 아주 미세하게 오른쪽으로 따라간다.
    const t = phase(p, .59, .82);
    target = contactTarget.clone().lerp(finishTarget, t);
    pole = contactPole.clone().lerp(finishPole, t);
    hipY = THREE.MathUtils.lerp(-.015, .075, t);
    torsoY = THREE.MathUtils.lerp(-.02, .11, t);
    torsoX = THREE.MathUtils.lerp(.045, .07, t);
    torsoZ = THREE.MathUtils.lerp(0, .018, t);
  } else {
    // 마무리 자세에서 자연스럽게 기본 자세로 회수.
    const t = phase(p, .82, 1);
    target = finishTarget.clone().lerp(neutralTarget, t);
    pole = finishPole.clone().lerp(neutralPole, t);
    hipY = THREE.MathUtils.lerp(.075, 0, t);
    torsoY = THREE.MathUtils.lerp(.11, 0, t);
    torsoX = THREE.MathUtils.lerp(.07, 0, t);
    torsoZ = THREE.MathUtils.lerp(.018, 0, t);
  }

  // 중간 타격 구간에서 검끝이 정면 적을 향하도록 별도 블렌드.
  let swordForwardBlend = 0;
  if (p >= .34 && p < .50) {
    swordForwardBlend = phase(p, .34, .50);
  } else if (p >= .50 && p < .64) {
    swordForwardBlend = 1;
  } else if (p >= .64 && p < .80) {
    swordForwardBlend = 1 - phase(p, .64, .80);
  }

  return { target, pole, hipY, torsoY, torsoX, torsoZ, swordForwardBlend };
}

function aimSwordTipForward(blend, dt) {
  const parentWorldQ = new THREE.Quaternion();
  const playerWorldQ = new THREE.Quaternion();
  const desiredWorldQ = new THREE.Quaternion();
  const desiredLocalQ = new THREE.Quaternion();

  swordRoot.parent.getWorldQuaternion(parentWorldQ);
  player.getWorldQuaternion(playerWorldQ);

  const forwardWorld = new THREE.Vector3(0, 0, 1)
    .applyQuaternion(playerWorldQ)
    .normalize();

  desiredWorldQ.setFromUnitVectors(
    new THREE.Vector3(0, -1, 0),
    forwardWorld
  );

  desiredLocalQ
    .copy(parentWorldQ)
    .invert()
    .multiply(desiredWorldQ);

  const blendedTargetQ = swordRestQuaternion.clone()
    .slerp(desiredLocalQ, THREE.MathUtils.clamp(blend, 0, 1));

  rotateQuaternionToward(swordRoot, blendedTargetQ, 10.0, dt);
}

function attackPose(index, p) {
  const wind = phase(p, 0, index === 3 ? .36 : .26);
  const cut = phase(p, index === 3 ? .30 : .20, index === 3 ? .70 : .62);
  const recover = phase(p, index === 3 ? .80 : .72, 1);

  const n = {
    hipY: 0,
    torsoX: 0, torsoY: 0, torsoZ: 0,
    rSX: -.08, rSY: 0, rSZ: -.08,
    rEX: -.18, rEY: 0, rEZ: 0,
    rWX: 0, rWY: 0, rWZ: 0,
    lSX: .08, lSY: 0, lSZ: .08,
    lEX: -.12, lEY: 0, lEZ: 0,
    lWX: 0, lWY: 0, lWZ: 0,
    lTX: 0, rTX: 0,
    lKX: 0, rKX: 0,
    lAX: 0, rAX: 0,
    headX: 0, headY: 0
  };

  let w, h;

  if (index === 0) {
    // 1타 오른손 장검: 오른팔은 아래 animateRig의 IK로 직접 제어.
    // 여기서는 허리/골반/왼팔/하체만 동기화한다.
    w = {
      hipY: .18, torsoX: -.03, torsoY: .28, torsoZ: .04,
      rSX: -.08, rSY: 0, rSZ: -.08,
      rEX: -.18, rEY: 0, rEZ: 0,
      rWX: 0, rWY: 0, rWZ: 0,
      lSX: .18, lSY: -.03, lSZ: .14,
      lEX: -.30, lEY: 0, lEZ: -.03,
      lWX: 0, lWY: 0, lWZ: -.02,
      lTX: .04, rTX: -.07,
      lKX: .06, rKX: .11,
      lAX: .02, rAX: -.04,
      headX: -.01, headY: -.05
    };
    h = {
      hipY: -.07, torsoX: .06, torsoY: -.12, torsoZ: -.02,
      rSX: -.08, rSY: 0, rSZ: -.08,
      rEX: -.18, rEY: 0, rEZ: 0,
      rWX: 0, rWY: 0, rWZ: 0,
      lSX: .02, lSY: .02, lSZ: .08,
      lEX: -.18, lEY: 0, lEZ: .02,
      lWX: 0, lWY: 0, lWZ: .01,
      lTX: -.03, rTX: .05,
      lKX: .09, rKX: .04,
      lAX: -.03, rAX: .02,
      headX: .01, headY: .03
    };
  } else if (index === 1) {
    // 2타: 1타가 끝난 낮은 위치에서 반대 방향으로 올려베기.
    // 손목 뒤집기보다 골반/몸통 회전과 팔꿈치 펴짐을 중심으로.
    w = {
      hipY: .17, torsoX: .07, torsoY: .38, torsoZ: .08,
      rSX: -.72, rSY: .42, rSZ: -.38,
      rEX: -.42, rEY: -.06, rEZ: .08,
      rWX: -.05, rWY: .10, rWZ: .18,
      lSX: -.04, lSY: -.08, lSZ: .12,
      lEX: -.24, lEY: 0, lEZ: -.04,
      lWX: 0, lWY: 0, lWZ: -.03,
      lTX: .07, rTX: -.12, lKX: .06, rKX: .16, lAX: .02, rAX: -.06,
      headX: .02, headY: -.07
    };
    h = {
      hipY: -.18, torsoX: -.04, torsoY: -.42, torsoZ: -.09,
      rSX: -.28, rSY: -.46, rSZ: -1.18,
      rEX: -.24, rEY: .04, rEZ: -.07,
      rWX: .05, rWY: -.11, rWZ: -.20,
      lSX: .22, lSY: .08, lSZ: .20,
      lEX: -.34, lEY: 0, lEZ: .06,
      lWX: 0, lWY: 0, lWZ: .04,
      lTX: -.12, rTX: .08, lKX: .16, rKX: .05, lAX: -.05, rAX: .02,
      headX: -.02, headY: .08
    };
  } else if (index === 2) {
    // 3타: 무릎을 살짝 굽히며 검을 머리 위로 끌어올리고,
    // 하체를 펴면서 정면으로 강하게 내려찍는다.
    w = {
      hipY: -.04, torsoX: -.12, torsoY: -.06, torsoZ: -.01,
      rSX: -.18, rSY: -.08, rSZ: -2.05,
      rEX: -1.05, rEY: .02, rEZ: -.03,
      rWX: .12, rWY: -.02, rWZ: -.05,
      lSX: .38, lSY: .10, lSZ: -.30,
      lEX: -.56, lEY: 0, lEZ: .08,
      lWX: .04, lWY: 0, lWZ: .06,
      lTX: -.20, rTX: -.20, lKX: .48, rKX: .48, lAX: -.12, rAX: -.12,
      headX: -.06, headY: .02
    };
    h = {
      hipY: .03, torsoX: .22, torsoY: .05, torsoZ: .01,
      rSX: -.88, rSY: .06, rSZ: -.12,
      rEX: -.14, rEY: -.01, rEZ: .01,
      rWX: -.08, rWY: .02, rWZ: .04,
      lSX: -.14, lSY: -.08, lSZ: .20,
      lEX: -.24, lEY: 0, lEZ: -.05,
      lWX: 0, lWY: 0, lWZ: -.03,
      lTX: .02, rTX: .02, lKX: .05, rKX: .05, lAX: .06, rAX: .06,
      headX: .08, headY: -.02
    };
  } else {
    // 4타: 무릎-골반-몸통-어깨-팔꿈치-손목 순으로 풀리는 큰 횡베기.
    w = {
      hipY: -.82, torsoX: .12, torsoY: -1.05, torsoZ: -.10,
      rSX: -.82, rSY: -1.28, rSZ: -.94,
      rEX: -1.22, rEY: .18, rEZ: -.24,
      rWX: .16, rWY: -.34, rWZ: -.50,
      lSX: .68, lSY: .30, lSZ: .72,
      lEX: -.82, lEY: 0, lEZ: .28,
      lWX: 0, lWY: 0, lWZ: .18,
      lTX: -.34, rTX: .22, lKX: .52, rKX: .32, lAX: -.16, rAX: .10,
      headX: -.04, headY: .24
    };
    h = {
      hipY: .88, torsoX: .18, torsoY: 1.16, torsoZ: .12,
      rSX: -.68, rSY: 1.36, rSZ: -.62,
      rEX: -.04, rEY: -.14, rEZ: .18,
      rWX: -.14, rWY: .38, rWZ: .46,
      lSX: -.46, lSY: -.30, lSZ: -.60,
      lEX: -.24, lEY: 0, lEZ: -.18,
      lWX: 0, lWY: 0, lWZ: -.14,
      lTX: .20, rTX: -.32, lKX: .12, rKX: .42, lAX: .08, rAX: -.18,
      headX: .06, headY: -.28
    };
  }

  const out = {};
  for (const k of Object.keys(n)) out[k] = keyed(n[k], w[k], h[k], wind, cut, recover);
  return out;
}

// ---------- Self collision ----------
// 전신 전체 롤백 대신, 새로 생긴 관통이 있는 사지 체인만 되돌린다.
// 기본 자세에서 원래 맞닿아 있는 부분은 첫 프레임에 기준 접촉으로 등록한다.
const collisionChains = {
  rightArm: [rightArmRig.shoulder, rightArmRig.elbow, rightArmRig.wrist, swordRoot],
  leftArm: [leftArmRig.shoulder, leftArmRig.elbow, leftArmRig.wrist],
  rightLeg: [rightLegRig.thigh, rightLegRig.knee, rightLegRig.ankle],
  leftLeg: [leftLegRig.thigh, leftLegRig.knee, leftLegRig.ankle]
};

const safeChainPose = {
  rightArm: null,
  leftArm: null,
  rightLeg: null,
  leftLeg: null
};

let baselineCollisionPairs = null;

function captureChain(chainName) {
  return collisionChains[chainName].map(node => node.quaternion.clone());
}

function restoreChain(chainName, pose) {
  if (!pose) return;
  const nodes = collisionChains[chainName];
  for (let i = 0; i < nodes.length; i++) {
    nodes[i].quaternion.copy(pose[i]);
  }
}

function refreshSafeChains() {
  for (const chainName of Object.keys(collisionChains)) {
    safeChainPose[chainName] = captureChain(chainName);
  }
}

function worldPoint(node, x, y, z) {
  return node.localToWorld(new THREE.Vector3(x, y, z));
}

function bodyCapsule(name, node, a, b, radius, chain = null) {
  return {
    name,
    chain,
    a: worldPoint(node, a[0], a[1], a[2]),
    b: worldPoint(node, b[0], b[1], b[2]),
    radius
  };
}

function segmentSegmentDistanceSq(p1, q1, p2, q2) {
  const d1 = q1.clone().sub(p1);
  const d2 = q2.clone().sub(p2);
  const r = p1.clone().sub(p2);
  const a = d1.dot(d1);
  const e = d2.dot(d2);
  const f = d2.dot(r);

  let s;
  let t;

  if (a <= 1e-8 && e <= 1e-8) return p1.distanceToSquared(p2);

  if (a <= 1e-8) {
    s = 0;
    t = THREE.MathUtils.clamp(f / e, 0, 1);
  } else {
    const c0 = d1.dot(r);

    if (e <= 1e-8) {
      t = 0;
      s = THREE.MathUtils.clamp(-c0 / a, 0, 1);
    } else {
      const b0 = d1.dot(d2);
      const denom = a * e - b0 * b0;

      s = denom !== 0
        ? THREE.MathUtils.clamp((b0 * f - c0 * e) / denom, 0, 1)
        : 0;

      t = (b0 * s + f) / e;

      if (t < 0) {
        t = 0;
        s = THREE.MathUtils.clamp(-c0 / a, 0, 1);
      } else if (t > 1) {
        t = 1;
        s = THREE.MathUtils.clamp((b0 - c0) / a, 0, 1);
      }
    }
  }

  const c1 = p1.clone().addScaledVector(d1, s);
  const c2 = p2.clone().addScaledVector(d2, t);
  return c1.distanceToSquared(c2);
}

function buildSelfCollisionCapsules() {
  player.updateMatrixWorld(true);

  return [
    // 몸통/골반은 실제 메시보다 약간 얇게 잡아 "스침"을 관통으로 오인하지 않게 한다.
    bodyCapsule('torso', torsoRig, [0,.24,0], [0,.86,0], .235),
    bodyCapsule('pelvis', hipsRig, [0,-.03,0], [0,.18,0], .245),
    bodyCapsule('head', headRig, [0,.13,0], [0,.40,0], .215),

    bodyCapsule('rUpper', rightArmRig.shoulder, [0,-.17,0], [0,-.57,0], .095, 'rightArm'),
    bodyCapsule('rFore', rightArmRig.elbow, [0,-.14,0], [0,-.52,0], .085, 'rightArm'),
    bodyCapsule('rHand', rightArmRig.hand, [0,-.03,0], [0,-.17,0], .075, 'rightArm'),

    bodyCapsule('lUpper', leftArmRig.shoulder, [0,-.17,0], [0,-.57,0], .095, 'leftArm'),
    bodyCapsule('lFore', leftArmRig.elbow, [0,-.14,0], [0,-.52,0], .085, 'leftArm'),
    bodyCapsule('lHand', leftArmRig.hand, [0,-.03,0], [0,-.17,0], .075, 'leftArm'),

    bodyCapsule('rThigh', rightLegRig.thigh, [0,-.18,0], [0,-.63,0], .125, 'rightLeg'),
    bodyCapsule('rShin', rightLegRig.knee, [0,-.15,0], [0,-.58,0], .110, 'rightLeg'),
    bodyCapsule('rFoot', rightLegRig.ankle, [0,.04,.06], [0,.04,.38], .105, 'rightLeg'),

    bodyCapsule('lThigh', leftLegRig.thigh, [0,-.18,0], [0,-.63,0], .125, 'leftLeg'),
    bodyCapsule('lShin', leftLegRig.knee, [0,-.15,0], [0,-.58,0], .110, 'leftLeg'),
    bodyCapsule('lFoot', leftLegRig.ankle, [0,.04,.06], [0,.04,.38], .105, 'leftLeg'),

    bodyCapsule('sword', swordRoot, [0,-.42,0], [0,-1.76,0], .032, 'rightArm')
  ];
}

const SELF_COLLISION_IGNORES = new Set([
  'head|torso',
  'pelvis|torso',

  // 몸에 정상적으로 붙어 있는 뿌리 부위.
  'rUpper|torso', 'lUpper|torso',
  'pelvis|rThigh', 'pelvis|lThigh',

  // 같은 사지의 연결된 부위.
  'rFore|rUpper', 'rFore|rHand', 'rHand|rUpper',
  'lFore|lUpper', 'lFore|lHand', 'lHand|lUpper',
  'rShin|rThigh', 'rFoot|rShin', 'rFoot|rThigh',
  'lShin|lThigh', 'lFoot|lShin', 'lFoot|lThigh',

  // 검은 오른손에 붙어 있으므로 손/전완 주변 접촉은 정상.
  'rHand|sword', 'rFore|sword'
]);

function collisionPairKey(a, b) {
  return a.name < b.name ? `${a.name}|${b.name}` : `${b.name}|${a.name}`;
}

function currentPenetrations() {
  const capsules = buildSelfCollisionCapsules();
  const hits = [];

  for (let i = 0; i < capsules.length; i++) {
    for (let j = i + 1; j < capsules.length; j++) {
      const a = capsules[i];
      const b = capsules[j];
      const key = collisionPairKey(a, b);
      if (SELF_COLLISION_IGNORES.has(key)) continue;

      // 접촉은 허용, 실제로 꽤 들어갔을 때만 관통으로 판정.
      const contact = Math.max(.01, a.radius + b.radius - .045);

      if (segmentSegmentDistanceSq(a.a, a.b, b.a, b.b) < contact * contact) {
        hits.push({ key, a, b });
      }
    }
  }

  return hits;
}

function chainsFromHit(hit) {
  const chains = new Set();

  if (hit.a.chain) chains.add(hit.a.chain);
  if (hit.b.chain) chains.add(hit.b.chain);

  // 몸통/머리/골반과 부딪힌 경우에는 움직이는 사지 쪽만 되돌린다.
  return chains;
}

function enforceSelfCollision() {
  const hits = currentPenetrations();

  if (baselineCollisionPairs === null) {
    baselineCollisionPairs = new Set(hits.map(hit => hit.key));
    refreshSafeChains();
    return;
  }

  const newHits = hits.filter(hit => !baselineCollisionPairs.has(hit.key));

  if (newHits.length === 0) {
    refreshSafeChains();
    return;
  }

  const blockedChains = new Set();

  for (const hit of newHits) {
    for (const chain of chainsFromHit(hit)) blockedChains.add(chain);
  }

  // 전신 애니메이션은 계속 진행하고, 실제 관통을 만든 사지만 직전 안전 포즈로 되돌린다.
  for (const chain of blockedChains) {
    restoreChain(chain, safeChainPose[chain]);
  }

  player.updateMatrixWorld(true);

  // 되돌린 뒤 안전한 체인들은 다시 현재 포즈를 저장한다.
  const remainingHits = currentPenetrations()
    .filter(hit => !baselineCollisionPairs.has(hit.key));

  const stillBlocked = new Set();
  for (const hit of remainingHits) {
    for (const chain of chainsFromHit(hit)) stillBlocked.add(chain);
  }

  for (const chainName of Object.keys(collisionChains)) {
    if (!stillBlocked.has(chainName)) {
      safeChainPose[chainName] = captureChain(chainName);
    }
  }
}


// ---------- Attack 1 manual key poses ----------
// 현재는 속도보다 궤적 확인이 우선.
// 1) 반대 어깨 위 준비 -> 2) 앞의 적을 천천히 베기 -> 3) 오른쪽 아래로 천천히 팔로스루
const attack1NeutralPose = {
  hipY: 0,
  torsoX: 0, torsoY: 0, torsoZ: 0,

  rSX: -.08, rSY: 0, rSZ: -.08,
  rEX: -.18, rEY: 0, rEZ: 0,
  rWX: 0, rWY: 0, rWZ: 0,

  lSX: .08, lSY: 0, lSZ: .08,
  lEX: -.12, lEY: 0, lEZ: 0,
  lWX: 0, lWY: 0, lWZ: 0,

  lTX: 0, rTX: 0,
  lKX: 0, rKX: 0,
  lAX: 0, rAX: 0,

  headX: 0, headY: 0
};

const attack1LeftShoulderBackPose = {
  ...attack1NeutralPose,

  // 오른손은 반대쪽 어깨 윗면.
  // 팔꿈치는 몸 앞쪽을 보게 유지한다.
  rSX: -1.95,
  rSY: .78,
  rSZ: 1.48,

  rEX: -1.402,
  rEY: 0,
  rEZ: 0,

  rWX: 0,
  rWY: 0,
  rWZ: 0
};

const attack1FrontSlashPose = {
  ...attack1NeutralPose,

  // 허리는 거의 정면으로 돌아오고,
  // 오른팔은 팔꿈치를 절반 정도 펴며 정면의 적을 향해 베어 나간다.
  hipY: .02,
  torsoX: .02,
  torsoY: .02,
  torsoZ: 0,

  rSX: -1.20,
  rSY: .22,
  rSZ: .72,

  rEX: -.72,
  rEY: 0,
  rEZ: 0,

  rWX: -.05,
  rWY: .02,
  rWZ: -.03
};

const attack1FollowThroughPose = {
  ...attack1NeutralPose,

  // 베고 난 뒤 오른팔을 조금 더 펴면서 오른쪽 아래로 빠진다.
  // 끝점에서 손이 몸통보다 아주 살짝 뒤에 남도록 어깨 X만 조정.
  hipY: .10,
  torsoX: .05,
  torsoY: .12,
  torsoZ: .02,

  rSX: .18,
  rSY: -.28,
  rSZ: .10,

  rEX: -.22,
  rEY: 0,
  rEZ: 0,

  rWX: -.08,
  rWY: -.06,
  rWZ: -.08
};

function lerpPose(a, b, t) {
  const out = {};
  for (const key of Object.keys(a)) {
    out[key] = THREE.MathUtils.lerp(a[key], b[key], t);
  }
  return out;
}

function getAttack1Pose(p) {
  // 준비 구간도 느리게.
  if (p < .42) {
    const t = THREE.MathUtils.smoothstep(
      THREE.MathUtils.clamp(p / .42, 0, 1),
      0,
      1
    );
    return lerpPose(attack1NeutralPose, attack1LeftShoulderBackPose, t);
  }

  // 실제 베는 구간도 아직 느리게.
  if (p < .78) {
    const t = THREE.MathUtils.smoothstep(
      THREE.MathUtils.clamp((p - .42) / .36, 0, 1),
      0,
      1
    );
    return lerpPose(attack1LeftShoulderBackPose, attack1FrontSlashPose, t);
  }

  // 베고 난 뒤 오른쪽 아래로 빠진다.
  // 끝에서 힘이 빠지지 않도록 ease-out을 제거하고,
  // 마지막으로 갈수록 조금 더 밀어붙이는 가속형 보간을 쓴다.
  const u = THREE.MathUtils.clamp((p - .78) / .22, 0, 1);
  const t = u * u;
  return lerpPose(attack1FrontSlashPose, attack1FollowThroughPose, t);
}

function applyAttack1Pose(pose, dt) {
  hipsRig.position.y = damp(hipsRig.position.y, 1.7, 12, dt);
  hipsRig.rotation.x = dampAxisLimited(hipsRig.rotation.x, 0, 12, 3.5, dt);
  hipsRig.rotation.y = dampAxisLimited(hipsRig.rotation.y, pose.hipY, 10, 2.6, dt);
  hipsRig.rotation.z = dampAxisLimited(hipsRig.rotation.z, 0, 12, 3.5, dt);

  dampRot(torsoRig, pose.torsoX, pose.torsoY, pose.torsoZ, 10, dt, 2.6);

  // 오른팔은 전 구간 천천히 이동시켜 궤적을 확인한다.
  dampRot(rightArmRig.shoulder, pose.rSX, pose.rSY, pose.rSZ, 9, dt, 1.75);
  dampRot(rightArmRig.elbow, pose.rEX, pose.rEY, pose.rEZ, 9, dt, 2.0);
  dampRot(rightArmRig.wrist, pose.rWX, pose.rWY, pose.rWZ, 9, dt, 1.8);

  // 나머지는 중립에 가깝게 유지.
  dampRot(leftArmRig.shoulder, pose.lSX, pose.lSY, pose.lSZ, 12, dt, 3.5);
  dampRot(leftArmRig.elbow, pose.lEX, pose.lEY, pose.lEZ, 12, dt, 3.5);
  dampRot(leftArmRig.wrist, pose.lWX, pose.lWY, pose.lWZ, 12, dt, 3.5);

  dampRot(leftLegRig.thigh, pose.lTX, 0, 0, 12, dt, 3.5);
  dampRot(rightLegRig.thigh, pose.rTX, 0, 0, 12, dt, 3.5);
  dampRot(leftLegRig.knee, pose.lKX, 0, 0, 12, dt, 3.5);
  dampRot(rightLegRig.knee, pose.rKX, 0, 0, 12, dt, 3.5);
  dampRot(leftLegRig.ankle, pose.lAX, 0, 0, 12, dt, 3.5);
  dampRot(rightLegRig.ankle, pose.rAX, 0, 0, 12, dt, 3.5);

  headRig.rotation.x = dampAxisLimited(headRig.rotation.x, pose.headX, 10, 3.0, dt);
  headRig.rotation.y = dampAxisLimited(headRig.rotation.y, pose.headY, 10, 3.0, dt);

  rotateQuaternionToward(swordRoot, swordRestQuaternion, 5.0, dt);

  applyHumanJointLimits();
}


function animateRig(dt, moving) {
  const speed = 15;
  const run = moving && grounded && dashTime <= 0 && !attack;
  const cycle = elapsed * 9.5;
  const step = run ? Math.sin(cycle) : 0;
  const step2 = run ? Math.sin(cycle + Math.PI) : 0;
  const bob = run ? Math.abs(Math.sin(cycle * .5)) * .045 : Math.sin(elapsed * 1.8) * .012;

  // 1타는 기존 IK/미러/자기충돌 체인을 완전히 우회한다.
  if (attack && attack.index === 0 && !USE_ATTACK_IK) {
    const p = Math.min(1, attack.t / attack.duration);
    applyAttack1Pose(getAttack1Pose(p), dt);
    return;
  }

  hipsRig.position.y = damp(hipsRig.position.y, 1.7 + bob, 10, dt);
  if (!attack) hipsRig.rotation.y = damp(hipsRig.rotation.y, run ? -step * .05 : 0, 10, dt);
  hipsRig.rotation.z = damp(hipsRig.rotation.z, run ? step * .025 : 0, 10, dt);

  let torsoX = run ? .035 : 0;
  let torsoY = 0;
  let torsoZ = run ? -step * .025 : 0;

  let rSX = run ? step2 * .52 : -.08;
  let lSX = run ? step * .52 : .08;
  let rSY = 0, lSY = 0;
  let rSZ = -.08, lSZ = .08;

  // 걷기에서도 팔꿈치가 접혔다 펴지도록 한다.
  let rEX = run ? -.34 - Math.max(0, step2) * .42 : -.18;
  let lEX = run ? -.28 - Math.max(0, step) * .36 : -.12;
  let rEY = 0, lEY = 0;
  let rEZ = run ? step2 * .06 : 0, lEZ = run ? -step * .06 : 0;

  let rWX = 0, rWY = 0, rWZ = run ? -step2 * .08 : 0;
  let lWX = 0, lWY = 0, lWZ = run ? step * .06 : 0;

  let lTX = run ? step * .72 : 0;
  let rTX = run ? step2 * .72 : 0;
  let lKX = run ? Math.max(0, -step) * 1.08 : 0;
  let rKX = run ? Math.max(0, -step2) * 1.08 : 0;
  let lAX = run ? (-Math.max(0, step) * .24 + Math.max(0, -step) * .10) : 0;
  let rAX = run ? (-Math.max(0, step2) * .24 + Math.max(0, -step2) * .10) : 0;

  let headX = 0;
  let headY = 0;

  if (!grounded) {
    torsoX = -.08;
    lTX = -.34;
    rTX = .22;
    lKX = .78;
    rKX = .52;
    lAX = -.18;
    rAX = .08;
    lSX = -.28;
    rSX = -.36;
    lEX = -.70;
    rEX = -.78;
    lWZ = .12;
    rWZ = -.14;
    headX = .08;
  }

  if (dashTime > 0) {
    // 진짜 관절을 쓰는 낮은 질주 자세.
    torsoX = .46;
    torsoY = 0;
    torsoZ = 0;
    hipsRig.position.y = damp(hipsRig.position.y, 1.54, 20, dt);
    hipsRig.rotation.x = damp(hipsRig.rotation.x, .18, 22, dt);

    lTX = -.76;
    rTX = .52;
    lKX = 1.05;
    rKX = .40;
    lAX = -.28;
    rAX = .18;

    lSX = .96;
    rSX = .88;
    lSY = -.12;
    rSY = .14;
    lSZ = .22;
    rSZ = -.26;

    lEX = -.92;
    rEX = -1.06;
    lEZ = .12;
    rEZ = -.14;

    lWX = .12;
    rWX = .18;
    lWZ = .18;
    rWZ = -.22;
    headX = .20;
  } else {
    hipsRig.rotation.x = damp(hipsRig.rotation.x, 0, 12, dt);
  }

  if (attack) {
    const p = Math.min(1, attack.t / attack.duration);
    const pose = attackPose(attack.index, p);

    hipsRig.rotation.y = damp(hipsRig.rotation.y, -pose.hipY, 20, dt);
    torsoX = pose.torsoX;
    torsoY = pose.torsoY;
    torsoZ = pose.torsoZ;

    rSX = pose.rSX; rSY = pose.rSY; rSZ = pose.rSZ;
    rEX = pose.rEX; rEY = pose.rEY; rEZ = pose.rEZ;
    rWX = pose.rWX; rWY = pose.rWY; rWZ = pose.rWZ;

    lSX = pose.lSX; lSY = pose.lSY; lSZ = pose.lSZ;
    lEX = pose.lEX; lEY = pose.lEY; lEZ = pose.lEZ;
    lWX = pose.lWX; lWY = pose.lWY; lWZ = pose.lWZ;

    lTX = pose.lTX; rTX = pose.rTX;
    lKX = pose.lKX; rKX = pose.rKX;
    lAX = pose.lAX; rAX = pose.rAX;
    headX = pose.headX;
    headY = pose.headY;
  }

  // 전체 모션 좌우 미러링:
  // X축 굽힘은 유지하고, 좌우 방향을 만드는 Y/Z 회전만 반전한다.
  torsoY = -torsoY;
  torsoZ = -torsoZ;

  rSY = -rSY; rSZ = -rSZ;
  rEY = -rEY; rEZ = -rEZ;
  rWY = -rWY; rWZ = -rWZ;

  lSY = -lSY; lSZ = -lSZ;
  lEY = -lEY; lEZ = -lEZ;
  lWY = -lWY; lWZ = -lWZ;

  headY = -headY;

  let firstIK = null;
  if (attack && attack.index === 0) {
    const p = Math.min(1, attack.t / attack.duration);
    firstIK = firstAttackIKFrame(p);

    // 1타만은 사용자가 지정한 허리 3단계 경로를 그대로 사용한다.
    torsoX = firstIK.torsoX;
    torsoY = firstIK.torsoY;
    torsoZ = firstIK.torsoZ;
    hipsRig.rotation.y = damp(hipsRig.rotation.y, firstIK.hipY, 24, dt);
  }

  dampRot(torsoRig, torsoX, torsoY, torsoZ, speed, dt);

  if (attack && attack.index === 0) {
    solveTwoBoneArmIK(
      rightArmRig.shoulder,
      rightArmRig.elbow,
      rightArmRig.wrist,
      firstIK.target,
      firstIK.pole,
      'right',
      dt
    );

    // 중간 타격 순간: 검끝이 캐릭터 정면, 즉 적 방향을 정확히 향한다.
    aimSwordTipForward(firstIK.swordForwardBlend, dt);
  } else {
    dampRot(rightArmRig.shoulder, rSX, rSY, rSZ, speed, dt);
    dampRot(rightArmRig.elbow, rEX, rEY, rEZ, speed + 2, dt);
    dampRot(rightArmRig.wrist, rWX, rWY, rWZ, speed + 3, dt);

    rotateQuaternionToward(swordRoot, swordRestQuaternion, 10.0, dt);
  }

  dampRot(leftArmRig.shoulder, lSX, lSY, lSZ, speed, dt);
  dampRot(leftArmRig.elbow, lEX, lEY, lEZ, speed + 2, dt);
  dampRot(leftArmRig.wrist, lWX, lWY, lWZ, speed + 3, dt);

  dampRot(leftLegRig.thigh, lTX, 0, 0, 16, dt);
  dampRot(rightLegRig.thigh, rTX, 0, 0, 16, dt);
  dampRot(leftLegRig.knee, lKX, 0, 0, 18, dt);
  dampRot(rightLegRig.knee, rKX, 0, 0, 18, dt);
  dampRot(leftLegRig.ankle, lAX, 0, 0, 18, dt);
  dampRot(rightLegRig.ankle, rAX, 0, 0, 18, dt);

  headRig.rotation.x = damp(headRig.rotation.x, headX, 10, dt);
  headRig.rotation.y = damp(headRig.rotation.y, headY, 10, dt);

  // 어떤 애니메이션/IK도 이 선을 넘어 인간 관절 범위를 벗어날 수 없다.
  applyHumanJointLimits();

  // 모션 실루엣 확정 전까지 자기충돌은 꺼둔다.
  if (USE_SELF_COLLISION) enforceSelfCollision();
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
  updateDashWind();

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
