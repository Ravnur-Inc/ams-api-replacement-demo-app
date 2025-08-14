export function ensureHeader(headers, name, value) {
  if (!headers.has(name)) headers.set(name, value);
}

export function toIsoNoMs(date) {
  const pad = (n) => String(n).padStart(2, "0");
  const y = date.getUTCFullYear();
  const m = pad(date.getUTCMonth() + 1);
  const d = pad(date.getUTCDate());
  const hh = pad(date.getUTCHours());
  const mm = pad(date.getUTCMinutes());
  const ss = pad(date.getUTCSeconds());
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}Z`;
}

export function base64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function bytesToBase64(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export async function hmacSha256Base64(keyBase64, stringToSign) {
  const keyBytes = base64ToBytes(keyBase64);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(stringToSign)
  );
  return bytesToBase64(new Uint8Array(sigBuf));
}

export function buildHeaders(file) {
  const headers = new Headers();

  if (file && file.type && !headers.has("Content-Type")) {
    headers.set("Content-Type", file.type);
  }
  return headers;
}

export function log(msg) {
  const logEl = document.getElementById("log");
  const t = new Date().toLocaleTimeString();
  logEl.textContent += `[${t}] ${msg}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}

export const clearLog = () => {
  const logEl = document.getElementById("log");
  logEl.textContent = "";
}