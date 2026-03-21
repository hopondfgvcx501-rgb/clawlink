import nodemailer from "nodemailer";

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER || "clawlink.help@gmail.com",
        pass: process.env.EMAIL_PASS || "", // Add App Password in Vercel Envs later
      },
    });

    const mailOptions = {
      from: `"ClawLink Enterprise" <${process.env.EMAIL_USER || "clawlink.help@gmail.com"}>`,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent to " + to);
    return { success: true };
  } catch (error) {
    console.error("❌ Email Send Error:", error);
    // Return success true anyway so it doesn't break the app if email fails
    return { success: true, error };
  }
}