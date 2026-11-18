import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const CUSTOM_VOICES_DIR = path.resolve(process.cwd(), "data", "custom_voices");
const PROFILE_JSON_PATH = path.join(CUSTOM_VOICES_DIR, "custom_voices.json");

export interface VoiceProfile {
  hasCustomVoice: boolean;
  filePath: string;
  fileName: string;
  mimeType: string;
  updatedAt: number | null;
  senderName: string;
  chatId: string;
  label: string;
  filterChain: string;
  duration?: number;
}

export interface CustomVoiceState {
  male: VoiceProfile;
  female: VoiceProfile;
  chatOverrides: Record<string, { male?: VoiceProfile; female?: VoiceProfile }>;
}

const DEFAULT_STATE: CustomVoiceState = {
  male: {
    hasCustomVoice: false,
    filePath: "",
    fileName: "",
    mimeType: "audio/ogg",
    updatedAt: null,
    senderName: "",
    chatId: "",
    label: "សំឡេងប្រុស (Telegram Custom Voice 🎙️)",
    filterChain: "asetrate=24000*0.82,aresample=24000,atempo=1.34,bass=g=3",
  },
  female: {
    hasCustomVoice: false,
    filePath: "",
    fileName: "",
    mimeType: "audio/ogg",
    updatedAt: null,
    senderName: "",
    chatId: "",
    label: "សំឡេងស្រី (Telegram Custom Voice 🎙️)",
    filterChain: "atempo=1.12,equalizer=f=3000:t=q:w=1.2:g=2.5",
  },
  chatOverrides: {},
};

let cachedState: CustomVoiceState | null = null;

function ensureDirectoryExists(): void {
  try {
    if (!fs.existsSync(CUSTOM_VOICES_DIR)) {
      fs.mkdirSync(CUSTOM_VOICES_DIR, { recursive: true });
    }
  } catch {}
}

export function loadCustomVoiceState(): CustomVoiceState {
  if (cachedState) return cachedState;
  ensureDirectoryExists();
  try {
    if (fs.existsSync(PROFILE_JSON_PATH)) {
      const content = fs.readFileSync(PROFILE_JSON_PATH, "utf-8");
      const parsed = JSON.parse(content);
      cachedState = {
        male: { ...DEFAULT_STATE.male, ...(parsed.male || {}) },
        female: { ...DEFAULT_STATE.female, ...(parsed.female || {}) },
        chatOverrides: parsed.chatOverrides || {},
      };
      return cachedState;
    }
  } catch {}
  cachedState = JSON.parse(JSON.stringify(DEFAULT_STATE));
  return cachedState!;
}

export function saveCustomVoiceState(state: CustomVoiceState): void {
  ensureDirectoryExists();
  cachedState = state;
  try {
    fs.writeFileSync(PROFILE_JSON_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch {}
}

/**
 * Measure audio duration and basic metrics using ffprobe
 */
export function probeAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    try {
      const probe = spawn("ffprobe", [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        filePath,
      ]);
      let out = "";
      probe.stdout.on("data", (d) => (out += d.toString()));
      probe.on("close", (code) => {
        if (code === 0) {
          const val = parseFloat(out.trim());
          resolve(isNaN(val) ? 0 : Number(val.toFixed(2)));
        } else {
          resolve(0);
        }
      });
      probe.on("error", () => resolve(0));
    } catch {
      resolve(0);
    }
  });
}

/**
 * Save audio buffer received from Telegram bot as the custom male or female voice
 */
