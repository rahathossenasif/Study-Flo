import React, { useState } from 'react';
import {
  UsersRound,
  Plus,
  Copy,
  Check,
  LogIn,
  Target,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useStudyFlow } from '../context/StudyFlowContext';
import { MemberStatus, SubjectAccent } from '../types/studyflow';
import { SUBJECT_ACCENTS } from '../utils/accentStyles';

const STATUS_META: Record<MemberStatus, { label: string; labelBn: string; textClass: string }> = {
  studying: { label: 'Studying', labelBn: 'পড়ছে', textClass: 'text-emerald-600 dark:text-emerald-400' },
  revising: { label: 'Revising', labelBn: 'রিভিশন', textClass: 'text-[#873BFF] dark:text-[#C4B5FD]' },
  break: { label: 'On Break', labelBn: 'বিরতিতে', textClass: 'text-amber-600 dark:text-amber-400' },
  offline: { label: 'Offline', labelBn: 'অফলাইন', textClass: 'text-slate-400' },
};

export function StudyCircleView() {
  const {
    state,
    metrics,
    t,
    createStudyRoom,
    joinStudyRoomByCode,
    setActiveRoomId,
    setMyStatus,
    showToast,
  } = useStudyFlow();

  const isBn = (state.profile.language ?? 'en') === 'bn';

  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomSubject, setRoomSubject] = useState('');
  const [roomGoal, setRoomGoal] = useState(50);
  const [copiedCode, setCopiedCode] = useState(false);

  const activeRoom =
    state.rooms.find((r) => r.id === state.activeRoomId) ?? state.rooms[0] ?? null;

  const userInitials =
    state.profile.name
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'SF';

  const userAccent = SUBJECT_ACCENTS[(state.profile.avatarColor ?? 'purple') as SubjectAccent] ?? SUBJECT_ACCENTS.purple;
  const myStatusMeta = STATUS_META[state.profile.myStatus] ?? STATUS_META.studying;

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    const result = joinStudyRoomByCode(joinCode);
    if (!result.ok) {
      setJoinError(result.message);
    } else {
      setJoinCode('');
    }
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    createStudyRoom(roomName, roomSubject, roomGoal);
    setRoomName('');
    setRoomSubject('');
    setRoomGoal(50);
    setShowCreateRoom(false);
  };

  const handleCopyCode = () => {
    if (!activeRoom) return;
    navigator.clipboard?.writeText(activeRoom.code).catch(() => {});
    setCopiedCode(true);
    showToast(isBn ? `রুম কোড ${activeRoom.code} কপি হয়েছে` : `Copied room code ${activeRoom.code}`);
    window.setTimeout(() => setCopiedCode(false), 2000);
  };

  const goalPct = activeRoom
    ? Math.min(100, Math.round((activeRoom.completedHours / Math.max(1, activeRoom.monthlyGoalHours)) * 100))
    : 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.circle.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isBn
              ? 'সম্পূর্ণ অফলাইনে স্টাডি গ্রুপ, মাসিক লক্ষ্য ও প্রতিদিনের পড়ার অগ্রগতি ট্র্যাক করুন'
              : 'Track your study squads, shared monthly hour goals, and daily study status completely offline'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateRoom((v) => !v)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-[#873BFF] to-[#6B2CF5] hover:from-[#772CF0] hover:to-[#5C22DF] text-white text-sm font-semibold shadow-md shadow-[#873BFF]/25 whitespace-nowrap shrink-0 cursor-pointer transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          {t.circle.createRoom}
        </button>
      </div>

      {/* Create Room Drawer */}
      {showCreateRoom && (
        <form
          onSubmit={handleCreateRoom}
          className="sf-glass rounded-3xl border border-[#873BFF]/35 p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              {isBn ? 'নতুন স্টাডি রুম তৈরি করুন' : 'Create Study Group Room'}
            </h2>
            <button
              type="button"
              onClick={() => setShowCreateRoom(false)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder={isBn ? 'রুমের নাম (যেমন: HSC Squad)' : 'Room name (e.g. Finals Prep Squad)'}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#873BFF]"
            />
            <input
              type="text"
              value={roomSubject}
              onChange={(e) => setRoomSubject(e.target.value)}
              placeholder={isBn ? 'বিষয় (যেমন: গণিত ও পদার্থবিজ্ঞান)' : 'Focus topic (e.g. Calculus & Physics)'}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#873BFF]"
            />
            <input
              type="number"
              min={5}
              max={500}
              value={roomGoal}
              onChange={(e) => setRoomGoal(Number(e.target.value))}
              placeholder="Monthly goal hours"
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#873BFF]"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#873BFF] to-[#6B2CF5] hover:from-[#772CF0] hover:to-[#5C22DF] text-white text-sm font-semibold cursor-pointer"
            >
              {isBn ? 'রুম চালু করুন ও কোড নিন' : 'Launch Room & Generate Code'}
            </button>
          </div>
        </form>
      )}

      {/* Room Switcher + Join Code Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        <div className="lg:col-span-7 flex items-center gap-2 overflow-x-auto pb-1">
          {state.rooms.map((room) => {
            const isSelected = activeRoom?.id === room.id;
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => setActiveRoomId(room.id)}
                className={`px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#873BFF] to-[#6B2CF5] text-white shadow-md shadow-[#873BFF]/25'
                    : 'bg-white dark:bg-[#17132D]/85 border border-slate-200 dark:border-white/[0.09] text-slate-700 dark:text-slate-300 hover:border-[#873BFF]/45'
                }`}
              >
                <span>{room.name}</span>
                <span className="font-mono text-[11px] opacity-80">{room.code}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleJoinRoom} className="lg:col-span-5 flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder={t.circle.joinPlaceholder}
            maxLength={10}
            className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#17132D]/85 border border-slate-200 dark:border-white/[0.1] font-mono text-xs uppercase tracking-wider text-slate-900 dark:text-white placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:outline-none focus:border-[#873BFF]"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#873BFF]/12 hover:bg-[#873BFF] text-[#873BFF] hover:text-white dark:bg-white/[0.1] dark:hover:bg-white/[0.16] dark:text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            {t.circle.joinRoom}
          </button>
        </form>
      </div>
      {joinError && <p className="text-xs text-rose-500">{joinError}</p>}

      {activeRoom && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Room Banner + Shared Group Goal */}
          <div className="lg:col-span-5 space-y-5">
            {/* Room Info & Code */}
            <section className="sf-glass rounded-3xl bg-gradient-to-br from-[#F5F3FF] via-white to-[#ECFEFF] dark:from-[#231547] dark:via-[#17132D] dark:to-[#110E24] border border-[#873BFF]/20 dark:border-[#873BFF]/35 p-5 text-slate-900 dark:text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#873BFF] dark:text-[#C4B5FD]">
                    {activeRoom.subjectFocus}
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                    {activeRoom.name}
                  </h2>
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#16C7D9] shrink-0" />
                    <span>
                      {isBn
                        ? '১০০% অফলাইন স্টাডি গ্রুপ · লোকাল সেভ চালু'
                        : '100% offline study group · Saved locally'}
                    </span>
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-[#873BFF]/15 dark:bg-white/10 flex items-center justify-center shrink-0">
                  <UsersRound className="w-5 h-5 text-[#873BFF] dark:text-[#C4B5FD]" />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 rounded-2xl bg-white/85 dark:bg-black/30 border border-slate-200/80 dark:border-white/10 px-4 py-3">
                <div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.circle.roomCode}</p>
                  <p className="font-mono text-lg font-bold tracking-widest text-slate-900 dark:text-white">
                    {activeRoom.code}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#873BFF] to-[#6B2CF5] hover:from-[#772CF0] hover:to-[#5C22DF] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? t.circle.copied : t.circle.copy}
                </button>
              </div>
            </section>

            {/* Shared Group Goal */}
            <section className="sf-glass rounded-3xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#873BFF] dark:text-[#16C7D9]" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t.circle.sharedGoal}
                  </h3>
                </div>
                <span className="font-mono text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                  {activeRoom.completedHours.toFixed(1)}h / {activeRoom.monthlyGoalHours}h
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3.5">
                {isBn
                  ? 'আপনার প্রতিটি ফোকাস সেশন এই গ্রুপের মাসিক লক্ষ্যে স্বয়ংক্রিয়ভাবে যোগ হয়।'
                  : 'Every focus timer block you log automatically adds to this circle’s monthly goal.'}
              </p>
              <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#873BFF] via-[#7C5CFF] to-[#16C7D9] transition-all duration-500"
                  style={{ width: `${goalPct}%` }}
                />
              </div>
              <p className="mt-2 text-right font-mono text-[11px] font-semibold text-[#873BFF] dark:text-[#16C7D9] tabular-nums">
                {goalPct}% {isBn ? 'সম্পন্ন' : 'achieved'}
              </p>
            </section>
          </div>

          {/* Right Column: Your Study Status + Circle Members */}
          <section className="lg:col-span-7 sf-glass rounded-3xl p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {t.circle.members}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isBn
                    ? 'আপনার বর্তমান পড়ার স্ট্যাটাস সেট করুন ও গ্রুপের দৈনিক অগ্রগতি দেখুন'
                    : 'Update your current study status and track everyone’s daily study rhythm'}
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/70 dark:border-white/[0.07]">
                {(['studying', 'revising', 'break'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setMyStatus(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      state.profile.myStatus === st
                        ? 'bg-gradient-to-r from-[#873BFF] to-[#6B2CF5] text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {isBn ? STATUS_META[st].labelBn : STATUS_META[st].label}
                  </button>
                ))}
              </div>
            </div>

            <ul className="divide-y divide-slate-100 dark:divide-white/[0.07]">
              {/* Current User Row */}
              <li className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {state.profile.avatarDataUrl ? (
                    <img
                      src={state.profile.avatarDataUrl}
                      alt={state.profile.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-[#873BFF]/45"
                    />
                  ) : (
                    <div
                      className={`w-10 h-10 rounded-full ${userAccent.softBg} ${userAccent.text} font-display font-bold text-xs flex items-center justify-center shrink-0`}
                    >
                      {userInitials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {state.profile.name} {isBn ? '(আপনি)' : '(You)'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate tabular-nums">
                      {activeRoom.subjectFocus} · {Math.floor(metrics.todayMinutes / 60)}h{' '}
                      {metrics.todayMinutes % 60}m {isBn ? 'আজ' : 'today'}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-semibold whitespace-nowrap shrink-0 ${myStatusMeta.textClass}`}>
                  {isBn ? myStatusMeta.labelBn : myStatusMeta.label}
                </span>
              </li>

              {/* Room Members */}
              {activeRoom.members
                .filter((m) => !m.isCurrentUser)
                .map((member) => {
                  const accent = SUBJECT_ACCENTS[member.accent] ?? SUBJECT_ACCENTS.purple;
                  const st = STATUS_META[member.status] ?? STATUS_META.studying;
                  return (
                    <li
                      key={member.id}
                      className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full ${accent.softBg} ${accent.text} font-display font-bold text-xs flex items-center justify-center shrink-0`}
                        >
                          {member.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {member.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate tabular-nums">
                            {member.subject} · {Math.floor(member.studiedMinutesToday / 60)}h{' '}
                            {member.studiedMinutesToday % 60}m {isBn ? 'আজ' : 'today'}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold whitespace-nowrap shrink-0 ${st.textClass}`}>
                        {isBn ? st.labelBn : st.label}
                      </span>
                    </li>
                  );
                })}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
