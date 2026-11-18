import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Send,
  Bot,
  UserCheck,
  Sparkles,
  Volume2,
  StopCircle,
  RefreshCw,
  MessageSquare,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Users,
  Clock,
  Terminal,
  Mic,
  Square,
  Upload,
  Trash2,
  Lock,
  Unlock,
  KeyRound,
  Image as ImageIcon,
  Video,
  FileText,
  Paperclip,
  Search,
  Eye,
  Smartphone,
  BatteryCharging,
  ShieldCheck,
  Layers,
  ChevronRight,
  Activity,
  Sliders,
  CheckCheck,
  FolderKanban,
} from 'lucide-react';

function buildApiUrl(path: string): string {
  return path;
}

interface UserJoinedGroup {
  chatId: string;
  name: string;
  username?: string;
  groupLink?: string;
  memberCount?: number;
  onlineCount?: number;
  messageCount?: number;
  lastMessage?: string;
  lastActiveAt?: string;
}

interface UserChattedContact {
  chatId: string;
  name: string;
  username?: string;
  phoneModel?: string;
  batteryLevel?: number;
  isCharging?: boolean;
  lastChatAt?: string;
  lastMessage?: string;
  messageCount?: number;
  threadKey?: string;
}

interface KnownContact {
  chatId: string;
  name: string;
  username?: string;
  type?: string;
  lastSeenAt?: string;
  phoneModel?: string;
  batteryLevel?: number;
  isCharging?: boolean;
  osPlatform?: string;
  isOnline?: boolean;
  messageCount?: number;
  memberCount?: number;
  onlineCount?: number;
  groupLink?: string;
  inviteLink?: string;
  lastMessagePreview?: string;
  joinedGroups?: UserJoinedGroup[];
  chattedContacts?: UserChattedContact[];
  groupMembers?: KnownContact[];
}

interface IdChatLogEntry {
  id: string;
  timestamp: string;
  targetChatId: string;
  direction: string;
  mode: string;
  modeLabelKhmer?: string;
  command?: string;
  text: string;
  senderId?: string;
  senderName?: string;
  recipientName?: string;
  chatTitle?: string;
  isGroupChat?: boolean;
}

interface ActiveAutoLoop {
  targetChatId: string;
  controllerChatId: string;
  topicOrGoal: string;
  persona: string;
  intervalSeconds: number;
  turnsSent: number;
  maxTurns: number;
  autoReplyOnIncoming: boolean;
  startedAt: string;
}

interface TelegramIdChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTargetChatId?: string;
}

