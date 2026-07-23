/**
 * 环境模块 — 夜空、月光、萤火虫粒子
 */
import { THREE } from '../lib.js';
import CONFIG from '../config.js';
import CTX from '../ctx.js';

let fireflySystem = null;

export function init() {
  const { scene } = CTX;

  // ---- 夜空背景 ----
  scene.background = new THREE.Color(CONFIG.scene.bgColor);
  scene.fog = new THREE.Fog(
    CONFIG.scene.fogColor,
    CONFIG.scene.fogNear,
    CONFIG.scene.fogFar
  );

  // ---- 星星 ----
  createStars(scene);

  // ---- 月光 ----
  createMoonlight(scene);

  // ---- 萤火虫粒子 ----
  fireflySystem = createFireflies(scene);
}

export function update(delta, elapsed) {
  if (fireflySystem) {
    updateFireflies(fireflySystem, delta, elapsed);
  }
}

/* ---------- 星星 ---------- */
function createStars(scene) {
  const count = 600;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = 50 + Math.random() * 80;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)); // 只在上半球
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    sizes[i] = 0.3 + Math.random() * 0.7;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.08,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const stars = new THREE.Points(geo, mat);
  stars.name = 'stars';
  scene.add(stars);
}

/* ---------- 月光（方向光 + 环境光） ---------- */
function createMoonlight(scene) {
  // 柔和环境光
  const ambient = new THREE.AmbientLight(0x222244, 0.3);
  ambient.name = 'ambientLight';
  scene.add(ambient);

  // 月光方向光
  const moon = new THREE.DirectionalLight(0x4466aa, 0.6);
  moon.position.set(-8, 12, -5);
  moon.name = 'moonLight';
  scene.add(moon);

  // 暖色补光（模拟建筑窗户反射）
  const warmFill = new THREE.DirectionalLight(0xff8844, 0.15);
  warmFill.position.set(0, 1, 6);
  warmFill.name = 'warmFill';
  scene.add(warmFill);
}

/* ---------- 萤火虫 ---------- */
function createFireflies(scene) {
  const cfg = CONFIG.firefly;
  const count = cfg.count;
  const positions = new Float32Array(count * 3);
  const velocities = [];
  const phases = [];

  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * cfg.spread.x;
    positions[i * 3 + 1] = Math.random() * cfg.spread.y + 0.3;
    positions[i * 3 + 2] = (Math.random() - 0.5) * cfg.spread.z - 2;
    velocities.push({
      x: (Math.random() - 0.5) * cfg.speed,
      y: (Math.random() - 0.5) * cfg.speed * 0.5,
      z: (Math.random() - 0.5) * cfg.speed,
    });
    phases.push(Math.random() * Math.PI * 2);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: cfg.color,
    size: cfg.size,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  points.name = 'fireflies';
  scene.add(points);

  return { points, velocities, phases, count, spread: cfg.spread, speed: cfg.speed };
}

function updateFireflies(sys, delta, elapsed) {
  const positions = sys.points.geometry.attributes.position.array;
  for (let i = 0; i < sys.count; i++) {
    const v = sys.velocities[i];
    positions[i * 3]     += v.x * delta + Math.sin(elapsed * 0.5 + sys.phases[i]) * 0.002;
    positions[i * 3 + 1] += v.y * delta + Math.sin(elapsed * 0.7 + sys.phases[i]) * 0.001;
    positions[i * 3 + 2] += v.z * delta + Math.cos(elapsed * 0.4 + sys.phases[i]) * 0.002;

    // 边界约束
    if (Math.abs(positions[i * 3]) > sys.spread.x / 2) v.x *= -1;
    if (positions[i * 3 + 1] > sys.spread.y || positions[i * 3 + 1] < 0.1) v.y *= -1;
    if (Math.abs(positions[i * 3 + 2] + 2) > sys.spread.z / 2) v.z *= -1;
  }
  sys.points.geometry.attributes.position.needsUpdate = true;

  // 闪烁
  const opacity = 0.3 + 0.4 * (0.5 + 0.5 * Math.sin(elapsed * 1.5));
  sys.points.material.opacity = opacity;
}
