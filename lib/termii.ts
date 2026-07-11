import { getIntegrationSecrets } from "@/lib/integrations";

export async function sendTestSms(provider: string, to: string): Promise<void> {
  if (provider !== "termii") throw new Error(`Unknown SMS provider "${provider}".`);

  const found = await getIntegrationSecrets("SMS", provider);
  if (!found) throw new Error("Termii is not configured yet — save an API key first.");
  const { config, secrets } = found;
  if (!secrets.apiKey) throw new Error("Termii API key is missing.");
  if (!config.senderId) throw new Error("Termii Sender ID is missing — set it in the config above.");

  const res = await fetch("https://api.ng.termii.com/api/sms/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to,
      from: config.senderId,
      sms: "This is a test message from Kingdom Tribe City Integrations settings.",
      type: "plain",
      channel: "generic",
      api_key: secrets.apiKey,
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || data?.code !== "ok") {
    throw new Error(data?.message || `Termii request failed (${res.status}).`);
  }
}
