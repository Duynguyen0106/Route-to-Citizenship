import { STORAGE_PLAN } from "./billing";
import { clearVault } from "./document-vault";
import { STORAGE_LOCALE } from "./i18n";
import { STORAGE_KEY } from "./storage";

/** Guest-only keys. Vault blobs never leave this browser. */
export function clearGuestBrowserData(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(STORAGE_PLAN);
  window.localStorage.removeItem(STORAGE_LOCALE);
  clearVault();
}
