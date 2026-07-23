/**
 * 转场动画 — 点击"开始"后：
 *   1. 鱼灯加速旋转半圈 → 飞向观者（屏幕外）
 *   2. 镜头推进，河流放大
 *   3. 两条新鱼灯从河面升起
 *   4. 三条鱼灯对应三大板块
 */
import { gsap } from '../lib.js';
import CONFIG from '../config.js';
import CTX from '../ctx.js';
import { FishLantern } from '../lantern/fish-lantern.js';
import * as opening from './opening.js';

let isTransitioning = false;
let sectionLanterns = [];

/**
 * 执行转场
 * @param {Function} onComplete 转场完成回调
 */
export function play(onComplete) {
  if (isTransitioning) return;
  isTransitioning = true;

  const mainLantern = opening.getLantern();
  if (!mainLantern) return;

  CTX.state = 'transition';

  // ---- 第一步：鱼灯加速旋转半圈 → 飞向观者 ----
  const tl = gsap.timeline({
    onComplete: () => handleReveal(onComplete),
  });

  const startPos = mainLantern.group.position.clone();
  const midAngle = mainLantern.orbitAngle + Math.PI; // 转半圈

  // 计算加速旋转半圈后的位置（往右上方偏移，然后冲向观者）
  const cfg = CONFIG.lantern;
  const midX = Math.cos(midAngle) * cfg.orbitRadiusX * 0.8;
  const midY = Math.sin(midAngle) * cfg.orbitRadiusY * 1.2 + 1.5;

  // 加速半圈（第一阶段）
  tl.to(mainLantern.group.position, {
    x: midX,
    y: midY,
    z: -1,
    duration: 0.8,
    ease: 'power2.in',
  });

  // 冲向观者（第二阶段：沿 Z 轴正向） — 使用 GSAP 时间线继续
  tl.to(mainLantern.group.position, {
    x: midX * 0.3,
    y: midY + 0.5,
    z: 5,
    duration: 1.0,
    ease: 'power3.out',
  });

  // 鱼灯消失
  tl.to(mainLantern.group, {
    opacity: 0,
    duration: 0.2,
  }, '-=0.3');

  // 隐藏鱼灯的拖尾（用 opacity）
  tl.to(mainLantern.trail.mesh.material, {
    opacity: 0,
    duration: 0.3,
  }, '-=0.4');

  // ---- 第二步：镜头推进 ----
  tl.to(CTX.camera.position, {
    z: CONFIG.camera.transitionPosition.z,
    y: CONFIG.camera.transitionPosition.y,
    duration: CONFIG.transition.cameraPushDuration,
    ease: 'power2.inOut',
  }, '-=0.8');
}

/**
 * 三条鱼灯升起的阶段
 */
function handleReveal(onComplete) {
  const cfg = CONFIG.sections;
  const revealDelay = CONFIG.transition.revealDelay;

  // 清理主鱼灯
  const mainLantern = opening.getLantern();
  if (mainLantern) {
    mainLantern.dispose();
  }

  // ---- 升起三条鱼灯 ----
  cfg.forEach((section, index) => {
    const fish = new FishLantern({
      color: section.color,
      scale: CONFIG.lantern.scale * 0.7,
      name: `lantern-${section.id}`,
    });

    // 起始位置：河面下或画面外
    const startX = section.position.x;
    const startZ = section.position.z;
    const startY = -1.5;
    fish.group.position.set(startX, startY, startZ);

    // 保持 fish 引用以便后续更新
    sectionLanterns.push(fish);

    // 加入场景
    CTX.scene.add(fish.group);

    // GSAP 升起动画（逐个延迟）
    gsap.to(fish.group.position, {
      y: 0.6,
      duration: 1.2,
      delay: revealDelay + index * 0.25,
      ease: 'back.out(1.2)',
    });

    // 淡入
    gsap.fromTo(fish.group, {
      opacity: 0,
    }, {
      opacity: 1,
      duration: 0.6,
      delay: revealDelay + index * 0.25,
    });

    // 缓慢旋转
    gsap.to(fish.group.rotation, {
      y: Math.PI * 2,
      duration: 20 + index * 5,
      repeat: -1,
      ease: 'none',
      delay: revealDelay + index * 0.25,
    });
  });

  // 显示板块标记 UI
  setTimeout(() => {
    showSectionMarkers();

    CTX.state = 'explore';
    if (onComplete) onComplete();
  }, (revealDelay + cfg.length * 0.25 + 1) * 1000);
}

function showSectionMarkers() {
  const overlay = document.getElementById('sections-overlay');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  overlay.classList.add('visible');

  const markers = overlay.querySelectorAll('.section-marker');
  markers.forEach((el, i) => {
    setTimeout(() => {
      el.classList.add('revealed');
    }, 500 + i * 300);
  });
}

export function update(delta, elapsed) {
  // 更新三条鱼灯姿态
  sectionLanterns.forEach(fish => {
    if (fish.group.position.y > -0.5) {
      fish.update(delta, elapsed);
    }
  });
}

export function reset() {
  sectionLanterns.forEach(fish => fish.dispose());
  sectionLanterns = [];
  isTransitioning = false;
}
