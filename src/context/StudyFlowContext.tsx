import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import {
  StudyFlowState,
  NavTab,
  Subject,
  SubjectAccent,
  PriorityLevel,
  TimerMode,
  FlashcardRating,
  NoteTint,
  MemberStatus,
  UserProfile,
} from '../types/studyflow';
import { createSeedState } from '../data/seedData';
import { calculateSM2, isCardDue } from '../utils/sm2';
import { Translations, getTranslations } from '../utils/i18n';
import { loadStateFromIndexedDb, saveStateToIndexedDb } from '../utils/offlineDb';

const STORAGE_KEY = 'studyflow_offline_db_v1';

interface ToastMessage {
  id: string;
  text: string;
}

interface ComputedMetrics {
  overallProgress: number;
  completedTopics: number;
  totalTopics: number;
  weeklyHours: number;
  todayMinutes: number;
  totalHoursAllTime: number;
  dueFlashcardsCount: number;
  dailyWeekBreakdown: { key: string; label: string; dayNum: number; isToday: boolean; hours: number; minutes: number }[];
  subjectProgressMap: Record<string, { percent: number; completed: number; total: number; weekHours: number }>;
  upcomingDeadlines: {
    id: string;
    title: string;
    subjectName: string;
    subjectId: string;
    chapterTitle: string;
    deadline: string;
    priority: PriorityLevel;
    accent: SubjectAccent;
  }[];
}

interface StudyFlowContextValue {
  state: StudyFlowState;
  metrics: ComputedMetrics;
  t: Translations;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  focusSubjectId: string;
  setFocusSubjectId: (subjectId: string) => void;
  launchFocusForSubject: (subjectId: string) => void;
  toast: ToastMessage | null;
  showToast: (text: string) => void;

  // Syllabus CRUD
  addSubject: (name: string, code: string, accent: SubjectAccent, weeklyGoalHours: number) => void;
  deleteSubject: (subjectId: string) => void;
  addChapter: (subjectId: string, title: string, priority: PriorityLevel, deadline?: string) => void;
  deleteChapter: (subjectId: string, chapterId: string) => void;
  addTopic: (subjectId: string, chapterId: string, title: string, priority: PriorityLevel, deadline?: string) => void;
  toggleTopic: (subjectId: string, chapterId: string, topicId: string) => void;
  deleteTopic: (subjectId: string, chapterId: string, topicId: string) => void;

  // Focus Sessions
  logFocusSession: (subjectId: string, mode: TimerMode, durationMinutes: number, label: string) => void;
  deleteFocusSession: (sessionId: string) => void;

  // Flashcards
  createDeck: (title: string, subjectId: string, description: string, accent: SubjectAccent) => void;
  deleteDeck: (deckId: string) => void;
  addFlashcard: (deckId: string, question: string, answer: string, hint?: string) => void;
  deleteFlashcard: (cardId: string) => void;
  reviewFlashcard: (cardId: string, rating: FlashcardRating) => void;

  // Notes
  createNote: (title: string, content: string, subjectId: string, tint: NoteTint, pinned?: boolean) => string;
  updateNote: (noteId: string, patch: { title?: string; content?: string; subjectId?: string; tint?: NoteTint; pinned?: boolean }) => void;
  deleteNote: (noteId: string) => void;

  // Daily Goals
  addDailyGoal: (text: string, subjectId?: string) => void;
  toggleDailyGoal: (goalId: string) => void;
  deleteDailyGoal: (goalId: string) => void;

  // Study Circle
  createStudyRoom: (name: string, subjectFocus: string, monthlyGoalHours: number) => string;
  joinStudyRoomByCode: (code: string) => { ok: boolean; message: string };
  setActiveRoomId: (roomId: string) => void;
  sendRoomMessage: (roomId: string, text: string) => void;
  setMyStatus: (status: MemberStatus) => void;

  // Profile & Data Backup
  updateProfile: (patch: Partial<UserProfile>) => void;
  exportBackupJson: () => string;
  importBackupJson: (raw: string) => { ok: boolean; message: string };
  resetDemoData: () => void;
}

const StudyFlowContext = createContext<StudyFlowContextValue | null>(null);

