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

    // Extract structure from both using simple text-based parsing (more reliable than AI)
    const oldExtraction = extractStructureSimple(oldText, uuidv4());
    const newExtraction = extractStructureSimple(newText, uuidv4());

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

function extractStructureSimple(text: string, documentId: string) {
  const sections: Array<{ heading: string | null; text: string; index: number }> = [];
  
  // Split text into sections based on common patterns:
  // 1. Numbered sections (1., 2., etc.)
  // 2. Article/Section headings
  // 3. Lettered sections (A., B., etc.)
  // 4. All caps headings
  const lines = text.split('\n');
  let currentSection: { heading: string | null; text: string; index: number } | null = null;
  let sectionIndex = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this line is a section heading
    const isNumberedSection = /^\d+\.\s+/.test(line);
    const isArticleSection = /^(Article|Section|Chapter|Part)\s+\d+/i.test(line);
    const isLetteredSection = /^[A-Z]\.\s+/.test(line);
    const isAllCapsHeading = line.length > 0 && line.length < 100 && line === line.toUpperCase() && /[A-Z]/.test(line);
    
    if (isNumberedSection || isArticleSection || isLetteredSection || isAllCapsHeading) {
      // Save previous section
      if (currentSection) {
        currentSection.text = currentSection.text.trim();
        sections.push(currentSection);
      }
      
      // Start new section
      currentSection = {
        heading: line,
        text: '',
        index: sectionIndex++
      };
    } else if (currentSection) {
      // Add to current section
      currentSection.text += line + '\n';
    } else {
      // Start first section if no heading found yet
      if (!currentSection) {
        currentSection = {
          heading: null,
          text: line + '\n',
          index: sectionIndex++
        };
      }
    }
  }
  
  // Add last section
  if (currentSection) {
    currentSection.text = currentSection.text.trim();
    sections.push(currentSection);
  }
  
  // If no sections were found, treat entire document as one section
  if (sections.length === 0) {
    sections.push({
      heading: null,
      text: text.trim(),
      index: 0
    });
  }
  
  return {
    documentId,
    sections,
    fullText: text,
    metadata: {
      wordCount: text.split(/\s+/).length,
      characterCount: text.length
    }
  };
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
      const riskDelta = assessRemovalRisk(oldSection.text);
      clauses.push({
        sectionIndex: oldSection.index,
        heading: oldSection.heading,
        changeType: 'removed',
        oldText: oldSection.text,
        riskDelta,
        explanation: generateRemovalExplanation(oldSection.heading || `Section ${oldSection.index + 1}`, oldSection.text, riskDelta),
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
        explanation: generateModificationExplanation(oldSection.heading || `Section ${oldSection.index + 1}`, oldSection.text, newSection.text, riskDelta),
      });
      newSectionMap.delete(key);
    } else {
      clauses.push({
        sectionIndex: oldSection.index,
        heading: oldSection.heading,
        changeType: 'unchanged',
        riskDelta: 'neutral',
        explanation: `No changes detected - section remains identical to previous version`,
      });
      newSectionMap.delete(key);
    }
  }

  // Process added sections
  const addedSections = Array.from(newSectionMap.values());
  for (const newSection of addedSections) {
    const riskDelta = assessAdditionRisk(newSection.text);
    clauses.push({
      sectionIndex: newSection.index,
      heading: newSection.heading,
      changeType: 'added',
      newText: newSection.text,
      riskDelta,
      explanation: generateAdditionExplanation(newSection.heading || `Section ${newSection.index + 1}`, newSection.text, riskDelta),
    });
  }

  // Sort: added/removed first, then modified, then unchanged
  const sectionOrder = { added: 0, removed: 1, modified: 2, unchanged: 3 };
  clauses.sort((a, b) => sectionOrder[a.changeType] - sectionOrder[b.changeType] || a.sectionIndex - b.sectionIndex);

  return clauses;
}

async function assessRiskDelta(oldText: string, newText: string, ai: any): Promise<'increased' | 'decreased' | 'neutral'> {
  try {
    // Use heuristic-based risk assessment (more reliable than AI for this task)
    const oldLower = oldText.toLowerCase();
    const newLower = newText.toLowerCase();
    
    // High-risk terms that increase liability
    const riskIncreaseTerms = [
      'unlimited', 'perpetual', 'irrevocable', 'automatic', 'non-refundable', 
      'without notice', 'indefinitely', 'waive', 'forfeit', 'indemnify',
      'hold harmless', 'at will', 'sole discretion', 'non-negotiable',
      'binding arbitration', 'class action waiver', 'no warranty'
    ];
    
    // Protective terms that decrease risk
    const riskDecreaseTerms = [
      'limited', 'capped', 'mutual', 'reasonable', 'terminate', 'notice', 
      'opt-out', 'refundable', 'revocable', 'warranty', 'guarantee',
      'right to cure', 'good faith', 'both parties', 'negotiable',
      'may terminate', 'with cause', 'reasonable notice'
    ];
    
    let delta = 0;
    
    // Check for new risky terms
    for (const term of riskIncreaseTerms) {
      if (!oldLower.includes(term) && newLower.includes(term)) delta += 2;
      if (oldLower.includes(term) && !newLower.includes(term)) delta -= 2;
    }
    
    // Check for new protective terms
    for (const term of riskDecreaseTerms) {
      if (!oldLower.includes(term) && newLower.includes(term)) delta -= 1;
      if (oldLower.includes(term) && !newLower.includes(term)) delta += 1;
    }
    
    // Check for numerical changes (amounts, percentages, time periods)
    const oldNumbers = oldText.match(/\d+/g) || [];
    const newNumbers = newText.match(/\d+/g) || [];
    
    // If time periods increased (e.g., 30 days -> 60 days for notice), it's protective
    if (oldText.includes('days') && newText.includes('days')) {
      const oldDays = parseInt(oldNumbers.find(n => oldText.includes(n + ' days')) || '0');
      const newDays = parseInt(newNumbers.find(n => newText.includes(n + ' days')) || '0');
      if (newDays > oldDays && oldText.includes('notice')) delta -= 1;
      if (newDays < oldDays && oldText.includes('notice')) delta += 1;
    }
    
    // If amounts increased in compensation/salary, it's positive
    if ((oldText.includes('$') || oldText.includes('salary') || oldText.includes('compensation')) &&
        (newText.includes('$') || newText.includes('salary') || newText.includes('compensation'))) {
      const oldAmount = parseInt((oldNumbers[0] || '0').replace(/,/g, ''));
      const newAmount = parseInt((newNumbers[0] || '0').replace(/,/g, ''));
      if (newAmount > oldAmount) delta -= 1;
      if (newAmount < oldAmount) delta += 1;
    }
    
    // Check for significant length changes (new obligations added)
    const lengthDiff = newText.length - oldText.length;
    if (lengthDiff > 200) delta += 1; // Significant new text might add obligations
    if (lengthDiff < -200) delta -= 1; // Removed text might remove obligations
    
    console.log(`Risk assessment for "${oldText.substring(0, 50)}...": delta=${delta}`);
    
    if (delta > 1) return 'increased';
    if (delta < -1) return 'decreased';
    return 'neutral';
  } catch (error) {
    console.error('Risk assessment error:', error);
    return 'neutral';
  }
}

