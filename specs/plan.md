# Plan (MVP: Single Camera)

**Frontend**: Next.js + React Three Fiber（3D 骨架/简化 mesh）+ Recharts（曲线）+ PDF 导出  
**Pose 2D**: MediaPipe Pose（默认）或 RTMPose web；每帧输出 2D 关键点+conf  
**2D→3D**: MotionBERT/PoseFormer-lite 导出 ONNX；onnxruntime-web（WebGPU→WASM）在 Worker 中推理；滑窗 27–81 帧取中帧 3D  
**Smoothing**: Savitzky–Golay(k=2, w≈15) +（可选）轻卡尔曼；缺点插值+置信度门限  
**Angles**: 躯干局部坐标（fx 左右 / fy 上下 / fz 前后）+ 骨段夹角（肩外展/前举、肘/膝屈伸、腕背伸）  
**Events**: 膝角速度负→正为 up_start；腕背伸角速度峰值附近为 release；release 后角速度回落为 follow  
**Tips**: rules.yaml（阈值/目标区间/中文话术）  
**Export**: angles.csv、events.json、PDF（前端 html2canvas+jsPDF；或服务端 Puppeteer）

## Pro（离线）
多机位（侧+斜前）；AprilTag 标定；多视角 2D→三角化（OpenCV）→ 同管线角度/事件；高质报告

## APIs（可选）
`/analyze`（上传或流式关键点→角度/事件），`/report`（PDF/HLS）

## Deliverables
/web：PoseCanvas.tsx、lift-worker.ts、angles.ts、rules.yaml、demo 数据  
/models：mbert-lite.onnx（输入 [1,27,17,3]；输出 [1,1,17,3] 或 [1,27,17,3]）  
/scripts：评测脚本（角度 MAE、阶段 F1）  
/contracts：events schema、report schema

## Milestones
W1 脚手架+3D 骨架；W2 2D Pose+滑窗；W3 ONNX+WebGPU/WASM 回退+平滑；  
W4 角度/事件+曲线；W5 规则/建议+CSV/JSON/PDF；W6 数据采集与评测；  
W7–W8（Pro）标定+三角化验证+高质报告

## Guardrails
必须满足 Acceptance；禁止未批准技术栈；隐私最小化与日志脱敏
