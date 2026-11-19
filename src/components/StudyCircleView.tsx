import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  UsersRound,
  Plus,
  Copy,
  Check,
  CheckCheck,
  Clock,
  Send,
  LogIn,
  Target,
  X,
  MessageSquare,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Link2,
  AlertCircle,
} from 'lucide-react';
import { useStudyFlow } from '../context/StudyFlowContext';
import { MemberStatus, SubjectAccent } from '../types/studyflow';
import { SUBJECT_ACCENTS } from '../utils/accentStyles';
import { useCircleRealtime } from '../hooks/useCircleRealtime';

const STATUS_META: Record<MemberStatus, { label: string; labelBn: string; textClass: string }> = {
  studying: { label: 'Studying', labelBn: 'পড়ছে', textClass: 'text-emerald-600 dark:text-emerald-400' },
  revising: { label: 'Revising', labelBn: 'রিভিশন', textClass: 'text-[#7C3AED] dark:text-[#C4B5FD]' },
  break: { label: 'On Break', labelBn: 'বিরতিতে', textClass: 'text-amber-600 dark:text-amber-400' },
  offline: { label: 'Offline', labelBn: 'অফলাইন', textClass: 'text-slate-400' },
};

function formatCallDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/** Hidden WebRTC remote audio player bound to a peer's MediaStream */
function RemotePeerAudio({ stream, deafened }: { stream: MediaStream; deafened: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.srcObject = stream;
    el.muted = deafened;
    void el.play().catch(() => {});
  }, [stream, deafened]);

  return <audio ref={audioRef} autoPlay playsInline className="hidden" />;
}

