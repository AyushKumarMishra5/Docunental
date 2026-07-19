/**
 * MongoDB adapter (production)
 */

import { MongoClient, Db, Document } from 'mongodb';
import type {
  DocumentMetadata,
  AnalysisResult,
  Playbook,
  FindingFeedback,
  SessionHistory,
} from '@/lib/types';
import type { DBAdapter } from './adapter';

let client: MongoClient | null = null;
let db: Db | null = null;

async function getDB(): Promise<Db> {
  if (db) return db;

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI not set in environment variables');
  }

  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db('docuintel');

  return db;
}

export class MongoDBAdapter implements DBAdapter {
  private async getCollection<T extends Document>(name: string) {
    const database = await getDB();
    return database.collection<T>(name);
  }

  // Documents
  async saveDocument(doc: DocumentMetadata): Promise<void> {
    const collection = await this.getCollection<DocumentMetadata>('documents');
    await collection.updateOne(
      { id: doc.id },
      { $set: doc },
      { upsert: true }
    );
  }

  async getDocument(id: string): Promise<DocumentMetadata | null> {
    const collection = await this.getCollection<DocumentMetadata>('documents');
    return await collection.findOne({ id });
  }

  async listDocuments(sessionId: string): Promise<DocumentMetadata[]> {
    const collection = await this.getCollection<DocumentMetadata>('documents');
    return await collection
      .find({ sessionId })
      .sort({ uploadedAt: -1 })
      .toArray();
  }

  // Analysis Results
  async saveAnalysis(result: AnalysisResult): Promise<void> {
    const collection = await this.getCollection<AnalysisResult>('analyses');
    await collection.updateOne(
      { documentId: result.documentId },
      { $set: result },
      { upsert: true }
    );
  }

  async getAnalysis(documentId: string): Promise<AnalysisResult | null> {
    const collection = await this.getCollection<AnalysisResult>('analyses');
    return await collection.findOne({ documentId });
  }

  async listAnalyses(sessionId: string): Promise<AnalysisResult[]> {
    const collection = await this.getCollection<AnalysisResult>('analyses');
    return await collection
      .find({ sessionId })
      .sort({ analyzedAt: -1 })
      .toArray();
  }

  // Playbooks
  async savePlaybook(playbook: Playbook): Promise<void> {
    const collection = await this.getCollection<Playbook>('playbooks');
    await collection.updateOne(
      { id: playbook.id },
      { $set: playbook },
      { upsert: true }
    );
  }

  async getPlaybook(id: string): Promise<Playbook | null> {
    const collection = await this.getCollection<Playbook>('playbooks');
    return await collection.findOne({ id });
  }

  async listPlaybooks(sessionId: string): Promise<Playbook[]> {
    const collection = await this.getCollection<Playbook>('playbooks');
    return await collection
      .find({ sessionId })
      .sort({ createdAt: -1 })
      .toArray();
  }

  // Feedback
  async saveFeedback(feedback: FindingFeedback): Promise<void> {
    const collection = await this.getCollection<FindingFeedback>('feedback');
    await collection.updateOne(
      { 
        sessionId: feedback.sessionId,
        documentId: feedback.documentId,
        findingId: feedback.findingId,
      },
      { $set: feedback },
      { upsert: true }
    );
  }

  async getFeedback(sessionId: string, documentId: string): Promise<FindingFeedback[]> {
    const collection = await this.getCollection<FindingFeedback>('feedback');
    return await collection
      .find({ sessionId, documentId })
      .toArray();
  }

  // Session History
  async getSessionHistory(sessionId: string): Promise<SessionHistory> {
    const analyses = await this.listAnalyses(sessionId);
    const documents = await this.listDocuments(sessionId);
    
    const history = analyses.map((analysis) => {
      const doc = documents.find(d => d.id === analysis.documentId);
      return {
        id: analysis.documentId,
        documentId: analysis.documentId,
        filename: doc?.filename || 'Unknown',
        analyzedAt: analysis.analyzedAt,
        riskScore: analysis.riskScore,
        findingsCount: analysis.findings.length,
      };
    });

    return {
      sessionId,
      analyses: history,
    };
  }
}
