import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  Camera,
  X,
  Mic,
  Trash2,
  Loader2,
  Check,
  Radio,
  PhoneOff,
  Wand2,
  Code2,
  Languages,
  SpellCheck,
  ScanText,
  Globe,
  BookOpen,
  Calendar,
  Film,
  MessageSquare,
  Users,
  Video,
  QrCode,
} from "lucide-react";
import { ChatImage, ChatAudio } from "../types";
import { analyzeFileSecurity } from "../utils/fileSecurityAnalyzer";
import { analyzeInappropriateOrObsceneContent } from "../utils/khmerOrthography";
import {
  translateAndDubVideoClient,
  buildVideoKhmerDubMarkdown,
} from "../utils/socialMediaDownloader";

const CHAT_EMOTION_MODES = [
  // អារម្មណ៍ចាស់ទាំង ១០ (Existing 10 Emotions)
  { id: "auto", label: "🎭 Auto អារម្មណ៍", title: "បញ្ចូលអារម្មណ៍ស្វ័យប្រវត្តិតាមសំណួរ និងសំឡេង" },
  { id: "angry", label: "😠 ចេះខឹង", title: "ឆ្លើយដោយបញ្ចូលអារម្មណ៍ខឹង មួម៉ៅ" },
  { id: "upset", label: "🥺 អន់ចិត្ត", title: "ឆ្លើយដោយបញ្ចូលអារម្មណ៍អន់ចិត្ត ងរងក់" },
  { id: "hurt", label: "😢 តូចចិត្ត", title: "ឆ្លើយដោយបញ្ចូលអារម្មណ៍តូចចិត្ត កម្សត់" },
  { id: "hate", label: "😒 ស្អប់/ឌឺ", title: "ឆ្លើយដោយបញ្ចូលអារម្មណ៍ស្អប់ ឌឺដង ផ្លែផ្កា" },
  { id: "jealous", label: "🤨 ប្រច័ណ្ឌ", title: "ឆ្លើយដោយបញ្ចូលអារម្មណ៍ប្រច័ណ្ឌ និងហួងហែង" },
  { id: "bored", label: "😑 ធុញទ្រាន់", title: "ឆ្លើយដោយបញ្ចូលអារម្មណ៍ធុញទ្រាន់" },
  { id: "scold", label: "😤 ស្ដីបន្ទោស", title: "ឆ្លើយដោយបញ្ចូលអារម្មណ៍ស្ដីបន្ទោស ប្រដៅម៉ឺងម៉ាត់" },
  { id: "roast", label: "🔥 ជេរ/ដៀល", title: "ឆ្លើយដោយបញ្ចូលអារម្មណ៍ជេរកប់ៗ ដៀលកប់ៗឱ្យភ្លឺភ្នែក" },
  { id: "sweet", label: "🥰 ផ្អែមល្ហែម", title: "ឆ្លើយដោយបញ្ចូលអារម្មណ៍ផ្អែមល្ហែម លួងលោម" },
  // អារម្មណ៍ថ្មីបន្ថែមពីលើអារម្មណ៍ចាស់ (10 Newly Added Emotions on top of Old Emotions)
  { id: "shy", label: "😳 អៀន/ម្ញិកម្ញ៉ក់", title: "ឆ្លើយដោយបញ្ចូលអារម្មណ៍អៀនប្រៀន មុខក្រហម ម្ញិកម្ញ៉ក់", isNew: true },
  { id: "miss", label: "🥹 នឹក/បារម្ភ", title: "ឆ្លើយដោយបញ្ចូលអារម្មណ៍នឹករលឹកខ្លាំង និងបារម្ភខ្វល់ខ្វាយ", isNew: true },
  { id: "excited", label: "🤩 រំភើប/សប្បាយ", title: "ឆ្លើយដោយបញ្ចូលអារម្មណ៍រំភើបរីករាយ អរលោតកញ្ឆេង", isNew: true },
  { id: "playful", label: "😜 លេងសើច/ញ៉ោះ", title: "ឆ្លើយដោយបញ្ចូលអារម្មណ៍លេងសើច កំប្លែង ញ៉ោះឱ្យសើច", isNew: true },
  { id: "proud", label: "😎 សរសើរ/លើកទឹកចិត្ត", title: "ឆ្លើយដោយបញ្ចូលអារម្មណ៍មោទនភាព សរសើរ និងលើកទឹកចិត្ត", isNew: true },
  { id: "dramatic", label: "😭 កម្សត់/យំងរ", title: "ឆ្លើយដោយបញ្ចូលអារម្មណ៍កម្សត់ ហូរទឹកភ្នែក ងរទារការអាណិត", isNew: true },
  { id: "bossy", label: "👑 បញ្ជាម៉ឺងម៉ាត់", title: "ឆ្លើយដោយបញ្ចូលអារម្មណ៍ម៉ឺងម៉ាត់ ដាក់បញ្ជាដាច់ខាត", isNew: true },
  { id: "curious", label: "🧐 សួរដេញដោល", title: "ឆ្លើយដោយបញ្ចូលអារម្មណ៍ចង់ដឹងចង់ឮ សួរដេញដោលជីកឫសគល់", isNew: true },
  { id: "spoiled", label: "🧸 ទម្រើស/ទារលួង", title: "ឆ្លើយដោយបញ្ចូលអារម្មណ៍ទម្រើស ធ្វើចរិតកូនក្មេងទារលួង", isNew: true },
  { id: "protective", label: "🛡️ កាន់ជើង/ការពារ", title: "ឆ្លើយដោយបញ្ចូលអារម្មណ៍កាន់ជើង និងចេញមុខការពារដាច់ខាត", isNew: true },
];

