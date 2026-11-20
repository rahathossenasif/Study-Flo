import React, { useEffect, useState } from 'react';
import {
  Target,
  Play,
  Plus,
  Minus,
  Check,
  CheckCircle2,
  Circle,
  Trash2,
  Flame,
  Clock,
  CalendarDays,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStudyFlow } from '../context/StudyFlowContext';
import { D3DailyGoalChart } from './D3DailyGoalChart';

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

export function DailyGoalView() {
  const {
    state,
    t,
    metrics,
    setActiveTab,
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
  const [targetHoursDraft, setTargetHoursDraft] = useState<string>(() =>
    String(Math.round((state.profile.dailyGoalMinutes / 60) * 10) / 10)
  );

  useEffect(() => {
    setTargetHoursDraft(String(Math.round((state.profile.dailyGoalMinutes / 60) * 10) / 10));
  }, [state.profile.dailyGoalMinutes]);

  const dailyGoalMinutes = Math.max(15, state.profile.dailyGoalMinutes || 120);
  const dailyGoalPercent = Math.min(100, Math.round((metrics.todayMinutes / dailyGoalMinutes) * 100));
  const dailyGoalReached = metrics.todayMinutes >= dailyGoalMinutes;
  const remainingMinutes = Math.max(0, dailyGoalMinutes - metrics.todayMinutes);
  const bonusMinutes = Math.max(0, metrics.todayMinutes - dailyGoalMinutes);
  const daysMetThisWeek = metrics.dailyWeekBreakdown.filter(
    (d) => d.minutes >= dailyGoalMinutes
  ).length;
  const completedGoals = state.dailyGoals.filter((g) => g.completed).length;

  const selectedDay =
    metrics.dailyWeekBreakdown.find((d) => d.key === selectedDayKey) ??
    metrics.dailyWeekBreakdown.find((d) => d.isToday) ??
    metrics.dailyWeekBreakdown[0];

  const todaySessions = state.sessions
    .filter((s) => s.completedAt.slice(0, 10) === todayKey)
    .slice(0, 6);

  const subjectMap = new Map(state.subjects.map((s) => [s.id, s.name]));

  const applyDailyGoalHours = (hours: number) => {
    const clampedHours = Math.max(0.5, Math.min(16, Math.round(hours * 4) / 4));
    const nextMinutes = Math.round(clampedHours * 60);
    updateProfile({ dailyGoalMinutes: nextMinutes });
    setTargetHoursDraft(String(Math.round(clampedHours * 10) / 10));
    showToast(
      isBn
        ? `দৈনিক লক্ষ্য ${formatHoursClean(nextMinutes)} নির্ধারণ করা হয়েছে`
        : `Daily study goal updated to ${formatHoursClean(nextMinutes)}`
    );
  };

  const handleSaveDailyTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(targetHoursDraft);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      showToast(
        isBn
          ? '০.৫ থেকে ১৬ ঘণ্টার মধ্যে সঠিক লক্ষ্য দিন।'
          : 'Enter a valid daily target between 0.5 and 16 hours.'
      );
      return;
    }
    applyDailyGoalHours(parsed);
  };

  const handleStepTargetHours = (deltaHours: number) => {
    const current = parseFloat(targetHoursDraft) || state.profile.dailyGoalMinutes / 60;
    const next = Math.max(0.5, Math.min(16, Math.round((current + deltaHours) * 2) / 2));
    setTargetHoursDraft(String(next));
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    addDailyGoal(newGoalText);
    setNewGoalText('');
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 dark:text-white">
            {isBn ? 'দৈনিক লক্ষ্য ট্র্যাকার' : 'Daily Goal Tracker'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isBn
              ? 'প্রতিদিনের পড়ার লক্ষ্য, ৭ দিনের ধারাবাহিকতা এবং আজকের কাজের তালিকা এক জায়গায়।'
              : 'Track your daily study hours, 7-day consistency, and today’s study checklist.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('focus')}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-[#7C4DFF] hover:bg-[#6D3DF2] text-white font-semibold text-sm shadow-[0_6px_18px_-6px_rgba(124,77,255,0.45)] transition-all active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <Play className="w-4 h-4 fill-current" />
          {isBn ? 'ফোকাস টাইমার শুরু' : 'Start Focus Session'}
        </button>
      </header>

      {/* Main D3 Daily Goal Progress + Target Controls */}
      <section className="sf-glass rounded-2xl p-5 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: D3 Circular Chart & Readout */}
          <div className="lg:col-span-7 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="shrink-0">
              <D3DailyGoalChart
                completedMinutes={metrics.todayMinutes}
                targetMinutes={dailyGoalMinutes}
                size={144}
                strokeWidth={10}
                isBn={isBn}
              />
            </div>

            <div className="flex-1 min-w-0 space-y-3 w-full">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {isBn ? 'আজকের পড়ার অগ্রগতি' : 'Today’s Study Progress'}
                </p>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="font-display text-3xl font-bold tabular-nums text-slate-900 dark:text-white leading-none">
                    {formatDurationHm(metrics.todayMinutes)}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                    / {formatHoursClean(dailyGoalMinutes)} {isBn ? 'লক্ষ্য' : 'target'}
                  </span>
                </div>
                <p
                  className={`mt-1.5 text-xs font-semibold tabular-nums ${
                    dailyGoalReached
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-[#7C4DFF] dark:text-[#B794FF]'
                  }`}
                >
                  {dailyGoalReached
                    ? bonusMinutes > 0
                      ? isBn
                        ? `লক্ষ্য পূরণ হয়েছে · +${formatDurationHm(bonusMinutes)} বাড়তি পড়েছেন`
                        : `Target achieved · +${formatDurationHm(bonusMinutes)} bonus logged`
                      : isBn
                        ? 'অভিনন্দন! আজকের লক্ষ্য পূরণ হয়েছে।'
                        : 'Great work! Today’s target is complete.'
                    : isBn
                      ? `লক্ষ্য পূরণে আরও ${formatDurationHm(remainingMinutes)} বাকি`
                      : `${formatDurationHm(remainingMinutes)} remaining to reach today’s goal`}
                </p>
              </div>

              {/* Milestone Linear Bar */}
              <div>
                <div className="h-2.5 w-full rounded-full bg-slate-200/80 dark:bg-white/[0.08] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${dailyGoalPercent}%` }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    className={`h-full rounded-full ${
                      dailyGoalReached ? 'bg-emerald-500' : 'bg-[#7C4DFF]'
                    }`}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
                  <span>0h</span>
                  <span>{formatHoursClean(dailyGoalMinutes / 2)}</span>
                  <span>{formatHoursClean(dailyGoalMinutes)}</span>
                </div>
              </div>

              {/* Compact Summary Metrics Row */}
              <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                <span className="inline-flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  {state.profile.streakDays} {isBn ? 'দিনের স্ট্রিক' : 'day streak'}
                </span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-[#7C4DFF] dark:text-[#B794FF]" />
                  {daysMetThisWeek}/7 {isBn ? 'দিন লক্ষ্য পূরণ' : 'days met this week'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Target Hour Editor */}
          <div className="lg:col-span-5 lg:pl-6 lg:border-l border-slate-200/75 dark:border-white/[0.07] space-y-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#7C4DFF] dark:text-[#B794FF]" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                {isBn ? 'দৈনিক লক্ষ্য পরিবর্তন করুন' : 'Adjust Daily Target'}
              </h2>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                {isBn ? 'দ্রুত বাছাই করুন' : 'Quick presets'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {DAILY_HOUR_PRESETS.map((hrs) => {
                  const active = Math.abs(dailyGoalMinutes - hrs * 60) < 1;
                  return (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => applyDailyGoalHours(hrs)}
                      className={`px-3 py-1.5 min-h-[38px] rounded-xl font-mono text-xs font-semibold tabular-nums transition-all active:scale-95 cursor-pointer ${
                        active
                          ? 'bg-[#7C4DFF] text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-[#7C4DFF]/15 hover:text-[#6D28D9] dark:hover:text-white'
                      }`}
                    >
                      {hrs}h
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSaveDailyTarget} className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleStepTargetHours(-0.5)}
                aria-label="Decrease target by 30 minutes"
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer"
              >
                <Minus className="w-4 h-4" />
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
                  className="w-24 pl-3 pr-9 py-2 min-h-[40px] rounded-xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.12] font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white focus:outline-none focus:border-[#7C4DFF]"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400 pointer-events-none">
                  hrs
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleStepTargetHours(0.5)}
                aria-label="Increase target by 30 minutes"
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-xl bg-[#7C4DFF] hover:bg-[#6D3DF2] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                {isBn ? 'সংরক্ষণ' : 'Save'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Two-Column Lower Section: 7-Day Consistency + Today's Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: 7-Day Rhythm & Today's Focus Sessions */}
        <div className="lg:col-span-6 space-y-5">
          <section className="sf-glass rounded-2xl p-5">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">
                  {isBn ? 'সাপ্তাহিক ধারাবাহিকতা' : '7-Day Consistency'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                  {selectedDay
                    ? isBn
                      ? `${selectedDay.label}: ${formatDurationHm(selectedDay.minutes)} / ${formatHoursClean(dailyGoalMinutes)}`
                      : `${selectedDay.label}: ${formatDurationHm(selectedDay.minutes)} / ${formatHoursClean(dailyGoalMinutes)}`
                    : ''}
                </p>
              </div>
              <span className="text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                {daysMetThisWeek}/7 {isBn ? 'দিন' : 'met'}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2 items-end h-[128px] pt-2">
              {metrics.dailyWeekBreakdown.map((day) => {
                const ratio = Math.min(100, Math.round((day.minutes / dailyGoalMinutes) * 100));
                const met = day.minutes >= dailyGoalMinutes;
                const isSelected = selectedDay?.key === day.key;
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => setSelectedDayKey(day.key)}
                    className={`flex flex-col items-center justify-end h-full gap-1.5 rounded-xl py-1.5 px-1 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#7C4DFF]/10 dark:bg-white/[0.06]'
                        : 'hover:bg-slate-100/80 dark:hover:bg-white/[0.03]'
                    }`}
                    title={`${day.label}: ${formatDurationHm(day.minutes)} / ${formatHoursClean(dailyGoalMinutes)}`}
                  >
                    <span className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {day.minutes > 0 ? formatDurationHm(day.minutes) : '0m'}
                    </span>
                    <div className="w-full max-w-[22px] flex-1 rounded-full bg-slate-200/75 dark:bg-white/[0.07] flex items-end overflow-hidden">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${day.minutes > 0 ? Math.max(12, ratio) : 0}%` }}
                        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                        className={`w-full rounded-full ${
                          met
                            ? 'bg-gradient-to-t from-emerald-500 to-[#22B8CF]'
                            : day.isToday
                              ? 'bg-gradient-to-t from-[#7C4DFF] to-[#A855F7]'
                              : 'bg-[#7C4DFF]/55 dark:bg-[#7C4DFF]/70'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-[11px] font-medium ${
                        day.isToday
                          ? 'text-[#7C4DFF] dark:text-[#C4B5FD] font-semibold'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {day.label.slice(0, 3)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Today's Focus Sessions */}
          <section className="sf-glass rounded-2xl p-5">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">
                {isBn ? 'আজকের ফোকাস সেশন' : 'Today’s Focus Log'}
              </h2>
              <span className="text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                {todaySessions.length} {isBn ? 'সেশন' : 'sessions'}
              </span>
            </div>

            {todaySessions.length === 0 ? (
              <div className="py-6 text-center">
                <Clock className="w-6 h-6 mx-auto text-slate-400 mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isBn
                    ? 'আজ এখনো কোনো ফোকাস সেশন সম্পন্ন হয়নি।'
                    : 'No focus sessions completed today yet.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200/60 dark:divide-white/[0.06]">
                {todaySessions.map((session) => (
                  <li
                    key={session.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {session.label || subjectMap.get(session.subjectId) || 'Study Session'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {subjectMap.get(session.subjectId) ?? 'General'} ·{' '}
                        {new Date(session.completedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-semibold tabular-nums text-[#7C4DFF] dark:text-[#C4B5FD] shrink-0">
                      +{session.durationMinutes}m
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Right: Today's Study Goals Checklist */}
        <section className="lg:col-span-6 sf-glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">
                {t.dashboard.todayGoals}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isBn
                  ? 'আজ যে অধ্যায় বা কাজগুলো শেষ করতে চান সেগুলো যুক্ত করুন'
                  : 'Break down today’s target into clear actionable tasks'}
              </p>
            </div>
            <span className="text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
              {completedGoals}/{state.dailyGoals.length} {isBn ? 'সম্পন্ন' : 'done'}
            </span>
          </div>

          <form onSubmit={handleAddGoal} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newGoalText}
              onChange={(e) => setNewGoalText(e.target.value)}
              placeholder={t.dashboard.addGoalPlaceholder}
              className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.09] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#7C4DFF] transition-colors"
            />
            <button
              type="submit"
              aria-label="Add daily goal"
              className="w-11 h-11 rounded-xl bg-[#7C4DFF] hover:bg-[#6D3DF2] text-white flex items-center justify-center shrink-0 transition-colors active:scale-95 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
            </button>
          </form>

          {state.dailyGoals.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-8 text-center">
              {isBn
                ? 'এখনো কোনো দৈনিক কাজ যোগ করা হয়নি। উপরে নতুন লক্ষ্য লিখুন।'
                : 'No study goals set yet. Add one above to stay focused today.'}
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
                    className="mt-0.5 shrink-0 cursor-pointer transition-transform active:scale-90"
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
                    className="opacity-65 sm:opacity-0 sm:group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
