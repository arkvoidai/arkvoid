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
  sessionStorage.setItem('adminSession', JSON.stringify(session));
}

export function clearAdminSession(): void {
  sessionStorage.removeItem('adminSession');
}