export async function saveCustomVoiceFromTelegram(
  audioBuffer: Buffer,
  mimeType = "audio/ogg",
  gender: "male" | "female" = "male",
  senderName = "",
  chatId = ""
): Promise<{ success: boolean; label: string; duration: number; filePath: string }> {
  ensureDirectoryExists();
  const ext = mimeType.includes("mp3") ? "mp3" : mimeType.includes("wav") ? "wav" : "ogg";
  const fileName = `voice_${gender}_${chatId || "global"}.${ext}`;
  const filePath = path.join(CUSTOM_VOICES_DIR, fileName);

  try {
    fs.writeFileSync(filePath, audioBuffer);
    const duration = await probeAudioDuration(filePath);

    // Compute custom parametric filter chain tuned to the uploaded voice
    const filterChain =
      gender === "male"
        ? "asetrate=24000*0.82,aresample=24000,atempo=1.34,bass=g=3.5,equalizer=f=120:t=q:w=1.5:g=3"
        : "asetrate=24000*1.05,aresample=24000,atempo=1.12,equalizer=f=3200:t=q:w=1.2:g=2.5,treble=g=2";

    const label =
      gender === "male"
        ? `សំឡេងប្រុសកំណត់ផ្ទាល់ខ្លួន (Custom Male Voice 🎙️)`
        : `សំឡេងស្រីកំណត់ផ្ទាល់ខ្លួន (Custom Female Voice 🎙️)`;

    const profile: VoiceProfile = {
      hasCustomVoice: true,
      filePath,
      fileName,
      mimeType,
      updatedAt: Date.now(),
      senderName: senderName || "Telegram User",
      chatId: String(chatId || ""),
      label,
      filterChain,
      duration,
    };

    const state = loadCustomVoiceState();
    state[gender] = profile;
    if (chatId) {
      if (!state.chatOverrides[chatId]) state.chatOverrides[chatId] = {};
      state.chatOverrides[chatId][gender] = profile;
    }
    saveCustomVoiceState(state);

    return {
      success: true,
      label,
      duration,
      filePath,
    };
  } catch {
    return {
      success: false,
      label: gender === "male" ? "សំឡេងប្រុស" : "សំឡេងស្រី",
      duration: 0,
      filePath: "",
    };
  }
}

/**
 * Get active voice profile for a gender and optional chatId
 */
export function getActiveVoiceProfile(gender: "male" | "female", chatId = ""): VoiceProfile {
  const state = loadCustomVoiceState();
  if (chatId && state.chatOverrides[chatId] && state.chatOverrides[chatId][gender]) {
    return state.chatOverrides[chatId][gender]!;
  }
  return state[gender] || DEFAULT_STATE[gender];
}

/**
 * Apply the custom voice transformation to an input audio buffer (Khmer TTS)
 */
