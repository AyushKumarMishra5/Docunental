/**
 * Feedback API Route
 * Save user feedback on findings (confirm/not-relevant)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionId, setSessionCookie } from '@/lib/session';
import { getDBAdapter } from '@/lib/db/adapter';
import { v4 as uuidv4 } from 'uuid';
import type { FindingFeedback } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    let sessionId = await getSessionId();
    
    // Create session if it doesn't exist
    if (!sessionId) {
      sessionId = uuidv4();
      await setSessionCookie(sessionId);
    }

    const body = await request.json();
    
    const { findingId, documentId, action } = body;

    if (!findingId || !documentId || !action) {
      return NextResponse.json(
        { error: 'findingId, documentId, and action are required' },
        { status: 400 }
      );
    }

    const db = await getDBAdapter();
    
    const feedback: FindingFeedback = {
      findingId,
      documentId,
      sessionId,
      action: action as 'confirmed' | 'not-relevant',
      timestamp: new Date().toISOString(),
    };

    await db.saveFeedback(feedback);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save feedback' },
      { status: 500 }
    );
  }
}
