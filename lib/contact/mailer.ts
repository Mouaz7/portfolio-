import nodemailer from "nodemailer";

const {
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE,
  CONTACT_TO, CONTACT_SUBJECT, MAIL_FROM,
} = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT ?? 465),
  secure: (SMTP_SECURE ?? "true") !== "false",
  auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 20_000,
  disableFileAccess: true,
  disableUrlAccess: true,
});

type AttachmentIn = { name: string; type?: string; data: Buffer };

export async function sendContactMail(params: {
  name: string; email: string; message: string; attachments?: AttachmentIn[];
}) {
  if (!CONTACT_TO) throw new Error("CONTACT_TO is not set");

  const { name, email, message, attachments = [] } = params;

  await transporter.sendMail({
    to: CONTACT_TO!,
    from: MAIL_FROM || "Portfolio <no-reply@localhost>",
    replyTo: email,
    subject: CONTACT_SUBJECT || "Message from your portfolio page",
    text: `From: ${name} <${email}>\n\n${message}`,
    html: `
      <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
      <pre style="white-space:pre-wrap;font-family:ui-monospace,monospace">${escapeHtml(message)}</pre>
    `,
    attachments: attachments.map(a => ({
      filename: a.name,
      content: a.data,
      contentType: a.type,
      contentDisposition: "attachment",
    })),
    disableFileAccess: true,
    disableUrlAccess: true,
  });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]!));
}
