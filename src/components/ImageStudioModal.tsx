import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Sparkles,
  Wand2,
  Upload,
  Download,
  Send,
  RotateCw,
  Sliders,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Type,
} from "lucide-react";
import { ChatImage } from "../types";
import { universalGenerateOrEditImage } from "../services/universalClient";

interface ImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImage?: ChatImage | null;
  onSendGeneratedToChat: (promptText: string, generatedImg: ChatImage, replyText: string) => void;
}

const IMAGE_STYLES = [
  { id: "photorealistic", label: "📸 រូបពិតច្បាស់ 4K (Photorealistic)" },
  { id: "3d-anime", label: "🎬 គំនូរ 3D / Pixar" },
  { id: "khmer-art", label: "🇰🇭 សិល្បៈខ្មែរអង្គរ (Khmer Art)" },
  { id: "digital-art", label: "🎨 គំនូរឌីជីថលទំនើប (Digital Art)" },
  { id: "watercolor", label: "🖌️ គំនូរពណ៌ទឹក (Watercolor)" },
  { id: "cyberpunk", label: "⚡ នាគរាជអនាគត (Cyberpunk)" },
];

const ASPECT_RATIOS = [
  { id: "1:1", label: "1:1 (ការេ)" },
  { id: "16:9", label: "16:9 (ផ្តេក)" },
  { id: "9:16", label: "9:16 (បញ្ឈរ)" },
];

