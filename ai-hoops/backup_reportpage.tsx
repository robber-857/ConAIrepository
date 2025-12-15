"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import globalConfig from "@/config/templates/global.json";
import { getAllTemplates, getTemplateById, ActionTemplate } from "@/config/templates/index";
import { calculateRealScore, ScoreResult, Grade } from "@/lib/scoring";
import { useAnalysisStore } from "@/store/analysisStore";
import MetricTimelineCard from "@/components/Pose2D/MetricTimelineCard";
import { ChevronLeft, Share2, Download, Activity, CheckCircle2, AlertCircle } from "lucide-react";

/** ✅ 允许 style 里使用 CSS 变量（--xxx），避免 as any */
type CSSVarStyle = React.CSSProperties & Record<`--${string}`, string>;

function getLocalGrade(score: number): Grade {
  if (score >= 90) return "S";
  if (score >= 85) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

export default function ReportPage() {
  const { currentScore, currentAngles, currentVideoUrl, currentTemplate, currentTimeline } = useAnalysisStore();
  const [ageGroup, setAgeGroup] = useState<string>("16-18"); // 默认值年龄的容忍是1
  // 状态管理
  const [selectedMode, setSelectedMode] = React.useState<"shooting" | "dribbling">("dribbling");
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string>("");
  const [result, setResult] = React.useState<ScoreResult | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  // 初始化：从 Store 同步模式和模板ID
  useEffect(() => {
    if (currentTemplate) {
      setSelectedMode(currentTemplate.mode);
      setSelectedTemplateId(currentTemplate.templateId);
    }
  }, [currentTemplate]);

  // 获取模板列表
  const templates: ActionTemplate[] = getAllTemplates(selectedMode);

  // 默认选中第一个
  useEffect(() => {
    if (templates && templates.length > 0) {
      const currentExists = templates.find((t) => t.templateId === selectedTemplateId);
      if (!selectedTemplateId || !currentExists) {
        if (templates[0]) setSelectedTemplateId(templates[0].templateId);
      }
    } else {
      setSelectedTemplateId("");
    }
  }, [selectedMode, templates, selectedTemplateId]);

  // --- [核心修复] 计算逻辑 ---
  useEffect(() => {
    if (selectedTemplateId && currentAngles && currentAngles.length > 0) {
      const template = getTemplateById(selectedTemplateId);

      if (template) {
        console.group("🔄 Re-calculating Score");
        console.log("Target Template:", template.displayName);

        // 1. 执行计算
        const realResult = calculateRealScore(template, currentAngles, {
          ageGroup: ageGroup, // <--- 关键点
          handedness: "right" // 或 auto
        });

        // 2. [修复] 打印计算出来的【新结果】，而不是 Store 里的旧 currentScore
        console.log("✅ New Calculation Result:", realResult);

        // 3. 更新 UI
        setResult(realResult);
        console.groupEnd();
      }
    } else if (currentAngles && currentAngles.length > 0 && !result) {
      // 如果有数据但没结果(比如刚加载)，尝试用 Store 里的旧结果兜底
      if (currentScore) setResult(currentScore);
    }
  }, [selectedTemplateId, currentAngles, currentScore, ageGroup]); // 移除 currentTemplate 依赖，防止混淆

  // UI-only：评分色板（S金 / F红 / AB绿 / CD蓝）
  const gradeTone = (g: Grade) => {
    if (g === "S") {
      return {
        tint: "bg-[#FFF6D6]",
        border: "border-[#E8C547]",
        accent: "#E8C547",
        led: "232 197 71",
        badge: "bg-[#E8C547]/15 text-[#8A6A00] border-[#E8C547]/35"
      };
    }
    if (g === "F") {
      return {
        tint: "bg-[#FFE8E8]",
        border: "border-[#F2A1A1]",
        accent: "#E35757",
        led: "227 87 87",
        badge: "bg-[#E35757]/10 text-[#B42323] border-[#E35757]/30"
      };
    }
    if (g === "A" || g === "B") {
      return {
        tint: "bg-[#EAF9EF]",
        border: "border-[#86E2A3]",
        accent: "#22C55E",
        led: "34 197 94",
        badge: "bg-emerald-500/10 text-emerald-700 border-emerald-500/25"
      };
    }
    // C / D
    return {
      tint: "bg-[#EAF2FF]",
      border: "border-[#9BC2FF]",
      accent: "#3B82F6",
      led: "59 130 246",
      badge: "bg-blue-500/10 text-blue-700 border-blue-500/25"
    };
  };

  const ScoreCard = ({
    title,
    score,
    weight,
    icon: Icon
  }: {
    title: string;
    score: number;
    weight?: number;
    icon: React.ComponentType<{ className?: string }>;
  }) => {
    const grade = getLocalGrade(score);
    const tone = gradeTone(grade);
    const num = Math.round(score);

    return (
      <Card
        className={cn(
          "group relative overflow-hidden transition-all",
          "rounded-2xl border bg-white shadow-sm hover:shadow-md hover:-translate-y-[1px]",
          "charge-glow",
          tone.border
        )}
        style={{ "--sheen": tone.led } as CSSVarStyle}
      >
        {/* 左侧强调色条 */}
        <div className="absolute top-0 left-0 h-full w-1" style={{ background: tone.accent }} />

        {/* 充能流光（更明显一点） */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.16] group-hover:opacity-[0.30] transition-opacity">
          <div className="charge-sheen absolute -inset-10" />
        </div>

        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[#6B7280] text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
              <Icon className="w-4 h-4 text-[#E35757]" /> {title}
            </span>

            {weight !== undefined && (
              <Badge variant="outline" className="text-[10px] text-[#6B7280] border-[#E5E7EB] bg-white">
                {(weight * 100).toFixed(0)}%
              </Badge>
            )}
          </div>

          <div className="flex items-baseline gap-2 mt-auto">
            {/* ✅ LED 数字：底层可见 + 上层扫描高光（永远不会消失） */}
            <span
              className="text-3xl font-extrabold tabular-nums led-num"
              data-text={String(num)}
              style={{ "--led": tone.led } as CSSVarStyle}
            >
              {num}
            </span>

            <Badge className={cn("h-6 px-2 text-[11px] font-extrabold rounded-md border", tone.badge)}>
              {grade}
            </Badge>
          </div>

          <div className="mt-4">
            <div className="h-2 w-full rounded-full bg-[#EEF0F3] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.max(0, Math.min(100, score))}%`,
                  background: tone.accent
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!isMounted) return null;

  const overallGrade: Grade = result ? result.grade : "F";
  const overallTone = gradeTone(overallGrade);
  const overallNum = result ? Math.round(result.overall) : 0;

  return (
    <div className="min-h-screen bg-[#F4F4F4] text-[#111827] font-sans pb-20 relative">
      {/* 轻微科技网格背景 */}
      <div className="pointer-events-none absolute inset-0 tech-grid opacity-[0.35]" />

      {/* ✅ Header：背景柔红 */}
      <header className="border-b border-[#E35757]/20 bg-[#E35757] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-white hover:bg-white/10 hover:text-white"
            >
              <Link href={selectedMode === "dribbling" ? routes.pose2d.dribbling : routes.pose2d.shooting}>
                <ChevronLeft className="w-5 h-5" />
              </Link>
            </Button>

            <div>
              <h1 className="text-lg font-extrabold text-white">Analysis Report</h1>
              <p className="text-xs text-white/80">Generated on {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 模式切换：保持可读性 */}
            <div className="flex bg-white rounded-xl p-1 border border-white/30 shadow-sm">
              <button
                onClick={() => setSelectedMode("shooting")}
                className={cn(
                  "px-3 py-1 text-xs rounded-lg transition-all font-semibold",
                  selectedMode === "shooting"
                    ? "bg-[#E35757] text-white shadow"
                    : "text-[#6B7280] hover:text-[#111827]"
                )}
              >
                Shooting
              </button>
              <button
                onClick={() => setSelectedMode("dribbling")}
                className={cn(
                  "px-3 py-1 text-xs rounded-lg transition-all font-semibold",
                  selectedMode === "dribbling"
                    ? "bg-[#E35757] text-white shadow"
                    : "text-[#6B7280] hover:text-[#111827]"
                )}
              >
                Dribbling
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-2 hidden sm:flex border-white/40 bg-white/90 hover:bg-white text-[#374151]"
            >
              <Download className="w-4 h-4" /> PDF
            </Button>

            <Button
              variant="default"
              size="sm"
              className="gap-2 bg-white text-[#E35757] hover:bg-white/90"
            >
              <Share2 className="w-4 h-4" /> Share
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 relative">
        {/* Template Selector (Section Highlight) */}
        <section className="rounded-2xl bg-white/90 border border-[#E5E7EB] shadow-sm p-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="w-full max-w-sm relative">
              <label className="text-xs text-[#6B7280] mb-1.5 block ml-1 font-semibold">Select Action Template</label>
              <div className="relative group">
                <select
                  className="w-full appearance-none bg-white border border-[#E5E7EB] text-[#111827] text-sm rounded-xl p-2.5 pr-9 focus:ring-2 focus:ring-[#E35757]/25 focus:border-[#E35757] outline-none cursor-pointer hover:border-[#D1D5DB] transition-all shadow-sm"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                >
                  {templates.map((t) => (
                    <option key={t.templateId} value={t.templateId}>
                      {t.displayName}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#9CA3AF]">
                  <ChevronLeft className="w-4 h-4 -rotate-90" />
                </div>
              </div>
            </div>

            <div className="w-full sm:w-44">
              <label className="text-xs text-[#6B7280] mb-1.5 block ml-1 font-semibold">Age Group</label>
              <div className="relative group">
                <select
                  className="w-full appearance-none bg-white border border-[#E5E7EB] text-[#111827] text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-[#E35757]/25 focus:border-[#E35757] outline-none cursor-pointer hover:border-[#D1D5DB] transition-all shadow-sm"
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                >
                  {Object.keys(globalConfig.ageToleranceScale).map((age) => (
                    <option key={age} value={age}>
                      {age} Years
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Results Area */}
        {result ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Score Cards */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* OVERALL：更显眼 + 等级底色 */}
              <Card
                className={cn(
                  "col-span-2 md:col-span-1 relative overflow-hidden rounded-2xl border shadow-sm",
                  "bg-white hover:shadow-md transition-all",
                  "charge-glow",
                  overallTone.border
                )}
                style={{ "--sheen": overallTone.led } as CSSVarStyle}
              >
                {/* 等级底色 */}
                <div className={cn("absolute inset-0 opacity-[0.60]", overallTone.tint)} />

                {/* 充能流光 */}
                <div className="pointer-events-none absolute inset-0 opacity-[0.18]">
                  <div className="charge-sheen absolute -inset-10" />
                </div>

                <CardContent className="relative p-5 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-extrabold tracking-widest text-[#E35757]">OVERALL</h3>
                      <Badge className={cn("text-[12px] px-2 py-0.5 font-extrabold border rounded-md", overallTone.badge)}>
                        {result.grade}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-baseline gap-3">
                      {/* ✅ 不会消失的 LED 数字 */}
                      <span
                        className="text-5xl font-black tracking-tight tabular-nums led-num led-strong"
                        data-text={String(overallNum)}
                        style={{ "--led": overallTone.led } as CSSVarStyle}
                      >
                        {overallNum}
                      </span>
                      <span className="text-xs font-semibold text-[#6B7280]">Weighted</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-2 flex-1 bg-[#EEF0F3] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${result.overall}%`, background: overallTone.accent }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <ScoreCard title="Posture" score={result.breakdown.posture} weight={result.weights.posture} icon={Activity} />
              <ScoreCard title="Execution" score={result.breakdown.execution} weight={result.weights.execution} icon={Activity} />
              <ScoreCard title="Consistency" score={result.breakdown.consistency} weight={result.weights.consistency} icon={Activity} />
            </section>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="rounded-2xl bg-white/90 border border-[#E5E7EB] overflow-hidden shadow-sm">
                  <CardHeader className="pb-3 border-b border-[#EEF0F3]">
                    <CardTitle className="text-sm font-extrabold text-[#111827] tracking-wide flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#E35757]" />
                      Analysis Replay{" "}
                      <span className="text-xs font-semibold text-[#6B7280]">
                        (recommended: play continuously for ~10 seconds)
                      </span>
                    </CardTitle>
                  </CardHeader>

                  <div className="aspect-video bg-black relative flex items-center justify-center">
                    {currentVideoUrl ? (
                      <video src={currentVideoUrl} className="w-full h-full object-contain" controls playsInline loop />
                    ) : (
                      <p className="text-[#A9A9A9]">Video Not Found</p>
                    )}
                  </div>
                </Card>

                {/* ✅ Timeline：去掉 overflow-hidden + 强制浅色皮肤（只影响这个区域） */}
                {currentTimeline && currentTimeline.length > 0 && (
                  <div className="lightify-timeline rounded-2xl bg-white border border-[#E5E7EB] shadow-sm p-0 overflow-visible">
                    <MetricTimelineCard timeline={currentTimeline} templateId={selectedTemplateId} />
                  </div>
                )}
              </div>

              <div className="lg:col-span-1">
                <Card className="rounded-2xl bg-white/90 border border-[#E5E7EB] h-full shadow-sm flex flex-col overflow-hidden">
                  <CardHeader className="pb-3 border-b border-[#EEF0F3]">
                    <CardTitle className="text-base font-extrabold text-[#111827] flex items-center justify-between">
                      <span>Top Findings</span>
                      {result && (
                        <Badge variant="secondary" className="text-[10px] bg-white text-[#6B7280] border border-[#E5E7EB]">
                          {result.findings.length} Issues
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-0 flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
                    <div className="space-y-0 divide-y divide-[#EEF0F3]">
                      {result?.findings.map((finding, idx) => {
                        const isBad = finding.score < 70;
                        return (
                          <div key={idx} className="p-4 hover:bg-[#F7F7F8] transition-colors">
                            <div className="flex justify-between items-start mb-2 gap-3">
                              <h4 className="font-bold text-[#111827] text-sm leading-tight pr-3">{finding.title}</h4>
                              {finding.isPositive ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                              )}
                            </div>

                            <div className="flex items-center gap-2 mb-2.5">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-[#E5E7EB] text-[#6B7280] uppercase">
                                {finding.category}
                              </Badge>
                              <div className="h-3 w-px bg-[#E5E7EB]" />
                              <span className={cn("text-xs font-extrabold", isBad ? "text-[#B42323]" : "text-amber-600")}>
                                {finding.score} pts
                              </span>
                            </div>

                            <p className="text-xs text-[#374151] leading-relaxed bg-white p-2 rounded-xl border border-[#EEF0F3]">
                              {finding.hint}
                            </p>
                          </div>
                        );
                      })}

                      {(!result || result.findings.length === 0) && (
                        <div className="flex flex-col items-center justify-center py-12 text-[#6B7280] gap-2">
                          <CheckCircle2 className="w-8 h-8 opacity-30" />
                          <p className="text-sm font-semibold">No critical findings found.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-[#6B7280] bg-white/70 rounded-2xl border border-dashed border-[#D1D5DB] gap-4">
            <Activity className="w-6 h-6 opacity-40" />
            <p className="text-sm font-semibold text-[#374151]">Ready for Analysis</p>
          </div>
        )}
      </main>

      {/* UI-only CSS：科技网格 + 充能流光 + LED 数字（可见底层 + 扫描高光） */}
      <style jsx global>{`
        .tech-grid {
          background-image:
            linear-gradient(to right, rgba(169, 169, 169, 0.22) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(169, 169, 169, 0.22) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(circle at 35% 20%, rgba(0, 0, 0, 0.9), transparent 70%);
        }

        @keyframes charge-sheen {
          0% { transform: translateX(-55%) rotate(8deg); }
          100% { transform: translateX(55%) rotate(8deg); }
        }
        .charge-sheen {
          width: 140%;
          height: 140%;
          background: linear-gradient(
            110deg,
            transparent 0%,
            rgba(var(--sheen), 0.08) 35%,
            rgba(var(--sheen), 0.24) 50%,
            rgba(var(--sheen), 0.08) 65%,
            transparent 100%
          );
          animation: charge-sheen 2.2s linear infinite;
          filter: blur(0.2px);
        }

        @keyframes charge-glow {
          0%, 100% { box-shadow: 0 0 0 rgba(0,0,0,0); }
          50% { box-shadow: 0 10px 26px rgba(var(--sheen), 0.10), 0 0 0 6px rgba(var(--sheen), 0.05); }
        }
        .charge-glow {
          animation: charge-glow 2.8s ease-in-out infinite;
        }

        /* ✅ LED 数字：底层可见（永不消失）+ 上层扫描高光 */
        @keyframes led-sweep {
          0% { background-position: 0% 50%; }
          100% { background-position: 220% 50%; }
        }
        @keyframes led-flicker {
          0%, 100% { filter: brightness(1); }
          2% { filter: brightness(0.92); }
          4% { filter: brightness(1.06); }
          7% { filter: brightness(0.96); }
          10% { filter: brightness(1.08); }
          55% { filter: brightness(0.98); }
          58% { filter: brightness(1.05); }
        }

        .led-num{
          position: relative;
          display: inline-block;
          color: rgb(var(--led));
          text-shadow: 0 0 10px rgba(var(--led), 0.28), 0 0 1px rgba(0,0,0,0.12);
          animation: led-flicker 2.9s steps(1, end) infinite;
        }
        .led-num::after{
          content: attr(data-text);
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: linear-gradient(
            90deg,
            rgba(255,255,255,0.00) 0%,
            rgba(255,255,255,0.80) 18%,
            rgba(255,255,255,0.00) 36%,
            rgba(255,255,255,0.55) 52%,
            rgba(255,255,255,0.00) 70%,
            rgba(255,255,255,0.75) 86%,
            rgba(255,255,255,0.00) 100%
          );
          background-size: 220% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          opacity: 0.9;
          mix-blend-mode: screen;
          animation: led-sweep 2.2s linear infinite;
        }
        .led-strong{
          text-shadow: 0 0 18px rgba(var(--led), 0.32), 0 0 2px rgba(0,0,0,0.14);
        }

        /* ✅ Timeline 强制浅色皮肤：只作用在 wrapper 内 */
        .lightify-timeline :is([class*="bg-slate-"], [class*="bg-zinc-"], [class*="bg-neutral-"], [class*="bg-gray-"]) {
          background-color: white !important;
        }
        .lightify-timeline :is([class*="text-white"], [class*="text-slate-"], [class*="text-zinc-"], [class*="text-neutral-"], [class*="text-gray-"]) {
          color: #111827 !important;
        }
        .lightify-timeline :is([class*="border-slate-"], [class*="border-zinc-"], [class*="border-neutral-"], [class*="border-gray-"]) {
          border-color: #E5E7EB !important;
        }
      `}</style>
    </div>
  );
}
