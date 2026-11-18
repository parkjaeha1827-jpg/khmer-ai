import React, { useState, useRef } from "react";
import {
  X,
  SpellCheck,
  ScanText,
  Upload,
  Copy,
  Check,
  Sparkles,
  Loader2,
  Send,
  FileText,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Languages,
} from "lucide-react";

export interface OrthographyErrorItem {
  wrong: string;
  correct: string;
  rule: string;
}

export interface OrthographyOcrResponse {
  ok: boolean;
  mode?: string;
  hasImage?: boolean;
  detectedLanguage: string;
  extractedText: string;
  correctedText: string;
  errorCount: number;
  errors: OrthographyErrorItem[];
  grammarSummaryKhmer: string;
  englishSummary: string;
}

interface OrthographyOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (userPrompt: string, botReplyMarkdown: string) => void;
}

const SAMPLE_TEXTS = [
  {
    label: "🇰🇭 ឧទាហរណ៍អក្ខរាវិរុទ្ធខ្មែរទី១",
    text: "សូមជួយត្រួតពិនិត្យអក្ខរាវិរុទ្ធ៖ ខ្ញុំកំពង់រៀនភាសាខ្មែរអោយបានពូកែ ដើម្បីអនាគត់ដ៏រុងរឿង និងជួយអភិវឌ្ឍន៍ប្រទេសជាតិ។",
  },
  {
    label: "🇰🇭 ឧទាហរណ៍វេយ្យាករណ៍ខ្មែរទី២",
    text: "សិស្សានុសិស្សទាំងអស់គ្នាត្រូវខិតខំប្រឹងប្រែងសិក្សារៀនសូត្រ និងគោរពវិន័យសាលាអោយបានល្អប្រសើរ ព្រោះចំណេះវិជ្ជាជាទ្រព្យដ៏មានតំលៃបំផុត។",
  },
  {
    label: "🇬🇧 English Grammar Sample",
    text: "She don't have enough informations about the project, so we needs to discus it more careful tomorrow morning.",
  },
];

