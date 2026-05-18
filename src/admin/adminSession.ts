export const ALLOWED_EMAILS = [
  'manishtalukdar666@gmail.com',
  'heyarkvoid@gmail.com'
] as const;

type AdminEmail = (typeof ALLOWED_EMAILS)[number];

export interface AdminSession {
  token: string;
  email: AdminEmail;
  expires: number;
  issuedAt: number;
}

export function readAdminSessionRaw(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem('adminSession') || window.localStorage.getItem('adminSession');
  } catch {
    return null;
  }
}

export function parseAdminSession(raw: string | null): AdminSession | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<AdminSession>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.token !== 'string' || parsed.token.length < 32) return null;
    if (typeof parsed.email !== 'string' || !ALLOWED_EMAILS.includes(parsed.email as AdminEmail)) return null;
    if (typeof parsed.expires !== 'number' || !Number.isFinite(parsed.expires)) return null;
    if (Date.now() > parsed.expires) return null;

    return {
      token: parsed.token,
      email: parsed.email as AdminEmail,
      expires: parsed.expires,
      issuedAt: typeof parsed.issuedAt === 'number' ? parsed.issuedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function persistAdminSession(session: AdminSession): void {
  if (typeof window === 'undefined') return;
  const serialized = JSON.stringify(session);
  try {
    window.sessionStorage.setItem('adminSession', serialized);
  } catch {
    window.localStorage.setItem('adminSession', serialized);
  }
}

export function clearAdminSession(): void {
  if (typeof window === 'undefined') return;
  try { window.sessionStorage.removeItem('adminSession'); } catch {}
  try { window.localStorage.removeItem('adminSession'); } catch {}
}


export function getAdminEmail(fallback = 'admin@arkvoid.com'): string {
  return parseAdminSession(readAdminSessionRaw())?.email || fallback;
}
