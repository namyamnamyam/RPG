import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';

const gameEl = document.getElementById('game');
const dashPipsEl = document.getElementById('dash-pips');
const hpEl = document.getElementById('dummy-hp');
const playerHpEl = document.getElementById('player-hp');
const dummyModeBtn = document.getElementById('dummy-mode');
const autoBtn = document.getElementById('auto-btn');
const lockBtn = document.getElementById('lock-btn');
const weaponSwitchBtn = document.getElementById('weapon-switch');
const attackBtn = document.getElementById('attack-btn');
const skillDashSlashBtn = document.getElementById('skill-dash-slash');
const skillSwordWaveBtn = document.getElementById('skill-sword-wave');
const skillSpinBtn = document.getElementById('skill-spin');
const lockMarker = document.getElementById('lock-marker');
const toast = document.getElementById('toast');

// iPad/Safari에서 빠른 연타가 브라우저 더블탭 확대를 일으키지 않게 한다.
document.addEventListener('dblclick', e => {
  e.preventDefault();
}, { passive: false });

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

// Blender에서 만든 실제 스킨드 캐릭터 테스트.
// 첫 검증 단계에서는 기존 전투/충돌/카메라 로직은 그대로 두고,
// 외형만 GLB로 교체한 뒤 본을 코드에서 직접 움직인다.
const importedPlayerPivot = new THREE.Group();
player.add(importedPlayerPivot);

let importedPlayerVisual = null;
let importedPlayerReady = false;
const importedBones = {};
const importedRest = {};

const PLAYER_MODEL_PARTS = [
  '/assets/player-test/part00.b64',
  '/assets/player-test/part01.b64',
  '/assets/player-test/part02.b64',
  '/assets/player-test/part03.b64',
  '/assets/player-test/part04.b64',
  '/assets/player-test/part05.b64',
  '/assets/player-test/part06.b64',
  '/assets/player-test/part07.b64',
  '/assets/player-test/part08.b64',
  '/assets/player-test/part09.b64',
  '/assets/player-test/part10.b64',
  '/assets/player-test/part11.b64',
  '/assets/player-test/part12.b64',
  '/assets/player-test/part13.b64'
];

async function loadPlayerTestBuffer() {
  const parts = await Promise.all(PLAYER_MODEL_PARTS.map(async url => {
    const response = await fetch(url, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`player asset fetch failed: ${url} ${response.status}`);
    return (await response.text()).trim();
  }));

  const b64 = parts.join('');
  if (b64.length !== 69876) {
    throw new Error(`player asset length mismatch: ${b64.length}`);
  }

  const binary = atob(b64);
  const zipped = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) zipped[i] = binary.charCodeAt(i);

  if (!('DecompressionStream' in window)) {
    throw new Error('This browser does not support gzip DecompressionStream.');
  }

  const stream = new Blob([zipped])
    .stream()
    .pipeThrough(new DecompressionStream('gzip'));
  const buffer = await new Response(stream).arrayBuffer();

  if (buffer.byteLength !== 104308) {
    throw new Error(`player GLB size mismatch: ${buffer.byteLength}`);
  }

  return buffer;
}

const importedPoseEuler = new THREE.Euler();
const importedPoseDelta = new THREE.Quaternion();
const importedPoseTarget = new THREE.Quaternion();

function poseImportedBone(name, x, y, z, dt, rate = 14) {
  const bone = importedBones[name];
  const rest = importedRest[name];
  if (!bone || !rest) return;

  importedPoseEuler.set(x, y, z, 'XYZ');
  importedPoseDelta.setFromEuler(importedPoseEuler);
  importedPoseTarget.copy(rest).multiply(importedPoseDelta);
  bone.quaternion.slerp(importedPoseTarget, 1 - Math.exp(-rate * dt));
}

function animateImportedPlayer(dt, moving) {
  if (!importedPlayerReady) return;

  const locomotionAllowed =
    playerAlive &&
    !attack &&
    !skillAction &&
    !bowAttack &&
    !staffAttack &&
    dashTime <= 0;

  const walk = locomotionAllowed && moving && grounded;
  const cycle = elapsed * 8.8;
  const swing = walk ? Math.sin(cycle) : 0;
  const idle = locomotionAllowed && !moving
    ? Math.sin(elapsed * 1.75) * .018
    : 0;

  const armSwing = swing * .42;
  const legSwing = swing * .52;
  const kneeL = walk ? Math.max(0, -swing) * .58 : 0;
  const kneeR = walk ? Math.max(0, swing) * .58 : 0;

  // Blender metarig의 rest quaternion에 작은 로컬 회전을 더한다.
  // 애니메이션 클립 없이도 실제 스킨/본이 런타임에서 변형되는지 보는 1차 테스트.
  poseImportedBone('upper_arm.L', armSwing, 0, 0, dt);
  poseImportedBone('upper_arm.R', -armSwing, 0, 0, dt);
  poseImportedBone('forearm.L', .10 + Math.max(0, -swing) * .12, 0, 0, dt);
  poseImportedBone('forearm.R', .10 + Math.max(0, swing) * .12, 0, 0, dt);

  poseImportedBone('thigh.L', -legSwing, 0, 0, dt);
  poseImportedBone('thigh.R', legSwing, 0, 0, dt);
  poseImportedBone('shin.L', kneeL, 0, 0, dt);
  poseImportedBone('shin.R', kneeR, 0, 0, dt);

  poseImportedBone('spine.001', idle, 0, walk ? swing * .025 : 0, dt, 10);
  poseImportedBone('spine.002', idle * .65, 0, walk ? -swing * .018 : 0, dt, 10);

  if (!locomotionAllowed) {
    // 기존 공격/스킬 테스트 중에는 새 모델이 기괴한 걷기 포즈에 남지 않게 rest 쪽으로 복귀.
    for (const name of [
      'upper_arm.L','upper_arm.R','forearm.L','forearm.R',
      'thigh.L','thigh.R','shin.L','shin.R','spine.001','spine.002'
    ]) poseImportedBone(name, 0, 0, 0, dt, 18);
  }
}

async function loadImportedPlayer() {
  let model = null;

  try {
    const buffer = await loadPlayerTestBuffer();
    const loader = new GLTFLoader();
    const gltf = await loader.parseAsync(buffer, '');

    model = gltf.scene;
    model.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const scale = 3.25 / Math.max(size.y, .001);
    model.scale.setScalar(scale);
    model.updateMatrixWorld(true);

    const fittedBox = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    fittedBox.getCenter(center);
    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= fittedBox.min.y;

    importedPlayerPivot.add(model);
    importedPlayerVisual = model;

    // 여기까지 왔으면 "신형 외형 표시" 자체는 성공.
    // 이후 본 매핑/애니메이션 쪽 오류 때문에 이미 뜬 GLB를 지우지 않는다.
    setLegacyPlayerVisible(false);

    model.traverse(obj => {
      if (obj.isBone) {
        importedBones[obj.name] = obj;
        importedRest[obj.name] = obj.quaternion.clone();
      }
      if (obj.isMesh || obj.isSkinnedMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        obj.frustumCulled = false;
        obj.visible = true;
      }
    });

    const required = [
      'upper_arm.L','upper_arm.R','forearm.L','forearm.R',
      'thigh.L','thigh.R','shin.L','shin.R'
    ];
    const missing = required.filter(name => !importedBones[name]);

    importedPlayerReady = missing.length === 0;
    updateEquipmentUI();

    if (missing.length) {
      console.warn('[player-test] GLB visible, bone mapping incomplete', missing);
      showToast('신형 캐릭터 표시됨 · 본 매핑 일부 실패');
    } else {
      showToast('신형 캐릭터 · 코드 모션 ON');
    }

    console.info('[player-test] GLB visible', {
      bones: Object.keys(importedBones).length,
      missing,
      scale,
      model
    });
  } catch (error) {
    console.error('[player-test] visual load failed', error);

    // GLB 파싱/추가 자체가 실패했을 때만 구형 외형으로 돌아간다.
    // 이미 scene에 올라간 신형 모델은 어떤 후속 오류가 있어도 제거하지 않는다.
    if (!model || !model.parent) {
      importedPlayerVisual = null;
      importedPlayerReady = false;
      setLegacyPlayerVisible(true);
      updateEquipmentUI();
      showToast('신형 캐릭터 로드 실패 · 기존 모델 유지');
    } else {
      importedPlayerVisual = model;
      setLegacyPlayerVisible(false);
      updateEquipmentUI();
      showToast('신형 캐릭터 표시됨 · 코드 모션 점검 필요');
    }
  }
}

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

// 두 번째 장비: 코드로 만든 기본 활.
// 활은 왼손에 고정하고, 오른손은 발사 모션에서 시위를 당기는 역할.
const bowRoot = new THREE.Group();
bowRoot.position.set(0, -.10, 0);
leftArmRig.hand.add(bowRoot);

const bowWoodMat = new THREE.MeshStandardMaterial({ color: 0x7a4d2a, roughness: .78 });
const bowGripMat = new THREE.MeshStandardMaterial({ color: 0x35271e, roughness: .88 });

