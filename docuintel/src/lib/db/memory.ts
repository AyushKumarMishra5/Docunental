/**
 * In-memory database adapter (mock/development)
 */

import type {
  DocumentMetadata,
  AnalysisResult,
  Playbook,
  FindingFeedback,
  SessionHistory,
} from '@/lib/types';
import type { DBAdapter } from './adapter';

// Simple in-memory store
const store = {
  documents: new Map<string, DocumentMetadata>(),
  analyses: new Map<string, AnalysisResult>(),
  playbooks: new Map<string, Playbook>(),
  feedback: new Map<string, FindingFeedback[]>(),
};

export class MemoryDBAdapter implements DBAdapter {
  // Documents
  async saveDocument(doc: DocumentMetadata): Promise<void> {
    store.documents.set(doc.id, doc);
  }

  async getDocument(id: string): Promise<DocumentMetadata | null> {
    return store.documents.get(id) || null;
  }

  async listDocuments(sessionId: string): Promise<DocumentMetadata[]> {
    return Array.from(store.documents.values())
      .filter(doc => doc.sessionId === sessionId)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  // Analysis Results
  async saveAnalysis(result: AnalysisResult): Promise<void> {
    store.analyses.set(result.documentId, result);
  }

  async getAnalysis(documentId: string): Promise<AnalysisResult | null> {
    return store.analyses.get(documentId) || null;
  }

  async listAnalyses(sessionId: string): Promise<AnalysisResult[]> {
    return Array.from(store.analyses.values())
      .filter(analysis => analysis.sessionId === sessionId)
      .sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime());
  }

  // Playbooks
  async savePlaybook(playbook: Playbook): Promise<void> {
    store.playbooks.set(playbook.id, playbook);
  }

  async getPlaybook(id: string): Promise<Playbook | null> {
    return store.playbooks.get(id) || null;
  }

  async listPlaybooks(sessionId: string): Promise<Playbook[]> {
    return Array.from(store.playbooks.values())
      .filter(playbook => playbook.sessionId === sessionId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Feedback
  async saveFeedback(feedback: FindingFeedback): Promise<void> {
    const key = `${feedback.sessionId}:${feedback.documentId}`;
    const existing = store.feedback.get(key) || [];
    
    // Remove existing feedback for same finding
    const filtered = existing.filter(f => f.findingId !== feedback.findingId);
    filtered.push(feedback);
    
    store.feedback.set(key, filtered);
  }

  async getFeedback(sessionId: string, documentId: string): Promise<FindingFeedback[]> {
    const key = `${sessionId}:${documentId}`;
    return store.feedback.get(key) || [];
  }

  // Session History
  async getSessionHistory(sessionId: string): Promise<SessionHistory> {
    const analyses = await this.listAnalyses(sessionId);
    const documents = await this.listDocuments(sessionId);
    
    const history = await Promise.all(
      analyses.map(async (analysis) => {
        const doc = documents.find(d => d.id === analysis.documentId);
        return {
          id: analysis.documentId,
          documentId: analysis.documentId,
          filename: doc?.filename || 'Unknown',
          analyzedAt: analysis.analyzedAt,
          riskScore: analysis.riskScore,
          findingsCount: analysis.findings.length,
        };
      })
    );

    return {
      sessionId,
      analyses: history,
    };
  }
}
