/**
 * History Page - Session Analysis History
 */

import { AppHeader } from '@/components/layout/AppHeader';
import { getSessionId } from '@/lib/session';
import { getDBAdapter } from '@/lib/db/adapter';
import { EmptyState } from '@/components/ui/EmptyState';
import { History } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/primitives';
import { formatRelativeDate, getRiskScoreColor } from '@/lib/utils';
import { Card } from '@/components/ui/primitives';

export default async function HistoryPage() {
  const sessionId = await getSessionId();
  
  if (!sessionId) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1 container mx-auto px-6 py-12">
          <div className="max-w-6xl mx-auto">
            <EmptyState
              icon={History}
              title="No session found"
              description="Start analyzing documents to build your history."
              action={
                <Link href="/analyze">
                  <Button>Analyze Your First Document</Button>
                </Link>
              }
            />
          </div>
        </main>
      </div>
    );
  }

  const db = await getDBAdapter();
  const history = await db.getSessionHistory(sessionId);

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader sessionId={sessionId} />
      
      <main className="flex-1 container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="font-display text-4xl text-text-primary mb-3">
              Analysis History
            </h1>
            <p className="text-text-secondary">
              Past document analyses in this browser session.
            </p>
          </div>

          {history.analyses.length === 0 ? (
            <EmptyState
              icon={History}
              title="No analysis history"
              description="Your analyzed documents will appear here. History is session-based and persists across browser visits."
              action={
                <Link href="/analyze">
                  <Button>Analyze Your First Document</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              {history.analyses.map((item) => (
                <Link key={item.id} href={`/results/${item.documentId}`}>
                  <Card className="p-6 hover:bg-hover transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-text-primary mb-1">{item.filename}</h3>
                        <p className="text-sm text-text-secondary">
                          {item.findingsCount} {item.findingsCount === 1 ? 'finding' : 'findings'} · 
                          Analyzed {formatRelativeDate(item.analyzedAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-semibold ${getRiskScoreColor(item.riskScore)}`}>
                          {item.riskScore}
                        </div>
                        <div className="text-xs text-text-muted">risk score</div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
