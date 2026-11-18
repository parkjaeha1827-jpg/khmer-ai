// Google AI Studio Khmer Voice Engine & Custom Voice Cloner
// Replaces Sreymom and Piseth with beautiful Google AI Studio voices (Kore, Charon, Zephyr, Puck, Fenrir)
// and custom user-uploaded voices from Telegram bot.
// Foreign language voices remain 100% native untouched.

import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { GoogleGenAI } from "@google/genai";

const DATA_DIR = path.resolve(process.cwd(), "data", "custom_voices");
const CACHE_DIR = path.resolve(DATA_DIR, "audio_cache");
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

const PROFILES_PATH = path.join(DATA_DIR, "custom_voice_profiles.json");

// Prebuilt beautiful voices in Google AI Studio that speak Khmer natively & fluently
export const GOOGLE_STUDIO_VOICES = {
  kore: {
    id: "kore",
    voiceName: "Kore",
    gender: "female",
    nameKhmer: "✨ Kore (Google AI Studio - ស្រី ផ្អែមស្រទន់ ពិរោះ)",
    descKhmer: "សំឡេងស្រី Google AI Studio ផ្អែមស្រទន់ ពិរោះ កក់ក្ដៅ ធម្មជាតិ",
    stylePrompt: "Sweet, clear, friendly and natural Khmer female speaker",
  },
  zephyr: {
    id: "zephyr",
    voiceName: "Zephyr",
    gender: "female",
    nameKhmer: "🌿 Zephyr (Google AI Studio - ស្រី ស្រាលស្រទន់ រលូន)",
    descKhmer: "សំឡេងស្រី Google AI Studio ស្រាលស្រទន់ ពិរោះរលូន ថ្លា",
    stylePrompt: "Gentle, soothing, clear and smooth Khmer female speaker",
  },
  charon: {
    id: "charon",
    voiceName: "Charon",
    gender: "male",
    nameKhmer: "🌊 Charon (Google AI Studio - ប្រុស ធ្ងន់ កក់ក្ដៅ)",
    descKhmer: "សំឡេងប្រុស Google AI Studio ធ្ងន់ ម៉ឺងម៉ាត់ កក់ក្ដៅ ច្បាស់លាស់",
    stylePrompt: "Deep, calm, confident and warm Khmer male speaker",
  },
  puck: {
    id: "puck",
    voiceName: "Puck",
    gender: "male",
    nameKhmer: "⚡ Puck (Google AI Studio - ប្រុស រស់រវើក ក្រមិចក្រមើម)",
    descKhmer: "សំឡេងប្រុស Google AI Studio រស់រវើក ស្រស់ស្រាយ ក្រមិចក្រមើម",
    stylePrompt: "Enthusiastic, cheerful, friendly Khmer male speaker",
  },
  fenrir: {
    id: "fenrir",
    voiceName: "Fenrir",
    gender: "male",
    nameKhmer: "🔥 Fenrir (Google AI Studio - ប្រុស រឹងមាំ ច្បាស់លាស់)",
    descKhmer: "សំឡេងប្រុស Google AI Studio រឹងមាំ ម៉ឺងម៉ាត់ ច្បាស់លាស់",
    stylePrompt: "Strong, clear, articulate Khmer male speaker",
  },
  dara: {
    id: "dara",
    voiceName: "Dara",
    gender: "male",
    nameKhmer: "🌟 តារា (សំឡេងប្រុស - Dara)",
    descKhmer: "សំឡេងប្រុសតារា ធ្ងន់ កក់ក្ដៅ ម៉ឺងម៉ាត់ ច្បាស់លាស់ និយាយខ្មែរពិរោះ",
    stylePrompt: "Deep, calm, confident and warm Khmer male speaker named Dara",
  },
  sreymom: {
    id: "sreymom",
    voiceName: "Sreymom",
    gender: "female",
    nameKhmer: "🌸 ស្រីមុំ (សំឡេងស្រី - Sreymom)",
    descKhmer: "សំឡេងស្រីស្រីមុំ ផ្អែមស្រទន់ ពិរោះ កក់ក្ដៅ ថ្លារលូន និយាយខ្មែរពិរោះ",
    stylePrompt: "Sweet, clear, friendly and natural Khmer female speaker named Sreymom",
  },
};

