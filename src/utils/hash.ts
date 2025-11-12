import { createHash } from 'crypto';

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function constantTimeEquals(a: string, b: string) {
  // simple timing-safe comparison
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i++) res |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return res === 0;
}
