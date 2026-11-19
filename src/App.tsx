import React, { useEffect } from 'react';
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
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { StudyFlowProvider, useStudyFlow } from './context/StudyFlowContext';
import { NavTab, SubjectAccent } from './types/studyflow';
import { DashboardView } from './components/DashboardView';
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

/** Unique bespoke STUDYFLO emblem: kinetic S-flow ribbon + glowing focus node inside a sculpted prism */
function StudyFlowLogo({ size = 30 }: { size?: number }) {
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
        <linearGradient id="sfPrismBg" x1="3" y1="3" x2="37" y2="37" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E1148" />
          <stop offset="52%" stopColor="#873BFF" />
          <stop offset="100%" stopColor="#16C7D9" />
        </linearGradient>
        <linearGradient id="sfRibbon" x1="10" y1="9" x2="30" y2="31" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="58%" stopColor="#E9D5FF" />
          <stop offset="100%" stopColor="#67E8F9" />
        </linearGradient>
        <linearGradient id="sfRim" x1="4" y1="2" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
          <stop offset="50%" stopColor="#C4B5FD" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#16C7D9" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="12" fill="url(#sfPrismBg)" />
      <rect x="2.75" y="2.75" width="34.5" height="34.5" rx="11.25" stroke="url(#sfRim)" strokeWidth="1.4" />
      <path
        d="M27.5 13.5C27.5 11.4 24.4 10 20.4 10C15.8 10 12.8 12.1 12.8 14.9C12.8 17.8 15.6 19.1 20.2 20.1C24.9 21.1 27.6 22.4 27.6 25.4C27.6 28.4 24.4 30.2 19.6 30.2C15.5 30.2 12.6 28.6 12.2 26.4"
        stroke="url(#sfRibbon)"
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
      {/* Desktop Premium Glass Sidebar Navigation */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[272px] lg:fixed lg:inset-y-0 lg:left-0 bg-white/90 dark:bg-[#0D0B1E]/92 backdrop-blur-2xl border-r border-slate-200/80 dark:border-[#873BFF]/15 shadow-[4px_0_32px_-14px_rgba(15,23,42,0.08)] dark:shadow-[8px_0_40px_-12px_rgba(0,0,0,0.65)] z-30">
        {/* Subtle Top Edge Ambient Glow inside Sidebar */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 inset-x-0 h-32 opacity-0 dark:opacity-100"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 35% 0%, rgba(135, 59, 255, 0.16), transparent 72%)',
          }}
        />

        {/* Brand Header */}
        <div className="relative z-10 px-5 pt-6 pb-5 border-b border-slate-200/60 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="group flex items-center gap-2 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873BFF] rounded-xl"
          >
            <span className="transition-transform duration-200 group-hover:scale-105 group-hover:-rotate-3">
              <StudyFlowLogo size={34} />
            </span>
            <div className="leading-none">
              <span className="font-display text-[19px] font-extrabold tracking-[-0.04em] text-slate-900 dark:text-white inline-flex items-baseline">
                STUDY
                <span className="bg-gradient-to-r from-[#873BFF] via-[#7C5CFF] to-[#16C7D9] bg-clip-text text-transparent">
                  FLO
                </span>
                <span className="ml-0.5 inline-block w-1.5 h-1.5 rounded-full bg-[#16C7D9] -translate-y-0.5" />
              </span>
              <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 leading-none mt-1.5 tracking-[0.01em]">
                {t.tagline}
              </p>
            </div>
          </button>
        </div>

        {/* Navigation Links with Luminous Purple Gradient Active State */}
        <nav className="relative z-10 flex-1 px-3.5 py-4 space-y-1 overflow-y-auto" aria-label="Primary navigation">
          <p className="px-3 pb-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wide">
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
                className={`group relative w-full flex items-center gap-3 px-3.5 py-2.5 min-h-[44px] rounded-2xl text-[14px] font-medium transition-all duration-150 whitespace-nowrap cursor-pointer active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873BFF] ${
                  active
                    ? 'text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300/90 hover:bg-slate-100/85 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="desktopNavActive"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#873BFF] via-[#7535F0] to-[#5F2EE5] shadow-[0_8px_22px_-6px_rgba(135,59,255,0.62)] border border-white/20"
                  />
                )}
                <Icon
                  className={`relative z-10 w-[18px] h-[18px] shrink-0 transition-transform duration-150 ${
                    active
                      ? 'stroke-[2.2]'
                      : 'stroke-[1.9] text-slate-500 dark:text-slate-400 group-hover:text-[#873BFF] dark:group-hover:text-[#C4B5FD] group-hover:translate-x-0.5'
                  }`}
                />
                <span className="relative z-10 truncate">{getTabLabel(item.id, item.label)}</span>
              </button>
            );
          })}

          <div className="my-4 mx-2 border-t border-slate-200/70 dark:border-white/[0.07]" />

          <p className="px-3 pb-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wide">
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
                className={`group relative w-full flex items-center justify-between gap-3 px-3.5 py-2.5 min-h-[44px] rounded-2xl text-[14px] font-medium transition-all duration-150 whitespace-nowrap cursor-pointer active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873BFF] ${
                  active
                    ? 'text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300/90 hover:bg-slate-100/85 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="desktopNavActive"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#873BFF] via-[#7535F0] to-[#5F2EE5] shadow-[0_8px_22px_-6px_rgba(135,59,255,0.62)] border border-white/20"
                  />
                )}
                <span className="relative z-10 flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 transition-transform duration-150 ${
                      active
                        ? 'stroke-[2.2]'
                        : 'stroke-[1.9] text-slate-500 dark:text-slate-400 group-hover:text-[#873BFF] dark:group-hover:text-[#C4B5FD] group-hover:translate-x-0.5'
                    }`}
                  />
                  <span className="truncate">{getTabLabel(item.id, item.label)}</span>
                </span>
                {item.id === 'flashcards' && metrics.dueFlashcardsCount > 0 && (
                  <span
                    className={`relative z-10 font-mono text-xs font-semibold tabular-nums shrink-0 ${
                      active ? 'text-purple-100' : 'text-[#873BFF] dark:text-[#C4B5FD]'
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
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[272px]">
        {/* Refined Uncluttered Mobile Top Header */}
        <header className="lg:hidden sticky top-0 z-30 h-15 px-3.5 sm:px-4 bg-white/85 dark:bg-[#0B0A1B]/88 backdrop-blur-2xl border-b border-slate-200/75 dark:border-[#873BFF]/15 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="group flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span className="transition-transform duration-200 group-hover:scale-105">
              <StudyFlowLogo size={27} />
            </span>
            <span className="font-display text-[16px] font-extrabold tracking-[-0.04em] text-slate-900 dark:text-white inline-flex items-baseline">
              STUDY
              <span className="bg-gradient-to-r from-[#873BFF] via-[#7C5CFF] to-[#16C7D9] bg-clip-text text-transparent">
                FLO
              </span>
              <span className="ml-0.5 inline-block w-1.5 h-1.5 rounded-full bg-[#16C7D9] -translate-y-0.5" />
            </span>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={toggleLanguage}
              aria-label="Switch between Bangla and English"
              className="h-9 px-2.5 rounded-xl bg-slate-100/90 dark:bg-[#17132D]/90 border border-slate-200/70 dark:border-white/[0.08] hover:bg-slate-200/70 dark:hover:bg-white/[0.12] flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all active:scale-95 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#873BFF] dark:text-[#C4B5FD] shrink-0" />
              <span>{isBn ? 'EN' : 'বাং'}</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle dark and light theme"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.07] transition-all active:scale-95 cursor-pointer"
            >
              {state.profile.theme === 'dark' ? (
                <Sun className="w-[18px] h-[18px] text-amber-400" />
              ) : (
                <Moon className="w-[18px] h-[18px] text-[#873BFF]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('assistant')}
              aria-label="Open AI Study Assistant"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                activeTab === 'assistant'
                  ? 'text-[#873BFF] dark:text-[#C4B5FD] bg-[#873BFF]/15'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.07]'
              }`}
            >
              <BrainCircuit className="w-[19px] h-[19px]" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('flashcards')}
              aria-label="Open Flashcards"
              className={`w-10 h-10 rounded-xl flex items-center justify-center relative transition-all active:scale-95 cursor-pointer ${
                activeTab === 'flashcards'
                  ? 'text-[#873BFF] dark:text-[#C4B5FD] bg-[#873BFF]/15'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.07]'
              }`}
            >
              <GalleryVerticalEnd className="w-[19px] h-[19px]" />
              {metrics.dueFlashcardsCount > 0 && (
                <span className="absolute top-1.5 right-1 font-mono text-[9px] font-bold bg-[#873BFF] text-white rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center shadow-sm">
                  {metrics.dueFlashcardsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              aria-label="Open Settings"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                activeTab === 'settings'
                  ? 'text-[#873BFF] dark:text-[#C4B5FD] bg-[#873BFF]/15'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.07]'
              }`}
            >
              <SlidersHorizontal className="w-[18px] h-[18px]" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              aria-label="Open My Profile"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                activeTab === 'profile' ? 'bg-[#873BFF]/15' : ''
              }`}
            >
              {state.profile.avatarDataUrl ? (
                <img
                  src={state.profile.avatarDataUrl}
                  alt={state.profile.name}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-[#873BFF]/50"
                />
              ) : (
                <span
                  className={`w-7 h-7 rounded-full ${avatarBgClass} font-display text-[11px] font-bold flex items-center justify-center shadow-sm`}
                >
                  {initials}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Scrollable Page Viewport with Fluid Page Transition */}
        <main className="flex-1 w-full max-w-[1220px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 lg:pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.997 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile Floating Glass 5-Tab Bottom Navigation Dock */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pt-1 pointer-events-none">
          <nav
            aria-label="Bottom navigation"
            className="pointer-events-auto max-w-md mx-auto h-16 bg-white/92 dark:bg-[#120F26]/92 backdrop-blur-2xl rounded-2xl border border-slate-200/85 dark:border-[#873BFF]/25 shadow-[0_12px_36px_-8px_rgba(15,23,42,0.18)] dark:shadow-[0_14px_40px_-6px_rgba(0,0,0,0.88)] grid grid-cols-5 items-center px-1.5"
          >
            {PRIMARY_TABS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex flex-col items-center justify-center h-12 rounded-xl transition-colors cursor-pointer active:scale-95 ${
                    active
                      ? 'text-white'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="mobileDockActive"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      className="absolute inset-0.5 rounded-xl bg-gradient-to-r from-[#873BFF] to-[#6B2CF5] shadow-[0_6px_16px_-4px_rgba(135,59,255,0.65)] border border-white/15"
                    />
                  )}
                  <Icon
                    className={`relative z-10 w-[19px] h-[19px] transition-transform duration-150 ${
                      active ? 'stroke-[2.2] scale-105' : 'stroke-[1.8]'
                    }`}
                  />
                  <span className="relative z-10 mt-0.5 text-[10px] font-semibold tracking-tight whitespace-nowrap">
                    {getTabLabel(item.id, item.label)}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

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
