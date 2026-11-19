import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Brain,
  FileText,
  BookOpen,
  HelpCircle,
  MessageSquare,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Plus,
  Layers,
  Send,
  RotateCcw,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { useStudyFlow } from '../context/StudyFlowContext';
import {
  requestNoteSummary,
  requestPracticeQuestions,
  requestConceptExplanation,
  requestStudyChat,
  NoteSummaryResponse,
  PracticeQuestionsResponse,
  PracticeQuestion,
  ConceptExplanationResponse,
  StudyChatTurn,
} from '../services/aiAssistant';
import { SUBJECT_ACCENTS } from '../utils/accentStyles';

type SourcePickerMode = 'notes' | 'syllabus';
type WorkspaceTab = 'summarize' | 'quiz' | 'explain' | 'chat';

interface SelectedSource {
  id: string;
  sourceType: 'note' | 'syllabus';
  title: string;
  subtitle: string;
  subjectId: string;
  subjectName: string;
  content: string;
  noteId?: string;
  suggestedConcepts: string[];
}

export function AIAssistantView() {
  const {
    state,
    t,
    updateNote,
    createNote,
    addFlashcard,
    createDeck,
    setActiveTab,
    showToast,
  } = useStudyFlow();

  const appLang = state.profile.language ?? 'en';
  const isBn = appLang === 'bn';

  const [sourceMode, setSourceMode] = useState<SourcePickerMode>('notes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSourceId, setSelectedSourceId] = useState<string>(
    () => state.notes[0]?.id ?? state.subjects[0]?.chapters[0]?.id ?? ''
  );
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('summarize');

  // Shared request state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Summarize state (defaults to Bangla as requested, with quick বাংলা/EN switch)
  const [summaryLang, setSummaryLang] = useState<'bn' | 'en'>('bn');
  const [summaryData, setSummaryData] = useState<NoteSummaryResponse | null>(null);

  // Practice Quiz state
  const [difficulty, setDifficulty] = useState<'foundational' | 'exam' | 'challenge'>('exam');
  const [questionCount, setQuestionCount] = useState<number>(4);
  const [quizData, setQuizData] = useState<PracticeQuestionsResponse | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [savedFlashcards, setSavedFlashcards] = useState<Record<number, boolean>>({});

  // Explain Concept state
  const [conceptInput, setConceptInput] = useState('');
  const [depth, setDepth] = useState<'brief' | 'intuitive' | 'step-by-step'>('brief');
  const [explanationData, setExplanationData] = useState<ConceptExplanationResponse | null>(null);

  // Contextual Tutor Chat state
  const [chatHistory, setChatHistory] = useState<StudyChatTurn[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const subjectMap = useMemo(
    () => Object.fromEntries(state.subjects.map((s) => [s.id, s])),
    [state.subjects]
  );

  // Build normalized source items for Notes and Syllabus
  const noteSources = useMemo<SelectedSource[]>(() => {
    return state.notes.map((note) => {
      const sub = subjectMap[note.subjectId];
      return {
        id: note.id,
        sourceType: 'note',
        title: note.title || 'Untitled Note',
        subtitle: `${sub?.name ?? 'General'} · ${
          note.content.trim().split(/\s+/).filter(Boolean).length
        } words`,
        subjectId: note.subjectId,
        subjectName: sub?.name ?? 'General Studies',
        content: note.content,
        noteId: note.id,
        suggestedConcepts: [note.title].filter(Boolean),
      };
    });
  }, [state.notes, subjectMap]);

  const syllabusSources = useMemo<SelectedSource[]>(() => {
    const items: SelectedSource[] = [];
    for (const sub of state.subjects) {
      for (const ch of sub.chapters) {
        const done = ch.topics.filter((t) => t.completed).length;
        items.push({
          id: ch.id,
          sourceType: 'syllabus',
          title: ch.title,
          subtitle: `${sub.name} · ${done}/${ch.topics.length} topics done`,
          subjectId: sub.id,
          subjectName: sub.name,
          content:
            ch.topics.length > 0
              ? `Subject: ${sub.name} (${sub.code})\nChapter: ${ch.title}\nTopics:\n${ch.topics
                  .map((t) => `- ${t.title} [${t.priority} priority, ${t.completed ? 'completed' : 'pending'}]`)
                  .join('\n')}`
              : `Subject: ${sub.name}\nChapter: ${ch.title}`,
          suggestedConcepts: ch.topics.map((t) => t.title),
        });
      }
    }
    return items;
  }, [state.subjects]);

  const visibleSources = useMemo(() => {
    const list = sourceMode === 'notes' ? noteSources : syllabusSources;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subjectName.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q)
    );
  }, [sourceMode, noteSources, syllabusSources, searchQuery]);

  const activeSource = useMemo<SelectedSource | null>(() => {
    const all = [...noteSources, ...syllabusSources];
    return (
      all.find((s) => s.id === selectedSourceId) ??
      visibleSources[0] ??
      all[0] ??
      null
    );
  }, [noteSources, syllabusSources, selectedSourceId, visibleSources]);

  const handleSelectSource = (src: SelectedSource) => {
    setSelectedSourceId(src.id);
    setError(null);
    setSummaryData(null);
    setQuizData(null);
    setSelectedAnswers({});
    setSavedFlashcards({});
    setExplanationData(null);
    setChatHistory([]);
    setConceptInput(src.suggestedConcepts[0] ?? '');
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [chatHistory.length]);

  const runSummarize = async (langOverride?: 'bn' | 'en') => {
    if (!activeSource) return;
    const activeLang = langOverride ?? summaryLang;
    if (!activeSource.content.trim()) {
      setError(
        isBn
          ? 'নির্বাচিত আইটেমে কোনো লেখা নেই। আগে নোটস বা সিলেবাসে কিছু লিখুন।'
          : 'The selected item has no content yet. Add content in Notes or Syllabus first.'
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await requestNoteSummary({
        sourceType: activeSource.sourceType,
        title: activeSource.title,
        subjectName: activeSource.subjectName,
        content: activeSource.content,
        language: activeLang,
      });
      setSummaryData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to summarize right now.');
    } finally {
      setLoading(false);
    }
  };

  const runPracticeQuiz = async () => {
    if (!activeSource) return;
    setLoading(true);
    setError(null);
    setSelectedAnswers({});
    setSavedFlashcards({});
    try {
      const res = await requestPracticeQuestions({
        sourceType: activeSource.sourceType,
        title: activeSource.title,
        subjectName: activeSource.subjectName,
        contextText: activeSource.content || activeSource.title,
        count: questionCount,
        difficulty,
        language: appLang,
      });
      setQuizData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate practice questions.');
    } finally {
      setLoading(false);
    }
  };

  const runExplain = async (conceptOverride?: string) => {
    if (!activeSource) return;
    const query = (conceptOverride ?? conceptInput).trim();
    if (!query) {
      setError(
        isBn
          ? 'যেকোনো টপিক লিখুন অথবা সাজেশন থেকে বেছে নিন।'
          : 'Enter a concept or select one from the syllabus/note suggestions.'
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await requestConceptExplanation({
        concept: query,
        subjectName: activeSource.subjectName,
        contextText: activeSource.content,
        depth,
        language: appLang,
      });
      setExplanationData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to explain this concept.');
    } finally {
      setLoading(false);
    }
  };

  const runChat = async (promptOverride?: string) => {
    if (!activeSource) return;
    const msg = (promptOverride ?? chatInput).trim();
    if (!msg || loading) return;

    const nextHistory: StudyChatTurn[] = [...chatHistory, { role: 'user', text: msg }];
    setChatHistory(nextHistory);
    setChatInput('');
    setLoading(true);
    setError(null);
    try {
      const { reply } = await requestStudyChat({
        message: msg,
        history: chatHistory,
        sourceTitle: activeSource.title,
        subjectName: activeSource.subjectName,
        contextText: activeSource.content,
        language: appLang,
      });
      setChatHistory([...nextHistory, { role: 'assistant', text: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach AI Tutor.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSummary = () => {
    if (!summaryData || !activeSource) return;
    const formatted = [
      summaryData.summary,
      '',
      'Key Takeaways:',
      ...summaryData.keyTakeaways.map((t) => `• ${t}`),
      ...(summaryData.keyTerms.length > 0
        ? ['', 'Key Terms:', ...summaryData.keyTerms.map((k) => `• ${k.term}: ${k.definition}`)]
        : []),
    ].join('\n');

    if (activeSource.noteId) {
      const existing = state.notes.find((n) => n.id === activeSource.noteId);
      if (existing) {
        updateNote(existing.id, {
          content: `${existing.content.trimEnd()}\n\n---\nAI Study Summary:\n${formatted}`,
        });
        showToast('Appended summary to your note');
        return;
      }
    }
    createNote(`Summary: ${activeSource.title}`, formatted, activeSource.subjectId, 'purple', false);
    showToast('Saved summary to My Notes');
  };

  const handleSaveQuestionAsFlashcard = (idx: number, q: PracticeQuestion) => {
    if (!activeSource) return;
    const targetDeck =
      state.decks.find((d) => d.subjectId === activeSource.subjectId) ?? state.decks[0];
    if (!targetDeck) {
      createDeck(
        `${activeSource.subjectName} Practice`,
        activeSource.subjectId,
        'AI-generated practice questions',
        'purple'
      );
      showToast('Deck created — click Save as Flashcard again to add this question');
      return;
    }
    addFlashcard(targetDeck.id, q.question, q.flashcardAnswer || q.explanation);
    setSavedFlashcards((prev) => ({ ...prev, [idx]: true }));
  };

  const handleSaveExplanationAsNote = () => {
    if (!explanationData || !activeSource) return;
    const body = [
      explanationData.briefExplanation,
      '',
      `Analogy:\n${explanationData.analogy}`,
      '',
      `Example:\n${explanationData.example}`,
      '',
      `Common Pitfall:\n${explanationData.commonMistake}`,
    ].join('\n');
    createNote(explanationData.concept, body, activeSource.subjectId, 'cyan', false);
    showToast(`Saved "${explanationData.concept}" to My Notes`);
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = quizData
    ? quizData.questions.reduce(
        (acc, q, idx) => (selectedAnswers[idx] === q.correctIndex ? acc + 1 : acc),
        0
      )
    : 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.assistant.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isBn
              ? 'যেকোনো নোট বা সিলেবাস অধ্যায় বেছে নিয়ে বাংলা সারাংশ, প্র্যাকটিস কুইজ বা সহজ ব্যাখ্যা পান'
              : 'Select any Note or Syllabus chapter to summarize in Bangla/English, practice exam questions, or clarify concepts'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className="px-3.5 py-2 min-h-[40px] rounded-xl bg-white dark:bg-[#111124] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-[#7C3AED] transition-colors whitespace-nowrap cursor-pointer"
          >
            {isBn ? 'নোটস খুলুন' : 'Open Notes'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('syllabus')}
            className="px-3.5 py-2 min-h-[40px] rounded-xl bg-white dark:bg-[#111124] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-[#7C3AED] transition-colors whitespace-nowrap cursor-pointer"
          >
            {isBn ? 'সিলেবাস খুলুন' : 'Open Syllabus'}
          </button>
        </div>
      </div>

      {/* Main 2-Column AI Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Notes & Syllabus Source Picker */}
        <aside className="lg:col-span-4 rounded-2xl bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] p-4 space-y-3.5">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04]">
            <button
              type="button"
              onClick={() => {
                setSourceMode('notes');
                if (noteSources[0]) handleSelectSource(noteSources[0]);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                sourceMode === 'notes'
                  ? 'bg-[#7C3AED] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Notes ({noteSources.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setSourceMode('syllabus');
                if (syllabusSources[0]) handleSelectSource(syllabusSources[0]);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                sourceMode === 'syllabus'
                  ? 'bg-[#7C3AED] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Syllabus ({syllabusSources.length})
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Filter ${sourceMode}...`}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0B1A] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED]"
            />
          </div>

          {visibleSources.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-8 text-center">
              No {sourceMode} items match your search.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {visibleSources.map((src) => {
                const isSelected = activeSource?.id === src.id;
                const sub = subjectMap[src.subjectId];
                const accent = sub ? SUBJECT_ACCENTS[sub.accent] : SUBJECT_ACCENTS.purple;
                return (
                  <button
                    key={src.id}
                    type="button"
                    onClick={() => handleSelectSource(src)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#7C3AED]/10 dark:bg-[#7C3AED]/20 border-[#7C3AED]/50'
                        : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {src.title}
                      </p>
                      {sub?.code && (
                        <span className={`font-mono text-[10px] font-semibold shrink-0 ${accent.text}`}>
                          {sub.code}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                      {src.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* Right Column: Interactive Gemini Study Workspace */}
        <section className="lg:col-span-8 rounded-2xl bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] overflow-hidden">
          {!activeSource ? (
            <div className="p-12 text-center">
              <Brain className="w-10 h-10 mx-auto text-slate-400 mb-3" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Add a Note or Syllabus Chapter to Begin
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Once you have notes or syllabus topics, select them here to summarize and practice with Gemini AI.
              </p>
            </div>
          ) : (
            <>
              {/* Active Source Banner & Mode Tabs */}
              <div className="p-5 border-b border-slate-100 dark:border-white/[0.07] space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#7C3AED] dark:text-[#A78BFA]">
                      {activeSource.sourceType === 'note' ? 'Selected Note' : 'Selected Syllabus Chapter'} ·{' '}
                      {activeSource.subjectName}
                    </p>
                    <h2 className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white truncate">
                      {activeSource.title}
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#0B0B1A] border border-slate-200/70 dark:border-white/[0.06]">
                  {(
                    [
                      { id: 'summarize' as const, label: t.assistant.summarize, icon: FileText },
                      { id: 'quiz' as const, label: t.assistant.quiz, icon: HelpCircle },
                      { id: 'explain' as const, label: t.assistant.explain, icon: BookOpen },
                      { id: 'chat' as const, label: isBn ? 'টিউটর চ্যাট' : 'Ask Tutor', icon: MessageSquare },
                    ]
                  ).map((tabItem) => {
                    const Icon = tabItem.icon;
                    const active = workspaceTab === tabItem.id;
                    return (
                      <button
                        key={tabItem.id}
                        type="button"
                        onClick={() => {
                          setWorkspaceTab(tabItem.id);
                          setError(null);
                        }}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                          active
                            ? 'bg-[#7C3AED] text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span>{tabItem.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Workspace Body */}
              <div className="p-5 space-y-5">
                {error && (
                  <div className="rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-3.5 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{error}</p>
                  </div>
                )}

                {/* TAB 1: SUMMARIZE */}
                {workspaceTab === 'summarize' && (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-slate-50 dark:bg-[#0B0B1A] border border-slate-200/80 dark:border-white/[0.07] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                          {summaryLang === 'bn'
                            ? `“${activeSource.title}” এর বাংলা সারাংশ`
                            : `Distill key points from “${activeSource.title}”`}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {summaryLang === 'bn'
                            ? 'সহজ বাংলায় মূল সারাংশ, গুরুত্বপূর্ণ পয়েন্ট ও সংজ্ঞা তৈরি করবে'
                            : 'Generates an executive overview, study takeaways, and key definitions'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Bangla / English summary toggle (defaults to Bangla) */}
                        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-200/75 dark:bg-white/[0.06]">
                          {(['bn', 'en'] as const).map((lang) => (
                            <button
                              key={lang}
                              type="button"
                              disabled={loading}
                              onClick={() => {
                                setSummaryLang(lang);
                                if (summaryData) {
                                  void runSummarize(lang);
                                }
                              }}
                              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                                summaryLang === lang
                                  ? 'bg-[#7C3AED] text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              {lang === 'bn' ? 'বাংলা' : 'EN'}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => void runSummarize()}
                          className="px-4 py-2.5 min-h-[42px] rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-60 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {loading
                            ? summaryLang === 'bn'
                              ? 'সারাংশ হচ্ছে...'
                              : 'Summarizing...'
                            : summaryData
                              ? summaryLang === 'bn'
                                ? 'আবার তৈরি করুন'
                                : 'Regenerate Summary'
                              : summaryLang === 'bn'
                                ? 'বাংলায় সারাংশ'
                                : 'Summarize Now'}
                        </button>
                      </div>
                    </div>

                    {loading && (
                      <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin text-[#7C3AED]" />
                        <p className="text-xs">
                          {summaryLang === 'bn'
                            ? 'AI দিয়ে বাংলায় সারাংশ তৈরি হচ্ছে...'
                            : 'Analyzing content with AI...'}
                        </p>
                      </div>
                    )}

                    {!loading && summaryData && (
                      <div className="space-y-4">
                        <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.07] p-4 space-y-1.5">
                          <h3 className="text-xs font-semibold text-[#7C3AED] dark:text-[#A78BFA]">
                            {summaryLang === 'bn' ? 'মূল সারাংশ (বাংলা)' : 'Executive Summary'}
                          </h3>
                          <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                            {summaryData.summary}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.07] p-4 space-y-2.5">
                          <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                            {summaryLang === 'bn' ? 'গুরুত্বপূর্ণ পয়েন্টসমূহ' : 'High-Yield Takeaways'}
                          </h3>
                          <ul className="space-y-2">
                            {summaryData.keyTakeaways.map((pt, i) => (
                              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                                <span className="font-mono text-xs font-semibold text-[#06B6D4] mt-0.5 shrink-0">
                                  0{i + 1}.
                                </span>
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {summaryData.keyTerms.length > 0 && (
                          <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.07] p-4 space-y-2.5">
                            <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                              {summaryLang === 'bn' ? 'গুরুত্বপূর্ণ শব্দ ও সূত্র' : 'Key Terms & Principles'}
                            </h3>
                            <dl className="divide-y divide-slate-200/70 dark:divide-white/[0.06]">
                              {summaryData.keyTerms.map((kt, i) => (
                                <div key={i} className="py-2 first:pt-0 last:pb-0">
                                  <dt className="text-xs font-semibold text-slate-900 dark:text-white">
                                    {kt.term}
                                  </dt>
                                  <dd className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                    {kt.definition}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleSaveSummary}
                          className="w-full py-3 min-h-[44px] rounded-xl bg-[#7C3AED]/10 hover:bg-[#7C3AED] text-[#6D28D9] hover:text-white dark:bg-white/[0.08] dark:hover:bg-white/[0.14] dark:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          {activeSource.noteId ? t.assistant.appendToNote : t.assistant.saveAsNote}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: PRACTICE QUESTIONS */}
                {workspaceTab === 'quiz' && (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-slate-50 dark:bg-[#0B0B1A] border border-slate-200/80 dark:border-white/[0.07] p-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-200/70 dark:bg-white/[0.05]">
                          {(['foundational', 'exam', 'challenge'] as const).map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setDifficulty(lvl)}
                              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold capitalize cursor-pointer ${
                                difficulty === lvl
                                  ? 'bg-[#7C3AED] text-white'
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                        <select
                          value={questionCount}
                          onChange={(e) => setQuestionCount(Number(e.target.value))}
                          aria-label="Question count"
                          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#191933] border border-slate-200 dark:border-white/[0.1] font-mono text-xs text-slate-800 dark:text-slate-200"
                        >
                          <option value={3}>3 Qs</option>
                          <option value={4}>4 Qs</option>
                          <option value={5}>5 Qs</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => void runPracticeQuiz()}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[42px] rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-60 text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                      >
                        {loading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                        {loading ? 'Generating...' : quizData ? 'New Quiz' : 'Generate Questions'}
                      </button>
                    </div>

                    {!loading && quizData && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-medium truncate">{quizData.topicTitle}</span>
                          <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                            Score {correctCount}/{answeredCount} ({quizData.questions.length} total)
                          </span>
                        </div>

                        {quizData.questions.map((q, qIdx) => {
                          const chosen = selectedAnswers[qIdx];
                          const isAnswered = chosen !== undefined;
                          const isSaved = Boolean(savedFlashcards[qIdx]);
                          return (
                            <div
                              key={qIdx}
                              className="rounded-xl bg-slate-50 dark:bg-white/[0.025] border border-slate-200/80 dark:border-white/[0.07] p-4 space-y-3"
                            >
                              <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                                <span className="font-mono text-xs text-[#7C3AED] dark:text-[#A78BFA] mr-1.5">
                                  Q{qIdx + 1}.
                                </span>
                                {q.question}
                              </p>

                              <div className="space-y-2">
                                {q.options.map((opt, oIdx) => {
                                  const isChosen = chosen === oIdx;
                                  const isCorrect = oIdx === q.correctIndex;
                                  let cls =
                                    'bg-white dark:bg-[#0B0B1A] border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 hover:border-[#7C3AED]/50';
                                  if (isAnswered) {
                                    if (isCorrect) {
                                      cls =
                                        'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500/50 text-emerald-900 dark:text-emerald-200';
                                    } else if (isChosen) {
                                      cls =
                                        'bg-rose-50 dark:bg-rose-500/15 border-rose-500/50 text-rose-900 dark:text-rose-200';
                                    } else {
                                      cls =
                                        'bg-white/50 dark:bg-white/[0.015] border-slate-200/50 dark:border-white/[0.05] text-slate-400';
                                    }
                                  }
                                  return (
                                    <button
                                      key={oIdx}
                                      type="button"
                                      disabled={isAnswered}
                                      onClick={() =>
                                        setSelectedAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))
                                      }
                                      className={`w-full text-left px-3.5 py-2.5 min-h-[42px] rounded-xl border text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer disabled:cursor-default ${cls}`}
                                    >
                                      <span>{opt}</span>
                                      {isAnswered && isCorrect && (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                      )}
                                      {isAnswered && isChosen && !isCorrect && (
                                        <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>

                              {isAnswered && (
                                <div className="pt-2 border-t border-slate-200/70 dark:border-white/[0.06] space-y-2">
                                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                      Explanation:{' '}
                                    </span>
                                    {q.explanation}
                                  </p>
                                  <button
                                    type="button"
                                    disabled={isSaved}
                                    onClick={() => handleSaveQuestionAsFlashcard(qIdx, q)}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED] dark:text-[#A78BFA] hover:underline disabled:text-emerald-600 dark:disabled:text-emerald-400 cursor-pointer"
                                  >
                                    <Layers className="w-3.5 h-3.5" />
                                    {isSaved ? 'Saved to Flashcards' : 'Save as Flashcard'}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: EXPLAIN CONCEPT */}
                {workspaceTab === 'explain' && (
                  <div className="space-y-4">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void runExplain();
                      }}
                      className="rounded-xl bg-slate-50 dark:bg-[#0B0B1A] border border-slate-200/80 dark:border-white/[0.07] p-4 space-y-3"
                    >
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={conceptInput}
                          onChange={(e) => setConceptInput(e.target.value)}
                          placeholder="Enter any concept to clarify..."
                          className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#111124] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED]"
                        />
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-4 min-h-[42px] rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-60 text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                        >
                          {loading ? 'Explaining...' : 'Explain'}
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-200/70 dark:bg-white/[0.05]">
                          {(['brief', 'intuitive', 'step-by-step'] as const).map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setDepth(d)}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize cursor-pointer ${
                                depth === d
                                  ? 'bg-[#7C3AED] text-white'
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>

                        {activeSource.suggestedConcepts.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {activeSource.suggestedConcepts.slice(0, 4).map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => {
                                  setConceptInput(c);
                                  void runExplain(c);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.09] hover:border-[#7C3AED] text-[11px] text-slate-700 dark:text-slate-200 cursor-pointer"
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </form>

                    {!loading && explanationData && (
                      <div className="space-y-3.5">
                        <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.07] p-4 space-y-1.5">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {explanationData.concept}
                          </h3>
                          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                            {explanationData.briefExplanation}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="rounded-xl bg-gradient-to-br from-[#7C3AED]/10 to-transparent dark:from-[#1B1339] dark:to-[#111124] border border-[#7C3AED]/25 p-4 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED] dark:text-[#C4B5FD]">
                              <Lightbulb className="w-3.5 h-3.5" />
                              <span>Intuition / Analogy</span>
                            </div>
                            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                              {explanationData.analogy}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.07] p-4 space-y-1">
                            <h4 className="text-xs font-semibold text-[#0891B2] dark:text-[#22D3EE]">
                              Worked Example
                            </h4>
                            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                              {explanationData.example}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-xl bg-amber-50/70 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/25 p-4 space-y-1">
                          <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                            Common Pitfall to Avoid
                          </h4>
                          <p className="text-xs leading-relaxed text-amber-900/85 dark:text-amber-200/85">
                            {explanationData.commonMistake}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleSaveExplanationAsNote}
                          className="w-full py-3 min-h-[44px] rounded-xl bg-[#7C3AED]/10 hover:bg-[#7C3AED] text-[#6D28D9] hover:text-white dark:bg-white/[0.08] dark:hover:bg-white/[0.14] dark:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          Save Explanation to My Notes
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: CONTEXT-AWARE ASK TUTOR CHAT */}
                {workspaceTab === 'chat' && (
                  <div className="flex flex-col h-[460px] rounded-xl bg-slate-50 dark:bg-[#0B0B1A] border border-slate-200/80 dark:border-white/[0.07] overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                      {chatHistory.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-4">
                          <div className="w-11 h-11 rounded-2xl bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#C4B5FD] flex items-center justify-center">
                            <Brain className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              Ask anything about “{activeSource.title}”
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Your tutor reads your selected note or syllabus topics automatically.
                            </p>
                          </div>
                          <div className="flex flex-wrap justify-center gap-2 max-w-md">
                            {[
                              'Give me a 60-second exam cheat sheet',
                              'What are the top 3 exam pitfalls here?',
                              'Quiz me with one short-answer question',
                            ].map((prompt) => (
                              <button
                                key={prompt}
                                type="button"
                                onClick={() => void runChat(prompt)}
                                className="px-3 py-2 rounded-xl bg-white dark:bg-[#111124] border border-slate-200 dark:border-white/[0.09] hover:border-[#7C3AED] text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
                              >
                                {prompt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <>
                          {chatHistory.map((turn, idx) => (
                            <div
                              key={idx}
                              className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-line ${
                                  turn.role === 'user'
                                    ? 'bg-[#7C3AED] text-white rounded-br-sm'
                                    : 'bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] text-slate-800 dark:text-slate-100 rounded-bl-sm'
                                }`}
                              >
                                {turn.text}
                              </div>
                            </div>
                          ))}
                          {loading && (
                            <div className="flex justify-start">
                              <div className="rounded-2xl px-4 py-3 bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] flex items-center gap-2 text-xs text-slate-500">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#7C3AED]" />
                                Thinking...
                              </div>
                            </div>
                          )}
                          <div ref={chatEndRef} />
                        </>
                      )}
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void runChat();
                      }}
                      className="p-3 border-t border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#111124] flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={`Ask a question about ${activeSource.title}...`}
                        className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0B1A] border border-slate-200 dark:border-white/[0.09] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED]"
                      />
                      <button
                        type="submit"
                        disabled={loading || !chatInput.trim()}
                        aria-label="Send question"
                        className="w-10 h-10 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white flex items-center justify-center shrink-0 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
