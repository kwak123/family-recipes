import { auth } from './auth';
import { getUser } from './firestore-db';

/**
 * Verify current user is an admin, throw error if not
 * Use in API routes and server actions
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized: You must be signed in');
  }

  const user = await getUser(session.user.id);

  if (!user?.isAdmin) {
    throw new Error('Forbidden: Admin access required');
  }

  return user;
}
