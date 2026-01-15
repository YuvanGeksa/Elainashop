export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function isValidUsername(u) {
  return /^[a-zA-Z0-9_]{3,24}$/.test(String(u || ""));
}

export function nowIso() {
  return new Date().toISOString();
}
