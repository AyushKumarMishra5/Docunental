/**
 * Version Comparison API Route
 * Compares two versions of the same document for clause-level changes with detailed analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAIAdapter } from '@/lib/ai/adapter';
import { v4 as uuidv4 } from 'uuid';
import type { VersionComparison, ClauseDiff } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const oldFile = formData.get('oldFile') as File;
    const newFile = formData.get('newFile') as File;

    if (!oldFile || !newFile) {
      return NextResponse.json(
        { error: 'Both old and new files are required' },
        { status: 400 }
      );
    }

    const ai = await getAIAdapter();

    // Extract both files
    const oldBuffer = Buffer.from(await oldFile.arrayBuffer());
    const newBuffer = Buffer.from(await newFile.arrayBuffer());
    
    const oldType = getFileType(oldFile.name);
    const newType = getFileType(newFile.name);
    
    const oldText = await extractText(oldBuffer, oldType);
    const newText = await extractText(newBuffer, newType);

    // Extract structure from both
    const oldExtraction = await ai.extract(oldText, uuidv4());
    const newExtraction = await ai.extract(newText, uuidv4());

    // Compare sections and generate detailed diff
    const clauses = await compareVersions(oldExtraction, newExtraction, ai);

    // Generate comparison summary
    const summary = generateComparisonSummary(clauses);

    const comparison: VersionComparison = {
      oldDocumentId: oldExtraction.documentId,
      newDocumentId: newExtraction.documentId,
      clauses,
      summary,
      comparedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      comparison,
    });
  } catch (error) {
    console.error('Version comparison error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Comparison failed' },
      { status: 500 }
    );
  }
}

async function extractText(buffer: Buffer, fileType: string): Promise<string> {
  switch (fileType) {
    case 'pdf':
      const pdfModule = await import('pdf-parse');
      const data = await (pdfModule as any).default(buffer);
      return data.text;
    case 'docx':
      const mammoth = await import('mammoth');
      const result = await (mammoth as any).extractRawText({ buffer });
      return result.value;
    default:
      return buffer.toString('utf-8');
  }
}

function getFileType(filename: string): 'pdf' | 'docx' | 'txt' | 'md' {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'pdf';
    case 'docx': return 'docx';
    case 'md': return 'md';
    default: return 'txt';
  }
}

async function compareVersions(
  oldExtraction: { sections: Array<{ heading: string | null; text: string; index: number }> },
  newExtraction: { sections: Array<{ heading: string | null; text: string; index: number }> },
  ai: Awaited<ReturnType<typeof getAIAdapter>>
): Promise<ClauseDiff[]> {
  const clauses: ClauseDiff[] = [];
  
  // Create maps for easier matching
  const newSectionMap = new Map<string, typeof newExtraction.sections[0]>(
    newExtraction.sections.map(s => [(s.heading || `section-${s.index}`).toLowerCase(), s])
  );
  
  const oldSectionMap = new Map<string, typeof oldExtraction.sections[0]>(
    oldExtraction.sections.map(s => [(s.heading || `section-${s.index}`).toLowerCase(), s])
  );

  // Process old sections
  for (const oldSection of oldExtraction.sections) {
    const key = (oldSection.heading || `section-${oldSection.index}`).toLowerCase();
    const newSection = newSectionMap.get(key);
    
    if (!newSection) {
      clauses.push({
        sectionIndex: oldSection.index,
        heading: oldSection.heading,
        changeType: 'removed',
        oldText: oldSection.text,
        riskDelta: 'neutral',
        explanation: `Section "${oldSection.heading || `Section ${oldSection.index + 1}`}" was removed`,
      });
    } else if (oldSection.text !== newSection.text) {
      const riskDelta = await assessRiskDelta(oldSection.text, newSection.text, ai);
      clauses.push({
        sectionIndex: oldSection.index,
        heading: oldSection.heading,
        changeType: 'modified',
        oldText: oldSection.text,
        newText: newSection.text,
        riskDelta,
        explanation: `Section "${oldSection.heading || `Section ${oldSection.index + 1}`}" was modified`,
      });
      newSectionMap.delete(key);
    } else {
      clauses.push({
        sectionIndex: oldSection.index,
        heading: oldSection.heading,
        changeType: 'unchanged',
        riskDelta: 'neutral',
        explanation: `Section "${oldSection.heading || `Section ${oldSection.index + 1}`}" remains unchanged`,
      });
      newSectionMap.delete(key);
    }
  }

  // Process added sections
  const addedSections = Array.from(newSectionMap.values());
  for (const newSection of addedSections) {
    clauses.push({
      sectionIndex: newSection.index,
      heading: newSection.heading,
      changeType: 'added',
      newText: newSection.text,
      riskDelta: 'neutral',
      explanation: `New section "${newSection.heading || `Section ${newSection.index + 1}`}" was added`,
    });
  }

  // Sort: added/removed first, then modified, then unchanged
  const sectionOrder = { added: 0, removed: 1, modified: 2, unchanged: 3 };
  clauses.sort((a, b) => sectionOrder[a.changeType] - sectionOrder[b.changeType] || a.sectionIndex - b.sectionIndex);

  return clauses;
}

async function assessRiskDelta(oldText: string, newText: string, ai: any): Promise<'increased' | 'decreased' | 'neutral'> {
  const prompt = `Compare these two text excerpts and determine if the change increased risk, decreased risk, or has neutral impact on contract risk.

OLD VERSION:
${oldText.substring(0, 500)}

NEW VERSION:
${newText.substring(0, 500)}

Return exactly one of: increased, decreased, or neutral.`;

  try {
    const result = await ai.synthesize(
      { fullText: oldText + newText, sections: [], metadata: { wordCount: 0, characterCount: 0 } },
      []
    );
    
    // Fallback heuristic
    const oldLower = oldText.toLowerCase();
    const newLower = newText.toLowerCase();
    
    const riskIncreaseTerms = ['unlimited', 'perpetual', 'irrevocable', 'automatic', 'non-refundable', 'without notice', 'indefinitely'];
    const riskDecreaseTerms = ['limited', 'capped', 'mutual', 'reasonable', 'terminate', 'notice', 'opt-out'];
    
    let delta = 0;
    
    for (const term of riskIncreaseTerms) {
      if (!oldLower.includes(term) && newLower.includes(term)) delta++;
      if (oldLower.includes(term) && !newLower.includes(term)) delta--;
    }
    
    for (const term of riskDecreaseTerms) {
      if (!oldLower.includes(term) && newLower.includes(term)) delta--;
      if (oldLower.includes(term) && !newLower.includes(term)) delta++;
    }
    
    if (delta > 0) return 'increased';
    if (delta < 0) return 'decreased';
    return 'neutral';
  } catch {
    // Fallback heuristic if AI fails
    return 'neutral';
  }
}

function generateComparisonSummary(clauses: ClauseDiff[]): string {
  const added = clauses.filter(c => c.changeType === 'added').length;
  const removed = clauses.filter(c => c.changeType === 'removed').length;
  const modified = clauses.filter(c => c.changeType === 'modified').length;
  const unchanged = clauses.filter(c => c.changeType === 'unchanged').length;
  const riskIncreased = clauses.filter(c => c.riskDelta === 'increased').length;
  const riskDecreased = clauses.filter(c => c.riskDelta === 'decreased').length;
  
  let summary = `Document comparison found ${modified} modified sections, ${added} additions, and ${removed} removals. `;
  
  if (riskIncreased > 0) {
    summary += `${riskIncreased} ${riskIncreased === 1 ? 'change increases' : 'changes increase'} risk. `;
  }
  if (riskDecreased > 0) {
    summary += `${riskDecreased} ${riskDecreased === 1 ? 'change decreases' : 'changes decrease'} risk. `;
  }
  
  summary += `${unchanged} sections remain unchanged. `;
  
  return summary.trim();
}
