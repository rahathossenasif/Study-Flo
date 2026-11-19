import React, { useMemo, useState } from 'react';
import {
  Download,
  Share2,
  Trophy,
  Clock,
  Flame,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { useStudyFlow } from '../context/StudyFlowContext';
import { CircularProgress } from './CircularProgress';
import { SUBJECT_ACCENTS } from '../utils/accentStyles';
import { renderProgressCardToDataUrl } from '../utils/progressCardCanvas';

export function ProgressReportView() {
  const { state, metrics, showToast } = useStudyFlow();
  const [copiedSummary, setCopiedSummary] = useState(false);

  const topSubject = useMemo(() => {
    if (state.subjects.length === 0) return 'General Studies';
    const sorted = [...state.subjects].sort((a, b) => {
      const pa = metrics.subjectProgressMap[a.id]?.percent ?? 0;
      const pb = metrics.subjectProgressMap[b.id]?.percent ?? 0;
      return pb - pa;
    });
    return sorted[0].name;
  }, [state.subjects, metrics.subjectProgressMap]);

  const maxDayHours = Math.max(
    1.5,
    ...metrics.dailyWeekBreakdown.map((d) => d.hours)
  );

  const handleDownloadCard = () => {
    const dataUrl = renderProgressCardToDataUrl({
      userName: state.profile.name,
      overallProgress: metrics.overallProgress,
      weeklyHours: metrics.weeklyHours,
      streakDays: state.profile.streakDays,
      completedTopics: metrics.completedTopics,
      totalTopics: metrics.totalTopics,
      dailyHours: metrics.dailyWeekBreakdown.map((d) => ({
        label: d.label,
        hours: d.hours,
      })),
      topSubject,
    });
    if (!dataUrl) {
      showToast('Could not generate progress card image.');
      return;
    }
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `STUDYFLO-Progress-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded STUDYFLO Progress Card PNG');
  };

  const handleCopyShareSummary = () => {
    const summary = `STUDYFLO Weekly Report — ${state.profile.name}\n• Syllabus Mastery: ${metrics.overallProgress}% (${metrics.completedTopics}/${metrics.totalTopics} topics)\n• Focused This Week: ${metrics.weeklyHours.toFixed(1)}h\n• Active Streak: ${state.profile.streakDays} Days\n• Top Subject: ${topSubject}\nPlan • Focus • Learn • Grow`;
    navigator.clipboard?.writeText(summary).catch(() => {});
    setCopiedSummary(true);
    showToast('Copied progress summary to clipboard');
    window.setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Your Progress Report
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Weekly academic rhythm, subject mastery, and shareable snapshot card
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyShareSummary}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-white dark:bg-[#111124] border border-slate-200 dark:border-white/[0.1] text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-[#7C3AED] whitespace-nowrap cursor-pointer"
          >
            {copiedSummary ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            {copiedSummary ? 'Copied Summary' : 'Copy Summary'}
          </button>
          <button
            type="button"
            onClick={handleDownloadCard}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold shadow-md shadow-[#7C3AED]/25 whitespace-nowrap cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Card PNG
          </button>
        </div>
      </div>

      {/* Top 4 KPI Summary Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sf-glass premium-lift rounded-3xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Total Study Hours</span>
            <Clock className="w-4 h-4 text-[#873BFF] dark:text-[#C4B5FD]" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            {metrics.totalHoursAllTime}h
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {metrics.weeklyHours.toFixed(1)}h logged this week
          </p>
        </div>

        <div className="sf-glass premium-lift rounded-3xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Topics Mastered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            {metrics.completedTopics}/{metrics.totalTopics}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {metrics.overallProgress}% syllabus complete
          </p>
        </div>

        <div className="sf-glass premium-lift rounded-3xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Daily Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            {state.profile.streakDays} Days
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Consistent daily habit
          </p>
        </div>

        <div className="sf-glass premium-lift rounded-3xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Top Subject</span>
            <Trophy className="w-4 h-4 text-[#16C7D9]" />
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white truncate">
            {topSubject}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Highest syllabus completion
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Shareable Card Preview */}
        <section className="lg:col-span-6 rounded-3xl bg-gradient-to-b from-[#F4F0FF] via-white to-[#EFF9FF] dark:from-[#2E1666] dark:via-[#13122C] dark:to-[#0B0B1A] border border-[#7C3AED]/20 dark:border-[#7C3AED]/40 p-6 sm:p-7 text-slate-900 dark:text-white shadow-[0_14px_38px_-12px_rgba(124,58,237,0.16)] dark:shadow-xl dark:shadow-black/25">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                STUDY<span className="text-[#7C3AED] dark:text-[#A855F7]">FLO</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-purple-200/80">
                Keep Going, {state.profile.name}!
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
            <CircularProgress
              value={metrics.overallProgress}
              size={148}
              strokeWidth={13}
              gradientFrom="#06B6D4"
              gradientTo="#7C3AED"
            >
              <span className="font-mono text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                {metrics.overallProgress}%
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-300 mt-1">Mastery</span>
            </CircularProgress>

            <div className="space-y-4 text-center sm:text-left">
              <div>
                <p className="font-mono text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {metrics.weeklyHours.toFixed(1)}h
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-300">This Week</p>
              </div>
              <div>
                <p className="font-mono text-3xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                  {state.profile.streakDays} Days
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-300">Active Streak</p>
              </div>
            </div>
          </div>

          {/* Weekly Bar Chart inside Shareable Card */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mb-4">
              <span className="font-medium">Weekly Activity (Hours)</span>
              <span className="font-mono tabular-nums">Mon – Sun</span>
            </div>

            <div className="grid grid-cols-7 gap-2.5 items-end h-36">
              {metrics.dailyWeekBreakdown.map((day) => {
                const heightPct = Math.max(10, Math.round((day.hours / maxDayHours) * 100));
                return (
                  <div key={day.key} className="flex flex-col items-center gap-2 h-full justify-end">
                    <span className="font-mono text-[10px] tabular-nums text-slate-600 dark:text-slate-300">
                      {day.hours > 0 ? `${day.hours.toFixed(1)}` : '0'}
                    </span>
                    <div className="w-full max-w-[34px] h-24 rounded-xl bg-slate-200/70 dark:bg-white/[0.06] flex items-end overflow-hidden">
                      <div
                        className={`w-full rounded-t-xl transition-all duration-500 ${
                          day.isToday
                            ? 'bg-gradient-to-t from-[#7C3AED] to-[#06B6D4]'
                            : 'bg-gradient-to-t from-[#7C3AED] to-[#A855F7] dark:from-[#5B21B6] dark:to-[#A855F7]'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span
                      className={`text-[11px] font-medium ${
                        day.isToday
                          ? 'text-[#0891B2] dark:text-cyan-300 font-semibold'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadCard}
            className="sf-glow-btn mt-7 w-full py-3.5 min-h-[48px] rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 border border-white/15 transition-all hover:-translate-y-0.5 active:scale-[0.985] cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Shareable Progress Card
          </button>
        </section>

        {/* Right: Subject-wise Performance Breakdown */}
        <section className="lg:col-span-6 sf-glass rounded-3xl p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Subject-Wise Performance
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Combines completed syllabus topics and weekly logged focus time
            </p>
          </div>

          <div className="space-y-5">
            {state.subjects.map((sub) => {
              const st = metrics.subjectProgressMap[sub.id] ?? {
                percent: 0,
                completed: 0,
                total: 0,
                weekHours: 0,
              };
              const accent = SUBJECT_ACCENTS[sub.accent];
              const goalPct = Math.min(100, Math.round((st.weekHours / sub.weeklyGoalHours) * 100));

              return (
                <div
                  key={sub.id}
                  className="pb-5 last:pb-0 border-b last:border-b-0 border-slate-100 dark:border-white/[0.06]"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {sub.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        {sub.code} · {st.completed}/{st.total} topics · {st.weekHours}h / {sub.weeklyGoalHours}h weekly goal
                      </p>
                    </div>
                    <span className={`font-mono text-sm font-bold tabular-nums ${accent.text}`}>
                      {st.percent}%
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-white/[0.07] overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${accent.bar} transition-all duration-500`}
                        style={{ width: `${st.percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 tabular-nums">
                      <span>Syllabus completion</span>
                      <span>Weekly study target: {goalPct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
