---
name: project-architecture-decision
description: 鱼灯展网站的技术架构方案和模块设计决策
metadata:
  type: project
---

# 鱼灯展 — 架构决策记录

## 技术选型

- **原生 HTML + CSS + JS**，不引入框架
- **Three.js** (ESM, importmap) + **GSAP** (UMD, script 标签)
- 外部库统一通过 `lib.js` 导出，业务模块只从 `lib.js` 导入

## 模块分层

`main.js` 主入口 → `scene/` 3D场景 + `lantern/` 鱼灯对象 + `animation/` 动画编排 + `ui/` 交互组件

## 状态机

`loading → opening → transition → explore`

## 动画控制流

开场（非匀速转动）→ 点击开始 → 转场（冲屏+镜头推进+三鱼灯升起）→ 滚动叙事（预留）

## 关键设计决策

1. 鱼灯非匀速转动：椭圆轨道 + 周期性爆发/缓行 + lerp 惯性
2. 转场时鱼灯游向观者（Z轴正向），不是屏幕深处
3. 夜间场景还原鱼灯夜游真实体验
4. 徽派建筑为程序化生成，近处有细节，远处为剪影层
5. 三鱼灯颜色：暖橙/赤金/火红，分别对应文化/工艺/地图板块

## 当前状态

Phase 1 代码已完成，Phase 2 需要调试（页面空白问题）

**Why:** 先写设计文档再编码，确保每个模块的职责和接口在动手前清晰。
**How to apply:** 修改任何模块前先查 `鱼灯网站设计计划书.md` 确认整体设计一致性。
