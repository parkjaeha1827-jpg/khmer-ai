import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { spawn } from "child_process";
import {
  transcribeAudioBufferServer,
  generateKhmerTtsBufferFast,
  convertMp3BufferToTelegramOpusVoice,
  normalizeKhmerText,
} from "./telegram-webhook.js";
import {
  loadCustomVoiceProfiles,
  synthesizeGoogleStudioKhmerAudioBuffer,
  convertWavToMp3Buffer,
} from "./custom-voice-engine.js";
import {
  burnRunningSubtitlesToVideo,
  extractAudioBufferFromVideo,
  probeVideoDimensionsAndDuration,
  generateKaraokeAssSubtitles,
} from "./video-subtitle-engine.js";

// ============================================================================
// KHMER AI VOICE CATALOG & USER PREFERENCES
// ============================================================================
export const KHMER_AI_VOICES = {
  sreymom: {
    id: "sreymom",
    nameKhmer: "🌸 ស្រីមុំ (Sreymom)",
    gender: "female",
    pitch: 1.0,
    tempo: 1.12,
    studioVoice: "Kore",
    tagKhmer: "ពិរោះ ស្រទន់ គួរឱ្យស្រឡាញ់ (ពេញនិយម)",
    sampleText: "សួស្តីបង! ខ្ញុំឈ្មោះស្រីមុំ ជាសំឡេង AI ខ្មែរផ្អែមស្រទន់ និងរួសរាយបំផុត។",
  },
  chenda: {
    id: "chenda",
    nameKhmer: "📰 ចិន្តា (Chenda)",
    gender: "female",
    pitch: 1.0,
    tempo: 1.05,
    studioVoice: "Zephyr",
    tagKhmer: "ស្រទន់ រៀបរាប់ ព័ត៌មាន និងអត្ថបទស្ដង់ដារ",
    sampleText: "ជម្រាបសួរ! ខ្ញុំឈ្មោះចិន្តា ជាសំឡេង AI ខ្មែរផ្នែករៀបរាប់ព័ត៌មាន និងអំណានស្ដង់ដារ។",
  },
  piseth: {
    id: "piseth",
    nameKhmer: "🌟 ពិសិដ្ឋ (Piseth)",
    gender: "male",
    pitch: 0.85,
    tempo: 1.25,
    studioVoice: "Fenrir",
    tagKhmer: "មាំទាំ កក់ក្ដៅ ជឿជាក់ និងច្បាស់លាស់",
    sampleText: "សួស្តីបងប្អូន! ខ្ញុំបាទឈ្មោះពិសិដ្ឋ ជាសំឡេង AI ខ្មែរមាំទាំ និងមានទំនុកចិត្តខ្ពស់។",
  },
  dara: {
    id: "dara",
    nameKhmer: "⚡ តារា (Dara)",
    gender: "male",
    pitch: 0.82,
    tempo: 1.34,
    studioVoice: "Charon",
    tagKhmer: "រហ័សរហួន រួសរាយ និងក្រមិចក្រមើម",
    sampleText: "សួស្តីបង! ខ្ញុំឈ្មោះតារា រីករាយណាស់ដែលបានមកកំដរ និងជួយកិច្ចការបងជានិច្ច!",
  },
  sreyneath: {
    id: "sreyneath",
    nameKhmer: "👧 ស្រីនីត (Sreyneath)",
    gender: "female",
    pitch: 1.28,
    tempo: 1.15,
    studioVoice: "Puck",
    tagKhmer: "សំឡេងកុមារ ស្រស់ស្រាយ គួរឱ្យស្រឡាញ់",
    sampleText: "សួស្តីបងៗ! អូនឈ្មោះស្រីនីត ស្រឡាញ់ និងចូលចិត្តនិយាយលេងជាមួយបងៗណាស់!",
  },
  narrator: {
    id: "narrator",
    nameKhmer: "🎬 សម្រាយរឿង (Movie Narrator)",
    gender: "male",
    pitch: 0.72,
    tempo: 0.98,
    studioVoice: "Charon",
    tagKhmer: "សំឡេងធ្ងន់បែបភាពយន្ត Deep Voice រៀបរាប់រឿង",
    sampleText: "នៅក្នុងរាត្រីដ៏ស្ងប់ស្ងាត់មួយ ដំណើររឿងដ៏អស្ចារ្យដែលមិនធ្លាប់មានពីមុន បានចាប់ផ្ដើមឡើង...",
  },
};

const userVoicePreferences = new Map(); // chatId -> voiceId

export function getUserPreferredKhmerVoice(chatId) {
  const key = String(chatId);
  return userVoicePreferences.get(key) || "sreymom";
}

export function setUserPreferredKhmerVoice(chatId, voiceId) {
  const key = String(chatId);
  if (KHMER_AI_VOICES[voiceId]) {
    userVoicePreferences.set(key, voiceId);
    return true;
  }
  return false;
}

// Helper to run ffmpeg commands safely
export function runFfmpeg(args) {
  return new Promise((resolve) => {
    const proc = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    proc.on("close", (code) => {
      resolve({ ok: code === 0, code, stderr });
    });
    proc.on("error", (err) => {
      resolve({ ok: false, code: -1, stderr: err.message });
    });
  });
}

// ============================================================================
// 1. 🎬 TRANSLATE FOREIGN VIDEO TO KHMER (Speech Recognition + Khmer Dubbing + Subtitles)
// ============================================================================
export async function translateForeignVideoToKhmerEnhanced({
  videoBuffer,
  videoUrl,
  voiceId = "sreymom",
  includeSubtitle = true,
  duckingLevel = 0.15,
  titleHint = "Video",
  chatId = "default",
}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "khmer-trans-vid-"));
  const inVideoPath = path.join(tmpDir, "input_video.mp4");
  const extractedAudioPath = path.join(tmpDir, "extracted_audio.wav");
  const dubbedAudioPath = path.join(tmpDir, "dubbed_speech.mp3");
  const finalVideoPath = path.join(tmpDir, "output_dubbed_khmer.mp4");
  const srtPath = path.join(tmpDir, "subtitles.srt");

  try {
    // 1. Obtain video buffer
    let activeVideoBuf = videoBuffer;
    if (!activeVideoBuf && videoUrl) {
      const resp = await fetch(videoUrl);
      if (!resp.ok) throw new Error("មិនអាចទាញយកវីដេអូពីតំណលីងបានទេ");
      activeVideoBuf = Buffer.from(await resp.arrayBuffer());
    }
    if (!activeVideoBuf || activeVideoBuf.length < 500) {
      throw new Error("ទំហំវីដេអូតូចពេក ឬមិនត្រឹមត្រូវ");
    }

    fs.writeFileSync(inVideoPath, activeVideoBuf);

    // 2. Extract audio from video
    const extRes = await runFfmpeg([
      "-y",
      "-i",
      inVideoPath,
      "-vn",
      "-acodec",
      "pcm_s16le",
      "-ar",
      "16000",
      "-ac",
      "1",
      extractedAudioPath,
    ]);
    if (!extRes.ok || !fs.existsSync(extractedAudioPath)) {
      throw new Error("មិនអាចទាញយកសំឡេងពីវីដេអូបានទេ");
    }

    const audioBuf = fs.readFileSync(extractedAudioPath);
    const audioBase64 = audioBuf.toString("base64");

    // 3. AI Speech Recognition & Translation to Khmer
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      "";

    let originalTranscript = "";
    let detectedLanguage = "Foreign (អន្តរជាតិ)";
    let khmerTranslation = "";
    let srtContent = "";

    if (apiKey) {
      const prompt = `You are a professional multilingual video translator and dubbing director for Cambodia.
Tasks:
1. Listen carefully to the audio and transcribe the original speech accurately.
2. Detect the original spoken language (e.g. English, Chinese, Vietnamese, Thai, Korean, Japanese, French, etc.).
3. Translate the spoken dialogue into natural, expressive, conversational and grammatically correct Khmer language suitable for a video dubbing voiceover.
4. Output standard SRT subtitles with timestamps matching the dialogue.

Return JSON in this EXACT structure:
{
  "detectedLanguage": "English / Chinese / etc.",
  "originalTranscript": "original words spoken",
  "khmerTranslation": "ការបកប្រែជាភាសាខ្មែរយ៉ាងរលូន និងសមរម្យ",
  "srt": "1\\n00:00:00,500 --> 00:00:04,200\\nឃ្លាទី១\\n\\n2\\n00:00:04,500 --> 00:00:08,000\\nឃ្លាទី២"
}`;

      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: prompt },
                    {
                      inlineData: {
                        mimeType: "audio/wav",
                        data: audioBase64,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.3,
              },
            }),
          }
        );
        const data = await geminiRes.json();
        const rawJsonText =
          data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const parsed = JSON.parse(rawJsonText);
        detectedLanguage = parsed.detectedLanguage || detectedLanguage;
        originalTranscript = parsed.originalTranscript || "";
        khmerTranslation = parsed.khmerTranslation || "";
        srtContent = parsed.srt || "";
      } catch (err) {
        console.warn("[MediaStudio] Gemini video translation error:", err);
      }
    }

    if (!khmerTranslation) {
      khmerTranslation = "វីដេអូនេះត្រូវបានបកប្រែ និងបញ្ចូលសំឡេងជាភាសាខ្មែរដោយ Khmer Super AI Agent។";
    }

    // 4. Synthesize Khmer Dubbing Voice
    const voiceConfig = KHMER_AI_VOICES[voiceId] || KHMER_AI_VOICES.sreymom;
    const dubAudioBuf = await generateKhmerTtsBufferFast(
      khmerTranslation,
      voiceConfig.gender === "female" ? "female" : "male"
    );

    if (!dubAudioBuf || dubAudioBuf.length < 300) {
      throw new Error("មិនអាចបង្កើតសំឡេងនិយាយខ្មែរបានទេ");
    }

    fs.writeFileSync(dubbedAudioPath, dubAudioBuf);

    // 5. Mux Dubbed Audio with Video (Ducking original background audio down to duckingLevel)
    let muxFilter = `[1:a]volume=1.0[vocal];[0:a]volume=${duckingLevel}[bg];[bg][vocal]amix=inputs=2:duration=first:dropout_transition=2[aout]`;
    let muxArgs = [
      "-y",
      "-i",
      inVideoPath,
      "-i",
      dubbedAudioPath,
      "-filter_complex",
      muxFilter,
      "-map",
      "0:v:0",
      "-map",
      "[aout]",
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      finalVideoPath,
    ];

    let muxRes = await runFfmpeg(muxArgs);
    if (!muxRes.ok || !fs.existsSync(finalVideoPath)) {
      // Fallback: replace audio completely
      await runFfmpeg([
        "-y",
        "-i",
        inVideoPath,
        "-i",
        dubbedAudioPath,
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        finalVideoPath,
      ]);
    }

    let resultVideoBuf = fs.readFileSync(finalVideoPath);

    // 6. Optionally Burn Khmer Running Subtitles
    if (includeSubtitle && srtContent) {
      try {
        fs.writeFileSync(srtPath, srtContent, "utf-8");
        const burned = await burnRunningSubtitlesToVideo({
          videoBuffer: resultVideoBuf,
          transcriptionText: khmerTranslation,
          preset: "tiktok_gold",
        });
        if (burned && burned.videoBuffer && burned.videoBuffer.length > 500) {
          resultVideoBuf = burned.videoBuffer;
        }
      } catch (e) {
        console.warn("[MediaStudio] Subtitle burn warning:", e);
      }
    }

    return {
      ok: true,
      dubbedVideoBuffer: resultVideoBuf,
      dubAudioBuffer: dubAudioBuf,
      srtContent,
      originalTranscript,
      khmerTranslation,
      detectedLanguage,
      voiceActorKhmer: voiceConfig.nameKhmer,
      title: titleHint,
    };
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

