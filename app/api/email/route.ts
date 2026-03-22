import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { to, subject, type, name, usage, limit } = await req.json();

    if (!to || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 🚀 SETUP NODEMAILER (Uses Gmail SMTP by default)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER || "", // Aapka Gmail
        pass: process.env.EMAIL_PASS || "", // Aapka Gmail App Password
      },
    });

    // 🎨 PREMIUM CLAWLINK HTML EMAIL TEMPLATES
    let htmlContent = "";
    
    if (type === "warning") {
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #07070A; color: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid #333;">
          <h2 style="color: #f97316; margin-bottom: 20px;">⚠️ High Usage Alert</h2>
          <p style="color: #cccccc; font-size: 16px;">Hello ${name || 'User'},</p>
          <p style="color: #cccccc; font-size: 16px;">Your ClawLink AI Agent has consumed <strong>${usage}</strong> out of <strong>${limit}</strong> monthly messages (80% Limit Reached).</p>
          <p style="color: #cccccc; font-size: 16px;">To ensure zero downtime for your customers, please upgrade your plan from the dashboard.</p>
          <a href="https://clawlink-six.vercel.app/dashboard" style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; margin-top: 20px;">Upgrade Plan Now</a>
          <p style="color: #666666; font-size: 12px; margin-top: 40px;">© 2026 ClawLink Inc. All rights reserved.</p>
        </div>
      `;
    } else if (type === "exhausted") {
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #07070A; color: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid #ef4444;">
          <h2 style="color: #ef4444; margin-bottom: 20px;">🛑 Plan Exhausted</h2>
          <p style="color: #cccccc; font-size: 16px;">Hello ${name || 'User'},</p>
          <p style="color: #cccccc; font-size: 16px;">Your ClawLink AI Agent has reached its 100% capacity (${limit} messages).</p>
          <p style="color: #cccccc; font-size: 16px;">We have activated the <strong>Customer Safe-Fallback mode</strong>. Your customers will now receive a scheduled maintenance message to protect your brand image.</p>
          <a href="https://clawlink-six.vercel.app/dashboard" style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; margin-top: 20px;">Renew / Upgrade Immediately</a>
          <p style="color: #666666; font-size: 12px; margin-top: 40px;">© 2026 ClawLink Inc. All rights reserved.</p>
        </div>
      `;
    }

    // SEND EMAIL
    await transporter.sendMail({
      from: `"ClawLink Enterprise" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject || "ClawLink AI Update",
      html: htmlContent,
    });

    return NextResponse.json({ success: true, message: "Email dispatched successfully" });

  } catch (error: any) {
    console.error("Email API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}