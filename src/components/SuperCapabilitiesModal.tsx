import React, { useState, useEffect } from "react";
import {
  X,
  Globe,
  BookOpen,
  Sparkles,
  Calendar,
  Languages,
  Copy,
  Check,
  Volume2,
  Loader2,
  Search,
  Send,
  Bell,
  Users,
  Film,
  ArrowRightLeft,
  Video,
  Play,
  Download,
  Upload,
  Binary,
  Hash,
  Calculator,
} from "lucide-react";
import { universalFetchTts } from "../services/universalClient";
import {
  comprehensiveDecimalConversion,
  DecimalConversionResult,
  toKhmerDigits,
  toArabicDigits,
} from "../utils/decimalWordConverter";

export type SuperCapabilityTab =
  | "translator"
  | "story"
  | "dictionary"
  | "calendar"
  | "talking_photo"
  | "decimal";

interface SuperCapabilitiesModalProps {
  isOpen: boolean;
  initialTab?: SuperCapabilityTab;
  onClose: () => void;
  onSendResultToChat?: (userPrompt: string, botMarkdown: string) => void;
}

const WORLD_LANGUAGES = [
  { code: "auto", label: "🌐 ស្វែងរកភាសាស្វ័យប្រវត្តិ (Auto-Detect)" },
  { code: "km", label: "🇰🇭 ភាសាខ្មែរ (Khmer)" },
  { code: "en", label: "🇬🇧 ភាសាអង់គ្លេស (English)" },
  { code: "zh", label: "🇨🇳 ភាសាចិន (Chinese Mandarin)" },
  { code: "fr", label: "🇫🇷 ភាសាបារាំង (French)" },
  { code: "ja", label: "🇯🇵 ភាសាជប៉ុន (Japanese)" },
  { code: "ko", label: "🇰🇷 ភាសាកូរ៉េ (Korean)" },
  { code: "vi", label: "🇻🇳 ភាសាវៀតណាម (Vietnamese)" },
  { code: "th", label: "🇹🇭 ភាសាថៃ (Thai)" },
  { code: "lo", label: "🇱🇦 ភាសាឡាវ (Lao)" },
  { code: "id", label: "🇮🇩 ភាសាឥណ្ឌូនេស៊ី (Indonesian)" },
  { code: "ms", label: "🇲🇾 ភាសាម៉ាឡេ (Malay)" },
  { code: "tl", label: "🇵🇭 ភាសាហ្វីលីពីន (Filipino / Tagalog)" },
  { code: "my", label: "🇲🇲 ភាសាមីយ៉ាន់ម៉ា/ភូមា (Burmese)" },
  { code: "hi", label: "🇮🇳 ភាសាហិណ្ឌូ/ឥណ្ឌា (Hindi)" },
  { code: "ar", label: "🇸🇦 ភាសាអារ៉ាប់ (Arabic)" },
  { code: "ru", label: "🇷🇺 ភាសារុស្ស៊ី (Russian)" },
  { code: "de", label: "🇩🇪 ភាសាអាល្លឺម៉ង់ (German)" },
  { code: "es", label: "🇪🇸 ភាសាអេស្ប៉ាញ (Spanish)" },
  { code: "pt", label: "🇵🇹 ភាសាព័រទុយហ្គាល់ (Portuguese)" },
  { code: "it", label: "🇮🇹 ភាសាអ៊ីតាលី (Italian)" },
  { code: "tr", label: "🇹🇷 ភាសាទួរគី (Turkish)" },
  { code: "nl", label: "🇳🇱 ភាសាហូឡង់ (Dutch)" },
  { code: "pl", label: "🇵🇱 ភាសាប៉ូឡូញ (Polish)" },
  { code: "sv", label: "🇸🇪 ភាសាស៊ុយអែត (Swedish)" },
  { code: "el", label: "🇬🇷 ភាសាក្រិក (Greek)" },
  { code: "he", label: "🇮🇱 ភាសាហេប្រឺ (Hebrew)" },
  { code: "fa", label: "🇮🇷 ភាសាភឺសៀន/អ៊ីរ៉ង់ (Persian)" },
  { code: "bn", label: "🇧🇩 ភាសាបង់ក្លាដែស (Bengali)" },
  { code: "ur", label: "🇵🇰 ភាសាអ៊ުރުទូ (Urdu)" },
  { code: "sw", label: "🇰🇪 ភាសាស្វាហ៊ីលី (Swahili)" },
  { code: "la", label: "🏛️ ភាសាឡាតាំង / បាលី-សំស្ក្រឹត (Latin / Pali)" },
];

