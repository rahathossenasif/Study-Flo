import React, { useEffect, useId, useLayoutEffect, useState } from 'react';
import {
  LayoutGrid,
  BookMarked,
  Timer,
  NotebookPen,
  UsersRound,
  GalleryVerticalEnd,
  TrendingUp,
  SlidersHorizontal,
  Sun,
  Moon,
  CheckCircle2,
  BrainCircuit,
  UserRound,
  Globe,
  Grip,
  X,
  Target,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { StudyFlowProvider, useStudyFlow } from './context/StudyFlowContext';
import { NavTab, SubjectAccent } from './types/studyflow';
import { DashboardView } from './components/DashboardView';
import { DailyGoalView } from './components/DailyGoalView';
import { SyllabusView } from './components/SyllabusView';
import { FocusTimerView } from './components/FocusTimerView';
import { NotesView } from './components/NotesView';
import { StudyCircleView } from './components/StudyCircleView';
import { FlashcardsView } from './components/FlashcardsView';
import { ProgressReportView } from './components/ProgressReportView';
import { SettingsView } from './components/SettingsView';
import { AIAssistantView } from './components/AIAssistantView';
import { ProfileView } from './components/ProfileView';
import { OfflineIndicator } from './components/PWAInstallButton';
import { InstallWelcomeModal } from './components/InstallWelcomeModal';

/** Unique bespoke STUDYFLO emblem: kinetic S-flow ribbon + glowing focus node inside a sculpted prism */
function StudyFlowLogo({ size = 30 }: { size?: number }) {
  const uid = useId().replace(/:/g, '');
  const bgId = `${uid}-bg`;
  const ribbonId = `${uid}-ribbon`;
  const rimId = `${uid}-rim`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0 drop-shadow-[0_4px_14px_rgba(135,59,255,0.38)]"
    >
      <defs>
        <linearGradient id={bgId} x1="3" y1="3" x2="37" y2="37" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E1148" />
          <stop offset="52%" stopColor="#873BFF" />
          <stop offset="100%" stopColor="#16C7D9" />
        </linearGradient>
        <linearGradient id={ribbonId} x1="10" y1="9" x2="30" y2="31" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="58%" stopColor="#E9D5FF" />
          <stop offset="100%" stopColor="#67E8F9" />
        </linearGradient>
        <linearGradient id={rimId} x1="4" y1="2" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
          <stop offset="50%" stopColor="#C4B5FD" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#16C7D9" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="12" fill={`url(#${bgId})`} />
      <rect x="2.75" y="2.75" width="34.5" height="34.5" rx="11.25" stroke={`url(#${rimId})`} strokeWidth="1.4" />
      <path
        d="M27.5 13.5C27.5 11.4 24.4 10 20.4 10C15.8 10 12.8 12.1 12.8 14.9C12.8 17.8 15.6 19.1 20.2 20.1C24.9 21.1 27.6 22.4 27.6 25.4C27.6 28.4 24.4 30.2 19.6 30.2C15.5 30.2 12.6 28.6 12.2 26.4"
        stroke={`url(#${ribbonId})`}
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <circle cx="28.2" cy="12.2" r="2.6" fill="#16C7D9" />
      <circle cx="11.8" cy="27.4" r="1.8" fill="#E9D5FF" />
    </svg>
  );
}

const PRIMARY_TABS: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'Home', icon: LayoutGrid },
  { id: 'syllabus', label: 'Syllabus', icon: BookMarked },
  { id: 'focus', label: 'Focus', icon: Timer },
  { id: 'notes', label: 'Notes', icon: NotebookPen },
  { id: 'circle', label: 'Circle', icon: UsersRound },
];

const SECONDARY_TABS: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'goals', label: 'Daily Goal', icon: Target },
  { id: 'assistant', label: 'AI Assistant', icon: BrainCircuit },
  { id: 'flashcards', label: 'Flashcards', icon: GalleryVerticalEnd },
  { id: 'progress', label: 'Progress Report', icon: TrendingUp },
  { id: 'profile', label: 'My Profile', icon: UserRound },
  { id: 'settings', label: 'Settings', icon: SlidersHorizontal },
];

