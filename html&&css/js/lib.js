/**
 * 外部库统一导出
 *
 * Three.js 通过 importmap 以 ESM 方式引入（three.module.js 无 UMD 构建），
 * GSAP / ScrollTrigger 通过 <script> 标签加载（UMD 构建，挂在 window 上）。
 *
 * 各业务模块统一从本模块导入，无需关心底层加载方式。
 */
export * as THREE from 'three';
export { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
export const gsap = window.gsap;
export const ScrollTrigger = window.ScrollTrigger;
