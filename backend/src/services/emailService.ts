import { Resend } from "resend";

export async function sendPasswordResetEmail(email: string, name: string, resetUrl: string): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM || "TalentLink Africa <onboarding@resend.dev>";

  await resend.emails.send({
    from,
    to: email,
    subject: "Reset your TalentLink Africa password",
    html: [
      '<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:16px;">',
      '<div style="text-align:center;margin-bottom:24px;">',
      '<div style="font-size:40px;">&#127757;</div>',
      '<h1 style="font-size:22px;font-weight:800;color:#1e1b4b;margin:8px 0 0;">TalentLink Africa</h1>',
      "</div>",
      '<div style="background:white;border-radius:12px;padding:28px;">',
      '<h2 style="font-size:18px;font-weight:700;color:#111827;margin:0 0 8px;">Hi ' + name + ",</h2>",
      '<p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">',
      "We received a request to reset your password. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.",
      "</p>",
      '<a href="' + resetUrl + '" style="display:block;text-align:center;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;font-weight:700;font-size:15px;padding:14px 24px;border-radius:10px;text-decoration:none;">',
      "Reset Password",
      "</a>",
      '<p style="color:#9ca3af;font-size:12px;margin:20px 0 0;text-align:center;">',
      "If you didn't request this, you can safely ignore this email.",
      "</p>",
      "</div>",
      "</div>",
    ].join(""),
  });
}
