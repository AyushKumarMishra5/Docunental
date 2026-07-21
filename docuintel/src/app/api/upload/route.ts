import { NextRequest, NextResponse } from 'next/server';
import { getSessionId, setSessionCookie } from '@/lib/session';
import { getStorageAdapter } from '@/lib/storage/adapter';
import { getDBAdapter } from '@/lib/db/adapter';
import { getAIAdapter } from '@/lib/ai/adapter';
import { extractText } from '@/lib/extraction';
import { defaultRubric } from '@/lib/rubric/default';
import { calculateRiskScore } from '@/lib/utils';
import { EnhancedAnalyzer } from '@/lib/analysis/enhanced-analyzer';
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

        // 4. Enhanced Analysis Pipeline
        console.log(`[5/7] ⏳ Running comprehensive analysis...`);
        
        // Try AI extraction first, fallback to simple extraction if it fails
        let extraction;
        try {
          extraction = await ai.extract(text, documentId);
          console.log(`[5/7] ✓ AI structure extraction (${extraction.sections.length} sections)`);
        } catch (error) {
          console.log(`[5/7] ⚠️ AI extraction failed, using text-based extraction`);
          extraction = {
            documentId,
            fullText: text,
            sections: [],
            metadata: {
              wordCount: text.split(/\s+/).length,
              characterCount: text.length,
            },
          };
        }
        
        const playbookId = formData.get('playbookId') as string | null;
        const playbook = playbookId ? await db.getPlaybook(playbookId) : null;
        
        // Run enhanced analyzer for comprehensive findings
        console.log(`[6/7] ⏳ Running enhanced pattern analysis...`);
        const enhancedFindings = await EnhancedAnalyzer.analyzeDocument(text, extraction, defaultRubric);
        console.log(`[6/7] ✓ Enhanced analysis complete (${enhancedFindings.length} findings)`);
        
        // Try AI analysis with timeout, but don't fail if it errors or times out
        let aiFindings = [];
        try {
          console.log(`[6/7] ⏳ Running AI analysis (30s timeout)...`);
          const aiPromise = ai.analyze(extraction, defaultRubric, playbook || undefined);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('AI analysis timeout')), 30000)
          );
          
          aiFindings = await Promise.race([aiPromise, timeoutPromise]) as any[];
          console.log(`[6/7] ✓ AI analysis complete (${aiFindings.length} findings)`);
        } catch (error: any) {
          console.log(`[6/7] ⚠️ AI analysis skipped: ${error.message}`);
          // Continue without AI findings - enhanced analysis is sufficient
        }
        
        // Combine findings (enhanced + AI, removing duplicates)
        const allFindings = [...enhancedFindings, ...aiFindings];
        const findings = deduplicateFindings(allFindings);
        console.log(`[6/7] ✓ Total findings: ${findings.length}`);
        
        // Generate comprehensive summary with timeout
        let summary = '';
        let topIssues: string[] = [];
        try {
          console.log(`[6/7] ⏳ Generating summary (20s timeout)...`);
          const synthesisPromise = ai.synthesize(extraction, findings);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Summary generation timeout')), 20000)
          );
          
          const synthesized = await Promise.race([synthesisPromise, timeoutPromise]) as any;
          summary = synthesized.summary;
          topIssues = synthesized.topIssues;
          console.log(`[6/7] ✓ AI summary generated`);
        } catch (error: any) {
          console.log(`[6/7] ⚠️ AI synthesis skipped: ${error.message}, generating summary from findings`);
          summary = generateSummaryFromFindings(findings, text);
          topIssues = generateTopIssues(findings);
        }
        console.log(`[6/7] ✓ Summary generated`);

        // 5. Calculate risk score
        const riskScore = calculateRiskScore(findings);
        console.log(`[7/7] ✓ Risk score: ${riskScore} (${findings.length} findings)`);

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
        console.log(`[SAVED] ✓ Comprehensive analysis saved to database`);

        results.push({
          documentId,
          filename: file.name,
          riskScore,
          findingsCount: findings.length,
          processingTime: Date.now() - startTime,
        });
        
        console.log(`${'='.repeat(60)}`);
        console.log(`✅ SUCCESS: ${file.name} analyzed in ${Date.now() - startTime}ms`);
        console.log(`   - ${findings.length} findings identified`);
        console.log(`   - Risk Score: ${riskScore}/100`);
        console.log(`   - ${extraction.metadata.wordCount} words analyzed`);
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

function deduplicateFindings(findings: any[]): any[] {
  const seen = new Set<string>();
  const deduplicated = [];
  
  for (const finding of findings) {
    // Create a signature based on category, severity, and a portion of the quote
    const signature = `${finding.category}-${finding.severity}-${finding.quote.substring(0, 50)}`;
    if (!seen.has(signature)) {
      seen.add(signature);
      deduplicated.push(finding);
    }
  }
  
  return deduplicated;
}

function generateSummaryFromFindings(findings: any[], text: string): string {
  const critical = findings.filter(f => f.severity === 'critical').length;
  const high = findings.filter(f => f.severity === 'high').length;
  const medium = findings.filter(f => f.severity === 'medium').length;
  const low = findings.filter(f => f.severity === 'low').length;
  
  const wordCount = text.split(/\s+/).length;
  
  let summary = `Analyzed ${wordCount} words and identified ${findings.length} findings. `;
  
  if (critical > 0) {
    summary += `⚠️ CRITICAL: ${critical} critical risk${critical > 1 ? 's' : ''} requiring immediate attention. `;
  }
  if (high > 0) {
    summary += `${high} high-severity issue${high > 1 ? 's' : ''} found. `;
  }
  if (medium > 0) {
    summary += `${medium} medium-risk item${medium > 1 ? 's' : ''} identified. `;
  }
  if (low > 0) {
    summary += `${low} low-priority observation${low > 1 ? 's' : ''}. `;
  }
  
  if (critical > 0 || high > 3) {
    summary += 'Legal review strongly recommended before signing.';
  } else if (high > 0) {
    summary += 'Detailed review of high-risk items advised before proceeding.';
  } else {
    summary += 'Standard review recommended to address identified issues.';
  }
  
  return summary;
}

function generateTopIssues(findings: any[]): string[] {
  // Sort by severity (critical > high > medium > low) and take top 3
  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  const sorted = [...findings].sort((a, b) => 
    severityOrder[b.severity as keyof typeof severityOrder] - severityOrder[a.severity as keyof typeof severityOrder]
  );
  
  return sorted.slice(0, 3).map(f => 
    `${f.severity.toUpperCase()}: ${f.category} - ${f.explanation.substring(0, 150)}${f.explanation.length > 150 ? '...' : ''}`
  );
}

