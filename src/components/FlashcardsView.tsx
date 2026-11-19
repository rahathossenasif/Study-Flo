import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  RotateCw,
  Plus,
  Trash2,
  Layers,
  CheckCircle2,
  Atom,
  X,
  HelpCircle,
} from 'lucide-react';
import { useStudyFlow } from '../context/StudyFlowContext';
import { CircularProgress } from './CircularProgress';
import { FlashcardRating, SubjectAccent } from '../types/studyflow';
import { isCardDue, previewIntervals, formatIntervalDays } from '../utils/sm2';

export function FlashcardsView() {
  const {
    state,
    metrics,
    createDeck,
    deleteDeck,
    addFlashcard,
    deleteFlashcard,
    reviewFlashcard,
  } = useStudyFlow();

  const [selectedDeckId, setSelectedDeckId] = useState<string>('all');
  const [practiceAllMode, setPracticeAllMode] = useState<boolean>(false);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [cardIndex, setCardIndex] = useState<number>(0);

  // Forms
  const [showNewDeckForm, setShowNewDeckForm] = useState(false);
  const [deckTitle, setDeckTitle] = useState('');
  const [deckDesc, setDeckDesc] = useState('');
  const [deckSubjectId, setDeckSubjectId] = useState(state.subjects[0]?.id ?? '');
  const [deckAccent, setDeckAccent] = useState<SubjectAccent>('purple');

  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [cardDeckId, setCardDeckId] = useState(state.decks[0]?.id ?? '');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [hint, setHint] = useState('');

  const scopedCards = useMemo(() => {
    return selectedDeckId === 'all'
      ? state.flashcards
      : state.flashcards.filter((c) => c.deckId === selectedDeckId);
  }, [state.flashcards, selectedDeckId]);

  const reviewQueue = useMemo(() => {
    const due = scopedCards.filter((c) => isCardDue(c));
    return practiceAllMode ? scopedCards : due;
  }, [scopedCards, practiceAllMode]);

  const currentCard = reviewQueue[cardIndex % Math.max(1, reviewQueue.length)] ?? null;
  const intervals = useMemo(
    () => (currentCard ? previewIntervals(currentCard) : null),
    [currentCard]
  );

  const memorizedCount = scopedCards.filter((c) => c.repetitions >= 2).length;
  const memorizationPct =
    scopedCards.length === 0 ? 0 : Math.round((memorizedCount / scopedCards.length) * 100);

  const handleRate = useCallback(
    (rating: FlashcardRating) => {
      if (!currentCard) return;
      reviewFlashcard(currentCard.id, rating);
      setIsFlipped(false);
      setShowHint(false);
      if (practiceAllMode) {
        setCardIndex((i) => (i + 1) % Math.max(1, reviewQueue.length));
      } else {
        setCardIndex(0);
      }
    },
    [currentCard, reviewFlashcard, practiceAllMode, reviewQueue.length]
  );

  // Keyboard shortcuts (Space to flip, 1-4 to rate)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (!currentCard) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (isFlipped) {
        if (e.key === '1') handleRate('again');
        if (e.key === '2') handleRate('hard');
        if (e.key === '3') handleRate('good');
        if (e.key === '4') handleRate('easy');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentCard, isFlipped, handleRate]);

  const handleCreateDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckTitle.trim()) return;
    createDeck(deckTitle, deckSubjectId || state.subjects[0]?.id || '', deckDesc, deckAccent);
    setDeckTitle('');
    setDeckDesc('');
    setShowNewDeckForm(false);
  };

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    const targetDeck = cardDeckId || state.decks[0]?.id;
    if (!targetDeck || !question.trim() || !answer.trim()) return;
    addFlashcard(targetDeck, question, answer, hint);
    setQuestion('');
    setAnswer('');
    setHint('');
    setShowNewCardForm(false);
  };

  const deckLookup = Object.fromEntries(state.decks.map((d) => [d.id, d]));

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Flashcards & Spaced Repetition
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Active recall powered by SM-2 revision scheduling · Press Space to flip
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowNewDeckForm((v) => !v);
              setShowNewCardForm(false);
            }}
            className="px-3.5 py-2.5 min-h-[44px] rounded-xl bg-white dark:bg-[#111124] border border-slate-200 dark:border-white/[0.1] text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-[#7C3AED] transition-colors whitespace-nowrap cursor-pointer"
          >
            + New Deck
          </button>
          <button
            type="button"
            onClick={() => {
              setCardDeckId(selectedDeckId !== 'all' ? selectedDeckId : state.decks[0]?.id ?? '');
              setShowNewCardForm((v) => !v);
              setShowNewDeckForm(false);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Card
          </button>
        </div>
      </div>

      {/* Create Deck Form */}
      {showNewDeckForm && (
        <form
          onSubmit={handleCreateDeck}
          className="rounded-2xl bg-white dark:bg-[#111124] border border-[#7C3AED]/40 p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Create Flashcard Deck</h2>
            <button type="button" onClick={() => setShowNewDeckForm(false)} className="text-slate-400 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={deckTitle}
              onChange={(e) => setDeckTitle(e.target.value)}
              placeholder="Deck title (e.g. Organic Reactions)"
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
            />
            <select
              value={deckSubjectId}
              onChange={(e) => setDeckSubjectId(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#191933] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white"
            >
              {state.subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
            <select
              value={deckAccent}
              onChange={(e) => setDeckAccent(e.target.value as SubjectAccent)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#191933] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white"
            >
              <option value="purple">Electric Purple</option>
              <option value="cyan">Cyan</option>
              <option value="amber">Amber</option>
              <option value="emerald">Emerald</option>
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={deckDesc}
              onChange={(e) => setDeckDesc(e.target.value)}
              placeholder="Short description..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold cursor-pointer"
            >
              Create Deck
            </button>
          </div>
        </form>
      )}

      {/* Add Card Form */}
      {showNewCardForm && (
        <form
          onSubmit={handleCreateCard}
          className="rounded-2xl bg-white dark:bg-[#111124] border border-[#7C3AED]/40 p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Add New Flashcard</h2>
            <button type="button" onClick={() => setShowNewCardForm(false)} className="text-slate-400 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={cardDeckId}
              onChange={(e) => setCardDeckId(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#191933] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white"
            >
              {state.decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="Optional memory hint..."
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
            />
          </div>
          <textarea
            required
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Question / Front of card..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
          />
          <textarea
            required
            rows={2}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Answer / Back of card..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold cursor-pointer"
            >
              Save Flashcard
            </button>
          </div>
        </form>
      )}

      {/* Deck Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => {
            setSelectedDeckId('all');
            setIsFlipped(false);
            setCardIndex(0);
          }}
          className={`px-4 py-2 min-h-[40px] rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            selectedDeckId === 'all'
              ? 'bg-[#7C3AED] text-white'
              : 'bg-white dark:bg-[#111124] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300'
          }`}
        >
          All Decks ({state.flashcards.length})
        </button>
        {state.decks.map((deck) => {
          const dueInDeck = state.flashcards.filter((c) => c.deckId === deck.id && isCardDue(c)).length;
          return (
            <button
              key={deck.id}
              type="button"
              onClick={() => {
                setSelectedDeckId(deck.id);
                setIsFlipped(false);
                setCardIndex(0);
              }}
              className={`px-4 py-2 min-h-[40px] rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer ${
                selectedDeckId === deck.id
                  ? 'bg-[#7C3AED] text-white'
                  : 'bg-white dark:bg-[#111124] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>{deck.title}</span>
              <span className="font-mono text-[11px] opacity-80">{dueInDeck} due</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Interactive Flip Stage */}
        <div className="lg:col-span-7 space-y-5">
          {/* Due Today & Revised Today Summary Rings */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] p-4 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Due Today</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white mt-0.5">
                  {metrics.dueFlashcardsCount}
                </p>
              </div>
              <CircularProgress
                value={
                  state.flashcards.length === 0
                    ? 0
                    : (metrics.dueFlashcardsCount / state.flashcards.length) * 100
                }
                size={52}
                strokeWidth={5}
                label={`${metrics.dueFlashcardsCount}`}
                gradientFrom="#F59E0B"
                gradientTo="#7C3AED"
              />
            </div>

            <div className="rounded-2xl bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] p-4 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Revised</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white mt-0.5">
                  {state.revisedTodayCount}
                </p>
              </div>
              <CircularProgress
                value={Math.min(100, (state.revisedTodayCount / 20) * 100)}
                size={52}
                strokeWidth={5}
                label={`${state.revisedTodayCount}`}
                gradientFrom="#10B981"
                gradientTo="#06B6D4"
              />
            </div>

            <div className="rounded-2xl bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] p-4 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Memorized</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white mt-0.5">
                  {memorizationPct}%
                </p>
              </div>
              <CircularProgress
                value={memorizationPct}
                size={52}
                strokeWidth={5}
                gradientFrom="#06B6D4"
                gradientTo="#7C3AED"
              />
            </div>
          </div>

          {/* 3D Flip Card Stage */}
          {!currentCard ? (
            <div className="rounded-3xl bg-gradient-to-br from-[#7C3AED]/10 via-white to-white dark:from-[#1B1339] dark:via-[#111124] dark:to-[#111124] border border-slate-200 dark:border-white/[0.08] p-10 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                All caught up for today!
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Every scheduled flashcard in this view has been reviewed. Your next intervals are set via SM-2 spaced repetition.
              </p>
              {scopedCards.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPracticeAllMode(true);
                    setCardIndex(0);
                    setIsFlipped(false);
                  }}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold cursor-pointer"
                >
                  Practice All {scopedCards.length} Cards Anyway
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                <span>
                  {deckLookup[currentCard.deckId]?.title ?? 'Deck'} ·{' '}
                  {practiceAllMode ? 'Free Practice' : 'Due Queue'}
                </span>
                <span className="font-mono tabular-nums">
                  {(cardIndex % reviewQueue.length) + 1} / {reviewQueue.length}
                </span>
              </div>

              <div
                onClick={() => setIsFlipped((f) => !f)}
                className="perspective-1000 cursor-pointer select-none"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsFlipped((f) => !f);
                }}
                aria-label="Flip flashcard"
              >
                <div
                  className={`relative w-full min-h-[300px] sm:min-h-[330px] preserve-3d transition-transform duration-500 ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* Front Side */}
                  <div className="absolute inset-0 backface-hidden rounded-3xl bg-gradient-to-br from-white via-[#F6F3FF] to-[#EEF2FF] dark:from-[#23194F] dark:via-[#151430] dark:to-[#0F1024] border border-[#7C3AED]/25 dark:border-[#7C3AED]/35 p-7 sm:p-9 flex flex-col items-center justify-between text-center shadow-[0_16px_38px_-12px_rgba(124,58,237,0.16)] dark:shadow-xl dark:shadow-black/25">
                    <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/12 dark:bg-[#7C3AED]/20 border border-[#7C3AED]/20 dark:border-[#7C3AED]/30 flex items-center justify-center text-[#7C3AED] dark:text-[#C4B5FD]">
                      <Atom className="w-6 h-6" />
                    </div>

                    <div className="my-4 max-w-lg">
                      <p className="text-xs font-semibold text-[#7C3AED] dark:text-purple-300/80 mb-2">
                        Question
                      </p>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                        {currentCard.question}
                      </h2>
                      {currentCard.hint && showHint && (
                        <p className="mt-4 text-xs text-cyan-800 dark:text-cyan-200/90 bg-cyan-500/10 dark:bg-white/[0.06] border border-cyan-500/20 dark:border-transparent rounded-xl px-3.5 py-2">
                          Hint: {currentCard.hint}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
                      {currentCard.hint && !showHint && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowHint(true);
                          }}
                          className="inline-flex items-center gap-1 text-[#0891B2] dark:text-cyan-300 hover:underline font-medium cursor-pointer"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          Show hint
                        </button>
                      )}
                      <span className="text-slate-500 dark:text-slate-400">
                        Tap card or press Space to reveal answer
                      </span>
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-3xl bg-gradient-to-br from-[#F0FDFA] via-white to-[#EEF2FF] dark:from-[#132238] dark:via-[#13152E] dark:to-[#111124] border border-[#06B6D4]/30 dark:border-[#06B6D4]/40 p-7 sm:p-9 flex flex-col items-center justify-between text-center shadow-[0_16px_38px_-12px_rgba(6,182,212,0.16)] dark:shadow-xl dark:shadow-black/25">
                    <span className="text-xs font-semibold text-[#0891B2] dark:text-[#22D3EE]">
                      Answer
                    </span>
                    <div className="my-4 max-w-lg">
                      <p className="text-base sm:text-lg font-medium text-slate-900 dark:text-white leading-relaxed">
                        {currentCard.answer}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Rate recall below to schedule your next revision
                    </p>
                  </div>
                </div>
              </div>

              {/* Flip Button OR Spaced Repetition Rating Buttons */}
              {!isFlipped ? (
                <button
                  type="button"
                  onClick={() => setIsFlipped(true)}
                  className="w-full py-3.5 min-h-[48px] rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#7C3AED]/25 transition-colors cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                  Flip Card
                </button>
              ) : (
                <div className="grid grid-cols-4 gap-2.5">
                  {(
                    [
                      {
                        rating: 'again' as const,
                        label: 'Again',
                        cls: 'bg-rose-600 hover:bg-rose-500 text-white',
                      },
                      {
                        rating: 'hard' as const,
                        label: 'Hard',
                        cls: 'bg-amber-600 hover:bg-amber-500 text-white',
                      },
                      {
                        rating: 'good' as const,
                        label: 'Good',
                        cls: 'bg-emerald-600 hover:bg-emerald-500 text-white',
                      },
                      {
                        rating: 'easy' as const,
                        label: 'Easy',
                        cls: 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white',
                      },
                    ]
                  ).map((btn) => (
                    <button
                      key={btn.rating}
                      type="button"
                      onClick={() => handleRate(btn.rating)}
                      className={`py-3 px-2 min-h-[56px] rounded-2xl font-semibold text-xs flex flex-col items-center justify-center gap-0.5 transition-transform active:scale-95 cursor-pointer ${btn.cls}`}
                    >
                      <span>{btn.label}</span>
                      <span className="font-mono text-[11px] opacity-90 tabular-nums">
                        {intervals ? intervals[btn.rating] : '1d'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Side Column: Deck Inventory & Cards List */}
        <aside className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] p-5">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Cards in View ({scopedCards.length})
                </h3>
              </div>
              {selectedDeckId !== 'all' && (
                <button
                  type="button"
                  onClick={() => {
                    deleteDeck(selectedDeckId);
                    setSelectedDeckId('all');
                  }}
                  className="text-xs text-slate-400 hover:text-rose-500 cursor-pointer"
                >
                  Delete deck
                </button>
              )}
            </div>

            {scopedCards.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
                No cards in this deck yet. Click "+ Add Card" to create one.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-white/[0.06] max-h-[380px] overflow-y-auto pr-1">
                {scopedCards.map((card) => {
                  const due = isCardDue(card);
                  return (
                    <li key={card.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 group">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2">
                          {card.question}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          <span className={due ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-emerald-600 dark:text-emerald-400'}>
                            {due ? 'Due now' : `Next in ${formatIntervalDays(card.intervalDays)}`}
                          </span>
                          <span className="mx-1.5" aria-hidden="true">·</span>
                          <span>Ease {card.easeFactor.toFixed(1)}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteFlashcard(card.id)}
                        aria-label="Delete flashcard"
                        className="opacity-60 sm:opacity-0 sm:group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
