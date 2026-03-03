const SECRET = process.env.ADMIN_SECRET || "";

function base64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64url(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  return atob(padded);
}

async function hmacSign(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return base64url(sig);
}

export async function signToken(payload: Record<string, unknown>): Promise<string> {
  const json = JSON.stringify(payload);
  const data = base64url(new TextEncoder().encode(json).buffer as ArrayBuffer);
  const sig = await hmacSign(data);
  return `${data}.${sig}`;
}

export async function verifyToken(
  token: string
): Promise<Record<string, unknown> | null> {
  if (!SECRET) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expected = await hmacSign(data);
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(fromBase64url(data));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