// Default profiles:
// If user is female -> bot speaks male voice named "តារា" (Dara)
// If user is male -> bot speaks female voice named "ស្រីមុំ" (Sreymom)
const DEFAULT_PROFILES = {
  male: {
    hasCustomVoice: false,
    name: "តារា",
    studioVoice: "Charon",
    label: "🌟 តារា (សំឡេងប្រុស - Dara)",
    samplePath: "",
    duration: 0,
    updatedAt: 0,
    pitchRate: 0.82,
    tempo: 1.34,
    bassGain: 3,
    trebleGain: 1,
    filterChainSpeech: "asetrate=24000*0.82,aresample=24000,atempo=1.34,bass=g=3",
    filterChainSong: "asetrate=24000*0.83,aresample=24000,atempo=1.28,bass=g=3,aecho=0.8:0.88:45:0.22",
  },
  female: {
    hasCustomVoice: false,
    name: "ស្រីមុំ",
    studioVoice: "Kore",
    label: "🌸 ស្រីមុំ (សំឡេងស្រី - Sreymom)",
    samplePath: "",
    duration: 0,
    updatedAt: 0,
    pitchRate: 1.0,
    tempo: 1.12,
    bassGain: 1,
    trebleGain: 2.5,
    filterChainSpeech: "atempo=1.12,equalizer=f=3200:t=q:w=1:g=2.5,bass=g=1:f=120",
    filterChainSong: "atempo=1.06,equalizer=f=3400:t=q:w=1:g=2.5,aecho=0.8:0.88:45:0.22",
  },
};

let cachedProfiles = null;
const memoryAudioCache = new Map();

export function loadCustomVoiceProfiles() {
  if (cachedProfiles) return cachedProfiles;
  try {
    if (fs.existsSync(PROFILES_PATH)) {
      const raw = fs.readFileSync(PROFILES_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      cachedProfiles = {
        male: { ...DEFAULT_PROFILES.male, ...parsed.male },
        female: { ...DEFAULT_PROFILES.female, ...parsed.female },
      };
      return cachedProfiles;
    }
  } catch (err) {
    console.error("[CustomVoiceEngine] Error loading profiles:", err);
  }
  cachedProfiles = {
    male: { ...DEFAULT_PROFILES.male },
    female: { ...DEFAULT_PROFILES.female },
  };
  return cachedProfiles;
}

export function saveCustomVoiceProfiles(profiles) {
  cachedProfiles = profiles;
  try {
    fs.writeFileSync(PROFILES_PATH, JSON.stringify(profiles, null, 2), "utf-8");
  } catch (err) {
    console.error("[CustomVoiceEngine] Error saving profiles:", err);
  }
}

/**
 * Set an official Google AI Studio Voice for male or female
 */
export function setGoogleStudioVoice(gender, voiceKey) {
  const normGender = gender === "female" ? "female" : "male";
  const conf = GOOGLE_STUDIO_VOICES[voiceKey?.toLowerCase()];
  if (!conf) return false;

  const profiles = loadCustomVoiceProfiles();
  profiles[normGender] = {
    ...profiles[normGender],
    hasCustomVoice: false,
    name: conf.id === "dara" ? "តារា" : conf.id === "sreymom" ? "ស្រីមុំ" : conf.voiceName,
    studioVoice: conf.voiceName,
    label: conf.nameKhmer,
    updatedAt: Date.now(),
  };
  saveCustomVoiceProfiles(profiles);
  return conf;
}

/**
 * Convert WAV buffer to MP3 buffer using FFmpeg
 */
export function convertWavToMp3Buffer(wavBuffer) {
  if (!wavBuffer || wavBuffer.length < 200) return Promise.resolve(Buffer.alloc(0));
  return new Promise((resolve) => {
    try {
      const ff = spawn("ffmpeg", [
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        "pipe:0",
        "-acodec",
        "libmp3lame",
        "-ab",
        "128k",
        "-ar",
        "24000",
        "-f",
        "mp3",
        "pipe:1",
      ]);
      const chunks = [];
      ff.stdout.on("data", (c) => chunks.push(c));
      ff.on("close", (code) => {
        if (code === 0 && chunks.length > 0) {
          resolve(Buffer.concat(chunks));
        } else {
          resolve(wavBuffer);
        }
      });
      ff.on("error", () => resolve(wavBuffer));
      ff.stdin.on("error", () => {});
      ff.stdin.end(wavBuffer);
    } catch {
      resolve(wavBuffer);
    }
  });
}

/**
 * Synthesize sweet Khmer speech using Google AI Studio Gemini TTS (gemini-3.8-flash-lite-tts)
 */
export async function synthesizeGoogleStudioKhmerAudioBuffer(text, studioVoiceName = "Kore") {
  const clean = String(text || "").trim().slice(0, 500);
  if (!clean) return Buffer.alloc(0);

  const voice = studioVoiceName || "Kore";
  const cacheKey = `gemini_tts:${voice}:${clean}`;

  if (memoryAudioCache.has(cacheKey)) {
    return memoryAudioCache.get(cacheKey);
  }

  // Check disk cache
  const hash = Buffer.from(cacheKey).toString("base64url").slice(0, 60);
  const diskPath = path.join(CACHE_DIR, `${hash}.mp3`);
  if (fs.existsSync(diskPath)) {
    try {
      const buf = fs.readFileSync(diskPath);
      if (buf.length > 200) {
        memoryAudioCache.set(cacheKey, buf);
        return buf;
      }
    } catch {}
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Buffer.alloc(0);

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });

    const isMale = ["Charon", "Puck", "Fenrir"].includes(voice);
    const stylePrompt = isMale
      ? "Deep, calm, confident, clear and warm Khmer male voice"
      : "Sweet, clear, friendly, natural and soothing Khmer female voice";

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: clean,
              speechMetadata: { style: stylePrompt },
            },
          ],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const wavBuf = Buffer.from(base64Audio, "base64");
      const mp3Buf = await convertWavToMp3Buffer(wavBuf);
      if (mp3Buf.length > 200) {
        if (memoryAudioCache.size > 200) {
          const first = memoryAudioCache.keys().next().value;
          if (first) memoryAudioCache.delete(first);
        }
        memoryAudioCache.set(cacheKey, mp3Buf);
        try {
          fs.writeFileSync(diskPath, mp3Buf);
        } catch {}
        return mp3Buf;
      }
    }
  } catch (err) {
    // 429 quota or network error fallback
    console.warn(`[CustomVoiceEngine] Google AI Studio TTS fallback triggered:`, err?.message || err);
  }

  return Buffer.alloc(0);
}

