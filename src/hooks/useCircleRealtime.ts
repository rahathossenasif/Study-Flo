import { useState, useEffect, useRef, useCallback } from 'react';
import { MemberStatus, SubjectAccent } from '../types/studyflow';

export interface RealtimePeer {
  peerId: string;
  name: string;
  initials: string;
  accent: SubjectAccent;
  status: MemberStatus;
  inCall: boolean;
  muted: boolean;
}

export interface RealtimeChatMessage {
  id: string;
  roomCode: string;
  senderPeerId: string;
  senderName: string;
  senderInitials: string;
  text: string;
  timestamp: string;
  delivery: 'sent' | 'pending';
}

interface QueuedMessage {
  id: string;
  roomCode: string;
  senderPeerId: string;
  senderName: string;
  senderInitials: string;
  text: string;
  timestamp: string;
}

export type ConnectionState = 'connecting' | 'connected' | 'offline';

interface UseCircleRealtimeOptions {
  roomCode: string | null;
  userName: string;
  userInitials: string;
  userAccent: SubjectAccent;
  userStatus: MemberStatus;
  onToast?: (text: string) => void;
}

const PEER_ID_KEY = 'studyflo_circle_peer_id_v1';
const OFFLINE_QUEUE_KEY = 'studyflo_circle_offline_queue_v1';
const LOCAL_CACHE_KEY = 'studyflo_circle_room_msgs_v1';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

function getOrCreatePeerId(): string {
  try {
    const existing = window.localStorage.getItem(PEER_ID_KEY);
    if (existing) return existing;
    const created = `peer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    window.localStorage.setItem(PEER_ID_KEY, created);
    return created;
  } catch {
    return `peer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }
}

function loadOfflineQueue(): QueuedMessage[] {
  try {
    const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveOfflineQueue(queue: QueuedMessage[]): void {
  try {
    window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue.slice(-100)));
  } catch {
    // Ignore storage quota errors
  }
}

