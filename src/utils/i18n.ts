import { AppLanguage, ThemeMode } from '../types/studyflow';

export interface Translations {
  tagline: string;
  nav: {
    home: string;
    library: string;
    syllabus: string;
    planner: string;
    focus: string;
    notes: string;
    circle: string;
    flashcards: string;
    progress: string;
    achievements: string;
    settings: string;
  };
  themes: Record<ThemeMode, { label: string; desc: string }>;
  languages: {
    en: string;
    bn: string;
  };
  pwa: {
    installApp: string;
    installShort: string;
    installed: string;
    iosTitle: string;
    iosStep1: string;
    iosStep2: string;
    androidHint: string;
    close: string;
    offlineBanner: string;
  };
  dashboard: {
    hello: string;
    quickStart: string;
    weeklyCalendar: string;
    studied: string;
    noSessionsYet: string;
    overallProgress: string;
    topicsDone: string;
    focusedThisWeek: string;
    dailyStreak: string;
    days: string;
    activeSubjects: string;
    tapPlayHint: string;
    seeSyllabus: string;
    todayGoals: string;
    addGoalPlaceholder: string;
    upcomingTasks: string;
    manage: string;
    flashcardsTitle: string;
    progressTitle: string;
    progressSub: string;
    due: string;
    revisedToday: string;
  };
  syllabus: {
    title: string;
    newSubject: string;
    addChapter: string;
    aiQuizExplain: string;
    searchPlaceholder: string;
    all: string;
    high: string;
    medium: string;
    low: string;
    quiz: string;
    explain: string;
    addTopic: string;
    allSubjectsOverview: string;
    proTipTitle: string;
    proTipBody: string;
  };
  focus: {
    title: string;
    subtitle: string;
    pomodoro: string;
    custom: string;
    stopwatch: string;
    focusPhase: string;
    shortBreak: string;
    longBreak: string;
    startSession: string;
    pauseSession: string;
    resumeSession: string;
    logSession: string;
    spentToday: string;
    sessions: string;
    totalFocus: string;
    focusSounds: string;
    focusSoundsSub: string;
    volume: string;
    sessionHistory: string;
  };
  flashcards: {
    title: string;
    subtitle: string;
    newDeck: string;
    addCard: string;
    allDecks: string;
    dueToday: string;
    revised: string;
    memorized: string;
    flipCard: string;
    again: string;
    hard: string;
    good: string;
    easy: string;
    allCaughtUp: string;
    cardsInView: string;
  };
  notes: {
    title: string;
    aiAssistant: string;
    newNote: string;
    searchPlaceholder: string;
    all: string;
    summarize: string;
    summarizeNote: string;
    practiceQuiz: string;
    explainConcept: string;
    autoSaved: string;
    pin: string;
    pinned: string;
    checklist: string;
  };
  circle: {
    title: string;
    subtitle: string;
    createRoom: string;
    joinRoom: string;
    joinPlaceholder: string;
    roomCode: string;
    copy: string;
    copied: string;
    sharedGoal: string;
    members: string;
    groupChat: string;
    typeMessage: string;
    studying: string;
    revising: string;
    onBreak: string;
    offline: string;
  };
  progress: {
    title: string;
    subtitle: string;
    copySummary: string;
    copiedSummary: string;
    exportPng: string;
    totalHours: string;
    topicsMastered: string;
    dailyStreak: string;
    topSubject: string;
    weeklyActivity: string;
    downloadCard: string;
    subjectPerformance: string;
  };
  settings: {
    title: string;
    subtitle: string;
    themeTitle: string;
    themeSub: string;
    languageTitle: string;
    languageSub: string;
    installSectionTitle: string;
    installSectionSub: string;
    profileTitle: string;
    displayName: string;
    academicTrack: string;
    dailyGoalMin: string;
    weeklyGoalHrs: string;
    pomoFocusMin: string;
    pomoBreakMin: string;
    savePrefs: string;
    notificationsTitle: string;
    backupTitle: string;
    exportJson: string;
    restoreBackup: string;
    resetData: string;
    aboutTitle: string;
  };
  assistant: {
    title: string;
    summarize: string;
    quiz: string;
    explain: string;
    summarizeBtn: string;
    generateQuizBtn: string;
    appendToNote: string;
    saveFlashcard: string;
    savedFlashcard: string;
    saveAsNote: string;
    explainPlaceholder: string;
  };
  weekdays: string[];
}

