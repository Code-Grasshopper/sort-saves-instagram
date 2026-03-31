export function normalizeInstagramUrl(rawValue: string) {
  const value = rawValue.trim();
  if (!value) {
    return "";
  }

  const candidate =
    value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`;

  try {
    const parsed = new URL(candidate);
    parsed.hash = "";

    if (parsed.hostname.includes("instagram.com")) {
      parsed.search = "";
    }

    return parsed.toString();
  } catch {
    return value;
  }
}

export function extractUrlFromSharedText(value: string) {
  const match = value.match(/https?:\/\/[^\s]+/i);
  return match?.[0] ?? "";
}

export function isInstagramUrl(url: string) {
  try {
    return new URL(url).hostname.includes("instagram.com");
  } catch {
    return false;
  }
}