// 손이 활 중앙 손잡이를 정확히 잡도록 활 자체를 손잡이 기준으로 재중심화.
const bowCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-.31, .78, 0),
  new THREE.Vector3(-.13, .52, 0),
  new THREE.Vector3(-.02, .18, 0),
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(-.02, -.18, 0),
  new THREE.Vector3(-.13, -.52, 0),
  new THREE.Vector3(-.31, -.78, 0)
]);
mesh(new THREE.TubeGeometry(bowCurve, 32, .035, 7, false), bowWoodMat, bowRoot, [0, 0, 0]);
mesh(new THREE.BoxGeometry(.12, .30, .10), bowGripMat, bowRoot, [0, 0, 0]);

const bowString = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-.31, .78, 0),
    new THREE.Vector3(-.31, 0, 0),
    new THREE.Vector3(-.31, -.78, 0)
  ]),
  new THREE.LineBasicMaterial({ color: 0xe8e0d2, transparent: true, opacity: .92 })
);
bowRoot.add(bowString);

// 현재 캐릭터 체격에 맞춰 기존보다 크게.
bowRoot.scale.setScalar(1.4);
bowRoot.visible = false;

const bowParentWorldQ = new THREE.Quaternion();
const bowDesiredWorldQ = new THREE.Quaternion();
const bowYAxis = new THREE.Vector3(0, 1, 0);

function updateBowVisual(draw = 0) {
  if (equippedWeapon !== 'bow') return;

  // 손 위치는 그대로 따라가지만, 활의 긴 축은 항상 세로를 유지한다.
  // 따라서 팔이 앞으로 뻗어도 활이 팔 축을 따라 눕지 않는다.
  leftArmRig.hand.updateWorldMatrix(true, false);
  leftArmRig.hand.getWorldQuaternion(bowParentWorldQ);

  bowDesiredWorldQ.setFromAxisAngle(bowYAxis, player.rotation.y);
  bowRoot.quaternion
    .copy(bowParentWorldQ)
    .invert()
    .multiply(bowDesiredWorldQ);

  const pull = THREE.MathUtils.clamp(draw, 0, 1) * .52;
  bowString.geometry.setFromPoints([
    new THREE.Vector3(-.31, .78, 0),
    new THREE.Vector3(-.31, 0, -pull),
    new THREE.Vector3(-.31, -.78, 0)
  ]);
  bowString.geometry.attributes.position.needsUpdate = true;
}

// 세 번째 장비: 기본 지팡이.
const staffRoot = new THREE.Group();
staffRoot.position.set(.02, -.14, .02);
rightArmRig.hand.add(staffRoot);

const staffWoodMat = new THREE.MeshStandardMaterial({ color: 0x65452e, roughness: .82 });
const staffBandMat = new THREE.MeshStandardMaterial({ color: 0x7f8790, metalness: .55, roughness: .34 });
const staffOrbMat = new THREE.MeshStandardMaterial({
  color: 0xff7a2a,
  emissive: 0xff3b00,
  emissiveIntensity: 1.6,
  roughness: .34
});
mesh(new THREE.CylinderGeometry(.055, .065, 1.72, 9), staffWoodMat, staffRoot, [0, -.82, 0]);
mesh(new THREE.CylinderGeometry(.085, .085, .14, 9), staffBandMat, staffRoot, [0, -1.55, 0]);
mesh(new THREE.SphereGeometry(.16, 12, 9), staffOrbMat, staffRoot, [0, -1.72, 0]);
staffRoot.rotation.z = .03;
staffRoot.visible = false;

function setLegacyPlayerVisible(visible) {
  // 부모 그룹만 숨긴다. 자식 파츠의 visible 상태는 장비 시스템이 관리하게 둔다.
  // 이렇게 해야 새 GLB 테스트 중 구형 외형만 사라지고, 롤백 시 장비 상태도 정상 복원된다.
  hipsRig.visible = visible;
}

let equippedWeapon = 'sword';
let bowAttack = null;
let bowAttackCooldown = 0;
const arrows = [];
const BOW_ATTACK_COOLDOWN = .58;
const BOW_ATTACK_DAMAGE = 18;
const BOW_ARROW_SPEED = 22;

let staffAttack = null;
let staffAttackCooldown = 0;
const STAFF_ATTACK_COOLDOWN = .52;

function updateEquipmentUI() {
  const swordEquipped = equippedWeapon === 'sword';
  const bowEquipped = equippedWeapon === 'bow';
  const staffEquipped = equippedWeapon === 'staff';

  const usingImportedPlayer = !!importedPlayerVisual;
  const showLegacyEquipment = !usingImportedPlayer && hipsRig.visible;
  swordRoot.visible = showLegacyEquipment && swordEquipped;
  bowRoot.visible = showLegacyEquipment && bowEquipped;
  staffRoot.visible = showLegacyEquipment && staffEquipped;

  if (weaponSwitchBtn) {
    const names = { sword: '장비: 장검', bow: '장비: 활', staff: '장비: 지팡이' };
    weaponSwitchBtn.textContent = names[equippedWeapon];
    weaponSwitchBtn.classList.toggle('bow-equipped', bowEquipped);
    weaponSwitchBtn.classList.toggle('staff-equipped', staffEquipped);
  }

  if (attackBtn) {
    attackBtn.textContent = swordEquipped ? 'ATK' : bowEquipped ? 'SHOT' : 'CAST';
  }

  updateSkillUI();
}

function equipWeapon(type) {
  if (!['sword', 'bow', 'staff'].includes(type)) return;
  if (type === equippedWeapon) return;
  if (!playerAlive || skillAction || attack || bowAttack || staffAttack || dashTime > 0) return;

  equippedWeapon = type;
  comboNext = 0;
  comboExpire = 0;
  queuedAttack = false;

  updateEquipmentUI();

  const names = { sword: '장검 장착', bow: '활 장착', staff: '지팡이 장착' };
  showToast(names[type]);
}

function toggleWeapon() {
  const order = ['sword', 'bow', 'staff'];
  const next = (order.indexOf(equippedWeapon) + 1) % order.length;
  equipWeapon(order[next]);
}

function getBowAimDirection() {
  const origin = player.position.clone().add(new THREE.Vector3(0, 1.48, 0));

  if (locked && dummyAlive) {
    const target = dummy.position.clone().add(new THREE.Vector3(0, 1.05, 0));
    return target.sub(origin).normalize();
  }

  return playerForward(new THREE.Vector3()).normalize();
}

function disposeArrow(helper) {
  scene.remove(helper);
  if (helper.line) {
    helper.line.geometry.dispose();
    helper.line.material.dispose();
  }
  if (helper.cone) {
    helper.cone.geometry.dispose();
    helper.cone.material.dispose();
  }
}

function spawnArrow(dir) {
  const origin = player.position.clone()
    .add(new THREE.Vector3(0, 1.48, 0))
    .addScaledVector(dir, .72);

  const helper = new THREE.ArrowHelper(
    dir,
    origin,
    1.55,
    0xd9c08b,
    .30,
    .13
  );
  scene.add(helper);

  arrows.push({
    helper,
    dir: dir.clone(),
    life: 1.35,
    hit: false
  });
}

function tryBowAttack() {
  if (equippedWeapon !== 'bow') return;
  if (!playerAlive || skillAction || attack || bowAttack || dashTime > 0) return;
  if (bowAttackCooldown > 0) return;

  const dir = getBowAimDirection();
  const flatDir = dir.clone().setY(0);
  if (flatDir.lengthSq() > .001) {
    flatDir.normalize();
    playerYaw = Math.atan2(flatDir.x, flatDir.z);
    player.rotation.y = playerYaw;
  }

  bowAttack = {
    t: 0,
    duration: .56,
    fired: false,
    dir
  };
  bowAttackCooldown = BOW_ATTACK_COOLDOWN;
}

function updateBowSystem(dt) {
  bowAttackCooldown = Math.max(0, bowAttackCooldown - dt);

  if (bowAttack) {
    bowAttack.t += dt;

    if (!bowAttack.fired && bowAttack.t >= .30) {
      bowAttack.fired = true;
      spawnArrow(bowAttack.dir);
    }

    if (bowAttack.t >= bowAttack.duration) {
      bowAttack = null;
    }
  }

  for (let i = arrows.length - 1; i >= 0; i--) {
    const arrow = arrows[i];
    arrow.life -= dt;
    arrow.helper.position.addScaledVector(arrow.dir, BOW_ARROW_SPEED * dt);

    if (!arrow.hit && dummyAlive) {
      const target = dummy.position.clone().add(new THREE.Vector3(0, 1.0, 0));
      if (arrow.helper.position.distanceToSquared(target) <= .86 * .86) {
        arrow.hit = true;
        damageDummy(BOW_ATTACK_DAMAGE, false);
      }
    }

    if (arrow.hit || arrow.life <= 0) {
      disposeArrow(arrow.helper);
      arrows.splice(i, 1);
    }
  }
}
 
function tryStaffAttack() {
  if (equippedWeapon !== 'staff') return;
  if (!playerAlive || skillAction || attack || bowAttack || staffAttack || dashTime > 0) return;
  if (staffAttackCooldown > 0) return;

  const dir = skillAimDirection();
  const flat = dir.clone().setY(0);
  if (flat.lengthSq() > .001) {
    flat.normalize();
    playerYaw = Math.atan2(flat.x, flat.z);
    player.rotation.y = playerYaw;
  }

  staffAttack = { t: 0, duration: .34, fired: false, dir };
  staffAttackCooldown = STAFF_ATTACK_COOLDOWN;
}