const AVATAR_BG_MAP: Record<SubjectAccent, string> = {
  purple: 'bg-gradient-to-br from-[#873BFF] to-[#6366F1] text-white',
  cyan: 'bg-gradient-to-br from-[#16C7D9] to-[#0284C7] text-white',
  blue: 'bg-gradient-to-br from-[#3B82F6] to-[#2563EB] text-white',
  emerald: 'bg-gradient-to-br from-[#10B981] to-[#059669] text-white',
  amber: 'bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white',
  rose: 'bg-gradient-to-br from-[#F43F5E] to-[#E11D48] text-white',
};

function StudyFlowShell() {
  const {
    state,
    metrics,
    t,
    activeTab,
    setActiveTab,
    updateProfile,
    joinStudyRoomByCode,
    showToast,
    toast,
  } = useStudyFlow();
  const isBn = (state.profile.language ?? 'en') === 'bn';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const MOBILE_MAIN_TABS: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: LayoutGrid },
    { id: 'syllabus', label: 'Syllabus', icon: BookMarked },
    { id: 'focus', label: 'Focus', icon: Timer },
    { id: 'notes', label: 'Notes', icon: NotebookPen },
  ];

  const MOBILE_MENU_TABS: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'circle', label: 'Circle', icon: UsersRound },
    { id: 'assistant', label: 'AI Assistant', icon: BrainCircuit },
    { id: 'flashcards', label: 'Flashcards', icon: GalleryVerticalEnd },
    { id: 'progress', label: 'Progress Report', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: SlidersHorizontal },
    { id: 'profile', label: 'My Profile', icon: UserRound },
  ];

  const isMenuTabActive =
    activeTab === 'goals' ||
    MOBILE_MENU_TABS.some((item) => item.id === activeTab && item.id !== 'profile');

  const dailyGoalTargetMin = Math.max(15, state.profile.dailyGoalMinutes || 120);
  const dailyGoalPercent = Math.min(100, Math.round((metrics.todayMinutes / dailyGoalTargetMin) * 100));
  const dailyGoalReached = metrics.todayMinutes >= dailyGoalTargetMin;
  const formatCompactHm = (mins: number) => {
    const safe = Math.max(0, Math.round(mins));
    const h = Math.floor(safe / 60);
    const m = safe % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const scrollToPageTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  // Always start every tab/view from the very top of the page
  useLayoutEffect(() => {
    scrollToPageTop();
  }, [activeTab]);

  const handleMobileNav = (tab: NavTab) => {
    setMobileMenuOpen(false);
    setActiveTab(tab);
    scrollToPageTop();
  };

  // Auto-join shared Study Circle room link (?room=CODE)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invitedCode = params.get('room');
    if (invitedCode && invitedCode.trim().length >= 4) {
      joinStudyRoomByCode(invitedCode.trim());
      setActiveTab('circle');
      params.delete('room');
      const cleanUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      window.history.replaceState({}, '', cleanUrl);
    }
    // Run once on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTheme = () => {
    updateProfile({ theme: state.profile.theme === 'dark' ? 'light' : 'dark' });
  };

  const toggleLanguage = () => {
    const nextLang = isBn ? 'en' : 'bn';
    updateProfile({ language: nextLang });
    showToast(nextLang === 'bn' ? 'ভাষা বাংলায় পরিবর্তন করা হয়েছে' : 'Language switched to English');
  };

  const getTabLabel = (id: NavTab, fallback: string): string => {
    switch (id) {
      case 'home':
        return t.nav.home;
      case 'goals':
        return isBn ? 'দৈনিক লক্ষ্য' : 'Daily Goal';
      case 'syllabus':
        return t.nav.syllabus;
      case 'focus':
        return t.nav.focus;
      case 'notes':
        return t.nav.notes;
      case 'circle':
        return t.nav.circle;
      case 'assistant':
        return t.assistant.title;
      case 'flashcards':
        return t.nav.flashcards;
      case 'progress':
        return t.nav.progress;
      case 'profile':
        return isBn ? 'আমার প্রোফাইল' : 'My Profile';
      case 'settings':
        return t.nav.settings;
      default:
        return fallback;
    }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardView />;
      case 'goals':
        return <DailyGoalView />;
      case 'syllabus':
        return <SyllabusView />;
      case 'focus':
        return <FocusTimerView />;
      case 'notes':
        return <NotesView />;
      case 'circle':
        return <StudyCircleView />;
      case 'assistant':
        return <AIAssistantView />;
      case 'flashcards':
        return <FlashcardsView />;
      case 'progress':
        return <ProgressReportView />;
      case 'profile':
        return <ProfileView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  const initials =
    state.profile.name
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'SF';

  const avatarBgClass = AVATAR_BG_MAP[state.profile.avatarColor ?? 'purple'];

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-[#F4F5FA] flex overflow-x-clip">
      {/* Desktop Refined Studio Sidebar Navigation */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[264px] lg:fixed lg:inset-y-0 lg:left-0 bg-white dark:bg-[#11101D] border-r border-slate-200/80 dark:border-white/[0.07] z-30">
        {/* Brand Header */}
        <div className="relative z-10 px-5 pt-6 pb-5 border-b border-slate-200/70 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="group flex items-center gap-2.5 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C4DFF] rounded-xl"
          >
            <span className="transition-transform duration-150 group-hover:scale-105">
              <StudyFlowLogo size={32} />
            </span>
            <div className="leading-none">
              <span className="font-display text-[18px] font-extrabold tracking-[-0.03em] text-slate-900 dark:text-white inline-flex items-baseline">
                STUDY
                <span className="text-[#7C4DFF] dark:text-[#A78BFA]">FLO</span>
              </span>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-none mt-1.5">
                {t.tagline}
              </p>
            </div>
          </button>
        </div>

        {/* Navigation Links with Clean Tactile Active State */}
        <nav className="relative z-10 flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Primary navigation">
          <p className="px-3 pb-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            {isBn ? 'মূল মেনু' : 'Workspace'}
          </p>
          {PRIMARY_TABS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`group relative w-full flex items-center gap-3 px-3 py-2.5 min-h-[42px] rounded-xl text-[13.5px] transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C4DFF] ${
                  active
                    ? 'text-[#6D28D9] dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100/80 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="desktopNavActive"
                    transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                    className="absolute inset-0 rounded-xl bg-[#7C4DFF]/10 dark:bg-white/[0.08] border border-[#7C4DFF]/18 dark:border-white/[0.09]"
                  />
                )}
                <Icon
                  className={`relative z-10 w-[18px] h-[18px] shrink-0 ${
                    active
                      ? 'stroke-[2.1] text-[#7C4DFF] dark:text-[#B794FF]'
                      : 'stroke-[1.8] text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                  }`}
                />
                <span className="relative z-10 truncate">{getTabLabel(item.id, item.label)}</span>
              </button>
            );
          })}

          <div className="my-4 mx-2 border-t border-slate-200/70 dark:border-white/[0.06]" />

          <p className="px-3 pb-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            {isBn ? 'টুলস ও প্রোফাইল' : 'Tools & Account'}
          </p>
          {SECONDARY_TABS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`group relative w-full flex items-center justify-between gap-3 px-3 py-2.5 min-h-[42px] rounded-xl text-[13.5px] transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C4DFF] ${
                  active
                    ? 'text-[#6D28D9] dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100/80 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="desktopNavActive"
                    transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                    className="absolute inset-0 rounded-xl bg-[#7C4DFF]/10 dark:bg-white/[0.08] border border-[#7C4DFF]/18 dark:border-white/[0.09]"
                  />
                )}
                <span className="relative z-10 flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 ${
                      active
                        ? 'stroke-[2.1] text-[#7C4DFF] dark:text-[#B794FF]'
                        : 'stroke-[1.8] text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                    }`}
                  />
                  <span className="truncate">{getTabLabel(item.id, item.label)}</span>
                </span>
                {item.id === 'goals' && (
                  <span
                    className={`relative z-10 font-display text-xs font-semibold tabular-nums shrink-0 ${
                      dailyGoalReached
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : active
                          ? 'text-[#7C4DFF] dark:text-[#C4B5FD]'
                          : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {dailyGoalPercent}%
                  </span>
                )}
                {item.id === 'flashcards' && metrics.dueFlashcardsCount > 0 && (
                  <span
                    className={`relative z-10 font-display text-xs font-semibold tabular-nums shrink-0 ${
                      active ? 'text-[#7C4DFF] dark:text-[#C4B5FD]' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {metrics.dueFlashcardsCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Profile, Language & Theme Glass Dock */}
        <div className="relative z-10 p-3.5 border-t border-slate-200/70 dark:border-white/[0.07]">
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-50/90 dark:bg-[#17132D]/85 border border-slate-200/75 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-85 transition-opacity cursor-pointer"
            >
              {state.profile.avatarDataUrl ? (
                <img
                  src={state.profile.avatarDataUrl}
                  alt={state.profile.name}
                  className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-[#873BFF]/40"
                />
              ) : (
                <div
                  className={`w-9 h-9 rounded-full ${avatarBgClass} font-display font-bold text-xs flex items-center justify-center shrink-0 shadow-sm`}
                >
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {state.profile.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {state.profile.institution?.trim() || `${state.profile.streakDays}d streak`}
                </p>
              </div>
            </button>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={toggleLanguage}
                aria-label="Switch between Bangla and English"
                title={isBn ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
                className="px-2 h-8 rounded-xl bg-white dark:bg-white/[0.07] hover:bg-slate-100 dark:hover:bg-white/[0.14] border border-slate-200/80 dark:border-white/[0.09] text-slate-700 dark:text-slate-200 text-[11px] font-bold inline-flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-[#873BFF] dark:text-[#C4B5FD] shrink-0" />
                <span>{isBn ? 'EN' : 'বাং'}</span>
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle dark and light theme"
                className="w-8 h-8 rounded-xl bg-white dark:bg-white/[0.07] hover:bg-slate-100 dark:hover:bg-white/[0.14] border border-slate-200/80 dark:border-white/[0.09] text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 transition-all active:scale-95 cursor-pointer"
              >
                {state.profile.theme === 'dark' ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-[#873BFF]" />
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[264px]">
        {/* Clean Mobile Top Header: ONLY App Logo + Name (Left) and Profile (Right) */}
        <header className="lg:hidden sticky top-0 z-30 h-14 px-4 bg-white/95 dark:bg-[#0D0D18]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-white/[0.07] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => handleMobileNav('home')}
            className="group flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <StudyFlowLogo size={26} />
            <span className="font-display text-[17px] font-extrabold tracking-[-0.03em] text-slate-900 dark:text-white inline-flex items-baseline">
              STUDY
              <span className="text-[#7C4DFF] dark:text-[#A78BFA]">FLO</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleMobileNav('profile')}
            aria-label="Open My Profile"
            className={`flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border transition-colors active:scale-95 shrink-0 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#7C4DFF]/12 border-[#7C4DFF]/35 text-[#6D28D9] dark:text-[#C4B5FD]'
                : 'bg-slate-100/90 dark:bg-white/[0.06] border-slate-200/80 dark:border-white/[0.09] text-slate-800 dark:text-slate-100'
            }`}
          >
            {state.profile.avatarDataUrl ? (
              <img
                src={state.profile.avatarDataUrl}
                alt={state.profile.name}
                className="w-7 h-7 rounded-full object-cover shrink-0"
              />
            ) : (
              <span
                className={`w-7 h-7 rounded-full ${avatarBgClass} font-display text-[11px] font-bold flex items-center justify-center shrink-0`}
              >
                {initials}
              </span>
            )}
            <span className="text-xs font-semibold max-w-[92px] truncate">
              {state.profile.name}
            </span>
          </button>
        </header>

        {/* Scrollable Page Viewport with Instant, Snappy Page Entrance */}
        <main className="flex-1 w-full max-w-[1220px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 lg:pb-10">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0.35, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
          >
            {renderActiveView()}
          </motion.div>
        </main>

        {/* Mobile Study Hub Quick Menu Sheet */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.button
                type="button"
                aria-label="Close study menu"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden fixed inset-0 z-40 bg-black/48 backdrop-blur-xs cursor-pointer"
              />
              <motion.div
                initial={{ opacity: 0, y: 14, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.97 }}
                transition={{ duration: 0.13, ease: [0.22, 1, 0.36, 1] }}
                className="lg:hidden fixed bottom-[84px] left-3 right-3 z-50 max-w-md mx-auto rounded-3xl bg-white/97 dark:bg-[#17132D]/97 backdrop-blur-xl border border-slate-200/90 dark:border-[#873BFF]/30 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.65)] p-4"
              >
                <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200/70 dark:border-white/[0.08]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#873BFF]/20 to-[#16C7D9]/20 text-[#873BFF] dark:text-[#C4B5FD] flex items-center justify-center">
                      <Grip className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {isBn ? 'স্টাডি হাব' : 'Study Hub'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isBn ? 'সব টুলস ও সেটিংস এক জায়গায়' : 'All tools & settings in one place'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close study menu"
                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.07] text-slate-500 dark:text-slate-300 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Featured Daily Goal Tracker Tile inside Study Hub Menu */}
                <button
                  type="button"
                  onClick={() => handleMobileNav('goals')}
                  className={`w-full mb-2.5 px-3.5 py-3 rounded-2xl border text-left transition-all active:scale-[0.98] cursor-pointer ${
                    activeTab === 'goals'
                      ? 'bg-gradient-to-r from-[#873BFF] to-[#6B2CF5] text-white border-white/20 shadow-md shadow-[#873BFF]/30'
                      : 'bg-slate-50/95 dark:bg-white/[0.045] hover:bg-slate-100 dark:hover:bg-white/[0.08] border-slate-200/80 dark:border-white/[0.09] text-slate-900 dark:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Target
                        className={`w-[18px] h-[18px] shrink-0 ${
                          activeTab === 'goals'
                            ? 'text-white'
                            : dailyGoalReached
                              ? 'text-emerald-500'
                              : 'text-[#873BFF] dark:text-[#C4B5FD]'
                        }`}
                      />
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold truncate">
                          {isBn ? 'দৈনিক লক্ষ্য ট্র্যাকার' : 'Daily Goal Tracker'}
                        </span>
                        <span
                          className={`block text-[11px] tabular-nums mt-0.5 ${
                            activeTab === 'goals'
                              ? 'text-purple-100'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {formatCompactHm(metrics.todayMinutes)} / {formatCompactHm(dailyGoalTargetMin)}
                        </span>
                      </span>
                    </span>
                    <span
                      className={`font-display text-xs font-bold tabular-nums shrink-0 ${
                        activeTab === 'goals'
                          ? 'text-white'
                          : dailyGoalReached
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-[#7C4DFF] dark:text-[#C4B5FD]'
                      }`}
                    >
                      {dailyGoalPercent}%
                    </span>
                  </div>
                  <div
                    className={`mt-2.5 h-1.5 w-full rounded-full overflow-hidden ${
                      activeTab === 'goals' ? 'bg-white/20' : 'bg-slate-200/80 dark:bg-white/[0.08]'
                    }`}
                  >
                    <div
                      style={{ width: `${dailyGoalPercent}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        activeTab === 'goals'
                          ? 'bg-white'
                          : dailyGoalReached
                            ? 'bg-emerald-500'
                            : 'bg-[#7C4DFF]'
                      }`}
                    />
                  </div>
                </button>

                {/* Study Hub Tools Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {MOBILE_MENU_TABS.map((item) => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleMobileNav(item.id)}
                        className={`relative flex items-center justify-between gap-2 px-3 py-3 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer ${
                          active
                            ? 'bg-gradient-to-r from-[#873BFF] to-[#6B2CF5] text-white border-white/20 shadow-md shadow-[#873BFF]/30'
                            : 'bg-slate-50/90 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] border-slate-200/75 dark:border-white/[0.08] text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-[18px] h-[18px] shrink-0 ${
                              active ? 'text-white' : 'text-[#873BFF] dark:text-[#C4B5FD]'
                            }`}
                          />
                          <span className="text-xs font-semibold truncate">
                            {getTabLabel(item.id, item.label)}
                          </span>
                        </span>
                        {item.id === 'flashcards' && metrics.dueFlashcardsCount > 0 && (
                          <span
                            className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                              active
                                ? 'bg-white/20 text-white'
                                : 'bg-[#873BFF]/15 text-[#873BFF] dark:text-[#C4B5FD]'
                            }`}
                          >
                            {metrics.dueFlashcardsCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Quick Controls inside Study Hub: Language & Theme */}
                <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-white/[0.08] grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={toggleLanguage}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] hover:bg-slate-200/80 dark:hover:bg-white/[0.11] border border-slate-200/70 dark:border-white/[0.08] text-xs font-semibold text-slate-800 dark:text-slate-100 transition-all active:scale-95 cursor-pointer"
                  >
                    <Globe className="w-4 h-4 text-[#873BFF] dark:text-[#16C7D9]" />
                    <span>{isBn ? 'Language: English' : 'ভাষা: বাংলা'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] hover:bg-slate-200/80 dark:hover:bg-white/[0.11] border border-slate-200/70 dark:border-white/[0.08] text-xs font-semibold text-slate-800 dark:text-slate-100 transition-all active:scale-95 cursor-pointer"
                  >
                    {state.profile.theme === 'dark' ? (
                      <>
                        <Sun className="w-4 h-4 text-amber-400" />
                        <span>{isBn ? 'লাইট মোড' : 'Light Mode'}</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-4 h-4 text-[#873BFF]" />
                        <span>{isBn ? 'ডার্ক মোড' : 'Dark Mode'}</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile Clean Native-Style 5-Tab Bottom Navigation Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-2.5 pt-1 pointer-events-none">
          <nav
            aria-label="Bottom navigation"
            className="pointer-events-auto max-w-md mx-auto h-[62px] bg-white/96 dark:bg-[#131220]/96 backdrop-blur-lg rounded-2xl border border-slate-200/85 dark:border-white/[0.09] shadow-[0_8px_28px_-8px_rgba(15,23,42,0.16)] dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.85)] grid grid-cols-5 items-center px-1.5"
          >
            {MOBILE_MAIN_TABS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id && !mobileMenuOpen;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleMobileNav(item.id)}
                  className={`relative flex flex-col items-center justify-center h-12 rounded-xl transition-colors cursor-pointer active:scale-95 ${
                    active
                      ? 'text-[#6D28D9] dark:text-[#C4B5FD]'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="mobileDockActive"
                      transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                      className="absolute inset-0.5 rounded-xl bg-[#7C4DFF]/12 dark:bg-[#7C4DFF]/18"
                    />
                  )}
                  <Icon
                    className={`relative z-10 w-[19px] h-[19px] ${
                      active ? 'stroke-[2.2]' : 'stroke-[1.75]'
                    }`}
                  />
                  <span
                    className={`relative z-10 mt-0.5 text-[10.5px] tracking-tight whitespace-nowrap ${
                      active ? 'font-bold' : 'font-medium'
                    }`}
                  >
                    {getTabLabel(item.id, item.label)}
                  </span>
                </button>
              );
            })}

            {/* 5th Tab: Study Hub Menu */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-expanded={mobileMenuOpen}
              aria-label="Open study menu"
              className={`relative flex flex-col items-center justify-center h-12 rounded-xl transition-colors cursor-pointer active:scale-95 ${
                mobileMenuOpen || isMenuTabActive
                  ? 'text-[#6D28D9] dark:text-[#C4B5FD]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {(mobileMenuOpen || isMenuTabActive) && (
                <motion.span
                  layoutId="mobileDockActive"
                  transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                  className="absolute inset-0.5 rounded-xl bg-[#7C4DFF]/12 dark:bg-[#7C4DFF]/18"
                />
              )}
              <Grip
                className={`relative z-10 w-[19px] h-[19px] ${
                  mobileMenuOpen || isMenuTabActive ? 'stroke-[2.2]' : 'stroke-[1.75]'
                }`}
              />
              {metrics.dueFlashcardsCount > 0 && !mobileMenuOpen && (
                <span className="absolute top-1.5 right-2.5 z-20 font-display text-[9px] font-bold bg-[#7C4DFF] text-white rounded-full min-w-[15px] h-[15px] px-1 flex items-center justify-center">
                  {metrics.dueFlashcardsCount}
                </span>
              )}
              <span
                className={`relative z-10 mt-0.5 text-[10.5px] tracking-tight whitespace-nowrap ${
                  mobileMenuOpen || isMenuTabActive ? 'font-bold' : 'font-medium'
                }`}
              >
                {isBn ? 'মেনু' : 'Menu'}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Compact Unique Welcome Dashboard on App Install / First Visit */}
      <InstallWelcomeModal />

      {/* Offline Connectivity Indicator */}
      <OfflineIndicator />

      {/* Non-intrusive Glass Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            role="status"
            className="fixed bottom-24 lg:bottom-6 right-4 sm:right-6 z-50 px-4 py-3 rounded-2xl bg-white/95 dark:bg-[#1A1436]/95 backdrop-blur-xl text-slate-900 dark:text-white border border-slate-200/90 dark:border-[#873BFF]/40 shadow-2xl shadow-slate-900/12 dark:shadow-black/55 flex items-center gap-2.5 text-xs font-medium"
          >
            <CheckCircle2 className="w-4 h-4 text-[#873BFF] dark:text-[#16C7D9] shrink-0" />
            <span>{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <StudyFlowProvider>
      <StudyFlowShell />
    </StudyFlowProvider>
  );
}
