import type { VaultItemMeta } from "./document-completeness";
import type { VaultDocKind } from "./document-extract";

const DB_NAME = "rtc-vault";
const STORE = "documents";
const KEY_STORAGE = "rtc-vault-key-v1";
const META_STORAGE = "rtc-vault-meta-v1";

export interface VaultRecord extends VaultItemMeta {
  ciphertext: string;
  iv: string;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function getOrCreateKey(): Promise<CryptoKey> {
  const existing = window.localStorage.getItem(KEY_STORAGE);
  if (existing) {
    return window.crypto.subtle.importKey(
      "raw",
      base64ToBytes(existing) as BufferSource,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"],
    );
  }
  const raw = window.crypto.getRandomValues(new Uint8Array(32));
  window.localStorage.setItem(KEY_STORAGE, bytesToBase64(raw));
  return window.crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encryptBytes(data: ArrayBuffer): Promise<{ ciphertext: string; iv: string }> {
  const key = await getOrCreateKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return { ciphertext: bytesToBase64(new Uint8Array(encrypted)), iv: bytesToBase64(iv) };
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function loadMeta(): VaultItemMeta[] {
  try {
    const raw = window.localStorage.getItem(META_STORAGE);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as VaultItemMeta[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMeta(items: VaultItemMeta[]) {
  window.localStorage.setItem(META_STORAGE, JSON.stringify(items));
}

export function listVaultMeta(): VaultItemMeta[] {
  if (typeof window === "undefined") return [];
  return loadMeta();
}

export async function addVaultFile(options: {
  file: File;
  kind: VaultDocKind;
  label: string;
  issueOn: string | null;
  expiresOn: string | null;
  last4: string | null;
}): Promise<VaultItemMeta> {
  const buffer = await options.file.arrayBuffer();
  const { ciphertext, iv } = await encryptBytes(buffer);
  const meta: VaultItemMeta = {
    id: crypto.randomUUID(),
    kind: options.kind,
    label: options.label,
    filename: options.file.name,
    issueOn: options.issueOn,
    expiresOn: options.expiresOn,
    last4: options.last4,
    addedOn: new Date().toISOString(),
    bytes: options.file.size,
  };
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({ ...meta, ciphertext, iv } satisfies VaultRecord);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  saveMeta([...loadMeta().filter((item) => item.id !== meta.id), meta]);
  return meta;
}

export async function removeVaultFile(id: string): Promise<void> {
  saveMeta(loadMeta().filter((item) => item.id !== id));
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* metadata already cleared */
  }
}

export function clearVault(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(META_STORAGE);
  window.localStorage.removeItem(KEY_STORAGE);
  window.indexedDB.deleteDatabase(DB_NAME);
}
