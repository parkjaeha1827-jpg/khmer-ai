import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { spawn } from "child_process";

// Ensure system font cache has access to Noto Sans Khmer
try {
  const homeFontDir = path.join(os.homedir(), ".fonts");
  if (!fs.existsSync(homeFontDir)) {
    fs.mkdirSync(homeFontDir, { recursive: true });
  }
  const localKhmerFont = path.resolve("./public/fonts/NotoSansKhmer.ttf");
  const destKhmerFont = path.join(homeFontDir, "NotoSansKhmer.ttf");
  if (fs.existsSync(localKhmerFont) && !fs.existsSync(destKhmerFont)) {
    fs.copyFileSync(localKhmerFont, destKhmerFont);
  }
} catch {}

export const SUBTITLE_COLOR_PRESETS = {
  tiktok_gold: {
    id: "tiktok_gold",
    labelKhmer: "✨ មាសរលោង (TikTok Gold)",
    highlightColor: "&H0000E5FF", // Vibrant golden yellow in BGR
    normalColor: "&H00FFFFFF",    // Crisp pure white
    outlineColor: "&H00090D16",   // Deep charcoal outline
  },
  neon_cyan: {
    id: "neon_cyan",
    labelKhmer: "💎 ខៀវពន្លឺ (Neon Cyan)",
    highlightColor: "&H00FFFF00", // Bright Cyan in BGR
    normalColor: "&H00FFFFFF",
    outlineColor: "&H000F172A",
  },
  flame_orange: {
    id: "flame_orange",
    labelKhmer: "🔥 ភ្លើងពណ៌ទឹកក្រូច (Flame Orange)",
    highlightColor: "&H002A7FFF", // Vivid orange in BGR
    normalColor: "&H00FFFFFF",
    outlineColor: "&H00000000",
  },
  emerald_green: {
    id: "emerald_green",
    labelKhmer: "🍀 បៃតងត្បូងមរកត (Emerald Green)",
    highlightColor: "&H0034D399", // Neon Emerald in BGR
    normalColor: "&H00FFFFFF",
    outlineColor: "&H00090D16",
  },
};

/**
 * Check if a text is a user command / prompt instruction rather than actual speech text
 */
export function isCommandOrInstruction(text) {
  if (!text) return true;
  const t = String(text).trim();
  if (/^\/(?:sub|subtitle|subtitles|karaoke|captions?|dub|translate|voice|speak)\b/i.test(t)) {
    return true;
  }
  if (
    /(?:សរសេរ|ដាក់|បន្ថែម|រត់|កុំ|សូម)?\s*(?:អក្សរ|កូដ|subtitle|sub|caption|karaoke)\s*(?:នៅ)?\s*(?:ខាងក្រោម|ក្រោម)?\s*(?:វីដេអូ|video)/i.test(
      t
    ) ||
    /(?:រត់តាមពាក្យ|រត់តាមសំឡេង|រត់តាមពាក្យនិយាយ|អក្សររត់|អក្សររត់ក្នុងវីដេអូ|រត់តាមពាក្យដែលក្នុងវីដេអូនិយាយ)/i.test(
      t
    ) ||
    /(?:កុំអោយដាច់ដៃដាច់ជើង|កុំឱ្យដាច់ដៃដាច់ជើង|មិនមែនបញ្ចូលសម្លេង|បញ្ចូលសម្លេងផ្ដេសផ្ដាស|ត្រឹមត្រូវតាមពាក្យច្បាស់លាស់)/i.test(
      t
    ) ||
    /(?:បកប្រែ\s*(?:សំឡេង|សម្លេង)?\s*(?:ក្នុង)?\s*វីដេអូ|សម្រាយ\s*រឿង)/i.test(t)
  ) {
    return true;
  }
  return false;
}

/**
 * Split Khmer & multilingual text into complete grammatical words
 * Strictly prevents severed subscripts (ជើង) and detached vowels ("កុំអោយដាច់ដៃដាច់ជើង")
 */
