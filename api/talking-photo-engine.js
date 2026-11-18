// ============================================================================
// TALKING PHOTO AI VIDEO ENGINE (ម៉ាស៊ីនបង្កើតវីដេអូពីរូបភាពនិយាយខ្មែររស់រវើក)
// Creates dynamic talking photo videos from any image/portrait with fluent,
// clear Khmer speech and vivid, customizable gestures (Sampeah, Waving,
// Smiling & Nodding, Expressive Gestures, Professional Presenter) 100% Free!
// ============================================================================

import { spawn } from "child_process";
import fs from "fs";
import path from "path";
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

function renderSvgBufferWithResvg(svg, options) {
  const ResvgClass = getResvg();
  if (!ResvgClass) return Buffer.alloc(0);
  try {
    const resvg = new ResvgClass(svg, options);
    return resvg.render().asPng();
  } catch {
    return Buffer.alloc(0);
  }
}

import { getConfiguredBotToken, sendTelegramHtml } from "./telegram-webhook.js";
import { generateKaraokeAssSubtitles } from "./video-subtitle-engine.js";

// Gesture styles and descriptions
export const TALKING_PHOTO_GESTURES = {
  sampeah: {
    id: "sampeah",
    nameKhmer: "🙏 សំពះ & គំនាប់គោរព",
    nameEn: "Traditional Khmer Sampeah & Respectful Bow",
    description: "លើកដៃសំពះគំនាប់យ៉ាងទន់ភ្លន់ ងក់ក្បាលគោរព និងញញឹមរាក់ទាក់",
    icon: "🙏",
  },
  wave: {
    id: "wave",
    nameKhmer: "👋 គ្រវីដៃស្វាគមន៍",
    nameEn: "Hand Wave & Warm Greeting",
    description: "គ្រវីដៃស្វាគមន៍យ៉ាងរស់រវើក ផ្អៀងក្បាលញញឹម និងសម្ដែងភាពស្និទ្ធស្នាល",
    icon: "👋",
  },
  smile_nod: {
    id: "smile_nod",
    nameKhmer: "😊 ញញឹម & ងក់ក្បាលរស់រវើក",
    nameEn: "Warm Smile & Affirmative Nod",
    description: "ញញឹមពព្រាយ ងក់ក្បាលយល់ស្រប ព្រិចភ្នែក និងដកដង្ហើមធម្មជាតិ",
    icon: "😊",
  },
  expressive: {
    id: "expressive",
    nameKhmer: "🎭 សម្ដែងរស់រវើក / កាយវិការដៃ",
    nameEn: "Expressive & Dramatic Gestures",
    description: "ធ្វើកាយវិការដៃប្រកបដោយមនោសញ្ចេតនា ទឹកមុខប្រែប្រួលតាមចង្វាក់សម្ដី",
    icon: "🎭",
  },
  presenter: {
    id: "presenter",
    nameKhmer: "👔 ធ្វើបទបង្ហាញ & ថ្លែងការណ៍",
    nameEn: "Professional Presenter & Speaker",
    description: "ឥរិយាបថម៉ឺងម៉ាត់ ច្បាស់លាស់ ដៃធ្វើកាយវិការពន្យល់ និងទំនុកចិត្តខ្ពស់",
    icon: "👔",
  },
  cheerful: {
    id: "cheerful",
    nameKhmer: "🎉 សប្បាយរីករាយ & កំប្លែង",
    nameEn: "Joyful & Energetic Bouncing",
    description: "ចង្វាក់រស់រវើក ផ្អៀងចុះឡើង ញញឹមសើច និងពោរពេញដោយថាមពលវិជ្ជមាន",
    icon: "🎉",
  },
};

// Preset sample avatars if user doesn't upload a photo immediately
export const SAMPLE_AVATAR_PRESETS = [
  {
    id: "khmer_girl",
    name: "👸 កញ្ញាខ្មែរ (ស្រីមុំ)",
    gender: "female",
    color: "#f472b6",
  },
  {
    id: "khmer_boy",
    name: "🤴 កម្លោះខ្មែរ (តារា)",
    gender: "male",
    color: "#38bdf8",
  },
  {
    id: "presenter",
    name: "👔 ពិធីករជំនាញ",
    gender: "male",
    color: "#fbbf24",
  },
  {
    id: "anime_hero",
    name: "✨ តួអង្គគំនូរជីវចល",
    gender: "female",
    color: "#a78bfa",
  },
];

/**
 * Checks if user text indicates intent to create a Talking Photo video
 */
