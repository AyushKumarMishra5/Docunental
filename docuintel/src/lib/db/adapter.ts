/**
 * Database Adapter Interface
 * Abstracts MongoDB (real) vs. in-memory (mock)
 */

import type {
  DocumentMetadata,
  AnalysisResult,
  Playbook,
  FindingFeedback,
  SessionHistory,
} from '@/lib/types';

export interface DBAdapter {
  // Documents
  saveDocument(doc: DocumentMetadata): Promise<void>;
  getDocument(id: string): Promise<DocumentMetadata | null>;
  listDocuments(sessionId: string): Promise<DocumentMetadata[]>;

  // Analysis Results
  saveAnalysis(result: AnalysisResult): Promise<void>;
  getAnalysis(documentId: string): Promise<AnalysisResult | null>;
  listAnalyses(sessionId: string): Promise<AnalysisResult[]>;

  // Playbooks
  savePlaybook(playbook: Playbook): Promise<void>;
  getPlaybook(id: string): Promise<Playbook | null>;
  listPlaybooks(sessionId: string): Promise<Playbook[]>;

  // Feedback
  saveFeedback(feedback: FindingFeedback): Promise<void>;
  getFeedback(sessionId: string, documentId: string): Promise<FindingFeedback[]>;

  // Session History
  getSessionHistory(sessionId: string): Promise<SessionHistory>;
}

/**
 * Factory function to get the appropriate adapter based on environment
 */
export async function getDBAdapter(): Promise<DBAdapter> {
  const useMock = process.env.USE_MOCK === '1' || !process.env.MONGODB_URI;
  
  if (useMock) {
    const { MemoryDBAdapter } = await import('./memory');
    return new MemoryDBAdapter();
  } else {
    const { MongoDBAdapter } = await import('./mongo');
    return new MongoDBAdapter();
  }
}