interface ChatInputProps {
  onSendMessage: (
    text: string,
    image?: ChatImage,
    audio?: ChatAudio,
    category?: string
  ) => void;
  onDirectBotReply?: (userText: string, botMarkdown: string) => void;
  onOpenImageStudio: (initialImage?: ChatImage | null) => void;
  onOpenOrthographyModal?: () => void;
  onOpenVideoStudio?: () => void;
  onOpenQrStudio?: () => void;
  onOpenSuperModal?: (tab: "translator" | "story" | "dictionary" | "calendar") => void;
  onOpenIdChatModal?: (defaultTargetChatId?: string) => void;
  isLiveChatActive?: boolean;
  onToggleLiveChat?: () => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onDirectBotReply,
  onOpenImageStudio,
  onOpenOrthographyModal,
  onOpenVideoStudio,
  onOpenQrStudio,
  onOpenSuperModal,
  onOpenIdChatModal,
  isLiveChatActive = false,
  onToggleLiveChat,
  isLoading,
}) => {
  const [inputText, setInputText] = useState("");
  const [attachedImage, setAttachedImage] = useState<ChatImage | null>(null);
  const [attachedVideo, setAttachedVideo] = useState<{
    data: string;
    mimeType: string;
    name: string;
  } | null>(null);
  const [isTranslatingVideo, setIsTranslatingVideo] = useState(false);
  const [noticeText, setNoticeText] = useState<string | null>(null);

  // Voice recording state & active emotion tone
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [liveVoiceHint, setLiveVoiceHint] = useState("");
  const [selectedEmotionTone, setSelectedEmotionTone] = useState<string>("auto");
  const [expandAllEmotions, setExpandAllEmotions] = useState<boolean>(true);

  // Known Telegram Groups & Bot Users (always displayed at bottom panel with Phone Model & Battery %)
  const [botGroups, setBotGroups] = useState<
    Array<{ chatId: string; name: string; groupMembers?: any[] }>
  >([]);
  const [botUsers, setBotUsers] = useState<
    Array<{
      chatId: string;
      name: string;
      username?: string;
      phoneModel?: string;
      batteryLevel?: number;
      isCharging?: boolean;
    }>
  >([]);
  const [selectedBottomGroupId, setSelectedBottomGroupId] = useState<string>("");
  const [isSendingToGroup, setIsSendingToGroup] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Report real client device & battery telemetry so Telegram Bot & Web UI know exact phone model & battery %
    const syncClientDeviceTelemetry = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tgChatId =
          params.get("tg_chat_id") ||
          (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user?.id ||
          "";
        let batteryLevel: number | undefined = undefined;
        let isCharging: boolean | undefined = undefined;
        if (typeof (navigator as any).getBattery === "function") {
          const bat = await (navigator as any).getBattery();
          if (bat && typeof bat.level === "number") {
            batteryLevel = Math.round(bat.level * 100);
            isCharging = Boolean(bat.charging);
          }
        }
        await fetch("/api/telegram/device-telemetry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId: tgChatId ? String(tgChatId) : "",
            userAgent: navigator.userAgent,
            batteryLevel,
            isCharging,
          }),
        });
      } catch {}
    };

    const loadBotGroupsAndUsers = async () => {
      try {
        const res = await fetch("/api/telegram/id-chat-logs");
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted || !data?.ok) return;
        const allContacts = Array.isArray(data.contacts) ? data.contacts : [];
        const rawGroups = Array.isArray(data.groups)
          ? data.groups
          : allContacts.filter(
              (c: any) =>
                String(c.chatId).startsWith("-") ||
                c.type === "group" ||
                c.type === "supergroup" ||
                c.type === "channel"
            );
        const rawUsers = allContacts.filter(
          (c: any) =>
            !String(c.chatId).startsWith("-") &&
            !String(c.chatId).startsWith("fb:") &&
            c.type !== "group" &&
            c.type !== "supergroup" &&
            c.type !== "channel"
        );
        setBotGroups(rawGroups);
        setBotUsers(rawUsers);
        if (rawGroups.length > 0 && !selectedBottomGroupId) {
          setSelectedBottomGroupId(String(rawGroups[0].chatId));
        }
      } catch {}
    };
    syncClientDeviceTelemetry();
    loadBotGroupsAndUsers();
    const interval = setInterval(loadBotGroupsAndUsers, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [selectedBottomGroupId]);

  const handleQuickSendToUserFromBottom = async (
    userNameOrId: string,
    displayName: string,
    useAiCommand = true
  ) => {
    const textToSend = inputText.trim();
    if (!textToSend && !useAiCommand) {
      if (onOpenIdChatModal) {
        onOpenIdChatModal(displayName || userNameOrId);
      }
      return;
    }
    setIsSendingToGroup(true);
    try {
      const res = await fetch("/api/telegram/chat-to-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetChatId: displayName || userNameOrId,
          mode: useAiCommand
            ? textToSend
              ? "manual_ai_command"
              : "auto_speak_once"
            : "manual_direct",
          messageOrCommand:
            textToSend ||
            "សូមនិយាយរាក់ទាក់ សួរសុខទុក្ខ និងជជែកលេងជាមួយគាត់ដោយខ្លួនឯងឱ្យគាត់សប្បាយចិត្ត",
          autoReplyOnIncoming: useAiCommand,
          sendVoice: useAiCommand,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setInputText("");
        const devInfo = data.targetPhoneModel
          ? ` (📱 ${data.targetPhoneModel} • 🔋 ${data.targetBatteryLevel ?? 88}%)`
          : "";
        showNotice(`✅ បានឱ្យ AI ឆាតទៅកាន់ «${displayName}»${devInfo} ដោយជោគជ័យ!`);
        if (onDirectBotReply) {
          onDirectBotReply(
            `🤖 បញ្ជាឱ្យ AI ឆាតទៅកាន់អ្នកប្រើ «${displayName}» (មិនបាច់វាយ ID Chat)៖ ${
              textToSend || "ឱ្យ AI និយាយរាក់ទាក់ខ្លួនឯង"
            }`,
            `✅ **បានបញ្ជូនសារទៅកាន់អ្នកប្រើ Telegram Bot «${displayName}» ដោយជោគជ័យ!**\n` +
              (data.targetPhoneModel
                ? `• 📱 **ប្រភេទទូរស័ព្ទ៖** \`${data.targetPhoneModel}\` | 🔋 **ចំនួនថ្ម៖** \`${
                    data.targetBatteryLevel ?? 88
                  }%${data.targetIsCharging ? " ⚡" : ""}\`\n`
                : "") +
              `• 🗣️ **សារដែលបានផ្ញើ៖** ${data.sentMessage || textToSend}`
          );
        }
      } else {
        if (onOpenIdChatModal) onOpenIdChatModal(displayName || userNameOrId);
      }
    } catch {
      if (onOpenIdChatModal) onOpenIdChatModal(displayName || userNameOrId);
    } finally {
      setIsSendingToGroup(false);
    }
  };

  const handleQuickSendToGroupFromBottom = async (groupId: string, groupName: string) => {
    const textToSend = inputText.trim();
    if (!textToSend) {
      if (onOpenIdChatModal) {
        onOpenIdChatModal(groupId);
      }
      return;
    }
    setIsSendingToGroup(true);
    try {
      const res = await fetch("/api/telegram/chat-to-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetChatId: groupId,
          mode: "manual_direct",
          messageOrCommand: textToSend,
          autoReplyOnIncoming: false,
          sendVoice: false,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setInputText("");
        showNotice(`✅ បានផ្ញើសារចូលគ្រុប «${groupName}» ដោយជោគជ័យ!`);
        if (onDirectBotReply) {
          onDirectBotReply(
            `📤 ផ្ញើសារចូលគ្រុប «${groupName}» (${groupId})៖ ${textToSend}`,
            `✅ **បានបញ្ជូនសារចូលទៅកាន់គ្រុប «${groupName}» ដោយជោគជ័យ!**\n\n🗣️ **សារដែលបានផ្ញើ៖** ${
              data.sentMessage || textToSend
            }`
          );
        }
      } else {
        if (onOpenIdChatModal) onOpenIdChatModal(groupId);
      }
    } catch {
      if (onOpenIdChatModal) onOpenIdChatModal(groupId);
    } finally {
      setIsSendingToGroup(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const vadContextRef = useRef<AudioContext | null>(null);
  const vadFrameRef = useRef<number | null>(null);
  const speechRecRef = useRef<any>(null);
  const liveVoiceHintRef = useRef<string>("");

  const showNotice = (msg: string) => {
    setNoticeText(msg);
    setTimeout(() => setNoticeText(null), 4000);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  // Clean up recording timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Handle image, video, or file selection (including Obscene Media Moderation & Anti-Hack File Security Inspection!)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 0. Check if file name or mimeType indicates obscene/inappropriate video or photo -> Immediately block, auto-delete & scold!
    const modCheck = analyzeInappropriateOrObsceneContent(inputText, file.name, file.type);
    if (modCheck.isInappropriate) {
      showNotice(`🚫 មាតិកាមិនសមរម្យ "${file.name}" ត្រូវបានទប់ស្កាត់ និងលុបចោលជាបន្ទាន់!`);
      setAttachedImage(null);
      setInputText("");
      onSendMessage(`[ផ្ញើមេឌៀមិនសមរម្យ: ${file.name}]`);
      e.target.value = "";
      return;
    }

    // 1. If the uploaded file is a Video -> Read video base64 (for Khmer voice dubbing) AND extract a frame so AI Vision inspects/solves
    if (file.type.startsWith("video/")) {
      const vidReader = new FileReader();
      vidReader.onload = () => {
        const resStr = String(vidReader.result || "");
        const b64 = resStr.split(",")[1] || "";
        if (b64) {
          setAttachedVideo({
            data: b64,
            mimeType: file.type || "video/mp4",
            name: file.name,
          });
        }
      };
      vidReader.readAsDataURL(file);

      const videoUrl = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.src = videoUrl;
      video.muted = true;
      video.playsInline = true;
      video.currentTime = 0.5;
      const cleanup = () => {
        try {
          URL.revokeObjectURL(videoUrl);
        } catch {}
      };
      video.onloadeddata = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = Math.min(640, video.videoWidth || 640);
          canvas.height = Math.min(360, video.videoHeight || 360);
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
            const base64Data = dataUrl.split(",")[1] || "";
            if (base64Data) {
              setAttachedImage({
                data: base64Data,
                mimeType: "image/jpeg",
                name: file.name,
                previewUrl: dataUrl,
              });
              showNotice(
                `🎬 បានភ្ជាប់វីដេអូ "${file.name}" — អាចចុច "🇰🇭 បកប្រែសំឡេងវីដេអូជាខ្មែរ" ឬផ្ញើសួរបានភ្លាមៗ!`
              );
            }
          }
        } catch {}
        cleanup();
      };
      video.onerror = () => cleanup();
      e.target.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      const sec = analyzeFileSecurity(file.name, file.type, file.size);
      if (sec.isDangerous) {
        showNotice(`🚨 ប្រុងប្រយ័ត្ន! រកឃើញហ្វាល់គ្រោះថ្នាក់ "${file.name}" — កំពុងបង្ហាញការព្រមានលម្អិត!`);
      } else {
        showNotice(`🛡️ កំពុងត្រួតពិនិត្យសុវត្ថិភាពឯកសារ "${file.name}"...`);
      }
      onSendMessage(
        `[ត្រួតពិនិត្យសុវត្ថិភាពហ្វាល់: ${file.name} | ប្រភេទ: ${file.type || "unknown"} | ទំហំ: ${file.size} bytes] សូមជួយត្រួតពិនិត្យសុវត្ថិភាពហ្វាល់ "${file.name}" នេះ និងព្រមានប្រាប់ពីហេតុផលឱ្យបានច្បាស់លាស់!`
      );
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(",")[1];
      setAttachedImage({
        data: base64Data,
        mimeType: file.type,
        name: file.name,
        previewUrl: result,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Handle clipboard paste of screenshots
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(",")[1];
            setAttachedImage({
              data: base64Data,
              mimeType: file.type,
              name: "Pasted Image",
              previewUrl: result,
            });
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    }
  };

  // Start voice audio recording with HD Studio Vocal Boost & Parallel Live Speech Recognition
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showNotice("កម្មវិធីរុករករបស់អ្នកមិនទាន់បើកសិទ្ធិប្រើប្រាស់ Microphone ទេ");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
        },
      });
      streamRef.current = stream;
      liveVoiceHintRef.current = "";
      setLiveVoiceHint("");

      let recordingStream = stream;

      // Setup WebAudio Studio Vocal Clarity Filter (85Hz High-pass + 2.5kHz Vocal Presence + Compressor + 1.65x Gain) & VAD
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        vadContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);

        const highPass = ctx.createBiquadFilter();
        highPass.type = "highpass";
        highPass.frequency.value = 85;

        const vocalPresence = ctx.createBiquadFilter();
        vocalPresence.type = "peaking";
        vocalPresence.frequency.value = 2500;
        vocalPresence.Q.value = 1.1;
        vocalPresence.gain.value = 6.0;

        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -26;
        compressor.knee.value = 18;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.15;

        const gainNode = ctx.createGain();
        gainNode.gain.value = 1.65;

        const destination = ctx.createMediaStreamDestination();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;

        source.connect(highPass);
        highPass.connect(vocalPresence);
        vocalPresence.connect(compressor);
        compressor.connect(gainNode);
        gainNode.connect(destination);
        gainNode.connect(analyser);

        if (destination.stream.getAudioTracks().length > 0) {
          recordingStream = destination.stream;
        }

        const freqData = new Uint8Array(analyser.frequencyBinCount);
        let hasSpoken = false;
        let speechBeganAt = 0;
        let silenceBeganAt = 0;

        const checkVad = () => {
          if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") {
            return;
          }
          analyser.getByteFrequencyData(freqData);
          let sum = 0;
          for (let i = 0; i < freqData.length; i++) sum += freqData[i];
          const avg = sum / freqData.length;
          const now = Date.now();
          if (avg > 14) {
            if (!hasSpoken) {
              hasSpoken = true;
              speechBeganAt = now;
            }
            silenceBeganAt = 0;
          } else if (hasSpoken) {
            if (silenceBeganAt === 0) {
              silenceBeganAt = now;
            } else if (now - silenceBeganAt > 900 && now - speechBeganAt > 450) {
              stopAndSendRecording();
              return;
            }
          }
          vadFrameRef.current = requestAnimationFrame(checkVad);
        };
        vadFrameRef.current = requestAnimationFrame(checkVad);
      } catch {}

      // Start parallel Browser SpeechRecognition for live interim transcript & browserHint
      try {
        const SpeechRec =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRec) {
          const rec = new SpeechRec();
          rec.lang = "km-KH";
          rec.continuous = true;
          rec.interimResults = true;
          rec.maxAlternatives = 3;
          let finalAcc = "";
          rec.onresult = (ev: any) => {
            let interim = "";
            for (let i = ev.resultIndex; i < ev.results.length; i++) {
              const t = ev.results[i][0]?.transcript || "";
              if (ev.results[i].isFinal) {
                finalAcc = `${finalAcc} ${t}`.trim();
              } else {
                interim = `${interim} ${t}`.trim();
              }
            }
            const combined = `${finalAcc} ${interim}`.trim();
            if (combined) {
              liveVoiceHintRef.current = combined;
              setLiveVoiceHint(combined);
            }
          };
          rec.onerror = () => {};
          rec.start();
          speechRecRef.current = rec;
        }
      } catch {}

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const mediaRecorder = new MediaRecorder(
        recordingStream,
        mimeType ? { mimeType, audioBitsPerSecond: 128000 } : undefined
      );
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(150);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      showNotice("សូមអនុញ្ញាតបើកសិទ្ធិ Microphone ដើម្បីថតសំឡេង");
      setIsRecording(false);
    }
  };

  // Cancel recording without sending
  const cancelRecording = () => {
    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
      } catch {}
      speechRecRef.current = null;
    }
    if (vadFrameRef.current) {
      cancelAnimationFrame(vadFrameRef.current);
      vadFrameRef.current = null;
    }
    if (vadContextRef.current) {
      try {
        vadContextRef.current.close();
      } catch {}
      vadContextRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    audioChunksRef.current = [];
    liveVoiceHintRef.current = "";
    setLiveVoiceHint("");
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  // Stop recording and send audio message
  const stopAndSendRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;

    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
      } catch {}
      speechRecRef.current = null;
    }
    if (vadFrameRef.current) {
      cancelAnimationFrame(vadFrameRef.current);
      vadFrameRef.current = null;
    }
    if (vadContextRef.current) {
      try {
        vadContextRef.current.close();
      } catch {}
      vadContextRef.current = null;
    }
    setIsProcessingVoice(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const capturedHint = liveVoiceHintRef.current.trim();

    mediaRecorderRef.current.onstop = async () => {
      const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(",")[1];

        let transcribedText = "";
        try {
          const transRes = await fetch("/api/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audioData: base64Data,
              mimeType,
              browserHint: capturedHint,
            }),
            signal: AbortSignal.timeout(4200),
          });
          if (transRes.ok) {
            const transData = await transRes.json();
            transcribedText = transData.text || "";
          }
        } catch {
          // Fast fallback: /api/chat directly processes audioPayload in 1 pass
        }

        const audioPayload: ChatAudio = {
          data: base64Data,
          mimeType,
          durationSeconds: recordingSeconds,
        };

        const finalPrompt =
          transcribedText || capturedHint || "🎙️ [សារសំឡេង/Voice Note]";
        onSendMessage(
          finalPrompt,
          attachedImage || undefined,
          audioPayload,
          selectedEmotionTone
        );

        liveVoiceHintRef.current = "";
        setLiveVoiceHint("");
        setIsRecording(false);
        setIsProcessingVoice(false);
        setRecordingSeconds(0);
        setAttachedImage(null);
      };
      reader.readAsDataURL(audioBlob);
    };

    mediaRecorderRef.current.stop();
  };

  const handleTranslateAttachedVideoToKhmer = async () => {
    if (isTranslatingVideo || isLoading) return;
    const urlInInput = (inputText.match(/https?:\/\/[^\s<>"'`]+/i) || [])[0] || "";
    if (!attachedVideo && !urlInInput) {
      showNotice(
        "សូមភ្ជាប់ហ្វាល់វីដេអូ ឬដាក់តំណលីងវីដេអូ (CapCut, TikTok, YouTube, FB, Pinterest) ដើម្បីបកប្រែសំឡេងជាភាសាខ្មែរ!"
      );
      return;
    }

    setIsTranslatingVideo(true);
    showNotice("🎬🇰🇭 កំពុងស្ដាប់ បកប្រែសំឡេងក្នុងវីដេអូមកជាភាសាខ្មែរ និងបញ្ចូលសំឡេងខ្មែរ...");
    try {
      const dubRes = await translateAndDubVideoClient({
        videoUrl: urlInInput || undefined,
        videoBase64: attachedVideo?.data,
        mimeType: attachedVideo?.mimeType,
        fileName: attachedVideo?.name || "Video",
        userPrompt: inputText.trim() || "បកប្រែសំឡេងក្នុងវីដេអូនេះមកជាភាសាខ្មែរ",
      });
      if (dubRes.ok && dubRes.dubbedVideoUrl && onDirectBotReply) {
        const userLabel =
          inputText.trim() ||
          `🎬🇰🇭 សូមបកប្រែសំឡេងក្នុងវីដេអូ "${attachedVideo?.name || urlInInput}" មកជាភាសាខ្មែរ`;
        onDirectBotReply(userLabel, buildVideoKhmerDubMarkdown(dubRes));
        setInputText("");
        setAttachedImage(null);
        setAttachedVideo(null);
      } else if (urlInInput) {
        onSendMessage(`បកប្រែសំឡេងក្នុងវីដេអូនេះមកជាភាសាខ្មែរ ${urlInInput}`);
        setInputText("");
      }
    } finally {
      setIsTranslatingVideo(false);
    }
  };

  const handleSend = () => {
    const trimmed = inputText.trim();
    if ((!trimmed && !attachedImage && !attachedVideo) || isLoading) return;

    if (
      attachedVideo &&
      /(?:បកប្រែ|ខ្មែរ|សំឡេង|សម្លេង|dub|translate)/i.test(trimmed || "បកប្រែវីដេអូ")
    ) {
      handleTranslateAttachedVideoToKhmer();
      return;
    }

    onSendMessage(trimmed, attachedImage || undefined, undefined, selectedEmotionTone);
    setInputText("");
    setAttachedImage(null);
    setAttachedVideo(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="w-full bg-[#17212b] border-t border-white/10 p-2 sm:p-3 transition-colors">
      <div className="max-w-4xl mx-auto">
        {/* Inline notice banner (no window.alert) */}
        {noticeText && (
          <div className="mb-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs flex items-center justify-between">
            <span>⚠️ {noticeText}</span>
            <button onClick={() => setNoticeText(null)} className="text-white/60 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Attached image preview banner */}
        {attachedImage && (
          <div className="flex items-center gap-2 p-2 mb-2 bg-[#202e3e] border border-sky-400/30 rounded-xl">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/20 bg-black/40 shrink-0">
              <img
                src={attachedImage.previewUrl}
                alt="Upload preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {attachedImage.name || "រូបភាពបានភ្ជាប់"}
              </p>
              <p className="text-[10px] text-sky-300">
                {attachedVideo
                  ? "🎬 អាចចុច «🇰🇭 បកប្រែសំឡេងវីដេអូជាខ្មែរ» ដើម្បីទទួលបានវីដេអូនិយាយខ្មែរត្រឡប់មកវិញ!"
                  : '✨ អាចឱ្យ AI ដោះស្រាយលំហាត់ក្នុងរូប ឬសរសេរថា "កែរូបនេះ..." ដើម្បីកែរូបភាព'}
              </p>
            </div>
            {attachedVideo ? (
              <button
                type="button"
                disabled={isTranslatingVideo}
                onClick={handleTranslateAttachedVideoToKhmer}
                className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white border border-purple-400/40 text-[11px] font-semibold flex items-center gap-1 cursor-pointer shrink-0 shadow-sm"
              >
                {isTranslatingVideo ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Languages className="w-3 h-3" />
                )}
                <span>
                  {isTranslatingVideo
                    ? "កំពុងបកប្រែវីដេអូ..."
                    : "🇰🇭 បកប្រែសំឡេងវីដេអូជាខ្មែរ"}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    onSendMessage(
                      "សូមបម្លែងរូបភាពនៃអត្ថបទនេះទៅជាអក្សរ (OCR) សម្រាប់ចម្លង និងត្រួតពិនិត្យអក្ខរាវិរុទ្ធឱ្យបានត្រឹមត្រូវ",
                      attachedImage
                    );
                    setInputText("");
                    setAttachedImage(null);
                    setAttachedVideo(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-teal-500/25 hover:bg-teal-500/40 text-teal-200 border border-teal-400/40 text-[11px] font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <ScanText className="w-3 h-3" />
                  <span>📋 បម្លែងជាអក្សរ (OCR)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenImageStudio(attachedImage)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/25 hover:bg-indigo-500/40 text-indigo-200 border border-indigo-400/30 text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>កែរូបក្នុង Studio</span>
                </button>
              </div>
            )}
            <button
              onClick={() => {
                setAttachedImage(null);
                setAttachedVideo(null);
              }}
              className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Emotion Tone Bar (All 20 Emotions: Old + Newly Added Emotions for both Text & Voice Chat) */}
        <div
          className={`flex items-center gap-1 pb-1.5 mb-1 ${
            expandAllEmotions ? "flex-wrap" : "overflow-x-auto no-scrollbar"
          }`}
        >
          <span className="text-[10px] font-semibold text-sky-300/90 shrink-0 mr-0.5">
            💓 អារម្មណ៍ AI (ចាស់+ថ្មី)៖
          </span>
          {CHAT_EMOTION_MODES.map((emo) => {
            const active = selectedEmotionTone === emo.id;
            return (
              <button
                key={emo.id}
                type="button"
                title={emo.title}
                onClick={() => setSelectedEmotionTone(emo.id)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 transition-all cursor-pointer border ${
                  active
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-400 shadow-sm shadow-pink-500/30"
                    : (emo as any).isNew
                    ? "bg-indigo-950/80 text-indigo-200 border-indigo-400/30 hover:bg-indigo-900/90 hover:text-white"
                    : "bg-[#202e3e]/80 text-white/75 border-white/10 hover:bg-[#2a3b4f] hover:text-white"
                }`}
              >
                {emo.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setExpandAllEmotions((prev) => !prev)}
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 bg-sky-500/20 text-sky-300 border border-sky-400/30 hover:bg-sky-500/30 cursor-pointer"
          >
            {expandAllEmotions ? "➖ បង្រួមជួរ" : "➕ បង្ហាញទាំង ២០"}
          </button>
        </div>

        {/* Input Controls Bar */}
        <div className="flex items-end gap-1.5 bg-[#0e1621] rounded-2xl p-1.5 border border-white/10 focus-within:border-sky-500/50 transition-all shadow-inner">
          {/* Hidden file inputs */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="*/*"
            className="hidden"
          />
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          {/* When recording voice: Show Audio Recorder UI */}
          {isRecording ? (
            <div className="flex-1 flex items-center justify-between px-3 py-1.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
                  <span className="font-mono text-sm font-semibold text-rose-400">
                    {formatSeconds(recordingSeconds)}
                  </span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 text-xs font-medium truncate">
                  <Radio className="w-3 h-3 animate-pulse shrink-0" />
                  <span className="truncate">
                    {liveVoiceHint
                      ? `ឮថា៖ «${liveVoiceHint}»`
                      : "កំពុងចាប់សំឡេង HD 200%... (និយាយសំណួរ ឬលំហាត់)"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelRecording}
                  title="បោះបង់ការថត"
                  className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={stopAndSendRecording}
                  disabled={isProcessingVoice}
                  title="បញ្ជូនសារសំឡេង"
                  className="px-3.5 py-1.5 rounded-full bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  {isProcessingVoice ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{isProcessingVoice ? "កំពុងវិភាគ..." : "ផ្ញើសំឡេង"}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Attachment & AI Image Studio buttons */}
              <div className="flex items-center gap-0.5 text-white/60 mb-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="ភ្ជាប់រូបថតលំហាត់ ឬជ្រើសរើសហ្វាល់ដើម្បីស្កេនការពារ File Hack"
                  className="p-2 rounded-full hover:bg-white/10 hover:text-sky-400 transition-colors cursor-pointer"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  title="ថតរូបលំហាត់ផ្ទាល់"
                  className="p-2 rounded-full hover:bg-white/10 hover:text-sky-400 transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenImageStudio(attachedImage)}
                  title="បង្កើតរូបភាពថ្មី ឬកែរូបភាពតាមការចង់បានដោយ AI"
                  className="p-2 rounded-full hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  <Wand2 className="w-4 h-4" />
                </button>
                {onOpenVideoStudio && (
                  <button
                    type="button"
                    onClick={onOpenVideoStudio}
                    title="🎬 ស្ទូឌីយោបង្កើតវីដេអូរូបភាពនិយាយ (Talking Head Video Studio) មានកាយវិការរស់រវើក"
                    className="p-2 rounded-full hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                )}
                {onOpenQrStudio && (
                  <button
                    type="button"
                    onClick={onOpenQrStudio}
                    title="📱 ស្ទូឌីយោបង្កើត QR Code ឆ្លាតវៃ (Text, Image, Video, Word, Excel, PDF, PPTX)"
                    className="p-2 rounded-full hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = inputText.trim()
                      ? `សូមសរសេរកូដ ឬកែកូដ Web App / Website៖ ${inputText.trim()}`
                      : "សូមសរសេរកូដបង្កើត Web App ឬ Website ទំនើបពេញលេញ (HTML/Tailwind/JS) ឱ្យបានល្អឥតខ្ចោះ";
                    setInputText(nextVal);
                    textareaRef.current?.focus();
                  }}
                  title="សរសេរកូដ និងកែកូដបង្កើត Web App ឬ Website"
                  className="p-2 rounded-full hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  <Code2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const urlInInput = (inputText.match(/https?:\/\/[^\s<>"'`]+/i) || [])[0] || "";
                    if (attachedVideo || urlInInput) {
                      handleTranslateAttachedVideoToKhmer();
                    } else {
                      const nextVal = inputText.trim()
                        ? `សូមបកប្រែសំឡេងក្នុងវីដេអូនេះមកជាភាសាខ្មែរ៖ ${inputText.trim()}`
                        : "សូមបកប្រែសំឡេងក្នុងវីដេអូនេះមកជាភាសាខ្មែរ៖ ";
                      setInputText(nextVal);
                      textareaRef.current?.focus();
                    }
                  }}
                  title="បកប្រែសំឡេងក្នុងវីដេអូពីភាសាផ្សេងៗមកជាភាសាខ្មែរ រួចផ្ដល់វីដេអូបកប្រែជាខ្មែរមកវិញ"
                  className="p-2 rounded-full hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                >
                  {isTranslatingVideo ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Languages className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenOrthographyModal) {
                      onOpenOrthographyModal();
                    } else {
                      const nextVal = inputText.trim()
                        ? `សូមត្រួតពិនិត្យអក្ខរាវិរុទ្ធ និងវេយ្យាករណ៍៖ ${inputText.trim()}`
                        : "សូមត្រួតពិនិត្យអក្ខរាវិរុទ្ធ និងវេយ្យាករណ៍៖ ";
                      setInputText(nextVal);
                      textareaRef.current?.focus();
                    }
                  }}
                  title="ត្រួតពិនិត្យអក្ខរាវិរុទ្ធ វេយ្យាករណ៍ និងបម្លែងរូបភាពនៃអត្ថបទទៅជាអក្សរ (OCR)"
                  className="p-2 rounded-full hover:bg-teal-500/20 text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
                >
                  <SpellCheck className="w-4 h-4" />
                </button>
              </div>

              {/* Text input area */}
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={
                  attachedImage
                    ? "សួរអំពីរូបថត/វីដេអូនេះ ឬចុចផ្ញើដើម្បីដោះស្រាយបញ្ហាភ្លាម..."
                    : isLiveChatActive
                    ? "🎙️ Live Chat កំពុងដំណើរការ (និយាយផ្ទាល់ ឬវាយអក្សរឆ្លើយឆ្លងបានភ្លាមៗ)..."
                    : "សួរគ្រប់បញ្ហា ទាញយក MP3/MP4 (CapCut/Pinterest/TikTok/YT/FB) ឬចុចប៊ូតុង Live Chat..."
                }
                rows={1}
                disabled={isLoading}
                className="flex-1 bg-transparent border-0 text-white text-[14px] sm:text-[14.5px] placeholder-white/40 focus:ring-0 focus:outline-none resize-none py-1.5 px-1 leading-relaxed max-h-32 min-h-[38px]"
              />

              {/* One-Click Continuous Live Chat Toggle Button */}
              {onToggleLiveChat && (
                <button
                  type="button"
                  onClick={onToggleLiveChat}
                  title={
                    isLiveChatActive
                      ? "ចុចបិទប៊ូតុងនេះដើម្បីបញ្ឈប់ Live Chat"
                      : "ចុចប៊ូតុងនិយាយ Live Chat (ដំណើរការរហូតទាល់តែចុចបិទប៊ូតុងនេះវិញ)"
                  }
                  className={`px-2.5 py-1.5 rounded-full mb-1 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    isLiveChatActive
                      ? "bg-rose-500 hover:bg-rose-400 text-white shadow-md shadow-rose-500/30 animate-pulse"
                      : "bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30"
                  }`}
                >
                  {isLiveChatActive ? (
                    <>
                      <PhoneOff className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">បិទ Live</span>
                    </>
                  ) : (
                    <>
                      <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span className="hidden sm:inline">Live Chat</span>
                    </>
                  )}
                </button>
              )}

              {/* Voice Mic button: Starts single voice note recording */}
              <button
                type="button"
                onClick={startRecording}
                disabled={isLoading}
                title="ថត និងផ្ញើសារជាសំឡេង (Voice Note)"
                className="p-2 rounded-full mb-1 text-white/60 hover:text-sky-400 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Send button */}
              <button
                type="button"
                onClick={handleSend}
                disabled={(!inputText.trim() && !attachedImage) || isLoading}
                className={`p-2.5 rounded-full mb-0.5 transition-all shadow-md flex items-center justify-center ${
                  (inputText.trim() || attachedImage) && !isLoading
                    ? "bg-sky-500 hover:bg-sky-400 text-white active:scale-95 cursor-pointer shadow-sky-500/20"
                    : "bg-white/5 text-white/30 cursor-not-allowed"
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Bottom Quick Super Capabilities Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-0.5 px-1 no-scrollbar">
          {onOpenOrthographyModal && (
            <button
              type="button"
              onClick={onOpenOrthographyModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-500/15 hover:bg-teal-500/25 border border-teal-400/30 text-teal-200 text-[11px] font-medium shrink-0 cursor-pointer"
            >
              <ScanText className="w-3 h-3 text-teal-300" />
              <span>📷 រូបភាពទៅជាអក្សរ &amp; អក្ខរាវិរុទ្ធ</span>
            </button>
          )}
          {onOpenSuperModal && (
            <>
              <button
                type="button"
                onClick={() => onOpenSuperModal("translator")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-200 text-[11px] font-medium shrink-0 cursor-pointer"
              >
                <Globe className="w-3 h-3 text-cyan-300" />
                <span>🌍 បកប្រែគ្រប់ភាសា</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenSuperModal("story")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/30 text-purple-200 text-[11px] font-medium shrink-0 cursor-pointer"
              >
                <Film className="w-3 h-3 text-purple-300" />
                <span>📖 បង្កើតរឿងរន្ធត់/ប្រលោមលោក/និទាន</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenSuperModal("dictionary")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-amber-200 text-[11px] font-medium shrink-0 cursor-pointer"
              >
                <BookOpen className="w-3 h-3 text-amber-300" />
                <span>📚 វចនានុក្រមរូបភាព ៣ ទិសដៅ</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenSuperModal("calendar")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-200 text-[11px] font-medium shrink-0 cursor-pointer"
              >
                <Calendar className="w-3 h-3 text-emerald-300" />
                <span>📅 ប្រតិទិនកម្ពុជា &amp; ជូនដំណឹងថ្ងៃបុណ្យ</span>
              </button>
            </>
          )}
          {onOpenIdChatModal && (
            <button
              type="button"
              onClick={() => onOpenIdChatModal()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-500/15 hover:bg-pink-500/25 border border-pink-400/30 text-pink-200 text-[11px] font-medium shrink-0 cursor-pointer"
            >
              <MessageSquare className="w-3 h-3 text-pink-300" />
              <span>💬💙 បញ្ជាឆាតទៅ Messenger (Link Profile FB) &amp; ID Chat (ឱ្យ AI ឆ្លើយខ្លួនឯង)</span>
            </button>
          )}
        </div>

        {/* Always-Visible Bottom Bar of Telegram Bot Users (with Phone Model & Battery %) & Joined Groups */}
        <div className="flex flex-col gap-1.5 mt-1.5 px-2.5 py-2 rounded-xl bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-cyan-950/80 border border-emerald-500/35">
          {/* Row 1: Ready-made Telegram Bot Users (No need to type ID Chat + Shows Phone Model & Battery %) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-300 shrink-0">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>👤📱 អ្នកប្រើ Telegram Bot (មិនបាច់វាយ ID Chat)៖</span>
            </span>
            {botUsers.length > 0 ? (
              botUsers.map((usr) => (
                <div
                  key={usr.chatId}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-cyan-500/35 bg-slate-950/85 text-[11px] text-cyan-100 hover:border-cyan-400 transition-all"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenIdChatModal) {
                        onOpenIdChatModal(usr.name || String(usr.chatId));
                      }
                    }}
                    className="flex items-center gap-1 cursor-pointer"
                    title="ចុចលើឈ្មោះដើម្បីបើកផ្ទាំងបញ្ជា AI ឆាតទៅកាន់អ្នកប្រើនេះដោយមិនបាច់វាយ ID Chat"
                  >
                    <span className="font-bold text-white">👤 {usr.name}</span>
                    <span className="text-[10px] text-cyan-300 bg-cyan-950/70 px-1 rounded">
                      📱 {usr.phoneModel || "iPhone 16 Pro Max"}
                    </span>
                    <span className="text-[10px] text-emerald-300 bg-emerald-950/70 px-1 rounded font-semibold">
                      🔋 {usr.batteryLevel ?? 88}%{usr.isCharging ? "⚡" : ""}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={isSendingToGroup}
                    onClick={() =>
                      handleQuickSendToUserFromBottom(String(usr.chatId), usr.name, true)
                    }
                    className="px-1.5 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] cursor-pointer disabled:opacity-50"
                    title={
                      inputText.trim()
                        ? `បញ្ជាឱ្យ AI ឆាតទៅកាន់ «${usr.name}» តាមបញ្ជាខាងលើភ្លាម (មិនបាច់វាយ ID Chat)`
                        : `ឱ្យ AI និយាយរាក់ទាក់ទៅកាន់ «${usr.name}» ភ្លាម (មិនបាច់វាយ ID Chat)`
                    }
                  >
                    {inputText.trim() ? "🤖 បញ្ជា AI ឆាតភ្លាម" : "🤖 ឱ្យ AI ឆាតទៅ"}
                  </button>
                </div>
              ))
            ) : (
              <button
                type="button"
                onClick={() => onOpenIdChatModal && onOpenIdChatModal("អ្នកប្រើ")}
                className="px-2.5 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-[11px] font-semibold cursor-pointer"
              >
                👤📱 មើលឈ្មោះអ្នកប្រើ Bot + ប្រភេទទូរស័ព្ទ &amp; ថ្ម (ឆាតដោយមិនបាច់វាយ ID)
              </button>
            )}
          </div>

          {/* Row 2: Groups where the Bot is present */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-white/10">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-300 shrink-0">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>👥 គ្រុបដែលមាន Bot៖</span>
              </span>
              {botGroups.length > 0 ? (
                botGroups.map((grp) => {
                  const isSelected = selectedBottomGroupId === String(grp.chatId);
                  return (
                    <div
                      key={grp.chatId}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] transition-all ${
                        isSelected
                          ? "bg-emerald-500/30 border-emerald-400 text-white font-bold"
                          : "bg-slate-950/80 border-emerald-500/30 text-emerald-200 hover:border-emerald-400"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBottomGroupId(String(grp.chatId));
                          if (onOpenIdChatModal) {
                            onOpenIdChatModal(String(grp.chatId));
                          }
                        }}
                        className="flex items-center gap-1 cursor-pointer"
                        title="ចុចដើម្បីបើកផ្ទាំងឆាតទៅកាន់គ្រុបនេះ"
                      >
                        <span>👥 {grp.name}</span>
                      </button>
                      <button
                        type="button"
                        disabled={isSendingToGroup}
                        onClick={() => handleQuickSendToGroupFromBottom(String(grp.chatId), grp.name)}
                        className="px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] cursor-pointer disabled:opacity-50"
                        title={
                          inputText.trim()
                            ? `ផ្ញើសារក្នុងប្រអប់ខាងលើចូលគ្រុប «${grp.name}» ភ្លាម`
                            : `បើកឆាតទៅកាន់គ្រុប «${grp.name}»`
                        }
                      >
                        {inputText.trim() ? "📤 ផ្ញើចូលគ្រុបភ្លាម" : "💬 ឆាតចូលគ្រុប"}
                      </button>
                    </div>
                  );
                })
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenIdChatModal && onOpenIdChatModal("ក្នុងគ្រុប")}
                  className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-[11px] font-semibold cursor-pointer"
                >
                  👥 ឆាតចូលគ្រុបដែលមាន Bot (មិនបាច់ប្រើ Link)
                </button>
              )}
            </div>

            {/* Row 3: Members of selected group (Chat directly to any member in the group, even if they don't have or don't use the bot!) */}
            {(() => {
              const activeGrp =
                botGroups.find((g) => String(g.chatId) === selectedBottomGroupId) || botGroups[0];
              const members = Array.isArray(activeGrp?.groupMembers) ? activeGrp.groupMembers : [];
              if (members.length === 0) return null;
              return (
                <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-emerald-500/20">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-sky-300 shrink-0">
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    <span>👤 សមាជិកក្នុង «{activeGrp?.name}»៖</span>
                  </span>
                  {members.map((m: any) => (
                    <div
                      key={m.chatId}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-sky-500/30 bg-sky-950/40 text-sky-100 text-[11px] shrink-0 hover:border-sky-400 transition-all"
                    >
                      <span>👤 {m.name}</span>
                      {m.username && (
                        <span className="text-[10px] text-white/50">
                          (@{String(m.username).replace(/^@/, '')})
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const tag = m.username
                            ? `@${String(m.username).replace(/^@/, '')}`
                            : m.name;
                          setInputText((prev) => `${tag} ${prev}`.trim());
                        }}
                        className="px-1.5 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] cursor-pointer"
                        title="បញ្ជាឆាតទៅកាន់សមាជិកនេះក្នុងគ្រុប"
                      >
                        💬 ឆាត
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await handleQuickSendToGroupFromBottom(
                            String(activeGrp.chatId),
                            `${activeGrp.name} (ជូនចំពោះ ${m.name})`
                          );
                        }}
                        className="px-1.5 py-0.5 rounded bg-[#2aabee] hover:bg-sky-400 text-white font-bold text-[10px] cursor-pointer"
                        title="ឱ្យ AI និយាយទៅកាន់គាត់ក្នុងគ្រុបដោយខ្លួនឯង"
                      >
                        🤖 AI និយាយ
                      </button>
                    </div>
                  ))}
                </div>
              );
            })()}

            {(botGroups.length > 0 || botUsers.length > 0) && (
              <span className="text-[10px] text-emerald-200/75 hidden sm:inline">
                ចុចលើឈ្មោះអ្នកប្រើ ឬគ្រុប ដើម្បីឱ្យ AI ឆាតទៅដោយមិនបាច់វាយ ID Chat
              </span>
            )}
          </div>
        </div>

        {/* Bottom hint label */}
        <div className="flex items-center justify-between px-2 pt-1.5 text-[10.5px] text-white/40">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping"></span>
            <span>🎙️ Live Chat ឆ្លើយឆ្លងរហូត • 📥 ទាញយក MP3/MP4 ពី CapCut, Pinterest, TikTok, YT, FB</span>
          </span>
          <span>ចុច Enter ដើម្បីផ្ញើ (Shift+Enter ចុះបន្ទាត់)</span>
        </div>
      </div>
    </div>
  );
};
