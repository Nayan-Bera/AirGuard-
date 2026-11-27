import { headers } from 'next/headers';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { StoreProvider } from '@/components/providers/store-provider';

export async function AuthSessionBoundary({ children }: { children: React.ReactNode }) {
  await connection();
  const { user } = await getAuthenticatedUser();
  const pathname = (await headers()).get('x-app-pathname');

  if (pathname === '/' && user) redirect('/dashboard');

  return <StoreProvider initialUser={user}>{children}</StoreProvider>;
}
