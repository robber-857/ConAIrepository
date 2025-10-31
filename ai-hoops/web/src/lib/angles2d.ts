import type { NormalizedLandmark, NormalizedLandmarkList } from '@mediapipe/pose';

/**
 * 根据三个关节点计算夹角（单位：度）
 * @param a - 第一个点 (例如：肩膀)
 * @param b - 中间点，角度所在处 (例如：肘部)
 * @param c - 第三个点 (例如：手腕)
 * @returns 角度值 (0-180)
 */
//这里的坐标是 MediaPipe 的归一化坐标（0~1）；用于角度没问题，因为比例缩放不影响角度。
function calculateAngle(a: NormalizedLandmark, b: NormalizedLandmark, c: NormalizedLandmark): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  return angle;
}

/**
 * 在 Canvas 的指定关节点旁绘制角度文本
 * @param ctx - Canvas 2D 上下文
 * @param landmarks - MediaPipe 返回的关节点数组
 * @param p1Idx, p2Idx, p3Idx - 三个关节点的索引
 * @param label - 角度的标签 (例如 'Elbow')
 */
function drawAngle(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  p1Idx: number,
  p2Idx: number,
  p3Idx: number,
  label: string
) {
  const p1 = landmarks[p1Idx];
  const p2 = landmarks[p2Idx];
  const p3 = landmarks[p3Idx];

  // 确保所有关节点都存在且可见
  // 使用 ?? 0 来处理 visibility 可能为 undefined 的情况
  if (p1 && p2 && p3 && (p1.visibility ?? 0) > 0.6 && (p2.visibility ?? 0) > 0.6 && (p3.visibility ?? 0) > 0.6) {
    const angle = calculateAngle(p1, p2, p3);
    const text = `${label}: ${angle.toFixed(1)}°`;

    // 设置文本样式
    ctx.fillStyle = '#00ff00'; // 亮绿色
    ctx.font = 'bold 28px "Geist Mono", monospace';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    
    // 文本位置（在关节点旁边，乘以画布宽高得到像素坐标）
    const posX = p2.x * ctx.canvas.width;
    const posY = p2.y * ctx.canvas.height;
    
    // 绘制带描边的文本，使其在任何背景下都清晰可见
    ctx.strokeText(text, posX + 15, posY + 15);
    ctx.fillText(text, posX + 15, posY + 15);
  }
}

/**
 * 计算并绘制所有我们关心的角度
 * @param ctx - Canvas 2D 上下文
 * @param landmarks - MediaPipe 返回的关节点数组
 */
export function calculateAndDrawAngles(ctx: CanvasRenderingContext2D, landmarks: NormalizedLandmarkList) {
  // 索引来自 MediaPipe Pose Landkmarks 文档
  // 左肘
  drawAngle(ctx, landmarks, 11, 13, 15, 'L Elbow');
  // 右肘
  drawAngle(ctx, landmarks, 12, 14, 16, 'R Elbow');
  // 左膝
  drawAngle(ctx, landmarks, 23, 25, 27, 'L Knee');
  // 右膝
  drawAngle(ctx, landmarks, 24, 26, 28, 'R Knee');
  // 左肩
  drawAngle(ctx, landmarks, 13, 11, 23, 'L Shoulder');
  // 右肩
  drawAngle(ctx, landmarks, 14, 12, 24, 'R Shoulder');
}


