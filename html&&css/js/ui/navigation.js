/**
 * 导航交互 — 点击三板块标记跳转到对应区域
 * （占位模块，后续随内容板块完善）
 */
export function init() {
  const markers = document.querySelectorAll('.section-marker');
  markers.forEach(el => {
    el.addEventListener('click', () => {
      const section = el.dataset.section;
      console.log(`📍 导航至板块：${section}`);
      // TODO: 滚动/跳转到对应内容区域
    });
  });
}
