import { bytesToBase64 } from "./crypto/aes-gcm";

export const ENCRYPTED_OBJECT_SCHEMA = "route-to-citizenship.encrypted-object.v1";

/**
 * Object storage stays off. Vault files are encrypted on the device and never
 * uploaded. A future S3 bucket with client-side encryption would still need the
 * key to remain on the device — this prototype does not send ciphertext anywhere.
 */
export const OBJECT_STORAGE_LIVE = false;

export const OBJECT_STORAGE_REASON =
  "Document copies stay in this browser. AWS S3 is not connected. Client-side AES-GCM ciphertext is not uploaded, even if a bucket were configured.";

export interface ClientEncryptedObject {
  schema: typeof ENCRYPTED_OBJECT_SCHEMA;
  alg: "A256GCM";
  keyLocation: "client-only";
  iv: string;
  ciphertext: string;
  bytes: number;
}

export function wrapClientEncryptedObject(
  iv: Uint8Array,
  ciphertext: Uint8Array,
): ClientEncryptedObject {
  return {
    schema: ENCRYPTED_OBJECT_SCHEMA,
    alg: "A256GCM",
    keyLocation: "client-only",
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(ciphertext),
    bytes: ciphertext.byteLength,
  };
}

export async function putEncryptedObjectToS3(
  object: ClientEncryptedObject,
): Promise<{ stored: false; reason: string }> {
  return { stored: false, reason: `${OBJECT_STORAGE_REASON} (${object.schema})` };
}