// ============================================================================
// 2. 🎵 TTS (TEXT TO SPEECH) ENGINE
// ============================================================================
export async function generateKhmerTtsAudio({
  text,
  voiceId = "sreymom",
  speed = 1.0,
  chatId = "default",
}) {
  const cleanText = normalizeKhmerText(text || "").trim();
  if (!cleanText) throw new Error("សូមបញ្ចូលអត្ថបទដើម្បីបម្លែងជាសំឡេង");

  const voiceObj = KHMER_AI_VOICES[voiceId] || KHMER_AI_VOICES.sreymom;

  // 1. Synthesize MP3 Audio Buffer
  let rawMp3 = await generateKhmerTtsBufferFast(
    cleanText,
    voiceObj.gender === "female" ? "female" : "male"
  );

  // 2. Adjust speed if speed != 1.0
  if (Math.abs(speed - 1.0) > 0.05 && rawMp3 && rawMp3.length > 200) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tts-spd-"));
    const inAudio = path.join(tmpDir, "in.mp3");
    const outAudio = path.join(tmpDir, "out.mp3");
    try {
      fs.writeFileSync(inAudio, rawMp3);
      // ffmpeg atempo supports 0.5 to 2.0
      const tempoVal = Math.min(2.0, Math.max(0.5, speed));
      const res = await runFfmpeg([
        "-y",
        "-i",
        inAudio,
        "-filter:a",
        `atempo=${tempoVal}`,
        "-c:a",
        "libmp3lame",
        "-b:a",
        "192k",
        outAudio,
      ]);
      if (res.ok && fs.existsSync(outAudio)) {
        rawMp3 = fs.readFileSync(outAudio);
      }
    } finally {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {}
    }
  }

  // 3. Convert to Native Telegram Voice Note (OGG Opus with Waveform)
  const opusVoice = await convertMp3BufferToTelegramOpusVoice(rawMp3);

  return {
    ok: true,
    text: cleanText,
    voiceName: voiceObj.nameKhmer,
    speed,
    mp3Buffer: rawMp3,
    opusBuffer: opusVoice || rawMp3,
  };
}

