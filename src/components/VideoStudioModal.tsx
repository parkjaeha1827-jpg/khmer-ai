import React, { useState, useRef } from "react";
import {
  X,
  Video,
  Upload,
  Play,
  Download,
  Volume2,
  Send,
  RefreshCw,
  Check,
  Loader2,
  Sparkles,
  Camera,
} from "lucide-react";
import { universalFetchTts } from "../services/universalClient";

export interface VideoStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendResultToChat?: (userPrompt: string, aiResponse: string) => void;
  initialImage?: string | null;
}

export interface CharacterPreset {
  id: string;
  nameKhmer: string;
  nameEn: string;
  role: string;
  gender: "female" | "male";
  avatarSvgBg: string;
  defaultGesture: string;
  tag: string;
}

export const CHARACTER_PRESETS: CharacterPreset[] = [
  {
    id: "khmer_girl",
    nameKhmer: "កញ្ញា ខ្មែរ",
    nameEn: "Miss Khmer",
    role: "នារីខ្មែរទន់ភ្លន់ សុភាពរាបសារ",
    gender: "female",
    avatarSvgBg: "from-pink-500 to-rose-600",
    defaultGesture: "sampeah",
    tag: "ពេញនិយមបំផុត",
  },
  {
    id: "khmer_boy",
    nameKhmer: "លោក ខ្មែរ",
    nameEn: "Mr. Khmer",
    role: "កម្លោះខ្មែរ រួសរាយរាក់ទាក់",
    gender: "male",
    avatarSvgBg: "from-sky-500 to-indigo-600",
    defaultGesture: "wave",
    tag: "សំឡេងប្រុស",
  },
  {
    id: "presenter",
    nameKhmer: "ពិធីករ វណ្ណៈ",
    nameEn: "Presenter Vannak",
    role: "ពិធីករជំនាញ ព័ត៌មាន & បទបង្ហាញ",
    gender: "male",
    avatarSvgBg: "from-amber-500 to-orange-600",
    defaultGesture: "presenter",
    tag: "ផ្លូវការ",
  },
  {
    id: "anime_hero",
    nameKhmer: "តួអង្គ តារា",
    nameEn: "Dara Anime Hero",
    role: "តួអង្គជីវចល សម្ដែងរស់រវើក",
    gender: "female",
    avatarSvgBg: "from-purple-500 to-fuchsia-600",
    defaultGesture: "expressive",
    tag: "សម្ដែង",
  },
];

export interface GestureStyle {
  id: string;
  nameKhmer: string;
  nameEn: string;
  description: string;
  icon: string;
  accentColor: string;
}

export const GESTURE_STYLES: GestureStyle[] = [
  {
    id: "sampeah",
    nameKhmer: "សំពះ & គំនាប់គោរព",
    nameEn: "Khmer Sampeah Bow",
    description: "លើកដៃសំពះគំនាប់យ៉ាងទន់ភ្លន់ ងក់ក្បាលគោរព និងញញឹមរាក់ទាក់",
    icon: "🙏",
    accentColor: "border-amber-400 text-amber-300",
  },
  {
    id: "wave",
    nameKhmer: "គ្រវីដៃស្វាគមន៍",
    nameEn: "Hand Wave Greeting",
    description: "គ្រវីដៃស្វាគមន៍យ៉ាងរស់រវើក ផ្អៀងក្បាលញញឹម និងស្និទ្ធស្នាល",
    icon: "👋",
    accentColor: "border-sky-400 text-sky-300",
  },
  {
    id: "smile_nod",
    nameKhmer: "ញញឹម & ងក់ក្បាល",
    nameEn: "Warm Smile & Nod",
    description: "ញញឹមពព្រាយ ងក់ក្បាលយល់ស្រប ព្រិចភ្នែក និងដកដង្ហើមធម្មជាតិ",
    icon: "😊",
    accentColor: "border-emerald-400 text-emerald-300",
  },
  {
    id: "expressive",
    nameKhmer: "សម្ដែងរស់រវើក",
    nameEn: "Expressive Drama",
    description: "ធ្វើកាយវិការដៃប្រកបដោយមនោសញ្ចេតនា ទឹកមុខប្រែប្រួលតាមចង្វាក់",
    icon: "🎭",
    accentColor: "border-purple-400 text-purple-300",
  },
  {
    id: "presenter",
    nameKhmer: "ធ្វើបទបង្ហាញ",
    nameEn: "Professional Presenter",
    description: "ឥរិយាបថម៉ឺងម៉ាត់ ដៃធ្វើកាយវិការពន្យល់ និងទំនុកចិត្តខ្ពស់",
    icon: "👔",
    accentColor: "border-cyan-400 text-cyan-300",
  },
  {
    id: "cheerful",
    nameKhmer: "សប្បាយរីករាយ",
    nameEn: "Joyful & Energetic",
    description: "ចង្វាក់រស់រវើក ផ្អៀងចុះឡើង ញញឹមសើច និងថាមពលវិជ្ជមាន",
    icon: "🎉",
    accentColor: "border-rose-400 text-rose-300",
  },
];

