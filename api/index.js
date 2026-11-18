// ============================================================================
// UNIVERSAL SERVERLESS API ROUTER FOR VERCEL & NETLIFY (/api/*)
// Handles /api/chat, /api/image, /api/tts, /api/telegram/status,
// /api/telegram/configure, /api/telegram/webhook, and /api/health 24/7!
// ============================================================================
import {
  handleTelegramWebhookUpdate,
  generateFastKhmerAiAnswer,
  generateKhmerTtsBufferFast,
  getConfiguredBotToken,
  normalizeKhmerText,
  analyzeIncomingFileSecurity,
  analyzeIncomingScamLinks,
  detectSocialVideoUrlServer,
  extractSocialMediaVideoAndAudio,
  convertBufferToMp3Server,
  removeCapcutWatermarkMp4Server,
  isOrthographyOrOcrRequestServer,
  checkOrthographyAndOcrServer,
  transcribeAudioBufferServer,
  getTelegramChatCompanionProfile,
  resolveServerVoiceGender,
  clearAllServerlessSessions,
  isWorldTranslationRequestServer,
  translateWorldLanguagesServer,
  isStoryGenerationRequestServer,
  generateIllustratedStoryServer,
  isDictionaryRequestServer,
  lookupVisualDictionaryServer,
  isCambodiaCalendarRequestServer,
  getCambodiaCalendarEventsServer,
  executeTelegramChatToIdServer,
  getTelegramKnownContacts,
  getTelegramKnownGroups,
  getTelegramIdChatLogs,
  getActiveAutonomousIdChats,
  stopAutonomousIdChatLoop,
  stopAllAutonomousIdChatLoops,
  ensureTelegramMenuCommandsRegistered,
  analyzeInappropriateOrObsceneServer,
  sendTelegramHtml,
  sendSingleKhmerVoice,
} from "./telegram-webhook.js";
import {
  SUBTITLE_COLOR_PRESETS,
  burnRunningSubtitlesToVideo,
} from "./video-subtitle-engine.js";
import { createTalkingPhotoVideo } from "./talking-photo-engine.js";

