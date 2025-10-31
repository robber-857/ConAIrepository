"use client";

import React, { useRef, useEffect, useState } from "react";
import { useMediaPipePose } from "@/hooks/useMediaPipePose";
import { calculateAndDrawAngles } from "@/lib/angles2d";
import type { Results } from "@mediapipe/pose";

interface Pose2DCanvasProps {
  videoUrl: string;
  isPlaying: boolean;
  onVideoEnd: () => void;
}

export default function Pose2DCanvas({ videoUrl, isPlaying, onVideoEnd }: Pose2DCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { isReady, error, pose, drawingUtils, connections } = useMediaPipePose();

  const [ratio, setRatio] = useState<string>("16 / 9");
  const dprRef = useRef(1);

  function resizeCanvasToBox() {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const rect = wrap.getBoundingClientRect();          // 盒子 CSS 尺寸
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;

    // ① 只设置画布像素尺寸，不要对 ctx 再 setTransform（关键改动）
    canvas.width  = Math.max(1, Math.round(rect.width  * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
  }
//监听视频元数据以设定比例
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onMeta = () => {
      setRatio(`${v.videoWidth} / ${v.videoHeight}`);
      resizeCanvasToBox();
    };
    v.addEventListener("loadedmetadata", onMeta, { once: true });
    return () => v.removeEventListener("loadedmetadata", onMeta);
  }, [videoUrl]);
//窗口尺寸变化时重建画布像素
  useEffect(() => {
    const onResize = () => resizeCanvasToBox();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!pose) return;

    const handleResults = (results: Results) => {
      const canvas = canvasRef.current!;
      const video  = videoRef.current!;
      const ctx = canvas.getContext("2d")!;
      // ② 绘制全部使用“设备像素”尺寸（canvas.width/height）
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(video, 0, 0, W, H);

      if (results.poseLandmarks && drawingUtils && connections) {
        drawingUtils.drawConnectors(ctx, results.poseLandmarks, connections, { color: "#0ea5e9", lineWidth: 3 });
        drawingUtils.drawLandmarks(ctx, results.poseLandmarks, { color: "#e11d48", lineWidth: 2, radius: 4 });
        //只有在有 pose 关键点（results.poseLandmarks）并且 MediaPipe 的绘制工具（drawingUtils）
        // 和连接数组（connections）就绪时才绘制骨架与关键点，防止空指针或未初始化调用。
        //1.使用 MediaPipe 的工具在画布上绘制骨架连线（关节之间的边），
        // connections 指定哪些关节相连，传入样式选项控制颜色和线宽
        //2.在骨架线上绘制每个关键点（小圆点），用指定颜色、线宽与半径突出显示关节点。
        calculateAndDrawAngles(ctx, results.poseLandmarks);
        //3.调用自定义函数计算并绘制关节角度/注释
        // 如果它期望“像素坐标”，用下面这一行替换成像素后再传入：
        // const px = results.poseLandmarks.map(p => ({ ...p, x: p.x * W, y: p.y * H }));
        // calculateAndDrawAngles(ctx, px as any);
      }
    };
    //推理结果回调
    //绘制顺序：清屏 → 画视频帧 → 画骨架 → 画角度注释。
    //坐标体系：canvas.width/height 使用设备像素，因此 drawImage 和骨架覆盖都与像素一一对应（不会因 CSS 缩放模糊）。
    //归一化 vs 像素：MediaPipe 的 poseLandmarks 通常是 0~1 的归一化值；你的角度计算函数若吃归一化坐标就直接传，否则先映射到像素再传。
    pose.onResults(handleResults);
  }, [pose, drawingUtils, connections]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !isReady || !pose) return;

    let raf = 0;
    const loop = async () => {
      // ③ 侦测 dpr 改变（浏览器缩放会触发），变了就立刻重设画布尺寸
      const cur = window.devicePixelRatio || 1;
      if (Math.abs(cur - dprRef.current) > 1e-3) {
        resizeCanvasToBox();
      }
      //如果视频还在播，把当前帧送入 MediaPipe
      //如果暂停/结束，不再排队新的 requestAnimationFrame
      if (!v.paused && !v.ended) {
        await pose.send({ image: v });
        raf = requestAnimationFrame(loop);
      }
    };
//播放/推理循环
    if (isPlaying) {
      v.play().catch((err) => { if (err?.name !== "AbortError") console.error("Video play error:", err); });
      raf = requestAnimationFrame(loop);
    } else {
      v.pause();
    }
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, isReady, pose]);

  return (
    <div
      ref={wrapRef}
      className="relative w-full max-w-5xl max-h-[calc(100vh-220px)] mx-auto rounded-xl overflow-hidden shadow-2xl bg-black"
      style={{ aspectRatio: ratio }}
    >
      {error && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-red-900/80 backdrop-blur">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Loading failed</h3>
            <p className="text-sm opacity-80 mt-1">{error}</p>
          </div>
        </div>
      )}
      {!isReady && !error && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-black/40 backdrop-blur">
          <p>Loading analysis engine</p>
        </div>
      )}

      {/* video 只是帧源，隐藏；object-contain 保证不变形 */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="absolute inset-0 w-full h-full object-contain opacity-0"
        onEnded={onVideoEnd}
        playsInline
        muted
        loop
        preload="metadata"
        crossOrigin="anonymous"
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
    </div>
  );
}