function updateStaffSystem(dt) {
  staffAttackCooldown = Math.max(0, staffAttackCooldown - dt);

  if (!staffAttack) return;

  staffAttack.t += dt;
  if (!staffAttack.fired && staffAttack.t >= .14) {
    staffAttack.fired = true;
    spawnSkillArrow(staffAttack.dir, {
      speed: 22,
      damage: 11,
      color: 0xc9a0ff,
      scale: .78,
      life: 1.2
    });
  }

  if (staffAttack.t >= staffAttack.duration) staffAttack = null;
}

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

function createGoblin() {
  const g = new THREE.Group();

  const green = new THREE.MeshStandardMaterial({ color: 0x6f8f3d, roughness: .88 });
  const greenDark = new THREE.MeshStandardMaterial({ color: 0x4d6c2d, roughness: .92 });
  const tunic = new THREE.MeshStandardMaterial({ color: 0x5b3b27, roughness: .92 });
  const belt = new THREE.MeshStandardMaterial({ color: 0x30251e, roughness: .95 });
  const goblinMetal = new THREE.MeshStandardMaterial({ color: 0x9ca3a5, metalness: .58, roughness: .38 });
  const eye = new THREE.MeshStandardMaterial({ color: 0xe9d04c, emissive: 0x5a4300, emissiveIntensity: .35 });

  const torso = new THREE.Group();
  torso.position.set(0, 1.02, 0);
  g.add(torso);
  mesh(new THREE.BoxGeometry(.70, .72, .42), tunic, torso, [0, 0, 0]);
  mesh(new THREE.BoxGeometry(.76, .11, .46), belt, torso, [0, -.25, 0]);

  const head = new THREE.Group();
  head.position.set(0, .63, 0);
  torso.add(head);
  const headMesh = mesh(new THREE.SphereGeometry(.31, 12, 9), green, head, [0, 0, 0]);
  headMesh.scale.set(1.0, .88, .90);

  // 길고 뾰족한 귀.
  mesh(new THREE.ConeGeometry(.11, .42, 6), greenDark, head, [-.38, .02, 0], [0, 0, Math.PI / 2]);
  mesh(new THREE.ConeGeometry(.11, .42, 6), greenDark, head, [.38, .02, 0], [0, 0, -Math.PI / 2]);

  mesh(new THREE.SphereGeometry(.045, 8, 6), eye, head, [-.12, .04, .27]);
  mesh(new THREE.SphereGeometry(.045, 8, 6), eye, head, [.12, .04, .27]);

  const leftArm = new THREE.Group();
  leftArm.position.set(.43, 1.26, 0);
  g.add(leftArm);
  mesh(new THREE.CapsuleGeometry(.105, .38, 4, 7), green, leftArm, [0, -.29, 0]);

  const rightArm = new THREE.Group();
  rightArm.position.set(-.43, 1.26, 0);
  g.add(rightArm);
  mesh(new THREE.CapsuleGeometry(.105, .38, 4, 7), green, rightArm, [0, -.29, 0]);

  const swordPivot = new THREE.Group();
  swordPivot.position.set(0, -.58, 0);
  rightArm.add(swordPivot);
  mesh(new THREE.BoxGeometry(.10, .22, .10), belt, swordPivot, [0, -.06, 0]);
  mesh(new THREE.BoxGeometry(.065, .78, .06), goblinMetal, swordPivot, [0, -.52, 0]);
  mesh(new THREE.BoxGeometry(.34, .07, .09), goblinMetal, swordPivot, [0, -.16, 0]);

  const leftLeg = new THREE.Group();
  leftLeg.position.set(.20, .66, 0);
  g.add(leftLeg);
  mesh(new THREE.CapsuleGeometry(.12, .34, 4, 7), greenDark, leftLeg, [0, -.27, 0]);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(-.20, .66, 0);
  g.add(rightLeg);
  mesh(new THREE.CapsuleGeometry(.12, .34, 4, 7), greenDark, rightLeg, [0, -.27, 0]);

  // 공격 직전 바닥에 뜨는 짧은 예고 링.
  const telegraph = new THREE.Mesh(
    new THREE.RingGeometry(.78, .96, 32),
    new THREE.MeshBasicMaterial({
      color: 0xff453a,
      transparent: true,
      opacity: .42,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  telegraph.rotation.x = -Math.PI / 2;
  telegraph.position.y = .025;
  telegraph.visible = false;
  g.add(telegraph);

  g.userData.rig = { torso, head, leftArm, rightArm, swordPivot, leftLeg, rightLeg, telegraph };
  g.position.set(0, 0, -2.5);
  scene.add(g);
  return g;
}

const dummy = createGoblin();
const GOBLIN_MAX_HP = 70;
const GOBLIN_AGGRO = 12.5;
const GOBLIN_SPEED = 3.4;
const GOBLIN_ATTACK_RANGE = 1.90;
const GOBLIN_ATTACK_DURATION = 1.05;
const GOBLIN_HIT_AT = .53;
const GOBLIN_DAMAGE = 12;

let dummyHP = GOBLIN_MAX_HP;
let dummyAlive = true;
let dummyRespawn = 0;
let dummyFlash = 0;
let dummyState = 'chase';
let dummyAttackT = 0;
let dummyAttackHit = false;
let dummyAttackCooldown = .55;
let dummyStun = 0;
let dummyWalkPhase = 0;

const PLAYER_MAX_HP = 100;
let playerHP = PLAYER_MAX_HP;
let playerAlive = true;
let playerRespawn = 0;

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

const skillDefs = {
  // 장검
  dashSlash:  { weapon: 'sword', name: '돌진베기', cooldown: 3.2, duration: .56 },
  swordWave:  { weapon: 'sword', name: '검기', cooldown: 4.2, duration: .52 },
  spinSlash:  { weapon: 'sword', name: '회전격', cooldown: 5.6, duration: .72 },

  // 활
  rapidFire:  { weapon: 'bow', name: '난사', cooldown: 4.6, duration: 1.05 },
  powerShot:  { weapon: 'bow', name: '파워샷', cooldown: 5.2, duration: .82 },
  arrowRain:  { weapon: 'bow', name: '화살비', cooldown: 7.5, duration: 1.35 },

  // 지팡이
  fireball:   { weapon: 'staff', name: '파이어볼', cooldown: 4.8, duration: .66 },
  fireArrow:  { weapon: 'staff', name: '파이어 애로우', cooldown: 3.3, duration: .48 },
  fireWall:   { weapon: 'staff', name: '파이어 월', cooldown: 7.0, duration: .74 }
};

const weaponSkillSlots = {
  sword: ['dashSlash', 'swordWave', 'spinSlash'],
  bow: ['rapidFire', 'powerShot', 'arrowRain'],
  staff: ['fireball', 'fireArrow', 'fireWall']
};

const skillCooldowns = Object.fromEntries(
  Object.keys(skillDefs).map(key => [key, 0])
);

const skillButtons = [
  skillDashSlashBtn,
  skillSwordWaveBtn,
  skillSpinBtn
];

let skillAction = null;
const skillProjectiles = [];
const skillAreas = [];

function currentSkillKey(slot) {
  return weaponSkillSlots[equippedWeapon]?.[slot] || null;
}

function updateSkillUI() {
  const slots = weaponSkillSlots[equippedWeapon] || [];

  skillButtons.forEach((btn, slot) => {
    const type = slots[slot];
    const def = skillDefs[type];
    if (!def) return;

    const label = btn.querySelector('span');
    const cd = btn.querySelector('.skill-cd');
    const left = Math.max(0, skillCooldowns[type]);
    const cooling = left > .04;

    if (label) label.textContent = def.name;
    btn.classList.toggle('cooling', cooling);
    btn.classList.remove('weapon-locked');
    btn.disabled = cooling || !playerAlive;

    if (cd) cd.textContent = cooling ? left.toFixed(1) : 'READY';
  });
}

function canStartSkill(type) {
  const def = skillDefs[type];
  if (!def || def.weapon !== equippedWeapon) return false;
  if (!playerAlive || skillAction || attack || bowAttack || staffAttack || dashTime > 0) return false;
  return skillCooldowns[type] <= 0;
}

function skillAimDirection(originY = 1.35) {
  const origin = player.position.clone().add(new THREE.Vector3(0, originY, 0));

  if (dummyAlive && locked) {
    return dummy.position.clone()
      .add(new THREE.Vector3(0, 1.0, 0))
      .sub(origin)
      .normalize();
  }

  return playerForward(new THREE.Vector3()).normalize();
}

function startSkill(type) {
  if (!canStartSkill(type)) return;

  const def = skillDefs[type];
  const dir = skillAimDirection();
  const flatDir = dir.clone().setY(0);
  if (flatDir.lengthSq() > .001) {
    flatDir.normalize();
    playerYaw = Math.atan2(flatDir.x, flatDir.z);
    player.rotation.y = playerYaw;
  }

  const forwardPoint = player.position.clone()
    .addScaledVector(flatDir.lengthSq() > .001 ? flatDir : playerForward(new THREE.Vector3()), 5.2);

  skillAction = {
    type,
    weapon: def.weapon,
    t: 0,
    duration: def.duration,
    hit: false,
    spawned: false,
    count: 0,
    nextShot: 0,
    dir,
    baseYaw: playerYaw,
    targetPoint: dummyAlive && locked
      ? dummy.position.clone()
      : forwardPoint
  };

  skillCooldowns[type] = def.cooldown;
  attack = null;
  bowAttack = null;
  staffAttack = null;
  queuedAttack = false;
  comboNext = 0;
  comboExpire = 0;

  showToast(def.name);
  updateSkillUI();
}

function startSkillSlot(slot) {
  const type = currentSkillKey(slot);
  if (type) startSkill(type);
}

function hitEnemyCone(range, arc, damage, finisher = false) {
  if (!dummyAlive) return false;

  const to = dummy.position.clone().sub(player.position).setY(0);
  const dist = to.length();
  if (dist > range || dist <= .001) return false;

  to.normalize();
  const forward = playerForward(new THREE.Vector3());
  const angle = Math.acos(THREE.MathUtils.clamp(forward.dot(to), -1, 1));
  if (angle > arc * .5) return false;

  damageDummy(damage, finisher);
  return true;
}

function disposeArrowHelper(helper) {
  scene.remove(helper);
  if (helper.line) {
    helper.line.geometry.dispose();
    helper.line.material.dispose();
  }
  if (helper.cone) {
    helper.cone.geometry.dispose();
    helper.cone.material.dispose();
  }
}

function spawnSkillArrow(dir, options = {}) {
  const {
    speed = 22,
    damage = 12,
    color = 0xd9c08b,
    scale = 1,
    life = 1.25,
    finisher = false,
    origin = null
  } = options;

  const start = origin || player.position.clone()
    .add(new THREE.Vector3(0, 1.48, 0))
    .addScaledVector(dir, .72);

  const helper = new THREE.ArrowHelper(
    dir,
    start,
    1.45 * scale,
    color,
    .28 * scale,
    .12 * scale
  );
  scene.add(helper);

  skillProjectiles.push({
    kind: 'arrow',
    object: helper,
    dir: dir.clone(),
    speed,
    damage,
    life,
    hit: false,
    finisher,
    radius: .88
  });
}

function spawnSwordWave(dir) {
  const geo = new THREE.RingGeometry(.24, .78, 32, 1, -.88, 1.76);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x8fe8ff,
    transparent: true,
    opacity: .82,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const wave = new THREE.Mesh(geo, mat);
  const yaw = Math.atan2(dir.x, dir.z);
  wave.rotation.y = yaw;
  wave.rotation.z = -.12;
  wave.position.copy(player.position)
    .add(new THREE.Vector3(0, 1.45, 0))
    .addScaledVector(dir, 1.0);
  wave.scale.set(1.35, 1.05, 1);
  scene.add(wave);

  skillProjectiles.push({
    kind: 'swordWave',
    object: wave,
    dir: dir.clone(),
    life: .86,
    speed: 16.5,
    damage: 22,
    hit: false,
    radius: 1.05
  });
}

function spawnFireball(dir) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xff7a24,
    emissive: 0xff3b0a,
    emissiveIntensity: 2.4,
    roughness: .42
  });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.34, 14, 10), mat);
  ball.position.copy(player.position)
    .add(new THREE.Vector3(0, 1.48, 0))
    .addScaledVector(dir, .85);
  scene.add(ball);

  skillProjectiles.push({
    kind: 'fireball',
    object: ball,
    dir: dir.clone(),
    life: 1.55,
    speed: 11.5,
    damage: 34,
    hit: false,
    radius: .78,
    blastRadius: 2.25
  });
}

