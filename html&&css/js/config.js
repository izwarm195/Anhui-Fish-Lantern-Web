/**
 * 鱼灯展 - 全局配置
 * 所有可调参数集中管理，方便后续迭代
 */
const CONFIG = {
  // 场景
  scene: {
    bgColor: 0x0a0a14,        // 夜空底色
    fogColor: 0x0a0a14,
    fogNear: 30,
    fogFar: 80,
  },

  // 相机
  camera: {
    fov: 60,
    near: 0.1,
    far: 100,
    position: { x: 0, y: 2, z: 12 },
    // 点击"开始"后推进到的位置
    transitionPosition: { x: 0, y: 1.5, z: 6 },
  },

  // 河流
  river: {
    width: 16,
    length: 30,
    color: 0x1a2a3a,
    highlightColor: 0x2a4a6a,
    segments: { w: 32, h: 64 },
    rippleSpeed: 0.3,
    rippleAmplitude: 0.08,
  },

  // 徽派建筑
  buildings: {
    rows: 3,                  // 沿河岸排数
    colors: {
      wall: 0x1a1a2e,
      roof: 0x0d0d1a,
      window: 0x4a3520,
      windowGlow: 0xff8833,
    },
  },

  // 鱼灯
  lantern: {
    bodyColor: 0xff8833,
    glowColor: 0xffaa44,
    scale: 0.8,
    orbitRadiusX: 3.8,
    orbitRadiusY: 2.2,
    // 非匀速转动参数
    orbitSpeed: 0.6,          // 基础速度
    burstInterval: 2.5,       // 每次"扑腾"间隔（秒）
    burstDuration: 0.6,       // 扑腾持续时长
    burstAmplitude: 2.0,      // 扑腾幅度（速度倍数）
  },

  // 流光拖尾
  trail: {
    count: 60,
    lifespan: 1.2,
    color: 0xffaa44,
    size: 0.06,
  },

  // 过渡动画
  transition: {
    duration: 2.0,            // 鱼灯冲屏时长
    cameraPushDuration: 2.5,  // 镜头推进时长
    revealDelay: 0.8,         // 三鱼灯升起延迟
  },

  // 三大板块
  sections: [
    {
      id: 'culture',
      title: '鱼灯文化',
      subtitle: '千年传承·徽州记忆',
      color: 0xff8833,
      position: { x: -3.5, z: -5 },
    },
    {
      id: 'craft',
      title: '制作工艺',
      subtitle: '扎骨·裱糊·绘彩·灯芯',
      color: 0xff6633,
      position: { x: 0, z: -7 },
    },
    {
      id: 'map',
      title: '文旅地图',
      subtitle: '探寻鱼灯·实地观赏',
      color: 0xff4433,
      position: { x: 3.5, z: -5 },
    },
  ],

  // 粒子（萤火虫）
  firefly: {
    count: 80,
    spread: { x: 12, y: 5, z: 8 },
    size: 0.03,
    color: 0xaaff88,
    speed: 0.15,
  },
};

export default CONFIG;
