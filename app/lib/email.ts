import nodemailer from "nodemailer";

export async function sendEmail(to: string, subject: string, htmlContent: string) {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587, // 🚀 VERCEL SECURE PORT (Never drops connection)
      secure: false, 
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"ClawLink Global" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Email Engine Error:", error);
    return { success: false, error };
  }
}