export const OrthographyOcrModal: React.FC<OrthographyOcrModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [activeTab, setActiveTab] = useState<"spellcheck" | "ocr">("spellcheck");
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<{
    data: string;
    mimeType: string;
    previewUrl: string;
    name: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<OrthographyOcrResponse | null>(null);
  const [copiedExtracted, setCopiedExtracted] = useState(false);
  const [copiedCorrected, setCopiedCorrected] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("សូមជ្រើសរើសហ្វាល់រូបភាព (JPG, PNG, WEBP) សម្រាប់បម្លែងជាអក្សរ (OCR)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
      setSelectedImage({
        data: base64,
        mimeType: file.type || "image/jpeg",
        previewUrl: dataUrl,
        name: file.name || "text_image.jpg",
      });
      setErrorMsg(null);
      setActiveTab("ocr");
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleImageFile(file);
          break;
        }
      }
    }
  };

  const handleRunAnalysis = async () => {
    if (activeTab === "spellcheck" && !inputText.trim() && !selectedImage) {
      setErrorMsg("សូមបញ្ចូលអត្ថបទដែលអ្នកចង់ត្រួតពិនិត្យអក្ខរាវិរុទ្ធ និងវេយ្យាករណ៍ជាមុនសិន!");
      return;
    }
    if (activeTab === "ocr" && !selectedImage && !inputText.trim()) {
      setErrorMsg("សូមបង្ហោះរូបភាពនៃអត្ថបទ (Upload ឬ Paste រូបភាព) ដើម្បីបម្លែងទៅជាអក្សរសម្រាប់ចម្លង!");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/orthography/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText.trim(),
          imageBase64: activeTab === "ocr" || selectedImage ? selectedImage?.data || "" : "",
          mimeType: selectedImage?.mimeType || "image/jpeg",
          mode: activeTab === "ocr" ? "ocr_and_spellcheck" : "spellcheck",
        }),
      });

      const data = await response.json();
      if (!response.ok || !data || data.ok === false) {
        throw new Error(data?.error || "មិនអាចត្រួតពិនិត្យអក្ខរាវិរុទ្ធ ឬបម្លែងរូបភាពជាអក្សរបានទេ");
      }

      setResult(data);
    } catch (err: any) {
      setErrorMsg(err?.message || "មានបញ្ហាបច្ចេកទេស សូមព្យាយាមម្ដងទៀត");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (textToCopy: string, type: "extracted" | "corrected") => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    if (type === "extracted") {
      setCopiedExtracted(true);
      setTimeout(() => setCopiedExtracted(false), 2200);
    } else {
      setCopiedCorrected(true);
      setTimeout(() => setCopiedCorrected(false), 2200);
    }
  };

  const handleInsertIntoChat = () => {
    if (!result || !onSendToChat) return;
    const payload = encodeURIComponent(JSON.stringify(result));
    const userLabel = result.hasImage
      ? `📋🔍 សូមបម្លែងរូបភាពនៃអត្ថបទទៅជាអក្សរ (OCR) និងត្រួតពិនិត្យអក្ខរាវិរុទ្ធ`
      : `📝🇰🇭 សូមត្រួតពិនិត្យអក្ខរាវិរុទ្ធ និងវេយ្យាករណ៍៖ "${inputText.slice(0, 80)}..."`;
    const botMd =
      `### ${
        result.hasImage
          ? "📋🔍 លទ្ធផលបម្លែងរូបភាពទៅជាអក្សរ (OCR) និងត្រួតពិនិត្យអក្ខរាវិរុទ្ធ"
          : "📝🇰🇭 លទ្ធផលត្រួតពិនិត្យអក្ខរាវិរុទ្ធ និងក្បួនខ្នាតវេយ្យាករណ៍"
      }\n\n` +
      `• 🌐 **ភាសា៖** ${result.detectedLanguage} | 🔍 **កំហុសរកឃើញ៖** ${result.errorCount} កន្លែង\n` +
      `• 💡 **ការវាយតម្លៃវេយ្យាករណ៍៖** ${result.grammarSummaryKhmer}\n\n` +
      `\`\`\`orthography-ocr\n${payload}\n\`\`\`\n\n` +
      `🇬🇧 English: ${result.englishSummary}`;
    onSendToChat(userLabel, botMd);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto"
      onPaste={handlePaste}
    >
      <div className="relative w-full max-w-3xl rounded-2xl bg-[#0e1724] border border-emerald-500/35 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 bg-gradient-to-r from-[#0d2230] via-[#112a36] to-[#0f242c] border-b border-emerald-500/25 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
              <SpellCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">
                🇰🇭🌐 ពិនិត្យអក្ខរាវិរុទ្ធ &amp; បម្លែងរូបភាពជាអក្សរ (Orthography &amp; OCR Studio)
              </h2>
              <p className="text-[11px] text-emerald-300/85 truncate">
                តាមក្បួនវេយ្យាករណ៍ខ្មែរ (វចនានុក្រមសម្ដេចជួនណាត) និងអន្តរជាតិ • ដកស្រង់អក្សរពីរូបភាពសម្រាប់ចម្លង ១០០%
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="px-4 sm:px-5 pt-3 bg-[#0b131e] shrink-0">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#070d15] border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab("spellcheck")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "spellcheck"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                  : "text-white/65 hover:text-white hover:bg-white/5"
              }`}
            >
              <SpellCheck className="w-4 h-4" />
              <span>📝 ពិនិត្យអក្ខរាវិរុទ្ធ &amp; វេយ្យាករណ៍ (គ្រប់ភាសា)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ocr")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "ocr"
                  ? "bg-sky-600 text-white shadow-md shadow-sky-600/25"
                  : "text-white/65 hover:text-white hover:bg-white/5"
              }`}
            >
              <ScanText className="w-4 h-4" />
              <span>📸 បម្លែងរូបភាពនៃអត្ថបទទៅជាអក្សរ (OCR)</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === "spellcheck" ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-semibold text-emerald-200 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-emerald-400" />
                  <span>បញ្ចូលអត្ថបទភាសាខ្មែរ អង់គ្លេស ចិន ថៃ បារាំង ឬភាសាដទៃទៀត៖</span>
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {SAMPLE_TEXTS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setInputText(sample.text);
                        setErrorMsg(null);
                      }}
                      className="px-2 py-0.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-[11px] text-emerald-300 transition-colors cursor-pointer"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={4}
                placeholder="សូមសរសេរ ឬចម្លងអត្ថបទមកដាក់ទីនេះ ដើម្បីត្រួតពិនិត្យអក្ខរាវិរុទ្ធ និងវេយ្យាករណ៍ឱ្យបានត្រឹមត្រូវ..."
                className="w-full rounded-xl bg-[#070d15] border border-white/15 focus:border-emerald-400/70 focus:outline-none p-3 text-sm text-white placeholder-white/35 leading-relaxed resize-y"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageFile(file);
                }}
              />

              {!selectedImage ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-sky-400/40 hover:border-sky-400/80 bg-[#07111d] hover:bg-[#0a1728] rounded-2xl p-6 text-center cursor-pointer transition-all"
                >
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center mx-auto mb-2.5">
                    <Upload className="w-6 h-6 text-sky-300" />
                  </div>
                  <p className="text-sm font-bold text-white">
                    ចុចទីនេះដើម្បីជ្រើសរើសរូបភាពនៃអត្ថបទ ឬចុច Ctrl+V ដើម្បី Paste រូបភាព
                  </p>
                  <p className="text-xs text-sky-300/75 mt-1">
                    គាំទ្ររូបថតសៀវភៅ ឯកសារ ក្រដាសរដ្ឋបាល ស្លាកសញ្ញា អក្សរសរសេរដៃ ឬ Screenshot គ្រប់ភាសា
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-sky-500/35 bg-[#07111d] p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={selectedImage.previewUrl}
                      alt="OCR Preview"
                      className="w-20 h-16 object-cover rounded-lg border border-white/15 bg-black shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{selectedImage.name}</p>
                      <p className="text-[11px] text-emerald-300 mt-0.5">
                        ✅ រូបភាពរួចរាល់សម្រាប់បម្លែងទៅជាអក្សរ (OCR) និងពិនិត្យអក្ខរាវិរុទ្ធ
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-semibold cursor-pointer"
                    >
                      ប្ដូររូប
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-medium text-white/65 block mb-1">
                  ចំណាំបន្ថែម (មិនបាច់បំពេញក៏បាន)៖
                </label>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="ឧ. ដកស្រង់អក្សរទាំងអស់ និងកែអក្ខរាវិរុទ្ធឱ្យត្រូវតាមវចនានុក្រមខ្មែរ..."
                  className="w-full rounded-xl bg-[#070d15] border border-white/15 focus:border-sky-400/70 focus:outline-none px-3 py-2 text-xs text-white placeholder-white/35"
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleRunAnalysis}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:via-teal-500 hover:to-sky-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {activeTab === "ocr"
                    ? "កំពុងដកស្រង់អក្សរពីរូបភាព (OCR) និងត្រួតពិនិត្យអក្ខរាវិរុទ្ធ..."
                    : "កំពុងត្រួតពិនិត្យអក្ខរាវិរុទ្ធ និងក្បួនខ្នាតវេយ្យាករណ៍..."}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>
                  {activeTab === "ocr"
                    ? "📸📋 បម្លែងរូបភាពទៅជាអក្សរ (OCR) & ពិនិត្យអក្ខរាវិរុទ្ធឥឡូវនេះ"
                    : "🔍✅ ត្រួតពិនិត្យអក្ខរាវិរុទ្ធ និងវេយ្យាករណ៍ឥឡូវនេះ"}
                </span>
              </>
            )}
          </button>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Result Section */}
          {result && (
            <div className="space-y-3.5 pt-1 border-t border-white/10">
              {/* Summary Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#091522] border border-emerald-500/30">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
                    🌐 {result.detectedLanguage}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                      result.errorCount === 0
                        ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
                        : "bg-amber-500/20 border-amber-400/40 text-amber-300"
                    }`}
                  >
                    {result.errorCount === 0
                      ? "✅ អក្ខរាវិរុទ្ធ និងវេយ្យាករណ៍ត្រឹមត្រូវឥតខ្ចោះ (០ កំហុស)"
                      : `🔍 រកឃើញ និងកែតម្រូវកំហុសចំនួន ${result.errorCount} កន្លែង`}
                  </span>
                </div>
                {onSendToChat && (
                  <button
                    type="button"
                    onClick={handleInsertIntoChat}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 text-xs font-semibold cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>ដាក់ចូលក្នុងប្រអប់ឆាត</span>
                  </button>
                )}
              </div>

              {/* 1. Extracted OCR Text Box (if image or text provided) */}
              {result.extractedText && (
                <div className="rounded-xl border border-sky-500/35 bg-[#08121e] overflow-hidden">
                  <div className="flex items-center justify-between px-3.5 py-2 bg-[#0e1e32] border-b border-sky-500/25">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
                      <FileText className="w-3.5 h-3.5" />
                      <span>
                        {result.hasImage
                          ? "📋 អត្ថបទដកស្រង់ចេញពីរូបភាព (Extracted Text from Image - OCR)"
                          : "📄 អត្ថបទដើមរបស់អ្នក (Original Text)"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(result.extractedText, "extracted")}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                    >
                      {copiedExtracted ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>បានចម្លងរួចរាល់!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>📋 ចម្លងអក្សរនេះ (Copy Text)</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3.5">
                    <pre className="whitespace-pre-wrap break-words font-sans text-sm text-white/95 leading-relaxed select-all bg-black/30 p-3 rounded-lg border border-white/10">
                      {result.extractedText}
                    </pre>
                  </div>
                </div>
              )}

              {/* 2. Corrected Orthography & Grammar Text Box (Ready to Copy!) */}
              <div className="rounded-xl border border-emerald-500/40 bg-[#071814] overflow-hidden shadow-lg">
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0c2922] border-b border-emerald-500/30">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      ✅ អត្ថបទដែលបានកែអក្ខរាវិរុទ្ធ និងវេយ្យាករណ៍រួចរាល់ (សម្រាប់យកទៅចម្លងប្រើប្រាស់)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(result.correctedText, "corrected")}
                    className="flex items-center gap-1.5 px-3.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-md transition-all cursor-pointer"
                  >
                    {copiedCorrected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>បានចម្លងទុករួចរាល់!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>📋 ចម្លងអត្ថបទត្រឹមត្រូវ (Copy)</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3.5">
                  <pre className="whitespace-pre-wrap break-words font-sans text-sm sm:text-[15px] text-emerald-100 font-medium leading-relaxed select-all bg-black/35 p-3.5 rounded-lg border border-emerald-500/25">
                    {result.correctedText}
                  </pre>
                </div>
              </div>

              {/* 3. Detailed Spelling & Grammar Corrections Table */}
              {Array.isArray(result.errors) && result.errors.length > 0 && (
                <div className="rounded-xl border border-amber-500/35 bg-[#191308] overflow-hidden">
                  <div className="px-3.5 py-2 bg-[#271d0b] border-b border-amber-500/25 flex items-center gap-2 text-xs font-bold text-amber-300">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span>
                      📖 បញ្ជីពាក្យខុស ពាក្យត្រូវ និងការពន្យល់តាមក្បួនខ្នាតវេយ្យាករណ៍ ({result.errors.length} ចំណុច)
                    </span>
                  </div>
                  <div className="p-3 space-y-2">
                    {result.errors.map((errItem, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-black/40 border border-white/10 text-xs space-y-1"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-amber-400">#{idx + 1}</span>
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 line-through font-medium">
                            ❌ {errItem.wrong}
                          </span>
                          <span className="text-white/50">➔</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold">
                            ✅ {errItem.correct}
                          </span>
                        </div>
                        {errItem.rule && (
                          <p className="text-white/80 pl-1 leading-relaxed">
                            💡 <strong>ក្បួនវេយ្យាករណ៍៖</strong> {errItem.rule}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Grammar & Orthography Explanation */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1.5">
                <p className="text-sky-200 leading-relaxed">
                  📚 <strong>ការវាយតម្លៃតាមក្បួនវេយ្យាករណ៍៖</strong> {result.grammarSummaryKhmer}
                </p>
                {result.englishSummary && (
                  <p className="text-white/65 leading-relaxed">
                    🇬🇧 <strong>English Summary:</strong> {result.englishSummary}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