function spawnFireArrow(dir, damage = 24) {
  spawnSkillArrow(dir, {
    speed: 27,
    damage,
    color: 0xff6a28,
    scale: 1.05,
    life: 1.15
  });
}

function explodeFireball(projectile) {
  const pos = projectile.object.position.clone();
  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 10),
    new THREE.MeshBasicMaterial({
      color: 0xff792b,
      transparent: true,
      opacity: .42,
      depthWrite: false
    })
  );
  flash.position.copy(pos);
  flash.scale.setScalar(.35);
  scene.add(flash);

  skillAreas.push({
    kind: 'explosionVfx',
    object: flash,
    life: .28,
    maxLife: .28
  });

  if (dummyAlive && dummy.position.clone().add(new THREE.Vector3(0, 1, 0)).distanceTo(pos) <= projectile.blastRadius) {
    damageDummy(projectile.damage, true);
  }
}

function spawnArrowRain(targetPoint) {
  const center = targetPoint.clone();
  center.y = 0;

  // 바닥에 공격 범위 표시.
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.85, 2.05, 40),
    new THREE.MeshBasicMaterial({
      color: 0xffd36b,
      transparent: true,
      opacity: .36,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.copy(center).add(new THREE.Vector3(0, .035, 0));
  scene.add(ring);

  skillAreas.push({
    kind: 'rainZone',
    object: ring,
    center,
    life: 1.35,
    maxLife: 1.35,
    nextArrow: 0,
    arrowCount: 0
  });
}

function spawnFireWall(targetPoint, dir) {
  const center = targetPoint.clone().setY(.55);
  const right = new THREE.Vector3(-dir.z, 0, dir.x).normalize();

  const group = new THREE.Group();
  group.position.copy(center);
  scene.add(group);

  for (let i = -3; i <= 3; i++) {
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(.30, 1.35 + (Math.abs(i) % 2) * .25, 8),
      new THREE.MeshStandardMaterial({
        color: 0xff7c24,
        emissive: 0xff3000,
        emissiveIntensity: 1.8,
        transparent: true,
        opacity: .78,
        roughness: .55
      })
    );
    flame.position.copy(right).multiplyScalar(i * .58);
    flame.position.y = .35;
    group.add(flame);
  }

  skillAreas.push({
    kind: 'fireWall',
    object: group,
    center: targetPoint.clone().setY(0),
    right,
    life: 3.0,
    maxLife: 3.0,
    tick: 0
  });
}

function disposeSkillProjectile(projectile) {
  const obj = projectile.object;
  if (projectile.kind === 'arrow') {
    disposeArrowHelper(obj);
    return;
  }
  scene.remove(obj);
  obj.geometry?.dispose?.();
  if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose?.());
  else obj.material?.dispose?.();
}

function updateSkillProjectiles(dt) {
  for (let i = skillProjectiles.length - 1; i >= 0; i--) {
    const p = skillProjectiles[i];
    p.life -= dt;
    p.object.position.addScaledVector(p.dir, p.speed * dt);

    if (p.kind === 'swordWave') {
      p.object.rotation.z -= dt * 4.5;
      p.object.material.opacity = .82 * THREE.MathUtils.clamp(p.life / .24, 0, 1);
    } else if (p.kind === 'fireball') {
      p.object.scale.setScalar(1 + Math.sin(elapsed * 24) * .10);
    }

    if (!p.hit && dummyAlive) {
      const target = dummy.position.clone().add(new THREE.Vector3(0, 1.0, 0));
      if (p.object.position.distanceToSquared(target) <= p.radius * p.radius) {
        p.hit = true;

        if (p.kind === 'fireball') {
          explodeFireball(p);
        } else {
          damageDummy(p.damage, p.finisher || false);
        }
      }
    }

    if (p.kind === 'fireball' && p.life <= 0 && !p.hit) {
      p.hit = true;
      explodeFireball(p);
    }

    if (p.hit || p.life <= 0) {
      disposeSkillProjectile(p);
      skillProjectiles.splice(i, 1);
    }
  }
}

function updateSkillAreas(dt) {
  for (let i = skillAreas.length - 1; i >= 0; i--) {
    const a = skillAreas[i];
    a.life -= dt;

    if (a.kind === 'explosionVfx') {
      const t = 1 - a.life / a.maxLife;
      a.object.scale.setScalar(.35 + t * 2.4);
      a.object.material.opacity = .42 * (1 - t);
    } else if (a.kind === 'rainZone') {
      a.object.material.opacity = .22 + Math.sin(elapsed * 14) * .08;
      a.nextArrow -= dt;

      if (a.arrowCount < 8 && a.nextArrow <= 0) {
        a.nextArrow = .12;
        a.arrowCount++;

        const ang = a.arrowCount * 2.399;
        const rad = (a.arrowCount % 3) * .58;
        const origin = a.center.clone().add(new THREE.Vector3(
          Math.cos(ang) * rad,
          7 + (a.arrowCount % 2) * .8,
          Math.sin(ang) * rad
        ));

        spawnSkillArrow(new THREE.Vector3(0, -1, 0), {
          speed: 19,
          damage: 7,
          color: 0xffdf85,
          scale: .85,
          life: .55,
          origin
        });
      }
    } else if (a.kind === 'fireWall') {
      a.tick -= dt;
      a.object.children.forEach((flame, idx) => {
        flame.scale.y = .82 + Math.sin(elapsed * 11 + idx) * .16;
        flame.material.opacity = .62 + Math.sin(elapsed * 9 + idx) * .12;
      });

      if (a.tick <= 0 && dummyAlive) {
        a.tick = .42;

        const rel = dummy.position.clone().sub(a.center).setY(0);
        const along = Math.abs(rel.dot(a.right));
        const forwardDist = Math.abs(rel.x * (-a.right.z) + rel.z * a.right.x);

        if (along <= 2.25 && forwardDist <= .75) {
          damageDummy(9, false);
        }
      }
    }

    if (a.life <= 0) {
      scene.remove(a.object);
      a.object.traverse?.(child => {
        child.geometry?.dispose?.();
        child.material?.dispose?.();
      });
      a.object.geometry?.dispose?.();
      a.object.material?.dispose?.();
      skillAreas.splice(i, 1);
    }
  }
}

