import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Pin,
  Trash2,
  FileText,
  X,
  CheckSquare,
  Check,
  Brain,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { useStudyFlow } from '../context/StudyFlowContext';
import { NoteTint, StudyNote } from '../types/studyflow';
import { NOTE_TINTS } from '../utils/accentStyles';
import {
  StudyAssistantDrawer,
  AssistantTab,
  AssistantContextPayload,
} from './StudyAssistantDrawer';

const TINT_OPTIONS: NoteTint[] = ['amber', 'indigo', 'purple', 'cyan', 'emerald'];

export function NotesView() {
  const { state, createNote, updateNote, deleteNote, showToast } = useStudyFlow();

  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [saveBadge, setSaveBadge] = useState<string>('');
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantTab, setAssistantTab] = useState<AssistantTab>('summarize');
  const [assistantAutoRun, setAssistantAutoRun] = useState(false);
  const [assistantTargetNote, setAssistantTargetNote] = useState<StudyNote | null>(null);

  const subjectMap = useMemo(
    () => Object.fromEntries(state.subjects.map((s) => [s.id, s])),
    [state.subjects]
  );

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...state.notes]
      .filter((note) => {
        const matchesSub = subjectFilter === 'all' || note.subjectId === subjectFilter;
        const matchesQ =
          !q ||
          note.title.toLowerCase().includes(q) ||
          note.content.toLowerCase().includes(q);
        return matchesSub && matchesQ;
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [state.notes, subjectFilter, searchQuery]);

  const activeNote = useMemo(
    () => state.notes.find((n) => n.id === activeNoteId) ?? null,
    [state.notes, activeNoteId]
  );

  const handleNewNote = () => {
    const defaultSub =
      subjectFilter !== 'all' ? subjectFilter : state.subjects[0]?.id ?? 'sub-math';
    const id = createNote('Untitled Note', '', defaultSub, 'indigo', false);
    setActiveNoteId(id);
    setSaveBadge('Saved locally');
  };

  const handleAutoSavePatch = (
    patch: { title?: string; content?: string; subjectId?: string; tint?: NoteTint; pinned?: boolean }
  ) => {
    if (!activeNote) return;
    updateNote(activeNote.id, patch);
    setSaveBadge('Auto-saved');
  };

  const insertChecklistItem = () => {
    if (!activeNote) return;
    const prefix = activeNote.content.length > 0 && !activeNote.content.endsWith('\n') ? '\n' : '';
    handleAutoSavePatch({ content: `${activeNote.content}${prefix}[ ] ` });
  };

  const openNoteAssistant = (
    note: StudyNote | null,
    tab: AssistantTab,
    autoRun: boolean
  ) => {
    setAssistantTargetNote(note);
    setAssistantTab(tab);
    setAssistantAutoRun(autoRun);
    setAssistantOpen(true);
  };

  const assistantContext: AssistantContextPayload = useMemo(() => {
    const target = assistantTargetNote ?? activeNote ?? filteredNotes[0] ?? null;
    if (!target) {
      const sub =
        subjectFilter !== 'all' ? subjectMap[subjectFilter] : state.subjects[0];
      return {
        sourceType: 'note',
        subjectId: sub?.id ?? 'sub-math',
        subjectName: sub?.name ?? 'General Studies',
        title: 'Study Notes',
        content: '',
      };
    }
    const sub = subjectMap[target.subjectId];
    return {
      sourceType: 'note',
      subjectId: target.subjectId,
      subjectName: sub?.name ?? 'General Studies',
      title: target.title || 'Untitled Note',
      content: target.content,
      noteId: target.id,
      suggestedConcepts: [target.title].filter(Boolean),
    };
  }, [assistantTargetNote, activeNote, filteredNotes, subjectFilter, subjectMap, state.subjects]);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Notes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            {state.notes.length} notes saved offline · Auto-save enabled
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              openNoteAssistant(
                activeNote ?? filteredNotes[0] ?? null,
                activeNote || filteredNotes[0] ? 'summarize' : 'explain',
                false
              )
            }
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-white dark:bg-[#111124] border border-[#7C3AED]/40 text-[#7C3AED] dark:text-[#C4B5FD] hover:bg-[#7C3AED]/10 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Brain className="w-4 h-4" />
            AI Assistant
          </button>
          <button
            type="button"
            onClick={handleNewNote}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold shadow-md shadow-[#7C3AED]/20 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
        </div>
      </div>

      {/* Search + Subject Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search titles, formulas, or ideas..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#111124] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setSubjectFilter('all')}
            className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subjectFilter === 'all'
                ? 'bg-[#7C3AED] text-white'
                : 'bg-white dark:bg-[#111124] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300'
            }`}
          >
            All
          </button>
          {state.subjects.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => setSubjectFilter(sub.id)}
              className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                subjectFilter === sub.id
                  ? 'bg-[#7C3AED] text-white'
                  : 'bg-white dark:bg-[#111124] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split: Notes Grid + Active Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Notes Grid */}
        <div className={activeNote ? 'lg:col-span-6' : 'lg:col-span-12'}>
          {filteredNotes.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-[#111124] border border-slate-200 dark:border-white/[0.08] p-12 text-center">
              <FileText className="w-10 h-10 mx-auto text-slate-400 mb-3" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">No notes found</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Create a study note to store formulas, lecture takeaways, and revision checklists offline.
              </p>
              <button
                type="button"
                onClick={handleNewNote}
                className="mt-4 px-4 py-2.5 rounded-xl bg-[#7C3AED] text-white text-xs font-semibold cursor-pointer"
              >
                Create First Note
              </button>
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 ${
                activeNote ? 'xl:grid-cols-2' : 'xl:grid-cols-3'
              } gap-4`}
            >
              {filteredNotes.map((note) => {
                const tint = NOTE_TINTS[note.tint] ?? NOTE_TINTS.indigo;
                const sub = subjectMap[note.subjectId];
                const isSelected = activeNote?.id === note.id;

                return (
                  <article
                    key={note.id}
                    onClick={() => {
                      setActiveNoteId(note.id);
                      setSaveBadge('Saved offline');
                    }}
                    className={`rounded-2xl border p-5 flex flex-col justify-between min-h-[190px] transition-all cursor-pointer ${
                      tint.cardClass
                    } ${
                      isSelected
                        ? 'ring-2 ring-[#7C3AED] shadow-lg shadow-[#7C3AED]/15'
                        : 'hover:border-[#7C3AED]/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`text-base font-bold leading-snug line-clamp-2 ${tint.titleClass}`}>
                          {note.title}
                        </h3>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateNote(note.id, { pinned: !note.pinned });
                            showToast(note.pinned ? 'Note unpinned' : 'Note pinned to top');
                          }}
                          aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
                          className={`p-1.5 rounded-lg transition-colors shrink-0 cursor-pointer ${
                            note.pinned
                              ? 'text-[#7C3AED] dark:text-[#C4B5FD] bg-[#7C3AED]/15'
                              : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                          }`}
                        >
                          <Pin className="w-4 h-4" />
                        </button>
                      </div>

                      <p className={`mt-2.5 text-sm whitespace-pre-line line-clamp-4 leading-relaxed ${tint.bodyClass}`}>
                        {note.content || 'Empty note — click to start writing...'}
                      </p>
                    </div>

                    <div className={`mt-4 pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-2 text-xs ${tint.metaClass}`}>
                      <span className="truncate">
                        {sub?.name ?? 'General'} ·{' '}
                        {new Date(note.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveNoteId(note.id);
                            openNoteAssistant(note, 'summarize', true);
                          }}
                          title="Summarize note with AI"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#7C3AED]/15 hover:bg-[#7C3AED] text-[#7C3AED] dark:text-[#C4B5FD] hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          <Brain className="w-3 h-3" />
                          Summarize
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeNoteId === note.id) setActiveNoteId(null);
                            deleteNote(note.id);
                          }}
                          aria-label="Delete note"
                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Auto-Saving Rich Note Editor */}
        {activeNote && (
          <section className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#111124] border border-[#7C3AED]/35 p-5 sm:p-6 space-y-4 sticky top-20">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>{saveBadge || 'Auto-saved'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAutoSavePatch({ pinned: !activeNote.pinned })}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 cursor-pointer ${
                    activeNote.pinned
                      ? 'bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#C4B5FD]'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <Pin className="w-3.5 h-3.5" />
                  {activeNote.pinned ? 'Pinned' : 'Pin'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteNote(activeNote.id);
                    setActiveNoteId(null);
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                  aria-label="Delete active note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveNoteId(null)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer"
                  aria-label="Close editor"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <input
              type="text"
              value={activeNote.title}
              onChange={(e) => handleAutoSavePatch({ title: e.target.value })}
              placeholder="Note title..."
              className="w-full bg-transparent text-xl font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 py-2 border-y border-slate-100 dark:border-white/[0.07]">
              <div className="flex items-center gap-2">
                <select
                  value={activeNote.subjectId}
                  onChange={(e) => handleAutoSavePatch({ subjectId: e.target.value })}
                  aria-label="Note subject"
                  className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#191933] border border-slate-200 dark:border-white/[0.1] text-xs font-medium text-slate-800 dark:text-slate-200"
                >
                  {state.subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={insertChecklistItem}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  + Checklist
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {TINT_OPTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleAutoSavePatch({ tint: t })}
                    aria-label={`Set ${t} card tint`}
                    className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                      activeNote.tint === t
                        ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#111124] ring-[#7C3AED] scale-110'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: NOTE_TINTS[t].swatch }}
                  />
                ))}
              </div>
            </div>

            <textarea
              rows={11}
              value={activeNote.content}
              onChange={(e) => handleAutoSavePatch({ content: e.target.value })}
              placeholder="Write lecture notes, key formulas, or revision checklists..."
              className="w-full resize-y bg-slate-50/70 dark:bg-[#0B0B1A] rounded-xl p-4 border border-slate-200/80 dark:border-white/[0.07] text-sm leading-relaxed text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED]"
            />

            {/* Inline AI Study Tools Bar for Active Note */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/[0.07] flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => openNoteAssistant(activeNote, 'summarize', true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-xl bg-[#7C3AED]/12 hover:bg-[#7C3AED] text-[#7C3AED] dark:text-[#C4B5FD] hover:text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                <Brain className="w-3.5 h-3.5" />
                Summarize Note
              </button>
              <button
                type="button"
                onClick={() => openNoteAssistant(activeNote, 'quiz', true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-xl bg-[#06B6D4]/12 hover:bg-[#06B6D4] text-[#0891B2] dark:text-[#22D3EE] hover:text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Practice Quiz
              </button>
              <button
                type="button"
                onClick={() => openNoteAssistant(activeNote, 'explain', false)}
                className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Explain Concept
              </button>
            </div>
          </section>
        )}
      </div>

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
