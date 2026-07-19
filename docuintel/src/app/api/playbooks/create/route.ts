/**
 * Playbook Creation API Route
 * Extracts baseline terms from uploaded policy/standard document
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionId, setSessionCookie } from '@/lib/session';
import { getStorageAdapter } from '@/lib/storage/adapter';
import { getDBAdapter } from '@/lib/db/adapter';
import { getAIAdapter } from '@/lib/ai/adapter';
import { extractText } from '@/lib/extraction';
import { v4 as uuidv4 } from 'uuid';
import type { Playbook } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    let sessionId = await getSessionId();
    
    // Create session if it doesn't exist
    if (!sessionId) {
      sessionId = uuidv4();
      await setSessionCookie(sessionId);
    }

    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!file || !name) {
      return NextResponse.json(
        { error: 'File and name are required' },
        { status: 400 }
      );
    }

    const storage = await getStorageAdapter();
    const db = await getDBAdapter();
    const ai = await getAIAdapter();

    // 1. Store file
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileType = getFileType(file.name);
    await storage.store(buffer, file.name, file.type);

    // 2. Extract text
    const text = await extractText(buffer, fileType);

    // 3. Extract structure
    const documentId = uuidv4();
    const extraction = await ai.extract(text, documentId);

    // 4. Extract baseline terms
    const extractedTerms = await extractBaselineTerms(text, ai);

    // 5. Create playbook
    const playbook: Playbook = {
      id: uuidv4(),
      name,
      description: description || `Baseline extracted from ${file.name}`,
      documentId,
      baseline: {
        sections: extraction.sections,
        extractedTerms,
      },
      createdAt: new Date().toISOString(),
      sessionId,
    };

    await db.savePlaybook(playbook);

    return NextResponse.json({
      success: true,
      playbook: {
        id: playbook.id,
        name: playbook.name,
        description: playbook.description,
        termsCount: Object.keys(extractedTerms).length,
      },
    });
  } catch (error) {
    console.error('Playbook creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Playbook creation failed' },
      { status: 500 }
    );
  }
}

function getFileType(filename: string): 'pdf' | 'docx' | 'txt' | 'md' {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'pdf';
    case 'docx':
      return 'docx';
    case 'md':
      return 'md';
    default:
      return 'txt';
  }
}

async function extractBaselineTerms(
  text: string,
  ai: Awaited<ReturnType<typeof getAIAdapter>>
): Promise<Record<string, string>> {
  // Use AI to extract key contractual terms
  // This is a simplified version - in production, you'd have a more sophisticated extraction
  
  const terms: Record<string, string> = {};
  
  // Common term patterns
  const patterns = [
    { key: 'termLength', pattern: /term[:\s]+([0-9]+\s+(?:months?|years?))/i },
    { key: 'renewalNotice', pattern: /(?:renewal|termination)\s+notice[:\s]+([0-9]+\s+days)/i },
    { key: 'liabilityCap', pattern: /liability.*?(?:limited to|capped at)[:\s]+([^\n.]+)/i },
    { key: 'paymentTerms', pattern: /payment[:\s]+([^\n.]+)/i },
    { key: 'governingLaw', pattern: /governed by.*?(?:laws? of)[:\s]+([^\n.]+)/i },
  ];

  patterns.forEach(({ key, pattern }) => {
    const match = text.match(pattern);
    if (match && match[1]) {
      terms[key] = match[1].trim();
    }
  });

  return terms;
}