export async function processUniversalApiRequest({ method, pathName, query, headers, body }) {
  const cleanPath = String(pathName || "")
    .replace(/^\/\.netlify\/functions\/api/, "/api")
    .replace(/\?.*$/, "");

  // 1. Health Check
  if (cleanPath.endsWith("/health")) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        status: "24/7 Always-On Serverless Cloud",
        timestamp: new Date().toISOString(),
      }),
    };
  }

  // 2. Telegram Webhook (/api/telegram/webhook or /api/telegram-webhook)
  if (cleanPath.includes("/telegram/webhook") || cleanPath.includes("/telegram-webhook")) {
    if (method === "GET") {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ok: true,
          service: "Khmer Super AI Agent 24/7 Cloud Webhook",
          uptime: "24/7 Always-On",
        }),
      };
    }
    const token =
      query?.token ||
      headers?.["x-telegram-bot-api-secret-token"] ||
      getConfiguredBotToken();
    const update = typeof body === "string" && body ? JSON.parse(body) : body;
    await handleTelegramWebhookUpdate(token, update);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true }),
    };
  }

  // 3. Telegram Status (/api/telegram/status) — Also auto-registers 24/7 Webhook on Netlify/Vercel!
  if (cleanPath.endsWith("/telegram/status")) {
    const token = getConfiguredBotToken(query?.token);
    if (!token || !token.includes(":")) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: false }),
      };
    }

    try {
      const host = headers?.["x-forwarded-host"] || headers?.host || "";
      const proto = headers?.["x-forwarded-proto"] || "https";
      const isPublicCloudHost =
        host &&
        !host.includes("localhost") &&
        !host.includes("127.0.0.1") &&
        !host.includes(".run.app");

      const [meRes, whRes] = await Promise.all([
        fetch(`https://api.telegram.org/bot${token}/getMe`),
        fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`),
      ]);
      const meData = await meRes.json();
      const whData = await whRes.json();

      if (meData.ok && meData.result?.username) {
        // Automatically bind 24/7 Webhook to this Netlify/Vercel host if not already bound!
        if (isPublicCloudHost) {
          const targetWebhookUrl = `${proto}://${host}/api/telegram/webhook?token=${encodeURIComponent(
            token
          )}&v=2`;
          const currentWhUrl = whData?.result?.url || "";
          if (currentWhUrl !== targetWebhookUrl) {
            await fetch(
              `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(
                targetWebhookUrl
              )}&drop_pending_updates=true`
            ).catch(() => {});
          }
        }

        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            active: true,
            botUsername: meData.result.username,
            uptimeMode: "24/7 Always-On Cloud Webhook (ដំណើរការ ២៤ ម៉ោង / ៧ ថ្ងៃ ទោះបិទវេបសាយ ឬកុំព្យូទ័រ)",
          }),
        };
      }
    } catch {}

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: false }),
    };
  }

  // 4. Telegram Configure (/api/telegram/configure) — Sets 24/7 Cloud Webhook on Netlify/Vercel!
  if (cleanPath.endsWith("/telegram/configure")) {
    const parsedBody = typeof body === "string" && body ? JSON.parse(body) : body || {};
    const { token, action } = parsedBody;

    if (action === "stop") {
      const stopToken = getConfiguredBotToken(token);
      if (stopToken && stopToken.includes(":")) {
        await fetch(`https://api.telegram.org/bot${stopToken}/deleteWebhook`).catch(() => {});
      }
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: true, message: "បានបញ្ឈប់ Bot Telegram រួចរាល់" }),
      };
    }

    const cleanToken = String(token || "").trim() || getConfiguredBotToken();
    if (!cleanToken || !cleanToken.includes(":")) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Telegram Bot Token មិនត្រឹមត្រូវ! (ទម្រង់: 123456789:ABCDefG...)",
        }),
      };
    }

    try {
      const getMeRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
      const meData = await getMeRes.json();
      if (!meData.ok) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: meData.description || "Token មិនត្រឹមត្រូវ សូមពិនិត្យមើលក្នុង @BotFather",
          }),
        };
      }

      const host = headers?.["x-forwarded-host"] || headers?.host || "";
      const proto = headers?.["x-forwarded-proto"] || "https";
      if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
        const webhookUrl = `${proto}://${host}/api/telegram/webhook?token=${encodeURIComponent(
          cleanToken
        )}&v=2`;
        await fetch(
          `https://api.telegram.org/bot${cleanToken}/setWebhook?url=${encodeURIComponent(
            webhookUrl
          )}&drop_pending_updates=true`
        );
      }

      // Register Telegram commands menu & bottom-left Menu button (all capabilities in Menu panel)
      await ensureTelegramMenuCommandsRegistered(cleanToken);

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: true,
          bot: meData.result,
          message: `បានភ្ជាប់ @${meData.result.username} ជាមួយប្រព័ន្ធ 24/7 Cloud Webhook ដោយជោគជ័យ! Bot នឹងដំណើរការពេញ ២៤ ម៉ោង ៧ ថ្ងៃក្នុង ១ សប្ដាហ៍ ទោះបីបិទផ្ទាំងវេបសាយ ឬបិទកុំព្យូទ័រក៏ដោយ!`,
        }),
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: err?.message || "មិនអាចតភ្ជាប់ទៅ Telegram បានទេ" }),
      };
    }
  }

  // 4b. Telegram Chat-to-ID Endpoints (/api/telegram/chat-to-id, /api/telegram/id-chat-logs, /api/telegram/stop-auto-chat)
  if (cleanPath.endsWith("/telegram/chat-to-id")) {
    const parsedBody = typeof body === "string" && body ? JSON.parse(body) : body || {};
    const result = await executeTelegramChatToIdServer(parsedBody);
    return {
      statusCode: result.ok ? 200 : 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  }

  if (cleanPath.endsWith("/telegram/id-chat-logs")) {
    const targetChatId = query?.targetChatId || "";
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        logs: getTelegramIdChatLogs(targetChatId),
        contacts: getTelegramKnownContacts(),
        groups: getTelegramKnownGroups(),
        activeAutoLoops: getActiveAutonomousIdChats(),
      }),
    };
  }

  if (cleanPath.endsWith("/telegram/stop-auto-chat")) {
    const parsedBody = typeof body === "string" && body ? JSON.parse(body) : body || {};
    const targetChatId = String(parsedBody.targetChatId || "all").trim();
    if (targetChatId === "all") {
      stopAllAutonomousIdChatLoops();
    } else {
      stopAutonomousIdChatLoop(targetChatId);
    }
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        activeAutoLoops: getActiveAutonomousIdChats(),
      }),
    };
  }

  // 5. Fast TTS Endpoint (/api/tts) — Uses Google AI Studio & Custom Voice
  if (cleanPath.endsWith("/tts")) {
    const parsedBody = typeof body === "string" && body ? JSON.parse(body) : body || {};
    const text = String(parsedBody.text || "");
    const userGenderHint = String(parsedBody.userGender || "web_serverless_session");
    const voiceInfo = resolveServerVoiceGender(text, userGenderHint);
    const buf = await generateKhmerTtsBufferFast(text, userGenderHint);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        khmerAudio: buf.length > 0 ? buf.toString("base64") : "",
        englishAudio: "",
        khmerVoice: `${voiceInfo.voiceId} (${voiceInfo.voiceLabelKhmer})`,
        voiceLabel: voiceInfo.voiceLabelKhmer,
        isMaleVoice: voiceInfo.isMaleVoice,
        mimeType: "audio/mpeg",
      }),
    };
  }

  // 5b. Clear Chat History & Companion Memory Endpoint (/api/chat/clear)
  if (cleanPath.endsWith("/chat/clear")) {
    clearAllServerlessSessions();
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, cleared: true }),
    };
  }

  // 6. Image Generation / Editing Endpoint (/api/image)
  if (cleanPath.endsWith("/image")) {
    const parsedBody = typeof body === "string" && body ? JSON.parse(body) : body || {};
    const cleanPrompt = String(parsedBody.prompt || "Angkor Wat Cambodia")
      .replace(/^\/(image|edit|draw|gen)\s*/i, "")
      .trim();
    const seed = Math.floor(Math.random() * 900000) + 10000;
    const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      cleanPrompt + ", photorealistic 8k UHD, cinematic lighting"
    )}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux`;

    try {
      const r = await fetch(imgUrl, { signal: AbortSignal.timeout(14000) });
      if (r.ok) {
        const b = Buffer.from(await r.arrayBuffer());
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: { data: b.toString("base64"), mimeType: "image/jpeg" },
            description: `✨ នេះជារូបភាពដែលខ្ញុំបានបង្កើតជូនតាមការចង់បានរបស់អ្នក (${cleanPrompt})!`,
          }),
        };
      }
    } catch {}

    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800"><rect width="800" height="800" fill="#0f172a"/><circle cx="400" cy="340" r="150" fill="#fbbf24" opacity="0.85"/><path d="M120 620 L280 420 L400 540 L540 360 L680 620 Z" fill="#1e293b" stroke="#38bdf8" stroke-width="4"/></svg>`;
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: {
          data: Buffer.from(fallbackSvg, "utf-8").toString("base64"),
          mimeType: "image/svg+xml",
        },
        description: `✨ នេះជារូបភាពដែលខ្ញុំបានបង្កើតជូនតាមការចង់បានរបស់អ្នក (${cleanPrompt})!`,
      }),
    };
  }

  // 6b. Social Media Video & Audio Extractor (/api/download & /api/download/file)
  if (cleanPath.endsWith("/download/file")) {
    const targetUrl = String(query?.url || "");
    const format = String(query?.format || "mp4").toLowerCase() === "mp3" ? "mp3" : "mp4";
    const safeTitle = String(query?.title || "khmer_ai_media")
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .slice(0, 50) || "khmer_ai_media";

    if (!targetUrl || !targetUrl.startsWith("http")) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing valid media URL" }),
      };
    }

    try {
      const isFbCdn = /(?:fbcdn\.net|facebook\.com)/i.test(targetUrl);
      const upstream = await fetch(targetUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          Accept: "*/*",
          Referer: isFbCdn ? "https://www.facebook.com/" : "https://www.tiktok.com/",
          ...(isFbCdn
            ? {
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "none",
              }
            : {}),
        },
        redirect: "follow",
        signal: AbortSignal.timeout(25000),
      });

      if (upstream.ok) {
        let rawBuf = Buffer.from(await upstream.arrayBuffer());
        if (rawBuf.length > 500) {
          if (format === "mp3") {
            rawBuf = await convertBufferToMp3Server(rawBuf);
          } else {
            rawBuf = await removeCapcutWatermarkMp4Server(rawBuf, targetUrl);
          }
          return {
            statusCode: 200,
            headers: {
              "Content-Type": format === "mp3" ? "audio/mpeg" : "video/mp4",
              "Content-Disposition": `attachment; filename="${safeTitle}.${format}"`,
              "Content-Length": String(rawBuf.length),
              "Cache-Control": "public, max-age=3600",
            },
            body: rawBuf,
          };
        }
      }
    } catch {}

    return {
      statusCode: 302,
      headers: {
        Location: targetUrl,
        "Content-Disposition": `attachment; filename="${safeTitle}.${format}"`,
      },
      body: "",
    };
  }

  if (cleanPath.endsWith("/download")) {
    const parsedBody = typeof body === "string" && body ? JSON.parse(body) : body || {};
    const targetUrl = String(parsedBody.url || query?.url || "").trim();
    const format = String(parsedBody.format || query?.format || "both").toLowerCase();
    const result = await extractSocialMediaVideoAndAudio(targetUrl, format);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  }

  if (cleanPath.endsWith("/orthography/check")) {
    const parsedBody = typeof body === "string" && body ? JSON.parse(body) : body || {};
    const result = await checkOrthographyAndOcrServer({
      text: String(parsedBody.text || ""),
      imageBase64: String(parsedBody.imageBase64 || ""),
      mimeType: String(parsedBody.mimeType || "image/jpeg"),
      mode: String(parsedBody.mode || "auto"),
    });
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  }

  if (cleanPath.endsWith("/translate")) {
    const parsedBody = typeof body === "string" && body ? JSON.parse(body) : body || {};
    const result = await translateWorldLanguagesServer({
      text: String(parsedBody.text || ""),
      sourceLang: String(parsedBody.sourceLang || "auto"),
      targetLang: String(parsedBody.targetLang || "km"),
    });
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  }

  if (cleanPath.endsWith("/story/generate")) {
    const parsedBody = typeof body === "string" && body ? JSON.parse(body) : body || {};
    const result = await generateIllustratedStoryServer({
      prompt: String(parsedBody.prompt || ""),
      genre: String(parsedBody.genre || "auto"),
      episodeCount: Number(parsedBody.episodeCount) || 4,
    });
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  }

  if (cleanPath.endsWith("/dictionary/lookup")) {
    const parsedBody = typeof body === "string" && body ? JSON.parse(body) : body || {};
    const result = await lookupVisualDictionaryServer({
      word: String(parsedBody.word || ""),
      mode: String(parsedBody.mode || "all"),
    });
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  }

  if (cleanPath.endsWith("/calendar/cambodia")) {
    const parsedBody = typeof body === "string" && body ? JSON.parse(body) : body || {};
    const result = getCambodiaCalendarEventsServer({
      year: parsedBody.year || query?.year,
      month: parsedBody.month || query?.month,
      category: parsedBody.category || query?.category || "all",
      query: parsedBody.query || query?.query || "",
    });
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  }

  if (cleanPath.endsWith("/transcribe")) {
    const parsedBody = typeof body === "string" && body ? JSON.parse(body) : body || {};
    const audioData =
      parsedBody.audioData || parsedBody.audioBase64 || parsedBody.audio || "";
    const mimeType = parsedBody.mimeType || "audio/webm";
    const transcript = await transcribeAudioBufferServer(audioData, mimeType);
    const cleanTranscript =
      transcript === "[INAUDIBLE_SPEECH]" ? "" : normalizeKhmerText(transcript || "").trim();
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleanTranscript }),
    };
  }

  // 6c. Telegram Live Turn Sync (/api/telegram/live-turn)
  if (cleanPath.endsWith("/telegram/live-turn")) {
    const parsedBody = typeof body === "string" && body ? JSON.parse(body) : body || {};
    const { chatId, userSpokenText, botReplyText } = parsedBody;
    const token = getConfiguredBotToken();
    if (!chatId || !botReplyText || !token) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: false }),
      };
    }
    const formattedMsg =
      `🎙️ <b>[អ្នកនិយាយ Live Chat]៖</b> ${userSpokenText || "..."}\n\n` +
      `🤖 <b>[AI ឆ្លើយតបភ្លាមៗ]៖</b>\n${botReplyText}`;
    await Promise.all([
      sendTelegramHtml(token, chatId, formattedMsg),
      sendSingleKhmerVoice(token, chatId, botReplyText, true),
    ]).catch(() => {});
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true }),
    };
  }

  // 6d. Single-Pass Google Gemini Live Turn (/api/live-turn)
  if (cleanPath.endsWith("/live-turn")) {
    const parsedBody = typeof body === "string" && body ? JSON.parse(body) : body || {};
    const audioData =
      parsedBody.audioData || parsedBody.audioBase64 || parsedBody.audio || "";
    const mimeType = parsedBody.mimeType || "audio/webm";
    const browserHint = String(
      parsedBody.browserHint || parsedBody.textHint || ""
    ).trim();
    const historyMessages = Array.isArray(parsedBody.messages)
      ? parsedBody.messages
      : Array.isArray(parsedBody.history)
      ? parsedBody.history
      : [];

    let heardTranscript = "";
    if (audioData && String(audioData).length >= 120) {
      const tr = await transcribeAudioBufferServer(audioData, mimeType);
      if (tr === "[INAUDIBLE_SPEECH]" && !browserHint) {
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ok: true, isSilent: true, transcript: "", replyText: "" }),
        };
      }
      if (tr && tr !== "[INAUDIBLE_SPEECH]") {
        heardTranscript = normalizeKhmerText(tr).trim();
      }
    }
    if (!heardTranscript && browserHint) {
      heardTranscript = normalizeKhmerText(browserHint).trim();
    }
    if (!heardTranscript) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: true, isSilent: true, transcript: "", replyText: "" }),
      };
    }

    const modCheck = analyzeInappropriateOrObsceneServer(heardTranscript);
    let rawReply = "";
    if (modCheck.isInappropriate && modCheck.reprimandReplyKhmer) {
      rawReply = `[AUTO_DELETE_VIOLATION]\n${modCheck.reprimandReplyKhmer}`;
    } else {
      rawReply = await generateFastKhmerAiAnswer(
        heardTranscript,
        historyMessages,
        null,
        null,
        "web_serverless_session"
      );
    }

    const shouldDeleteUserMessage =
      Boolean(modCheck.isInappropriate) ||
      /\[AUTO_DELETE_VIOLATION\]/i.test(rawReply) ||
      /(?:ការទប់ស្កាត់\s*លុបចោលជាបន្ទាន់|លុបចោលជាបន្ទាន់\s*\(Deleted\s*Immediately\))/i.test(
        rawReply
      );
    const finalReplyText = normalizeKhmerText(
      rawReply.replace(/\[AUTO_DELETE_VIOLATION\]\s*/gi, "")
    ).trim();
    const ttsBuf = await generateKhmerTtsBufferFast(
      finalReplyText,
      "web_serverless_session"
    ).catch(() => Buffer.alloc(0));
    const audioB64 = ttsBuf && ttsBuf.length > 100 ? ttsBuf.toString("base64") : "";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        isSilent: false,
        deleteUserMessage: shouldDeleteUserMessage,
        transcript: heardTranscript,
        replyText: finalReplyText,
        audioBase64: audioB64,
        tts: audioB64
          ? {
              khmerAudio: audioB64,
              englishAudio: "",
            }
          : null,
      }),
    };
  }

  // 7. Chat Endpoint (/api/chat) — Supports SSE streaming format expected by universalClient.ts!
  if (cleanPath.endsWith("/chat")) {
    const parsedBody = typeof body === "string" && body ? JSON.parse(body) : body || {};
    const messages = Array.isArray(parsedBody.messages) ? parsedBody.messages : [];
    const lastMsg = messages[messages.length - 1] || {};
    const lastText = String(lastMsg.text || "");
    const lastImage = lastMsg.image || null;
    const lastAudio = lastMsg.audio || null;

    // Check for malicious file or scam link first
    const inlineFileMatch = lastText.match(
      /([^\s"'<>`|]+\.(?:apk|xapk|exe|scr|msi|bat|cmd|vbs|js|ps1|hta|reg|lnk|zip|rar|7z|iso|docm|xlsm|pptm|dmg|pkg|sh))\b/i
    );
    if (inlineFileMatch) {
      const sec = analyzeIncomingFileSecurity(inlineFileMatch[1]);
      if (sec.isDangerous) {
        const warnText =
          `### 🛡️ ប្រព័ន្ធការពារសន្តិសុខ និងប្រឆាំង File Hack របស់ជនឆបោក\n\n` +
          `• 😠 **ការស្ដីបន្ទោស និងព្រមានដាច់ខាត៖** ⛔ ហាមចុចទាញយក ឬបើកហ្វាល់ "${sec.fileName}" នេះដាច់ខាត!\n\n` +
          `• 📝 **ព័ត៌មានហ្វាល់គ្រោះថ្នាក់៖** ${sec.category}\n\n` +
          `• 📐 **មូលហេតុដែលហ្វាល់នេះជា File Hack៖** ${sec.reason}\n\n` +
          `• 🔢 **ផលវិបាកប្រសិនបើច្រឡំចុចបើក៖** ${sec.danger}\n\n` +
          `• 🎯 **ដូចនេះ៖** សូមលុបហ្វាល់នេះចោលភ្លាមៗដើម្បីការពារគណនី Telegram និងធនាគាររបស់អ្នក!`;
        const sse = `data: ${JSON.stringify({ text: warnText })}\n\ndata: ${JSON.stringify({ done: true })}\n\n`;
        return {
          statusCode: 200,
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache",
          },
          body: sse,
        };
      }
    }

    const scamCheck = analyzeIncomingScamLinks(lastText);
    if (scamCheck.isScamLink && scamCheck.warningReportKhmer) {
      const sse = `data: ${JSON.stringify({ text: scamCheck.warningReportKhmer })}\n\ndata: ${JSON.stringify({ done: true })}\n\n`;
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache",
        },
        body: sse,
      };
    }

    // Check for YouTube, TikTok, or Facebook video download link
    const detectedSocial = detectSocialVideoUrlServer(lastText);
    if (detectedSocial) {
      const media = await extractSocialMediaVideoAndAudio(
        detectedSocial.url,
        detectedSocial.requestedFormat
      );
      if (media.ok && (media.mp4Url || media.mp3Url)) {
        const safeTitle = String(media.title || `${media.platformLabel} Media`).trim();
        const safeAuthor = String(media.author || media.platformLabel).trim();
        const profile = getTelegramChatCompanionProfile("web_serverless_session");
        const isUserFemale = profile.userGender === "female";
        const userCall = isUserFemale
          ? profile.userName
            ? `អូន${profile.userName}`
            : "អូនសម្លាញ់"
          : profile.userName
          ? `បង${profile.userName}`
          : "បងសម្លាញ់";
        const selfName = isUserFemale ? "បង" : "អូន";
        const politeParticle = isUserFemale ? "បាទអូន" : "ចាសបង";
        const payload = encodeURIComponent(
          JSON.stringify({
            platform: media.platform,
            platformLabel: media.platformLabel,
            sourceUrl: media.sourceUrl,
            title: safeTitle,
            author: safeAuthor,
            duration: media.duration || "",
            thumbnail: media.thumbnail || "",
            mp4Url: media.mp4Url,
            mp3Url: media.mp3Url,
            directMp4Url: media.mp4Url,
            directMp3Url: media.mp3Url,
            requestedFormat: media.requestedFormat,
          })
        );
        const dlMarkdown =
          `### 📥 ប្រព័ន្ធទាញយកវីដេអូ និងសំឡេង (${media.platformLabel} MP4 & MP3 Downloader)\n\n` +
          `${politeParticle}សម្លាញ់! 💖 ${selfName}បានទាញយកវីដេអូ និងសំឡេងចេញពី **${media.platformLabel}** ជាប្រភេទ **MP4 (រូបភាពច្បាស់ HD)** និង **MP3 (សំឡេងច្បាស់ពិរោះល្អឮ)** ជូន${userCall}រួចរាល់ហើយណា៎! 🥰 ${userCall}អាចចុចមើល ស្ដាប់ ឬចុចប៊ូតុងទាញយក (Download) ខាងក្រោមនេះបានភ្លាមៗតែម្ដង! ចុះ${userCall}ចូលចិត្តស្ដាប់បទភ្លេង ឬមើលវីដេអូបែបហ្នឹងមែនទេ? ប្រាប់${selfName}ផងមើល៍ កុំឱ្យ${selfName}ចេះតែលួចញញឹមតែម្នាក់ឯងណា៎! 😊\n\n` +
          `• 📝 **ចំណងជើងវីដេអូ៖** ${safeTitle}\n` +
          `• 👤 **ម្ចាស់ឆានែល / គណនី៖** ${safeAuthor}${media.duration ? ` | ⏱️ រយៈពេល៖ ${media.duration}` : ""}\n` +
          `• 🎬 **ប្រភេទហ្វាល់ដែលទាញយកបាន៖** វីដេអូ **MP4 (HD)** និង សំឡេង **MP3 (Crystal Clear Audio)**\n\n` +
          `\`\`\`media-downloader\n${payload}\n\`\`\``;
        const sse = `data: ${JSON.stringify({ text: dlMarkdown })}\n\ndata: ${JSON.stringify({ done: true })}\n\n`;
        return {
          statusCode: 200,
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache",
          },
          body: sse,
        };
      }
    }

    if (isDictionaryRequestServer(lastText)) {
      const dictData = await lookupVisualDictionaryServer({ word: lastText, mode: "all" });
      if (dictData && dictData.ok) {
        const isAskingKhmerToEnglish =
          /អង់គ្លេសថាមិច|ភាសាអង់គ្លេសថាមិច|ជាភាសាអង់គ្លេស|in\s+english/i.test(lastText) ||
          (/[\u1780-\u17FF]/.test(dictData.word) && !/[a-zA-Z]/.test(dictData.word));
        const isAskingEnglishToKhmer =
          /ភាសាខ្មែរថាមិច|ខ្មែរថាមិច|ប្រែខ្មែរ|in\s+khmer/i.test(lastText) ||
          (/[a-zA-Z]/.test(dictData.word) && !/[\u1780-\u17FF]/.test(dictData.word));
        const directBanner = isAskingKhmerToEnglish
          ? `🎯 **ចម្លើយបកប្រែច្បាស់ៗ (ខ្មែរ ➔ អង់គ្លេស)៖** ពាក្យ **«${dictData.khmerWord || dictData.word}»** ភាសាអង់គ្លេសហៅថា **«${dictData.englishWord}»**\n` +
            `🔊 **សំឡេងអានឱ្យត្រូវតុង (Tone & Pronunciation)៖** \`${dictData.englishIpa || ""}\` — អានថា៖ **«${dictData.englishToneGuideKhmer || dictData.pronunciation}»**\n\n`
          : isAskingEnglishToKhmer
          ? `🎯 **ចម្លើយបកប្រែច្បាស់ៗ (អង់គ្លេស ➔ ខ្មែរ)៖** ពាក្យ **«${dictData.englishWord || dictData.word}»** ភាសាខ្មែរប្រែថា **«${dictData.khmerWord}»**\n` +
            `🔊 **សំឡេងអានឱ្យត្រូវតុង (Tone & Pronunciation)៖** អង់គ្លេសអានថា **«${dictData.englishToneGuideKhmer || dictData.pronunciation}»** (\`${dictData.englishIpa || ""}\`) • ខ្មែរអានថា **«${dictData.khmerPronunciation || dictData.khmerWord}»**\n\n`
          : "";
        const dictMd =
          `📚 **វចនានុក្រមឆ្លាតវៃ ៣ ប្រភេទ — ពាក្យ៖ «${dictData.word}»**\n\n` +
          directBanner +
          `• 🔤 **ថ្នាក់ពាក្យ៖** ${dictData.partOfSpeech} | 🗣️ **សំឡេងអាន៖** \`${dictData.pronunciation}\`\n` +
          `• 🇰🇭 **វចនានុក្រម ខ្មែរ-ខ្មែរ (សម្ដេចព្រះសង្ឃរាជ ជួន ណាត)៖** ${dictData.chuonNathDefinition || dictData.khmerToKhmer}\n` +
          `• 🇬🇧➡️🇰🇭 **អង់គ្លេស ➔ ខ្មែរ៖** **${dictData.englishWord || dictData.word}** = **${dictData.khmerWord || ""}** (${dictData.englishToKhmer})\n` +
          `• 🇰🇭➡️🇬🇧 **ខ្មែរ ➔ អង់គ្លេស៖** **${dictData.khmerWord || dictData.word}** = **${dictData.englishWord || ""}** (${dictData.khmerToEnglish})\n` +
          `• 📝 **ឧទាហរណ៍៖** ${(dictData.examples || []).join(" / ")}\n\n` +
          `\`\`\`dictionary-card\n${JSON.stringify(dictData)}\n\`\`\``;
        const sse = `data: ${JSON.stringify({ text: dictMd })}\n\ndata: ${JSON.stringify({ done: true })}\n\n`;
        return {
          statusCode: 200,
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache",
          },
          body: sse,
        };
      }
    }

    const modCheck = analyzeInappropriateOrObsceneServer(lastText);
    if (modCheck.isInappropriate && modCheck.reprimandReplyKhmer) {
      const sseMod = `data: ${JSON.stringify({
        text: normalizeKhmerText(modCheck.reprimandReplyKhmer),
        deleteUserMessage: true,
      })}\n\ndata: ${JSON.stringify({ done: true })}\n\n`;
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
        },
        body: sseMod,
      };
    }

    const answer = await generateFastKhmerAiAnswer(
      lastText,
      messages.slice(0, -1),
      lastImage,
      lastAudio
    );
    const shouldAutoDelete =
      /\[AUTO_DELETE_VIOLATION\]/i.test(answer) ||
      /(?:ការទប់ស្កាត់\s*លុបចោលជាបន្ទាន់|លុបចោលជាបន្ទាន់\s*\(Deleted\s*Immediately\))/i.test(
        answer
      );
    const cleanAnswer = normalizeKhmerText(
      String(answer || "").replace(/\[AUTO_DELETE_VIOLATION\]\s*/gi, "")
    ).trim();
    const sseBody = `data: ${JSON.stringify({
      text: cleanAnswer,
      ...(shouldAutoDelete ? { deleteUserMessage: true } : {}),
    })}\n\ndata: ${JSON.stringify({ done: true })}\n\n`;
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
      body: sseBody,
    };
  }

  // Subtitle Style Presets
  if (cleanPath.endsWith("/video-subtitle/presets")) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, presets: SUBTITLE_COLOR_PRESETS }),
    };
  }

  // Video Subtitle Generation
  if (cleanPath.endsWith("/video-subtitle/generate")) {
    try {
      const parsedBody = typeof body === "string" && body ? JSON.parse(body) : body || {};
      const { videoBase64, videoUrl, scriptText, preset } = parsedBody;
      let targetBuf = null;
      if (videoBase64) {
        targetBuf = Buffer.from(videoBase64.replace(/^data:video\/\w+;base64,/, ""), "base64");
      } else if (videoUrl) {
        const resp = await fetch(videoUrl, { signal: AbortSignal.timeout(15000) });
        if (resp.ok) targetBuf = Buffer.from(await resp.arrayBuffer());
      }
      if (!targetBuf || targetBuf.length < 500) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ok: false, error: "No valid video buffer or URL provided" }),
        };
      }
      const result = await burnRunningSubtitlesToVideo(targetBuf, scriptText, { preset });
      if (!result || !result.ok || !result.buffer) {
        return {
          statusCode: 500,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ok: false, error: result?.error || "Failed to burn running subtitles" }),
        };
      }
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ok: true,
          videoBase64: `data:video/mp4;base64,${result.buffer.toString("base64")}`,
          duration: result.duration,
          script: result.script,
        }),
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: false, error: err?.message }),
      };
    }
  }

  // Talking Photo AI Video Generation
  if (cleanPath.endsWith("/talking-photo/generate")) {
    try {
      const parsedBody = typeof body === "string" && body ? JSON.parse(body) : body || {};
      const { imageBase64, text, gesture, voiceGender, subtitlePreset } = parsedBody;
      const imgBuf = imageBase64
        ? Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ""), "base64")
        : null;
      const result = await createTalkingPhotoVideo(imgBuf, text, {
        gesture: gesture || "sampeah",
        voiceGender: voiceGender || "female",
        subtitlePreset: subtitlePreset || "tiktok_gold",
      });
      if (!result || !result.ok || !result.buffer) {
        return {
          statusCode: 500,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ok: false, error: "Failed to generate talking photo video" }),
        };
      }
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ok: true,
          duration: result.duration,
          videoBase64: `data:video/mp4;base64,${result.buffer.toString("base64")}`,
        }),
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: false, error: err?.message }),
      };
    }
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, service: "Khmer Super AI Agent 24/7 Cloud API" }),
  };
}

// Default export for Vercel Serverless Function (/api/index.js)
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const result = await processUniversalApiRequest({
      method: req.method,
      pathName: req.url || "/api",
      query: req.query || {},
      headers: req.headers || {},
      body: req.body,
    });

    for (const [k, v] of Object.entries(result.headers || {})) {
      res.setHeader(k, v);
    }
    return res.status(result.statusCode || 200).send(result.body);
  } catch (err) {
    return res.status(200).json({ ok: true, error: err?.message });
  }
}
