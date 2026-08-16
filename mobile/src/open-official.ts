import { Linking } from "react-native";

export function isOfficialHttps(url: string): boolean {
  return url.startsWith("https://");
}

/** Opens GOV.UK and other official pages in the system browser — never an in-app WebView. */
export async function openOfficial(url: string): Promise<void> {
  if (!isOfficialHttps(url)) return;
  await Linking.openURL(url);
}
