import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";
import type { IntegrationType } from "@/lib/generated/prisma/enums";

export type IntegrationSummary = {
  id: string;
  provider: string;
  enabled: boolean;
  config: Record<string, string>;
  hasSecrets: boolean;
  updatedAt: Date;
};

function toSummary(row: {
  id: string;
  provider: string;
  enabled: boolean;
  config: unknown;
  secretsEncrypted: string | null;
  updatedAt: Date;
}): IntegrationSummary {
  return {
    id: row.id,
    provider: row.provider,
    enabled: row.enabled,
    config: (row.config as Record<string, string>) ?? {},
    hasSecrets: Boolean(row.secretsEncrypted),
    updatedAt: row.updatedAt,
  };
}

/** All rows for a type (config only, no secrets) — for rendering the settings page. */
export async function listIntegrations(type: IntegrationType): Promise<IntegrationSummary[]> {
  const rows = await prisma.integration.findMany({ where: { type }, orderBy: { provider: "asc" } });
  return rows.map(toSummary);
}

/** A single row's config (no secrets) — null if never configured. */
export async function getIntegration(
  type: IntegrationType,
  provider: string
): Promise<IntegrationSummary | null> {
  const row = await prisma.integration.findUnique({ where: { type_provider: { type, provider } } });
  return row ? toSummary(row) : null;
}

/**
 * Decrypts and returns the secret key/value map (and config) for a provider, regardless of
 * `enabled` — used by "Test" actions, which should work before a provider is switched live.
 */
export async function getIntegrationSecrets(
  type: IntegrationType,
  provider: string
): Promise<{ config: Record<string, string>; secrets: Record<string, string> } | null> {
  const row = await prisma.integration.findUnique({ where: { type_provider: { type, provider } } });
  if (!row || !row.secretsEncrypted) return null;
  return {
    config: (row.config as Record<string, string>) ?? {},
    secrets: JSON.parse(decryptSecret(row.secretsEncrypted)) as Record<string, string>,
  };
}

/** The single enabled provider for an exclusive type (EMAIL/AI), with decrypted secrets. */
export async function getActiveIntegration(
  type: IntegrationType
): Promise<{ provider: string; config: Record<string, string>; secrets: Record<string, string> } | null> {
  const row = await prisma.integration.findFirst({ where: { type, enabled: true } });
  if (!row || !row.secretsEncrypted) return null;
  return {
    provider: row.provider,
    config: (row.config as Record<string, string>) ?? {},
    secrets: JSON.parse(decryptSecret(row.secretsEncrypted)) as Record<string, string>,
  };
}

/** All enabled providers for a non-exclusive type (PAYMENTS/SMS), config only (no secrets). */
export async function getEnabledIntegrations(type: IntegrationType): Promise<IntegrationSummary[]> {
  const rows = await prisma.integration.findMany({ where: { type, enabled: true } });
  return rows.map(toSummary);
}

export async function isIntegrationEnabled(type: IntegrationType, provider: string): Promise<boolean> {
  const row = await prisma.integration.findUnique({
    where: { type_provider: { type, provider } },
    select: { enabled: true, secretsEncrypted: true },
  });
  return Boolean(row?.enabled && row.secretsEncrypted);
}
