// ============================================================================
// MP3 TO TELEGRAM VOICE NOTE CONVERTER (ប្ដូរពី MP3 ទៅជា Voice Note មាន Waveform)
// Converts any MP3, AAC, M4A, WAV, or audio file into native Telegram Voice
// message (OGG Opus, 48kHz, mono) with round waveform speech bubble.
// ============================================================================

import { spawn } from "child_process";
import { getConfiguredBotToken, sendTelegramHtml } from "./telegram-webhook.js";

/**
 * Checks if user text indicates intent to convert MP3 to Voice
 */
export function isMp3ToVoiceIntentServer(text = "") {
  const clean = String(text || "").trim();
  if (!clean) return false;

  // Slash commands
  if (/^\/(?:mp3tovoice|tovoice|audiotovoice|voiceconvert|mp3voice)\b/i.test(clean)) {
    return true;
  }
  if (/^\/voice\b/i.test(clean) && !clean.includes("live") && !clean.includes("setting")) {
    return true;
  }

  // Natural language in Khmer / English
  if (
    /(?:ប្ដូរ\s*(?:ពី\s*)?mp3\s*(?:ទៅជា|ទៅ|ជា)\s*voice|បម្លែង\s*mp3\s*(?:to|ទៅ|ជា)\s*voice|mp3\s*to\s*voice|ប្ដូរជា\s*voice|បម្លែងជា\s*voice\s*note|ប្ដូរ\s*សំឡេង\s*ទៅជា\s*voice|convert\s*(?:to\s*)?voice|audio\s*to\s*voice)/i.test(
      clean
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Converts any audio buffer (MP3, WAV, M4A, AAC, FLAC, OGG) to Telegram Voice Note format (OGG Opus)
 */
export function convertAudioBufferToTelegramVoiceOpus(inputBuffer) {
  if (!inputBuffer || inputBuffer.length < 200) return Promise.resolve(Buffer.alloc(0));

  return new Promise((resolve) => {
    try {
      const ff = spawn("ffmpeg", [
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        "pipe:0",
        "-c:a",
        "libopus",
        "-b:a",
        "64k",
        "-vbr",
        "on",
        "-compression_level",
        "10",
        "-application",
        "audio",
        "-ar",
        "48000",
        "-ac",
        "1",
        "-f",
        "ogg",
        "pipe:1",
      ]);

      const chunks = [];
      ff.stdout.on("data", (c) => chunks.push(c));
      ff.on("close", (code) => {
        if (code === 0 && chunks.length > 0) {
          resolve(Buffer.concat(chunks));
        } else {
          resolve(Buffer.alloc(0));
        }
      });
      ff.on("error", (err) => {
        console.error("[convertAudioBufferToTelegramVoiceOpus] FFmpeg error:", err);
        resolve(Buffer.alloc(0));
      });
      ff.stdin.on("error", () => {});
      ff.stdin.end(inputBuffer);
    } catch (err) {
      console.error("[convertAudioBufferToTelegramVoiceOpus] Exception:", err);
      resolve(Buffer.alloc(0));
    }
  });
}

/**
 * Sends converted Voice Note to Telegram chat using sendVoice API
 */
export async function sendTelegramConvertedVoiceMessage(token, chatId, oggBuffer, options = {}) {
  const effectiveToken = getConfiguredBotToken(token);
  if (!effectiveToken || !chatId || !oggBuffer || oggBuffer.length < 200) {
    return { ok: false, error: "Invalid buffer or parameters" };
  }

  const durationSec = options.duration ? Number(options.duration) : undefined;
  const replyToId = options.replyToMessageId ? Number(options.replyToMessageId) : undefined;
  const fileName = options.fileName || "voice-message.ogg";
  const caption =
    options.caption ||
    `🎙️✨ <b>បានបម្លែងពី MP3 ទៅជា Voice Note រួចរាល់!</b>\n` +
    `• ទម្រង់៖ <b>Telegram Voice Note (OGG Opus)</b>\n` +
    `• មានរលកសំឡេង Waveform អាចចាក់ស្ដាប់ និង Forward ដូច Voice សំឡេងផ្ទាល់! 🚀`;

  try {
    const vForm = new FormData();
    vForm.append("chat_id", String(chatId));
    if (replyToId) {
      vForm.append("reply_to_message_id", String(replyToId));
    }
    if (durationSec && durationSec > 0) {
      vForm.append("duration", String(Math.round(durationSec)));
    }
    vForm.append("caption", caption);
    vForm.append("parse_mode", "HTML");
    vForm.append(
      "voice",
      new Blob([new Uint8Array(oggBuffer)], { type: "audio/ogg" }),
      fileName
    );

    const res = await fetch(`https://api.telegram.org/bot${effectiveToken}/sendVoice`, {
      method: "POST",
      body: vForm,
    });
    const data = await res.json().catch(() => ({}));

    if (!data.ok) {
      console.error("[sendTelegramConvertedVoiceMessage] sendVoice error:", data);
      return { ok: false, error: data.description || "sendVoice failed" };
    }

    return { ok: true, result: data.result };
  } catch (err) {
    console.error("[sendTelegramConvertedVoiceMessage] Exception:", err);
    return { ok: false, error: err?.message || String(err) };
  }
}

/**
 * Downloads, converts, and sends an audio attachment as a Telegram Voice Note
 */
export async function processMp3ToVoiceConversion(
  token,
  chatId,
  audioBuffer,
  replyToMessageId = null,
  options = {}
) {
  const effectiveToken = getConfiguredBotToken(token);
  if (!audioBuffer || audioBuffer.length < 200) {
    await sendTelegramHtml(
      effectiveToken,
      chatId,
      "⚠️ មិនអាចបម្លែងបានទេ៖ ហ្វាល់ MP3 មិនត្រឹមត្រូវ ឬទទេ!"
    );
    return false;
  }

  // Send a temporary typing indicator or processing status
  const opusBuf = await convertAudioBufferToTelegramVoiceOpus(audioBuffer);
  if (!opusBuf || opusBuf.length < 200) {
    await sendTelegramHtml(
      effectiveToken,
      chatId,
      "⚠️ បរាជ័យក្នុងការបម្លែង MP3 ទៅជា Voice Note។ សូមសាកល្បងហ្វាល់ MP3 មួយផ្សេងទៀត!"
    );
    return false;
  }

  const sendRes = await sendTelegramConvertedVoiceMessage(effectiveToken, chatId, opusBuf, {
    replyToMessageId,
    duration: options.duration,
    fileName: options.fileName || "converted-voice.ogg",
    caption: options.caption,
  });

  return sendRes.ok;
}
