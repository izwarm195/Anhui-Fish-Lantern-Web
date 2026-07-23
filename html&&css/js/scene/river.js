/**
 * 河流模块 — 夜间河面，带波纹顶点动画
 */
import { THREE } from '../lib.js';
import CONFIG from '../config.js';
import CTX from '../ctx.js';

let riverMesh = null;
let riverGeometry = null;

export function init() {
  const { scene } = CTX;
  const cfg = CONFIG.river;

  // ---- 河面 ----
  const geo = new THREE.PlaneGeometry(cfg.width, cfg.length, cfg.segments.w, cfg.segments.h);
  geo.rotateX(-Math.PI / 2);

  const mat = new THREE.MeshPhysicalMaterial({
    color: cfg.color,
    roughness: 0.3,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85,
    envMapIntensity: 0.4,
    side: THREE.DoubleSide,
  });

  riverGeometry = geo;
  riverMesh = new THREE.Mesh(geo, mat);
  riverMesh.name = 'river';
  riverMesh.position.y = -0.15;
  scene.add(riverMesh);

  // ---- 河面高光层（流光） ----
  const highlightGeo = new THREE.PlaneGeometry(cfg.width * 0.7, cfg.length * 0.9, 16, 32);
  highlightGeo.rotateX(-Math.PI / 2);
  const highlightMat = new THREE.MeshBasicMaterial({
    color: cfg.highlightColor,
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const highlight = new THREE.Mesh(highlightGeo, highlightMat);
  highlight.name = 'riverHighlight';
  highlight.position.y = -0.1;
  scene.add(highlight);
}

export function update(delta, elapsed) {
  if (!riverGeometry) return;
  const pos = riverGeometry.attributes.position;
  const cfg = CONFIG.river;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    // 多层正弦波叠加
    const wave1 = Math.sin(x * 0.5 + elapsed * cfg.rippleSpeed) * cfg.rippleAmplitude;
    const wave2 = Math.sin(z * 0.3 + elapsed * cfg.rippleSpeed * 0.7) * cfg.rippleAmplitude * 0.6;
    const wave3 = Math.sin((x + z) * 0.4 + elapsed * cfg.rippleSpeed * 1.2) * cfg.rippleAmplitude * 0.3;
    pos.setY(i, wave1 + wave2 + wave3);
  }
  pos.needsUpdate = true;
}

export function getRiverMesh() {
  return riverMesh;
}
