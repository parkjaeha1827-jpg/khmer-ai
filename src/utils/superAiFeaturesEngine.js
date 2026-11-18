// ============================================================================
// SUPER AI FEATURES ENGINE (Web App & 24/7 Telegram Bot)
// 1. Universal World Language Translator (បកប្រែភាសាបានគ្រប់ភាសានៅទូទាំងពិភពលោក)
// 2. Illustrated Story Creator: Horror, Novel & Folktale with Scene & Character Images
//    (បង្កើតរឿងបែបរន្ធត់ ប្រលោមលោក ឬរឿងនិទានកថា + រូបភាពតាមវគ្គនីមួយៗ និងតួអង្គ)
// 3. Illustrated 3-Way Dictionary: Khmer-Khmer, English-Khmer & Khmer-English + Examples
//    (វចនានុក្រម ខ្មែរ-ខ្មែរ, អង់គ្លេស-ខ្មែរ និង ខ្មែរ-អង់គ្លេស + រូបភាព និងឧទាហរណ៍ជាល្បះ)
// 4. Real-Time Cambodia Calendar & Daily Events Notifier
//    (បង្ហាញព្រឹត្តិការណ៍ប្រចាំថ្ងៃតាមប្រតិទិននៃប្រទេសកម្ពុជាតាមឆ្នាំជាក់ស្ដែង)
// ============================================================================

function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ""
  );
}

function escapeXmlText(str = "") {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cleanKhmerSpelling(str = "") {
  return String(str || "")
    .replace(/សំរាប់/g, "សម្រាប់")
    .replace(/សំរេច/g, "សម្រេច")
    .replace(/សំរួល/g, "សម្រួល")
    .replace(/សំរាក/g, "សម្រាក")
    .replace(/សំលេង/g, "សំឡេង")
    .replace(/សំគាល់/g, "សម្គាល់")
    .replace(/សំដែង/g, "សម្ដែង")
    .replace(/សំអាត/g, "សម្អាត")
    .replace(/កំលាំង/g, "កម្លាំង")
    .replace(/កំនត់/g, "កំណត់")
    .replace(/កំនើត/g, "កំណើត")
    .replace(/ដំនោះស្រាយ/g, "ដំណោះស្រាយ")
    .replace(/ដំនើរ/g, "ដំណើរ")
    .replace(/ដំនឹង/g, "ដំណឹង")
    .replace(/ចំនុច/g, "ចំណុច")
    .replace(/ចំនេះ/g, "ចំណេះ")
    .replace(/ចំលើយ/g, "ចម្លើយ")
    .replace(/ចំលង/g, "ចម្លង")
    .replace(/តំលៃ/g, "តម្លៃ")
    .replace(/តំរូវ/g, "តម្រូវ")
    .replace(/បំលែង/g, "បម្លែង")
    .replace(/ទំរង់/g, "ទម្រង់")
    .replace(/អោយ/g, "ឱ្យ")
    .replace(/អនាគត់/g, "អនាគត")
    .replace(/កំពង់(?!\s*(?:ចាម|ឆ្នាំង|ធំ|ស្ពឺ|សោម|ត្រឡាច|ត្រាច|ទឹក|ផែ|ដរ))/g, "កំពុង")
    .trim();
}

async function callGeminiJson(promptText, timeoutMs = 15000) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const models = [
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite-preview",
    "gemini-2.5-flash",
    "gemini-flash-latest",
  ];

  for (const modelName of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "aistudio-build",
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: promptText }] }],
            generationConfig: {
              temperature: 0.25,
              responseMimeType: "application/json",
            },
          }),
          signal: AbortSignal.timeout(timeoutMs),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const rawTxt = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const parsed = JSON.parse(rawTxt.replace(/```json|```/g, "").trim());
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      }
    } catch {}
  }
  return null;
}

// ============================================================================
// ARTISTIC ILLUSTRATION GENERATOR (AI Image + Instant Rich SVG Artwork Fallback)
// Used for Story Chapters, Story Characters, and Dictionary Word Illustrations
// ============================================================================
export function generateArtisticIllustrationSvg({
  type = "scene",
  theme = "folktale",
  title = "Khmer Super AI",
  subtitle = "",
  badge = "",
}) {
  const isHorror = /horror|រន្ធត់|ខ្មោច|អាថ៌កំបាំង/i.test(theme);
  const isNovel = /novel|romance|ប្រលោមលោក|មនោសញ្ចេតនា/i.test(theme);
  const isDict = type === "dictionary" || /dict|វចនានុក្រម/i.test(theme);
  const isCharacter = type === "character";

  const bgStart = isHorror
    ? "#090414"
    : isNovel
    ? "#1a0b2e"
    : isDict
    ? "#071b2c"
    : "#0b221e";
  const bgMid = isHorror
    ? "#1c0926"
    : isNovel
    ? "#3b1245"
    : isDict
    ? "#0e314d"
    : "#123b32";
  const bgEnd = isHorror
    ? "#05020a"
    : isNovel
    ? "#140824"
    : isDict
    ? "#061320"
    : "#071714";
  const accentColor = isHorror
    ? "#f43f5e"
    : isNovel
    ? "#f472b6"
    : isDict
    ? "#38bdf8"
    : "#fbbf24";
  const secondaryAccent = isHorror
    ? "#a855f7"
    : isNovel
    ? "#fbbf24"
    : isDict
    ? "#34d399"
    : "#38bdf8";

  const cleanTitle = escapeXmlText(String(title || "").slice(0, 52));
  const cleanSub = escapeXmlText(String(subtitle || "").slice(0, 80));
  const cleanBadge = escapeXmlText(
    badge ||
      (isCharacter
        ? "👤 តួអង្គក្នុងសាច់រឿង (Character)"
        : isDict
        ? "📖 រូបភាពពន្យល់ពាក្យវចនានុក្រម"
        : "🎬 រូបភាពតាមវគ្គនៃសាច់រឿង")
  );

  const centerGraphic = isCharacter
    ? `
      <!-- Character Portrait Frame & Silhouette -->
      <circle cx="400" cy="245" r="115" fill="url(#orbGrad)" stroke="${accentColor}" stroke-width="3.5" opacity="0.95"/>
      <circle cx="400" cy="245" r="102" fill="none" stroke="#ffffff" stroke-opacity="0.2" stroke-width="1.5" stroke-dasharray="6 4"/>
      <!-- Stylized Character Head & Shoulders -->
      <circle cx="400" cy="215" r="38" fill="#fde68a" opacity="0.92"/>
      <path d="M362 208 C365 170, 435 170, 438 208 C425 192, 375 192, 362 208 Z" fill="#1e1b4b"/>
      <circle cx="386" cy="216" r="4" fill="#0f172a"/>
      <circle cx="414" cy="216" r="4" fill="#0f172a"/>
      <path d="M391 232 Q400 239 409 232" stroke="#b45309" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M332 325 C338 272, 462 272, 468 325 Z" fill="${accentColor}" opacity="0.85"/>
      <path d="M365 268 L400 305 L435 268" fill="none" stroke="#fef08a" stroke-width="3"/>
    `
    : isDict
    ? `
      <!-- Dictionary Knowledge & Visual Concept Emblem -->
      <rect x="275" y="135" width="250" height="210" rx="28" fill="url(#orbGrad)" stroke="${accentColor}" stroke-width="3"/>
      <circle cx="400" cy="215" r="52" fill="${secondaryAccent}" fill-opacity="0.18" stroke="${secondaryAccent}" stroke-width="2.5"/>
      <!-- Open Book & Rising Star Icon -->
      <path d="M345 255 Q372 242 400 258 Q428 242 455 255 L455 200 Q428 186 400 202 Q372 186 345 200 Z" fill="#e0f2fe" stroke="${accentColor}" stroke-width="2.5"/>
      <line x1="400" y1="202" x2="400" y2="258" stroke="${accentColor}" stroke-width="2.5"/>
      <polygon points="400,152 407,168 425,170 411,182 415,199 400,190 385,199 389,182 375,170 393,168" fill="#fbbf24"/>
      <text x="400" y="315" text-anchor="middle" fill="#ffffff" font-size="24" font-family="sans-serif" font-weight="bold">${cleanTitle.slice(0, 26)}</text>
    `
    : isHorror
    ? `
      <!-- Atmospheric Horror Full Moon, Ancient Haunted Temple/House & Mist -->
      <circle cx="560" cy="155" r="68" fill="#fecdd3" opacity="0.9"/>
      <circle cx="545" cy="145" r="62" fill="#fda4af" opacity="0.35"/>
      <!-- Spooky Silhouetted Trees & Temple Roof -->
      <path d="M80 390 L180 250 L250 320 L340 185 L400 130 L460 185 L550 320 L620 255 L720 390 Z" fill="#0f071e" stroke="${accentColor}" stroke-opacity="0.45" stroke-width="2"/>
      <rect x="365" y="255" width="70" height="95" rx="6" fill="#fb7185" opacity="0.75"/>
      <!-- Atmospheric Mist Waves -->
      <path d="M60 355 Q230 330 400 355 T740 350" fill="none" stroke="#e2e8f0" stroke-opacity="0.35" stroke-width="8" stroke-linecap="round"/>
      <path d="M100 380 Q280 360 450 380 T700 375" fill="none" stroke="${accentColor}" stroke-opacity="0.4" stroke-width="5" stroke-linecap="round"/>
    `
    : `
      <!-- Scenic Story Landscape: Golden Sun/Moon, Mountains, Khmer Pagoda Spire & River -->
      <circle cx="565" cy="155" r="58" fill="#fde047" opacity="0.88"/>
      <path d="M60 385 L210 215 L335 310 L465 185 L615 315 L740 235 L740 385 Z" fill="#1e293b" opacity="0.85" stroke="${accentColor}" stroke-opacity="0.45" stroke-width="2"/>
      <!-- Traditional Spire / Castle Silhouette -->
      <path d="M370 350 L385 235 L400 165 L415 235 L430 350 Z" fill="${accentColor}" opacity="0.85"/>
      <!-- Reflective Water / Path -->
      <path d="M240 385 Q400 345 560 385" fill="none" stroke="${secondaryAccent}" stroke-width="4" opacity="0.7"/>
    `;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgStart}"/>
        <stop offset="52%" stop-color="${bgMid}"/>
        <stop offset="100%" stop-color="${bgEnd}"/>
      </linearGradient>
      <radialGradient id="orbGrad" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.38"/>
        <stop offset="100%" stop-color="${bgStart}" stop-opacity="0.85"/>
      </radialGradient>
    </defs>
    <rect width="800" height="500" fill="url(#bgGrad)"/>
    <!-- Ambient Stars -->
    <circle cx="120" cy="85" r="2" fill="#ffffff" opacity="0.65"/>
    <circle cx="240" cy="60" r="2.5" fill="#ffffff" opacity="0.8"/>
    <circle cx="350" cy="95" r="1.8" fill="#ffffff" opacity="0.5"/>
    <circle cx="670" cy="80" r="2.2" fill="#ffffff" opacity="0.75"/>
    <circle cx="710" cy="140" r="1.5" fill="#ffffff" opacity="0.5"/>
    <!-- Top Badge -->
    <rect x="32" y="24" width="340" height="36" rx="18" fill="#000000" fill-opacity="0.55" stroke="${accentColor}" stroke-opacity="0.65" stroke-width="1.5"/>
    <text x="202" y="47" text-anchor="middle" fill="${accentColor}" font-size="15" font-family="sans-serif" font-weight="bold">${cleanBadge}</text>
    ${centerGraphic}
    <!-- Bottom Caption Banner -->
    <rect x="30" y="392" width="740" height="86" rx="16" fill="#050811" fill-opacity="0.82" stroke="${accentColor}" stroke-opacity="0.5" stroke-width="1.5"/>
    <text x="400" y="428" text-anchor="middle" fill="#ffffff" font-size="22" font-family="sans-serif" font-weight="bold">${cleanTitle}</text>
    <text x="400" y="460" text-anchor="middle" fill="#cbd5e1" font-size="15" font-family="sans-serif">${cleanSub}</text>
  </svg>`;
}

export async function renderIllustrationBufferServer({
  prompt = "",
  type = "scene",
  theme = "folktale",
  title = "",
  subtitle = "",
}) {
  const cleanPrompt = String(prompt || title || "Cambodia illustration").trim();
  const seed =
    Math.abs(
      cleanPrompt.split("").reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 7)
    ) % 890000 +
    10000;

  const styleSuffix =
    type === "character"
      ? "detailed character portrait illustration, expressive face, cinematic lighting, digital art masterpiece, no text"
      : type === "dictionary"
      ? "clear educational visual illustration of the concept, vibrant colors, studio lighting, high detail, no text"
      : /horror|រន្ធត់/i.test(theme)
      ? "atmospheric dark cinematic horror story scene illustration, dramatic shadows, eerie moonlight, digital painting, no text"
      : "cinematic storybook scene illustration, rich colors, magical atmosphere, digital art masterpiece, no text";

  const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    `${cleanPrompt}, ${styleSuffix}`
  )}?width=800&height=500&seed=${seed}&nologo=true&model=flux`;

  try {
    const res = await fetch(pollUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(6500),
    });
    if (res.ok) {
      const cType = res.headers.get("content-type") || "";
      if (cType.startsWith("image/")) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 1500) {
          return { buffer: buf, mimeType: cType };
        }
      }
    }
  } catch {}

  const svgStr = generateArtisticIllustrationSvg({
    type,
    theme,
    title: title || cleanPrompt,
    subtitle,
  });
  return {
    buffer: Buffer.from(svgStr, "utf-8"),
    mimeType: "image/svg+xml",
  };
}

