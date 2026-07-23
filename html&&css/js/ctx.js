/**
 * 共享场景上下文
 * main.js 初始化后挂载到此对象，各模块通过它访问 scene / camera / renderer
 */
const CTX = {
  scene: null,
  camera: null,
  renderer: null,
  clock: null,
  // 状态标记
  state: 'opening',  // 'opening' | 'transition' | 'explore'
};

export default CTX;
