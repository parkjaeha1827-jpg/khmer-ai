// ============================================================================
// UNIVERSAL QR CODE STUDIO ENGINE (ម៉ាស៊ីនបង្កើត QR CODE ឆ្លាតវៃគ្រប់ទម្រង់)
// Supports generating QR Codes from Text, Image, Video, Word, Excel, PDF,
// PowerPoint, WiFi, Contact, URL with custom styles, colors, and direct file access!
// 100% Free, Zero-Downtime, and Instant!
// ============================================================================

import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const requireModule = createRequire(import.meta.url);
let _ResvgClass = null;
function getResvg() {
  if (!_ResvgClass) {
    try {
      const pkg = ["@resvg", "resvg-js"].join("/");
      const mod = requireModule(pkg);
      _ResvgClass = mod.Resvg || mod.default?.Resvg || mod;
    } catch {}
  }
  return _ResvgClass;
}
import {
  sendTelegramPhotoBufferServer,
  sendTelegramDocumentBufferServer,
} from "./telegram-id-chat.js";
import { sendTelegramHtml } from "./telegram-webhook.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const QR_UPLOADS_DIR = path.resolve(__dirname, "../public/uploads/qr");
export const QR_REGISTRY_FILE = path.resolve(__dirname, "../.qr-files-registry.json");

// Ensure directory exists
try {
  if (!fs.existsSync(QR_UPLOADS_DIR)) {
    fs.mkdirSync(QR_UPLOADS_DIR, { recursive: true });
  }
} catch {}

let qrFilesRegistry = new Map();

function loadQrRegistry() {
  try {
    if (fs.existsSync(QR_REGISTRY_FILE)) {
      const raw = JSON.parse(fs.readFileSync(QR_REGISTRY_FILE, "utf-8"));
      if (Array.isArray(raw)) {
        qrFilesRegistry = new Map(raw.map((item) => [item.id, item]));
      }
    }
  } catch {}
}

function saveQrRegistry() {
  try {
    const list = Array.from(qrFilesRegistry.values());
    // Keep last 500 entries to prevent infinite storage growth
    const trimmed = list.slice(-500);
    fs.writeFileSync(QR_REGISTRY_FILE, JSON.stringify(trimmed, null, 2), "utf-8");
  } catch {}
}

loadQrRegistry();

export function getPublicBaseUrl() {
  return (
    process.env.APPLET_URL ||
    process.env.PUBLIC_URL ||
    "https://ais-dev-olfj5axr5tu3xswdlb7w73-447371415023.asia-southeast1.run.app"
  ).replace(/\/$/, "");
}

/**
 * Categorizes a file based on its extension and MIME type
 */