function updateSkills(dt) {
  for (const type of Object.keys(skillCooldowns)) {
    skillCooldowns[type] = Math.max(0, skillCooldowns[type] - dt);
  }

  updateSkillProjectiles(dt);
  updateSkillAreas(dt);

  if (!skillAction) {
    updateSkillUI();
    return;
  }

  const s = skillAction;
  s.t += dt;
  const p = THREE.MathUtils.clamp(s.t / s.duration, 0, 1);

  // 장검
  if (s.type === 'dashSlash') {
    if (s.t <= .28) {
      player.position.addScaledVector(s.dir, 15.5 * dt);
      player.position.x = THREE.MathUtils.clamp(player.position.x, -48, 48);
      player.position.z = THREE.MathUtils.clamp(player.position.z, -48, 48);
    }
    if (!s.hit && s.t >= .24) {
      s.hit = true;
      hitEnemyCone(3.05, 2.0, 28, false);
      shake = Math.max(shake, .12);
    }
  } else if (s.type === 'swordWave') {
    if (!s.spawned && s.t >= .20) {
      s.spawned = true;
      spawnSwordWave(s.dir);
      shake = Math.max(shake, .05);
    }
  } else if (s.type === 'spinSlash') {
    const spinEase = p < .12
      ? p / .12 * .10
      : .10 + THREE.MathUtils.smoothstep((p - .12) / .88, 0, 1) * .90;
    player.rotation.y = s.baseYaw + spinEase * Math.PI * 2;
    if (!s.hit && s.t >= .34) {
      s.hit = true;
      if (dummyAlive && dummy.position.distanceTo(player.position) <= 3.35) {
        damageDummy(32, true);
      }
      shake = Math.max(shake, .18);
    }

  // 활
  } else if (s.type === 'rapidFire') {
    if (s.count < 6 && s.t >= s.nextShot) {
      s.nextShot += .14;
      s.count++;
      const dir = skillAimDirection();
      spawnSkillArrow(dir, { speed: 25, damage: 8, color: 0xf4d58a, scale: .86, life: 1.15 });
    }
  } else if (s.type === 'powerShot') {
    if (!s.spawned && s.t >= .36) {
      s.spawned = true;
      spawnSkillArrow(skillAimDirection(), {
        speed: 30,
        damage: 42,
        color: 0xffe6a3,
        scale: 1.65,
        life: 1.25,
        finisher: true
      });
      shake = Math.max(shake, .10);
    }
  } else if (s.type === 'arrowRain') {
    if (!s.spawned && s.t >= .32) {
      s.spawned = true;
      spawnArrowRain(s.targetPoint);
    }

  // 지팡이
  } else if (s.type === 'fireball') {
    if (!s.spawned && s.t >= .26) {
      s.spawned = true;
      spawnFireball(skillAimDirection());
      shake = Math.max(shake, .06);
    }
  } else if (s.type === 'fireArrow') {
    if (!s.spawned && s.t >= .18) {
      s.spawned = true;
      spawnFireArrow(skillAimDirection(), 24);
    }
  } else if (s.type === 'fireWall') {
    if (!s.spawned && s.t >= .32) {
      s.spawned = true;
      const flat = playerForward(new THREE.Vector3()).normalize();
      const target = player.position.clone().addScaledVector(flat, 3.1);
      spawnFireWall(target, flat);
      shake = Math.max(shake, .07);
    }
  }

  if (s.t >= s.duration) {
    player.rotation.y = playerYaw;
    skillAction = null;
  }

  updateSkillUI();
}

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
  hpEl.style.width = `${Math.max(0, dummyHP) / GOBLIN_MAX_HP * 100}%`;
  playerHpEl.style.width = `${Math.max(0, playerHP) / PLAYER_MAX_HP * 100}%`;
  dummyModeBtn.textContent = '↻ 고블린 리셋';
}

function respawnGoblin(manual = false) {
  dummyAlive = true;
  dummyHP = GOBLIN_MAX_HP;
  dummyRespawn = 0;
  dummyState = 'chase';
  dummyAttackT = 0;
  dummyAttackHit = false;
  dummyAttackCooldown = .7;
  dummyStun = 0;
  dummy.position.set(0, 0, -2.5);
  dummy.rotation.set(0, 0, 0);
  dummy.scale.setScalar(1);
  dummy.visible = true;
  dummy.userData.rig.telegraph.visible = false;
  updateDummyUI();
  if (manual) showToast('고블린 재소환');
}

function respawnPlayer() {
  playerHP = PLAYER_MAX_HP;
  playerAlive = true;
  playerRespawn = 0;
  player.position.set(0, 0, 8);
  playerYaw = Math.PI;
  player.rotation.y = playerYaw;
  player.visible = true;
  skillAction = null;
  bowAttack = null;
  staffAttack = null;
  velocityY = 0;
  grounded = true;
  invulnTime = .9;
  updateDummyUI();
  showToast('플레이어 부활');
}

updateDummyUI();
updateDashUI();
updateEquipmentUI();

