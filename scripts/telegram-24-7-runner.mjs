import { handleTelegramWebhookUpdate, getConfiguredBotToken } from "../api/telegram-webhook.js";

const token = getConfiguredBotToken(process.env.TELEGRAM_BOT_TOKEN || "");
const keepAliveUrl = process.env.KEEPALIVE_URL || "";

async function run24x7Cycle() {
  if (keepAliveUrl) {
    try {
      await fetch(keepAliveUrl);
    } catch {}
  }

  if (!token || !token.includes(":")) {
    console.log("No TELEGRAM_BOT_TOKEN provided for standalone GitHub runner; exiting cleanly.");
    return;
  }

  // Run a continuous 4.5-minute polling cycle per scheduled GitHub Action run
  const endTime = Date.now() + 4.5 * 60 * 1000;
  let lastUpdateId = 0;

  // Check if webhook is already active (e.g. on Netlify/Vercel); if so, do not disturb the webhook!
  try {
    const whRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const whData = await whRes.json();
    if (whData.ok && whData.result?.url) {
      console.log(`24/7 Webhook is already active at ${whData.result.url} — pinging webhook health.`);
      await fetch(whData.result.url).catch(() => {});
      return;
    }
  } catch {}

  while (Date.now() < endTime) {
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=10`
      );
      if (res.status === 409) {
        // Another active server poller is already handling updates
        return;
      }
      const data = await res.json();
      if (data.ok && Array.isArray(data.result) && data.result.length > 0) {
        const maxId = Math.max(...data.result.map((u) => Number(u.update_id) || 0));
        if (maxId > lastUpdateId) {
          lastUpdateId = maxId;
          await fetch(
            `https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&limit=1&timeout=0`
          ).catch(() => {});
        }
        for (const update of data.result) {
          await handleTelegramWebhookUpdate(token, update);
        }
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 2000));
  }
}

run24x7Cycle();