function assessAdditionRisk(text: string): 'increased' | 'decreased' | 'neutral' {
  const lower = text.toLowerCase();
  const riskyTerms = ['non-compete', 'non-disclosure', 'indemnify', 'liability', 'waive', 'forfeit', 'penalty', 'binding', 'irrevocable'];
  const protectiveTerms = ['warranty', 'guarantee', 'protection', 'right to', 'benefit', 'compensation', 'bonus', 'reimbursement'];
  
  let riskScore = 0;
  for (const term of riskyTerms) {
    if (lower.includes(term)) riskScore += 2;
  }
  for (const term of protectiveTerms) {
    if (lower.includes(term)) riskScore -= 1;
  }
  
  if (riskScore > 2) return 'increased';
  if (riskScore < -1) return 'decreased';
  return 'neutral';
}

function assessRemovalRisk(text: string): 'increased' | 'decreased' | 'neutral' {
  const lower = text.toLowerCase();
  const protectiveTerms = ['warranty', 'guarantee', 'protection', 'limit', 'cap', 'right to', 'may terminate', 'refund'];
  const riskyTerms = ['penalty', 'fee', 'charge', 'liability', 'obligation'];
  
  let riskScore = 0;
  for (const term of protectiveTerms) {
    if (lower.includes(term)) riskScore += 2; // Removing protection increases risk
  }
  for (const term of riskyTerms) {
    if (lower.includes(term)) riskScore -= 1; // Removing obligations decreases risk
  }
  
  if (riskScore > 2) return 'increased';
  if (riskScore < -1) return 'decreased';
  return 'neutral';
}

function generateModificationExplanation(heading: string, oldText: string, newText: string, riskDelta: 'increased' | 'decreased' | 'neutral'): string {
  const lengthChange = newText.length - oldText.length;
  const lengthPercent = Math.abs(Math.round((lengthChange / oldText.length) * 100));
  
  let explanation = `"${heading}" has been modified. `;
  
  if (lengthChange > 100) {
    explanation += `Significant text added (+${lengthPercent}% longer). `;
  } else if (lengthChange < -100) {
    explanation += `Text removed (-${lengthPercent}% shorter). `;
  } else {
    explanation += `Content revised with minor length change. `;
  }
  
  if (riskDelta === 'increased') {
    explanation += `⚠️ This modification introduces higher risk terms or removes protective language. Review carefully for potential liability exposure.`;
  } else if (riskDelta === 'decreased') {
    explanation += `✓ This change improves your position by adding protective terms or removing unfavorable language.`;
  } else {
    explanation += `Changes appear neutral or clarifying in nature without significant risk impact.`;
  }
  
  return explanation;
}

function generateAdditionExplanation(heading: string, text: string, riskDelta: 'increased' | 'decreased' | 'neutral'): string {
  let explanation = `New section "${heading}" has been added (${text.length} characters). `;
  
  if (riskDelta === 'increased') {
    explanation += `⚠️ This new section introduces obligations, restrictions, or liability terms. Careful review recommended to ensure terms are acceptable.`;
  } else if (riskDelta === 'decreased') {
    explanation += `✓ This addition provides beneficial terms, protections, or rights. Generally favorable addition.`;
  } else {
    explanation += `This appears to be administrative or informational content without significant risk implications.`;
  }
  
  return explanation;
}

function generateRemovalExplanation(heading: string, text: string, riskDelta: 'increased' | 'decreased' | 'neutral'): string {
  let explanation = `Section "${heading}" has been completely removed (${text.length} characters deleted). `;
  
  if (riskDelta === 'increased') {
    explanation += `⚠️ This removal eliminates protective terms or beneficial clauses. Consider requesting to retain this section or negotiate equivalent protections.`;
  } else if (riskDelta === 'decreased') {
    explanation += `✓ This removal eliminates unfavorable terms or obligations. Generally positive change.`;
  } else {
    explanation += `The removed content appears to be non-critical or administrative in nature.`;
  }
  
  return explanation;
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