export const SuperCapabilitiesModal: React.FC<SuperCapabilitiesModalProps> = ({
  isOpen,
  initialTab = "translator",
  onClose,
  onSendResultToChat,
}) => {
  const [activeTab, setActiveTab] = useState<SuperCapabilityTab>(initialTab);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // 1. World Translator State
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("km");
  const [translateInput, setTranslateInput] = useState(
    "Education and technology are the strongest foundations for building a peaceful and prosperous future."
  );
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState<any>(null);

  // 2. Illustrated Story Generator State
  const [storyGenre, setStoryGenre] = useState<"horror" | "novel" | "folktale">("horror");
  const [storyPrompt, setStoryPrompt] = useState("");
  const [episodeCount, setEpisodeCount] = useState(4);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [storyResult, setStoryResult] = useState<any>(null);

  // 3. Visual Dictionary State
  const [dictMode, setDictMode] = useState<"km-km" | "en-km" | "km-en">("km-km");
  const [dictQuery, setDictQuery] = useState("ផ្លែប៉ោម");
  const [isLookingUpDict, setIsLookingUpDict] = useState(false);
  const [dictResult, setDictResult] = useState<any>(null);

  // 4. Cambodia Calendar State
  const [calYear, setCalYear] = useState<number>(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState<number>(0); // 0 = All months
  const [calCategory, setCalCategory] = useState<string>("all");
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [calendarResult, setCalendarResult] = useState<any>(null);
  const [isBroadcastingCalendar, setIsBroadcastingCalendar] = useState(false);
  const [calendarBroadcastMessage, setCalendarBroadcastMessage] = useState<string | null>(null);

  // 5. Talking Photo AI Video Generator State
  const [tpImageBase64, setTpImageBase64] = useState<string | null>(null);
  const [tpScript, setTpScript] = useState<string>(
    "សូមគោរពជំរាបសួរពុកម៉ែបងប្អូនទាំងអស់គ្នា! ខ្ញុំបាទ/នាងខ្ញុំសូមជូនពរឱ្យមានសុខភាពល្អ និងសំណាងល្អគ្រប់ៗគ្នា!"
  );
  const [tpGesture, setTpGesture] = useState<string>("sampeah");
  const [tpVoiceGender, setTpVoiceGender] = useState<"female" | "male">("female");
  const [isGeneratingTp, setIsGeneratingTp] = useState<boolean>(false);
  const [tpSubtitlePreset, setTpSubtitlePreset] = useState<string>("tiktok_gold");
  const [tpResultVideo, setTpResultVideo] = useState<{
    videoBase64: string;
    duration: number;
    gesture: any;
    voiceName: string;
  } | null>(null);
  const [tpError, setTpError] = useState<string | null>(null);

  // 6. Decimal & Words Converter State
  const [decInput, setDecInput] = useState("2026");
  const [decResult, setDecResult] = useState<DecimalConversionResult>(() =>
    comprehensiveDecimalConversion("2026")
  );

  const handleDecInputChange = (val: string) => {
    setDecInput(val);
    if (val.trim()) {
      setDecResult(comprehensiveDecimalConversion(val.trim()));
    }
  };

  const handleGenerateTalkingPhoto = async () => {
    setIsGeneratingTp(true);
    setTpError(null);
    try {
      const res = await fetch("/api/talking-photo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: tpImageBase64,
          text: tpScript,
          gesture: tpGesture,
          voiceGender: tpVoiceGender,
          subtitlePreset: tpSubtitlePreset,
        }),
      });
      const data = await res.json();
      if (data?.ok && data?.videoBase64) {
        setTpResultVideo(data);
      } else {
        setTpError(data?.error || "មិនអាចបង្កើតវីដេអូរូបភាពនិយាយបានទេ");
      }
    } catch (err: any) {
      setTpError(err?.message || "មានបញ្ហាក្នុងការតភ្ជាប់");
    } finally {
      setIsGeneratingTp(false);
    }
  };

  const handleBroadcastCalendarNow = async () => {
    setIsBroadcastingCalendar(true);
    setCalendarBroadcastMessage(null);
    try {
      const res = await fetch("/api/calendar/broadcast-now", { method: "POST" });
      const data = await res.json();
      if (data?.ok) {
        setCalendarBroadcastMessage(`✅ បានលោតរាយការណ៍ប្រតិទិនចូល Telegram Bot ជោគជ័យ (${data.delivered || 1} ឆាត)!`);
      } else {
        setCalendarBroadcastMessage(`⚠️ ${data?.error || "មិនអាចផ្ញើបានទេ"}`);
      }
    } catch {
      setCalendarBroadcastMessage("⚠️ មានបញ្ហាក្នុងការផ្ញើ");
    }
    setIsBroadcastingCalendar(false);
  };

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (isOpen && activeTab === "calendar" && !calendarResult) {
      handleFetchCalendar(calYear, calMonth, calCategory);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const copyText = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const speakText = async (text: string) => {
    if (!text || isSpeaking) return;
    setIsSpeaking(true);
    try {
      const tts = await universalFetchTts(text.slice(0, 320), "web_client_session");
      if (tts?.khmerAudio) {
        const audio = new Audio(`data:audio/mpeg;base64,${tts.khmerAudio}`);
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);
        await audio.play();
        return;
      }
    } catch {}
    setIsSpeaking(false);
  };

  // Handlers
  const handleTranslate = async () => {
    if (!translateInput.trim() || isTranslating) return;
    setIsTranslating(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: translateInput,
          sourceLang,
          targetLang,
        }),
      });
      const data = await res.json();
      if (data?.ok) {
        setTranslationResult(data);
      }
    } catch {}
    setIsTranslating(false);
  };

  const handleGenerateStory = async () => {
    if (isGeneratingStory) return;
    setIsGeneratingStory(true);
    try {
      const res = await fetch("/api/story/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt:
            storyPrompt.trim() ||
            (storyGenre === "horror"
              ? "រឿងអាថ៌កំបាំងព្រឺព្រួចនៅភូមិគ្រឹះចាស់ក្បែរមាត់បឹង"
              : storyGenre === "novel"
              ? "រឿងប្រលោមលោកស្នេហា និងការតស៊ូសម្រេចក្ដីស្រមៃ"
              : "រឿងនិទានកថាអប់រំអំពីប្រាជ្ញា និងការដឹងគុណ"),
          genre: storyGenre,
          episodeCount,
        }),
      });
      const data = await res.json();
      if (data?.ok) {
        setStoryResult(data);
      }
    } catch {}
    setIsGeneratingStory(false);
  };

  const handleLookupDictionary = async (
    presetWord?: string,
    overrideMode?: "km-km" | "en-km" | "km-en"
  ) => {
    const targetWord = (presetWord ?? dictQuery).trim();
    if (!targetWord || isLookingUpDict) return;
    if (presetWord) setDictQuery(presetWord);
    const modeToUse = overrideMode || dictMode;
    if (overrideMode) setDictMode(overrideMode);
    setIsLookingUpDict(true);
    try {
      const res = await fetch("/api/dictionary/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: targetWord,
          mode: presetWord && !overrideMode ? "auto" : modeToUse,
        }),
      });
      const data = await res.json();
      if (data?.ok) {
        if (data.mode === "km-km" || data.mode === "en-km" || data.mode === "km-en") {
          setDictMode(data.mode);
        }
        setDictResult(data);
      }
    } catch {}
    setIsLookingUpDict(false);
  };

  const handleFetchCalendar = async (y = calYear, m = calMonth, cat = calCategory) => {
    setIsLoadingCalendar(true);
    try {
      const res = await fetch("/api/calendar/cambodia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: y,
          month: m > 0 ? m : undefined,
          category: cat,
        }),
      });
      const data = await res.json();
      if (data?.ok) {
        setCalendarResult(data);
      }
    } catch {}
    setIsLoadingCalendar(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0b1320] border border-indigo-500/35 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#0f1c32] via-[#181c3e] to-[#0f1c32] px-4 py-3.5 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-pink-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                ✨ មជ្ឈមណ្ឌលសមត្ថភាពពិសេស AI (Super Capabilities Studio)
              </h2>
              <p className="text-[11px] text-indigo-200/75">
                បកប្រែគ្រប់ភាសាពិភពលោក • បង្កើតរឿងរូបភាពតាមវគ្គ &amp; តួអង្គ • វចនានុក្រមរូបភាព ៣ ទិសដៅ • ប្រតិទិនកម្ពុជា
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 p-2.5 bg-[#080e18] border-b border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab("translator")}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "translator"
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20"
                : "bg-white/5 hover:bg-white/10 text-slate-300"
            }`}
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span>🌍 បកប្រែគ្រប់ភាសា</span>
          </button>
          <button
            onClick={() => setActiveTab("story")}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "story"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20"
                : "bg-white/5 hover:bg-white/10 text-slate-300"
            }`}
          >
            <Film className="w-4 h-4 shrink-0" />
            <span>📖 បង្កើតរឿង &amp; រូបភាព</span>
          </button>
          <button
            onClick={() => setActiveTab("dictionary")}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "dictionary"
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20"
                : "bg-white/5 hover:bg-white/10 text-slate-300"
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>📚 វចនានុក្រមរូបភាព</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("calendar");
              if (!calendarResult) handleFetchCalendar(calYear, calMonth, calCategory);
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "calendar"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                : "bg-white/5 hover:bg-white/10 text-slate-300"
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>📅 ប្រតិទិនកម្ពុជា</span>
          </button>
          <button
            onClick={() => setActiveTab("talking_photo")}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "talking_photo"
                ? "bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 text-white shadow-md shadow-rose-500/20"
                : "bg-white/5 hover:bg-white/10 text-slate-300"
            }`}
          >
            <Video className="w-4 h-4 shrink-0" />
            <span>🎬 រូបភាពនិយាយ AI</span>
          </button>
          <button
            onClick={() => setActiveTab("decimal")}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "decimal"
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20"
                : "bg-white/5 hover:bg-white/10 text-slate-300"
            }`}
          >
            <Binary className="w-4 h-4 shrink-0" />
            <span>🔢 ប្ដូរលេខ ⇄ អក្សរ</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: UNIVERSAL WORLD TRANSLATOR */}
          {activeTab === "translator" && (
            <div className="space-y-4">
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3">
                <h3 className="text-xs sm:text-sm font-bold text-cyan-300 flex items-center gap-2">
                  <Languages className="w-4 h-4" />
                  🌍 បកប្រែភាសាបានគ្រប់ភាសានៅទូទាំងពិភពលោក (Universal World Translator)
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  បកប្រែរវាងភាសាខ្មែរ និងជាង ១៥០ ភាសាទូទាំងពិភពលោក ដោយមានរបៀបអានបញ្ចេញសំឡេងជាអក្សរខ្មែរ វេយ្យាករណ៍ និងមិនខុសអក្ខរាវិរុទ្ធ។
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-11 gap-2 items-center">
                <div className="sm:col-span-5">
                  <label className="text-[11px] text-slate-400 block mb-1">ពីភាសា (Source Language)៖</label>
                  <select
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    className="w-full bg-[#131e31] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    {WORLD_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-1 flex justify-center pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (sourceLang !== "auto") {
                        const tmp = sourceLang;
                        setSourceLang(targetLang);
                        setTargetLang(tmp);
                      }
                    }}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-cyan-300 border border-white/10"
                    title="ប្ដូរទិសដៅភាសា"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                  </button>
                </div>

                <div className="sm:col-span-5">
                  <label className="text-[11px] text-slate-400 block mb-1">ទៅជាភាសា (Target Language)៖</label>
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="w-full bg-[#131e31] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    {WORLD_LANGUAGES.filter((l) => l.code !== "auto").map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <textarea
                  value={translateInput}
                  onChange={(e) => setTranslateInput(e.target.value)}
                  rows={3}
                  placeholder="បញ្ចូលអត្ថបទ ពាក្យ ឬប្រយោគជាភាសាណាមួយក៏បានដើម្បីបកប្រែ..."
                  className="w-full bg-[#111a2c] border border-white/15 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "🇰🇭 ខ្មែរ", code: "km" },
                      { label: "🇬🇧 English", code: "en" },
                      { label: "🇨🇳 ចិន", code: "zh" },
                      { label: "🇫🇷 បារាំង", code: "fr" },
                      { label: "🇯🇵 ជប៉ុន", code: "ja" },
                      { label: "🇰🇷 កូរ៉េ", code: "ko" },
                    ].map((q) => (
                      <button
                        key={q.code}
                        type="button"
                        onClick={() => setTargetLang(q.code)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
                          targetLang === q.code
                            ? "bg-cyan-500/25 border-cyan-400 text-cyan-200"
                            : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleTranslate}
                    disabled={isTranslating || !translateInput.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg disabled:opacity-50"
                  >
                    {isTranslating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>កំពុងបកប្រែ...</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4" />
                        <span>បកប្រែភ្លាមៗ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {translationResult && (
                <div className="bg-[#111c2f] border border-cyan-500/35 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                    <div className="text-xs font-bold text-cyan-300">
                      {translationResult.detectedSourceLang} ➔ {translationResult.targetLangLabel}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => speakText(translationResult.translatedText)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-xs font-medium border border-indigo-400/30"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>ស្ដាប់សំឡេង</span>
                      </button>
                      <button
                        onClick={() => copyText(translationResult.translatedText, "tr-main")}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs font-bold border border-emerald-400/30"
                      >
                        {copiedKey === "tr-main" ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>បានចម្លង!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>ចម្លងអត្ថបទបកប្រែ</span>
                          </>
                        )}
                      </button>
                      {onSendResultToChat && (
                        <button
                          onClick={() => {
                            const payload = encodeURIComponent(JSON.stringify(translationResult));
                            onSendResultToChat(
                              `បកប្រែទៅជា ${translationResult.targetLangLabel}៖ ${translationResult.sourceText}`,
                              `### 🌍✨ ការបកប្រែភាសាពិភពលោក (${translationResult.detectedSourceLang} ➔ ${translationResult.targetLangLabel})\n\n\`\`\`world-translator\n${payload}\n\`\`\``
                            );
                            onClose();
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>ផ្ញើចូលឆាត</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#09101d] rounded-xl p-3.5 border border-white/10">
                    <p className="text-sm sm:text-base font-bold text-white whitespace-pre-wrap leading-relaxed">
                      {translationResult.translatedText}
                    </p>
                    {translationResult.phoneticRomanization && (
                      <p className="text-xs text-cyan-300 mt-2">
                        🗣️ របៀបអាន (Phonetic)៖ <span className="font-mono">{translationResult.phoneticRomanization}</span>
                      </p>
                    )}
                    {translationResult.khmerPronunciationGuide && (
                      <p className="text-xs text-amber-300 mt-1">
                        🇰🇭 របៀបអានជាសំឡេងខ្មែរ៖ {translationResult.khmerPronunciationGuide}
                      </p>
                    )}
                  </div>

                  {Array.isArray(translationResult.otherMajorTranslations) &&
                    translationResult.otherMajorTranslations.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {translationResult.otherMajorTranslations.map((o: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-white/5 rounded-xl p-2.5 border border-white/10 text-xs"
                          >
                            <div className="font-bold text-indigo-300">{o.lang}</div>
                            <div className="text-white mt-0.5">{o.text}</div>
                            {o.pronunciation && (
                              <div className="text-[11px] text-slate-400 mt-0.5">{o.pronunciation}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ILLUSTRATED STORY GENERATOR */}
          {activeTab === "story" && (
            <div className="space-y-4">
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3">
                <h3 className="text-xs sm:text-sm font-bold text-purple-300 flex items-center gap-2">
                  <Film className="w-4 h-4" />
                  📖 បង្កើតរឿងបែបរន្ធត់ ប្រលោមលោក ឬរឿងនិទានកថា (មានរូបភាពតាមវគ្គ &amp; តួអង្គ)
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  បង្កើតសាច់រឿងពេញលេញដោយមានរូបភាពតួអង្គក្នុងរឿង និងរូបភាពឈុតឆាកទៅតាមវគ្គនីមួយៗនៃសាច់រឿង!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  {
                    id: "horror",
                    label: "👻 រឿងបែបរន្ធត់ (Horror)",
                    desc: "អាថ៌កំបាំង ព្រឺព្រួច រន្ធត់ជក់ចិត្ត",
                  },
                  {
                    id: "novel",
                    label: "💖 ប្រលោមលោក (Novel)",
                    desc: "មនោសញ្ចេតនា ស្នេហា ជីវិតតស៊ូ",
                  },
                  {
                    id: "folktale",
                    label: "👑 រឿងនិទានកថា (Folktale)",
                    desc: "រឿងព្រេងអប់រំ គតិបណ្ឌិតខ្មែរ",
                  },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setStoryGenre(g.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      storyGenre === g.id
                        ? "bg-purple-600/25 border-purple-400 text-white shadow-md"
                        : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <div className="text-xs font-bold">{g.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{g.desc}</div>
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={storyPrompt}
                  onChange={(e) => setStoryPrompt(e.target.value)}
                  placeholder="បញ្ចូលចំណងជើង ឬប្រធានបទរឿងដែលអ្នកចង់បាន (ទុកទទេក៏បាន AI នឹងបង្កើតជូនស្វ័យប្រវត្តិ)..."
                  className="flex-1 bg-[#111a2c] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
                <button
                  type="button"
                  onClick={handleGenerateStory}
                  disabled={isGeneratingStory}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shrink-0 disabled:opacity-50"
                >
                  {isGeneratingStory ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>កំពុងនិពន្ធរឿង &amp; គូររូបភាព...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>បង្កើតសាច់រឿង &amp; រូបភាព</span>
                    </>
                  )}
                </button>
              </div>

              {storyResult && (
                <div className="bg-[#11192b] border border-purple-500/35 rounded-2xl p-4 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/10 pb-3">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30 mb-1">
                        {storyResult.genreLabelKhmer}
                      </span>
                      <h4 className="text-base sm:text-lg font-bold text-white">
                        📖 {storyResult.title}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1">{storyResult.synopsis}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          speakText(`${storyResult.title}។ ${storyResult.synopsis}។ ${storyResult.episodes?.[0]?.narrative || ""}`)
                        }
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-xs font-medium border border-indigo-400/30"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>ស្ដាប់រឿង</span>
                      </button>
                      {onSendResultToChat && (
                        <button
                          onClick={() => {
                            const payload = encodeURIComponent(JSON.stringify(storyResult));
                            onSendResultToChat(
                              `បង្កើត${storyResult.genreLabelKhmer}៖ ${storyResult.title}`,
                              `### 📖✨ ${storyResult.title} (${storyResult.genreLabelKhmer})\n\n\`\`\`illustrated-story\n${payload}\n\`\`\``
                            );
                            onClose();
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>ផ្ញើចូលឆាត</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Characters Section */}
                  <div>
                    <h5 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-2">
                      <Users className="w-4 h-4" />
                      🎭 តួអង្គនៅក្នុងសាច់រឿង (Characters &amp; Portraits)៖
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {Array.isArray(storyResult.characters) &&
                        storyResult.characters.map((c: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-[#0b111e] border border-white/10 rounded-xl p-3 flex items-center gap-3"
                          >
                            <img
                              src={c.avatarUrl}
                              alt={c.name}
                              className="w-16 h-16 rounded-xl object-cover border border-purple-400/40 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">{c.name}</div>
                              <div className="text-[10px] text-purple-300 truncate">{c.role}</div>
                              <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                                {c.description}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Episodes Section */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-pink-300">
                      🎬 វគ្គនីមួយៗនៃសាច់រឿង និងរូបភាពតាមវគ្គ (Illustrated Episodes)៖
                    </h5>
                    {Array.isArray(storyResult.episodes) &&
                      storyResult.episodes.map((ep: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-[#090f1b] border border-white/10 rounded-xl overflow-hidden grid grid-cols-1 md:grid-cols-12"
                        >
                          <div className="md:col-span-5 relative">
                            <img
                              src={ep.imageUrl}
                              alt={ep.title}
                              className="w-full h-48 md:h-full object-cover"
                            />
                          </div>
                          <div className="md:col-span-7 p-3.5 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2.5 py-0.5 rounded-md bg-pink-500/20 text-pink-300 text-[11px] font-bold">
                                វគ្គទី {ep.episodeNumber} ៖ {ep.title}
                              </span>
                              <span className="text-[11px] text-slate-400">📍 {ep.setting}</span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">
                              {ep.narrative}
                            </p>
                            {ep.dialogue && (
                              <div className="bg-purple-950/40 border-l-2 border-purple-400 pl-3 py-1.5 text-xs text-purple-200 italic">
                                💬 {ep.dialogue}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>

                  {storyResult.moralKhmer && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 font-medium">
                      🌟 {storyResult.moralKhmer}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRI-DIRECTIONAL VISUAL DICTIONARY */}
          {activeTab === "dictionary" && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                <h3 className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  📚 វចនានុក្រមទាំង ៣ ប្រភេទ (ខ្មែរ-ខ្មែរ • អង់គ្លេស-ខ្មែរ • ខ្មែរ-អង់គ្លេស) ភ្ជាប់រូបភាពពិតប្រាកដ
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  ជ្រើសរើសប្រភេទវចនានុក្រមមួយណា បង្ហាញខ្លឹមសារតែ ១ ហ្នឹងប៉ុណ្ណោះ ព្រមទាំងបង្ហាញរូបភាពពិតប្រាកដទៅតាមពាក្យដែលអ្នកសួរ និងឧទាហរណ៍ល្បះបញ្ជាក់។
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  {
                    id: "km-km",
                    label: "🇰🇭➡️🇰🇭 វចនានុក្រម ខ្មែរ - ខ្មែរ",
                    sub: "សម្ដេចព្រះសង្ឃរាជ ជួន ណាត",
                  },
                  {
                    id: "en-km",
                    label: "🇬🇧➡️🇰🇭 វចនានុក្រម អង់គ្លេស - ខ្មែរ",
                    sub: "English ➔ Khmer Dictionary",
                  },
                  {
                    id: "km-en",
                    label: "🇰🇭➡️🇬🇧 វចនានុក្រម ខ្មែរ - អង់គ្លេស",
                    sub: "Khmer ➔ English Dictionary",
                  },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      const nextMode = m.id as "km-km" | "en-km" | "km-en";
                      setDictMode(nextMode);
                      if (dictResult) {
                        setDictResult({ ...dictResult, mode: nextMode });
                      }
                    }}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      dictMode === m.id
                        ? "bg-amber-500/25 border-amber-400 text-amber-100 shadow-md"
                        : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>{m.label}</span>
                      {dictMode === m.id && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px]">
                          កំពុងជ្រើសរើស
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{m.sub}</div>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={dictQuery}
                  onChange={(e) => setDictQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLookupDictionary(undefined, dictMode)}
                  placeholder="វាយពាក្យដែលចង់ស្វែងរក (ឧ. ផ្លែប៉ោម, apple, ប្រាជ្ញា, សន្តិភាព, វប្បធម៌)..."
                  className="flex-1 bg-[#111a2c] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => handleLookupDictionary(undefined, dictMode)}
                  disabled={isLookingUpDict || !dictQuery.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold shadow-lg disabled:opacity-50"
                >
                  {isLookingUpDict ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>ឆែកវចនានុក្រម</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "🍎 ផ្លែប៉ោម (ខ្មែរ-ខ្មែរ)", word: "ផ្លែប៉ោម", mode: "km-km" as const },
                  { label: "🍎 ផ្លែប៉ោម (ខ្មែរ-អង់គ្លេស)", word: "ផ្លែប៉ោម", mode: "km-en" as const },
                  { label: "🇬🇧 apple (អង់គ្លេស-ខ្មែរ)", word: "apple", mode: "en-km" as const },
                  { label: "🧠 ប្រាជ្ញា", word: "ប្រាជ្ញា", mode: "km-km" as const },
                  { label: "🙏 កតញ្ញូ", word: "កតញ្ញូ", mode: "km-km" as const },
                  { label: "🕊️ សន្តិភាព", word: "សន្តិភាព", mode: "km-km" as const },
                  { label: "🏛️ វប្បធម៌", word: "វប្បធម៌", mode: "km-km" as const },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleLookupDictionary(item.word, item.mode)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-300"
                  >
                    🔍 {item.label}
                  </button>
                ))}
              </div>

              {dictResult && (
                <div className="bg-[#11192b] border border-amber-500/35 rounded-2xl p-4 space-y-4">
                  {/* Single Selected Dictionary Mode Header Banner */}
                  <div className="bg-gradient-to-r from-amber-950/70 via-indigo-950/70 to-emerald-950/70 border border-amber-400/40 rounded-xl p-3.5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 mb-1">
                          {dictMode === "km-km"
                            ? "🇰🇭➡️🇰🇭 វចនានុក្រម ខ្មែរ - ខ្មែរ (សម្ដេចព្រះសង្ឃរាជ ជួន ណាត)"
                            : dictMode === "en-km"
                            ? "🇬🇧➡️🇰🇭 វចនានុក្រម អង់គ្លេស - ខ្មែរ (English ➔ Khmer)"
                            : "🇰🇭➡️🇬🇧 វចនានុក្រម ខ្មែរ - អង់គ្លេស (Khmer ➔ English)"}
                        </span>
                        <div className="text-xs sm:text-sm font-bold text-white">
                          {dictMode === "km-km" ? (
                            <>
                              🎯 ពាក្យគោល៖{" "}
                              <span className="text-amber-300">«{dictResult.khmerWord}»</span>{" "}
                              <span className="text-slate-300 font-normal">
                                (អានថា៖ {dictResult.pronunciationKhmer} • {dictResult.partOfSpeech})
                              </span>
                            </>
                          ) : dictMode === "en-km" ? (
                            <>
                              🎯 ពាក្យអង់គ្លេស{" "}
                              <span className="text-cyan-300">«{dictResult.englishWord}»</span>{" "}
                              ប្រែជាភាសាខ្មែរថា{" "}
                              <span className="text-amber-300">«{dictResult.khmerWord}»</span>
                            </>
                          ) : (
                            <>
                              🎯 ពាក្យខ្មែរ{" "}
                              <span className="text-amber-300">«{dictResult.khmerWord}»</span>{" "}
                              ប្រែជាភាសាអង់គ្លេសគឺ{" "}
                              <span className="text-emerald-300">«{dictResult.englishWord}»</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (dictMode === "km-km") {
                              speakText(`${dictResult.khmerWord}។ ${dictResult.khmerToKhmerDef}`);
                            } else if (dictResult.pronunciationAudioBase64) {
                              const audio = new Audio(
                                `data:audio/mpeg;base64,${dictResult.pronunciationAudioBase64}`
                              );
                              audio.play().catch(() => {
                                speakText(`${dictResult.englishWord}. ${dictResult.khmerWord}`);
                              });
                            } else {
                              speakText(`${dictResult.englishWord}. ${dictResult.khmerWord}`);
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
                        >
                          <Volume2 className="w-4 h-4" />
                          <span>
                            {dictMode === "km-km"
                              ? "🔊 ស្ដាប់សំឡេងអានពន្យល់ពាក្យ"
                              : "🔊 ស្ដាប់ការបញ្ចេញសំឡេងឱ្យត្រូវតុង"}
                          </span>
                        </button>

                        {onSendResultToChat && (
                          <button
                            onClick={() => {
                              const activePayload = {
                                ...dictResult,
                                mode: dictMode,
                              };
                              const payload = encodeURIComponent(JSON.stringify(activePayload));
                              const chatPrompt =
                                dictMode === "km-km"
                                  ? `វចនានុក្រម ខ្មែរ-ខ្មែរ៖ ${dictResult.khmerWord}`
                                  : dictMode === "en-km"
                                  ? `វចនានុក្រម អង់គ្លេស-ខ្មែរ៖ ${dictResult.englishWord}`
                                  : `វចនានុក្រម ខ្មែរ-អង់គ្លេស៖ ${dictResult.khmerWord}`;
                              const chatMd =
                                dictMode === "km-km"
                                  ? `### ${dictResult.emoji}📖 វចនានុក្រម ខ្មែរ-ខ្មែរ (សម្ដេចព្រះសង្ឃរាជ ជួន ណាត)៖ «${dictResult.khmerWord}»\n\n` +
                                    `• 🇰🇭➡️🇰🇭 **និយមន័យ៖** ${dictResult.khmerToKhmerDef}\n\n` +
                                    `\`\`\`visual-dictionary\n${payload}\n\`\`\``
                                  : dictMode === "en-km"
                                  ? `### ${dictResult.emoji}📖 វចនានុក្រម អង់គ្លេស-ខ្មែរ៖ «${dictResult.englishWord} ➔ ${dictResult.khmerWord}»\n\n` +
                                    `• 🗣️ **អានតាមតុងអង់គ្លេស៖** **${dictResult.pronunciationEnglishTone}**\n` +
                                    `• 🇬🇧➡️🇰🇭 **និយមន័យ អង់គ្លេស-ខ្មែរ៖** ${dictResult.englishToKhmerDef}\n\n` +
                                    `\`\`\`visual-dictionary\n${payload}\n\`\`\``
                                  : `### ${dictResult.emoji}📖 វចនានុក្រម ខ្មែរ-អង់គ្លេស៖ «${dictResult.khmerWord} ➔ ${dictResult.englishWord}»\n\n` +
                                    `• 🗣️ **អានតាមតុងអង់គ្លេស៖** **${dictResult.pronunciationEnglishTone}**\n` +
                                    `• 🇰🇭➡️🇬🇧 **និយមន័យ ខ្មែរ-អង់គ្លេស៖** ${dictResult.khmerToEnglishDef}\n\n` +
                                    `\`\`\`visual-dictionary\n${payload}\n\`\`\``;
                              onSendResultToChat(chatPrompt, chatMd);
                              onClose();
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>ផ្ញើចូលឆាត</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    {/* Real Photograph of the Queried Word */}
                    <div className="md:col-span-5">
                      <div className="rounded-xl overflow-hidden border border-amber-400/40 bg-[#090f1c] shadow-lg">
                        <img
                          src={dictResult.imageUrl}
                          alt={dictResult.khmerWord || dictResult.headword}
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (
                              dictResult.aiImageUrl &&
                              target.src !== dictResult.aiImageUrl
                            ) {
                              target.src = dictResult.aiImageUrl;
                            } else if (
                              dictResult.svgCardUrl &&
                              target.src !== dictResult.svgCardUrl
                            ) {
                              target.src = dictResult.svgCardUrl;
                            }
                          }}
                          className="w-full h-56 object-cover bg-black/40"
                        />
                        <div className="px-3 py-2 bg-black/65 border-t border-white/10 flex items-center justify-between text-[11px]">
                          <span className="text-amber-300 font-bold">
                            📸 រូបភាពពិតប្រាកដ៖ «
                            {dictMode === "en-km"
                              ? `${dictResult.englishWord} (${dictResult.khmerWord})`
                              : dictMode === "km-en"
                              ? `${dictResult.khmerWord} (${dictResult.englishWord})`
                              : dictResult.khmerWord}
                            »
                          </span>
                          <span className="text-slate-400">{dictResult.emoji}</span>
                        </div>
                      </div>
                    </div>

                    {/* ONLY the 1 Selected Dictionary Type Content */}
                    <div className="md:col-span-7 space-y-3 text-xs">
                      {dictMode === "km-km" && (
                        <div className="bg-[#090f1c] p-3.5 rounded-xl border border-amber-500/30 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                            <span className="font-bold text-amber-300 text-sm">
                              🇰🇭➡️🇰🇭 វចនានុក្រម ខ្មែរ-ខ្មែរ (សម្ដេចព្រះសង្ឃរាជ ជួន ណាត)
                            </span>
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 text-[11px] font-bold">
                              {dictResult.partOfSpeech}
                            </span>
                          </div>
                          <div className="text-slate-300">
                            🗣️ <b>របៀបអានពាក្យខ្មែរ៖</b>{" "}
                            <span className="text-white font-bold">
                              {dictResult.pronunciationKhmer}
                            </span>{" "}
                            {dictResult.etymology ? `• 🏛️ ${dictResult.etymology}` : ""}
                          </div>
                          <p className="text-slate-100 text-xs sm:text-sm leading-relaxed pt-1">
                            {dictResult.khmerToKhmerDef}
                          </p>
                          {(Array.isArray(dictResult.synonyms) &&
                            dictResult.synonyms.length > 0) && (
                            <div className="pt-1 text-[11px] text-emerald-300">
                              🔄 <b>សទិសន័យ (ន័យដូច)៖</b> {dictResult.synonyms.join(", ")}
                            </div>
                          )}
                          {(Array.isArray(dictResult.antonyms) &&
                            dictResult.antonyms.length > 0) && (
                            <div className="text-[11px] text-rose-300">
                              ↔️ <b>បដិសព្ទ (ពាក្យផ្ទុយ)៖</b> {dictResult.antonyms.join(", ")}
                            </div>
                          )}
                        </div>
                      )}

                      {dictMode === "en-km" && (
                        <div className="bg-[#090f1c] p-3.5 rounded-xl border border-cyan-500/30 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                            <span className="font-bold text-cyan-300 text-sm">
                              🇬🇧➡️🇰🇭 វចនានុក្រម អង់គ្លេស-ខ្មែរ (English ➔ Khmer)
                            </span>
                            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-200 text-[11px] font-bold">
                              {dictResult.partOfSpeech}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="bg-black/40 rounded-lg p-2 border border-white/10">
                              <div className="text-[11px] text-slate-400">🇬🇧 ពាក្យអង់គ្លេស & តុងអាន៖</div>
                              <div className="text-white font-bold text-sm">
                                {dictResult.englishWord}{" "}
                                <span className="text-cyan-300 text-xs font-normal">
                                  {dictResult.pronunciationIpa}
                                </span>
                              </div>
                              <div className="text-amber-300 text-[11px] mt-0.5">
                                🗣️ {dictResult.pronunciationEnglishTone}
                              </div>
                            </div>
                            <div className="bg-black/40 rounded-lg p-2 border border-white/10">
                              <div className="text-[11px] text-slate-400">🇰🇭 ប្រែជាភាសាខ្មែរ៖</div>
                              <div className="text-amber-300 font-bold text-sm">
                                {dictResult.khmerWord}
                              </div>
                              <div className="text-slate-300 text-[11px] mt-0.5">
                                អានថា៖ {dictResult.pronunciationKhmer}
                              </div>
                            </div>
                          </div>
                          <p className="text-slate-100 text-xs sm:text-sm leading-relaxed pt-1">
                            {dictResult.englishToKhmerDef}
                          </p>
                        </div>
                      )}

                      {dictMode === "km-en" && (
                        <div className="bg-[#090f1c] p-3.5 rounded-xl border border-emerald-500/30 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                            <span className="font-bold text-emerald-300 text-sm">
                              🇰🇭➡️🇬🇧 វចនានុក្រម ខ្មែរ-អង់គ្លេស (Khmer ➔ English)
                            </span>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 text-[11px] font-bold">
                              {dictResult.partOfSpeech}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="bg-black/40 rounded-lg p-2 border border-white/10">
                              <div className="text-[11px] text-slate-400">🇰🇭 ពាក្យខ្មែរ៖</div>
                              <div className="text-amber-300 font-bold text-sm">
                                {dictResult.khmerWord}
                              </div>
                              <div className="text-slate-300 text-[11px] mt-0.5">
                                អានថា៖ {dictResult.pronunciationKhmer}
                              </div>
                            </div>
                            <div className="bg-black/40 rounded-lg p-2 border border-white/10">
                              <div className="text-[11px] text-slate-400">🇬🇧 ប្រែជាភាសាអង់គ្លេស៖</div>
                              <div className="text-emerald-300 font-bold text-sm">
                                {dictResult.englishWord}{" "}
                                <span className="text-cyan-300 text-xs font-normal">
                                  {dictResult.pronunciationIpa}
                                </span>
                              </div>
                              <div className="text-amber-300 text-[11px] mt-0.5">
                                🗣️ {dictResult.pronunciationEnglishTone}
                              </div>
                            </div>
                          </div>
                          <p className="text-slate-100 text-xs sm:text-sm leading-relaxed pt-1">
                            {dictResult.khmerToEnglishDef}
                          </p>
                        </div>
                      )}

                      {/* Example Sentences tailored to the 1 selected dictionary mode */}
                      <div className="space-y-1.5">
                        <h5 className="text-xs font-bold text-amber-300">
                          📝 ឧទាហរណ៍ជាល្បះបង្ហាញ និងបញ្ជាក់៖
                        </h5>
                        <div className="grid grid-cols-1 gap-2">
                          {Array.isArray(dictResult.examples) &&
                            dictResult.examples.map((ex: any, i: number) => (
                              <div
                                key={i}
                                className="bg-[#090f1c] border border-white/10 rounded-xl p-2.5 text-xs space-y-1"
                              >
                                {dictMode === "km-km" ? (
                                  <>
                                    <div className="font-bold text-white">
                                      {i + 1}. 🇰🇭 {ex.khmerSentence}
                                    </div>
                                    <div className="text-slate-400">
                                      💡 ការបញ្ជាក់៖ {ex.explanationKhmer}
                                    </div>
                                  </>
                                ) : dictMode === "en-km" ? (
                                  <>
                                    <div className="font-bold text-cyan-300">
                                      {i + 1}. 🇬🇧 {ex.englishSentence}
                                    </div>
                                    <div className="text-white">🇰🇭 ប្រែខ្មែរ៖ {ex.khmerSentence}</div>
                                    <div className="text-slate-400">
                                      💡 ការបញ្ជាក់៖ {ex.explanationKhmer}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="font-bold text-white">
                                      {i + 1}. 🇰🇭 {ex.khmerSentence}
                                    </div>
                                    <div className="text-emerald-300 italic">
                                      🇬🇧 English: {ex.englishSentence}
                                    </div>
                                    <div className="text-slate-400">
                                      💡 ការបញ្ជាក់៖ {ex.explanationKhmer}
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CAMBODIA DAILY CALENDAR & HOLIDAY NOTIFIER */}
          {activeTab === "calendar" && (
            <div className="space-y-4">
              {calendarResult && (
                <div className="bg-gradient-to-r from-emerald-950/80 via-teal-950/80 to-emerald-950/80 border border-emerald-500/40 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs sm:text-sm">
                      <Bell className="w-4 h-4 animate-bounce" />
                      <span>🇰🇭 របាយការណ៍ប្រតិទិនកម្ពុជាប្រចាំថ្ងៃ &amp; ដំណឹងថ្ងៃសីល (ឆ្នាំជាក់ស្ដែង {calendarResult.targetYear})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleBroadcastCalendarNow}
                        disabled={isBroadcastingCalendar}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all"
                        title="ផ្ញើជូនដំណឹងប្រតិទិនប្រចាំថ្ងៃទៅកាន់គ្រប់ ID Chat ក្នុង Telegram Bot"
                      >
                        {isBroadcastingCalendar ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Bell className="w-3.5 h-3.5" />
                        )}
                        <span>{isBroadcastingCalendar ? "កំពុងលោតប្រាប់..." : "📢 លោតប្រាប់ក្នុង Telegram Bot"}</span>
                      </button>
                      {onSendResultToChat && (
                        <button
                          onClick={() => {
                            const payload = encodeURIComponent(JSON.stringify(calendarResult));
                            onSendResultToChat(
                              `បង្ហាញប្រតិទិនកម្ពុជា និងថ្ងៃបុណ្យជាតិ/អន្តរជាតិ ឆ្នាំ ${calendarResult.targetYear}`,
                              `### 🇰🇭📅 ប្រតិទិនកម្ពុជា និងអ្នកជូនដំណឹងថ្ងៃបុណ្យជាតិ/អន្តរជាតិ (${calendarResult.targetYear})\n\n\`\`\`cambodia-calendar\n${payload}\n\`\`\``
                            );
                            onClose();
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>ផ្ញើចូលឆាត</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {calendarBroadcastMessage && (
                    <div className="bg-indigo-900/60 border border-indigo-400/40 rounded-xl px-3 py-2 text-xs text-indigo-100 font-medium">
                      {calendarBroadcastMessage}
                    </div>
                  )}

                  {/* Solar & Lunar & Sil Badges Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="bg-black/40 border border-amber-500/30 rounded-xl p-2.5">
                      <div className="text-amber-300 font-bold mb-0.5">☀️ កាលបរិច្ឆេទសុរិយគតិ (Solar Date)</div>
                      <div className="text-white font-medium">{calendarResult.solar?.solarFull || calendarResult.khmerDateFull}</div>
                    </div>
                    <div className="bg-black/40 border border-sky-500/30 rounded-xl p-2.5">
                      <div className="text-sky-300 font-bold mb-0.5">🌙 កាលបរិច្ឆេទចន្ទគតិ (Khmer Lunar Date)</div>
                      <div className="text-white font-medium">{calendarResult.lunar?.lunarFull || "ចន្ទគតិខ្មែរ"}</div>
                    </div>
                  </div>

                  {/* Sil Day & Public Holiday Status */}
                  <div className="space-y-1.5 text-xs">
                    <div className={`rounded-xl px-3 py-2 border font-medium ${
                      calendarResult.sil?.isTodaySilDay
                        ? "bg-amber-950/70 border-amber-400 text-amber-200 font-bold"
                        : "bg-slate-900/60 border-white/10 text-slate-300"
                    }`}>
                      {calendarResult.sil?.silStatusBanner ? (
                        <div dangerouslySetInnerHTML={{ __html: calendarResult.sil.silStatusBanner }} />
                      ) : (
                        <span>🪷 ស្ថានភាពថ្ងៃសីល៖ ពិនិត្យក្នុងប្រតិទិន</span>
                      )}
                    </div>

                    {calendarResult.dayOffStatus && (
                      <div className="bg-slate-900/60 border border-white/10 rounded-xl px-3 py-1.5 text-slate-200">
                        <div dangerouslySetInnerHTML={{ __html: calendarResult.dayOffStatus }} />
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-emerald-200/90 font-medium pt-1">
                    {calendarResult.notificationBanner}
                  </p>
                </div>
              )}

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">ជ្រើសរើសឆ្នាំជាក់ស្ដែង៖</label>
                  <select
                    value={calYear}
                    onChange={(e) => {
                      const nextY = Number(e.target.value);
                      setCalYear(nextY);
                      handleFetchCalendar(nextY, calMonth, calCategory);
                    }}
                    className="w-full bg-[#131e31] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value={2025}>ឆ្នាំ ២០២៥ (2025 - ព.ស. ២៥៦៩)</option>
                    <option value={2026}>ឆ្នាំ ២០២៦ (2026 - ព.ស. ២៥៧០)</option>
                    <option value={2027}>ឆ្នាំ ២០២៧ (2027 - ព.ស. ២៥៧១)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">ជ្រើសរើសខែ៖</label>
                  <select
                    value={calMonth}
                    onChange={(e) => {
                      const nextM = Number(e.target.value);
                      setCalMonth(nextM);
                      handleFetchCalendar(calYear, nextM, calCategory);
                    }}
                    className="w-full bg-[#131e31] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value={0}>📅 គ្រប់ខែទាំងអស់ក្នុងឆ្នាំ (All 12 Months)</option>
                    <option value={1}>ខែមករា (January)</option>
                    <option value={2}>ខែកុម្ភៈ (February)</option>
                    <option value={3}>ខែមីនា (March)</option>
                    <option value={4}>ខែមេសា (April - ចូលឆ្នាំខ្មែរ)</option>
                    <option value={5}>ខែឧសភា (May)</option>
                    <option value={6}>ខែមិថុនា (June)</option>
                    <option value={9}>ខែកញ្ញា (September)</option>
                    <option value={10}>ខែតុលា (October - ភ្ជុំបិណ្ឌ)</option>
                    <option value={11}>ខែវិច្ឆិកា (November - បុណ្យឯករាជ្យ &amp; អុំទូក)</option>
                    <option value={12}>ខែធ្នូ (December - ទិវាសន្តិភាព)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">ប្រភេទថ្ងៃបុណ្យ / ទិវា៖</label>
                  <select
                    value={calCategory}
                    onChange={(e) => {
                      const nextC = e.target.value;
                      setCalCategory(nextC);
                      handleFetchCalendar(calYear, calMonth, nextC);
                    }}
                    className="w-full bg-[#131e31] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="all">🌟 ទាំងអស់ (បុណ្យជាតិ • ប្រពៃណី • អន្តរជាតិ)</option>
                    <option value="holiday">🔴 ថ្ងៃឈប់សម្រាកផ្លូវការនៅកម្ពុជា</option>
                    <option value="traditional">🪷 ពិធីបុណ្យប្រពៃណីជាតិ និងសាសនា</option>
                    <option value="international">🌍 បុណ្យអន្តរជាតិ និងទិវាពិភពលោក</option>
                  </select>
                </div>
              </div>

              {isLoadingCalendar ? (
                <div className="py-12 flex items-center justify-center gap-2 text-emerald-300 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>កំពុងទាញយកប្រតិទិនកម្ពុជា...</span>
                </div>
              ) : (
                calendarResult && (
                  <div className="space-y-2.5">
                    {Array.isArray(calendarResult.events) &&
                      calendarResult.events.map((ev: any) => (
                        <div
                          key={ev.id}
                          className={`rounded-xl p-3.5 border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                            ev.daysUntil === 0
                              ? "bg-emerald-500/20 border-emerald-400"
                              : ev.isPublicHoliday
                              ? "bg-[#111a2e] border-rose-500/30"
                              : "bg-[#0d1524] border-white/10"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-amber-300 font-bold text-xs">
                                🗓️ {ev.khmerDateShort}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  ev.isPublicHoliday
                                    ? "bg-rose-500/25 text-rose-300 border border-rose-400/30"
                                    : "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
                                }`}
                              >
                                {ev.isPublicHoliday
                                  ? "🔴 ថ្ងៃឈប់សម្រាកផ្លូវការ"
                                  : "🔵 ទិវាសំខាន់ក្នុងប្រតិទិន"}
                              </span>
                              <span className="text-[11px] text-emerald-300 font-medium">
                                {ev.statusLabelKhmer}
                              </span>
                            </div>
                            <div className="text-xs sm:text-sm font-bold text-white">
                              {ev.titleKhmer}
                            </div>
                            <p className="text-[11px] text-slate-300">{ev.descriptionKhmer}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                )
              )}
            </div>
          )}

          {/* TAB 5: TALKING PHOTO AI VIDEO GENERATOR */}
          {activeTab === "talking_photo" && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-rose-950/60 via-pink-950/60 to-purple-950/60 border border-rose-500/40 rounded-2xl p-4">
                <h3 className="text-xs sm:text-sm font-bold text-rose-300 flex items-center gap-2">
                  <Video className="w-4 h-4 text-rose-400" />
                  🎬✨ ម៉ាស៊ីនបង្កើតវីដេអូពីរូបភាពនិយាយខ្មែររស់រវើក (Talking Photo AI)
                </h3>
                <p className="text-[11px] text-slate-300 mt-1">
                  បម្លែងរូបថត ឬរូបតួអង្គរបស់អ្នក ឱ្យក្លាយជាវីដេអូនិយាយភាសាខ្មែរបានយ៉ាងច្បាស់លាស់ ព្រមទាំងមានកាយវិការរស់រវើក (សំពះ គ្រវីដៃ ញញឹមងក់ក្បាល ធ្វើបទបង្ហាញ) ដោយឥតគិតថ្លៃ ១០០%!
                </p>
              </div>

              {/* Photo Input & Gesture Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column: Image & Gesture Setup */}
                <div className="space-y-3 bg-[#0d1525] p-3.5 rounded-xl border border-white/10">
                  <div>
                    <label className="text-xs text-slate-300 font-bold block mb-1.5">
                      📸 ១. រូបភាពដែលត្រូវប្រើប្រាស់ (រូបថត ឬតួអង្គ)៖
                    </label>
                    <div className="flex flex-wrap gap-2 items-center">
                      <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 text-xs text-indigo-200 cursor-pointer transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{tpImageBase64 ? "ប្ដូររូបថតថ្មី" : "បញ្ចូលរូបថតពីកុំព្យូទ័រ/ទូរស័ព្ទ"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setTpImageBase64(ev.target?.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      {tpImageBase64 && (
                        <button
                          onClick={() => setTpImageBase64(null)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 text-xs hover:bg-rose-500/30"
                        >
                          លុបរូប
                        </button>
                      )}
                    </div>
                    {tpImageBase64 ? (
                      <div className="mt-2 w-28 h-36 rounded-xl overflow-hidden border border-white/20 bg-black">
                        <img src={tpImageBase64} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-1.5">
                        💡 <i>បើមិនបានបញ្ចូលរូបថត ប្រព័ន្ធនឹងប្រើប្រាស់តួអង្គកញ្ញាខ្មែរ ឬកម្លោះខ្មែរគំរូដ៏ស្រស់សង្ហាដោយស្វ័យប្រវត្តិ!</i>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 font-bold block mb-1.5">
                      🎭 ២. ជ្រើសរើសកាយវិការដែលចង់បាន (Gestures)៖
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: "sampeah", label: "🙏 សំពះ & គំនាប់", desc: "លើកដៃសំពះគំនាប់" },
                        { id: "wave", label: "👋 គ្រវីដៃស្វាគមន៍", desc: "គ្រវីដៃរាក់ទាក់" },
                        { id: "smile_nod", label: "😊 ញញឹម & ងក់ក្បាល", desc: "ញញឹមងក់ក្បាលរស់រវើក" },
                        { id: "expressive", label: "🎭 សម្ដែងរស់រវើក", desc: "កាយវិការដៃមនោសញ្ចេតនា" },
                        { id: "presenter", label: "👔 ធ្វើបទបង្ហាញ", desc: "ឥរិយាបថម៉ឺងម៉ាត់" },
                        { id: "cheerful", label: "🎉 សប្បាយរីករាយ", desc: "ចង្វាក់ថាមពលវិជ្ជមាន" },
                      ].map((g) => (
                        <button
                          key={g.id}
                          onClick={() => setTpGesture(g.id)}
                          className={`p-2 rounded-xl text-left text-xs transition-all border ${
                            tpGesture === g.id
                              ? "bg-rose-600/30 border-rose-400 text-white font-bold"
                              : "bg-black/30 border-white/5 text-slate-300 hover:bg-white/5"
                          }`}
                        >
                          <div>{g.label}</div>
                          <div className="text-[10px] text-slate-400">{g.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 font-bold block mb-1.5">
                      🎙️ ៣. សំឡេងអ្នកនិយាយ (Voice)៖
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTpVoiceGender("female")}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                          tpVoiceGender === "female"
                            ? "bg-pink-600/30 border-pink-400 text-pink-200"
                            : "bg-black/30 border-white/5 text-slate-400"
                        }`}
                      >
                        👩 សំឡេងស្រី (Google / Custom)
                      </button>
                      <button
                        onClick={() => setTpVoiceGender("male")}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                          tpVoiceGender === "male"
                            ? "bg-sky-600/30 border-sky-400 text-sky-200"
                            : "bg-black/30 border-white/5 text-slate-400"
                        }`}
                      >
                        👨 សំឡេងប្រុស (Google / Custom)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Speech Script & Video Player */}
                <div className="space-y-3 bg-[#0d1525] p-3.5 rounded-xl border border-white/10 flex flex-col justify-between">
                  <div>
                    <label className="text-xs text-slate-300 font-bold block mb-1.5">
                      ✍️ ៤. អត្ថបទដែលត្រូវនិយាយជាភាសាខ្មែរ (Speech Script)៖
                    </label>
                    <textarea
                      value={tpScript}
                      onChange={(e) => setTpScript(e.target.value)}
                      rows={3}
                      className="w-full bg-[#131e31] border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-400 resize-none"
                      placeholder="វាយអត្ថបទដែលចង់ឱ្យតួអង្គនិយាយនៅទីនេះ..."
                    />

                    {/* Quick Preset Buttons */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <button
                        onClick={() =>
                          setTpScript(
                            "សូមគោរពជំរាបសួរពុកម៉ែបងប្អូនទាំងអស់គ្នា! ខ្ញុំបាទ/នាងខ្ញុំសូមជូនពរឱ្យមានសុខភាពល្អ និងសំណាងល្អគ្រប់ៗគ្នា!"
                          )
                        }
                        className="text-[10px] px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300"
                      >
                        🙏 ជូនពរសុខភាពល្អ
                      </button>
                      <button
                        onClick={() =>
                          setTpScript(
                            "សួស្តីអ្នកទាំងអស់គ្នា! រីករាយណាស់ដែលបានជួបគ្នាថ្ងៃនេះ! តោះមកស្វែងយល់ពីបច្ចេកវិទ្យា AI ទាំងអស់គ្នា!"
                          )
                        }
                        className="text-[10px] px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300"
                      >
                        👋 ស្វាគមន៍រាក់ទាក់
                      </button>
                      <button
                        onClick={() =>
                          setTpScript(
                            "សូមស្វាគមន៍មកកាន់របាយការណ៍ព័ត៌មានពិសេសប្រចាំថ្ងៃ អរគុណសម្រាប់ការតាមដានទស្សនា!"
                          )
                        }
                        className="text-[10px] px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300"
                      >
                        👔 ធ្វើបទបង្ហាញ
                      </button>
                    </div>

                    {/* Subtitle Style Preset (Kinetic Running Subtitles) */}
                    <div className="space-y-1.5 mt-3">
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
                            onClick={() => setTpSubtitlePreset(sub.id)}
                            className={`p-2 rounded-xl text-left border transition-all ${
                              tpSubtitlePreset === sub.id
                                ? `bg-slate-800 ${sub.border} ring-2 ring-white/20 font-bold`
                                : "bg-black/30 border-white/5 text-slate-400 hover:bg-white/5"
                            }`}
                          >
                            <div className="text-xs">{sub.label}</div>
                            <div className="text-[10px] text-slate-400">{sub.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleGenerateTalkingPhoto}
                      disabled={isGeneratingTp || !tpScript.trim()}
                      className="mt-3 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
                    >
                      {isGeneratingTp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>កំពុងបង្កើតវីដេអូរូបភាពនិយាយ (ប្រហែល ៤-៥ វិនាទី)...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>🎬 ចាប់ផ្ដើមបង្កើតវីដេអូនិយាយខ្មែរ (ឥតគិតថ្លៃ ១០០%)</span>
                        </>
                      )}
                    </button>

                    {tpError && (
                      <div className="mt-2 text-xs text-rose-300 bg-rose-950/50 border border-rose-500/30 rounded-lg p-2">
                        ⚠️ {tpError}
                      </div>
                    )}
                  </div>

                  {/* Video Output Preview */}
                  {tpResultVideo && (
                    <div className="mt-3 p-3 bg-black/60 rounded-xl border border-rose-500/30 space-y-2">
                      <div className="flex items-center justify-between text-xs text-rose-300 font-bold">
                        <span>🎬 វីដេអូបានបង្កើតរួចរាល់ ({tpResultVideo.duration}s)</span>
                        <a
                          href={tpResultVideo.videoBase64}
                          download="talking-photo.mp4"
                          className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>ទាញយក MP4</span>
                        </a>
                      </div>
                      <div className="rounded-lg overflow-hidden bg-black max-h-56 flex justify-center">
                        <video
                          src={tpResultVideo.videoBase64}
                          controls
                          autoPlay
                          playsInline
                          className="max-h-56 rounded-lg object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: BASE-10 DECIMAL NUMBER & WORDS CONVERTER */}
          {activeTab === "decimal" && (
            <div className="space-y-4">
              {/* Header card */}
              <div className="p-4 bg-gradient-to-r from-violet-950/60 to-indigo-950/60 border border-violet-500/30 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-violet-600/30 border border-violet-400/40 text-violet-300">
                      <Binary className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        ប្រព័ន្ធប្ដូរអក្សរ ⇄ លេខប្រព័ន្ធគោលដប់ (Base-10 Decimal Engine)
                        <span className="px-2 py-0.5 text-[10px] bg-violet-500/20 text-violet-300 border border-violet-400/30 rounded-full font-semibold">
                          24/7 AI
                        </span>
                      </h3>
                      <p className="text-xs text-slate-300">
                        ប្ដូរពីលេខគោលដប់ទៅជាអក្សរខ្មែរ/អង់គ្លេស • ប្ដូរពីអក្សរខ្មែរទៅជាលេខគោលដប់ • ប្ដូរអក្សរទៅជាលេខកូដគោលដប់ (ASCII/Unicode) និងប្ដូរត្រឡប់មកវិញ!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Demo Chips */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-3 border-t border-white/10">
                  <span className="text-[11px] text-slate-400 font-medium">ឧទាហរណ៍រហ័ស៖</span>
                  {[
                    { label: "២០២៦ ➔ អក្សរ", val: "2026" },
                    { label: "១,៥០០,០០០ ➔ អក្សរ", val: "1500000" },
                    { label: "«មួយលានប្រាំសែន» ➔ លេខ", val: "មួយលានប្រាំសែន" },
                    { label: "«ពីរពាន់ម្ភៃប្រាំមួយ» ➔ លេខ", val: "ពីរពាន់ម្ភៃប្រាំមួយ" },
                    { label: "«Hello» ➔ កូដគោលដប់", val: "Hello" },
                    { label: "«សួស្តី» ➔ កូដគោលដប់", val: "សួស្តី" },
                    { label: "72 101 108 108 111 ➔ «Hello»", val: "72 101 108 108 111" },
                  ].map((chip) => (
                    <button
                      key={chip.val}
                      onClick={() => handleDecInputChange(chip.val)}
                      className="px-2 py-1 bg-white/5 hover:bg-violet-600/30 border border-white/10 hover:border-violet-400/40 rounded-lg text-xs text-violet-200 transition-all cursor-pointer font-medium"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input section */}
              <div className="p-4 bg-slate-900/70 border border-white/10 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-violet-400" />
                    <span>បញ្ចូលលេខ ឬអក្សរដែលចង់បម្លែង (វាយលេខ ឬអក្សរ វានឹងបម្លែងភ្លាមៗ)៖</span>
                  </label>
                  {decInput && (
                    <button
                      onClick={() => handleDecInputChange("")}
                      className="text-[11px] text-slate-400 hover:text-white transition-all cursor-pointer"
                    >
                      សម្អាត (Clear)
                    </button>
                  )}
                </div>
                <div className="relative">
                  <textarea
                    rows={2}
                    value={decInput}
                    onChange={(e) => handleDecInputChange(e.target.value)}
                    placeholder="ឧទាហរណ៍៖ ២០២៦, 1500000, មួយលានប្រាំសែន, Hello, 72 101 108 108 111..."
                    className="w-full bg-[#0b1320] border border-white/10 focus:border-violet-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none placeholder-slate-500 font-sans"
                  />
                </div>
              </div>

              {/* Converted Results Showcase */}
              {decResult && (
                <div className="space-y-3">
                  {/* Top Summary Result Card */}
                  <div className="p-4 bg-[#0d1627] border border-violet-500/40 rounded-2xl space-y-3 shadow-lg shadow-violet-950/20">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-xs font-bold text-violet-300 uppercase tracking-wider">
                          លទ្ធផលបម្លែង (Conversion Result)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            const textToCopy =
                              decResult.inputType === "text_to_decimal_codes"
                                ? decResult.decimalCodes
                                : `${decResult.decimalValue} = ${decResult.khmerWords} (${decResult.englishWords})`;
                            navigator.clipboard.writeText(textToCopy);
                            setCopiedKey("dec_main");
                            setTimeout(() => setCopiedKey(null), 2000);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-slate-300 font-medium transition-all cursor-pointer"
                        >
                          {copiedKey === "dec_main" ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">បានចម្លង!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>ចម្លង (Copy)</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            const speech =
                              decResult.inputType === "text_to_decimal_codes"
                                ? `អក្សរ ${decResult.originalInput} ប្ដូរទៅជាលេខកូដប្រព័ន្ធគោលដប់គឺ ${decResult.decimalCodes}`
                                : `លេខក្នុងប្រព័ន្ធគោលដប់ ${decResult.khmerDigits} អានជាអក្សរគឺ៖ ${decResult.khmerWords}។ English: ${decResult.englishWords}។`;
                            speakText(speech);
                          }}
                          disabled={isSpeaking}
                          className="flex items-center gap-1 px-2.5 py-1 bg-violet-600/30 hover:bg-violet-600/50 border border-violet-400/40 rounded-lg text-xs text-violet-200 font-medium transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isSpeaking ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5 text-violet-300" />
                          )}
                          <span>ស្តាប់សំឡេង</span>
                        </button>

                        {onSendResultToChat && (
                          <button
                            onClick={() => {
                              const p = `ប្ដូរ «${decResult.originalInput}» ទៅជាលេខប្រព័ន្ធគោលដប់ / អក្សរ`;
                              const m =
                                `### 🔢 លទ្ធផលបម្លែងប្រព័ន្ធគោលដប់ (Base-10 Decimal Conversion)\n\n` +
                                `• **បញ្ចូលដើម**៖ \`${decResult.originalInput}\`\n` +
                                `• **លេខប្រព័ន្ធគោលដប់ (Base-10)**៖ \`${decResult.decimalValue}\` (${decResult.khmerDigits})\n` +
                                `• **អក្សរខ្មែរ (Khmer Words)**៖ **«${decResult.khmerWords}»**\n` +
                                `• **អក្សរអង់គ្លេស (English Words)**៖ *"${decResult.englishWords}"*\n` +
                                (decResult.khmerCurrencyRiel ? `• **ជាប្រាក់រៀល**៖ ${decResult.khmerCurrencyRiel}\n` : "") +
                                `• **Hexadecimal**៖ \`${decResult.hexCodes}\`\n` +
                                `• **Binary (កូដគោលពីរ)**៖ \`${decResult.binaryCodes}\``;
                              onSendResultToChat(p, m);
                              onClose();
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/40 rounded-lg text-xs text-emerald-200 font-medium transition-all cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5 text-emerald-300" />
                            <span>ផ្ញើចូល Chat</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Output Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Box 1: Base-10 Decimal Digits */}
                      <div className="p-3 bg-slate-900/80 rounded-xl border border-white/5 space-y-1">
                        <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                          <span>🔢 លេខប្រព័ន្ធគោលដប់ (Base-10 Decimal)</span>
                          <span className="text-[10px] text-sky-400 font-mono">ARABIC &amp; KHMER</span>
                        </div>
                        <div className="text-xl font-bold text-sky-400 font-mono break-all">
                          {decResult.decimalValue}
                        </div>
                        <div className="text-sm font-semibold text-amber-300">
                          លេខខ្មែរ៖ {decResult.khmerDigits}
                        </div>
                      </div>

                      {/* Box 2: Spelled-out Khmer Words */}
                      <div className="p-3 bg-slate-900/80 rounded-xl border border-white/5 space-y-1">
                        <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                          <span>🇰🇭 សរសេរជាអក្សរខ្មែរ (Khmer Words)</span>
                          <span className="text-[10px] text-emerald-400">អក្ខរាវិរុទ្ធ ១០០%</span>
                        </div>
                        <div className="text-base font-bold text-white leading-relaxed">
                          «{decResult.khmerWords}»
                        </div>
                        {decResult.khmerCurrencyRiel && (
                          <div className="text-xs text-emerald-400">
                            💵 ជាប្រាក់រៀល៖ {decResult.khmerCurrencyRiel}
                          </div>
                        )}
                      </div>

                      {/* Box 3: Spelled-out English Words */}
                      <div className="p-3 bg-slate-900/80 rounded-xl border border-white/5 space-y-1">
                        <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                          <span>🇬🇧 សរសេរជាអក្សរអង់គ្លេស (English Words)</span>
                          <span className="text-[10px] text-cyan-400">ENGLISH</span>
                        </div>
                        <div className="text-sm font-semibold text-slate-200">
                          "{decResult.englishWords}"
                        </div>
                      </div>

                      {/* Box 4: Multi-Base (Hex & Binary) */}
                      <div className="p-3 bg-slate-900/80 rounded-xl border border-white/5 space-y-1">
                        <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                          <span>🪙 ប្រព័ន្ធគោលផ្សេងទៀត (Base-2, Base-16)</span>
                          <span className="text-[10px] text-purple-400 font-mono">HEX / BIN</span>
                        </div>
                        <div className="text-xs text-purple-300 font-mono break-all">
                          Hex (16)៖ <code>{decResult.hexCodes}</code>
                        </div>
                        <div className="text-xs text-teal-300 font-mono break-all">
                          Binary (2)៖ <code>{decResult.binaryCodes}</code>
                        </div>
                      </div>
                    </div>

                    {/* Character / Code Breakdown Table */}
                    {decResult.charBreakdown && decResult.charBreakdown.length > 0 && (
                      <div className="pt-2 border-t border-white/5">
                        <div className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                          <Binary className="w-3.5 h-3.5 text-violet-400" />
                          <span>តារាងលេខកូដប្រព័ន្ធគោលដប់តាមតួអក្សរនីមួយៗ (Decimal Unicode / ASCII)：</span>
                        </div>
                        <div className="overflow-x-auto max-h-40 rounded-xl border border-white/10 bg-black/40">
                          <table className="w-full text-left text-xs font-mono">
                            <thead className="bg-white/5 text-slate-400 text-[11px] uppercase border-b border-white/10 sticky top-0">
                              <tr>
                                <th className="px-3 py-1.5">តួអក្សរ (Char)</th>
                                <th className="px-3 py-1.5">គោលដប់ (Decimal Base-10)</th>
                                <th className="px-3 py-1.5">គោលដប់ប្រាំមួយ (Hex)</th>
                                <th className="px-3 py-1.5">គោលពីរ (Binary)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-slate-300">
                              {decResult.charBreakdown.slice(0, 30).map((row, idx) => (
                                <tr key={idx} className="hover:bg-white/5">
                                  <td className="px-3 py-1.5 font-bold text-white text-sm">«{row.char}»</td>
                                  <td className="px-3 py-1.5 font-bold text-sky-400">{row.decimal}</td>
                                  <td className="px-3 py-1.5 text-purple-300">{row.hex}</td>
                                  <td className="px-3 py-1.5 text-teal-300">{row.binary}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
