/**
 * 流光拖尾粒子系统
 * 鱼灯尾部暖金色粒子，带渐隐和随机飘散
 */
import { THREE } from '../lib.js';
import CONFIG from '../config.js';

export class GlowTrail {
  constructor(scene, color) {
    this.scene = scene;
    this.cfg = CONFIG.trail;
    this.particles = [];
    this.color = color || CONFIG.trail.color;

    // 预分配粒子池
    const count = this.cfg.count;
    const positions = new Float32Array(count * 3);
    const opacities = new Float32Array(count);
    const sizes = new Float32Array(count);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      color: this.color,
      size: this.cfg.size,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.mesh = new THREE.Points(geo, mat);
    this.mesh.frustumCulled = false;
    this.mesh.name = 'glowTrail';
    scene.add(this.mesh);

    // 粒子索引
    this.index = 0;
  }

  /**
   * 每帧在鱼灯当前位置发射新粒子
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} delta
   */
  emit(x, y, z, delta) {
    const count = Math.ceil(delta * 30); // 每秒约30个
    const pos = this.mesh.geometry.attributes.position.array;
    const op = this.mesh.geometry.attributes.opacity.array;
    const sz = this.mesh.geometry.attributes.size.array;

    for (let i = 0; i < count; i++) {
      const idx = this.index % this.cfg.count;
      pos[idx * 3]     = x + (Math.random() - 0.5) * 0.1;
      pos[idx * 3 + 1] = y + (Math.random() - 0.5) * 0.1;
      pos[idx * 3 + 2] = z + (Math.random() - 0.5) * 0.1;
      op[idx] = 1.0;
      sz[idx] = this.cfg.size * (0.5 + Math.random() * 1.0);
      this.particles[idx] = { life: 1.0, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.2, vz: (Math.random() - 0.5) * 0.3 };
      this.index++;
    }
  }

  /**
   * 更新粒子生命周期
   */
  update(delta) {
    const op = this.mesh.geometry.attributes.opacity.array;
    const pos = this.mesh.geometry.attributes.position.array;
    const sz = this.mesh.geometry.attributes.size.array;

    for (let i = 0; i < this.cfg.count; i++) {
      if (this.particles[i]) {
        this.particles[i].life -= delta / this.cfg.lifespan;
        if (this.particles[i].life <= 0) {
          op[i] = 0;
          this.particles[i] = null;
        } else {
          op[i] = this.particles[i].life;
          // 向外飘散
          pos[i * 3]     += this.particles[i].vx * delta;
          pos[i * 3 + 1] += this.particles[i].vy * delta;
          pos[i * 3 + 2] += this.particles[i].vz * delta;
          // 缩小
          sz[i] *= (1 - delta * 0.5);
        }
      }
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.attributes.opacity.needsUpdate = true;
    this.mesh.geometry.attributes.size.needsUpdate = true;
  }

  /**
   * 设置透明度（用于淡入淡出）
   */
  setOpacity(opacity) {
    this.mesh.material.opacity = opacity;
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