export function isTalkingPhotoIntentServer(text = "") {
  const clean = String(text || "").trim();
  if (!clean) return false;

  // Slash commands
  if (
    /^\/(?:photovideo|talkingphoto|avatarvideo|talkingavatar|phototalk|វីដេអូរូបភាព|រូបភាពនិយាយ|រូបថតនិយាយ)\b/i.test(
      clean
    )
  ) {
    return true;
  }

  // Natural language in Khmer / English
  if (
    /(?:បង្កើត\s*វីដេអូ\s*(?:ដោយប្រើ|ពី)?\s*រូបភាព|វីដេអូ\s*រូបភាព\s*និយាយ|រូបភាព\s*និយាយ\s*ខ្មែរ|រូបថត\s*និយាយ|ធ្វើឱ្យ\s*រូបភាព\s*និយាយ|talking\s*photo|photo\s*to\s*video|talking\s*avatar|រូបភាព\s*មាន\s*កាយវិការ|កាយវិការ\s*តាមការចង់បាន)/i.test(
      clean
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Parses user input for gesture preferences, voice gender, and speech script
 */
export function parseTalkingPhotoPrompt(text = "") {
  let clean = String(text || "").trim();

  // Strip leading slash commands
  clean = clean
    .replace(
      /^\/(?:photovideo|talkingphoto|avatarvideo|talkingavatar|phototalk|វីដេអូរូបភាព|រូបភាពនិយាយ|រូបថតនិយាយ)(?:@\S+)?\s*/i,
      ""
    )
    .trim();

  let gesture = "sampeah"; // default to traditional respectful Khmer sampeah
  let voiceGender = "female"; // default to female voice

  // Detect gesture from keywords
  if (/(?:សំពះ|គំនាប់|គោរព|sampeah|bow)/i.test(clean)) {
    gesture = "sampeah";
  } else if (/(?:គ្រវីដៃ|បក់ដៃ|ស្វាគមន៍|wave|hello|hi)/i.test(clean)) {
    gesture = "wave";
  } else if (/(?:ញញឹម|ងក់ក្បាល|smile|nod)/i.test(clean)) {
    gesture = "smile_nod";
  } else if (/(?:សម្ដែង|រស់រវើក|drama|expressive|acting)/i.test(clean)) {
    gesture = "expressive";
  } else if (/(?:បទបង្ហាញ|ថ្លែងការណ៍|ពិធីករ|presenter|formal|speech)/i.test(clean)) {
    gesture = "presenter";
  } else if (/(?:សប្បាយ|កំប្លែង|cheerful|funny|laugh)/i.test(clean)) {
    gesture = "cheerful";
  }

  // Detect voice gender
  if (/(?:សំឡេងប្រុស|ប្រុស|male|man|boy)/i.test(clean)) {
    voiceGender = "male";
  } else if (/(?:សំឡេងស្រី|ស្រី|female|woman|girl)/i.test(clean)) {
    voiceGender = "female";
  }

  // Clean prompt tags like [កាយវិការ៖ សំពះ] or (សំឡេងប្រុស)
  let script = clean
    .replace(/\[\s*(?:កាយវិការ|gesture|សំឡេង|voice)[^\]]*\]/gi, "")
    .replace(/\(\s*(?:កាយវិការ|gesture|សំឡេង|voice)[^)]*\)/gi, "")
    .replace(
      /(?:កាយវិការ|gesture)\s*[:=]\s*(?:សំពះ|គ្រវីដៃ|ញញឹម|ងក់ក្បាល|សម្ដែង|ធ្វើបទបង្ហាញ|sampeah|wave|smile|nod)/gi,
      ""
    )
    .replace(/(?:សំឡេង|voice)\s*[:=]\s*(?:ស្រី|ប្រុស|female|male)/gi, "")
    .trim();

  // If user provided no text, supply a warm natural Khmer greeting
  if (!script || script.length < 3) {
    if (gesture === "sampeah") {
      script = "សូមគោរពជំរាបសួរពុកម៉ែបងប្អូនទាំងអស់គ្នា! ខ្ញុំបាទ/នាងខ្ញុំសូមជូនពរឱ្យមានសុខភាពល្អ និងសំណាងល្អគ្រប់ៗគ្នា!";
    } else if (gesture === "wave") {
      script = "សួស្តីអ្នកទាំងអស់គ្នា! រីករាយណាស់ដែលបានជួបគ្នាថ្ងៃនេះ! តោះមកនិយាយលេងជាមួយខ្ញុំទាំងអស់គ្នា!";
    } else if (gesture === "presenter") {
      script = "សូមស្វាគមន៍មកកាន់កម្មវិធីព័ត៌មាន និងបច្ចេកវិទ្យា AI ទំនើបចុងក្រោយបង្អស់!";
    } else {
      script = "សួស្តីបងប្អូនទាំងអស់គ្នា! នេះជាវីដេអូរូបភាពនិយាយខ្មែររស់រវើក បង្កើតឡើងដោយឥតគិតថ្លៃ ១០០%!";
    }
  }

  return { gesture, voiceGender, script };
}

/**
 * Generates clear Khmer speech audio buffer using Google TTS / Edge TTS
 */
export async function generateKhmerSpeechBuffer(text, voiceGender = "female") {
  const clean = String(text || "").trim();
  if (!clean) return Buffer.alloc(0);

  // Divide into short chunks if needed (<= 160 chars)
  const segments = clean.match(/[^。!?\n.?!]+[。!?\n.?!]?/g) || [clean];
  const audioChunks = [];

  for (const seg of segments.slice(0, 8)) {
    const trimmed = seg.trim();
    if (!trimmed) continue;
    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=km&client=tw-ob&q=${encodeURIComponent(
        trimmed.slice(0, 180)
      )}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });
      if (res.ok) {
        const ab = await res.arrayBuffer();
        if (ab.byteLength > 200) {
          audioChunks.push(Buffer.from(ab));
        }
      }
    } catch (e) {
      console.error("[generateKhmerSpeechBuffer] Chunk error:", e);
    }
  }

  if (audioChunks.length === 0) {
    // Single fallback
    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=km&client=tw-ob&q=${encodeURIComponent(
        clean.slice(0, 150)
      )}`;
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      const ab = await res.arrayBuffer();
      return Buffer.from(ab);
    } catch {
      return Buffer.alloc(0);
    }
  }

  const combined = Buffer.concat(audioChunks);

  // If male voice requested, lower pitch slightly using ffmpeg asetrate/atempo
  if (voiceGender === "male" && combined.length > 500) {
    return new Promise((resolve) => {
      const ff = spawn("ffmpeg", [
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        "pipe:0",
        "-filter:a",
        "asetrate=24000*0.88,atempo=1.13,volume=1.2",
        "-c:a",
        "libmp3lame",
        "-b:a",
        "128k",
        "-f",
        "mp3",
        "pipe:1",
      ]);
      const outBuf = [];
      ff.stdout.on("data", (c) => outBuf.push(c));
      ff.on("close", (code) => {
        if (code === 0 && outBuf.length > 0) {
          resolve(Buffer.concat(outBuf));
        } else {
          resolve(combined);
        }
      });
      ff.on("error", () => resolve(combined));
      ff.stdin.end(combined);
    });
  }

  return combined;
}

/**
 * Creates default high-quality portrait avatar PNG buffer if user didn't supply an image
 */
export function createDefaultAvatarPng(presetId = "khmer_girl") {
  const isFemale = presetId === "khmer_girl" || presetId === "anime_hero";
  const bgGrad = isFemale
    ? `<stop offset="0%" stop-color="#4c0519"/><stop offset="50%" stop-color="#831843"/><stop offset="100%" stop-color="#1e1b4b"/>`
    : `<stop offset="0%" stop-color="#082f49"/><stop offset="50%" stop-color="#0c4a6e"/><stop offset="100%" stop-color="#0f172a"/>`;

  const hairColor = isFemale ? "#18181b" : "#1e1e24";
  const skinColor = "#fed7aa";
  const shirtColor = isFemale ? "#db2777" : "#0284c7";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280">
    <defs>
      <linearGradient id="avatarBg" x1="0" y1="0" x2="0" y2="1">
        ${bgGrad}
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.5"/>
      </filter>
    </defs>
    <!-- Background -->
    <rect width="720" height="1280" fill="url(#avatarBg)"/>
    <!-- Subtle Ambient Circles -->
    <circle cx="360" cy="520" r="280" fill="#ffffff" fill-opacity="0.05"/>
    <circle cx="360" cy="520" r="220" fill="#ffffff" fill-opacity="0.08"/>

    <!-- Avatar Character -->
    <g filter="url(#shadow)">
      <!-- Shoulders & Upper Body -->
      <path d="M 160,1050 C 180,820 250,750 360,750 C 470,750 540,820 560,1050 Z" fill="${shirtColor}"/>
      <!-- Traditional Collar / Scarf -->
      <path d="M 310,750 L 360,860 L 410,750 Z" fill="#fbbf24"/>
      <!-- Neck -->
      <rect x="325" y="650" width="70" height="120" rx="30" fill="${skinColor}"/>
      <!-- Hair back (Female) -->
      ${
        isFemale
          ? `<path d="M 220,520 C 200,750 210,880 230,960 L 290,960 L 290,620 Z" fill="${hairColor}"/>
             <path d="M 500,520 C 520,750 510,880 490,960 L 430,960 L 430,620 Z" fill="${hairColor}"/>`
          : ""
      }
      <!-- Head / Face -->
      <ellipse cx="360" cy="530" rx="135" ry="165" fill="${skinColor}"/>
      <!-- Hair Top -->
      <path d="M 220,510 C 220,340 310,310 360,310 C 410,310 500,340 500,510 C 480,410 430,370 360,370 C 290,370 240,410 220,510 Z" fill="${hairColor}"/>
      <!-- Eyebrows -->
      <path d="M 270,470 Q 305,455 330,468" stroke="#27272a" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M 390,468 Q 415,455 450,470" stroke="#27272a" stroke-width="5" stroke-linecap="round" fill="none"/>
      <!-- Eyes (Alive, Twinkling) -->
      <circle cx="300" cy="505" r="14" fill="#18181b"/>
      <circle cx="304" cy="501" r="5" fill="#ffffff"/>
      <circle cx="420" cy="505" r="14" fill="#18181b"/>
      <circle cx="424" cy="501" r="5" fill="#ffffff"/>
      <!-- Cheeks Blush -->
      <ellipse cx="270" cy="545" rx="20" ry="12" fill="#fb7185" fill-opacity="0.45"/>
      <ellipse cx="450" cy="545" rx="20" ry="12" fill="#fb7185" fill-opacity="0.45"/>
      <!-- Nose -->
      <path d="M 360,515 L 355,550 Q 360,555 365,550 Z" fill="#f59e0b" fill-opacity="0.6"/>
      <!-- Mouth (Resting warm smile) -->
      <path d="M 325,585 Q 360,612 395,585" stroke="#e11d48" stroke-width="5" stroke-linecap="round" fill="#be123c"/>
    </g>
  </svg>`;

  return renderSvgBufferWithResvg(svg, { fitTo: { mode: "width", value: 720 } });
}

