import { cookies } from 'next/headers';

export interface User {
  id: number;
  phone: string;
  name: string | null;
  email: string | null;
  role: 'customer' | 'barber' | 'admin';
  created_at: string;
  last_login: string | null;
}

export async function getSession(): Promise<{ user: User | null }> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return { user: null };
  }

  // Mock session - database disabled
  return { user: null };
}

export async function requireAuth(allowedRoles?: string[]) {
  const { user } = await getSession();

  if (!user) {
    throw new Error('Unauthorized');
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error('Forbidden');
  }

  return user;
}
