import React, { useState, useRef, useEffect } from "react";
import {
  X,
  QrCode,
  Upload,
  Download,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  FileText,
  FileSpreadsheet,
  FileCode,
  Presentation,
  Video,
  Image as ImageIcon,
  Wifi,
  User,
  Link,
  Loader2,
  Share2,
  Palette,
  Eye,
  Info,
  Send,
  MessageCircle,
  FileDown,
  Layers,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  Globe,
  Radio,
  FileCheck,
  ImageDown,
} from "lucide-react";
import QRCode from "qrcode";

export interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendResultToChat?: (userPrompt: string, aiResponse: string) => void;
  initialContent?: string;
}

type QrTab = "file" | "text" | "wifi" | "contact";

const COLOR_PRESETS = [
  { name: "បុរាណ (Classic)", dark: "#0f172a", light: "#ffffff" },
  { name: "ខៀវបច្ចេកវិទ្យា (Tech Blue)", dark: "#1d4ed8", light: "#ffffff" },
  { name: "បៃតងរស្មី (Emerald)", dark: "#047857", light: "#ffffff" },
  { name: "ផ្កាឈូកទាន់សម័យ (Rose)", dark: "#be123c", light: "#ffffff" },
  { name: "ស្វាយទំនើប (Purple)", dark: "#6d28d9", light: "#ffffff" },
  { name: "មាសប្រណីត (Gold)", dark: "#b45309", light: "#ffffff" },
  { name: "រាត្រីខ្មៅ (Dark Mode)", dark: "#ffffff", light: "#0f172a" },
];

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  onSendResultToChat,
  initialContent = "",
}) => {
  // Tabs
  const [activeTab, setActiveTab] = useState<QrTab>("file");

  // Content states
  const [textContent, setTextContent] = useState<string>(
    initialContent || "https://t.me/KhmerSuperAiBot"
  );

  // File Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedFileRecord, setUploadedFileRecord] = useState<{
    id: string;
    fileName: string;
    size: number;
    category: string;
    categoryLabel: string;
    icon: string;
    accessUrl: string;
    downloadUrl: string;
  } | null>(null);

  // WiFi states
  const [wifiSsid, setWifiSsid] = useState<string>("Khmer_HighSpeed_WiFi");
  const [wifiPassword, setWifiPassword] = useState<string>("KhmerAI2026");
  const [wifiType, setWifiType] = useState<"WPA" | "WEP" | "nopass">("WPA");
  const [wifiHidden, setWifiHidden] = useState<boolean>(false);

  // Contact (vCard) states
  const [contactName, setContactName] = useState<string>("សុខ ចាន់ដារ៉ា");
  const [contactPhone, setContactPhone] = useState<string>("+855 12 345 678");
  const [contactEmail, setContactEmail] = useState<string>("dara@example.com");
  const [contactOrg, setContactOrg] = useState<string>("Khmer AI Studio");

  // Styling
  const [darkColor, setDarkColor] = useState<string>("#0f172a");
  const [lightColor, setLightColor] = useState<string>("#ffffff");
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [centerLogo, setCenterLogo] = useState<string>("none");

  // QR Generation Outputs
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrSvgString, setQrSvgString] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isCopiedImage, setIsCopiedImage] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [posterCardBase64, setPosterCardBase64] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  // Direct Telegram Send Modal State
  const [showTelegramSendInput, setShowTelegramSendInput] = useState<boolean>(false);
  const [telegramChatIdInput, setTelegramChatIdInput] = useState<string>("");
  const [isSendingToTelegram, setIsSendingToTelegram] = useState<boolean>(false);

  // Phone Gallery Saver Modal State (Direct save to phone's camera roll/photos)
  const [showGalleryModal, setShowGalleryModal] = useState<boolean>(false);
  const [isSavingToGallery, setIsSavingToGallery] = useState<boolean>(false);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Calculate payload to encode into QR Code
  const getComputedPayload = (): string => {
    if (activeTab === "file") {
      return (
        uploadedFileRecord?.accessUrl ||
        "https://ais-dev-olfj5axr5tu3xswdlb7w73-447371415023.asia-southeast1.run.app"
      );
    }
    if (activeTab === "wifi") {
      return `WIFI:S:${wifiSsid};T:${wifiType};P:${wifiPassword};H:${wifiHidden ? "true" : "false"};;`;
    }
    if (activeTab === "contact") {
      return `BEGIN:VCARD\nVERSION:3.0\nFN:${contactName}\nTEL:${contactPhone}\nEMAIL:${contactEmail}\nORG:${contactOrg}\nEND:VCARD`;
    }
    return textContent.trim() || "https://google.com";
  };

  const getActiveTitle = (): string => {
    if (activeTab === "file" && (uploadedFileRecord || selectedFile)) {
      return uploadedFileRecord?.fileName || selectedFile?.name || "ឯកសារ";
    }
    if (activeTab === "wifi") {
      return `WiFi: ${wifiSsid}`;
    }
    if (activeTab === "contact") {
      return `vCard: ${contactName}`;
    }
    return "កូដ QR ឆ្លាតវៃ";
  };

  // Re-generate QR Code when payload or styling changes
  useEffect(() => {
    if (!isOpen) return;
    const payload = getComputedPayload();
    if (!payload) return;

    // Generate PNG Data URL
    QRCode.toDataURL(payload, {
      errorCorrectionLevel: centerLogo !== "none" ? "H" : errorCorrectionLevel,
      margin: 2,
      width: 720,
      color: {
        dark: darkColor,
        light: lightColor,
      },
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch(() => {});

    // Generate SVG string
    QRCode.toString(payload, {
      type: "svg",
      errorCorrectionLevel: centerLogo !== "none" ? "H" : errorCorrectionLevel,
      margin: 2,
      width: 720,
      color: {
        dark: darkColor,
        light: lightColor,
      },
    })
      .then((svg) => {
        setQrSvgString(svg);
      })
      .catch(() => {});
  }, [
    isOpen,
    activeTab,
    textContent,
    uploadedFileRecord,
    wifiSsid,
    wifiPassword,
    wifiType,
    wifiHidden,
    contactName,
    contactPhone,
    contactEmail,
    contactOrg,
    darkColor,
    lightColor,
    errorCorrectionLevel,
    centerLogo,
  ]);

  if (!isOpen) return null;

  // Upload file function
  const triggerFileUpload = async (file: File, b64Data: string) => {
    setIsUploading(true);
    try {
      const res = await fetch("/api/qr/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: b64Data,
          fileName: file.name,
          mimeType: file.type,
          title: file.name,
        }),
      });
      const data = await res.json();
      if (data && data.ok && data.file) {
        setUploadedFileRecord(data.file);
        if (data.posterCardBase64) {
          setPosterCardBase64(data.posterCardBase64);
        }
        setToastMessage(`បានផ្ទុកឡើងឯកសារ ${file.name} រួចរាល់! កូដ QR បានភ្ជាប់ជោគជ័យ 🎉`);
      } else {
        setToastMessage("⚠️ ការផ្ទុកឡើងមិនបានសម្រេច សូមព្យាយាមម្ដងទៀត");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setToastMessage("⚠️ បញ្ហាក្នុងការផ្ទុកឡើងឯកសារ");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle File Input Selection & Auto-Upload immediately
  const handleSelectFile = (file: File) => {
    setSelectedFile(file);
    setUploadedFileRecord(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target?.result as string;
      setFileBase64(b64);
      triggerFileUpload(file, b64);
    };
    reader.readAsDataURL(file);
  };

  // Helper to convert base64 dataUrl into binary Blob (100% Genuine PNG)
  const dataUrlToBlob = (dataUrl: string): Blob => {
    try {
      const parts = dataUrl.split(",");
      const rawB64 = parts[1] || parts[0];
      const byteChars = atob(rawB64);
      const byteNumbers = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      return new Blob([byteNumbers], { type: "image/png" });
    } catch {
      return new Blob([], { type: "image/png" });
    }
  };

  // Helper to retrieve the real binary PNG Blob of the QR code
  const getQrImageBlob = async (format: "png" | "card" = "png"): Promise<Blob> => {
    if (format === "card" && posterCardBase64) {
      return dataUrlToBlob(posterCardBase64);
    }
    if (format === "png" && qrDataUrl) {
      return dataUrlToBlob(qrDataUrl);
    }
    // Fallback: Fetch from server endpoint
    try {
      const res = await fetch("/api/qr/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: getComputedPayload(),
          format,
          darkColor,
          lightColor,
          asCard: format === "card",
          title: getActiveTitle(),
          fileName: selectedFile?.name || "",
          fileSize: selectedFile?.size || 0,
          category: activeTab,
        }),
      });
      if (res.ok) {
        return await res.blob();
      }
    } catch (err) {
      console.warn("Failed to fetch server image blob:", err);
    }
    if (qrDataUrl) {
      return dataUrlToBlob(qrDataUrl);
    }
    throw new Error("No QR image available");
  };

  // =========================================================================
  // 1. SAVE DIRECTLY TO PHONE GALLERY (iOS & Android Camera Roll / Photos)
  // Uses Web Share API with image file + interactive Photo Saver modal
  // =========================================================================
  const handleSaveToPhoneGallery = async () => {
    if (isSavingToGallery) return;
    setIsSavingToGallery(true);

    try {
      const blob = await getQrImageBlob("png");
      const filename = `qrcode_${Date.now()}.png`;
      const file = new File([blob], filename, { type: "image/png" });

      // Step A: Trigger native OS Share sheet with Image File
      // On iOS Safari: Pops up native share with "Save Image" (រក្សាទុករូបភាព) -> writes directly to Photos!
      // On Android: Pops up native share with "Save to device" / "Google Photos" / "Gallery"
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "កូដ QR Code",
            text: `📱 រូបភាព QR Code សម្រាប់៖ ${getActiveTitle()}`,
          });
          setToastMessage("✅ បានបើកផ្ទាំងរក្សាទុករូបភាព QR ក្នុង Gallery ទូរស័ព្ទ!");
        } catch (shareErr: any) {
          if (shareErr.name !== "AbortError") {
            console.warn("Native share error:", shareErr);
          }
        }
      }

      // Step B: Also open Phone Gallery Saver modal for visual confirmation & long-press save option
      setShowGalleryModal(true);
    } catch (err) {
      console.error("Gallery save error:", err);
      setShowGalleryModal(true);
    } finally {
      setIsSavingToGallery(false);
    }
  };

  // =========================================================================
  // 2. ROBUST IMAGE FILE DOWNLOAD ENGINE (Returns Genuine .png / .svg / .card)
  // Guarantees REAL image file without redirecting or navigating to URL links
  // =========================================================================
  const handleDownloadImage = async (format: "png" | "svg" | "card") => {
    if (isDownloading) return;
    setIsDownloading(format);
    const filename =
      format === "svg"
        ? `qrcode_${Date.now()}.svg`
        : format === "card"
        ? `qrcode_poster_${Date.now()}.png`
        : `qrcode_${Date.now()}.png`;

    try {
      if (format === "svg") {
        let svgContent = qrSvgString;
        if (!svgContent) {
          const res = await fetch("/api/qr/download", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: getComputedPayload(),
              format: "svg",
              darkColor,
              lightColor,
            }),
          });
          svgContent = await res.text();
        }
        const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(objectUrl);
        }, 2000);
        setToastMessage("📥 បានទាញយករូបភាព QR ជាវ៉ិចទ័រ .SVG រួចរាល់!");
        return;
      }

      // PNG or Poster Card:
      const blob = await getQrImageBlob(format);
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
      }, 2000);

      setToastMessage(
        `📥 បានទាញយករូបភាព QR Code (.PNG) រួចរាល់!`
      );
    } catch (err) {
      console.error("Download error:", err);
      // Fallback: Open Gallery modal so user can press & hold or save!
      setShowGalleryModal(true);
      setToastMessage("⚠️ សូមរក្សាទុករូបភាពតាមរយៈផ្ទាំង Gallery ខាងលើ!");
    } finally {
      setIsDownloading(null);
    }
  };

  // Copy Image to Clipboard (Instant paste into Telegram, Messenger, Word, PowerPoint)
  const handleCopyImageToClipboard = async () => {
    try {
      if (!qrDataUrl) return;
      const res = await fetch(qrDataUrl);
      const blob = await res.blob();
      if (navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ "image/png": blob }),
        ]);
        setIsCopiedImage(true);
        setToastMessage("📋 បានចម្លងរូបភាព QR ទៅ Clipboard! លោកអ្នកអាចចុច Ctrl+V (Paste) ក្នុង Telegram ឬ Messenger ភ្លាមៗ!");
        setTimeout(() => setIsCopiedImage(false), 2500);
      } else {
        handleCopyLink();
      }
    } catch (e) {
      console.error("Clipboard error:", e);
      handleCopyLink();
    }
  };

  // Copy Link / Payload
  const handleCopyLink = () => {
    const payload = getComputedPayload();
    navigator.clipboard.writeText(payload);
    setIsCopied(true);
    setToastMessage("🔗 បានចម្លងតំណភ្ជាប់/ទិន្នន័យ QR រួចរាល់!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Export via Telegram Share Link
  const handleExportTelegramShare = () => {
    const payload = getComputedPayload();
    const title = getActiveTitle();
    const shareText = `📱 ស្កេនកូដ QR Code [${title}]៖\n${payload}`;
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(payload)}&text=${encodeURIComponent(shareText)}`;
    window.open(tgUrl, "_blank");
    setToastMessage("✈️ បានបើកផ្ទាំងនាំចេញតាម Telegram រួចរាល់!");
  };

  // Direct Send to Telegram Chat via Bot
  const handleSendToTelegramBot = async (targetId?: string) => {
    const finalChatId = (targetId || telegramChatIdInput).trim();
    if (!finalChatId) {
      setShowTelegramSendInput(true);
      return;
    }

    setIsSendingToTelegram(true);
    try {
      const payload = getComputedPayload();
      const res = await fetch("/api/qr/send-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: finalChatId,
          content: payload,
          title: getActiveTitle(),
          category: activeTab,
          fileName: selectedFile?.name || "",
          fileSize: selectedFile?.size || 0,
        }),
      });
      const data = await res.json();
      if (data && data.ok) {
        setToastMessage(`✅ ${data.message || "បានផ្ញើទៅកាន់ Telegram ដោយជោគជ័យ!"}`);
        setShowTelegramSendInput(false);
      } else {
        setToastMessage(`⚠️ ${data?.error || "មិនអាចផ្ញើទៅ Telegram បានទេ សូមពិនិត្យមើល Chat ID"}`);
      }
    } catch (e: any) {
      setToastMessage("⚠️ កំហុសក្នុងការផ្ញើទៅកាន់ Telegram");
    } finally {
      setIsSendingToTelegram(false);
    }
  };

  // Export via Chat Messenger (Facebook Messenger)
  const handleExportMessenger = () => {
    const payload = getComputedPayload();
    const title = getActiveTitle();

    // Copy formatted text for Messenger with direct preview link
    const messengerText = `📱 ស្កេនកូដ QR Code សម្រាប់៖ ${title}\n🔗 តំណភ្ជាប់ចូលប្រើ/ទាញយក៖ ${payload}`;
    navigator.clipboard.writeText(messengerText).catch(() => {});

    // Try Facebook / Messenger Share Dialog
    const messengerUrl = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(
      payload
    )}&app_id=291494419107518&redirect_uri=${encodeURIComponent(payload)}`;

    const newWin = window.open(messengerUrl, "_blank");
    if (!newWin || newWin.closed) {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(payload)}`,
        "_blank"
      );
    }

    setToastMessage(
      "💬 បានបើកការនាំចេញតាម Chat Messenger និងបានចម្លងព័ត៌មាន QR ទៅ Clipboard រួចរាល់!"
    );
  };

  // Universal Native Share (Web Share API)
  const handleUniversalShare = async () => {
    const payload = getComputedPayload();
    const title = getActiveTitle();
    const shareText = `📱 ស្កេនកូដ QR Code សម្រាប់៖ ${title}`;

    if (navigator.share) {
      try {
        let fileToShare: File | null = null;
        if (qrDataUrl) {
          try {
            const res = await fetch(qrDataUrl);
            const blob = await res.blob();
            fileToShare = new File([blob], `qrcode_${Date.now()}.png`, { type: "image/png" });
          } catch {}
        }

        if (
          fileToShare &&
          navigator.canShare &&
          navigator.canShare({ files: [fileToShare] })
        ) {
          await navigator.share({
            title,
            text: shareText,
            url: payload.startsWith("http") ? payload : undefined,
            files: [fileToShare],
          });
          return;
        } else {
          await navigator.share({
            title,
            text: shareText,
            url: payload.startsWith("http") ? payload : undefined,
          });
          return;
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return;
      }
    }

    handleExportTelegramShare();
  };

  // Send to In-App Chat
  const handleSendToChat = () => {
    if (!onSendResultToChat) return;
    const payload = getComputedPayload();
    const title = getActiveTitle();
    const prompt = `📱 បង្កើតកូដ QR Code [${
      activeTab === "file" ? `ឯកសារ៖ ${selectedFile?.name || "File"}` : activeTab.toUpperCase()
    }]៖ ${payload}`;

    const reply =
      `📱✨ **កូដ QR Code ត្រូវបានបង្កើត និងនាំចេញរួចរាល់ដោយជោគជ័យ!**\n\n` +
      `• **ប្រភេទ៖** ${
        activeTab === "file" ? `📁 ${uploadedFileRecord?.categoryLabel || "ឯកសារ"}` : activeTab
      }\n` +
      `• **ចំណងជើង៖** \`${title}\`\n` +
      `• **តំណភ្ជាប់/ទិន្នន័យ៖** \`${payload}\`\n\n` +
      `*(លោកអ្នកអាចស្កេនរូបភាព QR ជាមួយកាមេរ៉ាទូរស័ព្ទដើម្បីចូលប្រើ ឬទាញយកភ្លាមៗ)*`;

    onSendResultToChat(prompt, reply);
    onClose();
  };

  // Get File Type Icon
  const getFileCategoryIcon = (name = "") => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "docx" || ext === "doc") return <FileText className="w-8 h-8 text-blue-400" />;
    if (ext === "xlsx" || ext === "xls" || ext === "csv")
      return <FileSpreadsheet className="w-8 h-8 text-emerald-400" />;
    if (ext === "pdf") return <FileCode className="w-8 h-8 text-rose-400" />;
    if (ext === "pptx" || ext === "ppt") return <Presentation className="w-8 h-8 text-amber-400" />;
    if (["mp4", "mov", "webm", "mkv"].includes(ext || ""))
      return <Video className="w-8 h-8 text-purple-400" />;
    if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext || ""))
      return <ImageIcon className="w-8 h-8 text-sky-400" />;
    return <FileText className="w-8 h-8 text-slate-300" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#0b1322] border border-white/15 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Universal QR Code Studio (ស្ទូឌីយោបង្កើត &amp; នាំចេញ QR Code)
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  100% Free
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ទាញយកជារូបភាព QR Code ពិតប្រាកដ (.PNG / .SVG / Poster HD) • នាំចេញតាម Telegram &amp; Messenger
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert Notification */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-900/95 border border-sky-400 text-sky-200 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Content Body: Dual Pane Layout */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Input Form, File Upload, Style Settings (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Mode Tabs */}
            <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-slate-900/80 rounded-2xl border border-white/10 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab("file")}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === "file"
                    ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ឯកសារ &amp; មេឌា</span>
                <span className="sm:hidden">ឯកសារ</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("text")}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === "text"
                    ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Link className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">អក្សរ &amp; Link</span>
                <span className="sm:hidden">អក្សរ</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("wifi")}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === "wifi"
                    ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>WiFi</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("contact")}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === "contact"
                    ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>vCard</span>
              </button>
            </div>

            {/* TAB 1: FILE & MEDIA UPLOAD */}
            {activeTab === "file" && (
              <div className="space-y-4">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleSelectFile(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`relative p-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center ${
                    isDragging
                      ? "border-sky-400 bg-sky-500/10"
                      : "border-white/20 bg-slate-900/60 hover:border-sky-500/50 hover:bg-slate-900/90"
                  }`}
                >
                  <input
                    type="file"
                    id="fileUploadInput"
                    className="hidden"
                    accept=".docx,.doc,.xlsx,.xls,.csv,.pdf,.pptx,.ppt,.mp4,.mov,.webm,.jpg,.jpeg,.png,.webp,.gif,.mp3,.wav"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleSelectFile(e.target.files[0]);
                      }
                    }}
                  />
                  <label
                    htmlFor="fileUploadInput"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-3"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center shadow-inner">
                      {isUploading ? (
                        <Loader2 className="w-7 h-7 animate-spin text-sky-400" />
                      ) : (
                        <Upload className="w-7 h-7" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">
                        {isUploading
                          ? "កំពុងផ្ទុកឡើង និងបង្កើតកូដ QR..."
                          : selectedFile
                          ? selectedFile.name
                          : "ចុចទីនេះ ឬទម្លាក់ហ្វាល់ដើម្បីបង្កើត QR Code ភ្លាមៗ"}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        គាំទ្រ Word (.docx), Excel (.xlsx), PDF (.pdf), PowerPoint (.pptx), វីដេអូ (.mp4), រូបភាព, និងសំឡេង
                      </div>
                    </div>
                  </label>
                </div>

                {/* Selected File Details */}
                {selectedFile && (
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getFileCategoryIcon(selectedFile.name)}
                        <div>
                          <div className="text-sm font-bold text-white truncate max-w-[280px]">
                            {selectedFile.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type || "ឯកសារ"}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setFileBase64(null);
                          setUploadedFileRecord(null);
                        }}
                        className="text-xs text-slate-400 hover:text-rose-400 cursor-pointer"
                      >
                        លុបចេញ
                      </button>
                    </div>

                    {uploadedFileRecord ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>បានផ្ទុកឡើងរួចរាល់! កូដ QR បានភ្ជាប់ទៅឯកសារនេះ។</span>
                          </div>
                          <a
                            href={uploadedFileRecord.accessUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 underline text-sky-300 hover:text-sky-200"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>បើកមើល</span>
                          </a>
                        </div>
                        {/* Download original attached file button */}
                        <div className="flex items-center justify-end">
                          <a
                            href={uploadedFileRecord.downloadUrl}
                            download={uploadedFileRecord.fileName}
                            className="text-[11px] text-slate-400 hover:text-sky-300 flex items-center gap-1 underline"
                          >
                            <FileDown className="w-3 h-3" />
                            <span>ទាញយកឯកសារដើម ({uploadedFileRecord.fileName})</span>
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs text-sky-300 gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>កំពុងផ្ទុកឡើងដោយស្វ័យប្រវត្តិ... សូមរង់ចាំមួយភ្លែត</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: TEXT & URL */}
            {activeTab === "text" && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>បញ្ចូលអត្ថបទ ឬតំណភ្ជាប់ (URL / Link)</span>
                  <span className="text-[11px] text-slate-400">{textContent.length} តួអក្សរ</span>
                </label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="ឧ. https://www.example.com ឬសារអត្ថបទណាមួយដែលចង់ឱ្យបង្ហាញ..."
                  rows={4}
                  className="w-full p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-400">គំរូតំណភ្ជាប់រហ័ស៖</span>
                  <button
                    type="button"
                    onClick={() => setTextContent("https://t.me/KhmerSuperAiBot")}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors cursor-pointer"
                  >
                    💬 Telegram
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextContent("https://facebook.com")}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors cursor-pointer"
                  >
                    📘 Facebook
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextContent("https://youtube.com")}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors cursor-pointer"
                  >
                    ▶️ YouTube
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextContent("tel:+85512345678")}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors cursor-pointer"
                  >
                    📞 ទូរស័ព្ទ
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: WIFI NETWORK */}
            {activeTab === "wifi" && (
              <div className="space-y-3.5 p-4 rounded-2xl bg-slate-900/80 border border-white/10">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                  <Wifi className="w-4 h-4" />
                  <span>ស្កេនភ្ជាប់ WiFi ដោយស្វ័យប្រវត្តិ (មិនបាច់វាយលេខសម្ងាត់)</span>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300">ឈ្មោះបណ្ដាញ WiFi (SSID)</label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-500"
                    placeholder="ឧ. MyHome_WiFi_5G"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300">ពាក្យសម្ងាត់ WiFi (Password)</label>
                  <input
                    type="text"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-500 font-mono"
                    placeholder="ឧ. 12345678"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">ប្រភេទសុវត្ថិភាព៖</span>
                    <select
                      value={wifiType}
                      onChange={(e) => setWifiType(e.target.value as any)}
                      className="px-2 py-1 rounded-lg bg-slate-800 border border-white/10 text-xs text-slate-200"
                    >
                      <option value="WPA">WPA / WPA2 (ទូទៅ)</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">គ្មានលេខសម្ងាត់ (Open)</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wifiHidden}
                      onChange={(e) => setWifiHidden(e.target.checked)}
                      className="rounded bg-slate-800 border-white/20"
                    />
                    <span>បណ្ដាញលាក់ (Hidden)</span>
                  </label>
                </div>
              </div>
            )}

            {/* TAB 4: CONTACT VCARD */}
            {activeTab === "contact" && (
              <div className="space-y-3 p-4 rounded-2xl bg-slate-900/80 border border-white/10">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                  <User className="w-4 h-4" />
                  <span>កាតទំនាក់ទំនងឌីជីថល (vCard) • ស្កេនរក្សាទុកក្នុងទូរស័ព្ទភ្លាមៗ</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-300">ឈ្មោះពេញ (Full Name)</label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-300">លេខទូរស័ព្ទ (Phone)</label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-300">អ៊ីមែល (Email)</label>
                    <input
                      type="text"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-300">ក្រុមហ៊ុន / ស្ថាប័ន</label>
                    <input
                      type="text"
                      value={contactOrg}
                      onChange={(e) => setContactOrg(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. Color & Style Customization Controls */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-400" />
                <span>ស្ទីលពណ៌ និងការរចនា (Design &amp; Color Presets)</span>
              </label>

              {/* Color Presets */}
              <div className="flex flex-wrap items-center gap-2">
                {COLOR_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setDarkColor(p.dark);
                      setLightColor(p.light);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      darkColor === p.dark && lightColor === p.light
                        ? "border-sky-400 bg-sky-500/20 text-white font-bold shadow-sm"
                        : "border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20"
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/30"
                      style={{ backgroundColor: p.dark }}
                    />
                    <span>{p.name.split(" ")[0]}</span>
                  </button>
                ))}
              </div>

              {/* Advanced Controls: Error Correction */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/10 text-xs">
                <span className="text-slate-300">កម្រិតធន់នឹងស្នាមខូច (Error Correction Level)៖</span>
                <div className="flex items-center gap-1">
                  {(["L", "M", "Q", "H"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setErrorCorrectionLevel(lvl)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        errorCorrectionLevel === lvl
                          ? "bg-sky-500 text-white shadow-sm"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live QR Preview & Actions (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-slate-900/60 p-4 sm:p-5 rounded-3xl border border-white/10">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                  <span>ទិដ្ឋភាព QR Code ផ្ទាល់ (Live Preview)</span>
                </span>
                <span className="text-[10px] text-slate-400">ទម្រង់រូបភាពច្បាស់ HD (.PNG)</span>
              </div>

              {/* QR Preview Box with Frame */}
              <div className="relative p-5 sm:p-6 rounded-3xl bg-slate-950 border border-white/15 flex flex-col items-center justify-center shadow-2xl">
                <div
                  onClick={handleSaveToPhoneGallery}
                  className="relative p-3.5 sm:p-4 rounded-2xl bg-white shadow-xl transition-transform hover:scale-[1.02] cursor-pointer group"
                  title="ចុចលើរូបភាពដើម្បីរក្សាទុកក្នុង Gallery របស់ទូរសព្ទ"
                >
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="QR Code Preview"
                      className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-52 h-52 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    </div>
                  )}
                  {/* Hover / Tap overlay cue */}
                  <div className="absolute inset-0 bg-black/35 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold gap-1 pointer-events-none">
                    <Smartphone className="w-6 h-6 text-emerald-300" />
                    <span>រក្សាទុកក្នុង Gallery</span>
                  </div>
                </div>

                {/* Subtitle Scan Instruction & Gallery Tip */}
                <div className="mt-3.5 text-center space-y-1">
                  <div className="text-xs font-bold text-slate-200 flex items-center justify-center gap-1">
                    <span>📷 ស្កេនកាមេរ៉ា ឬចុចលើរូបដើម្បីរក្សាទុក</span>
                  </div>
                  <div className="text-[11px] text-emerald-300/90 font-medium">
                    💡 ទូរស័ព្ទ៖ ចុចសង្កត់លើរូប (Long-press) ដើម្បី Save to Photos
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[260px] mx-auto">
                    {getComputedPayload()}
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION SECTION: SAVE TO GALLERY & DOWNLOAD */}
            <div className="space-y-2.5 pt-1">
              {/* PRIMARY PROMINENT ACTION: SAVE TO PHONE GALLERY */}
              <div className="p-2.5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900/90 to-teal-950/70 border border-emerald-500/50 shadow-lg space-y-1.5">
                <button
                  type="button"
                  onClick={handleSaveToPhoneGallery}
                  disabled={isSavingToGallery}
                  className="w-full py-3 px-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
                  title="រក្សាទុករូបភាព QR Code ចូលក្នុង Gallery / Photos របស់ទូរសព្ទ"
                >
                  {isSavingToGallery ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Smartphone className="w-4 h-4 text-emerald-100" />
                  )}
                  <span>💾 រក្សាទុកក្នុង Gallery (ទូរស័ព្ទ / Phone Photos)</span>
                </button>
                <div className="text-[10.5px] text-emerald-300/90 text-center font-medium">
                  ✨ រូបភាព QR ពិតប្រាកដ ១០០% ចូលទៅក្នុង Album រូបភាពទូរស័ព្ទភ្លាមៗ
                </div>
              </div>

              {/* SECONDARY ROW: IMAGE FILE FORMATS */}
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between pt-0.5">
                <div className="flex items-center gap-1">
                  <ImageDown className="w-3.5 h-3.5 text-sky-400" />
                  <span>ទាញយក File រូបភាព (Image File Downloads)</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-normal">ទម្រង់រូបភាព .PNG / .SVG</span>
              </div>

              {/* Three Real Image File Download Buttons */}
              <div className="grid grid-cols-3 gap-1.5">
                {/* 1. Download PNG Image */}
                <button
                  type="button"
                  onClick={() => handleDownloadImage("png")}
                  disabled={Boolean(isDownloading)}
                  className="py-2.5 px-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold flex flex-col items-center justify-center gap-1 shadow-md shadow-sky-600/20 transition-all cursor-pointer disabled:opacity-50"
                  title="ទាញយករូបភាព QR Code កម្រិតច្បាស់ខ្ពស់ (.PNG) បើកមើលបានគ្រប់ទូរស័ព្ទ និងកុំព្យូទ័រ"
                >
                  {isDownloading === "png" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 text-white" />
                  )}
                  <span>រូបភាព .PNG</span>
                </button>

                {/* 2. Download Poster Card PNG */}
                <button
                  type="button"
                  onClick={() => handleDownloadImage("card")}
                  disabled={Boolean(isDownloading)}
                  className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-[11px] font-bold flex flex-col items-center justify-center gap-1 shadow-md transition-all cursor-pointer disabled:opacity-50"
                  title="ទាញយកជាប័ណ្ណ Poster HD មានស៊ុម រូបភាព QR និងអក្សរខ្មែរស្អាត (.PNG)"
                >
                  {isDownloading === "card" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  )}
                  <span>ប័ណ្ណ Poster HD</span>
                </button>

                {/* 3. Download Vector SVG */}
                <button
                  type="button"
                  onClick={() => handleDownloadImage("svg")}
                  disabled={Boolean(isDownloading)}
                  className="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold flex flex-col items-center justify-center gap-1 border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
                  title="ទាញយកជាវ៉ិចទ័រ SVG សម្រាប់ព្រីនធំៗមិនបែកគ្រាប់ (.SVG)"
                >
                  {isDownloading === "svg" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Layers className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>វ៉ិចទ័រ .SVG</span>
                </button>
              </div>

              {/* Copy Image & Copy Link Buttons */}
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={handleCopyImageToClipboard}
                  className="py-2 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center justify-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
                  title="ចម្លងរូបភាព QR ទៅ Clipboard ដើម្បីចុច Paste ក្នុង Telegram, Messenger, Word, PowerPoint"
                >
                  {isCopiedImage ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300 font-bold">បានចម្លងរូបភាព!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-indigo-400" />
                      <span>ចម្លងរូបភាព QR</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-2 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center justify-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
                  title="ចម្លងតំណភ្ជាប់ ឬទិន្នន័យ QR"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300 font-bold">បានចម្លង Link!</span>
                    </>
                  ) : (
                    <>
                      <Link className="w-3.5 h-3.5 text-sky-400" />
                      <span>ចម្លងតំណភ្ជាប់</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ACTION SECTION 2: EXPORT TO TELEGRAM, MESSENGER, SHARE */}
            <div className="space-y-2 pt-1 border-t border-white/10">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Share2 className="w-3 h-3 text-emerald-400" />
                  <span>នាំចេញ &amp; ចែករំលែក (Export &amp; Share)</span>
                </div>
                <span className="text-[10px] text-sky-400">Telegram &amp; Messenger</span>
              </div>

              {/* Primary Social Export Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {/* 1. Telegram Export Button */}
                <button
                  type="button"
                  onClick={handleExportTelegramShare}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 transition-all cursor-pointer"
                  title="នាំចេញ និងចែករំលែកកូដ QR តាម Telegram ភ្លាមៗ"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>នាំចេញតាម Telegram</span>
                </button>

                {/* 2. Chat Messenger Export Button */}
                <button
                  type="button"
                  onClick={handleExportMessenger}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600 hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                  title="នាំចេញ និងផ្ញើកូដ QR តាម Facebook Chat Messenger"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>នាំចេញតាម Messenger</span>
                </button>
              </div>

              {/* Direct Telegram Chat Sender Modal / Field */}
              {showTelegramSendInput ? (
                <div className="p-2.5 rounded-xl bg-slate-800/90 border border-sky-400/40 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs text-sky-300 font-bold">
                    <span>ផ្ញើផ្ទាល់ទៅកាន់ Telegram Chat ID៖</span>
                    <button
                      type="button"
                      onClick={() => setShowTelegramSendInput(false)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={telegramChatIdInput}
                      onChange={(e) => setTelegramChatIdInput(e.target.value)}
                      placeholder="បញ្ចូល Chat ID ឧ. 123456789"
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/20 text-white text-xs focus:outline-none focus:border-sky-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleSendToTelegramBot()}
                      disabled={isSendingToTelegram}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      {isSendingToTelegram ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>ផ្ញើ</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowTelegramSendInput(true)}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] flex items-center justify-center gap-1 border border-white/10 transition-colors cursor-pointer"
                    title="ផ្ញើកូដ QR នេះផ្ទាល់ទៅកាន់ Telegram Chat ID ណាមួយ"
                  >
                    <Smartphone className="w-3 h-3 text-sky-400" />
                    <span>ផ្ញើទៅ Chat ID</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleUniversalShare}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] flex items-center justify-center gap-1 border border-white/10 transition-colors cursor-pointer"
                    title="ចែករំលែកជាសកល (Native Share ទៅគ្រប់កម្មវិធី)"
                  >
                    <Share2 className="w-3 h-3 text-emerald-400" />
                    <span>ចែករំលែកសកល</span>
                  </button>
                </div>
              )}

              {/* Send Result into App Chat */}
              <button
                type="button"
                onClick={handleSendToChat}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 border border-emerald-400/40 shadow-sm transition-all cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>បញ្ចូលលទ្ធផលកូដ QR នេះទៅក្នុងការសន្ទនា (Chat)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Phone Gallery Saver Modal (100% Genuine QR Code Image Saver) */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm sm:max-w-md rounded-3xl bg-slate-900 border border-emerald-500/40 p-5 sm:p-6 text-white shadow-2xl flex flex-col items-center">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowGalleryModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-2xl bg-emerald-500/20 text-emerald-400">
                <Smartphone className="w-5 h-5" />
              </span>
              <h3 className="text-base font-bold text-white">
                រក្សាទុកក្នុង Gallery ទូរស័ព្ទ
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 text-center mb-3">
              ទម្រង់រូបភាព QR Code ពិតប្រាកដ ១០០% សម្រាប់រក្សាទុកក្នុង Album ទូរស័ព្ទ
            </p>

            {/* Real QR Code Image Box */}
            <div className="relative p-3.5 sm:p-4 rounded-2xl bg-white shadow-2xl mb-3 flex items-center justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-52 h-52 sm:w-56 sm:h-56 object-contain rounded-lg"
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
                </div>
              )}
            </div>

            {/* Mobile Instruction Guide with highlight */}
            <div className="w-full p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-center space-y-1 mb-4">
              <div className="font-bold flex items-center justify-center gap-1.5 text-emerald-200">
                <span>👆 ការណែនាំរក្សាទុកចូលក្នុង Gallery ទូរស័ព្ទ</span>
              </div>
              <div className="text-[11px] text-emerald-100/90 leading-relaxed">
                សូម <b>ចុចសង្កត់លើរូបភាព QR ខាងលើ (Press & Hold)</b> រួចជ្រើសរើស <b>«Save Image» ឬ «រក្សាទុករូបភាព»</b> នោះរូបភាពនឹងចូលទៅក្នុង <b>Gallery / Photos</b> របស់ទូរសព្ទភ្លាមៗ!
              </div>
            </div>

            {/* Action Buttons in Gallery Modal */}
            <div className="w-full space-y-2">
              <button
                type="button"
                onClick={handleSaveToPhoneGallery}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer active:scale-98"
              >
                <Smartphone className="w-4 h-4" />
                <span>បើកផ្ទាំង Save to Photos (Native Share)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadImage("png")}
                  className="py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ទាញយក File PNG</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyImageToClipboard}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>ចម្លងរូបភាព QR</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handleExportTelegramShare}
                  className="py-2 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-medium flex items-center justify-center gap-1.5 border border-sky-400/30 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ផ្ញើតាម Telegram</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportMessenger}
                  className="py-2 px-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-medium flex items-center justify-center gap-1.5 border border-indigo-400/30 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>ផ្ញើតាម Messenger</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