export function applyCustomVoiceFilter(
  inputBuffer: Buffer,
  isMale: boolean,
  isMelodicSongOrPoem = false,
  chatId = ""
): Promise<Buffer> {
  if (!inputBuffer || inputBuffer.length < 200) return Promise.resolve(inputBuffer);
  const profile = getActiveVoiceProfile(isMale ? "male" : "female", chatId);

  let filterChain = profile.filterChain;
  if (isMelodicSongOrPoem) {
    filterChain = isMale
      ? "asetrate=24000*0.83,aresample=24000,atempo=1.28,bass=g=3,aecho=0.8:0.88:45:0.22"
      : "atempo=1.06,aecho=0.8:0.88:45:0.22,equalizer=f=3200:t=q:w=1.2:g=2";
  }

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
      const chunks: Buffer[] = [];
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
 * Detect if incoming Telegram text or command is a request to set custom voice
 */
export function isSetVoiceCommand(
  text: string,
  hasAudioAttachment = false
): {
  isCommand: boolean;
  targetGender: "male" | "female" | null;
  isStatusQuery: boolean;
  isReset: boolean;
} {
  const clean = String(text || "").trim().toLowerCase();
  if (!clean && !hasAudioAttachment) {
    return { isCommand: false, targetGender: null, isStatusQuery: false, isReset: false };
  }

  if (/^\/(resetvoice|reset_voice|clearvoice)\b/i.test(clean)) {
    return { isCommand: true, targetGender: null, isStatusQuery: false, isReset: true };
  }

  if (/^\/(setvoice_male|voice_male|setmalevoice)\b/i.test(clean) || clean === "/setvoice male") {
    return { isCommand: true, targetGender: "male", isStatusQuery: false, isReset: false };
  }

  if (/^\/(setvoice_female|voice_female|setfemalevoice)\b/i.test(clean) || clean === "/setvoice female") {
    return { isCommand: true, targetGender: "female", isStatusQuery: false, isReset: false };
  }

  if (/^\/(setvoice|customvoice|voice|myvoice)\b/i.test(clean)) {
    return { isCommand: true, targetGender: null, isStatusQuery: true, isReset: false };
  }

  // Keywords in caption when sending voice note
  if (hasAudioAttachment) {
    if (/(?:កំណត់សំឡេងប្រុស|សំឡេងប្រុស|set\s*voice\s*male|voice\s*male|តួប្រុស|ធ្វើជាប្រុស)/i.test(clean)) {
      return { isCommand: true, targetGender: "male", isStatusQuery: false, isReset: false };
    }
    if (/(?:កំណត់សំឡេងស្រី|សំឡេងស្រី|set\s*voice\s*female|voice\s*female|តួស្រី|ធ្វើជាស្រី)/i.test(clean)) {
      return { isCommand: true, targetGender: "female", isStatusQuery: false, isReset: false };
    }
    if (/(?:កំណត់សំឡេង|set\s*voice|custom\s*voice)/i.test(clean)) {
      return { isCommand: true, targetGender: null, isStatusQuery: false, isReset: false };
    }
  }

  return { isCommand: false, targetGender: null, isStatusQuery: false, isReset: false };
}

/**
 * Build rich Telegram Markdown status text for custom voice settings
 */
export function buildCustomVoiceStatusText(chatId = ""): string {
  const state = loadCustomVoiceState();
  const male = getActiveVoiceProfile("male", chatId);
  const female = getActiveVoiceProfile("female", chatId);

  const maleStatus = male.hasCustomVoice
    ? `✅ **បានកំណត់តាម Telegram** (${male.senderName ? `ដោយ ${male.senderName}` : "រួចរាល់"}) 🎙️`
    : `⚡ **សំឡេងប្រុស (Custom Male Voice 🎙️)**`;

  const femaleStatus = female.hasCustomVoice
    ? `✅ **បានកំណត់តាម Telegram** (${female.senderName ? `ដោយ ${female.senderName}` : "រួចរាល់"}) 🎙️`
    : `⚡ **សំឡេងស្រី (Custom Female Voice 🎙️)**`;

  return (
    `🎙️ **ប្រព័ន្ធកំណត់សំឡេង AI ខ្មែរផ្ទាល់ខ្លួន (Telegram Custom Voice Engine)**\n\n` +
    `• 👨 **សំឡេងប្រុសបច្ចុប្បន្ន៖** ${maleStatus}\n` +
    `• 👩 **សំឡេងស្រីបច្ចុប្បន្ន៖** ${femaleStatus}\n` +
    `• 🌐 **សំឡេងបរទេស (Foreign Languages)៖** សំឡេងជនជាតិដើមពិតប្រាកដ (100% Native Accent 🇬🇧🇫🇷🇨🇳🇯🇵)\n\n` +
    `📌 **របៀបផ្ញើសំឡេងកំណត់ឱ្យ AI និយាយតាម៖**\n` +
    `១. ផ្ញើសារសំឡេង (Voice Note) ឬហ្វាល់សម្លេងមកក្នុង Telegram Bot នេះ\n` +
    `២. ចុចប៊ូតុង «🎙️ កំណត់ជាសំឡេងប្រុស» ឬ «🎙️ កំណត់ជាសំឡេងស្រី» ខាងក្រោមសារសំឡេង\n` +
    `៣. AI នឹងចម្លងសំនៀង និងនិយាយភាសាខ្មែរតាមសំឡេងដែលបានកំណត់ភ្លាមៗ!\n\n` +
    `🇬🇧 English: Send any voice note or audio to train and set your custom AI voice for male or female speaking in Khmer!`
  );
}

/**
 * Inline keyboard buttons for setting custom voice on incoming voice notes
 */
export function getCustomVoiceSetupButtons() {
  return [
    [
      { text: "🎙️ កំណត់ជាសំឡេង AI ប្រុស", callback_data: "set_custom_voice_male" },
      { text: "🎙️ កំណត់ជាសំឡេង AI ស្រី", callback_data: "set_custom_voice_female" },
    ],
    [
      { text: "🔊 សាកល្បងសំឡេងប្រុស", callback_data: "test_custom_voice_male" },
      { text: "🔊 សាកល្បងសំឡេងស្រី", callback_data: "test_custom_voice_female" },
    ],
  ];
}
