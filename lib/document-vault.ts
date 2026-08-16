import {
  aesGcmEncrypt,
  base64ToBytes,
  bytesToBase64,
  generateAesGcmKeyBytes,
  importAesGcmKey,
} from "./crypto/aes-gcm";
import type { VaultItemMeta } from "./document-completeness";
import type { VaultDocKind } from "./document-extract";
import { emit } from "./events/bus";
import { wrapClientEncryptedObject, putEncryptedObjectToS3 } from "./object-storage";

const DB_NAME = "rtc-vault";
const STORE = "documents";
const KEY_STORAGE = "rtc-vault-key-v1";
const META_STORAGE = "rtc-vault-meta-v1";

export interface VaultRecord extends VaultItemMeta {
  ciphertext: string;
  iv: string;
}

async function getOrCreateKey(): Promise<CryptoKey> {
  const existing = window.localStorage.getItem(KEY_STORAGE);
  if (existing) {
    return importAesGcmKey(base64ToBytes(existing), window.crypto);
  }
  const raw = await generateAesGcmKeyBytes(window.crypto);
  window.localStorage.setItem(KEY_STORAGE, bytesToBase64(raw));
  return importAesGcmKey(raw, window.crypto);
}

async function encryptBytes(data: ArrayBuffer): Promise<{ ciphertext: string; iv: string }> {
  const key = await getOrCreateKey();
  const { iv, ciphertext } = await aesGcmEncrypt(data, key, window.crypto);
  const wrapped = wrapClientEncryptedObject(iv, ciphertext);
  await putEncryptedObjectToS3(wrapped);
  return { ciphertext: wrapped.ciphertext, iv: wrapped.iv };
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
  emit("documents.processed", "documents", {
    kind: meta.kind,
    bytes: meta.bytes,
    onDevice: true,
    uploaded: false,
  });
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