export function categorizeFile(fileName = "", mimeType = "") {
  const ext = path.extname(fileName || "").toLowerCase().replace(".", "");
  const mime = String(mimeType || "").toLowerCase();

  // Word Document
  if (
    ext === "docx" ||
    ext === "doc" ||
    mime.includes("wordprocessingml") ||
    mime.includes("msword")
  ) {
    return {
      category: "word",
      labelKhmer: "ឯកសារ Word (DOCX/DOC)",
      labelEn: "Word Document",
      icon: "📄",
      badgeColor: "#2563eb",
      mimeType: mime || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
  }

  // Excel Spreadsheet
  if (
    ext === "xlsx" ||
    ext === "xls" ||
    ext === "csv" ||
    mime.includes("spreadsheetml") ||
    mime.includes("ms-excel")
  ) {
    return {
      category: "excel",
      labelKhmer: "តារាង Excel (XLSX/XLS)",
      labelEn: "Excel Spreadsheet",
      icon: "📊",
      badgeColor: "#16a34a",
      mimeType: mime || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  }

  // PDF Document
  if (ext === "pdf" || mime.includes("pdf")) {
    return {
      category: "pdf",
      labelKhmer: "ឯកសារ PDF",
      labelEn: "PDF Document",
      icon: "📑",
      badgeColor: "#dc2626",
      mimeType: "application/pdf",
    };
  }

  // PowerPoint Presentation
  if (
    ext === "pptx" ||
    ext === "ppt" ||
    mime.includes("presentationml") ||
    mime.includes("ms-powerpoint")
  ) {
    return {
      category: "powerpoint",
      labelKhmer: "បទបង្ហាញ PowerPoint (PPTX)",
      labelEn: "PowerPoint Presentation",
      icon: "📽️",
      badgeColor: "#ea580c",
      mimeType: mime || "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };
  }

  // Video
  if (
    ext === "mp4" ||
    ext === "mov" ||
    ext === "webm" ||
    ext === "mkv" ||
    ext === "avi" ||
    mime.startsWith("video/")
  ) {
    return {
      category: "video",
      labelKhmer: "វីដេអូ (Video)",
      labelEn: "Video Clip",
      icon: "🎬",
      badgeColor: "#9333ea",
      mimeType: mime || "video/mp4",
    };
  }

  // Image
  if (
    ext === "jpg" ||
    ext === "jpeg" ||
    ext === "png" ||
    ext === "webp" ||
    ext === "gif" ||
    ext === "svg" ||
    mime.startsWith("image/")
  ) {
    return {
      category: "image",
      labelKhmer: "រូបភាព (Image)",
      labelEn: "Image / Photo",
      icon: "🖼️",
      badgeColor: "#0284c7",
      mimeType: mime || "image/png",
    };
  }

  // Audio
  if (
    ext === "mp3" ||
    ext === "wav" ||
    ext === "m4a" ||
    ext === "ogg" ||
    ext === "opus" ||
    mime.startsWith("audio/")
  ) {
    return {
      category: "audio",
      labelKhmer: "សំឡេង (Audio/Voice)",
      labelEn: "Audio / Voice",
      icon: "🎙️",
      badgeColor: "#d97706",
      mimeType: mime || "audio/mpeg",
    };
  }

  // Default Document / File
  return {
    category: "document",
    labelKhmer: "ឯកសារទូទៅ",
    labelEn: "General Document",
    icon: "📁",
    badgeColor: "#475569",
    mimeType: mime || "application/octet-stream",
  };
}

/**
 * Stores a file buffer on the server and registers its metadata for QR access
 */
export async function storeFileForQr(buffer, originalFileName = "file.dat", customMime = "") {
  if (!buffer || buffer.length === 0) {
    throw new Error("Empty file buffer");
  }

  const binaryBuf = Buffer.isBuffer(buffer)
    ? buffer
    : Buffer.from(String(buffer).replace(/^data:[^;]+;base64,/, ""), "base64");

  const fileInfo = categorizeFile(originalFileName, customMime);
  const ext = path.extname(originalFileName) || `.${fileInfo.category}`;
  const randomSuffix = crypto.randomBytes(6).toString("hex");
  const fileId = `qr_${Date.now()}_${randomSuffix}`;
  const safeDiskName = `${fileId}${ext}`;
  const diskPath = path.join(QR_UPLOADS_DIR, safeDiskName);

  fs.writeFileSync(diskPath, binaryBuf);

  const fileRecord = {
    id: fileId,
    fileName: originalFileName,
    diskName: safeDiskName,
    size: binaryBuf.length,
    mimeType: fileInfo.mimeType,
    category: fileInfo.category,
    categoryLabel: fileInfo.labelKhmer,
    icon: fileInfo.icon,
    createdAt: Date.now(),
    accessUrl: `${getPublicBaseUrl()}/api/qr/file/${fileId}`,
    downloadUrl: `${getPublicBaseUrl()}/api/qr/file/${fileId}?download=1`,
  };

  qrFilesRegistry.set(fileId, fileRecord);
  saveQrRegistry();

  return fileRecord;
}

export function getFileRecord(fileId) {
  return qrFilesRegistry.get(fileId) || null;
}

/**
 * Generates raw QR Code as Data URL (PNG)
 */
export async function generateQrCodeDataUrl(content, options = {}) {
  const {
    errorCorrectionLevel = "M",
    margin = 2,
    width = 480,
    darkColor = "#000000",
    lightColor = "#ffffff",
  } = options;

  return await QRCode.toDataURL(content, {
    errorCorrectionLevel,
    margin,
    width,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  });
}

/**
 * Generates raw QR Code as PNG Buffer
 */
export async function generateQrCodePngBuffer(content, options = {}) {
  const {
    errorCorrectionLevel = "M",
    margin = 2,
    width = 480,
    darkColor = "#000000",
    lightColor = "#ffffff",
  } = options;

  return await QRCode.toBuffer(content, {
    type: "png",
    errorCorrectionLevel,
    margin,
    width,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  });
}

/**
 * Generates raw QR Code as SVG String
 */
export async function generateQrCodeSvg(content, options = {}) {
  const {
    errorCorrectionLevel = "M",
    margin = 2,
    width = 480,
    darkColor = "#000000",
    lightColor = "#ffffff",
  } = options;

  return await QRCode.toString(content, {
    type: "svg",
    errorCorrectionLevel,
    margin,
    width,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  });
}

function escapeXml(str = "") {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Generates a modern high-resolution poster card SVG for a QR Code
 * with file metadata, scan instructions, and beautiful Khmer typography
 */
export async function createQrPosterCardSvg(content, metadata = {}) {
  const {
    title = "QR Code ស្កេនទាញយក",
    subtitle = "ស្កេនជាមួយទូរស័ព្ទដើម្បីបើកមើល ឬទាញយកភ្លាមៗ",
    category = "general",
    icon = "📱",
    fileSize = 0,
    fileName = "",
    darkColor = "#0f172a",
    lightColor = "#ffffff",
  } = metadata;

  // Generate QR Code PNG Base64 for clean embedding
  const qrBase64 = await generateQrCodeDataUrl(content, {
    width: 420,
    margin: 2,
    errorCorrectionLevel: "H",
    darkColor,
    lightColor: "#ffffff",
  });

  const width = 800;
  const height = 1050;

  const escTitle = escapeXml(title.slice(0, 50));
  const escSubtitle = escapeXml(subtitle.slice(0, 80));
  const escFileName = escapeXml(fileName ? fileName.slice(0, 40) : "");
  const escFileSize = fileSize ? formatBytes(fileSize) : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <!-- Background Gradient -->
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0a101f" />
        <stop offset="50%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#1e1b4b" />
      </linearGradient>

      <!-- Card Container Gradient -->
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#1e293b" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#0f172a" stop-opacity="0.95" />
      </linearGradient>

      <!-- Glow Filter -->
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="15" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      <!-- Drop Shadow for QR Box -->
      <filter id="boxShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.45" />
      </filter>
    </defs>

    <!-- Outer Background -->
    <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

    <!-- Ambient Glow Orbs -->
    <circle cx="150" cy="180" r="160" fill="#38bdf8" opacity="0.15" filter="url(#glow)" />
    <circle cx="650" cy="850" r="180" fill="#ec4899" opacity="0.12" filter="url(#glow)" />
    <circle cx="700" cy="200" r="140" fill="#818cf8" opacity="0.15" filter="url(#glow)" />

    <!-- Main Outer Card Border -->
    <rect x="40" y="40" width="720" height="970" rx="36" fill="url(#cardGrad)" stroke="#334155" stroke-width="2" />

    <!-- Header Icon Pill Badge -->
    <g transform="translate(400, 110)">
      <rect x="-160" y="-32" width="320" height="64" rx="32" fill="#1e1b4b" stroke="#6366f1" stroke-width="2" />
      <text x="0" y="10" text-anchor="middle" fill="#c7d2fe" font-size="24" font-weight="bold" font-family="'Kantumruy Pro', 'Noto Sans Khmer', sans-serif">
        ${escapeXml(icon)} កូដ QR ឆ្លាតវៃ AI
      </text>
    </g>

    <!-- Main Title -->
    <text x="400" y="225" text-anchor="middle" fill="#ffffff" font-size="34" font-weight="bold" font-family="'Kantumruy Pro', 'Noto Sans Khmer', sans-serif">
      ${escTitle}
    </text>

    <!-- Subtitle -->
    <text x="400" y="270" text-anchor="middle" fill="#94a3b8" font-size="20" font-family="'Kantumruy Pro', 'Noto Sans Khmer', sans-serif">
      ${escSubtitle}
    </text>

    <!-- Optional File Info Badge (Word, Excel, PDF, PowerPoint, Video, Image) -->
    ${
      escFileName
        ? `
    <g transform="translate(400, 315)">
      <rect x="-240" y="-22" width="480" height="44" rx="22" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5" />
      <text x="0" y="7" text-anchor="middle" fill="#38bdf8" font-size="17" font-weight="bold" font-family="'Kantumruy Pro', 'Noto Sans Khmer', sans-serif">
        ${escapeXml(icon)} ${escFileName} ${escFileSize ? `(${escFileSize})` : ""}
      </text>
    </g>`
        : ""
    }

    <!-- White QR Code Box with Rounded Corners -->
    <g filter="url(#boxShadow)">
      <rect x="180" y="370" width="440" height="440" rx="32" fill="#ffffff" stroke="#e2e8f0" stroke-width="4" />
      <!-- Embedded QR Code Image -->
      <image x="195" y="385" width="410" height="410" href="${qrBase64}" />
    </g>

    <!-- Scan Instruction Pill Banner -->
    <g transform="translate(400, 860)">
      <rect x="-280" y="-28" width="560" height="56" rx="28" fill="#10b981" fill-opacity="0.2" stroke="#10b981" stroke-width="2" />
      <text x="0" y="9" text-anchor="middle" fill="#6ee7b7" font-size="21" font-weight="bold" font-family="'Kantumruy Pro', 'Noto Sans Khmer', sans-serif">
        📷 បើកកាមេរ៉ាទូរស័ព្ទស្កេនដើម្បីចូលប្រើភ្លាមៗ
      </text>
    </g>

    <!-- Footer Security & Speed Branding -->
    <text x="400" y="945" text-anchor="middle" fill="#64748b" font-size="16" font-family="'Kantumruy Pro', 'Noto Sans Khmer', sans-serif">
      🔒 សុវត្ថិភាពខ្ពស់ ១០០% • ដំណើរការរហ័ស • គ្មានការផ្សាយពាណិជ្ជកម្ម
    </text>
    <text x="400" y="975" text-anchor="middle" fill="#475569" font-size="14" font-family="'Kantumruy Pro', 'Noto Sans Khmer', sans-serif">
      Khmer Super AI Agent • Universal QR Code Engine 2026
    </text>
  </svg>`;
}

/**
 * Renders the QR Poster Card into a crisp PNG Buffer using Resvg
 */
export async function createQrPosterCardPngBuffer(content, metadata = {}) {
  const svg = await createQrPosterCardSvg(content, metadata);
  const ResvgClass = getResvg();
  if (!ResvgClass) return Buffer.alloc(0);
  const resvg = new ResvgClass(svg, {
    fitTo: { mode: "width", value: 800 },
    shapeRendering: 2,
    textRendering: 1,
    imageRendering: 0,
  });
  const pngData = resvg.render();
  return pngData.asPng();
}

/**
 * Checks if user text indicates intent to generate a QR Code
 */
export function isQrCodeIntentServer(text = "") {
  const clean = String(text || "").trim();
  if (!clean) return false;

  // Slash commands
  if (/^\/(?:qr|qrcode|qrfile|makeqr|genqr|កូដqr|បង្កើតqr)\b/i.test(clean)) {
    return true;
  }

  // Khmer & English natural language intent
  if (
    /(?:(?:ការ\s*)?បង្កើត\s*(?:កូដ\s*)?qr|ធ្វើ\s*(?:កូដ\s*)?qr|បម្លែង\s*(?:ជា\s*)?(?:កូដ\s*)?qr|យក\s*(?:កូដ\s*)?qr|សុំ\s*(?:កូដ\s*)?qr|កូដ\s*qr|qr\s*code|ស្កេន\s*qr|qr\s*រូបភាព|qr\s*វីដេអូ|qr\s*word|qr\s*excel|qr\s*pdf|qr\s*powerpoint|generate\s*qr|create\s*qr|make\s*qr)/i.test(
      clean
    )
  ) {
    return true;
  }

  // Exact match for "qr" or "qrcode"
  if (/^(?:qr|qrcode|កូដ\s*qr|បង្កើត\s*qr)$/i.test(clean)) {
    return true;
  }

  return false;
}

/**
 * Checks if user is asking for help or having difficulty creating QR codes
 */
export function isQrHelpOrIssueQuery(text = "") {
  const clean = String(text || "").trim();
  if (!clean) return false;
  return /(?:មិនបាន|មិនកើត|មិនចេញ|ជួយផង|ជួយខ្ញុំ|យ៉ាងដូចម្តេច|យ៉ាងម៉េច|របៀប|ចង់ដឹង|help|how to|cannot|can't)/i.test(
    clean
  );
}

/**
 * Extracts content from a QR prompt (strips /qr, /qrcode, natural Khmer prefixes, etc.)
 */
export function parseQrPromptContent(text = "") {
  let clean = String(text || "").trim();
  if (!clean) return "";

  // If there is an explicit URL embedded in the text
  const urlMatch = clean.match(/(https?:\/\/[^\s]+)/i);
  if (urlMatch) {
    return urlMatch[1];
  }

  // Strip leading slash commands e.g. /qr, /qrcode, /បង្កើតqr
  clean = clean.replace(/^\/(?:qr|qrcode|qrfile|makeqr|genqr|កូដqr|បង្កើតqr)(?:@\S+)?\s*/i, "").trim();

  // Strip natural language phrases e.g. "សូមជួយបង្កើត qr code សម្រាប់", "បង្កើត qr លើ", etc.
  clean = clean.replace(
    /^(?:សូម\s*)?(?:ជួយ\s*)?(?:ខ្ញុំ\s*)?(?:ការ\s*)?(?:ចង់\s*)?(?:បង្កើត|ធ្វើ|បម្លែងជា|បម្លែង|យក|សុំ)\s*(?:កូដ\s*)?qr(?:\s*code)?(?:\s*(?:សម្រាប់|លើ|ទៅលើ|ឱ្យ|ជូន|ខ្ញុំ|លីង|តំណភ្ជាប់|អត្ថបទ|ទិន្នន័យ|:|\៖))*\s*/i,
    ""
  ).trim();

  // Strip leading "កូដ QR:" or "QR Code:" or "QR:"
  clean = clean.replace(/^(?:កូដ\s*qr|qr\s*code|qr)\s*(?::|\៖)?\s*/i, "").trim();

  return clean;
}

/**
 * Sends helpful QR code instructions with 1-click demos when user asks for help or cannot do it
 */
export async function sendQrCodeHelpAndInstructions(token, chatId) {
  const studioUrl = `${getPublicBaseUrl()}/?studio=qr&tg_chat_id=${encodeURIComponent(
    String(chatId)
  )}`;

  const helpHtml =
    `📱✨ <b>ការណែនាំបង្កើតកូដ QR Code ក្នុង Telegram Bot យ៉ាងងាយស្រួលបំផុត!</b>\n\n` +
    `សូមកុំបារម្ភ! លោកអ្នកអាចបង្កើត QR Code ក្នុង Telegram Bot នេះបានយ៉ាងរហ័សតាម <b>៣ វិធីងាយៗ</b>៖\n\n` +
    `<b>១. វាយពាក្យបញ្ជាផ្ទាល់ (លឿនបំផុត)៖</b>\n` +
    `• វាយ <code>/qr https://តំណភ្ជាប់របស់អ្នក.com</code>\n` +
    `• ឧទាហរណ៍៖ <code>/qr https://facebook.com</code> ឬ <code>/qr 012345678</code>\n\n` +
    `<b>២. ផ្ញើតំណភ្ជាប់ (Link) ឬអក្សរចូលមកឥឡូវនេះ៖</b>\n` +
    `• គ្រាន់តែផ្ញើតំណភ្ជាប់ Link វេបសាយ ឬអត្ថបទណាមួយចូលមកក្នុងឆាតនេះឥឡូវនេះ AI នឹងបម្លែងជា QR Code ជូនភ្លាមៗ!\n\n` +
    `<b>៣. ផ្ញើឯកសារ ឬរូបភាពចូល៖</b>\n` +
    `• ផ្ញើហ្វាល់ឯកសារណាមួយចូល (Word, Excel, PDF, PowerPoint, រូបភាព, វីដេអូ ឬ MP3)\n` +
    `• រួចដាក់ Caption <code>/qr</code> ឬ Reply លើហ្វាល់នោះជាមួយពាក្យ <code>/qr</code>!\n\n` +
    `💾 <b>ការរក្សាទុកក្នុង Gallery ទូរស័ព្ទ៖</b>\n` +
    `ពេល Bot បង្កើតរូបភាព QR រួច លោកអ្នកអាចចុចបើករូបភាព រួចចុចសញ្ញា <b>⋮</b> (ខាងលើស្តាំ) ហើយជ្រើសរើស <b>«Save to Gallery»</b> ដើម្បីរក្សាទុកក្នុងទូរស័ព្ទភ្លាមៗ ឬទាញយកឯកសាររូបភាព PNG ដែលបានភ្ជាប់មកជាមួយ!`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "📝 សាកល្បង៖ បង្កើត QR ពី Link គំរូ", callback_data: "qr_demo:link" },
        { text: "📶 សាកល្បង៖ QR ភ្ជាប់ WiFi", callback_data: "qr_demo:wifi" },
      ],
      [
        { text: "🌐 បើក QR Studio ពេញលេញលើ Web", web_app: { url: studioUrl } },
      ],
      [
        { text: "➕ ផ្ញើតំណភ្ជាប់ថ្មី (Send Link/Text)", callback_data: "qr_mode:new" },
      ],
    ],
  };

  await sendTelegramHtml(token, chatId, helpHtml, keyboard);
}

