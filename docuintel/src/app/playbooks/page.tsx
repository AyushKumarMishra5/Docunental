/**
 * Enhanced Playbooks Page with Creation Flow
 */

import { AppHeader } from '@/components/layout/AppHeader';
import { getSessionId } from '@/lib/session';
import { getDBAdapter } from '@/lib/db/adapter';
import { PlaybooksView } from '@/components/playbooks/PlaybooksView';

export default async function PlaybooksPage() {
  const sessionId = await getSessionId();
  const db = await getDBAdapter();
  const playbooks = sessionId ? await db.listPlaybooks(sessionId) : [];

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader sessionId={sessionId || undefined} />
      
      <main className="flex-1 container mx-auto px-6 py-12">
        <PlaybooksView playbooks={playbooks} />
      </main>
    </div>
  );
}
