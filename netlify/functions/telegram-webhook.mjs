import { handleTelegramWebhookUpdate } from "../../api/telegram-webhook.js";

const DEFAULT_BOT_TOKEN = "8926878273:AAFXUN5YteC0zvM-jCvwVsM-hNA4bAFUYJ8";

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const token =
    event.queryStringParameters?.token ||
    event.headers?.["x-telegram-bot-api-secret-token"] ||
    process.env.TELEGRAM_BOT_TOKEN ||
    DEFAULT_BOT_TOKEN;

  // On GET request (health check / ping), also verify and auto-bind webhook if hosted on cloud domain
  if (event.httpMethod === "GET") {
    const host = event.headers?.["x-forwarded-host"] || event.headers?.host || "";
    let webhookStatus = "ready";
    if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
      const webhookUrl = `https://${host}/api/telegram/webhook?token=${encodeURIComponent(token)}`;
      try {
        const whRes = await fetch(
          `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}&drop_pending_updates=true`
        );
        const whJson = await whRes.json();
        webhookStatus = whJson?.ok ? "auto-registered" : "failed";
      } catch {}
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        service: "Khmer Super AI Agent 24/7 Netlify Webhook",
        uptime: "24/7 Always-On Serverless (ដំណើរការរហូត ២៤ ម៉ោង ៧ ថ្ងៃ ទោះបិទ Browser ក៏ដោយ)",
        botUsername: "khmer123ai_bot",
        webhookStatus,
      }),
    };
  }

  try {
    const update = event.body ? JSON.parse(event.body) : null;
    await handleTelegramWebhookUpdate(token, update);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, error: err?.message }),
    };
  }
};
