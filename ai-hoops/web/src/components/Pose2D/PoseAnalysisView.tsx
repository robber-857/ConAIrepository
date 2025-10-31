"use client";
import React, { useState, useEffect, useRef } from "react";
import Pose2DCanvas from "./Pose2DCanvas";
import Controls from "./Controls";

export default function PoseAnalysisView({ file, onClear }: { file: File; onClear: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    // 换文件时生成新 URL，先安全清理旧的
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const u = URL.createObjectURL(file);
    urlRef.current = u;
    setVideoUrl(u);
    // 仅在组件卸载时清理，避免 StrictMode 提前 revoke
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [file]);

  return (
    <div className="p-4 sm:p-6 flex flex-col items-center">
      <Pose2DCanvas
        videoUrl={videoUrl}
        isPlaying={isPlaying}
        onVideoEnd={() => setIsPlaying(false)}
      />
      <Controls
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(p => !p)}
        onClear={onClear}
      />
    </div>
  );
}
