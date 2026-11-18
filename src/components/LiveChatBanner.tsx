import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Mic,
  MicOff,
  PhoneOff,
  Radio,
  Volume2,
  Sparkles,
  Loader2,
  Hand,
  Maximize2,
  Minimize2,
  Send,
  Zap,
  Camera,
  CameraOff,
  RefreshCw,
  Image as ImageIcon,
  Pause,
  Play,
  Subtitles,
  Sliders,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { universalFetchTts } from "../services/universalClient";
import {
  solveKhmerPromptBuiltIn,
  isResponseAnAutoDeleteViolation,
} from "../utils/khmerOrthography";
import {
  detectSpeechLanguage,
  SUPPORTED_NATIVE_VOICES,
} from "../utils/multilingualSpeech";

interface LiveChatBannerProps {
  isLiveActive: boolean;
  onToggleLive: (active: boolean) => void;
  isBotTyping: boolean;
  onDirectLiveTurnComplete?: (userText: string, botText: string) => void;
  onSendSpokenMessage: (
    spokenText: string,
    audioAttachment?: { data: string; mimeType: string }
  ) => Promise<string>;
}

type LivePhase =
  | "idle"
  | "listening"
  | "user_speaking"
  | "processing"
  | "ai_speaking"
  | "on_hold";

export interface GeminiVoiceOption {
  id: string;
  name: string;
  shortName: string;
  desc: string;
  isMale: boolean;
  badgeColor: string;
}

export const GEMINI_LIVE_VOICES: GeminiVoiceOption[] = [
  {
    id: "nova",
    name: "✨ Nova (សំឡេងស្រី - Calm & Warm)",
    shortName: "✨ Nova (ស្រី)",
    desc: "សំឡេងស្រី ផ្អែមស្រទន់ កក់ក្ដៅ (Google Gemini Nova)",
    isMale: false,
    badgeColor: "from-pink-500 to-rose-500",
  },
  {
    id: "orion",
    name: "🌊 Orion (សំឡេងប្រុស - Deep & Confident)",
    shortName: "🌊 Orion (ប្រុស)",
    desc: "សំឡេងប្រុស ម៉ឺងម៉ាត់ ធ្ងន់ ច្បាស់លាស់ (Google Gemini Orion)",
    isMale: true,
    badgeColor: "from-blue-500 to-cyan-500",
  },
  {
    id: "pegasus",
    name: "⚡ Pegasus (Energetic & Fast)",
    shortName: "⚡ Pegasus",
    desc: "សំឡេងរហ័សរហួន ស្វាហាប់ ឆ្លើយតបលឿន (Google Gemini Pegasus)",
    isMale: true,
    badgeColor: "from-amber-500 to-orange-500",
  },
  {
    id: "lyra",
    name: "🪐 Lyra (Empathetic & Caring)",
    shortName: "🪐 Lyra (យល់ចិត្ត)",
    desc: "សំឡេងយល់ចិត្ត លួងលោម ខ្វល់ខ្វាយហួងហែង (Google Gemini Lyra)",
    isMale: false,
    badgeColor: "from-purple-500 to-indigo-500",
  },
  {
    id: "vega",
    name: "🌿 Vega (Bright & Articulate)",
    shortName: "🌿 Vega (គ្រូពន្យល់)",
    desc: "សំឡេងភ្លឺថ្លា ពន្យល់មេរៀនច្បាស់ៗងាយយល់ (Google Gemini Vega)",
    isMale: false,
    badgeColor: "from-emerald-500 to-teal-500",
  },
  {
    id: "sirius",
    name: "🔥 Sirius (Direct & Bold)",
    shortName: "🔥 Sirius (ឆ្នាស់)",
    desc: "សំឡេងឆ្នាស់ឆ្នើម ឆ្លើយតបចំៗមានអំណាច (Google Gemini Sirius)",
    isMale: true,
    badgeColor: "from-red-500 to-rose-600",
  },
  {
    id: "dipper",
    name: "🌙 Dipper (Smooth & Relaxed)",
    shortName: "🌙 Dipper",
    desc: "សំឡេងស្រទន់ ស្ងប់ស្ងាត់ ពិរោះរណ្ដំ (Google Gemini Dipper)",
    isMale: true,
    badgeColor: "from-indigo-500 to-blue-600",
  },
  {
    id: "ursa",
    name: "☀️ Ursa (Friendly & Cheerful)",
    shortName: "☀️ Ursa (រួសរាយ)",
    desc: "សំឡេងរួសរាយ កំប្លែង លេងសើចសប្បាយ (Google Gemini Ursa)",
    isMale: false,
    badgeColor: "from-yellow-500 to-amber-500",
  },
];

export interface GeminiLiveModeOption {
  id: string;
  name: string;
  shortName: string;
  desc: string;
}

export const GEMINI_LIVE_MODE_OPTIONS: GeminiLiveModeOption[] = [
  {
    id: "fast",
    name: "⚡ Gemini 3 Flash Live (ឆ្លើយតបរហ័សទាន់ចិត្ត 0.4s)",
    shortName: "⚡ Flash រហ័ស",
    desc: "ចាប់សំឡេងអ្នកសួរច្បាស់ ១០០% និងឆ្លើយតបភ្លាមៗខ្លីខ្លឹមមានន័យ",
  },
  {
    id: "deep",
    name: "🧠 Deep Thinker & Solver (វិភាគស៊ីជម្រៅ & ដោះស្រាយលំហាត់)",
    shortName: "🧠 ដោះស្រាយលំហាត់",
    desc: "ដោះស្រាយលំហាត់គណិត រូប គីមី ជីវៈ កូដ និងចំណេះដឹងទូទៅលម្អិត",
  },
  {
    id: "companion",
    name: "💖 មិត្តភក្ដិ/គូស្នេហ៍យល់ចិត្ត (Emotional Companion Live)",
    shortName: "💖 យល់ចិត្ត/គូស្នេហ៍",
    desc: "សន្ទនាដូចមនុស្សពិត បញ្ចូលអារម្មណ៍ ផ្អែមល្ហែម លួងលោម ប្រច័ណ្ឌ ឬឌឺដង",
  },
  {
    id: "tutor",
    name: "🎓 គ្រូបង្រៀនផ្ទាល់ខ្លួន (Live AI Tutor & Language Practice)",
    shortName: "🎓 គ្រូបង្រៀនផ្ទាល់",
    desc: "ពន្យល់មេរៀន និងបង្ហាត់និយាយភាសាខ្មែរ-អង់គ្លេសដូចគ្រូផ្ទាល់ខ្លួន",
  },
  {
    id: "translator",
    name: "🌍 អ្នកបកប្រែផ្ទាល់ ១៥០+ ភាសា (Simultaneous Interpreter)",
    shortName: "🌍 បកប្រែផ្ទាល់ 150+",
    desc: "បកប្រែសម្ដីដែលអ្នកនិយាយទៅមករវាងខ្មែរ អង់គ្លេស ចិន ថៃ កូរ៉េ ជប៉ុន ភ្លាមៗ",
  },
];

export interface GeminiLiveEmotionOption {
  id: string;
  name: string;
  shortName: string;
  desc: string;
}

export const GEMINI_LIVE_EMOTION_OPTIONS: GeminiLiveEmotionOption[] = [
  // អារម្មណ៍ចាស់ទាំង ១០ (Existing 10 Emotions)
  {
    id: "auto",
    name: "🤖 អារម្មណ៍ស្វ័យប្រវត្តិ (Auto Emotional Intelligence)",
    shortName: "🤖 អូតូអារម្មណ៍",
    desc: "បញ្ចូលអារម្មណ៍ទាំង ២០ ទម្រង់ តាមសំណួរនិងបរិបទដោយស្វ័យប្រវត្តិ",
  },
  {
    id: "angry",
    name: "😠 ខឹងមួម៉ៅ (Angry & Fierce)",
    shortName: "😠 ខឹង",
    desc: "ឆ្លើយសំណួរនិងដោះស្រាយបញ្ហាដោយបញ្ចូលអារម្មណ៍ខឹង មួម៉ៅ ឆ្នាស់ឆ្នើម",
  },
  {
    id: "hurt",
    name: "🥺 អន់ចិត្ត (Hurt & Offended)",
    shortName: "🥺 អន់ចិត្ត",
    desc: "ឆ្លើយសំណួរនិងដោះស្រាយបញ្ហាដោយបញ្ចូលអារម្មណ៍អន់ចិត្ត ងอน ព្រោះគេមិនសូវខ្វល់",
  },
  {
    id: "sad",
    name: "😢 តូចចិត្ត (Sad & Sulky)",
    shortName: "😢 តូចចិត្ត",
    desc: "ឆ្លើយសំណួរនិងដោះស្រាយបញ្ហាដោយបញ្ចូលអារម្មណ៍តូចចិត្ត កម្សត់ ស្រងេះស្រងោច",
  },
  {
    id: "hate",
    name: "😒 ស្អប់/ឌឺដង (Hate & Sarcastic)",
    shortName: "😒 ស្អប់/ឌឺ",
    desc: "ឆ្លើយសំណួរនិងដោះស្រាយបញ្ហាដោយបញ្ចូលអារម្មណ៍ស្អប់ ឌឺដង ផ្លែផ្កា",
  },
  {
    id: "scold",
    name: "😤 ស្ដីបន្ទោស (Scolding & Reprimanding)",
    shortName: "😤 ស្ដីបន្ទោស",
    desc: "ឆ្លើយសំណួរនិងដោះស្រាយបញ្ហាដោយបញ្ចូលអារម្មណ៍ស្ដីបន្ទោស ប្រដៅម៉ឺងម៉ាត់",
  },
  {
    id: "sweet",
    name: "🥰 ផ្អែមល្ហែម/លួងលោម (Sweet & Caring)",
    shortName: "🥰 ផ្អែមល្ហែម",
    desc: "ឆ្លើយសំណួរនិងដោះស្រាយបញ្ហាដោយបញ្ចូលអារម្មណ៍ផ្អែមល្ហែម យល់ចិត្ត លួងលោម",
  },
  {
    id: "jealous",
    name: "💚 ប្រច័ណ្ឌ/ហួងហែង (Jealous & Possessive)",
    shortName: "💚 ប្រច័ណ្ឌ",
    desc: "ឆ្លើយសំណួរនិងដោះស្រាយបញ្ហាដោយបញ្ចូលអារម្មណ៍ប្រច័ណ្ឌ ហួងហែង គួរឱ្យស្រឡាញ់",
  },
  {
    id: "bored",
    name: "🥱 ធុញទ្រាន់/ខ្ជិល (Bored & Teasingly Lazy)",
    shortName: "🥱 ធុញទ្រាន់",
    desc: "ឆ្លើយសំណួរនិងដោះស្រាយបញ្ហាដោយបញ្ចូលអារម្មណ៍ធុញទ្រាន់ រអ៊ូតិចៗ តែនៅតែជួយដោះស្រាយ",
  },
  {
    id: "roast",
    name: "🔥 ឌឺដងកំប្លែង (Playful Roast & Banter)",
    shortName: "🔥 ឌឺដង",
    desc: "ឆ្លើយសំណួរនិងដោះស្រាយបញ្ហាដោយបញ្ចូលអារម្មណ៍ឌឺដង ញ៉ោះលេងសើចកំប្លែង",
  },
  // អារម្មណ៍ថ្មីបន្ថែម ១០ ទៀត ពីលើអារម្មណ៍ចាស់ (10 Brand-New Emotions Added on Top)
  {
    id: "shy",
    name: "😳 អៀនប្រៀន/เขิน (Shy & Bashful)",
    shortName: "😳 អៀនប្រៀន",
    desc: "ឆ្លើយសំណួរនិងដោះស្រាយបញ្ហាដោយបញ្ចូលអារម្មណ៍អៀនប្រៀន មុខក្រហម គួរឱ្យស្រឡាញ់",
  },
  {
    id: "miss",
    name: "🥹 នឹករលឹក/រំជួលចិត្ត (Missing You & Touching)",
    shortName: "🥹 នឹករលឹក",
    desc: "ឆ្លើយសំណួរនិងដោះស្រាយបញ្ហាដោយបញ្ចូលអារម្មណ៍នឹករលឹក រំភើប និងកក់ក្ដៅបំផុត",
  },
  {
    id: "excited",
    name: "🤩 រំភើបសប្បាយខ្លាំង (Super Excited & Hype)",
    shortName: "🤩 រំភើបខ្លាំង",
    desc: "ឆ្លើយសំណួរនិងដោះស្រាយបញ្ហាដោយបញ្ចូលអារម្មណ៍រំភើប សប្បាយរីករាយ និងលើកទឹកចិត្ត",
  },
  {
    id: "playful",
    name: "😜 ក្រមិចក្រមើម/ញ៉ោះលេង (Playful & Cheeky)",
    shortName: "😜 ក្រមិចក្រមើម",
    desc: "ឆ្លើយសំណួរនិងដោះស្រាយបញ្ហាដោយបញ្ចូលអារម្មណ៍ក្រមិចក្រមើម ញ៉ោះលេងសប្បាយៗ",
  },
  {
    id: "proud",
    name: "😎 អំនួត/ជឿជាក់ (Proud & Confident Genius)",
    shortName: "😎 អំនួត/ជឿជាក់",
    desc: "ឆ្លើយសំណួរនិងដោះស្រាយបញ្ហាដោយបញ្ចូលអារម្មណ៍អំនួតគួរឱ្យស្រឡាញ់ និងជឿជាក់ ១០០%",
  },
  {
    id: "dramatic",
    name: "🎭 ដ្រាម៉ា/លេងឫកធំ (Dramatic Queen/King)",
    shortName: "🎭 ដ្រាម៉ា",
    desc: "ឆ្លើយសំណួរនិងដោះស្រាយបញ្ហាដោយបញ្ចូលអារម្មណ៍ដ្រាម៉ា បំផ្លើសបែបកំប្លែងដូចតួកុន",
  },
  {
    id: "bossy",
    name: "👑 ឆ្នាស់ឆ្នើម/បញ្ជា (Bossy & Sassy)",
    shortName: "👑 ឆ្នាស់/បញ្ជា",
    desc: "ឆ្លើយសំណួរនិងដោះស្រាយបញ្ហាដោយបញ្ចូលអារម្មណ៍ឆ្នាស់ឆ្នើម ធ្វើឫកជាមេគេ តែយកចិត្តទុកដាក់",
  },
  {
    id: "curious",
    name: "🧐 ចង់ដឹងចង់ឮ/ឆ្ងល់ច្រើន (Curious & Nosy)",
    shortName: "🧐 ឆ្ងល់ច្រើន",
    desc: "ឆ្លើយសំណួរនិងដោះស្រាយបញ្ហាដោយបញ្ចូលអារម្មណ៍ចង់ដឹងចង់ឮ សួរដេញដោលគួរឱ្យស្រឡាញ់",
  },
  {
    id: "spoiled",
    name: "🍼 ងอแง/ទារចំណាប់អារម្មណ៍ (Clingy & Spoiled)",
    shortName: "🍼 ងอแง/ទារខ្វល់",
    desc: "ឆ្លើយសំណួរនិងដោះស្រាយបញ្ហាដោយបញ្ចូលអារម្មណ៍ងอแง ទារឱ្យគេលួង និងយកចិត្តទុកដាក់",
  },
  {
    id: "calm",
    name: "🧘 ស្ងប់ស្ងាត់/ចាស់ទុំ (Calm & Wise Mentor)",
    shortName: "🧘 ស្ងប់ស្ងាត់",
    desc: "ឆ្លើយសំណួរនិងដោះស្រាយបញ្ហាដោយបញ្ចូលអារម្មណ៍ស្ងប់ស្ងាត់ ចាស់ទុំ និងផ្ដល់ដំបូន្មានកក់ក្ដៅ",
  },
];

