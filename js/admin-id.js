// Recognises the blog owner's account without publishing the address itself (these files are public).
// This only decides what the interface shows and which visits are not counted;
// real protection is in the Firestore rules.
// To change the owner: replace the fingerprint with FNV-1a 64 (hex) of the new address, trimmed and lowercased.
const WAJD_ADMIN_FINGERPRINT = '9e8ee49f5222b706';

function wajdFingerprint(value) {
  let hash = 0xcbf29ce484222325n;
  for (const byte of new TextEncoder().encode(value)) {
    hash ^= BigInt(byte);
    hash = (hash * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return hash.toString(16).padStart(16, '0');
}

export function wajdIsAdminEmail(email) {
  const value = String(email || '').trim().toLowerCase();
  return value !== '' && wajdFingerprint(value) === WAJD_ADMIN_FINGERPRINT;
}
