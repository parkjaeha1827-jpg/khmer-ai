import React, { useState, useEffect, useRef } from "react";
import { Message, ChatImage, ChatAudio } from "./types";
import { TelegramHeader } from "./components/TelegramHeader";
import { MessageItem } from "./components/MessageItem";
import { ChatInput } from "./components/ChatInput";
import { ImageModal } from "./components/ImageModal";
import { TelegramBotModal } from "./components/TelegramBotModal";
import { HelpModal } from "./components/HelpModal";
import { ImageStudioModal } from "./components/ImageStudioModal";
import { OrthographyOcrModal } from "./components/OrthographyOcrModal";
import { SuperCapabilitiesModal, SuperCapabilityTab } from "./components/SuperCapabilitiesModal";
import { TelegramIdChatModal } from "./components/TelegramIdChatModal";
import { RoleplayStudioModal } from "./components/RoleplayStudioModal";
import { VideoStudioModal } from "./components/VideoStudioModal";
import { QrCodeModal } from "./components/QrCodeModal";
import { LiveChatBanner } from "./components/LiveChatBanner";
import {
  universalSendChat,
  universalGetTelegramStatus,
  universalConfigureTelegram,
  universalStopTelegram,
  universalClearAllChats,
  universalFetchTts,
} from "./services/universalClient";
import {
  normalizeKhmerOrthography,
  solveKhmerPromptBuiltIn,
  enforceConciseCasualReply,
  ensureBilingualKhmerEnglishReply,
  buildSilenceFollowUpMessage,
  getCompanionBusyState,
  markCompanionBusyAfterSilence,
  resetCompanionSessionState,
  clearAllCompanionSessions,
  isClearChatCommand,
  isResponseAnAutoDeleteViolation,
} from "./utils/khmerOrthography";
import { Bot } from "lucide-react";

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "assistant",
      text: "សួស្តីចាស/បាទ! 🥰 ស្វាគមន៍មកកាន់ **Khmer Super AI Agent 🇰🇭🇬🇧**។ ខ្ញុំអាចដោះស្រាយបញ្ហាគ្រប់បែបយ៉ាងតាមរយៈ **សំឡេង សារ ឬរូបថត**, សន្ទនា **Gemini Live Voice Chat (ដំណើរការជាប់រហូត និងរហ័សទាន់ចិត្ត)**, **បម្លែងរូបភាពទៅជាអក្សរ (Convert Picture to Text / OCR) បានយ៉ាងល្អ និងមិនខុសអក្ខរាវិរុទ្ធ**, **បកប្រែភាសាបានគ្រប់ភាសានៅទូទាំងពិភពលោក**, **បង្កើតរឿងបែបរន្ធត់ ប្រលោមលោក ឬរឿងនិទានកថា ដោយមានរូបភាពតាមវគ្គនីមួយៗ និងរូបភាពតួអង្គ**, ធ្វើជា **វចនានុក្រម ខ្មែរ-ខ្មែរ អង់គ្លេស-ខ្មែរ និងខ្មែរ-អង់គ្លេស ដោយភ្ជាប់រូបភាព និងឧទាហរណ៍ជាល្បះបង្ហាញបញ្ជាក់**, បង្ហាញ **ព្រឹត្តិការណ៍ប្រចាំថ្ងៃតាមប្រតិទិននៃប្រទេសកម្ពុជាទៅតាមឆ្នាំជាក់ស្ដែង (ថ្ងៃបុណ្យជាតិ បុណ្យអន្តរជាតិ ថ្ងៃឈប់សម្រាក និងទិវាសំខាន់ៗ)**, ទាញយកវីដេអូ **MP4 & MP3** ពី **CapCut, Pinterest, TikTok, YouTube, Facebook** ដោយ **លុប Logo ស្អាត ១០០%**, និង **បកប្រែសំឡេងវីដេអូមកជាភាសាខ្មែរ**! មុននឹងចាប់ផ្ដើម តើបង/អូន **ឈ្មោះអ្វី** ហើយ **ភេទប្រុស ឬ ស្រី** ដែរ? 💖✨\n🇬🇧 English: Hello and welcome! I feature continuous ultra-fast Gemini Live Voice Chat, zero-error Picture-to-Text OCR, Universal World Language Translation, Illustrated Story Generation (Horror, Novel, Folktale with character & episode images), Visual Dictionary (Khmer-Khmer, EN-KM, KM-EN with examples), and Real-Time Cambodia Calendar & Holiday Notifications—what is your name and gender?",
      timestamp: new Date().toLocaleTimeString("km-KH", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [isTyping, setIsTyping] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isLiveChatActive, setIsLiveChatActive] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("livechat") === "1" || params.get("live") === "1";
    }
    return false;
  });
  const [linkedTelegramChatId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("tg_chat_id") || "";
    }
    return "";
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isImageStudioOpen, setIsImageStudioOpen] = useState(false);
  const [isOrthographyModalOpen, setIsOrthographyModalOpen] = useState(false);
  const [isSuperModalOpen, setIsSuperModalOpen] = useState(false);
  const [superModalTab, setSuperModalTab] = useState<SuperCapabilityTab>("translator");
  const [isRoleplayModalOpen, setIsRoleplayModalOpen] = useState(false);
  const [isVideoStudioOpen, setIsVideoStudioOpen] = useState(false);
  const [isQrStudioOpen, setIsQrStudioOpen] = useState(false);
  const [isRoleplaying, setIsRoleplaying] = useState(false);
  const [isIdChatModalOpen, setIsIdChatModalOpen] = useState(false);
  const [idChatTargetId, setIdChatTargetId] = useState<string>(linkedTelegramChatId);
  const [studioInitialImage, setStudioInitialImage] = useState<ChatImage | null>(null);
  const [telegramStatus, setTelegramStatus] = useState<{ active: boolean; botUsername?: string }>({
    active: false,
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const silenceProbeCountRef = useRef<number>(0);
  const lastUserTextRef = useRef<string>("");
  const messagesRef = useRef<Message[]>(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const handleOpenSuperModal = (tab: SuperCapabilityTab) => {
    setSuperModalTab(tab);
    setIsSuperModalOpen(true);
  };

  // Scroll to bottom when messages change or typing
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // រក្សាភាពស្ងៀមស្ងាត់នៅពេលអ្នកប្រើប្រាស់មិនបានតបឆាត (មិនសួរនាំ ឬរំខានដោយស្វ័យប្រវត្តិឡើយ)

  // Check Telegram Bot status and URL studio deep-link parameters on mount
  useEffect(() => {
    universalGetTelegramStatus()
      .then((data) => {
        if (data.active) {
          setTelegramStatus({ active: true, botUsername: data.botUsername });
        }
      })
      .catch(() => {});

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const studioParam = (params.get("studio") || "").toLowerCase();
      if (studioParam === "ocr" || studioParam === "spell") {
        setIsOrthographyModalOpen(true);
      } else if (
        studioParam === "translator" ||
        studioParam === "story" ||
        studioParam === "dictionary" ||
        studioParam === "calendar"
      ) {
        setSuperModalTab(studioParam as SuperCapabilityTab);
        setIsSuperModalOpen(true);
      } else if (studioParam === "idchat" || studioParam === "chatto" || studioParam === "messenger") {
        setIsIdChatModalOpen(true);
      } else if (studioParam === "image") {
        setIsImageStudioOpen(true);
      } else if (studioParam === "roleplay" || studioParam === "act" || studioParam === "drama") {
        setIsRoleplayModalOpen(true);
      } else if (
        studioParam === "video" ||
        studioParam === "talking" ||
        studioParam === "photovideo" ||
        studioParam === "avatar"
      ) {
        setIsVideoStudioOpen(true);
      } else if (studioParam === "qr" || studioParam === "qrcode" || studioParam === "qrfile") {
        setIsQrStudioOpen(true);
      }
      const solveParam = (params.get("solve") || "").trim();
      if (solveParam) {
        setTimeout(() => {
          handleSendMessage(solveParam, undefined, undefined, undefined, true);
        }, 150);
      }
    }
  }, []);

  // Configure Telegram Bot
  const handleConfigureTelegram = async (token: string) => {
    const res = await universalConfigureTelegram(token);
    if (res.success && res.bot) {
      setTelegramStatus({ active: true, botUsername: res.bot.username });
    }
    return res;
  };

  // Stop Telegram Bot
  const handleStopTelegram = async () => {
    await universalStopTelegram();
    setTelegramStatus({ active: false });
  };

  // Thoroughly clear all old chats from before (សម្អាតឆាតចាស់ៗតាំងពីមុនទាំងអស់) without window.confirm (iframe-safe)
  const handleClearChat = () => {
    setIsTyping(false);
    silenceProbeCountRef.current = 0;
    lastUserTextRef.current = "";

    // Stop any active speech or audio playback
    try {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      document.querySelectorAll("audio").forEach((a) => {
        try {
          a.pause();
          a.currentTime = 0;
        } catch {}
      });
    } catch {}

    // Clear all local & server companion/chat sessions
    resetCompanionSessionState("web_client_session");
    resetCompanionSessionState("web_chat_session");
    resetCompanionSessionState("default_web");
    clearAllCompanionSessions();
    universalClearAllChats().catch(() => {});

    setMessages([
      {
        id: `welcome-reset-${Date.now()}`,
        role: "assistant",
        text: "🧹✨ **ឆាតចាស់ៗត្រូវបានសម្អាតរួចរាល់!** មុននឹងចាប់ផ្ដើមសន្ទនាថ្មី តើបង/អូន **ឈ្មោះអ្វី** ហើយ **ភេទប្រុស ឬ ស្រី** ដែរ? 🥰💖\n🇬🇧 English: All previous chat history has been cleared! Before we start fresh, what is your name and are you male or female?",
        timestamp: new Date().toLocaleTimeString("km-KH", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const handleOpenImageStudio = (img?: ChatImage | null) => {
    setStudioInitialImage(img || null);
    setIsImageStudioOpen(true);
  };

  const handleSendGeneratedFromStudio = (
    promptText: string,
    generatedImg: ChatImage,
    replyText: string
  ) => {
    const nowTime = new Date().toLocaleTimeString("km-KH", { hour: "2-digit", minute: "2-digit" });
    const userMsg: Message = {
      id: `user-studio-${Date.now()}`,
      role: "user",
      text: promptText,
      timestamp: nowTime,
    };
    const botMsg: Message = {
      id: `bot-studio-${Date.now() + 1}`,
      role: "assistant",
      text: replyText,
      generatedImage: generatedImg,
      timestamp: nowTime,
    };
    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  const handleDirectBotReply = (userText: string, botMarkdown: string) => {
    const nowTime = new Date().toLocaleTimeString("km-KH", { hour: "2-digit", minute: "2-digit" });
    const shouldAutoDelete = isResponseAnAutoDeleteViolation(botMarkdown);
    const cleanBotMarkdown = botMarkdown.replace(/\[AUTO_DELETE_VIOLATION\]\s*/gi, "").trim();
    const userMsg: Message = {
      id: `user-dub-${Date.now()}`,
      role: "user",
      text: userText,
      timestamp: nowTime,
    };
    const botMsg: Message = {
      id: `bot-dub-${Date.now() + 1}`,
      role: "assistant",
      text: cleanBotMarkdown,
      timestamp: nowTime,
    };
    setMessages((prev) => (shouldAutoDelete ? [...prev, botMsg] : [...prev, userMsg, botMsg]));
  };

  // Send message with streaming response (and automatic AI image generation/editing support)
  const handleSendMessage = async (
    text: string,
    image?: ChatImage,
    audio?: ChatAudio,
    category?: string,
    allowDuringLive = false
  ): Promise<string> => {
    if (isTyping && !allowDuringLive) return "";
    if (!image && !audio && isClearChatCommand(text)) {
      handleClearChat();
      return "";
    }
    // Check if user requested to toggle Live Chat via text/voice command
    if (!image && /^(?:\/stoplive|បិទ\s*live(?:\s*chat)?|ឈប់\s*live(?:\s*chat)?|stop\s*live\s*chat)$/i.test(text.trim())) {
      setIsLiveChatActive(false);
      return "";
    }
    if (!image && /^(?:\/live|\/livechat|បើក\s*live(?:\s*chat)?|start\s*live\s*chat)$/i.test(text.trim())) {
      setIsLiveChatActive(true);
      return "";
    }
    silenceProbeCountRef.current = 0;
    lastUserTextRef.current = text;

    // Also inherit the most recent image from chat history if the user asks to edit "this image" without re-attaching
    const currentMessages = messagesRef.current;
    let effectiveImage = image;
    if (!effectiveImage && /(?:កែរូប|ប្តូរផ្ទៃ|កែទៅជា|បន្ថែមលើរូប|edit\s+image|edit\s+this)/i.test(text)) {
      for (let i = currentMessages.length - 1; i >= 0; i--) {
        if (currentMessages[i].generatedImage) {
          effectiveImage = currentMessages[i].generatedImage;
          break;
        }
        if (currentMessages[i].image) {
          effectiveImage = currentMessages[i].image;
          break;
        }
      }
    }

    const userMessageId = `user-${Date.now()}`;
    const botMessageId = `bot-${Date.now()}`;
    const startTime = Date.now();

    const newMsg: Message = {
      id: userMessageId,
      role: "user",
      text: text,
      timestamp: new Date().toLocaleTimeString("km-KH", { hour: "2-digit", minute: "2-digit" }),
      image: image,
      audio: audio,
      subjectCategory: category,
    };

    const updatedHistory = [...currentMessages, newMsg];
    setMessages(updatedHistory);
    messagesRef.current = updatedHistory;
    setIsTyping(true);

    // Placeholder bot message for streaming text
    const initialBotMessage: Message = {
      id: botMessageId,
      role: "assistant",
      text: "",
      timestamp: new Date().toLocaleTimeString("km-KH", { hour: "2-digit", minute: "2-digit" }),
      subjectCategory: category,
    };

    setMessages((prev) => [...prev, initialBotMessage]);

    try {
      // Build clean multi-turn conversation history for API (strip large SVGs & assistant images from old turns)
      const validHistory = updatedHistory
        .filter((m) => !m.id.startsWith("welcome-") && !m.text.includes("⚠️"))
        .slice(-10);

      const conversationPayload = validHistory.map((m, idx, arr) => {
        const isLastUser = idx === arr.length - 1 && m.role === "user";
        const rawImg = isLastUser ? effectiveImage : m.role === "user" ? m.image : undefined;
        const validImg =
          rawImg && rawImg.data && rawImg.mimeType !== "image/svg+xml"
            ? {
                data: rawImg.data,
                mimeType: rawImg.mimeType,
              }
            : undefined;

        const cleanText =
          m.role === "assistant"
            ? m.text.replace(/<svg[\s\S]*?<\/svg>/gi, "[គំនូសបំព្រួញពន្យល់លំហាត់]")
            : m.text;

        return {
          role: m.role,
          text: cleanText,
          image: validImg,
          audio:
            isLastUser && m.audio
              ? {
                  data: m.audio.data,
                  mimeType: m.audio.mimeType,
                }
              : undefined,
        };
      });

      let accumulatedText = "";

      await universalSendChat({
        messages: conversationPayload,
        userMood: category,
        emotionTone: category,
        onDeleteUserMessage: () => {
          setMessages((prev) => prev.filter((msg) => msg.id !== userMessageId));
        },
        onTranscriptUpdate: (serverTranscript) => {
          if (serverTranscript && serverTranscript.trim()) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === userMessageId
                  ? { ...msg, text: normalizeKhmerOrthography(serverTranscript.trim()) }
                  : msg
              )
            );
          }
        },
        onChunk: (chunkText) => {
          accumulatedText = normalizeKhmerOrthography(accumulatedText + chunkText);
          if (isResponseAnAutoDeleteViolation(accumulatedText)) {
            setMessages((prev) => prev.filter((msg) => msg.id !== userMessageId));
          }
          const cleanDisplay = accumulatedText.replace(/\[AUTO_DELETE_VIOLATION\]\s*/gi, "");
          const elapsedMs = Date.now() - startTime;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId
                ? {
                    ...msg,
                    text: cleanDisplay,
                    durationMs: elapsedMs,
                  }
                : msg
            )
          );
        },
        onGeneratedImage: (genImgData) => {
          const elapsedMs = Date.now() - startTime;
          const genImg: ChatImage = {
            data: genImgData.data,
            mimeType: genImgData.mimeType || "image/jpeg",
            previewUrl: `data:${genImgData.mimeType || "image/jpeg"};base64,${genImgData.data}`,
            name: "Khmer_AI_Image.jpg",
          };
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId
                ? {
                    ...msg,
                    generatedImage: genImg,
                    durationMs: elapsedMs,
                  }
                : msg
            )
          );
        },
      });

      let finalReplyToReturn = accumulatedText;
      if (accumulatedText.trim()) {
        const finalConciseText = ensureBilingualKhmerEnglishReply(
          enforceConciseCasualReply(accumulatedText, text, "web_client_session"),
          text,
          "web_client_session"
        );
        finalReplyToReturn = finalConciseText;
        if (finalConciseText !== accumulatedText) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId
                ? {
                    ...msg,
                    text: finalConciseText,
                  }
                : msg
            )
          );
        }

        // If user asked via voice (even when LiveChatBanner isn't open), automatically play voice reply right away!
        if (audio && !isLiveChatActive) {
          setIsRecordingVoice(true);
          universalFetchTts(finalConciseText, "web_client_session")
            .then((tts) => {
              if (tts?.khmerAudio) {
                const aKm = new Audio(`data:audio/mpeg;base64,${tts.khmerAudio}`);
                aKm.onended = () => {
                  if (tts.englishAudio) {
                    const aEn = new Audio(`data:audio/mpeg;base64,${tts.englishAudio}`);
                    aEn.onended = () => setIsRecordingVoice(false);
                    aEn.play().catch(() => setIsRecordingVoice(false));
                  } else {
                    setIsRecordingVoice(false);
                  }
                };
                aKm.play().catch(() => setIsRecordingVoice(false));
              } else {
                setIsRecordingVoice(false);
              }
            })
            .catch(() => setIsRecordingVoice(false));
        }

        // If opened from Telegram Bot's Hands-Free Live Chat button (?livechat=1&tg_chat_id=...), also sync the voice + text reply to Telegram!
        if (linkedTelegramChatId) {
          fetch("/api/telegram/live-turn", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chatId: linkedTelegramChatId,
              userSpokenText: text,
              botReplyText: finalConciseText,
            }),
          }).catch(() => {});
        }
      }
      return finalReplyToReturn;
    } catch {
      const elapsedMs = Date.now() - startTime;
      const fallbackAnswer = ensureBilingualKhmerEnglishReply(
        normalizeKhmerOrthography(solveKhmerPromptBuiltIn(text, "web_client_session")),
        text,
        "web_client_session"
      );
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId
            ? {
                ...msg,
                text: fallbackAnswer,
                durationMs: elapsedMs,
              }
            : msg
        )
      );
      return fallbackAnswer;
    } finally {
      setIsTyping(false);
    }
  };

  // Retry previous message if error occurs
  const handleRetry = (errorBotMsgId: string) => {
    const errorIndex = messages.findIndex((m) => m.id === errorBotMsgId);
    if (errorIndex > 0) {
      const userMessage = messages[errorIndex - 1];
      if (userMessage && userMessage.role === "user") {
        setMessages((prev) =>
          prev.filter((m) => m.id !== errorBotMsgId && m.id !== userMessage.id)
        );
        handleSendMessage(
          userMessage.text,
          userMessage.image,
          userMessage.audio,
          userMessage.subjectCategory
        );
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#0e1621] text-[#f5f5f5] overflow-hidden select-text">
      {/* Header */}
      <TelegramHeader
        isTyping={isTyping}
        isRecordingVoice={isRecordingVoice}
        telegramActive={telegramStatus.active}
        botUsername={telegramStatus.botUsername}
        isLiveChatActive={isLiveChatActive}
        onToggleLiveChat={() => setIsLiveChatActive((prev) => !prev)}
        onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
        onOpenImageStudio={() => handleOpenImageStudio(null)}
        onOpenOrthographyModal={() => setIsOrthographyModalOpen(true)}
        onOpenRoleplayModal={() => setIsRoleplayModalOpen(true)}
        onOpenVideoStudio={() => setIsVideoStudioOpen(true)}
        onOpenQrStudio={() => setIsQrStudioOpen(true)}
        onOpenSuperModal={handleOpenSuperModal}
        onOpenIdChatModal={() => setIsIdChatModalOpen(true)}
        onClearChat={handleClearChat}
        onOpenHelpModal={() => setIsHelpModalOpen(true)}
      />

      {/* Continuous Hands-Free Gemini Live Chat Banner */}
      <LiveChatBanner
        isLiveActive={isLiveChatActive}
        onToggleLive={setIsLiveChatActive}
        isBotTyping={isTyping}
        onDirectLiveTurnComplete={(userSpokenText: string, botReplyText: string) => {
          handleDirectBotReply(userSpokenText, botReplyText);
          if (linkedTelegramChatId) {
            fetch("/api/telegram/live-turn", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chatId: linkedTelegramChatId,
                userSpokenText,
                botReplyText,
              }),
            }).catch(() => {});
          }
        }}
        onSendSpokenMessage={(voiceText: string, audioPayload?: { data: string; mimeType: string }) =>
          handleSendMessage(
            voiceText,
            undefined,
            audioPayload ? { data: audioPayload.data, mimeType: audioPayload.mimeType } : undefined,
            undefined,
            true
          )
        }
      />

      {/* Main Chat Area with Telegram patterned background */}
      <main
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 space-y-2 relative"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(27, 40, 56, 0.4) 0%, rgba(14, 22, 33, 0.95) 100%)`,
        }}
      >
        <div className="max-w-4xl mx-auto w-full">
          {/* Messages list */}
          {messages.map((message, idx) => {
            let prevUserText = "";
            if (message.role === "assistant") {
              for (let j = idx - 1; j >= 0; j--) {
                if (messages[j]?.role === "user" && messages[j]?.text) {
                  prevUserText = messages[j].text;
                  break;
                }
              }
            }
            return (
              <MessageItem
                key={message.id}
                message={message}
                previousUserPrompt={prevUserText}
                onImageClick={(url) => setSelectedImage(url)}
                onEditImage={(img) => handleOpenImageStudio(img)}
                onRetry={handleRetry}
                onQuickPrompt={(promptText) => {
                  handleSendMessage(promptText);
                }}
              />
            );
          })}

          {/* Typing....... Indicator at bottom until operation finishes */}
          {isTyping && (
            <div className="flex items-center gap-2.5 px-3 py-2.5 my-1.5 text-xs sm:text-sm text-sky-300 font-bold animate-pulse">
              <div className="w-7 h-7 rounded-full bg-sky-500/25 border border-sky-400/40 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-sky-300" />
              </div>
              <div className="bg-[#182533] px-4 py-2 rounded-2xl border border-sky-400/35 flex items-center gap-2 shadow-md">
                <span className="text-emerald-300 font-extrabold tracking-wide">Typing.......</span>
                <span className="text-white/65 text-[11px] font-normal">
                  (កំពុងដំណើរការតាមការបញ្ជារបស់អ្នក...)
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Chat Input Bar */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onDirectBotReply={handleDirectBotReply}
        onOpenImageStudio={(img) => handleOpenImageStudio(img)}
        onOpenOrthographyModal={() => setIsOrthographyModalOpen(true)}
        onOpenVideoStudio={() => setIsVideoStudioOpen(true)}
        onOpenQrStudio={() => setIsQrStudioOpen(true)}
        onOpenSuperModal={handleOpenSuperModal}
        onOpenIdChatModal={(targetGrpId?: string) => {
          if (targetGrpId) setIdChatTargetId(targetGrpId);
          setIsIdChatModalOpen(true);
        }}
        isLiveChatActive={isLiveChatActive}
        onToggleLiveChat={() => setIsLiveChatActive((prev) => !prev)}
        isLoading={isTyping}
      />

      {/* Telegram Bot Chat to Someone by ID Chat Modal (Autonomous & Commanded) */}
      <TelegramIdChatModal
        isOpen={isIdChatModalOpen}
        onClose={() => setIsIdChatModalOpen(false)}
        defaultTargetChatId={idChatTargetId || linkedTelegramChatId}
      />

      {/* Super Capabilities Studio Modal (World Translator, Story Generator, Visual Dictionary, Cambodia Calendar) */}
      <SuperCapabilitiesModal
        isOpen={isSuperModalOpen}
        initialTab={superModalTab}
        onClose={() => setIsSuperModalOpen(false)}
        onSendResultToChat={handleDirectBotReply}
      />

      {/* Roleplay & Conversational Dramatic Acting Studio Modal */}
      <RoleplayStudioModal
        isOpen={isRoleplayModalOpen}
        onClose={() => setIsRoleplayModalOpen(false)}
        onStartRoleplay={(p) => {
          setIsRoleplaying(true);
          handleSendMessage(p);
        }}
        onStopRoleplay={() => {
          setIsRoleplaying(false);
          handleSendMessage("/exit_roleplay");
        }}
        isCurrentlyRoleplaying={isRoleplaying}
      />

      {/* Video Studio AI Modal (Talking Head with Gestures & Khmer Voice) */}
      <VideoStudioModal
        isOpen={isVideoStudioOpen}
        onClose={() => setIsVideoStudioOpen(false)}
        onSendResultToChat={handleDirectBotReply}
      />

      {/* Universal QR Code Studio Modal (Text, Image, Video, Word, Excel, PDF, PPTX) */}
      <QrCodeModal
        isOpen={isQrStudioOpen}
        onClose={() => setIsQrStudioOpen(false)}
        onSendResultToChat={handleDirectBotReply}
      />

      {/* Full Image Zoom Modal */}
      <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />

      {/* Orthography, Grammar & Image-to-Text (OCR) Studio Modal */}
      <OrthographyOcrModal
        isOpen={isOrthographyModalOpen}
        onClose={() => setIsOrthographyModalOpen(false)}
        onSendToChat={handleDirectBotReply}
      />

      {/* AI Image Generation & Photo Editing Studio Modal */}
      <ImageStudioModal
        isOpen={isImageStudioOpen}
        onClose={() => setIsImageStudioOpen(false)}
        initialImage={studioInitialImage}
        onSendGeneratedToChat={handleSendGeneratedFromStudio}
      />

      {/* Telegram Bot Connector Modal */}
      <TelegramBotModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
        telegramActive={telegramStatus.active}
        botUsername={telegramStatus.botUsername}
        onConfigureBot={handleConfigureTelegram}
        onStopBot={handleStopTelegram}
      />

      {/* Help / Capabilities Modal */}
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </div>
  );
}
