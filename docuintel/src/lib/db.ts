/**
 * Database service layer for MongoDB operations
 * Handles sessions and analysis results
 */

import { getDb } from './mongodb';
import { ObjectId } from 'mongodb';

export interface Session {
  _id?: ObjectId;
  sessionId: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface AnalysisResult {
  _id?: ObjectId;
  sessionId: string;
  analysisId: string;
  fileName: string;
  fileType: string;
  content: string;
  analysis: any;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class DatabaseService {
  private static SESSIONS_COLLECTION = 'sessions';
  private static ANALYSIS_COLLECTION = 'analysis_results';

  /**
   * Create or update a session
   */
  static async upsertSession(sessionId: string): Promise<Session> {
    const db = await getDb();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    const now = new Date();

    await db.collection(this.SESSIONS_COLLECTION).updateOne(
      { sessionId },
      { 
        $set: { expiresAt },
        $setOnInsert: { sessionId, createdAt: now }
      },
      { upsert: true }
    );

    return {
      sessionId,
      createdAt: now,
      expiresAt,
    };
  }

  /**
   * Get a session by ID
   */
  static async getSession(sessionId: string): Promise<Session | null> {
    const db = await getDb();
    return await db.collection<Session>(this.SESSIONS_COLLECTION).findOne({ sessionId });
  }

  /**
   * Save analysis result
   */
  static async saveAnalysisResult(data: Omit<AnalysisResult, '_id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const db = await getDb();
    
    const result: AnalysisResult = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertResult = await db.collection(this.ANALYSIS_COLLECTION).insertOne(result);
    return data.analysisId;
  }

  /**
   * Update analysis result
   */
  static async updateAnalysisResult(
    analysisId: string,
    updates: Partial<Omit<AnalysisResult, '_id' | 'analysisId' | 'createdAt'>>
  ): Promise<boolean> {
    const db = await getDb();
    
    const result = await db.collection(this.ANALYSIS_COLLECTION).updateOne(
      { analysisId },
      { 
        $set: {
          ...updates,
          updatedAt: new Date(),
        }
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Get analysis result by ID
   */
  static async getAnalysisResult(analysisId: string): Promise<AnalysisResult | null> {
    const db = await getDb();
    return await db.collection<AnalysisResult>(this.ANALYSIS_COLLECTION).findOne({ analysisId });
  }

  /**
   * Get all analysis results for a session
   */
  static async getSessionAnalysisResults(sessionId: string): Promise<AnalysisResult[]> {
    const db = await getDb();
    return await db
      .collection<AnalysisResult>(this.ANALYSIS_COLLECTION)
      .find({ sessionId })
      .sort({ createdAt: -1 })
      .toArray();
  }

  /**
   * Delete old sessions and their analysis results
   */
  static async cleanupExpiredSessions(): Promise<void> {
    const db = await getDb();
    const now = new Date();

    // Find expired sessions
    const expiredSessions = await db
      .collection<Session>(this.SESSIONS_COLLECTION)
      .find({ expiresAt: { $lt: now } })
      .toArray();

    const expiredSessionIds = expiredSessions.map(s => s.sessionId);

    // Delete expired sessions
    await db.collection(this.SESSIONS_COLLECTION).deleteMany({ expiresAt: { $lt: now } });

    // Delete analysis results for expired sessions
    await db.collection(this.ANALYSIS_COLLECTION).deleteMany({ 
      sessionId: { $in: expiredSessionIds } 
    });
  }

  /**
   * Create indexes for better performance
   */
  static async createIndexes(): Promise<void> {
    const db = await getDb();

    // Session indexes
    await db.collection(this.SESSIONS_COLLECTION).createIndex({ sessionId: 1 }, { unique: true });
    await db.collection(this.SESSIONS_COLLECTION).createIndex({ expiresAt: 1 });

    // Analysis indexes
    await db.collection(this.ANALYSIS_COLLECTION).createIndex({ analysisId: 1 }, { unique: true });
    await db.collection(this.ANALYSIS_COLLECTION).createIndex({ sessionId: 1 });
    await db.collection(this.ANALYSIS_COLLECTION).createIndex({ createdAt: -1 });
  }
}
