import React, { useState, useRef, useEffect } from 'react';
import {
  Moon,
  Sun,
  User,
  Bell,
  Download,
  Upload,
  RotateCcw,
  Cloud,
  Smartphone,
  Info,
  Check,
  ChevronDown,
  ChevronUp,
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
    exportBackupJson,
    importBackupJson,
    resetDemoData,
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
  const [firebaseJson, setFirebaseJson] = useState(state.profile.firebaseConfigJson ?? '');
  const [importStatus, setImportStatus] = useState<string>('');
  const [showFlutterDocs, setShowFlutterDocs] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    showToast('Profile and study goals updated');
  };

  const handleExportBackup = () => {
    const json = exportBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyflo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Exported offline STUDYFLO backup JSON');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      const res = importBackupJson(content);
      setImportStatus(res.message);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveFirebase = () => {
    updateProfile({ firebaseConfigJson: firebaseJson.trim() });
    showToast(
      firebaseJson.trim()
        ? 'Firebase configuration saved locally'
        : 'Cleared Firebase config (Offline Mode active)'
    );
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

          <div className="self-start sm:self-auto shrink-0">
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
          <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
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

      {/* Offline Data Backup & Restore */}
      <section className="rounded-2xl bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Offline Data Backup & Storage
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            All syllabus topics, focus sessions, flashcards, and notes are stored locally on your device.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportBackup}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#873BFF] hover:bg-[#732EE8] text-white text-xs font-semibold cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export JSON Backup
          </button>

          <a
            href="/api/download-zip"
            download="STUDYFLO-app.zip"
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#16C7D9]/15 hover:bg-[#16C7D9]/25 border border-[#16C7D9]/30 text-[#0891B2] dark:text-[#16C7D9] text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {isBn ? 'সম্পূর্ণ অ্যাপ (.zip) ডাউনলোড' : 'Download App (.zip)'}
          </a>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.14] text-slate-800 dark:text-white text-xs font-semibold cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Restore Backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportFile}
            className="hidden"
          />

          <button
            type="button"
            onClick={resetDemoData}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Starter Data
          </button>
        </div>

        {importStatus && (
          <p className="text-xs text-slate-600 dark:text-slate-300">{importStatus}</p>
        )}
      </section>

      {/* Optional Firebase Cloud Sync */}
      <section className="rounded-2xl bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-4 h-4 text-[#06B6D4]" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Optional Firebase Sync (Study Circle)
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {state.profile.firebaseConfigJson ? 'Config stored' : 'Offline-first mode'}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          STUDYFLO works completely offline without Firebase. If you deploy STUDYFLO with your own Firebase Auth & Cloud Firestore project for live multi-device Study Circle sync, paste your web/Flutter Firebase configuration snippet below.
        </p>
        <textarea
          rows={3}
          value={firebaseJson}
          onChange={(e) => setFirebaseJson(e.target.value)}
          placeholder='Optional: {"projectId": "studyflo-prod", "appId": "..."}'
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0B1A] border border-slate-200 dark:border-white/[0.09] font-mono text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED]"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSaveFirebase}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white/[0.1] hover:bg-slate-800 dark:hover:bg-white/[0.16] text-white text-xs font-semibold cursor-pointer"
          >
            Save Optional Config
          </button>
        </div>
      </section>

      {/* Flutter Architecture & APK Build Reference */}
      <section className="rounded-2xl bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowFlutterDocs((v) => !v)}
          className="w-full p-5 flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Smartphone className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Mobile Architecture & Android APK Build Guide
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Flutter + SQLite (sqflite) + Riverpod + Optional Firebase project blueprint
              </p>
            </div>
          </div>
          {showFlutterDocs ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showFlutterDocs && (
          <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-white/[0.07] space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                Clean Flutter Layer Structure
              </h3>
              <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto">
{`lib/
├── main.dart
├── core/
│   ├── theme/studyflow_theme.dart       # OLED #050510 & Electric Purple #7C3AED
│   ├── database/app_database.dart       # sqflite tables (subjects, chapters, topics, sessions, cards, notes)
│   └── services/firebase_optional.dart  # Graceful offline fallback when Firebase is unconfigured
├── features/
│   ├── dashboard/                       # Home metrics, weekly calendar, daily goals
│   ├── syllabus/                        # Subjects, chapters, topics & SM progress rollups
│   ├── focus_timer/                     # Pomodoro, Custom, Stopwatch + ambient audio
│   ├── flashcards/                      # 3D flip + SM-2 interval scheduler
│   ├── notes/                           # Auto-saving subject notes & pin filter
│   ├── study_circle/                    # Room codes, live status & group chat
│   └── progress_report/                 # RepaintBoundary PNG export card`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                Android Release APK & iOS Build Commands
              </h3>
              <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto">
{`flutter pub get
flutter test
flutter build apk --release --split-per-abi
# Output: build/app/outputs/flutter-apk/app-arm64-v8a-release.apk
# For Google Play Store App Bundle:
flutter build appbundle --release`}
              </pre>
            </div>
          </div>
        )}
      </section>

      {/* About STUDYFLO */}
      <section className="rounded-2xl bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] p-5 flex items-start gap-3.5">
        <Info className="w-5 h-5 text-[#7C3AED] dark:text-[#A78BFA] shrink-0 mt-0.5" />
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">About STUDYFLO</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            STUDYFLO — Plan • Focus • Learn • Grow. Designed for sustained academic clarity with a dark OLED workspace, offline-first persistence, spaced repetition flashcards, and collaborative study circles.
          </p>
        </div>
      </section>
    </div>
  );
}