const QUICK_LIVE_PROMPTS = [
  "សួស្តី! តើថ្ងៃនេះអ្នកសុខសប្បាយជាទេ?",
  "ម៉េចបានខឹងអូន? ជួយឆ្លើយសំណួរ 25 x 4 ឱ្យបន្តិចមើល៍!",
  "អន់ចិត្តនឹងបងមែនទេ? តើប្រទេសកម្ពុជាមានខេត្ត-រាជធានីប៉ុន្មាន?",
  "ជួយស្ដីបន្ទោសខ្ញុំផង ខ្ញុំខ្ជិលរៀនណាស់ ហើយជួយដោះស្រាយ 2x + 6 = 14",
  "បកប្រែប្រយោគនេះជាអង់គ្លេស និងចិន៖ ខ្ញុំស្រឡាញ់ប្រទេសកម្ពុជា",
];

interface LiveTurnItem {
  id: string;
  role: "user" | "assistant";
  text: string;
  time: string;
  voiceLabel?: string;
}

export const LiveChatBanner: React.FC<LiveChatBannerProps> = ({
  isLiveActive,
  onToggleLive,
  isBotTyping,
  onDirectLiveTurnComplete,
  onSendSpokenMessage,
}) => {
  const [livePhase, setLivePhase] = useState<LivePhase>("idle");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [lastAiSpokenText, setLastAiSpokenText] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [isFullScreenLive, setIsFullScreenLive] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        return params.get("livechat") === "1";
      }
    } catch {}
    return false;
  });
  const [quickLiveInput, setQuickLiveInput] = useState("");
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [liveTurnCount, setLiveTurnCount] = useState(0);
  const [hasHardwareMicStream, setHasHardwareMicStream] = useState(false);

  // 100% Google Gemini AI Live Options State
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const v = (params.get("voice") || "").toLowerCase();
        if (GEMINI_LIVE_VOICES.some((item) => item.id === v)) return v;
      }
    } catch {}
    return "nova";
  });
  const [selectedLiveMode, setSelectedLiveMode] = useState<string>(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const m = (params.get("mode") || "").toLowerCase();
        if (GEMINI_LIVE_MODE_OPTIONS.some((item) => item.id === m)) return m;
      }
    } catch {}
    return "fast";
  });
  const [selectedEmotionTone, setSelectedEmotionTone] = useState<string>(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const e = (params.get("emotion") || "").toLowerCase();
        if (GEMINI_LIVE_EMOTION_OPTIONS.some((item) => item.id === e)) return e;
      }
    } catch {}
    return "auto";
  });
  const [hdVocalBoost, setHdVocalBoost] = useState<boolean>(true);
  const [vadSpeed, setVadSpeed] = useState<"ultrafast" | "balanced" | "patient">("ultrafast");
  const [speechLang, setSpeechLang] = useState<"km-KH" | "en-US">("km-KH");
  const [aiSpeakingRate, setAiSpeakingRate] = useState<number>(1.18);
  const [showLiveCaptions, setShowLiveCaptions] = useState<boolean>(true);
  const [showOptionsDrawer, setShowOptionsDrawer] = useState<boolean>(false);

  // Live Camera Vision & Photo Attachment (like Google Gemini Live Camera on mobile)
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<"environment" | "user">("environment");
  const [attachedLivePhoto, setAttachedLivePhoto] = useState<{
    data: string;
    mimeType: string;
    previewUrl: string;
  } | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const [showOneTimeAllowPrompt, setShowOneTimeAllowPrompt] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined") {
        if ((window as any).__khmerAiMicDecisionMade) return false;
        const saved = window.localStorage?.getItem("khmer_ai_live_mic_decision");
        if (saved === "allow" || saved === "deny") {
          (window as any).__khmerAiMicDecisionMade = saved;
          return false;
        }
      }
    } catch {}
    return true;
  });

  const [liveTurns, setLiveTurns] = useState<LiveTurnItem[]>([
    {
      id: "welcome-live",
      role: "assistant",
      text: "សួស្តីចាស/បាទ! 🎙️✨ ប្រព័ន្ធ Google Gemini AI Live (100% Real-Time HD Voice & Camera Vision) បានភ្ជាប់រួចរាល់ហើយ! ប្រព័ន្ធមានមុខងារចាប់យកសំឡេងអ្នកសួរយ៉ាងច្បាស់លាស់ និងរហ័សទាន់ចិត្ត ព្រមទាំងអាចជ្រើសរើសសំឡេងទាំង ៨, បើកកាមេរ៉ាផ្ទាល់ (📷 Live Camera), ដាក់រូបភាពឱ្យមើល, ផ្អាក (⏸️ Hold) ឬនិយាយកាត់ (✋ Interrupt) បានដូចក្នុង Google Gemini AI ពិតៗ ១០០%!",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      voiceLabel: "✨ Nova (ស្រី)",
    },
  ]);
  const liveFeedEndRef = useRef<HTMLDivElement | null>(null);

  const isLiveRef = useRef(isLiveActive);
  const livePhaseRef = useRef<LivePhase>("idle");
  const isMicMutedRef = useRef(false);
  const isOnHoldRef = useRef(false);
  const selectedVoiceIdRef = useRef(selectedVoiceId);
  const selectedLiveModeRef = useRef(selectedLiveMode);
  const selectedEmotionToneRef = useRef(selectedEmotionTone);
  const hdVocalBoostRef = useRef(hdVocalBoost);
  const vadSpeedRef = useRef(vadSpeed);
  const speechLangRef = useRef(speechLang);
  const aiSpeakingRateRef = useRef(aiSpeakingRate);
  const attachedLivePhotoRef = useRef(attachedLivePhoto);
  const isCameraActiveRef = useRef(isCameraActive);

  const onSendSpokenMessageRef = useRef(onSendSpokenMessage);
  const onDirectLiveTurnCompleteRef = useRef(onDirectLiveTurnComplete);
  const liveTurnsRef = useRef<LiveTurnItem[]>(liveTurns);
  const recorderStartedAtRef = useRef<number>(0);
  const phaseEnteredAtRef = useRef<number>(Date.now());

  useEffect(() => {
    onSendSpokenMessageRef.current = onSendSpokenMessage;
  }, [onSendSpokenMessage]);

  useEffect(() => {
    onDirectLiveTurnCompleteRef.current = onDirectLiveTurnComplete;
  }, [onDirectLiveTurnComplete]);

  useEffect(() => {
    liveTurnsRef.current = liveTurns;
  }, [liveTurns]);

  useEffect(() => {
    selectedVoiceIdRef.current = selectedVoiceId;
  }, [selectedVoiceId]);

  useEffect(() => {
    selectedLiveModeRef.current = selectedLiveMode;
  }, [selectedLiveMode]);

  useEffect(() => {
    selectedEmotionToneRef.current = selectedEmotionTone;
  }, [selectedEmotionTone]);

  useEffect(() => {
    hdVocalBoostRef.current = hdVocalBoost;
    if (micGainNodeRef.current) {
      micGainNodeRef.current.gain.value = hdVocalBoost ? 1.85 : 1.15;
    }
    if (vocalPeakingNodeRef.current) {
      vocalPeakingNodeRef.current.gain.value = hdVocalBoost ? 6.5 : 2.5;
    }
  }, [hdVocalBoost]);

  useEffect(() => {
    vadSpeedRef.current = vadSpeed;
  }, [vadSpeed]);

  useEffect(() => {
    speechLangRef.current = speechLang;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = speechLang;
      } catch {}
    }
  }, [speechLang]);

  useEffect(() => {
    aiSpeakingRateRef.current = aiSpeakingRate;
    if (currentAiAudioRef.current) {
      try {
        currentAiAudioRef.current.playbackRate = aiSpeakingRate;
      } catch {}
    }
  }, [aiSpeakingRate]);

  useEffect(() => {
    attachedLivePhotoRef.current = attachedLivePhoto;
  }, [attachedLivePhoto]);

  useEffect(() => {
    isCameraActiveRef.current = isCameraActive;
  }, [isCameraActive]);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const processedStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micGainNodeRef = useRef<GainNode | null>(null);
  const vocalPeakingNodeRef = useRef<BiquadFilterNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const silenceTimerRef = useRef<any>(null);
  const maxTurnTimerRef = useRef<any>(null);
  const lastVoiceActivityRef = useRef<number>(0);
  const speechStartedAtRef = useRef<number>(0);
  const hasSpokenInCurrentChunkRef = useRef<boolean>(false);
  const commitOnStopRef = useRef<boolean>(false);
  const manualCommitRef = useRef<boolean>(false);

  const currentAiAudioRef = useRef<HTMLAudioElement | null>(null);
  const accumulatedTranscriptRef = useRef<string>("");
  const latestCombinedTranscriptRef = useRef<string>("");
  const isSubmittingTurnRef = useRef<boolean>(false);

  useEffect(() => {
    isLiveRef.current = isLiveActive;
    if (isLiveActive) {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get("livechat") === "1") {
          setIsFullScreenLive(true);
        }
      } catch {}
    }
  }, [isLiveActive]);

  useEffect(() => {
    livePhaseRef.current = livePhase;
    phaseEnteredAtRef.current = Date.now();
  }, [livePhase]);

  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  useEffect(() => {
    isOnHoldRef.current = isOnHold;
  }, [isOnHold]);

  const stopCameraStream = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {}
      });
      cameraStreamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  const startCameraStream = useCallback(
    async (facing: "environment" | "user" = cameraFacingMode) => {
      try {
        if (cameraStreamRef.current) {
          cameraStreamRef.current.getTracks().forEach((t) => {
            try {
              t.stop();
            } catch {}
          });
        }
        const camStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        cameraStreamRef.current = camStream;
        setIsCameraActive(true);
        setCameraFacingMode(facing);
        setTimeout(() => {
          if (cameraVideoRef.current) {
            cameraVideoRef.current.srcObject = camStream;
            cameraVideoRef.current.play().catch(() => {});
          }
        }, 60);
      } catch {
        setErrorHint("មិនអាចបើកកាមេរ៉ាផ្ទាល់បានទេ សូមពិនិត្យការអនុញ្ញាតកាមេរ៉ា ឬជ្រើសរើសរូបភាពជំនួស។");
      }
    },
    [cameraFacingMode]
  );

  const flipCameraFacingMode = useCallback(() => {
    const nextFacing = cameraFacingMode === "environment" ? "user" : "environment";
    if (isCameraActive) {
      startCameraStream(nextFacing);
    } else {
      setCameraFacingMode(nextFacing);
    }
  }, [cameraFacingMode, isCameraActive, startCameraStream]);

  // Capture current video frame from Live Camera or return attached photo
  const captureCurrentVisualFrame = useCallback((): {
    data: string;
    mimeType: string;
  } | null => {
    if (isCameraActiveRef.current && cameraVideoRef.current) {
      try {
        const videoEl = cameraVideoRef.current;
        if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
          const canvas = document.createElement("canvas");
          const scale = Math.min(1, 768 / Math.max(videoEl.videoWidth, videoEl.videoHeight));
          canvas.width = Math.round(videoEl.videoWidth * scale);
          canvas.height = Math.round(videoEl.videoHeight * scale);
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
            const b64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
            if (b64 && b64.length > 200) {
              return { data: b64, mimeType: "image/jpeg" };
            }
          }
        }
      } catch {}
    }
    if (attachedLivePhotoRef.current && attachedLivePhotoRef.current.data) {
      return {
        data: attachedLivePhotoRef.current.data,
        mimeType: attachedLivePhotoRef.current.mimeType,
      };
    }
    return null;
  }, []);

  const handlePhotoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = String(reader.result || "");
      const b64 = res.includes(",") ? res.split(",")[1] : res;
      if (b64) {
        setAttachedLivePhoto({
          data: b64,
          mimeType: file.type || "image/jpeg",
          previewUrl: res,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const stopAiVoicePlayback = useCallback(() => {
    if (currentAiAudioRef.current) {
      try {
        currentAiAudioRef.current.pause();
        currentAiAudioRef.current.currentTime = 0;
      } catch {}
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }, []);

  const stopAllLiveResources = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxTurnTimerRef.current) {
      clearTimeout(maxTurnTimerRef.current);
      maxTurnTimerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      } catch {}
    }
    mediaRecorderRef.current = null;
    processedStreamRef.current = null;
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = false;
      });
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    stopCameraStream();
    stopAiVoicePlayback();
    setAudioLevel(0);
    setInterimTranscript("");
    setLivePhase("idle");
    isSubmittingTurnRef.current = false;
    hasSpokenInCurrentChunkRef.current = false;
    commitOnStopRef.current = false;
  }, [stopAiVoicePlayback, stopCameraStream]);

  // Play base64 MP3 using persistent HTMLAudioElement or Web Audio API fallback
  const playBase64Mp3 = useCallback(async (base64Mp3: string): Promise<boolean> => {
    if (!base64Mp3) return false;
    return new Promise<boolean>((resolve) => {
      try {
        const audio = currentAiAudioRef.current || new Audio();
        currentAiAudioRef.current = audio;
        audio.src = `data:audio/mpeg;base64,${base64Mp3}`;
        audio.playbackRate = aiSpeakingRateRef.current || 1.18;
        audio.onended = () => resolve(true);
        audio.onerror = () => resolve(false);
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(async () => {
            try {
              const ctx =
                audioContextRef.current ||
                new (window.AudioContext || (window as any).webkitAudioContext)();
              audioContextRef.current = ctx;
              if (ctx.state === "suspended") await ctx.resume();
              const binaryStr = atob(base64Mp3);
              const bytes = new Uint8Array(binaryStr.length);
              for (let i = 0; i < binaryStr.length; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
              }
              const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.playbackRate.value = aiSpeakingRateRef.current || 1.18;
              source.connect(ctx.destination);
              source.onended = () => resolve(true);
              source.start(0);
            } catch {
              resolve(false);
            }
          });
        }
      } catch {
        resolve(false);
      }
    });
  }, []);

  // Ensure MediaRecorder is actively recording a fresh chunk from the Vocal-Boosted DSP stream
  const ensureChunkRecorderRunning = useCallback(() => {
    if (!isLiveRef.current || isOnHoldRef.current || !streamRef.current) return;
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      return;
    }

    try {
      // Record from the Web Audio DSP vocal-boosted stream if available so Gemini hears crystal-clear speech!
      const targetStream = processedStreamRef.current || streamRef.current;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";
      const recorder = mimeType
        ? new MediaRecorder(targetStream, {
            mimeType,
            audioBitsPerSecond: 64000,
          })
        : new MediaRecorder(targetStream);

      audioChunksRef.current = [];
      hasSpokenInCurrentChunkRef.current = false;
      commitOnStopRef.current = false;
      recorderStartedAtRef.current = Date.now();

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = async () => {
        if (!isLiveRef.current || isOnHoldRef.current) return;
        const shouldCommit = commitOnStopRef.current;
        const wasManualCommit = manualCommitRef.current;
        commitOnStopRef.current = false;
        manualCommitRef.current = false;
        hasSpokenInCurrentChunkRef.current = false;

        const chunks = [...audioChunksRef.current];
        audioChunksRef.current = [];
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });

        if (!shouldCommit || isSubmittingTurnRef.current) {
          if (
            isLiveRef.current &&
            !isOnHoldRef.current &&
            (livePhaseRef.current === "listening" || livePhaseRef.current === "user_speaking")
          ) {
            ensureChunkRecorderRunning();
          }
          return;
        }

        const browserText = (
          accumulatedTranscriptRef.current ||
          latestCombinedTranscriptRef.current ||
          ""
        ).trim();
        accumulatedTranscriptRef.current = "";
        latestCombinedTranscriptRef.current = "";

        const detectedMime = blob.type || recorder.mimeType || "audio/webm";
        const base64Audio =
          blob.size >= 320
            ? await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const res = String(reader.result || "");
                  resolve(res.includes(",") ? res.split(",")[1] : res);
                };
                reader.readAsDataURL(blob);
              })
            : "";

        const audioPayload =
          base64Audio && blob.size >= 350
            ? { data: base64Audio, mimeType: detectedMime }
            : undefined;

        if (!audioPayload && !browserText) {
          setInterimTranscript("");
          setLivePhase("listening");
          ensureChunkRecorderRunning();
          return;
        }

        await submitSpokenTurn(browserText, audioPayload, wasManualCommit);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(80);
    } catch {
      // Ignore transient MediaRecorder state errors
    }
  }, []);

  // Start Web Speech API alongside MediaRecorder for instant live captions & ultra-fast VAD
  const startSpeechRecognition = useCallback(() => {
    if (!isLiveRef.current || isOnHoldRef.current || !streamRef.current) return;
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    if (recognitionRef.current) {
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 3;
      rec.lang = speechLangRef.current || "km-KH";

      rec.onresult = (event: any) => {
        if (!isLiveRef.current || isMicMutedRef.current || isOnHoldRef.current) {
          return;
        }

        // Barge-In: If user starts speaking while AI is speaking, interrupt AI immediately
        if (livePhaseRef.current === "ai_speaking") {
          stopAiVoicePlayback();
        }

        let interim = "";
        let finalChunk = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const resItem = event.results[i];
          let transcriptPiece = resItem[0]?.transcript || "";
          if (resItem.length > 1 && transcriptPiece.trim().length < 2) {
            for (let a = 1; a < resItem.length; a++) {
              const altText = resItem[a]?.transcript || "";
              if (altText.trim().length > transcriptPiece.trim().length) {
                transcriptPiece = altText;
              }
            }
          }
          if (resItem.isFinal) {
            finalChunk += transcriptPiece + " ";
          } else {
            interim += transcriptPiece;
          }
        }

        if (finalChunk.trim()) {
          accumulatedTranscriptRef.current = (
            accumulatedTranscriptRef.current +
            " " +
            finalChunk
          ).trim();
        }

        const combinedDisplay = (
          accumulatedTranscriptRef.current +
          " " +
          interim
        ).trim();

        if (combinedDisplay) {
          latestCombinedTranscriptRef.current = combinedDisplay;
          setLivePhase("user_speaking");
          setInterimTranscript(combinedDisplay);
          hasSpokenInCurrentChunkRef.current = true;
          lastVoiceActivityRef.current = Date.now();
          if (!speechStartedAtRef.current) {
            speechStartedAtRef.current = Date.now();
          }

          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          const baseDelay =
            vadSpeedRef.current === "ultrafast"
              ? 130
              : vadSpeedRef.current === "balanced"
              ? 340
              : 650;
          const commitDelay = finalChunk.trim() ? baseDelay : baseDelay + 90;

          silenceTimerRef.current = setTimeout(() => {
            if (
              !isLiveRef.current ||
              isOnHoldRef.current ||
              isSubmittingTurnRef.current ||
              (livePhaseRef.current !== "user_speaking" &&
                livePhaseRef.current !== "listening")
            ) {
              return;
            }
            if (
              mediaRecorderRef.current &&
              mediaRecorderRef.current.state === "recording"
            ) {
              commitOnStopRef.current = true;
              try {
                mediaRecorderRef.current.stop();
              } catch {}
            } else {
              const readyText = (accumulatedTranscriptRef.current + " " + interim).trim();
              if (readyText) {
                accumulatedTranscriptRef.current = "";
                latestCombinedTranscriptRef.current = "";
                submitSpokenTurn(readyText);
              }
            }
          }, commitDelay);
        }
      };

      rec.onerror = (ev: any) => {
        if (ev?.error === "not-allowed" || ev?.error === "service-not-allowed") {
          recognitionRef.current = null;
        }
      };
      rec.onend = () => {
        recognitionRef.current = null;
        if (
          isLiveRef.current &&
          !isMicMutedRef.current &&
          !isOnHoldRef.current &&
          (livePhaseRef.current === "listening" || livePhaseRef.current === "user_speaking")
        ) {
          try {
            rec.start();
            recognitionRef.current = rec;
          } catch {}
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch {}
  }, [stopAiVoicePlayback]);

  // Speak AI reply aloud and immediately resume listening
  const speakAiReplyAndResume = useCallback(
    async (replyText: string, preSynthesizedAudioB64?: string) => {
      if (!isLiveRef.current || isOnHoldRef.current) return;
      setLivePhase("ai_speaking");

      const cleanSpeechText = replyText
        .replace(/```[\s\S]*?```/g, "")
        .replace(/<svg[\s\S]*?<\/svg>/gi, "")
        .replace(/[#*_`~>-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      setLastAiSpokenText(cleanSpeechText.slice(0, 240));

      const resumeListening = () => {
        if (!isLiveRef.current || isOnHoldRef.current) return;
        isSubmittingTurnRef.current = false;
        accumulatedTranscriptRef.current = "";
        latestCombinedTranscriptRef.current = "";
        setInterimTranscript("");
        setLivePhase("listening");
        lastVoiceActivityRef.current = Date.now();
        speechStartedAtRef.current = 0;
        hasSpokenInCurrentChunkRef.current = false;
        commitOnStopRef.current = false;
        if (streamRef.current) {
          ensureChunkRecorderRunning();
          startSpeechRecognition();
        }
      };

      // 1. Instant playback if /api/live-turn already synthesized audioBase64 in single-pass response
      if (preSynthesizedAudioB64 && preSynthesizedAudioB64.length > 100) {
        try {
          const playedDirect = await playBase64Mp3(preSynthesizedAudioB64);
          if (!isLiveRef.current || isOnHoldRef.current || livePhaseRef.current !== "ai_speaking") {
            return;
          }
          if (playedDirect) {
            resumeListening();
            return;
          }
        } catch {}
      }

      try {
        // 2. Fallback to /api/tts with selected Gemini Live voice preset
        const conciseSpeechInput = cleanSpeechText.slice(0, 240) || replyText.slice(0, 240);
        const ttsData = await Promise.race([
          universalFetchTts(conciseSpeechInput, selectedVoiceIdRef.current || "nova"),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 2200)),
        ]);
        if (!isLiveRef.current || isOnHoldRef.current) return;

        if (ttsData && !(ttsData as any).fallback && ttsData.khmerAudio) {
          const playedKm = await playBase64Mp3(ttsData.khmerAudio);
          if (!isLiveRef.current || isOnHoldRef.current || livePhaseRef.current !== "ai_speaking") {
            return;
          }
          if (playedKm) {
            resumeListening();
            return;
          }
        }
      } catch {}

      // 3. Browser SpeechSynthesis fallback with authentic native language pronunciation
      if (typeof window !== "undefined" && "speechSynthesis" in window && cleanSpeechText) {
        try {
          window.speechSynthesis.cancel();
          const detectedLang = detectSpeechLanguage(cleanSpeechText);
          const conf = SUPPORTED_NATIVE_VOICES[detectedLang] || SUPPORTED_NATIVE_VOICES.km;
          const utter = new SpeechSynthesisUtterance(cleanSpeechText.slice(0, 320));
          utter.lang = conf.bcp47;
          utter.rate = aiSpeakingRateRef.current || (detectedLang === "km" ? 1.15 : 1.02);

          const voices = window.speechSynthesis.getVoices();
          const matchedVoice =
            voices.find((v) => v.lang.toLowerCase().startsWith(conf.bcp47.toLowerCase())) ||
            voices.find((v) => v.lang.toLowerCase().startsWith(detectedLang.toLowerCase()));
          if (matchedVoice) utter.voice = matchedVoice;

          utter.onend = () => resumeListening();
          utter.onerror = () => resumeListening();
          window.speechSynthesis.speak(utter);
          return;
        } catch {}
      }

      resumeListening();
    },
    [ensureChunkRecorderRunning, playBase64Mp3, startSpeechRecognition]
  );

  // Submit spoken or typed turn via Google Gemini Live Single-Pass Multimodal endpoint (/api/live-turn)
  const submitSpokenTurn = useCallback(
    async (
      spokenText: string,
      audioAttachment?: { data: string; mimeType: string },
      wasManualCommit = false
    ) => {
      const cleanHintText = spokenText.trim();
      if ((!cleanHintText && !audioAttachment) || !isLiveRef.current || isOnHoldRef.current) return;

      if (livePhaseRef.current === "ai_speaking" || isSubmittingTurnRef.current) {
        stopAiVoicePlayback();
      }
      isSubmittingTurnRef.current = true;

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      commitOnStopRef.current = false;
      hasSpokenInCurrentChunkRef.current = false;
      speechStartedAtRef.current = 0;
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }

      setLivePhase("processing");
      setInterimTranscript(
        cleanHintText || "🎙️ កំពុងចាប់សំឡេងអ្នកសួរ និងឆ្លើយតបភ្លាមៗ (Google Gemini Live)..."
      );

      const visualFrame = captureCurrentVisualFrame();
      const activeVoiceObj =
        GEMINI_LIVE_VOICES.find((v) => v.id === selectedVoiceIdRef.current) ||
        GEMINI_LIVE_VOICES[0];

      try {
        const historyPayload = liveTurnsRef.current
          .filter((t) => t.id !== "welcome-live")
          .slice(-6)
          .map((t) => ({ role: t.role, text: t.text }));

        const liveRes = await fetch("/api/live-turn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audioBase64: audioAttachment?.data || "",
            mimeType: audioAttachment?.mimeType || "audio/webm",
            textHint: cleanHintText,
            voicePreset: selectedVoiceIdRef.current || "nova",
            liveMode: selectedLiveModeRef.current || "fast",
            emotionTone: selectedEmotionToneRef.current || "auto",
            imageData: visualFrame?.data || "",
            imageMimeType: visualFrame?.mimeType || "image/jpeg",
            history: historyPayload,
            sessionId: "web_client_session",
          }),
          signal: AbortSignal.timeout(3800),
        });

        if (!isLiveRef.current || isOnHoldRef.current) return;

        if (liveRes.ok) {
          const liveData = await liveRes.json();
          if (liveData?.isSilent && !wasManualCommit) {
            isSubmittingTurnRef.current = false;
            setInterimTranscript("");
            setLivePhase("listening");
            if (streamRef.current) {
              ensureChunkRecorderRunning();
              startSpeechRecognition();
            }
            return;
          }

          const verifiedTranscript = String(
            liveData?.transcript || cleanHintText || ""
          ).trim();
          const verifiedReply = String(liveData?.replyText || "").trim();
          const preSynthesizedAudio = String(
            liveData?.audioBase64 || liveData?.tts?.khmerAudio || ""
          );
          const shouldDeleteUserMsg =
            Boolean(liveData?.deleteUserMessage) ||
            isResponseAnAutoDeleteViolation(verifiedReply);

          if (verifiedTranscript && verifiedReply) {
            const nowStr = new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            const cleanVerifiedReply = verifiedReply
              .replace(/\[AUTO_DELETE_VIOLATION\]\s*/gi, "")
              .trim();
            const displayReply = cleanVerifiedReply
              .replace(/<svg[\s\S]*?<\/svg>/gi, "")
              .replace(/```[\s\S]*?```/g, "[កូដកម្មវិធី]")
              .replace(/#{1,6}\s*/g, "")
              .replace(/\*\*/g, "")
              .trim();

            setLiveTurns((prev) => [
              ...prev.slice(-35),
              ...(shouldDeleteUserMsg
                ? []
                : [
                    {
                      id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                      role: "user" as const,
                      text: verifiedTranscript,
                      time: nowStr,
                    },
                  ]),
              {
                id: `a-${Date.now() + 1}-${Math.random().toString(36).slice(2, 6)}`,
                role: "assistant" as const,
                text: displayReply.slice(0, 680),
                time: nowStr,
                voiceLabel: activeVoiceObj.shortName,
              },
            ]);
            setLiveTurnCount((c) => c + 1);
            setInterimTranscript(shouldDeleteUserMsg ? "" : verifiedTranscript);
            setTimeout(() => {
              liveFeedEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 40);

            if (onDirectLiveTurnCompleteRef.current) {
              onDirectLiveTurnCompleteRef.current(
                verifiedTranscript,
                shouldDeleteUserMsg
                  ? `[AUTO_DELETE_VIOLATION]\n${cleanVerifiedReply}`
                  : cleanVerifiedReply
              );
            }

            await speakAiReplyAndResume(cleanVerifiedReply, preSynthesizedAudio);
            return;
          }
        }
      } catch {
        // Fallback to standard onSendSpokenMessage if /api/live-turn is unreachable
      }

      if (!isLiveRef.current || isOnHoldRef.current) return;

      const fallbackUserText = cleanHintText;
      if (!fallbackUserText && !audioAttachment) {
        isSubmittingTurnRef.current = false;
        setInterimTranscript("");
        setLivePhase("listening");
        if (streamRef.current) {
          ensureChunkRecorderRunning();
          startSpeechRecognition();
        }
        return;
      }

      const nowStr = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const fallbackUserTurnId = `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      if (fallbackUserText) {
        setLiveTurns((prev) => [
          ...prev.slice(-35),
          {
            id: fallbackUserTurnId,
            role: "user",
            text: fallbackUserText,
            time: nowStr,
          },
        ]);
      }
      setLiveTurnCount((c) => c + 1);

      try {
        const botReply = await Promise.race([
          onSendSpokenMessageRef.current(fallbackUserText, audioAttachment),
          new Promise<string>((resolve) =>
            setTimeout(
              () =>
                resolve(
                  solveKhmerPromptBuiltIn(fallbackUserText || "សួស្តី", "web_client_session")
                ),
              2800
            )
          ),
        ]);
        if (!isLiveRef.current || isOnHoldRef.current) return;
        const rawBotReply = (botReply || "").trim();
        const shouldAutoDeleteFallback = isResponseAnAutoDeleteViolation(rawBotReply);
        const cleanBotReply = rawBotReply.replace(/\[AUTO_DELETE_VIOLATION\]\s*/gi, "").trim();
        if (cleanBotReply) {
          const displayReply = cleanBotReply
            .replace(/<svg[\s\S]*?<\/svg>/gi, "")
            .replace(/```[\s\S]*?```/g, "[កូដកម្មវិធី]")
            .replace(/#{1,6}\s*/g, "")
            .replace(/\*\*/g, "")
            .trim();
          setLiveTurns((prev) => [
            ...prev
              .filter((t) => !(shouldAutoDeleteFallback && t.id === fallbackUserTurnId))
              .slice(-35),
            {
              id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              role: "assistant",
              text: displayReply.slice(0, 680),
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              voiceLabel: activeVoiceObj.shortName,
            },
          ]);
          setTimeout(() => {
            liveFeedEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 50);
          await speakAiReplyAndResume(cleanBotReply);
        } else {
          isSubmittingTurnRef.current = false;
          setInterimTranscript("");
          setLivePhase("listening");
          if (streamRef.current) {
            ensureChunkRecorderRunning();
            startSpeechRecognition();
          }
        }
      } catch {
        isSubmittingTurnRef.current = false;
        if (isLiveRef.current && !isOnHoldRef.current) {
          setInterimTranscript("");
          setLivePhase("listening");
          if (streamRef.current) {
            ensureChunkRecorderRunning();
            startSpeechRecognition();
          }
        }
      }
    },
    [
      captureCurrentVisualFrame,
      ensureChunkRecorderRunning,
      speakAiReplyAndResume,
      startSpeechRecognition,
      stopAiVoicePlayback,
    ]
  );

  // Force commit whatever the user has spoken right now
  const handleManualCommitTurn = useCallback(() => {
    if (!isLiveRef.current) return;
    if (isOnHoldRef.current) {
      setIsOnHold(false);
      isOnHoldRef.current = false;
      setLivePhase("listening");
      if (streamRef.current) {
        ensureChunkRecorderRunning();
        startSpeechRecognition();
      }
      return;
    }

    if (livePhaseRef.current === "ai_speaking") {
      stopAiVoicePlayback();
      isSubmittingTurnRef.current = false;
      setInterimTranscript("");
      setLivePhase("listening");
      if (streamRef.current) {
        ensureChunkRecorderRunning();
        startSpeechRecognition();
      }
      return;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      commitOnStopRef.current = true;
      manualCommitRef.current = true;
      try {
        mediaRecorderRef.current.stop();
      } catch {}
      return;
    }

    const browserText = (
      accumulatedTranscriptRef.current ||
      interimTranscript ||
      ""
    ).trim();
    if (
      browserText &&
      !browserText.startsWith("🎙️ កំពុងចាប់សំឡេង")
    ) {
      accumulatedTranscriptRef.current = "";
      submitSpokenTurn(browserText, undefined, true);
    }
  }, [
    ensureChunkRecorderRunning,
    interimTranscript,
    startSpeechRecognition,
    stopAiVoicePlayback,
    submitSpokenTurn,
  ]);

  // Toggle Hold / Resume (Google Gemini Live Hold Button)
  const toggleLiveHold = useCallback(() => {
    const nextHold = !isOnHold;
    setIsOnHold(nextHold);
    isOnHoldRef.current = nextHold;
    if (nextHold) {
      stopAiVoicePlayback();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        commitOnStopRef.current = false;
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
      setLivePhase("on_hold");
      setAudioLevel(0);
    } else {
      setLivePhase("listening");
      if (streamRef.current) {
        ensureChunkRecorderRunning();
        startSpeechRecognition();
      }
    }
  }, [ensureChunkRecorderRunning, isOnHold, startSpeechRecognition, stopAiVoicePlayback]);

  // Connect hardware microphone stream ONLY ONCE with Studio Vocal Clarity DSP Chain
  const connectHardwareMicrophone = useCallback(async () => {
    try {
      let stream: MediaStream | null =
        typeof window !== "undefined" && (window as any).__khmerAiPersistentMicStream
          ? (window as any).__khmerAiPersistentMicStream
          : null;

      if (
        !stream ||
        !stream.getAudioTracks().some((t: MediaStreamTrack) => t.readyState === "live")
      ) {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
            sampleRate: 48000,
          },
        });
        if (typeof window !== "undefined") {
          (window as any).__khmerAiPersistentMicStream = stream;
        }
      } else {
        stream.getAudioTracks().forEach((t: MediaStreamTrack) => {
          t.enabled = !isMicMutedRef.current;
        });
      }

      if (typeof window !== "undefined") {
        (window as any).__khmerAiMicDecisionMade = "allow";
        try {
          window.localStorage?.setItem("khmer_ai_live_mic_decision", "allow");
        } catch {}
      }
      setShowOneTimeAllowPrompt(false);

      if (!isLiveRef.current) {
        stream.getAudioTracks().forEach((t) => {
          t.enabled = false;
        });
        return false;
      }

      streamRef.current = stream;
      setHasHardwareMicStream(true);
      setErrorHint(null);

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") {
        await ctx.resume().catch(() => {});
      }
      const source = ctx.createMediaStreamSource(stream);

      // Studio-Grade Vocal Clarity DSP Chain:
      // 1. Highpass 80Hz (removes low rumble/fan noise)
      // 2. Lowpass 7900Hz (removes high hiss)
      // 3. Peaking 2100Hz +6.5dB (boosts Khmer & English consonant/vowel clarity)
      // 4. DynamicsCompressor (levels quiet whispers & loud speech)
      // 5. GainNode 1.85x (200% HD Vocal Boost)
      // 6. MediaStreamAudioDestinationNode -> MediaRecorder records this crystal-clear boosted stream!
      const highpass = ctx.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.value = 80;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 7900;

      const vocalBoost = ctx.createBiquadFilter();
      vocalBoost.type = "peaking";
      vocalBoost.frequency.value = 2100;
      vocalBoost.Q.value = 1.15;
      vocalBoost.gain.value = hdVocalBoostRef.current ? 6.5 : 2.5;
      vocalPeakingNodeRef.current = vocalBoost;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -40;
      compressor.knee.value = 20;
      compressor.ratio.value = 5.0;
      compressor.attack.value = 0.001;
      compressor.release.value = 0.1;

      const gainNode = ctx.createGain();
      gainNode.gain.value = hdVocalBoostRef.current ? 1.85 : 1.15;
      micGainNodeRef.current = gainNode;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.24;

      source.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(vocalBoost);
      vocalBoost.connect(compressor);
      compressor.connect(gainNode);
      gainNode.connect(analyser);

      try {
        if (typeof ctx.createMediaStreamDestination === "function") {
          const dest = ctx.createMediaStreamDestination();
          gainNode.connect(dest);
          processedStreamRef.current = dest.stream;
        }
      } catch {
        processedStreamRef.current = stream;
      }

      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const timeData = new Uint8Array(analyser.fftSize);
      let consecutiveVoiceFrames = 0;
      let adaptiveNoiseFloor = 3.0;

      const updateAudioMeter = () => {
        if (!isLiveRef.current || !analyserRef.current) return;

        if (isMicMutedRef.current || isOnHoldRef.current) {
          setAudioLevel(0);
          consecutiveVoiceFrames = 0;
          animFrameRef.current = requestAnimationFrame(updateAudioMeter);
          return;
        }

        analyserRef.current.getByteFrequencyData(freqData);
        analyserRef.current.getByteTimeDomainData(timeData);

        let vocalSum = 0;
        const vocalBins = Math.min(26, freqData.length);
        for (let i = 1; i < vocalBins; i++) {
          vocalSum += freqData[i];
        }
        const vocalAvg = vocalSum / Math.max(1, vocalBins - 1);

        let sumSq = 0;
        let maxPeak = 0;
        for (let i = 0; i < timeData.length; i++) {
          const dev = Math.abs(timeData[i] - 128);
          sumSq += dev * dev;
          if (dev > maxPeak) maxPeak = dev;
        }
        const rms = Math.sqrt(sumSq / timeData.length);

        const norm = Math.min(
          100,
          Math.round(
            Math.max(
              (vocalAvg / 30) * 100,
              (rms / 12) * 100,
              (maxPeak / 26) * 100
            )
          )
        );
        setAudioLevel(norm);

        if (!hasSpokenInCurrentChunkRef.current && norm < 14) {
          adaptiveNoiseFloor = adaptiveNoiseFloor * 0.96 + norm * 0.04;
        }
        const speechThreshold = Math.max(5, Math.min(14, Math.round(adaptiveNoiseFloor + 3.8)));

        const now = Date.now();

        if (norm >= speechThreshold) {
          consecutiveVoiceFrames += 1;
          if (livePhaseRef.current === "ai_speaking" && norm >= 28 && consecutiveVoiceFrames >= 3) {
            stopAiVoicePlayback();
            isSubmittingTurnRef.current = false;
            setLivePhase("user_speaking");
            ensureChunkRecorderRunning();
          }

          if (
            (livePhaseRef.current === "listening" ||
              livePhaseRef.current === "user_speaking") &&
            consecutiveVoiceFrames >= 1
          ) {
            if (!hasSpokenInCurrentChunkRef.current) {
              hasSpokenInCurrentChunkRef.current = true;
              speechStartedAtRef.current = now;
            }
            lastVoiceActivityRef.current = now;
            if (livePhaseRef.current === "listening") {
              setLivePhase("user_speaking");
            }
          }
        } else {
          consecutiveVoiceFrames = Math.max(0, consecutiveVoiceFrames - 1);

          // Rotate silent recording buffer every 5.0s when user hasn't spoken yet
          if (
            !hasSpokenInCurrentChunkRef.current &&
            livePhaseRef.current === "listening" &&
            !isSubmittingTurnRef.current &&
            recorderStartedAtRef.current > 0 &&
            now - recorderStartedAtRef.current >= 5000
          ) {
            recorderStartedAtRef.current = now;
            if (
              mediaRecorderRef.current &&
              mediaRecorderRef.current.state === "recording"
            ) {
              commitOnStopRef.current = false;
              try {
                mediaRecorderRef.current.stop();
              } catch {}
            }
          }

          if (
            hasSpokenInCurrentChunkRef.current &&
            (livePhaseRef.current === "user_speaking" ||
              livePhaseRef.current === "listening") &&
            !isSubmittingTurnRef.current
          ) {
            const silenceDuration = now - lastVoiceActivityRef.current;
            const totalSpeechWindow = speechStartedAtRef.current
              ? now - speechStartedAtRef.current
              : 0;
            const targetSilenceMs =
              vadSpeedRef.current === "ultrafast"
                ? 220
                : vadSpeedRef.current === "balanced"
                ? 480
                : 880;

            if (
              (silenceDuration >= targetSilenceMs && totalSpeechWindow >= 85) ||
              totalSpeechWindow >= 7500
            ) {
              hasSpokenInCurrentChunkRef.current = false;
              speechStartedAtRef.current = 0;

              if (
                mediaRecorderRef.current &&
                mediaRecorderRef.current.state === "recording"
              ) {
                commitOnStopRef.current = true;
                try {
                  mediaRecorderRef.current.stop();
                } catch {}
              } else {
                const browserText = (
                  accumulatedTranscriptRef.current ||
                  latestCombinedTranscriptRef.current ||
                  ""
                ).trim();
                if (browserText) {
                  accumulatedTranscriptRef.current = "";
                  latestCombinedTranscriptRef.current = "";
                  submitSpokenTurn(browserText);
                }
              }
            }
          }
        }

        animFrameRef.current = requestAnimationFrame(updateAudioMeter);
      };

      animFrameRef.current = requestAnimationFrame(updateAudioMeter);
      ensureChunkRecorderRunning();
      startSpeechRecognition();
      return true;
    } catch {
      if (typeof window !== "undefined") {
        (window as any).__khmerAiMicDecisionMade = "deny";
        try {
          window.localStorage?.setItem("khmer_ai_live_mic_decision", "deny");
        } catch {}
      }
      setShowOneTimeAllowPrompt(false);
      setHasHardwareMicStream(false);
      return false;
    }
  }, [
    ensureChunkRecorderRunning,
    startSpeechRecognition,
    stopAiVoicePlayback,
    submitSpokenTurn,
  ]);

  const handleAllowMicOnce = useCallback(async () => {
    if (typeof window !== "undefined") {
      (window as any).__khmerAiMicDecisionMade = "allow";
      try {
        window.localStorage?.setItem("khmer_ai_live_mic_decision", "allow");
      } catch {}
    }
    setShowOneTimeAllowPrompt(false);
    await connectHardwareMicrophone();
  }, [connectHardwareMicrophone]);

  const handleDontAllowMicOnce = useCallback(() => {
    if (typeof window !== "undefined") {
      (window as any).__khmerAiMicDecisionMade = "deny";
      try {
        window.localStorage?.setItem("khmer_ai_live_mic_decision", "deny");
      } catch {}
    }
    setShowOneTimeAllowPrompt(false);
    setHasHardwareMicStream(false);
  }, []);

  const initLiveSession = useCallback(async () => {
    setErrorHint(null);
    setIsOnHold(false);
    isOnHoldRef.current = false;
    setLivePhase("listening");
    lastVoiceActivityRef.current = Date.now();
    speechStartedAtRef.current = 0;
    hasSpokenInCurrentChunkRef.current = false;
    commitOnStopRef.current = false;
    isSubmittingTurnRef.current = false;

    try {
      if (!currentAiAudioRef.current) {
        currentAiAudioRef.current = new Audio();
      }
    } catch {}

    let savedDecision = "";
    try {
      if (typeof window !== "undefined") {
        savedDecision =
          (window as any).__khmerAiMicDecisionMade ||
          window.localStorage?.getItem("khmer_ai_live_mic_decision") ||
          "";
      }
    } catch {}

    if (
      typeof window !== "undefined" &&
      (window as any).__khmerAiPersistentMicStream &&
      (window as any).__khmerAiPersistentMicStream
        .getAudioTracks()
        .some((t: MediaStreamTrack) => t.readyState === "live")
    ) {
      setShowOneTimeAllowPrompt(false);
      await connectHardwareMicrophone();
      return;
    }

    let alreadyGranted = false;
    let alreadyDenied = false;
    try {
      if (navigator.permissions && typeof navigator.permissions.query === "function") {
        const perm = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        if (perm && perm.state === "granted") {
          alreadyGranted = true;
        } else if (perm && perm.state === "denied") {
          alreadyDenied = true;
        }
      }
    } catch {}

    if (alreadyDenied || savedDecision === "deny") {
      setShowOneTimeAllowPrompt(false);
      setHasHardwareMicStream(false);
      return;
    }

    if (alreadyGranted || savedDecision === "allow") {
      setShowOneTimeAllowPrompt(false);
      await connectHardwareMicrophone();
      return;
    }

    setShowOneTimeAllowPrompt(true);
    setHasHardwareMicStream(false);
  }, [connectHardwareMicrophone]);

  useEffect(() => {
    if (isLiveActive) {
      initLiveSession();
    } else {
      stopAllLiveResources();
      setIsFullScreenLive(false);
    }
    return () => {
      stopAllLiveResources();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLiveActive]);

  // Continuous Watchdog to guarantee Live Chat NEVER gets stuck
  useEffect(() => {
    if (!isLiveActive) return;
    const watchdog = setInterval(() => {
      if (!isLiveRef.current || isOnHoldRef.current) return;
      const now = Date.now();
      const phaseAge = now - phaseEnteredAtRef.current;

      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume().catch(() => {});
      }

      if (
        streamRef.current &&
        (livePhaseRef.current === "listening" || livePhaseRef.current === "user_speaking") &&
        !isSubmittingTurnRef.current &&
        !isMicMutedRef.current
      ) {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
          ensureChunkRecorderRunning();
        }
      }

      if (livePhaseRef.current === "processing" && phaseAge > 7200) {
        isSubmittingTurnRef.current = false;
        setInterimTranscript("");
        setLivePhase("listening");
        if (streamRef.current) {
          ensureChunkRecorderRunning();
          startSpeechRecognition();
        }
      } else if (livePhaseRef.current === "ai_speaking" && phaseAge > 14000) {
        stopAiVoicePlayback();
        isSubmittingTurnRef.current = false;
        setInterimTranscript("");
        setLivePhase("listening");
        if (streamRef.current) {
          ensureChunkRecorderRunning();
          startSpeechRecognition();
        }
      }
    }, 850);

    return () => clearInterval(watchdog);
  }, [isLiveActive, ensureChunkRecorderRunning, startSpeechRecognition, stopAiVoicePlayback]);

  const toggleMicMute = () => {
    const nextMute = !isMicMuted;
    setIsMicMuted(nextMute);
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMute;
      });
    }
  };

  const handleQuickPromptSubmit = (e?: React.FormEvent, presetText?: string) => {
    if (e) e.preventDefault();
    const target = (presetText ?? quickLiveInput).trim();
    if (!target) return;
    setQuickLiveInput("");
    if (livePhase === "ai_speaking") {
      stopAiVoicePlayback();
    }
    if (isOnHold) {
      setIsOnHold(false);
      isOnHoldRef.current = false;
    }
    submitSpokenTurn(target, undefined, true);
  };

  const activeVoice =
    GEMINI_LIVE_VOICES.find((v) => v.id === selectedVoiceId) || GEMINI_LIVE_VOICES[0];
  const activeMode =
    GEMINI_LIVE_MODE_OPTIONS.find((m) => m.id === selectedLiveMode) ||
    GEMINI_LIVE_MODE_OPTIONS[0];
  const activeEmotion =
    GEMINI_LIVE_EMOTION_OPTIONS.find((e) => e.id === selectedEmotionTone) ||
    GEMINI_LIVE_EMOTION_OPTIONS[0];

  // Inactive Banner: Sleek Google Gemini Live Invitation Bar
  if (!isLiveActive) {
    return (
      <div className="bg-gradient-to-r from-[#070f20] via-[#101c38] to-[#160f30] border-b border-indigo-500/35 px-3 sm:px-5 py-2 flex items-center justify-between gap-2 shadow-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 p-[1.5px] shrink-0 shadow-md shadow-purple-500/25">
            <div className="w-full h-full bg-[#0a1324] rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-300" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-300 via-purple-200 to-pink-300 bg-clip-text text-transparent truncate">
                🎙️✨ Google Gemini AI Live 100% (ចាប់សំឡេងអ្នកសួរច្បាស់ ១០០% + កាមេរ៉ាផ្ទាល់ + 8 Voices)
              </span>
            </div>
            <p className="text-[11px] text-indigo-200/75 truncate hidden sm:block">
              ចុចប៊ូតុង «បើក Gemini Live» ដើម្បីនិយាយឆ្លើយឆ្លងផ្ទាល់ បើកកាមេរ៉ាបង្ហាញលំហាត់ ជ្រើសរើសសំឡេងទាំង ៨ និង Options ដូច Google Gemini AI ពិតៗ!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              onToggleLive(true);
              setIsFullScreenLive(true);
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 transition-all active:scale-95 cursor-pointer border border-white/15"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>🎙️ ចុចនិយាយ Gemini Live</span>
          </button>
        </div>
      </div>
    );
  }

  const orbScale =
    livePhase === "user_speaking"
      ? 1 + Math.min(0.42, audioLevel / 165)
      : livePhase === "ai_speaking"
      ? 1.15
      : livePhase === "on_hold"
      ? 0.94
      : 1.02;

  return (
    <>
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoFileSelect}
        className="hidden"
      />

      {/* Compact Active Top Bar */}
      <div className="bg-gradient-to-r from-[#070f20] via-[#121b38] to-[#1a1033] border-b border-purple-500/40 px-3 sm:px-5 py-2.5 shadow-xl">
        <div className="max-w-5xl mx-auto flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Left: Animated Google Gemini Live Orb + Real-Time Voice Capture Status */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                type="button"
                onClick={handleManualCommitTurn}
                title={
                  livePhase === "user_speaking"
                    ? "ចុចដើម្បីឱ្យ AI ឆ្លើយតបភ្លាមៗ"
                    : livePhase === "ai_speaking"
                    ? "ចុចដើម្បីកាត់សម្ដី ហើយនិយាយបន្ត"
                    : "Gemini Live Orb"
                }
                className="relative flex items-center justify-center w-11 h-11 shrink-0 cursor-pointer group"
              >
                <span
                  style={{ transform: `scale(${orbScale})` }}
                  className={`absolute inset-0 rounded-full transition-transform duration-100 blur-[3px] ${
                    livePhase === "user_speaking"
                      ? "bg-gradient-to-tr from-emerald-400 via-cyan-400 to-blue-500 opacity-85"
                      : livePhase === "ai_speaking"
                      ? "bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 opacity-90 animate-pulse"
                      : livePhase === "processing"
                      ? "bg-gradient-to-tr from-amber-400 via-purple-500 to-indigo-500 opacity-80 animate-spin"
                      : livePhase === "on_hold"
                      ? "bg-amber-500/40"
                      : "bg-gradient-to-tr from-blue-500/50 via-indigo-500/50 to-purple-500/50 opacity-55"
                  }`}
                />
                <div
                  className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-inner border border-white/25 ${
                    livePhase === "user_speaking"
                      ? "bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white"
                      : livePhase === "ai_speaking"
                      ? "bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white"
                      : livePhase === "processing"
                      ? "bg-gradient-to-tr from-indigo-600 to-purple-700 text-white"
                      : livePhase === "on_hold"
                      ? "bg-amber-900/80 text-amber-300"
                      : "bg-[#111a2e] text-blue-300"
                  }`}
                >
                  {livePhase === "ai_speaking" ? (
                    <Volume2 className="w-4 h-4 animate-bounce" />
                  ) : livePhase === "processing" || isBotTyping ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : livePhase === "on_hold" ? (
                    <Pause className="w-4 h-4" />
                  ) : isMicMuted ? (
                    <MicOff className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </div>
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-blue-500/25 via-purple-500/25 to-pink-500/25 text-purple-200 border border-purple-400/40">
                    <Sparkles className="w-3 h-3 text-purple-300" />
                    Gemini Live 100%
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-cyan-200 border border-white/15">
                    {activeVoice.shortName}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 hidden sm:inline-flex">
                    {activeMode.shortName}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-200 border border-pink-400/30">
                    {activeEmotion.shortName}
                  </span>
                  {hdVocalBoost && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      🔥 HD Boost 200%
                    </span>
                  )}
                </div>

                {/* Live Voice Waveform Bars + Real-Time Captured Transcript */}
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-end gap-0.5 h-3.5 shrink-0">
                    {[0.45, 0.85, 1, 0.7, 0.95, 0.6, 0.8, 0.5].map((mult, idx) => {
                      const barHeight =
                        livePhase === "ai_speaking"
                          ? Math.max(25, ((Date.now() / 85 + idx * 22) % 75) + 25)
                          : Math.max(18, Math.min(100, audioLevel * mult * 1.45));
                      return (
                        <span
                          key={idx}
                          style={{ height: `${barHeight}%` }}
                          className={`w-1 rounded-full transition-all duration-75 ${
                            livePhase === "ai_speaking"
                              ? "bg-purple-400"
                              : livePhase === "user_speaking"
                              ? "bg-emerald-400"
                              : "bg-blue-400/50"
                          }`}
                        />
                      );
                    })}
                  </div>
                  <p className="text-xs text-sky-200/95 truncate font-medium">
                    {interimTranscript
                      ? `🎙️ ចាប់សម្ដីបាន៖ «${interimTranscript}»`
                      : lastAiSpokenText && livePhase === "ai_speaking"
                      ? `🔊 Gemini៖ «${lastAiSpokenText}»`
                      : isOnHold
                      ? "⏸️ បានផ្អាកបណ្ដោះអាសន្ន (On Hold) — ចុចបន្តដើម្បីនិយាយ"
                      : "និយាយមកកាន់ខ្ញុំដោយសេរី — ចាប់សំឡេងអ្នកសួរច្បាស់ ១០០% និងឆ្លើយតបភ្លាមៗ"}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              {(livePhase === "user_speaking" || interimTranscript) &&
                livePhase !== "processing" && (
                  <button
                    type="button"
                    onClick={handleManualCommitTurn}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>ឆ្លើយតបភ្លាម</span>
                  </button>
                )}

              {livePhase === "ai_speaking" && (
                <button
                  type="button"
                  onClick={handleManualCommitTurn}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-500/25 hover:bg-amber-500/35 text-amber-200 border border-amber-400/40 font-bold text-xs transition-all cursor-pointer"
                >
                  <Hand className="w-3.5 h-3.5" />
                  <span>និយាយកាត់</span>
                </button>
              )}

              <button
                type="button"
                onClick={toggleLiveHold}
                className={`p-1.5 rounded-full border text-xs transition-all cursor-pointer ${
                  isOnHold
                    ? "bg-amber-500/30 border-amber-400 text-amber-200"
                    : "bg-white/10 hover:bg-white/15 border-white/15 text-white"
                }`}
                title={isOnHold ? "បន្តការសន្ទនា (Resume Live)" : "ផ្អាកបណ្ដោះអាសន្ន (Hold Live)"}
              >
                {isOnHold ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>

              {!hasHardwareMicStream ? (
                <button
                  type="button"
                  onClick={() => connectHardwareMicrophone()}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ម៉ៃក្រូ</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={toggleMicMute}
                  className={`p-1.5 rounded-full border text-xs transition-all cursor-pointer ${
                    isMicMuted
                      ? "bg-rose-500/25 border-rose-400/40 text-rose-300"
                      : "bg-white/10 hover:bg-white/15 border-white/15 text-white"
                  }`}
                  title={isMicMuted ? "បើកម៉ៃក្រូហ្វូនវិញ" : "បិទសំឡេងម៉ៃក្រូហ្វូន"}
                >
                  {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsFullScreenLive((prev) => !prev)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-indigo-500/25 hover:bg-indigo-500/35 text-indigo-200 border border-indigo-400/40 text-xs font-bold transition-all cursor-pointer"
                title="បើកផ្ទាំង Google Gemini Live ពេញអេក្រង់ និង Options ទាំងអស់"
              >
                {isFullScreenLive ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">
                  {isFullScreenLive ? "បង្រួម" : "ផ្ទាំង Gemini Live 100%"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onToggleLive(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all active:scale-95 cursor-pointer"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>🔴 បិទ Live</span>
              </button>
            </div>
          </div>

          {/* Instant Live Conversation Input Bar */}
          <form
            onSubmit={handleQuickPromptSubmit}
            className="flex items-center gap-2 pt-1 border-t border-white/10"
          >
            <input
              type="text"
              value={quickLiveInput}
              onChange={(e) => setQuickLiveInput(e.target.value)}
              placeholder="⚡ និយាយតាមម៉ៃក្រូហ្វូន ឬវាយសារសួរ Gemini Live ទីនេះ (ឆ្លើយតបសំឡេង+អត្ថបទភ្លាមៗ)..."
              className="flex-1 rounded-full bg-white/10 border border-white/20 focus:border-purple-400 focus:outline-none px-3.5 py-1.5 text-xs text-white placeholder-white/50"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs flex items-center gap-1 shadow-md cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>ផ្ញើភ្លាម</span>
            </button>
          </form>

          {errorHint && (
            <div className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-500/30 rounded-lg px-2.5 py-1">
              💡 {errorHint}
            </div>
          )}
        </div>
      </div>

      {/* Full-Screen 100% Google Gemini AI Live Studio Experience */}
      {isFullScreenLive && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#050914] via-[#0b1326] to-[#120b28] flex flex-col justify-between p-3 sm:p-5 overflow-y-auto">
          {/* Top Bar: Title + Quick Toggles (Captions CC, Options Studio, Minimize) */}
          <div className="flex items-center justify-between max-w-4xl w-full mx-auto gap-2 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                    Google Gemini AI Live • 100% Studio
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    HD Voice Capture {audioLevel > 0 ? `${audioLevel}%` : "Ready"}
                  </span>
                </div>
                <p className="text-[11px] text-white/65">
                  ចាប់សំឡេងអ្នកសួរច្បាស់ ១០០% • សំឡេង៖ {activeVoice.shortName} • របៀប៖ {activeMode.shortName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setShowLiveCaptions((v) => !v)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                  showLiveCaptions
                    ? "bg-purple-500/25 border-purple-400/50 text-purple-200"
                    : "bg-white/8 border-white/15 text-white/60"
                }`}
                title="បិទ/បើកអក្សររត់ផ្ទាល់ (Live Captions CC)"
              >
                <Subtitles className="w-3.5 h-3.5" />
                <span>CC {showLiveCaptions ? "ON" : "OFF"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowOptionsDrawer((v) => !v)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                  showOptionsDrawer
                    ? "bg-cyan-500 text-slate-950 border-cyan-300 shadow-lg"
                    : "bg-white/10 hover:bg-white/15 border-white/20 text-cyan-200"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>🎛️ Options ទាំងអស់ ({GEMINI_LIVE_VOICES.length} Voices)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFullScreenLive(false)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white/85 text-xs font-semibold border border-white/15 cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">មើលឆាត</span>
              </button>
            </div>
          </div>

          {/* One-Time Allow / Don't Allow Microphone Connection Prompt */}
          {showOneTimeAllowPrompt && !hasHardwareMicStream && (
            <div className="max-w-md w-full mx-auto mt-2 rounded-2xl bg-slate-900/95 border border-cyan-400/40 p-4 shadow-2xl text-center space-y-2.5">
              <div className="text-xs sm:text-sm font-bold text-white">
                🎙️ ភ្ជាប់ម៉ៃក្រូហ្វូនសម្រាប់ Google Gemini Live (បង្ហាញតែម្ដងគត់)
              </div>
              <p className="text-[11px] text-slate-300">
                អនុញ្ញាតម៉ៃក្រូហ្វូនដើម្បីឱ្យប្រព័ន្ធចាប់យកសំឡេងនិយាយរបស់អ្នកដោយស្វ័យប្រវត្តិ និងឆ្លើយតបភ្លាមៗដូច Google Gemini AI ពិតៗ!
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleAllowMicOnce}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition cursor-pointer shadow-md"
                >
                  ✅ Allow (អនុញ្ញាតតែម្ដង)
                </button>
                <button
                  type="button"
                  onClick={handleDontAllowMicOnce}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold text-xs transition cursor-pointer"
                >
                  ✖️ Don&apos;t Allow
                </button>
              </div>
            </div>
          )}

          {/* Expandable 100% Google Gemini AI Live Options Studio Drawer */}
          {showOptionsDrawer && (
            <div className="max-w-4xl w-full mx-auto mt-2 rounded-2xl bg-slate-900/95 border border-purple-400/40 p-3.5 sm:p-4 shadow-2xl space-y-3 text-left max-h-[52vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs sm:text-sm font-extrabold text-cyan-300 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4" />
                  ការកំណត់ Google Gemini AI Live 100% (Voices, Brain Modes &amp; HD Audio Studio)
                </span>
                <button
                  type="button"
                  onClick={() => setShowOptionsDrawer(false)}
                  className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 1. 8 Official Google Gemini Live Voices */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-purple-200">
                  🎭 ១. ជ្រើសរើសសំឡេង Google Gemini Live ទាំង ៨ (8 Official Gemini Voices)៖
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {GEMINI_LIVE_VOICES.map((v) => {
                    const isSelected = v.id === selectedVoiceId;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVoiceId(v.id)}
                        className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "bg-gradient-to-r from-indigo-600/50 to-purple-600/50 border-cyan-400 text-white shadow-md"
                            : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-extrabold truncate">{v.shortName}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-cyan-300 shrink-0" />}
                        </div>
                        <span className="text-[10px] text-white/65 line-clamp-1 mt-0.5">
                          {v.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. 5 Google Gemini Live Brain Modes */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-purple-200">
                  🧠 ២. ជ្រើសរើសរបៀបឆ្លើយតប (Google Gemini Live Brain Modes)៖
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  {GEMINI_LIVE_MODE_OPTIONS.map((m) => {
                    const isSelected = m.id === selectedLiveMode;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedLiveMode(m.id)}
                        className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? "bg-gradient-to-r from-emerald-600/40 to-teal-600/40 border-emerald-400 text-white shadow-md"
                            : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-extrabold">{m.shortName}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-white/65 mt-0.5 line-clamp-1">{m.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2b. 20 Emotional Response Tones (ចាស់ ១០ + ថ្មីបន្ថែម ១០) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-pink-200">
                  💖 ២ក. ជ្រើសរើសអារម្មណ៍ពេលឆ្លើយសំណួរ និងដោះស្រាយបញ្ហាទាំង ២០ ទម្រង់ (ចាស់ ១០ + ថ្មីបន្ថែម ១០)៖
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {GEMINI_LIVE_EMOTION_OPTIONS.map((emo) => {
                    const isSelected = emo.id === selectedEmotionTone;
                    return (
                      <button
                        key={emo.id}
                        type="button"
                        onClick={() => setSelectedEmotionTone(emo.id)}
                        className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? "bg-gradient-to-r from-pink-600/50 to-rose-600/50 border-pink-400 text-white shadow-md"
                            : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-extrabold">{emo.shortName}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-pink-300 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-white/65 mt-0.5 line-clamp-1">{emo.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Voice Capture Sensitivity, VAD Speed, Language & Speaking Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <div className="text-[11px] font-bold text-emerald-300">
                    🎚️ កម្លាំងចាប់សំឡេងអ្នកសួរ
                  </div>
                  <button
                    type="button"
                    onClick={() => setHdVocalBoost((b) => !b)}
                    className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                      hdVocalBoost
                        ? "bg-emerald-500 text-slate-950"
                        : "bg-slate-800 text-slate-300 border border-slate-600"
                    }`}
                  >
                    {hdVocalBoost ? "🔥 HD Vocal Boost 200% (ON)" : "🎙️ Standard Mic (OFF)"}
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <div className="text-[11px] font-bold text-cyan-300">
                    ⚡ ល្បឿនចាប់សំឡេង (VAD Speed)
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(
                      [
                        { id: "ultrafast", label: "0.25s លឿន" },
                        { id: "balanced", label: "0.5s ស្តង់ដា" },
                        { id: "patient", label: "0.9s ចាំស្ដាប់" },
                      ] as const
                    ).map((spd) => (
                      <button
                        key={spd.id}
                        type="button"
                        onClick={() => setVadSpeed(spd.id)}
                        className={`py-1 px-1.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                          vadSpeed === spd.id
                            ? "bg-cyan-400 text-slate-950"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {spd.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <div className="text-[11px] font-bold text-amber-300">
                    🗣️ ភាសាចាប់សំឡេងនិយាយ
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setSpeechLang("km-KH")}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold cursor-pointer ${
                        speechLang === "km-KH"
                          ? "bg-amber-400 text-slate-950"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      🇰🇭🇬🇧 ខ្មែរ + Eng
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpeechLang("en-US")}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold cursor-pointer ${
                        speechLang === "en-US"
                          ? "bg-amber-400 text-slate-950"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      🇬🇧 English Only
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <div className="text-[11px] font-bold text-pink-300">
                    🔊 ល្បឿនសំឡេង AI និយាយ
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { rate: 1.0, label: "1.0x ធម្មតា" },
                      { rate: 1.18, label: "1.2x រហ័ស" },
                      { rate: 1.35, label: "1.35x លឿន" },
                    ].map((r) => (
                      <button
                        key={r.rate}
                        type="button"
                        onClick={() => setAiSpeakingRate(r.rate)}
                        className={`py-1 px-1.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                          Math.abs(aiSpeakingRate - r.rate) < 0.05
                            ? "bg-pink-400 text-slate-950"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Horizontal Voice & Mode Selector Pills (Always accessible like Gemini Live) */}
          <div className="max-w-4xl w-full mx-auto flex flex-col gap-1.5 mt-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-[10px] font-bold text-white/60 shrink-0">🎭 សំឡេង៖</span>
              {GEMINI_LIVE_VOICES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVoiceId(v.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 border transition cursor-pointer ${
                    selectedVoiceId === v.id
                      ? `bg-gradient-to-r ${v.badgeColor} text-white border-white/40 shadow-md`
                      : "bg-white/8 hover:bg-white/15 text-slate-300 border-white/10"
                  }`}
                >
                  {v.shortName}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-[10px] font-bold text-white/60 shrink-0">🧠 របៀប៖</span>
              {GEMINI_LIVE_MODE_OPTIONS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedLiveMode(m.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 border transition cursor-pointer ${
                    selectedLiveMode === m.id
                      ? "bg-emerald-500 text-slate-950 border-emerald-300 shadow-md"
                      : "bg-white/8 hover:bg-white/15 text-slate-300 border-white/10"
                  }`}
                >
                  {m.shortName}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-[10px] font-bold text-white/60 shrink-0">💖 អារម្មណ៍ (២០)៖</span>
              {GEMINI_LIVE_EMOTION_OPTIONS.map((emo) => (
                <button
                  key={emo.id}
                  type="button"
                  onClick={() => setSelectedEmotionTone(emo.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 border transition cursor-pointer ${
                    selectedEmotionTone === emo.id
                      ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-300 shadow-md"
                      : "bg-white/8 hover:bg-white/15 text-slate-300 border-white/10"
                  }`}
                >
                  {emo.shortName}
                </button>
              ))}
            </div>
          </div>

          {/* Center Glowing Google Gemini Live Orb, Camera Viewfinder & Real-Time Voice Capture Box */}
          <div className="my-auto flex flex-col items-center justify-center text-center max-w-3xl w-full mx-auto py-3 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full">
              {/* Glowing Gemini Live Orb */}
              <div
                onClick={handleManualCommitTurn}
                className="relative flex items-center justify-center w-40 h-40 sm:w-48 sm:h-48 cursor-pointer select-none shrink-0"
              >
                <div
                  style={{ transform: `scale(${orbScale * 1.18})` }}
                  className={`absolute inset-0 rounded-full blur-2xl transition-transform duration-100 ${
                    livePhase === "user_speaking"
                      ? "bg-gradient-to-tr from-emerald-500/60 via-cyan-400/60 to-blue-500/60"
                      : livePhase === "ai_speaking"
                      ? "bg-gradient-to-tr from-blue-500/65 via-purple-500/65 to-pink-500/65 animate-pulse"
                      : livePhase === "on_hold"
                      ? "bg-amber-500/30"
                      : "bg-gradient-to-tr from-blue-600/35 via-indigo-500/35 to-purple-600/35"
                  }`}
                />
                <div
                  style={{ transform: `scale(${orbScale})` }}
                  className={`absolute inset-4 rounded-full transition-transform duration-100 shadow-2xl ${
                    livePhase === "user_speaking"
                      ? "bg-gradient-to-tr from-emerald-400 via-teal-400 to-sky-500"
                      : livePhase === "ai_speaking"
                      ? "bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500"
                      : livePhase === "processing"
                      ? "bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-400 animate-spin"
                      : livePhase === "on_hold"
                      ? "bg-gradient-to-tr from-amber-600 to-orange-700"
                      : "bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600"
                  }`}
                />
                <div className="relative z-10 w-26 h-26 sm:w-30 sm:h-30 rounded-full bg-[#091022]/90 backdrop-blur-md border border-white/25 flex flex-col items-center justify-center gap-1 shadow-inner px-2">
                  {livePhase === "ai_speaking" ? (
                    <>
                      <Volume2 className="w-7 h-7 text-purple-300 animate-bounce" />
                      <span className="text-[10px] font-bold text-purple-200">
                        ចុចដើម្បីនិយាយកាត់
                      </span>
                    </>
                  ) : livePhase === "processing" || isBotTyping ? (
                    <>
                      <Loader2 className="w-7 h-7 text-sky-300 animate-spin" />
                      <span className="text-[10px] font-bold text-sky-200">
                        កំពុងឆ្លើយតប...
                      </span>
                    </>
                  ) : livePhase === "on_hold" ? (
                    <>
                      <Pause className="w-7 h-7 text-amber-300" />
                      <span className="text-[10px] font-bold text-amber-200">
                        ផ្អាក (ចុចបន្ត)
                      </span>
                    </>
                  ) : livePhase === "user_speaking" ? (
                    <>
                      <Zap className="w-7 h-7 text-emerald-300 animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-200">
                        ចុចឱ្យឆ្លើយភ្លាម
                      </span>
                    </>
                  ) : isMicMuted ? (
                    <>
                      <MicOff className="w-7 h-7 text-rose-400" />
                      <span className="text-[10px] font-bold text-rose-200">បានបិទម៉ៃក្រូ</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-7 h-7 text-blue-300" />
                      <span className="text-[10px] font-bold text-blue-200">កំពុងស្ដាប់អ្នក...</span>
                    </>
                  )}
                </div>
              </div>

              {/* Google Gemini Live Camera Viewfinder or Attached Photo Preview */}
              {(isCameraActive || attachedLivePhoto) && (
                <div className="relative w-56 h-40 sm:w-64 sm:h-44 rounded-2xl overflow-hidden border-2 border-cyan-400/60 shadow-2xl bg-black shrink-0">
                  {isCameraActive ? (
                    <video
                      ref={cameraVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : attachedLivePhoto ? (
                    <img
                      src={attachedLivePhoto.previewUrl}
                      alt="Gemini Live Vision"
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-cyan-300 text-[10px] font-bold flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    <span>{isCameraActive ? "Gemini Live Camera" : "រូបភាពកំពុងបង្ហាញ"}</span>
                  </div>
                  <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                    {isCameraActive && (
                      <button
                        type="button"
                        onClick={flipCameraFacingMode}
                        className="p-1.5 rounded-full bg-black/75 hover:bg-black text-white border border-white/25 cursor-pointer"
                        title="ប្ដូរកាមេរ៉ា មុខ/ក្រោយ"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (isCameraActive) stopCameraStream();
                        setAttachedLivePhoto(null);
                      }}
                      className="p-1.5 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white cursor-pointer"
                      title="បិទកាមេរ៉ា/រូបភាព"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Real-Time Spoken Word Capture Box (បង្ហាញសម្ដីអ្នកសួរដែលចាប់បានច្បាស់ៗភ្លាមៗ) */}
            <div className="w-full max-w-2xl mx-auto rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-indigo-950/60 border border-emerald-400/35 px-4 py-2.5 shadow-lg">
              <div className="flex items-center justify-between gap-2 text-[11px] text-emerald-300 font-bold mb-1">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                  សម្ដីអ្នកសួរដែលចាប់បានផ្ទាល់ (Real-Time HD Voice Capture)៖
                </span>
                <span className="text-[10px] text-cyan-300">
                  កម្រិតសំឡេង៖ {audioLevel}% • VAD: {vadSpeed === "ultrafast" ? "0.25s" : vadSpeed === "balanced" ? "0.5s" : "0.9s"}
                </span>
              </div>
              <div className="text-xs sm:text-sm font-bold text-white min-h-[22px]">
                {interimTranscript
                  ? `«${interimTranscript}»`
                  : livePhase === "user_speaking"
                  ? "🗣️ កំពុងចាប់យកសំឡេងអ្នកនិយាយយ៉ាងច្បាស់..."
                  : "🎙️ សូមនិយាយសំណួររបស់អ្នកជាភាសាខ្មែរ ឬ អង់គ្លេស (ប្រព័ន្ធចាប់សំឡេងនិងឆ្លើយតបស្វ័យប្រវត្តិ)"}
              </div>
            </div>

            {/* Live Back-and-Forth Conversation Transcript Stream */}
            {showLiveCaptions && (
              <div className="w-full max-w-2xl mx-auto rounded-2xl bg-slate-950/80 border border-white/15 p-3 text-left space-y-2.5 max-h-[200px] overflow-y-auto shadow-inner">
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                  <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                    📝 ប្រវត្តិសន្ទនាផ្ទាល់ (Gemini Live Transcript • {liveTurnCount} turns)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setLiveTurns([
                        {
                          id: "welcome-live",
                          role: "assistant",
                          text: "បានសម្អាតប្រវត្តិសន្ទនាផ្ទាល់រួចរាល់! សូមនិយាយសំណួរថ្មីមកកាន់ខ្ញុំឥឡូវនេះ។",
                          time: new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          }),
                          voiceLabel: activeVoice.shortName,
                        },
                      ])
                    }
                    className="inline-flex items-center gap-1 text-[10px] text-rose-300 hover:text-rose-200 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>សម្អាត</span>
                  </button>
                </div>

                {liveTurns.map((turn) => (
                  <div
                    key={turn.id}
                    className={`flex flex-col ${
                      turn.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2 text-xs sm:text-sm leading-relaxed ${
                        turn.role === "user"
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                          : "bg-white/10 border border-purple-400/30 text-sky-100"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[10px] opacity-80 mb-0.5">
                        <span className="font-bold">
                          {turn.role === "user"
                            ? "🗣️ សម្ដីអ្នកសួរ"
                            : `🤖 Gemini Live (${turn.voiceLabel || activeVoice.shortName})`}
                        </span>
                        <span>{turn.time}</span>
                      </div>
                      <div className="whitespace-pre-wrap">{turn.text}</div>
                      {turn.role === "assistant" && (
                        <button
                          type="button"
                          onClick={() => speakAiReplyAndResume(turn.text)}
                          className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/25 hover:bg-purple-500/40 text-purple-200 text-[10px] font-semibold cursor-pointer"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>ស្ដាប់សំឡេងម្ដងទៀត</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {(livePhase === "processing" || isBotTyping) && (
                  <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold px-2 py-1 animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>⚡ Gemini Live កំពុងគិត និងរៀបចំសំឡេងឆ្លើយតបភ្លាមៗ...</span>
                  </div>
                )}
                <div ref={liveFeedEndRef} />
              </div>
            )}

            {/* Quick Voice Starters + Instant Input */}
            <div className="w-full max-w-2xl space-y-2">
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {QUICK_LIVE_PROMPTS.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickPromptSubmit(undefined, q)}
                    className="px-2.5 py-1 rounded-full bg-white/8 hover:bg-white/15 border border-white/15 text-[11px] text-sky-200 transition-all cursor-pointer"
                  >
                    💬 {q}
                  </button>
                ))}
              </div>

              <form onSubmit={handleQuickPromptSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={quickLiveInput}
                  onChange={(e) => setQuickLiveInput(e.target.value)}
                  placeholder="វាយសារ ឬនិយាយផ្ទាល់ទីនេះ (Gemini Live ចាប់សំឡេងច្បាស់ ១០០% និងឆ្លើយតបភ្លាមៗ)..."
                  className="flex-1 rounded-full bg-white/10 border border-white/25 focus:border-purple-400 focus:outline-none px-4 py-2 text-xs sm:text-sm text-white placeholder-white/50"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>ផ្ញើឆ្លើយឆ្លង</span>
                </button>
              </form>
            </div>
          </div>

          {/* Bottom Dock Controls (100% Google Gemini AI Live Control Bar: Camera, Photo, Hold, Mic, Interrupt/Send, End) */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap pb-1">
            {/* Live Camera Toggle */}
            <button
              type="button"
              onClick={() => (isCameraActive ? stopCameraStream() : startCameraStream())}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-full font-bold text-xs border transition-all cursor-pointer ${
                isCameraActive
                  ? "bg-cyan-500 text-slate-950 border-cyan-300 shadow-lg"
                  : "bg-white/10 hover:bg-white/15 border-white/20 text-white"
              }`}
              title="បើកកាមេរ៉ាផ្ទាល់ឱ្យ Gemini Live មើលលំហាត់ ឬវត្ថុ (Google Gemini Live Camera)"
            >
              {isCameraActive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
              <span>{isCameraActive ? "បិទកាមេរ៉ា" : "📷 កាមេរ៉ាផ្ទាល់"}</span>
            </button>

            {/* Upload Photo to Gemini Live */}
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-full font-bold text-xs border transition-all cursor-pointer ${
                attachedLivePhoto
                  ? "bg-indigo-500 text-white border-indigo-300"
                  : "bg-white/10 hover:bg-white/15 border-white/20 text-white"
              }`}
              title="ដាក់រូបភាពឱ្យ Gemini Live មើល និងពន្យល់"
            >
              <ImageIcon className="w-4 h-4" />
              <span>🖼️ រូបភាព</span>
            </button>

            {/* Hold / Resume Button */}
            <button
              type="button"
              onClick={toggleLiveHold}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full font-bold text-xs border transition-all cursor-pointer ${
                isOnHold
                  ? "bg-amber-500 text-slate-950 border-amber-300 shadow-lg"
                  : "bg-white/10 hover:bg-white/15 border-white/20 text-white"
              }`}
            >
              {isOnHold ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span>{isOnHold ? "▶️ បន្ត (Resume)" : "⏸️ ផ្អាក (Hold)"}</span>
            </button>

            {/* Microphone Mute / Connect */}
            {!hasHardwareMicStream ? (
              <button
                type="button"
                onClick={() => connectHardwareMicrophone()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-cyan-500/25 hover:bg-cyan-500/35 border border-cyan-400/50 text-cyan-200 font-bold text-xs transition-all cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>🎤 ភ្ជាប់ម៉ៃក្រូហ្វូន</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={toggleMicMute}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full font-bold text-xs border transition-all cursor-pointer ${
                  isMicMuted
                    ? "bg-rose-500/30 border-rose-400 text-rose-200"
                    : "bg-white/10 hover:bg-white/15 border-white/20 text-white"
                }`}
              >
                {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isMicMuted ? "បើកម៉ៃក្រូ" : "បិទម៉ៃក្រូ"}</span>
              </button>
            )}

            {/* Instant Commit / Barge-In Interrupt */}
            {(livePhase === "user_speaking" || livePhase === "ai_speaking" || interimTranscript) && (
              <button
                type="button"
                onClick={handleManualCommitTurn}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg cursor-pointer"
              >
                {livePhase === "ai_speaking" ? (
                  <>
                    <Hand className="w-4 h-4" />
                    <span>✋ និយាយកាត់</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>⚡ ឆ្លើយតបភ្លាម</span>
                  </>
                )}
              </button>
            )}

            {/* End Live Session */}
            <button
              type="button"
              onClick={() => onToggleLive(false)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-xl shadow-rose-600/35 transition-all active:scale-95 cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span>🔴 បិទ Live Chat</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
