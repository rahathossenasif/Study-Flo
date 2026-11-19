import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Check,
  Volume2,
  VolumeX,
  CloudRain,
  Music,
  Coffee,
  Trees,
  Clock,
  Trophy,
  Hourglass,
  Trash2,
  Pencil,
  Minus,
  X,
  Waves,
  Flame,
  Headphones,
  Moon,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStudyFlow } from '../context/StudyFlowContext';
import { AmbientSoundId, TimerMode } from '../types/studyflow';
import { soundEngine } from '../utils/soundEngine';
import focusMountainBgImg from '../assets/images/focus_mountain_bg_1795076805593.jpg';

type PomodoroPhase = 'focus' | 'shortBreak' | 'longBreak';

const SOUND_SCAPES: {
  id: Exclude<AmbientSoundId, 'none'>;
  name: string;
  nameBn: string;
  subtitle: string;
  subtitleBn: string;
  icon: React.ComponentType<{ className?: string }>;
  activeClass: string;
}[] = [
  {
    id: 'lofi',
    name: 'Lo-Fi Chill',
    nameBn: 'লো-ফাই চিল',
    subtitle: 'Warm Rhodes & chill beat',
    subtitleBn: 'সফট রোডস ও চিল বিট',
    icon: Music,
    activeClass:
      'border-purple-400/60 dark:border-[#7C3AED] bg-gradient-to-br from-purple-50 via-fuchsia-50 to-white dark:from-purple-600/30 dark:via-fuchsia-900/40 dark:to-[#111124] shadow-[0_8px_22px_-8px_rgba(124,58,237,0.26)] dark:shadow-md dark:shadow-[#7C3AED]/20',
  },
  {
    id: 'rain',
    name: 'Soft Rain',
    nameBn: 'মৃদু বৃষ্টি',
    subtitle: 'Stereo gentle rainfall',
    subtitleBn: 'শান্ত বৃষ্টির শব্দ',
    icon: CloudRain,
    activeClass:
      'border-blue-400/60 dark:border-[#7C3AED] bg-gradient-to-br from-blue-50 via-indigo-50 to-white dark:from-blue-600/30 dark:via-indigo-900/50 dark:to-[#111124] shadow-[0_8px_22px_-8px_rgba(59,130,246,0.28)] dark:shadow-md dark:shadow-[#7C3AED]/20',
  },
  {
    id: 'piano',
    name: 'Ambient Piano',
    nameBn: 'সফট পিয়ানো',
    subtitle: 'Dreamy calm keys',
    subtitleBn: 'মৃদু শান্ত পিয়ানো সুর',
    icon: Headphones,
    activeClass:
      'border-indigo-400/60 dark:border-[#7C3AED] bg-gradient-to-br from-indigo-50 via-violet-50 to-white dark:from-indigo-600/30 dark:via-violet-900/45 dark:to-[#111124] shadow-[0_8px_22px_-8px_rgba(99,102,241,0.26)] dark:shadow-md dark:shadow-[#7C3AED]/20',
  },
  {
    id: 'ocean',
    name: 'Ocean Waves',
    nameBn: 'সমুদ্রের ঢেউ',
    subtitle: 'Rolling slow surf',
    subtitleBn: 'সমুদ্রের শান্ত গর্জন',
    icon: Waves,
    activeClass:
      'border-cyan-400/60 dark:border-[#7C3AED] bg-gradient-to-br from-cyan-50 via-sky-50 to-white dark:from-cyan-600/30 dark:via-sky-950/50 dark:to-[#111124] shadow-[0_8px_22px_-8px_rgba(6,182,212,0.26)] dark:shadow-md dark:shadow-[#7C3AED]/20',
  },
  {
    id: 'forest',
    name: 'Pine Forest',
    nameBn: 'শান্ত বনভূমি',
    subtitle: 'Breeze & soft birds',
    subtitleBn: 'মৃদু বাতাস ও পাখির ডাক',
    icon: Trees,
    activeClass:
      'border-emerald-400/60 dark:border-[#7C3AED] bg-gradient-to-br from-emerald-50 via-teal-50 to-white dark:from-emerald-600/30 dark:via-teal-950/50 dark:to-[#111124] shadow-[0_8px_22px_-8px_rgba(16,185,129,0.24)] dark:shadow-md dark:shadow-[#7C3AED]/20',
  },
  {
    id: 'fireplace',
    name: 'Fireplace',
    nameBn: 'উষ্ণ ফায়ারপ্লেস',
    subtitle: 'Cozy hearth crackle',
    subtitleBn: 'আগুনের নরম উষ্ণ শব্দ',
    icon: Flame,
    activeClass:
      'border-orange-400/60 dark:border-[#7C3AED] bg-gradient-to-br from-orange-50 via-amber-50 to-white dark:from-orange-600/30 dark:via-amber-950/50 dark:to-[#111124] shadow-[0_8px_22px_-8px_rgba(249,115,22,0.26)] dark:shadow-md dark:shadow-[#7C3AED]/20',
  },
  {
    id: 'cafe',
    name: 'Cozy Cafe',
    nameBn: 'ক্যাফে পরিবেশ',
    subtitle: 'Warm quiet murmur',
    subtitleBn: 'হালকা ক্যাফে গুঞ্জন',
    icon: Coffee,
    activeClass:
      'border-amber-400/60 dark:border-[#7C3AED] bg-gradient-to-br from-amber-50 via-yellow-50 to-white dark:from-amber-600/30 dark:via-orange-950/50 dark:to-[#111124] shadow-[0_8px_22px_-8px_rgba(245,158,11,0.24)] dark:shadow-md dark:shadow-[#7C3AED]/20',
  },
  {
    id: 'night',
    name: 'Night Calm',
    nameBn: 'রাতের নিরবতা',
    subtitle: 'Midnight breeze & hush',
    subtitleBn: 'গভীর রাতের শান্ত বাতাস',
    icon: Moon,
    activeClass:
      'border-slate-400/60 dark:border-[#7C3AED] bg-gradient-to-br from-slate-100 via-indigo-50 to-white dark:from-slate-700/35 dark:via-indigo-950/50 dark:to-[#111124] shadow-[0_8px_22px_-8px_rgba(99,102,241,0.22)] dark:shadow-md dark:shadow-[#7C3AED]/20',
  },
];

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function FocusTimerView() {
  const {
    state,
    metrics,
    t,
    focusSubjectId,
    setFocusSubjectId,
    logFocusSession,
    deleteFocusSession,
    updateProfile,
    showToast,
  } = useStudyFlow();
  const isBn = (state.profile.language ?? 'en') === 'bn';

  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>('focus');
  const [customMinutes, setCustomMinutes] = useState<number>(40);
  const [sessionLabel, setSessionLabel] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const getInitialDurationSeconds = (m: TimerMode, phase: PomodoroPhase, customM: number): number => {
    if (m === 'stopwatch') return 0;
    if (m === 'custom') return Math.max(1, customM) * 60;
    if (phase === 'focus') return state.profile.pomodoroFocusMin * 60;
    if (phase === 'shortBreak') return state.profile.pomodoroShortBreakMin * 60;
    return state.profile.pomodoroLongBreakMin * 60;
  };

  const [sessionTotalSeconds, setSessionTotalSeconds] = useState<number>(() =>
    getInitialDurationSeconds('pomodoro', 'focus', 40)
  );
  const [secondsValue, setSecondsValue] = useState<number>(() =>
    getInitialDurationSeconds('pomodoro', 'focus', 40)
  );
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Direct Time Edit State (inline inside dial + quick minute box)
  const [isEditingDial, setIsEditingDial] = useState<boolean>(false);
  const [editMinsInput, setEditMinsInput] = useState<string>(
    String(state.profile.pomodoroFocusMin)
  );
  const [editSecsInput, setEditSecsInput] = useState<string>('00');
  const [quickMinInput, setQuickMinInput] = useState<string>('');
  const editMinsRef = useRef<HTMLInputElement | null>(null);

  // Ambient Sound State
  const [activeSound, setActiveSound] = useState<AmbientSoundId>('none');
  const [volume, setVolume] = useState<number>(0.45);

  const activeSubjectId =
    state.subjects.find((s) => s.id === focusSubjectId)?.id ?? state.subjects[0]?.id ?? 'sub-math';

  // Keep a ref to latest values for completion callback inside interval
  const completionRef = useRef({
    activeSubjectId,
    mode,
    pomodoroPhase,
    sessionLabel,
    soundAlertsEnabled: state.profile.soundAlertsEnabled,
    sessionTotalSeconds,
  });

  useEffect(() => {
    completionRef.current = {
      activeSubjectId,
      mode,
      pomodoroPhase,
      sessionLabel,
      soundAlertsEnabled: state.profile.soundAlertsEnabled,
      sessionTotalSeconds,
    };
  }, [
    activeSubjectId,
    mode,
    pomodoroPhase,
    sessionLabel,
    state.profile.soundAlertsEnabled,
    sessionTotalSeconds,
  ]);

  // Stop ambient audio on unmount
  useEffect(() => {
    return () => {
      soundEngine.stop();
    };
  }, []);

  // Main Timer Tick
  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => {
      setElapsedSeconds((e) => e + 1);
      if (mode === 'stopwatch') {
        setSecondsValue((s) => s + 1);
      } else {
        setSecondsValue((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            const info = completionRef.current;
            if (info.soundAlertsEnabled) {
              soundEngine.playCompletionChime();
            }
            if (info.mode === 'pomodoro' && info.pomodoroPhase !== 'focus') {
              showToast('Break complete! Ready for your next focus block.');
            } else {
              const mins = Math.max(1, Math.round(info.sessionTotalSeconds / 60));
              logFocusSession(
                info.activeSubjectId,
                info.mode,
                mins,
                info.sessionLabel || `${info.mode === 'pomodoro' ? 'Pomodoro' : 'Custom'} Focus Session`
              );
            }
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [isRunning, mode, logFocusSession, showToast]);

  // Apply any custom countdown duration (in total seconds) cleanly across Pomodoro & Custom modes
  const applyDurationSeconds = (totalSecs: number, announce = false) => {
    const clampedSecs = Math.max(10, Math.min(360 * 60, Math.round(totalSecs)));
    const wholeMins = Math.floor(clampedSecs / 60);
    const remSecs = clampedSecs % 60;

    setIsRunning(false);
    setIsEditingDial(false);
    setElapsedSeconds(0);
    setSessionTotalSeconds(clampedSecs);
    setSecondsValue(clampedSecs);

    if (mode === 'custom') {
      if (wholeMins >= 1) {
        setCustomMinutes(Math.min(360, wholeMins));
      }
    } else if (mode === 'pomodoro' && remSecs === 0 && wholeMins >= 1 && wholeMins <= 360) {
      if (pomodoroPhase === 'focus') {
        updateProfile({ pomodoroFocusMin: wholeMins });
      } else if (pomodoroPhase === 'shortBreak') {
        updateProfile({ pomodoroShortBreakMin: wholeMins });
      } else {
        updateProfile({ pomodoroLongBreakMin: wholeMins });
      }
    }

    if (announce) {
      const label =
        remSecs === 0 ? `${wholeMins} min` : `${wholeMins}m ${String(remSecs).padStart(2, '0')}s`;
      showToast(`Timer set to ${label}`);
    }
  };

  const openDialEditor = () => {
    if (mode === 'stopwatch') return;
    setIsRunning(false);
    const currentMins = Math.floor(secondsValue / 60);
    const currentSecs = secondsValue % 60;
    setEditMinsInput(String(currentMins));
    setEditSecsInput(String(currentSecs).padStart(2, '0'));
    setIsEditingDial(true);
    window.setTimeout(() => {
      editMinsRef.current?.focus();
      editMinsRef.current?.select();
    }, 20);
  };

  const handleSaveDialEdit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const parsedMins = Math.max(0, Math.min(360, parseInt(editMinsInput || '0', 10) || 0));
    const parsedSecs = Math.max(0, Math.min(59, parseInt(editSecsInput || '0', 10) || 0));
    const total = parsedMins * 60 + parsedSecs;
    if (total < 10) {
      showToast('Please set at least 10 seconds.');
      return;
    }
    applyDurationSeconds(total, true);
  };

  const handleQuickMinuteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseFloat(quickMinInput);
    if (!Number.isFinite(mins) || mins <= 0) {
      showToast('Enter any duration in minutes (e.g. 10, 50, 75).');
      return;
    }
    const clampedMins = Math.max(1, Math.min(360, Math.round(mins)));
    applyDurationSeconds(clampedMins * 60, true);
    setQuickMinInput('');
  };

  const handleStepMinutes = (deltaMins: number) => {
    const baseSeconds = elapsedSeconds > 0 ? secondsValue : sessionTotalSeconds;
    const nextSeconds = Math.max(60, Math.min(360 * 60, baseSeconds + deltaMins * 60));
    applyDurationSeconds(nextSeconds, false);
  };

  const handleModeSwitch = (nextMode: TimerMode) => {
    setIsRunning(false);
    setIsEditingDial(false);
    setMode(nextMode);
    setElapsedSeconds(0);
    const nextSecs = getInitialDurationSeconds(nextMode, pomodoroPhase, customMinutes);
    setSessionTotalSeconds(nextSecs);
    setSecondsValue(nextSecs);
  };

  const handlePhaseSwitch = (nextPhase: PomodoroPhase) => {
    setIsRunning(false);
    setIsEditingDial(false);
    setPomodoroPhase(nextPhase);
    setElapsedSeconds(0);
    const nextSecs = getInitialDurationSeconds('pomodoro', nextPhase, customMinutes);
    setSessionTotalSeconds(nextSecs);
    setSecondsValue(nextSecs);
  };

  const handleCustomMinutesChange = (mins: number) => {
    const clamped = Math.max(1, Math.min(360, mins));
    setCustomMinutes(clamped);
    if (!isRunning && mode === 'custom') {
      setSessionTotalSeconds(clamped * 60);
      setSecondsValue(clamped * 60);
      setElapsedSeconds(0);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsEditingDial(false);
    setElapsedSeconds(0);
    if (mode === 'stopwatch') {
      setSecondsValue(0);
      setSessionTotalSeconds(0);
    } else {
      setSecondsValue(sessionTotalSeconds);
    }
  };

  const handleSaveSessionNow = () => {
    const studiedMins = Math.max(1, Math.round(elapsedSeconds / 60));
    if (elapsedSeconds < 10 && mode === 'stopwatch') {
      showToast('Run the timer for at least 10 seconds before saving.');
      return;
    }
    const durationToLog =
      elapsedSeconds >= 30
        ? studiedMins
        : Math.max(1, Math.round(sessionTotalSeconds / 60));
    logFocusSession(
      activeSubjectId,
      mode,
      durationToLog,
      sessionLabel ||
        (mode === 'stopwatch'
          ? 'Stopwatch Study Session'
          : mode === 'custom'
            ? 'Custom Focus Session'
            : 'Pomodoro Focus Session')
    );
    setIsRunning(false);
    setElapsedSeconds(0);
    setSecondsValue(mode === 'stopwatch' ? 0 : sessionTotalSeconds);
    setSessionLabel('');
  };

  const handleToggleSound = (soundId: Exclude<AmbientSoundId, 'none'>) => {
    if (activeSound === soundId) {
      soundEngine.stop();
      setActiveSound('none');
    } else {
      soundEngine.setVolume(volume);
      soundEngine.play(soundId);
      setActiveSound(soundId);
    }
  };

  const handleVolumeChange = (nextVol: number) => {
    setVolume(nextVol);
    soundEngine.setVolume(nextVol);
  };

  // Ring progress math
  const totalRingSeconds =
    mode === 'stopwatch' ? 3600 : Math.max(1, sessionTotalSeconds);
  const progressRatio =
    mode === 'stopwatch'
      ? Math.min(1, (secondsValue % 3600) / 3600)
      : Math.max(0, Math.min(1, 1 - secondsValue / totalRingSeconds));

  const ringSize = 264;
  const strokeWidth = 14;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progressRatio);

  const subjectMap = Object.fromEntries(state.subjects.map((s) => [s.id, s]));
  const activeMinutesRounded = Math.round(sessionTotalSeconds / 60);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.focus.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isBn
              ? 'টাইমারে ট্যাপ করে ১০, ৫০ বা যেকোনো মিনিট সেট করুন'
              : 'Tap the timer or pick any duration — 10m, 50m, or any custom time'}
          </p>
        </div>

        {/* Fluid Mode Segmented Control */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100/90 dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] self-start">
          {(
            [
              { id: 'pomodoro', label: t.focus.pomodoro },
              { id: 'custom', label: t.focus.custom },
              { id: 'stopwatch', label: t.focus.stopwatch },
            ] as const
          ).map((item) => {
            const active = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleModeSwitch(item.id)}
                className={`relative px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="focusModeTab"
                    transition={{ type: 'spring', stiffness: 440, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6366F1] shadow-sm shadow-[#7C3AED]/35"
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Timer Stage */}
        <div className="lg:col-span-7 space-y-5">
          <section className="sf-glass relative overflow-hidden rounded-3xl p-6 sm:p-8 flex flex-col items-center">
            {/* Subtle Atmospheric Mountain Backdrop */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <img
                src={focusMountainBgImg}
                alt=""
                aria-hidden="true"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-bottom opacity-[0.07] dark:opacity-[0.26]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/90 to-white/75 dark:from-[#17132D]/85 dark:via-[#14102A]/82 dark:to-[#110D24]/70" />
            </div>

            {/* Subject & Session Controls */}
            <div className="relative z-10 w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <select
                value={activeSubjectId}
                onChange={(e) => setFocusSubjectId(e.target.value)}
                aria-label="Select study subject"
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#191933] border border-slate-200 dark:border-white/[0.1] text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
              >
                {state.subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={sessionLabel}
                onChange={(e) => setSessionLabel(e.target.value)}
                placeholder="Session focus (e.g. Chapter 2 drills)"
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

            {/* Sub-mode Controls */}
            {mode === 'pomodoro' && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 mb-5">
                {(
                  [
                    { id: 'focus', label: `Focus (${state.profile.pomodoroFocusMin}m)` },
                    { id: 'shortBreak', label: `Short Break (${state.profile.pomodoroShortBreakMin}m)` },
                    { id: 'longBreak', label: `Long Break (${state.profile.pomodoroLongBreakMin}m)` },
                  ] as const
                ).map((ph) => (
                  <button
                    key={ph.id}
                    type="button"
                    onClick={() => handlePhaseSwitch(ph.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      pomodoroPhase === ph.id
                        ? 'bg-[#7C3AED]/15 text-[#7C3AED] dark:bg-[#7C3AED]/25 dark:text-[#C4B5FD]'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {ph.label}
                  </button>
                ))}
              </div>
            )}

            {mode === 'custom' && (
              <div className="w-full max-w-sm mb-5 flex items-center gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  Slider
                </span>
                <input
                  type="range"
                  min={1}
                  max={180}
                  step={1}
                  value={Math.min(180, customMinutes)}
                  onChange={(e) => handleCustomMinutesChange(Number(e.target.value))}
                  disabled={isRunning}
                  className="flex-1 accent-[#7C3AED]"
                />
                <span className="font-mono text-xs font-semibold tabular-nums text-slate-900 dark:text-white w-12 text-right">
                  {customMinutes}m
                </span>
              </div>
            )}

            {/* Glowing Circular Timer Ring with Breathing Aura */}
            <div className="relative z-10 flex items-center justify-center my-3">
              <div
                className={`absolute inset-2 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
                  isRunning ? 'animate-focus-breath' : 'opacity-20 dark:opacity-35'
                }`}
                style={{
                  background:
                    pomodoroPhase === 'focus' || mode !== 'pomodoro'
                      ? 'radial-gradient(circle, #873BFF 0%, #16C7D9 68%, transparent 100%)'
                      : 'radial-gradient(circle, #10B981 0%, #16C7D9 68%, transparent 100%)',
                }}
              />
              <div
                aria-hidden="true"
                className="absolute -inset-2 rounded-full border border-dashed border-slate-300/60 dark:border-white/[0.08] pointer-events-none"
              />
              <svg width={ringSize} height={ringSize} className="-rotate-90 relative z-10">
                <defs>
                  <linearGradient id="focusRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={pomodoroPhase !== 'focus' && mode === 'pomodoro' ? '#10B981' : '#A855F7'} />
                    <stop offset="50%" stopColor="#873BFF" />
                    <stop offset="100%" stopColor="#16C7D9" />
                  </linearGradient>
                </defs>
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  fill="none"
                  strokeWidth={strokeWidth}
                  className="stroke-slate-200 dark:stroke-white/[0.08]"
                />
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  fill="none"
                  stroke="url(#focusRingGrad)"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{ transition: 'stroke-dashoffset 350ms linear' }}
                />
              </svg>

              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6">
                {isEditingDial && mode !== 'stopwatch' ? (
                  <form
                    onSubmit={handleSaveDialEdit}
                    className="flex flex-col items-center gap-2.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="flex flex-col items-center">
                        <input
                          ref={editMinsRef}
                          type="number"
                          min={0}
                          max={360}
                          value={editMinsInput}
                          onChange={(e) => setEditMinsInput(e.target.value)}
                          aria-label="Timer minutes"
                          className="w-20 px-2 py-1.5 text-center font-mono text-3xl font-bold tabular-nums rounded-xl bg-slate-100 dark:bg-white/[0.1] border border-[#7C3AED] text-slate-900 dark:text-white focus:outline-none"
                        />
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                          min
                        </span>
                      </div>
                      <span className="font-mono text-2xl font-bold text-slate-400 -mt-4">:</span>
                      <div className="flex flex-col items-center">
                        <input
                          type="number"
                          min={0}
                          max={59}
                          value={editSecsInput}
                          onChange={(e) => setEditSecsInput(e.target.value)}
                          aria-label="Timer seconds"
                          className="w-16 px-2 py-1.5 text-center font-mono text-3xl font-bold tabular-nums rounded-xl bg-slate-100 dark:bg-white/[0.1] border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
                        />
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                          sec
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Set
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingDial(false)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.14] cursor-pointer"
                        aria-label="Cancel edit"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={openDialEditor}
                      disabled={mode === 'stopwatch'}
                      title={mode === 'stopwatch' ? 'Stopwatch elapsed time' : 'Click to edit timer duration'}
                      className={`group flex flex-col items-center focus:outline-none ${
                        mode === 'stopwatch' ? 'cursor-default' : 'cursor-pointer'
                      }`}
                    >
                      <span className="font-mono text-5xl sm:text-6xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-white group-hover:text-[#7C3AED] dark:group-hover:text-[#C4B5FD] transition-colors">
                        {formatClock(secondsValue)}
                      </span>
                      <span className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                        {mode === 'stopwatch'
                          ? 'Stopwatch Elapsed'
                          : mode === 'custom'
                            ? 'Custom Focus'
                            : pomodoroPhase === 'focus'
                              ? 'Focus Time'
                              : pomodoroPhase === 'shortBreak'
                                ? 'Short Break'
                                : 'Long Break'}
                      </span>
                      {mode !== 'stopwatch' && (
                        <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#7C3AED] dark:text-[#A78BFA] opacity-85 group-hover:opacity-100 transition-opacity">
                          <Pencil className="w-3 h-3" />
                          Edit time
                        </span>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Clean Single-Row Controls: -5m, 25m, and Set Time */}
            {mode !== 'stopwatch' && (
              <div className="relative z-10 mt-5 w-full flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStepMinutes(-5)}
                  aria-label="Decrease timer by 5 minutes"
                  className="px-3.5 py-2 min-h-[42px] rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] border border-slate-200/70 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 font-mono text-xs font-semibold inline-flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                  5m
                </button>

                <button
                  type="button"
                  onClick={() => applyDurationSeconds(25 * 60, false)}
                  className={`px-4 py-2 min-h-[42px] rounded-xl font-mono text-xs font-semibold tabular-nums transition-all active:scale-95 cursor-pointer ${
                    sessionTotalSeconds === 25 * 60 && elapsedSeconds === 0
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#6366F1] text-white shadow-md shadow-[#7C3AED]/30 border border-white/15'
                      : 'bg-slate-100 dark:bg-white/[0.06] border border-slate-200/70 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 hover:bg-[#7C3AED]/12 hover:text-[#6D28D9] dark:hover:bg-white/[0.12] dark:hover:text-white'
                  }`}
                >
                  25m
                </button>

                <form
                  onSubmit={handleQuickMinuteSubmit}
                  className="flex items-center gap-1.5"
                >
                  <input
                    type="number"
                    min={1}
                    max={360}
                    value={quickMinInput}
                    onChange={(e) => setQuickMinInput(e.target.value)}
                    placeholder={isBn ? `মিনিট (${activeMinutesRounded}m)` : `Set min (${activeMinutesRounded}m)`}
                    aria-label="Enter custom minutes"
                    className="w-32 sm:w-36 px-3 py-2 min-h-[42px] rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] font-mono text-xs tabular-nums text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 min-h-[42px] rounded-xl bg-[#7C3AED]/12 hover:bg-[#7C3AED] text-[#6D28D9] hover:text-white dark:bg-[#7C3AED]/20 dark:text-[#C4B5FD] dark:hover:bg-[#7C3AED] dark:hover:text-white border border-[#7C3AED]/25 text-xs font-semibold transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    {isBn ? 'টাইম সেট' : 'Set Time'}
                  </button>
                </form>
              </div>
            )}

            {/* Timer Action Controls */}
            <div className="relative z-10 mt-6 flex flex-wrap items-center justify-center gap-3 w-full">
              <button
                type="button"
                onClick={handleReset}
                aria-label="Reset timer"
                className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isEditingDial) {
                    handleSaveDialEdit();
                    return;
                  }
                  setIsRunning((r) => !r);
                }}
                className="sf-glow-btn px-8 py-3.5 min-h-[48px] rounded-2xl text-white font-semibold text-sm border border-white/20 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    {t.focus.pauseSession}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    {elapsedSeconds > 0 ? t.focus.resumeSession : t.focus.startSession}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSaveSessionNow}
                title="Complete and save session to log"
                className="px-4 h-12 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Log Session
              </button>
            </div>

            {/* Focus Summary Stats Strip */}
            <div className="relative z-10 mt-7 pt-6 border-t border-slate-200/70 dark:border-white/[0.08] w-full grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#C4B5FD] mb-1.5">
                  <Clock className="w-4 h-4" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Spent Today</p>
                <p className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white mt-0.5">
                  {Math.floor(metrics.todayMinutes / 60)}h {metrics.todayMinutes % 60}m
                </p>
              </div>
              <div>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 mb-1.5">
                  <Trophy className="w-4 h-4" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Sessions</p>
                <p className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white mt-0.5">
                  {state.sessions.length} logged
                </p>
              </div>
              <div>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#06B6D4]/15 text-[#0891B2] dark:text-[#22D3EE] mb-1.5">
                  <Hourglass className="w-4 h-4" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Total Focus</p>
                <p className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white mt-0.5">
                  {metrics.totalHoursAllTime}h
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Focus Sounds & Session History */}
        <div className="lg:col-span-5 space-y-6">
          {/* Ambient Focus Sounds */}
          <section className="sf-glass rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  {t.focus.focusSounds}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.focus.focusSoundsSub}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundEngine.stop();
                  setActiveSound('none');
                }}
                aria-label="Mute focus sound"
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/[0.06] cursor-pointer"
              >
                {activeSound === 'none' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {SOUND_SCAPES.map((sound) => {
                const Icon = sound.icon;
                const isActive = activeSound === sound.id;
                return (
                  <button
                    key={sound.id}
                    type="button"
                    onClick={() => handleToggleSound(sound.id)}
                    className={`text-left rounded-2xl p-3 border transition-all cursor-pointer relative overflow-hidden ${
                      isActive
                        ? sound.activeClass
                        : 'border-slate-200/80 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.03] hover:border-[#7C3AED]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive
                            ? 'text-[#7C3AED] dark:text-white'
                            : 'text-[#7C3AED] dark:text-[#A78BFA]'
                        }`}
                      />
                      {isActive ? (
                        <span className="inline-flex items-end gap-[2.5px] h-3.5" aria-label={isBn ? 'চলছে' : 'Playing'}>
                          <span className="w-[2.5px] h-full rounded-full bg-[#7C3AED] dark:bg-purple-200 eq-bar-1" />
                          <span className="w-[2.5px] h-full rounded-full bg-[#7C3AED] dark:bg-purple-200 eq-bar-2" />
                          <span className="w-[2.5px] h-full rounded-full bg-[#7C3AED] dark:bg-purple-200 eq-bar-3" />
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400">
                          {isBn ? 'বন্ধ' : 'Off'}
                        </span>
                      )}
                    </div>
                    <p className="mt-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {isBn ? sound.nameBn : sound.name}
                    </p>
                    <p
                      className={`text-[11px] truncate ${
                        isActive
                          ? 'text-slate-600 dark:text-white/75'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {isBn ? sound.subtitleBn : sound.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">{t.focus.volume}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="flex-1 accent-[#7C3AED]"
                aria-label="Ambient volume"
              />
              <span className="font-mono text-xs tabular-nums text-slate-600 dark:text-slate-300 w-9 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </section>

          {/* Session History */}
          <section className="sf-glass rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Session History</h2>
              <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {metrics.weeklyHours.toFixed(1)}h this week
              </span>
            </div>

            {state.sessions.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
                No focus sessions recorded yet. Start your first timer block!
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-white/[0.06] max-h-72 overflow-y-auto pr-1">
                {state.sessions.slice(0, 12).map((session) => {
                  const sub = subjectMap[session.subjectId];
                  return (
                    <li key={session.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {session.label}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {sub?.name ?? 'General'} · {session.mode} ·{' '}
                          {new Date(session.completedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-xs font-semibold tabular-nums text-[#7C3AED] dark:text-[#A78BFA]">
                          {session.durationMinutes}m
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteFocusSession(session.id)}
                          aria-label="Delete session"
                          className="opacity-60 sm:opacity-0 sm:group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