const EN: Translations = {
  tagline: 'Plan · Focus · Learn · Grow',
  nav: {
    home: 'Home',
    library: 'Library',
    syllabus: 'Library',
    planner: 'Planner',
    focus: 'Focus',
    notes: 'Notes',
    circle: 'Study Circle',
    flashcards: 'Quiz & Cards',
    progress: 'Progress',
    achievements: 'Achievements',
    settings: 'Settings',
  },
  themes: {
    dark: { label: 'Dark OLED', desc: 'True deep black for night focus' },
    light: { label: 'Light', desc: 'Clean bright daylight clarity' },
    system: { label: 'System', desc: 'Follows your device theme automatically' },
    midnight: { label: 'Midnight', desc: 'Soft indigo dusk for long reading' },
  },
  languages: {
    en: 'English',
    bn: 'বাংলা',
  },
  pwa: {
    installApp: 'Install STUDYFLO App',
    installShort: 'Install App',
    installed: 'App Installed',
    iosTitle: 'Install STUDYFLO on iPhone / iPad',
    iosStep1: 'Tap the Share button in Safari’s bottom toolbar.',
    iosStep2: 'Scroll down and tap “Add to Home Screen”, then tap Add.',
    androidHint: 'In Chrome / Edge, open browser menu (⋮) and tap “Install app” or “Add to Home screen”.',
    close: 'Close',
    offlineBanner: 'Offline Mode — Your local notes, syllabus & timer keep working.',
  },
  dashboard: {
    hello: 'Hello',
    quickStart: 'Quick Start Timer',
    weeklyCalendar: 'Weekly Study Calendar',
    studied: 'studied',
    noSessionsYet: 'No sessions logged yet',
    overallProgress: 'Overall Progress',
    topicsDone: 'topics done',
    focusedThisWeek: 'Focused This Week',
    dailyStreak: 'Daily Study Streak',
    days: 'Days',
    activeSubjects: 'Active Subjects',
    tapPlayHint: 'Tap play to launch a focused session for any subject',
    seeSyllabus: 'See syllabus',
    todayGoals: 'Today’s Study Goals',
    addGoalPlaceholder: 'Add a study goal for today...',
    upcomingTasks: 'Upcoming Tasks',
    manage: 'Manage',
    flashcardsTitle: 'Flashcards & Spaced Repetition',
    progressTitle: 'Weekly Progress Report',
    progressSub: 'Export your STUDYFLO progress snapshot as PNG',
    due: 'due',
    revisedToday: 'revised today · SM-2 adaptive scheduling',
  },
  syllabus: {
    title: 'Syllabus Tracker',
    newSubject: 'New Subject',
    addChapter: 'Add Chapter',
    aiQuizExplain: 'AI Quiz & Explain',
    searchPlaceholder: 'Search chapters or topics...',
    all: 'All',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    quiz: 'Quiz',
    explain: 'Explain',
    addTopic: '+ Add Topic',
    allSubjectsOverview: 'All Subjects Overview',
    proTipTitle: 'Pro Tip',
    proTipBody:
      'Break big chapters into 25-minute topics with clear priorities. Checking off smaller milestones keeps momentum high during exam weeks.',
  },
  focus: {
    title: 'Focus Timer',
    subtitle: 'Deep focus blocks saved locally to your study log and weekly goals',
    pomodoro: 'Pomodoro',
    custom: 'Custom',
    stopwatch: 'Stopwatch',
    focusPhase: 'Focus',
    shortBreak: 'Short Break',
    longBreak: 'Long Break',
    startSession: 'Start Focus Session',
    pauseSession: 'Pause Session',
    resumeSession: 'Resume Session',
    logSession: 'Log Session',
    spentToday: 'Spent Today',
    sessions: 'Sessions',
    totalFocus: 'Total Focus',
    focusSounds: 'Focus Sounds',
    focusSoundsSub: 'Offline procedural ambient audio for deep concentration',
    volume: 'Volume',
    sessionHistory: 'Session History',
  },
  flashcards: {
    title: 'Flashcards & Spaced Repetition',
    subtitle: 'Active recall powered by SM-2 revision scheduling · Press Space to flip',
    newDeck: '+ New Deck',
    addCard: 'Add Card',
    allDecks: 'All Decks',
    dueToday: 'Due Today',
    revised: 'Revised',
    memorized: 'Memorized',
    flipCard: 'Flip Card',
    again: 'Again',
    hard: 'Hard',
    good: 'Good',
    easy: 'Easy',
    allCaughtUp: 'All caught up for today!',
    cardsInView: 'Cards in View',
  },
  notes: {
    title: 'My Notes',
    aiAssistant: 'AI Assistant',
    newNote: 'New Note',
    searchPlaceholder: 'Search titles, formulas, or ideas...',
    all: 'All',
    summarize: 'Summarize',
    summarizeNote: 'Summarize Note',
    practiceQuiz: 'Practice Quiz',
    explainConcept: 'Explain Concept',
    autoSaved: 'Auto-saved',
    pin: 'Pin',
    pinned: 'Pinned',
    checklist: '+ Checklist',
  },
  circle: {
    title: 'Study Circle',
    subtitle: 'Collaborate in study rooms, share monthly hour goals, and stay accountable',
    createRoom: 'Create Study Room',
    joinRoom: 'Join Room',
    joinPlaceholder: 'Join with code (e.g. STUDY24)',
    roomCode: 'Room Code',
    copy: 'Copy',
    copied: 'Copied',
    sharedGoal: 'Shared Monthly Goal',
    members: 'Circle Members',
    groupChat: 'Group Chat',
    typeMessage: 'Type a message to your study circle...',
    studying: 'Studying',
    revising: 'Revising',
    onBreak: 'On Break',
    offline: 'Offline',
  },
  progress: {
    title: 'Your Progress Report',
    subtitle: 'Weekly academic rhythm, subject mastery, and shareable snapshot card',
    copySummary: 'Copy Summary',
    copiedSummary: 'Copied Summary',
    exportPng: 'Export Card PNG',
    totalHours: 'Total Study Hours',
    topicsMastered: 'Topics Mastered',
    dailyStreak: 'Daily Streak',
    topSubject: 'Top Subject',
    weeklyActivity: 'Weekly Activity (Hours)',
    downloadCard: 'Download Shareable Progress Card',
    subjectPerformance: 'Subject-Wise Performance',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Customize themes, language, study targets, app installation, and offline backups',
    themeTitle: 'Appearance Theme (4 Modes)',
    themeSub: 'Switch smoothly between Dark OLED, Light, System, and Midnight Dusk',
    languageTitle: 'App Language',
    languageSub: 'Choose English or Bangla (বাংলা) for the interface and AI Study Assistant',
    installSectionTitle: 'Install STUDYFLO as an App',
    installSectionSub: 'Install on Android, iPhone, or Desktop for full-screen offline access',
    profileTitle: 'Profile & Study Goals',
    displayName: 'Display Name',
    academicTrack: 'Academic Track',
    dailyGoalMin: 'Daily Focus Goal (minutes)',
    weeklyGoalHrs: 'Weekly Focus Goal (hours)',
    pomoFocusMin: 'Pomodoro Focus Length (min)',
    pomoBreakMin: 'Short Break Length (min)',
    savePrefs: 'Save Preferences',
    notificationsTitle: 'Notifications & Chimes',
    backupTitle: 'Offline Data Backup & Storage',
    exportJson: 'Export JSON Backup',
    restoreBackup: 'Restore Backup',
    resetData: 'Reset Starter Data',
    aboutTitle: 'About STUDYFLO',
  },
  assistant: {
    title: 'AI Study Assistant',
    summarize: 'Summarize',
    quiz: 'Practice Quiz',
    explain: 'Explain Concept',
    summarizeBtn: 'Summarize Note',
    generateQuizBtn: 'Generate Practice Questions',
    appendToNote: 'Append Summary to Note',
    saveFlashcard: 'Save as Flashcard',
    savedFlashcard: 'Saved to Flashcards deck',
    saveAsNote: 'Save Explanation to My Notes',
    explainPlaceholder: 'Ask about any concept (e.g. Eigenvalues, Lenz’s Law)...',
  },
  weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};