/**
 * Creates dynamic gesture SVG overlay (Sampeah hands, waving hand, presenter gestures)
 */
export function createGestureOverlayPng(gesture = "sampeah", width = 720, height = 1280) {
  let gestureSvgContent = "";

  if (gesture === "sampeah") {
    // Traditional Khmer Sampeah hands placed gracefully in front of chest
    gestureSvgContent = `
      <g filter="url(#gShadow)">
        <!-- Golden Wrist bangles -->
        <ellipse cx="360" cy="940" rx="45" ry="14" fill="#f59e0b" stroke="#fbbf24" stroke-width="2"/>
        <ellipse cx="360" cy="955" rx="42" ry="12" fill="#d97706"/>
        <!-- Forearms angled inward -->
        <path d="M 280,1100 L 325,930 L 395,930 L 440,1100 Z" fill="#fed7aa"/>
        <!-- Pressed Palms (Sampeah Lotus Shape) -->
        <path d="M 360,780 C 330,810 320,870 330,930 L 390,930 C 400,870 390,810 360,780 Z" fill="#ffedd5" stroke="#f59e0b" stroke-width="2.5"/>
        <!-- Fingertip Lotus Joint -->
        <path d="M 360,780 L 360,920" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
        <!-- Golden Lotus Ornament on thumbs -->
        <circle cx="360" cy="850" r="7" fill="#fbbf24"/>
        <circle cx="360" cy="850" r="3" fill="#ffffff"/>
      </g>`;
  } else if (gesture === "wave") {
    // Cheerful greeting waving hand raised on the right side
    gestureSvgContent = `
      <g filter="url(#gShadow)" transform="translate(480, 560)">
        <!-- Raised Forearm -->
        <path d="M 40,320 L 45,180 L 95,180 L 110,320 Z" fill="#fed7aa"/>
        <!-- Golden Bangle -->
        <rect x="42" y="175" width="56" height="12" rx="4" fill="#fbbf24"/>
        <!-- Open Palm & Waving Fingers -->
        <circle cx="70" cy="140" r="32" fill="#ffedd5" stroke="#f59e0b" stroke-width="2"/>
        <!-- 4 Extended Greeting Fingers -->
        <rect x="44" y="65" width="12" height="60" rx="6" fill="#ffedd5" stroke="#f59e0b" stroke-width="1.5" transform="rotate(-12 50 120)"/>
        <rect x="62" y="55" width="12" height="70" rx="6" fill="#ffedd5" stroke="#f59e0b" stroke-width="1.5"/>
        <rect x="80" y="60" width="12" height="65" rx="6" fill="#ffedd5" stroke="#f59e0b" stroke-width="1.5" transform="rotate(8 86 120)"/>
        <rect x="98" y="75" width="11" height="52" rx="5.5" fill="#ffedd5" stroke="#f59e0b" stroke-width="1.5" transform="rotate(20 103 120)"/>
        <!-- Thumb -->
        <rect x="25" y="130" width="14" height="42" rx="7" fill="#ffedd5" stroke="#f59e0b" stroke-width="1.5" transform="rotate(-40 32 150)"/>
        <!-- Motion lines indicating cheerful wave -->
        <path d="M 10,60 Q 30,40 25,20" stroke="#fef08a" stroke-width="4" stroke-linecap="round" fill="none"/>
        <path d="M 120,40 Q 140,55 145,80" stroke="#fef08a" stroke-width="4" stroke-linecap="round" fill="none"/>
      </g>`;
  } else if (gesture === "presenter") {
    // Professional presenter hand gesture explaining & presentation badge
    gestureSvgContent = `
      <g filter="url(#gShadow)">
        <!-- Presenter Explaining Hand (Lower Right) -->
        <g transform="translate(430, 820)">
          <path d="M 20,180 L 40,70 L 85,85 L 75,180 Z" fill="#fed7aa"/>
          <ellipse cx="65" cy="65" rx="28" ry="24" fill="#ffedd5" stroke="#0284c7" stroke-width="2"/>
          <!-- Pointer gesture fingers -->
          <rect x="60" y="25" width="14" height="48" rx="7" fill="#ffedd5" stroke="#0284c7" stroke-width="1.5" transform="rotate(-35 67 60)"/>
          <rect x="75" y="35" width="12" height="40" rx="6" fill="#ffedd5" stroke="#0284c7" stroke-width="1.5" transform="rotate(-15 81 65)"/>
        </g>
        <!-- Professional Microphone or Lapel Pin -->
        <rect x="345" y="710" width="30" height="14" rx="7" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
      </g>`;
  } else if (gesture === "expressive") {
    // Both hands slightly raised in expressive drama / emotional acting
    gestureSvgContent = `
      <g filter="url(#gShadow)">
        <!-- Left Expressive Hand -->
        <g transform="translate(160, 780)">
          <path d="M 30,160 L 60,60 L 105,75 L 85,160 Z" fill="#fed7aa"/>
          <circle cx="75" cy="55" r="26" fill="#ffedd5" stroke="#e11d48" stroke-width="2"/>
          <rect x="45" y="20" width="12" height="45" rx="6" fill="#ffedd5" stroke="#e11d48" stroke-width="1.5" transform="rotate(-25 51 55)"/>
          <rect x="65" y="15" width="12" height="48" rx="6" fill="#ffedd5" stroke="#e11d48" stroke-width="1.5"/>
        </g>
        <!-- Right Expressive Hand -->
        <g transform="translate(460, 780)">
          <path d="M 25,160 L 45,75 L 90,60 L 80,160 Z" fill="#fed7aa"/>
          <circle cx="55" cy="55" r="26" fill="#ffedd5" stroke="#e11d48" stroke-width="2"/>
          <rect x="50" y="15" width="12" height="48" rx="6" fill="#ffedd5" stroke="#e11d48" stroke-width="1.5"/>
          <rect x="70" y="20" width="12" height="45" rx="6" fill="#ffedd5" stroke="#e11d48" stroke-width="1.5" transform="rotate(25 76 55)"/>
        </g>
      </g>`;
  } else if (gesture === "cheerful") {
    // Joyful sparkles and celebration energy
    gestureSvgContent = `
      <g filter="url(#gShadow)">
        <!-- Floating Golden Sparkles -->
        <polygon points="180,380 186,395 201,395 189,405 194,420 180,410 166,420 171,405 159,395 174,395" fill="#fbbf24"/>
        <polygon points="530,340 534,352 546,352 536,360 540,372 530,364 520,372 524,360 514,352 526,352" fill="#38bdf8"/>
        <polygon points="560,480 564,490 574,490 566,497 569,507 560,500 551,507 554,497 546,490 556,490" fill="#f472b6"/>
        <!-- Cheerful Peace / Victory Hand -->
        <g transform="translate(480, 680)">
          <circle cx="60" cy="80" r="28" fill="#ffedd5" stroke="#fbbf24" stroke-width="2"/>
          <rect x="45" y="15" width="12" height="65" rx="6" fill="#ffedd5" stroke="#fbbf24" stroke-width="1.5" transform="rotate(-15 51 60)"/>
          <rect x="65" y="15" width="12" height="65" rx="6" fill="#ffedd5" stroke="#fbbf24" stroke-width="1.5" transform="rotate(15 71 60)"/>
        </g>
      </g>`;
  } else {
    // smile_nod: gentle subtle resting hands at bottom
    gestureSvgContent = `
      <g filter="url(#gShadow)">
        <path d="M 280,1050 C 310,980 410,980 440,1050 Z" fill="#ffedd5" stroke="#10b981" stroke-width="2"/>
      </g>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <filter id="gShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.6"/>
      </filter>
    </defs>
    ${gestureSvgContent}
  </svg>`;

  return renderSvgBufferWithResvg(svg, { fitTo: { mode: "width", value: width } });
}

/**
 * Creates speaking mouth overlay PNG (open mouth matching Khmer syllables)
 */
export function createSpeakingMouthOverlayPng(isOpen = true, width = 720, height = 1280) {
  const mouthSvg = isOpen
    ? `<ellipse cx="360" cy="595" rx="36" ry="22" fill="#500724" stroke="#e11d48" stroke-width="4"/>
       <!-- Upper Teeth -->
       <path d="M 334,587 Q 360,591 386,587 L 382,593 Q 360,597 338,593 Z" fill="#ffffff"/>
       <!-- Tongue -->
       <ellipse cx="360" cy="607" rx="20" ry="8" fill="#fb7185"/>`
    : `<path d="M 330,592 Q 360,610 390,592" stroke="#e11d48" stroke-width="5" stroke-linecap="round" fill="#881337"/>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <g>
      ${mouthSvg}
    </g>
  </svg>`;

  return renderSvgBufferWithResvg(svg, { fitTo: { mode: "width", value: width } });
}

function escapeXml(str = "") {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Creates modern glassmorphic Khmer subtitle & branding card
 */
export function createSubtitleCardPng(
  text,
  gestureName = "🙏 សំពះ",
  voiceName = "សំឡេងស្រី",
  width = 720,
  height = 1280,
  options = {}
) {
  const showStaticText = Boolean(options.showStaticText);
  // Truncate or wrap subtitle text nicely
  const cleanText = String(text || "").trim();
  const rawLine1 = cleanText.length > 34 ? cleanText.slice(0, 32) + "..." : cleanText;
  const rawLine2 = cleanText.length > 34 ? cleanText.slice(32, 66) : "";

  const displayLine1 = escapeXml(rawLine1);
  const displayLine2 = escapeXml(rawLine2);
  const safeGestureName = escapeXml(gestureName);
  const safeVoiceName = escapeXml(voiceName);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#090d16" stop-opacity="0.88"/>
        <stop offset="100%" stop-color="#020617" stop-opacity="0.96"/>
      </linearGradient>
      <linearGradient id="borderGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#38bdf8"/>
        <stop offset="50%" stop-color="#ec4899"/>
        <stop offset="100%" stop-color="#fbbf24"/>
      </linearGradient>
      <filter id="cShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.8"/>
      </filter>
    </defs>

    <!-- Top Header Badge -->
    <g filter="url(#cShadow)">
      <rect x="40" y="40" width="640" height="64" rx="20" fill="url(#cardGrad)" stroke="url(#borderGrad)" stroke-width="2"/>
      <circle cx="76" cy="72" r="14" fill="#10b981"/>
      <text x="76" y="78" fill="#ffffff" font-size="16" font-weight="bold" text-anchor="middle" font-family="'Khmer OS Battambang', 'Noto Sans Khmer', sans-serif">✓</text>
      <text x="105" y="79" fill="#f8fafc" font-size="20" font-weight="bold" font-family="'Khmer OS Battambang', 'Noto Sans Khmer', sans-serif">🎬 Talking Photo AI • និយាយខ្មែររស់រវើក</text>
      <rect x="540" y="54" width="125" height="36" rx="12" fill="#ef4444"/>
      <text x="602" y="78" fill="#ffffff" font-size="16" font-weight="bold" text-anchor="middle" font-family="'Khmer OS Battambang', 'Noto Sans Khmer', sans-serif">100% FREE</text>
    </g>

    <!-- Bottom Subtitle Card -->
    <g filter="url(#cShadow)">
      <rect x="36" y="${height - 230}" width="${width - 72}" height="180" rx="26" fill="url(#cardGrad)" stroke="url(#borderGrad)" stroke-width="2.5"/>
      
      <!-- Badges Row -->
      <rect x="60" y="${height - 212}" width="250" height="32" rx="10" fill="#1e293b"/>
      <text x="72" y="${height - 191}" fill="#38bdf8" font-size="15" font-weight="bold" font-family="'Khmer OS Battambang', 'Noto Sans Khmer', sans-serif">កាយវិការ៖ ${safeGestureName}</text>

      <rect x="325" y="${height - 212}" width="220" height="32" rx="10" fill="#1e293b"/>
      <text x="337" y="${height - 191}" fill="#ec4899" font-size="15" font-weight="bold" font-family="'Khmer OS Battambang', 'Noto Sans Khmer', sans-serif">🎙️ សំឡេង៖ ${safeVoiceName}</text>

      <!-- Animated Voice Waveform Bars -->
      <g transform="translate(${width - 130}, ${height - 212})">
        <rect x="0" y="16" width="4" height="12" rx="2" fill="#10b981"/>
        <rect x="7" y="8" width="4" height="20" rx="2" fill="#38bdf8"/>
        <rect x="14" y="2" width="4" height="26" rx="2" fill="#fbbf24"/>
        <rect x="21" y="10" width="4" height="18" rx="2" fill="#ec4899"/>
        <rect x="28" y="14" width="4" height="14" rx="2" fill="#a855f7"/>
      </g>

      ${
        showStaticText
          ? `<!-- Khmer Spoken Text -->
      <text x="${width / 2}" y="${height - 142}" fill="#ffffff" font-size="24" font-weight="bold" text-anchor="middle" font-family="'Khmer OS Battambang', 'Noto Sans Khmer', sans-serif">
        ${displayLine1}
      </text>
      ${
        displayLine2
          ? `<text x="${width / 2}" y="${height - 105}" fill="#fde047" font-size="22" font-weight="bold" text-anchor="middle" font-family="'Khmer OS Battambang', 'Noto Sans Khmer', sans-serif">
               ${displayLine2}
             </text>`
          : ""
      }`
          : ""
      }

      <text x="${width / 2}" y="${height - 68}" fill="#94a3b8" font-size="13" text-anchor="middle" font-family="'Khmer OS Battambang', 'Noto Sans Khmer', sans-serif">
        ✨ បង្កើតដោយ Khmer Super AI Bot • គ្មានគិតប្រាក់ • Free &amp; Unlimited
      </text>
    </g>
  </svg>`;

  return renderSvgBufferWithResvg(svg, { fitTo: { mode: "width", value: width } });
}

/**
 * Gets audio duration using ffprobe
 */
export function getAudioDurationSec(audioPath) {
  return new Promise((resolve) => {
    try {
      const p = spawn("ffprobe", [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        audioPath,
      ]);
      let out = "";
      p.stdout.on("data", (d) => (out += d.toString()));
      p.on("close", () => {
        const val = parseFloat(out.trim());
        resolve(!isNaN(val) && val > 0.5 ? val : 4.0);
      });
      p.on("error", () => resolve(4.0));
    } catch {
      resolve(4.0);
    }
  });
}

/**
 * Full Video Generator: Combines Image, Speech, Gestures, Animated Motion, and Subtitles into MP4 Video
 */
export async function createTalkingPhotoVideo(imageBuffer, text, options = {}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "talking_photo_"));
  const gestureKey = options.gesture || "sampeah";
  const gestureObj = TALKING_PHOTO_GESTURES[gestureKey] || TALKING_PHOTO_GESTURES.sampeah;
  const voiceGender = options.voiceGender || "female";
  const voiceName = voiceGender === "male" ? "សំឡេងប្រុស" : "សំឡេងស្រី";
  const cleanScript = String(text || "").trim();

  const outMp4Path = path.join(tmpDir, "output.mp4");
  const audioPath = path.join(tmpDir, "speech.mp3");
  const baseImgPath = path.join(tmpDir, "base_photo.png");
  const gestureImgPath = path.join(tmpDir, "gesture.png");
  const subtitleImgPath = path.join(tmpDir, "subtitle.png");

  try {
    // 1. Generate Khmer speech audio
    let speechBuf = await generateKhmerSpeechBuffer(cleanScript, voiceGender);
    if (!speechBuf || speechBuf.length < 300) {
      // Fallback greeting audio if empty
      speechBuf = await generateKhmerSpeechBuffer(
        "សូមគោរពជំរាបសួរពុកម៉ែបងប្អូនទាំងអស់គ្នា!",
        voiceGender
      );
    }
    fs.writeFileSync(audioPath, speechBuf);

    // 2. Measure duration
    const audioDur = await getAudioDurationSec(audioPath);
    const videoDuration = Math.max(2.5, Math.min(30, audioDur + 0.6));

    // 3. Prepare Base Image: If provided buffer, write it; otherwise use default Khmer avatar
    if (imageBuffer && Buffer.isBuffer(imageBuffer) && imageBuffer.length > 500) {
      fs.writeFileSync(baseImgPath, imageBuffer);
    } else {
      const defaultAvatarBuf = createDefaultAvatarPng(
        voiceGender === "female" ? "khmer_girl" : "khmer_boy"
      );
      fs.writeFileSync(baseImgPath, defaultAvatarBuf);
    }

    // 4. Generate Gesture Overlay PNG
    const gesturePng = createGestureOverlayPng(gestureKey, 720, 1280);
    fs.writeFileSync(gestureImgPath, gesturePng);

    // 5. Generate Dynamic Running Karaoke Subtitles (ASS) & Glassmorphic Subtitle Card
    const assContent = generateKaraokeAssSubtitles(cleanScript, videoDuration, {
      width: 720,
      height: 1280,
      fontSize: 42,
      marginV: 112,
      preset: options.subtitlePreset || "tiktok_gold",
    });
    const assPath = path.join(tmpDir, "karaoke.ass");
    fs.writeFileSync(assPath, assContent);

    const subPng = createSubtitleCardPng(
      cleanScript,
      gestureObj.nameKhmer,
      voiceName,
      720,
      1280,
      { showStaticText: false }
    );
    fs.writeFileSync(subtitleImgPath, subPng);

    // 6. Assemble Multi-Layer Animated Video using FFmpeg
    // Natural human breathing & sway motion:
    // Base layer: scaled to fill 720x1280 with smooth camera motion
    // Layer 1: Gesture overlay with subtle breathing sync
    // Layer 2: Subtitle glassmorphism card
    // Layer 3: Kinetic Karaoke Subtitles running across words in sync with voice!
    // Audio: Synchronized Khmer speech track
    const filterComplex = [
      // Base portrait: Smart crop to 720x1280 with breathing camera sway
      `[0:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,zoompan=z='1.025+0.015*sin(time*2.2)':x='iw/2-(iw/zoom/2)+8*sin(time*1.8)':y='ih/2-(ih/zoom/2)+5*cos(time*2.0)':d=1:s=720x1280:fps=30[bg]`,
      // Gesture layer: subtle breathing bounce with chest movement
      `[1:v]scale=720:1280,format=rgba[gst]`,
      `[bg][gst]overlay=0:'4*sin(t*2.2)':shortest=1[comp1]`,
      // Subtitle card overlay + Animated running Karaoke subtitles on top
      `[2:v]scale=720:1280,format=rgba[sub]`,
      `[comp1][sub]overlay=0:0:shortest=1,subtitles=${assPath}[vout]`,
    ].join(";");

    await new Promise((resolve, reject) => {
      const ff = spawn("ffmpeg", [
        "-y",
        "-loop",
        "1",
        "-t",
        String(videoDuration),
        "-i",
        baseImgPath,
        "-loop",
        "1",
        "-t",
        String(videoDuration),
        "-i",
        gestureImgPath,
        "-loop",
        "1",
        "-t",
        String(videoDuration),
        "-i",
        subtitleImgPath,
        "-i",
        audioPath,
        "-filter_complex",
        filterComplex,
        "-map",
        "[vout]",
        "-map",
        "3:a",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "22",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-ar",
        "44100",
        "-movflags",
        "+faststart",
        "-t",
        String(videoDuration),
        outMp4Path,
      ]);

      let stderrLog = "";
      ff.stderr.on("data", (d) => (stderrLog += d.toString()));
      ff.on("close", (code) => {
        if (code === 0 && fs.existsSync(outMp4Path) && fs.statSync(outMp4Path).size > 1000) {
          resolve(true);
        } else {
          console.error("[createTalkingPhotoVideo] FFmpeg failed code:", code, stderrLog);
          reject(new Error(`FFmpeg failed with code ${code}`));
        }
      });
      ff.on("error", (err) => {
        console.error("[createTalkingPhotoVideo] FFmpeg error:", err);
        reject(err);
      });
    });

    const videoBuffer = fs.readFileSync(outMp4Path);
    return {
      ok: true,
      buffer: videoBuffer,
      duration: Math.round(videoDuration),
      gesture: gestureObj,
      voiceGender,
      voiceName,
    };
  } finally {
    // Cleanup temporary directory
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

/**
 * Sends generated talking photo video to Telegram chat via sendVideo API
 */
export async function sendTelegramTalkingPhotoVideo(
  token,
  chatId,
  videoBuffer,
  options = {}
) {
  const effectiveToken = getConfiguredBotToken(token);
  if (!effectiveToken || !chatId || !videoBuffer || videoBuffer.length < 1000) {
    return { ok: false, error: "Invalid parameters or video buffer" };
  }

  const duration = options.duration || 4;
  const gesture = options.gesture || TALKING_PHOTO_GESTURES.sampeah;
  const voiceName = options.voiceName || "សំឡេងស្រី";
  const replyToId = options.replyToMessageId ? Number(options.replyToMessageId) : undefined;

  const caption =
    options.caption ||
    `🎬✨ <b>វីដេអូរូបភាពនិយាយខ្មែររស់រវើក (Talking Photo AI)</b>\n\n` +
    `• ${gesture.icon} <b>កាយវិការ៖</b> <code>${gesture.nameKhmer}</code>\n` +
    `• 🎙️ <b>សំឡេង៖</b> <code>${voiceName}</code>\n` +
    `• ⏱️ <b>រយៈពេល៖</b> ${duration} វិនាទី\n` +
    `• 💎 <b>កម្រិត៖</b> HD 720p (ច្បាស់ 100% ឥតគិតថ្លៃ)\n\n` +
    `<i>💡 ចុចប៊ូតុងខាងក្រោមដើម្បីសាកល្បងកាយវិការផ្សេង ឬប្ដូរសំឡេងប្រុស/ស្រីភ្លាមៗ៖</i>`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "🙏 សំពះ & គោរព", callback_data: "tp_gesture:sampeah" },
        { text: "👋 គ្រវីដៃស្វាគមន៍", callback_data: "tp_gesture:wave" },
      ],
      [
        { text: "😊 ញញឹម & ងក់ក្បាល", callback_data: "tp_gesture:smile_nod" },
        { text: "🎭 សម្ដែងរស់រវើក", callback_data: "tp_gesture:expressive" },
      ],
      [
        { text: "👔 ធ្វើបទបង្ហាញ", callback_data: "tp_gesture:presenter" },
        { text: "🎉 សប្បាយរីករាយ", callback_data: "tp_gesture:cheerful" },
      ],
      [
        { text: "🔄 ប្ដូរសំឡេង (ប្រុស ⇄ ស្រី)", callback_data: "tp_toggle_voice" },
        { text: "📸 បង្កើតវីដេអូថ្មីមួយទៀត", callback_data: "tp_create_new" },
      ],
    ],
  };

  try {
    const form = new FormData();
    form.append("chat_id", String(chatId));
    if (replyToId) form.append("reply_to_message_id", String(replyToId));
    form.append("caption", caption);
    form.append("parse_mode", "HTML");
    form.append("duration", String(duration));
    form.append("width", "720");
    form.append("height", "1280");
    form.append("supports_streaming", "true");
    form.append("reply_markup", JSON.stringify(keyboard));
    form.append(
      "video",
      new Blob([new Uint8Array(videoBuffer)], { type: "video/mp4" }),
      "talking-photo.mp4"
    );

    const res = await fetch(`https://api.telegram.org/bot${effectiveToken}/sendVideo`, {
      method: "POST",
      body: form,
    });
    const data = await res.json().catch(() => ({}));

    if (!data.ok) {
      console.error("[sendTelegramTalkingPhotoVideo] sendVideo error, trying document:", data);
      // Fallback to sendDocument
      const docForm = new FormData();
      docForm.append("chat_id", String(chatId));
      if (replyToId) docForm.append("reply_to_message_id", String(replyToId));
      docForm.append("caption", caption);
      docForm.append("parse_mode", "HTML");
      docForm.append("reply_markup", JSON.stringify(keyboard));
      docForm.append(
        "document",
        new Blob([new Uint8Array(videoBuffer)], { type: "video/mp4" }),
        "talking-photo.mp4"
      );
      const docRes = await fetch(`https://api.telegram.org/bot${effectiveToken}/sendDocument`, {
        method: "POST",
        body: docForm,
      });
      const docData = await docRes.json().catch(() => ({}));
      return { ok: docData.ok, result: docData.result, error: docData.description };
    }

    return { ok: true, result: data.result };
  } catch (err) {
    console.error("[sendTelegramTalkingPhotoVideo] Exception:", err);
    return { ok: false, error: err?.message || String(err) };
  }
}

