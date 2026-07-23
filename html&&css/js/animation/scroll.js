/**
 * 滚动叙事 — ScrollTrigger 驱动
 * 内容板块沿河流方向错落淡入
 * （占位模块，后续随着内容板块完善再细化）
 */
import { gsap, ScrollTrigger } from '../lib.js';

export function init() {
  gsap.registerPlugin(ScrollTrigger);

  // 由于当前是单页 + 3D 场景，
  // 内容区块将在后续迭代中通过叠加 HTML 层实现
  // 此处预留接口

  setupScrollProxy();
}

/**
 * 滚动代理：在转场后的探索状态下，
 * 滚动控制相机位置沿河流移动
 */
function setupScrollProxy() {
  // 预留：当内容板块就绪后，
  // 使用 ScrollTrigger 将页面滚动映射为
  // 相机沿 Z 轴（河流方向）的移动
}
