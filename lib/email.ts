import { Resend } from "resend";
import nodemailer from "nodemailer";
import { getIntegrationSecrets } from "@/lib/integrations";

export async function sendTestEmail(provider: string, to: string): Promise<void> {
  const found = await getIntegrationSecrets("EMAIL", provider);
  if (!found) throw new Error(`${provider} is not configured yet — save an API key first.`);
  const { config, secrets } = found;

  const subject = "Kingdom Tribe City — test email";
  const text = "This is a test email from your Kingdom Tribe City Integrations settings. If you received this, the connection works.";

  if (provider === "resend") {
    if (!secrets.apiKey) throw new Error("Resend API key is missing.");
    const resend = new Resend(secrets.apiKey);
    const from = config.fromEmail || "Kingdom Tribe City <onboarding@resend.dev>";
    const { error } = await resend.emails.send({ from, to, subject, text });
    if (error) throw new Error(error.message);
    return;
  }

  if (provider === "gmail") {
    if (!secrets.gmailUser || !secrets.gmailAppPassword) {
      throw new Error("Gmail address and app password are required.");
    }
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: secrets.gmailUser, pass: secrets.gmailAppPassword },
    });
    await transporter.sendMail({
      from: config.fromName ? `${config.fromName} <${secrets.gmailUser}>` : secrets.gmailUser,
      to,
      subject,
      text,
    });
    return;
  }

  throw new Error(`Unknown email provider "${provider}".`);
}
