import React from "react";
import { Bot, CheckCircle, Trash2, HelpCircle, SendHorizontal, Wand2, Radio, PhoneOff, SpellCheck, Globe, BookOpen, Calendar, Film, MessageSquare, Clapperboard, Video, QrCode, Binary, Hash } from "lucide-react";

interface TelegramHeaderProps {
  isTyping: boolean;
  isRecordingVoice?: boolean;
  telegramActive: boolean;
  botUsername?: string;
  isLiveChatActive?: boolean;
  onToggleLiveChat?: () => void;
  onOpenTelegramModal: () => void;
  onOpenImageStudio: () => void;
  onOpenOrthographyModal?: () => void;
  onOpenRoleplayModal?: () => void;
  onOpenVideoStudio?: () => void;
  onOpenQrStudio?: () => void;
  onOpenSuperModal?: (tab: "translator" | "story" | "dictionary" | "calendar" | "talking_photo" | "decimal") => void;
  onOpenIdChatModal?: () => void;
  onClearChat: () => void;
  onOpenHelpModal: () => void;
}

export const TelegramHeader: React.FC<TelegramHeaderProps> = ({
  isTyping,
  isRecordingVoice = false,
  telegramActive,
  botUsername,
  isLiveChatActive = false,
  onToggleLiveChat,
  onOpenTelegramModal,
  onOpenImageStudio,
  onOpenOrthographyModal,
  onOpenRoleplayModal,
  onOpenVideoStudio,
  onOpenQrStudio,
  onOpenSuperModal,
  onOpenIdChatModal,
  onClearChat,
  onOpenHelpModal,
}) => {
  return (
    <header className="w-full bg-[#17212b] border-b border-white/10 px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-sm sticky top-0 z-30">
      {/* Left: Bot Profile & Status */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 p-[1.5px] shadow-sm flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-[#17212b] flex items-center justify-center text-sky-400">
              <Bot className="w-5 h-5" />
            </div>
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#17212b]"></span>
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-semibold text-white text-[15px] sm:text-base tracking-wide flex items-center gap-1">
              Khmer Super AI Agent
              <CheckCircle className="w-4 h-4 text-sky-400 fill-sky-400/20" />
            </h1>
            <span className="text-xs">🇰🇭</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            {isRecordingVoice ? (
              <span className="text-amber-400 font-semibold flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-ping"></span>
                recording voice<span className="tracking-widest">.....</span>
              </span>
            ) : isTyping ? (
              <span className="text-sky-400 font-semibold flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-sky-400 inline-block animate-ping"></span>
                typing<span className="tracking-widest">.....</span>
              </span>
            ) : (
              <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-sm shadow-emerald-400/50"></span>
                online
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Continuous Live Chat Toggle Button */}
        {onToggleLiveChat && (
          <button
            onClick={onToggleLiveChat}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              isLiveChatActive
                ? "bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 shadow-md shadow-rose-600/30 animate-pulse"
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 hover:bg-emerald-500/30"
            }`}
            title={
              isLiveChatActive
                ? "ចុចបិទប៊ូតុងនេះដើម្បីបិទ Live Chat"
                : "ចុចនិយាយ Live Chat សន្ទនាឆ្លើយឆ្លងទៅវិញទៅមកជាប់រហូត"
            }
          >
            {isLiveChatActive ? (
              <>
                <PhoneOff className="w-3.5 h-3.5" />
                <span>🔴 បិទ Live Chat</span>
              </>
            ) : (
              <>
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">🎙️ ចុចនិយាយ Live Chat</span>
                <span className="sm:hidden">🎙️ Live Chat</span>
              </>
            )}
          </button>
        )}

        {/* Roleplay Dialogue Studio Button */}
        {onOpenRoleplayModal && (
          <button
            onClick={onOpenRoleplayModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-400/40 hover:bg-purple-500/30 transition-all cursor-pointer shadow-sm"
            title="ស្ទូឌីយោសម្ដែងក្នុងការសន្ទនា (Roleplay Dialogue Studio)"
          >
            <Clapperboard className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">🎭 សម្ដែង (Roleplay)</span>
            <span className="sm:hidden">🎭 សម្ដែង</span>
          </button>
        )}

        {/* Video Studio AI Button (Talking Head with Gestures) */}
        {onOpenVideoStudio && (
          <button
            onClick={onOpenVideoStudio}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium bg-rose-500/20 text-rose-300 border border-rose-400/40 hover:bg-rose-500/30 transition-all cursor-pointer shadow-sm"
            title="ស្ទូឌីយោវីដេអូរូបភាពនិយាយ (Talking Head Video Studio) មានកាយវិការរស់រវើក"
          >
            <Video className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">🎬 រូបភាពនិយាយ</span>
            <span className="sm:hidden">🎬 វីដេអូ</span>
          </button>
        )}

        {/* QR Code Studio Button (Text, Image, Video, Word, Excel, PDF, PPTX) */}
        {onOpenQrStudio && (
          <button
            onClick={onOpenQrStudio}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium bg-sky-500/20 text-sky-300 border border-sky-400/40 hover:bg-sky-500/30 transition-all cursor-pointer shadow-sm"
            title="ស្ទូឌីយោបង្កើត QR Code ឆ្លាតវៃពី អក្សរ, រូបភាព, វីដេអូ, Word, Excel, PDF, PPTX"
          >
            <QrCode className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">📱 QR Code</span>
            <span className="sm:hidden">QR</span>
          </button>
        )}

        {/* Orthography & Image OCR Studio Button */}
        {onOpenOrthographyModal && (
          <button
            onClick={onOpenOrthographyModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium bg-teal-500/20 text-teal-300 border border-teal-400/40 hover:bg-teal-500/30 transition-all cursor-pointer"
            title="ត្រួតពិនិត្យអក្ខរាវិរុទ្ធ វេយ្យាករណ៍ និងបម្លែងរូបភាពនៃអត្ថបទទៅជាអក្សរ (OCR)"
          >
            <SpellCheck className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden lg:inline">អក្ខរាវិរុទ្ធ &amp; OCR</span>
            <span className="lg:hidden">OCR/អក្ខរាវិរុទ្ធ</span>
          </button>
        )}

        {/* Super Capabilities Quick Buttons */}
        {onOpenSuperModal && (
          <>
            <button
              onClick={() => onOpenSuperModal("translator")}
              className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30 transition-all cursor-pointer"
              title="បកប្រែភាសាបានគ្រប់ភាសានៅទូទាំងពិភពលោក"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>បកប្រែពិភពលោក</span>
            </button>
            <button
              onClick={() => onOpenSuperModal("story")}
              className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-400/40 hover:bg-purple-500/30 transition-all cursor-pointer"
              title="បង្កើតរឿងរន្ធត់ ប្រលោមលោក ឬនិទានកថា + រូបភាពតាមវគ្គ & តួអង្គ"
            >
              <Film className="w-3.5 h-3.5 text-purple-400" />
              <span>បង្កើតរឿង</span>
            </button>
            <button
              onClick={() => onOpenSuperModal("dictionary")}
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-400/40 hover:bg-amber-500/30 transition-all cursor-pointer"
              title="វចនានុក្រម ខ្មែរ-ខ្មែរ អង់គ្លេស-ខ្មែរ និងខ្មែរ-អង់គ្លេស + រូបភាព & ឧទាហរណ៍ល្បះ"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>វចនានុក្រម</span>
            </button>
            <button
              onClick={() => onOpenSuperModal("calendar")}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 hover:bg-emerald-500/30 transition-all cursor-pointer"
              title="ប្រតិទិនកម្ពុជា និងអ្នកជូនដំណឹងថ្ងៃបុណ្យជាតិ បុណ្យអន្តរជាតិ និងថ្ងៃឈប់សម្រាក"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">ប្រតិទិនកម្ពុជា</span>
            </button>
            <button
              onClick={() => onOpenSuperModal("decimal")}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium bg-violet-500/20 text-violet-300 border border-violet-400/40 hover:bg-violet-500/30 transition-all cursor-pointer shadow-sm"
              title="ប្ដូរអក្សរទៅជាលេខប្រព័ន្ធគោលដប់ និងប្ដូរពីលេខក្នុងប្រព័ន្ធគោលដប់ទៅជាអក្សរវិញ (Base-10 Decimal Converter)"
            >
              <Binary className="w-3.5 h-3.5 text-violet-400" />
              <span className="hidden sm:inline">ប្ដូរលេខ ⇄ អក្សរ</span>
              <span className="sm:hidden">គោលដប់</span>
            </button>
          </>
        )}

        {/* Telegram Chat to Someone by ID Chat Button */}
        {onOpenIdChatModal && (
          <button
            onClick={onOpenIdChatModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium bg-pink-500/20 text-pink-300 border border-pink-400/40 hover:bg-pink-500/30 transition-all cursor-pointer"
            title="បញ្ជាឱ្យ Telegram Bot ឆាតទៅកាន់អ្នកដទៃតាម ID Chat (ឱ្យវានិយាយខ្លួនឯង និងបញ្ជាពីយើង)"
          >
            <MessageSquare className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden md:inline">ឆាតតាម ID Chat</span>
            <span className="md:hidden">ID Chat</span>
          </button>
        )}

        {/* AI Image Studio Button */}
        <button
          onClick={onOpenImageStudio}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 hover:bg-indigo-500/30 transition-all cursor-pointer"
          title="បង្កើតរូបភាពថ្មី ឬកែរូបភាពតាមការចង់បានដោយ AI"
        >
          <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">បង្កើត/កែរូបភាព</span>
          <span className="md:hidden">រូបភាព AI</span>
        </button>

        {/* Telegram Bot Connector status button */}
        <button
          onClick={onOpenTelegramModal}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
            telegramActive
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
              : "bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30"
          }`}
          title="តភ្ជាប់ Telegram Bot ពិតប្រាកដ ១០០%"
        >
          <SendHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {telegramActive ? `Telegram: @${botUsername}` : "តភ្ជាប់ Telegram Bot"}
          </span>
          <span className="sm:hidden">
            {telegramActive ? "ភ្ជាប់រួច" : "Telegram"}
          </span>
          {telegramActive && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          )}
        </button>

        {/* Clear old chats (សម្អាតឆាតចាស់ៗ) */}
        <button
          onClick={onClearChat}
          title="សម្អាតឆាតចាស់ៗតាំងពីមុនទាំងអស់"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium bg-rose-500/20 text-rose-300 border border-rose-400/40 hover:bg-rose-500/30 transition-all cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          <span>សម្អាតឆាតចាស់ៗ</span>
        </button>

        {/* Help / Guide */}
        <button
          onClick={onOpenHelpModal}
          title="ការណែនាំ និងសមត្ថភាពទាំងអស់"
          className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-sky-400 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
