# AI Basketball Assistant – Phase 1 (Pose Estimation)

## Problem
在单机位手机视频条件下，实时给出投篮的关键生物力学角度与阶段（准备/下蹲/上升/出手/跟随），提供可视化与中文建议；后续提供离线多机位 Pro 模式获得更高精度。

## Users
- 球员（自我训练与复盘）
- 教练（教学与动作纠正）
- 家长（进展跟踪）

## Key Outcomes
- 实时角度：腕背伸、肘屈伸、肩外展/前举、髋/膝屈伸；必要时含躯干俯仰/侧倾/转动
- 关键事件：crouch_start / up_start / release / follow-through
- 可视化：R3F 3D 骨架/简化 mesh、角度曲线、角度徽章；单页 PDF 报告
- 导出：angles.csv、events.json、可选 overlay(HLS)

## Non-Goals (MVP)
战术识别、多目标同框、手指精细动作

## Constraints
室内/室外可用；手机三脚架固定机位；弱网可离线；隐私优先（端侧处理为主）

## Acceptance
- 单机位角度 MAE ≤ 10°
- 出手时刻 |Δframe| ≤ 2
- 端侧实时 ≥ 15 FPS（中端设备）
- 阶段切分 F1 ≥ 0.85（内部评测集）
