// HMAC-SHA256 cookie session: stateless authentication for admin panel
// Cookie format: base64url(payload).base64url(hmac)
// Payload: exp.timestamp.nonce

const COOKIE_NAME = "admin_session";
const COOKIE_EXPIRY_SECONDS = 86400; // 24 hours
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/\//g, "_");
  while (str.length % 4) str += "=";
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

function getSecret(): string {
  return Deno.env.get("ADMIN_SECRET") || "";
}

async function getHmacKey(usage: "sign" | "verify"): Promise<CryptoKey> {
  const secret = getSecret();
  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage],
  );
}

export async function signCookie(): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + COOKIE_EXPIRY_SECONDS;
  const nonce = crypto.randomUUID();
  const payload = `${exp}.${nonce}`;
  const key = await getHmacKey("sign");
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `${toBase64Url(encoder.encode(payload))}.${toBase64Url(sig)}`;
}

export async function verifyCookie(
  raw: string,
): Promise<{ exp: number } | null> {
  try {
    const parts = raw.split(".");
    if (parts.length !== 2) return null;

    const [encodedPayload, encodedSig] = parts;
    const payloadBytes = fromBase64Url(encodedPayload);
    const payload = decoder.decode(payloadBytes);
    const [expStr] = payload.split(".");
    const exp = parseInt(expStr, 10);

    if (isNaN(exp) || exp < Math.floor(Date.now() / 1000)) return null;

    const key = await getHmacKey("verify");
    const sigBytes = fromBase64Url(encodedSig);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      payloadBytes,
    );

    return valid ? { exp } : null;
  } catch {
    return null;
  }
}

export function getCookieName(): string {
  return COOKIE_NAME;
}
