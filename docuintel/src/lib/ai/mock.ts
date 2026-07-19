/**
 * Mock AI Adapter (for development/testing without OpenRouter)
 * Returns realistic fixture data with proper char offsets
 */

import type { ExtractionResult, Finding, Rubric, Playbook } from '@/lib/types';
import type { AIAdapter } from './adapter';
import { v4 as uuidv4 } from 'uuid';

export class MockAIAdapter implements AIAdapter {
  /**
   * Pass 1: Extract document structure and sections
   */
  async extract(text: string, documentId: string): Promise<ExtractionResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Split by common section patterns (basic heuristic)
    const lines = text.split('\n');
    const sections = [];
    let currentSection = {
      index: 0,
      heading: null as string | null,
      text: '',
      startOffset: 0,
      endOffset: 0,
    };

    let offset = 0;
    const sectionPattern = /^(\d+\.|\d+\.\d+\.?|[A-Z][.\s]|[IVX]+\.)/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check if this looks like a section heading
      if (trimmed && sectionPattern.test(trimmed) && trimmed.length < 100) {
        // Save previous section
        if (currentSection.text) {
          currentSection.endOffset = offset;
          sections.push({ ...currentSection });
        }

        // Start new section
        currentSection = {
          index: sections.length,
          heading: trimmed,
          text: '',
          startOffset: offset,
          endOffset: offset,
        };
      } else {
        currentSection.text += line + '\n';
      }

