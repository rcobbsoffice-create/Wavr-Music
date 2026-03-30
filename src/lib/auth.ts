export type UserRole = 'admin' | 'producer';

export interface AuthUser {
  email: string;
  role: UserRole;
  name: string;
}

export const DEMO_ACCOUNTS = [
  { email: 'admin@wavr.com', password: 'admin123', role: 'admin' as UserRole, name: 'Platform Admin' },
  { email: 'producer@wavr.com', password: 'producer123', role: 'producer' as UserRole, name: 'DJ Phantom' },
];

export function authenticate(email: string, password: string): AuthUser | null {
  const account = DEMO_ACCOUNTS.find(
    (a) => a.email === email && a.password === password
  );
  if (!account) return null;
  return { email: account.email, role: account.role, name: account.name };
}

export function getDashboardPath(role: string): string {
  switch (role) {
    case 'admin': return '/admin';
    case 'producer': return '/producer';
    default: return '/producer';
  }
}
