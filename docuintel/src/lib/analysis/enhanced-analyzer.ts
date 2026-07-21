/**
 * Enhanced Analysis Engine
 * Provides comprehensive contract analysis with detailed insights
 */

import type { ExtractionResult, Finding, Rubric } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export class EnhancedAnalyzer {
  /**
   * Perform comprehensive document analysis
   */
  static async analyzeDocument(text: string, extraction: ExtractionResult, rubric: Rubric): Promise<Finding[]> {
    const findings: Finding[] = [];

    // 1. Analyze high-risk terms
    const riskTermFindings = this.analyzeRiskTerms(text, extraction);
    findings.push(...riskTermFindings);

    // 2. Analyze financial terms
    const financialFindings = this.analyzeFinancialTerms(text, extraction);
    findings.push(...financialFindings);

    // 3. Analyze temporal terms (deadlines, durations)
    const temporalFindings = this.analyzeTemporalTerms(text, extraction);
    findings.push(...temporalFindings);

    // 4. Analyze legal obligations
    const obligationFindings = this.analyzeObligations(text, extraction);
    findings.push(...obligationFindings);

    // 5. Analyze missing protections
    const protectionFindings = this.analyzeMissingProtections(text, extraction);
    findings.push(...protectionFindings);

    // 6. Analyze liability and indemnification
    const liabilityFindings = this.analyzeLiability(text, extraction);
    findings.push(...liabilityFindings);

    // 7. Analyze termination clauses
    const terminationFindings = this.analyzeTermination(text, extraction);
    findings.push(...terminationFindings);

    return findings;
  }

  private static analyzeRiskTerms(text: string, extraction: ExtractionResult): Finding[] {
    const findings: Finding[] = [];
    const lowerText = text.toLowerCase();

    const criticalTerms = [
      { term: 'irrevocable', severity: 'critical', category: 'Binding Terms', risk: 'Cannot be reversed or undone' },
      { term: 'perpetual', severity: 'critical', category: 'Duration', risk: 'Lasts forever with no end date' },
      { term: 'unlimited liability', severity: 'critical', category: 'Liability', risk: 'No cap on financial exposure' },
      { term: 'class action waiver', severity: 'critical', category: 'Legal Rights', risk: 'Cannot join class action lawsuits' },
      { term: 'binding arbitration', severity: 'high', category: 'Dispute Resolution', risk: 'Cannot sue in court' },
      { term: 'at will', severity: 'high', category: 'Employment', risk: 'Can be terminated without cause' },
      { term: 'non-refundable', severity: 'high', category: 'Payment', risk: 'Payment cannot be recovered' },
      { term: 'automatic renewal', severity: 'medium', category: 'Renewal', risk: 'Renews automatically unless cancelled' },
      { term: 'sole discretion', severity: 'high', category: 'Control', risk: 'Other party has unilateral control' },
      { term: 'hold harmless', severity: 'high', category: 'Liability', risk: 'Must protect other party from claims' },
      { term: 'indemnify', severity: 'high', category: 'Liability', risk: 'Must compensate for losses or damages' },
      { term: 'waive', severity: 'high', category: 'Rights', risk: 'Giving up legal rights' },
      { term: 'forfeit', severity: 'high', category: 'Rights', risk: 'Losing rights or property' },
    ];

    for (const { term, severity, category, risk } of criticalTerms) {
      if (lowerText.includes(term)) {
        const regex = new RegExp(`[^.]*${term}[^.]*\\.`, 'i');
        const match = text.match(regex);
        const quote = match ? match[0].trim() : `Contains "${term}"`;

        findings.push({
          id: uuidv4(),
          category,
          severity: severity as 'critical' | 'high' | 'medium' | 'low',
          quote,
          explanation: `This document contains "${term}" which means: ${risk}. This clause should be carefully reviewed and potentially negotiated.`,
          suggestedFix: `Consider negotiating to ${this.getSuggestedFix(term)} or adding protective conditions.`,
          confidence: 0.9,
          sectionIndex: 0,
        });
      }
    }

    return findings;
  }

  private static analyzeFinancialTerms(text: string, extraction: ExtractionResult): Finding[] {
    const findings: Finding[] = [];
    
    // Find all monetary amounts
    const moneyRegex = /\$[\d,]+(?:\.\d{2})?/g;
    const amounts = text.match(moneyRegex) || [];

    if (amounts.length > 0) {
      const maxAmount = amounts.reduce((max, curr) => {
        const num = parseFloat(curr.replace(/[$,]/g, ''));
        const maxNum = parseFloat(max.replace(/[$,]/g, ''));
        return num > maxNum ? curr : max;
      });

      findings.push({
        id: uuidv4(),
        category: 'Financial Terms',
        severity: 'medium',
        quote: `Document references ${amounts.length} monetary amounts, highest being ${maxAmount}`,
        explanation: `This document contains significant financial obligations. Ensure all amounts, payment terms, and conditions are clearly understood.`,
        suggestedFix: 'Verify all amounts are correct, payment schedules are feasible, and penalties/late fees are reasonable.',
        confidence: 1.0,
        sectionIndex: 0,
      });
    }

    // Check for penalties and fees
    if (text.toLowerCase().includes('penalty') || text.toLowerCase().includes('late fee')) {
      findings.push({
        id: uuidv4(),
        category: 'Penalties',
        severity: 'high',
        quote: 'Document contains penalty or late fee provisions',
        explanation: 'Penalty clauses can result in unexpected costs. Ensure they are reasonable and clearly defined.',
        suggestedFix: 'Negotiate to cap penalties at a reasonable amount or add grace periods.',
        confidence: 0.95,
        sectionIndex: 0,
      });
    }

    return findings;
  }

  private static analyzeTemporalTerms(text: string, extraction: ExtractionResult): Finding[] {
    const findings: Finding[] = [];

    // Find notice periods
    const noticeRegex = /(\d+)\s*days?\s*notice/gi;
    const noticeMatches = [...text.matchAll(noticeRegex)];

    if (noticeMatches.length > 0) {
      const noticeDays = noticeMatches.map(m => parseInt(m[1]));
      const minNotice = Math.min(...noticeDays);

      if (minNotice < 30) {
        findings.push({
          id: uuidv4(),
          category: 'Termination Notice',
          severity: 'medium',
          quote: `Requires ${minNotice} days notice`,
          explanation: `Short notice period of ${minNotice} days may not provide sufficient time to prepare for termination or find alternatives.`,
          suggestedFix: `Request at least 30 days notice for significant actions like termination.`,
          confidence: 0.9,
          sectionIndex: 0,
        });
      }
    }

    // Check for time-sensitive obligations
    const deadlineRegex = /within\s+(\d+)\s+(day|week|month|hour)/gi;
    const deadlines = [...text.matchAll(deadlineRegex)];

    if (deadlines.length > 3) {
      findings.push({
        id: uuidv4(),
        category: 'Time Obligations',
        severity: 'medium',
        quote: `Document contains ${deadlines.length} time-sensitive obligations`,
        explanation: 'Multiple tight deadlines increase the risk of non-compliance. Ensure all deadlines are achievable.',
        suggestedFix: 'Review all deadlines for feasibility and negotiate extensions where needed.',
        confidence: 0.85,
        sectionIndex: 0,
      });
    }

    return findings;
  }

  private static analyzeObligations(text: string, extraction: ExtractionResult): Finding[] {
    const findings: Finding[] = [];
    const lowerText = text.toLowerCase();

    const obligationTerms = [
      'must', 'shall', 'required to', 'obligated to', 'responsible for',
      'duty to', 'covenant to', 'agree to', 'undertake to'
    ];

    let obligationCount = 0;
    for (const term of obligationTerms) {
      const count = (lowerText.match(new RegExp(term, 'g')) || []).length;
      obligationCount += count;
    }

    if (obligationCount > 10) {
      findings.push({
        id: uuidv4(),
        category: 'Obligations',
        severity: 'high',
        quote: `Document contains approximately ${obligationCount} mandatory obligations`,
        explanation: `High number of obligations increases compliance burden and risk. Each "shall", "must", or "required to" creates a binding duty.`,
        suggestedFix: 'Review each obligation for feasibility and negotiate to reduce, clarify, or add conditions to burdensome requirements.',
        confidence: 0.9,
        sectionIndex: 0,
      });
    }

    return findings;
  }

  private static analyzeMissingProtections(text: string, extraction: ExtractionResult): Finding[] {
    const findings: Finding[] = [];
    const lowerText = text.toLowerCase();

    const protections = [
      { term: 'warranty', description: 'warranties or guarantees' },
      { term: 'guarantee', description: 'performance guarantees' },
      { term: 'refund', description: 'refund rights' },
      { term: 'cure period', description: 'right to cure breaches' },
      { term: 'force majeure', description: 'force majeure protection' },
      { term: 'confidentiality', description: 'confidentiality protections' },
      { term: 'liability cap', description: 'liability limitations' },
    ];

    const missing: string[] = [];
    for (const { term, description } of protections) {
      if (!lowerText.includes(term)) {
        missing.push(description);
      }
    }

    if (missing.length > 3) {
      findings.push({
        id: uuidv4(),
        category: 'Missing Protections',
        severity: 'high',
        quote: `Document appears to lack: ${missing.slice(0, 3).join(', ')}`,
        explanation: `Several standard protective clauses appear to be missing. This may leave you exposed to risks without typical safeguards.`,
        suggestedFix: `Consider adding: ${missing.join(', ')} to better protect your interests.`,
        confidence: 0.75,
        sectionIndex: 0,
      });
    }

    return findings;
  }

  private static analyzeLiability(text: string, extraction: ExtractionResult): Finding[] {
    const findings: Finding[] = [];
    const lowerText = text.toLowerCase();

    if (lowerText.includes('unlimited') && lowerText.includes('liability')) {
      findings.push({
        id: uuidv4(),
        category: 'Liability',
        severity: 'critical',
        quote: 'Document contains unlimited liability provisions',
        explanation: '⚠️ CRITICAL: Unlimited liability means you could be responsible for damages without any cap. This creates extreme financial risk.',
        suggestedFix: 'STRONGLY RECOMMEND: Negotiate to cap liability at a specific amount (e.g., fees paid, insurance coverage, or reasonable maximum).',
        confidence: 0.95,
        sectionIndex: 0,
      });
    }

    if (lowerText.includes('indemnify') || lowerText.includes('hold harmless')) {
      const isMutual = lowerText.includes('mutual indemnification') || lowerText.includes('each party shall indemnify');
      
      findings.push({
        id: uuidv4(),
        category: 'Indemnification',
        severity: isMutual ? 'medium' : 'high',
        quote: isMutual ? 'Mutual indemnification clause present' : 'One-sided indemnification clause present',
        explanation: isMutual 
          ? 'Mutual indemnification means both parties protect each other from certain claims. This is generally fair.'
          : '⚠️ One-sided indemnification means you must protect the other party from claims, but they may not protect you. This is unbalanced.',
        suggestedFix: isMutual 
          ? 'Ensure indemnification is limited to actual breaches and excludes third-party claims beyond your control.'
          : 'Negotiate for mutual indemnification or at least cap your indemnification obligations.',
        confidence: 0.9,
        sectionIndex: 0,
      });
    }

    return findings;
  }

  private static analyzeTermination(text: string, extraction: ExtractionResult): Finding[] {
    const findings: Finding[] = [];
    const lowerText = text.toLowerCase();

    const hasTerminationForCause = lowerText.includes('terminate for cause') || lowerText.includes('termination for breach');
    const hasTerminationForConvenience = lowerText.includes('terminate for convenience') || lowerText.includes('terminate without cause');
    const hasNoticeRequirement = lowerText.includes('notice') && lowerText.includes('terminat');

    if (!hasTerminationForCause && !hasTerminationForConvenience) {
      findings.push({
        id: uuidv4(),
        category: 'Termination Rights',
        severity: 'high',
        quote: 'No clear termination provisions found',
        explanation: 'Lack of termination clauses may lock you into the agreement with no exit. This is risky if circumstances change.',
        suggestedFix: 'Add termination rights: for cause (breach), for convenience (with notice), and automatic (force majeure, insolvency).',
        confidence: 0.8,
        sectionIndex: 0,
      });
    } else if (!hasTerminationForConvenience) {
      findings.push({
        id: uuidv4(),
        category: 'Termination Rights',
        severity: 'medium',
        quote: 'Only termination for cause is available',
        explanation: 'You can only terminate if the other party breaches. Consider adding ability to terminate for convenience with notice.',
        suggestedFix: 'Add termination for convenience provision (e.g., "either party may terminate with 60 days written notice").',
        confidence: 0.85,
        sectionIndex: 0,
      });
    }

    if (lowerText.includes('survive termination') || lowerText.includes('survival')) {
      findings.push({
        id: uuidv4(),
        category: 'Survival Clauses',
        severity: 'medium',
        quote: 'Certain obligations survive termination',
        explanation: 'Some clauses continue after the agreement ends (e.g., confidentiality, indemnification). Ensure these are reasonable.',
        suggestedFix: 'Review survival clauses to ensure they have time limits and don\'t impose indefinite obligations.',
        confidence: 0.9,
        sectionIndex: 0,
      });
    }

    return findings;
  }

  private static getSuggestedFix(term: string): string {
    const fixes: Record<string, string> = {
      'irrevocable': 'make it revocable with notice',
      'perpetual': 'add a defined term or renewal period',
      'unlimited liability': 'cap liability at a specific amount',
      'class action waiver': 'remove or make it mutual',
      'binding arbitration': 'allow option for court proceedings',
      'at will': 'require cause for termination',
      'non-refundable': 'make partially refundable or add conditions',
      'automatic renewal': 'require opt-in renewal',
      'sole discretion': 'require reasonableness or mutual agreement',
      'hold harmless': 'limit scope or make mutual',
      'indemnify': 'cap indemnification or make mutual',
      'waive': 'remove the waiver or limit its scope',
      'forfeit': 'add cure period or make it conditional',
    };
    return fixes[term] || 'negotiate more favorable terms';
  }
}