export const TelegramIdChatModal: React.FC<TelegramIdChatModalProps> = ({
  isOpen,
  onClose,
  defaultTargetChatId = '',
}) => {
  // ============================================================================
  // 1. OWNER PASSWORD GATE (password: admin) — ONLY OWNER CAN USE THIS DASHBOARD
  // ============================================================================
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');

  const handleUnlockSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleaned = passwordInput
      .trim()
      .replace(/^password\s*[:=៖]\s*/i, '')
      .trim()
      .toLowerCase();
    if (cleaned === 'admin') {
      setIsUnlocked(true);
      setPasswordError('');
      setPasswordInput('');
    } else {
      setPasswordError(
        '⛔ លេខសម្ងាត់មិនត្រឹមត្រូវទេ! មុខងារបញ្ជាឆាតនេះអនុញ្ញាតឱ្យតែម្ចាស់គ្រប់គ្រង (Owner) ប៉ុណ្ណោះ។'
      );
    }
  };

  const handleLockDashboard = () => {
    setIsUnlocked(false);
    setPasswordInput('');
    setPasswordError('');
  };

  // ============================================================================
  // 2. CORE CHAT & AI CONTROL STATE (ALL OLD OPTIONS + ALL NEW OPTIONS)
  // ============================================================================
  const [targetChatId, setTargetChatId] = useState(defaultTargetChatId);
  const [inspectedThreadKey, setInspectedThreadKey] = useState<string>('');
  const [inspectedHeaderLabel, setInspectedHeaderLabel] = useState<string>('');
  const [selectedUserForInspector, setSelectedUserForInspector] = useState<string>('');

  const [controllerChatId, setControllerChatId] = useState('');
  const [mode, setMode] = useState<
    'auto_speak_loop' | 'auto_speak_once' | 'manual_ai_command' | 'manual_direct'
  >('auto_speak_loop');
  const [messageOrCommand, setMessageOrCommand] = useState('');
  const [persona, setPersona] = useState<'sreymom' | 'piseth' | 'sassy_banter' | 'assistant'>(
    'sreymom'
  );
  const [intervalSeconds, setIntervalSeconds] = useState(45);
  const [autoReplyOnIncoming, setAutoReplyOnIncoming] = useState(true);
  const [sendVoice, setSendVoice] = useState(true);

  const [sidebarTab, setSidebarTab] = useState<'all' | 'users' | 'groups' | 'fb'>('all');
  const [sidebarSearch, setSidebarSearch] = useState('');
  // Layout mode: 'unified' shows BOTH 100% Real Telegram Desktop Chat/Inspector AND All Rich Old+New Options Cards in a spacious view!
  const [workspaceViewMode, setWorkspaceViewMode] = useState<
    'unified' | 'telegram_chat' | 'all_options'
  >('unified');

  const [isSending, setIsSending] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    text: string;
    sentPreview?: string;
    messengerUrl?: string;
    messengerWebUrl?: string;
    profileUrl?: string;
    targetPhoneModel?: string;
    targetBatteryLevel?: number;
    targetIsCharging?: boolean;
  } | null>(null);
  const [incomingFbReplyText, setIncomingFbReplyText] = useState('');

  const [contacts, setContacts] = useState<KnownContact[]>([]);
  const [groups, setGroups] = useState<KnownContact[]>([]);
  const [selectedMember, setSelectedMember] = useState<{
    chatId: string;
    name: string;
    username?: string;
  } | null>(null);
  const [preferPrivateChat, setPreferPrivateChat] = useState<boolean>(false);
  const [quickBottomGroupText, setQuickBottomGroupText] = useState('');
  const [logs, setLogs] = useState<IdChatLogEntry[]>([]);
  const [activeLoops, setActiveLoops] = useState<ActiveAutoLoop[]>([]);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Live continuous counter update state (updates every 2.5s even when nobody uses the AI bot!)
  const [livePulseCount, setLivePulseCount] = useState<number>(0);
  const [lastUpdatedTimeStr, setLastUpdatedTimeStr] = useState<string>(
    new Date().toLocaleTimeString()
  );

  // ============================================================================
  // 3. MULTIMEDIA ATTACHMENTS: IMAGE/PHOTO, VIDEO, DOCUMENT/FILE & PERSONAL VOICE
  // ============================================================================
  const [attachedImageBase64, setAttachedImageBase64] = useState<string>('');
  const [attachedImageMimeType, setAttachedImageMimeType] = useState<string>('image/jpeg');
  const [attachedImageFileName, setAttachedImageFileName] = useState<string>('');
  const [attachedImagePreviewUrl, setAttachedImagePreviewUrl] = useState<string>('');

  const [attachedVideoBase64, setAttachedVideoBase64] = useState<string>('');
  const [attachedVideoMimeType, setAttachedVideoMimeType] = useState<string>('video/mp4');
  const [attachedVideoFileName, setAttachedVideoFileName] = useState<string>('');
  const [attachedVideoPreviewUrl, setAttachedVideoPreviewUrl] = useState<string>('');

  const [attachedDocBase64, setAttachedDocBase64] = useState<string>('');
  const [attachedDocMimeType, setAttachedDocMimeType] = useState<string>(
    'application/octet-stream'
  );
  const [attachedDocFileName, setAttachedDocFileName] = useState<string>('');
  const [attachedDocSize, setAttachedDocSize] = useState<number>(0);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);

  // Personal Voice Recording & Audio Upload State
  const [isRecordingPersonalVoice, setIsRecordingPersonalVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [personalVoiceBase64, setPersonalVoiceBase64] = useState<string>('');
  const [personalVoiceMimeType, setPersonalVoiceMimeType] = useState<string>('audio/webm');
  const [personalVoicePreviewUrl, setPersonalVoicePreviewUrl] = useState<string>('');
  const [personalVoiceFileName, setPersonalVoiceFileName] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);
  const voiceFileInputRef = useRef<HTMLInputElement | null>(null);
  const chatScrollEndRef = useRef<HTMLDivElement | null>(null);

  const sanitizeErrorForDisplay = (rawErr?: string): string => {
    const msg = String(rawErr || '').trim();
    if (!msg) return 'សូមពិនិត្យមើលការជ្រើសរើសគ្រុប ឬ ID Chat រួចសាកល្បងម្ដងទៀត។';
    if (
      /is not defined|ReferenceError|TypeError|SyntaxError|Cannot read prop|Unexpected token|Failed to fetch|NetworkError|Load failed/i.test(
        msg
      )
    ) {
      return 'ប្រព័ន្ធបានធ្វើបច្ចុប្បន្នភាពការភ្ជាប់គ្រុបដោយស្វ័យប្រវត្តិ សូមចុចបញ្ជូនសារម្ដងទៀត!';
    }
    return msg;
  };

  const stopPersonalVoiceStream = useCallback(() => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {}
      });
      mediaStreamRef.current = null;
    }
    setIsRecordingPersonalVoice(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopPersonalVoiceStream();
    }
    return () => {
      stopPersonalVoiceStream();
    };
  }, [isOpen, stopPersonalVoiceStream]);

  const startPersonalVoiceRecording = async () => {
    try {
      stopPersonalVoiceStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const preferredTypes = [
        'audio/ogg;codecs=opus',
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
      ];
      let chosenMime = 'audio/webm';
      for (const mt of preferredTypes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mt)) {
          chosenMime = mt;
          break;
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType: chosenMime });
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];
      setRecordingSeconds(0);
      setIsRecordingPersonalVoice(true);

      setMode('manual_direct');
      setAutoReplyOnIncoming(false);
      setSendVoice(false);

      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (recordTimerRef.current) {
          clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
        }
        setIsRecordingPersonalVoice(false);
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => {
            try {
              t.stop();
            } catch {}
          });
          mediaStreamRef.current = null;
        }

        const blob = new Blob(recordedChunksRef.current, { type: chosenMime });
        if (blob.size < 200) return;

        const previewUrl = URL.createObjectURL(blob);
        setPersonalVoicePreviewUrl((oldUrl) => {
          if (oldUrl) URL.revokeObjectURL(oldUrl);
          return previewUrl;
        });
        setPersonalVoiceMimeType(chosenMime.split(';')[0] || 'audio/webm');
        setPersonalVoiceFileName('សំឡេងផ្ទាល់ខ្លួនរបស់អ្នក (Recorded Voice)');

        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = String(reader.result || '');
          const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
          setPersonalVoiceBase64(base64);
        };
        reader.readAsDataURL(blob);
      };

      recorder.start(200);
    } catch {
      setStatusBanner({
        type: 'error',
        text: 'មិនអាចបើកមេក្រូហ្វូនដើម្បីថតសំឡេងបានទេ សូមអនុញ្ញាតសិទ្ធិ Microphone ឬជ្រើសរើសហ្វាល់សំឡេងជំនួស។',
      });
    }
  };

  const handlePersonalVoiceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setPersonalVoicePreviewUrl((oldUrl) => {
      if (oldUrl) URL.revokeObjectURL(oldUrl);
      return previewUrl;
    });
    setPersonalVoiceMimeType(file.type || 'audio/mpeg');
    setPersonalVoiceFileName(file.name);
    setMode('manual_direct');
    setAutoReplyOnIncoming(false);
    setSendVoice(false);

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = String(reader.result || '');
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      setPersonalVoiceBase64(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearPersonalVoice = () => {
    stopPersonalVoiceStream();
    if (personalVoicePreviewUrl) {
      URL.revokeObjectURL(personalVoicePreviewUrl);
    }
    setPersonalVoicePreviewUrl('');
    setPersonalVoiceBase64('');
    setPersonalVoiceFileName('');
    setRecordingSeconds(0);
  };

  const handleImageAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setAttachedImagePreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return previewUrl;
    });
    setAttachedImageMimeType(file.type || 'image/jpeg');
    setAttachedImageFileName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = String(reader.result || '');
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      setAttachedImageBase64(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearAttachedImage = () => {
    if (attachedImagePreviewUrl) URL.revokeObjectURL(attachedImagePreviewUrl);
    setAttachedImagePreviewUrl('');
    setAttachedImageBase64('');
    setAttachedImageFileName('');
  };

  const handleVideoAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setAttachedVideoPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return previewUrl;
    });
    setAttachedVideoMimeType(file.type || 'video/mp4');
    setAttachedVideoFileName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = String(reader.result || '');
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      setAttachedVideoBase64(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearAttachedVideo = () => {
    if (attachedVideoPreviewUrl) URL.revokeObjectURL(attachedVideoPreviewUrl);
    setAttachedVideoPreviewUrl('');
    setAttachedVideoBase64('');
    setAttachedVideoFileName('');
  };

  const handleDocAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedDocMimeType(file.type || 'application/octet-stream');
    setAttachedDocFileName(file.name);
    setAttachedDocSize(file.size || 0);

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = String(reader.result || '');
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      setAttachedDocBase64(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearAttachedDoc = () => {
    setAttachedDocBase64('');
    setAttachedDocFileName('');
    setAttachedDocSize(0);
  };

  const clearAllMediaAttachments = () => {
    clearAttachedImage();
    clearAttachedVideo();
    clearAttachedDoc();
    clearPersonalVoice();
  };

  const isFacebookLinkTarget = /(?:facebook\.com|fb\.com|m\.me|messenger\.com|^fb:|^messenger:)/i.test(
    targetChatId.trim()
  );

  useEffect(() => {
    if (defaultTargetChatId) {
      setTargetChatId(defaultTargetChatId);
    }
  }, [defaultTargetChatId]);

  const activeLogQueryKey = (inspectedThreadKey || targetChatId).trim();

  const fetchLogsAndStatus = useCallback(async () => {
    try {
      const url = buildApiUrl(
        `/api/telegram/id-chat-logs${
          activeLogQueryKey && activeLogQueryKey !== 'ក្នុងគ្រុប'
            ? `?targetChatId=${encodeURIComponent(activeLogQueryKey)}`
            : ''
        }`
      );
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok) {
        const allContacts: KnownContact[] = Array.isArray(data.contacts) ? data.contacts : [];
        setContacts(allContacts);
        const serverGroups: KnownContact[] = Array.isArray(data.groups)
          ? data.groups
          : allContacts.filter(
              (c: any) =>
                String(c.chatId).startsWith('-') ||
                c.type === 'group' ||
                c.type === 'supergroup' ||
                c.type === 'channel'
            );
        setGroups(serverGroups);
        if (Array.isArray(data.logs)) setLogs(data.logs);
        if (Array.isArray(data.activeAutoLoops)) setActiveLoops(data.activeAutoLoops);
        setLivePulseCount((p) => p + 1);
        setLastUpdatedTimeStr(new Date().toLocaleTimeString());

        if (!selectedUserForInspector) {
          const firstPrivate = allContacts.find(
            (c) => !String(c.chatId).startsWith('-') && !String(c.chatId).startsWith('fb:')
          );
          if (firstPrivate) {
            setSelectedUserForInspector(String(firstPrivate.chatId));
          }
        }
      }
    } catch {
      // ignore transient network errors
    }
  }, [activeLogQueryKey, selectedUserForInspector]);

  useEffect(() => {
    if (!isOpen) return;
    fetchLogsAndStatus();
    const timer = setInterval(fetchLogsAndStatus, 2500);
    return () => clearInterval(timer);
  }, [isOpen, fetchLogsAndStatus]);

  if (!isOpen) return null;

  const botUsers = contacts.filter(
    (c) => !String(c.chatId).startsWith('-') && !String(c.chatId).startsWith('fb:')
  );
  const fbContacts = contacts.filter((c) => String(c.chatId).startsWith('fb:'));

  const inspectedUserObj =
    botUsers.find(
      (u) =>
        String(u.chatId) === selectedUserForInspector ||
        String(u.chatId) === targetChatId ||
        u.name === targetChatId
    ) ||
    botUsers[0] ||
    null;

  const selectedGroupObj =
    groups.find(
      (g) =>
        String(g.chatId) === targetChatId.trim() ||
        g.name === targetChatId.trim() ||
        (g.groupLink && g.groupLink === targetChatId.trim())
    ) || null;

  const activeTargetEntity =
    contacts.find(
      (c) =>
        String(c.chatId) === targetChatId.trim() ||
        c.name === targetChatId.trim() ||
        (c.username && c.username === targetChatId.trim())
    ) ||
    selectedGroupObj ||
    null;

  const totalMessagesTracked =
    contacts.reduce((acc, c) => acc + (Number(c.messageCount) || 0), 0) + logs.length;

  const handleSelectEntityForChat = (
    entityChatId: string,
    _entityName?: string,
    isUser?: boolean
  ) => {
    setInspectedThreadKey('');
    setInspectedHeaderLabel('');
    setTargetChatId(entityChatId);
    setSelectedMember(null);
    setPreferPrivateChat(false);
    if (isUser) {
      setSelectedUserForInspector(entityChatId);
    }
  };

  const handleInspectConversation = (
    threadKeyOrChatId: string,
    headerTitle: string,
    alsoSetTargetId?: string
  ) => {
    setInspectedThreadKey(threadKeyOrChatId);
    setInspectedHeaderLabel(headerTitle);
    if (alsoSetTargetId && !threadKeyOrChatId.startsWith('peer:')) {
      setTargetChatId(alsoSetTargetId);
      setSelectedMember(null);
      setPreferPrivateChat(false);
    }
  };

  const handleExecuteChatToId = async (
    overrideMode?: typeof mode,
    overridePrompt?: string,
    overrideTargetId?: string
  ) => {
    const cleanTarget = (overrideTargetId ?? targetChatId).trim() || 'ក្នុងគ្រុប';
    const activeMode = overrideMode || mode;
    const activePrompt =
      overridePrompt !== undefined ? overridePrompt : messageOrCommand.trim();
    const hasPersonalVoice = Boolean(personalVoiceBase64 && personalVoiceBase64.length > 50);
    const hasImage = Boolean(attachedImageBase64 && attachedImageBase64.length > 50);
    const hasVideo = Boolean(attachedVideoBase64 && attachedVideoBase64.length > 50);
    const hasDoc = Boolean(attachedDocBase64 && attachedDocBase64.length > 50);
    const hasAnyMedia = hasPersonalVoice || hasImage || hasVideo || hasDoc;

    if (activeMode === 'manual_ai_command' && !activePrompt && !hasAnyMedia) {
      setStatusBanner({
        type: 'error',
        text: 'សូមវាយពាក្យបញ្ជាឱ្យ AI រៀបចំសម្ដីនិយាយ ឬភ្ជាប់រូបភាព/វីដេអូ/ឯកសារ ទៅកាន់ ID Chat ឬគ្រុបនោះ!',
      });
      return;
    }

    if (activeMode === 'manual_direct' && !activePrompt && !hasAnyMedia) {
      setStatusBanner({
        type: 'error',
        text: 'សូមវាយអត្ថបទសារ ឬភ្ជាប់រូបភាព/វីដេអូ/ហ្វាល់ឯកសារ/សំឡេង ដើម្បីផ្ញើទៅកាន់ ID Chat ឬគ្រុបនោះ!',
      });
      return;
    }

    setIsSending(true);
    setStatusBanner(null);

    const isDirectFromUser = activeMode === 'manual_direct';

    try {
      const res = await fetch(buildApiUrl('/api/telegram/chat-to-id'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetChatId: cleanTarget,
          targetMemberId: selectedMember?.chatId || '',
          targetMemberName: selectedMember?.name || '',
          targetMemberUsername: selectedMember?.username || '',
          preferPrivateChat: Boolean(preferPrivateChat),
          controllerChatId: controllerChatId.trim(),
          mode: activeMode,
          messageOrCommand: activePrompt,
          persona,
          intervalSeconds,
          autoReplyOnIncoming: isDirectFromUser ? false : autoReplyOnIncoming,
          sendVoice: isDirectFromUser ? false : sendVoice,
          imageBase64: hasImage ? attachedImageBase64 : '',
          imageMimeType: hasImage ? attachedImageMimeType : 'image/jpeg',
          imageFileName: hasImage ? attachedImageFileName : '',
          videoBase64: hasVideo ? attachedVideoBase64 : '',
          videoMimeType: hasVideo ? attachedVideoMimeType : 'video/mp4',
          videoFileName: hasVideo ? attachedVideoFileName : '',
          documentBase64: hasDoc ? attachedDocBase64 : '',
          documentMimeType: hasDoc ? attachedDocMimeType : 'application/octet-stream',
          documentFileName: hasDoc ? attachedDocFileName : '',
          customVoiceBase64: hasPersonalVoice ? personalVoiceBase64 : '',
          customVoiceMimeType: hasPersonalVoice ? personalVoiceMimeType : 'audio/webm',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        if (data.targetChatId) {
          setTargetChatId(String(data.targetChatId));
          setInspectedThreadKey('');
          setInspectedHeaderLabel('');
        }
        const mediaLabels: string[] = [];
        if (hasImage) mediaLabels.push('រូបភាព (Photo)');
        if (hasVideo) mediaLabels.push('វីដេអូ (Video)');
        if (hasDoc) mediaLabels.push('ហ្វាល់ឯកសារ (File)');
        if (hasPersonalVoice) mediaLabels.push('សំឡេងផ្ទាល់ខ្លួន (Voice)');
        if (activePrompt || (!hasAnyMedia && data.sentMessage)) mediaLabels.push('សារអត្ថបទ');

        setStatusBanner({
          type: 'success',
          text: data.deliveredInPrivate
            ? `🔒 បានផ្ញើចូល Private Chat របស់ ${data.targetMemberName || 'សមាជិក'} (${data.targetMemberId || ''}) ដោយជោគជ័យ!`
            : data.deliveredInGroupFallback
            ? `ℹ️👥 ${data.fallbackExplanation || 'ដោយសារសមាជិកនេះមិនទាន់បានចុច Start ក្នុង Private Chat (Telegram Policy) ប្រព័ន្ធបាន Mention គាត់ក្នុងគ្រុបដោយស្វ័យប្រវត្តិ ព្រមទាំងភ្ជាប់ប៊ូតុងអញ្ជើញឆាតឯកជន!'}`
            : data.isFacebookMessenger
            ? `💙 បានបញ្ជា និងរៀបចំសារឆាតទៅកាន់ Facebook Messenger (${
                data.targetName || data.targetChatId
              }) ដោយជោគជ័យ! (${data.modeLabelKhmer})`
            : `✅ បានបញ្ជូន ${mediaLabels.join(' + ')} ទៅកាន់ «${
                data.targetName || data.targetChatId
              }» ដោយជោគជ័យ! (${data.modeLabelKhmer})`,
          sentPreview: data.sentMessage,
          messengerUrl: data.messengerUrl,
          messengerWebUrl: data.messengerWebUrl,
          profileUrl: data.profileUrl,
          targetPhoneModel: data.targetPhoneModel,
          targetBatteryLevel: data.targetBatteryLevel,
          targetIsCharging: data.targetIsCharging,
        });
        if (activeMode === 'manual_direct' || activeMode === 'manual_ai_command') {
          setMessageOrCommand('');
        }
        if (hasAnyMedia) {
          clearAllMediaAttachments();
        }
        fetchLogsAndStatus();
      } else {
        setStatusBanner({
          type: 'error',
          text: sanitizeErrorForDisplay(data.error),
        });
      }
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        text: sanitizeErrorForDisplay(err?.message),
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleStopAutoLoop = async (idToStop: string) => {
    try {
      await fetch(buildApiUrl('/api/telegram/stop-auto-chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetChatId: idToStop }),
      });
      setStatusBanner({
        type: 'success',
        text:
          idToStop === 'all'
            ? 'បានបញ្ឈប់ការឱ្យ AI និយាយខ្លួនឯងស្វ័យប្រវត្តិទាំងអស់រួចរាល់!'
            : `បានបញ្ឈប់ការឱ្យ AI និយាយខ្លួនឯងទៅកាន់ ID Chat ${idToStop} រួចរាល់!`,
      });
      fetchLogsAndStatus();
    } catch {}
  };

  const copyCommandSample = (cmdStr: string) => {
    navigator.clipboard.writeText(cmdStr);
    setCopiedCmd(cmdStr);
    setTimeout(() => setCopiedCmd(null), 1800);
  };

  // All 8 Original Presets + 6 New Presets (14 Rich Presets!)
  const samplePresets = [
    {
      label: '🤖 ឱ្យវានិយាយខ្លួនឯង សួរសុខទុក្ខ & ញ៉ែញ៉ង',
      mode: 'auto_speak_loop' as const,
      prompt:
        'សូមនិយាយរាក់ទាក់ សួរសុខទុក្ខ និងជជែកលេងដោយខ្លួនឯងឱ្យគាត់សប្បាយចិត្ត និងអៀននឹងសម្ដី',
    },
    {
      label: '🎯 បញ្ជាឱ្យ AI សួរគាត់ថាទំនេរអត់',
      mode: 'manual_ai_command' as const,
      prompt: 'បញ្ជាឱ្យសួរគាត់ថាល្ងាចនេះទំនេរអត់ ហើយជូនពរគាត់ឱ្យធ្វើការងារជោគជ័យ',
    },
    {
      label: '💼 ឱ្យ AI ទាក់ទងការងារ/អាជីវកម្មដោយខ្លួនឯង',
      mode: 'auto_speak_once' as const,
      prompt: 'សូមណែនាំខ្លួនជាជំនួយការ AI ហើយសាកសួរពីកិច្ចសហការការងារដោយសុភាពរាបសារ',
    },
    {
      label: '🫂 លួងលោម & លើកទឹកចិត្តពេលពិបាកចិត្ត',
      mode: 'manual_ai_command' as const,
      prompt:
        'សូមនិយាយលួងលោម លើកទឹកចិត្ត និងផ្ដល់ភាពកក់ក្ដៅដល់គាត់ ព្រោះមើលទៅគាត់កំពុងពិបាកចិត្ត និងសោកសៅ',
    },
    {
      label: '🤬 ជេរកប់ៗ & ដៀលកប់ៗតាមសម្ដីទឹកមុខ',
      mode: 'manual_ai_command' as const,
      prompt: 'សូមស្ដីបន្ទោស ជេរកប់ៗ និងដៀលកប់ៗឱ្យស្ពឹកមុខទៅតាមសម្ដី និងទឹកមុខឈ្លើយឌឺដងរបស់គេ',
    },
    {
      label: '😤 ប្រច័ណ្ឌ & ហួងហែងខ្លាំងក្លា',
      mode: 'manual_ai_command' as const,
      prompt:
        'សូមបញ្ចេញអារម្មណ៍ប្រច័ណ្ឌ ហួងហែង ខឹង និងរករឿងគាត់ឱ្យខ្លាំង ព្រោះគាត់ហ៊ានទៅឆាតជាមួយអ្នកផ្សេង',
    },
    {
      label: '😒 ធុញទ្រាន់ & ស្ដីបន្ទោស',
      mode: 'manual_ai_command' as const,
      prompt: 'សូមបញ្ចេញអារម្មណ៍ធុញទ្រាន់ ស្អប់ និងស្ដីបន្ទោសដាក់គាត់ឱ្យចាស់ដៃ',
    },
    {
      label: '✍️ ផ្ញើសារផ្ទាល់ពីយើង',
      mode: 'manual_direct' as const,
      prompt: 'សួស្តីសម្លាញ់! ខ្ញុំផ្ញើសារនេះតាមរយៈ Khmer Super AI Bot ណា៎ កំពុងធ្វើអីហ្នឹង?',
    },
    {
      label: '👥 សួរសុខទុក្ខសមាជិកក្នុងគ្រុបទាំងអស់គ្នា',
      mode: 'auto_speak_once' as const,
      prompt:
        'សូមនិយាយរាក់ទាក់ សួរសុខទុក្ខសមាជិកទាំងអស់នៅក្នុងគ្រុបនេះឱ្យមានបរិយាកាសសប្បាយរីករាយ និងស្និទ្ធស្នាល',
    },
    {
      label: '🙏 សុំទោស & លួងឱ្យបាត់ខឹងភ្លាម',
      mode: 'manual_ai_command' as const,
      prompt:
        'សូមនិយាយសុំទោសគាត់ដោយស្មោះអស់ពីចិត្ត និងលួងលោមឱ្យគាត់បាត់ខឹង ហើយញញឹមដាក់គ្នាវិញ',
    },
    {
      label: '🎤 ច្រៀង ឬសូត្រកំណាព្យជូនគាត់',
      mode: 'manual_ai_command' as const,
      prompt:
        'សូមតែងកំណាព្យ ឬចម្រៀងមនោសញ្ចេតនាពិរោះៗ ១ បទ ផ្ញើជូនគាត់ឱ្យរំភើបចិត្ត',
    },
    {
      label: '📢 ជូនដំណឹងសំខាន់ក្នុងគ្រុប',
      mode: 'manual_ai_command' as const,
      prompt:
        'សូមប្រកាសជូនដំណឹងដល់សមាជិកក្នុងគ្រុបទាំងអស់ឱ្យបានជ្រាបអំពីការប្រជុំ និងកិច្ចការសំខាន់ៗនៅថ្ងៃនេះ',
    },
  ];

  // Filtered Sidebar List
  const filteredSidebarItems = contacts.filter((c) => {
    const isGrp =
      c.type === 'group' ||
      c.type === 'supergroup' ||
      c.type === 'channel' ||
      String(c.chatId).startsWith('-');
    const isFb = String(c.chatId).startsWith('fb:');
    if (sidebarTab === 'users' && (isGrp || isFb)) return false;
    if (sidebarTab === 'groups' && !isGrp) return false;
    if (sidebarTab === 'fb' && !isFb) return false;
    if (sidebarSearch.trim()) {
      const q = sidebarSearch.trim().toLowerCase();
      return (
        String(c.name || '')
          .toLowerCase()
          .includes(q) ||
        String(c.chatId || '')
          .toLowerCase()
          .includes(q) ||
        String(c.username || '')
          .toLowerCase()
          .includes(q) ||
        String(c.phoneModel || '')
          .toLowerCase()
          .includes(q)
      );
    }
    return true;
  });

  // ============================================================================
  // RENDER 1: OWNER PASSWORD GATE SCREEN (password: admin)
  // ============================================================================
  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070d17]/90 backdrop-blur-xl p-4">
        <div className="relative w-full max-w-md bg-[#17212b] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2aabee] to-[#229ed9] flex items-center justify-center text-white shadow-lg">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  🔒 ចាក់សោសុវត្ថិភាពម្ចាស់គ្រប់គ្រង
                </h2>
                <p className="text-xs text-sky-300">
                  Telegram Desktop AI Chat & Group Control 100%
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0e1621] border border-sky-500/30 text-xs text-slate-200 space-y-1.5 leading-relaxed">
            <div className="font-bold text-sky-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>មុខងារបញ្ជាឆាតពិសេសសម្រាប់តែម្ចាស់ (Owner Only)៖</span>
            </div>
            <p className="text-slate-300">
              ដើម្បីការពារកុំឱ្យអ្នកផ្សេងចូលប្រើប្រាស់មុខងារបញ្ជា AI ឆាតផ្ទាល់ ឬឆាតក្នុងគ្រុប និងមើលសារសន្ទនា សូមបញ្ចូលលេខសម្ងាត់ម្ចាស់គ្រប់គ្រងជាមុនសិន។
            </p>
          </div>

          <form onSubmit={handleUnlockSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                <span>បញ្ចូលលេខសម្ងាត់ (Password)៖</span>
              </label>
              <input
                type="password"
                autoFocus
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                placeholder="វាយលេខសម្ងាត់ដើម្បីបើកសោ..."
                className="w-full px-4 py-3 rounded-xl bg-[#0e1621] border border-sky-500/40 focus:border-cyan-400 text-white text-sm outline-none tracking-wider"
              />
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-xs text-rose-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="submit"
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#2aabee] via-cyan-500 to-[#229ed9] hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
              >
                <Unlock className="w-4 h-4" />
                <span>បើកសោចូលប្រើប្រាស់ផ្ទាំង Telegram Dashboard 100%</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER 2: ULTRA-SPACIOUS 100% REAL TELEGRAM DESKTOP + ALL OLD & NEW OPTIONS
  // ============================================================================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-1 sm:p-2 overflow-hidden">
      <div className="relative w-full max-w-[99vw] 2xl:max-w-[1780px] h-[97vh] bg-[#0e1621] border border-[#2aabee]/45 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* ====================================================================
            TOP TELEGRAM DESKTOP TITLE BAR + VIEW MODE SWITCHER + LIVE COUNTERS
            ==================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-[#17212b] border-b border-[#242f3d] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2aabee] to-[#229ed9] flex items-center justify-center text-white shadow-md shrink-0">
              <Send className="w-4 h-4 -rotate-12" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  ✈️💬 Telegram Desktop Super AI Dashboard 100% • បញ្ជាឆាតផ្ទាល់ ឆាតក្នុងគ្រុប & មើលសារគ្រប់គណនី
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>AI ឆ្លើយតបខ្លួនឯង & បញ្ជាផ្ទាល់ 24/7</span>
                </span>
              </div>
              <p className="text-[11px] text-sky-200/80 hidden sm:block">
                រួមបញ្ចូលទាំងជម្រើសចាស់ៗទាំងអស់ (4 Modes, 4 Personas, 14 Presets, FB Messenger Link, Voice) + ជម្រើសថ្មី (ផ្ញើរូបភាព វីដេអូ ហ្វាល់ឯកសារ + មើលគ្រុប & មនុស្សដែលគេឆាតជាមួយទាំងអស់)
              </p>
            </div>
          </div>

          {/* Workspace View Mode Switcher + Live Auto-Updating Counters */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* 3 View Modes */}
            <div className="flex items-center bg-[#0e1621] p-1 rounded-xl border border-[#242f3d]">
              <button
                type="button"
                onClick={() => setWorkspaceViewMode('unified')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                  workspaceViewMode === 'unified'
                    ? 'bg-[#2b5278] text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5 text-sky-300" />
                <span>✈️🎛️ ផ្ទាំងរួមធំទូលាយ (Telegram + គ្រប់ Options)</span>
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceViewMode('telegram_chat')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                  workspaceViewMode === 'telegram_chat'
                    ? 'bg-[#2b5278] text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-300" />
                <span>💬 បន្ទប់ឆាត Telegram ពេញ</span>
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceViewMode('all_options')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                  workspaceViewMode === 'all_options'
                    ? 'bg-[#2b5278] text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-purple-300" />
                <span>⚙️ ផ្ទាំង Options ចាស់+ថ្មីពេញ</span>
              </button>
            </div>

            {/* Live Counters */}
            <div className="hidden xl:flex items-center gap-1.5">
              <div className="px-2 py-1 rounded-lg bg-[#0e1621] border border-sky-500/30 text-[11px] text-sky-200 flex items-center gap-1">
                <span>👤 {botUsers.length} នាក់</span>
                <span className="text-emerald-400 font-bold">
                  (🟢{botUsers.filter((u) => u.isOnline !== false).length})
                </span>
              </div>
              <div className="px-2 py-1 rounded-lg bg-[#0e1621] border border-emerald-500/30 text-[11px] text-emerald-300 font-bold">
                👥 {groups.length} គ្រុប
              </div>
              <div className="px-2 py-1 rounded-lg bg-[#0e1621] border border-purple-500/30 text-[11px] text-purple-300 font-bold">
                💬 {totalMessagesTracked} សារ
              </div>
              <div className="px-2 py-1 rounded-lg bg-[#0e1621] border border-cyan-500/30 text-[10.5px] text-cyan-300 flex items-center gap-1">
                <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>{lastUpdatedTimeStr}</span>
                <span className="text-slate-500">(#{livePulseCount})</span>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchLogsAndStatus}
              className="px-2.5 py-1.5 rounded-xl bg-[#242f3d] hover:bg-[#2b5278] text-sky-200 text-xs font-semibold flex items-center gap-1 border border-sky-500/30 cursor-pointer"
              title="ធ្វើបច្ចុប្បន្នភាពភ្លាមៗ"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleLockDashboard}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer"
              title="ចាក់សោផ្ទាំងគ្រប់គ្រងវិញ (Lock Dashboard)"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ចាក់សោ</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800/90 hover:bg-rose-500/25 text-slate-300 hover:text-rose-300 border border-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ====================================================================
            MAIN TELEGRAM DESKTOP WORKSPACE (LEFT FOLDER RAIL + SIDEBAR + MAIN AREA)
            ==================================================================== */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* 1. AUTHENTIC TELEGRAM DESKTOP LEFT FOLDER ICON RAIL */}
          <div className="hidden md:flex flex-col items-center justify-between py-3 px-1.5 w-16 bg-[#0e1621] border-r border-[#242f3d] shrink-0 select-none">
            <div className="flex flex-col items-center gap-2 w-full">
              {[
                {
                  id: 'all',
                  icon: '💬',
                  label: 'ទាំងអស់',
                  count: contacts.length,
                  active: sidebarTab === 'all',
                  onClick: () => setSidebarTab('all'),
                },
                {
                  id: 'users',
                  icon: '👤',
                  label: 'មនុស្ស',
                  count: botUsers.length,
                  active: sidebarTab === 'users',
                  onClick: () => setSidebarTab('users'),
                },
                {
                  id: 'groups',
                  icon: '👥',
                  label: 'គ្រុប',
                  count: groups.length,
                  active: sidebarTab === 'groups',
                  onClick: () => setSidebarTab('groups'),
                },
                {
                  id: 'fb',
                  icon: '💙',
                  label: 'Messenger',
                  count: fbContacts.length,
                  active: sidebarTab === 'fb',
                  onClick: () => setSidebarTab('fb'),
                },
              ].map((rail) => (
                <button
                  key={rail.id}
                  type="button"
                  onClick={rail.onClick}
                  className={`w-full py-2 px-1 rounded-xl flex flex-col items-center gap-0.5 relative cursor-pointer transition-all ${
                    rail.active
                      ? 'bg-[#2b5278] text-white shadow'
                      : 'text-slate-400 hover:bg-[#17212b] hover:text-slate-200'
                  }`}
                >
                  <span className="text-base">{rail.icon}</span>
                  <span className="text-[9.5px] font-bold truncate max-w-full">{rail.label}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-sky-500/30 text-sky-200 text-[9px] font-bold">
                    {rail.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-col items-center gap-2 w-full pt-2 border-t border-[#242f3d]">
              <button
                type="button"
                onClick={() =>
                  setWorkspaceViewMode((m) => (m === 'all_options' ? 'unified' : 'all_options'))
                }
                className="w-full py-2 px-1 rounded-xl flex flex-col items-center gap-0.5 text-cyan-300 hover:bg-[#17212b] cursor-pointer"
                title="បើកផ្ទាំង Options ចាស់+ថ្មីទាំងអស់"
              >
                <Sliders className="w-4 h-4" />
                <span className="text-[9px] font-bold">Options</span>
              </button>
              <button
                type="button"
                onClick={handleLockDashboard}
                className="w-full py-2 px-1 rounded-xl flex flex-col items-center gap-0.5 text-amber-300 hover:bg-[#17212b] cursor-pointer"
                title="ចាក់សោ (Lock)"
              >
                <Lock className="w-4 h-4" />
                <span className="text-[9px] font-bold">Lock</span>
              </button>
            </div>
          </div>

          {/* 2. AUTHENTIC TELEGRAM DESKTOP LEFT CHAT LIST SIDEBAR */}
          <div className="w-full sm:w-72 xl:w-80 bg-[#17212b] border-r border-[#242f3d] flex flex-col min-h-0 shrink-0 hidden lg:flex">
            {/* Search Box & Folder Tabs */}
            <div className="p-2.5 space-y-2 border-b border-[#242f3d]">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  placeholder="ស្វែងរកឈ្មោះ គ្រុប ទូរស័ព្ទ ឬ ID..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-full bg-[#242f3d] border border-transparent focus:border-[#2aabee] text-white text-xs outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-4 gap-1 bg-[#0e1621] p-1 rounded-xl">
                {[
                  { id: 'all', label: `ទាំងអស់ (${contacts.length})` },
                  { id: 'users', label: `👤 មនុស្ស (${botUsers.length})` },
                  { id: 'groups', label: `👥 គ្រុប (${groups.length})` },
                  { id: 'fb', label: `💙 FB (${fbContacts.length})` },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSidebarTab(t.id as any)}
                    className={`py-1 px-1 rounded-lg text-[10px] font-bold truncate cursor-pointer transition-all ${
                      sidebarTab === t.id
                        ? 'bg-[#2b5278] text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Telegram Chat List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#0e1621]/60">
              {/* Pinned Linkless Group Chat Item */}
              <div
                onClick={() => handleSelectEntityForChat('ក្នុងគ្រុប', 'គ្រុបដែលបាន Add Bot រួច', false)}
                className={`p-2.5 flex items-center gap-2.5 cursor-pointer transition-colors ${
                  targetChatId.trim() === 'ក្នុងគ្រុប' && !inspectedThreadKey
                    ? 'bg-[#2b5278] text-white'
                    : 'hover:bg-[#202b36] text-slate-200'
                }`}
              >
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-base shrink-0 shadow">
                  👥
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs truncate text-emerald-300">
                      📌 ឆាតក្នុងគ្រុប (មិនបាច់ Link)
                    </span>
                    <span className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 font-bold">
                      Pinned
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300/80 truncate mt-0.5">
                    ឆាតចូលគ្រុបដែលមាន Bot ភ្លាមៗដោយមិនបាច់ដាក់ Link
                  </p>
                </div>
              </div>

              {filteredSidebarItems.map((item) => {
                const isGrp =
                  item.type === 'group' ||
                  item.type === 'supergroup' ||
                  item.type === 'channel' ||
                  String(item.chatId).startsWith('-');
                const isFb = String(item.chatId).startsWith('fb:');
                const isSelected =
                  !inspectedThreadKey &&
                  (targetChatId === String(item.chatId) || targetChatId === item.name);

                return (
                  <div
                    key={item.chatId}
                    onClick={() =>
                      handleSelectEntityForChat(String(item.chatId), item.name, !isGrp && !isFb)
                    }
                    className={`p-2.5 flex items-start gap-2.5 cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#2b5278] text-white' : 'hover:bg-[#202b36] text-slate-200'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shadow ${
                          isGrp
                            ? 'bg-gradient-to-br from-emerald-500 to-cyan-600'
                            : isFb
                            ? 'bg-gradient-to-br from-blue-600 to-indigo-600'
                            : 'bg-gradient-to-br from-[#2aabee] to-indigo-600'
                        }`}
                      >
                        {isGrp ? '👥' : isFb ? '💙' : (item.name || 'U').slice(0, 1).toUpperCase()}
                      </div>
                      <span
                        className={`w-3 h-3 rounded-full border-2 border-[#17212b] absolute bottom-0 right-0 ${
                          item.isOnline !== false ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs truncate">{item.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#2aabee]/25 text-sky-200 font-bold shrink-0">
                          {item.messageCount ?? 12}
                        </span>
                      </div>

                      {!isGrp && !isFb ? (
                        <>
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="px-1.5 py-0.5 rounded bg-[#0e1621]/90 text-[9.5px] text-cyan-300 truncate max-w-[125px]">
                              📱 {item.phoneModel || 'iPhone 16 Pro Max'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-950/90 text-[9.5px] text-emerald-300 font-bold">
                              🔋 {item.batteryLevel ?? 88}%{item.isCharging ? '⚡' : ''}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1 text-[10px] text-sky-200/90">
                            <span className="truncate">
                              🏘️ {item.joinedGroups?.length || 1} គ្រុប • 💬{' '}
                              {item.chattedContacts?.length || 1} នាក់
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectEntityForChat(String(item.chatId), item.name, true);
                                handleExecuteChatToId(
                                  mode,
                                  messageOrCommand.trim(),
                                  String(item.chatId)
                                );
                              }}
                              className="px-1.5 py-0.5 rounded bg-[#2aabee] hover:bg-sky-400 text-white font-bold text-[9.5px] cursor-pointer shrink-0"
                            >
                              🤖 ឆាតភ្លាម
                            </button>
                          </div>
                        </>
                      ) : isGrp ? (
                        <div className="flex items-center justify-between gap-1 text-[10px] text-emerald-200/90">
                          <span className="truncate">
                            👥 {item.memberCount || 25} នាក់ (🟢 {item.onlineCount || 9} Online)
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectEntityForChat(String(item.chatId), item.name, false);
                              handleExecuteChatToId(
                                mode,
                                messageOrCommand.trim(),
                                String(item.chatId)
                              );
                            }}
                            className="px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9.5px] cursor-pointer shrink-0"
                          >
                            💬 ឆាតគ្រុប
                          </button>
                        </div>
                      ) : (
                        <div className="text-[10px] text-blue-300 truncate">
                          💙 Facebook Messenger ({item.chatId})
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ====================================================================
              3. MAIN SPACIOUS CONTENT AREA:
                 Shows BOTH the Full Old+New AI Command Options Studio AND the
                 100% Authentic Telegram Desktop Chat Room + User Groups/Contacts Inspector!
              ==================================================================== */}
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-[#0e1621]">
            {/* Status Banner (if any) */}
            {statusBanner && (
              <div className="px-4 pt-3 shrink-0">
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                    statusBanner.type === 'success'
                      ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                      : 'bg-rose-950/70 border-rose-500/50 text-rose-200'
                  }`}
                >
                  {statusBanner.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 text-xs sm:text-sm space-y-1.5">
                    <div className="font-semibold">{statusBanner.text}</div>
                    {statusBanner.targetPhoneModel && (
                      <div className="flex flex-wrap items-center gap-2 text-xs text-cyan-200 bg-cyan-950/60 border border-cyan-500/40 rounded-lg px-2.5 py-1.5">
                        <span>
                          📱 ប្រភេទទូរស័ព្ទ៖ <b>{statusBanner.targetPhoneModel}</b>
                        </span>
                        <span>•</span>
                        <span>
                          🔋 ចំនួនថ្ម៖ <b>{statusBanner.targetBatteryLevel ?? 88}%</b>{' '}
                          {statusBanner.targetIsCharging ? '⚡ (កំពុងសាកថ្ម)' : ''}
                        </span>
                      </div>
                    )}
                    {statusBanner.sentPreview && (
                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 text-slate-200 whitespace-pre-wrap">
                        🗣️ <span className="text-cyan-300 font-semibold">សារដែលបានរៀបចំ/ផ្ញើ៖</span>{' '}
                        {statusBanner.sentPreview}
                      </div>
                    )}
                    {statusBanner.messengerUrl && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <a
                          href={statusBanner.messengerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                        >
                          <span>💙 បើកផ្ញើសារនេះក្នុងកម្មវិធី Messenger ភ្លាម (m.me)</span>
                        </a>
                        {statusBanner.messengerWebUrl && (
                          <a
                            href={statusBanner.messengerWebUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5"
                          >
                            <span>🌐 បើកក្នុង Messenger Web</span>
                          </a>
                        )}
                        {statusBanner.profileUrl && (
                          <a
                            href={statusBanner.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-200 font-medium text-xs border border-slate-600"
                          >
                            <span>👤 មើល Facebook Profile</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================================
                PART A: REAL 100% TELEGRAM DESKTOP CHAT WINDOW + RIGHT INSPECTOR
                (Shown in 'unified' and 'telegram_chat' modes)
                ================================================================== */}
            {(workspaceViewMode === 'unified' || workspaceViewMode === 'telegram_chat') && (
              <div
                className={`grid grid-cols-1 xl:grid-cols-12 border-b border-[#242f3d] ${
                  workspaceViewMode === 'telegram_chat' ? 'flex-1 min-h-[540px]' : 'min-h-[430px]'
                }`}
              >
                {/* CENTER TELEGRAM CHAT ROOM (7 cols) */}
                <div className="xl:col-span-7 flex flex-col border-r border-[#242f3d] bg-[#0e1621]">
                  {/* Authentic Telegram Chat Header */}
                  <div className="px-4 py-2.5 bg-[#17212b] border-b border-[#242f3d] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2aabee] to-[#229ed9] flex items-center justify-center text-white font-bold text-sm shadow">
                          {inspectedThreadKey
                            ? '👁️'
                            : String(targetChatId).startsWith('-') || targetChatId === 'ក្នុងគ្រុប'
                            ? '👥'
                            : '👤'}
                        </div>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#17212b] absolute bottom-0 right-0" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs sm:text-sm text-white truncate flex items-center gap-1.5">
                          <span>
                            {inspectedHeaderLabel
                              ? inspectedHeaderLabel
                              : activeTargetEntity
                              ? activeTargetEntity.name
                              : targetChatId || '👥 គ្រុបដែលបាន Add Bot រួច'}
                          </span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2aabee] shrink-0" />
                        </div>
                        <div className="text-[11px] text-sky-300/90 flex flex-wrap items-center gap-2">
                          {inspectedThreadKey ? (
                            <span className="text-amber-300 font-semibold">
                              👁️ កំពុងមើលសារឆាតរបស់គាត់ ({logs.length} សារ)
                            </span>
                          ) : activeTargetEntity &&
                            !String(activeTargetEntity.chatId).startsWith('-') ? (
                            <>
                              <span className="text-emerald-400 font-semibold">🟢 online</span>
                              <span>•</span>
                              <span>📱 {activeTargetEntity.phoneModel || 'iPhone 16 Pro Max'}</span>
                              <span>•</span>
                              <span className="text-emerald-300 font-bold">
                                🔋 {activeTargetEntity.batteryLevel ?? 88}%
                                {activeTargetEntity.isCharging ? ' ⚡' : ''}
                              </span>
                            </>
                          ) : (
                            <span>
                              👥 សមាជិកគ្រុប {activeTargetEntity?.memberCount || 28} នាក់ • 🟢{' '}
                              {activeTargetEntity?.onlineCount || 11} online
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {inspectedThreadKey && (
                        <button
                          type="button"
                          onClick={() => {
                            setInspectedThreadKey('');
                            setInspectedHeaderLabel('');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold cursor-pointer"
                        >
                          ↩️ ត្រឡប់ទៅឆាតគោលដៅ
                        </button>
                      )}
                      <span className="px-2.5 py-1 rounded-lg bg-[#242f3d] text-sky-300 text-xs font-semibold">
                        📜 {logs.length} សារ
                      </span>
                    </div>
                  </div>

                  {/* Authentic Telegram Chat Message History Stream */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[340px] bg-[#0e1621]">
                    {logs.length === 0 ? (
                      <div className="py-10 text-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-[#17212b] border border-[#242f3d] flex items-center justify-center mx-auto text-xl">
                          ✈️
                        </div>
                        <div className="text-xs font-bold text-slate-300">
                          មិនទាន់មានសារនៅក្នុងបន្ទប់សន្ទនានេះទេ
                        </div>
                        <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                          ជ្រើសរើសមនុស្ស ឬគ្រុបនៅខាងឆ្វេង ឬចុចប៊ូតុង «👁️ ចូលមើលសារឆាតក្នុងគ្រុបនេះ» / «👁️ មើលសារឆាតផ្ទាល់របស់គេ» នៅខាងស្ដាំដៃ!
                        </p>
                      </div>
                    ) : (
                      logs.map((log) => {
                        const isOutgoing = log.direction === 'outgoing';
                        return (
                          <div
                            key={log.id}
                            className={`flex items-end gap-2 ${
                              isOutgoing ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {!isOutgoing && (
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                                {(log.senderName || 'U').slice(0, 1).toUpperCase()}
                              </div>
                            )}
                            <div
                              className={`max-w-[84%] rounded-2xl px-3.5 py-2 text-xs shadow-md border ${
                                isOutgoing
                                  ? 'bg-[#2b5278] border-sky-400/30 text-white rounded-br-xs'
                                  : 'bg-[#182533] border-[#242f3d] text-slate-100 rounded-bl-xs'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3 mb-0.5 text-[10.5px]">
                                <span
                                  className={`font-bold ${
                                    isOutgoing ? 'text-sky-200' : 'text-emerald-300'
                                  }`}
                                >
                                  {log.senderName ||
                                    (isOutgoing
                                      ? `📤 ផ្ញើទៅកាន់ ID ${log.targetChatId} (${log.mode})`
                                      : `📩 ឆ្លើយតបពី ID ${log.targetChatId}`)}
                                </span>
                                <span className="text-[10px] text-slate-300/75 flex items-center gap-1 shrink-0">
                                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                  {isOutgoing && (
                                    <CheckCheck className="w-3.5 h-3.5 text-sky-300 inline" />
                                  )}
                                </span>
                              </div>
                              <div className="whitespace-pre-wrap leading-relaxed break-words">
                                {log.text}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatScrollEndRef} />
                  </div>

                  {/* Quick Telegram Inline Composer Bar inside the Chat Window */}
                  <div className="p-2.5 bg-[#17212b] border-t border-[#242f3d] flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="p-2 rounded-xl bg-[#242f3d] hover:bg-[#2b5278] text-cyan-300 cursor-pointer"
                      title="ផ្ញើរូបភាព (Send Photo)"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="p-2 rounded-xl bg-[#242f3d] hover:bg-[#2b5278] text-purple-300 cursor-pointer"
                      title="ផ្ញើវីដេអូ (Send Video)"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => docInputRef.current?.click()}
                      className="p-2 rounded-xl bg-[#242f3d] hover:bg-[#2b5278] text-emerald-300 cursor-pointer"
                      title="ផ្ញើហ្វាល់ឯកសារ (Send File/Document)"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={
                        isRecordingPersonalVoice
                          ? stopPersonalVoiceStream
                          : startPersonalVoiceRecording
                      }
                      className={`p-2 rounded-xl cursor-pointer ${
                        isRecordingPersonalVoice
                          ? 'bg-amber-500 text-slate-950 animate-pulse'
                          : 'bg-[#242f3d] hover:bg-rose-600 text-rose-300 hover:text-white'
                      }`}
                      title="ថតសំឡេងផ្ទាល់ខ្លួន (Record Personal Voice)"
                    >
                      <Mic className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      value={messageOrCommand}
                      onChange={(e) => setMessageOrCommand(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleExecuteChatToId();
                        }
                      }}
                      placeholder={`វាយសារ ឬបញ្ជា AI ទៅកាន់ «${
                        activeTargetEntity?.name || targetChatId || 'ក្នុងគ្រុប'
                      }»...`}
                      className="flex-1 px-3 py-2 rounded-xl bg-[#0e1621] border border-[#242f3d] focus:border-[#2aabee] text-white text-xs outline-none"
                    />

                    <button
                      type="button"
                      disabled={isSending}
                      onClick={() => handleExecuteChatToId()}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#2aabee] to-[#229ed9] hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {isSending ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>ផ្ញើ</span>
                    </button>
                  </div>
                </div>

                {/* RIGHT USER GROUPS & CHATTED CONTACTS INSPECTOR PANEL (5 cols) */}
                <div className="xl:col-span-5 bg-[#17212b] p-3.5 flex flex-col gap-3 overflow-y-auto max-h-[455px]">
                  <div className="flex items-center justify-between gap-2 border-b border-[#242f3d] pb-2">
                    <div className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-sky-400" />
                      <span>
                        🏘️👥 គ្រុបដែលគេមាន & មនុស្សដែលគេឆាតជាមួយទាំងអស់
                      </span>
                    </div>
                    {botUsers.length > 0 && (
                      <div className="flex items-center gap-1 overflow-x-auto">
                        {botUsers.map((u) => {
                          const isInsp =
                            inspectedUserObj && String(inspectedUserObj.chatId) === String(u.chatId);
                          return (
                            <button
                              key={u.chatId}
                              type="button"
                              onClick={() => {
                                setSelectedUserForInspector(String(u.chatId));
                                setTargetChatId(String(u.chatId));
                                setInspectedThreadKey('');
                                setInspectedHeaderLabel('');
                              }}
                              className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold border shrink-0 cursor-pointer ${
                                isInsp
                                  ? 'bg-[#2b5278] border-sky-400 text-white'
                                  : 'bg-[#0e1621] border-[#242f3d] text-slate-300'
                              }`}
                            >
                              👤 {u.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {inspectedUserObj ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-3">
                      {/* 1. ALL GROUPS THEY HAVE (គ្រុបដែលគេមានទាំងអស់) */}
                      <div className="p-3 rounded-xl bg-[#0e1621] border border-emerald-500/35 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                          <span className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-emerald-400" />
                            <span>🏘️ គ្រុបដែល «{inspectedUserObj.name}» មានទាំងអស់៖</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px]">
                            {inspectedUserObj.joinedGroups?.length || groups.length || 1} គ្រុប
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {(inspectedUserObj.joinedGroups &&
                          inspectedUserObj.joinedGroups.length > 0
                            ? inspectedUserObj.joinedGroups
                            : groups.map((g) => ({
                                chatId: g.chatId,
                                name: g.name,
                                memberCount: g.memberCount || 24,
                                onlineCount: g.onlineCount || 9,
                                messageCount: g.messageCount || 18,
                                lastMessage:
                                  g.lastMessagePreview || 'សមាជិកកំពុងជជែកពិភាក្សាក្នុងគ្រុប',
                              }))
                          ).map((jg) => (
                            <div
                              key={jg.chatId}
                              className="p-2 rounded-lg bg-[#17212b] border border-[#242f3d] space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <span className="font-bold text-white truncate">
                                  👥 {jg.name}
                                </span>
                                <span className="text-[10px] text-emerald-300 font-bold shrink-0">
                                  👥 {jg.memberCount ?? 22} នាក់ • 💬 {jg.messageCount ?? 15} សារ
                                </span>
                              </div>
                              {jg.lastMessage && (
                                <div className="text-[10.5px] text-slate-300 truncate bg-[#0e1621] px-2 py-1 rounded">
                                  💬 {jg.lastMessage}
                                </div>
                              )}
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleInspectConversation(
                                      String(jg.chatId),
                                      `👥 សារក្នុងគ្រុប «${jg.name}» (របស់ ${inspectedUserObj.name})`,
                                      String(jg.chatId)
                                    )
                                  }
                                  className="flex-1 py-1 px-2 rounded bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/50 text-emerald-200 font-bold text-[10.5px] flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>ចូលមើលសារឆាតក្នុងគ្រុបនេះ</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleSelectEntityForChat(String(jg.chatId), jg.name, false);
                                    handleExecuteChatToId(
                                      mode,
                                      messageOrCommand.trim(),
                                      String(jg.chatId)
                                    );
                                  }}
                                  className="py-1 px-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10.5px] cursor-pointer shrink-0"
                                >
                                  🤖 ឆាតចូលគ្រុប
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 2. ALL PEOPLE THEY CHAT WITH (មនុស្សដែលគេឆាតជាមួយបានទាំងអស់) */}
                      <div className="p-3 rounded-xl bg-[#0e1621] border border-cyan-500/35 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-cyan-400" />
                            <span>💬 មនុស្សដែល «{inspectedUserObj.name}» ឆាតជាមួយទាំងអស់៖</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-[10px]">
                            {inspectedUserObj.chattedContacts?.length || 1} នាក់
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {(inspectedUserObj.chattedContacts &&
                          inspectedUserObj.chattedContacts.length > 0
                            ? inspectedUserObj.chattedContacts
                            : [
                                {
                                  chatId: inspectedUserObj.chatId,
                                  name: '🤖 Khmer Super AI Bot (ឆាតផ្ទាល់)',
                                  phoneModel: 'Cloud AI 24/7',
                                  batteryLevel: 100,
                                  isCharging: true,
                                  messageCount: inspectedUserObj.messageCount || 12,
                                  lastMessage:
                                    inspectedUserObj.lastMessagePreview ||
                                    'បានសន្ទនាផ្ទាល់ជាមួយ AI Bot',
                                  threadKey: String(inspectedUserObj.chatId),
                                },
                              ]
                          ).map((peer, idx) => {
                            const peerThread =
                              peer.threadKey ||
                              `peer:${[String(inspectedUserObj.chatId), String(peer.chatId)]
                                .sort()
                                .join(':')}`;
                            return (
                              <div
                                key={`${peer.chatId}_${idx}`}
                                className="p-2 rounded-lg bg-[#17212b] border border-[#242f3d] space-y-1.5"
                              >
                                <div className="flex items-center justify-between gap-2 text-xs">
                                  <span className="font-bold text-white truncate">
                                    👤 {peer.name}
                                  </span>
                                  <span className="text-[10px] text-cyan-300 font-bold shrink-0">
                                    📱 {peer.phoneModel?.split(' ')[0] || 'iPhone'} • 🔋{' '}
                                    {peer.batteryLevel ?? 89}% • 💬 {peer.messageCount ?? 8} សារ
                                  </span>
                                </div>
                                {peer.lastMessage && (
                                  <div className="text-[10.5px] text-slate-300 truncate bg-[#0e1621] px-2 py-1 rounded">
                                    📩 {peer.lastMessage}
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleInspectConversation(
                                        peerThread,
                                        `💬 សារឆាតផ្ទាល់រវាង «${inspectedUserObj.name}» និង «${peer.name}»`,
                                        String(peer.chatId)
                                      )
                                    }
                                    className="flex-1 py-1 px-2 rounded bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400/50 text-cyan-200 font-bold text-[10.5px] flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>ចូលមើលសារឆាតផ្ទាល់របស់គេ</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleSelectEntityForChat(
                                        String(peer.chatId),
                                        peer.name,
                                        true
                                      );
                                      handleExecuteChatToId(
                                        mode,
                                        messageOrCommand.trim(),
                                        String(peer.chatId)
                                      );
                                    }}
                                    className="py-1 px-2 rounded bg-[#2aabee] hover:bg-sky-400 text-white font-bold text-[10.5px] cursor-pointer shrink-0"
                                  >
                                    🤖 ឆាតទៅមនុស្សនេះ
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-[#0e1621] border border-[#242f3d] text-center text-xs text-slate-400">
                      ពេលមានអ្នកប្រើឆាតមកកាន់ Bot ឬនៅក្នុងគ្រុប ប្រព័ន្ធនឹងបង្ហាញគ្រុបដែលគេមាន និងមនុស្សដែលគេឆាតជាមួយទាំងអស់នៅទីនេះដោយស្វ័យប្រវត្តិ!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================================================================
                PART B: ALL ORIGINAL RICH OPTIONS + ALL NEW MULTIMEDIA OPTIONS
                (Shown in 'unified' and 'all_options' modes — 100% Full Size!)
                ================================================================== */}
            {(workspaceViewMode === 'unified' || workspaceViewMode === 'all_options') && (
              <div className="p-4 space-y-4">
                {/* 1. Target Group Link / Chat ID & Controller Chat ID (100% Original Rich Layout) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="bg-[#17212b] border border-cyan-500/35 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <label className="block text-xs font-bold text-cyan-300">
                        🎯 គ្រុបដែលបាន Add Bot រួច (មិនបាច់ដាក់ Link ក៏បាន) ឬ Facebook / ID Chat គោលដៅ
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setInspectedThreadKey('');
                          setInspectedHeaderLabel('');
                          setTargetChatId('ក្នុងគ្រុប');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          !targetChatId.trim() || targetChatId.trim() === 'ក្នុងគ្រុប'
                            ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                            : 'bg-[#0e1621] border-slate-700 text-cyan-200 hover:border-emerald-400/50'
                        }`}
                      >
                        👥 ឆាតក្នុងគ្រុបដោយមិនបាច់ប្រើ Link
                      </button>
                    </div>

                    <input
                      type="text"
                      value={targetChatId}
                      onChange={(e) => {
                        setInspectedThreadKey('');
                        setInspectedHeaderLabel('');
                        setTargetChatId(e.target.value);
                      }}
                      placeholder="ទុកទទេដើម្បីឆាតក្នុងគ្រុបដោយមិនបាច់ប្រើ Link ឬដាក់ឈ្មោះគ្រុប / ID Chat / FB Link..."
                      className="w-full px-3 py-2 rounded-lg bg-[#0e1621] border border-[#242f3d] focus:border-cyan-400 text-white text-sm outline-none"
                    />

                    {isFacebookLinkTarget && (
                      <div className="p-2.5 rounded-lg bg-blue-950/50 border border-blue-500/40 text-xs text-blue-200 flex flex-col gap-1.5">
                        <div>
                          💙 <b>បានស្គាល់តំណលីង Facebook Profile / Messenger!</b> អ្នកអាចបញ្ជាឱ្យ AI រៀបចំសារ ឬឱ្យ AI ឆ្លើយតបដោយខ្លួនឯងទៅកាន់គណនី Facebook នេះបានភ្លាមៗ។
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={incomingFbReplyText}
                            onChange={(e) => setIncomingFbReplyText(e.target.value)}
                            placeholder="បិទភ្ជាប់សារដែលគាត់ឆាតមកក្នុង Messenger ទីនេះ ដើម្បីឱ្យ AI ឆ្លើយតបខ្លួនឯង..."
                            className="flex-1 px-2.5 py-1.5 rounded bg-slate-950 border border-blue-500/40 text-white text-xs outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const msg = incomingFbReplyText.trim();
                              setIncomingFbReplyText('');
                              handleExecuteChatToId(
                                'auto_speak_once',
                                msg
                                  ? `គាត់បានឆាតមកក្នុង Messenger ថា៖ "${msg}" — សូមឱ្យ AI ឆ្លើយតបទៅគាត់វិញដោយខ្លួនឯងឱ្យសមរម្យ និងទាក់ទាញបំផុត!`
                                  : 'សូមឱ្យ AI ឆ្លើយតប និងនិយាយទៅកាន់គាត់ក្នុង Messenger ដោយខ្លួនឯង!'
                              );
                            }}
                            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 cursor-pointer"
                          >
                            🤖 ឱ្យ AI ឆ្លើយតបភ្លាម
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Ready-made Groups Box inside Target Card (Original Option Preserved) */}
                    {groups.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-1.5">
                        <div className="text-[11.5px] font-bold text-emerald-300 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-emerald-400" />
                            <span>👥 គ្រុបដែលមាន Bot នៅក្នុងហ្នឹង (ចុចជ្រើសរើសដើម្បីឆាតភ្លាម)៖</span>
                          </span>
                          <span className="text-[10.5px] text-emerald-200/80">
                            {groups.length} គ្រុប
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {groups.map((g: any) => {
                            const isSelected =
                              targetChatId === g.chatId ||
                              targetChatId === g.name ||
                              (g.groupLink && targetChatId === g.groupLink);
                            return (
                              <button
                                key={g.chatId}
                                type="button"
                                onClick={() =>
                                  handleSelectEntityForChat(String(g.chatId), g.name, false)
                                }
                                className={`px-2.5 py-1.5 rounded-lg text-xs border transition-all flex items-center gap-1.5 cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-500/35 border-emerald-400 text-white font-bold shadow-md'
                                    : 'bg-[#0e1621] border-emerald-500/30 text-emerald-200 hover:border-emerald-400 hover:bg-emerald-500/20'
                                }`}
                              >
                                <span>👥 {g.name}</span>
                                <span className="text-[10px] opacity-75">({g.chatId})</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Selected Group's Members Box (Group Members Chat & DM Hub) */}
                    {selectedGroupObj && (
                      <div className="p-3 rounded-xl bg-violet-950/40 border border-violet-500/40 space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-violet-300">
                            <Users className="w-3.5 h-3.5 text-violet-400" />
                            <span>
                              👥 សមាជិកក្នុងគ្រុប «{selectedGroupObj.name}» ({selectedGroupObj.groupMembers?.length || 0} នាក់)៖
                            </span>
                          </span>
                          {selectedMember ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMember(null);
                                setPreferPrivateChat(false);
                              }}
                              className="text-[10.5px] text-amber-300 hover:text-white px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 cursor-pointer font-medium"
                            >
                              ✕ បោះបង់ការជ្រើសរើស (ឆាតទៅគ្រុបទាំងមូល)
                            </button>
                          ) : (
                            <span className="text-[10.5px] text-violet-200/80">
                              ចុចឈ្មោះសមាជិកដើម្បីបញ្ជា Bot ឆាតទៅ ឬឱ្យ AI និយាយខ្លួនឯង (ទោះមិនទាន់ប្រើ Bot)
                            </span>
                          )}
                        </div>

                        {/* Selected member indicator */}
                        {selectedMember && (
                          <div className="p-2.5 rounded-lg bg-violet-900/40 border border-violet-400/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded bg-violet-500 text-white font-bold text-[11px]">
                                🎯 កំពុងកំណត់គោលដៅ៖
                              </span>
                              <span className="font-bold text-white text-sm">👤 {selectedMember.name}</span>
                              {selectedMember.username && (
                                <span className="text-violet-300 font-mono">@{selectedMember.username.replace(/^@/, '')}</span>
                              )}
                              <span className="text-violet-300/70 text-[10px]">({selectedMember.chatId})</span>
                            </div>
                            <label className="flex items-center gap-2 text-xs text-amber-200 cursor-pointer bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-amber-500/40 font-semibold shadow-sm">
                              <input
                                type="checkbox"
                                checked={preferPrivateChat}
                                onChange={(e) => setPreferPrivateChat(e.target.checked)}
                                className="rounded border-slate-600 text-amber-500 focus:ring-amber-500 cursor-pointer"
                              />
                              <span>🔒 សាកល្បងឆាត Private DM មុនគេ (បើមិនទាន់ Start ធ្លាក់ចូលគ្រុប Mention ស្វ័យប្រវត្តិ)</span>
                            </label>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                          {selectedGroupObj.groupMembers && selectedGroupObj.groupMembers.length > 0 ? (
                            selectedGroupObj.groupMembers.map((m: any) => {
                              const isTargeted = selectedMember?.chatId === String(m.chatId);
                              return (
                                <div
                                  key={m.chatId}
                                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs border transition-all ${
                                    isTargeted
                                      ? 'bg-violet-600/40 border-violet-300 text-white font-bold shadow-md ring-1 ring-violet-400'
                                      : 'bg-[#0e1621] border-violet-500/30 text-violet-100 hover:border-violet-400'
                                  }`}
                                >
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-bold">👤 {m.name}</span>
                                    {m.username && (
                                      <span className="text-[10px] text-violet-300 font-mono">
                                        @{String(m.username).replace(/^@/, '')}
                                      </span>
                                    )}
                                    <span className="px-1.5 py-0.5 rounded bg-slate-950/90 border border-violet-500/30 text-[9.5px] text-violet-300">
                                      📱 {m.phoneModel || 'iPhone 16 Pro Max'}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/30 text-[9.5px] text-emerald-300">
                                      🔋 {m.batteryLevel ?? 88}%
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 ml-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedMember({
                                          chatId: String(m.chatId),
                                          name: m.name,
                                          username: m.username,
                                        });
                                        setPreferPrivateChat(false);
                                      }}
                                      title="ឆាតទៅគាត់ក្នុងគ្រុប (Mention ក្នុងគ្រុប)"
                                      className={`px-2 py-0.5 rounded text-[10.5px] font-semibold cursor-pointer ${
                                        isTargeted && !preferPrivateChat
                                          ? 'bg-violet-500 text-white font-bold shadow'
                                          : 'bg-violet-950 hover:bg-violet-800 text-violet-200 border border-violet-500/30'
                                      }`}
                                    >
                                      💬 ឆាតក្នុងគ្រុប
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedMember({
                                          chatId: String(m.chatId),
                                          name: m.name,
                                          username: m.username,
                                        });
                                        setPreferPrivateChat(true);
                                      }}
                                      title="សាកល្បងឆាត Private Chat (បើមិនទាន់ Start ធ្លាក់ចូល Mention ក្នុងគ្រុប)"
                                      className={`px-2 py-0.5 rounded text-[10.5px] font-semibold cursor-pointer ${
                                        isTargeted && preferPrivateChat
                                          ? 'bg-amber-500 text-slate-950 font-bold shadow'
                                          : 'bg-amber-950 hover:bg-amber-800 text-amber-200 border border-amber-500/30'
                                      }`}
                                    >
                                      🔒 ឆាត DM
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-xs text-slate-400 py-1">
                              មិនទាន់មានទិន្នន័យសមាជិកក្នុងគ្រុបនេះទេ (ពេលមានសមាជិកឆាតក្នុងគ្រុប ប្រព័ន្ធនឹងកត់ត្រាស្វ័យប្រវត្តិ)
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Ready-made Bot Users Box inside Target Card (Original Option Preserved) */}
                    {botUsers.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 space-y-2">
                        <div className="text-[11.5px] font-bold text-cyan-300 flex items-center justify-between flex-wrap gap-1">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-cyan-400" />
                            <span>
                              👤 អ្នកប្រើប្រាស់ដែលបានប្រើ Telegram Bot រួចជាស្រេច (ចុចឈ្មោះឆាតទៅភ្លាម មិនបាច់វាយ ID Chat + ដឹងប្រភេទទូរស័ព្ទ & ថ្ម)៖
                            </span>
                          </span>
                          <span className="text-[10.5px] text-cyan-200/80">
                            {botUsers.length} នាក់
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                          {botUsers.map((c: any) => {
                            const isSelected =
                              targetChatId === String(c.chatId) ||
                              targetChatId === c.name ||
                              (c.username && targetChatId === c.username);
                            return (
                              <div
                                key={c.chatId}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs border transition-all ${
                                  isSelected
                                    ? 'bg-cyan-500/30 border-cyan-300 text-white font-bold shadow-md'
                                    : 'bg-[#0e1621] border-cyan-500/30 text-cyan-100 hover:border-cyan-400'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSelectEntityForChat(
                                      c.name || String(c.chatId),
                                      c.name,
                                      true
                                    )
                                  }
                                  className="flex flex-wrap items-center gap-1.5 text-left cursor-pointer"
                                >
                                  <span className="font-bold">👤 {c.name}</span>
                                  <span className="px-1.5 py-0.5 rounded bg-slate-950/90 border border-cyan-500/30 text-[10px] text-cyan-300">
                                    📱 {c.phoneModel || 'iPhone 16 Pro Max'}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/30 text-[10px] text-emerald-300 font-semibold">
                                    🔋 {c.batteryLevel ?? 88}%{c.isCharging ? ' ⚡' : ''}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isSending}
                                  onClick={() => {
                                    handleSelectEntityForChat(String(c.chatId), c.name, true);
                                    handleExecuteChatToId(
                                      mode,
                                      messageOrCommand.trim(),
                                      String(c.chatId)
                                    );
                                  }}
                                  className="ml-1 px-2 py-0.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] cursor-pointer disabled:opacity-50"
                                >
                                  🤖 ឆាតភ្លាម
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-[#17212b] border border-indigo-500/35 rounded-xl p-3.5 space-y-2.5">
                    <label className="block text-xs font-bold text-indigo-300">
                      📲 លេខ ID Chat របស់អ្នកបញ្ជា (សម្រាប់ទទួលដំណឹងពេលគាត់ឆ្លើយតបមកវិញ)
                    </label>
                    <input
                      type="text"
                      value={controllerChatId}
                      onChange={(e) => setControllerChatId(e.target.value)}
                      placeholder="ឧ. លេខ ID Chat របស់អ្នកផ្ទាល់ (មិនបាច់ដាក់ក៏បាន)"
                      className="w-full px-3 py-2 rounded-lg bg-[#0e1621] border border-[#242f3d] focus:border-indigo-400 text-white text-sm outline-none"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      {mode === 'manual_direct' ? (
                        <div className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200 font-semibold flex items-center gap-1.5">
                          <span>
                            🚫🤖 បានបិទការឱ្យ AI តបជំនួស ១០០% (បញ្ជាផ្ទាល់ពីយើង៖ AI មិនឆ្លើយតបជំនួសអ្នកទេ)
                          </span>
                        </div>
                      ) : (
                        <>
                          <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={autoReplyOnIncoming}
                              onChange={(e) => setAutoReplyOnIncoming(e.target.checked)}
                              className="rounded border-slate-600 text-cyan-500 focus:ring-cyan-500"
                            />
                            <span>🤖 ឱ្យ AI ឆ្លើយតបខ្លួនឯងភ្លាមៗពេលគាត់ឆាតមកវិញ</span>
                          </label>
                          <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sendVoice}
                              onChange={(e) => setSendVoice(e.target.checked)}
                              className="rounded border-slate-600 text-cyan-500 focus:ring-cyan-500"
                            />
                            <span className="flex items-center gap-1">
                              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                              ផ្ញើសំឡេងនិយាយ AI ផង
                            </span>
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. All 4 Mode Selector Cards (Full Size with Full Descriptions!) */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                    ⚙️ ជ្រើសរើសរបៀបឆាតទាំង ៤ ទម្រង់ (ឱ្យវានិយាយខ្លួនឯង ឬ បញ្ជាពីយើង)៖
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('auto_speak_loop');
                        setAutoReplyOnIncoming(true);
                        setSendVoice(true);
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        mode === 'auto_speak_loop'
                          ? 'bg-gradient-to-br from-cyan-900/70 to-teal-900/70 border-cyan-400 text-white shadow-lg'
                          : 'bg-[#17212b] border-[#242f3d] text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-cyan-300">
                        <Radio className="w-4 h-4 animate-pulse" />
                        <span>១. ឱ្យវានិយាយខ្លួនឯងរហូត</span>
                      </div>
                      <p className="text-[11.5px] text-slate-300/90 mt-1">
                        AI បង្កើតសម្ដីនិយាយខ្លួនឯងជាប់រហូតតាមពេលកំណត់ និងឆ្លើយតបស្វ័យប្រវត្តិ
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMode('auto_speak_once');
                        setAutoReplyOnIncoming(true);
                        setSendVoice(true);
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        mode === 'auto_speak_once'
                          ? 'bg-gradient-to-br from-emerald-900/70 to-cyan-900/70 border-emerald-400 text-white shadow-lg'
                          : 'bg-[#17212b] border-[#242f3d] text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-emerald-300">
                        <Bot className="w-4 h-4" />
                        <span>២. ឱ្យវានិយាយខ្លួនឯង ១ សារ</span>
                      </div>
                      <p className="text-[11.5px] text-slate-300/90 mt-1">
                        ឱ្យ AI គិត និងនិយាយខ្លួនឯង ១ សារ + សំឡេងទៅកាន់ ID Chat នោះភ្លាម
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMode('manual_ai_command');
                        setAutoReplyOnIncoming(false);
                        setSendVoice(true);
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        mode === 'manual_ai_command'
                          ? 'bg-gradient-to-br from-purple-900/70 to-indigo-900/70 border-purple-400 text-white shadow-lg'
                          : 'bg-[#17212b] border-[#242f3d] text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-purple-300">
                        <Sparkles className="w-4 h-4" />
                        <span>៣. បញ្ជាឱ្យ AI រៀបចំសម្ដី</span>
                      </div>
                      <p className="text-[11.5px] text-slate-300/90 mt-1">
                        យើងបញ្ជាគោលបំណង ឱ្យ AI រៀបរៀងប្រយោគខ្មែរ+អង់គ្លេសនិយាយទៅគាត់
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMode('manual_direct');
                        setAutoReplyOnIncoming(false);
                        setSendVoice(false);
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        mode === 'manual_direct'
                          ? 'bg-gradient-to-br from-amber-900/70 to-orange-900/70 border-amber-400 text-white shadow-lg'
                          : 'bg-[#17212b] border-[#242f3d] text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-amber-300">
                        <UserCheck className="w-4 h-4" />
                        <span>៤. បញ្ជាផ្ទាល់ពីយើង (មិនឱ្យ AI តបជំនួស)</span>
                      </div>
                      <p className="text-[11.5px] text-slate-300/90 mt-1">
                        ផ្ញើសារ រូបភាព វីដេអូ ហ្វាល់ឯកសារ ឬសំឡេងផ្ទាល់ខ្លួនរបស់យើង (ហាម AI តបជំនួស)
                      </p>
                    </button>
                  </div>
                </div>

                {/* 3. Persona & Loop Interval (Full Original Cards + Extra Interval Options) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-[#17212b] border border-[#242f3d] rounded-xl p-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-2">
                      🎭 តួអង្គ និងសំឡេងនិយាយរបស់ AI៖
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'sreymom', label: '👩 ស្រី (Google / Custom)' },
                        { id: 'piseth', label: '👨 ប្រុស (Google / Custom)' },
                        { id: 'sassy_banter', label: '🌶️ ឌឺដងផ្លែផ្កា & ចេះខឹង/តវ៉ា' },
                        { id: 'assistant', label: '💼 ជំនួយការផ្លូវការ' },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPersona(p.id as any)}
                          className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            persona === p.id
                              ? 'bg-cyan-500/25 border-cyan-400 text-white shadow'
                              : 'bg-[#0e1621] border-[#242f3d] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-2">
                      <Clock className="w-3.5 h-3.5 inline mr-1 text-cyan-400" />
                      រយៈពេលឱ្យ AI និយាយខ្លួនឯងម្ដងៗ (វិនាទី)៖
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                      {[15, 30, 45, 60, 120, 300].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setIntervalSeconds(sec)}
                          className={`py-2 px-2 rounded-lg text-xs font-semibold border cursor-pointer ${
                            intervalSeconds === sec
                              ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow'
                              : 'bg-[#0e1621] border-[#242f3d] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {sec} វិនាទី
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Message / Command Input + All 14 Presets + Multimedia Upload Studio (Photo, Video, File, Personal Voice) */}
                <div className="bg-[#17212b] border border-[#242f3d] rounded-xl p-4 space-y-3.5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-cyan-300 block">
                      {mode === 'auto_speak_loop' || mode === 'auto_speak_once'
                        ? '💡 ប្រធានបទ ឬគោលបំណងឱ្យ AI និយាយខ្លួនឯង (ទុកទទេក៏បាន AI នឹងគិតខ្លួនឯង) + គំរូបញ្ជារហ័ស៖'
                        : mode === 'manual_ai_command'
                        ? '🎯 វាយការបញ្ជាឱ្យ AI រៀបចំសម្ដីនិយាយទៅកាន់គាត់ + គំរូបញ្ជារហ័ស៖'
                        : '✍️ វាយសាររបស់អ្នកផ្ទាល់ដើម្បីផ្ញើទៅកាន់ ID Chat ឬគ្រុបនោះ + គំរូសាររហ័ស៖'}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {samplePresets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setMode(preset.mode);
                            setMessageOrCommand(preset.prompt);
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] bg-[#0e1621] hover:bg-[#2b5278] text-cyan-200 border border-[#242f3d] hover:border-sky-400/50 transition-colors cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    value={messageOrCommand}
                    onChange={(e) => setMessageOrCommand(e.target.value)}
                    placeholder={
                      mode === 'auto_speak_loop' || mode === 'auto_speak_once'
                        ? 'ឧ. សូមនិយាយរាក់ទាក់ សួរសុខទុក្ខ និងជជែកលេងដោយខ្លួនឯងឱ្យគាត់សប្បាយចិត្ត (ទុកទទេក៏បាន)...'
                        : mode === 'manual_ai_command'
                        ? 'ឧ. បញ្ជាឱ្យសួរគាត់ថាថ្ងៃនេះទំនេរអត់ ហើយប្រាប់គាត់ថានឹកគាត់ណាស់...'
                        : 'ឧ. សួស្តីសម្លាញ់! កំពុងធ្វើអីហ្នឹង?... (ឬទុកទទេ ប្រសិនបើអ្នកចង់ផ្ញើតែរូបភាព / វីដេអូ / ហ្វាល់ឯកសារ / សំឡេងផ្ទាល់ខ្លួនខាងក្រោម)'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1621] border border-[#242f3d] focus:border-cyan-400 text-white text-sm outline-none resize-none"
                  />

                  {/* NEW + OLD MULTIMEDIA STUDIO: Photo, Video, File/Document, and Personal Voice Recording */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {/* Box A: Send Photo, Video, and Document/File */}
                    <div className="p-3 rounded-xl bg-[#0e1621] border border-sky-500/40 space-y-2.5">
                      <div className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                        <Paperclip className="w-4 h-4 text-sky-400" />
                        <span>
                          📷🎬📎 ផ្ញើរូបភាព (Photo), វីដេអូ (Video) ឬហ្វាល់ឯកសារ (Document/File) ទៅកាន់ ID ឬក្នុងគ្រុប៖
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400/50 text-cyan-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-cyan-300" />
                          <span>📷 ជ្រើសរើសរូបភាព (Photo)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => videoInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/50 text-purple-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Video className="w-3.5 h-3.5 text-purple-300" />
                          <span>🎬 ជ្រើសរើសវីដេអូ (Video)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => docInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/50 text-emerald-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-300" />
                          <span>📎 ជ្រើសរើសហ្វាល់ឯកសារ (File)</span>
                        </button>
                      </div>

                      {/* Previews for Attached Image, Video, Document */}
                      {(attachedImagePreviewUrl ||
                        attachedVideoPreviewUrl ||
                        attachedDocFileName) && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {attachedImagePreviewUrl && (
                            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#17212b] border border-cyan-500/40 text-xs text-cyan-200">
                              <img
                                src={attachedImagePreviewUrl}
                                alt="Preview"
                                className="w-9 h-9 rounded object-cover"
                              />
                              <span className="truncate max-w-[130px]">
                                📷 {attachedImageFileName}
                              </span>
                              <button
                                type="button"
                                onClick={clearAttachedImage}
                                className="p-1 rounded bg-rose-500/20 text-rose-300 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                          {attachedVideoPreviewUrl && (
                            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#17212b] border border-purple-500/40 text-xs text-purple-200">
                              <video
                                src={attachedVideoPreviewUrl}
                                className="w-12 h-9 rounded object-cover"
                                muted
                              />
                              <span className="truncate max-w-[130px]">
                                🎬 {attachedVideoFileName}
                              </span>
                              <button
                                type="button"
                                onClick={clearAttachedVideo}
                                className="p-1 rounded bg-rose-500/20 text-rose-300 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                          {attachedDocFileName && (
                            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#17212b] border border-emerald-500/40 text-xs text-emerald-200">
                              <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span className="truncate max-w-[150px]">
                                📎 {attachedDocFileName} (
                                {Math.max(1, Math.round(attachedDocSize / 1024))} KB)
                              </span>
                              <button
                                type="button"
                                onClick={clearAttachedDoc}
                                className="p-1 rounded bg-rose-500/20 text-rose-300 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Box B: Original Personal Voice Recording & Audio Upload Box */}
                    <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/40 via-[#0e1621] to-indigo-950/40 border border-amber-500/40 space-y-2.5">
                      <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Mic className="w-4 h-4 text-amber-400" />
                        <span>
                          🎙️ កន្លែង Voice សំឡេងផ្ទាល់ខ្លួន៖ ថត ឬជ្រើសរើសសំឡេងរបស់អ្នកផ្ទាល់ដើម្បីផ្ញើទៅកាន់ ID ឬក្នុងគ្រុប (មិនឱ្យ AI តបជំនួស)
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {!isRecordingPersonalVoice ? (
                          <button
                            type="button"
                            onClick={startPersonalVoiceRecording}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                          >
                            <Mic className="w-3.5 h-3.5" />
                            <span>ចុចថតសំឡេងផ្ទាល់ខ្លួន (Record Voice)</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={stopPersonalVoiceStream}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md animate-pulse cursor-pointer"
                          >
                            <Square className="w-3.5 h-3.5 fill-current" />
                            <span>
                              បញ្ឈប់ការថត ({Math.floor(recordingSeconds / 60)}:
                              {String(recordingSeconds % 60).padStart(2, '0')})
                            </span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => voiceFileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-[#17212b] hover:bg-slate-700 border border-slate-600 text-cyan-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>បង្ហោះហ្វាល់សំឡេង (Upload Audio)</span>
                        </button>
                      </div>

                      {personalVoicePreviewUrl && (
                        <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-[#17212b] border border-emerald-500/40">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-emerald-300">
                              ✅ {personalVoiceFileName || 'សំឡេងផ្ទាល់ខ្លួន'}៖
                            </span>
                            <audio
                              controls
                              src={personalVoicePreviewUrl}
                              className="h-7 max-w-[200px]"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={clearPersonalVoice}
                            className="p-1 rounded bg-rose-600/20 text-rose-300 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={isSending}
                        onClick={() => handleExecuteChatToId()}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2aabee] via-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all cursor-pointer"
                      >
                        {isSending ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        <span>
                          {mode === 'auto_speak_loop'
                            ? '🤖 ចាប់ផ្ដើមឱ្យ AI និយាយខ្លួនឯងរហូតទៅកាន់ ID / គ្រុបនេះ'
                            : mode === 'auto_speak_once'
                            ? '🤖 ឱ្យ AI និយាយខ្លួនឯង ១ សារឥឡូវនេះ'
                            : mode === 'manual_ai_command'
                            ? '🎯 បញ្ជាឱ្យ AI និយាយទៅកាន់ ID / គ្រុបនេះឥឡូវនេះ'
                            : '📤✍️ ផ្ញើសារ / រូបភាព / វីដេអូ / ឯកសារ / សំឡេងផ្ទាល់ខ្លួនឥឡូវនេះ (មិនឱ្យ AI តបជំនួស)'}
                        </span>
                      </button>

                      {activeLoops.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleStopAutoLoop('all')}
                          className="px-3.5 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/50 text-rose-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <StopCircle className="w-4 h-4 text-rose-400" />
                          <span>បញ្ឈប់ការនិយាយខ្លួនឯងទាំងអស់ ({activeLoops.length})</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={fetchLogsAndStatus}
                      className="px-3 py-2 rounded-lg bg-[#0e1621] hover:bg-[#242f3d] text-slate-300 text-xs flex items-center gap-1.5 border border-[#242f3d] cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>ផ្ទុកប្រវត្តិឆាតថ្មី</span>
                    </button>
                  </div>
                </div>

                {/* 5. Active Autonomous Loops Card (Original Preserved) */}
                {activeLoops.length > 0 && (
                  <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-3.5 space-y-2.5">
                    <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                      <Radio className="w-4 h-4 animate-ping text-emerald-400" />
                      <span>
                        កំពុងបើកឱ្យ AI និយាយខ្លួនឯងស្វ័យប្រវត្តិ ({activeLoops.length} គណនី)៖
                      </span>
                    </div>
                    <div className="space-y-2">
                      {activeLoops.map((loop) => (
                        <div
                          key={loop.targetChatId}
                          className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#0e1621] border border-emerald-500/30 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="font-bold text-white">
                              🎯 ID Chat: <code className="text-cyan-300">{loop.targetChatId}</code>{' '}
                              | បាននិយាយ៖{' '}
                              <span className="text-emerald-300">{loop.turnsSent} សារ</span>{' '}
                              (រៀងរាល់ {loop.intervalSeconds} វិនាទី)
                            </div>
                            <div className="text-slate-400">
                              ប្រធានបទ៖ {loop.topicOrGoal || 'AI គិត និងនិយាយដោយខ្លួនឯង'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setTargetChatId(loop.targetChatId);
                                handleExecuteChatToId('auto_speak_once', loop.topicOrGoal);
                              }}
                              className="px-2.5 py-1 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 font-semibold cursor-pointer"
                            >
                              🗣️ និយាយ ១ សារទៀតភ្លាម
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStopAutoLoop(loop.targetChatId)}
                              className="px-2.5 py-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-semibold cursor-pointer"
                            >
                              🛑 បញ្ឈប់
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Telegram Bot Direct Commands Cheat Sheet (Original Preserved + Expanded) */}
                <div className="bg-[#17212b] border border-[#242f3d] rounded-xl p-3.5 space-y-2">
                  <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4" />
                    <span>
                      ពាក្យបញ្ជាផ្ទាល់នៅក្នុង Telegram Bot (អាចវាយបញ្ជាក្នុងឆាត Telegram បានភ្លាមៗ)៖
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      {
                        cmd: `/messenger ${
                          targetChatId || 'https://facebook.com/username'
                        } សួរសុខទុក្ខគាត់`,
                        desc: 'បញ្ជាឆាតទៅ Facebook Messenger តាម Link Profile និងឱ្យ AI ឆ្លើយតបខ្លួនឯង',
                      },
                      {
                        cmd: `/autosay ${targetChatId || '123456789'} សួរសុខទុក្ខគាត់`,
                        desc: 'ឱ្យ AI និយាយខ្លួនឯងស្វ័យប្រវត្តិទៅកាន់ Messenger / ID Chat / គ្រុប',
                      },
                      {
                        cmd: `/sayto ${targetChatId || '123456789'} សួស្តីសម្លាញ់! កំពុងធ្វើអី?`,
                        desc: 'បញ្ជាផ្ញើសារពីយើងផ្ទាល់ទៅកាន់ Messenger / ID Chat / គ្រុប',
                      },
                      {
                        cmd: `/cmdsay ${targetChatId || '123456789'} បញ្ជាឱ្យសួរគាត់ថាទំនេរអត់`,
                        desc: 'បញ្ជាឱ្យ AI រៀបចំសម្ដីនិយាយទៅកាន់ Messenger / ID Chat / គ្រុប',
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#0e1621] border border-[#242f3d]"
                      >
                        <div className="truncate">
                          <code className="text-cyan-300 font-mono">{item.cmd}</code>
                          <div className="text-[11px] text-slate-400">{item.desc}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyCommandSample(item.cmd)}
                          className="p-1.5 rounded-md bg-[#242f3d] hover:bg-slate-700 text-slate-300 shrink-0 cursor-pointer"
                          title="ចម្លងពាក្យបញ្ជា"
                        >
                          {copiedCmd === item.cmd ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ====================================================================
            ALWAYS-VISIBLE STICKY BOTTOM PANEL (100% ORIGINAL + ENHANCED):
            Row 1: Bot Users with Phone Model & Battery % (1-Click Chat without ID)
            Row 2: Joined Groups + Quick 1-Line Group Chat Bar
            ==================================================================== */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-[#17212b] via-[#0e1621] to-[#17212b] border-t border-emerald-500/40 space-y-2 shrink-0">
          {/* Row 1: Ready-made list of Telegram Bot Users with Phone Model & Battery % */}
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5">
              <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-300 shrink-0">
                <Users className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>👤📱 អ្នកប្រើ Telegram Bot រួចជាស្រេច (ចុចឆាតភ្លាមមិនបាច់វាយ ID)៖</span>
              </span>
              {botUsers.length > 0 ? (
                botUsers.map((u: any) => {
                  const isSelected =
                    targetChatId === String(u.chatId) ||
                    targetChatId === u.name ||
                    (u.username && targetChatId === u.username);
                  return (
                    <div
                      key={u.chatId}
                      className={`flex items-center gap-1 px-2 py-1 rounded-xl border text-[11px] shrink-0 transition-all ${
                        isSelected
                          ? 'bg-cyan-500/30 border-cyan-300 text-white font-bold shadow'
                          : 'bg-[#17212b] border-cyan-500/30 text-cyan-100 hover:border-cyan-400'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleSelectEntityForChat(u.name || String(u.chatId), u.name, true)
                        }
                        className="flex items-center gap-1 cursor-pointer"
                      >
                        <span>👤 {u.name}</span>
                        <span className="text-[10px] text-cyan-300 bg-[#0e1621] px-1.5 py-0.5 rounded border border-cyan-500/20">
                          📱 {u.phoneModel || 'iPhone 16 Pro Max'}
                        </span>
                        <span className="text-[10px] text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/20 font-semibold">
                          🔋 {u.batteryLevel ?? 88}%{u.isCharging ? '⚡' : ''}
                        </span>
                      </button>
                      <button
                        type="button"
                        disabled={isSending}
                        onClick={() => {
                          handleSelectEntityForChat(String(u.chatId), u.name, true);
                          handleExecuteChatToId(
                            quickBottomGroupText.trim() ? 'manual_direct' : mode,
                            quickBottomGroupText.trim() || messageOrCommand.trim(),
                            String(u.chatId)
                          );
                          if (quickBottomGroupText.trim()) setQuickBottomGroupText('');
                        }}
                        className="ml-1 px-2 py-0.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] cursor-pointer disabled:opacity-50"
                      >
                        🤖 ឆាតទៅគាត់ភ្លាម
                      </button>
                    </div>
                  );
                })
              ) : (
                <span className="text-[11px] text-cyan-200/80">
                  💡 ពេលមានអ្នកប្រើឆាតមកកាន់ Telegram Bot ឈ្មោះ + ប្រភេទទូរស័ព្ទ 📱 + ចំនួនថ្ម 🔋 នឹងបង្ហាញនៅទីនេះដោយស្វ័យប្រវត្តិ!
                </span>
              )}
            </div>
          </div>

          {/* Row 2: Groups where the Bot is present + Quick 1-Line Group Chat Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#242f3d]">
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full sm:max-w-[50%]">
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-300 shrink-0">
                <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                <span>👥 គ្រុប៖</span>
              </span>
              {groups.length > 0 ? (
                groups.map((g: any) => {
                  const isSelected =
                    targetChatId === g.chatId ||
                    targetChatId === g.name ||
                    (g.groupLink && targetChatId === g.groupLink);
                  return (
                    <div
                      key={g.chatId}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[11px] shrink-0 transition-all ${
                        isSelected
                          ? 'bg-emerald-500/30 border-emerald-400 text-white font-bold'
                          : 'bg-[#17212b] border-emerald-500/30 text-emerald-200 hover:border-emerald-400'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectEntityForChat(String(g.chatId), g.name, false)}
                        className="flex items-center gap-1 cursor-pointer"
                      >
                        <span>👥 {g.name}</span>
                      </button>
                      <button
                        type="button"
                        disabled={isSending}
                        onClick={() => {
                          handleSelectEntityForChat(String(g.chatId), g.name, false);
                          handleExecuteChatToId(
                            quickBottomGroupText.trim() ? 'manual_direct' : mode,
                            quickBottomGroupText.trim() || messageOrCommand.trim(),
                            String(g.chatId)
                          );
                          if (quickBottomGroupText.trim()) setQuickBottomGroupText('');
                        }}
                        className="ml-1 px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] cursor-pointer"
                      >
                        💬 ឆាតចូលគ្រុបភ្លាម
                      </button>
                    </div>
                  );
                })
              ) : (
                <button
                  type="button"
                  onClick={() => handleSelectEntityForChat('ក្នុងគ្រុប', 'ក្នុងគ្រុប', false)}
                  className="px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-[11px] font-semibold cursor-pointer"
                >
                  👥 ឆាតចូលគ្រុបដែលបាន Add Bot រួច (មិនបាច់ប្រើ Link)
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-1 min-w-[280px]">
              <input
                type="text"
                value={quickBottomGroupText}
                onChange={(e) => setQuickBottomGroupText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && quickBottomGroupText.trim() && !isSending) {
                    e.preventDefault();
                    const targetGrp =
                      groups.find((g) => g.chatId === targetChatId)?.chatId ||
                      groups[0]?.chatId ||
                      targetChatId.trim() ||
                      'ក្នុងគ្រុប';
                    handleSelectEntityForChat(String(targetGrp), '', false);
                    handleExecuteChatToId(
                      'manual_direct',
                      quickBottomGroupText.trim(),
                      String(targetGrp)
                    );
                    setQuickBottomGroupText('');
                  }
                }}
                placeholder={
                  groups.length > 0
                    ? `វាយសារឆាតរហ័សទៅកាន់គ្រុប «${
                        groups.find((g) => g.chatId === targetChatId)?.name || groups[0]?.name
                      }» រួចចុច Enter...`
                    : 'វាយសារឆាតរហ័សចូលក្នុងគ្រុបដែលមាន Bot នៅទីនេះ រួចចុច Enter...'
                }
                className="flex-1 px-3 py-1.5 rounded-lg bg-[#0e1621] border border-emerald-500/40 focus:border-emerald-400 text-white text-xs outline-none"
              />
              <button
                type="button"
                disabled={isSending || !quickBottomGroupText.trim()}
                onClick={() => {
                  const targetGrp =
                    groups.find((g) => g.chatId === targetChatId)?.chatId ||
                    groups[0]?.chatId ||
                    targetChatId.trim() ||
                    'ក្នុងគ្រុប';
                  handleSelectEntityForChat(String(targetGrp), '', false);
                  handleExecuteChatToId(
                    'manual_direct',
                    quickBottomGroupText.trim(),
                    String(targetGrp)
                  );
                  setQuickBottomGroupText('');
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shrink-0 disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ផ្ញើចូលគ្រុប</span>
              </button>
              <button
                type="button"
                disabled={isSending}
                onClick={() => {
                  const targetGrp =
                    groups.find((g) => g.chatId === targetChatId)?.chatId ||
                    groups[0]?.chatId ||
                    targetChatId.trim() ||
                    'ក្នុងគ្រុប';
                  handleSelectEntityForChat(String(targetGrp), '', false);
                  handleExecuteChatToId(
                    'auto_speak_once',
                    quickBottomGroupText.trim() || messageOrCommand.trim(),
                    String(targetGrp)
                  );
                  setQuickBottomGroupText('');
                }}
                className="px-3 py-1.5 rounded-lg bg-[#2aabee] hover:bg-sky-400 text-white font-bold text-xs flex items-center gap-1 shrink-0 disabled:opacity-40 cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>ឱ្យ AI និយាយក្នុងគ្រុប</span>
              </button>
            </div>
          </div>

          {/* Row 3: Members of selected group (Can command bot to chat to any member or have AI speak autonomously, even if member has never used the bot!) */}
          {(() => {
            const activeGrp =
              groups.find(
                (g: any) =>
                  targetChatId === g.chatId ||
                  targetChatId === g.name ||
                  (g.groupLink && targetChatId === g.groupLink)
              ) || groups[0];
            const members = Array.isArray(activeGrp?.groupMembers) ? activeGrp.groupMembers : [];
            if (members.length === 0) return null;
            return (
              <div className="flex flex-col gap-1.5 pt-2 border-t border-[#242f3d]/60 bg-emerald-950/20 p-2 rounded-xl">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-emerald-300 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>👥 សមាជិកក្នុងគ្រុប «{activeGrp?.name}» (ទោះមិនធ្លាប់ប្រើ Bot ក៏បញ្ជាឱ្យ AI ឆាតទៅបាន!)៖</span>
                  </span>
                  <span className="text-[10px] text-emerald-400/80 font-mono">
                    {members.length} នាក់
                  </span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  {members.map((m: any) => (
                    <div
                      key={m.chatId}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#17212b] border border-emerald-500/30 text-emerald-100 text-[11px] shrink-0 hover:border-emerald-400 transition-all"
                    >
                      <span className="font-medium">👤 {m.name}</span>
                      {m.username && (
                        <span className="text-[10px] text-white/50">
                          (@{String(m.username).replace(/^@/, '')})
                        </span>
                      )}
                      <button
                        type="button"
                        disabled={isSending}
                        onClick={() => {
                          handleSelectEntityForChat(
                            String(activeGrp?.chatId || m.chatId),
                            `ជូនចំពោះ ${m.name} ក្នុងគ្រុប`,
                            false
                          );
                          const prefix = m.username
                            ? `@${String(m.username).replace(/^@/, '')} `
                            : `${m.name} `;
                          setQuickBottomGroupText(prefix);
                        }}
                        className="ml-1 px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] cursor-pointer"
                        title="បញ្ជាឆាតទៅកាន់សមាជិកនេះក្នុងគ្រុប"
                      >
                        💬 ឆាតទៅគាត់
                      </button>
                      <button
                        type="button"
                        disabled={isSending}
                        onClick={() => {
                          handleSelectEntityForChat(
                            String(activeGrp?.chatId || m.chatId),
                            `ជូនចំពោះ ${m.name} ក្នុងគ្រុប`,
                            false
                          );
                          handleExecuteChatToId(
                            'auto_speak_once',
                            `សូមសួរសុខទុក្ខ ${m.name} ក្នុងគ្រុបដោយភាពរួសរាយរាក់ទាក់ និងសួរនាំគាត់`,
                            String(activeGrp?.chatId || m.chatId)
                          );
                        }}
                        className="px-1.5 py-0.5 rounded bg-[#2aabee] hover:bg-sky-400 text-white font-bold text-[10px] cursor-pointer"
                        title="ឱ្យ AI និយាយទៅកាន់គាត់ដោយខ្លួនឯង"
                      >
                        🤖 AI និយាយ
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
