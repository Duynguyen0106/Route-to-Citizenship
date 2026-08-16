import { assessDocumentCompleteness } from "../document-completeness";
import { extractDocumentFields } from "../document-extract";
import { OBJECT_STORAGE_LIVE, OBJECT_STORAGE_REASON } from "../object-storage";

export const DOCUMENT_SERVICE = {
  id: "documents" as const,
  location: "on-device" as const,
  objectStorageLive: OBJECT_STORAGE_LIVE,
  objectStorageReason: OBJECT_STORAGE_REASON,
  note: "Paste-scan, encryption and completeness run on the device. Ciphertext is never posted to /api.",
  extract: extractDocumentFields,
  completeness: assessDocumentCompleteness,
};