export function segmentTextIntoWords(text) {
  const clean = String(text || "").trim();
  if (!clean) return [];

  let rawSegments = [];
  try {
    const segmenter = new Intl.Segmenter("km", { granularity: "word" });
    rawSegments = Array.from(segmenter.segment(clean))
      .map((s) => s.segment.trim())
      .filter(Boolean);
  } catch {
    rawSegments = clean.split(/[\s\u200B]+/).map((w) => w.trim()).filter(Boolean);
  }

  if (rawSegments.length === 0) return [clean];

  const merged = [];

  // Khmer combining characters, dependent vowels, diacritics, and coeng (subscript mark)
  // Coeng: U+17D2
  // Dependent vowels: U+17B6..U+17C5
  // Diacritics: U+17C6..U+17D3, U+17D7, U+17DD
  const isCombiningOrOrphan = (str) =>
    /^[\u17B6-\u17C5\u17C6-\u17D3\u17D7\u17DD]/.test(str) || str.startsWith("\u17D2");

  const isPunctuation = (str) => /^[.,!?;:()«»"'“”។៕\s]+$/.test(str);

  for (let i = 0; i < rawSegments.length; i++) {
    const seg = rawSegments[i];
    if (!seg) continue;

    // If seg is orphan combining sign or coeng, attach to preceding token
    if (isCombiningOrOrphan(seg) && merged.length > 0) {
      merged[merged.length - 1] += seg;
    } else if (isPunctuation(seg) && merged.length > 0) {
      // Attach punctuation to the preceding word so it doesn't get isolated
      merged[merged.length - 1] += seg;
    } else {
      merged.push(seg);
    }
  }

  return merged.filter((w) => w && !isPunctuation(w));
}

/**
 * Format seconds into ASS subtitle timestamp format: H:MM:SS.cc
 */
export function formatAssTime(sec = 0) {
  const s = Math.max(0, Number(sec) || 0);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  const csecs = Math.floor((s % 1) * 100);
  return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(csecs).padStart(2, "0")}`;
}

/**
 * Generate Karaoke Animated Running Subtitles in ASS (Advanced SubStation Alpha) format
 * Uses \kf (karaoke smooth fill) tag to animate each word across the speech duration
 * Supports precise timestamped segments from speech-to-text recognition
 */
export function generateKaraokeAssSubtitles(scriptText, totalDurationSec, options = {}) {
  const width = Number(options.width) || 720;
  const height = Number(options.height) || 1280;
  const isPortrait = height >= width;

  const presetKey = options.preset || "tiktok_gold";
  const colors = SUBTITLE_COLOR_PRESETS[presetKey] || SUBTITLE_COLOR_PRESETS.tiktok_gold;

  // Adaptive font size & margin
  const baseScale = width / 720;
  const fontSize = options.fontSize || Math.round(isPortrait ? 38 * baseScale : 32 * baseScale);
  const marginV = options.marginV || Math.round(isPortrait ? 115 * (height / 1280) : 55 * (height / 720));
  const wordsPerLine = options.wordsPerLine || (isPortrait ? 5 : 8);
  const fontName = options.fontName || "Noto Sans Khmer";

  const dialogueLines = [];
  const getWordWeight = (w) => Math.max(1, w.length);

  // Mode A: High-Precision Timestamped Segments from Audio Transcription
  if (Array.isArray(options.segments) && options.segments.length > 0) {
    for (const seg of options.segments) {
      const segText = String(seg.text || "").trim();
      if (!segText) continue;

      const segWords = segmentTextIntoWords(segText);
      if (segWords.length === 0) continue;

      const segStart = Math.max(0, Number(seg.start) || 0);
      const segEnd = Math.max(segStart + 0.5, Number(seg.end) || segStart + 2.0);
      const segDuration = segEnd - segStart;

      // Group into lines if segment has many words
      const lines = [];
      let cur = [];
      for (const w of segWords) {
        cur.push(w);
        if (cur.length >= wordsPerLine || w.endsWith("។") || w.endsWith("!") || w.endsWith("?")) {
          lines.push([...cur]);
          cur = [];
        }
      }
      if (cur.length > 0) lines.push(cur);

      const totalWeight = lines.reduce(
        (acc, l) => acc + l.reduce((lacc, w) => lacc + getWordWeight(w), 0),
        0
      );

      let lineTime = segStart;
      for (const line of lines) {
        const lineWeight = line.reduce((acc, w) => acc + getWordWeight(w), 0);
        const lineDuration = (lineWeight / totalWeight) * segDuration;
        const lineStart = lineTime;
        const lineEnd = lineStart + lineDuration;

        let karaokeStr = "";
        for (let i = 0; i < line.length; i++) {
          const w = line[i];
          const wWeight = getWordWeight(w);
          const wDurationSec = (wWeight / lineWeight) * lineDuration;
          const wCentiseconds = Math.max(8, Math.round(wDurationSec * 100));
          karaokeStr += `{\\kf${wCentiseconds}}${w}${i < line.length - 1 ? " " : ""}`;
        }

        dialogueLines.push(
          `Dialogue: 0,${formatAssTime(lineStart)},${formatAssTime(lineEnd)},KaraokeWord,,0,0,0,,${karaokeStr}`
        );

        lineTime = lineEnd;
      }
    }
  }

  // Mode B: Proportional distribution over entire video duration if no segments
  if (dialogueLines.length === 0) {
    const rawWords = segmentTextIntoWords(scriptText);
    if (rawWords.length > 0) {
      const lines = [];
      let currentLine = [];
      for (const word of rawWords) {
        currentLine.push(word);
        if (
          currentLine.length >= wordsPerLine ||
          word.endsWith("។") ||
          word.endsWith("!") ||
          word.endsWith("?") ||
          word.endsWith(".")
        ) {
          lines.push([...currentLine]);
          currentLine = [];
        }
      }
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }

      const totalWeight = lines.reduce(
        (acc, line) => acc + line.reduce((lacc, w) => lacc + getWordWeight(w), 0),
        0
      );

      const duration = Math.max(1.5, Number(totalDurationSec) || 5.0);
      let currentTime = 0.15;
      const availableDuration = Math.max(1.0, duration - 0.35);

      for (const line of lines) {
        const lineWeight = line.reduce((acc, w) => acc + getWordWeight(w), 0);
        const lineDuration = (lineWeight / totalWeight) * availableDuration;
        const lineStart = currentTime;
        const lineEnd = lineStart + lineDuration;

        let karaokeStr = "";
        for (let i = 0; i < line.length; i++) {
          const w = line[i];
          const wWeight = getWordWeight(w);
          const wDurationSec = (wWeight / lineWeight) * lineDuration;
          const wCentiseconds = Math.max(8, Math.round(wDurationSec * 100));
          karaokeStr += `{\\kf${wCentiseconds}}${w}${i < line.length - 1 ? " " : ""}`;
        }

        dialogueLines.push(
          `Dialogue: 0,${formatAssTime(lineStart)},${formatAssTime(lineEnd)},KaraokeWord,,0,0,0,,${karaokeStr}`
        );

        currentTime = lineEnd;
      }
    }
  }

  return `[Script Info]
ScriptType: v4.00+
PlayResX: ${width}
PlayResY: ${height}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: KaraokeWord,${fontName},${fontSize},${colors.highlightColor},${colors.normalColor},${colors.outlineColor},&HA0000000,-1,0,0,0,100,100,0,0,1,4.2,2.8,2,36,36,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${dialogueLines.join("\n")}
`;
}

/**
 * Probe Video Stream Dimensions, Duration and Audio stream presence using ffprobe
 */
export function probeVideoDimensionsAndDuration(videoPath) {
  return new Promise((resolve) => {
    try {
      const p = spawn("ffprobe", [
        "-v",
        "error",
        "-show_entries",
        "stream=width,height,codec_type,duration:format=duration",
        "-of",
        "json",
        videoPath,
      ]);
      let out = "";
      p.stdout.on("data", (d) => (out += d.toString()));
      p.on("close", () => {
        try {
          const parsed = JSON.parse(out);
          const streams = parsed.streams || [];
          const videoStream = streams.find((s) => s.codec_type === "video") || {};
          const hasAudio = streams.some((s) => s.codec_type === "audio");
          const w = parseInt(videoStream.width, 10) || 720;
          const h = parseInt(videoStream.height, 10) || 1280;
          const dur =
            parseFloat(videoStream.duration || parsed.format?.duration) || 6.0;
          resolve({ width: w, height: h, duration: dur, hasAudio });
        } catch {
          resolve({ width: 720, height: 1280, duration: 6.0, hasAudio: true });
        }
      });
      p.on("error", () =>
        resolve({ width: 720, height: 1280, duration: 6.0, hasAudio: true })
      );
    } catch {
      resolve({ width: 720, height: 1280, duration: 6.0, hasAudio: true });
    }
  });
}

/**
 * Extract audio track from video buffer into an MP3 buffer
 */
export function extractAudioBufferFromVideo(videoBuffer) {
  return new Promise((resolve) => {
    const tmpDir = os.tmpdir();
    const id = crypto.randomBytes(4).toString("hex");
    const vPath = path.join(tmpDir, `ext_v_${id}.mp4`);
    const aPath = path.join(tmpDir, `ext_a_${id}.mp3`);

    fs.writeFileSync(vPath, videoBuffer);
    const p = spawn("ffmpeg", [
      "-y",
      "-i",
      vPath,
      "-vn",
      "-acodec",
      "libmp3lame",
      "-b:a",
      "128k",
      "-ar",
      "24000",
      "-t",
      "180",
      aPath,
    ]);

    p.on("close", (code) => {
      try {
        if (code === 0 && fs.existsSync(aPath)) {
          const buf = fs.readFileSync(aPath);
          fs.unlinkSync(vPath);
          fs.unlinkSync(aPath);
          resolve(buf);
          return;
        }
      } catch {}
      try { if (fs.existsSync(vPath)) fs.unlinkSync(vPath); } catch {}
      try { if (fs.existsSync(aPath)) fs.unlinkSync(aPath); } catch {}
      resolve(null);
    });
    p.on("error", () => {
      try { if (fs.existsSync(vPath)) fs.unlinkSync(vPath); } catch {}
      try { if (fs.existsSync(aPath)) fs.unlinkSync(aPath); } catch {}
      resolve(null);
    });
  });
}

/**
 * Transcribe Audio using Gemini API to get exact spoken words and timing
 * Strict verbatim accuracy: Never replaces speech or invents random words
 */
export async function transcribeAudioSpeechToKhmer(audioBuffer, durationSec = 6.0) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  if (!apiKey || !audioBuffer || audioBuffer.length < 500) {
    return {
      hasSpeech: false,
      transcriptKhmer: "",
      segments: [],
    };
  }

  const audioBase64 = audioBuffer.toString("base64");
  const prompt = `You are an expert verbatim speech-to-text transcriber for video subtitles.
Listen to the actual spoken audio in this file very carefully (duration: ${durationSec} seconds).

CRITICAL RULES:
1. Transcribe the EXACT words spoken by the human speaker in this audio.
2. If speech is in Khmer (ភាសាខ្មែរ):
   - Transcribe verbatim what is actually said.
   - Ensure 100% correct Khmer orthography, preserving intact words and syllables without broken consonants, severed subscripts (ជើង), or detached vowels.
   - Never hallucinate, invent, or output arbitrary sentences not present in the audio.
3. If speech is in a foreign language (English, Chinese, Thai, etc.):
   - Transcribe the speech and translate accurately into faithful Khmer subtitles matching what the speaker is saying.
4. If there is NO speech in the audio (only background music, sound effects, ambient noise, or silence):
   - Return: {"hasSpeech": false, "transcriptKhmer": "", "segments": []}
5. If there is speech:
   - Divide the speech into timestamped segments (each 1-5 seconds long) matching when each phrase/sentence was actually spoken.
   - Return:
   {
     "hasSpeech": true,
     "detectedLanguage": "Khmer / English / etc.",
     "transcriptKhmer": "Exact spoken Khmer transcript",
     "segments": [
       { "start": 0.5, "end": 3.2, "text": "ពាក្យដែលបាននិយាយ..." }
     ]
   }

Respond ONLY with valid JSON.`;

  const candidateModels = ["gemini-3.8-flash", "gemini-3.5-transcribe", "gemini-flash-latest"];

  for (const model of candidateModels) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { inlineData: { mimeType: "audio/mp3", data: audioBase64 } },
                  { text: prompt },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          }),
          signal: AbortSignal.timeout(16000),
        }
      );
      if (res.ok) {
        const j = await res.json();
        const raw = j?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
        if (parsed) {
          const transcript = String(parsed.transcriptKhmer || "").trim();
          const segments = Array.isArray(parsed.segments) ? parsed.segments : [];
          const hasSpeech = Boolean(parsed.hasSpeech && transcript);
          return {
            hasSpeech,
            transcriptKhmer: transcript,
            segments,
            detectedLanguage: parsed.detectedLanguage || "Khmer",
          };
        }
      }
    } catch {}
  }

  return {
    hasSpeech: false,
    transcriptKhmer: "",
    segments: [],
  };
}

/**
 * Burns Kinetic Running Karaoke Subtitles directly onto MP4 Video
 * Preserves 100% of the video's original audio without inserting artificial voice ("មិនមែនបញ្ចូលសម្លេងផ្ដេសផ្ដាស")
 */
export async function burnRunningSubtitlesToVideo(videoBuffer, scriptText, options = {}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "video_sub_"));
  const id = crypto.randomBytes(4).toString("hex");
  const inMp4Path = path.join(tmpDir, `in_${id}.mp4`);
  const assPath = path.join(tmpDir, `sub_${id}.ass`);
  const outMp4Path = path.join(tmpDir, `out_${id}.mp4`);

  try {
    fs.writeFileSync(inMp4Path, videoBuffer);

    // 1. Probe video stream dimensions, duration and audio presence
    const probe = await probeVideoDimensionsAndDuration(inMp4Path);
    const videoDuration = Math.max(1.5, probe.duration || 6.0);

    // 2. Determine actual speech script
    // If scriptText is empty or is a user command / prompt, transcribe from the audio itself!
    let finalScript = "";
    let finalSegments = [];
    const isCommand = isCommandOrInstruction(scriptText);

    if (!isCommand && scriptText && scriptText.trim().length > 0) {
      finalScript = scriptText.trim();
    } else {
      // Extract original audio from video
      const audBuf = await extractAudioBufferFromVideo(videoBuffer);
      if (audBuf) {
        const transcription = await transcribeAudioSpeechToKhmer(audBuf, videoDuration);
        if (transcription.hasSpeech && transcription.transcriptKhmer) {
          finalScript = transcription.transcriptKhmer;
          finalSegments = transcription.segments || [];
        }
      }
    }

    // If no speech was detected in video audio and no script was given
    if (!finalScript) {
      // Check if user quoted an explicit text in options.hint
      const quotedMatch = String(options.hint || "").match(/["«“]([^"»”]+)["»”]/);
      if (quotedMatch && quotedMatch[1].trim()) {
        finalScript = quotedMatch[1].trim();
      }
    }

    // If still no speech (e.g. video is purely music or silent), provide a polite clean indicator
    if (!finalScript) {
      return {
        ok: false,
        noSpeech: true,
        error: "វីដេអូនេះគ្មានសំឡេងមនុស្សនិយាយទេ (មានតែភ្លេង ឬស្ងាត់) ដូច្នេះមិនអាចបង្កើតអក្សររត់តាមពាក្យនិយាយបានឡើយ។",
      };
    }

    // 3. Generate Karaoke ASS Subtitles
    const assContent = generateKaraokeAssSubtitles(finalScript, videoDuration, {
      width: probe.width,
      height: probe.height,
      preset: options.preset || "tiktok_gold",
      marginV: options.marginV,
      segments: finalSegments,
    });
    fs.writeFileSync(assPath, assContent);

    // 4. Run FFmpeg to burn running subtitles
    // Keep 100% of the video's original audio without inserting artificial voice ("-c:a copy")!
    const ffmpegArgs = [
      "-y",
      "-i",
      inMp4Path,
      "-vf",
      `subtitles=${assPath}`,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "22",
      "-pix_fmt",
      "yuv420p",
    ];

    if (probe.hasAudio) {
      ffmpegArgs.push("-c:a", "copy");
    }

    ffmpegArgs.push("-movflags", "+faststart", outMp4Path);

    await new Promise((resolve, reject) => {
      const ff = spawn("ffmpeg", ffmpegArgs);

      let errLog = "";
      ff.stderr.on("data", (d) => (errLog += d.toString()));
      ff.on("close", (code) => {
        if (code === 0 && fs.existsSync(outMp4Path) && fs.statSync(outMp4Path).size > 1000) {
          resolve(true);
        } else {
          console.error("[burnRunningSubtitlesToVideo] FFmpeg failed code:", code, errLog);
          reject(new Error(`FFmpeg failed with code ${code}`));
        }
      });
      ff.on("error", (err) => reject(err));
    });

    const renderedBuffer = fs.readFileSync(outMp4Path);

    // Cleanup
    try {
      if (fs.existsSync(inMp4Path)) fs.unlinkSync(inMp4Path);
      if (fs.existsSync(assPath)) fs.unlinkSync(assPath);
      if (fs.existsSync(outMp4Path)) fs.unlinkSync(outMp4Path);
      fs.rmdirSync(tmpDir);
    } catch {}

    return {
      ok: true,
      buffer: renderedBuffer,
      duration: Math.round(videoDuration),
      script: finalScript,
      width: probe.width,
      height: probe.height,
    };
  } catch (err) {
    try {
      if (fs.existsSync(inMp4Path)) fs.unlinkSync(inMp4Path);
      if (fs.existsSync(assPath)) fs.unlinkSync(assPath);
      if (fs.existsSync(outMp4Path)) fs.unlinkSync(outMp4Path);
      fs.rmdirSync(tmpDir);
    } catch {}
    return { ok: false, error: err.message || "Failed to burn running subtitles" };
  }
}

/**
 * Check if user message is asking for video subtitles or running words in video
 */
export function isSubtitleVideoRequestServer(text, hasVideo = false) {
  const clean = String(text || "").trim();
  if (!clean && !hasVideo) return false;

  // Slash commands
  if (/^\/(?:sub|subtitle|subtitles|karaoke|captions?|អក្សររត់)\b/i.test(clean)) {
    return true;
  }

  // Natural language Khmer triggers
  const mentionsSubOrText =
    /(?:សរសេរ|ដាក់|បន្ថែម|រត់)?\s*(?:អក្សរ|កូដ|subtitle|sub|caption|karaoke)\s*(?:នៅ)?\s*(?:ខាងក្រោម|ក្រោម)?\s*(?:វីដេអូ|video)/i.test(
      clean
    ) ||
    /(?:រត់តាមពាក្យ|រត់តាមសំឡេង|រត់តាមពាក្យនិយាយ|អក្សររត់|អក្សររត់ក្នុងវីដេអូ|រត់តាមពាក្យដែលក្នុងវីដេអូនិយាយ)/i.test(
      clean
    ) ||
    /(?:កុំអោយដាច់ដៃដាច់ជើង|កុំឱ្យដាច់ដៃដាច់ជើង|មិនមែនបញ្ចូលសម្លេង|បញ្ចូលសម្លេងផ្ដេសផ្ដាស|ត្រឹមត្រូវតាមពាក្យច្បាស់លាស់)/i.test(
      clean
    );

  return mentionsSubOrText;
}

/**
 * Send interactive guide when user taps Subtitle menu without video
 */
export async function sendSubtitleInteractiveMenu(token, chatId) {
  const { getConfiguredBotToken, sendTelegramHtml } = await import("./telegram-webhook.js");
  const effectiveToken = getConfiguredBotToken(token);

  const guideHtml =
    `🎬✨ <b>មុខងារសរសេរអក្សរនៅខាងក្រោមវីដេអូ & រត់តាមពាក្យនិយាយ (Kinetic Karaoke Captions)</b>\n\n` +
    `• <b>គោលការណ៍ត្រឹមត្រូវ ១០០%៖</b>\n` +
    `  1. <b>ពាក្យពិតក្នុងវីដេអូ៖</b> AI ស្ដាប់សំឡេងជាក់ស្ដែង និងស្រង់យកពាក្យដែលបាននិយាយក្នុងវីដេអូពិតប្រាកដ ដោយ<b>រក្សាសំឡេងដើមរបស់វីដេអូ ១០០% មិនបញ្ចូលសំឡេងផ្ដេសផ្ដាសឡើយ!</b>\n` +
    `  2. <b>អក្សរត្រឹមត្រូវមិនដាច់ដៃដាច់ជើង៖</b> ប្រើប្រាស់ពុម្ពអក្សរផ្លូវការ Noto Sans Khmer មិនបែកស្រមោល ឬដាច់ជើងអក្សរឡើយ។\n` +
    `  3. <b>រត់រំលេចពណ៌តាមពាក្យនិយាយ៖</b> អក្សររត់រំលេចពណ៌ទៅមុខតាមចង្វាក់សំឡេងដែលកំពុងនិយាយក្នុងវីដេអូភ្លាមៗ។\n\n` +
    `🎨 <b>ម៉ូដពណ៌អក្សររត់ (Subtitle Styles)៖</b>\n` +
    `• ✨ <b>TikTok Gold:</b> អក្សរពណ៌ស រត់ភ្លឺពណ៌មាស (Gold Sweep)\n` +
    `• 💎 <b>Neon Cyan:</b> អក្សរពណ៌ស រត់ភ្លឺពណ៌ខៀវពន្លឺ\n` +
    `• 🔥 <b>Flame Orange:</b> អក្សរពណ៌ស រត់ភ្លឺពណ៌ទឹកក្រូច\n` +
    `• 🍀 <b>Emerald Green:</b> អក្សរពណ៌ស រត់ភ្លឺពណ៌បៃតងត្បូងមរកត\n\n` +
    `👉 <b>សូមផ្ញើហ្វាល់វីដេអូ (MP4) របស់អ្នកចូលមកកាន់ឆាតនេះឥឡូវនេះ ដើម្បីឱ្យ AI ដាក់អក្សររត់ជូនភ្លាមៗ!</b>`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "✨ TikTok Gold", callback_data: "sub_style:tiktok_gold" },
        { text: "💎 Neon Cyan", callback_data: "sub_style:neon_cyan" },
      ],
      [
        { text: "🔥 Flame Orange", callback_data: "sub_style:flame_orange" },
        { text: "🍀 Emerald Green", callback_data: "sub_style:emerald_green" },
      ],
      [
        { text: "🎬✨ បង្កើតវីដេអូរូបភាពនិយាយ (Talking Photo)", callback_data: "menu_talkingphoto" },
      ],
    ],
  };

  await sendTelegramHtml(effectiveToken, chatId, guideHtml, keyboard);
  return { ok: true };
}

/**
 * Send Video with Running Subtitles back to Telegram Chat
 */
export async function sendTelegramVideoWithRunningSubtitles(
  token,
  chatId,
  replyToMessageId,
  params = {}
) {
  const { getConfiguredBotToken, sendTelegramHtml } = await import("./telegram-webhook.js");
  const effectiveToken = getConfiguredBotToken(token);

  const { videoBuffer, videoUrl, userHint = "", preset = "tiktok_gold" } = params;

  await fetch(`https://api.telegram.org/bot${effectiveToken}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "upload_video" }),
  }).catch(() => {});

  let targetBuf = videoBuffer;
  if ((!targetBuf || targetBuf.length < 500) && videoUrl) {
    try {
      const vRes = await fetch(videoUrl, { signal: AbortSignal.timeout(15000) });
      if (vRes.ok) {
        targetBuf = Buffer.from(await vRes.arrayBuffer());
      }
    } catch {}
  }

  if (!targetBuf || targetBuf.length < 500) {
    await sendTelegramHtml(
      effectiveToken,
      chatId,
      "⚠️ មិនអាចទាញយកវីដេអូដើម្បីដាក់អក្សររត់បានទេ! សូមផ្ញើជាហ្វាល់វីដេអូ MP4 ផ្ទាល់មកកាន់ឆាតនេះ។"
    );
    return { ok: false };
  }

  // Notice: Do NOT pass userHint as scriptText if it is a command or prompt!
  const scriptToUse = isCommandOrInstruction(userHint) ? "" : userHint;

  const result = await burnRunningSubtitlesToVideo(targetBuf, scriptToUse, {
    preset,
    hint: userHint,
  });

  if (!result || !result.ok || !result.buffer) {
    const errorMsg =
      result?.error ||
      "⚠️ មិនអាចដាក់អក្សររត់លើវីដេអូនេះបានទេ! សូមប្រាកដថាវីដេអូមានសំឡេងមនុស្សនិយាយច្បាស់លាស់។";
    await sendTelegramHtml(effectiveToken, chatId, errorMsg);
    return { ok: false };
  }

  const form = new FormData();
  form.append("chat_id", String(chatId));
  if (replyToMessageId) form.append("reply_to_message_id", String(replyToMessageId));
  form.append("supports_streaming", "true");
  form.append(
    "caption",
    `🎬✨ <b>វីដេអូបានសរសេរអក្សរនៅខាងក្រោម & រត់តាមពាក្យនិយាយរួចរាល់!</b>\n` +
      `📝 <b>ពាក្យនិយាយជាក់ស្ដែង៖</b> «${String(result.script || "").slice(0, 300)}»\n` +
      `🔊 <b>សំឡេង៖</b> រក្សាសំឡេងដើមនៃវីដេអូ ១០០% (មិនបញ្ចូលសំឡេងផ្ដេសផ្ដាស)\n` +
      `🇰🇭 <b>អក្សរខ្មែរ៖</b> ត្រឹមត្រូវតាមក្បួនខ្នាត មិនដាច់ដៃដាច់ជើង\n` +
      `⏱️ រយៈពេល៖ ${result.duration} វិនាទី | 🎨 ម៉ូដ៖ ${SUBTITLE_COLOR_PRESETS[preset]?.labelKhmer || "TikTok Gold"}\n` +
      `✨ 100% Free & Fast by Khmer Super AI Bot`
  );
  form.append(
    "video",
    new Blob([new Uint8Array(result.buffer)], { type: "video/mp4" }),
    "video_running_subtitles.mp4"
  );

  await fetch(`https://api.telegram.org/bot${effectiveToken}/sendVideo`, {
    method: "POST",
    body: form,
  }).catch(() => {});

  return { ok: true };
}