const BN: Translations = {
  tagline: 'পরিকল্পনা · মনোযোগ · শেখা · অগ্রগতি',
  nav: {
    home: 'হোম',
    library: 'লাইব্রেরি',
    syllabus: 'লাইব্রেরি',
    planner: 'প্ল্যানার',
    focus: 'ফোকাস',
    notes: 'নোটস',
    circle: 'স্টাডি সার্কেল',
    flashcards: 'কুইজ ও কার্ড',
    progress: 'অগ্রগতি',
    achievements: 'অর্জনসমূহ',
    settings: 'সেটিংস',
  },
  themes: {
    dark: { label: 'ডার্ক OLED', desc: 'রাতের পড়ার জন্য গাঢ় কালো থিম' },
    light: { label: 'লাইট', desc: 'দিনের আলোর জন্য পরিষ্কার সাদা থিম' },
    system: { label: 'সিস্টেম', desc: 'ডিভাইসের থিম অনুযায়ী স্বয়ংক্রিয়' },
    midnight: { label: 'মিডনাইট', desc: 'দীর্ঘ পড়ার জন্য আরামদায়ক নীলচে থিম' },
  },
  languages: {
    en: 'English',
    bn: 'বাংলা',
  },
  pwa: {
    installApp: 'STUDYFLO অ্যাপ ইনস্টল করুন',
    installShort: 'ইনস্টল অ্যাপ',
    installed: 'অ্যাপ ইনস্টলড',
    iosTitle: 'iPhone / iPad-এ STUDYFLO ইনস্টল করুন',
    iosStep1: 'Safari-এর নিচের Share বাটনে ট্যাপ করুন।',
    iosStep2: 'নিচে স্ক্রল করে “Add to Home Screen” চাপুন, তারপর Add দিন।',
    androidHint: 'Chrome বা Edge ব্রাউজারের মেনু (⋮) থেকে “Install app” বা “Add to Home screen” চাপুন।',
    close: 'বন্ধ করুন',
    offlineBanner: 'অফলাইন মোড — আপনার নোটস, সিলেবাস ও টাইমার অফলাইনেও চলবে।',
  },
  dashboard: {
    hello: 'হ্যালো',
    quickStart: 'দ্রুত টাইমার শুরু',
    weeklyCalendar: 'সাপ্তাহিক পড়াশোনার ক্যালেন্ডার',
    studied: 'পড়া হয়েছে',
    noSessionsYet: 'এখনো কোনো সেশন নেই',
    overallProgress: 'মোট অগ্রগতি',
    topicsDone: 'টপিক সম্পন্ন',
    focusedThisWeek: 'এই সপ্তাহের পড়াশোনা',
    dailyStreak: 'দৈনিক স্ট্রিক',
    days: 'দিন',
    activeSubjects: 'চলমান বিষয়সমূহ',
    tapPlayHint: 'যেকোনো বিষয়ের প্লে বাটনে চাপ দিয়ে ফোকাস টাইমার শুরু করুন',
    seeSyllabus: 'সিলেবাস দেখুন',
    todayGoals: 'আজকের লক্ষ্যসমূহ',
    addGoalPlaceholder: 'আজকের নতুন লক্ষ্য লিখুন...',
    upcomingTasks: 'আসন্ন কাজ ও ডেডলাইন',
    manage: 'পরিচালনা',
    flashcardsTitle: 'ফ্ল্যাশকার্ড ও রিভিশন',
    progressTitle: 'সাপ্তাহিক অগ্রগতি রিপোর্ট',
    progressSub: 'আপনার প্রগ্রেস কার্ড PNG হিসেবে ডাউনলোড করুন',
    due: 'বাকি',
    revisedToday: 'আজ রিভিশন হয়েছে · SM-2 স্মার্ট শিডিউল',
  },
  syllabus: {
    title: 'সিলেবাস ট্র্যাকার',
    newSubject: 'নতুন বিষয়',
    addChapter: 'অধ্যায় যোগ করুন',
    aiQuizExplain: 'AI কুইজ ও ব্যাখ্যা',
    searchPlaceholder: 'অধ্যায় বা টপিক খুঁজুন...',
    all: 'সব',
    high: 'উচ্চ',
    medium: 'মাঝারি',
    low: 'নিম্ন',
    quiz: 'কুইজ',
    explain: 'ব্যাখ্যা',
    addTopic: '+ টপিক যোগ',
    allSubjectsOverview: 'সকল বিষয়ের সারসংক্ষেপ',
    proTipTitle: 'পড়াশোনার টিপস',
    proTipBody:
      'বড় অধ্যায়গুলোকে ২৫ মিনিটের ছোট টপিকে ভাগ করে নিন। ছোট লক্ষ্য পূরণ করলে পরীক্ষার আগে আত্মবিশ্বাস ও গতি দুটোই বাড়ে।',
  },
  focus: {
    title: 'ফোকাস টাইমার',
    subtitle: 'আপনার প্রতিটি মনোযোগী সেশন অফলাইনে সেভ হয়ে সাপ্তাহিক লক্ষ্যে যুক্ত হয়',
    pomodoro: 'পমোডোরো',
    custom: 'কাস্টম',
    stopwatch: 'স্টপওয়াচ',
    focusPhase: 'ফোকাস',
    shortBreak: 'ছোট বিরতি',
    longBreak: 'দীর্ঘ বিরতি',
    startSession: 'ফোকাস শুরু করুন',
    pauseSession: 'বিরতি দিন',
    resumeSession: 'আবার চালু করুন',
    logSession: 'সেশন সেভ',
    spentToday: 'আজকের সময়',
    sessions: 'মোট সেশন',
    totalFocus: 'সর্বমোট ফোকাস',
    focusSounds: 'ফোকাস সাউন্ডস',
    focusSoundsSub: 'গভীর মনোযোগের জন্য অফলাইন প্রাকৃতিক শব্দ',
    volume: 'ভলিউম',
    sessionHistory: 'সেশন ইতিহাস',
  },
  flashcards: {
    title: 'ফ্ল্যাশকার্ড ও স্পেসড রিপিটিশন',
    subtitle: 'SM-2 পদ্ধতিতে স্মার্ট রিভিশন · কার্ড উল্টাতে Space চাপুন',
    newDeck: '+ নতুন ডেক',
    addCard: 'কার্ড যোগ',
    allDecks: 'সব ডেক',
    dueToday: 'আজ বাকি',
    revised: 'রিভিশন হয়েছে',
    memorized: 'মুখস্থ হয়েছে',
    flipCard: 'কার্ড উল্টান',
    again: 'আবার',
    hard: 'কঠিন',
    good: 'ভালো',
    easy: 'সহজ',
    allCaughtUp: 'আজকের সব রিভিশন সম্পন্ন!',
    cardsInView: 'এই ডেকের কার্ডসমূহ',
  },
  notes: {
    title: 'আমার নোটস',
    aiAssistant: 'AI অ্যাসিস্ট্যান্ট',
    newNote: 'নতুন নোট',
    searchPlaceholder: 'নোট, সূত্র বা আইডিয়া খুঁজুন...',
    all: 'সব',
    summarize: 'সারাংশ',
    summarizeNote: 'নোটের সারাংশ',
    practiceQuiz: 'প্র্যাকটিস কুইজ',
    explainConcept: 'ধারণার ব্যাখ্যা',
    autoSaved: 'অটো-সেভ হয়েছে',
    pin: 'পিন',
    pinned: 'পিন করা',
    checklist: '+ চেকলিস্ট',
  },
  circle: {
    title: 'স্টাডি সার্কেল',
    subtitle: 'বন্ধুদের সাথে স্টাডি রুমে যোগ দিন, লক্ষ্য শেয়ার করুন এবং একসাথে পড়ুন',
    createRoom: 'নতুন রুম তৈরি',
    joinRoom: 'রুমে যোগ দিন',
    joinPlaceholder: 'রুম কোড দিন (যেমন STUDY24)',
    roomCode: 'রুম কোড',
    copy: 'কপি',
    copied: 'কপি হয়েছে',
    sharedGoal: 'দলীয় মাসিক লক্ষ্য',
    members: 'সদস্যবৃন্দ',
    groupChat: 'গ্রুপ চ্যাট',
    typeMessage: 'আপনার স্টাডি সার্কেলে মেসেজ লিখুন...',
    studying: 'পড়ছে',
    revising: 'রিভিশন দিচ্ছে',
    onBreak: 'বিরতিতে',
    offline: 'অফলাইন',
  },
  progress: {
    title: 'আপনার অগ্রগতি রিপোর্ট',
    subtitle: 'সাপ্তাহিক পড়ার হিসাব, বিষয়ভিত্তিক দক্ষতা ও শেয়ারযোগ্য কার্ড',
    copySummary: 'সারসংক্ষেপ কপি',
    copiedSummary: 'কপি হয়েছে',
    exportPng: 'PNG কার্ড সেভ',
    totalHours: 'মোট পড়ার ঘণ্টা',
    topicsMastered: 'সম্পন্ন টপিক',
    dailyStreak: 'দৈনিক স্ট্রিক',
    topSubject: 'সেরা বিষয়',
    weeklyActivity: 'সাপ্তাহিক পড়াশোনা (ঘণ্টা)',
    downloadCard: 'শেয়ারযোগ্য প্রগ্রেস কার্ড ডাউনলোড করুন',
    subjectPerformance: 'বিষয়ভিত্তিক অগ্রগতি',
  },
  settings: {
    title: 'সেটিংস',
    subtitle: 'থিম, ভাষা, পড়ার লক্ষ্য, অ্যাপ ইনস্টলেশন ও অফলাইন ব্যাকআপ নিয়ন্ত্রণ করুন',
    themeTitle: 'থিম মোড (৪টি থিম)',
    themeSub: 'ডার্ক OLED, লাইট, সিস্টেম এবং মিডনাইট থিমের মধ্যে বেছে নিন',
    languageTitle: 'অ্যাপের ভাষা',
    languageSub: 'সম্পূর্ণ অ্যাপ ও AI স্টাডি অ্যাসিস্ট্যান্টের জন্য বাংলা বা ইংরেজি বেছে নিন',
    installSectionTitle: 'মোবাইল অ্যাপ হিসেবে ইনস্টল করুন',
    installSectionSub: 'Android, iPhone বা কম্পিউটারে ফুল-স্ক্রিন অফলাইন অ্যাপ হিসেবে ব্যবহার করুন',
    profileTitle: 'প্রোফাইল ও পড়ার লক্ষ্য',
    displayName: 'আপনার নাম',
    academicTrack: 'পড়াশোনার বিভাগ',
    dailyGoalMin: 'দৈনিক লক্ষ্য (মিনিট)',
    weeklyGoalHrs: 'সাপ্তাহিক লক্ষ্য (ঘণ্টা)',
    pomoFocusMin: 'পমোডোরো ফোকাস সময় (মিনিট)',
    pomoBreakMin: 'ছোট বিরতির সময় (মিনিট)',
    savePrefs: 'সেটিংস সেভ করুন',
    notificationsTitle: 'নোটিফিকেশন ও সাউন্ড',
    backupTitle: 'অফলাইন ব্যাকআপ ও স্টোরেজ',
    exportJson: 'JSON ব্যাকআপ এক্সপোর্ট',
    restoreBackup: 'ব্যাকআপ রিস্টোর',
    resetData: 'ডিফল্ট ডেটা রিসেট',
    aboutTitle: 'STUDYFLO সম্পর্কে',
  },
  assistant: {
    title: 'AI স্টাডি অ্যাসিস্ট্যান্ট',
    summarize: 'সারাংশ',
    quiz: 'প্র্যাকটিস কুইজ',
    explain: 'ধারণার ব্যাখ্যা',
    summarizeBtn: 'নোটের সারাংশ তৈরি করুন',
    generateQuizBtn: 'প্র্যাকটিস প্রশ্ন তৈরি করুন',
    appendToNote: 'নোটে সারাংশ যুক্ত করুন',
    saveFlashcard: 'ফ্ল্যাশকার্ডে সেভ করুন',
    savedFlashcard: 'ফ্ল্যাশকার্ডে সেভ হয়েছে',
    saveAsNote: 'নোটস-এ সেভ করুন',
    explainPlaceholder: 'যেকোনো জটিল টপিক লিখুন (যেমন: আলোকসংশ্লেষণ, Eigenvalues)...',
  },
  weekdays: ['সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি', 'রবি'],
};

export function getTranslations(lang: AppLanguage): Translations {
  return lang === 'bn' ? BN : EN;
}
