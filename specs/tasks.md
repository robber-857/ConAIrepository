# Tasks – Phase 1

Theme A – Realtime MVP
- A1 Setup: Next.js/R3F 脚手架、布局、FPS/延迟 HUD
- A2 2D Pose: 集成 MediaPipe Pose；环形缓存(27–81)；conf 门限
- A3 Lifting: onnxruntime-web 于 Worker；WebGPU→WASM 回退；中帧 3D
- A4 Smoothing: SG 滤波 + (可选) Kalman；缺点插值
- A5 Angles: 躯干局部坐标 + 肘/膝/腕/肩角度；单元测试
- A6 Events: crouch/up/release/follow 检测；测试样例
- A7 UI: 3D 骨架 + 角度徽章；曲线含 release 标注
- A8 Tips: rules.yaml 规则引擎；中文文案
- A9 Export: angles.csv、events.json、基础 PDF

Theme B – Evaluation
- B1 数据集：10 名球员 × 50 球；关键帧
- B2 指标：角度 MAE、阶段 F1；报表
- B3 调参：阈值、窗口；遮挡/光照压力测试

Theme C – Pro (Optional)
- C1 标定：AprilTag 工具；对时
- C2 三角化：多视角 2D→3D；集成到管线
- C3 高质报告：overlay HLS + 加强版 PDF

DoD:
- 达成 Acceptance；提交可复现评测脚本与报告
