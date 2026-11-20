import React, { useState, useEffect } from 'react';
import {
  Moon,
  Sun,
  User,
  Bell,
  Check,
  GraduationCap,
  ArrowRight,
  Globe,
  Wifi,
  WifiOff,
  HardDrive,
} from 'lucide-react';
import { useStudyFlow } from '../context/StudyFlowContext';
import { PWAInstallButton } from './PWAInstallButton';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { getOfflineStorageSizeKb } from '../utils/offlineDb';

export function SettingsView() {
  const {
    state,
    t,
    updateProfile,
    setActiveTab,
    showToast,
  } = useStudyFlow();
  const isOnline = useOnlineStatus();
  const isBn = (state.profile.language ?? 'en') === 'bn';
  const offlineSizeKb = getOfflineStorageSizeKb(state);

  const [nameDraft, setNameDraft] = useState(state.profile.name);
  const [institutionDraft, setInstitutionDraft] = useState(state.profile.institution ?? '');
  const [trackDraft, setTrackDraft] = useState(state.profile.academicTrack);
  const [dailyGoalDraft, setDailyGoalDraft] = useState(state.profile.dailyGoalMinutes);
  const [weeklyGoalDraft, setWeeklyGoalDraft] = useState(state.profile.weeklyGoalHours);
  const [pomoFocusDraft, setPomoFocusDraft] = useState(state.profile.pomodoroFocusMin);
  const [pomoBreakDraft, setPomoBreakDraft] = useState(state.profile.pomodoroShortBreakMin);

  useEffect(() => {
    setNameDraft(state.profile.name);
    setInstitutionDraft(state.profile.institution ?? '');
    setTrackDraft(state.profile.academicTrack);
    setDailyGoalDraft(state.profile.dailyGoalMinutes);
    setWeeklyGoalDraft(state.profile.weeklyGoalHours);
    setPomoFocusDraft(state.profile.pomodoroFocusMin);
    setPomoBreakDraft(state.profile.pomodoroShortBreakMin);
  }, [state.profile]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: nameDraft.trim() || 'Learner',
      institution: institutionDraft.trim(),
      academicTrack: trackDraft.trim() || 'General Studies',
      dailyGoalMinutes: Math.max(15, Math.min(720, Number(dailyGoalDraft) || 120)),
      weeklyGoalHours: Math.max(1, Math.min(80, Number(weeklyGoalDraft) || 14)),
      pomodoroFocusMin: Math.max(1, Math.min(360, Number(pomoFocusDraft) || 25)),
      pomodoroShortBreakMin: Math.max(1, Math.min(60, Number(pomoBreakDraft) || 5)),
    });
    showToast(isBn ? 'প্রোফাইল ও পড়ার লক্ষ্য আপডেট হয়েছে' : 'Profile and study goals updated');
  };

  return (
    <div className="space-y-6 pb-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t.settings.title}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {t.settings.subtitle}
        </p>
      </div>

      {/* App Language Switcher (English / বাংলা) */}
      <section className="rounded-2xl bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#C4B5FD] flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              {t.settings.languageTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.settings.languageSub}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              updateProfile({ language: 'en' });
              showToast('Language switched to English');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              !isBn
                ? 'bg-[#7C3AED] text-white'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => {
              updateProfile({ language: 'bn' });
              showToast('অ্যাপের ভাষা বাংলা করা হয়েছে');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              isBn
                ? 'bg-[#7C3AED] text-white'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            বাংলা
          </button>
        </div>
      </section>

      {/* Offline System & App Install */}
      <section className="rounded-2xl bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isOnline
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              }`}
            >
              {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                {t.settings.installSectionTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t.settings.installSectionSub}
              </p>
            </div>
          </div>

          <div className="self-start sm:self-auto shrink-0 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('studyflo:open-welcome'))}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.14] text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              {isBn ? 'স্বাগতম কার্ড' : 'Welcome Card'}
            </button>
            <PWAInstallButton variant="card" />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-white/[0.07] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA] shrink-0" />
            <span>
              {isBn
                ? `অফলাইন স্টোরেজ (IndexedDB + Local): ${offlineSizeKb} KB সংরক্ষিত`
                : `Offline Device Storage (IndexedDB + Local): ${offlineSizeKb} KB saved`}
            </span>
          </div>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {isOnline
              ? isBn
                ? 'অফলাইন ক্যাশ প্রস্তুত'
                : 'Offline Cache Ready'
              : isBn
                ? 'অফলাইন মোড চালু'
                : 'Offline Mode Active'}
          </span>
        </div>
      </section>

      {/* Appearance Switcher */}
      <section className="rounded-2xl bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#C4B5FD] flex items-center justify-center shrink-0">
            {state.profile.theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Theme Mode</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dark OLED is tuned for low eye strain during night study sessions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => updateProfile({ theme: 'dark' })}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              state.profile.theme === 'dark'
                ? 'bg-[#7C3AED] text-white'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            Dark OLED
          </button>
          <button
            type="button"
            onClick={() => updateProfile({ theme: 'light' })}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              state.profile.theme === 'light'
                ? 'bg-[#7C3AED] text-white'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            Light
          </button>
        </div>
      </section>

      {/* Profile & Study Goals */}
      <form
        onSubmit={handleSaveProfile}
        className="rounded-2xl bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] p-5 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Profile & Study Goals
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED] dark:text-[#A78BFA] hover:underline cursor-pointer"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Full Student Profile
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Display Name</span>
            <input
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">School / College / University</span>
            <input
              type="text"
              value={institutionDraft}
              onChange={(e) => setInstitutionDraft(e.target.value)}
              placeholder="e.g. Notre Dame College, Dhaka"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED]"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Academic Track / Department</span>
            <input
              type="text"
              value={trackDraft}
              onChange={(e) => setTrackDraft(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Daily Focus Goal (minutes)
            </span>
            <input
              type="number"
              min={15}
              max={720}
              value={dailyGoalDraft}
              onChange={(e) => setDailyGoalDraft(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] font-mono text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Weekly Focus Goal (hours)
            </span>
            <input
              type="number"
              min={1}
              max={80}
              value={weeklyGoalDraft}
              onChange={(e) => setWeeklyGoalDraft(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] font-mono text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Pomodoro Focus Length (min)
            </span>
            <input
              type="number"
              min={1}
              max={360}
              value={pomoFocusDraft}
              onChange={(e) => setPomoFocusDraft(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] font-mono text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Short Break Length (min)
            </span>
            <input
              type="number"
              min={1}
              max={60}
              value={pomoBreakDraft}
              onChange={(e) => setPomoBreakDraft(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] font-mono text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
            />
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 min-h-[44px] rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Save Preferences
          </button>
        </div>
      </form>

      {/* Notification Preferences */}
      <section className="rounded-2xl bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <Bell className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Notifications & Chimes
          </h2>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
          <div className="py-3 first:pt-0 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Focus Timer Completion Chime
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Play a gentle harmonic tone when a Pomodoro or custom timer finishes
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={state.profile.soundAlertsEnabled}
              onClick={() =>
                updateProfile({ soundAlertsEnabled: !state.profile.soundAlertsEnabled })
              }
              className={`w-12 h-7 rounded-full transition-colors p-0.5 shrink-0 cursor-pointer ${
                state.profile.soundAlertsEnabled ? 'bg-[#7C3AED]' : 'bg-slate-300 dark:bg-white/15'
              }`}
            >
              <span
                className={`block w-6 h-6 rounded-full bg-white transition-transform ${
                  state.profile.soundAlertsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="py-3 last:pb-0 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Daily Revision Reminders
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Highlight due flashcards and upcoming syllabus deadlines on the dashboard
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={state.profile.notificationsEnabled}
              onClick={() =>
                updateProfile({ notificationsEnabled: !state.profile.notificationsEnabled })
              }
              className={`w-12 h-7 rounded-full transition-colors p-0.5 shrink-0 cursor-pointer ${
                state.profile.notificationsEnabled ? 'bg-[#7C3AED]' : 'bg-slate-300 dark:bg-white/15'
              }`}
            >
              <span
                className={`block w-6 h-6 rounded-full bg-white transition-transform ${
                  state.profile.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
