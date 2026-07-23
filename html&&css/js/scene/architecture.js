/**
 * 徽派建筑模块 — 沿河两岸的建筑剪影
 * 粉墙黛瓦，马头墙，暖黄窗灯
 */
import { THREE } from '../lib.js';
import CONFIG from '../config.js';
import CTX from '../ctx.js';

export function init() {
  const { scene } = CTX;
  const cfg = CONFIG.buildings;
  const riverLen = CONFIG.river.length;
  const riverWid = CONFIG.river.width;

  // 左岸建筑
  for (let row = 0; row < cfg.rows; row++) {
    const zOffset = -riverLen / 2 + (row + 0.5) * (riverLen / (cfg.rows + 1));
    const count = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const xBase = -riverWid / 2 - 0.8 - Math.random() * 2.5;
      const zPos = zOffset + (i - count / 2) * (1.2 + Math.random() * 0.8);
      const building = createBuilding(0.7 + Math.random() * 0.5);
      building.position.set(xBase, 0, zPos);
      scene.add(building);
    }
  }

  // 右岸建筑
  for (let row = 0; row < cfg.rows; row++) {
    const zOffset = -riverLen / 2 + (row + 0.5) * (riverLen / (cfg.rows + 1));
    const count = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const xBase = riverWid / 2 + 0.8 + Math.random() * 2.5;
      const zPos = zOffset + (i - count / 2) * (1.2 + Math.random() * 0.8);
      const building = createBuilding(0.7 + Math.random() * 0.5);
      building.position.set(xBase, 0, zPos);
      scene.add(building);
    }
  }

  // 远处剪影（更淡、更密）
  createDistantSilhouettes(scene, riverWid, riverLen);
}

/* ---------- 单栋建筑 ---------- */
function createBuilding(baseScale) {
  const group = new THREE.Group();

  // 随机层数
  const floors = 1 + Math.floor(Math.random() * 2);
  const totalHeight = baseScale * (0.8 + floors * 0.7);
  const width = baseScale * (0.6 + Math.random() * 0.4);

  // --- 墙体 ---
  const wallMat = new THREE.MeshStandardMaterial({
    color: CONFIG.buildings.colors.wall,
    roughness: 0.9,
    metalness: 0,
  });
  const wallGeo = new THREE.BoxGeometry(width, totalHeight, width * 0.7);
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.y = totalHeight / 2;
  group.add(wall);

  // --- 马头墙（阶梯状山墙） ---
  const headMat = new THREE.MeshStandardMaterial({
    color: CONFIG.buildings.colors.roof,
    roughness: 0.8,
  });
  const steps = 2 + Math.floor(Math.random() * 2);
  for (let s = 0; s < steps; s++) {
    const stepH = 0.12 * baseScale;
    const stepW = width * (1 - s * 0.15);
    const stepGeo = new THREE.BoxGeometry(stepW, stepH, width * 0.1);
    const stepMesh = new THREE.Mesh(stepGeo, headMat);
    stepMesh.position.set(0, totalHeight + 0.02 + s * 0.2 * baseScale, width * 0.35);
    group.add(stepMesh);

    // 对称另一侧
    const stepMesh2 = stepMesh.clone();
    stepMesh2.position.z = -width * 0.35;
    group.add(stepMesh2);
  }

  // --- 屋顶 ---
  const roofMat = new THREE.MeshStandardMaterial({
    color: CONFIG.buildings.colors.roof,
    roughness: 0.9,
  });
  const roofGeo = new THREE.ConeGeometry(width * 0.8, 0.25 * baseScale, 4);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = totalHeight + 0.3 * baseScale;
  roof.rotation.y = Math.PI / 4;
  group.add(roof);

  // --- 窗户（暖黄灯光） ---
  const windowMat = new THREE.MeshBasicMaterial({
    color: CONFIG.buildings.colors.windowGlow,
    transparent: true,
    opacity: 0.3 + Math.random() * 0.5,
  });

  const winCount = 1 + Math.floor(Math.random() * 3);
  for (let w = 0; w < winCount; w++) {
    const winGeo = new THREE.PlaneGeometry(0.06, 0.1);
    const win = new THREE.Mesh(winGeo, windowMat);
    win.position.set(
      width / 2 + 0.005,
      0.4 + w * 0.3 + Math.random() * 0.2,
      (Math.random() - 0.5) * width * 0.5
    );
    win.rotation.y = Math.PI / 2;
    group.add(win);

    // 背面的窗
    const winBack = win.clone();
    winBack.position.x = -width / 2 - 0.005;
    winBack.rotation.y = -Math.PI / 2;
    group.add(winBack);
  }

  // 随机微旋转
  group.rotation.y = (Math.random() - 0.5) * 0.15;

  // 随机远近缩放
  const depthScale = 0.7 + Math.random() * 0.6;
  group.scale.set(depthScale, depthScale, depthScale);

  return group;
}

/* ---------- 远处剪影层 ---------- */
function createDistantSilhouettes(scene, riverWid, riverLen) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x0a0a18,
    roughness: 1,
    metalness: 0,
    transparent: true,
    opacity: 0.5,
  });

  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 30; i++) {
      const w = 0.3 + Math.random() * 0.6;
      const h = 0.4 + Math.random() * 1.2;
      const geo = new THREE.BoxGeometry(w, h, w * 0.5);
      const mesh = new THREE.Mesh(geo, mat);
      const xBase = side * (riverWid / 2 + 2.5 + Math.random() * 4);
      mesh.position.set(
        xBase + (Math.random() - 0.5) * 0.3,
        h / 2,
        -riverLen / 2 + Math.random() * riverLen
      );
      scene.add(mesh);
    }
  }
}
