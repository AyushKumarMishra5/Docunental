/**
 * Upload API Route - COMPREHENSIVE FIX
 * Handles all edge cases with proper error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionId, setSessionCookie } from '@/lib/session';
import { getStorageAdapter } from '@/lib/storage/adapter';
import { getDBAdapter } from '@/lib/db/adapter';
import { getAIAdapter } from '@/lib/ai/adapter';
import { extractText } from '@/lib/extraction';
import { defaultRubric } from '@/lib/rubric/default';
import { calculateRiskScore } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import type { DocumentMetadata, AnalysisResult } from '@/lib/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const PROCESSING_TIMEOUT = 30000; // 30 seconds

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    let sessionId = await getSessionId();
    
    // Create session if it doesn't exist
    if (!sessionId) {
      sessionId = uuidv4();
      await setSessionCookie(sessionId);
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided. Please select at least one file.' },
        { status: 400 }
      );
    }

    // Validate files
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { 
            success: false, 
            error: `File "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum file size is 10MB.` 
          },
          { status: 400 }
        );
      }
    }

    const storage = await getStorageAdapter();
    const db = await getDBAdapter();
    const ai = await getAIAdapter();

    const results = [];

    for (const file of files) {
      try {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`PROCESSING: ${file.name}`);
        console.log(`Size: ${(file.size / 1024).toFixed(2)}KB, Type: ${file.type}`);
        console.log('='.repeat(60));

        // Check processing timeout
        if (Date.now() - startTime > PROCESSING_TIMEOUT) {
          throw new Error('Processing timeout exceeded. Please try with a smaller file.');
        }

        // 1. Upload to storage
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileType = getFileType(file.name);
        console.log(`[1/6] ✓ File type detected: ${fileType}`);
        
        await storage.store(buffer, file.name, file.type);
        console.log(`[2/6] ✓ File stored successfully`);

        // 2. Create document metadata
        const documentId = uuidv4();
        const metadata: DocumentMetadata = {
          id: documentId,
          filename: file.name,
          fileType,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
          sessionId,
        };
        await db.saveDocument(metadata);
        console.log(`[3/6] ✓ Document metadata saved (ID: ${documentId})`);

        // 3. Extract text
        console.log(`[4/6] ⏳ Extracting text...`);
        const text = await extractText(buffer, fileType);
        console.log(`[4/6] ✓ Text extracted (${text.length} characters, ${text.split(/\s+/).length} words)`);

        // 4. AI Pipeline
        console.log(`[5/6] ⏳ Running AI analysis...`);
        const extraction = await ai.extract(text, documentId);
        console.log(`[5/6] ✓ Structure extracted (${extraction.sections.length} sections)`);
        
        const playbookId = formData.get('playbookId') as string | null;
        const playbook = playbookId ? await db.getPlaybook(playbookId) : null;
        
        const findings = await ai.analyze(extraction, defaultRubric, playbook || undefined);
        console.log(`[5/6] ✓ Analysis complete (${findings.length} findings)`);
        
        const { summary, topIssues } = await ai.synthesize(extraction, findings);
        console.log(`[5/6] ✓ Summary generated`);

        // 5. Calculate risk score
        const riskScore = calculateRiskScore(findings);
        console.log(`[6/6] ✓ Risk score: ${riskScore}`);

        // 6. Save analysis
        const analysis: AnalysisResult = {
          documentId,
          sessionId,
          findings,
          riskScore,
          summary,
          topIssues,
          analyzedAt: new Date().toISOString(),
        };
        await db.saveAnalysis(analysis);
        console.log(`[SAVED] ✓ Analysis saved to database`);

        results.push({
          documentId,
          filename: file.name,
          riskScore,
          findingsCount: findings.length,
          processingTime: Date.now() - startTime,
        });
        
        console.log(`${'='.repeat(60)}`);
        console.log(`✅ SUCCESS: ${file.name} processed in ${Date.now() - startTime}ms`);
        console.log(`${'='.repeat(60)}\n`);
        
      } catch (error) {
        console.error(`\n${'!'.repeat(60)}`);
        console.error(`❌ FAILED: ${file.name}`);
        console.error('!'.repeat(60));
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const errorStack = error instanceof Error ? error.stack : '';
        
        console.error('Error:', errorMessage);
        if (errorStack) {
          console.error('Stack trace:', errorStack);
        }
        
        results.push({
          filename: file.name,
          error: errorMessage,
          errorDetails: process.env.NODE_ENV === 'development' ? errorStack : undefined,
        });
        
        console.error('!'.repeat(60));
        console.error(`Failed after ${Date.now() - startTime}ms`);
        console.error('!'.repeat(60));
      }
    }

    const successCount = results.filter(r => r.documentId).length;
    const failCount = results.filter(r => r.error).length;

    return NextResponse.json({
      success: successCount > 0,
      results,
      sessionId,
      summary: {
        total: files.length,
        succeeded: successCount,
        failed: failCount,
        processingTime: Date.now() - startTime,
      }
    });
    
  } catch (error) {
    console.error('\n=== FATAL ERROR ===');
    console.error(error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        results: [],
      },
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
    case 'doc':
      return 'docx';
    case 'md':
    case 'markdown':
      return 'md';
    default:
      return 'txt';
  }
}