export function StudyCircleView() {
  const {
    state,
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

  const [chatText, setChatText] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

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

  const realtime = useCircleRealtime({
    roomCode: activeRoom?.code ?? null,
    userName: state.profile.name || 'Learner',
    userInitials,
    userAccent: (state.profile.avatarColor ?? 'purple') as SubjectAccent,
    userStatus: state.profile.myStatus,
    onToast: showToast,
  });

  // Merge room's starter/local messages with real-time synced + offline queued messages without duplicates
  const combinedMessages = useMemo(() => {
    if (!activeRoom) return [];
    const byId = new Map<
      string,
      {
        id: string;
        senderName: string;
        senderInitials: string;
        text: string;
        timestamp: string;
        isCurrentUser: boolean;
        delivery: 'sent' | 'pending';
      }
    >();

    for (const m of activeRoom.messages) {
      byId.set(m.id, {
        id: m.id,
        senderName: m.senderName,
        senderInitials: m.senderInitials,
        text: m.text,
        timestamp: m.timestamp,
        isCurrentUser: Boolean(m.isCurrentUser),
        delivery: 'sent',
      });
    }

    for (const rm of realtime.messages) {
      byId.set(rm.id, {
        id: rm.id,
        senderName: rm.senderName,
        senderInitials: rm.senderInitials,
        text: rm.text,
        timestamp: rm.timestamp,
        isCurrentUser: rm.senderPeerId === realtime.myPeerId,
        delivery: rm.delivery,
      });
    }

    return Array.from(byId.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [activeRoom, realtime.messages, realtime.myPeerId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [combinedMessages.length, realtime.typingPeers.length]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

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

  const handleCopyInviteLink = () => {
    if (!activeRoom) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(activeRoom.code)}`;
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    setCopiedInvite(true);
    showToast(
      isBn
        ? 'বন্ধুদের ইনভাইট লিংক কপি হয়েছে — শেয়ার করে একসাথে চ্যাট ও কল করুন!'
        : 'Invite link copied — share with friends to chat & talk live!'
    );
    window.setTimeout(() => setCopiedInvite(false), 2200);
  };

  const handleChatInputChange = (val: string) => {
    setChatText(val);
    realtime.sendTyping(val.trim().length > 0);
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      realtime.sendTyping(false);
    }, 1800);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoom || !chatText.trim()) return;
    const sent = realtime.sendMessage(chatText);
    realtime.sendTyping(false);
    setChatText('');
    if (sent?.delivery === 'pending') {
      showToast(
        isBn
          ? 'অফলাইনে মেসেজ সেভ হয়েছে — অনলাইন হলেই অটো চলে যাবে'
          : 'Saved offline — will auto-send when back online'
      );
    }
  };

  const isOnlineConnected = realtime.connectionState === 'connected';
  const livePeerCount = realtime.peers.length;
  const activeVoiceCount = realtime.voicePeers.length;

  return (
    <div className="space-y-6 pb-8">
      {/* Remote Peer Live Audio Elements */}
      {Object.entries(realtime.remoteStreams).map(([peerId, stream]) => (
        <RemotePeerAudio key={peerId} stream={stream} deafened={realtime.isDeafened} />
      ))}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.circle.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isBn
              ? 'বন্ধুদের সাথে রিয়েল-টাইম চ্যাট ও লাইভ ভয়েস কল করুন — অফলাইনেও মেসেজ লিখে রাখতে পারবেন'
              : 'Chat with friends offline or online, and hop on live group voice calls together'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateRoom((v) => !v)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6366F1] hover:from-[#6D28D9] hover:to-[#4F46E5] text-white text-sm font-semibold shadow-md shadow-[#7C3AED]/25 whitespace-nowrap shrink-0 cursor-pointer transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          {t.circle.createRoom}
        </button>
      </div>

      {/* Create Room Drawer */}
      {showCreateRoom && (
        <form
          onSubmit={handleCreateRoom}
          className="rounded-3xl bg-white dark:bg-[#111124] border border-[#7C3AED]/40 p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              {isBn ? 'নতুন স্টাডি রুম তৈরি করুন' : 'Create Collaborative Study Room'}
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
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
            />
            <input
              type="text"
              value={roomSubject}
              onChange={(e) => setRoomSubject(e.target.value)}
              placeholder={isBn ? 'বিষয় (যেমন: গণিত ও পদার্থবিজ্ঞান)' : 'Focus topic (e.g. Calculus & Physics)'}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
            />
            <input
              type="number"
              min={5}
              max={500}
              value={roomGoal}
              onChange={(e) => setRoomGoal(Number(e.target.value))}
              placeholder="Monthly goal hours"
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold cursor-pointer"
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
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#6366F1] text-white shadow-md shadow-[#7C3AED]/25'
                    : 'bg-white dark:bg-[#111124] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:border-[#7C3AED]/40'
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
            className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#111124] border border-slate-200 dark:border-white/[0.1] font-mono text-xs uppercase tracking-wider text-slate-900 dark:text-white placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED]"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#7C3AED]/12 hover:bg-[#7C3AED] text-[#7C3AED] hover:text-white dark:bg-white/[0.1] dark:hover:bg-white/[0.16] dark:text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            {t.circle.joinRoom}
          </button>
        </form>
      </div>
      {joinError && <p className="text-xs text-rose-500">{joinError}</p>}

      {activeRoom && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Room Banner, Invite Link, Voice Call Controls, Group Goal, Live Members */}
          <div className="lg:col-span-5 space-y-5">
            {/* Room Info & Shareable Code + Invite Link */}
            <section className="rounded-3xl bg-gradient-to-br from-[#F5F3FF] via-white to-[#ECFEFF] dark:from-[#231547] dark:via-[#14142E] dark:to-[#111124] border border-[#7C3AED]/20 dark:border-[#7C3AED]/35 p-5 text-slate-900 dark:text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-[#7C3AED] dark:text-purple-300">
                    {activeRoom.subjectFocus}
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                    {activeRoom.name}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-300 tabular-nums flex items-center gap-1.5">
                    {isOnlineConnected ? (
                      <>
                        <Wifi className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>
                          {isBn
                            ? `${Math.max(1, livePeerCount)} জন এখন অনলাইনে · রিয়েল-টাইম চালু`
                            : `${Math.max(1, livePeerCount)} online now · Live sync active`}
                        </span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>
                          {isBn
                            ? 'অফলাইন মোড · মেসেজ কিউয়ে সেভ হবে'
                            : 'Offline mode · Messages queue until online'}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-[#7C3AED]/12 dark:bg-white/10 flex items-center justify-center shrink-0">
                  <UsersRound className="w-5 h-5 text-[#7C3AED] dark:text-purple-200" />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 rounded-2xl bg-white/85 dark:bg-black/30 border border-slate-200/80 dark:border-white/10 px-4 py-3">
                <div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.circle.roomCode}</p>
                  <p className="font-mono text-lg font-bold tracking-widest text-slate-900 dark:text-white">
                    {activeRoom.code}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-800 dark:text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCode ? t.circle.copied : t.circle.copy}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyInviteLink}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copiedInvite ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                    {copiedInvite ? (isBn ? 'লিংক কপি' : 'Copied') : isBn ? 'ইনভাইট' : 'Invite'}
                  </button>
                </div>
              </div>
            </section>

            {/* Live Online Group Voice Call Lounge */}
            <section className="rounded-3xl bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                      realtime.inVoiceCall
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#C4B5FD]'
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {isBn ? 'গ্রুপ ভয়েস কল (অনলাইন)' : 'Group Voice Call (Online)'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {realtime.inVoiceCall
                        ? isBn
                          ? `কলে যুক্ত আছেন · ${formatCallDuration(realtime.callSeconds)}`
                          : `Connected live · ${formatCallDuration(realtime.callSeconds)}`
                        : activeVoiceCount > 0
                          ? isBn
                            ? `${activeVoiceCount} জন এখন কলে কথা বলছে`
                            : `${activeVoiceCount} friend${activeVoiceCount > 1 ? 's' : ''} in voice call`
                          : isBn
                            ? 'অনলাইনে বন্ধুদের সাথে সরাসরি কথা বলুন'
                            : 'Talk live with everyone in this study room'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Voice Participants Grid */}
              {activeVoiceCount > 0 && (
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {realtime.voicePeers.map((vp) => {
                    const accent = SUBJECT_ACCENTS[vp.accent] ?? SUBJECT_ACCENTS.purple;
                    const isSpeaking = Boolean(realtime.speakingPeerIds[vp.peerId]) && !vp.muted;
                    const isMe = vp.peerId === realtime.myPeerId;
                    return (
                      <div
                        key={vp.peerId}
                        className={`flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all ${
                          isSpeaking
                            ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-400 dark:border-emerald-400/60 shadow-sm shadow-emerald-500/20'
                            : 'bg-slate-50 dark:bg-white/[0.04] border-slate-200/80 dark:border-white/[0.08]'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full ${accent.softBg} ${accent.text} font-display font-bold text-[11px] flex items-center justify-center shrink-0 ${
                            isSpeaking ? 'ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-[#111124]' : ''
                          }`}
                        >
                          {vp.initials}
                        </div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 max-w-[100px] truncate">
                          {isMe ? (isBn ? 'আপনি' : 'You') : vp.name}
                        </span>
                        {vp.muted ? (
                          <MicOff className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        ) : isSpeaking ? (
                          <span className="inline-flex items-end gap-[2px] h-3 shrink-0" aria-label="Speaking">
                            <span className="w-[2px] h-full rounded-full bg-emerald-500 eq-bar-1" />
                            <span className="w-[2px] h-full rounded-full bg-emerald-500 eq-bar-2" />
                            <span className="w-[2px] h-full rounded-full bg-emerald-500 eq-bar-3" />
                          </span>
                        ) : (
                          <Mic className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {realtime.voiceError && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 px-3 py-2.5 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{realtime.voiceError}</span>
                </div>
              )}

              {/* Voice Call Action Bar */}
              {!realtime.inVoiceCall ? (
                <button
                  type="button"
                  disabled={!isOnlineConnected}
                  onClick={() => void realtime.joinVoiceCall()}
                  className="w-full py-3 min-h-[44px] rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-300 disabled:to-slate-300 dark:disabled:from-white/10 dark:disabled:to-white/10 disabled:text-slate-500 dark:disabled:text-slate-400 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 disabled:shadow-none flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
                >
                  <Phone className="w-4 h-4" />
                  {!isOnlineConnected
                    ? isBn
                      ? 'ভয়েস কলের জন্য অনলাইন হতে হবে'
                      : 'Connect online to join voice call'
                    : activeVoiceCount > 0
                      ? isBn
                        ? `লাইভ কলে যোগ দিন (${activeVoiceCount} জন আছে)`
                        : `Join Live Voice Call (${activeVoiceCount} active)`
                      : isBn
                        ? 'গ্রুপ ভয়েস কল শুরু করুন'
                        : 'Start Group Voice Call'}
                </button>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={realtime.toggleMute}
                    className={`py-2.5 min-h-[44px] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      realtime.isMuted
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                        : 'bg-slate-100 dark:bg-white/[0.07] text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/[0.12]'
                    }`}
                  >
                    {realtime.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    <span>{realtime.isMuted ? (isBn ? 'মিউট' : 'Muted') : isBn ? 'মাইক' : 'Mic On'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={realtime.toggleDeafen}
                    className={`py-2.5 min-h-[44px] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      realtime.isDeafened
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                        : 'bg-slate-100 dark:bg-white/[0.07] text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/[0.12]'
                    }`}
                  >
                    {realtime.isDeafened ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    <span>{realtime.isDeafened ? (isBn ? 'বন্ধ' : 'Muted') : isBn ? 'স্পিকার' : 'Audio'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => realtime.leaveVoiceCall(true)}
                    className="py-2.5 min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>{isBn ? 'কল কাটুন' : 'Leave'}</span>
                  </button>
                </div>
              )}
            </section>

            {/* Shared Group Goal */}
            <section className="rounded-3xl bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t.circle.sharedGoal}
                  </h3>
                </div>
                <span className="font-mono text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                  {activeRoom.completedHours.toFixed(1)}h / {activeRoom.monthlyGoalHours}h
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                {isBn
                  ? 'আপনার প্রতিটি ফোকাস সেশন এই গ্রুপের মাসিক লক্ষ্যে যোগ হয়।'
                  : 'Every focus timer block you log automatically adds to this circle’s goal.'}
              </p>
              <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-white/[0.07] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] via-[#3B82F6] to-[#06B6D4] transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((activeRoom.completedHours / activeRoom.monthlyGoalHours) * 100)
                    )}%`,
                  }}
                />
              </div>
            </section>

            {/* Your Status + Online Circle Members */}
            <section className="rounded-3xl bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t.circle.members}
                </h3>
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.05]">
                  {(['studying', 'revising', 'break'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setMyStatus(st)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                        state.profile.myStatus === st
                          ? 'bg-[#7C3AED] text-white'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {isBn ? STATUS_META[st].labelBn : STATUS_META[st].label}
                    </button>
                  ))}
                </div>
              </div>

              <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {/* Real-time live connected peers first */}
                {realtime.peers.map((peer) => {
                  const accent = SUBJECT_ACCENTS[peer.accent] ?? SUBJECT_ACCENTS.purple;
                  const st = STATUS_META[peer.status] ?? STATUS_META.studying;
                  const isMe = peer.peerId === realtime.myPeerId;
                  return (
                    <li
                      key={`live-${peer.peerId}`}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full ${accent.softBg} ${accent.text} font-display font-bold text-xs flex items-center justify-center shrink-0`}
                        >
                          {peer.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {peer.name} {isMe ? (isBn ? '(আপনি)' : '(You)') : ''}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {peer.inCall
                              ? isBn
                                ? 'লাইভ ভয়েস কলে আছেন'
                                : 'In live voice call'
                              : isBn
                                ? 'এখন অনলাইনে আছেন'
                                : 'Online in room'}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold whitespace-nowrap shrink-0 ${st.textClass}`}>
                        {isBn ? st.labelBn : st.label}
                      </span>
                    </li>
                  );
                })}

                {/* Saved circle members when offline or not currently live */}
                {activeRoom.members
                  .filter(
                    (m) =>
                      !m.isCurrentUser &&
                      !realtime.peers.some(
                        (p) => p.name.toLowerCase() === m.name.toLowerCase()
                      )
                  )
                  .map((member) => {
                    const accent = SUBJECT_ACCENTS[member.accent];
                    const st = STATUS_META[member.status];
                    return (
                      <li
                        key={member.id}
                        className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
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

          {/* Right Column: Live + Offline-Queued Group Chat */}
          <section className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#111124] border border-slate-200/80 dark:border-white/[0.08] flex flex-col h-[600px]">
            {/* Chat Header with Quick Call Toggle */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/[0.07] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <MessageSquare className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA] shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {t.circle.groupChat} · {activeRoom.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {isOnlineConnected
                      ? isBn
                        ? 'রিয়েল-টাইম চ্যাট চালু আছে · বন্ধুদের সাথে মেসেজ ও কল করুন'
                        : 'Live room chat connected · Offline messages auto-sync'
                      : isBn
                        ? `অফলাইন চ্যাট চালু (${realtime.pendingCount}টি পেন্ডিং) · নেট পেলেই সেন্ড হবে`
                        : `Offline chat ready (${realtime.pendingCount} queued) · Auto-sends online`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {realtime.inVoiceCall ? (
                  <button
                    type="button"
                    onClick={() => realtime.leaveVoiceCall(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <PhoneOff className="w-3.5 h-3.5" />
                    <span className="font-mono tabular-nums">{formatCallDuration(realtime.callSeconds)}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!isOnlineConnected}
                    onClick={() => void realtime.joinVoiceCall()}
                    title={
                      isOnlineConnected
                        ? isBn
                          ? 'ভয়েস কল শুরু করুন'
                          : 'Join live voice call'
                        : isBn
                          ? 'অনলাইনে কল করা যাবে'
                          : 'Available when online'
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-xl bg-emerald-500/15 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white disabled:opacity-45 disabled:hover:bg-emerald-500/15 disabled:hover:text-emerald-700 dark:disabled:hover:text-emerald-300 text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{isBn ? 'ভয়েস কল' : 'Call'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {combinedMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2.5 ${msg.isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!msg.isCurrentUser && (
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 font-display font-bold text-[11px] flex items-center justify-center shrink-0">
                      {msg.senderInitials}
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-2.5 ${
                      msg.isCurrentUser
                        ? 'bg-gradient-to-br from-[#7C3AED] to-[#6366F1] text-white rounded-br-sm shadow-sm shadow-[#7C3AED]/25'
                        : 'bg-slate-100 dark:bg-white/[0.06] text-slate-900 dark:text-slate-100 rounded-bl-sm'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-3 mb-0.5">
                      <span
                        className={`text-[11px] font-semibold ${
                          msg.isCurrentUser ? 'text-purple-100' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {msg.senderName}
                      </span>
                      <span
                        className={`font-mono text-[10px] tabular-nums inline-flex items-center gap-1 ${
                          msg.isCurrentUser ? 'text-purple-200/85' : 'text-slate-400'
                        }`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                        {msg.isCurrentUser &&
                          (msg.delivery === 'pending' ? (
                            <Clock
                              className="w-3 h-3 text-amber-200"
                              aria-label="Queued offline"
                            />
                          ) : (
                            <CheckCheck
                              className="w-3 h-3 text-cyan-200"
                              aria-label="Delivered"
                            />
                          ))}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                    {msg.isCurrentUser && msg.delivery === 'pending' && (
                      <p className="mt-1 text-[10px] text-amber-100/90">
                        {isBn
                          ? 'অফলাইনে সেভ হয়েছে · অনলাইন হলেই ডেলিভার হবে'
                          : 'Saved offline · Will sync when online'}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Live Typing Indicator */}
              {realtime.typingPeers.length > 0 && (
                <div className="text-xs text-slate-500 dark:text-slate-400 italic px-1">
                  {realtime.typingPeers.map((p) => p.name).join(', ')}{' '}
                  {isBn ? 'লিখছে...' : 'is typing...'}
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat Composer (Works Online & Offline) */}
            <form
              onSubmit={handleSendChat}
              className="p-3.5 border-t border-slate-100 dark:border-white/[0.07] flex items-center gap-2"
            >
              <input
                type="text"
                value={chatText}
                onChange={(e) => handleChatInputChange(e.target.value)}
                placeholder={
                  isOnlineConnected
                    ? t.circle.typeMessage
                    : isBn
                      ? 'অফলাইনে মেসেজ লিখুন — অনলাইন হলেই বন্ধুদের কাছে যাবে...'
                      : 'Write a message offline — auto-sends once online...'
                }
                className="flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.09] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED]"
              />
              <button
                type="submit"
                aria-label="Send message"
                className="w-11 h-11 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6366F1] hover:from-[#6D28D9] hover:to-[#4F46E5] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#7C3AED]/25 transition-all active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
