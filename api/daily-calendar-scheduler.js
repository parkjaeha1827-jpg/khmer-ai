// ============================================================================
// AUTOMATIC DAILY TELEGRAM CALENDAR BROADCASTER & SCHEDULER (24/7 AUTO-RUNNER)
// Automatically sends the daily report (Solar & Lunar date, ថ្ងៃសីល,
// National & International holidays, Days off, Observances) every day
// without the user having to click or ask!
// ============================================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  getDailyCalendarComprehensiveData,
  formatDailyCalendarTelegramHtml,
  createComprehensiveCalendarSvgCard,
  getCambodiaTimeParts,
  toKhmerNumber,
} from "./khmer-calendar-engine.js";
import {
  getTelegramKnownContacts,
  sendTelegramSvgPhotoServer,
} from "./telegram-id-chat.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DAILY_CALENDAR_STORE_FILE = path.resolve(__dirname, "../.telegram-daily-calendar.json");

let dailyCalendarStore = {
  lastBroadcastDateIso: "",
  deliveredChatsByDate: {},
  autoBroadcastEnabled: true,
  preferredBroadcastHour: 6, // 06:30 AM Cambodia time
  preferredBroadcastMinute: 30,
};

function loadDailyCalendarStore() {
  try {
    if (fs.existsSync(DAILY_CALENDAR_STORE_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DAILY_CALENDAR_STORE_FILE, "utf-8"));
      if (raw && typeof raw === "object") {
        dailyCalendarStore = {
          ...dailyCalendarStore,
          ...raw,
        };
      }
    }
  } catch {}
}

function saveDailyCalendarStore() {
  try {
    // Keep only last 14 days of delivery history to avoid file growth
    const dateKeys = Object.keys(dailyCalendarStore.deliveredChatsByDate || {});
    if (dateKeys.length > 14) {
      dateKeys.sort();
      const pruned = {};
      dateKeys.slice(-14).forEach((k) => {
        pruned[k] = dailyCalendarStore.deliveredChatsByDate[k];
      });
      dailyCalendarStore.deliveredChatsByDate = pruned;
    }
    fs.writeFileSync(DAILY_CALENDAR_STORE_FILE, JSON.stringify(dailyCalendarStore, null, 2), "utf-8");
  } catch {}
}

loadDailyCalendarStore();

function getPublicAppBaseUrl() {
  return (
    process.env.APPLET_URL ||
    process.env.PUBLIC_URL ||
    "https://ais-dev-olfj5axr5tu3xswdlb7w73-447371415023.asia-southeast1.run.app"
  ).replace(/\/$/, "");
}

/**
 * Marks a specific chat as having received today's calendar notification
 */
export function markChatReceivedTodayCalendar(chatId, dateIso = "") {
  const todayIso = dateIso || getCambodiaTimeParts(new Date()).iso;
  if (!dailyCalendarStore.deliveredChatsByDate[todayIso]) {
    dailyCalendarStore.deliveredChatsByDate[todayIso] = [];
  }
  const idStr = String(chatId);
  if (!dailyCalendarStore.deliveredChatsByDate[todayIso].includes(idStr)) {
    dailyCalendarStore.deliveredChatsByDate[todayIso].push(idStr);
    dailyCalendarStore.lastBroadcastDateIso = todayIso;
    saveDailyCalendarStore();
  }
}

/**
 * Checks if a specific chat has already received today's daily calendar announcement
 */
export function hasChatReceivedTodayCalendar(chatId, dateIso = "") {
  const todayIso = dateIso || getCambodiaTimeParts(new Date()).iso;
  const delivered = dailyCalendarStore.deliveredChatsByDate[todayIso] || [];
  return delivered.includes(String(chatId));
}

/**
 * Sends the Comprehensive Daily Calendar Notification to a specific Telegram chat
 * Strictly ensures 1 single notification message per day for the current day!
 */
