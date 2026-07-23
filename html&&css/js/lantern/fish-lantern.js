/**
 * 鱼灯 3D 对象
 * 使用 Three.js 基础几何体组合生成鱼形灯笼（后续可替换为 GLB 模型）
 */
import { THREE } from '../lib.js';
import CONFIG from '../config.js';
import { GlowTrail } from './glow-trail.js';
import CTX from '../ctx.js';

export class FishLantern {
  constructor(options = {}) {
    const cfg = CONFIG.lantern;

    this.bodyColor = options.color || cfg.bodyColor;
    this.glowColor = options.glowColor || cfg.glowColor;
    this.scale = options.scale || cfg.scale;

    // 容器 Group
    this.group = new THREE.Group();
    this.group.name = options.name || 'fishLantern';

    // 构建鱼灯
    this._buildBody();
    this._buildGlow();

    // 流光拖尾
    this.trail = new GlowTrail(CTX.scene, this.glowColor);

    // 状态
    this.orbitAngle = options.initialAngle || 0;
  }

  /* ---------- 鱼身 ---------- */
  _buildBody() {
    const g = this.group;
    const s = this.scale;

    // --- 鱼身（椭球） ---
    const bodyGeo = new THREE.SphereGeometry(s * 0.5, 12, 10);
    bodyGeo.scale(1.6, 0.8, 0.9);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: this.bodyColor,
      roughness: 0.4,
      metalness: 0.3,
      emissive: this.bodyColor,
      emissiveIntensity: 0.15,
    });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.position.z = -s * 0.05;
    g.add(this.body);

    // --- 鱼头（稍尖） ---
    const headGeo = new THREE.SphereGeometry(s * 0.28, 10, 8);
    headGeo.scale(1.3, 0.9, 0.9);
    const headMat = new THREE.MeshStandardMaterial({
      color: this.bodyColor,
      roughness: 0.3,
      metalness: 0.2,
      emissive: this.bodyColor,
      emissiveIntensity: 0.2,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 0, -s * 0.45);
    g.add(head);

    // --- 鱼眼 ---
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffdd88 });
    const eyeGeo = new THREE.SphereGeometry(s * 0.06, 8, 8);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-s * 0.15, s * 0.08, -s * 0.55);
    g.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = s * 0.15;
    g.add(eyeR);

    // --- 鱼尾（三叉） ---
    const tailMat = new THREE.MeshStandardMaterial({
      color: this.bodyColor,
      roughness: 0.5,
      metalness: 0.1,
      transparent: true,
      opacity: 0.9,
      emissive: this.bodyColor,
      emissiveIntensity: 0.1,
    });
    for (let i = -1; i <= 1; i++) {
      const tailGeo = new THREE.ConeGeometry(s * 0.12, s * 0.4, 6);
      const tail = new THREE.Mesh(tailGeo, tailMat);
      const angle = i * 0.35;
      tail.position.set(i * s * 0.15, 0, s * 0.5);
      tail.rotation.x = angle;
      tail.rotation.z = -i * 0.2;
      g.add(tail);
    }

    // --- 鱼鳍 ---
    const finMat = new THREE.MeshStandardMaterial({
      color: this.bodyColor,
      roughness: 0.6,
      transparent: true,
      opacity: 0.6,
    });
    for (let side = -1; side <= 1; side += 2) {
      const finGeo = new THREE.ConeGeometry(s * 0.08, s * 0.25, 4);
      const fin = new THREE.Mesh(finGeo, finMat);
      fin.position.set(side * s * 0.35, 0, 0);
      fin.rotation.z = side * 0.6;
      fin.rotation.y = side * 0.2;
      g.add(fin);
    }
  }

  /* ---------- 光晕 ---------- */
  _buildGlow() {
    const s = this.scale;
    const glowMat = new THREE.SpriteMaterial({
      map: this._createGlowTexture(),
      color: this.glowColor,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.glow = new THREE.Sprite(glowMat);
    this.glow.scale.set(s * 2.5, s * 1.5, 1);
    this.group.add(this.glow);
  }

  _createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,200,100,0.6)');
    gradient.addColorStop(0.5, 'rgba(255,150,50,0.2)');
    gradient.addColorStop(1, 'rgba(255,100,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  /* ---------- 位置控制 ---------- */

  /** 设置鱼灯在场景中的位置 */
  setPosition(x, y, z) {
    this.group.position.set(x, y, z);
  }

  /** 获取当前位置 */
  getPosition() {
    return this.group.position;
  }

  /** 设置旋转 */
  setRotation(x, y, z) {
    this.group.rotation.set(x, y, z);
  }

  /** 让鱼灯面向目标点 */
  lookAt(target) {
    this.group.lookAt(target);
  }

  /**
   * 更新鱼灯游动姿态（轻微摆动）
   */
  update(delta, elapsed) {
    // 鱼身轻微摆动（模拟游动）
    if (this.body) {
      this.body.rotation.x = Math.sin(elapsed * 2.5) * 0.05;
      this.body.position.z = Math.sin(elapsed * 3) * 0.015;
    }

    // 更新拖尾
    const pos = this.group.position;
    this.trail.emit(pos.x, pos.y, pos.z, delta);
    this.trail.update(delta);
  }

  dispose() {
    this.trail.dispose();
    // 递归 dispose
    this.group.traverse(child => {
      if (child.isMesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material?.dispose();
        }
      }
    });
    CTX.scene.remove(this.group);
  }
}