/**
 * Sends a rich QR Code reply in Telegram with image, download buttons, and web preview
 */
export async function sendTelegramQrCodeResponse(token, chatId, qrBuffer, options = {}) {
  const {
    captionHtml = "",
    fileUrl = "",
    fileName = "",
    category = "general",
    replyToMessageId = null,
    content = "",
  } = options;

  const contentToEncode = content || fileUrl || `${getPublicBaseUrl()}/?studio=qr`;
  const downloadPngUrl = `${getPublicBaseUrl()}/api/qr/download?content=${encodeURIComponent(
    contentToEncode
  )}&format=png`;
  const downloadCardUrl = `${getPublicBaseUrl()}/api/qr/download?content=${encodeURIComponent(
    contentToEncode
  )}&format=card&asCard=true`;

  const studioUrl = `${getPublicBaseUrl()}/?studio=qr&tg_chat_id=${encodeURIComponent(
    String(chatId)
  )}`;

  const buttons = [];

  // Row 1: Direct Download Buttons (PNG & Poster Card HD)
  buttons.push([
    { text: "📥 ទាញយក PNG (HD)", url: downloadPngUrl },
    { text: "🖼️ ទាញយក Poster HD", url: downloadCardUrl },
  ]);

  // Row 2: Original file download (if user attached Word, Excel, PDF, etc.)
  if (fileUrl) {
    buttons.push([
      { text: `📄 ទាញយកឯកសារ (${fileName || "File"})`, url: fileUrl },
    ]);
  }

  // Row 3: Export via Telegram and Messenger direct share links
  const targetShareUrl = fileUrl || `${getPublicBaseUrl()}/?studio=qr`;
  const shareText = `📱 ស្កេនកូដ QR Code សម្រាប់៖ ${fileName || "ឯកសារ"}`;
  const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(targetShareUrl)}&text=${encodeURIComponent(shareText)}`;
  const messengerShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(targetShareUrl)}`;

  buttons.push([
    { text: "✈️ នាំចេញតាម Telegram", url: tgShareUrl },
    { text: "💬 នាំចេញតាម Messenger", url: messengerShareUrl },
  ]);

  // Row 4: Gallery & Web Studio
  buttons.push([
    { text: "💾 រក្សាទុកក្នុង Gallery (Web)", web_app: { url: studioUrl } },
    { text: "➕ បង្កើត QR ថ្មី", callback_data: "qr_mode:new" },
  ]);

  const replyMarkup = { inline_keyboard: buttons };

  // 1. Send framed photo preview with caption and inline action buttons
  const photoRes = await sendTelegramPhotoBufferServer(
    token,
    chatId,
    qrBuffer,
    "image/png",
    "qrcode-poster.png",
    captionHtml,
    replyMarkup,
    replyToMessageId
  );

  // 2. Also send the uncompressed PNG image file as a document for 1-tap direct saving into Gallery/Downloads
  try {
    const rawPng = await generateQrCodePngBuffer(contentToEncode, {
      width: 1024,
      errorCorrectionLevel: "H",
    });
    const safeBaseName = (fileName || "qrcode")
      .replace(/[^a-zA-Z0-9_\-\u1780-\u17FF]/g, "_")
      .slice(0, 30);
    const docName = `qrcode_${safeBaseName}_${Date.now()}.png`;

    await sendTelegramDocumentBufferServer(
      token,
      chatId,
      rawPng,
      "image/png",
      docName,
      `📥 <b>ឯកសាររូបភាព QR Code ច្បាស់ HD (.PNG)៖</b>\n<i>ចុចសញ្ញា ⬇️ (Download) លើ File នេះ ឬចុចសញ្ញា ⋮ ដើម្បីរក្សាទុកក្នុង Gallery / Downloads ទូរស័ព្ទភ្លាមៗ!</i>`
    );
  } catch (err) {
    console.warn("Could not send standalone QR document file:", err);
  }

  return photoRes;
}

