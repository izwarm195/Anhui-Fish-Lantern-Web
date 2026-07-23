/**
 * 开场动画 — 鱼灯绕"开始"非匀速转动
 *
 * 模拟鱼在水中跳跃扑腾后再落回水中的节奏：
 *   - 大部分时间慢速巡游（蓄力）
 *   - 周期性"扑腾"加速（爆发）
 *   - 椭圆轨迹 + 上下浮动
 */
import { THREE } from '../lib.js';
import CONFIG from '../config.js';
import CTX from '../ctx.js';

let lantern = null;
let isActive = false;
let burstTimer = 0;
let burstProgress = 0;
let isBursting = false;

export function init(fishLantern) {
  lantern = fishLantern;
  isActive = true;
  burstTimer = 0;

  // 初始位置：正前方（靠近观者位置）
  const cfg = CONFIG.lantern;
  const angle = Math.PI / 2; // 从右侧开始
  const x = Math.cos(angle) * cfg.orbitRadiusX;
  const y = Math.sin(angle) * cfg.orbitRadiusY + 1.5;
  lantern.setPosition(x, y, 0);
  lantern.setRotation(0, -angle + Math.PI / 2, 0);
}

export function update(delta, elapsed) {
  if (!isActive || !lantern) return;

  const cfg = CONFIG.lantern;
  const pos = lantern.getPosition();

  // ---- 非匀速角度增量 ----
  burstTimer += delta;

  let speedMultiplier = 1.0;

  if (isBursting) {
    // 爆发阶段：快速加速然后减速
    burstProgress += delta / cfg.burstDuration;
    if (burstProgress >= 1) {
      isBursting = false;
      burstProgress = 0;
    } else {
      // 先快后慢（弹性缓动）
      speedMultiplier = 1 + cfg.burstAmplitude * (1 - Math.cos(burstProgress * Math.PI)) / 2;
    }
  }

  // 检查是否需要触发新的爆发
  if (!isBursting && burstTimer >= cfg.burstInterval) {
    isBursting = true;
    burstTimer = 0;
    burstProgress = 0;
  }

  // 计算角度增量
  const angleDelta = delta * cfg.orbitSpeed * speedMultiplier;

  // ---- 椭圆轨迹（带上下浮动） ----
  const baseX = Math.cos(lantern.orbitAngle) * cfg.orbitRadiusX;
  const baseY = Math.sin(lantern.orbitAngle) * cfg.orbitRadiusY + 1.5;

  // 叠加垂直浮动（鱼在水中上下起伏）
  const floatOffset = Math.sin(elapsed * 0.8) * 0.2;
  const targetX = baseX;
  const targetY = baseY + floatOffset;

  // 平滑跟随（让鱼的运动有惯性，不硬切）
  const lerpFactor = 0.15;
  const newX = pos.x + (targetX - pos.x) * lerpFactor;
  const newY = pos.y + (targetY - pos.y) * lerpFactor;
  const newZ = (pos.z || 0) + (-0.3 - (pos.z || -0.3)) * lerpFactor;

  lantern.setPosition(newX, newY, newZ);

  // ---- 让鱼灯朝向运动方向 ----
  const nextAngle = lantern.orbitAngle + angleDelta * 1.5;
  const nextX = Math.cos(nextAngle) * cfg.orbitRadiusX;
  const nextY = Math.sin(nextAngle) * cfg.orbitRadiusY + 1.5;
  const lookTarget = new THREE.Vector3(nextX, nextY, -0.5);
  lantern.lookAt(lookTarget);

  // 累加角度（但轨道位置由 lerp 驱动）
  lantern.orbitAngle += angleDelta;

  // ---- 更新鱼灯姿态 ----
  lantern.update(delta, elapsed);
}

export function stop() {
  isActive = false;
}

export function getLantern() {
  return lantern;
}
