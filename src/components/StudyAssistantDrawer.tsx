import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  HelpCircle,
  BookOpen,
  Loader2,
  CheckCircle2,
  XCircle,
  Plus,
  RotateCcw,
  AlertCircle,
  Layers,
  Send,
  Lightbulb,
} from 'lucide-react';
import {
  requestNoteSummary,
  requestPracticeQuestions,
  requestConceptExplanation,
  NoteSummaryResponse,
  PracticeQuestionsResponse,
  ConceptExplanationResponse,
  PracticeQuestion,
} from '../services/aiAssistant';
import { useStudyFlow } from '../context/StudyFlowContext';

export type AssistantTab = 'summarize' | 'quiz' | 'explain';

export interface AssistantContextPayload {
  sourceType: 'note' | 'syllabus';
  subjectId: string;
  subjectName: string;
  title: string;
  content: string;
  noteId?: string;
  suggestedConcepts?: string[];
  initialConcept?: string;
}

interface StudyAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab: AssistantTab;
  context: AssistantContextPayload;
  autoRun?: boolean;
}

export function StudyAssistantDrawer({
  isOpen,
  onClose,
  initialTab,
  context,
  autoRun = false,
}: StudyAssistantDrawerProps) {
  const { state, t, updateNote, createNote, addFlashcard, createDeck, showToast } = useStudyFlow();
  const appLang = state.profile.language ?? 'en';
  const isBn = appLang === 'bn';

  const [tab, setTab] = useState<AssistantTab>(initialTab);
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
  const [conceptInput, setConceptInput] = useState<string>(context.initialConcept ?? '');
  const [depth, setDepth] = useState<'brief' | 'intuitive' | 'step-by-step'>('brief');
  const [explanationData, setExplanationData] = useState<ConceptExplanationResponse | null>(null);

  // Sync incoming props when drawer opens or target changes
  useEffect(() => {
    if (!isOpen) return;
    setTab(initialTab);
    setError(null);
    setSummaryData(null);
    setQuizData(null);
    setSelectedAnswers({});
    setSavedFlashcards({});
    setExplanationData(null);
    setConceptInput(context.initialConcept ?? '');
  }, [isOpen, initialTab, context.title, context.noteId, context.initialConcept]);

  const runSummarize = async (langOverride?: 'bn' | 'en') => {
    const activeLang = langOverride ?? summaryLang;
    if (!context.content.trim()) {
      setError(
        isBn
          ? 'এই নোটে এখনো কোনো লেখা নেই। সারাংশ তৈরি করতে আগে কিছু লেখা যোগ করুন।'
          : 'This item has no text content yet. Add a few lines or topics first to summarize.'
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await requestNoteSummary({
        sourceType: context.sourceType,
        title: context.title,
        subjectName: context.subjectName,
        content: context.content,
        language: activeLang,
      });
      setSummaryData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to summarize right now.');
    } finally {
      setLoading(false);
    }
  };

  const runPracticeQuiz = async (
    diffOverride?: 'foundational' | 'exam' | 'challenge',
    countOverride?: number
  ) => {
    setLoading(true);
    setError(null);
    setSelectedAnswers({});
    setSavedFlashcards({});
    try {
      const res = await requestPracticeQuestions({
        sourceType: context.sourceType,
        title: context.title,
        subjectName: context.subjectName,
        contextText: context.content || context.title,
        count: countOverride ?? questionCount,
        difficulty: diffOverride ?? difficulty,
        language: appLang,
      });
      setQuizData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate practice questions.');
    } finally {
      setLoading(false);
    }
  };

  const runExplain = async (conceptOverride?: string, depthOverride?: 'brief' | 'intuitive' | 'step-by-step') => {
    const query = (conceptOverride ?? conceptInput).trim();
    if (!query) {
      setError(
        isBn
          ? 'যেকোনো টপিক লিখুন অথবা নিচের সাজেশন থেকে বেছে নিন।'
          : 'Enter a concept or pick one from the suggestions below.'
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await requestConceptExplanation({
        concept: query,
        subjectName: context.subjectName,
        contextText: context.content,
        depth: depthOverride ?? depth,
        language: appLang,
      });
      setExplanationData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to explain concept right now.');
    } finally {
      setLoading(false);
    }
  };

  // Optional auto-run when user clicks a targeted action button (e.g. "Summarize" or "Explain topic")
  useEffect(() => {
    if (!isOpen || !autoRun) return;
    if (initialTab === 'summarize' && context.content.trim()) {
      void runSummarize();
    } else if (initialTab === 'quiz') {
      void runPracticeQuiz();
    } else if (initialTab === 'explain' && context.initialConcept?.trim()) {
      void runExplain(context.initialConcept);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, autoRun, initialTab, context.title, context.initialConcept]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAppendSummaryToNote = () => {
    if (!summaryData) return;
    const formatted = [
      summaryData.summary,
      '',
      'Key Takeaways:',
      ...summaryData.keyTakeaways.map((t) => `• ${t}`),
    ].join('\n');

    if (context.noteId) {
      const existing = state.notes.find((n) => n.id === context.noteId);
      if (existing) {
        updateNote(existing.id, {
          content: `${existing.content.trimEnd()}\n\n---\nAI Study Summary:\n${formatted}`,
        });
        showToast('Summary appended to your note');
        return;
      }
    }
    createNote(`Summary: ${context.title}`, formatted, context.subjectId, 'purple', false);
    showToast('Saved syllabus summary to My Notes');
  };

  const handleSaveQuestionAsFlashcard = (idx: number, q: PracticeQuestion) => {
    let targetDeck = state.decks.find((d) => d.subjectId === context.subjectId) ?? state.decks[0];
    if (!targetDeck) {
      createDeck(`${context.subjectName} Practice`, context.subjectId, 'AI-generated study questions', 'purple');
      showToast('Deck created — click Save to Flashcards once more to add card');
      return;
    }
    addFlashcard(targetDeck.id, q.question, q.flashcardAnswer || q.explanation);
    setSavedFlashcards((prev) => ({ ...prev, [idx]: true }));
  };

  const handleSaveExplanationAsNote = () => {
    if (!explanationData) return;
    const body = [
      explanationData.briefExplanation,
      '',
      `Intuition / Analogy:\n${explanationData.analogy}`,
      '',
      `Example:\n${explanationData.example}`,
      '',
      `Common Pitfall:\n${explanationData.commonMistake}`,
    ].join('\n');
    createNote(explanationData.concept, body, context.subjectId, 'cyan', false);
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
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="STUDYFLO AI Assistant">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/55 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-Over Panel */}
      <div className="relative z-10 w-full max-w-xl bg-white dark:bg-[#0B0B1A] border-l border-slate-200 dark:border-white/[0.09] h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
              {t.assistant.title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {context.subjectName} · {context.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI Study Assistant"
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-white/[0.06] shrink-0">
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#111124] border border-slate-200/70 dark:border-white/[0.07]">
            {(
              [
                {
                  id: 'summarize' as const,
                  label: t.assistant.summarize,
                  icon: FileText,
                  disabled: context.sourceType === 'syllabus' && !context.content.trim(),
                },
                { id: 'quiz' as const, label: t.assistant.quiz, icon: HelpCircle, disabled: false },
                { id: 'explain' as const, label: t.assistant.explain, icon: BookOpen, disabled: false },
              ]
            ).map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    setTab(item.id);
                    setError(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    active
                      ? 'bg-[#7C3AED] text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Error Banner */}
          {error && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-3.5 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          {/* TAB 1: SUMMARIZE */}
          {tab === 'summarize' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {isBn ? 'উৎস:' : 'Source:'} {context.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                      {context.content.trim().split(/\s+/).filter(Boolean).length}{' '}
                      {summaryLang === 'bn'
                        ? 'টি শব্দ · বাংলা সারাংশ'
                        : 'words · English summary'}
                    </p>
                  </div>

                  {/* Summary Language Switcher (Defaults to Bangla) */}
                  <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-200/75 dark:bg-white/[0.06] shrink-0">
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
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                          summaryLang === lang
                            ? 'bg-[#7C3AED] text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {lang === 'bn' ? 'বাংলা' : 'EN'}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void runSummarize()}
                  className="w-full px-4 py-2.5 min-h-[42px] rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-60 text-white text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors"
                >
                  {loading
                    ? summaryLang === 'bn'
                      ? 'বাংলায় সারাংশ তৈরি হচ্ছে...'
                      : 'Summarizing...'
                    : summaryData
                      ? summaryLang === 'bn'
                        ? 'আবার সারাংশ তৈরি করুন'
                        : 'Regenerate Summary'
                      : summaryLang === 'bn'
                        ? 'বাংলায় সারাংশ তৈরি করুন'
                        : t.assistant.summarizeBtn}
                </button>
              </div>

              {loading && (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-[#7C3AED]" />
                  <p className="text-xs">
                    {summaryLang === 'bn'
                      ? 'মূল পয়েন্টগুলো বাংলায় সাজানো হচ্ছে...'
                      : 'Distilling key concepts and takeaways...'}
                  </p>
                </div>
              )}

              {!loading && summaryData && (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] p-4 space-y-2">
                    <h3 className="text-xs font-semibold text-[#7C3AED] dark:text-[#A78BFA]">
                      {summaryLang === 'bn' ? 'মূল সারাংশ (বাংলা)' : 'Executive Summary'}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                      {summaryData.summary}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] p-4 space-y-2.5">
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                      {summaryLang === 'bn' ? 'গুরুত্বপূর্ণ পয়েন্টসমূহ' : 'Key Takeaways'}
                    </h3>
                    <ul className="space-y-2">
                      {summaryData.keyTakeaways.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          <span className="font-mono text-xs font-semibold text-[#06B6D4] mt-0.5 shrink-0">
                            0{idx + 1}.
                          </span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {summaryData.keyTerms.length > 0 && (
                    <div className="rounded-2xl bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] p-4 space-y-3">
                      <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                        {summaryLang === 'bn' ? 'গুরুত্বপূর্ণ শব্দ ও সূত্র' : 'Key Terms & Formulas'}
                      </h3>
                      <dl className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                        {summaryData.keyTerms.map((item, idx) => (
                          <div key={idx} className="py-2.5 first:pt-0 last:pb-0">
                            <dt className="text-xs font-semibold text-slate-900 dark:text-white">
                              {item.term}
                            </dt>
                            <dd className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                              {item.definition}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAppendSummaryToNote}
                    className="w-full py-3 min-h-[44px] rounded-xl bg-[#7C3AED]/10 hover:bg-[#7C3AED] text-[#6D28D9] hover:text-white dark:bg-white/[0.08] dark:hover:bg-white/[0.14] dark:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    {context.noteId ? t.assistant.appendToNote : t.assistant.saveAsNote}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PRACTICE QUESTIONS */}
          {tab === 'quiz' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-200/70 dark:bg-white/[0.05]">
                    {(['foundational', 'exam', 'challenge'] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setDifficulty(level)}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors cursor-pointer ${
                          difficulty === level
                            ? 'bg-[#7C3AED] text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>

                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    aria-label="Number of questions"
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#191933] border border-slate-200 dark:border-white/[0.1] text-xs font-mono text-slate-800 dark:text-slate-200"
                  >
                    <option value={3}>3 questions</option>
                    <option value={4}>4 questions</option>
                    <option value={5}>5 questions</option>
                  </select>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void runPracticeQuiz()}
                  className="w-full py-2.5 min-h-[42px] rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-60 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Practice Questions...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      {quizData ? 'Generate Fresh Questions' : 'Generate Practice Questions'}
                    </>
                  )}
                </button>
              </div>

              {quizData && !loading && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                    <span className="truncate font-medium">{quizData.topicTitle}</span>
                    <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white shrink-0">
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
                        className="rounded-2xl bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                            <span className="font-mono text-xs text-[#7C3AED] dark:text-[#A78BFA] mr-1.5">
                              Q{qIdx + 1}.
                            </span>
                            {q.question}
                          </p>
                        </div>

                        <div className="space-y-2">
                          {q.options.map((opt, oIdx) => {
                            const isThisChosen = chosen === oIdx;
                            const isCorrectOption = oIdx === q.correctIndex;
                            let optStyle =
                              'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 hover:border-[#7C3AED]/50';

                            if (isAnswered) {
                              if (isCorrectOption) {
                                optStyle =
                                  'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500/50 text-emerald-900 dark:text-emerald-200';
                              } else if (isThisChosen) {
                                optStyle =
                                  'bg-rose-50 dark:bg-rose-500/15 border-rose-500/50 text-rose-900 dark:text-rose-200';
                              } else {
                                optStyle =
                                  'bg-slate-50/50 dark:bg-white/[0.015] border-slate-200/50 dark:border-white/[0.05] text-slate-400 dark:text-slate-500';
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
                                className={`w-full text-left px-3.5 py-2.5 min-h-[42px] rounded-xl border text-xs leading-snug flex items-center justify-between gap-2 transition-colors cursor-pointer disabled:cursor-default ${optStyle}`}
                              >
                                <span>{opt}</span>
                                {isAnswered && isCorrectOption && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                )}
                                {isAnswered && isThisChosen && !isCorrectOption && (
                                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {isAnswered && (
                          <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] space-y-2.5">
                            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                Rationale:{' '}
                              </span>
                              {q.explanation}
                            </p>
                            <button
                              type="button"
                              disabled={isSaved}
                              onClick={() => handleSaveQuestionAsFlashcard(qIdx, q)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED] dark:text-[#A78BFA] hover:underline disabled:text-emerald-600 dark:disabled:text-emerald-400 disabled:no-underline cursor-pointer"
                            >
                              <Layers className="w-3.5 h-3.5" />
                              {isSaved ? 'Saved to Flashcards deck' : 'Save as Flashcard'}
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
          {tab === 'explain' && (
            <div className="space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void runExplain();
                }}
                className="rounded-2xl bg-slate-50 dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] p-4 space-y-3"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={conceptInput}
                    onChange={(e) => setConceptInput(e.target.value)}
                    placeholder="Ask about any concept (e.g. Eigenvalues, Lenz's Law)..."
                    className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#0B0B1A] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED]"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    aria-label="Explain concept"
                    className="w-11 h-11 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-60 text-white flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Style:</span>
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-200/70 dark:bg-white/[0.05]">
                    {(
                      [
                        { id: 'brief', label: 'Brief' },
                        { id: 'intuitive', label: 'Intuitive' },
                        { id: 'step-by-step', label: 'Step-by-step' },
                      ] as const
                    ).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setDepth(st.id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                          depth === st.id
                            ? 'bg-[#7C3AED] text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {context.suggestedConcepts && context.suggestedConcepts.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/70 dark:border-white/[0.06]">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                      Quick explain from this {context.sourceType}:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {context.suggestedConcepts.slice(0, 6).map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            setConceptInput(item);
                            void runExplain(item);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.09] hover:border-[#7C3AED] text-xs text-slate-700 dark:text-slate-200 transition-colors cursor-pointer text-left"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </form>

              {loading && (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-[#7C3AED]" />
                  <p className="text-xs">Preparing a clear concept breakdown...</p>
                </div>
              )}

              {!loading && explanationData && (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] p-4 space-y-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {explanationData.concept}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                      {explanationData.briefExplanation}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-br from-[#7C3AED]/10 to-white dark:from-[#1B1339] dark:to-[#111124] border border-[#7C3AED]/25 p-4 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED] dark:text-[#C4B5FD]">
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Mental Model / Analogy</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                      {explanationData.analogy}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] p-4 space-y-1.5">
                    <h4 className="text-xs font-semibold text-[#0891B2] dark:text-[#22D3EE]">
                      Concrete Example
                    </h4>
                    <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                      {explanationData.example}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/25 p-4 space-y-1.5">
                    <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                      Common Misconception to Avoid
                    </h4>
                    <p className="text-xs leading-relaxed text-amber-900/80 dark:text-amber-200/85">
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
        </div>
      </div>
    </div>
  );
}