export const ImageStudioModal: React.FC<ImageStudioModalProps> = ({
  isOpen,
  onClose,
  initialImage,
  onSendGeneratedToChat,
}) => {
  const [mode, setMode] = useState<"generate" | "edit">("generate");
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("photorealistic");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [sourceImage, setSourceImage] = useState<ChatImage | null>(null);
  const [resultImage, setResultImage] = useState<ChatImage | null>(null);
  const [resultDescription, setResultDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Instant Studio Filter Adjustments for Editing
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [overlayText, setOverlayText] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialImage) {
        setSourceImage(initialImage);
        setResultImage(initialImage);
        setMode("edit");
      } else {
        setMode("generate");
      }
      setErrorMsg(null);
    }
  }, [isOpen, initialImage]);

  // Apply real-time studio adjustments onto canvas when in edit mode
  useEffect(() => {
    const activeImg = resultImage || sourceImage;
    if (!activeImg || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const isRotated90 = rotation % 180 !== 0;
      canvas.width = isRotated90 ? img.height : img.width;
      canvas.height = isRotated90 ? img.width : img.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      if (overlayText.trim()) {
        const fontSize = Math.max(22, Math.floor(canvas.width * 0.048));
        ctx.font = `bold ${fontSize}px "Kantumruy Pro", sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        const padding = 14;
        const boxHeight = fontSize + padding * 2;
        ctx.fillRect(0, canvas.height - boxHeight - 20, canvas.width, boxHeight);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(overlayText.trim(), canvas.width / 2, canvas.height - 20 - padding);
      }
    };
    img.src = activeImg.previewUrl || `data:${activeImg.mimeType};base64,${activeImg.data}`;
  }, [sourceImage, resultImage, brightness, contrast, saturation, rotation, overlayText]);

  if (!isOpen) return null;

  const handleUploadSource = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      const uploaded: ChatImage = {
        data: base64,
        mimeType: file.type || "image/jpeg",
        name: file.name,
        previewUrl: dataUrl,
      };
      setSourceImage(uploaded);
      setResultImage(uploaded);
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
      setRotation(0);
      setOverlayText("");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setRotation(0);
    setOverlayText("");
  };

  const handleRunAiImage = async () => {
    if (!prompt.trim() && mode === "generate") {
      setErrorMsg("សូមសរសេរការពិពណ៌នារូបភាពដែលអ្នកចង់បង្កើតជាមុនសិន!");
      return;
    }
    if (mode === "edit" && !sourceImage) {
      setErrorMsg("សូមជ្រើសរើសរូបភាពដែលអ្នកចង់កែជាមុនសិន!");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await universalGenerateOrEditImage({
        prompt:
          prompt.trim() ||
          (mode === "edit"
            ? "កែរូបភាពនេះឱ្យកាន់តែស្អាត ច្បាស់កម្រិត 4K និងមានពន្លឺស្រស់ស្អាត"
            : "ទេសភាពប្រាសាទអង្គរវត្តនាពេលថ្ងៃរះ"),
        mode,
        style: selectedStyle,
        aspectRatio,
        sourceImage:
          mode === "edit" && sourceImage
            ? {
                data: sourceImage.data,
                mimeType: sourceImage.mimeType,
              }
            : undefined,
      });

      if (data.image && data.image.data) {
        const genImg: ChatImage = {
          data: data.image.data,
          mimeType: data.image.mimeType || "image/jpeg",
          previewUrl: `data:${data.image.mimeType || "image/jpeg"};base64,${data.image.data}`,
          name: mode === "edit" ? "AI_Edited_Image.jpg" : "AI_Generated_Image.jpg",
        };
        setResultImage(genImg);
        setResultDescription(data.description || "");
        resetAdjustments();
      }
    } catch {
      setErrorMsg("មានបញ្ហាក្នុងការបង្កើតរូបភាព សូមព្យាយាមម្តងទៀត!");
    } finally {
      setIsLoading(false);
    }
  };

  // Get final image (including any studio filter/text adjustments on canvas)
  const getFinalImage = (): ChatImage | null => {
    const active = resultImage || sourceImage;
    if (!active) return null;

    const hasStudioEdits =
      brightness !== 100 ||
      contrast !== 100 ||
      saturation !== 100 ||
      rotation !== 0 ||
      overlayText.trim().length > 0;

    if (hasStudioEdits && canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.94);
      const base64 = dataUrl.split(",")[1];
      return {
        data: base64,
        mimeType: "image/jpeg",
        previewUrl: dataUrl,
        name: "Khmer_AI_Studio_Image.jpg",
      };
    }

    return active;
  };

  const handleDownload = () => {
    const finalImg = getFinalImage();
    if (!finalImg) return;
    const link = document.createElement("a");
    link.href = finalImg.previewUrl || `data:${finalImg.mimeType};base64,${finalImg.data}`;
    link.download = finalImg.name || `khmer-ai-image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendToChat = () => {
    const finalImg = getFinalImage();
    if (!finalImg) return;
    const userActionLabel =
      mode === "edit"
        ? `🎨 កែរូបភាព៖ ${prompt.trim() || "កែលម្អគុណភាព និងពណ៌រូបភាព"}`
        : `✨ បង្កើតរូបភាព៖ ${prompt.trim()}`;
    const replyCaption =
      resultDescription ||
      (mode === "edit"
        ? "✅ ខ្ញុំបានកែរូបភាពតាមការចង់បានរបស់អ្នករួចរាល់ហើយ!\n\n🇬🇧 English Summary: Your image has been edited and enhanced according to your instructions."
        : "✅ នេះជារូបភាពដែលខ្ញុំបានបង្កើតជូនតាមការចង់បានរបស់អ្នក!\n\n🇬🇧 English Summary: Here is the newly generated AI artwork based on your request.");

    onSendGeneratedToChat(userActionLabel, finalImg, replyCaption);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full max-h-[92vh] bg-[#17212b] rounded-2xl overflow-hidden border border-white/15 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-[#0e1621] border-b border-white/10 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white shadow">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm sm:text-base flex items-center gap-1.5">
                <span>ស្ទូឌីយោបង្កើត និងកែរូបភាពឆ្លាតវៃ (AI Image Studio)</span>
              </h2>
              <p className="text-[11px] text-white/50">
                បង្កើតរូបភាពថ្មី ឬកែរូបភាពតាមការចង់បានជាភាសាខ្មែរ និងអង់គ្លេស
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-white/10 bg-[#121b24] px-4 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setMode("generate")}
            className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === "generate"
                ? "border-sky-400 text-sky-400 bg-[#17212b]"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>បង្កើតរូបភាពថ្មី (Generate Image)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("edit")}
            className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === "edit"
                ? "border-emerald-400 text-emerald-400 bg-[#17212b]"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>កែរូបភាពតាមការចង់បាន (Edit Image)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-white">
          {/* Upload photo bar when in Edit mode */}
          {mode === "edit" && (
            <div className="p-3 rounded-xl bg-[#0e1621] border border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-medium text-white text-xs sm:text-sm">
                    {sourceImage ? `រូបភាពដើម៖ ${sourceImage.name || "បានជ្រើសរើសរួចរាល់"}` : "ជ្រើសរើសរូបភាពដើម្បីកែប្រែ"}
                  </p>
                  <p className="text-[11px] text-white/50">
                    អាចបញ្ជាឱ្យ AI កែប្រែផ្ទៃក្រោយ ប្តូរស្ទីល ឬកែពន្លឺ/បន្ថែមអក្សរដោយផ្ទាល់
                  </p>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleUploadSource}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{sourceImage ? "ប្តូររូបភាពផ្សេង" : "បង្ហោះរូបភាពពីឧបករណ៍"}</span>
              </button>
            </div>
          )}

          {/* Prompt input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-sky-300">
              {mode === "generate"
                ? "✍️ ពិពណ៌នារូបភាពដែលអ្នកចង់ឱ្យ AI បង្កើត (សរសេរជាភាសាខ្មែរ ឬអង់គ្លេស)៖"
                : "✍️ ប្រាប់ AI ពីអ្វីដែលអ្នកចង់កែនៅលើរូបភាពនេះ៖"}
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading) handleRunAiImage();
                }}
                placeholder={
                  mode === "generate"
                    ? "ឧ. ប្រាសាទអង្គរវត្តនាពេលថ្ងៃលិចមានពន្លឺពណ៌មាសឆ្អិនឆ្អៅ..."
                    : "ឧ. កែរូបនេះឱ្យទៅជាគំនូរ 3D ឬប្តូរផ្ទៃខាងក្រោយទៅជាមាត់សមុទ្រ..."
                }
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0e1621] border border-white/15 text-white placeholder-white/35 text-xs sm:text-sm focus:border-sky-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleRunAiImage}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-sky-500/20 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>កំពុងដំណើរការ...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{mode === "generate" ? "បង្កើតរូបភាព AI" : "កែរូបភាពដោយ AI"}</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick sample prompts */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(mode === "generate"
                ? [
                    "ប្រាសាទអង្គរវត្តនាពេលព្រឹកព្រលឹម 4K",
                    "មនុស្សយន្តឆ្លាតវៃកំពុងបង្រៀនសិស្សខ្មែរ",
                    "ទេសភាពឆ្នេរសមុទ្រកោះរ៉ុងពេលថ្ងៃលិច",
                    "នារីខ្មែរស្លៀកសម្លៀកបំពាក់ប្រពៃណីអប្សរា",
                  ]
                : [
                    "កែឱ្យទៅជារូបគំនូរ 3D Pixar ដ៏ស្រស់ស្អាត",
                    "ប្តូរផ្ទៃខាងក្រោយទៅជាប្រាសាទអង្គរវត្ត",
                    "កែពន្លឺឱ្យភ្លឺច្បាស់កម្រិត 4K Studio",
                    "កែទៅជាគំនូរសិល្បៈពណ៌ទឹក (Watercolor)",
                  ]
              ).map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(sample)}
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-sky-500/20 text-white/70 hover:text-sky-300 border border-white/10 text-[11px] transition-colors cursor-pointer"
                >
                  + {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Style & Aspect Ratio Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-white/60 mb-1">ជ្រើសរើសស្ទីលរូបភាព (Style)៖</label>
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0e1621] border border-white/15 text-white text-xs focus:border-sky-400 focus:outline-none"
              >
                {IMAGE_STYLES.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-white/60 mb-1">ទំហំសមាមាត្រ (Aspect Ratio)៖</label>
              <div className="flex gap-1.5">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.id}
                    type="button"
                    onClick={() => setAspectRatio(ar.id)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                      aspectRatio === ar.id
                        ? "bg-sky-500/20 border-sky-400 text-sky-300"
                        : "bg-[#0e1621] border-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    {ar.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Studio Adjustments & Preview Area */}
          {(resultImage || sourceImage) && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2 border-t border-white/10">
              {/* Image Canvas Preview */}
              <div className="md:col-span-7 flex flex-col items-center justify-center bg-[#0b111a] rounded-xl border border-white/10 p-3 min-h-[240px]">
                <canvas
                  ref={canvasRef}
                  className="max-h-72 w-auto max-w-full object-contain rounded-lg shadow-lg"
                />
                {resultDescription && (
                  <p className="mt-2 text-[11.5px] text-sky-200/90 text-center px-2">
                    {resultDescription}
                  </p>
                )}
              </div>

              {/* Manual Studio Controls (Brightness, Contrast, Rotate, Text overlay) */}
              <div className="md:col-span-5 bg-[#0e1621] rounded-xl border border-white/10 p-3 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-semibold text-sky-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>កែសម្រួលបន្ថែមផ្ទាល់ (Studio Tools)</span>
                  </span>
                  <button
                    type="button"
                    onClick={resetAdjustments}
                    className="text-[11px] text-white/60 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>ដើមវិញ</span>
                  </button>
                </div>

                <div className="space-y-2 text-[11.5px]">
                  <div>
                    <div className="flex justify-between text-white/70">
                      <span>ពន្លឺ (Brightness)</span>
                      <span>{brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="160"
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-white/70">
                      <span>កម្រិតច្បាស់ (Contrast)</span>
                      <span>{contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="180"
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-white/70">
                      <span>ពណ៌ឆ្អិន (Saturation)</span>
                      <span>{saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={saturation}
                      onChange={(e) => setSaturation(Number(e.target.value))}
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </div>

                  <div className="pt-1">
                    <label className="block text-white/70 mb-1 flex items-center gap-1">
                      <Type className="w-3 h-3 text-sky-400" />
                      <span>ដាក់អក្សរលើរូបភាព (Text Overlay)៖</span>
                    </label>
                    <input
                      type="text"
                      value={overlayText}
                      onChange={(e) => setOverlayText(e.target.value)}
                      placeholder="វាយអក្សរខ្មែរ ឬអង់គ្លេស..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#17212b] border border-white/15 text-white text-xs focus:border-sky-400 focus:outline-none"
                    />
                  </div>

                  <div className="pt-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>បង្វិល 90°</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {(resultImage || sourceImage) && (
          <div className="px-5 py-3 bg-[#0e1621] border-t border-white/10 flex flex-wrap items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>ទាញយករូបភាព (Download)</span>
            </button>
            <button
              type="button"
              onClick={handleSendToChat}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>ដាក់ចូលក្នុងប្រអប់សន្ទនា (Send to Chat)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
