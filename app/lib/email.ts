import nodemailer from "nodemailer";

export async function sendEmail(to: string, subject: string, htmlContent: string) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD, // Use Gmail App Password, not normal password
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