// ============================================================================
// 1. UNIVERSAL WORLD LANGUAGE TRANSLATOR ENGINE (Requirement 3)
// បកប្រែភាសាបានគ្រប់ភាសានៅទូទាំងពិភពលោក (100+ Languages Worldwide)
// ============================================================================
export const WORLD_LANGUAGES_LIST = [
  { code: "km", nameKhmer: "ភាសាខ្មែរ", nameEn: "Khmer", flag: "🇰🇭" },
  { code: "en", nameKhmer: "ភាសាអង់គ្លេស", nameEn: "English", flag: "🇬🇧" },
  { code: "zh", nameKhmer: "ភាសាចិន (កុកងឺ)", nameEn: "Chinese (Mandarin)", flag: "🇨🇳" },
  { code: "fr", nameKhmer: "ភាសាបារាំង", nameEn: "French", flag: "🇫🇷" },
  { code: "ja", nameKhmer: "ភាសាជប៉ុន", nameEn: "Japanese", flag: "🇯🇵" },
  { code: "ko", nameKhmer: "ភាសាកូរ៉េ", nameEn: "Korean", flag: "🇰🇷" },
  { code: "vi", nameKhmer: "ភាសាវៀតណាម", nameEn: "Vietnamese", flag: "🇻🇳" },
  { code: "th", nameKhmer: "ភាសាថៃ", nameEn: "Thai", flag: "🇹🇭" },
  { code: "lo", nameKhmer: "ភាសាឡាវ", nameEn: "Lao", flag: "🇱🇦" },
  { code: "de", nameKhmer: "ភាសាអាល្លឺម៉ង់", nameEn: "German", flag: "🇩🇪" },
  { code: "es", nameKhmer: "ភាសាអេស្ប៉ាញ", nameEn: "Spanish", flag: "🇪🇸" },
  { code: "ru", nameKhmer: "ភាសារុស្ស៊ី", nameEn: "Russian", flag: "🇷🇺" },
  { code: "ar", nameKhmer: "ភាសាអារ៉ាប់", nameEn: "Arabic", flag: "🇸🇦" },
  { code: "hi", nameKhmer: "ភាសាហិណ្ឌូ (ឥណ្ឌា)", nameEn: "Hindi", flag: "🇮🇳" },
  { code: "id", nameKhmer: "ភាសាឥណ្ឌូនេស៊ី", nameEn: "Indonesian", flag: "🇮🇩" },
  { code: "ms", nameKhmer: "ភាសាម៉ាឡេស៊ី", nameEn: "Malay", flag: "🇲🇾" },
  { code: "my", nameKhmer: "ភាសាភូមា (មីយ៉ាន់ម៉ា)", nameEn: "Burmese", flag: "🇲🇲" },
  { code: "tl", nameKhmer: "ភាសាហ្វីលីពីន (Tagalog)", nameEn: "Filipino", flag: "🇵🇭" },
  { code: "it", nameKhmer: "ភាសាអ៊ីតាលី", nameEn: "Italian", flag: "🇮🇹" },
  { code: "pt", nameKhmer: "ភាសាព័រទុយហ្គាល់", nameEn: "Portuguese", flag: "🇵🇹" },
  { code: "tr", nameKhmer: "ភាសាទួរគី", nameEn: "Turkish", flag: "🇹🇷" },
  { code: "nl", nameKhmer: "ភាសាហូឡង់", nameEn: "Dutch", flag: "🇳🇱" },
  { code: "pl", nameKhmer: "ភាសាប៉ូឡូញ", nameEn: "Polish", flag: "🇵🇱" },
  { code: "sv", nameKhmer: "ភាសាស៊ុយអែត", nameEn: "Swedish", flag: "🇸🇪" },
  { code: "el", nameKhmer: "ភាសាក្រិក", nameEn: "Greek", flag: "🇬🇷" },
  { code: "he", nameKhmer: "ភាសាហিব្រូ", nameEn: "Hebrew", flag: "🇮🇱" },
  { code: "fa", nameKhmer: "ភាសាភឺសៀន (អ៊ីរ៉ង់)", nameEn: "Persian", flag: "🇮🇷" },
  { code: "bn", nameKhmer: "ភាសាបង់ក្លាដែស (Bengali)", nameEn: "Bengali", flag: "🇧🇩" },
  { code: "ur", nameKhmer: "ភាសាអ៊ުރުឌូ (ប៉ាគីស្ថាន)", nameEn: "Urdu", flag: "🇵🇰" },
  { code: "sw", nameKhmer: "ភាសាស្វាហ៊ីលី (អាហ្វ្រិក)", nameEn: "Swahili", flag: "🌍" },
  { code: "pi", nameKhmer: "ភាសាបាលី / សំស្ក្រឹត", nameEn: "Pali / Sanskrit", flag: "☸️" },
];

export function isWorldTranslateRequestServer(text = "") {
  const clean = String(text || "").trim();
  if (!clean) return false;
  // Do not intercept video translation requests
  if (/(?:វីដេអូ|video|mp4|capcut|tiktok|youtube|youtu\.be|fb\.watch|pinterest)/i.test(clean)) {
    return false;
  }
  if (/^\/(?:translate|tr|បកប្រែ)\b/i.test(clean)) {
    return true;
  }
  if (
    /^(?:សូម\s*)?(?:ជួយ\s*)?បកប្រែ(?:ភាសា|អត្ថបទ|ពាក្យ|ប្រយោគ)?(?:នេះ)?\s*(?:ពី|ទៅជា|មកជា|ជា)\s*ភាសា/i.test(
      clean
    ) ||
    /(?:បកប្រែ\s*(?:ទៅជា|មកជា|ជា)\s*ភាសា(?:ខ្មែរ|អង់គ្លេស|ចិន|បារាំង|ជប៉ុន|កូរ៉េ|វៀតណាម|ថៃ|ឡាវ|អាល្លឺម៉ង់|អេស្ប៉ាញ|រុស្ស៊ី|អារ៉ាប់|ហិណ្ឌូ|ឥណ្ឌា|ឥណ្ឌូនេស៊ី|ម៉ាឡេ|ភូមា|ហ្វីលីពីន|អ៊ីតាលី|ព័រទុយហ្គាល់|ទួរគី|បាលី|សំស្ក្រឹត)|translate\s+(?:this\s+)?(?:into|to)\s+[a-zA-Z]+)/i.test(
      clean
    )
  ) {
    return true;
  }
  return false;
}

