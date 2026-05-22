/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: OMNI-CHANNEL INFRASTRUCTURE ALERT MATRIX
 * ==============================================================================================
 * @description Centralized error transmission system. Captures failures across WhatsApp, 
 * Telegram, and Instagram, delivering highly detailed reports to the CEO's Telegram.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

export interface AlertContext {
    module: string;
    channel: "whatsapp" | "telegram" | "instagram" | "system";
    userEmail?: string;
    userName?: string;
    details?: string;
}

export async function dispatchAdminAlert(errorMsg: string, context: AlertContext): Promise<void> {
    const TG_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TG_ADMIN_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (!TG_BOT_TOKEN || !TG_ADMIN_ID) {
        console.warn("[ADMIN_ALERT_DISABLED]: Telegram credentials missing in environment variables.");
        return;
    }

    let channelIcon = "⚙️";
    if (context.channel === "whatsapp") channelIcon = "🟢";
    if (context.channel === "telegram") channelIcon = "🔵";
    if (context.channel === "instagram") channelIcon = "🟣";

    const timestamp = new Date().toISOString();
    const formattedMessage = `
🚨 <b>CLAWLINK CRITICAL ALERT</b> 🚨

<b>Channel:</b> ${channelIcon} ${context.channel.toUpperCase()}
<b>Module:</b> ${context.module}
<b>Client Name:</b> ${context.userName || "Unknown"}
<b>Client Email:</b> ${context.userEmail || "System-Wide"}
<b>Time (UTC):</b> ${timestamp}

<b>Error Trace:</b>
<pre>${errorMsg}</pre>

${context.details ? `<b>Extra Details:</b>\n${context.details}` : ""}
    `;

    try {
        const response = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: TG_ADMIN_ID,
                text: formattedMessage,
                parse_mode: "HTML"
            }),
        });

        if (!response.ok) {
            const errData = await response.json();
            console.error("[TELEGRAM_DISPATCH_FAILED]:", errData);
        }
    } catch (networkError) {
        console.error("[TELEGRAM_NETWORK_ERROR]: Failed to transmit alert.", networkError);
    }
}