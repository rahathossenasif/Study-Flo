import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Trash2,
  Lightbulb,
  BookOpen,
  Calendar,
  X,
  Brain,
  HelpCircle,
} from 'lucide-react';
import { useStudyFlow } from '../context/StudyFlowContext';
import { CircularProgress } from './CircularProgress';
import { PriorityLevel, SubjectAccent } from '../types/studyflow';
import { SUBJECT_ACCENTS, PRIORITY_LABEL } from '../utils/accentStyles';
import {
  StudyAssistantDrawer,
  AssistantTab,
  AssistantContextPayload,
} from './StudyAssistantDrawer';

const ACCENT_OPTIONS: SubjectAccent[] = ['purple', 'cyan', 'blue', 'amber', 'emerald', 'rose'];

export function SyllabusView() {
  const {
    state,
    metrics,
    addSubject,
    deleteSubject,
    addChapter,
    deleteChapter,
    addTopic,
    toggleTopic,
    deleteTopic,
  } = useStudyFlow();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    () => state.subjects[0]?.id ?? ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | PriorityLevel>('all');
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  // Inline creation states
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubGoal, setNewSubGoal] = useState(5);
  const [newSubAccent, setNewSubAccent] = useState<SubjectAccent>('purple');

  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChTitle, setNewChTitle] = useState('');
  const [newChPriority, setNewChPriority] = useState<PriorityLevel>('medium');
  const [newChDeadline, setNewChDeadline] = useState('');

  const [topicInputs, setTopicInputs] = useState<Record<string, { title: string; priority: PriorityLevel }>>({});

  // AI Study Assistant drawer state
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantTab, setAssistantTab] = useState<AssistantTab>('quiz');
  const [assistantAutoRun, setAssistantAutoRun] = useState(false);
  const [assistantContext, setAssistantContext] = useState<AssistantContextPayload>({
    sourceType: 'syllabus',
    subjectId: 'sub-math',
    subjectName: 'Mathematics',
    title: 'Syllabus Practice',
    content: '',
  });

  const activeSubject = useMemo(() => {
    return state.subjects.find((s) => s.id === selectedSubjectId) ?? state.subjects[0] ?? null;
  }, [state.subjects, selectedSubjectId]);

  const activeStats = activeSubject
    ? metrics.subjectProgressMap[activeSubject.id] ?? { percent: 0, completed: 0, total: 0, weekHours: 0 }
    : { percent: 0, completed: 0, total: 0, weekHours: 0 };

  const toggleChapterExpand = (chapterId: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: prev[chapterId] === undefined ? false : !prev[chapterId],
    }));
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    addSubject(newSubName, newSubCode, newSubAccent, newSubGoal);
    setNewSubName('');
    setNewSubCode('');
    setNewSubGoal(5);
    setShowAddSubject(false);
  };

  const handleCreateChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubject || !newChTitle.trim()) return;
    addChapter(activeSubject.id, newChTitle, newChPriority, newChDeadline || undefined);
    setNewChTitle('');
    setNewChDeadline('');
    setShowAddChapter(false);
  };

  const handleCreateTopic = (chapterId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubject) return;
    const draft = topicInputs[chapterId];
    if (!draft?.title?.trim()) return;
    addTopic(activeSubject.id, chapterId, draft.title, draft.priority || 'medium');
    setTopicInputs((prev) => ({ ...prev, [chapterId]: { title: '', priority: 'medium' } }));
  };

  const openSyllabusAssistant = (
    tab: AssistantTab,
    options: {
      title: string;
      content: string;
      suggestedConcepts?: string[];
      initialConcept?: string;
      autoRun?: boolean;
    }
  ) => {
    if (!activeSubject) return;
    setAssistantContext({
      sourceType: 'syllabus',
      subjectId: activeSubject.id,
      subjectName: activeSubject.name,
      title: options.title,
      content: options.content,
      suggestedConcepts: options.suggestedConcepts,
      initialConcept: options.initialConcept,
    });
    setAssistantTab(tab);
    setAssistantAutoRun(Boolean(options.autoRun));
    setAssistantOpen(true);
  };

  const openSubjectAssistant = (tab: AssistantTab) => {
    if (!activeSubject) return;
    const allTopics = activeSubject.chapters.flatMap((ch) =>
      ch.topics.map((t) => t.title)
    );
    const syllabusOutline = activeSubject.chapters
      .map(
        (ch) =>
          `${ch.title}:\n${ch.topics
            .map((t) => `- ${t.title} (${t.completed ? 'completed' : 'in progress'})`)
            .join('\n')}`
      )
      .join('\n\n');
    openSyllabusAssistant(tab, {
      title: `${activeSubject.name} Syllabus`,
      content: syllabusOutline || activeSubject.name,
      suggestedConcepts: allTopics.slice(0, 6),
      autoRun: tab === 'quiz',
    });
  };

  const filteredChapters = useMemo(() => {
    if (!activeSubject) return [];
    const q = searchQuery.trim().toLowerCase();
    return activeSubject.chapters
      .map((ch) => {
        const filteredTopics = ch.topics.filter((t) => {
          const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
          const matchesQuery =
            !q || t.title.toLowerCase().includes(q) || ch.title.toLowerCase().includes(q);
          return matchesPriority && matchesQuery;
        });
        return { ...ch, visibleTopics: filteredTopics };
      })
      .filter((ch) => {
        if (!q && priorityFilter === 'all') return true;
        return ch.visibleTopics.length > 0 || (q && ch.title.toLowerCase().includes(q));
      });
  }, [activeSubject, searchQuery, priorityFilter]);

  return (
    <div className="space-y-6 pb-8">
      {/* Header & Overall Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Syllabus Tracker
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            Overall mastery {metrics.overallProgress}% · {metrics.completedTopics} of {metrics.totalTopics} topics completed
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddSubject((v) => !v)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Subject
        </button>
      </div>

      {/* Add Subject Drawer */}
      {showAddSubject && (
        <form
          onSubmit={handleCreateSubject}
          className="rounded-2xl bg-white dark:bg-[#111124] border border-[#7C3AED]/40 p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Create Subject</h2>
            <button
              type="button"
              onClick={() => setShowAddSubject(false)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={newSubName}
              onChange={(e) => setNewSubName(e.target.value)}
              placeholder="Subject name (e.g. Organic Chemistry)"
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
            />
            <input
              type="text"
              value={newSubCode}
              onChange={(e) => setNewSubCode(e.target.value)}
              placeholder="Course code (e.g. CHEM 210)"
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
            />
            <input
              type="number"
              min={1}
              max={40}
              value={newSubGoal}
              onChange={(e) => setNewSubGoal(Number(e.target.value))}
              placeholder="Weekly hours goal"
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Accent:</span>
              {ACCENT_OPTIONS.map((acc) => (
                <button
                  key={acc}
                  type="button"
                  onClick={() => setNewSubAccent(acc)}
                  aria-label={`Select ${acc} accent`}
                  className={`w-7 h-7 rounded-full ${SUBJECT_ACCENTS[acc].bg} transition-transform cursor-pointer ${
                    newSubAccent === acc ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#111124] ring-[#7C3AED] scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold cursor-pointer"
            >
              Save Subject
            </button>
          </div>
        </form>
      )}

      {/* Subject Switcher Bar */}
      {state.subjects.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {state.subjects.map((sub) => {
            const isSelected = activeSubject?.id === sub.id;
            const stats = metrics.subjectProgressMap[sub.id];
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/25'
                    : 'bg-white dark:bg-[#111124] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] hover:border-[#7C3AED]/40'
                }`}
              >
                <span>{sub.name}</span>
                <span
                  className={`font-mono text-xs tabular-nums ${
                    isSelected ? 'text-purple-100' : 'text-slate-400'
                  }`}
                >
                  {stats?.percent ?? 0}%
                </span>
              </button>
            );
          })}
        </div>
      )}

      {!activeSubject ? (
        <div className="rounded-2xl bg-white dark:bg-[#111124] border border-slate-200 dark:border-white/[0.08] p-12 text-center">
          <BookOpen className="w-10 h-10 mx-auto text-slate-400 mb-3" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">No subjects yet</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Add your first academic subject to start organizing chapters, topics, and deadlines.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Chapter & Topics Column */}
          <div className="lg:col-span-8 space-y-4">
            {/* Subject Banner Card */}
            <div className="rounded-2xl bg-gradient-to-br from-[#7C3AED]/10 via-white to-white dark:from-[#1B1339] dark:via-[#111124] dark:to-[#111124] border border-slate-200 dark:border-white/[0.09] p-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {activeSubject.code} · Weekly target {activeSubject.weeklyGoalHours}h
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white truncate">
                  {activeSubject.name}
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 tabular-nums">
                  {activeStats.percent}% Complete · {activeStats.completed} of {activeStats.total} topics mastered
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAddChapter((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Chapter
                  </button>
                  <button
                    type="button"
                    onClick={() => openSubjectAssistant('quiz')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-white/[0.06] border border-[#7C3AED]/35 text-[#7C3AED] dark:text-[#C4B5FD] hover:bg-[#7C3AED]/10 text-xs font-semibold cursor-pointer"
                  >
                    <Brain className="w-3.5 h-3.5" />
                    AI Quiz & Explain
                  </button>
                  {state.subjects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => deleteSubject(activeSubject.id)}
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove subject
                    </button>
                  )}
                </div>
              </div>
              <CircularProgress
                value={activeStats.percent}
                size={84}
                strokeWidth={8}
                gradientFrom="#06B6D4"
                gradientTo={SUBJECT_ACCENTS[activeSubject.accent].hex}
              />
            </div>

            {/* Add Chapter Form */}
            {showAddChapter && (
              <form
                onSubmit={handleCreateChapter}
                className="rounded-2xl bg-white dark:bg-[#111124] border border-[#7C3AED]/40 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Add Chapter to {activeSubject.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddChapter(false)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={newChTitle}
                    onChange={(e) => setNewChTitle(e.target.value)}
                    placeholder="Chapter title (e.g. Chapter 4: Integrals)"
                    className="sm:col-span-2 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
                  />
                  <select
                    value={newChPriority}
                    onChange={(e) => setNewChPriority(e.target.value as PriorityLevel)}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#191933] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
                  >
                    <option value="high">High priority</option>
                    <option value="medium">Medium priority</option>
                    <option value="low">Low priority</option>
                  </select>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Calendar className="w-4 h-4" />
                    Deadline:
                    <input
                      type="date"
                      value={newChDeadline}
                      onChange={(e) => setNewChDeadline(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white"
                    />
                  </label>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold cursor-pointer"
                  >
                    Create Chapter
                  </button>
                </div>
              </form>
            )}

            {/* Search & Priority Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chapters or topics..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#111124] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08]">
                {(['all', 'high', 'medium', 'low'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setPriorityFilter(level)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      priorityFilter === level
                        ? 'bg-[#7C3AED] text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Chapters Accordion List */}
            {filteredChapters.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-[#111124] border border-slate-200 dark:border-white/[0.08] p-8 text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  No chapters match your current filter. Add a chapter to begin tracking topics.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredChapters.map((chapter) => {
                  const total = chapter.topics.length;
                  const done = chapter.topics.filter((t) => t.completed).length;
                  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
                  const isExpanded = expandedChapters[chapter.id] !== false;
                  const draft = topicInputs[chapter.id] ?? { title: '', priority: 'medium' as PriorityLevel };

                  return (
                    <div
                      key={chapter.id}
                      className="rounded-2xl bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] overflow-hidden"
                    >
                      {/* Chapter Header */}
                      <div className="p-4 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => toggleChapterExpand(chapter.id)}
                          className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                        >
                          <span className="text-slate-400 shrink-0">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {chapter.title}
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                              <span className={PRIORITY_LABEL[chapter.priority].colorClass}>
                                {PRIORITY_LABEL[chapter.priority].text}
                              </span>
                              {chapter.deadline && (
                                <>
                                  <span className="mx-1.5" aria-hidden="true">·</span>
                                  <span className="tabular-nums">
                                    Due{' '}
                                    {new Date(chapter.deadline + 'T00:00:00').toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </button>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              openSyllabusAssistant('quiz', {
                                title: chapter.title,
                                content:
                                  chapter.topics.length > 0
                                    ? `${chapter.title}\nTopics:\n${chapter.topics.map((t) => `- ${t.title}`).join('\n')}`
                                    : chapter.title,
                                suggestedConcepts: chapter.topics.map((t) => t.title),
                                autoRun: true,
                              })
                            }
                            title={`Generate practice questions for ${chapter.title}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#7C3AED]/12 hover:bg-[#7C3AED] text-[#7C3AED] dark:text-[#C4B5FD] hover:text-white text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            Quiz
                          </button>
                          <span
                            className={`font-mono text-xs font-semibold tabular-nums ${
                              pct === 100
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {pct}%
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteChapter(activeSubject.id, chapter.id)}
                            aria-label="Delete chapter"
                            className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Thin Chapter Progress Bar */}
                      <div className="h-1 w-full bg-slate-100 dark:bg-white/[0.05]">
                        <div
                          className={`h-full transition-all duration-300 ${
                            pct === 100
                              ? 'bg-emerald-500'
                              : `bg-gradient-to-r ${SUBJECT_ACCENTS[activeSubject.accent].bar}`
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* Chapter Topics Body */}
                      {isExpanded && (
                        <div className="p-4 pt-3 space-y-2.5 bg-slate-50/50 dark:bg-white/[0.015]">
                          {chapter.visibleTopics.length === 0 ? (
                            <p className="text-xs text-slate-500 dark:text-slate-400 py-1">
                              No topics in this chapter yet.
                            </p>
                          ) : (
                            <ul className="space-y-1.5">
                              {chapter.visibleTopics.map((topic) => (
                                <li
                                  key={topic.id}
                                  className="flex items-center gap-3 py-2 px-2.5 rounded-xl hover:bg-white dark:hover:bg-white/[0.04] transition-colors group"
                                >
                                  <button
                                    type="button"
                                    onClick={() => toggleTopic(activeSubject.id, chapter.id, topic.id)}
                                    className="shrink-0 cursor-pointer"
                                    aria-label={topic.completed ? 'Mark topic incomplete' : 'Mark topic complete'}
                                  >
                                    {topic.completed ? (
                                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    ) : (
                                      <Circle className="w-5 h-5 text-slate-400 dark:text-slate-500 hover:text-[#7C3AED]" />
                                    )}
                                  </button>
                                  <div
                                    onClick={() => toggleTopic(activeSubject.id, chapter.id, topic.id)}
                                    className="min-w-0 flex-1 cursor-pointer"
                                  >
                                    <p
                                      className={`text-sm ${
                                        topic.completed
                                          ? 'line-through text-slate-400 dark:text-slate-500'
                                          : 'text-slate-800 dark:text-slate-100'
                                      }`}
                                    >
                                      {topic.title}
                                    </p>
                                  </div>
                                  <span className={`text-[11px] font-medium shrink-0 ${PRIORITY_LABEL[topic.priority].colorClass}`}>
                                    {topic.priority}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openSyllabusAssistant('explain', {
                                        title: chapter.title,
                                        content: `Subject: ${activeSubject.name}\nChapter: ${chapter.title}\nTopic: ${topic.title}`,
                                        suggestedConcepts: chapter.topics.map((t) => t.title),
                                        initialConcept: topic.title,
                                        autoRun: true,
                                      })
                                    }
                                    title={`Explain "${topic.title}" with AI`}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-[#7C3AED] text-slate-600 dark:text-slate-300 hover:text-white text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                                  >
                                    <Brain className="w-3 h-3" />
                                    Explain
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteTopic(activeSubject.id, chapter.id, topic.id)}
                                    aria-label="Delete topic"
                                    className="opacity-60 sm:opacity-0 sm:group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}

                          {/* Inline Add Topic Form */}
                          <form
                            onSubmit={(e) => handleCreateTopic(chapter.id, e)}
                            className="pt-2 flex flex-col sm:flex-row gap-2"
                          >
                            <input
                              type="text"
                              value={draft.title}
                              onChange={(e) =>
                                setTopicInputs((prev) => ({
                                  ...prev,
                                  [chapter.id]: { ...draft, title: e.target.value },
                                }))
                              }
                              placeholder="Add a topic to this chapter..."
                              className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#0B0B1A] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED]"
                            />
                            <div className="flex gap-2">
                              <select
                                value={draft.priority}
                                onChange={(e) =>
                                  setTopicInputs((prev) => ({
                                    ...prev,
                                    [chapter.id]: {
                                      ...draft,
                                      priority: e.target.value as PriorityLevel,
                                    },
                                  }))
                                }
                                className="px-2.5 py-2 rounded-xl bg-white dark:bg-[#0B0B1A] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-700 dark:text-slate-300"
                              >
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                              </select>
                              <button
                                type="submit"
                                className="px-3.5 py-2 rounded-xl bg-[#7C3AED]/15 hover:bg-[#7C3AED] text-[#7C3AED] dark:text-[#C4B5FD] hover:text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                              >
                                + Add Topic
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Side Column: Overall Breakdown & Study Tip */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                All Subjects Overview
              </h3>
              <div className="space-y-4">
                {state.subjects.map((sub) => {
                  const st = metrics.subjectProgressMap[sub.id] ?? { percent: 0, completed: 0, total: 0 };
                  return (
                    <div key={sub.id}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-medium text-slate-700 dark:text-slate-200">{sub.name}</span>
                        <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          {st.completed}/{st.total} · {st.percent}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.07] overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${SUBJECT_ACCENTS[sub.accent].bar}`}
                          style={{ width: `${st.percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-white dark:from-[#221A14] dark:to-[#111124] border border-amber-200/80 dark:border-amber-500/20 p-5 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Pro Tip</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Break big chapters into 25-minute topics with clear priorities. Checking off smaller milestones keeps momentum high during exam weeks.
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}

      <StudyAssistantDrawer
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        initialTab={assistantTab}
        context={assistantContext}
        autoRun={assistantAutoRun}
      />
    </div>
  );
}