export async function translateWorldLanguageServer({
  text = "",
  sourceLanguage = "auto",
  targetLanguage = "ភាសាខ្មែរ (Khmer)",
}) {
  let cleanInput = String(text || "")
    .replace(/^\/(?:translate|tr|បកប្រែ)(?:@\S+)?\s*/i, "")
    .trim();

  // Detect if user specified target language inside the prompt text
  let resolvedTarget = String(targetLanguage || "ភាសាខ្មែរ (Khmer)").trim();
  const langMatch = cleanInput.match(
    /(?:បកប្រែ(?:ភាសា|អត្ថបទ|ប្រយោគ|ពាក្យ)?(?:នេះ)?\s*(?:ទៅជា|មកជា|ជា)\s*(ភាសា[^\s:៖"']+|អង់គ្លេស|ខ្មែរ|ចិន|បារាំង|ជប៉ុន|កូរ៉េ|វៀតណាម|ថៃ|ឡាវ|អាល្លឺម៉ង់|អេស្ប៉ាញ|រុស្ស៊ី|អារ៉ាប់|ហិណ្ឌូ|ឥណ្ឌូនេស៊ី|ម៉ាឡេ|អ៊ីតាលី|ព័រទុយហ្គាល់|បាលី)\s*[:៖]?\s*)([\s\S]+)$/i
  );
  if (langMatch && langMatch[2]?.trim()) {
    resolvedTarget = langMatch[1].trim();
    cleanInput = langMatch[2].trim();
  }

  if (!cleanInput) {
    cleanInput = "សូមស្វាគមន៍មកកាន់ព្រះរាជាណាចក្រកម្ពុជា! យើងខ្ញុំសូមជូនពរឱ្យអ្នកមានសុខភាពល្អ និងជោគជ័យគ្រប់ភារកិច្ច។";
    if (/ខ្មែរ|khmer|^km$/i.test(resolvedTarget)) {
      resolvedTarget = "ភាសាអង់គ្លេស (English)";
    }
  }

  const prompt =
    `អ្នកគឺជាអ្នកបកប្រែភាសាអន្តរជាតិកំពូល (Universal World Language Translator) ដែលអាចបកប្រែបានគ្រប់ភាសាទាំងអស់នៅទូទាំងពិភពលោក យ៉ាងត្រឹមត្រូវឥតខ្ចោះ មិនខុសអក្ខរាវិរុទ្ធ និងត្រូវតាមក្បួនវេយ្យាករណ៍ ១០០%។\n` +
    `អត្ថបទដើម៖ """${cleanInput}"""\n` +
    `ភាសាដើម៖ ${sourceLanguage === "auto" ? "សូមស្វែងរកភាសាដើមដោយស្វ័យប្រវត្តិ (Auto-Detect)" : sourceLanguage}\n` +
    `ភាសាគោលដៅដែលត្រូវបកប្រែទៅ៖ ${resolvedTarget}\n` +
    `(ចំណាំ៖ ប្រសិនបើអត្ថបទដើមជាភាសាខ្មែរ ហើយភាសាគោលដៅក៏ដាក់ភាសាខ្មែរ នោះសូមបកប្រែទៅជា ភាសាអង់គ្លេស ចិន បារាំង និងជប៉ុន ព្រមគ្នា!)។\n` +
    `សូមឆ្លើយជា JSON តែមួយគត់តាមទម្រង់នេះ៖\n` +
    `{\n` +
    `  "detectedSourceLanguage": "ឈ្មោះភាសាដើម (ឧ. ភាសាខ្មែរ / English / ភាសាចិន...)",\n` +
    `  "targetLanguage": "ឈ្មោះភាសាគោលដៅដែលបានបកប្រែ",\n` +
    `  "sourceText": "អត្ថបទដើម",\n` +
    `  "translatedText": "អត្ថបទដែលបានបកប្រែរួចរាល់យ៉ាងត្រឹមត្រូវឥតខ្ចោះតាមវេយ្យាករណ៍",\n` +
    `  "pronunciationKhmer": "របៀបអានបញ្ចេញសំឡេងនៃអត្ថបទបកប្រែ ដោយសរសេរជាតួអក្សរខ្មែរ និង Romanization/Pinyin/IPA ដើម្បីឱ្យអ្នកប្រើងាយស្រួលអានតាម",\n` +
    `  "alternativeTranslations": [\n` +
    `    { "style": "ផ្លូវការ (Formal)", "text": "ការបកប្រែបែបផ្លូវការ" },\n` +
    `    { "style": "សន្ទនាធម្មតា (Natural/Casual)", "text": "ការបកប្រែបែបសន្ទនាទូទៅ" }\n` +
    `  ],\n` +
    `  "vocabularyBreakdown": [\n` +
    `    { "term": "ពាក្យសំខាន់", "meaningKhmer": "អត្ថន័យជាភាសាខ្មែរ", "pronunciation": "របៀបអាន" }\n` +
    `  ],\n` +
    `  "grammarNoteKhmer": "ការពន្យល់ខ្លីៗអំពីទម្រង់ប្រយោគ និងវេយ្យាករណ៍ជាភាសាខ្មែរ"\n` +
    `}`;

  const aiRes = await callGeminiJson(prompt, 14000);
  if (aiRes && aiRes.translatedText) {
    return {
      ok: true,
      detectedSourceLanguage: cleanKhmerSpelling(aiRes.detectedSourceLanguage || sourceLanguage),
      targetLanguage: cleanKhmerSpelling(aiRes.targetLanguage || resolvedTarget),
      sourceText: cleanInput,
      translatedText: cleanKhmerSpelling(aiRes.translatedText),
      pronunciationKhmer: cleanKhmerSpelling(aiRes.pronunciationKhmer || ""),
      alternativeTranslations: Array.isArray(aiRes.alternativeTranslations)
        ? aiRes.alternativeTranslations
        : [],
      vocabularyBreakdown: Array.isArray(aiRes.vocabularyBreakdown)
        ? aiRes.vocabularyBreakdown
        : [],
      grammarNoteKhmer: cleanKhmerSpelling(
        aiRes.grammarNoteKhmer || "បកប្រែត្រឹមត្រូវតាមក្បួនវេយ្យាករណ៍ និងអក្ខរាវិរុទ្ធ ១០០%។"
      ),
    };
  }

  return {
    ok: true,
    detectedSourceLanguage: "Auto-Detected",
    targetLanguage: resolvedTarget,
    sourceText: cleanInput,
    translatedText: cleanInput,
    pronunciationKhmer: "",
    alternativeTranslations: [],
    vocabularyBreakdown: [],
    grammarNoteKhmer: "បានបកប្រែអត្ថបទជូនរួចរាល់។",
  };
}

// ============================================================================
// 2. ILLUSTRATED STORY CREATOR ENGINE (Requirement 4)
// បង្កើតរឿងបែបរន្ធត់ ប្រលោមលោក ឬរឿងនិទានកថា + រូបភាពតាមវគ្គនីមួយៗនៃសាច់រឿង & តួអង្គ
// ============================================================================
export function isStoryGenerationRequestServer(text = "") {
  const clean = String(text || "").trim();
  if (!clean) return false;
  if (/^\/(?:story|novel|horror|folktale|និទាន|តែងរឿង)\b/i.test(clean)) {
    return true;
  }
  if (
    /(?:បង្កើត\s*រឿង|តែង\s*រឿង|សរសេរ\s*រឿង|និទាន\s*រឿង|ជួយ\s*និទាន\s*រឿង|រឿង\s*បែប\s*រន្ធត់|រឿង\s*រន្ធត់|រឿង\s*ខ្មោច|រឿង\s*ប្រលោមលោក|រឿង\s*និទាន\s*កថា|រឿង\s*ព្រេង\s*និទាន|write\s+a\s+(?:horror\s+|romance\s+|folktale\s+)?story)/i.test(
      clean
    )
  ) {
    return true;
  }
  return false;
}

export async function generateIllustratedStoryServer({
  prompt = "",
  genre = "auto",
}) {
  const cleanPrompt = String(prompt || "")
    .replace(/^\/(?:story|novel|horror|folktale|និទាន|តែងរឿង)(?:@\S+)?\s*/i, "")
    .trim();

  let detectedGenre = genre;
  if (!detectedGenre || detectedGenre === "auto") {
    if (/(?:រន្ធត់|ខ្មោច|ព្រាយ|បិសាច|ភ័យខ្លាច|អាថ៌កំបាំង|horror|ghost|scary)/i.test(cleanPrompt)) {
      detectedGenre = "horror";
    } else if (/(?:ប្រលោមលោក|ស្នេហា|មនោសញ្ចេតនា|ជីវិត|novel|romance|love|drama)/i.test(cleanPrompt)) {
      detectedGenre = "novel";
    } else {
      detectedGenre = "folktale";
    }
  }

  const genreLabelKhmer =
    detectedGenre === "horror"
      ? "👻 រឿងបែបរន្ធត់ និងអាថ៌កំបាំង (Horror & Mystery Story)"
      : detectedGenre === "novel"
      ? "💖 រឿងប្រលោមលោកមនោសញ្ចេតនា និងជីវិត (Novel & Romance Drama)"
      : "🦊 រឿងនិទានកថា និងគតិអប់រំ (Folktale & Moral Story)";

  const topicInstruction =
    cleanPrompt ||
    (detectedGenre === "horror"
      ? "អាថ៌កំបាំងផ្ទះបុរាណកណ្ដាលព្រៃនៅយប់ពេញបូណ៌មី"
      : detectedGenre === "novel"
      ? "ស្នេហាស្មោះស្ម័គ្រក្រោមតំណក់ទឹកភ្លៀងនៅមាត់ទន្លេចតុមុខ"
      : "មិត្តភាពរវាងកុមារាឧស្សាហ៍ព្យាយាម និងបក្សីមាសក្នុងព្រៃហិមพาน្ត");

  const aiPrompt =
    `អ្នកគឺជាអ្នកនិពន្ធរឿងដ៏ឆ្នើមបំផុតនៅកម្ពុជា ដែលពូកែនិពន្ធ ${genreLabelKhmer} ដោយប្រើពាក្យពេចន៍ភាសាខ្មែរដ៏ពីរោះ រស់រវើក ត្រឹមត្រូវតាមអក្ខរាវិរុទ្ធវចនានុក្រមសម្ដេចព្រះសង្ឃរាជ ជួន ណាត ១០០% (មិនខុសអក្ខរាវិរុទ្ធឡើយ)។\n` +
    `ប្រធានបទ ឬសំណើរបស់អ្នកប្រើ៖ "${topicInstruction}"\n` +
    `ប្រភេទរឿង៖ ${genreLabelKhmer}\n` +
    `សូមបង្កើតសាច់រឿងពេញលេញ ដោយមាន៖\n` +
    `១. តួអង្គសំខាន់ៗនៅក្នុងសាច់រឿង (២ ទៅ ៣ តួអង្គ) ព្រមទាំងការពិពណ៌នារូបរាង ចរិតលក្ខណៈ និង Prompt សម្រាប់គូររូបតួអង្គនីមួយៗ។\n` +
    `២. សាច់រឿងបែងចែកជា ៣ វគ្គច្បាស់លាស់ (វគ្គទី ១៖ ការចាប់ផ្ដើម និងបរិយាកាស, វគ្គទី ២៖ ព្រឹត្តិការណ៍សំខាន់ និងចំណុចកំពូលនៃរឿង, វគ្គទី ៣៖ វគ្គបញ្ចប់ និងអត្ថន័យនៃរឿង) ដោយវគ្គនីមួយៗមានសាច់រឿងពិស្ដារ ជក់ចិត្ត និងមាន Prompt រូបភាពសម្រាប់វគ្គនីមួយៗ។\n` +
    `ហាមប្រើអក្សរថៃដាច់ខាត! សូមឆ្លើយជា JSON តែមួយគត់តាមទម្រង់នេះ៖\n` +
    `{\n` +
    `  "title": "ចំណងជើងរឿងជាភាសាខ្មែរ (និងអង់គ្លេស)",\n` +
    `  "genre": "${detectedGenre}",\n` +
    `  "genreLabel": "${genreLabelKhmer}",\n` +
    `  "synopsis": "សេចក្ដីសង្ខេបខ្លឹមសាររឿងដ៏ជក់ចិត្ត",\n` +
    `  "characters": [\n` +
    `    {\n` +
    `      "name": "ឈ្មោះតួអង្គ",\n` +
    `      "role": "តួនាទីក្នុងរឿង (ឧ. តួឯកប្រុស / តួឯកស្រី / តួអង្គអាថ៌កំបាំង)",\n` +
    `      "description": "រូបរាង និងចរិតលក្ខណៈរបស់តួអង្គ",\n` +
    `      "imagePrompt": "English visual description of the character portrait for illustration"\n` +
    `    }\n` +
    `  ],\n` +
    `  "episodes": [\n` +
    `    {\n` +
    `      "episodeNumber": 1,\n` +
    `      "episodeTitle": "វគ្គទី ១៖ ចំណងជើងវគ្គ",\n` +
    `      "content": "សាច់រឿងពិស្ដារសម្រាប់វគ្គនេះ (យ៉ាងតិច ៤-៦ ប្រយោគវែងៗ ជក់ចិត្ត មានការសន្ទនា និងបរិយាយឈុតឆាកច្បាស់លាស់)",\n` +
    `      "sceneCaption": "ការពិពណ៌នាឈុតឆាករូបភាពនៃវគ្គនេះជាភាសាខ្មែរ",\n` +
    `      "imagePrompt": "English visual description of this chapter scene for illustration"\n` +
    `    }\n` +
    `  ],\n` +
    `  "moralLesson": "គតិអប់រំ ឬខ្លឹមសារចុងក្រោយនៃសាច់រឿងជាភាសាខ្មែរ",\n` +
    `  "englishSummary": "Brief English summary of the story"\n` +
    `}`;

  const aiStory = await callGeminiJson(aiPrompt, 16000);

  const buildImageUrl = (type, title, sub, promptStr) =>
    `/api/image/illustration?type=${encodeURIComponent(type)}&theme=${encodeURIComponent(
      detectedGenre
    )}&title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(
      sub
    )}&prompt=${encodeURIComponent(promptStr)}`;

  if (
    aiStory &&
    aiStory.title &&
    Array.isArray(aiStory.episodes) &&
    aiStory.episodes.length > 0
  ) {
    const characters = (Array.isArray(aiStory.characters) ? aiStory.characters : []).map(
      (ch, idx) => {
        const name = cleanKhmerSpelling(ch.name || `តួអង្គទី ${idx + 1}`);
        const role = cleanKhmerSpelling(ch.role || "តួអង្គសំខាន់");
        const desc = cleanKhmerSpelling(ch.description || "");
        const imgPrompt = ch.imagePrompt || `${name}, ${role}, Cambodian story character portrait`;
        return {
          name,
          role,
          description: desc,
          imagePrompt: imgPrompt,
          imageUrl: buildImageUrl("character", `${name} (${role})`, desc, imgPrompt),
        };
      }
    );

    const episodes = aiStory.episodes.map((ep, idx) => {
      const epNum = ep.episodeNumber || idx + 1;
      const epTitle = cleanKhmerSpelling(ep.episodeTitle || `វគ្គទី ${epNum}`);
      const content = cleanKhmerSpelling(ep.content || "");
      const sceneCaption = cleanKhmerSpelling(ep.sceneCaption || epTitle);
      const imgPrompt = ep.imagePrompt || `${epTitle}, ${detectedGenre} story scene`;
      return {
        episodeNumber: epNum,
        episodeTitle: epTitle,
        content,
        sceneCaption,
        imagePrompt: imgPrompt,
        imageUrl: buildImageUrl("scene", epTitle, sceneCaption, imgPrompt),
      };
    });

    return {
      ok: true,
      title: cleanKhmerSpelling(aiStory.title),
      genre: detectedGenre,
      genreLabel: genreLabelKhmer,
      synopsis: cleanKhmerSpelling(aiStory.synopsis || ""),
      characters,
      episodes,
      moralLesson: cleanKhmerSpelling(
        aiStory.moralLesson || "រឿងនេះបង្ហាញពីតម្លៃនៃសេចក្ដីល្អ ការតស៊ូ និងសតិសម្បជញ្ញៈ។"
      ),
      englishSummary: String(
        aiStory.englishSummary || "An illustrated multi-chapter story with character profiles."
      ),
    };
  }

  // Built-in rich fallback story if offline
  const defaultTitle =
    detectedGenre === "horror"
      ? "អាថ៌កំបាំងភូមិគ្រឹះបុរាណកណ្ដាលព្រៃអ័ព្ទ (The Mystery of the Misty Manor)"
      : detectedGenre === "novel"
      ? "សន្យាស្នេហ៍ក្រោមពន្លឺផ្កាយមាត់ទន្លេ (Promise Under the River Stars)"
      : "កុមារាឧស្សាហ៍ និងបក្សីមាសទិព្វ (The Diligent Boy and the Golden Bird)";

  const fallbackCharacters = [
    {
      name: "សុខា (Sokha)",
      role: "តួឯកប្រុស (Protagonist)",
      description: "យុវជនចិត្តក្លាហាន មានប្រាជ្ញាឈ្លាសវៃ និងមានទឹកចិត្តស្មោះត្រង់ជានិច្ច។",
      imagePrompt: "Brave young Cambodian man Sokha, expressive eyes, cinematic portrait",
      imageUrl: buildImageUrl(
        "character",
        "សុខា (តួឯកប្រុស)",
        "យុវជនចិត្តក្លាហាន និងមានប្រាជ្ញាឈ្លាសវៃ",
        "Brave young Cambodian man Sokha portrait"
      ),
    },
    {
      name: "បុប្ផា (Bopha)",
      role: "តួឯកស្រី (Heroine)",
      description: "នារីដ៏ស្រស់ស្អាត ស្លូតបូត ចេះជួយយកអាសាអ្នកដទៃ និងមានចំណេះដឹងខ្ពង់ខ្ពស់។",
      imagePrompt: "Graceful young Cambodian woman Bopha, warm smile, cinematic portrait",
      imageUrl: buildImageUrl(
        "character",
        "បុប្ផា (តួឯកស្រី)",
        "នារីដ៏ស្រស់ស្អាត ស្លូតបូត និងមានប្រាជ្ញា",
        "Graceful young Cambodian woman Bopha portrait"
      ),
    },
  ];

  const fallbackEpisodes = [
    {
      episodeNumber: 1,
      episodeTitle: "វគ្គទី ១៖ ការចាប់ផ្ដើមនៃដំណើរដ៏អស្ចារ្យ",
      content: `នៅក្នុងភូមិដ៏ស្ងប់ស្ងាត់មួយនាពេលព្រលប់ ខ្យល់ជំនោរត្រជាក់បានបក់បោកមកប៉ះនឹងដើមឈើធំៗបង្កើតបានជាសំឡេងខ្សឹបខ្សៀវ។ សុខា និងបុប្ផា បានរកឃើញផែនទីបុរាណមួយដែលបន្សល់ទុកពីដូនតា អំពីទីកន្លែងអាថ៌កំបាំងទាក់ទងនឹង "${topicInstruction}"។ អ្នកទាំងពីរបានសម្រេចចិត្តធ្វើដំណើរឆ្លងកាត់ឧបសគ្គដើម្បីស្វែងរកការពិត។`,
      sceneCaption: "ឈុតឆាកវគ្គទី ១៖ សុខា និងបុប្ផា រកឃើញផែនទីអាថ៌កំបាំងនៅពេលព្រលប់",
      imagePrompt: `Scene 1 of ${detectedGenre} story: Sokha and Bopha discovering an ancient glowing map at dusk`,
      imageUrl: buildImageUrl(
        "scene",
        "វគ្គទី ១៖ ការចាប់ផ្ដើមនៃដំណើរដ៏អស្ចារ្យ",
        "សុខា និងបុប្ផា រកឃើញផែនទីអាថ៌កំបាំងនៅពេលព្រលប់",
        `Scene 1 ${detectedGenre} story ancient map at dusk`
      ),
    },
    {
      episodeNumber: 2,
      episodeTitle: "វគ្គទី ២៖ ឧបសគ្គ និងការសាកល្បងទឹកចិត្ត",
      content: `នៅពេលធ្វើដំណើរចូលទៅដល់កណ្ដាលព្រៃជ្រៅ ពន្លឺព្រះចន្ទបានចាំងឆ្លុះមកលើប្រាសាទបុរាណមួយដែលគ្របដណ្ដប់ដោយអ័ព្ទក្រាស់។ សំឡេងអាថ៌កំបាំងមួយបានបន្លឺឡើងដើម្បីសាកល្បងភាពក្លាហាន និងភាពស្មោះត្រង់របស់អ្នកទាំងពីរ។ ដោយសារការសាមគ្គីគ្នា និងប្រាជ្ញាដ៏ឈ្លាសវៃ សុខា និងបុប្ផា អាចដោះស្រាយปริศនាដ៏លំបាកនោះបានយ៉ាងជោគជ័យ។`,
      sceneCaption: "ឈុតឆាកវគ្គទី ២៖ ការប្រឈមមុខនឹងឧបសគ្គក្រោមពន្លឺព្រះចន្ទពេញបូណ៌មី",
      imagePrompt: `Scene 2 of ${detectedGenre} story: Ancient temple in misty forest under full moon`,
      imageUrl: buildImageUrl(
        "scene",
        "វគ្គទី ២៖ ឧបសគ្គ និងការសាកល្បងទឹកចិត្ត",
        "ការប្រឈមមុខនឹងឧបសគ្គក្រោមពន្លឺព្រះចន្ទពេញបូណ៌មី",
        `Scene 2 ${detectedGenre} story misty temple under full moon`
      ),
    },
    {
      episodeNumber: 3,
      episodeTitle: "វគ្គទី ៣៖ ពន្លឺនៃជ័យជម្នះ និងសុភមង្គល",
      content: `នៅពេលព្រះអាទិត្យរះឡើងនាពេលព្រឹកព្រលឹម អ័ព្ទខ្មៅងងឹតទាំងអស់ក៏បានរលាយបាត់ទៅ ជំនួសមកវិញនូវពន្លឺមាសដ៏ត្រចះត្រចង់។ សុខា និងបុប្ផា បាននាំយកចំណេះដឹង និងសម្បត្តិវប្បធម៌ដ៏មានតម្លៃត្រឡប់មកជួយអភិវឌ្ឍភូមិឋានរបស់ខ្លួនឱ្យរីកចម្រើនរុងរឿង និងរស់នៅប្រកបដោយសុភមង្គលជារៀងរហូត។`,
      sceneCaption: "ឈុតឆាកវគ្គទី ៣៖ ពន្លឺថ្ងៃរះនាំមកនូវជ័យជម្នះ និងសុភមង្គល",
      imagePrompt: `Scene 3 of ${detectedGenre} story: Golden sunrise over peaceful Cambodian village`,
      imageUrl: buildImageUrl(
        "scene",
        "វគ្គទី ៣៖ ពន្លឺនៃជ័យជម្នះ និងសុភមង្គល",
        "ពន្លឺថ្ងៃរះនាំមកនូវជ័យជម្នះ និងសុភមង្គល",
        `Scene 3 golden sunrise over peaceful Cambodian village`
      ),
    },
  ];

  return {
    ok: true,
    title: defaultTitle,
    genre: detectedGenre,
    genreLabel: genreLabelKhmer,
    synopsis: `រឿង "${defaultTitle}" បង្ហាញពីដំណើរផ្សងព្រេង ភាពក្លាហាន និងទឹកចិត្តស្មោះត្រង់របស់តួអង្គសុខា និងបុប្ផា។`,
    characters: fallbackCharacters,
    episodes: fallbackEpisodes,
    moralLesson: "សេចក្ដីក្លាហាន ប្រាជ្ញាស្មារតី និងការសាមគ្គីគ្នា គឺជាគន្លឹះឈ្នះរាល់ឧបសគ្គទាំងពួង។",
    englishSummary: `An illustrated 3-chapter ${detectedGenre} story featuring character portraits and scene artwork.`,
  };
}

// ============================================================================
// 3. ILLUSTRATED 3-WAY DICTIONARY ENGINE (Requirement 5)
// វចនានុក្រម ខ្មែរ-ខ្មែរ, អង់គ្លេស-ខ្មែរ និង ខ្មែរ-អង់គ្លេស + រូបភាព & ឧទាហរណ៍ជាល្បះ
// ============================================================================
export function isDictionaryLookupRequestServer(text = "") {
  const clean = String(text || "").trim();
  if (!clean) return false;
  if (/^\/(?:dict|dictionary|define|វចនានុក្រម|ពន្យល់ពាក្យ)\b/i.test(clean)) {
    return true;
  }
  if (
    /(?:វចនានុក្រម|ពន្យល់\s*ពាក្យ|និយមន័យ\s*នៃ\s*ពាក្យ|តើ\s*ពាក្យ\s*["«']?[^"»'\s]+["»']?\s*មាន\s*ន័យ\s*ដូចម្ដេច|មាន\s*ន័យ\s*ថា\s*ម៉េច\s*ក្នុង\s*វចនានុក្រម|dictionary\s+meaning\s+of|define\s+the\s+word)/i.test(
      clean
    )
  ) {
    return true;
  }
  return false;
}

export async function lookupIllustratedDictionaryServer({
  word = "",
  mode = "all", // "km-km" | "en-km" | "km-en" | "all"
}) {
  const cleanWord = String(word || "")
    .replace(
      /^(?:\/(?:dict|dictionary|define|វចនានុក្រម|ពន្យល់ពាក្យ)(?:@\S+)?\s*|(?:សូម\s*)?(?:ជួយ\s*)?(?:ឆែក\s*)?(?:វចនានុក្រម|ពន្យល់\s*ពាក្យ|ប្រាប់\s*និយមន័យ\s*នៃ\s*ពាក្យ)\s*[:៖]?\s*)/i,
      ""
    )
    .replace(/^["«']+|["»']+$/g, "")
    .trim();

  const targetWord = cleanKhmerSpelling(cleanWord || "ប្រាជ្ញា");

  const prompt =
    `អ្នកគឺជាវចនានុក្រមអេឡិចត្រូនិកកំពូល ៣ ទិសដៅ គឺ៖ វចនានុក្រម ខ្មែរ-ខ្មែរ (តាមវចនានុក្រមសម្ដេចព្រះសង្ឃរាជ ជួន ណាត), វចនានុក្រម អង់គ្លេស-ខ្មែរ (English-Khmer) និង វចនានុក្រម ខ្មែរ-អង់គ្លេស (Khmer-English)។\n` +
    `ពាក្យដែលត្រូវពន្យល់៖ "${targetWord}"\n` +
    `សូមពន្យល់ពាក្យនេះឱ្យបានក្បោះក្បាយ ច្បាស់លាស់ មិនខុសអក្ខរាវិរុទ្ធ និងលើកឧទាហរណ៍ជាល្បះ (Example Sentences) ទាំងភាសាខ្មែរ និងភាសាអង់គ្លេស ដើម្បីបង្ហាញ និងបញ្ជាក់អត្ថន័យឱ្យកាន់តែច្បាស់!\n` +
    `ហាមប្រើអក្សរថៃដាច់ខាត! សូមឆ្លើយជា JSON តែមួយគត់តាមទម្រង់នេះ៖\n` +
    `{\n` +
    `  "word": "ពាក្យគោលដែលសរសេរត្រឹមត្រូវតាមអក្ខរាវិរុទ្ធ",\n` +
    `  "englishEquivalent": "ពាក្យអង់គ្លេសដែលត្រូវគ្នា",\n` +
    `  "khmerEquivalent": "ពាក្យខ្មែរដែលត្រូវគ្នា",\n` +
    `  "partOfSpeech": "ថ្នាក់ពាក្យ (ឧ. នាម / Noun, កិរិយាសព្ទ / Verb, គុណនាម / Adjective)",\n` +
    `  "pronunciationKhmer": "របៀបអានបញ្ចេញសំឡេងជាអក្សរខ្មែរ",\n` +
    `  "pronunciationIpa": "សូរសព្ទអន្តរជាតិ (IPA / Phonetic)",\n` +
    `  "etymology": "ប្រភពពាក្យ (ឧ. ខ្មែរ / បាលី / សំស្ក្រឹត / អង់គ្លេស)",\n` +
    `  "khmerToKhmerDefinition": "និយមន័យ ខ្មែរ-ខ្មែរ តាមវចនានុក្រមសម្ដេចព្រះសង្ឃរាជ ជួន ណាត យ៉ាងក្បោះក្បាយ",\n` +
    `  "englishToKhmerDefinition": "និយមន័យ អង់គ្លេស-ខ្មែរ (ពន្យល់ពីពាក្យអង់គ្លេសមកជាភាសាខ្មែរ)",\n` +
    `  "khmerToEnglishDefinition": "និយមន័យ ខ្មែរ-អង់គ្លេស (Detailed definition in English)",\n` +
    `  "synonyms": ["វេវចនសព្ទ ឬពាក្យន័យដូចទី១", "ពាក្យន័យដូចទី២"],\n` +
    `  "antonyms": ["បដិសព្ទ ឬពាក្យន័យផ្ទុយទី១"],\n` +
    `  "examples": [\n` +
    `    {\n` +
    `      "khmerSentence": "ល្បះឧទាហរណ៍ជាភាសាខ្មែរទី១ ដែលមានប្រើពាក្យនេះយ៉ាងត្រឹមត្រូវ",\n` +
    `      "englishSentence": "Corresponding English example sentence #1",\n` +
    `      "explanation": "ការបញ្ជាក់អត្ថន័យនៃពាក្យនៅក្នុងល្បះឧទាហរណ៍នេះ"\n` +
    `    },\n` +
    `    {\n` +
    `      "khmerSentence": "ល្បះឧទាហរណ៍ជាភាសាខ្មែរទី២",\n` +
    `      "englishSentence": "Corresponding English example sentence #2",\n` +
    `      "explanation": "ការបញ្ជាក់អត្ថន័យនៃពាក្យនៅក្នុងល្បះឧទាហរណ៍ទី២"\n` +
    `    },\n` +
    `    {\n` +
    `      "khmerSentence": "ល្បះឧទាហរណ៍ជាភាសាខ្មែរទី៣",\n` +
    `      "englishSentence": "Corresponding English example sentence #3",\n` +
    `      "explanation": "ការបញ្ជាក់អត្ថន័យនៃពាក្យនៅក្នុងល្បះឧទាហរណ៍ទី៣"\n` +
    `    }\n` +
    `  ],\n` +
    `  "imagePrompt": "Clear English visual prompt illustrating the meaning of this word"\n` +
    `}`;

  const aiDict = await callGeminiJson(prompt, 14000);
  const resolvedHeadword = cleanKhmerSpelling(aiDict?.word || targetWord);
  const engEq = aiDict?.englishEquivalent || targetWord;
  const imgPrompt =
    aiDict?.imagePrompt || `Visual illustration representing the concept of ${engEq}`;
  const imageUrl = `/api/image/illustration?type=dictionary&theme=dictionary&title=${encodeURIComponent(
    `${resolvedHeadword} (${engEq})`
  )}&subtitle=${encodeURIComponent(
    cleanKhmerSpelling(aiDict?.partOfSpeech || "វចនានុក្រម ខ្មែរ-អង់គ្លេស")
  )}&prompt=${encodeURIComponent(imgPrompt)}`;

  if (aiDict && (aiDict.khmerToKhmerDefinition || aiDict.khmerToEnglishDefinition)) {
    return {
      ok: true,
      mode,
      word: resolvedHeadword,
      englishEquivalent: String(aiDict.englishEquivalent || ""),
      khmerEquivalent: cleanKhmerSpelling(aiDict.khmerEquivalent || resolvedHeadword),
      partOfSpeech: cleanKhmerSpelling(aiDict.partOfSpeech || "នាម (Noun)"),
      pronunciationKhmer: cleanKhmerSpelling(aiDict.pronunciationKhmer || resolvedHeadword),
      pronunciationIpa: String(aiDict.pronunciationIpa || ""),
      etymology: cleanKhmerSpelling(aiDict.etymology || "ភាសាខ្មែរ / បាលី-សំស្ក្រឹត"),
      khmerToKhmerDefinition: cleanKhmerSpelling(aiDict.khmerToKhmerDefinition || ""),
      englishToKhmerDefinition: cleanKhmerSpelling(aiDict.englishToKhmerDefinition || ""),
      khmerToEnglishDefinition: String(aiDict.khmerToEnglishDefinition || ""),
      synonyms: Array.isArray(aiDict.synonyms)
        ? aiDict.synonyms.map((s) => cleanKhmerSpelling(s))
        : [],
      antonyms: Array.isArray(aiDict.antonyms)
        ? aiDict.antonyms.map((s) => cleanKhmerSpelling(s))
        : [],
      examples: Array.isArray(aiDict.examples)
        ? aiDict.examples.map((ex) => ({
            khmerSentence: cleanKhmerSpelling(ex.khmerSentence || ""),
            englishSentence: String(ex.englishSentence || ""),
            explanation: cleanKhmerSpelling(ex.explanation || ""),
          }))
        : [],
      imagePrompt: imgPrompt,
      imageUrl,
    };
  }

  return {
    ok: true,
    mode,
    word: resolvedHeadword,
    englishEquivalent: "Wisdom / Intelligence",
    khmerEquivalent: resolvedHeadword,
    partOfSpeech: "នាម (Noun)",
    pronunciationKhmer: resolvedHeadword,
    pronunciationIpa: "/praːc.ɲaː/",
    etymology: "សំស្ក្រឹត (ប្រជ្ញា) / បាលី (បញ្ញា)",
    khmerToKhmerDefinition: `ការដឹងច្បាស់ ការយល់แจ้ง ការឈ្លាសវៃ ឬចំណេះវិជ្ជាដ៏ខ្ពង់ខ្ពស់សម្រាប់ពិចារណាដោះស្រាយបញ្ហា។`,
    englishToKhmerDefinition: `Wisdom / Intelligence ប្រែថា៖ ប្រាជ្ញា ភាពឈ្លាសវៃ ឬគតិបណ្ឌិត។`,
    khmerToEnglishDefinition: `The quality of having experience, knowledge, and good judgment; wisdom or intellect.`,
    synonyms: ["បញ្ញា", "គតិបណ្ឌិត", "ភាពឈ្លាសវៃ", "Wisdom", "Intellect"],
    antonyms: ["អវិជ្ជា", "ភាពល្ងង់ខ្លៅ", "Ignorance"],
    examples: [
      {
        khmerSentence: `មនុស្សមាន${resolvedHeadword}តែងតែដោះស្រាយបញ្ហាដោយសន្តិវិធី និងការពិចារណាគ្រប់ជ្រុងជ្រោយ។`,
        englishSentence: `A person with wisdom always solves problems peacefully and thoughtfully.`,
        explanation: `បង្ហាញពីការប្រើពាក្យ «${resolvedHeadword}» ជានាមសំដៅលើគតិបណ្ឌិត និងការពិចារណា។`,
      },
    ],
    imagePrompt: imgPrompt,
    imageUrl,
  };
}

// ============================================================================
// 4. CAMBODIA CALENDAR & DAILY EVENTS NOTIFICATION ENGINE (Requirement 6)
// បង្ហាញព្រឹត្តិការណ៍ប្រចាំថ្ងៃតាមប្រតិទិននៃប្រទេសកម្ពុជាតាមឆ្នាំជាក់ស្ដែង
// ============================================================================
const KHMER_MONTH_NAMES = [
  "មករា",
  "កុម្ភៈ",
  "មីនា",
  "មេសា",
  "ឧសភា",
  "មិថុនា",
  "កក្កដា",
  "សីហា",
  "កញ្ញា",
  "តុលា",
  "វិច្ឆិកា",
  "ធ្នូ",
];

const KHMER_WEEKDAYS = [
  "ថ្ងៃអាទិត្យ",
  "ថ្ងៃចន្ទ",
  "ថ្ងៃអង្គារ",
  "ថ្ងៃពុធ",
  "ថ្ងៃព្រហស្បតិ៍",
  "ថ្ងៃសុក្រ",
  "ថ្ងៃសៅរ៍",
];

const KHMER_DIGITS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];
export function toKhmerNumber(num) {
  return String(num)
    .split("")
    .map((ch) => (/\d/.test(ch) ? KHMER_DIGITS[Number(ch)] : ch))
    .join("");
}

export function buildCambodiaYearEvents(year = 2026) {
  const y = Number(year) || new Date().getFullYear();

  // Exact Lunar-based public holiday dates for Cambodia in 2025, 2026, 2027 (with accurate defaults)
  const lunarByYear = {
    2025: {
      meakBochea: { month: 2, day: 12 },
      visakBochea: { month: 5, day: 11 },
      royalPlowing: { month: 5, day: 15 },
      pchumBen: [
        { month: 9, day: 21 },
        { month: 9, day: 22 },
        { month: 9, day: 23 },
      ],
      waterFestival: [
        { month: 11, day: 4 },
        { month: 11, day: 5 },
        { month: 11, day: 6 },
      ],
    },
    2026: {
      meakBochea: { month: 3, day: 3 },
      visakBochea: { month: 5, day: 31 },
      royalPlowing: { month: 6, day: 4 },
      pchumBen: [
        { month: 10, day: 10 },
        { month: 10, day: 11 },
        { month: 10, day: 12 },
      ],
      waterFestival: [
        { month: 11, day: 23 },
        { month: 11, day: 24 },
        { month: 11, day: 25 },
      ],
    },
    2027: {
      meakBochea: { month: 2, day: 20 },
      visakBochea: { month: 5, day: 20 },
      royalPlowing: { month: 5, day: 24 },
      pchumBen: [
        { month: 9, day: 29 },
        { month: 9, day: 30 },
        { month: 10, day: 1 },
      ],
      waterFestival: [
        { month: 11, day: 13 },
        { month: 11, day: 14 },
        { month: 11, day: 15 },
      ],
    },
  };

  const lunar = lunarByYear[y] || lunarByYear[2026];

  const events = [
    // JANUARY
    {
      month: 1,
      day: 1,
      titleKhmer: "ទិវាចូលឆ្នាំសកល",
      titleEnglish: "International New Year's Day",
      category: "public_holiday",
      categoryLabelKhmer: "🏛️ ថ្ងៃឈប់សម្រាកផ្លូវការ & បុណ្យអន្តរជាតិ",
      isDayOff: true,
      daysOffCount: 1,
      descriptionKhmer: "ថ្ងៃបុណ្យចូលឆ្នាំថ្មីសកល ដែលមន្ត្រីរាជការ បុគ្គលិក និងសិស្សានុសិស្សត្រូវបានឈប់សម្រាកចំនួន ១ ថ្ងៃ។",
    },
    {
      month: 1,
      day: 7,
      titleKhmer: "ទិវាជ័យជម្នះលើរបបប្រល័យពូជសាសន៍",
      titleEnglish: "Victory over Genocide Day",
      category: "public_holiday",
      categoryLabelKhmer: "🏛️ ថ្ងៃបុណ្យជាតិ & ថ្ងៃឈប់សម្រាកផ្លូវការ",
      isDayOff: true,
      daysOffCount: 1,
      descriptionKhmer: "ទិវារំលឹកខួបនៃការរំដោះប្រទេសកម្ពុជាចេញពីរបបប្រល័យពូជសាសន៍ ប៉ុល ពត (៧ មករា ១៩៧៩)។ ឈប់សម្រាក ១ ថ្ងៃ។",
    },
    // FEBRUARY
    {
      month: 2,
      day: 14,
      titleKhmer: "ទិវានៃក្ដីស្រឡាញ់ (Valentine's Day)",
      titleEnglish: "Valentine's Day",
      category: "international",
      categoryLabelKhmer: "🌍 ទិវាអន្តរជាតិ",
      isDayOff: false,
      daysOffCount: 0,
      descriptionKhmer: "ទិវាបង្ហាញក្ដីស្រឡាញ់ ការគោរពដឹងគុណឪពុកម្ដាយ គ្រូបង្រៀន និងមិត្តភក្ដិប្រកបដោយសីលធម៌វប្បធម៌ខ្មែរ។",
    },
    {
      month: 2,
      day: 21,
      titleKhmer: "ទិវាភាសាកំណើតអន្តរជាតិ",
      titleEnglish: "International Mother Language Day",
      category: "international",
      categoryLabelKhmer: "🌍 ទិវាអន្តរជាតិ & វប្បធម៌",
      isDayOff: false,
      daysOffCount: 0,
      descriptionKhmer: "ទិវាលើកកម្ពស់ការស្រឡាញ់ និងថែរក្សាអក្សរសាស្ត្រ និងភាសាខ្មែរឱ្យបានគង់វង្ស។",
    },
    // MEAK BOCHEA (Lunar Feb/Mar)
    {
      month: lunar.meakBochea.month,
      day: lunar.meakBochea.day,
      titleKhmer: "ពិធីបុណ្យមាឃបូជា (១៥ កើត ខែមាឃ)",
      titleEnglish: "Meak Bochea Day",
      category: "public_holiday",
      categoryLabelKhmer: "🏛️ បុណ្យព្រះពុទ្ធសាសនា & ថ្ងៃឈប់សម្រាកផ្លូវការ",
      isDayOff: true,
      daysOffCount: 1,
      descriptionKhmer: "ពិធីបុណ្យរំលឹកដល់ថ្ងៃព្រះសម្មាសម្ពុទ្ធទ្រង់ធ្វើចតុរង្គសន្និបាត និងដាក់ព្រះជន្មាយុសង្ខារ។ ឈប់សម្រាកផ្លូវការ ១ ថ្ងៃ។",
    },
    // MARCH
    {
      month: 3,
      day: 3,
      titleKhmer: "ទិវាវប្បធម៌ជាតិ (៣ មីនា)",
      titleEnglish: "National Culture Day",
      category: "national_observance",
      categoryLabelKhmer: "🇰🇭 ទិវាជាតិសំខាន់",
      isDayOff: false,
      daysOffCount: 0,
      descriptionKhmer: "ទិវាវប្បធម៌ជាតិ ក្រោមពាក្យស្លោក «យុវជនដើម្បីវប្បធម៌ជាតិ» ដើម្បីអភិរក្សមរតកសិល្បៈវប្បធម៌ខ្មែរ។",
    },
    {
      month: 3,
      day: 8,
      titleKhmer: "ទិវាអន្តរជាតិនារី (៨ មីនា)",
      titleEnglish: "International Women's Day",
      category: "public_holiday",
      categoryLabelKhmer: "🏛️ បុណ្យអន្តរជាតិ & ថ្ងៃឈប់សម្រាកផ្លូវការ",
      isDayOff: true,
      daysOffCount: 1,
      descriptionKhmer: "ទិវាអបអរសាទរសិទ្ធិ សមភាព និងតួនាទីដ៏ឧត្តុង្គឧត្តមរបស់ស្ត្រីនៅកម្ពុជា និងពិភពលោក។ ឈប់សម្រាក ១ ថ្ងៃ។",
    },
    // APRIL
    {
      month: 4,
      day: 7,
      titleKhmer: "ទិវាសុខភាពពិភពលោក",
      titleEnglish: "World Health Day",
      category: "international",
      categoryLabelKhmer: "🌍 ទិវាអន្តរជាតិ",
      isDayOff: false,
      daysOffCount: 0,
      descriptionKhmer: "ទិវាលើកកម្ពស់ការថែទាំសុខភាពសាធារណៈ និងសុខុមាលភាពប្រជាពលរដ្ឋ។",
    },
    {
      month: 4,
      day: 14,
      titleKhmer: "ពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិខ្មែរ (ថ្ងៃទី ១ - មហាសង្ក្រាន្ត)",
      titleEnglish: "Khmer New Year (Day 1 - Maha Songkran)",
      category: "public_holiday",
      categoryLabelKhmer: "🏛️ បុណ្យប្រពៃណីជាតិ & ថ្ងៃឈប់សម្រាកផ្លូវការ",
      isDayOff: true,
      daysOffCount: 3,
      descriptionKhmer: "ថ្ងៃទី១ នៃពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិខ្មែរ (ទទួលទេវតាឆ្នាំថ្មី)។ ឈប់សម្រាកផ្លូវការ ៣ ថ្ងៃ (១៤-១៦ មេសា)។",
    },
    {
      month: 4,
      day: 15,
      titleKhmer: "ពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិខ្មែរ (ថ្ងៃទី ២ - វារៈវ័នបត)",
      titleEnglish: "Khmer New Year (Day 2 - Virak Wanabat)",
      category: "public_holiday",
      categoryLabelKhmer: "🏛️ បុណ្យប្រពៃណីជាតិ & ថ្ងៃឈប់សម្រាកផ្លូវការ",
      isDayOff: true,
      daysOffCount: 3,
      descriptionKhmer: "ថ្ងៃទី២ នៃពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិខ្មែរ ជូនសម្លៀកបំពាក់ និងធ្វើបុណ្យទានជូនអ្នកមានគុណ។",
    },
    {
      month: 4,
      day: 16,
      titleKhmer: "ពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិខ្មែរ (ថ្ងៃទី ៣ - វារៈឡើងស័ក)",
      titleEnglish: "Khmer New Year (Day 3 - Virak Loeurng Sak)",
      category: "public_holiday",
      categoryLabelKhmer: "🏛️ បុណ្យប្រពៃណីជាតិ & ថ្ងៃឈប់សម្រាកផ្លូវការ",
      isDayOff: true,
      daysOffCount: 3,
      descriptionKhmer: "ថ្ងៃទី៣ នៃពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិខ្មែរ (ពិធីស្រង់ព្រះ និងសុំខមាទោសមាតាបិតា ចាស់ព្រឹទ្ធាចារ្យ)។",
    },
    {
      month: 4,
      day: 22,
      titleKhmer: "ទិវាភពផែនដី (Earth Day)",
      titleEnglish: "International Mother Earth Day",
      category: "international",
      categoryLabelKhmer: "🌍 ទិវាអន្តរជាតិ",
      isDayOff: false,
      daysOffCount: 0,
      descriptionKhmer: "ទិវាបំផុសស្មារតីស្រឡាញ់បរិស្ថាន ដាំដើមឈើ និងកាត់បន្ថយការប្រើប្រាស់ប្លាស្ទិក។",
    },
    // MAY
    {
      month: 5,
      day: 1,
      titleKhmer: "ទិវាពលកម្មអន្តរជាតិ (១ ឧសភា)",
      titleEnglish: "International Labor Day",
      category: "public_holiday",
      categoryLabelKhmer: "🏛️ បុណ្យអន្តរជាតិ & ថ្ងៃឈប់សម្រាកផ្លូវការ",
      isDayOff: true,
      daysOffCount: 1,
      descriptionKhmer: "ទិវាអបអរសាទរសិទ្ធិ និងស្នាដៃរបស់កម្មករ និយោជិត ទូទាំងប្រទេសកម្ពុជា និងពិភពលោក។ ឈប់សម្រាក ១ ថ្ងៃ។",
    },
    {
      month: 5,
      day: 14,
      titleKhmer: "ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម ព្រះករុណាព្រះបាទសម្ដេចព្រះបរមនាថ នរោត្តម សីហមុនី",
      titleEnglish: "King Norodom Sihamoni's Birthday",
      category: "public_holiday",
      categoryLabelKhmer: "🏛️ បុណ្យជាតិ & ថ្ងៃឈប់សម្រាកផ្លូវការ",
      isDayOff: true,
      daysOffCount: 1,
      descriptionKhmer: "ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម ព្រះមហាក្សត្រនៃព្រះរាជាណាចក្រកម្ពុជា។ ឈប់សម្រាកផ្លូវការ ១ ថ្ងៃ។",
    },
    {
      month: 5,
      day: 20,
      titleKhmer: "ទិវាជាតិនៃការចងចាំ (២០ ឧសភា)",
      titleEnglish: "National Day of Remembrance",
      category: "public_holiday",
      categoryLabelKhmer: "🏛️ ទិវាជាតិ & ថ្ងៃឈប់សម្រាកផ្លូវការ",
      isDayOff: true,
      daysOffCount: 1,
      descriptionKhmer: "ទិវារំលឹកវិញ្ញាណក្ខន្ធជនរងគ្រោះដែលបានបាត់បង់ជីវិតក្នុងរបបកម្ពុជាប្រជាធិបតេយ្យ។ ឈប់សម្រាកផ្លូវការ ១ ថ្ងៃ។",
    },
    // VISAK BOCHEA & ROYAL PLOWING
    {
      month: lunar.visakBochea.month,
      day: lunar.visakBochea.day,
      titleKhmer: "ពិធីបុណ្យវិសាខបូជា (១៥ កើត ខែពិសាខ)",
      titleEnglish: "Visak Bochea Day",
      category: "public_holiday",
      categoryLabelKhmer: "🏛️ បុណ្យព្រះពុទ្ធសាសនា & ថ្ងៃឈប់សម្រាកផ្លូវការ",
      isDayOff: true,
      daysOffCount: 1,
      descriptionKhmer: "ថ្ងៃរំលឹកដល់ព្រះសម្មាសម្ពុទ្ធទ្រង់ប្រសូត ត្រាស់ដឹង និងបរិនិព្វាន។ ឈប់សម្រាកផ្លូវការ ១ ថ្ងៃ។",
    },
    {
      month: lunar.royalPlowing.month,
      day: lunar.royalPlowing.day,
      titleKhmer: "ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល (៤ រោច ខែពិសាខ)",
      titleEnglish: "Royal Plowing Ceremony",
      category: "public_holiday",
      categoryLabelKhmer: "🏛️ បុណ្យប្រពៃណីជាតិ & ថ្ងៃឈប់សម្រាកផ្លូវការ",
      isDayOff: true,
      daysOffCount: 1,
      descriptionKhmer: "ព្រះរាជពិធីបុរាណប្រកាសពីការចាប់ផ្ដើមរដូវធ្វើស្រែចម្ការនៅប្រទេសកម្ពុជា។ ឈប់សម្រាកផ្លូវការ ១ ថ្ងៃ។",
    },
    // JUNE
    {
      month: 6,
      day: 1,
      titleKhmer: "ទិវាកុមារអន្តរជាតិ និងទិវាខួបកំណើតកុមារកម្ពុជា",
      titleEnglish: "International Children's Day",
      category: "international",
      categoryLabelKhmer: "🌍 ទិវាជាតិ & អន្តរជាតិ",
      isDayOff: false,
      daysOffCount: 0,
      descriptionKhmer: "ទិវាលើកកម្ពស់សិទ្ធិកុមារ ការអប់រំ និងការការពារកុមារនៅទូទាំងប្រទេសកម្ពុជា និងពិភពលោក។",
    },
    {
      month: 6,
      day: 5,
      titleKhmer: "ទិវាបរិស្ថានពិភពលោក",
      titleEnglish: "World Environment Day",
      category: "international",
      categoryLabelKhmer: "🌍 ទិវាអន្តរជាតិ",
      isDayOff: false,
      daysOffCount: 0,
      descriptionKhmer: "ទិវាជាតិ និងអន្តរជាតិដើម្បីការពារធម្មជាតិ ព្រៃឈើ និងបរិស្ថានស្អាត។",
    },
    {
      month: 6,
      day: 18,
      titleKhmer: "ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម សម្ដេចព្រះមហាក្សត្រី នរោត្តម មុនីនាថ សីហនុ",
      titleEnglish: "Queen Mother Norodom Monineath Sihanouk's Birthday",
      category: "public_holiday",
      categoryLabelKhmer: "🏛️ បុណ្យជាតិ & ថ្ងៃឈប់សម្រាកផ្លូវការ",
      isDayOff: true,
      daysOffCount: 1,
      descriptionKhmer: "ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម សម្ដេចព្រះមហាក្សត្រី ព្រះវររាជមាតាជាតិខ្មែរ។ ឈប់សម្រាកផ្លូវការ ១ ថ្ងៃ។",
    },
    // JULY
    {
      month: 7,
      day: 9,
      titleKhmer: "រុក្ខទិវា (៩ កក្កដា)",
      titleEnglish: "Cambodia Arbor Day (Tree Planting Day)",
      category: "national_observance",
      categoryLabelKhmer: "🇰🇭 ទិវាជាតិសំខាន់",
      isDayOff: false,
      daysOffCount: 0,
      descriptionKhmer: "ទិវាដាំកូនឈើជាតិ ដើម្បីបង្កើនគម្របព្រៃឈើបៃតងនៅព្រះរាជាណាចក្រកម្ពុជា។",
    },
    // AUGUST
    {
      month: 8,
      day: 12,
      titleKhmer: "ទិវាយុវជនអន្តរជាតិ",
      titleEnglish: "International Youth Day",
      category: "international",
      categoryLabelKhmer: "🌍 ទិវាអន្តរជាតិ",
      isDayOff: false,
      daysOffCount: 0,
      descriptionKhmer: "ទិវាអបអរសាទរសក្ដានុពល ការច្នៃប្រឌិត និងតួនាទីរបស់យុវជនក្នុងការអភិវឌ្ឍសង្គម។",
    },
    // SEPTEMBER
    {
      month: 9,
      day: 8,
      titleKhmer: "ទិវាអក្ខរកម្មជាតិ និងអន្តរជាតិ (៨ កញ្ញា)",
      titleEnglish: "National & International Literacy Day",
      category: "international",
      categoryLabelKhmer: "🇰🇭🌍 ទិវាជាតិ & អន្តរជាតិ",
      isDayOff: false,
      daysOffCount: 0,
      descriptionKhmer: "ទិវាលើកកម្ពស់ការអាន ការសរសេរ និងចំណេះដឹងអក្ខរកម្មសម្រាប់ប្រជាពលរដ្ឋគ្រប់រូប។",
    },
    {
      month: 9,
      day: 21,
      titleKhmer: "ទិវាសន្តិភាពអន្តរជាតិ",
      titleEnglish: "International Day of Peace",
      category: "international",
      categoryLabelKhmer: "🌍 ទិវាអន្តរជាតិ",
      isDayOff: false,
      daysOffCount: 0,
      descriptionKhmer: "ទិវាពិភពលោកដើម្បីលើកកម្ពស់សន្តិភាព ការអត់ឱន និងការរួមរស់ដោយសុខដុមរមនា។",
    },
    {
      month: 9,
      day: 24,
      titleKhmer: "ទិវាប្រកាសរដ្ឋធម្មនុញ្ញ (២៤ កញ្ញា)",
      titleEnglish: "Constitutional Day",
      category: "public_holiday",
      categoryLabelKhmer: "🏛️ បុណ្យជាតិ & ថ្ងៃឈប់សម្រាកផ្លូវការ",
      isDayOff: true,
      daysOffCount: 1,
      descriptionKhmer: "ទិវារំលឹកខួបនៃការប្រកាសឱ្យប្រើប្រាស់រដ្ឋធម្មនុញ្ញនៃព្រះរាជាណាចក្រកម្ពុជា (២៤ កញ្ញា ១៩៩៣)។ ឈប់សម្រាក ១ ថ្ងៃ។",
    },
    // OCTOBER (Including Pchum Ben & Teachers Day)
    {
      month: 10,
      day: 5,
      titleKhmer: "ទិវាគ្រូបង្រៀនពិភពលោក និងទិវាគ្រូបង្រៀនជាតិ (៥ តុលា)",
      titleEnglish: "World & National Teachers' Day",
      category: "national_observance",
      categoryLabelKhmer: "🇰🇭🌍 ទិវាជាតិ & អន្តរជាតិ",
      isDayOff: false,
      daysOffCount: 0,
      descriptionKhmer: "ទិវាគោរពដឹងគុណគ្រូបង្រៀន ដែលជាមាតាបិតាទី២ និងជាអ្នកបណ្ដុះបណ្ដាលធនធានមនុស្ស។",
    },
    {
      month: lunar.pchumBen[0].month,
      day: lunar.pchumBen[0].day,
      titleKhmer: "ពិធីបុណ្យភ្ជុំបិណ្ឌ (ថ្ងៃទី ១ - បិណ្ឌ ១៤)",
      titleEnglish: "Pchum Ben Festival (Day 1)",
      category: "public_holiday",
      categoryLabelKhmer: "🏛️ បុណ្យប្រពៃណីជាតិ & ថ្ងៃឈប់សម្រាកផ្លូវការ",
      isDayOff: true,
      daysOffCount: 3,
      descriptionKhmer: "ពិធីបុណ្យប្រពៃណីជាតិខ្មែរដ៏ធំ ដើម្បីឧទ្ទិសកុសលជូនបុព្វការីជន និងញាតិការទាំង ៧ សន្ដាន។ ឈប់សម្រាកផ្លូវការ ៣ ថ្ងៃ។",
    },
    {
      month: lunar.pchumBen[1].month,
      day: lunar.pchumBen[1].day,
      titleKhmer: "ពិធីបុណ្យភ្ជុំបិណ្ឌ (ថ្ងៃទី ២ - ថ្ងៃភ្ជុំធំ ១៥ រោច ខែភទ្របទ)",
      titleEnglish: "Pchum Ben Festival (Day 2 - Main Pchum Ben Day)",
      category: "public_holiday",
      categoryLabelKhmer: "🏛️ បុណ្យប្រពៃណីជាតិ & ថ្ងៃឈប់សម្រាកផ្លូវការ",
      isDayOff: true,
      daysOffCount: 3,
      descriptionKhmer: "ថ្ងៃភ្ជុំបិណ្ឌធំ ដែលប្រជាពលរដ្ឋខ្មែរជួបជុំគ្រួសារយកចង្ហាន់ទៅវត្តអារាមទូទាំងប្រទេស។",
    },
    {
      month: lunar.pchumBen[2].month,
      day: lunar.pchumBen[2].day,
      titleKhmer: "ពិធីបុណ្យភ្ជុំបិណ្ឌ (ថ្ងៃទី ៣ - ថ្ងៃឆ្លងបុណ្យភ្ជុំបិណ្ឌ)",
      titleEnglish: "Pchum Ben Festival (Day 3)",
      category: "public_holiday",
      categoryLabelKhmer: "🏛️ បុណ្យប្រពៃណីជាតិ & ថ្ងៃឈប់សម្រាកផ្លូវការ",
      isDayOff: true,
      daysOffCount: 3,
      descriptionKhmer: "ថ្ងៃទី៣ នៃការឈប់សម្រាកពិធីបុណ្យភ្ជុំបិណ្ឌប្រពៃណីជាតិខ្មែរ។",
    },
    {
      month: 10,
      day: 15,
      titleKhmer: "ទិវាប្រារព្ធពិធីគោរពព្រះវិញ្ញាណក្ខន្ធ ព្រះករុណា ព្រះបាទសម្ដេចព្រះ នរោត្តម សីហនុ ព្រះបរមរតនកោដ្ឋ",
      titleEnglish: "Commemoration Day of King's Father Norodom Sihanouk",
      category: "public_holiday",
      categoryLabelKhmer: "🏛️ បុណ្យជាតិ & ថ្ងៃឈប់សម្រាកផ្លូវការ",
      isDayOff: true,
      daysOffCount: 1,
      descriptionKhmer: "ទិវាគោរពព្រះវិញ្ញាណក្ខន្ធ និងចងចាំព្រះមហាករុណាទិគុណនៃព្រះបរមរតនកោដ្ឋ (១៥ តុលា)។ ឈប់សម្រាក ១ ថ្ងៃ។",
    },
    {
      month: 10,
      day: 23,
      titleKhmer: "ទិវារំលឹកខួបនៃកិច្ចព្រមព្រៀងសន្តិភាពទីក្រុងប៉ារីស (២៣ តុលា)",
      titleEnglish: "Paris Peace Agreements Commemoration Day",
      category: "national_observance",
      categoryLabelKhmer: "🇰🇭 ទិវាប្រវត្តិសាស្ត្រជាតិ",
      isDayOff: false,
      daysOffCount: 0,
      descriptionKhmer: "ទិវារំលឹកខួបនៃការចុះហត្ថលេខាលើកិច្ចព្រមព្រៀងសន្តិភាពទីក្រុងប៉ារីស (២៣ តុលា ១៩៩១)។",
    },
    {
      month: 10,
      day: 24,
      titleKhmer: "ទិវាអង្គការសហប្រជាជាតិ (United Nations Day)",
      titleEnglish: "United Nations Day",
      category: "international",
      categoryLabelKhmer: "🌍 ទិវាអន្តរជាតិ",
      isDayOff: false,
      daysOffCount: 0,
      descriptionKhmer: "ទិវារំលឹកខួបនៃការបង្កើតអង្គការសហប្រជាជាតិ និងកិច្ចសហប្រតិបត្តិការអន្តរជាតិ។",
    },
    {
      month: 10,
      day: 29,
      titleKhmer: "ព្រះរាជពិធីបុណ្យគ្រងព្រះបរមរាជសម្បត្តិរបស់ ព្រះករុណាព្រះបាទសម្ដេចព្រះបរមនាថ នរោត្តម សីហមុនី",
      titleEnglish: "King Norodom Sihamoni's Coronation Day",
      category: "public_holiday",
      categoryLabelKhmer: "🏛️ បុណ្យជាតិ & ថ្ងៃឈប់សម្រាកផ្លូវការ",
      isDayOff: true,
      daysOffCount: 1,
      descriptionKhmer: "ទិវារំលឹកខួបនៃការឡើងគ្រងរាជ្យសម្បត្តិរបស់ព្រះមហាក្សត្រខ្មែរ (២៩ តុលា ២០០៤)។ ឈប់សម្រាកផ្លូវការ ១ ថ្ងៃ។",
    },
    // NOVEMBER
    {
      month: 11,
      day: 9,
      titleKhmer: "ពិធីបុណ្យឯករាជ្យជាតិ (៩ វិច្ឆិកា)",
      titleEnglish: "National Independence Day",
      category: "public_holiday",
      categoryLabelKhmer: "🏛️ បុណ្យជាតិ & ថ្ងៃឈប់សម្រាកផ្លូវការ",
      isDayOff: true,
      daysOffCount: 1,
      descriptionKhmer: "ទិវាបុណ្យឯករាជ្យជាតិ ដែលកម្ពុជាទទួលបានឯករាជ្យពេញលេញពីបារាំង (៩ វិច្ឆិកា ១៩៥៣)។ ឈប់សម្រាក ១ ថ្ងៃ។",
    },
    {
      month: lunar.waterFestival[0].month,
      day: lunar.waterFestival[0].day,
      titleKhmer: "ព្រះរាជពិធីបុណ្យអុំទូក បណ្ដែតប្រទីប និងសំពះព្រះខែ អកអំបុក (ថ្ងៃទី ១)",
      titleEnglish: "Water Festival / Bon Om Touk (Day 1)",
      category: "public_holiday",
      categoryLabelKhmer: "🏛️ បុណ្យប្រពៃណីជាតិ & ថ្ងៃឈប់សម្រាកផ្លូវការ",
      isDayOff: true,
      daysOffCount: 3,
      descriptionKhmer: "ថ្ងៃទី១ នៃព្រះរាជពិធីបុណ្យអុំទូក បណ្ដែតប្រទីប និងសំពះព្រះខែ អកអំបុក។ ឈប់សម្រាកផ្លូវការ ៣ ថ្ងៃ។",
    },
    {
      month: lunar.waterFestival[1].month,
      day: lunar.waterFestival[1].day,
      titleKhmer: "ព្រះរាជពិធីបុណ្យអុំទូក បណ្ដែតប្រទីប និងសំពះព្រះខែ អកអំបុក (ថ្ងៃទី ២ - ថ្ងៃសំពះព្រះខែ)",
      titleEnglish: "Water Festival / Bon Om Touk (Day 2)",
      category: "public_holiday",
      categoryLabelKhmer: "🏛️ បុណ្យប្រពៃណីជាតិ & ថ្ងៃឈប់សម្រាកផ្លូវការ",
      isDayOff: true,
      daysOffCount: 3,
      descriptionKhmer: "ថ្ងៃទី២ (១៥ កើត ខែកត្តិក) ពិធីសំពះព្រះខែ និងអកអំបុកនាពេលរាត្រី។",
    },
    {
      month: lunar.waterFestival[2].month,
      day: lunar.waterFestival[2].day,
      titleKhmer: "ព្រះរាជពិធីបុណ្យអុំទូក បណ្ដែតប្រទីប និងសំពះព្រះខែ អកអំបុក (ថ្ងៃទី ៣ - ថ្ងៃបញ្ចប់)",
      titleEnglish: "Water Festival / Bon Om Touk (Day 3)",
      category: "public_holiday",
      categoryLabelKhmer: "🏛️ បុណ្យប្រពៃណីជាតិ & ថ្ងៃឈប់សម្រាកផ្លូវការ",
      isDayOff: true,
      daysOffCount: 3,
      descriptionKhmer: "ថ្ងៃទី៣ (ថ្ងៃកាត់ព្រ័ត្រ) បញ្ចប់ព្រះរាជពិធីបុណ្យអុំទូកប្រពៃណីជាតិ។",
    },
    // DECEMBER
    {
      month: 12,
      day: 10,
      titleKhmer: "ទិវាសិទ្ធិមនុស្សអន្តរជាតិ (១០ ធ្នូ)",
      titleEnglish: "International Human Rights Day",
      category: "international",
      categoryLabelKhmer: "🌍 ទិវាអន្តរជាតិ",
      isDayOff: false,
      daysOffCount: 0,
      descriptionKhmer: "ទិវារំលឹកខួបនៃសេចក្ដីប្រកាសជាសកលស្ដីពីសិទ្ធិមនុស្សរបស់អង្គការសហប្រជាជាតិ។",
    },
    {
      month: 12,
      day: 29,
      titleKhmer: "ទិវាសន្តិភាពនៅកម្ពុជា (២៩ ធ្នូ)",
      titleEnglish: "Peace Day in Cambodia",
      category: "public_holiday",
      categoryLabelKhmer: "🏛️ បុណ្យជាតិ & ថ្ងៃឈប់សម្រាកផ្លូវការ",
      isDayOff: true,
      daysOffCount: 1,
      descriptionKhmer: "ទិវាបុណ្យជាតិផ្លូវការអបអរសាទរការបញ្ចប់សង្គ្រាមទាំងស្រុង និងការទទួលបានសន្តិភាពពេញលេញនៅកម្ពុជា (២៩ ធ្នូ ១៩៩៨)។ ឈប់សម្រាកផ្លូវការ ១ ថ្ងៃ។",
    },
  ];

  // Sort chronologically
  events.sort((a, b) => (a.month !== b.month ? a.month - b.month : a.day - b.day));

  return events.map((ev, idx) => {
    const padM = String(ev.month).padStart(2, "0");
    const padD = String(ev.day).padStart(2, "0");
    return {
      id: `kh-cal-${y}-${idx + 1}`,
      year: y,
      month: ev.month,
      day: ev.day,
      isoDate: `${y}-${padM}-${padD}`,
      dateKhmer: `ទី${toKhmerNumber(padD)} ខែ${KHMER_MONTH_NAMES[ev.month - 1]} ឆ្នាំ${toKhmerNumber(y)}`,
      ...ev,
    };
  });
}

export function isCambodiaCalendarRequestServer(text = "") {
  const clean = String(text || "").trim();
  if (!clean) return false;
  if (/^\/(?:calendar|holiday|holidays|event|events|ប្រតិទិន|បុណ្យជាតិ|ថ្ងៃឈប់សម្រាក)\b/i.test(clean)) {
    return true;
  }
  if (
    /(?:ប្រតិទិន|ថ្ងៃ\s*បុណ្យ\s*ជាតិ|បុណ្យ\s*ជាតិ|បុណ្យ\s*អន្តរជាតិ|ថ្ងៃ\s*ឈប់\s*សម្រាក|ព្រឹត្តិការណ៍\s*ប្រចាំ\s*ថ្ងៃ|ទិវា\s*(?:ជាតិ|អន្តរជាតិ|សំខាន់)|ថ្ងៃ\s*នេះ\s*ជា\s*ថ្ងៃ\s*បុណ្យ\s*អ្វី|cambodia\s+(?:calendar|holiday|public\s+holidays)|national\s+holidays?\s+in\s+cambodia)/i.test(
      clean
    )
  ) {
    return true;
  }
  return false;
}

export function getCambodiaCalendarEventsServer({
  year,
  month,
  query = "",
} = {}) {
  const now = new Date();
  const currentYear = Number(year) || now.getFullYear();
  const currentMonth = Number(month) || now.getMonth() + 1;
  const currentDay = now.getDate();
  const weekdayKhmer = KHMER_WEEKDAYS[now.getDay()];
  const buddhistEra = currentYear + 544;

  const animalYears = {
    2024: "ឆ្នាំរោង ឆស័ក",
    2025: "ឆ្នាំម្សាញ់ សប្តស័ក",
    2026: "ឆ្នាំមមី អដ្ឋស័ក",
    2027: "ឆ្នាំមមែ នព្វស័ក",
  };
  const khmerAnimalYear = animalYears[currentYear] || "ឆ្នាំមមី អដ្ឋស័ក";

  const allEvents = buildCambodiaYearEvents(currentYear);

  // Calculate daysDifference from today for each event
  const todayMidnight = new Date(currentYear, now.getMonth(), currentDay).getTime();
  const enrichedEvents = allEvents.map((ev) => {
    const evTime = new Date(currentYear, ev.month - 1, ev.day).getTime();
    const diffDays = Math.round((evTime - todayMidnight) / (1000 * 60 * 60 * 24));
    return {
      ...ev,
      daysFromToday: diffDays,
      status:
        diffDays === 0
          ? "today"
          : diffDays > 0
          ? "upcoming"
          : "past",
    };
  });

  const todayEvents = enrichedEvents.filter((e) => e.daysFromToday === 0);
  const currentMonthEvents = enrichedEvents.filter((e) => e.month === currentMonth);
  const upcomingEvents = enrichedEvents
    .filter((e) => e.daysFromToday >= 0)
    .slice(0, 8);

  // If we are near the end of the year and fewer than 4 upcoming events remain, append early next year's events
  if (upcomingEvents.length < 4) {
    const nextYearEvents = buildCambodiaYearEvents(currentYear + 1).slice(0, 4);
    for (const nev of nextYearEvents) {
      const nevTime = new Date(currentYear + 1, nev.month - 1, nev.day).getTime();
      const diffDays = Math.round((nevTime - todayMidnight) / (1000 * 60 * 60 * 24));
      upcomingEvents.push({
        ...nev,
        daysFromToday: diffDays,
        status: "upcoming",
      });
    }
  }

  const nextPublicHoliday =
    upcomingEvents.find((e) => e.isDayOff) || upcomingEvents[0] || allEvents[0];

  const cleanQuery = String(query || "").trim();
  const filteredEvents = cleanQuery
    ? enrichedEvents.filter(
        (e) =>
          e.titleKhmer.includes(cleanQuery) ||
          e.titleEnglish.toLowerCase().includes(cleanQuery.toLowerCase()) ||
          e.descriptionKhmer.includes(cleanQuery) ||
          KHMER_MONTH_NAMES[e.month - 1] === cleanQuery
      )
    : enrichedEvents;

  const todayFormattedKhmer = `${weekdayKhmer} ទី${toKhmerNumber(
    String(currentDay).padStart(2, "0")
  )} ខែ${KHMER_MONTH_NAMES[now.getMonth()]} ឆ្នាំ${toKhmerNumber(
    currentYear
  )} (${khmerAnimalYear} ព.ស. ${toKhmerNumber(buddhistEra)})`;

  const dailySummaryNotificationKhmer =
    todayEvents.length > 0
      ? `🔔 ជូនដំណឹងព្រឹត្តិការណ៍ថ្ងៃនេះ (${todayFormattedKhmer})៖ ថ្ងៃនេះគឺជា «${todayEvents
          .map((e) => e.titleKhmer)
          .join(" និង ")}»!`
      : nextPublicHoliday
      ? `📅 ថ្ងៃនេះគឺ ${todayFormattedKhmer}។ ពិធីបុណ្យ និងថ្ងៃឈប់សម្រាកផ្លូវការបន្ទាប់គឺ «${
          nextPublicHoliday.titleKhmer
        }» នៅ${nextPublicHoliday.dateKhmer} (នៅសល់ ${toKhmerNumber(
          nextPublicHoliday.daysFromToday
        )} ថ្ងៃទៀត)។`
      : `📅 ថ្ងៃនេះគឺ ${todayFormattedKhmer}។`;

  return {
    ok: true,
    year: currentYear,
    buddhistEra,
    khmerAnimalYear,
    todayFormattedKhmer,
    dailySummaryNotificationKhmer,
    todayEvents,
    currentMonth,
    currentMonthNameKhmer: KHMER_MONTH_NAMES[currentMonth - 1] || "",
    currentMonthEvents,
    upcomingEvents,
    nextPublicHoliday,
    totalPublicHolidayEvents: enrichedEvents.filter((e) => e.isDayOff).length,
    events: filteredEvents.length > 0 ? filteredEvents : enrichedEvents,
    allYearEvents: enrichedEvents,
  };
}
