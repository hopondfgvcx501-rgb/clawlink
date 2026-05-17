/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: GLOBAL TELEGRAM ADMIN ALERT UTILITY
 * ==============================================================================================
 * @file lib/telegramAlert.ts
 * @description Provides a globally accessible, non-blocking utility to dispatch critical 
 * system alerts directly to the CTO/Admin Telegram client. Ensures failure transparency.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

export async function sendTelegramAdminAlert(message: string, context?: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.ADMIN_CHAT_ID;

  if (!botToken || !adminChatId) {
    console.warn("TELEGRAM ALERT FAILED: Bot token or Admin Chat ID is missing in environment variables.");
    return;
  }

  const formattedMessage = `🚨 *CLAWLINK SYSTEM ALERT*\n\n*Context:* ${context || "Global Backend"}\n*Message:* ${message}\n\n*Timestamp:* ${new Date().toISOString()}`;

  try {
    // Fire-and-forget network request to Telegram Bot API. 
    // We execute this asynchronously without strict awaiting to prevent main thread blocking.
    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: adminChatId,
        text: formattedMessage,
        parse_mode: "Markdown",
      }),
    }).catch((networkException) => {
      console.error("Non-blocking Telegram network execution failed:", networkException);
    });
  } catch (criticalException) {
    console.error("Critical failure in Telegram alert utility sequence:", criticalException);
  }
}