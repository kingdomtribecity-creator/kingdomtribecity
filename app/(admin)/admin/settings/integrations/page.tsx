import type { Metadata } from "next";
import { requireSuperAdmin } from "@/lib/rbac";
import { listIntegrations } from "@/lib/integrations";
import { integrationsConfigured } from "@/lib/crypto";
import { stripeConfigured } from "@/lib/stripe";
import {
  saveIntegrationAction,
  deleteIntegrationAction,
  testEmailAction,
  testSmsAction,
  testAiAction,
} from "@/lib/actions/admin-integrations";
import { IntegrationCard } from "@/components/admin/integration-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Integrations" };

const ANTHROPIC_MODELS = [
  { value: "claude-opus-4-8", label: "Claude Opus 4.8" },
  { value: "claude-sonnet-5", label: "Claude Sonnet 5" },
  { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
  { value: "claude-fable-5", label: "Claude Fable 5" },
];

export default async function AdminIntegrationsPage() {
  await requireSuperAdmin();

  const [email, payments, ai, sms] = await Promise.all([
    listIntegrations("EMAIL"),
    listIntegrations("PAYMENTS"),
    listIntegrations("AI"),
    listIntegrations("SMS"),
  ]);

  const byProvider = (rows: typeof email, provider: string) =>
    rows.find((r) => r.provider === provider) ?? null;

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Visible to Super Admins only. Keys are encrypted at rest and take effect immediately —
          no redeploy needed.
        </p>
        {!integrationsConfigured && (
          <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            INTEGRATIONS_ENCRYPTION_KEY isn&apos;t set — saving keys will fail until it&apos;s
            configured (generate one with <code>openssl rand -hex 32</code>).
          </p>
        )}
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Email</h2>
        <IntegrationCard
          title="Resend"
          description="API-key based transactional email — simplest option."
          fields={[
            { key: "apiKey", label: "API key", secret: true, placeholder: "re_..." },
            { key: "fromEmail", label: "From address", placeholder: "Kingdom Tribe City <hello@kingdomtribecity.org>" },
          ]}
          existing={byProvider(email, "resend")}
          saveAction={saveIntegrationAction.bind(null, "EMAIL", "resend")}
          deleteAction={
            byProvider(email, "resend")
              ? deleteIntegrationAction.bind(null, byProvider(email, "resend")!.id)
              : undefined
          }
          testAction={testEmailAction.bind(null, "resend")}
          testButtonLabel="Send test email"
        />
        <IntegrationCard
          title="Gmail"
          description="Send via a Gmail account using Google OAuth — create an OAuth Client ID in Google Cloud Console, then generate a Refresh Token for it (e.g. via Google's OAuth Playground) with the gmail.send scope."
          fields={[
            { key: "gmailUser", label: "Gmail address", placeholder: "you@gmail.com" },
            { key: "clientId", label: "OAuth Client ID", secret: true, placeholder: "xxxx.apps.googleusercontent.com" },
            { key: "clientSecret", label: "OAuth Client Secret", secret: true },
            { key: "refreshToken", label: "Refresh Token", secret: true },
            { key: "fromName", label: "From name (optional)", placeholder: "Kingdom Tribe City" },
          ]}
          existing={byProvider(email, "gmail")}
          saveAction={saveIntegrationAction.bind(null, "EMAIL", "gmail")}
          deleteAction={
            byProvider(email, "gmail")
              ? deleteIntegrationAction.bind(null, byProvider(email, "gmail")!.id)
              : undefined
          }
          testAction={testEmailAction.bind(null, "gmail")}
          testButtonLabel="Send test email"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Payments</h2>
        <Card className="border-border/60">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">Stripe</p>
                <p className="text-sm text-muted-foreground">
                  Configured via environment variables at deploy time (unchanged by this page).
                </p>
              </div>
              <Badge variant={stripeConfigured ? "default" : "secondary"}>
                {stripeConfigured ? "Configured" : "Not connected"}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <IntegrationCard
          title="Paystack"
          description="Powers Give and paid-course checkout alongside Stripe. Amount is charged in the smallest unit of the currency below (e.g. kobo for NGN)."
          fields={[
            { key: "secretKey", label: "Secret key", secret: true, placeholder: "sk_test_..." },
            { key: "publicKey", label: "Public key", placeholder: "pk_test_..." },
            { key: "currency", label: "Currency", placeholder: "NGN" },
          ]}
          existing={byProvider(payments, "paystack")}
          saveAction={saveIntegrationAction.bind(null, "PAYMENTS", "paystack")}
          deleteAction={
            byProvider(payments, "paystack")
              ? deleteIntegrationAction.bind(null, byProvider(payments, "paystack")!.id)
              : undefined
          }
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">AI</h2>
        <IntegrationCard
          title="Anthropic"
          description="Choose the Claude model used by AI-assisted features."
          fields={[
            { key: "apiKey", label: "API key", secret: true, placeholder: "sk-ant-..." },
            { key: "model", label: "Model", select: ANTHROPIC_MODELS },
          ]}
          existing={byProvider(ai, "anthropic")}
          saveAction={saveIntegrationAction.bind(null, "AI", "anthropic")}
          deleteAction={
            byProvider(ai, "anthropic")
              ? deleteIntegrationAction.bind(null, byProvider(ai, "anthropic")!.id)
              : undefined
          }
          testAction={testAiAction.bind(null, "anthropic")}
          testButtonLabel="Test model"
        />
        <IntegrationCard
          title="OpenAI"
          description="Choose the GPT model used by AI-assisted features."
          fields={[
            { key: "apiKey", label: "API key", secret: true, placeholder: "sk-..." },
            { key: "model", label: "Model", placeholder: "e.g. gpt-4o" },
          ]}
          existing={byProvider(ai, "openai")}
          saveAction={saveIntegrationAction.bind(null, "AI", "openai")}
          deleteAction={
            byProvider(ai, "openai")
              ? deleteIntegrationAction.bind(null, byProvider(ai, "openai")!.id)
              : undefined
          }
          testAction={testAiAction.bind(null, "openai")}
          testButtonLabel="Test model"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">SMS</h2>
        <IntegrationCard
          title="Termii"
          description="Sender ID must already be registered with Termii."
          fields={[
            { key: "apiKey", label: "API key", secret: true },
            { key: "senderId", label: "Sender ID", placeholder: "KingdomTC" },
          ]}
          existing={byProvider(sms, "termii")}
          saveAction={saveIntegrationAction.bind(null, "SMS", "termii")}
          deleteAction={
            byProvider(sms, "termii")
              ? deleteIntegrationAction.bind(null, byProvider(sms, "termii")!.id)
              : undefined
          }
          testAction={testSmsAction.bind(null, "termii")}
          testFields={[{ key: "to", label: "Test phone number", placeholder: "+234..." }]}
          testButtonLabel="Send test SMS"
        />
      </section>
    </div>
  );
}