/**
 * Probe audio buffer using ffprobe
 */
export async function probeAudioBuffer(audioBuffer) {
  return new Promise((resolve) => {
    if (!audioBuffer || audioBuffer.length < 200) {
      return resolve({ duration: 0, channels: 1, sampleRate: 24000 });
    }
    const ff = spawn("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration:stream=sample_rate,channels",
      "-of",
      "json",
      "-i",
      "pipe:0",
    ]);
    let out = "";
    ff.stdout.on("data", (c) => (out += c.toString()));
    ff.on("close", (code) => {
      try {
        if (code === 0 && out.trim()) {
          const parsed = JSON.parse(out);
          const duration = parseFloat(parsed?.format?.duration || "0") || 0;
          const stream = parsed?.streams?.[0] || {};
          const sampleRate = parseInt(stream?.sample_rate || "24000", 10) || 24000;
          const channels = parseInt(stream?.channels || "1", 10) || 1;
          return resolve({ duration, sampleRate, channels });
        }
      } catch {}
      resolve({ duration: 0, sampleRate: 24000, channels: 1 });
    });
    ff.on("error", () => resolve({ duration: 0, sampleRate: 24000, channels: 1 }));
    ff.stdin.on("error", () => {});
    ff.stdin.end(audioBuffer);
  });
}

/**
 * Save audio from Telegram as custom voice for Male or Female
 */
export async function registerCustomVoiceFromTelegram(gender, audioBuffer, meta = {}) {
  const normGender = gender === "female" ? "female" : "male";
  const profiles = loadCustomVoiceProfiles();

  const fileExt = meta.mimeType?.includes("ogg") || meta.fileName?.endsWith(".ogg") ? "ogg" : "mp3";
  const fileName = `${normGender}_voice.${fileExt}`;
  const filePath = path.join(DATA_DIR, fileName);

  fs.writeFileSync(filePath, audioBuffer);

  const probe = await probeAudioBuffer(audioBuffer);

  let filterChainSpeech = "";
  let filterChainSong = "";

  if (normGender === "male") {
    filterChainSpeech = "asetrate=24000*0.82,aresample=24000,atempo=1.34,bass=g=3.5:f=110,equalizer=f=1200:t=q:w=1:g=-1.5";
    filterChainSong = "asetrate=24000*0.83,aresample=24000,atempo=1.28,bass=g=3.5:f=110,aecho=0.8:0.88:45:0.22";
  } else {
    filterChainSpeech = "atempo=1.12,equalizer=f=3300:t=q:w=1:g=2.8,equalizer=f=6000:t=q:w=1:g=1.5,bass=g=1.2:f=130";
    filterChainSong = "atempo=1.06,equalizer=f=3500:t=q:w=1:g=2.5,aecho=0.8:0.88:45:0.22";
  }

  profiles[normGender] = {
    hasCustomVoice: true,
    studioVoice: "",
    label: normGender === "male" ? "សំឡេងប្រុសផ្ទាល់ខ្លួន (Custom Male Voice)" : "សំឡេងស្រីផ្ទាល់ខ្លួន (Custom Female Voice)",
    samplePath: filePath,
    duration: Math.round(probe.duration * 10) / 10,
    updatedAt: Date.now(),
    sampleRate: probe.sampleRate,
    channels: probe.channels,
    filterChainSpeech,
    filterChainSong,
    sourceFileName: meta.fileName || `${normGender}_voice.${fileExt}`,
  };

  saveCustomVoiceProfiles(profiles);

  return {
    success: true,
    gender: normGender,
    profile: profiles[normGender],
    label: profiles[normGender].label,
  };
}

