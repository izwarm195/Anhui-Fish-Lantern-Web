/**
 * 开始按钮交互
 * 点击"开始"触发转场动画
 */
import { gsap } from '../lib.js';
import * as transition from '../animation/transition.js';
import CTX from '../ctx.js';

let hasStarted = false;

export function init() {
  const btn = document.getElementById('start-btn');
  if (!btn) return;

  btn.addEventListener('click', handleStart);
  // 也支持键盘回车触发
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleStart();
    }
  });
}

function handleStart() {
  if (hasStarted || CTX.state !== 'opening') return;
  hasStarted = true;

  // 按钮淡出
  const btn = document.getElementById('start-btn');
  const header = document.getElementById('header');

  btn.style.pointerEvents = 'none';

  // 淡出 UI
  gsap.to(btn, { opacity: 0, scale: 0.8, duration: 0.5, ease: 'power2.in' });
  gsap.to(header, { opacity: 0, duration: 0.5 });

  // 触发转场
  transition.play(() => {
    console.log('🏮 转场完成 — 三鱼灯已升起');
  });
}
