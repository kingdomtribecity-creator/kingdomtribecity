"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { sendTestEmail } from "@/lib/email";
import { sendTestSms } from "@/lib/termii";
import { runTestCompletion } from "@/lib/ai-providers";
import type { IntegrationType } from "@/lib/generated/prisma/enums";

/** Only one provider may be "live" at a time for these types — enabling one disables the others. */
const EXCLUSIVE_TYPES: IntegrationType[] = ["EMAIL", "AI"];

export async function saveIntegrationAction(type: IntegrationType, provider: string, formData: FormData) {
  const user = await requireSuperAdmin();

  const config: Record<string, string> = {};
  const newSecrets: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    const strValue = String(value).trim();
    if (!strValue) continue;
    if (key.startsWith("config_")) config[key.slice("config_".length)] = strValue;
    if (key.startsWith("secret_")) newSecrets[key.slice("secret_".length)] = strValue;
  }
  const enabled = formData.get("enabled") === "on";

  const existing = await prisma.integration.findUnique({ where: { type_provider: { type, provider } } });

  // Leaving a secret field blank keeps the previously-saved value for that key.
  let secretsEncrypted = existing?.secretsEncrypted ?? null;
  if (Object.keys(newSecrets).length > 0) {
    const priorSecrets = existing?.secretsEncrypted
      ? (JSON.parse(decryptSecret(existing.secretsEncrypted)) as Record<string, string>)
      : {};
    secretsEncrypted = encryptSecret(JSON.stringify({ ...priorSecrets, ...newSecrets }));
  }

  await prisma.$transaction(async (tx) => {
    if (enabled && EXCLUSIVE_TYPES.includes(type)) {
      await tx.integration.updateMany({
        where: { type, provider: { not: provider } },
        data: { enabled: false },
      });
    }
    await tx.integration.upsert({
      where: { type_provider: { type, provider } },
      update: { config, enabled, secretsEncrypted, updatedById: user.id },
      create: { type, provider, config, enabled, secretsEncrypted, updatedById: user.id },
    });
  });

  revalidatePath("/admin/settings/integrations");
}

export async function deleteIntegrationAction(id: string) {
  await requireSuperAdmin();
  await prisma.integration.delete({ where: { id } });
  revalidatePath("/admin/settings/integrations");
}

export type TestResult = { success: boolean; message: string } | undefined;

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong.";
}

export async function testEmailAction(
  provider: string,
  _prev: TestResult,
  _formData: FormData
): Promise<TestResult> {
  const user = await requireSuperAdmin();
  if (!user.email) return { success: false, message: "Your account has no email address to send to." };
  try {
    await sendTestEmail(provider, user.email);
    return { success: true, message: `Test email sent to ${user.email}.` };
  } catch (e) {
    return { success: false, message: errorMessage(e) };
  }
}

export async function testSmsAction(
  provider: string,
  _prev: TestResult,
  formData: FormData
): Promise<TestResult> {
  await requireSuperAdmin();
  const to = String(formData.get("to") ?? "").trim();
  if (!to) return { success: false, message: "Enter a phone number to send the test to." };
  try {
    await sendTestSms(provider, to);
    return { success: true, message: `Test SMS sent to ${to}.` };
  } catch (e) {
    return { success: false, message: errorMessage(e) };
  }
}

export async function testAiAction(
  provider: string,
  _prev: TestResult,
  _formData: FormData
): Promise<TestResult> {
  await requireSuperAdmin();
  try {
    const reply = await runTestCompletion(provider);
    return { success: true, message: reply };
  } catch (e) {
    return { success: false, message: errorMessage(e) };
  }
}
