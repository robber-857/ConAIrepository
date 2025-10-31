'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card'; // 假设你有这个通用 UI 组件

// 动态加载上传组件，避免 SSR
const UploadDropzone = dynamic(
  () => import('../../components/Pose2D/UploadDropZone'),
  { ssr: false }
);

// 动态加载分析视图组件
const PoseAnalysisView = dynamic(
  () => import('../../components/Pose2D/PoseAnalysisView'),
  { ssr: false }
);

export default function Pose2DPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null);//保存用户上传的视频文件

  const handleClear = () => {
    setVideoFile(null);
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
            2D Pose Analysis
          </h1>
          <p className="text-gray-400 mt-2">Upload the video to analysis the pose in real time</p>
        </header>

        <Card className="border-slate-800/70 bg-slate-900/65 backdrop-blur-xl shadow-2xl">
          {videoFile ? (
            <PoseAnalysisView file={videoFile} onClear={handleClear} />
          ) : (
            <UploadDropzone onFileSelect={setVideoFile} />
          )}
        </Card>
      </div>
    </main>
  );
}//这里如果视频上传为空，那么令页面渲染UploadDropzone
//videoFile === null → 渲染 <UploadDropzone onFileSelect={setVideoFile} />
//有 videoFile → 渲染 <PoseAnalysisView file={videoFile} onClear={handleClear} />