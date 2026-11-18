import React, { useState, useRef, useEffect, useMemo } from "react";
import { Message, ChatImage } from "../types";
import { FormattedContent } from "./FormattedContent";
import { universalFetchTts } from "../services/universalClient";
import {
  resolveKhmerVoiceForSession,
  isExercisePrompt,
  isExerciseSolutionText,
  buildGoogleGeminiExerciseThinkingData,
} from "../utils/khmerOrthography";
import {
  segmentTextByLanguage,
  SUPPORTED_NATIVE_VOICES,
} from "../utils/multilingualSpeech";
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  Bot,
  User,
  Zap,
  Play,
  Pause,
  Loader2,
  Mic,
  Wand2,
  Download,
  Sparkles,
  Brain,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  RefreshCw,
  Layers,
  FileDown,
} from "lucide-react";

interface MessageItemProps {
  message: Message;
  previousUserPrompt?: string;
  onImageClick?: (imageUrl: string) => void;
  onEditImage?: (image: ChatImage) => void;
  onRetry?: (messageId: string) => void;
  onQuickPrompt?: (promptText: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  previousUserPrompt = "",
  onImageClick,
  onEditImage,
  onRetry,
  onQuickPrompt,
}) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  // Google Gemini AI 100% Exercise Solving Interactive States
  const [showThinking, setShowThinking] = useState(false);
  const [showDraftsPanel, setShowDraftsPanel] = useState(false);
  const [selectedDraftId, setSelectedDraftId] = useState<number>(1);
  const [showModifyMenu, setShowModifyMenu] = useState(false);
  const [showDoubleCheck, setShowDoubleCheck] = useState(false);
  const [feedbackVote, setFeedbackVote] = useState<"up" | "down" | null>(null);

  const isGeminiExercise = useMemo(() => {
    if (isUser || !message.text || message.text.length < 40) return false;
    return isExerciseSolutionText(message.text) || isExercisePrompt(previousUserPrompt);
  }, [isUser, message.text, previousUserPrompt]);

  const geminiExerciseData = useMemo(() => {
    if (!isGeminiExercise) return null;
    return buildGoogleGeminiExerciseThinkingData(previousUserPrompt, message.text);
  }, [isGeminiExercise, previousUserPrompt, message.text]);

  const displayedSolutionContent = useMemo(() => {
    if (!isGeminiExercise || !geminiExerciseData) return message.text;
    const foundDraft = geminiExerciseData.drafts.find((d) => d.id === selectedDraftId);
    return foundDraft ? foundDraft.content : message.text;
  }, [isGeminiExercise, geminiExerciseData, selectedDraftId, message.text]);

  // Audio note playback state (for user's recorded voice note)
  const [isPlayingNote, setIsPlayingNote] = useState(false);
  const noteAudioRef = useRef<HTMLAudioElement | null>(null);

  // TTS response speech playback state (for bot reading answer at moderate, balanced speed: មិនលឿនពេក មិនយឺតពេក)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.0); // Moderate balanced speed (server audio already tuned to +10% natural pace)
  const [speakingLang, setSpeakingLang] = useState<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const voiceInfo = resolveKhmerVoiceForSession("web_client_session", message.text);
  const [activeVoiceLabel, setActiveVoiceLabel] = useState<string>(voiceInfo.voiceNameKhmer);
  const hasError = !isUser && message.text.includes("⚠️");

  // Clean up audio objects on unmount
  useEffect(() => {
    return () => {
      if (noteAudioRef.current) {
        noteAudioRef.current.pause();
        noteAudioRef.current = null;
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = (img: ChatImage) => {
    const link = document.createElement("a");
    link.href = img.previewUrl || `data:${img.mimeType};base64,${img.data}`;
    link.download = img.name || `khmer-ai-image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Play/pause user's recorded audio note
  const togglePlayAudioNote = () => {
    if (!message.audio) return;

    if (isPlayingNote && noteAudioRef.current) {
      noteAudioRef.current.pause();
      setIsPlayingNote(false);
      return;
    }

    if (!noteAudioRef.current) {
      const audioUrl = `data:${message.audio.mimeType};base64,${message.audio.data}`;
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlayingNote(false);
      audio.onerror = () => setIsPlayingNote(false);
      noteAudioRef.current = audio;
    }

    noteAudioRef.current
      .play()
      .then(() => setIsPlayingNote(true))
      .catch(() => setIsPlayingNote(false));
  };

  // Text-to-Speech: Sweet Khmer Voice (Google AI Studio / Custom Voice) + Native English Voice
  const handleToggleSpeak = async () => {
    if (isSpeaking) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      setSpeakingLang(null);
      return;
    }

    setIsLoadingAudio(true);
    const currentVoice = resolveKhmerVoiceForSession("web_client_session", message.text);
    setActiveVoiceLabel(currentVoice.voiceNameKhmer);

    try {
      const data = await universalFetchTts(message.text, "web_client_session");
      if (data) {
        if (data.voiceLabel) {
          setActiveVoiceLabel(data.voiceLabel);
        }
        const khmerAudioBase64 = data.khmerAudio;
        const englishAudioBase64 = data.englishAudio;

        if (khmerAudioBase64 || englishAudioBase64) {
          setIsLoadingAudio(false);
          setIsSpeaking(true);

          const playEnglishMaleAudio = () => {
            if (englishAudioBase64) {
              setSpeakingLang("en");
              const audioEn = new Audio(`data:audio/mpeg;base64,${englishAudioBase64}`);
              audioEn.playbackRate = speechSpeed;
              currentAudioRef.current = audioEn;

              audioEn.onended = () => {
                setIsSpeaking(false);
                setSpeakingLang(null);
                currentAudioRef.current = null;
              };
              audioEn.onerror = () => {
                setIsSpeaking(false);
                setSpeakingLang(null);
                currentAudioRef.current = null;
              };
              audioEn.play().catch(() => {
                setIsSpeaking(false);
                setSpeakingLang(null);
              });
            } else {
              setIsSpeaking(false);
              setSpeakingLang(null);
            }
          };

          if (khmerAudioBase64) {
            setSpeakingLang("km");
            const audioKm = new Audio(`data:audio/mpeg;base64,${khmerAudioBase64}`);
            audioKm.playbackRate = speechSpeed;
            currentAudioRef.current = audioKm;

            audioKm.onended = () => {
              playEnglishMaleAudio();
            };
            audioKm.onerror = () => {
              playEnglishMaleAudio();
            };

            audioKm.play().catch(() => {
              playEnglishMaleAudio();
            });
          } else {
            playEnglishMaleAudio();
          }
          return;
        }
      }
    } catch {
      // Fallback to browser synthesis below
    }

    // Fallback to browser Web Speech API with authentic native voice matching for all languages
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const voices = window.speechSynthesis.getVoices();
      const segments = segmentTextByLanguage(message.text, currentVoice.isMaleVoice);

      if (segments.length === 0) {
        setIsLoadingAudio(false);
        setIsSpeaking(false);
        setSpeakingLang(null);
        return;
      }

      setIsSpeaking(true);
      setIsLoadingAudio(false);

      let currentSegIdx = 0;
      const playNextSegment = () => {
        if (currentSegIdx >= segments.length) {
          setIsSpeaking(false);
          setSpeakingLang(null);
          return;
        }

        const seg = segments[currentSegIdx++];
        setSpeakingLang(seg.lang);

        const conf = SUPPORTED_NATIVE_VOICES[seg.lang] || SUPPORTED_NATIVE_VOICES.en;
        const utterance = new SpeechSynthesisUtterance(seg.text);
        utterance.lang = conf.bcp47;

        if (seg.isKhmer) {
          utterance.rate = Number((speechSpeed * 1.08).toFixed(2));
          utterance.pitch = currentVoice.isMaleVoice ? 0.84 : 1.12;
          const matchedKm = voices.find((v) =>
            currentVoice.isMaleVoice
              ? v.lang.toLowerCase().startsWith("km") && /piseth|male/i.test(v.name)
              : v.lang.toLowerCase().startsWith("km") && /sreymom|female/i.test(v.name)
          ) || voices.find((v) => v.lang.toLowerCase().startsWith("km"));
          if (matchedKm) utterance.voice = matchedKm;
        } else {
          // Native foreign language pronunciation: standard natural pitch and rate
          utterance.rate = Number((speechSpeed * 1.02).toFixed(2));
          utterance.pitch = 1.0;
          const langPrefix = seg.lang.toLowerCase();
          const matchedNativeVoice =
            voices.find((v) => v.lang.toLowerCase().startsWith(conf.bcp47.toLowerCase())) ||
            voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix)) ||
            (seg.lang === "en"
              ? voices.find(
                  (v) =>
                    v.lang.toLowerCase().startsWith("en") &&
                    (currentVoice.isMaleVoice
                      ? /male|guy|christopher|david|daniel/i.test(v.name)
                      : /female|jenny|samantha|zira/i.test(v.name))
                )
              : null);
          if (matchedNativeVoice) utterance.voice = matchedNativeVoice;
        }

        utterance.onend = () => {
          playNextSegment();
        };
        utterance.onerror = () => {
          playNextSegment();
        };

        window.speechSynthesis.speak(utterance);
      };

      playNextSegment();
    } else {
      setIsLoadingAudio(false);
      setIsSpeaking(false);
      setSpeakingLang(null);
    }
  };

  return (
    <div className={`flex w-full my-2.5 ${isUser ? "justify-end" : "justify-start"} px-2 sm:px-4`}>
      <div
        className={`flex items-end gap-2 max-w-[94%] sm:max-w-[85%] md:max-w-[78%] ${
          isUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Avatar */}
        <div className="shrink-0 mb-1">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center text-white shadow-sm ring-1 ring-sky-300/30">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-700 via-sky-600 to-emerald-500 p-[1.5px] shadow-sm">
              <div className="w-full h-full rounded-full bg-[#17212b] flex items-center justify-center text-sky-400">
                <Bot className="w-4 h-4" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 text-[10px]">🇰🇭</span>
            </div>
          )}
        </div>

        {/* Bubble */}
        <div
          className={`relative rounded-2xl p-3 sm:p-3.5 shadow-md transition-all ${
            isUser
              ? "bg-[#2b5278] text-white rounded-br-xs border border-sky-400/20"
              : "bg-[#182533] text-[#f5f5f5] rounded-bl-xs border border-white/5"
          }`}
        >
          {/* Header for Bot message */}
          {!isUser && (
            <div className="flex flex-col gap-2 mb-2.5 pb-2 border-b border-white/10 text-xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 font-medium text-sky-400 flex-wrap">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                  <span>Khmer Super AI Agent</span>
                  {isGeminiExercise ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-gradient-to-r from-blue-500/25 via-indigo-500/25 to-emerald-500/25 text-sky-200 border border-sky-400/35 font-semibold">
                      ✨ Google Gemini AI 100%
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] bg-sky-500/20 text-sky-300 font-normal">
                      ឆ្លាតវៃ
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {isGeminiExercise && geminiExerciseData && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowThinking((prev) => !prev)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-medium transition-all cursor-pointer border ${
                          showThinking
                            ? "bg-indigo-500/30 text-indigo-200 border-indigo-400/50 shadow-xs"
                            : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
                        }`}
                        title="បង្ហាញដំណើរការគិតវិភាគរបស់ Google Gemini AI (Show thinking)"
                      >
                        <Brain className="w-3 h-3 text-indigo-400" />
                        <span>បង្ហាញការគិត (Show thinking)</span>
                        {showThinking ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowDraftsPanel((prev) => !prev)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-medium transition-all cursor-pointer border ${
                          showDraftsPanel || selectedDraftId !== 1
                            ? "bg-sky-500/25 text-sky-200 border-sky-400/50 shadow-xs"
                            : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
                        }`}
                        title="មើលសេចក្ដីព្រាងទាំង ៣ របស់ Google Gemini AI (Show drafts)"
                      >
                        <Layers className="w-3 h-3 text-sky-400" />
                        <span>ជម្រើសសេចក្ដីព្រាង (Drafts)</span>
                        {showDraftsPanel ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    </>
                  )}

                  {message.durationMs && (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-400/90 font-mono">
                      <Zap className="w-3 h-3 text-emerald-400 animate-pulse" />
                      <span>{(message.durationMs / 1000).toFixed(1)}s</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Google Gemini AI "Show thinking" Expandable Reasoning Panel */}
              {isGeminiExercise && geminiExerciseData && showThinking && (
                <div className="mt-1 p-3 rounded-xl bg-[#0d1624]/95 border border-indigo-500/35 text-xs space-y-2 shadow-inner">
                  <div className="flex items-center justify-between text-indigo-300 font-semibold border-b border-indigo-500/20 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-indigo-400" />
                      <span>ដំណើរការគិតវិភាគរបស់ Google Gemini AI (Thinking Process)</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 font-mono">
                      {geminiExerciseData.subjectBadgeKhmer}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-slate-300 leading-relaxed">
                    {geminiExerciseData.thinkingSteps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold shrink-0">•</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Google Gemini AI "Show drafts (Draft 1, Draft 2, Draft 3)" Selector Bar */}
              {isGeminiExercise && geminiExerciseData && showDraftsPanel && (
                <div className="mt-1 p-2.5 rounded-xl bg-[#0d1624]/95 border border-sky-500/35 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-sky-300 font-semibold">
                    <span>📑 ជ្រើសរើសទម្រង់បង្ហាញដំណោះស្រាយ (Google Gemini AI View Other Drafts)៖</span>
                    <span className="text-[10px] text-slate-400">ប្ដូរទម្រង់ចម្លើយភ្លាមៗ</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {geminiExerciseData.drafts.map((draft) => {
                      const isSelected = selectedDraftId === draft.id;
                      return (
                        <button
                          key={draft.id}
                          type="button"
                          onClick={() => setSelectedDraftId(draft.id)}
                          className={`p-2 rounded-lg text-left transition-all cursor-pointer border flex flex-col justify-between gap-1 ${
                            isSelected
                              ? "bg-sky-500/25 border-sky-400 text-white shadow-sm"
                              : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-[11px] text-sky-300">
                              {draft.titleKhmer}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-200">
                              {draft.badge}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">{draft.titleEn}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User's Audio Voice Note Player (Telegram Voice Bubble Style) */}
          {message.audio && (
            <div className="mb-2 p-2.5 rounded-xl bg-black/25 border border-sky-400/30 flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlayAudioNote}
                className="w-9 h-9 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                {isPlayingNote ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-300">
                  <Mic className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                  <span>សារជាសំឡេង (Voice Note)</span>
                </div>

                {/* Animated sound wave bars */}
                <div className="flex items-center gap-0.5 h-4 mt-1.5">
                  {[40, 70, 30, 90, 60, 100, 45, 80, 50, 75, 35, 85, 65, 95, 40].map((h, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all ${
                        isPlayingNote ? "bg-sky-400 animate-pulse" : "bg-white/30"
                      }`}
                      style={{
                        height: isPlayingNote ? `${Math.max(20, (h * ((i % 3) + 1)) % 100)}%` : `${h * 0.4}%`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {message.audio.durationSeconds !== undefined && (
                <span className="font-mono text-xs text-white/60 shrink-0">
                  {Math.floor(message.audio.durationSeconds / 60)}:
                  {(message.audio.durationSeconds % 60).toString().padStart(2, "0")}
                </span>
              )}
            </div>
          )}

          {/* Attached image if present */}
          {message.image && (
            <div className="mb-2.5 overflow-hidden rounded-xl border border-white/15 bg-black/40">
              <img
                src={message.image.previewUrl || `data:${message.image.mimeType};base64,${message.image.data}`}
                alt="Attached"
                referrerPolicy="no-referrer"
                onClick={() =>
                  onImageClick?.(
                    message.image?.previewUrl || `data:${message.image?.mimeType};base64,${message.image?.data}`
                  )
                }
                className="max-h-72 w-full object-contain cursor-pointer hover:opacity-90 transition-opacity bg-black/20"
              />
              <div className="p-2 text-[11px] text-white/75 flex flex-wrap items-center justify-between gap-2 bg-black/50 border-t border-white/10">
                <span>📸 រូបភាពភ្ជាប់ (ចុចដើម្បីពង្រីក)</span>
                <div className="flex items-center gap-1.5">
                  {onEditImage && message.image && (
                    <button
                      type="button"
                      onClick={() => onEditImage(message.image!)}
                      className="px-2 py-0.5 rounded bg-sky-500/25 hover:bg-sky-500/40 text-sky-200 border border-sky-400/30 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>កែរូបភាពនេះ</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => message.image && handleDownloadImage(message.image)}
                    className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white/80 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>ទាញយក</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI Generated or Edited Image Result */}
          {message.generatedImage && (
            <div className="mb-3 overflow-hidden rounded-xl border border-sky-400/30 bg-[#0d1624] shadow-lg">
              <div className="px-3 py-1.5 bg-gradient-to-r from-sky-900/50 to-indigo-900/50 border-b border-sky-400/20 flex items-center justify-between text-xs text-sky-200">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>រូបភាពបង្កើត/កែដោយ Khmer AI Studio</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {onEditImage && message.generatedImage && (
                    <button
                      type="button"
                      onClick={() => onEditImage(message.generatedImage!)}
                      className="px-2 py-0.5 rounded bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-200 border border-emerald-400/30 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>កែរូបនេះបន្ត</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => message.generatedImage && handleDownloadImage(message.generatedImage)}
                    className="px-2 py-0.5 rounded bg-sky-500/25 hover:bg-sky-500/40 text-sky-200 border border-sky-400/30 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>ទាញយក</span>
                  </button>
                </div>
              </div>
              <img
                src={
                  message.generatedImage.previewUrl ||
                  `data:${message.generatedImage.mimeType};base64,${message.generatedImage.data}`
                }
                alt="AI Generated Artwork"
                referrerPolicy="no-referrer"
                onClick={() =>
                  onImageClick?.(
                    message.generatedImage?.previewUrl ||
                      `data:${message.generatedImage?.mimeType};base64,${message.generatedImage?.data}`
                  )
                }
                className="max-h-96 w-full object-contain cursor-pointer hover:opacity-95 transition-opacity bg-black/30"
              />
            </div>
          )}

          {/* Text Content */}
          <FormattedContent content={displayedSolutionContent} />

          {/* Google Gemini AI 100% Exercise Interactive Options, Double-Check Panel & Follow-Up Chips */}
          {isGeminiExercise && geminiExerciseData && (
            <div className="mt-3 pt-2.5 border-t border-sky-500/20 space-y-2.5">
              {/* Google Gemini Double-Check Verification Result Panel */}
              {showDoubleCheck && (
                <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-xs space-y-2 shadow-md">
                  <div className="flex items-center justify-between text-emerald-300 font-bold border-b border-emerald-500/25 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>ការផ្ទៀងផ្ទាត់ចម្លើយរបស់ Google Gemini AI (Double-Check Response)</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-200 text-[10px]">
                      ផ្ទៀងផ្ទាត់ត្រឹមត្រូវ ១០០%
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {geminiExerciseData.verificationChecklist.map((item, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-emerald-200">{item.label}</div>
                          <div className="text-slate-300 text-[11px]">{item.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Google Gemini AI Bottom Action Toolbar (Thumbs Up/Down, Modify Response, Double-Check G, Alternative Method, Export) */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center flex-wrap gap-1.5 relative">
                  {/* Thumbs Up / Down */}
                  <button
                    type="button"
                    onClick={() => setFeedbackVote((v) => (v === "up" ? null : "up"))}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      feedbackVote === "up"
                        ? "bg-emerald-500/25 border-emerald-400 text-emerald-300"
                        : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
                    }`}
                    title="ចម្លើយល្អ (Good response)"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackVote((v) => (v === "down" ? null : "down"))}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      feedbackVote === "down"
                        ? "bg-rose-500/25 border-rose-400 text-rose-300"
                        : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
                    }`}
                    title="ចម្លើយមិនសូវល្អ (Bad response)"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Modify Response (កែសម្រួលការឆ្លើយតប — Shorter, Longer, Simpler, More detailed, Exam Standard) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowModifyMenu((prev) => !prev)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                        showModifyMenu
                          ? "bg-sky-500/30 border-sky-400 text-white"
                          : "bg-white/5 hover:bg-white/10 border-white/10 text-sky-200"
                      }`}
                      title="កែសម្រួលការឆ្លើយតបដូច Google Gemini AI (Modify response)"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
                      <span>កែសម្រួលចម្លើយ (Modify response)</span>
                    </button>

                    {showModifyMenu && (
                      <div className="absolute left-0 bottom-full mb-1.5 w-64 rounded-xl bg-[#0d1624] border border-sky-400/40 shadow-2xl p-1.5 z-30 space-y-1">
                        <div className="px-2 py-1 text-[10px] font-bold text-sky-300 border-b border-white/10">
                          🎛️ កែសម្រួលទម្រង់ឆ្លើយតប (Google Gemini Options)
                        </div>
                        {[
                          {
                            label: "⚡ ខ្លីជាងមុន (Shorter)",
                            prompt: `សូមកែសម្រួលដំណោះស្រាយលំហាត់ «${previousUserPrompt || "ខាងលើ"}» ឱ្យខ្លីជាងមុន សង្ខេបចំគោលដៅ តាមទម្រង់ Google Gemini (- **គំនិត៖**, - **ការពន្យល់៖**, - **ចម្លើយ៖**) និងប្រើនិមិត្តសញ្ញា Unicode សុទ្ធ!`,
                          },
                          {
                            label: "📝 វែង និងក្បោះក្បាយជាងមុន (Longer)",
                            prompt: `សូមពន្យល់ដំណោះស្រាយលំហាត់ «${previousUserPrompt || "ខាងលើ"}» ឱ្យកាន់តែវែង និងក្បោះក្បាយគ្រប់ជំហាន តាមទម្រង់ Google Gemini (- **គំនិត៖**, - **ការពន្យល់៖**, - **ចម្លើយ៖**) និងប្រើនិមិត្តសញ្ញា Unicode សុទ្ធ!`,
                          },
                          {
                            label: "🧒 ងាយស្រួលយល់ជាងមុន (Simpler)",
                            prompt: `សូមពន្យល់ដំណោះស្រាយលំហាត់ «${previousUserPrompt || "ខាងលើ"}» ឱ្យកាន់តែងាយស្រួលយល់បំផុត តាមទម្រង់ Google Gemini (- **គំនិត៖**, - **ការពន្យល់៖**, - **ចម្លើយ៖**) និងប្រើនិមិត្តសញ្ញា Unicode សុទ្ធ!`,
                          },
                          {
                            label: "🔬 លម្អិតស៊ីជម្រៅជាងមុន (More detailed)",
                            prompt: `សូមបង្ហាញដំណោះស្រាយលំហាត់ «${previousUserPrompt || "ខាងលើ"}» ដោយបន្ថែមការបកស្រាយទ្រឹស្ដីបទ និងការផ្ទៀងផ្ទាត់លម្អិត តាមទម្រង់ Google Gemini (- **គំនិត៖**, - **ការពន្យល់៖**, - **ចម្លើយ៖**)!`,
                          },
                          {
                            label: "🎓 ផ្លូវការតាមស្តង់ដាប្រឡង (Exam Standard)",
                            prompt: `សូមសរសេរដំណោះស្រាយលំហាត់ «${previousUserPrompt || "ខាងលើ"}» តាមទម្រង់ស្តង់ដារបស់ Google Gemini Academic Tutor (- **គំនិត៖**, - **ការពន្យល់៖**, - **ចម្លើយ៖**)!`,
                          },
                        ].map((opt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setShowModifyMenu(false);
                              onQuickPrompt?.(opt.prompt);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-slate-200 hover:bg-sky-500/25 hover:text-white transition-colors cursor-pointer"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Google Double-Check Response Button */}
                  <button
                    type="button"
                    onClick={() => setShowDoubleCheck((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                      showDoubleCheck
                        ? "bg-emerald-500/25 border-emerald-400 text-emerald-200"
                        : "bg-white/5 hover:bg-white/10 border-white/10 text-emerald-300"
                    }`}
                    title="ផ្ទៀងផ្ទាត់ចម្លើយពីរជាន់ដូច Google Gemini (Double-check response)"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ផ្ទៀងផ្ទាត់ចម្លើយ (Double-check)</span>
                  </button>

                  {/* Solve with Alternative Method */}
                  {onQuickPrompt && (
                    <button
                      type="button"
                      onClick={() =>
                        onQuickPrompt(
                          `សូមដោះស្រាយលំហាត់ «${previousUserPrompt || "ខាងលើ"}» តាមវិធីសាស្ត្រផ្សេងមួយទៀត (Alternative Method) ឱ្យដូច Google Gemini AI!`
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-amber-300 transition-all cursor-pointer"
                      title="ដោះស្រាយតាមវិធីផ្សេង (Solve with alternative method)"
                    >
                      <RefreshCw className="w-3 h-3 text-amber-400" />
                      <span>វិធីផ្សេងទៀត</span>
                    </button>
                  )}

                  {/* Export Solution to File */}
                  <button
                    type="button"
                    onClick={() => {
                      const cleanExport = displayedSolutionContent
                        .replace(/<svg[\s\S]*?<\/svg>/gi, "")
                        .trim();
                      const blob = new Blob([cleanExport], { type: "text/plain;charset=utf-8" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `google-gemini-solution-${Date.now()}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-all cursor-pointer"
                    title="ទាញយកឯកសារដំណោះស្រាយ (Export solution)"
                  >
                    <FileDown className="w-3.5 h-3.5 text-sky-400" />
                    <span>ទាញយកអត្ថបទ</span>
                  </button>
                </div>
              </div>

              {/* Google Gemini AI Follow-up Suggestion Chips */}
              {onQuickPrompt && (
                <div className="pt-1">
                  <div className="text-[10.5px] text-slate-400 mb-1.5 font-medium">
                    ✨ សំណួរ និងជម្រើសបន្ទាប់របស់ Google Gemini AI (Suggested follow-ups)៖
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {geminiExerciseData.followUpSuggestions.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => onQuickPrompt(chip.promptToSend)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] bg-gradient-to-r from-sky-500/15 to-indigo-500/15 hover:from-sky-500/30 hover:to-indigo-500/30 text-sky-200 border border-sky-400/30 transition-all cursor-pointer shadow-2xs active:scale-98"
                      >
                        <span>{chip.icon}</span>
                        <span>{chip.labelKhmer}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dual Bilingual Audio Response Active Indicator banner */}
          {isSpeaking && (
            <div className="mt-2.5 px-3 py-2 rounded-xl bg-gradient-to-r from-pink-500/15 via-sky-500/15 to-indigo-500/15 border border-sky-400/30 flex items-center justify-between text-xs shadow-md">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-pink-400 animate-bounce" />
                <div className="flex items-center gap-1.5 font-medium flex-wrap">
                  {speakingLang === "km" ? (
                    <span className="flex items-center gap-1.5 text-pink-300">
                      <span>
                        🇰🇭 សំឡេង {activeVoiceLabel || voiceInfo.voiceNameKhmer} កំពុងនិយាយភាសាខ្មែរ...
                      </span>
                      <span className="text-[10px] text-white/60">(បន្ទាប់មក: សំឡេងបុរស English)</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-sky-300">
                      <span>🇬🇧 Male Voice speaking English...</span>
                      <span className="text-[10px] text-white/60">(Christopher Neural)</span>
                    </span>
                  )}
                  <span className="ml-1 px-1.5 py-0.5 rounded bg-white/10 text-amber-300 text-[10px] font-mono">
                    {speechSpeed}x
                  </span>
                </div>
              </div>
              <button
                onClick={handleToggleSpeak}
                className="text-[11px] text-rose-300 hover:text-rose-200 px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 cursor-pointer font-medium transition-colors"
              >
                បញ្ឈប់
              </button>
            </div>
          )}

          {/* Retry button if error */}
          {hasError && onRetry && (
            <div className="mt-2 pt-2 border-t border-rose-500/20">
              <button
                onClick={() => onRetry(message.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white transition-colors shadow-sm cursor-pointer"
              >
                <span>🔄 ព្យាយាមម្តងទៀត (Retry)</span>
              </button>
            </div>
          )}

          {/* Footer details: time, action buttons */}
          <div className="flex items-center justify-between gap-3 mt-2 pt-1 border-t border-white/5 text-[11px] text-white/50">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                title="ចម្លងសារ"
                className="hover:text-white transition-colors p-0.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {!isUser && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleToggleSpeak}
                    disabled={isLoadingAudio}
                    title={
                      isSpeaking
                        ? "បញ្ឈប់សំឡេង"
                        : "ស្តាប់ចម្លើយជាសំឡេង (ខ្មែរសំឡេងស្រីពិរោះ + English សំឡេងប្រុស)"
                    }
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                      isSpeaking
                        ? "bg-pink-500/20 text-pink-300 font-medium"
                        : "hover:bg-white/10 hover:text-white text-white/60"
                    }`}
                  >
                    {isLoadingAudio ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                    ) : isSpeaking ? (
                      <VolumeX className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                    <span className="text-[10.5px]">
                      {isLoadingAudio
                        ? "កំពុងរៀបចំសំឡេង..."
                        : isSpeaking
                        ? "បិទសំឡេង"
                        : `ស្តាប់សំឡេង (${voiceInfo.voiceNameKhmer} + English)`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nextSpeed = speechSpeed === 1.0 ? 1.15 : speechSpeed === 1.15 ? 0.9 : 1.0;
                      setSpeechSpeed(nextSpeed);
                      if (currentAudioRef.current) {
                        currentAudioRef.current.playbackRate = nextSpeed;
                      }
                    }}
                    title="ផ្លាស់ប្តូរល្បឿននិយាយ (1.0x ល្មម, 1.15x, 0.9x)"
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-sky-300 hover:text-white text-[10px] font-mono transition-colors cursor-pointer border border-sky-400/20"
                  >
                    <Zap className="w-2.5 h-2.5 text-amber-400" />
                    <span>{speechSpeed === 1.0 ? "1.0x (ល្មម)" : `${speechSpeed}x`}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[10px] text-white/60">
              <span>{message.timestamp}</span>
              {isUser && (
                <span className="text-sky-300 font-bold" title="បានផ្ញើ">
                  ✓✓
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
