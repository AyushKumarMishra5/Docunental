/**
 * Results Page - Analysis Results Dashboard with Document Viewer
 * Enhanced with loading states and proper DB lookup
 */

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

// Retry logic for in-memory DB race conditions
async function getAnalysisWithRetry(documentId: string, attempt = 1): Promise<any> {
  const db = await getDBAdapter();
  const analysis = await db.getAnalysis(documentId);

  if (analysis || attempt >= 3) {
    return analysis;
  }

  // Wait and retry
  await new Promise(resolve => setTimeout(resolve, attempt * 300));
  return getAnalysisWithRetry(documentId, attempt + 1);
}

// Simulate loading delay for better UX
async function simulateLoading() {
  await new Promise(resolve => setTimeout(resolve, 400));
}

export default async function ResultsPage({ params, searchParams }: ResultsPageProps) {
  const { id } = await params;
  const paramsObj = await searchParams;
  const retry = (paramsObj?.retry as string) || '0';
  const sessionId = await getSessionId();

  console.log(`[ResultsPage] Loading result for document: ${id}, attempt: ${retry}`);

  // Start loading simulation
  await simulateLoading();

  const db = await getDBAdapter();
  const document = await db.getDocument(id);
  const analysis = await getAnalysisWithRetry(id, parseInt(retry));

  if (!document || !analysis) {
    console.log(`[ResultsPage] Document or analysis not found for ${id}`);
    if (parseInt(retry) < 2) {
      // Show loading with retry option
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8">
          <div className="animate-spin h-12 w-12 text-accent mb-4">
            <Loader2 className="h-12 w-12" />
          </div>
          <div className="text-center">
            <h2 className="font-display text-2xl text-text-primary mb-2">Loading Results...</h2>
            <p className="text-text-secondary mb-6">Please wait while we retrieve your analysis</p>
            <Link href={`/results/${id}?retry=${parseInt(retry) + 1}`}>
              <Button>Retry Loading</Button>
            </Link>
          </div>
        </div>
      );
    }
    notFound();
  }

  // Create a simple extraction from stored text
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
