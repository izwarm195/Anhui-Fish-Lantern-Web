/**
 * 鱼灯展 — 主入口
 *
 * 职责：
 *   1. 初始化 Three.js 场景 / 相机 / 渲染器
 *   2. 加载各场景模块（环境、河流、建筑）
 *   3. 创建鱼灯并启动开场动画
 *   4. 运行动画循环
 *   5. 隐藏加载屏幕
 */
import { THREE, CSS2DRenderer } from './lib.js';
import CONFIG from './config.js';
import CTX from './ctx.js';

// 场景模块
import * as Environment from './scene/environment.js';
import * as River from './scene/river.js';
import * as Architecture from './scene/architecture.js';

// 鱼灯
import { FishLantern } from './lantern/fish-lantern.js';

// 动画
import * as Opening from './animation/opening.js';
import * as Transition from './animation/transition.js';
import * as Scroll from './animation/scroll.js';

// UI
import * as StartButton from './ui/start-button.js';
import * as Navigation from './ui/navigation.js';

// ========================================
//  初始化
// ========================================

function init() {
  const container = document.getElementById('scene-container');
  if (!container) {
    console.error('❌ 未找到 #scene-container');
    return;
  }

  // ---- Three.js 场景 ----
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    CONFIG.camera.fov,
    window.innerWidth / window.innerHeight,
    CONFIG.camera.near,
    CONFIG.camera.far
  );
  camera.position.set(
    CONFIG.camera.position.x,
    CONFIG.camera.position.y,
    CONFIG.camera.position.z
  );

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // ---- CSS2D 渲染器（板块标签自动跟随 3D 物体） ----
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';
  labelRenderer.domElement.style.left = '0';
  labelRenderer.domElement.style.pointerEvents = 'none'; // 让标签本身的点击穿透，内部可点击元素再开启
  container.appendChild(labelRenderer.domElement);

  // 挂载到共享上下文
  CTX.scene = scene;
  CTX.camera = camera;
  CTX.renderer = renderer;
  CTX.labelRenderer = labelRenderer;
  CTX.clock = new THREE.Clock();

  // ---- 初始化各模块 ----
  Environment.init();
  River.init();
  Architecture.init();

  // ---- 创建主鱼灯 ----
  const mainLantern = new FishLantern({
    color: CONFIG.lantern.bodyColor,
    scale: CONFIG.lantern.scale,
    name: 'mainLantern',
  });
  scene.add(mainLantern.group);

  // ---- 启动开场动画 ----
  Opening.init(mainLantern);

  // ---- 初始化 UI ----
  StartButton.init();
  Navigation.init();

  // ---- 滚动叙事（预留） ----
  Scroll.init();

  // ---- 事件绑定 ----
  window.addEventListener('resize', onResize);

  // ---- 启动动画循环 ----
  animate();
}

// ========================================
//  动画循环
// ========================================

function animate() {
  requestAnimationFrame(animate);

  const delta = CTX.clock.getDelta();
  const elapsed = CTX.clock.getElapsedTime();

  // 更新环境
  Environment.update(delta, elapsed);

  // 更新河流波纹
  River.update(delta, elapsed);

  // 更新开场动画（仅在 opening 状态）
  if (CTX.state === 'opening') {
    Opening.update(delta, elapsed);
  }

  // 更新转场中的鱼灯
  if (CTX.state === 'transition' || CTX.state === 'explore') {
    Transition.update(delta, elapsed);
  }

  // 渲染
  CTX.renderer.render(CTX.scene, CTX.camera);
  CTX.labelRenderer.render(CTX.scene, CTX.camera);
}

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  CTX.camera.aspect = w / h;
  CTX.camera.updateProjectionMatrix();
  CTX.renderer.setSize(w, h);
  CTX.labelRenderer.setSize(w, h);
}

// ========================================
//  启动
// ========================================

// 等待 DOM 就绪
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
