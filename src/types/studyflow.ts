export type NavTab =
  | 'home'
  | 'syllabus'
  | 'planner'
  | 'focus'
  | 'progress'
  | 'achievements'
  | 'notes'
  | 'circle'
  | 'assistant'
  | 'flashcards'
  | 'profile'
  | 'settings';

export type PriorityLevel = 'high' | 'medium' | 'low';

export type SubjectAccent = 'purple' | 'cyan' | 'blue' | 'amber' | 'emerald' | 'rose';

export interface Topic {
  id: string;
  title: string;
  completed: boolean;
  priority: PriorityLevel;
  deadline?: string; // YYYY-MM-DD
}

export interface Chapter {
  id: string;
  title: string;
  deadline?: string; // YYYY-MM-DD
  priority: PriorityLevel;
  topics: Topic[];
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  accent: SubjectAccent;
  weeklyGoalHours: number;
  chapters: Chapter[];
}

export type TimerMode = 'pomodoro' | 'custom' | 'stopwatch';
export type AmbientSoundId =
  | 'none'
  | 'rain'
  | 'lofi'
  | 'cafe'
  | 'forest'
  | 'ocean'
  | 'fireplace'
  | 'piano'
  | 'night';

export interface FocusSession {
  id: string;
  subjectId: string;
  mode: TimerMode;
  durationMinutes: number;
  completedAt: string; // ISO string
  label: string;
}

export type FlashcardRating = 'again' | 'hard' | 'good' | 'easy';

export interface Flashcard {
  id: string;
  deckId: string;
  question: string;
  answer: string;
  hint?: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: string; // ISO date string
  lastReviewedAt?: string;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  subjectId: string;
  description: string;
  accent: SubjectAccent;
}

export type NoteTint = 'indigo' | 'amber' | 'cyan' | 'purple' | 'emerald';

export interface StudyNote {
  id: string;
  title: string;
  content: string;
  subjectId: string;
  pinned: boolean;
  tint: NoteTint;
  updatedAt: string; // ISO string
}

export interface DailyGoal {
  id: string;
  text: string;
  completed: boolean;
  subjectId?: string;
}

export type MemberStatus = 'studying' | 'break' | 'revising' | 'offline';

export interface CircleMember {
  id: string;
  name: string;
  initials: string;
  subject: string;
  status: MemberStatus;
  studiedMinutesToday: number;
  accent: SubjectAccent;
  isCurrentUser?: boolean;
}

export interface RoomMessage {
  id: string;
  senderName: string;
  senderInitials: string;
  text: string;
  timestamp: string; // ISO string
  isCurrentUser?: boolean;
}

export interface StudyRoom {
  id: string;
  code: string;
  name: string;
  subjectFocus: string;
  monthlyGoalHours: number;
  completedHours: number;
  members: CircleMember[];
  messages: RoomMessage[];
}

export type AppLanguage = 'en' | 'bn';
export type ThemeMode = 'dark' | 'light' | 'system' | 'midnight';
export type InstitutionType = 'school' | 'college' | 'university' | 'other';

export interface UserProfile {
  name: string;
  tagline: string;
  academicTrack: string;
  institution?: string;
  institutionType?: InstitutionType;
  classOrYear?: string;
  department?: string;
  studentId?: string;
  sectionOrBatch?: string;
  bio?: string;
  avatarColor?: SubjectAccent;
  avatarDataUrl?: string;
  dailyGoalMinutes: number;
  weeklyGoalHours: number;
  streakDays: number;
  pomodoroFocusMin: number;
  pomodoroShortBreakMin: number;
  pomodoroLongBreakMin: number;
  soundAlertsEnabled: boolean;
  notificationsEnabled: boolean;
  theme: ThemeMode;
  language?: AppLanguage;
  myStatus: MemberStatus;
  firebaseConfigJson?: string;
}

export interface StudyFlowState {
  profile: UserProfile;
  subjects: Subject[];
  sessions: FocusSession[];
  decks: FlashcardDeck[];
  flashcards: Flashcard[];
  notes: StudyNote[];
  dailyGoals: DailyGoal[];
  rooms: StudyRoom[];
  activeRoomId: string;
  revisedTodayCount: number;
  lastRevisionDate: string; // YYYY-MM-DD
}