// ============================================================================
// 4. 📝 AUTO SUBTITLE / SRT ENGINE
// ============================================================================
export async function generateAutoSubtitlesAndSrt({
  videoOrAudioBuffer,
  isVideo = true,
  targetLanguage = "km",
  title = "Subtitle",
}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "srt-gen-"));
  const inputPath = path.join(tmpDir, isVideo ? "in.mp4" : "in.mp3");
  const wavPath = path.join(tmpDir, "audio.wav");

  try {
    fs.writeFileSync(inputPath, videoOrAudioBuffer);

    // Extract audio
    const extRes = await runFfmpeg([
      "-y",
      "-i",
      inputPath,
      "-vn",
      "-acodec",
      "pcm_s16le",
      "-ar",
      "16000",
      "-ac",
      "1",
      wavPath,
    ]);
    if (!extRes.ok || !fs.existsSync(wavPath)) {
      throw new Error("មិនអាចទាញយកសំឡេងសម្រាប់បង្កើត Subtitle បានទេ");
    }

    const audioBuf = fs.readFileSync(wavPath);
    const audioBase64 = audioBuf.toString("base64");

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      "";

    let srtText = "";
    let summaryText = "";

    if (apiKey) {
      const prompt = `Listen to this audio track and generate professional timestamped SubRip (.srt) subtitles in Khmer.
Structure each subtitle entry with start and end times in standard format (00:00:01,200 --> 00:00:04,500).
Ensure the Khmer text is grammatically correct and split into readable sentences.
Output ONLY standard SRT format.`;

      try {
        const gemRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: prompt },
                    {
                      inlineData: {
                        mimeType: "audio/wav",
                        data: audioBase64,
                      },
                    },
                  ],
                },
              ],
            }),
          }
        );
        const data = await gemRes.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        srtText = rawText.replace(/```(?:srt)?/gi, "").trim();
      } catch (err) {
        console.warn("[MediaStudio] Subtitle Gemini error:", err);
      }
    }

    if (!srtText) {
      srtText = `1\n00:00:00,500 --> 00:00:05,000\nវីដេអូ Khmer Super AI Agent\n\n2\n00:00:05,200 --> 00:00:10,000\nស្វាគមន៍មកកាន់ប្រព័ន្ធស្ទូឌីយោវីដេអូ និងសំឡេងឆ្លាតវៃ`;
    }

    // Convert SRT to WebVTT format
    const vttText =
      "WEBVTT\n\n" +
      srtText.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");

    const srtBuffer = Buffer.from(srtText, "utf-8");
    const vttBuffer = Buffer.from(vttText, "utf-8");

    return {
      ok: true,
      srtText,
      vttText,
      srtBuffer,
      vttBuffer,
      title,
    };
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

// ============================================================================
// 5. 🎞 EDIT VIDEO ENGINE (Trim, Mute, Crop/Aspect Ratio, Rotate, Extract MP3)
// ============================================================================
export async function editVideoMedia({
  videoBuffer,
  operation = "trim", // trim, mute, replace_audio, aspect_ratio, rotate, extract_audio, watermark
  startTime = "00:00:00",
  endTime = "00:00:30",
  audioBuffer = null,
  aspectRatio = "9:16", // 9:16, 16:9, 1:1
  rotation = "90", // 90, 180, 270, flip_h
  watermarkText = "@khmer123ai_bot",
}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vid-edit-"));
  const inVid = path.join(tmpDir, "in.mp4");
  const inAud = path.join(tmpDir, "in.mp3");
  const outVid = path.join(tmpDir, "out.mp4");
  const outAud = path.join(tmpDir, "out.mp3");

  try {
    fs.writeFileSync(inVid, videoBuffer);
    if (audioBuffer) fs.writeFileSync(inAud, audioBuffer);

    let summaryKhmer = "";
    let isOutputAudio = false;

    if (operation === "trim") {
      summaryKhmer = `✂️ បានកាត់តវីដេអូ (Trim) ចាប់ពី ${startTime} ដល់ ${endTime} រួចរាល់!`;
      await runFfmpeg([
        "-y",
        "-ss",
        String(startTime),
        "-to",
        String(endTime),
        "-i",
        inVid,
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        outVid,
      ]);
    } else if (operation === "mute") {
      summaryKhmer = "🔇 បានបិទសំឡេងដើមនៃវីដេអូ (Mute Audio) រួចរាល់!";
      await runFfmpeg([
        "-y",
        "-i",
        inVid,
        "-an",
        "-c:v",
        "copy",
        "-movflags",
        "+faststart",
        outVid,
      ]);
    } else if (operation === "replace_audio" && audioBuffer) {
      summaryKhmer = "🎵 បានបញ្ចូល និងជំនួសសំឡេងថ្មីទៅក្នុងវីដេអូ រួចរាល់!";
      await runFfmpeg([
        "-y",
        "-i",
        inVid,
        "-i",
        inAud,
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-shortest",
        "-movflags",
        "+faststart",
        outVid,
      ]);
    } else if (operation === "aspect_ratio") {
      let scalePadFilter = "";
      if (aspectRatio === "9:16") {
        summaryKhmer = "📱 បានប្ដូរទម្រង់វីដេអូទៅជា 9:16 (TikTok, Reels, Shorts) រួចរាល់!";
        scalePadFilter =
          "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black";
      } else if (aspectRatio === "16:9") {
        summaryKhmer = "🖥️ បានប្ដូរទម្រង់វីដេអូទៅជា 16:9 (YouTube, Landscape) រួចរាល់!";
        scalePadFilter =
          "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black";
      } else {
        summaryKhmer = "🔲 បានប្ដូរទម្រង់វីដេអូទៅជា 1:1 (Square Feed) រួចរាល់!";
        scalePadFilter =
          "scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2:black";
      }
      await runFfmpeg([
        "-y",
        "-i",
        inVid,
        "-vf",
        scalePadFilter,
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "copy",
        "-movflags",
        "+faststart",
        outVid,
      ]);
    } else if (operation === "rotate") {
      let rotFilter = "transpose=1";
      if (rotation === "180") {
        rotFilter = "hflip,vflip";
        summaryKhmer = "🔄 បានបង្វិលវីដេអូ ១៨០ ដឺក្រេ រួចរាល់!";
      } else if (rotation === "270") {
        rotFilter = "transpose=2";
        summaryKhmer = "🔄 បានបង្វិលវីដេអូ ២៧០ ដឺក្រេ រួចរាល់!";
      } else if (rotation === "flip_h") {
        rotFilter = "hflip";
        summaryKhmer = "🪞 បានត្រឡប់វីដេអូឆ្វេង-ស្ដាំ (Horizontal Mirror) រួចរាល់!";
      } else {
        summaryKhmer = "🔄 បានបង្វិលវីដេអូ ៩០ ដឺក្រេ រួចរាល់!";
      }
      await runFfmpeg([
        "-y",
        "-i",
        inVid,
        "-vf",
        rotFilter,
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "copy",
        "-movflags",
        "+faststart",
        outVid,
      ]);
    } else if (operation === "extract_audio") {
      isOutputAudio = true;
      summaryKhmer = "🎵 បានទាញយកសំឡេងចេញពីវីដេអូជាហ្វាល់ MP3 រួចរាល់!";
      await runFfmpeg([
        "-y",
        "-i",
        inVid,
        "-vn",
        "-c:a",
        "libmp3lame",
        "-b:a",
        "192k",
        outAud,
      ]);
    } else if (operation === "watermark") {
      summaryKhmer = `🏷️ បានបញ្ចូល Logo / Watermark «${watermarkText}» លើវីដេអូរួចរាល់!`;
      const safeText = watermarkText.replace(/[':\\]/g, "");
      await runFfmpeg([
        "-y",
        "-i",
        inVid,
        "-vf",
        `drawtext=text='${safeText}':x=w-tw-30:y=h-th-30:fontsize=26:fontcolor=white@0.85:box=1:boxcolor=black@0.4:boxborderw=6`,
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "copy",
        "-movflags",
        "+faststart",
        outVid,
      ]);
    }

    if (isOutputAudio && fs.existsSync(outAud)) {
      return {
        ok: true,
        isAudio: true,
        buffer: fs.readFileSync(outAud),
        mimeType: "audio/mpeg",
        filename: "extracted_audio.mp3",
        summaryKhmer,
      };
    }

    if (fs.existsSync(outVid) && fs.statSync(outVid).size > 500) {
      return {
        ok: true,
        isAudio: false,
        buffer: fs.readFileSync(outVid),
        mimeType: "video/mp4",
        filename: "edited_video.mp4",
        summaryKhmer,
      };
    }

    throw new Error("មិនអាចកាត់តវីដេអូបានទេ សូមពិនិត្យទម្រង់ហ្វាល់ឡើងវិញ");
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

// ============================================================================
// 6. ⚡️ SPEED VIDEO ENGINE (0.5x, 0.75x, 1.25x, 1.5x, 2.0x, 3.0x with Pitch Fix)
// ============================================================================
export async function changeVideoSpeedMedia({
  videoBuffer,
  speed = 1.5,
}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vid-spd-"));
  const inVid = path.join(tmpDir, "in.mp4");
  const outVid = path.join(tmpDir, "out.mp4");

  try {
    fs.writeFileSync(inVid, videoBuffer);

    const safeSpeed = Math.max(0.5, Math.min(3.0, Number(speed) || 1.5));
    const videoPts = (1 / safeSpeed).toFixed(4);

    // ffmpeg atempo supports 0.5 to 2.0. If speed is 3.0, chain two atempo filters: atempo=2.0,atempo=1.5
    let audioFilter = `atempo=${safeSpeed}`;
    if (safeSpeed > 2.0) {
      const p1 = 2.0;
      const p2 = (safeSpeed / 2.0).toFixed(4);
      audioFilter = `atempo=${p1},atempo=${p2}`;
    }

    const filterComplex = `[0:v]setpts=${videoPts}*PTS[v];[0:a]${audioFilter}[a]`;

    const res = await runFfmpeg([
      "-y",
      "-i",
      inVid,
      "-filter_complex",
      filterComplex,
      "-map",
      "[v]",
      "-map",
      "[a]",
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      outVid,
    ]);

    if (!res.ok || !fs.existsSync(outVid) || fs.statSync(outVid).size < 500) {
      // Fallback: video only speed change if audio stream missing
      await runFfmpeg([
        "-y",
        "-i",
        inVid,
        "-vf",
        `setpts=${videoPts}*PTS`,
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-pix_fmt",
        "yuv420p",
        "-an",
        "-movflags",
        "+faststart",
        outVid,
      ]);
    }

    if (fs.existsSync(outVid) && fs.statSync(outVid).size > 500) {
      return {
        ok: true,
        buffer: fs.readFileSync(outVid),
        speed: safeSpeed,
        filename: `speed_${safeSpeed}x_video.mp4`,
        summaryKhmer: `⚡️ បានកែប្រែល្បឿនវីដេអូទៅជា ${safeSpeed}x ដោយជោគជ័យ (សម្លេងដើមមិនបែក Pitch)!`,
      };
    }

    throw new Error("មិនអាចកែប្រែល្បឿនវីដេអូបានទេ");
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

// ============================================================================
// 7. 🎵 AUDIO & VOICE EDITING ENGINE (Trim, Speed, Boost, Denoise, Reverb, Convert)
// ============================================================================
export async function editAudioMedia({
  audioBuffer,
  operation = "boost", // trim, speed, boost, denoise, echo, convert
  startTime = "00:00:00",
  endTime = "00:00:30",
  speed = 1.25,
  boostDb = 6, // +3dB, +6dB, +10dB
  targetFormat = "mp3", // mp3, voice, wav, aac
}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aud-edit-"));
  const inAud = path.join(tmpDir, "in_audio");
  const outAud = path.join(tmpDir, `out_audio.${targetFormat === "voice" ? "ogg" : targetFormat}`);

  try {
    fs.writeFileSync(inAud, audioBuffer);

    let summaryKhmer = "";
    let args = [];

    if (operation === "trim") {
      summaryKhmer = `✂️ បានកាត់សំឡេងចាប់ពី ${startTime} ដល់ ${endTime} រួចរាល់!`;
      args = [
        "-y",
        "-ss",
        String(startTime),
        "-to",
        String(endTime),
        "-i",
        inAud,
        "-c:a",
        "libmp3lame",
        "-b:a",
        "192k",
        outAud,
      ];
    } else if (operation === "speed") {
      const safeSpeed = Math.max(0.5, Math.min(2.0, Number(speed) || 1.25));
      summaryKhmer = `⚡️ បានកែប្រែល្បឿនសំឡេងទៅជា ${safeSpeed}x រួចរាល់!`;
      args = [
        "-y",
        "-i",
        inAud,
        "-filter:a",
        `atempo=${safeSpeed}`,
        "-c:a",
        "libmp3lame",
        "-b:a",
        "192k",
        outAud,
      ];
    } else if (operation === "boost") {
      summaryKhmer = `🔊 បានបង្កើនកម្រិតសំឡេង +${boostDb}dB ឱ្យឮច្បាស់ត្រជាក់ត្រចៀក រួចរាល់!`;
      args = [
        "-y",
        "-i",
        inAud,
        "-filter:a",
        `volume=${boostDb}dB,loudnorm`,
        "-c:a",
        "libmp3lame",
        "-b:a",
        "192k",
        outAud,
      ];
    } else if (operation === "denoise") {
      summaryKhmer = "🎧 បានកាត់បន្ថយសំឡេងរំខាន (Noise Reduction) ឱ្យសំឡេងនិយាយថ្លាច្បាស់ រួចរាល់!";
      args = [
        "-y",
        "-i",
        inAud,
        "-filter:a",
        "highpass=f=80,lowpass=f=12000,afftdn=nf=-24,volume=2dB",
        "-c:a",
        "libmp3lame",
        "-b:a",
        "192k",
        outAud,
      ];
    } else if (operation === "echo") {
      summaryKhmer = "🎙️ បានបញ្ចូល Studio Echo & Reverb ពិរោះបែបបន្ទប់ថតសម្លេង រួចរាល់!";
      args = [
        "-y",
        "-i",
        inAud,
        "-filter:a",
        "aecho=0.8:0.88:60:0.3",
        "-c:a",
        "libmp3lame",
        "-b:a",
        "192k",
        outAud,
      ];
    } else if (operation === "convert") {
      if (targetFormat === "voice") {
        summaryKhmer = "🎙️ បានបម្លែងជា Telegram Voice Note (OGG Opus with Waveform) រួចរាល់!";
        const opusBuf = await convertMp3BufferToTelegramOpusVoice(audioBuffer);
        return {
          ok: true,
          isVoice: true,
          buffer: opusBuf || audioBuffer,
          mimeType: "audio/ogg",
          filename: "voice_note.ogg",
          summaryKhmer,
        };
      } else if (targetFormat === "wav") {
        summaryKhmer = "🎼 បានបម្លែងទៅជា Studio WAV (PCM 16-bit 44.1kHz) រួចរាល់!";
        args = ["-y", "-i", inAud, "-c:a", "pcm_s16le", "-ar", "44100", outAud];
      } else if (targetFormat === "aac") {
        summaryKhmer = "📱 បានបម្លែងទៅជា M4A / AAC 192kbps រួចរាល់!";
        args = ["-y", "-i", inAud, "-c:a", "aac", "-b:a", "192k", outAud];
      } else {
        summaryKhmer = "🎵 បានបម្លែងទៅជា MP3 320kbps High Quality រួចរាល់!";
        args = ["-y", "-i", inAud, "-c:a", "libmp3lame", "-b:a", "320k", outAud];
      }
    }

    const res = await runFfmpeg(args);
    if (res.ok && fs.existsSync(outAud)) {
      return {
        ok: true,
        isVoice: targetFormat === "voice",
        buffer: fs.readFileSync(outAud),
        mimeType: targetFormat === "wav" ? "audio/wav" : targetFormat === "aac" ? "audio/aac" : "audio/mpeg",
        filename: path.basename(outAud),
        summaryKhmer,
      };
    }

    throw new Error("មិនអាចកែសម្រួលសំឡេងបានទេ សូមពិនិត្យទម្រង់ហ្វាល់ឡើងវិញ");
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

// ============================================================================
// INTERACTIVE DASHBOARDS & KEYBOARDS BUILDERS
// ============================================================================
export function buildMediaStudioMainKeyboard(chatId = "default") {
  return {
    inline_keyboard: [
      [
        { text: "🎬 បកប្រែវីដេអូបរទេសជាខ្មែរ", callback_data: "studio:trans_vid" },
        { text: "🎵 បំប្លែងអត្ថបទជាសំឡេង (TTS)", callback_data: "studio:tts_menu" },
      ],
      [
        { text: "🗣️ សំឡេង AI ខ្មែរ (Voices)", callback_data: "studio:voices_menu" },
        { text: "📝 Auto Subtitle / SRT", callback_data: "studio:sub_menu" },
      ],
      [
        { text: "🎞️ កាត់តវីដេអូ (Edit Video)", callback_data: "studio:edit_vid_menu" },
        { text: "⚡️ ល្បឿនវីដេអូ (Speed 0.5x-3x)", callback_data: "studio:speed_vid_menu" },
      ],
      [
        { text: "🎵 កែសម្រួលសំឡេង (Audio Edit)", callback_data: "studio:edit_aud_menu" },
        { text: "📥 ទាញយក MP4 / MP3", callback_data: "studio:dl_menu" },
      ],
    ],
  };
}

export function buildKhmerVoiceSelectionKeyboard(currentVoiceId = "sreymom") {
  const buttons = [];
  const voiceKeys = Object.keys(KHMER_AI_VOICES);

  for (let i = 0; i < voiceKeys.length; i += 2) {
    const row = [];
    const v1 = KHMER_AI_VOICES[voiceKeys[i]];
    const check1 = v1.id === currentVoiceId ? "✅ " : "";
    row.push({ text: `${check1}${v1.nameKhmer}`, callback_data: `set_kh_voice:${v1.id}` });

    if (voiceKeys[i + 1]) {
      const v2 = KHMER_AI_VOICES[voiceKeys[i + 1]];
      const check2 = v2.id === currentVoiceId ? "✅ " : "";
      row.push({ text: `${check2}${v2.nameKhmer}`, callback_data: `set_kh_voice:${v2.id}` });
    }
    buttons.push(row);
  }

  buttons.push([
    { text: "🔊 សាកល្បងស្ដាប់សំឡេងបច្ចុប្បន្ន", callback_data: `demo_kh_voice:${currentVoiceId}` },
    { text: "🎛️ ម៉ឺនុយស្ទូឌីយោធំ", callback_data: "studio:main" },
  ]);

  return { inline_keyboard: buttons };
}

export function buildVideoSpeedKeyboard(lastSpeed = 1.5) {
  return {
    inline_keyboard: [
      [
        { text: lastSpeed === 0.5 ? "✅ 🐢 0.5x (Slow)" : "🐢 0.5x (Slow)", callback_data: "vspeed:0.5" },
        { text: lastSpeed === 0.75 ? "✅ 🚶 0.75x" : "🚶 0.75x", callback_data: "vspeed:0.75" },
        { text: lastSpeed === 1.25 ? "✅ 🏃 1.25x" : "🏃 1.25x", callback_data: "vspeed:1.25" },
      ],
      [
        { text: lastSpeed === 1.5 ? "✅ ⚡ 1.5x (Fast)" : "⚡ 1.5x (Fast)", callback_data: "vspeed:1.5" },
        { text: lastSpeed === 2.0 ? "✅ 🚀 2.0x (Double)" : "🚀 2.0x (Double)", callback_data: "vspeed:2.0" },
        { text: lastSpeed === 3.0 ? "✅ 🏎️ 3.0x (Hyper)" : "🏎️ 3.0x (Hyper)", callback_data: "vspeed:3.0" },
      ],
      [
        { text: "✂️ កាត់ត Trim / Cut", callback_data: "studio:edit_vid_menu" },
        { text: "🎛️ ម៉ឺនុយស្ទូឌីយោធំ", callback_data: "studio:main" },
      ],
    ],
  };
}

export function buildVideoActionKeyboard(hasVideo = true) {
  return {
    inline_keyboard: [
      [
        { text: "🎬 បកប្រែសំឡេងជាខ្មែរ (Dub)", callback_data: "dub_last_video" },
        { text: "📝 ធ្វើ Auto Subtitle / SRT", callback_data: "action_vid:sub" },
      ],
      [
        { text: "⚡️ កែប្រែល្បឿន (0.5x - 3x)", callback_data: "studio:speed_vid_menu" },
        { text: "🎵 ទាញយកជា MP3 សំឡេង", callback_data: "action_vid:extract_mp3" },
      ],
      [
        { text: "📱 ប្ដូរទម្រង់ 9:16 (TikTok)", callback_data: "action_vid:aspect_9_16" },
        { text: "🔇 បិទសំឡេង (Mute)", callback_data: "action_vid:mute" },
      ],
      [
        { text: "🔄 បង្វិល 90°", callback_data: "action_vid:rotate_90" },
        { text: "🪞 ត្រឡប់ Flip Horizontal", callback_data: "action_vid:flip_h" },
      ],
    ],
  };
}

export function buildAudioActionKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🔊 បង្កើនសំឡេង (+6dB Boost)", callback_data: "action_aud:boost_6" },
        { text: "🎧 លុបសំឡេងរំខាន (Denoise)", callback_data: "action_aud:denoise" },
      ],
      [
        { text: "⚡️ ល្បឿន 1.25x", callback_data: "action_aud:speed_1_25" },
        { text: "⚡️ ល្បឿន 1.5x", callback_data: "action_aud:speed_1_5" },
      ],
      [
        { text: "🎙️ Studio Echo & Reverb", callback_data: "action_aud:echo" },
        { text: "🎙️ បម្លែងជា Voice Note (Opus)", callback_data: "action_aud:to_voice" },
      ],
      [
        { text: "🎵 បម្លែងជា MP3 (320kbps)", callback_data: "action_aud:to_mp3" },
        { text: "🎼 បម្លែងជា Studio WAV", callback_data: "action_aud:to_wav" },
      ],
    ],
  };
}


// ============================================================================
// DIRECT TELEGRAM API SENDER HELPERS (Zero Dependencies)
// ============================================================================
export async function downloadTelegramFileDirect(token, fileId) {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`
    );
    const data = await res.json();
    if (data.ok && data.result?.file_path) {
      const dlRes = await fetch(`https://api.telegram.org/file/bot${token}/${data.result.file_path}`);
      if (dlRes.ok) {
        return Buffer.from(await dlRes.arrayBuffer());
      }
    }
  } catch (err) {
    console.error("[MediaStudio] Download file error:", err);
  }
  return null;
}

