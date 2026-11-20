import React, { useEffect, useId, useState } from 'react';
import {
  ArrowRight,
  BookMarked,
  CheckCircle2,
  Globe,
  NotebookPen,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStudyFlow } from '../context/StudyFlowContext';
import { NavTab } from '../types/studyflow';

const FIRST_WELCOME_KEY = 'studyflo_welcome_dashboard_seen_v1';
const INSTALL_WELCOME_KEY = 'studyflo_installed_welcome_seen_v1';

function WelcomeEmblem() {
  const uid = useId().replace(/:/g, '');
  const bgId = `${uid}-wbg`;
  const ribId = `${uid}-wrib`;

  return (
    <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
      <svg
        width="48"
        height="48"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={bgId} x1="3" y1="3" x2="37" y2="37" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E1148" />
            <stop offset="52%" stopColor="#873BFF" />
            <stop offset="100%" stopColor="#16C7D9" />
          </linearGradient>
          <linearGradient id={ribId} x1="10" y1="9" x2="30" y2="31" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="58%" stopColor="#E9D5FF" />
            <stop offset="100%" stopColor="#67E8F9" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="36" height="36" rx="12" fill={`url(#${bgId})`} />
        <rect
          x="2.75"
          y="2.75"
          width="34.5"
          height="34.5"
          rx="11.25"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.2"
        />
        <path
          d="M27.5 13.5C27.5 11.4 24.4 10 20.4 10C15.8 10 12.8 12.1 12.8 14.9C12.8 17.8 15.6 19.1 20.2 20.1C24.9 21.1 27.6 22.4 27.6 25.4C27.6 28.4 24.4 30.2 19.6 30.2C15.5 30.2 12.6 28.6 12.2 26.4"
          stroke={`url(#${ribId})`}
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <circle cx="28.2" cy="12.2" r="2.6" fill="#16C7D9" />
        <circle cx="11.8" cy="27.4" r="1.8" fill="#E9D5FF" />
      </svg>
    </div>
  );
}