function loadInitialState(): StudyFlowState {
  if (typeof window === 'undefined') return createSeedState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedState();
    const parsed = JSON.parse(raw) as StudyFlowState;
    if (!parsed || !Array.isArray(parsed.subjects) || !parsed.profile) {
      return createSeedState();
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    if (parsed.lastRevisionDate !== todayStr) {
      parsed.revisedTodayCount = 0;
      parsed.lastRevisionDate = todayStr;
    }
    return parsed;
  } catch {
    return createSeedState();
  }
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SF';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function StudyFlowProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StudyFlowState>(loadInitialState);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [focusSubjectId, setFocusSubjectId] = useState<string>(() => state.subjects[0]?.id ?? 'sub-math');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((text: string) => {
    const id = makeId('toast');
    setToast({ id, text });
    window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3000);
  }, []);

  const t = useMemo(
    () => getTranslations(state.profile.language ?? 'en'),
    [state.profile.language]
  );

  // Sync theme to documentElement
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => {
      const mode = state.profile.theme;
      const isDark =
        mode === 'dark' ||
        mode === 'midnight' ||
        (mode === 'system' &&
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    if (state.profile.theme === 'system' && typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', applyTheme);
      return () => mq.removeEventListener('change', applyTheme);
    }
  }, [state.profile.theme]);

  // Sync document language for crisp Bangla / English typography
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = state.profile.language ?? 'en';
    }
  }, [state.profile.language]);

  // Recover from IndexedDB if localStorage was cleared by the browser
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasLocal = Boolean(window.localStorage.getItem(STORAGE_KEY));
    if (hasLocal) return;
    let cancelled = false;
    void loadStateFromIndexedDb().then((saved) => {
      if (!cancelled && saved && Array.isArray(saved.subjects) && saved.profile) {
        setState(saved);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist to localStorage & IndexedDB automatically for full offline reliability
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage quota fallback — IndexedDB mirror below still saves full state
    }
    void saveStateToIndexedDb(state);
  }, [state]);

  const metrics = useMemo<ComputedMetrics>(() => {
    let completedTopics = 0;
    let totalTopics = 0;
    const subjectProgressMap: ComputedMetrics['subjectProgressMap'] = {};
    const upcomingDeadlines: ComputedMetrics['upcomingDeadlines'] = [];

    const now = new Date();
    const weekStart = new Date(now);
    const dayOfWeek = weekStart.getDay(); // 0 Sun .. 6 Sat
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(weekStart.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);

    const todayKey = now.toISOString().slice(0, 10);

    // Build Mon..Sun breakdown
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dailyWeekBreakdown = dayNames.map((label, idx) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + idx);
      const key = d.toISOString().slice(0, 10);
      return {
        key,
        label,
        dayNum: d.getDate(),
        isToday: key === todayKey,
        hours: 0,
        minutes: 0,
      };
    });

    const subjectWeekMin: Record<string, number> = {};
    let weeklyMinutes = 0;
    let todayMinutes = 0;
    let totalMinutesAllTime = 0;

    for (const s of state.sessions) {
      totalMinutesAllTime += s.durationMinutes;
      const d = new Date(s.completedAt);
      const dKey = d.toISOString().slice(0, 10);
      if (dKey === todayKey) {
        todayMinutes += s.durationMinutes;
      }
      if (d.getTime() >= weekStart.getTime()) {
        weeklyMinutes += s.durationMinutes;
        subjectWeekMin[s.subjectId] = (subjectWeekMin[s.subjectId] || 0) + s.durationMinutes;
      }
      const bucket = dailyWeekBreakdown.find((b) => b.key === dKey);
      if (bucket) {
        bucket.minutes += s.durationMinutes;
        bucket.hours = Number((bucket.minutes / 60).toFixed(2));
      }
    }

    for (const subject of state.subjects) {
      let sDone = 0;
      let sTotal = 0;
      for (const ch of subject.chapters) {
        for (const tp of ch.topics) {
          sTotal += 1;
          totalTopics += 1;
          if (tp.completed) {
            sDone += 1;
            completedTopics += 1;
          } else {
            const dl = tp.deadline || ch.deadline;
            if (dl) {
              upcomingDeadlines.push({
                id: tp.id,
                title: tp.title,
                subjectName: subject.name,
                subjectId: subject.id,
                chapterTitle: ch.title,
                deadline: dl,
                priority: tp.priority,
                accent: subject.accent,
              });
            }
          }
        }
      }
      subjectProgressMap[subject.id] = {
        percent: sTotal === 0 ? 0 : Math.round((sDone / sTotal) * 100),
        completed: sDone,
        total: sTotal,
        weekHours: Number(((subjectWeekMin[subject.id] || 0) / 60).toFixed(1)),
      };
    }

    upcomingDeadlines.sort((a, b) => a.deadline.localeCompare(b.deadline));

    const overallProgress = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);
    const dueFlashcardsCount = state.flashcards.filter((c) => isCardDue(c, now)).length;

    return {
      overallProgress,
      completedTopics,
      totalTopics,
      weeklyHours: Number((weeklyMinutes / 60).toFixed(1)),
      todayMinutes,
      totalHoursAllTime: Number((totalMinutesAllTime / 60).toFixed(1)),
      dueFlashcardsCount,
      dailyWeekBreakdown,
      subjectProgressMap,
      upcomingDeadlines,
    };
  }, [state.subjects, state.sessions, state.flashcards]);

  const launchFocusForSubject = useCallback((subjectId: string) => {
    setFocusSubjectId(subjectId);
    setActiveTab('focus');
  }, []);

  // Syllabus CRUD
  const addSubject = useCallback(
    (name: string, code: string, accent: SubjectAccent, weeklyGoalHours: number) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const newSubject: Subject = {
        id: makeId('sub'),
        name: trimmed,
        code: code.trim().toUpperCase() || trimmed.slice(0, 4).toUpperCase() + ' 101',
        accent,
        weeklyGoalHours: Math.max(1, weeklyGoalHours || 4),
        chapters: [],
      };
      setState((prev) => ({ ...prev, subjects: [...prev.subjects, newSubject] }));
      showToast(`Added subject "${trimmed}"`);
    },
    [showToast]
  );

  const deleteSubject = useCallback(
    (subjectId: string) => {
      setState((prev) => ({
        ...prev,
        subjects: prev.subjects.filter((s) => s.id !== subjectId),
      }));
      showToast('Subject removed');
    },
    [showToast]
  );

  const addChapter = useCallback(
    (subjectId: string, title: string, priority: PriorityLevel, deadline?: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      setState((prev) => ({
        ...prev,
        subjects: prev.subjects.map((sub) =>
          sub.id === subjectId
            ? {
                ...sub,
                chapters: [
                  ...sub.chapters,
                  {
                    id: makeId('ch'),
                    title: trimmed,
                    priority,
                    deadline: deadline || undefined,
                    topics: [],
                  },
                ],
              }
            : sub
        ),
      }));
      showToast(`Chapter "${trimmed}" added`);
    },
    [showToast]
  );

  const deleteChapter = useCallback((subjectId: string, chapterId: string) => {
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.map((sub) =>
        sub.id === subjectId
          ? { ...sub, chapters: sub.chapters.filter((ch) => ch.id !== chapterId) }
          : sub
      ),
    }));
  }, []);

  const addTopic = useCallback(
    (subjectId: string, chapterId: string, title: string, priority: PriorityLevel, deadline?: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      setState((prev) => ({
        ...prev,
        subjects: prev.subjects.map((sub) =>
          sub.id === subjectId
            ? {
                ...sub,
                chapters: sub.chapters.map((ch) =>
                  ch.id === chapterId
                    ? {
                        ...ch,
                        topics: [
                          ...ch.topics,
                          {
                            id: makeId('top'),
                            title: trimmed,
                            completed: false,
                            priority,
                            deadline: deadline || ch.deadline,
                          },
                        ],
                      }
                    : ch
                ),
              }
            : sub
        ),
      }));
    },
    []
  );

  const toggleTopic = useCallback((subjectId: string, chapterId: string, topicId: string) => {
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.map((sub) =>
        sub.id === subjectId
          ? {
              ...sub,
              chapters: sub.chapters.map((ch) =>
                ch.id === chapterId
                  ? {
                      ...ch,
                      topics: ch.topics.map((t) =>
                        t.id === topicId ? { ...t, completed: !t.completed } : t
                      ),
                    }
                  : ch
              ),
            }
          : sub
      ),
    }));
  }, []);

  const deleteTopic = useCallback((subjectId: string, chapterId: string, topicId: string) => {
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.map((sub) =>
        sub.id === subjectId
          ? {
              ...sub,
              chapters: sub.chapters.map((ch) =>
                ch.id === chapterId
                  ? { ...ch, topics: ch.topics.filter((t) => t.id !== topicId) }
                  : ch
              ),
            }
          : sub
      ),
    }));
  }, []);

  // Focus Sessions
  const logFocusSession = useCallback(
    (subjectId: string, mode: TimerMode, durationMinutes: number, label: string) => {
      const mins = Math.max(1, Math.round(durationMinutes));
      const newSession = {
        id: makeId('ses'),
        subjectId,
        mode,
        durationMinutes: mins,
        completedAt: new Date().toISOString(),
        label: label.trim() || 'Focused Study Block',
      };
      setState((prev) => ({
        ...prev,
        sessions: [newSession, ...prev.sessions],
        rooms: prev.rooms.map((room) =>
          room.id === prev.activeRoomId
            ? {
                ...room,
                completedHours: Number((room.completedHours + mins / 60).toFixed(1)),
                members: room.members.map((m) =>
                  m.isCurrentUser ? { ...m, studiedMinutesToday: m.studiedMinutesToday + mins } : m
                ),
              }
            : room
        ),
      }));
      showToast(`Saved ${mins}m focus session`);
    },
    [showToast]
  );

  const deleteFocusSession = useCallback((sessionId: string) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((s) => s.id !== sessionId),
    }));
  }, []);

  // Flashcards
  const createDeck = useCallback(
    (title: string, subjectId: string, description: string, accent: SubjectAccent) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      setState((prev) => ({
        ...prev,
        decks: [
          ...prev.decks,
          { id: makeId('deck'), title: trimmed, subjectId, description: description.trim(), accent },
        ],
      }));
      showToast(`Created deck "${trimmed}"`);
    },
    [showToast]
  );

  const deleteDeck = useCallback(
    (deckId: string) => {
      setState((prev) => ({
        ...prev,
        decks: prev.decks.filter((d) => d.id !== deckId),
        flashcards: prev.flashcards.filter((c) => c.deckId !== deckId),
      }));
      showToast('Deck deleted');
    },
    [showToast]
  );

  const addFlashcard = useCallback(
    (deckId: string, question: string, answer: string, hint?: string) => {
      if (!question.trim() || !answer.trim()) return;
      setState((prev) => ({
        ...prev,
        flashcards: [
          ...prev.flashcards,
          {
            id: makeId('fc'),
            deckId,
            question: question.trim(),
            answer: answer.trim(),
            hint: hint?.trim() || undefined,
            easeFactor: 2.5,
            intervalDays: 1,
            repetitions: 0,
            nextReviewAt: new Date(Date.now() - 60000).toISOString(),
          },
        ],
      }));
      showToast('Flashcard added to deck');
    },
    [showToast]
  );

  const deleteFlashcard = useCallback((cardId: string) => {
    setState((prev) => ({
      ...prev,
      flashcards: prev.flashcards.filter((c) => c.id !== cardId),
    }));
  }, []);

  const reviewFlashcard = useCallback((cardId: string, rating: FlashcardRating) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setState((prev) => ({
      ...prev,
      revisedTodayCount: prev.lastRevisionDate === todayStr ? prev.revisedTodayCount + 1 : 1,
      lastRevisionDate: todayStr,
      flashcards: prev.flashcards.map((card) => {
        if (card.id !== cardId) return card;
        const next = calculateSM2(card, rating);
        return {
          ...card,
          ...next,
          lastReviewedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  // Notes
  const createNote = useCallback(
    (title: string, content: string, subjectId: string, tint: NoteTint, pinned = false): string => {
      const id = makeId('note');
      setState((prev) => ({
        ...prev,
        notes: [
          {
            id,
            title: title.trim() || 'Untitled Note',
            content,
            subjectId,
            pinned,
            tint,
            updatedAt: new Date().toISOString(),
          },
          ...prev.notes,
        ],
      }));
      return id;
    },
    []
  );

  const updateNote = useCallback(
    (
      noteId: string,
      patch: { title?: string; content?: string; subjectId?: string; tint?: NoteTint; pinned?: boolean }
    ) => {
      setState((prev) => ({
        ...prev,
        notes: prev.notes.map((n) =>
          n.id === noteId
            ? {
                ...n,
                ...patch,
                updatedAt: new Date().toISOString(),
              }
            : n
        ),
      }));
    },
    []
  );

  const deleteNote = useCallback(
    (noteId: string) => {
      setState((prev) => ({
        ...prev,
        notes: prev.notes.filter((n) => n.id !== noteId),
      }));
      showToast('Note deleted');
    },
    [showToast]
  );

  // Daily Goals
  const addDailyGoal = useCallback((text: string, subjectId?: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setState((prev) => ({
      ...prev,
      dailyGoals: [...prev.dailyGoals, { id: makeId('dg'), text: trimmed, completed: false, subjectId }],
    }));
  }, []);

  const toggleDailyGoal = useCallback((goalId: string) => {
    setState((prev) => ({
      ...prev,
      dailyGoals: prev.dailyGoals.map((g) =>
        g.id === goalId ? { ...g, completed: !g.completed } : g
      ),
    }));
  }, []);

  const deleteDailyGoal = useCallback((goalId: string) => {
    setState((prev) => ({
      ...prev,
      dailyGoals: prev.dailyGoals.filter((g) => g.id !== goalId),
    }));
  }, []);

  // Study Circle
  const createStudyRoom = useCallback(
    (name: string, subjectFocus: string, monthlyGoalHours: number): string => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      const roomId = makeId('room');
      const userName = state.profile.name || 'Learner';
      const newRoom = {
        id: roomId,
        code,
        name: name.trim() || 'Study Sprint Room',
        subjectFocus: subjectFocus.trim() || 'General Revision',
        monthlyGoalHours: Math.max(5, monthlyGoalHours || 30),
        completedHours: 0,
        members: [
          {
            id: makeId('m'),
            name: `${userName} (You)`,
            initials: getInitials(userName),
            subject: subjectFocus.trim() || 'Deep Work',
            status: state.profile.myStatus,
            studiedMinutesToday: metrics.todayMinutes,
            accent: 'purple' as SubjectAccent,
            isCurrentUser: true,
          },
        ],
        messages: [
          {
            id: makeId('msg'),
            senderName: 'STUDYFLO Room',
            senderInitials: 'SF',
            text: `Room ${code} created! Share this code with study partners to track goals together.`,
            timestamp: new Date().toISOString(),
          },
        ],
      };
      setState((prev) => ({
        ...prev,
        rooms: [newRoom, ...prev.rooms],
        activeRoomId: roomId,
      }));
      showToast(`Created room ${code}`);
      return code;
    },
    [state.profile.name, state.profile.myStatus, metrics.todayMinutes, showToast]
  );

  const joinStudyRoomByCode = useCallback(
    (rawCode: string): { ok: boolean; message: string } => {
      const normalized = rawCode.trim().toUpperCase();
      if (normalized.length < 4) {
        return { ok: false, message: 'Enter a valid 4–8 character room code.' };
      }
      const existing = state.rooms.find((r) => r.code.toUpperCase() === normalized);
      if (existing) {
        setState((prev) => ({ ...prev, activeRoomId: existing.id }));
        showToast(`Switched to ${existing.name}`);
        return { ok: true, message: `Joined ${existing.name}` };
      }
      // Create a local collaborative room matching the entered code so users can immediately test joining any code
      const roomId = makeId('room');
      const userName = state.profile.name || 'Learner';
      const joinedRoom = {
        id: roomId,
        code: normalized,
        name: `Study Room ${normalized}`,
        subjectFocus: 'Collaborative Session',
        monthlyGoalHours: 40,
        completedHours: 14.5,
        members: [
          {
            id: makeId('m'),
            name: `${userName} (You)`,
            initials: getInitials(userName),
            subject: 'Active Focus',
            status: state.profile.myStatus,
            studiedMinutesToday: metrics.todayMinutes,
            accent: 'purple' as SubjectAccent,
            isCurrentUser: true,
          },
          {
            id: makeId('m'),
            name: 'Samira Rahman',
            initials: 'SR',
            subject: 'Physics & Math',
            status: 'studying' as MemberStatus,
            studiedMinutesToday: 85,
            accent: 'cyan' as SubjectAccent,
          },
        ],
        messages: [
          {
            id: makeId('msg'),
            senderName: 'Samira Rahman',
            senderInitials: 'SR',
            text: `Welcome to room ${normalized}! Let's stay consistent today.`,
            timestamp: new Date().toISOString(),
          },
        ],
      };
      setState((prev) => ({
        ...prev,
        rooms: [joinedRoom, ...prev.rooms],
        activeRoomId: roomId,
      }));
      showToast(`Joined room ${normalized}`);
      return { ok: true, message: `Joined room ${normalized}` };
    },
    [state.rooms, state.profile.name, state.profile.myStatus, metrics.todayMinutes, showToast]
  );

  const setActiveRoomId = useCallback((roomId: string) => {
    setState((prev) => ({ ...prev, activeRoomId: roomId }));
  }, []);

  const sendRoomMessage = useCallback((roomId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setState((prev) => {
      const userName = prev.profile.name || 'Learner';
      return {
        ...prev,
        rooms: prev.rooms.map((r) =>
          r.id === roomId
            ? {
                ...r,
                messages: [
                  ...r.messages,
                  {
                    id: makeId('msg'),
                    senderName: userName,
                    senderInitials: getInitials(userName),
                    text: trimmed,
                    timestamp: new Date().toISOString(),
                    isCurrentUser: true,
                  },
                ],
              }
            : r
        ),
      };
    });
  }, []);

  const setMyStatus = useCallback(
    (status: MemberStatus) => {
      setState((prev) => ({
        ...prev,
        profile: { ...prev.profile, myStatus: status },
        rooms: prev.rooms.map((r) => ({
          ...r,
          members: r.members.map((m) => (m.isCurrentUser ? { ...m, status } : m)),
        })),
      }));
      const labels: Record<MemberStatus, string> = {
        studying: 'Studying',
        break: 'On Break',
        revising: 'Revising',
        offline: 'Offline',
      };
      showToast(`Status set to ${labels[status]}`);
    },
    [showToast]
  );

  // Settings & Backup
  const updateProfile = useCallback(
    (patch: Partial<UserProfile>) => {
      setState((prev) => {
        const nextName = patch.name ?? prev.profile.name;
        return {
          ...prev,
          profile: { ...prev.profile, ...patch },
          rooms:
            patch.name !== undefined
              ? prev.rooms.map((r) => ({
                  ...r,
                  members: r.members.map((m) =>
                    m.isCurrentUser
                      ? { ...m, name: `${nextName} (You)`, initials: getInitials(nextName) }
                      : m
                  ),
                }))
              : prev.rooms,
        };
      });
    },
    []
  );

  const exportBackupJson = useCallback(() => {
    return JSON.stringify(state, null, 2);
  }, [state]);

  const importBackupJson = useCallback(
    (raw: string): { ok: boolean; message: string } => {
      try {
        const parsed = JSON.parse(raw) as StudyFlowState;
        if (!parsed || !parsed.profile || !Array.isArray(parsed.subjects)) {
          return { ok: false, message: 'Invalid STUDYFLO backup file structure.' };
        }
        setState(parsed);
        showToast('Backup restored successfully');
        return { ok: true, message: 'Backup restored successfully.' };
      } catch {
        return { ok: false, message: 'Could not parse JSON backup file.' };
      }
    },
    [showToast]
  );

  const resetDemoData = useCallback(() => {
    const fresh = createSeedState();
    setState(fresh);
    setFocusSubjectId(fresh.subjects[0].id);
    showToast('Reset STUDYFLO to default study dataset');
  }, [showToast]);

  const value: StudyFlowContextValue = {
    state,
    metrics,
    t,
    activeTab,
    setActiveTab,
    focusSubjectId,
    setFocusSubjectId,
    launchFocusForSubject,
    toast,
    showToast,
    addSubject,
    deleteSubject,
    addChapter,
    deleteChapter,
    addTopic,
    toggleTopic,
    deleteTopic,
    logFocusSession,
    deleteFocusSession,
    createDeck,
    deleteDeck,
    addFlashcard,
    deleteFlashcard,
    reviewFlashcard,
    createNote,
    updateNote,
    deleteNote,
    addDailyGoal,
    toggleDailyGoal,
    deleteDailyGoal,
    createStudyRoom,
    joinStudyRoomByCode,
    setActiveRoomId,
    sendRoomMessage,
    setMyStatus,
    updateProfile,
    exportBackupJson,
    importBackupJson,
    resetDemoData,
  };

  return <StudyFlowContext.Provider value={value}>{children}</StudyFlowContext.Provider>;
}

export function useStudyFlow() {
  const ctx = useContext(StudyFlowContext);
  if (!ctx) {
    throw new Error('useStudyFlow must be used inside StudyFlowProvider');
  }
  return ctx;
}