const SAMPLE_SCRIPTS = [
  {
    label: "🙏 សំពះជំរាបសួរ & ជូនពរ",
    text: "សូមគោរពជំរាបសួរពុកម៉ែបងប្អូនទាំងអស់គ្នា! ខ្ញុំបាទ/នាងខ្ញុំសូមជូនពរឱ្យមានសុខភាពល្អ សំណាងល្អ និងជោគជ័យគ្រប់ភារកិច្ច!",
  },
  {
    label: "👋 ស្វាគមន៍ & ណែនាំខ្លួន",
    text: "សួស្តីអ្នកទាំងអស់គ្នា! រីករាយណាស់ដែលបានជួបគ្នាថ្ងៃនេះ! ខ្ញុំជាតួអង្គ AI និយាយភាសាខ្មែរដំបូងគេបង្អស់!",
  },
  {
    label: "👔 បទបង្ហាញព័ត៌មាន AI",
    text: "សូមស្វាគមន៍មកកាន់របាយការណ៍បច្ចេកវិទ្យា AI ទំនើបចុងក្រោយបង្អស់! ថ្ងៃនេះយើងមានព័ត៌មានពិសេសៗចែករំលែកជូន!",
  },
  {
    label: "🎭 សម្ដែងមនោសញ្ចេតនា",
    text: "តើអ្នកដឹងទេថា ការជួបអ្នកនៅថ្ងៃនេះគឺជាពេលវេលាដ៏មានអត្ថន័យបំផុតសម្រាប់ខ្ញុំ? សូមកុំភ្លេចថែរក្សាសុខភាពណា៎!",
  },
];