export function InstallWelcomeModal() {
  const { state, metrics, setActiveTab, updateProfile, showToast } = useStudyFlow();
  const isBn = (state.profile.language ?? 'en') === 'bn';

  const [open, setOpen] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);
  const [nameDraft, setNameDraft] = useState(state.profile.name === 'Learner' ? '' : state.profile.name);
  const [goalDraft, setGoalDraft] = useState<number>(() =>
    Math.max(1, Math.round((state.profile.dailyGoalMinutes || 120) / 60))
  );

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    const seenFirst = window.localStorage.getItem(FIRST_WELCOME_KEY) === '1';
    const seenInstalled = window.localStorage.getItem(INSTALL_WELCOME_KEY) === '1';

    if (isStandalone && !seenInstalled) {
      setJustInstalled(true);
      setOpen(true);
    } else if (!seenFirst) {
      setJustInstalled(false);
      setOpen(true);
    }

    const handleAppInstalled = () => {
      window.localStorage.removeItem(INSTALL_WELCOME_KEY);
      setJustInstalled(true);
      setOpen(true);
    };

    const handleManualOpen = () => {
      setJustInstalled(true);
      setOpen(true);
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('studyflo:open-welcome', handleManualOpen);
    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('studyflo:open-welcome', handleManualOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, nameDraft, goalDraft]);

  const commitQuickSetup = () => {
    const trimmed = nameDraft.trim();
    const patch: Partial<typeof state.profile> = {};
    if (trimmed && trimmed !== state.profile.name) {
      patch.name = trimmed;
    }
    const targetMinutes = goalDraft * 60;
    if (targetMinutes !== state.profile.dailyGoalMinutes) {
      patch.dailyGoalMinutes = targetMinutes;
    }
    if (Object.keys(patch).length > 0) {
      updateProfile(patch);
    }
    window.localStorage.setItem(FIRST_WELCOME_KEY, '1');
    if (justInstalled) {
      window.localStorage.setItem(INSTALL_WELCOME_KEY, '1');
    }
  };

  const handleDismiss = (targetTab?: NavTab) => {
    commitQuickSetup();
    setOpen(false);
    if (targetTab) {
      setActiveTab(targetTab);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }
  };

  const toggleLanguage = () => {
    const nextLang = isBn ? 'en' : 'bn';
    updateProfile({ language: nextLang });
    showToast(nextLang === 'bn' ? 'ভাষা বাংলায় পরিবর্তন করা হয়েছে' : 'Language switched to English');
  };

  const displayName = nameDraft.trim() || state.profile.name || (isBn ? 'শিক্ষার্থী' : 'Learner');

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#060512]/72 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={isBn ? 'STUDYFLO স্বাগতম ড্যাশবোর্ড' : 'STUDYFLO Welcome Dashboard'}
          onClick={() => handleDismiss()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[396px] overflow-hidden rounded-[28px] bg-white/96 dark:bg-[#131029]/96 border border-slate-200/90 dark:border-[#873BFF]/35 shadow-[0_24px_70px_-14px_rgba(8,8,23,0.85)]"
          >
            {/* Unique Sculpted Top Aurora Beam */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 inset-x-0 h-44 opacity-85 dark:opacity-100"
              style={{
                background:
                  'radial-gradient(ellipse 75% 70% at 50% 20%, rgba(135,59,255,0.42), rgba(22,199,217,0.16) 55%, transparent 78%)',
              }}
            />

            {/* Top Utility Row: Status + Language + Close */}
            <div className="relative z-10 flex items-center justify-between px-4 pt-4">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-[#873BFF] dark:text-[#16C7D9]">
                {justInstalled ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-[#16C7D9]" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>
                  {justInstalled
                    ? isBn
                      ? 'অ্যাপ ইনস্টল সম্পন্ন'
                      : 'APP INSTALLED'
                    : isBn
                      ? 'STUDYFLO স্বাগতম'
                      : 'WELCOME TO STUDYFLO'}
                </span>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className="inline-flex items-center gap-1 px-2.5 h-7 rounded-lg bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.14] text-[11px] font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <Globe className="w-3 h-3 text-[#873BFF] dark:text-[#16C7D9]" />
                  <span>{isBn ? 'EN' : 'বাংলা'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDismiss()}
                  aria-label="Close welcome dashboard"
                  className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.14] text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Hero Greeting Block */}
            <div className="relative z-10 px-5 pt-4 pb-4 flex items-center gap-3.5">
              <WelcomeEmblem />
              <div className="min-w-0">
                <h2 className="font-display text-xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight truncate">
                  {isBn ? `স্বাগতম, ${displayName}!` : `Welcome, ${displayName}!`}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300/90 mt-1 leading-relaxed">
                  {isBn
                    ? 'আপনার স্মার্ট অফলাইন স্টাডি ড্যাশবোর্ড এখন একদম প্রস্তুত।'
                    : 'Your personal offline study command center is ready to roll.'}
                </p>
              </div>
            </div>

            {/* Mini Bento Live Stats Strip */}
            <div className="relative z-10 px-5 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] p-2.5 text-center">
                <p className="font-display text-base font-bold text-slate-900 dark:text-white tabular-nums">
                  {state.subjects.length}
                </p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  {isBn ? 'বিষয়' : 'Subjects'}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] p-2.5 text-center">
                <p className="font-display text-base font-bold text-[#7C4DFF] dark:text-[#B794FF] tabular-nums">
                  {metrics.overallProgress}%
                </p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  {isBn ? 'অগ্রগতি' : 'Progress'}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] p-2.5 text-center">
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  {isBn ? 'অফলাইন রেডি' : 'Offline Ready'}
                </p>
              </div>
            </div>

            {/* Compact Personalize Bar: Name + Daily Goal */}
            <div className="relative z-10 px-5 mt-3.5">
              <div className="rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] p-3 flex items-center gap-2.5">
                <input
                  type="text"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  maxLength={32}
                  placeholder={isBn ? 'আপনার নাম লিখুন...' : 'Enter your name...'}
                  className="flex-1 min-w-0 bg-transparent text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                />
                <div className="h-5 w-px bg-slate-200 dark:bg-white/10 shrink-0" />
                <div className="flex items-center gap-1.5 shrink-0">
                  <Target className="w-3.5 h-3.5 text-[#873BFF] dark:text-[#16C7D9]" />
                  <button
                    type="button"
                    onClick={() => setGoalDraft((g) => Math.max(1, g - 1))}
                    aria-label="Decrease daily goal"
                    className="w-6 h-6 rounded-lg bg-slate-200/80 dark:bg-white/[0.09] text-slate-800 dark:text-white text-xs font-bold flex items-center justify-center cursor-pointer active:scale-95"
                  >
                    -
                  </button>
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white w-7 text-center tabular-nums">
                    {goalDraft}h
                  </span>
                  <button
                    type="button"
                    onClick={() => setGoalDraft((g) => Math.min(12, g + 1))}
                    aria-label="Increase daily goal"
                    className="w-6 h-6 rounded-lg bg-slate-200/80 dark:bg-white/[0.09] text-slate-800 dark:text-white text-xs font-bold flex items-center justify-center cursor-pointer active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Quick-Launch Mini Shortcuts */}
            <div className="relative z-10 px-5 mt-3 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDismiss('focus')}
                className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl bg-slate-50 dark:bg-white/[0.04] hover:bg-[#873BFF]/10 dark:hover:bg-[#873BFF]/20 border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 transition-colors cursor-pointer active:scale-95"
              >
                <Timer className="w-4 h-4 text-[#873BFF] dark:text-[#C4B5FD]" />
                <span className="text-[11px] font-semibold">{isBn ? 'ফোকাস' : 'Focus'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleDismiss('syllabus')}
                className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl bg-slate-50 dark:bg-white/[0.04] hover:bg-[#16C7D9]/10 dark:hover:bg-[#16C7D9]/20 border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 transition-colors cursor-pointer active:scale-95"
              >
                <BookMarked className="w-4 h-4 text-[#0891B2] dark:text-[#16C7D9]" />
                <span className="text-[11px] font-semibold">{isBn ? 'লাইব্রেরি' : 'Library'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleDismiss('notes')}
                className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl bg-slate-50 dark:bg-white/[0.04] hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 transition-colors cursor-pointer active:scale-95"
              >
                <NotebookPen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px] font-semibold">{isBn ? 'নোটস' : 'Notes'}</span>
              </button>
            </div>

            {/* Primary CTA */}
            <div className="relative z-10 p-5 pt-4">
              <button
                type="button"
                onClick={() => handleDismiss('home')}
                className="w-full py-3 min-h-[44px] rounded-xl bg-[#7C4DFF] hover:bg-[#6D28D9] text-white text-sm font-semibold shadow-sm inline-flex items-center justify-center gap-2 transition-colors active:scale-[0.98] cursor-pointer"
              >
                <span>{isBn ? 'পড়াশোনা শুরু করুন' : 'Start Studying'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