/**
 * Sends interactive QR Code Welcome and instructions menu to Telegram user
 */
export async function sendQrCodeInteractiveMenu(token, chatId) {
  const studioUrl = `${getPublicBaseUrl()}/?studio=qr&tg_chat_id=${encodeURIComponent(
    String(chatId)
  )}`;

  const welcomeHtml =
    `📱✨ <b>ស្ទូឌីយោបង្កើត QR Code ឆ្លាតវៃ (Universal QR Studio)</b>\n\n` +
    `ប្រព័ន្ធអាចបង្កើត QR Code គុណភាពខ្ពស់ភ្លាមៗពី៖\n` +
    `• 📝 <b>អក្សរ & តំណភ្ជាប់ (Text / Links):</b> វាយ <code>/qr https://yourlink.com</code>\n` +
    `• 📄 <b>ឯកសារ Word (.docx, .doc):</b> ផ្ញើហ្វាល់ចូល រួចវាយ /qr\n` +
    `• 📊 <b>តារាង Excel (.xlsx, .xls, .csv):</b> ផ្ញើហ្វាល់ចូល រួចវាយ /qr\n` +
    `• 📑 <b>ឯកសារ PDF (.pdf):</b> ផ្ញើហ្វាល់ចូល រួចវាយ /qr\n` +
    `• 📽️ <b>បទបង្ហាញ PowerPoint (.pptx, .ppt):</b> ផ្ញើហ្វាល់ចូល រួចវាយ /qr\n` +
    `• 🖼️ <b>រូបភាព (Images):</b> ផ្ញើរូបថតចូល រួចវាយ /qr\n` +
    `• 🎬 <b>វីដេអូ (Videos):</b> ផ្ញើវីដេអូចូល រួចវាយ /qr\n\n` +
    `<i>💡 លោកអ្នកគ្រាន់តែផ្ញើឯកសារ រូបភាព ឬវីដេអូ រួចដាក់ Caption <code>/qr</code> (ឬ Reply លើវាជាមួយពាក្យ <code>/qr</code>) AI នឹងបង្កើតកូដ QR ជូនភ្លាមៗ!</i>`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "🌐 បើក QR Studio ពេញលេញលើ Web", web_app: { url: studioUrl } },
      ],
      [
        { text: "📝 បង្កើត QR ពីអក្សរ / Link គំរូ", callback_data: "qr_demo:link" },
        { text: "📶 បង្កើត QR ប្រព័ន្ធ WiFi", callback_data: "qr_demo:wifi" },
      ],
      [
        { text: "🛑 ចាកចេញ", callback_data: "exit_tool_mode" },
      ],
    ],
  };

  await sendTelegramHtml(token, chatId, welcomeHtml, keyboard);
}