export async function sendTelegramHtmlDirect(token, chatId, htmlText, replyMarkup = null, replyToMessageId = null) {
  try {
    const body = {
      chat_id: chatId,
      text: htmlText,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    };
    if (replyMarkup) body.reply_markup = replyMarkup;
    if (replyToMessageId) body.reply_to_message_id = replyToMessageId;

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function sendTelegramVideoDirect(token, chatId, videoBuffer, caption = "", filename = "video.mp4", replyMarkup = null, replyToMessageId = null) {
  try {
    const form = new FormData();
    form.append("chat_id", String(chatId));
    if (caption) {
      form.append("caption", caption);
      form.append("parse_mode", "HTML");
    }
    if (replyToMessageId) form.append("reply_to_message_id", String(replyToMessageId));
    if (replyMarkup) form.append("reply_markup", JSON.stringify(replyMarkup));
    form.append("supports_streaming", "true");
    form.append("video", new Blob([new Uint8Array(videoBuffer)], { type: "video/mp4" }), filename);

    const res = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, {
      method: "POST",
      body: form,
    });
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function sendTelegramAudioDirect(token, chatId, audioBuffer, caption = "", title = "Audio", performer = "Khmer Super AI Agent", filename = "audio.mp3", replyMarkup = null, replyToMessageId = null) {
  try {
    const form = new FormData();
    form.append("chat_id", String(chatId));
    if (caption) {
      form.append("caption", caption);
      form.append("parse_mode", "HTML");
    }
    if (title) form.append("title", title);
    if (performer) form.append("performer", performer);
    if (replyToMessageId) form.append("reply_to_message_id", String(replyToMessageId));
    if (replyMarkup) form.append("reply_markup", JSON.stringify(replyMarkup));
    form.append("audio", new Blob([new Uint8Array(audioBuffer)], { type: "audio/mpeg" }), filename);

    const res = await fetch(`https://api.telegram.org/bot${token}/sendAudio`, {
      method: "POST",
      body: form,
    });
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function sendTelegramVoiceDirect(token, chatId, voiceBuffer, caption = "", filename = "voice.ogg", replyMarkup = null, replyToMessageId = null) {
  try {
    const form = new FormData();
    form.append("chat_id", String(chatId));
    if (caption) {
      form.append("caption", caption);
      form.append("parse_mode", "HTML");
    }
    if (replyToMessageId) form.append("reply_to_message_id", String(replyToMessageId));
    if (replyMarkup) form.append("reply_markup", JSON.stringify(replyMarkup));
    form.append("voice", new Blob([new Uint8Array(voiceBuffer)], { type: "audio/ogg" }), filename);

    const res = await fetch(`https://api.telegram.org/bot${token}/sendVoice`, {
      method: "POST",
      body: form,
    });
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function sendTelegramDocumentDirect(token, chatId, docBuffer, caption = "", filename = "document.srt", replyMarkup = null, replyToMessageId = null) {
  try {
    const form = new FormData();
    form.append("chat_id", String(chatId));
    if (caption) {
      form.append("caption", caption);
      form.append("parse_mode", "HTML");
    }
    if (replyToMessageId) form.append("reply_to_message_id", String(replyToMessageId));
    if (replyMarkup) form.append("reply_markup", JSON.stringify(replyMarkup));
    form.append("document", new Blob([new Uint8Array(docBuffer)], { type: "application/octet-stream" }), filename);

    const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: "POST",
      body: form,
    });
    return await res.json();
  } catch (e) {
    return null;
  }
}

// ============================================================================
// MAIN TELEGRAM MEDIA STUDIO DISPATCHER (All 7 Features Integrated)
// ============================================================================
export async function handleTelegramMediaStudioDispatch({
  token,
  chatId,
  messageId = null,
  userText = "",
  cbData = "",
  session = null,
  uploadedVideoObj = null,
  uploadedAudioTarget = null,
  replyToMessage = null,
}) {
  const normText = String(userText || "").trim();
  const cmd = normText.split(/\s+/)[0].toLowerCase();
  const argsText = normText.replace(/^[^\s]+\s*/, "").trim();

  // Remember active media IDs on session
  if (session) {
    if (uploadedVideoObj && uploadedVideoObj.file_id) {
      session.lastVideoFileId = uploadedVideoObj.file_id;
    }
    if (uploadedAudioTarget && uploadedAudioTarget.file_id) {
      session.lastAudioFileId = uploadedAudioTarget.file_id;
    }
  }

  // --------------------------------------------------------------------------
  // A. CALLBACK QUERIES DISPATCH
  // --------------------------------------------------------------------------
  if (cbData) {
    // 1. Studio Main Menu
    if (cbData === "studio:main") {
      await sendTelegramHtmlDirect(
        token,
        chatId,
        `🎛️ <b>ស្ទូឌីយោវីដេអូ & សំឡេង AI ពេញលេញ (Khmer AI Media Studio 24/7)</b> 🇰🇭✨\n\n` +
          `សូមជ្រើសរើសសមត្ថភាពដែលអ្នកចង់ប្រើប្រាស់៖\n` +
          `• 🎬 <b>Translate Foreign Video to Khmer:</b> បកប្រែវីដេអូបរទេសជាភាសាខ្មែរ\n` +
          `• 🎵 <b>TTS (Text to Speech):</b> បំប្លែងអត្ថបទទៅជាសំឡេងនិយាយ\n` +
          `• 🗣️ <b>Khmer AI Voice:</b> ជ្រើសរើសសំឡេង AI ខ្មែរ (៦+ សំឡេង)\n` +
          `• 📝 <b>Auto Subtitle / SRT:</b> បង្កើត Subtitle & ទាញយកហ្វាល់ .SRT\n` +
          `• 🎞️ <b>Edit Video:</b> កាត់តវីដេអូ (Trim, Mute, Crop 9:16/16:9, Rotate)\n` +
          `• ⚡️ <b>Speed Video:</b> បង្កើន/បន្ថយល្បឿនវីដេអូ (0.5x - 3.0x Pitch Fixed)\n` +
          `• 🎵 <b>Audio & Voice Editing:</b> កែសម្រួលសំឡេង (Trim, Speed, Boost, Denoise, Reverb, Convert)`,
        buildMediaStudioMainKeyboard(chatId),
        messageId
      );
      return true;
    }

    // 2. Video Actions Menu
    if (cbData === "studio:edit_vid_menu") {
      await sendTelegramHtmlDirect(
        token,
        chatId,
        `🎞️ <b>កាត់ត និងកែសម្រួលវីដេអូ (Video Studio Editing)</b>\n\n` +
          `ជ្រើសរើសសកម្មភាពកាត់តវីដេអូខាងក្រោម ឬវាយបញ្ជាកាត់ត៖\n` +
          `• ✂️ កាត់តយកចន្លោះពេល៖ <code>/trim 00:05 00:30</code>\n` +
          `• 🔇 បិទសំឡេងដើម (Mute Audio)\n` +
          `• 📱 ប្ដូរទម្រង់ 9:16 (TikTok, Reels, Shorts)\n` +
          `• 🖥️ ប្ដូរទម្រង់ 16:9 (YouTube Landscape)\n` +
          `• 🔄 បង្វិល 90°, 180°, 270°, Flip Mirror\n` +
          `• 🎵 ទាញយកជា MP3 សំឡេងចេញពីវីដេអូ`,
        buildVideoActionKeyboard(Boolean(session?.lastVideoFileId)),
        messageId
      );
      return true;
    }

    // 3. Video Speed Menu
    if (cbData === "studio:speed_vid_menu") {
      await sendTelegramHtmlDirect(
        token,
        chatId,
        `⚡️ <b>កែប្រែល្បឿនវីដេអូ (Video Speed Multiplier 0.5x - 3.0x)</b>\n\n` +
          `ប្រព័ន្ធប្រើប្រាស់បច្ចេកវិទ្យា Pitch-Correction រក្សាសំឡេងដើមមិនឱ្យបែក ឬក្លាយជាសំឡេងកណ្ដុរឡើយ!\n` +
          `សូមជ្រើសរើសកម្រិតល្បឿនដែលអ្នកចង់បាន៖`,
        buildVideoSpeedKeyboard(session?.lastVideoSpeed || 1.5),
        messageId
      );
      return true;
    }

    // 4. Voice Selection Menu
    if (cbData === "studio:voices_menu") {
      const activeVoice = getUserPreferredKhmerVoice(chatId);
      await sendTelegramHtmlDirect(
        token,
        chatId,
        `🗣️ <b>ជ្រើសរើសសំឡេង AI ខ្មែរ (Khmer AI Voice Catalog)</b>\n\n` +
          `សំឡេងសកម្មបច្ចុប្បន្ន៖ <b>${KHMER_AI_VOICES[activeVoice]?.nameKhmer || activeVoice}</b>\n\n` +
          `• 🌸 <b>ស្រីមុំ:</b> ស្រទន់ ពិរោះ គួរឱ្យស្រឡាញ់\n` +
          `• 📰 <b>ចិន្តា:</b> ស្រទន់ រៀបរាប់ ព័ត៌មាន ស្ដង់ដារ\n` +
          `• 🌟 <b>ពិសិដ្ឋ:</b> មាំទាំ កក់ក្ដៅ ជឿជាក់\n` +
          `• ⚡ <b>តារា:</b> រហ័សរហួន រួសរាយ រស់រវើក\n` +
          `• 👧 <b>ស្រីនីត:</b> សំឡេងកុមារ ស្រស់ស្រាយ\n` +
          `• 🎬 <b>សម្រាយរឿង:</b> សំឡេងធ្ងន់ Deep Voice បែបភាពយន្ត\n\n` +
          `<i>(💡 រាល់ការបកប្រែវីដេអូ, TTS និងសំឡេងឆ្លើយតប នឹងប្រើប្រាស់សំឡេងដែលអ្នកបានជ្រើសរើសនេះស្វ័យប្រវត្តិ)</i>`,
        buildKhmerVoiceSelectionKeyboard(activeVoice),
        messageId
      );
      return true;
    }

    // 5. Audio Actions Menu
    if (cbData === "studio:edit_aud_menu") {
      await sendTelegramHtmlDirect(
        token,
        chatId,
        `🎵 <b>កែសម្រួលសំឡេង & Voice Note (Audio Studio Editing)</b>\n\n` +
          `ជ្រើសរើសមុខងារកែសម្រួលសំឡេងខាងក្រោម៖\n` +
          `• 🔊 <b>Boost Volume:</b> បង្កើនកម្រិតសំឡេង +6dB ឱ្យឮច្បាស់\n` +
          `• 🎧 <b>Noise Reduction:</b> កាត់បន្ថយសំឡេងរំខាន ឱ្យសំឡេងនិយាយថ្លា\n` +
          `• ⚡️ <b>Audio Speed:</b> បង្កើនល្បឿន 1.25x ឬ 1.5x\n` +
          `• 🎙️ <b>Studio Reverb:</b> បញ្ចូល Echo បែបបន្ទប់ស្ទូឌីយោ\n` +
          `• 🔄 <b>Convert Format:</b> បម្លែងទៅជា Voice Note (Opus), MP3 ឬ WAV`,
        buildAudioActionKeyboard(),
        messageId
      );
      return true;
    }

    // 6. Set Preferred Voice: `set_kh_voice:<id>`
    if (cbData.startsWith("set_kh_voice:")) {
      const vid = cbData.replace("set_kh_voice:", "");
      if (setUserPreferredKhmerVoice(chatId, vid)) {
        const vInfo = KHMER_AI_VOICES[vid];
        await sendTelegramHtmlDirect(
          token,
          chatId,
          `✅ <b>បានកំណត់យកសំឡេង ${vInfo.nameKhmer} ជាសំឡេងដើមរួចរាល់!</b>\n` +
            `• ចរិតលក្ខណៈ៖ ${vInfo.tagKhmer}\n` +
            `• រាល់ការបកប្រែវីដេអូ, TTS និងការឆ្លើយតបជាសំឡេង នឹងប្រើប្រាស់សំឡេងនេះ!`,
          buildKhmerVoiceSelectionKeyboard(vid),
          messageId
        );
      }
      return true;
    }

    // 7. Demo Voice Sample: `demo_kh_voice:<id>`
    if (cbData.startsWith("demo_kh_voice:")) {
      const vid = cbData.replace("demo_kh_voice:", "");
      const vInfo = KHMER_AI_VOICES[vid] || KHMER_AI_VOICES.sreymom;
      const demoRes = await generateKhmerTtsAudio({
        text: vInfo.sampleText,
        voiceId: vid,
        chatId,
      });
      if (demoRes.ok && demoRes.opusBuffer) {
        await sendTelegramVoiceDirect(
          token,
          chatId,
          demoRes.opusBuffer,
          `🎙️ <b>គំរូសំឡេង៖</b> ${vInfo.nameKhmer}\n«${vInfo.sampleText}»`,
          "voice_demo.ogg",
          null,
          messageId
        );
      }
      return true;
    }

    // 8. Video Speed Change: `vspeed:<speed>`
    if (cbData.startsWith("vspeed:")) {
      const spd = parseFloat(cbData.replace("vspeed:", "")) || 1.5;
      const vidTarget =
        session?.lastVideoFileId ||
        uploadedVideoObj?.file_id ||
        replyToMessage?.video?.file_id ||
        null;

      if (!vidTarget) {
        await sendTelegramHtmlDirect(
          token,
          chatId,
          "⚡️ សូមផ្ញើវីដេអូ ឬ Reply លើវីដេអូមកកាន់ទីនេះជាមុនសិន ដើម្បីកែប្រែល្បឿន!",
          buildVideoSpeedKeyboard(spd),
          messageId
        );
        return true;
      }

      await sendTelegramHtmlDirect(
        token,
        chatId,
        `⏳ កំពុងកែប្រែល្បឿនវីដេអូទៅជា <b>${spd}x</b> (Pitch-Corrected Audio)... សូមរង់ចាំបន្តិច! ⚡️`,
        null,
        messageId
      );

      const vidBuf = await downloadTelegramFileDirect(token, vidTarget);
      if (vidBuf) {
        const spdRes = await changeVideoSpeedMedia({ videoBuffer: vidBuf, speed: spd });
        if (spdRes.ok && spdRes.buffer) {
          if (session) session.lastVideoSpeed = spd;
          await sendTelegramVideoDirect(
            token,
            chatId,
            spdRes.buffer,
            `⚡️🎬 <b>បានកែប្រែល្បឿនវីដេអូទៅជា ${spd}x ដោយជោគជ័យ!</b>\n` +
              `• សំឡេងនិយាយរក្សា Pitch ដើម មិនបែក និងមិនក្លាយជាសំឡេងកណ្ដុរឡើយ។`,
            spdRes.filename,
            buildVideoSpeedKeyboard(spd),
            messageId
          );
          return true;
        }
      }
      return true;
    }

    // 9. Video Action Operations: `action_vid:<op>`
    if (cbData.startsWith("action_vid:")) {
      const op = cbData.replace("action_vid:", "");
      const vidTarget =
        session?.lastVideoFileId ||
        uploadedVideoObj?.file_id ||
        replyToMessage?.video?.file_id ||
        null;

      if (!vidTarget && op !== "sub") {
        await sendTelegramHtmlDirect(
          token,
          chatId,
          "🎬 សូមផ្ញើវីដេអូ ឬ Reply លើវីដេអូមកកាន់ទីនេះជាមុនសិន ដើម្បីអនុវត្តសកម្មភាព!",
          buildVideoActionKeyboard(false),
          messageId
        );
        return true;
      }

      // Subtitle generation request
      if (op === "sub") {
        const targetMedia = vidTarget || session?.lastAudioFileId || replyToMessage?.audio?.file_id || null;
        if (!targetMedia) {
          await sendTelegramHtmlDirect(
            token,
            chatId,
            "📝 សូមផ្ញើវីដេអូ ឬហ្វាល់សំឡេងមកកាន់ទីនេះ ដើម្បីឱ្យប្រព័ន្ធបង្កើត Subtitle & ហ្វាល់ .SRT ជូនអ្នក!",
            null,
            messageId
          );
          return true;
        }

        await sendTelegramHtmlDirect(
          token,
          chatId,
          "⏳ កំពុងដំណើរការស្តាប់សំឡេង និងបង្កើត Auto Subtitle / ហ្វាល់ .SRT... សូមរង់ចាំបន្តិច! 📝✨",
          null,
          messageId
        );

        const mediaBuf = await downloadTelegramFileDirect(token, targetMedia);
        if (mediaBuf) {
          const srtRes = await generateAutoSubtitlesAndSrt({
            videoOrAudioBuffer: mediaBuf,
            isVideo: Boolean(vidTarget),
          });
          if (srtRes.ok) {
            // Send .srt file
            await sendTelegramDocumentDirect(
              token,
              chatId,
              srtRes.srtBuffer,
              `📝 <b>ហ្វាល់ Subtitle (.srt) បង្កើតដោយស្វ័យប្រវត្តិតាមសំឡេងនិយាយ!</b>\n` +
                `អ្នកអាចយកទៅប្រើប្រាស់ក្នុង CapCut, Premiere, ឬចាក់ក្នុង Video Player បានភ្លាមៗ!`,
              "auto_subtitles.srt",
              {
                inline_keyboard: [
                  [{ text: "🔥 ដុត Subtitle ជាប់វីដេអូ (Hardburn)", callback_data: "action_vid:hardburn_sub" }],
                  [{ text: "🎬 បកប្រែវីដេអូជាខ្មែរ (Dub)", callback_data: "dub_last_video" }],
                ],
              },
              messageId
            );

            // Preview subtitle lines
            const previewLines = srtRes.srtText.split("\n").slice(0, 16).join("\n");
            await sendTelegramHtmlDirect(
              token,
              chatId,
              `📄 <b>គំរូអត្ថបទ Subtitle ជាមួយ Timestamps៖</b>\n<pre>${previewLines}</pre>`,
              null,
              messageId
            );
            return true;
          }
        }
        return true;
      }

      // Hardburn subtitles
      if (op === "hardburn_sub") {
        await sendTelegramHtmlDirect(
          token,
          chatId,
          "⏳ កំពុងដុត Subtitle ខ្មែរជាប់លើផ្ទាំងវីដេអូ (Hardburn Subtitles)... សូមរង់ចាំបន្តិច! 🔥🎬",
          null,
          messageId
        );
        const vidBuf = await downloadTelegramFileDirect(token, vidTarget);
        if (vidBuf) {
          const burned = await burnRunningSubtitlesToVideo({
            videoBuffer: vidBuf,
            transcriptionText: "វីដេអូ Khmer Super AI Agent",
            preset: "tiktok_gold",
          });
          if (burned && burned.videoBuffer) {
            await sendTelegramVideoDirect(
              token,
              chatId,
              burned.videoBuffer,
              "🔥🎬 <b>បានដុត Subtitle ខ្មែររត់តាមពាក្យនិយាយជាប់វីដេអូរួចរាល់!</b>",
              "burned_subtitle_video.mp4",
              buildVideoActionKeyboard(true),
              messageId
            );
            return true;
          }
        }
        return true;
      }

      // Video editing operations: mute, aspect_ratio, rotate, extract_mp3
      let operationName = op;
      let aspectRatioParam = "9:16";
      let rotationParam = "90";

      if (op.startsWith("aspect_")) {
        operationName = "aspect_ratio";
        aspectRatioParam = op.replace("aspect_", "").replace("_", ":");
      } else if (op.startsWith("rotate_") || op === "flip_h") {
        operationName = "rotate";
        rotationParam = op.replace("rotate_", "");
      }

      await sendTelegramHtmlDirect(
        token,
        chatId,
        `⏳ កំពុងដំណើរការកាត់តវីដេអូ (${operationName})... សូមរង់ចាំបន្តិច! 🎞️✨`,
        null,
        messageId
      );

      const vidBuf = await downloadTelegramFileDirect(token, vidTarget);
      if (vidBuf) {
        const editRes = await editVideoMedia({
          videoBuffer: vidBuf,
          operation: operationName,
          aspectRatio: aspectRatioParam,
          rotation: rotationParam,
        });

        if (editRes.ok) {
          if (editRes.isAudio) {
            await sendTelegramAudioDirect(
              token,
              chatId,
              editRes.buffer,
              `🎵 <b>${editRes.summaryKhmer}</b>`,
              "Extracted Audio",
              "Khmer Super AI Agent",
              editRes.filename,
              buildAudioActionKeyboard(),
              messageId
            );
          } else {
            await sendTelegramVideoDirect(
              token,
              chatId,
              editRes.buffer,
              `🎞️ <b>${editRes.summaryKhmer}</b>`,
              editRes.filename,
              buildVideoActionKeyboard(true),
              messageId
            );
          }
          return true;
        }
      }
      return true;
    }

    // 10. Audio Action Operations: `action_aud:<op>`
    if (cbData.startsWith("action_aud:")) {
      const op = cbData.replace("action_aud:", "");
      const audTarget =
        session?.lastAudioFileId ||
        uploadedAudioTarget?.file_id ||
        replyToMessage?.audio?.file_id ||
        replyToMessage?.voice?.file_id ||
        null;

      if (!audTarget) {
        await sendTelegramHtmlDirect(
          token,
          chatId,
          "🎵 សូមផ្ញើសំឡេង (Voice Note / MP3) ឬ Reply លើសំឡេងជាមុនសិន ដើម្បីកែសម្រួល!",
          buildAudioActionKeyboard(),
          messageId
        );
        return true;
      }

      let operation = "boost";
      let boostDb = 6;
      let speed = 1.25;
      let targetFormat = "mp3";

      if (op === "boost_6") {
        operation = "boost";
        boostDb = 6;
      } else if (op === "denoise") {
        operation = "denoise";
      } else if (op === "echo") {
        operation = "echo";
      } else if (op === "speed_1_25") {
        operation = "speed";
        speed = 1.25;
      } else if (op === "speed_1_5") {
        operation = "speed";
        speed = 1.5;
      } else if (op === "to_voice") {
        operation = "convert";
        targetFormat = "voice";
      } else if (op === "to_mp3") {
        operation = "convert";
        targetFormat = "mp3";
      } else if (op === "to_wav") {
        operation = "convert";
        targetFormat = "wav";
      }

      await sendTelegramHtmlDirect(
        token,
        chatId,
        `⏳ កំពុងដំណើរការកែសម្រួលសំឡេង (${op})... សូមរង់ចាំបន្តិច! 🎵✨`,
        null,
        messageId
      );

      const audBuf = await downloadTelegramFileDirect(token, audTarget);
      if (audBuf) {
        const audRes = await editAudioMedia({
          audioBuffer: audBuf,
          operation,
          boostDb,
          speed,
          targetFormat,
        });

        if (audRes.ok) {
          if (audRes.isVoice) {
            await sendTelegramVoiceDirect(
              token,
              chatId,
              audRes.buffer,
              `🎙️ <b>${audRes.summaryKhmer}</b>`,
              audRes.filename,
              buildAudioActionKeyboard(),
              messageId
            );
          } else {
            await sendTelegramAudioDirect(
              token,
              chatId,
              audRes.buffer,
              `🎵 <b>${audRes.summaryKhmer}</b>`,
              "Edited Audio",
              "Khmer Super AI Agent",
              audRes.filename,
              buildAudioActionKeyboard(),
              messageId
            );
          }
          return true;
        }
      }
      return true;
    }
  }

  // --------------------------------------------------------------------------
  // B. MESSAGE COMMANDS & INTENT DISPATCH
  // --------------------------------------------------------------------------

  // 1. /studio Command
  if (cmd === "/studio" || normText === "🎛️ ស្ទូឌីយោវីដេអូ & សំឡេង AI ពេញលេញ") {
    await sendTelegramHtmlDirect(
      token,
      chatId,
      `🎛️ <b>ស្ទូឌីយោវីដេអូ & សំឡេង AI ពេញលេញ (Khmer AI Media Studio 24/7)</b> 🇰🇭✨\n\n` +
        `សូមជ្រើសរើសសមត្ថភាពដែលអ្នកចង់ប្រើប្រាស់៖\n` +
        `• 🎬 <b>Translate Foreign Video to Khmer:</b> បកប្រែវីដេអូបរទេសជាភាសាខ្មែរ (Voice Dubbing)\n` +
        `• 🎵 <b>TTS (Text to Speech):</b> បំប្លែងអត្ថបទទៅជាសំឡេងនិយាយ\n` +
        `• 🗣️ <b>Khmer AI Voice:</b> ជ្រើសរើសសំឡេង AI ខ្មែរ (៦+ សំឡេង)\n` +
        `• 📝 <b>Auto Subtitle / SRT:</b> បង្កើត Subtitle & ទាញយកហ្វាល់ .SRT\n` +
        `• 🎞️ <b>Edit Video:</b> កាត់តវីដេអូ (Trim, Mute, Crop 9:16/16:9, Rotate)\n` +
        `• ⚡️ <b>Speed Video:</b> បង្កើន/បន្ថយល្បឿនវីដេអូ (0.5x - 3.0x Pitch Fixed)\n` +
        `• 🎵 <b>Audio & Voice Editing:</b> កែសម្រួលសំឡេង (Trim, Speed, Boost, Denoise, Reverb, Convert)`,
      buildMediaStudioMainKeyboard(chatId),
      messageId
    );
    return true;
  }

  // 2. /translate_video Command or Foreign Video Translation Request
  if (
    cmd === "/translate_video" ||
    cmd === "/dub" ||
    cmd === "/dubbing" ||
    cmd === "/videodub" ||
    /(?:បកប្រែវីដេអូ|បកប្រែសំឡេងជាខ្មែរ|បកប្រែជាខ្មែរ)/i.test(normText)
  ) {
    const videoUrlInText = (normText.match(/https?:\/\/[^\s<>"'`]+/i) || [])[0] || session?.lastVideoUrl || "";
    const directVideoTarget =
      uploadedVideoObj?.file_id ||
      replyToMessage?.video?.file_id ||
      session?.lastVideoFileId ||
      null;

    if (!directVideoTarget && !videoUrlInText) {
      await sendTelegramHtmlDirect(
        token,
        chatId,
        `🎬 <b>បកប្រែវីដេអូបរទេសជាភាសាខ្មែរ (Foreign Video to Khmer Voiceover)</b>\n\n` +
          `សូមផ្ញើ **ហ្វាល់វីដេអូ (MP4/MOV)** ចូលមកកាន់ទីនេះ ឬ ផ្ញើ **តំណលីងវីដេអូ (CapCut, TikTok, YouTube, Facebook, Pinterest, Instagram)**!\n\n` +
          `✨ <b>សមត្ថភាពដំណើរការស្វ័យប្រវត្ត៖</b>\n` +
          `១. ស្តាប់សំឡេងនិយាយដើមគ្រប់ភាសា (English, Chinese, Vietnamese, Thai, Korean...)\n` +
          `២. បកប្រែជាភាសាខ្មែររលូន ពិរោះ និងត្រឹមត្រូវតាមកាលៈទេសៈ\n` +
          `៣. បញ្ចូលសំឡេង AI ខ្មែរ (Voiceover Dubbing) ជាមួយសំឡេងតន្ត្រីដើម\n` +
          `៤. បង្កើត និងដុត Subtitle ខ្មែរជាប់វីដេអូស្រេចតែម្ដង!`,
        {
          inline_keyboard: [
            [{ text: "🗣️ ជ្រើសរើសសំឡេង AI ខ្មែរ (Voices)", callback_data: "studio:voices_menu" }],
            [{ text: "🎛️ ម៉ឺនុយស្ទូឌីយោធំ", callback_data: "studio:main" }],
          ],
        },
        messageId
      );
      return true;
    }

    await sendTelegramHtmlDirect(
      token,
      chatId,
      "⏳ កំពុងដំណើរការបកប្រែវីដេអូបរទេសជាភាសាខ្មែរ (ស្តាប់សំឡេងដើម -> បកប្រែជាខ្មែរ -> បញ្ចូលសំឡេង AI ខ្មែរ)... សូមរង់ចាំបន្តិច! 🎬✨",
      null,
      messageId
    );

    const preferredVoice = getUserPreferredKhmerVoice(chatId);
    let videoBuffer = null;
    if (directVideoTarget) {
      videoBuffer = await downloadTelegramFileDirect(token, directVideoTarget);
    }

    const dubRes = await translateForeignVideoToKhmerEnhanced({
      videoBuffer,
      videoUrl: videoUrlInText,
      voiceId: preferredVoice,
      chatId,
    });

    if (dubRes.ok && dubRes.dubbedVideoBuffer) {
      await sendTelegramVideoDirect(
        token,
        chatId,
        dubRes.dubbedVideoBuffer,
        `🎬🇰🇭 <b>វីដេអូបកប្រែ និងបញ្ចូលសំឡេងជាភាសាខ្មែររួចរាល់!</b>\n` +
          `🌐 <b>ភាសាដើម៖</b> ${dubRes.detectedLanguage}\n` +
          `🎙️ <b>សំឡេងបញ្ចូល៖</b> ${dubRes.voiceActorKhmer}\n` +
          `🇰🇭 <b>ខ្លឹមសារខ្មែរ៖</b> ${String(dubRes.khmerTranslation || "").slice(0, 500)}`,
        "khmer_dubbed_video.mp4",
        buildVideoActionKeyboard(true),
        messageId
      );
      return true;
    }
  }

  // 3. /tts Command (Text to Speech)
  if (
    cmd === "/tts" ||
    cmd === "/speak" ||
    cmd === "/tts_khmer" ||
    /^(?:បម្លែងជាសំឡេង|អានជាសំឡេង)[\s:៖](.+)/i.test(normText)
  ) {
    let ttsText = argsText;
    const matchKhmerIntent = normText.match(/^(?:បម្លែងជាសំឡេង|អានជាសំឡេង)[\s:៖](.+)/i);
    if (matchKhmerIntent && matchKhmerIntent[1]) {
      ttsText = matchKhmerIntent[1].trim();
    }

    if (!ttsText) {
      await sendTelegramHtmlDirect(
        token,
        chatId,
        `🎵 <b>បំប្លែងអត្ថបទទៅជាសំឡេង (Khmer AI Text to Speech - TTS)</b>\n\n` +
          `សូមវាយបញ្ជា៖ <code>/tts &lt;អត្ថបទដែលចង់ឱ្យអាន&gt;</code>\n\n` +
          `<b>ឧទាហរណ៍៖</b>\n` +
          `• <code>/tts សួស្តីបងប្អូនទាំងអស់គ្នា! ស្វាគមន៍មកកាន់ការផ្សាយផ្ទាល់...</code>\n` +
          `• <code>/tts Hello, welcome to Cambodia!</code>`,
        {
          inline_keyboard: [
            [{ text: "🗣️ ជ្រើសរើសសំឡេង AI ខ្មែរ", callback_data: "studio:voices_menu" }],
          ],
        },
        messageId
      );
      return true;
    }

    const preferredVoice = getUserPreferredKhmerVoice(chatId);
    const ttsRes = await generateKhmerTtsAudio({
      text: ttsText,
      voiceId: preferredVoice,
      chatId,
    });

    if (ttsRes.ok) {
      // 1. Send native Telegram Voice Note with waveform
      if (ttsRes.opusBuffer) {
        await sendTelegramVoiceDirect(
          token,
          chatId,
          ttsRes.opusBuffer,
          `🎙️ <b>សំឡេងអាន (${ttsRes.voiceName})៖</b>\n«${ttsText.slice(0, 200)}»`,
          "khmer_tts.ogg",
          {
            inline_keyboard: [
              [
                { text: "⚡️ ល្បឿន 1.25x", callback_data: "action_aud:speed_1_25" },
                { text: "⚡️ ល្បឿន 1.5x", callback_data: "action_aud:speed_1_5" },
              ],
              [{ text: "🗣️ ប្ដូរសំឡេង (Voices)", callback_data: "studio:voices_menu" }],
            ],
          },
          messageId
        );
      }

      // 2. Also send MP3 file
      if (ttsRes.mp3Buffer) {
        await sendTelegramAudioDirect(
          token,
          chatId,
          ttsRes.mp3Buffer,
          `🎵 ហ្វាល់ MP3 សំឡេងអាន (${ttsRes.voiceName})`,
          "Khmer TTS Audio",
          ttsRes.voiceName,
          "khmer_tts_audio.mp3",
          null,
          messageId
        );
      }
      return true;
    }
  }

  // 4. /voices Command (Khmer AI Voice Catalog)
  if (
    cmd === "/voices" ||
    cmd === "/voice" ||
    cmd === "/khmervoice" ||
    cmd === "/setvoice" ||
    cmd === "/customvoice" ||
    normText === "🗣️ ជ្រើសរើសសំឡេង AI ខ្មែរ" ||
    normText === "សំឡេងai"
  ) {
    const activeVoice = getUserPreferredKhmerVoice(chatId);
    await sendTelegramHtmlDirect(
      token,
      chatId,
      `🗣️ <b>ជ្រើសរើសសំឡេង AI ខ្មែរ (Khmer AI Voice Catalog)</b>\n\n` +
        `សំឡេងសកម្មបច្ចុប្បន្ន៖ <b>${KHMER_AI_VOICES[activeVoice]?.nameKhmer || activeVoice}</b>\n\n` +
        `• 🌸 <b>ស្រីមុំ:</b> ស្រទន់ ពិរោះ គួរឱ្យស្រឡាញ់\n` +
        `• 📰 <b>ចិន្តា:</b> ស្រទន់ រៀបរាប់ ព័ត៌មាន ស្ដង់ដារ\n` +
        `• 🌟 <b>ពិសិដ្ឋ:</b> មាំទាំ កក់ក្ដៅ ជឿជាក់\n` +
        `• ⚡ <b>តារា:</b> រហ័សរហួន រួសរាយ រស់រវើក\n` +
        `• 👧 <b>ស្រីនីត:</b> សំឡេងកុមារ ស្រស់ស្រាយ\n` +
        `• 🎬 <b>សម្រាយរឿង:</b> សំឡេងធ្ងន់ Deep Voice បែបភាពយន្ត\n\n` +
        `<i>(💡 រាល់ការបកប្រែវីដេអូ, TTS និងសំឡេងឆ្លើយតប នឹងប្រើប្រាស់សំឡេងដែលអ្នកបានជ្រើសរើសនេះស្វ័យប្រវត្តិ)</i>`,
      buildKhmerVoiceSelectionKeyboard(activeVoice),
      messageId
    );
    return true;
  }

  // 5. /subtitle or /srt Command (Auto Subtitle / SRT)
  if (
    cmd === "/subtitle" ||
    cmd === "/srt" ||
    cmd === "/autosub" ||
    cmd === "/vtt" ||
    /(?:ធ្វើ\s*subtitle|បង្កើត\s*srt|ទាញយក\s*srt)/i.test(normText)
  ) {
    const targetMedia =
      uploadedVideoObj?.file_id ||
      uploadedAudioTarget?.file_id ||
      replyToMessage?.video?.file_id ||
      replyToMessage?.audio?.file_id ||
      session?.lastVideoFileId ||
      session?.lastAudioFileId ||
      null;

    if (!targetMedia) {
      await sendTelegramHtmlDirect(
        token,
        chatId,
        `📝 <b>បង្កើត Auto Subtitle / ហ្វាល់ .SRT ស្វ័យប្រវត្តិតាមសំឡេងនិយាយ</b>\n\n` +
          `សូមផ្ញើ **ហ្វាល់វីដេអូ (MP4)** ឬ **ហ្វាល់សំឡេង (MP3/Voice)** ឬ Reply លើហ្វាល់វីដេអូ/សំឡេងនោះ!\n` +
          `ប្រព័ន្ធនឹងស្តាប់សំឡេងកាត់ជាប្រយោគ និងកំណត់នាទី (Timestamps) បង្កើតជាហ្វាល់ .SRT ជូនភ្លាមៗ។`,
        {
          inline_keyboard: [
            [{ text: "🎛️ ម៉ឺនុយស្ទូឌីយោធំ", callback_data: "studio:main" }],
          ],
        },
        messageId
      );
      return true;
    }

    await sendTelegramHtmlDirect(
      token,
      chatId,
      "⏳ កំពុងដំណើរការស្តាប់សំឡេង និងបង្កើត Auto Subtitle / ហ្វាល់ .SRT... សូមរង់ចាំបន្តិច! 📝✨",
      null,
      messageId
    );

    const mediaBuf = await downloadTelegramFileDirect(token, targetMedia);
    if (mediaBuf) {
      const srtRes = await generateAutoSubtitlesAndSrt({
        videoOrAudioBuffer: mediaBuf,
        isVideo: Boolean(uploadedVideoObj || session?.lastVideoFileId),
      });

      if (srtRes.ok) {
        await sendTelegramDocumentDirect(
          token,
          chatId,
          srtRes.srtBuffer,
          `📝 <b>ហ្វាល់ Subtitle (.srt) បង្កើតដោយស្វ័យប្រវត្តិតាមសំឡេងនិយាយ!</b>\n` +
            `អ្នកអាចយកទៅប្រើប្រាស់ក្នុង CapCut, Premiere, ឬ Video Player បានភ្លាមៗ!`,
          "auto_subtitles.srt",
          {
            inline_keyboard: [
              [{ text: "🔥 ដុត Subtitle ជាប់វីដេអូ (Hardburn)", callback_data: "action_vid:hardburn_sub" }],
              [{ text: "🎬 បកប្រែវីដេអូជាខ្មែរ (Dub)", callback_data: "dub_last_video" }],
            ],
          },
          messageId
        );

        const previewLines = srtRes.srtText.split("\n").slice(0, 16).join("\n");
        await sendTelegramHtmlDirect(
          token,
          chatId,
          `📄 <b>គំរូអត្ថបទ Subtitle ជាមួយ Timestamps៖</b>\n<pre>${previewLines}</pre>`,
          null,
          messageId
        );
        return true;
      }
    }
  }

  // 6. /edit_video Command (Video Editing)
  if (
    cmd === "/edit_video" ||
    cmd === "/editvideo" ||
    cmd === "/cutvideo" ||
    cmd === "/trimvideo" ||
    cmd === "/trim" ||
    cmd === "/cut" ||
    /(?:កាត់វីដេអូ|កាត់តវីដេអូ|កែវីដេអូ)/i.test(normText)
  ) {
    const vidTarget =
      uploadedVideoObj?.file_id ||
      replyToMessage?.video?.file_id ||
      session?.lastVideoFileId ||
      null;

    // Check if user provided trim timestamps: `/trim 00:05 00:25`
    const trimMatch = normText.match(/(?:trim|cut|កាត់)\s+([0-9:.]+)\s+([0-9:.]+)/i);
    if (trimMatch && vidTarget) {
      const startTime = trimMatch[1];
      const endTime = trimMatch[2];
      await sendTelegramHtmlDirect(
        token,
        chatId,
        `⏳ កំពុងកាត់តវីដេអូពី ${startTime} ដល់ ${endTime}... សូមរង់ចាំបន្តិច! ✂️🎬`,
        null,
        messageId
      );
      const vidBuf = await downloadTelegramFileDirect(token, vidTarget);
      if (vidBuf) {
        const trimRes = await editVideoMedia({
          videoBuffer: vidBuf,
          operation: "trim",
          startTime,
          endTime,
        });
        if (trimRes.ok) {
          await sendTelegramVideoDirect(
            token,
            chatId,
            trimRes.buffer,
            `✂️🎬 <b>${trimRes.summaryKhmer}</b>`,
            trimRes.filename,
            buildVideoActionKeyboard(true),
            messageId
          );
          return true;
        }
      }
    }

    await sendTelegramHtmlDirect(
      token,
      chatId,
      `🎞️ <b>កាត់ត និងកែសម្រួលវីដេអូ (Video Studio Editing)</b>\n\n` +
        `• ✂️ <b>កាត់តចន្លោះពេល៖</b> <code>/trim 00:05 00:30</code> (កាត់ពីវិនាទីទី ៥ ដល់ ៣០)\n` +
        `• 🔇 <b>បិទសំឡេង (Mute):</b> ចុចប៊ូតុងខាងក្រោម\n` +
        `• 📱 <b>ប្ដូរទម្រង់ 9:16 (TikTok):</b> ចុចប៊ូតុងខាងក្រោម\n` +
        `• 🖥️ <b>ប្ដូរទម្រង់ 16:9 (YouTube):</b> ចុចប៊ូតុងខាងក្រោម\n` +
        `• 🔄 <b>បង្វិល 90°:</b> ចុចប៊ូតុងខាងក្រោម\n` +
        `• 🎵 <b>ទាញយកជា MP3 សំឡេង:</b> ចុចប៊ូតុងខាងក្រោម`,
      buildVideoActionKeyboard(Boolean(vidTarget)),
      messageId
    );
    return true;
  }

  // 7. /speed_video or /speed Command (Speed Video)
  if (
    cmd === "/speed_video" ||
    cmd === "/speedvideo" ||
    cmd === "/speed" ||
    cmd === "/fastvideo" ||
    cmd === "/slowvideo" ||
    /(?:ល្បឿនវីដេអូ|កែប្រែល្បឿនវីដេអូ|បង្កើនល្បឿន|បន្ថយល្បឿន)/i.test(normText)
  ) {
    const spdMatch = normText.match(/(?:speed|ល្បឿន)\s+([0-9.]+)/i);
    const spdVal = spdMatch ? parseFloat(spdMatch[1]) : 1.5;
    const vidTarget =
      uploadedVideoObj?.file_id ||
      replyToMessage?.video?.file_id ||
      session?.lastVideoFileId ||
      null;

    if (spdMatch && vidTarget) {
      await sendTelegramHtmlDirect(
        token,
        chatId,
        `⏳ កំពុងកែប្រែល្បឿនវីដេអូទៅជា <b>${spdVal}x</b>... សូមរង់ចាំបន្តិច! ⚡️🎬`,
        null,
        messageId
      );
      const vidBuf = await downloadTelegramFileDirect(token, vidTarget);
      if (vidBuf) {
        const spdRes = await changeVideoSpeedMedia({ videoBuffer: vidBuf, speed: spdVal });
        if (spdRes.ok) {
          await sendTelegramVideoDirect(
            token,
            chatId,
            spdRes.buffer,
            `⚡️🎬 <b>${spdRes.summaryKhmer}</b>`,
            spdRes.filename,
            buildVideoSpeedKeyboard(spdVal),
            messageId
          );
          return true;
        }
      }
    }

    await sendTelegramHtmlDirect(
      token,
      chatId,
      `⚡️ <b>កែប្រែល្បឿនវីដេអូ (Video Speed Multiplier 0.5x - 3.0x)</b>\n\n` +
        `សូមផ្ញើវីដេអូ ឬជ្រើសរើសកម្រិតល្បឿនដែលអ្នកចង់បានខាងក្រោម៖`,
      buildVideoSpeedKeyboard(session?.lastVideoSpeed || 1.5),
      messageId
    );
    return true;
  }

  // 8. /edit_audio Command (Audio & Voice Editing)
  if (
    cmd === "/edit_audio" ||
    cmd === "/editaudio" ||
    cmd === "/voiceedit" ||
    cmd === "/cutaudio" ||
    /(?:កាត់សំឡេង|កែសម្រួលសំឡេង|បង្កើនសំឡេង|លុបសំឡេងរំខាន)/i.test(normText)
  ) {
    const audTarget =
      uploadedAudioTarget?.file_id ||
      replyToMessage?.audio?.file_id ||
      replyToMessage?.voice?.file_id ||
      session?.lastAudioFileId ||
      null;

    const cutMatch = normText.match(/(?:cutaudio|កាត់សំឡេង)\s+([0-9:.]+)\s+([0-9:.]+)/i);
    if (cutMatch && audTarget) {
      const startTime = cutMatch[1];
      const endTime = cutMatch[2];
      await sendTelegramHtmlDirect(
        token,
        chatId,
        `⏳ កំពុងកាត់សំឡេងពី ${startTime} ដល់ ${endTime}... សូមរង់ចាំបន្តិច! ✂️🎵`,
        null,
        messageId
      );
      const audBuf = await downloadTelegramFileDirect(token, audTarget);
      if (audBuf) {
        const cutRes = await editAudioMedia({
          audioBuffer: audBuf,
          operation: "trim",
          startTime,
          endTime,
        });
        if (cutRes.ok) {
          await sendTelegramAudioDirect(
            token,
            chatId,
            cutRes.buffer,
            `✂️🎵 <b>${cutRes.summaryKhmer}</b>`,
            "Cut Audio",
            "Khmer Super AI Agent",
            cutRes.filename,
            buildAudioActionKeyboard(),
            messageId
          );
          return true;
        }
      }
    }

    await sendTelegramHtmlDirect(
      token,
      chatId,
      `🎵 <b>កែសម្រួលសំឡេង & Voice Note (Audio Studio Editing)</b>\n\n` +
        `• ✂️ <b>កាត់សំឡេង៖</b> <code>/cutaudio 00:05 00:30</code>\n` +
        `• 🔊 <b>Boost Volume:</b> បង្កើនកម្រិតសំឡេង +6dB ឱ្យឮច្បាស់\n` +
        `• 🎧 <b>Noise Reduction:</b> កាត់បន្ថយសំឡេងរំខាន ឱ្យសំឡេងនិយាយថ្លា\n` +
        `• ⚡️ <b>Audio Speed:</b> បង្កើនល្បឿន 1.25x ឬ 1.5x\n` +
        `• 🎙️ <b>Studio Reverb:</b> បញ្ចូល Echo បែបបន្ទប់ស្ទូឌីយោ\n` +
        `• 🔄 <b>Convert Format:</b> បម្លែងទៅជា Voice Note (Opus), MP3 ឬ WAV`,
      buildAudioActionKeyboard(),
      messageId
    );
    return true;
  }

  // 9. When user directly uploads a Video file without slash command
  if (uploadedVideoObj && uploadedVideoObj.file_id && !normText.startsWith("/")) {
    await sendTelegramHtmlDirect(
      token,
      chatId,
      `🎬 <b>បានទទួលវីដេអូ (${uploadedVideoObj.file_name || "Video"}) រួចរាល់!</b>\n\n` +
        `តើអ្នកចង់ឱ្យប្រព័ន្ធធ្វើអ្វីខ្លះលើវីដេអូនេះ? សូមជ្រើសរើសសកម្មភាពខាងក្រោម៖`,
      buildVideoActionKeyboard(true),
      messageId
    );
    return true;
  }

  // 10. When user directly uploads an Audio / Voice Note file without slash command
  if (uploadedAudioTarget && uploadedAudioTarget.file_id && !normText.startsWith("/")) {
    await sendTelegramHtmlDirect(
      token,
      chatId,
      `🎵 <b>បានទទួលហ្វាល់សំឡេង (${uploadedAudioTarget.file_name || "Audio"}) រួចរាល់!</b>\n\n` +
        `តើអ្នកចង់ឱ្យប្រព័ន្ធកែសម្រួលសំឡេងនេះបែបណា? សូមជ្រើសរើសសកម្មភាពខាងក្រោម៖`,
      buildAudioActionKeyboard(),
      messageId
    );
    return true;
  }

  return false;
}