      offset += line.length + 1; // +1 for newline
    }

    // Save last section
    if (currentSection.text) {
      currentSection.endOffset = offset;
      sections.push(currentSection);
    }

    // If no sections found, create one section with all text
    if (sections.length === 0) {
      sections.push({
        index: 0,
        heading: null,
        text: text,
        startOffset: 0,
        endOffset: text.length,
      });
    }

    const wordCount = text.split(/\s+/).length;

    return {
      documentId,
      fullText: text,
      sections,
      metadata: {
        wordCount,
        characterCount: text.length,
      },
    };
  }

  /**
   * Pass 2: Analyze document against rubric
   * Returns realistic mock findings with actual text quotes
   */
  async analyze(
    extraction: ExtractionResult,
    _rubric: Rubric,
    _playbook?: Playbook
  ): Promise<Finding[]> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const findings: Finding[] = [];
    const text = extraction.fullText.toLowerCase();

    // Auto-renewal detection
    if (text.includes('automatically renew') || text.includes('auto-renew') || text.includes('evergreen')) {
      const quote = this.extractQuote(extraction.fullText, ['automatically renew', 'auto-renew', 'evergreen']);
      if (quote) {
        findings.push({
          id: uuidv4(),
          category: 'auto-renewal',
          severity: text.includes('without notice') ? 'critical' : 'high',
          quote: quote.text,
          explanation: 'This contract contains an automatic renewal clause. Without proper notice, the agreement will continue indefinitely, potentially locking you into unfavorable terms.',
          suggestedFix: 'Negotiate a shorter renewal term with explicit opt-in requirements, or ensure a reasonable notice period (90+ days) for non-renewal.',
          confidence: 0.92,
          sectionIndex: quote.sectionIndex,
          startOffset: quote.startOffset,
          endOffset: quote.endOffset,
        });
      }
    }

    // Liability cap issues
    if (text.includes('unlimited liability') || (text.includes('liability') && !text.includes('limited to'))) {
      const quote = this.extractQuote(extraction.fullText, ['unlimited liability', 'shall be liable']);
      if (quote) {
        findings.push({
          id: uuidv4(),
          category: 'liability',
          severity: text.includes('unlimited') ? 'critical' : 'high',
          quote: quote.text,
          explanation: 'The contract exposes you to significant liability risk. Without a clear cap, you could be responsible for damages far exceeding the contract value.',
          suggestedFix: 'Add a mutual liability cap equal to 12 months of fees paid, with standard carve-outs for gross negligence, willful misconduct, and IP indemnification.',
          confidence: 0.89,
          sectionIndex: quote.sectionIndex,
          startOffset: quote.startOffset,
          endOffset: quote.endOffset,
        });
      }
    }

    // Indemnification issues
    if (text.includes('indemnify') || text.includes('indemnification')) {
      const quote = this.extractQuote(extraction.fullText, ['indemnify', 'indemnification']);
      if (quote) {
        const isOneSided = !text.includes('mutual indemnification');
        findings.push({
          id: uuidv4(),
          category: 'liability',
          severity: isOneSided ? 'high' : 'medium',
          quote: quote.text,
          explanation: isOneSided 
            ? 'The indemnification clause is one-sided, placing the burden entirely on you. This creates asymmetric risk.'
            : 'The indemnification clause requires review to ensure scope is reasonable and mutual.',
          suggestedFix: 'Negotiate mutual indemnification with clear scope limits (e.g., third-party IP claims, data breaches) and exclude consequential damages.',
          confidence: 0.85,
          sectionIndex: quote.sectionIndex,
          startOffset: quote.startOffset,
          endOffset: quote.endOffset,
        });
      }
    }

    // Termination issues
    if (text.includes('termination') && !text.includes('termination for convenience')) {
      const quote = this.extractQuote(extraction.fullText, ['termination', 'terminate']);
      if (quote) {
        findings.push({
          id: uuidv4(),
          category: 'termination',
          severity: 'medium',
          quote: quote.text,
          explanation: 'The contract lacks a termination for convenience clause, meaning you can only exit for cause or at contract end.',
          suggestedFix: 'Add a termination for convenience right with 60-90 day notice and reasonable wind-down provisions.',
          confidence: 0.78,
          sectionIndex: quote.sectionIndex,
          startOffset: quote.startOffset,
          endOffset: quote.endOffset,
        });
      }
    }

    // Payment terms issues
    if (text.includes('upfront payment') || text.includes('paid in advance') || text.includes('non-refundable')) {
      const quote = this.extractQuote(extraction.fullText, ['upfront', 'in advance', 'non-refundable']);
      if (quote) {
        findings.push({
          id: uuidv4(),
          category: 'payment',
          severity: text.includes('non-refundable') ? 'high' : 'medium',
          quote: quote.text,
          explanation: 'Upfront payment terms create financial risk. If the vendor fails to perform, recovery may be difficult.',
          suggestedFix: 'Negotiate milestone-based payments or limit upfront payment to 25% with refund provisions for non-performance.',
          confidence: 0.81,
          sectionIndex: quote.sectionIndex,
          startOffset: quote.startOffset,
          endOffset: quote.endOffset,
        });
      }
    }

    // Data/confidentiality issues
    if ((text.includes('data') || text.includes('confidential')) && !text.includes('security standards')) {
      const quote = this.extractQuote(extraction.fullText, ['data', 'confidential information']);
      if (quote) {
        findings.push({
          id: uuidv4(),
          category: 'data-confidentiality',
          severity: 'medium',
          quote: quote.text,
          explanation: 'The contract lacks clear data security requirements or confidentiality standards.',
          suggestedFix: 'Add specific security standards (e.g., SOC 2, ISO 27001), breach notification requirements (within 48 hours), and data deletion obligations upon termination.',
          confidence: 0.74,
          sectionIndex: quote.sectionIndex,
          startOffset: quote.startOffset,
          endOffset: quote.endOffset,
        });
      }
    }

    // Governing law issues
    if (text.includes('governing law') || text.includes('jurisdiction')) {
      const quote = this.extractQuote(extraction.fullText, ['governing law', 'jurisdiction']);
      if (quote) {
        const isForeign = text.includes('delaware') || text.includes('new york'); // Naive check
        findings.push({
          id: uuidv4(),
          category: 'governing-law',
          severity: isForeign ? 'low' : 'medium',
          quote: quote.text,
          explanation: 'Review the governing law and jurisdiction to ensure it aligns with your business needs and doesn\'t create undue litigation risk.',
          suggestedFix: 'Consider negotiating for your home jurisdiction or a neutral venue with clear dispute resolution procedures.',
          confidence: 0.68,
          sectionIndex: quote.sectionIndex,
          startOffset: quote.startOffset,
          endOffset: quote.endOffset,
        });
      }
    }

    // If no findings, add a generic low-severity finding
    if (findings.length === 0) {
      findings.push({
        id: uuidv4(),
        category: 'general',
        severity: 'low',
        quote: extraction.fullText.substring(0, 150) + '...',
        explanation: 'No major risk factors detected in this document. Standard contract review is still recommended.',
        suggestedFix: 'Have legal counsel review for jurisdiction-specific requirements and business-specific risk factors.',
        confidence: 0.60,
        sectionIndex: 0,
      });
    }

    return findings;
  }

  /**
   * Pass 3: Synthesize executive summary and top issues
   */
  async synthesize(
    extraction: ExtractionResult,
    findings: Finding[]
  ): Promise<{ summary: string; topIssues: string[] }> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    const highCount = findings.filter(f => f.severity === 'high').length;
    const totalFindings = findings.length;

    let summary = '';
    
    if (criticalCount > 0) {
      summary = `Critical risk detected. This document contains ${criticalCount} critical ${criticalCount === 1 ? 'issue' : 'issues'} that require immediate attention before signing. `;
    } else if (highCount > 0) {
      summary = `High risk identified. ${highCount} high-severity ${highCount === 1 ? 'issue' : 'issues'} should be addressed through negotiation. `;
    } else {
      summary = `Moderate risk profile. `;
    }

    summary += `Overall, ${totalFindings} ${totalFindings === 1 ? 'finding' : 'findings'} identified across liability, termination, and payment terms. `;
    summary += `Key areas of concern include contract lock-in mechanisms, liability exposure, and payment structures. Review recommended with legal counsel before execution.`;

    const topIssues = findings
      .sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      })
      .slice(0, 3)
      .map(f => f.explanation);

    return { summary, topIssues };
  }

  /**
   * Stream synthesis (for real-time UI updates)
   */
  async *synthesizeStream(
    extraction: ExtractionResult,
    findings: Finding[]
  ): AsyncIterable<string> {
    const result = await this.synthesize(extraction, findings);
    const words = result.summary.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      yield words[i] + ' ';
    }
  }

  /**
   * Helper: Extract a quote from the full text
   */
  private extractQuote(
    fullText: string,
    searchTerms: string[]
  ): { text: string; sectionIndex: number; startOffset: number; endOffset: number } | null {
    const lowerText = fullText.toLowerCase();
    
    for (const term of searchTerms) {
      const index = lowerText.indexOf(term.toLowerCase());
      if (index !== -1) {
        // Extract surrounding context (approx 200 chars)
        const start = Math.max(0, index - 50);
        const end = Math.min(fullText.length, index + term.length + 150);
        
        let quote = fullText.substring(start, end).trim();
        
        // Clean up partial sentences
        const firstPeriod = quote.indexOf('. ');
        if (firstPeriod > 0 && firstPeriod < 50) {
          quote = quote.substring(firstPeriod + 2);
        }
        
        const lastPeriod = quote.lastIndexOf('.');
        if (lastPeriod > quote.length - 50) {
          quote = quote.substring(0, lastPeriod + 1);
        }

        return {
          text: quote,
          sectionIndex: 0, // Simplified for mock
          startOffset: start,
          endOffset: end,
        };
      }
    }
    
    return null;
  }
}