dummyModeBtn.addEventListener('click', () => {
  respawnGoblin(true);
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
  showToast(locked ? '고블린 락온' : '락온 해제');
}

autoBtn.addEventListener('pointerdown', e => {
  e.preventDefault();
  toggleAutoCamera();
});

lockBtn.addEventListener('pointerdown', e => {
  e.preventDefault();
  toggleLock();
});

weaponSwitchBtn.addEventListener('pointerdown', e => {
  e.preventDefault();
  toggleWeapon();
});

function playerForward(out = new THREE.Vector3()) {
  return out.set(Math.sin(playerYaw), 0, Math.cos(playerYaw));
}

function tryDash() {
  if (!playerAlive || skillAction || bowAttack || staffAttack || dashCharges <= 0 || dashTime > 0) return;
  dashCharges--;
  updateDashUI();
  const m = getMoveVector();
  if (m.lengthSq() > .04) dashDir.copy(m).normalize();
  else playerForward(dashDir);
  dashTime = DASH_DURATION;
  invulnTime = IFRAME;
}

function tryJump() {
  if (!playerAlive || skillAction || bowAttack || staffAttack || !grounded) return;
  velocityY = 10.4;
  grounded = false;
}

const attackData = [
  { duration: .62, hitAt: .34, damage: 10, range: 2.65, arc: 2.05, finisher: false },
  { duration: .56, hitAt: .30, damage: 12, range: 2.70, arc: 2.15, finisher: false },
  { duration: .64, hitAt: .36, damage: 14, range: 2.90, arc: 2.05, finisher: false },
  { duration: .84, hitAt: .48, damage: 22, range: 3.35, arc: 2.90, finisher: true }
];

function tryAttack() {
  if (!playerAlive || skillAction) return;

  if (equippedWeapon === 'bow') {
    tryBowAttack();
    return;
  }

  if (equippedWeapon === 'staff') {
    tryStaffAttack();
    return;
  }

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
  dummyStun = finisher ? .26 : .14;
  dummyState = 'stun';
  dummy.userData.rig.telegraph.visible = false;
  hitPause = .045;
  shake = finisher ? .18 : .08;

  dummyHP -= amount;

  const away = dummy.position.clone().sub(player.position).setY(0);
  if (away.lengthSq() > .001) {
    away.normalize();
    dummy.position.addScaledVector(away, finisher ? .72 : .16);
  }

  if (dummyHP <= 0) {
    dummyHP = 0;
    dummyAlive = false;
    dummy.visible = false;
    dummyRespawn = 2.5;
    dummy.userData.rig.telegraph.visible = false;
    locked = false;
    lockBtn.classList.remove('active');
    lockMarker.style.display = 'none';
    showToast('고블린 처치');
  }

  updateDummyUI();
}

function damagePlayer(amount) {
  if (!playerAlive || invulnTime > 0) return false;

  playerHP = Math.max(0, playerHP - amount);
  invulnTime = .42;
  shake = Math.max(shake, .16);
  hitPause = .035;

  const away = player.position.clone().sub(dummy.position).setY(0);
  if (away.lengthSq() > .001) {
    away.normalize();
    player.position.addScaledVector(away, .42);
  }

  if (playerHP <= 0) {
    playerAlive = false;
    playerRespawn = 1.8;
    player.visible = false;
    skillAction = null;
    bowAttack = null;
    staffAttack = null;
    attack = null;
    queuedAttack = false;
    locked = false;
    lockBtn.classList.remove('active');
    lockMarker.style.display = 'none';
    showToast('쓰러짐');
  } else {
    showToast(`고블린 공격 -${amount}`);
  }

  updateDummyUI();
  return true;
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

attackBtn.addEventListener('pointerdown', e => {
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

skillDashSlashBtn.addEventListener('pointerdown', e => {
  e.preventDefault();
  startSkillSlot(0);
});

skillSwordWaveBtn.addEventListener('pointerdown', e => {
  e.preventDefault();
  startSkillSlot(1);
});

skillSpinBtn.addEventListener('pointerdown', e => {
  e.preventDefault();
  startSkillSlot(2);
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
  if (e.code === 'Digit1') startSkillSlot(0);
  if (e.code === 'Digit2') startSkillSlot(1);
  if (e.code === 'Digit3') startSkillSlot(2);
  if (e.code === 'KeyQ') toggleWeapon();
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
  // 전투 모션 공통 원칙: 짧게 모으고, 크게 휘두르고, 짧게 끝낸다.
  const wind = phase(p, 0, index === 3 ? .25 : .20);
  const cut = phase(p, index === 3 ? .16 : .12, index === 3 ? .68 : .58);
  const recover = phase(p, index === 3 ? .88 : .80, 1);

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
    // 1타 fallback: 큰 오른쪽 횡베기.
    w = {
      hipY: -.48, torsoX: -.08, torsoY: -.72, torsoZ: -.12,
      rSX: -1.72, rSY: .96, rSZ: 1.92,
      rEX: -1.62, rEY: 0, rEZ: 0,
      rWX: .12, rWY: .18, rWZ: .24,
      lSX: .46, lSY: -.20, lSZ: .56,
      lEX: -.58, lEY: 0, lEZ: 0,
      lWX: 0, lWY: 0, lWZ: 0,
      lTX: -.12, rTX: .18, lKX: .26, rKX: .12, lAX: -.08, rAX: .06,
      headX: -.04, headY: -.18
    };
    h = {
      hipY: .64, torsoX: .12, torsoY: .96, torsoZ: .14,
      rSX: .42, rSY: -.86, rSZ: -.52,
      rEX: -.08, rEY: 0, rEZ: 0,
      rWX: -.18, rWY: -.24, rWZ: -.32,
      lSX: -.38, lSY: .18, lSZ: -.48,
      lEX: -.28, lEY: 0, lEZ: 0,
      lWX: 0, lWY: 0, lWZ: 0,
      lTX: .16, rTX: -.20, lKX: .08, rKX: .24, lAX: .05, rAX: -.08,
      headX: .05, headY: .22
    };
  } else if (index === 1) {
    // 2타: 1타의 반대 방향으로 크게 되받아치는 횡베기.
    w = {
      hipY: .62, torsoX: .06, torsoY: .88, torsoZ: .14,
      rSX: .28, rSY: -.92, rSZ: -.58,
      rEX: -.46, rEY: 0, rEZ: 0,
      rWX: -.12, rWY: -.26, rWZ: -.34,
      lSX: -.44, lSY: .18, lSZ: -.50,
      lEX: -.44, lEY: 0, lEZ: 0,
      lWX: 0, lWY: 0, lWZ: 0,
      lTX: .16, rTX: -.24, lKX: .10, rKX: .28, lAX: .06, rAX: -.10,
      headX: .03, headY: .20
    };
    h = {
      hipY: -.68, torsoX: .10, torsoY: -1.02, torsoZ: -.16,
      rSX: -.58, rSY: 1.02, rSZ: 1.08,
      rEX: -.06, rEY: 0, rEZ: 0,
      rWX: .16, rWY: .28, rWZ: .38,
      lSX: .48, lSY: -.20, lSZ: .56,
      lEX: -.30, lEY: 0, lEZ: 0,
      lWX: 0, lWY: 0, lWZ: 0,
      lTX: -.20, rTX: .18, lKX: .26, rKX: .08, lAX: -.10, rAX: .06,
      headX: .04, headY: -.24
    };
  } else if (index === 2) {
    // 3타: 검을 낮게 크게 끌어내린 뒤 전신으로 위까지 쓸어 올리는 올려베기.
    w = {
      hipY: .42, torsoX: .26, torsoY: .54, torsoZ: .18,
      rSX: .92, rSY: -.48, rSZ: -.42,
      rEX: -.38, rEY: 0, rEZ: 0,
      rWX: -.24, rWY: -.18, rWZ: -.22,
      lSX: -.36, lSY: .14, lSZ: -.34,
      lEX: -.46, lEY: 0, lEZ: 0,
      lWX: 0, lWY: 0, lWZ: 0,
      lTX: -.34, rTX: -.28, lKX: .72, rKX: .64, lAX: -.18, rAX: -.16,
      headX: .10, headY: .12
    };
    h = {
      hipY: -.40, torsoX: -.28, torsoY: -.62, torsoZ: -.18,
      rSX: -1.78, rSY: .50, rSZ: -2.18,
      rEX: -.12, rEY: 0, rEZ: 0,
      rWX: .22, rWY: .16, rWZ: .20,
      lSX: .52, lSY: -.12, lSZ: .44,
      lEX: -.30, lEY: 0, lEZ: 0,
      lWX: 0, lWY: 0, lWZ: 0,
      lTX: .16, rTX: .14, lKX: .10, rKX: .10, lAX: .10, rAX: .10,
      headX: -.12, headY: -.14
    };
  } else {
    // 4타: 다리-골반-허리-어깨를 전부 쓰는 가장 큰 마무리 횡베기.
    w = {
      hipY: -1.08, torsoX: .18, torsoY: -1.16, torsoZ: -.26,
      rSX: -.96, rSY: -1.30, rSZ: -1.18,
      rEX: -1.42, rEY: 0, rEZ: 0,
      rWX: .24, rWY: -.42, rWZ: -.54,
      lSX: .88, lSY: .38, lSZ: .92,
      lEX: -.92, lEY: 0, lEZ: 0,
      lWX: 0, lWY: 0, lWZ: .26,
      lTX: -.46, rTX: .34, lKX: .72, rKX: .42, lAX: -.20, rAX: .14,
      headX: -.08, headY: .32
    };
    h = {
      hipY: 1.10, torsoX: .24, torsoY: 1.18, torsoZ: .28,
      rSX: .46, rSY: 1.32, rSZ: .62,
      rEX: -.03, rEY: 0, rEZ: 0,
      rWX: -.22, rWY: .46, rWZ: .56,
      lSX: -.72, lSY: -.40, lSZ: -.82,
      lEX: -.28, lEY: 0, lEZ: 0,
      lWX: 0, lWY: 0, lWZ: -.22,
      lTX: .30, rTX: -.48, lKX: .16, rKX: .58, lAX: .12, rAX: -.20,
      headX: .10, headY: -.36
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


// ---------- Attack 1 fast exaggerated key poses ----------
// 디테일 튜닝보다 액션 실루엣 우선: 크게 모으고 크게 베고 바로 끝낸다.
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

const attack1BigWindupPose = {
  ...attack1NeutralPose,
  hipY: -.52,
  torsoX: -.08, torsoY: -.76, torsoZ: -.14,

  rSX: -1.78, rSY: .98, rSZ: 2.05,
  rEX: -1.68, rEY: 0, rEZ: 0,
  rWX: .10, rWY: .16, rWZ: .20,

  lSX: .48, lSY: -.20, lSZ: .58,
  lEX: -.58, lEY: 0, lEZ: 0,

  lTX: -.14, rTX: .20,
  lKX: .28, rKX: .12,
  lAX: -.08, rAX: .06,

  headX: -.04, headY: -.20
};

const attack1BigSlashPose = {
  ...attack1NeutralPose,
  hipY: .34,
  torsoX: .08, torsoY: .52, torsoZ: .08,

  rSX: -.58, rSY: -.38, rSZ: .42,
  rEX: -.34, rEY: 0, rEZ: 0,
  rWX: -.08, rWY: -.14, rWZ: -.16,

  lSX: -.24, lSY: .10, lSZ: -.30,
  lEX: -.28, lEY: 0, lEZ: 0,

  lTX: .08, rTX: -.10,
  lKX: .08, rKX: .18,
  lAX: .04, rAX: -.06,

  headX: .03, headY: .12
};

const attack1BigFollowPose = {
  ...attack1NeutralPose,
  hipY: .68,
  torsoX: .14, torsoY: .92, torsoZ: .16,

  rSX: .58, rSY: -.82, rSZ: -.48,
  rEX: -.04, rEY: 0, rEZ: 0,
  rWX: -.18, rWY: -.26, rWZ: -.34,

  lSX: -.46, lSY: .20, lSZ: -.52,
  lEX: -.24, lEY: 0, lEZ: 0,

  lTX: .18, rTX: -.24,
  lKX: .08, rKX: .30,
  lAX: .06, rAX: -.10,

  headX: .06, headY: .24
};

function lerpPose(a, b, t) {
  const out = {};
  for (const key of Object.keys(a)) out[key] = THREE.MathUtils.lerp(a[key], b[key], t);
  return out;
}

function getAttack1Pose(p) {
  if (p < .24) {
    const t = THREE.MathUtils.smoothstep(THREE.MathUtils.clamp(p / .24, 0, 1), 0, 1);
    return lerpPose(attack1NeutralPose, attack1BigWindupPose, t);
  }

  if (p < .68) {
    const t = THREE.MathUtils.smoothstep(THREE.MathUtils.clamp((p - .24) / .44, 0, 1), 0, 1);
    return lerpPose(attack1BigWindupPose, attack1BigSlashPose, t);
  }

  // 끝까지 감속하지 않고 밀어붙인다.
  const u = THREE.MathUtils.clamp((p - .68) / .32, 0, 1);
  return lerpPose(attack1BigSlashPose, attack1BigFollowPose, u * u);
}

function applyAttack1Pose(pose, dt) {
  hipsRig.position.y = damp(hipsRig.position.y, 1.7, 24, dt);
  hipsRig.rotation.x = dampAxisLimited(hipsRig.rotation.x, 0, 24, 12, dt);
  hipsRig.rotation.y = dampAxisLimited(hipsRig.rotation.y, pose.hipY, 26, 13, dt);
  hipsRig.rotation.z = dampAxisLimited(hipsRig.rotation.z, 0, 24, 12, dt);

  dampRot(torsoRig, pose.torsoX, pose.torsoY, pose.torsoZ, 26, dt, 14);

  dampRot(rightArmRig.shoulder, pose.rSX, pose.rSY, pose.rSZ, 28, dt, 16);
  dampRot(rightArmRig.elbow, pose.rEX, pose.rEY, pose.rEZ, 30, dt, 17);
  dampRot(rightArmRig.wrist, pose.rWX, pose.rWY, pose.rWZ, 30, dt, 18);

  dampRot(leftArmRig.shoulder, pose.lSX, pose.lSY, pose.lSZ, 24, dt, 13);
  dampRot(leftArmRig.elbow, pose.lEX, pose.lEY, pose.lEZ, 24, dt, 13);
  dampRot(leftArmRig.wrist, pose.lWX, pose.lWY, pose.lWZ, 24, dt, 13);

  dampRot(leftLegRig.thigh, pose.lTX, 0, 0, 24, dt, 12);
  dampRot(rightLegRig.thigh, pose.rTX, 0, 0, 24, dt, 12);
  dampRot(leftLegRig.knee, pose.lKX, 0, 0, 24, dt, 12);
  dampRot(rightLegRig.knee, pose.rKX, 0, 0, 24, dt, 12);
  dampRot(leftLegRig.ankle, pose.lAX, 0, 0, 24, dt, 12);
  dampRot(rightLegRig.ankle, pose.rAX, 0, 0, 24, dt, 12);

  headRig.rotation.x = dampAxisLimited(headRig.rotation.x, pose.headX, 20, 10, dt);
  headRig.rotation.y = dampAxisLimited(headRig.rotation.y, pose.headY, 20, 10, dt);

  rotateQuaternionToward(swordRoot, swordRestQuaternion, 16, dt);
  applyHumanJointLimits();
}


function animateRig(dt, moving) {
  const speed = attack ? 24 : 15;

  if (skillAction) {
    const p = THREE.MathUtils.clamp(skillAction.t / skillAction.duration, 0, 1);

    if (skillAction.type === 'dashSlash' || skillAction.type === 'swordWave') {
      applyAttack1Pose(getAttack1Pose(p), dt);
      return;
    }

    if (skillAction.type === 'spinSlash') {
      hipsRig.position.y = damp(hipsRig.position.y, 1.62, 24, dt);
      dampRot(torsoRig, .08, .34, -.12, 26, dt, 15);

      // 검 든 오른팔을 바깥으로 크게 뻗어 회전 반경을 키운다.
      dampRot(rightArmRig.shoulder, -.34, -.72, -1.62, 28, dt, 17);
      dampRot(rightArmRig.elbow, -.08, 0, 0, 30, dt, 18);
      dampRot(rightArmRig.wrist, -.10, -.18, -.16, 30, dt, 18);

      // 반대팔은 균형을 잡으며 반대 방향으로 펼친다.
      dampRot(leftArmRig.shoulder, -.18, .42, .92, 24, dt, 14);
      dampRot(leftArmRig.elbow, -.36, 0, 0, 24, dt, 14);
      dampRot(leftArmRig.wrist, 0, 0, .10, 24, dt, 14);

      dampRot(leftLegRig.thigh, -.18, 0, 0, 24, dt, 12);
      dampRot(rightLegRig.thigh, .16, 0, 0, 24, dt, 12);
      dampRot(leftLegRig.knee, .26, 0, 0, 24, dt, 12);
      dampRot(rightLegRig.knee, .18, 0, 0, 24, dt, 12);
      rotateQuaternionToward(swordRoot, swordRestQuaternion, 18, dt);
      applyHumanJointLimits();
      return;
    }
  }
  const attackRate = attack ? 14 : 7.2;
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

  if (equippedWeapon === 'bow' && dashTime <= 0 && !skillAction) {
    if (!bowAttack) {
      // 평상시: 양어깨에 힘을 빼고 팔을 몸통 옆으로 내린다.
      // 왼손만 활 손잡이를 잡은 채 몸 옆 아래에 살짝 띄운다.
      lSX = .03;
      lSY = -.04;
      lSZ = .06;
      lEX = -.28;
      lEY = 0;
      lEZ = 0;
      lWX = 0;
      lWY = 0;
      lWZ = -.03;

      // 오른팔은 완전히 중립에 가깝게 내려둔다.
      rSX = -.04;
      rSY = 0;
      rSZ = -.05;
      rEX = -.20;
      rEY = 0;
      rEZ = 0;
      rWX = 0;
      rWY = 0;
      rWZ = 0;
    } else {
      const u = THREE.MathUtils.clamp(bowAttack.t / bowAttack.duration, 0, 1);

      // 먼저 활을 들어 조준하고, 발사 뒤에는 양팔을 다시 자연스럽게 내린다.
      const aimUp = THREE.MathUtils.smoothstep(
        THREE.MathUtils.clamp(u / .24, 0, 1),
        0,
        1
      );
      const aimDown = u < .62
        ? 1
        : 1 - THREE.MathUtils.smoothstep(
            THREE.MathUtils.clamp((u - .62) / .38, 0, 1),
            0,
            1
          );
      const aim = Math.min(aimUp, aimDown);

      let draw = 0;
      if (u < .18) {
        draw = 0;
      } else if (u < .54) {
        draw = THREE.MathUtils.smoothstep((u - .18) / .36, 0, 1);
      } else if (u < .62) {
        draw = 1;
      } else {
        draw = 1 - THREE.MathUtils.smoothstep((u - .62) / .38, 0, 1);
      }

      // 왼팔: 활을 정면으로 확실하게 뻗는다.
      lSX = THREE.MathUtils.lerp(.03, -1.32, aim);
      lSY = THREE.MathUtils.lerp(-.04, .12, aim);
      lSZ = THREE.MathUtils.lerp(.06, -.20, aim);
      lEX = THREE.MathUtils.lerp(-.28, -.08, aim);
      lEY = 0;
      lEZ = 0;
      lWX = THREE.MathUtils.lerp(0, -.10, aim);
      lWY = 0;
      lWZ = THREE.MathUtils.lerp(-.03, .08, aim);

      // 오른팔: 얼굴 옆까지 크게 당겨 실제 활시위 당기는 실루엣을 만든다.
      rSX = THREE.MathUtils.lerp(-.04, -1.08, aim);
      rSY = THREE.MathUtils.lerp(0, .46 + draw * .40, aim);
      rSZ = THREE.MathUtils.lerp(-.05, .30 + draw * .24, aim);
      rEX = THREE.MathUtils.lerp(-.20, -.68 - draw * .92, aim);
      rEY = 0;
      rEZ = 0;
      rWX = THREE.MathUtils.lerp(0, -.10, aim);
      rWY = THREE.MathUtils.lerp(0, .08 + draw * .18, aim);
      rWZ = THREE.MathUtils.lerp(0, .06, aim);

      torsoY = draw * -.16;
      torsoZ = draw * -.04;
      headY = draw * .10;
    }
  }

  if (equippedWeapon === 'staff' && dashTime <= 0) {
    const castActive = staffAttack || (skillAction && skillAction.weapon === 'staff');
    const castT = castActive
      ? Math.sin(THREE.MathUtils.clamp(
          (staffAttack ? staffAttack.t / staffAttack.duration : skillAction.t / skillAction.duration),
          0,
          1
        ) * Math.PI)
      : 0;

    // 오른손 지팡이는 몸 옆에서 들고, 주문 시 앞으로 크게 내민다.
    rSX = THREE.MathUtils.lerp(-.10, -1.02, castT);
    rSY = THREE.MathUtils.lerp(0, -.18, castT);
    rSZ = THREE.MathUtils.lerp(-.08, -.34, castT);
    rEX = THREE.MathUtils.lerp(-.20, -.08, castT);
    rEY = 0;
    rEZ = 0;
    rWX = THREE.MathUtils.lerp(0, -.12, castT);
    rWY = 0;
    rWZ = 0;

    // 왼손은 주문할 때만 보조 동작.
    lSX = THREE.MathUtils.lerp(.08, -.56, castT);
    lSY = THREE.MathUtils.lerp(0, .22, castT);
    lSZ = THREE.MathUtils.lerp(.08, .34, castT);
    lEX = THREE.MathUtils.lerp(-.12, -.44, castT);

    torsoX = castT * .06;
    torsoY = castT * -.12;
  }

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
    dampRot(rightArmRig.shoulder, rSX, rSY, rSZ, speed, dt, attackRate);
    dampRot(rightArmRig.elbow, rEX, rEY, rEZ, speed + 2, dt, attackRate + 2);
    dampRot(rightArmRig.wrist, rWX, rWY, rWZ, speed + 3, dt, attackRate + 3);

    rotateQuaternionToward(swordRoot, swordRestQuaternion, 10.0, dt);
  }

  dampRot(leftArmRig.shoulder, lSX, lSY, lSZ, speed, dt, attackRate);
  dampRot(leftArmRig.elbow, lEX, lEY, lEZ, speed + 2, dt, attackRate + 2);
  dampRot(leftArmRig.wrist, lWX, lWY, lWZ, speed + 3, dt, attackRate + 3);

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

  if (equippedWeapon === 'bow') {
    let stringDraw = 0;
    if (bowAttack) {
      const u = THREE.MathUtils.clamp(bowAttack.t / bowAttack.duration, 0, 1);
      if (u >= .18 && u < .54) {
        stringDraw = THREE.MathUtils.smoothstep((u - .18) / .36, 0, 1);
      } else if (u >= .54 && u < .62) {
        stringDraw = 1;
      } else if (u >= .62) {
        stringDraw = 1 - THREE.MathUtils.smoothstep((u - .62) / .38, 0, 1);
      }
    }
    updateBowVisual(stringDraw);
  }

  // 모션 실루엣 확정 전까지 자기충돌은 꺼둔다.
  if (USE_SELF_COLLISION) enforceSelfCollision();
}
function updatePlayer(dt) {
  elapsed += dt;
  manualCamHold = Math.max(0, manualCamHold - dt);
  invulnTime = Math.max(0, invulnTime - dt);

  if (!playerAlive) {
    playerRespawn -= dt;
    if (playerRespawn <= 0) respawnPlayer();
    return;
  }

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

  if (skillAction) {
    // 스킬 자체 이동/회전은 updateSkills에서 처리한다.
  } else if (dashTime > 0) {
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
  animateImportedPlayer(dt, moving);
  updateDashWind();

}

function updateDummy(dt) {
  const rig = dummy.userData.rig;

  if (dummyFlash > 0) {
    dummyFlash -= dt;
    dummy.scale.setScalar(1 + Math.sin(dummyFlash * 65) * .035);
  } else {
    dummy.scale.setScalar(1);
  }

  if (!dummyAlive) {
    dummyRespawn -= dt;
    if (dummyRespawn <= 0) respawnGoblin(false);
    return;
  }

  dummyAttackCooldown = Math.max(0, dummyAttackCooldown - dt);

  if (dummyStun > 0) {
    dummyStun -= dt;
    rig.telegraph.visible = false;
    rig.torso.rotation.x = damp(rig.torso.rotation.x, -.18, 18, dt);
    rig.rightArm.rotation.x = damp(rig.rightArm.rotation.x, -.55, 18, dt);

    if (dummyStun <= 0) {
      dummyState = 'chase';
      dummyAttackCooldown = Math.max(dummyAttackCooldown, .28);
    }
    return;
  }

  const toPlayer = player.position.clone().sub(dummy.position);
  toPlayer.y = 0;
  const dist = toPlayer.length();
  const dir = dist > .001 ? toPlayer.clone().multiplyScalar(1 / dist) : new THREE.Vector3(0, 0, 1);
  const targetYaw = Math.atan2(dir.x, dir.z);
  dummy.rotation.y = angleLerp(dummy.rotation.y, targetYaw, Math.min(1, dt * 8.5));

  if (!playerAlive) {
    dummyState = 'idle';
    rig.telegraph.visible = false;
  } else if (dummyState === 'attack') {
    dummyAttackT += dt;
    const p = THREE.MathUtils.clamp(dummyAttackT / GOBLIN_ATTACK_DURATION, 0, 1);

    // 0~45%: 크게 뒤로 모으면서 예고. 이후 전방으로 한 번 크게 휘두른다.
    if (p < .45) {
      const t = THREE.MathUtils.smoothstep(p / .45, 0, 1);
      rig.rightArm.rotation.x = THREE.MathUtils.lerp(-.25, -1.82, t);
      rig.rightArm.rotation.z = THREE.MathUtils.lerp(-.10, .58, t);
      rig.leftArm.rotation.x = THREE.MathUtils.lerp(.10, -.34, t);
      rig.torso.rotation.y = THREE.MathUtils.lerp(0, -.34, t);
      rig.torso.rotation.x = THREE.MathUtils.lerp(0, -.08, t);
      rig.telegraph.visible = true;
      const pulse = .92 + Math.sin(elapsed * 24) * .08;
      rig.telegraph.scale.setScalar(pulse);
    } else {
      const t = THREE.MathUtils.smoothstep((p - .45) / .40, 0, 1);
      rig.rightArm.rotation.x = THREE.MathUtils.lerp(-1.82, .62, t);
      rig.rightArm.rotation.z = THREE.MathUtils.lerp(.58, -1.12, t);
      rig.leftArm.rotation.x = THREE.MathUtils.lerp(-.34, .28, t);
      rig.torso.rotation.y = THREE.MathUtils.lerp(-.34, .52, t);
      rig.torso.rotation.x = THREE.MathUtils.lerp(-.08, .10, t);
      rig.telegraph.visible = false;
    }

    if (!dummyAttackHit && dummyAttackT >= GOBLIN_HIT_AT) {
      dummyAttackHit = true;

      const nowToPlayer = player.position.clone().sub(dummy.position).setY(0);
      const nowDist = nowToPlayer.length();

      if (nowDist > .001) {
        nowToPlayer.normalize();
        const forward = new THREE.Vector3(Math.sin(dummy.rotation.y), 0, Math.cos(dummy.rotation.y));
        const facing = forward.dot(nowToPlayer);

        // 거리를 벌리거나 옆/뒤로 피하면 그대로 헛친다.
        if (nowDist <= 2.15 && facing >= .42) damagePlayer(GOBLIN_DAMAGE);
      }
    }

    if (dummyAttackT >= GOBLIN_ATTACK_DURATION) {
      dummyState = 'chase';
      dummyAttackT = 0;
      dummyAttackHit = false;
      dummyAttackCooldown = .48;
      rig.telegraph.visible = false;
    }
  } else if (dist <= GOBLIN_ATTACK_RANGE && dummyAttackCooldown <= 0) {
    dummyState = 'attack';
    dummyAttackT = 0;
    dummyAttackHit = false;
  } else if (dist <= GOBLIN_AGGRO) {
    dummyState = 'chase';

    if (dist > 1.55) {
      dummy.position.addScaledVector(dir, GOBLIN_SPEED * dt);
      dummy.position.x = THREE.MathUtils.clamp(dummy.position.x, -14.2, 14.2);
      dummy.position.z = THREE.MathUtils.clamp(dummy.position.z, -14.2, 14.2);
    }

    dummyWalkPhase += dt * 11;
    const step = Math.sin(dummyWalkPhase);
    rig.leftLeg.rotation.x = damp(rig.leftLeg.rotation.x, step * .62, 16, dt);
    rig.rightLeg.rotation.x = damp(rig.rightLeg.rotation.x, -step * .62, 16, dt);
    rig.leftArm.rotation.x = damp(rig.leftArm.rotation.x, -step * .38, 16, dt);
    rig.rightArm.rotation.x = damp(rig.rightArm.rotation.x, step * .34 - .28, 16, dt);
    rig.rightArm.rotation.z = damp(rig.rightArm.rotation.z, -.12, 16, dt);
    rig.torso.rotation.y = damp(rig.torso.rotation.y, 0, 16, dt);
    rig.torso.rotation.x = damp(rig.torso.rotation.x, .04, 16, dt);
    rig.telegraph.visible = false;
  } else {
    dummyState = 'idle';
    const idle = Math.sin(elapsed * 2.6) * .04;
    rig.leftLeg.rotation.x = damp(rig.leftLeg.rotation.x, 0, 10, dt);
    rig.rightLeg.rotation.x = damp(rig.rightLeg.rotation.x, 0, 10, dt);
    rig.leftArm.rotation.x = damp(rig.leftArm.rotation.x, idle, 10, dt);
    rig.rightArm.rotation.x = damp(rig.rightArm.rotation.x, -.24 - idle, 10, dt);
    rig.rightArm.rotation.z = damp(rig.rightArm.rotation.z, -.12, 10, dt);
    rig.torso.rotation.y = damp(rig.torso.rotation.y, 0, 10, dt);
    rig.torso.rotation.x = damp(rig.torso.rotation.x, 0, 10, dt);
    rig.telegraph.visible = false;
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
    look.lerp(dummy.position.clone().add(new THREE.Vector3(0, 1.05, 0)), .22);
  }
  camera.lookAt(look);

  if (shake > 0) {
    shake = Math.max(0, shake - dt * 1.6);
    camera.position.x += (Math.random() - .5) * shake;
    camera.position.y += (Math.random() - .5) * shake * .5;
  }

  if (locked && dummyAlive) {
    const p = dummy.position.clone().add(new THREE.Vector3(0, 1.75, 0)).project(camera);
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

  updateBowSystem(dt);
  updateStaffSystem(dt);
  updatePlayer(dt);
  updateSkills(dt);
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
loadImportedPlayer();
