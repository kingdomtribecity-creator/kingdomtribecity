import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const rawKey = process.env.INTEGRATIONS_ENCRYPTION_KEY;

export const integrationsConfigured = Boolean(rawKey && rawKey.length === 64);

const key = integrationsConfigured ? Buffer.from(rawKey!, "hex") : null;

/** Encrypts a secret for storage in Integration.secretsEncrypted. Format: iv:authTag:ciphertext (all hex). */
export function encryptSecret(plaintext: string): string {
  if (!key) throw new Error("INTEGRATIONS_ENCRYPTION_KEY is not configured.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
}

export function decryptSecret(stored: string): string {
  if (!key) throw new Error("INTEGRATIONS_ENCRYPTION_KEY is not configured.");
  const [ivHex, authTagHex, ciphertextHex] = stored.split(":");
  if (!ivHex || !authTagHex || !ciphertextHex) throw new Error("Malformed encrypted secret.");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, "hex")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
