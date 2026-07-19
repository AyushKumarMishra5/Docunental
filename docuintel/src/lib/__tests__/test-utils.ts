/**
 * Testing utilities and mock data generators
 */

import type { Finding, AnalysisResult, DocumentMetadata, ExtractionResult } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export function generateMockFinding(overrides?: Partial<Finding>): Finding {
  const severities: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low'];
  const categories = ['auto-renewal', 'liability', 'termination', 'payment', 'data-confidentiality'];
  
  const severity = overrides?.severity || severities[Math.floor(Math.random() * severities.length)];
  const category = overrides?.category || categories[Math.floor(Math.random() * categories.length)];

  return {
    id: uuidv4(),
    category,
    severity,
    quote: 'Sample contract clause text that contains a potential risk factor.',
    explanation: `This ${severity} severity issue in ${category} requires attention.`,
    suggestedFix: 'Consider negotiating this clause to reduce risk exposure.',
    confidence: 0.85,
    sectionIndex: 0,
    startOffset: 100,
    endOffset: 200,
    ...overrides,
  };
}

export function generateMockDocument(overrides?: Partial<DocumentMetadata>): DocumentMetadata {
  return {
    id: uuidv4(),
    filename: 'sample-contract.pdf',
    fileType: 'pdf',
    fileSize: 1024000,
    uploadedAt: new Date().toISOString(),
    sessionId: uuidv4(),
    ...overrides,
  };
}

export function generateMockAnalysis(overrides?: Partial<AnalysisResult>): AnalysisResult {
  const findings = overrides?.findings || [
    generateMockFinding({ severity: 'critical' }),
    generateMockFinding({ severity: 'high' }),
    generateMockFinding({ severity: 'medium' }),
    generateMockFinding({ severity: 'low' }),
  ];

  return {
    documentId: uuidv4(),
    sessionId: uuidv4(),
    findings,
    riskScore: 65,
    summary: 'This document contains several risk factors that require review before signing.',
    topIssues: [
      'Auto-renewal clause without notice period',
      'Unlimited liability exposure',
      'Unfavorable termination terms',
    ],
    analyzedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function generateMockExtraction(overrides?: Partial<ExtractionResult>): ExtractionResult {
  const text = `
    SAMPLE CONTRACT AGREEMENT
    
    1. TERM AND RENEWAL
    This Agreement shall automatically renew for successive one-year periods unless either party provides written notice of non-renewal at least 90 days prior to the end of the then-current term.
    
    2. LIABILITY
    Each party's liability under this Agreement shall be limited to the amount paid by Customer in the twelve (12) months preceding the claim.
    
    3. TERMINATION
    Either party may terminate this Agreement for convenience upon ninety (90) days' written notice to the other party.
  `;

  return {
    documentId: uuidv4(),
    fullText: text,
    sections: [
      {
        index: 0,
        heading: '1. TERM AND RENEWAL',
        text: 'This Agreement shall automatically renew...',
        startOffset: 0,
        endOffset: 150,
      },
      {
        index: 1,
        heading: '2. LIABILITY',
        text: "Each party's liability under this Agreement...",
        startOffset: 150,
        endOffset: 300,
      },
    ],
    metadata: {
      wordCount: 100,
      characterCount: text.length,
    },
    ...overrides,
  };
}

/**
 * Test helpers
 */
export const testHelpers = {
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  mockFetch: (response: unknown, status = 200) => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(response),
      } as Response)
    );
  },

  mockFileUpload: (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    return new File([blob], filename, { type });
  },

  calculateExpectedRiskScore: (findings: Finding[]) => {
    if (findings.length === 0) return 0;
    const severityWeights = { critical: 10, high: 7, medium: 4, low: 2 };
    const totalWeight = findings.reduce(
      (sum, f) => sum + (severityWeights[f.severity] || 0),
      0
    );
    const maxPossibleWeight = findings.length * 10;
    return Math.round((totalWeight / maxPossibleWeight) * 100);
  },
};

/**
 * Assertion helpers
 */
export const assertions = {
  isFinding: (obj: unknown): obj is Finding => {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'id' in obj &&
      'severity' in obj &&
      'category' in obj &&
      'quote' in obj
    );
  },

  isAnalysisResult: (obj: unknown): obj is AnalysisResult => {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'documentId' in obj &&
      'findings' in obj &&
      'riskScore' in obj
    );
  },

  hasValidSeverity: (finding: Finding) => {
    return ['critical', 'high', 'medium', 'low'].includes(finding.severity);
  },

  hasValidRiskScore: (score: number) => {
    return typeof score === 'number' && score >= 0 && score <= 100;
  },
};