export const VideoStudioModal: React.FC<VideoStudioModalProps> = ({
  isOpen,
  onClose,
  onSendResultToChat,
  initialImage = null,
}) => {
  // State management
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("khmer_girl");
  const [customImageBase64, setCustomImageBase64] = useState<string | null>(initialImage);
  const [selectedGestureId, setSelectedGestureId] = useState<string>("sampeah");
  const [voiceGender, setVoiceGender] = useState<"female" | "male">("female");
  const [subtitlePreset, setSubtitlePreset] = useState<string>("tiktok_gold");
  const [scriptText, setScriptText] = useState<string>(SAMPLE_SCRIPTS[0].text);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [videoResult, setVideoResult] = useState<{
    videoBase64: string;
    duration: number;
    gesture: any;
    voiceName: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlayingAudioPreview, setIsPlayingAudioPreview] = useState<boolean>(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  if (!isOpen) return null;

  // Handle Character Selection
  const handleSelectCharacter = (char: CharacterPreset) => {
    setSelectedCharacterId(char.id);
    setVoiceGender(char.gender);
    setSelectedGestureId(char.defaultGesture);
  };

  // Preview Voice Audio
  const handlePreviewVoice = async () => {
    if (!scriptText.trim() || isPlayingAudioPreview) return;
    setIsPlayingAudioPreview(true);
    try {
      const voiceSample = scriptText.slice(0, 80);
      const tts = await universalFetchTts(
        voiceSample,
        voiceGender === "female" ? "female_sreymom" : "male_piseth"
      );
      if (tts && tts.khmerAudio) {
        if (audioPreviewRef.current) {
          audioPreviewRef.current.pause();
        }
        const audio = new Audio(`data:audio/mpeg;base64,${tts.khmerAudio}`);
        audioPreviewRef.current = audio;
        audio.onended = () => setIsPlayingAudioPreview(false);
        audio.onerror = () => setIsPlayingAudioPreview(false);
        await audio.play();
      } else {
        setIsPlayingAudioPreview(false);
      }
    } catch {
      setIsPlayingAudioPreview(false);
    }
  };

  // Generate Video
  const handleGenerateVideo = async () => {
    if (!scriptText.trim() || isGenerating) return;
    setIsGenerating(true);
    setErrorMessage(null);
    setGenerationStep("កំពុងសំយោគសំឡេងនិយាយខ្មែរច្បាស់លាស់...");

    try {
      setTimeout(() => {
        setGenerationStep("កំពុងវិភាគផ្ទៃមុខ & រៀបចំកាយវិការរស់រវើក...");
      }, 1200);

      setTimeout(() => {
        setGenerationStep("កំពុងផ្គុំ និងបង្កើតវីដេអូ HD 720p ជាមួយ FFmpeg...");
      }, 2600);

      const response = await fetch("/api/talking-photo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: customImageBase64,
          text: scriptText,
          gesture: selectedGestureId,
          voiceGender: voiceGender,
          subtitlePreset: subtitlePreset,
        }),
      });

      const data = await response.json();
      if (data && data.ok && data.videoBase64) {
        setVideoResult(data);
        setGenerationStep("");
      } else {
        setErrorMessage(data?.error || "មិនអាចបង្កើតវីដេអូបានទេ សូមសាកល្បងម្ដងទៀត!");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "មានបញ្ហាបច្ចេកទេសក្នុងការតភ្ជាប់!");
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  // Send result to active chat
  const handleSendToChat = () => {
    if (!videoResult || !onSendResultToChat) return;
    const gObj = GESTURE_STYLES.find((g) => g.id === selectedGestureId);
    const userPrompt = `🎬 បង្កើតវីដេអូនិយាយខ្មែរ [កាយវិការ៖ ${gObj?.nameKhmer || "សំពះ"}]៖ "${scriptText}"`;
    const aiResponse = `🎬✨ **វីដេអូរូបភាពនិយាយខ្មែររស់រវើក (Talking Head AI Video)**\n\n• **កាយវិការ៖** ${gObj?.icon || "🙏"} ${gObj?.nameKhmer || "សំពះ"}\n• **សំឡេង៖** ${videoResult.voiceName}\n• **រយៈពេល៖** ${videoResult.duration} វិនាទី\n• **អត្ថបទនិយាយ៖** "${scriptText}"\n\n*(វីដេអូ MP4 ត្រូវបានបង្កើតរួចរាល់ដោយឥតគិតថ្លៃ ១០០%)*`;
    onSendResultToChat(userPrompt, aiResponse);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#0b1322] border border-white/15 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-pink-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-rose-500/30">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Video Studio AI (ស្ទូឌីយោវីដេអូរូបភាពនិយាយខ្មែរ)
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  100% Free
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ជ្រើសរើសតួអង្គ និងស្ទីលកាយវិការ រួចបញ្ចូលរូបភាពដើម្បីបង្កើតជាវីដេអូនិយាយ (Talking Head) រស់រវើក
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Dual-Pane Studio Layout */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Character Selection, Gesture Style & Image Input (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Character Avatar Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>១. ជ្រើសរើសតួអង្គគំរូ ឬរូបភាពផ្ទាល់ខ្លួន</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {CHARACTER_PRESETS.map((char) => {
                  const isSelected = selectedCharacterId === char.id && !customImageBase64;
                  return (
                    <button
                      key={char.id}
                      type="button"
                      onClick={() => {
                        handleSelectCharacter(char);
                        setCustomImageBase64(null);
                      }}
                      className={`relative p-2.5 rounded-2xl text-left transition-all border flex flex-col justify-between ${
                        isSelected
                          ? "bg-slate-800/90 border-rose-500 ring-2 ring-rose-500/40 shadow-lg shadow-rose-500/20"
                          : "bg-slate-900/60 border-white/10 hover:border-white/20 hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${char.avatarSvgBg} flex items-center justify-center text-white text-base font-bold shadow-md`}
                        >
                          {char.nameKhmer.slice(0, 1)}
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-white">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white truncate">{char.nameKhmer}</div>
                        <div className="text-[10px] text-slate-400 truncate">{char.role}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Image Upload Option */}
              <div className="pt-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/15 text-xs text-slate-200 cursor-pointer transition-all">
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span>{customImageBase64 ? "ប្ដូររូបថតផ្ទាល់ខ្លួនថ្មី" : "បញ្ចូលរូបថតផ្ទាល់ខ្លួន (Selfie / Portrait)"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setCustomImageBase64(ev.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  {customImageBase64 && (
                    <button
                      type="button"
                      onClick={() => setCustomImageBase64(null)}
                      className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs transition-colors"
                    >
                      ប្រើតួអង្គគំរូវិញ
                    </button>
                  )}
                </div>
                {customImageBase64 && (
                  <div className="mt-2.5 flex items-center gap-3 p-2 rounded-xl bg-slate-900/80 border border-rose-500/40">
                    <img
                      src={customImageBase64}
                      alt="Custom portrait"
                      className="w-12 h-12 rounded-lg object-cover border border-white/20"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-rose-300">✓ កំពុងប្រើប្រាស់រូបថតផ្ទាល់ខ្លួន</div>
                      <div className="text-[11px] text-slate-400">ប្រព័ន្ធនឹងធ្វើចលនាបបូរមាត់ និងកាយវិការលើរូបនេះ</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Gesture Style Picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>២. ស្ទីលកាយវិការ (Gesture Styles)</span>
                <span className="text-[11px] text-rose-400 font-normal">ជ្រើសរើសចលនាដែលចង់បាន</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {GESTURE_STYLES.map((gesture) => {
                  const isSelected = selectedGestureId === gesture.id;
                  return (
                    <button
                      key={gesture.id}
                      type="button"
                      onClick={() => setSelectedGestureId(gesture.id)}
                      className={`p-3 rounded-2xl text-left transition-all border flex flex-col justify-between ${
                        isSelected
                          ? `bg-slate-800/95 ${gesture.accentColor} ring-2 ring-rose-500/40 shadow-lg`
                          : "bg-slate-900/60 border-white/10 hover:border-white/20 text-slate-300 hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xl">{gesture.icon}</span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center text-white text-[10px]">
                            ✓
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white truncate">{gesture.nameKhmer}</div>
                        <div className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-2">
                          {gesture.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Voice Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                ៣. សំឡេងអ្នកនិយាយ (Khmer Voice)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVoiceGender("female")}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    voiceGender === "female"
                      ? "bg-pink-950/40 border-pink-400 text-pink-200 ring-2 ring-pink-500/30"
                      : "bg-slate-900/50 border-white/10 text-slate-400 hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👩</span>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">សំឡេងស្រី (Google / Custom)</div>
                      <div className="text-[10px] text-slate-400">ផ្អែមល្ហែម ទន់ភ្លន់ ច្បាស់លាស់</div>
                    </div>
                  </div>
                  {voiceGender === "female" && <Check className="w-4 h-4 text-pink-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => setVoiceGender("male")}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    voiceGender === "male"
                      ? "bg-sky-950/40 border-sky-400 text-sky-200 ring-2 ring-sky-500/30"
                      : "bg-slate-900/50 border-white/10 text-slate-400 hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👨</span>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">សំឡេងប្រុស (Google / Custom)</div>
                      <div className="text-[10px] text-slate-400">រឹងមាំ សង្ហា ច្បាស់លាស់</div>
                    </div>
                  </div>
                  {voiceGender === "male" && <Check className="w-4 h-4 text-sky-400" />}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Speech Script Input, Action Button & Video Output Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              {/* 4. Speech Script Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    ៤. អត្ថបទដែលត្រូវនិយាយជាភាសាខ្មែរ
                  </label>
                  <button
                    type="button"
                    onClick={handlePreviewVoice}
                    disabled={isPlayingAudioPreview || !scriptText.trim()}
                    className="flex items-center gap-1 text-[11px] text-cyan-300 hover:text-cyan-200 disabled:opacity-40 transition-colors"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudioPreview ? "animate-pulse text-cyan-400" : ""}`} />
                    <span>{isPlayingAudioPreview ? "កំពុងចាក់ស្ដាប់..." : "ស្ដាប់សាកល្បង"}</span>
                  </button>
                </div>
                <textarea
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-900/90 border border-white/15 rounded-2xl p-3.5 text-xs text-white focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 resize-none transition-all"
                  placeholder="វាយអត្ថបទដែលអ្នកចង់ឱ្យតួអង្គនិយាយនៅទីនេះ (ជាភាសាខ្មែរ)..."
                />
                <div className="flex justify-between items-center text-[10px] text-slate-400 px-1">
                  <span>គន្លឹះ៖ សរសេរជាភាសាខ្មែរត្រឹមត្រូវដើម្បីទទួលបានសំឡេងច្បាស់បំផុត</span>
                  <span>{scriptText.length} តួអក្សរ</span>
                </div>
              </div>

              {/* Inspiration Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400">គំរូអត្ថបទពេញនិយម៖</span>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_SCRIPTS.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setScriptText(s.text)}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-white/5 transition-colors"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Subtitle Style Preset (Kinetic Running Subtitles) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>៥. ម៉ូដអក្សររត់នៅខាងក្រោមវីដេអូ</span>
                  <span className="text-[10px] text-amber-300 font-normal">✨ រត់តាមពាក្យនិយាយ</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { id: "tiktok_gold", label: "✨ TikTok Gold", desc: "មាសរលោង", border: "border-amber-400 text-amber-200" },
                    { id: "neon_cyan", label: "💎 Neon Cyan", desc: "ខៀវពន្លឺ", border: "border-cyan-400 text-cyan-200" },
                    { id: "flame_orange", label: "🔥 Flame Orange", desc: "ទឹកក្រូច", border: "border-orange-400 text-orange-200" },
                    { id: "emerald_green", label: "🍀 Emerald Green", desc: "បៃតង", border: "border-emerald-400 text-emerald-200" },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSubtitlePreset(sub.id)}
                      className={`p-2 rounded-xl text-left border transition-all ${
                        subtitlePreset === sub.id
                          ? `bg-slate-800 ${sub.border} ring-2 ring-white/20 font-bold`
                          : "bg-slate-900/50 border-white/10 text-slate-400 hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="text-xs">{sub.label}</div>
                      <div className="text-[10px] text-slate-400">{sub.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Action Button */}
              <button
                type="button"
                onClick={handleGenerateVideo}
                disabled={isGenerating || !scriptText.trim()}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-rose-600/30 transition-all cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{generationStep || "កំពុងបង្កើតវីដេអូរូបភាពនិយាយ (៤-៥ វិនាទី)..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>🎬 បង្កើតវីដេអូរូបភាពនិយាយ (ឥតគិតថ្លៃ ១០០%)</span>
                  </>
                )}
              </button>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300">
                  ⚠️ {errorMessage}
                </div>
              )}
            </div>

            {/* Video Player Output Preview */}
            {videoResult ? (
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-rose-500/40 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                    <Video className="w-4 h-4" />
                    <span>វីដេអូបានបង្កើតរួចរាល់ ({videoResult.duration}s)</span>
                  </div>
                  <a
                    href={videoResult.videoBase64}
                    download="talking-head-khmer.mp4"
                    className="flex items-center gap-1 text-xs text-emerald-300 hover:text-emerald-200 bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ទាញយក MP4</span>
                  </a>
                </div>

                <div className="rounded-xl overflow-hidden bg-black max-h-60 flex justify-center border border-white/10 shadow-inner">
                  <video
                    src={videoResult.videoBase64}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="max-h-60 rounded-xl object-contain w-full"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {onSendResultToChat && (
                    <button
                      type="button"
                      onClick={handleSendToChat}
                      className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>ផ្ញើចូលការសន្ទនាឆាត</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleGenerateVideo}
                    disabled={isGenerating}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1 border border-white/10 transition-colors"
                    title="បង្កើតឡើងវិញ"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>បង្កើតឡើងវិញ</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-dashed border-white/10 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-300">ផ្ទាំងមើលវីដេអូ (Video Player Preview)</div>
                <p className="text-[11px] max-w-xs leading-relaxed text-slate-500">
                  បន្ទាប់ពីចុច «បង្កើតវីដេអូ» វីដេអូ MP4 និយាយភាសាខ្មែរដែលមានកាយវិការរស់រវើក នឹងបង្ហាញនៅទីនេះភ្លាមៗ!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
