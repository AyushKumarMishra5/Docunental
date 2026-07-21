import { AppHeader } from '@/components/layout/AppHeader';
import { getSessionId } from '@/lib/session';
import { getDBAdapter } from '@/lib/db/adapter';
import { notFound } from 'next/navigation';
import { EnhancedResultsDashboard } from '@/components/results/EnhancedResultsDashboard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/primitives';

interface ResultsPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ retry?: string }>;
}

async function getAnalysisWithRetry(documentId: string, attempt = 1): Promise<any> {
  const db = await getDBAdapter();
  
  console.log(`[ResultsPage] Attempting to fetch analysis for ${documentId}, attempt ${attempt}`);
  
  const analysis = await db.getAnalysis(documentId);

  if (analysis) {
    console.log(`[ResultsPage] ✅ Analysis found on attempt ${attempt}`);
    return analysis;
  }

  if (attempt >= 5) {
    console.log(`[ResultsPage] ❌ Analysis not found after ${attempt} attempts`);
    return null;
  }

  console.log(`[ResultsPage] ⏳ Waiting before retry ${attempt + 1}...`);
  await new Promise(resolve => setTimeout(resolve, attempt * 500));
  return getAnalysisWithRetry(documentId, attempt + 1);
}

export default async function ResultsPage({ params, searchParams }: ResultsPageProps) {
  const { id } = await params;
  const paramsObj = await searchParams;
  const retry = (paramsObj?.retry as string) || '0';
  const sessionId = await getSessionId();

  console.log(`[ResultsPage] Loading result for document: ${id}, retry: ${retry}`);

  await new Promise(resolve => setTimeout(resolve, 200));

  const db = await getDBAdapter();
  const document = await db.getDocument(id);
  
  if (!document) {
    console.log(`[ResultsPage] ❌ Document not found: ${id}`);
    if (parseInt(retry) < 3) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-black">
          <div className="animate-spin h-16 w-16 text-accent mb-6">
            <Loader2 className="h-16 w-16" />
          </div>
          <div className="text-center max-w-md">
            <h2 className="font-display text-3xl text-text-primary mb-3">Loading Results...</h2>
            <p className="text-text-secondary mb-6">Please wait while we retrieve your analysis (attempt {parseInt(retry) + 1})</p>
            <Link href={`/results/${id}?retry=${parseInt(retry) + 1}`}>
              <Button size="lg" className="bg-accent text-black font-bold">
                Retry Loading
              </Button>
            </Link>
          </div>
        </div>
      );
    }
    notFound();
  }

  const analysis = await getAnalysisWithRetry(id, 1);

  if (!analysis) {
    console.log(`[ResultsPage] ❌ Analysis not found after retries for ${id}`);
    if (parseInt(retry) < 3) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-black">
          <div className="animate-spin h-16 w-16 text-accent mb-6">
            <Loader2 className="h-16 w-16" />
          </div>
          <div className="text-center max-w-md">
            <h2 className="font-display text-3xl text-text-primary mb-3">Processing Analysis...</h2>
            <p className="text-text-secondary mb-6">Your document is still being analyzed. This may take a moment.</p>
            <Link href={`/results/${id}?retry=${parseInt(retry) + 1}`}>
              <Button size="lg" className="bg-accent text-black font-bold">
                Check Again
              </Button>
            </Link>
          </div>
        </div>
      );
    }
    notFound();
  }

  console.log(`[ResultsPage] ✅ Successfully loaded analysis for ${id}`);

  const extractionPlaceholder: import('@/lib/types').ExtractionResult = {
    documentId: document.id,
    fullText: "Document text would be loaded here from storage",
    sections: [],
    metadata: {
      wordCount: 0,
      characterCount: 0,
    },
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader sessionId={sessionId || undefined} />

      <main className="flex-1 container mx-auto px-6 py-12">
        <EnhancedResultsDashboard
          document={document}
          analysis={analysis}
          extraction={extractionPlaceholder}
        />
      </main>
    </div>
  );
}