export async function sendDailyCalendarReportToChat(botToken, chatId, options = {}) {
  const token = String(botToken || process.env.TELEGRAM_BOT_TOKEN || "").trim();
  if (!token || !token.includes(":") || !chatId) return { ok: false, error: "Missing token or chatId" };

  const calData = getDailyCalendarComprehensiveData(options.date || new Date());
  const todayIso = calData.todayIso;

  // 1. Strict duplicate check: Send only 1 time per day for the current day unless explicitly forced
  if (!options.force && hasChatReceivedTodayCalendar(chatId, todayIso)) {
    return {
      ok: true,
      alreadyDelivered: true,
      todayIso,
      message: `ការជូនដំណឹងប្រតិទិនថ្ងៃ ${todayIso} បានផ្ញើរួចហើយ (ក្នុង ១ ថ្ងៃផ្ញើជូនតែម្ដងគត់)!`,
    };
  }

  const svgCard = createComprehensiveCalendarSvgCard(calData);

  const studioUrl = `${getPublicAppBaseUrl()}/?studio=calendar&tg_chat_id=${encodeURIComponent(
    String(chatId)
  )}`;

  const calKeyboard = {
    inline_keyboard: [
      [
        { text: "🪷 ពិនិត្យថ្ងៃសីលទាំងអស់", callback_data: "cal_filter_sil" },
        { text: "🔴 ថ្ងៃឈប់សម្រាកផ្លូវការ", callback_data: "cal_filter_holiday" },
      ],
      [
        { text: "🇰🇭 បុណ្យជាតិ", callback_data: "cal_filter_national" },
        { text: "🌍 ទិវាអន្តរជាតិ", callback_data: "cal_filter_international" },
      ],
      [
        {
          text: "🌐 បើកប្រតិទិនកម្ពុជាពេញលេញលើ Web",
          web_app: { url: studioUrl },
        },
      ],
    ],
  };

  const cleanSummary = String(calData.summaryNotificationBanner || "")
    .replace(/<[^>]+>/g, "")
    .trim();

  const holidaysToday = calData.todayEvents.filter(
    (e) =>
      e.type === "national_holiday" ||
      e.type === "international_holiday" ||
      e.type === "traditional_holiday" ||
      e.type === "buddhist_festival"
  );
  const observancesToday = calData.todayEvents.filter(
    (e) => e.type === "national_observance" || e.type === "international_observance"
  );

  // Single unified concise caption under 1000 characters (within Telegram photo caption limits)
  const captionLines = [
    `🇰🇭📅 <b>ប័ណ្ណប្រតិទិនកម្ពុជាប្រចាំថ្ងៃ (${calData.solar.solarFull})</b>`,
    `🌙 ចន្ទគតិ៖ <b>${calData.lunar.lunarFull}</b> (ដំណាក់កាល៖ <b>${calData.lunar.lunarPhaseKhmer}</b>)`,
    calData.sil.isTodaySilDay
      ? `🪷🔔 <b>ថ្ងៃនេះជា «ថ្ងៃសីល (${calData.sil.silType})»!</b> ${calData.sil.silDescription || ""}`
      : `🪷 <b>ថ្ងៃនេះមិនមែនជាថ្ងៃសីលទេ</b> (ថ្ងៃសីលបន្ទាប់៖ ${calData.sil.nextSilKhmerDate} នៅសល់ ${toKhmerNumber(calData.sil.daysUntilSil)} ថ្ងៃ)`,
    `🔴 ស្ថានភាពឈប់សម្រាក៖ <b>${calData.dayOffStatus}</b>`,
  ];

  if (holidaysToday.length > 0) {
    captionLines.push(
      `🇰🇭 <b>បុណ្យជាតិ-អន្តរជាតិថ្ងៃនេះ៖</b> ${holidaysToday.map((h) => h.titleKhmer).join(", ")}`
    );
  }
  if (observancesToday.length > 0) {
    captionLines.push(
      `🏛️ <b>ទិវាថ្ងៃនេះ៖</b> ${observancesToday.map((o) => o.titleKhmer).join(", ")}`
    );
  }
  if (cleanSummary) {
    captionLines.push(`\n📢 <i>${cleanSummary.slice(0, 160)}</i>`);
  }

  const singlePhotoCaption = captionLines.join("\n").slice(0, 1000);

  try {
    let sentSuccessfully = false;

    // Send only 1 single unified message: high-res SVG photo card with caption and keyboard
    try {
      sentSuccessfully = await sendTelegramSvgPhotoServer(
        token,
        chatId,
        svgCard,
        singlePhotoCaption,
        calKeyboard,
        options.replyToMessageId || null
      );
    } catch {}

    // Fall back to single text message if image generation/sending is not supported
    if (!sentSuccessfully) {
      const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: formatDailyCalendarTelegramHtml(calData),
          parse_mode: "HTML",
          reply_markup: calKeyboard,
        }),
      });
      const sendData = await sendRes.json().catch(() => ({}));
      sentSuccessfully = !!sendData?.ok;
    }

    // Mark as delivered for today to guarantee once per day execution
    if (sentSuccessfully) {
      markChatReceivedTodayCalendar(chatId, todayIso);
    }

    return { ok: sentSuccessfully, calData };
  } catch (err) {
    console.error("[DailyCalendarScheduler] Error sending to chat:", chatId, err);
    return { ok: false, error: err?.message || String(err) };
  }
}

