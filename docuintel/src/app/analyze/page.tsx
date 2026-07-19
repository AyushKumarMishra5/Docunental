import { AppHeader } from '@/components/layout/AppHeader';
import { getSessionId } from '@/lib/session';
import { UploadZone } from '@/components/analyze/UploadZone';

export default async function AnalyzePage() {
  const sessionId = await getSessionId();

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader sessionId={sessionId || undefined} />
      
      <main className="flex-1 container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="font-display text-4xl text-text-primary mb-3">
              Document Analysis
            </h1>
            <p className="text-text-secondary">
              Upload contracts, agreements, or policies for instant risk analysis. 
              Supports PDF, DOCX, TXT, and Markdown.
            </p>
          </div>

          <UploadZone />
        </div>
      </main>
    </div>
  );
}
