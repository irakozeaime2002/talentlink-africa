import { Resend } from "resend";

const FROM = process.env.RESEND_FROM || "TalentLink Africa <onboarding@resend.dev>";

const STATUS_COLORS: Record<string, string> = {
  shortlisted: "#16a34a",
  reviewed:    "#2563eb",
  rejected:    "#dc2626",
  pending:     "#d97706",
};

const STATUS_LABELS: Record<string, string> = {
  shortlisted: "🎉 Congratulations — You've Been Shortlisted!",
  reviewed:    "📋 Your Application Has Been Reviewed",
  rejected:    "Thank You for Your Application",
  pending:     "✅ Application Received",
};

export async function sendPasswordResetEmail(email: string, name: string, resetUrl: string): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: FROM,
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

export async function sendStatusEmail(opts: {
  to: string;
  candidateName: string;
  jobTitle: string;
  status: string;
  customMessage?: string;
  recruiterName?: string;
}): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { to, candidateName, jobTitle, status, customMessage, recruiterName } = opts;
  const color = STATUS_COLORS[status] || "#4f46e5";
  const subject = STATUS_LABELS[status] || "Update on Your Application";

  const defaultMessages: Record<string, string> = {
    shortlisted: `We are pleased to inform you that after carefully reviewing your application for the <strong>${jobTitle}</strong> position, you have been shortlisted for the next stage of our selection process. Our team was impressed with your profile and we look forward to learning more about you. We will be in touch shortly with details about the next steps.`,
    reviewed: `Thank you for your patience. We have reviewed your application for the <strong>${jobTitle}</strong> position and your profile is currently under consideration. We appreciate the time and effort you put into your application and will update you as our process moves forward.`,
    rejected: `Thank you for your interest in the <strong>${jobTitle}</strong> position and for taking the time to apply. After careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current needs. We encourage you to apply for future opportunities that match your skills and experience.`,
    pending: `We have successfully received your application for the <strong>${jobTitle}</strong> position. Our team will review your profile and get back to you with an update. Thank you for your interest in joining our team.`,
  };

  const bodyText = customMessage || defaultMessages[status] || `Your application for <strong>${jobTitle}</strong> has been updated to: <strong>${status}</strong>.`;

  const html = `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 16px;background:#f9fafb;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="font-size:36px;">🌍</div>
    <h1 style="font-size:20px;font-weight:800;color:#1e1b4b;margin:6px 0 0;">TalentLink Africa</h1>
  </div>
  <div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <div style="background:${color};padding:24px 28px;">
      <h2 style="color:white;font-size:18px;font-weight:700;margin:0;">${subject}</h2>
    </div>
    <div style="padding:28px;">
      <p style="font-size:15px;color:#111827;margin:0 0 16px;">Dear <strong>${candidateName}</strong>,</p>
      <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 20px;">${bodyText}</p>
      ${recruiterName ? `<p style="font-size:13px;color:#6b7280;margin:0;">Best regards,<br><strong>${recruiterName}</strong><br>TalentLink Africa Recruitment Team</p>` : `<p style="font-size:13px;color:#6b7280;margin:0;">Best regards,<br><strong>TalentLink Africa Recruitment Team</strong></p>`}
    </div>
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 28px;text-align:center;">
      <p style="font-size:12px;color:#9ca3af;margin:0;">This email was sent via TalentLink Africa · <a href="https://linkafrica.vercel.app" style="color:#6b7280;">linkafrica.vercel.app</a></p>
    </div>
  </div>
</div>`;

  await resend.emails.send({ from: FROM, to, subject, html });
}