function loadCachedRoomMessages(roomCode: string): RealtimeChatMessage[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_CACHE_KEY);
    if (!raw) return [];
    const map = JSON.parse(raw) as Record<string, RealtimeChatMessage[]>;
    const list = map?.[roomCode];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveCachedRoomMessages(roomCode: string, messages: RealtimeChatMessage[]): void {
  try {
    const raw = window.localStorage.getItem(LOCAL_CACHE_KEY);
    const map: Record<string, RealtimeChatMessage[]> = raw ? JSON.parse(raw) : {};
    map[roomCode] = messages.slice(-150);
    window.localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
}

function mergeMessagesIdempotently(
  existing: RealtimeChatMessage[],
  incoming: RealtimeChatMessage[]
): RealtimeChatMessage[] {
  const byId = new Map<string, RealtimeChatMessage>();
  for (const m of existing) {
    byId.set(m.id, m);
  }
  for (const m of incoming) {
    const prev = byId.get(m.id);
    if (!prev || (prev.delivery === 'pending' && m.delivery === 'sent')) {
      byId.set(m.id, m);
    }
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

export function useCircleRealtime({
  roomCode,
  userName,
  userInitials,
  userAccent,
  userStatus,
  onToast,
}: UseCircleRealtimeOptions) {
  const peerIdRef = useRef<string>(getOrCreatePeerId());
  const normalizedRoom = roomCode ? roomCode.trim().toUpperCase() : '';

  const [connectionState, setConnectionState] = useState<ConnectionState>(() =>
    typeof navigator !== 'undefined' && navigator.onLine ? 'connecting' : 'offline'
  );
  const [peers, setPeers] = useState<RealtimePeer[]>([]);
  const [messages, setMessages] = useState<RealtimeChatMessage[]>(() =>
    normalizedRoom ? loadCachedRoomMessages(normalizedRoom) : []
  );
  const [typingPeers, setTypingPeers] = useState<{ peerId: string; name: string }[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(() => loadOfflineQueue().length);

  // Voice Call State
  const [inVoiceCall, setInVoiceCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [speakingPeerIds, setSpeakingPeerIds] = useState<Record<string, boolean>>({});
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});

  // Refs for WebSocket, WebRTC, and live audio analysis
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analysersRef = useRef<Map<string, { analyser: AnalyserNode; data: Uint8Array<ArrayBuffer> }>>(
    new Map()
  );
  const inVoiceCallRef = useRef(false);
  const isMutedRef = useRef(false);
  const roomRef = useRef(normalizedRoom);
  const profileRef = useRef({ userName, userInitials, userAccent, userStatus });
  const toastRef = useRef(onToast);

  useEffect(() => {
    roomRef.current = normalizedRoom;
  }, [normalizedRoom]);

  useEffect(() => {
    profileRef.current = { userName, userInitials, userAccent, userStatus };
  }, [userName, userInitials, userAccent, userStatus]);

  useEffect(() => {
    toastRef.current = onToast;
  }, [onToast]);

  useEffect(() => {
    inVoiceCallRef.current = inVoiceCall;
  }, [inVoiceCall]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const sendWs = useCallback((payload: Record<string, unknown>): boolean => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  // Attach Web Audio level monitor to a local or remote MediaStream
  const attachStreamAnalyser = useCallback((id: string, stream: MediaStream) => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        void audioCtxRef.current.resume();
      }
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      const analyser = audioCtxRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);
      const buffer = new ArrayBuffer(analyser.frequencyBinCount);
      analysersRef.current.set(id, { analyser, data: new Uint8Array(buffer) });
    } catch {
      // Speaking visualizer is optional enhancement
    }
  }, []);

  const closePeerConnection = useCallback((targetPeerId: string) => {
    const pc = peerConnectionsRef.current.get(targetPeerId);
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
      peerConnectionsRef.current.delete(targetPeerId);
    }
    analysersRef.current.delete(targetPeerId);
    setRemoteStreams((prev) => {
      if (!(targetPeerId in prev)) return prev;
      const next = { ...prev };
      delete next[targetPeerId];
      return next;
    });
  }, []);

  const createPeerConnection = useCallback(
    (targetPeerId: string): RTCPeerConnection => {
      const existing = peerConnectionsRef.current.get(targetPeerId);
      if (existing) {
        existing.close();
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionsRef.current.set(targetPeerId, pc);

      // Add local microphone tracks if active
      if (localStreamRef.current) {
        for (const track of localStreamRef.current.getTracks()) {
          pc.addTrack(track, localStreamRef.current);
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendWs({
            type: 'voice:signal',
            targetPeerId,
            signalType: 'ice',
            payload: event.candidate.toJSON(),
          });
        }
      };

      pc.ontrack = (event) => {
        const [stream] = event.streams;
        if (stream) {
          setRemoteStreams((prev) => ({ ...prev, [targetPeerId]: stream }));
          attachStreamAnalyser(targetPeerId, stream);
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          closePeerConnection(targetPeerId);
        }
      };

      return pc;
    },
    [sendWs, attachStreamAnalyser, closePeerConnection]
  );

  const leaveVoiceCall = useCallback(
    (notifyServer = true) => {
      if (notifyServer && inVoiceCallRef.current) {
        sendWs({ type: 'voice:leave' });
      }
      for (const peerId of Array.from(peerConnectionsRef.current.keys())) {
        closePeerConnection(peerId);
      }
      if (localStreamRef.current) {
        for (const track of localStreamRef.current.getTracks()) {
          track.stop();
        }
        localStreamRef.current = null;
      }
      analysersRef.current.clear();
      setInVoiceCall(false);
      setIsMuted(false);
      setIsDeafened(false);
      setCallSeconds(0);
      setSpeakingPeerIds({});
      setRemoteStreams({});
    },
    [sendWs, closePeerConnection]
  );

  const joinVoiceCall = useCallback(async (): Promise<boolean> => {
    setVoiceError(null);

    if (!navigator.onLine || connectionState !== 'connected') {
      const msg = 'Voice call requires an active internet connection. Offline chat is still available.';
      setVoiceError(msg);
      toastRef.current?.(msg);
      return false;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      const msg = 'Your browser does not support microphone voice calls.';
      setVoiceError(msg);
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      localStreamRef.current = stream;
      attachStreamAnalyser(peerIdRef.current, stream);
      setInVoiceCall(true);
      setIsMuted(false);
      setCallSeconds(0);
      sendWs({ type: 'voice:join', muted: false });
      toastRef.current?.('Joined live Study Circle voice call');
      return true;
    } catch (err) {
      const detail =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone access was blocked. Allow microphone permission to talk in the call.'
          : err instanceof DOMException && err.name === 'NotFoundError'
            ? 'No microphone detected on this device.'
            : 'Unable to start microphone for voice call.';
      setVoiceError(detail);
      toastRef.current?.(detail);
      return false;
    }
  }, [connectionState, attachStreamAnalyser, sendWs]);

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    const nextMuted = !isMutedRef.current;
    for (const track of localStreamRef.current.getAudioTracks()) {
      track.enabled = !nextMuted;
    }
    setIsMuted(nextMuted);
    sendWs({ type: 'voice:mute', muted: nextMuted });
  }, [sendWs]);

  const toggleDeafen = useCallback(() => {
    setIsDeafened((prev) => !prev);
  }, []);

  // Flush queued offline messages for the active room once connected
  const flushOfflineQueue = useCallback(() => {
    const queue = loadOfflineQueue();
    if (queue.length === 0) return;

    const remaining: QueuedMessage[] = [];
    let flushedCount = 0;

    for (const item of queue) {
      if (item.roomCode === roomRef.current) {
        const sent = sendWs({
          type: 'chat:send',
          id: item.id,
          text: item.text,
          timestamp: item.timestamp,
        });
        if (sent) {
          flushedCount++;
        } else {
          remaining.push(item);
        }
      } else {
        remaining.push(item);
      }
    }

    saveOfflineQueue(remaining);
    setPendingCount(remaining.length);
    if (flushedCount > 0) {
      toastRef.current?.(`Synced ${flushedCount} offline message${flushedCount > 1 ? 's' : ''}`);
    }
  }, [sendWs]);

  // Reload local room cache whenever active room changes
  useEffect(() => {
    if (!normalizedRoom) return;
    const cached = loadCachedRoomMessages(normalizedRoom);
    const queuedForRoom: RealtimeChatMessage[] = loadOfflineQueue()
      .filter((q) => q.roomCode === normalizedRoom)
      .map((q) => ({ ...q, delivery: 'pending' }));
    setMessages(mergeMessagesIdempotently(cached, queuedForRoom));
    setTypingPeers([]);
    // Leave voice call cleanly if switching rooms
    if (inVoiceCallRef.current) {
      leaveVoiceCall(true);
    }
  }, [normalizedRoom, leaveVoiceCall]);

  // WebSocket lifecycle + reconnection + signaling handlers
  useEffect(() => {
    if (!normalizedRoom) return;
    let disposed = false;

    const connect = () => {
      if (disposed) return;
      if (!navigator.onLine) {
        setConnectionState('offline');
        return;
      }

      setConnectionState('connecting');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/circle`;

      let ws: WebSocket;
      try {
        ws = new WebSocket(wsUrl);
      } catch {
        setConnectionState('offline');
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        if (disposed) {
          ws.close();
          return;
        }
        reconnectAttemptRef.current = 0;
        setConnectionState('connected');
        const p = profileRef.current;
        ws.send(
          JSON.stringify({
            type: 'room:join',
            roomCode: normalizedRoom,
            peerId: peerIdRef.current,
            name: p.userName,
            initials: p.userInitials,
            accent: p.userAccent,
            status: p.userStatus,
          })
        );
        flushOfflineQueue();
      };

      ws.onmessage = async (event) => {
        if (disposed) return;
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(String(event.data));
        } catch {
          return;
        }

        const msgType = data.type;

        if (msgType === 'room:sync' && data.roomCode === normalizedRoom) {
          const serverMsgs = Array.isArray(data.messages)
            ? (data.messages as Omit<RealtimeChatMessage, 'delivery'>[]).map((m) => ({
                ...m,
                delivery: 'sent' as const,
              }))
            : [];
          const serverPeers = Array.isArray(data.peers) ? (data.peers as RealtimePeer[]) : [];
          setPeers(serverPeers);
          setMessages((prev) => {
            const merged = mergeMessagesIdempotently(prev, serverMsgs);
            saveCachedRoomMessages(normalizedRoom, merged);
            return merged;
          });
          // Remove confirmed IDs from offline queue
          const confirmedIds = new Set(serverMsgs.map((m) => m.id));
          const updatedQueue = loadOfflineQueue().filter((q) => !confirmedIds.has(q.id));
          saveOfflineQueue(updatedQueue);
          setPendingCount(updatedQueue.length);
          return;
        }

        if (msgType === 'chat:message' && data.roomCode === normalizedRoom && data.message) {
          const incoming: RealtimeChatMessage = {
            ...(data.message as Omit<RealtimeChatMessage, 'delivery'>),
            delivery: 'sent',
          };
          setMessages((prev) => {
            const merged = mergeMessagesIdempotently(prev, [incoming]);
            saveCachedRoomMessages(normalizedRoom, merged);
            return merged;
          });
          // Remove from offline queue if it was pending
          const updatedQueue = loadOfflineQueue().filter((q) => q.id !== incoming.id);
          saveOfflineQueue(updatedQueue);
          setPendingCount(updatedQueue.length);
          return;
        }

        if (msgType === 'presence:update' && data.roomCode === normalizedRoom) {
          const serverPeers = Array.isArray(data.peers) ? (data.peers as RealtimePeer[]) : [];
          setPeers(serverPeers);
          return;
        }

        if (msgType === 'chat:typing' && data.roomCode === normalizedRoom) {
          const fromId = String(data.peerId ?? '');
          const fromName = String(data.name ?? 'Friend');
          const isTyping = Boolean(data.isTyping);
          if (!fromId || fromId === peerIdRef.current) return;
          setTypingPeers((prev) => {
            const filtered = prev.filter((p) => p.peerId !== fromId);
            return isTyping ? [...filtered, { peerId: fromId, name: fromName }] : filtered;
          });
          return;
        }

        if (msgType === 'voice:peer-joined' && data.roomCode === normalizedRoom) {
          const targetPeerId = String(data.peerId ?? '');
          if (!targetPeerId || targetPeerId === peerIdRef.current || !inVoiceCallRef.current) {
            return;
          }
          try {
            const pc = createPeerConnection(targetPeerId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendWs({
              type: 'voice:signal',
              targetPeerId,
              signalType: 'offer',
              payload: offer,
            });
          } catch {
            // Peer connection setup retryable
          }
          return;
        }

        if (msgType === 'voice:peer-left' && data.roomCode === normalizedRoom) {
          const leftPeerId = String(data.peerId ?? '');
          if (leftPeerId) {
            closePeerConnection(leftPeerId);
          }
          return;
        }

        if (msgType === 'voice:signal' && data.roomCode === normalizedRoom) {
          const fromPeerId = String(data.fromPeerId ?? '');
          const signalType = String(data.signalType ?? '');
          const payload = data.payload;
          if (!fromPeerId || !inVoiceCallRef.current) return;

          try {
            if (signalType === 'offer' && payload) {
              const pc = createPeerConnection(fromPeerId);
              await pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              sendWs({
                type: 'voice:signal',
                targetPeerId: fromPeerId,
                signalType: 'answer',
                payload: answer,
              });
            } else if (signalType === 'answer' && payload) {
              const pc = peerConnectionsRef.current.get(fromPeerId);
              if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
              }
            } else if (signalType === 'ice' && payload) {
              const pc = peerConnectionsRef.current.get(fromPeerId);
              if (pc) {
                await pc.addIceCandidate(new RTCIceCandidate(payload as RTCIceCandidateInit));
              }
            }
          } catch {
            // Ignore stale signaling packets
          }
        }
      };

      ws.onclose = () => {
        if (disposed) return;
        wsRef.current = null;
        if (!navigator.onLine) {
          setConnectionState('offline');
          if (inVoiceCallRef.current) {
            leaveVoiceCall(false);
            toastRef.current?.('Voice call ended — connection went offline');
          }
          return;
        }
        setConnectionState('offline');
        const delay = Math.min(10000, 1000 * Math.pow(1.8, reconnectAttemptRef.current));
        reconnectAttemptRef.current += 1;
        reconnectTimerRef.current = window.setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    const handleOnline = () => {
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      reconnectAttemptRef.current = 0;
      connect();
    };

    const handleOffline = () => {
      setConnectionState('offline');
      if (inVoiceCallRef.current) {
        leaveVoiceCall(false);
        toastRef.current?.('Offline mode — voice call ended, offline chat stays ready');
      }
      wsRef.current?.close();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    connect();

    return () => {
      disposed = true;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      leaveVoiceCall(false);
    };
  }, [normalizedRoom, flushOfflineQueue, createPeerConnection, closePeerConnection, leaveVoiceCall, sendWs]);

  // Sync status updates to live room
  useEffect(() => {
    if (connectionState === 'connected') {
      sendWs({ type: 'presence:status', status: userStatus });
    }
  }, [userStatus, connectionState, sendWs]);

  // Call duration timer
  useEffect(() => {
    if (!inVoiceCall) return;
    const id = window.setInterval(() => {
      setCallSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [inVoiceCall]);

  // Live audio speaking detector (every 140ms while in call)
  useEffect(() => {
    if (!inVoiceCall) return;
    const id = window.setInterval(() => {
      const nextSpeaking: Record<string, boolean> = {};
      for (const [peerId, entry] of analysersRef.current.entries()) {
        if (peerId === peerIdRef.current && isMutedRef.current) {
          nextSpeaking[peerId] = false;
          continue;
        }
        entry.analyser.getByteFrequencyData(entry.data);
        let sum = 0;
        for (let i = 0; i < entry.data.length; i++) {
          sum += entry.data[i];
        }
        const avg = sum / entry.data.length;
        nextSpeaking[peerId] = avg > 18;
      }
      setSpeakingPeerIds(nextSpeaking);
    }, 140);
    return () => window.clearInterval(id);
  }, [inVoiceCall]);

  // Send message (works online in real-time AND offline via persistent auto-sync queue!)
  const sendMessage = useCallback(
    (rawText: string): RealtimeChatMessage | null => {
      const text = rawText.trim();
      if (!text || !normalizedRoom) return null;

      const id = `cmsg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      const timestamp = new Date().toISOString();
      const p = profileRef.current;

      const isLiveSent =
        navigator.onLine &&
        sendWs({
          type: 'chat:send',
          id,
          text,
          timestamp,
        });

      const optimisticMsg: RealtimeChatMessage = {
        id,
        roomCode: normalizedRoom,
        senderPeerId: peerIdRef.current,
        senderName: p.userName,
        senderInitials: p.userInitials,
        text,
        timestamp,
        delivery: isLiveSent ? 'sent' : 'pending',
      };

      setMessages((prev) => {
        const merged = mergeMessagesIdempotently(prev, [optimisticMsg]);
        saveCachedRoomMessages(normalizedRoom, merged);
        return merged;
      });

      if (!isLiveSent) {
        const queue = loadOfflineQueue();
        queue.push({
          id,
          roomCode: normalizedRoom,
          senderPeerId: peerIdRef.current,
          senderName: p.userName,
          senderInitials: p.userInitials,
          text,
          timestamp,
        });
        saveOfflineQueue(queue);
        setPendingCount(queue.length);
      }

      return optimisticMsg;
    },
    [normalizedRoom, sendWs]
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (connectionState === 'connected') {
        sendWs({ type: 'chat:typing', isTyping });
      }
    },
    [connectionState, sendWs]
  );

  return {
    myPeerId: peerIdRef.current,
    connectionState,
    peers,
    voicePeers: peers.filter((p) => p.inCall),
    messages,
    typingPeers,
    pendingCount,
    inVoiceCall,
    isMuted,
    isDeafened,
    callSeconds,
    voiceError,
    speakingPeerIds,
    remoteStreams,
    sendMessage,
    sendTyping,
    joinVoiceCall,
    leaveVoiceCall,
    toggleMute,
    toggleDeafen,
  };
}