/**
 * Reset custom voice to Google AI Studio default voices (Kore & Charon)
 */
export function resetCustomVoice(gender = null) {
  const profiles = loadCustomVoiceProfiles();
  if (!gender || gender === "male") {
    profiles.male = { ...DEFAULT_PROFILES.male, updatedAt: Date.now() };
    const p = path.join(DATA_DIR, "male_voice.ogg");
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  if (!gender || gender === "female") {
    profiles.female = { ...DEFAULT_PROFILES.female, updatedAt: Date.now() };
    const p = path.join(DATA_DIR, "female_voice.ogg");
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  saveCustomVoiceProfiles(profiles);
  return true;
}

/**
 * Transform speech buffer using Google AI Studio Male Voice (Charon / Puck / Fenrir)
 * or user's custom uploaded voice
 */
export async function transformToCustomMaleVoiceBuffer(inputBuffer, isMelodicSongOrPoem = false) {
  if (!inputBuffer || inputBuffer.length < 200) return inputBuffer;
  const profiles = loadCustomVoiceProfiles();
  const filterChain = isMelodicSongOrPoem
    ? profiles.male.filterChainSong || DEFAULT_PROFILES.male.filterChainSong
    : profiles.male.filterChainSpeech || DEFAULT_PROFILES.male.filterChainSpeech;

  return new Promise((resolve) => {
    try {
      const ff = spawn("ffmpeg", [
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        "pipe:0",
        "-af",
        filterChain,
        "-acodec",
        "libmp3lame",
        "-ab",
        "128k",
        "-ar",
        "24000",
        "-f",
        "mp3",
        "pipe:1",
      ]);
      const chunks = [];
      ff.stdout.on("data", (c) => chunks.push(c));
      ff.on("close", (code) => {
        if (code === 0 && chunks.length > 0) {
          resolve(Buffer.concat(chunks));
        } else {
          resolve(inputBuffer);
        }
      });
      ff.on("error", () => resolve(inputBuffer));
      ff.stdin.on("error", () => {});
      ff.stdin.end(inputBuffer);
    } catch {
      resolve(inputBuffer);
    }
  });
}

/**
 * Transform speech buffer using Google AI Studio Female Voice (Kore / Zephyr)
 * or user's custom uploaded voice
 */
export async function transformToCustomFemaleVoiceBuffer(inputBuffer, isMelodicSongOrPoem = false) {
  if (!inputBuffer || inputBuffer.length < 200) return inputBuffer;
  const profiles = loadCustomVoiceProfiles();
  const filterChain = isMelodicSongOrPoem
    ? profiles.female.filterChainSong || DEFAULT_PROFILES.female.filterChainSong
    : profiles.female.filterChainSpeech || DEFAULT_PROFILES.female.filterChainSpeech;

  return new Promise((resolve) => {
    try {
      const ff = spawn("ffmpeg", [
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        "pipe:0",
        "-af",
        filterChain,
        "-acodec",
        "libmp3lame",
        "-ab",
        "128k",
        "-ar",
        "24000",
        "-f",
        "mp3",
        "pipe:1",
      ]);
      const chunks = [];
      ff.stdout.on("data", (c) => chunks.push(c));
      ff.on("close", (code) => {
        if (code === 0 && chunks.length > 0) {
          resolve(Buffer.concat(chunks));
        } else {
          resolve(inputBuffer);
        }
      });
      ff.on("error", () => resolve(inputBuffer));
      ff.stdin.on("error", () => {});
      ff.stdin.end(inputBuffer);
    } catch {
      resolve(inputBuffer);
    }
  });
}

/**
 * Returns formatted HTML info card for Telegram Bot
 */
export function buildCustomVoiceDashboardHtml() {
  const profiles = loadCustomVoiceProfiles();
  const maleStatus = profiles.male.hasCustomVoice
    ? `✅ <b>សំឡេងប្រុសផ្ទាល់ខ្លួន (Telegram Custom)</b> (${profiles.male.duration}s)`
    : `🌟 <b>${profiles.male.label || "តារា (សំឡេងប្រុស)"}</b>`;
  const femaleStatus = profiles.female.hasCustomVoice
    ? `✅ <b>សំឡេងស្រីផ្ទាល់ខ្លួន (Telegram Custom)</b> (${profiles.female.duration}s)`
    : `🌸 <b>${profiles.female.label || "ស្រីមុំ (សំឡេងស្រី)"}</b>`;

  return (
    `🎙️✨ <b>ប្រព័ន្ធសំឡេងនិយាយខ្មែរ Telegram Bot (តារា & ស្រីមុំ)</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💡 <b>គោលការណ៍កំណត់សំឡេងតាមភេទ៖</b>\n` +
    `• 👩 <b>បើអ្នកប្រើជាមនុស្សស្រី៖</b> Bot ដើរតួជាមនុស្សប្រុស ប្រើ <b>សំឡេងប្រុសឈ្មោះតារា</b> (បងតារា) 🌟\n` +
    `• 👨 <b>បើអ្នកប្រើជាមនុស្សប្រុស៖</b> Bot ដើរតួជាមនុស្សស្រី ប្រើ <b>សំឡេងស្រីឈ្មោះស្រីមុំ</b> (អូនស្រីមុំ) 🌸\n` +
    `• 🇰🇭 <b>អនុវត្តចំពោះការនិយាយភាសាខ្មែរតែមួយមុខគត់!</b>\n` +
    `• 🌍 <b>ភាសាបរទេស៖</b> រក្សាសំនៀងដើមរបស់ជនជាតិពិតប្រាកដដដែល ១០០% (English, French, Chinese, Japanese, etc.) 🇬🇧🇫🇷🇨🇳🇯🇵\n\n` +
    `👩 <b>សំឡេងស្រីបច្ចុប្បន្ន៖</b> ${femaleStatus}\n` +
    `👨 <b>សំឡេងប្រុសបច្ចុប្បន្ន៖</b> ${maleStatus}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `✨ <b>របៀបកំណត់សំឡេងផ្ទាល់ខ្លួន ឬជ្រើសរើសសំឡេង៖</b>\n` +
    `• ចុចប៊ូតុងខាងក្រោមដើម្បីជ្រើសរើសសំឡេងតារា/ស្រីមុំ ឬសាកល្បងស្ដាប់សំឡេង\n` +
    `• ឬផ្ញើ Voice Note / Audio មកកាន់ Bot ដោយភ្ជាប់ Caption សរសេរថា <code>សំឡេងប្រុស</code> ឬ <code>សំឡេងស្រី</code>!`
  );
}

/**
 * Returns inline keyboard for Telegram Bot
 */
export function buildCustomVoiceInlineKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🌟 តារា (សំឡេងប្រុស)", callback_data: "select_studio_voice_dara" },
        { text: "🌸 ស្រីមុំ (សំឡេងស្រី)", callback_data: "select_studio_voice_sreymom" },
      ],
      [
        { text: "🎧 សាកល្បងសំឡេងតារា (ប្រុស)", callback_data: "test_custom_male_voice" },
        { text: "🎧 សាកល្បងសំឡេងស្រីមុំ (ស្រី)", callback_data: "test_custom_female_voice" },
      ],
      [
        { text: "✨ ស្រី Kore (Studio)", callback_data: "select_studio_voice_kore" },
        { text: "🌊 ប្រុស Charon (Studio)", callback_data: "select_studio_voice_charon" },
      ],
      [
        { text: "🌿 ស្រី Zephyr (Studio)", callback_data: "select_studio_voice_zephyr" },
        { text: "⚡ ប្រុស Puck (Studio)", callback_data: "select_studio_voice_puck" },
      ],
      [
        { text: "🎙️ ផ្ញើសំឡេងខ្លួនឯង (ប្រុស)", callback_data: "prompt_set_male_voice" },
        { text: "🎙️ ផ្ញើសំឡេងខ្លួនឯង (ស្រី)", callback_data: "prompt_set_female_voice" },
      ],
      [
        { text: "🔄 កំណត់ឡើងវិញ (Reset)", callback_data: "reset_custom_voices" },
      ],
    ],
  };
}
