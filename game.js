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

const skinMat = new THREE.MeshStandardMaterial({ color: 0xe4bda1, roughness: .72 });
const clothMat = new THREE.MeshStandardMaterial({ color: 0x263a55, roughness: .78 });
const leatherMat = new THREE.MeshStandardMaterial({ color: 0x49382d, roughness: .8 });
const metalMat = new THREE.MeshStandardMaterial({ color: 0xbfc4c7, metalness: .72, roughness: .28 });

const player = new THREE.Group();
scene.add(player);
player.position.set(0, 0, 8);
player.rotation.y = Math.PI;

mesh(new THREE.CapsuleGeometry(.48, .9, 5, 10), clothMat, player, [0, 1.45, 0]);
mesh(new THREE.SphereGeometry(.34, 16, 12), skinMat, player, [0, 2.55, 0]);
mesh(new THREE.BoxGeometry(.82, .12, .5), leatherMat, player, [0, 1.18, 0]);

const leftArm = new THREE.Group();
leftArm.position.set(-.54, 2.0, 0);
player.add(leftArm);
mesh(new THREE.CapsuleGeometry(.13, .58, 4, 7), clothMat, leftArm, [0, -.36, 0]);

const rightArm = new THREE.Group();
rightArm.position.set(.54, 2.0, 0);
player.add(rightArm);
mesh(new THREE.CapsuleGeometry(.13, .58, 4, 7), clothMat, rightArm, [0, -.36, 0]);

const swordRoot = new THREE.Group();
swordRoot.position.set(0, -.65, .02);
rightArm.add(swordRoot);
mesh(new THREE.BoxGeometry(.12, .09, .36), leatherMat, swordRoot, [0, -.04, .05]);
mesh(new THREE.BoxGeometry(.08, 1.45, .12), metalMat, swordRoot, [0, -.77, .12], [0, 0, .05]);
mesh(new THREE.BoxGeometry(.45, .06, .11), metalMat, swordRoot, [0, -.12, .1]);

const leftLeg = new THREE.Group();
leftLeg.position.set(-.24, .98, 0);
player.add(leftLeg);
mesh(new THREE.CapsuleGeometry(.16, .72, 4, 7), leatherMat, leftLeg, [0, -.48, 0]);

const rightLeg = new THREE.Group();
rightLeg.position.set(.24, .98, 0);
player.add(rightLeg);
mesh(new THREE.CapsuleGeometry(.16, .72, 4, 7), leatherMat, rightLeg, [0, -.48, 0]);

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
const DASH_DURATION = .22;
const DASH_SPEED = 18.5;
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
  { duration: .34, hitAt: .16, damage: 10, range: 2.35, arc: 1.55, swing: [-1.1, .85] },
  { duration: .34, hitAt: .16, damage: 12, range: 2.45, arc: 1.7, swing: [.9, -1.05] },
  { duration: .38, hitAt: .18, damage: 14, range: 2.5, arc: 1.7, swing: [-.7, .8] },
  { duration: .52, hitAt: .23, damage: 22, range: 3.15, arc: 2.55, swing: [-1.55, 1.55], finisher: true }
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
  const right = new THREE.Vector3(forward.z, 0, -forward.x);
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

  const walk = moving && grounded && dashTime <= 0 ? Math.sin(elapsed * 10) * .55 : 0;
  if (!attack) {
    rightArm.rotation.x = walk * .35;
    leftArm.rotation.x = -walk * .35;
  }
  leftLeg.rotation.x = -walk;
  rightLeg.rotation.x = walk;

  if (attack) {
    attack.t += dt;
    const p = Math.min(1, attack.t / attack.duration);
    const eased = THREE.MathUtils.smoothstep(p, 0, 1);
    const ang = THREE.MathUtils.lerp(attack.swing[0], attack.swing[1], eased);
    rightArm.rotation.z = -.22;
    rightArm.rotation.x = -.55 + Math.sin(p * Math.PI) * -.38;
    rightArm.rotation.y = ang;

    if (!attack.hit && attack.t >= attack.hitAt) {
      attack.hit = true;
      testAttackHit(attack);
    }

    if (attack.t >= attack.duration) {
      const was = attack.index;
      attack = null;
      rightArm.rotation.set(0, 0, 0);
      comboExpire = performance.now() / 1000 + .55;
      if (queuedAttack && was < 3) startAttack(was + 1);
      else if (was === 3) {
        comboNext = 0;
        queuedAttack = false;
      }
    }
  }
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
  const height = 2.9;
  const horizontal = Math.cos(cameraPitch) * dist;
  const desired = new THREE.Vector3(
    player.position.x + Math.sin(cameraYaw) * horizontal,
    player.position.y + height + Math.sin(cameraPitch) * dist,
    player.position.z + Math.cos(cameraYaw) * horizontal
  );

  const smooth = 1 - Math.pow(.001, dt);
  camera.position.lerp(desired, smooth);

  const look = tmpV.copy(player.position).add(new THREE.Vector3(0, 1.55, 0));
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
