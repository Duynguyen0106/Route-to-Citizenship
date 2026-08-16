/** AES-GCM helpers for on-device encryption. Keys never leave the caller. */

export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function base64ToBytes(value: string): Uint8Array {
  if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(value, "base64"));
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export async function importAesGcmKey(
  raw: Uint8Array,
  cryptoObj: Crypto = globalThis.crypto,
): Promise<CryptoKey> {
  return cryptoObj.subtle.importKey("raw", raw as BufferSource, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function generateAesGcmKeyBytes(cryptoObj: Crypto = globalThis.crypto): Promise<Uint8Array> {
  return cryptoObj.getRandomValues(new Uint8Array(32));
}

export async function aesGcmEncrypt(
  data: BufferSource,
  key: CryptoKey,
  cryptoObj: Crypto = globalThis.crypto,
): Promise<{ iv: Uint8Array; ciphertext: Uint8Array }> {
  const iv = cryptoObj.getRandomValues(new Uint8Array(12));
  const encrypted = await cryptoObj.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return { iv, ciphertext: new Uint8Array(encrypted) };
}

export async function aesGcmDecrypt(
  ciphertext: Uint8Array,
  iv: Uint8Array,
  key: CryptoKey,
  cryptoObj: Crypto = globalThis.crypto,
): Promise<Uint8Array> {
  const plain = await cryptoObj.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    ciphertext as BufferSource,
  );
  return new Uint8Array(plain);
}