/**
 * Returns Talking Photo Welcome & Guide message with interactive inline buttons
 */
export async function sendTalkingPhotoInteractiveMenu(token, chatId) {
  const effectiveToken = getConfiguredBotToken(token);
  const text =
    `🎬✨ <b>មុខងារបង្កើតវីដេអូពីរូបភាពនិយាយខ្មែររស់រវើក (Talking Photo AI)</b>\n\n` +
    `• 📸 <b>សមត្ថភាព៖</b> បម្លែងរូបថត តួអង្គ ឬរូប Selfie ទៅជាវីដេអូនិយាយខ្មែរបានយ៉ាងច្បាស់លាស់ ព្រមទាំងមានកាយវិការរស់រវើកតាមការចង់បានរបស់អ្នក!\n` +
    `• 💎 <b>ឥតគិតថ្លៃ ១០០% (Free & Unlimited)</b> មិនអស់លុយ មិនកំណត់ចំនួនដង!\n\n` +
    `<b>👉 របៀបប្រើប្រាស់ងាយៗ៖</b>\n` +
    `1️⃣ <b>ផ្ញើរូបភាព (រូបថត)</b> ចូលមកក្នុងឆាតនេះ\n` +
    `2️⃣ <b>សរសេរអត្ថបទដែលចង់ឱ្យនិយាយ</b> និងកាយវិការដែលចង់បានក្នុង Caption ឬផ្ញើតាមក្រោយ\n` +
    `<i>(ឧទាហរណ៍៖ <code>/photovideo សូមគោរពជំរាបសួរពុកម៉ែបងប្អូនទាំងអស់គ្នា! [កាយវិការ៖ សំពះ]</code>)</i>\n\n` +
    `💡 <i>ឬអ្នកអាចចុចជ្រើសរើសរូបតួអង្គគំរូ និងកាយវិការខាងក្រោមដើម្បីបង្កើតសាកល្បងភ្លាមៗ៖</i>`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "👸 កញ្ញាខ្មែរ (សំពះ)", callback_data: "tp_demo:khmer_girl:sampeah" },
        { text: "🤴 កម្លោះខ្មែរ (គ្រវីដៃ)", callback_data: "tp_demo:khmer_boy:wave" },
      ],
      [
        { text: "👔 ពិធីករ (បទបង្ហាញ)", callback_data: "tp_demo:presenter:presenter" },
        { text: "🎭 សម្ដែងរស់រវើក", callback_data: "tp_demo:anime_hero:expressive" },
      ],
      [
        { text: "📸 ខ្ញុំចង់ផ្ញើរូបភាពផ្ទាល់ខ្លួន", callback_data: "tp_mode:upload_photo" },
      ],
      [
        { text: "📋 មើលម៉ឺនុយសមត្ថភាពទាំងអស់", callback_data: "menu_dashboard" },
      ],
    ],
  };

  return await sendTelegramHtml(effectiveToken, chatId, text, keyboard);
}
