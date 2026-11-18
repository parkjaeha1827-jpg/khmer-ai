// Automatically registers Telegram Webhook during cloud deployment build if URL is detected
const token =
  process.env.TELEGRAM_BOT_TOKEN || "8926878273:AAFXUN5YteC0zvM-jCvwVsM-hNA4bAFUYJ8";

async function main() {
  const siteUrl =
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    (process.env.SITE_NAME ? `https://${process.env.SITE_NAME}.netlify.app` : "");

  if (!siteUrl || !siteUrl.startsWith("https://")) {
    console.log("[Webhook Setup] No public HTTPS deployment URL detected during build, skipping.");
    return;
  }

  const webhookUrl = `${siteUrl}/api/telegram/webhook?token=${encodeURIComponent(token)}`;
  console.log(`[Webhook Setup] Registering 24/7 Webhook for @khmer123ai_bot at: ${webhookUrl}`);

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}&drop_pending_updates=true`
    );
    const data = await res.json();
    if (data.ok) {
      console.log("[Webhook Setup] Telegram Webhook registered successfully 24/7!");
    } else {
      console.warn("[Webhook Setup] Telegram response:", data.description);
    }
  } catch (err) {
    console.warn("[Webhook Setup] Warning:", err.message);
  }
}

main().catch(() => {});