let isBroadcasting = false;

/**
 * Runs Automated Daily Broadcast to known active Telegram chats
 * Strictly once per day during the morning of the current day!
 */
export async function runDailyCalendarBroadcastCycle(botToken, options = {}) {
  if (isBroadcasting) return { ok: false, reason: "Already running" };
  const token = String(botToken || process.env.TELEGRAM_BOT_TOKEN || "").trim();
  if (!token || !token.includes(":")) return { ok: false, reason: "No valid token" };

  const timeParts = getCambodiaTimeParts(new Date());
  const todayIso = timeParts.iso;

  // Once-per-day enforcement for automated broadcast
  if (!options.force && dailyCalendarStore.lastBroadcastDateIso === todayIso) {
    return {
      ok: true,
      count: 0,
      reason: `ការជូនដំណឹងប្រតិទិនថ្ងៃបច្ចុប្បន្ន (${todayIso}) ត្រូវបានផ្ញើរួចហើយ (ក្នុង ១ ថ្ងៃផ្ញើតែម្ដងគត់)!`,
    };
  }

  // Find all active chats known to the bot
  const knownContacts = getTelegramKnownContacts();
  if (!knownContacts || knownContacts.length === 0) {
    return { ok: true, count: 0, reason: "No known chats" };
  }

  const delivered = dailyCalendarStore.deliveredChatsByDate[todayIso] || [];
  const pendingChats = knownContacts.filter(
    (c) => c && c.chatId && !delivered.includes(String(c.chatId))
  );

  if (pendingChats.length === 0) {
    dailyCalendarStore.lastBroadcastDateIso = todayIso;
    saveDailyCalendarStore();
    return { ok: true, count: 0, reason: "All known chats already received today" };
  }

  isBroadcasting = true;
  console.log(
    `[DailyCalendarScheduler] Starting automatic once-per-day calendar broadcast for current day ${todayIso} to ${pendingChats.length} chats...`
  );

  let successCount = 0;
  for (const c of pendingChats) {
    try {
      const res = await sendDailyCalendarReportToChat(token, c.chatId, { force: options.force });
      if (res.ok && !res.alreadyDelivered) successCount++;
      // Polite pacing to avoid Telegram API rate limits
      await new Promise((r) => setTimeout(r, 600));
    } catch (err) {
      console.error("[DailyCalendarScheduler] Broadcast error for chat", c.chatId, err);
    }
  }

  isBroadcasting = false;
  dailyCalendarStore.lastBroadcastDateIso = todayIso;
  saveDailyCalendarStore();

  console.log(
    `[DailyCalendarScheduler] Finished daily calendar broadcast for ${todayIso}: ${successCount}/${pendingChats.length} delivered (1 time per day).`
  );

  return { ok: true, delivered: successCount, total: pendingChats.length };
}

/**
 * Starts the 24/7 Background Watcher / Auto-trigger
 * Strictly runs once per day in the morning (06:00 - 09:00 AM Cambodia time) for the current day!
 */
let schedulerIntervalId = null;

export function startDailyCalendarSchedulerWatcher(getTokenFn) {
  if (schedulerIntervalId) return;

  // Run check every 30 seconds
  schedulerIntervalId = setInterval(async () => {
    try {
      const token = typeof getTokenFn === "function" ? getTokenFn() : process.env.TELEGRAM_BOT_TOKEN;
      if (!token || !token.includes(":")) return;

      const timeParts = getCambodiaTimeParts(new Date());
      const todayIso = timeParts.iso;

      // 1. Strict check: If today's broadcast has already run, do NOT broadcast again today!
      if (dailyCalendarStore.lastBroadcastDateIso === todayIso) {
        return;
      }

      // 2. Strict morning check: Run once per day between 06:00 AM and 09:00 AM Cambodia time for the current day
      if (timeParts.hour >= 6 && timeParts.hour <= 9) {
        console.log(
          `[DailyCalendarScheduler] Running once-per-day calendar notification for current day ${todayIso}...`
        );
        await runDailyCalendarBroadcastCycle(token);
      }
    } catch (err) {
      console.error("[DailyCalendarScheduler] Watcher error:", err);
    }
  }, 30000);

  console.log("[DailyCalendarScheduler] 24/7 Daily Calendar Scheduler Watcher active (Once per day).");
}
