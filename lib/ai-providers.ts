import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { getIntegrationSecrets } from "@/lib/integrations";

const TEST_PROMPT = "Say hello in five words.";

export async function runTestCompletion(provider: string): Promise<string> {
  const found = await getIntegrationSecrets("AI", provider);
  if (!found) throw new Error(`${provider} is not configured yet — save an API key first.`);
  const { config, secrets } = found;
  if (!secrets.apiKey) throw new Error("API key is missing.");
  const model = config.model;
  if (!model) throw new Error("Choose a model first.");

  if (provider === "anthropic") {
    const client = new Anthropic({ apiKey: secrets.apiKey });
    const message = await client.messages.create({
      model,
      max_tokens: 50,
      messages: [{ role: "user", content: TEST_PROMPT }],
    });
    const block = message.content[0];
    return block?.type === "text" ? block.text : "(no text response)";
  }

  if (provider === "openai") {
    const client = new OpenAI({ apiKey: secrets.apiKey });
    const completion = await client.chat.completions.create({
      model,
      max_tokens: 50,
      messages: [{ role: "user", content: TEST_PROMPT }],
    });
    return completion.choices[0]?.message?.content ?? "(no text response)";
  }

  throw new Error(`Unknown AI provider "${provider}".`);
}
