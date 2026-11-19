import React, { useState, useEffect } from 'react';
import {
  Play,
  Flame,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  Minus,
  Trash2,
  BookMarked,
  GalleryVerticalEnd,
  TrendingUp,
  CalendarDays,
  ArrowUpRight,
  GraduationCap,
  BrainCircuit,
  Target,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStudyFlow } from '../context/StudyFlowContext';
import { CircularProgress } from './CircularProgress';
import { SUBJECT_ACCENTS, PRIORITY_LABEL } from '../utils/accentStyles';
import heroStudyDeskImg from '../assets/images/hero_study_desk_1795076803116.jpg';

const DAILY_HOUR_PRESETS = [1, 2, 3, 4, 5, 6];

function formatDurationHm(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes));
  const hrs = Math.floor(safe / 60);
  const mins = safe % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

function formatHoursClean(minutes: number): string {
  const hrs = Math.round((minutes / 60) * 10) / 10;
  return `${hrs}h`;
}

function getTimeOfDayGreeting(isBn: boolean): string {
  const hr = new Date().getHours();
  if (isBn) {
    if (hr < 12) return 'শুভ সকাল';
    if (hr < 17) return 'শুভ দুপুর';
    if (hr < 21) return 'শুভ সন্ধ্যা';
    return 'শুভ রাত্রি';
  }
  if (hr < 12) return 'Good Morning';
  if (hr < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function DashboardView() {
  const {
    state,
    t,
    metrics,
    setActiveTab,
    launchFocusForSubject,
    addDailyGoal,
    toggleDailyGoal,
    deleteDailyGoal,
    updateProfile,
    showToast,
  } = useStudyFlow();

  const isBn = (state.profile.language ?? 'en') === 'bn';
  const todayKey = new Date().toISOString().slice(0, 10);
  const [selectedDayKey, setSelectedDayKey] = useState<string>(todayKey);
  const [newGoalText, setNewGoalText] = useState('');
  const [isEditingDailyTarget, setIsEditingDailyTarget] = useState(false);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [targetHoursDraft, setTargetHoursDraft] = useState<string>(() =>
    String(Math.round((state.profile.dailyGoalMinutes / 60) * 10) / 10)
  );

  useEffect(() => {
    setTargetHoursDraft(String(Math.round((state.profile.dailyGoalMinutes / 60) * 10) / 10));
  }, [state.profile.dailyGoalMinutes]);

  const formattedDate = new Intl.DateTimeFormat(isBn ? 'bn-BD' : 'en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const greetingText = getTimeOfDayGreeting(isBn);

  const selectedDay =
    metrics.dailyWeekBreakdown.find((d) => d.key === selectedDayKey) ??
    metrics.dailyWeekBreakdown.find((d) => d.isToday) ??
    metrics.dailyWeekBreakdown[0];

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    addDailyGoal(newGoalText);
    setNewGoalText('');
  };

  const applyDailyGoalHours = (hours: number, closeEditor = true) => {
    const clampedHours = Math.max(0.5, Math.min(16, Math.round(hours * 4) / 4));
    const nextMinutes = Math.round(clampedHours * 60);
    updateProfile({ dailyGoalMinutes: nextMinutes });
    setTargetHoursDraft(String(Math.round(clampedHours * 10) / 10));
    if (closeEditor) {
      setIsEditingDailyTarget(false);
    }
    showToast(`Daily study goal updated to ${formatHoursClean(nextMinutes)}`);
  };

  const handleSaveDailyTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(targetHoursDraft);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      showToast('Enter a valid daily target between 0.5 and 16 hours.');
      return;
    }
    applyDailyGoalHours(parsed, true);
  };

  const handleStepTargetHours = (deltaHours: number) => {
    const current = parseFloat(targetHoursDraft) || state.profile.dailyGoalMinutes / 60;
    const next = Math.max(0.5, Math.min(16, Math.round((current + deltaHours) * 2) / 2));
    setTargetHoursDraft(String(next));
  };

  const completedGoals = state.dailyGoals.filter((g) => g.completed).length;

  // Daily study hour target metrics
  const dailyGoalMinutes = Math.max(15, state.profile.dailyGoalMinutes || 120);
  const dailyGoalPercent = Math.min(100, Math.round((metrics.todayMinutes / dailyGoalMinutes) * 100));
  const dailyGoalReached = metrics.todayMinutes >= dailyGoalMinutes;
  const remainingMinutes = Math.max(0, dailyGoalMinutes - metrics.todayMinutes);
  const bonusMinutes = Math.max(0, metrics.todayMinutes - dailyGoalMinutes);
  const daysMetThisWeek = metrics.dailyWeekBreakdown.filter(
    (d) => d.minutes >= dailyGoalMinutes
  ).length;

  return (
    <div className="space-y-6 pb-8">
      {/* Premium Welcome Hero Section with Cozy Study Artwork */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-[#873BFF]/25 bg-gradient-to-br from-[#F7F4FF] via-white to-[#EEF8FC] dark:from-[#1B1338] dark:via-[#14102B] dark:to-[#0C0B1F] shadow-[0_14px_38px_-14px_rgba(23,19,45,0.12)] dark:shadow-[0_20px_48px_-18px_rgba(4,3,15,0.85)]">
        {/* Background Atmospheric Study Desk Illustration (Right-weighted) */}
        {!heroImgFailed && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <img
              src={heroStudyDeskImg}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgFailed(true)}
              className="w-full h-full object-cover object-right opacity-20 dark:opacity-55 scale-[1.01]"
            />
            {/* Measured Contrast Scrim ensuring 4.5:1+ legibility across light & dark */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#F9F7FF] via-[#F9F7FF]/92 to-[#F9F7FF]/25 dark:from-[#120E27] dark:via-[#15102E]/90 dark:to-[#120E27]/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#F9F7FF]/70 via-transparent to-transparent dark:from-[#0E0B20]/70 dark:via-transparent dark:to-transparent" />
          </div>
        )}

        {/* Subtle Top-Left Ambient Highlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-20 dark:opacity-30"
          style={{
            background: 'radial-gradient(circle, #873BFF 0%, transparent 72%)',
          }}
        />

        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="min-w-0 max-w-xl">
            <p className="text-xs font-semibold text-[#6D28D9] dark:text-[#16C7D9] tracking-wide">
              {formattedDate}
            </p>

            <h1 className="mt-2 text-2xl sm:text-[32px] font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
              {greetingText},{' '}
              <span className="bg-gradient-to-r from-[#873BFF] via-[#7A5AF8] to-[#16C7D9] bg-clip-text text-transparent">
                {state.profile.name}
              </span>
            </h1>

            {/* Student Institution & Academic Line */}
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              {state.profile.institution?.trim() ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className="inline-flex items-center gap-1.5 text-[#6D28D9] dark:text-[#C4B5FD] font-medium hover:underline cursor-pointer text-left"
                >
                  <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {[
                      state.profile.institution.trim(),
                      state.profile.classOrYear?.trim(),
                      state.profile.department?.trim(),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className="inline-flex items-center gap-1.5 text-[#873BFF] dark:text-[#C4B5FD] font-medium hover:underline cursor-pointer"
                >
                  <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                  <span>{isBn ? 'আপনার স্কুল / কলেজ প্রোফাইল যোগ করুন' : 'Add your school / college profile'}</span>
                </button>
              )}
            </div>

            <p className="mt-3 text-sm sm:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">
              {isBn ? 'চালিয়ে যান — আপনি ' : 'Keep your momentum — you have completed '}
              <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                {metrics.completedTopics}/{metrics.totalTopics}
              </span>{' '}
              {isBn ? 'টি টপিক শেষ করেছেন এবং আজ ' : 'syllabus topics and logged '}
              <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                {Math.floor(metrics.todayMinutes / 60)}h {metrics.todayMinutes % 60}m
              </span>{' '}
              {isBn ? 'পড়াশোনা করেছেন।' : 'of deep focus today.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('focus')}
            className="sf-glow-btn inline-flex items-center justify-center gap-2.5 px-6 py-3.5 min-h-[48px] rounded-2xl text-white font-semibold text-sm border border-white/20 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer self-start md:self-end"
          >
            <Play className="w-4 h-4 fill-current" />
            {t.dashboard.quickStart}
          </button>
        </div>
      </section>

      {/* Primary Study Statistics KPI Row */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('syllabus')}
          className="sf-glass premium-lift text-left rounded-3xl p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer active:scale-[0.99]"
        >
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t.dashboard.overallProgress}
            </p>
            <p className="mt-1.5 font-mono text-2xl sm:text-[26px] font-bold tabular-nums text-slate-900 dark:text-white leading-none">
              {metrics.overallProgress}%
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums truncate">
              {metrics.completedTopics}/{metrics.totalTopics} {t.dashboard.topicsDone}
            </p>
          </div>
          <CircularProgress
            value={metrics.overallProgress}
            size={70}
            strokeWidth={7}
            gradientFrom="#16C7D9"
            gradientTo="#873BFF"
          />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('progress')}
          className="sf-glass premium-lift text-left rounded-3xl p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer active:scale-[0.99]"
        >
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t.dashboard.focusedThisWeek}
            </p>
            <p className="mt-1.5 font-mono text-2xl sm:text-[26px] font-bold tabular-nums text-slate-900 dark:text-white leading-none">
              {metrics.weeklyHours.toFixed(1)}h
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums truncate">
              {isBn ? 'লক্ষ্য' : 'Goal'} {state.profile.weeklyGoalHours}h · {metrics.totalHoursAllTime}h {isBn ? 'মোট' : 'total'}
            </p>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#16C7D9]/20 to-[#873BFF]/15 border border-[#16C7D9]/25 flex items-center justify-center text-[#0891B2] dark:text-[#16C7D9] shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('progress')}
          className="sf-glass premium-lift text-left rounded-3xl p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer active:scale-[0.99]"
        >
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t.dashboard.dailyStreak}
            </p>
            <p className="mt-1.5 font-mono text-2xl sm:text-[26px] font-bold tabular-nums text-slate-900 dark:text-white leading-none">
              {state.profile.streakDays} {t.dashboard.days}
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums truncate">
              {isBn ? 'দৈনিক লক্ষ্য' : 'Daily target'} {Math.round((state.profile.dailyGoalMinutes / 60) * 10) / 10}h
            </p>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/15 border border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Flame className="w-6 h-6" />
          </div>
        </button>
      </section>

      {/* Modernized Weekly Calendar + Daily Study Goal Balanced Pair */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Weekly Calendar Strip */}
        <section className="xl:col-span-5 sf-glass rounded-3xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#873BFF]/15 text-[#873BFF] dark:text-[#C4B5FD] flex items-center justify-center shrink-0">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white leading-snug">
                    {t.dashboard.weeklyCalendar}
                  </h2>
                  {selectedDay && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
                      {selectedDay.label} {selectedDay.dayNum} ·{' '}
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">
                        {selectedDay.minutes > 0
                          ? `${Math.floor(selectedDay.minutes / 60)}h ${selectedDay.minutes % 60}m ${t.dashboard.studied}`
                          : t.dashboard.noSessionsYet}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {metrics.dailyWeekBreakdown.map((day) => {
                const isSelected = day.key === selectedDayKey;
                const hasActivity = day.minutes > 0;
                const metDailyGoal = day.minutes >= dailyGoalMinutes;
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => setSelectedDayKey(day.key)}
                    className={`relative flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl min-h-[72px] transition-colors cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'text-white'
                        : day.isToday
                          ? 'bg-[#873BFF]/12 dark:bg-[#873BFF]/20 text-[#873BFF] dark:text-[#C4B5FD] border border-[#873BFF]/35'
                          : 'bg-slate-100/75 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    {isSelected && (
                      <motion.span
                        layoutId="calendarSelectedDay"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                        className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#873BFF] to-[#5F2EE5] shadow-[0_8px_20px_-6px_rgba(135,59,255,0.62)] border border-white/20"
                      />
                    )}
                    <span
                      className={`relative z-10 text-[11px] font-medium ${
                        isSelected ? 'text-purple-100' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {day.label}
                    </span>
                    <span className="relative z-10 mt-1 font-mono text-base font-bold tabular-nums">
                      {day.dayNum}
                    </span>
                    <span
                      className={`relative z-10 mt-1.5 h-1 rounded-full transition-all ${
                        metDailyGoal
                          ? isSelected
                            ? 'w-5 bg-emerald-300'
                            : 'w-5 bg-emerald-500'
                          : hasActivity
                            ? isSelected
                              ? 'w-4 bg-white'
                              : 'w-4 bg-[#16C7D9]'
                            : 'w-1.5 bg-slate-300 dark:bg-white/15'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subtle Legend Footer */}
          <div className="mt-4 pt-3.5 border-t border-slate-200/70 dark:border-white/[0.07] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              {isBn ? 'সপ্তাহের লক্ষ্য পূরণ' : 'Weekly target days'}
            </span>
            <span className="font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-200">
              {daysMetThisWeek}/7 {isBn ? 'দিন' : 'days met'}
            </span>
          </div>
        </section>

        {/* Daily Study Hour Goal Tracker */}
        <section className="xl:col-span-7 sf-glass rounded-3xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    dailyGoalReached
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-[#873BFF]/15 text-[#873BFF] dark:text-[#C4B5FD]'
                  }`}
                >
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white leading-snug">
                    {isBn ? 'দৈনিক পড়ার লক্ষ্য' : 'Daily Goal'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isBn
                      ? 'প্রতিদিনের পড়ার ঘণ্টার লক্ষ্য সেট ও ট্র্যাক করুন'
                      : 'Track your daily study hour target and weekly consistency'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {!isEditingDailyTarget ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingDailyTarget(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-[#873BFF]/12 dark:hover:bg-white/[0.12] border border-slate-200/70 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#6D28D9] dark:hover:text-white transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {isBn ? `লক্ষ্য পরিবর্তন (${formatHoursClean(dailyGoalMinutes)})` : `Edit Target (${formatHoursClean(dailyGoalMinutes)})`}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingDailyTarget(false)}
                    className="inline-flex items-center gap-1 px-3 py-2 min-h-[40px] rounded-xl bg-slate-100 dark:bg-white/[0.06] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    {isBn ? 'বন্ধ করুন' : 'Close'}
                  </button>
                )}

                {!dailyGoalReached && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('focus')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl bg-[#873BFF]/15 hover:bg-[#873BFF] text-[#6D28D9] hover:text-white dark:bg-[#873BFF]/22 dark:text-[#C4B5FD] dark:hover:bg-[#873BFF] dark:hover:text-white text-xs font-semibold transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    {isBn ? 'এখনই পড়ুন' : 'Focus Now'}
                  </button>
                )}
              </div>
            </div>

            {/* Inline Target Editor */}
            {isEditingDailyTarget && (
              <div className="mt-4 pt-4 border-t border-slate-200/70 dark:border-white/[0.07] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
                      Quick presets:
                    </span>
                    {DAILY_HOUR_PRESETS.map((hrs) => {
                      const active = Math.abs(dailyGoalMinutes - hrs * 60) < 1;
                      return (
                        <button
                          key={hrs}
                          type="button"
                          onClick={() => applyDailyGoalHours(hrs, true)}
                          className={`px-3 py-1.5 min-h-[36px] rounded-xl font-mono text-xs font-semibold tabular-nums transition-all active:scale-95 cursor-pointer ${
                            active
                              ? 'bg-[#873BFF] text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-[#873BFF]/15 hover:text-[#6D28D9] dark:hover:text-white'
                          }`}
                        >
                          {hrs}h
                        </button>
                      );
                    })}
                  </div>

                  <form onSubmit={handleSaveDailyTarget} className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStepTargetHours(-0.5)}
                      aria-label="Decrease target by 30 minutes"
                      className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <div className="relative">
                      <input
                        type="number"
                        min={0.5}
                        max={16}
                        step={0.5}
                        value={targetHoursDraft}
                        onChange={(e) => setTargetHoursDraft(e.target.value)}
                        aria-label="Daily study goal in hours"
                        className="w-24 pl-3 pr-8 py-2 min-h-[36px] rounded-xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.12] font-mono text-xs font-semibold tabular-nums text-slate-900 dark:text-white focus:outline-none focus:border-[#873BFF]"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400 pointer-events-none">
                        hrs
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleStepTargetHours(0.5)}
                      aria-label="Increase target by 30 minutes"
                      className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 px-3.5 py-2 min-h-[36px] rounded-xl bg-[#873BFF] hover:bg-[#732EE8] text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Save
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Daily Goal Progress Visualization */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            <div className="md:col-span-7 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="shrink-0 self-start sm:self-center">
                <CircularProgress
                  value={dailyGoalPercent}
                  size={88}
                  strokeWidth={8}
                  gradientFrom={dailyGoalReached ? '#10B981' : '#873BFF'}
                  gradientTo="#16C7D9"
                >
                  <span className="font-mono text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                    {dailyGoalPercent}%
                  </span>
                </CircularProgress>
              </div>

              <div className="flex-1 min-w-0 space-y-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <span className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                      {formatDurationHm(metrics.todayMinutes)}
                    </span>
                    <span className="font-mono text-sm text-slate-500 dark:text-slate-400 tabular-nums ml-1.5">
                      / {formatHoursClean(dailyGoalMinutes)} {isBn ? 'লক্ষ্য' : 'target'}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-semibold tabular-nums ${
                      dailyGoalReached
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-[#873BFF] dark:text-[#C4B5FD]'
                    }`}
                  >
                    {dailyGoalReached
                      ? bonusMinutes > 0
                        ? isBn
                          ? `লক্ষ্য পূরণ · +${formatDurationHm(bonusMinutes)} বাড়তি`
                          : `Goal reached · +${formatDurationHm(bonusMinutes)} extra`
                        : isBn
                          ? 'আজকের লক্ষ্য পূরণ!'
                          : 'Daily goal reached!'
                      : isBn
                        ? `আরও ${formatDurationHm(remainingMinutes)} বাকি`
                        : `${formatDurationHm(remainingMinutes)} remaining`}
                  </span>
                </div>

                {/* Smooth Animated Progress Bar */}
                <div>
                  <div className="h-2.5 w-full rounded-full bg-slate-200/80 dark:bg-white/[0.07] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${dailyGoalPercent}%` }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      className={`h-full rounded-full ${
                        dailyGoalReached
                          ? 'bg-gradient-to-r from-emerald-500 to-[#16C7D9]'
                          : 'bg-gradient-to-r from-[#873BFF] via-[#7A5AF8] to-[#16C7D9]'
                      }`}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between font-mono text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
                    <span>0h</span>
                    <span>{formatHoursClean(dailyGoalMinutes / 2)}</span>
                    <span>{formatHoursClean(dailyGoalMinutes)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 7-Day Daily Target Consistency Bars */}
            <div className="md:col-span-5 md:pl-5 md:border-l border-slate-200/70 dark:border-white/[0.07]">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {isBn ? 'সাপ্তাহিক ধারাবাহিকতা' : '7-Day Rhythm'}
                </span>
                <span className="font-mono text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                  {daysMetThisWeek}/7
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1.5 items-end h-[74px]">
                {metrics.dailyWeekBreakdown.map((day) => {
                  const ratio = Math.min(100, Math.round((day.minutes / dailyGoalMinutes) * 100));
                  const met = day.minutes >= dailyGoalMinutes;
                  return (
                    <div
                      key={day.key}
                      className="flex flex-col items-center justify-end h-full gap-1.5"
                      title={`${day.label}: ${formatDurationHm(day.minutes)} / ${formatHoursClean(dailyGoalMinutes)}`}
                    >
                      <div className="w-full max-w-[18px] flex-1 rounded-full bg-slate-200/75 dark:bg-white/[0.06] flex items-end overflow-hidden">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${day.minutes > 0 ? Math.max(14, ratio) : 0}%` }}
                          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          className={`w-full rounded-full ${
                            met
                              ? 'bg-gradient-to-t from-emerald-500 to-[#16C7D9]'
                              : day.isToday
                                ? 'bg-gradient-to-t from-[#873BFF] to-[#A855F7]'
                                : 'bg-[#873BFF]/55 dark:bg-[#873BFF]/70'
                          }`}
                        />
                      </div>
                      <span
                        className={`text-[10px] font-medium ${
                          day.isToday
                            ? 'text-[#873BFF] dark:text-[#C4B5FD] font-semibold'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {day.label.slice(0, 2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Main Balanced 2-Column Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Active Subjects + Study Tools Shortcuts */}
        <div className="lg:col-span-7 space-y-6">
          <section className="sf-glass rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  {t.dashboard.activeSubjects}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.dashboard.tapPlayHint}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('syllabus')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#873BFF] dark:text-[#C4B5FD] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                {t.dashboard.seeSyllabus}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {state.subjects.length === 0 ? (
              <div className="py-10 text-center">
                <GraduationCap className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-600 dark:text-slate-400">No subjects added yet.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('syllabus')}
                  className="mt-3 px-4 py-2 rounded-xl bg-[#873BFF] text-white text-xs font-semibold cursor-pointer"
                >
                  Create First Subject
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-200/60 dark:divide-white/[0.06]">
                {state.subjects.map((subject) => {
                  const stats = metrics.subjectProgressMap[subject.id] ?? {
                    percent: 0,
                    completed: 0,
                    total: 0,
                    weekHours: 0,
                  };
                  const accent = SUBJECT_ACCENTS[subject.accent];
                  return (
                    <div
                      key={subject.id}
                      className="py-4 first:pt-0 last:pb-0 flex items-center gap-3.5"
                    >
                      <div
                        className={`w-11 h-11 rounded-2xl ${accent.softBg} ${accent.text} border border-current/10 flex items-center justify-center shrink-0`}
                      >
                        <BookMarked className="w-5 h-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveTab('syllabus')}
                            className="font-semibold text-sm text-slate-900 dark:text-white truncate hover:text-[#873BFF] dark:hover:text-[#C4B5FD] transition-colors cursor-pointer"
                          >
                            {subject.name}
                          </button>
                          <span className="font-mono text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200 shrink-0">
                            {stats.percent}%
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          <span>{subject.code}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {stats.weekHours}h / {subject.weeklyGoalHours}h this week
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {stats.completed}/{stats.total} topics
                          </span>
                        </div>

                        <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-200/80 dark:bg-white/[0.07] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.percent}%` }}
                            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                            className={`h-full rounded-full bg-gradient-to-r ${accent.bar}`}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => launchFocusForSubject(subject.id)}
                        aria-label={`Start focus timer for ${subject.name}`}
                        title={`Focus on ${subject.name}`}
                        className="w-11 h-11 rounded-full bg-gradient-to-br from-[#873BFF] to-[#5F2EE5] hover:from-[#9652FF] hover:to-[#6D28D9] text-white flex items-center justify-center shrink-0 shadow-[0_6px_18px_-4px_rgba(135,59,255,0.55)] border border-white/15 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Study Tools Shortcuts: AI Assistant, Flashcards & Progress Report */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('assistant')}
              className="sf-glass premium-lift text-left rounded-3xl p-5 cursor-pointer active:scale-[0.985]"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-2xl bg-[#873BFF]/15 border border-[#873BFF]/25 text-[#873BFF] dark:text-[#C4B5FD] flex items-center justify-center shrink-0">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <span className="font-mono text-xs font-semibold text-[#873BFF] dark:text-[#C4B5FD]">
                  AI Tutor
                </span>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">
                {t.assistant.title}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {isBn
                  ? 'বাংলায় সারাংশ, কুইজ ও জটিল টপিকের সহজ ব্যাখ্যা'
                  : 'Bangla summaries, syllabus quizzes & concept breakdowns'}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('flashcards')}
              className="sf-glass premium-lift text-left rounded-3xl p-5 cursor-pointer active:scale-[0.985]"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-400/25 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
                  <GalleryVerticalEnd className="w-5 h-5" />
                </div>
                <span className="font-mono text-xs font-semibold tabular-nums text-indigo-600 dark:text-indigo-300">
                  {metrics.dueFlashcardsCount} {t.dashboard.due}
                </span>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">
                {t.dashboard.flashcardsTitle}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {state.revisedTodayCount} {t.dashboard.revisedToday}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('progress')}
              className="sf-glass premium-lift text-left rounded-3xl p-5 cursor-pointer active:scale-[0.985]"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-2xl bg-[#16C7D9]/15 border border-[#16C7D9]/25 text-[#0891B2] dark:text-[#16C7D9] flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="font-mono text-xs font-semibold tabular-nums text-[#0891B2] dark:text-[#16C7D9]">
                  PNG Card
                </span>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">
                {t.dashboard.progressTitle}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.dashboard.progressSub}
              </p>
            </button>
          </section>
        </div>

        {/* Right Column: Today's Study Goals & Upcoming Tasks */}
        <div className="lg:col-span-5 space-y-6">
          {/* Today's Study Goals */}
          <section className="sf-glass rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {t.dashboard.todayGoals}
              </h2>
              <span className="font-mono text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                {completedGoals}/{state.dailyGoals.length} {isBn ? 'সম্পন্ন' : 'done'}
              </span>
            </div>

            <form onSubmit={handleAddGoal} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newGoalText}
                onChange={(e) => setNewGoalText(e.target.value)}
                placeholder={t.dashboard.addGoalPlaceholder}
                className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.09] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#873BFF] transition-colors"
              />
              <button
                type="submit"
                aria-label="Add daily goal"
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#873BFF] to-[#6B2CF5] hover:from-[#9652FF] hover:to-[#7C3AED] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#873BFF]/30 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>

            {state.dailyGoals.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                No study goals set yet. Add one above to stay focused today.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {state.dailyGoals.map((goal) => (
                  <li
                    key={goal.id}
                    className="flex items-start gap-2.5 py-2.5 px-3 rounded-xl hover:bg-slate-100/70 dark:hover:bg-white/[0.04] transition-colors group"
                  >
                    <button
                      type="button"
                      onClick={() => toggleDailyGoal(goal.id)}
                      className="mt-0.5 text-[#873BFF] dark:text-[#C4B5FD] shrink-0 cursor-pointer transition-transform active:scale-90"
                      aria-label={goal.completed ? 'Mark goal incomplete' : 'Mark goal complete'}
                    >
                      {goal.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                      )}
                    </button>
                    <span
                      onClick={() => toggleDailyGoal(goal.id)}
                      className={`flex-1 text-sm leading-snug cursor-pointer ${
                        goal.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {goal.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteDailyGoal(goal.id)}
                      aria-label="Delete goal"
                      className="opacity-60 sm:opacity-0 sm:group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Upcoming Tasks & Deadlines */}
          <section className="sf-glass rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {t.dashboard.upcomingTasks}
              </h2>
              <button
                type="button"
                onClick={() => setActiveTab('syllabus')}
                className="text-xs font-semibold text-[#873BFF] dark:text-[#C4B5FD] hover:underline cursor-pointer"
              >
                {t.dashboard.manage}
              </button>
            </div>

            {metrics.upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
                All scheduled syllabus topics are complete.
              </p>
            ) : (
              <ul className="divide-y divide-slate-200/60 dark:divide-white/[0.06]">
                {metrics.upcomingDeadlines.slice(0, 5).map((item) => {
                  const priorityInfo = PRIORITY_LABEL[item.priority];
                  return (
                    <li key={item.id} className="py-3.5 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                            {item.subjectName} ·{' '}
                            <span className={priorityInfo.colorClass}>{priorityInfo.text}</span>
                          </p>
                        </div>
                        <span className="font-mono text-xs tabular-nums text-slate-600 dark:text-slate-300 shrink-0">
                          {new Date(item.deadline + 'T00:00:00').toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
