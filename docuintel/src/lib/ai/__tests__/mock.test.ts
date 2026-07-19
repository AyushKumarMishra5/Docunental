/**
 * Integration tests for AI Mock Adapter
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { MockAIAdapter } from '../mock';
import { defaultRubric } from '../../rubric/default';

describe('MockAIAdapter', () => {
  let adapter: MockAIAdapter;

  beforeEach(() => {
    adapter = new MockAIAdapter();
  });

  describe('extract', () => {
    test('extracts structure from document', async () => {
      const text = `
        1. INTRODUCTION
        This is the introduction section.
        
        2. TERMS AND CONDITIONS
        These are the terms.
      `;
      
      const result = await adapter.extract(text, 'test-doc-id');
      
      expect(result.documentId).toBe('test-doc-id');
      expect(result.fullText).toBe(text);
      expect(result.sections.length).toBeGreaterThan(0);
      expect(result.metadata.wordCount).toBeGreaterThan(0);
      expect(result.metadata.characterCount).toBe(text.length);
    });

    test('handles document without clear sections', async () => {
      const text = 'Simple document without sections.';
      
      const result = await adapter.extract(text, 'test-doc-id');
      
      expect(result.sections.length).toBe(1);
      expect(result.sections[0].text).toContain(text);
    });
  });

  describe('analyze', () => {
    test('finds auto-renewal risks', async () => {
      const extraction = {
        documentId: 'test-id',
        fullText: 'This contract will automatically renew for successive periods without notice.',
        sections: [],
        metadata: { wordCount: 10, characterCount: 100 },
      };
      
      const findings = await adapter.analyze(extraction, defaultRubric);
      
      const autoRenewal = findings.find(f => f.category === 'auto-renewal');
      expect(autoRenewal).toBeDefined();
      expect(autoRenewal?.severity).toBe('critical');
    });

    test('finds liability risks', async () => {
      const extraction = {
        documentId: 'test-id',
        fullText: 'The vendor shall have unlimited liability for all claims.',
        sections: [],
        metadata: { wordCount: 10, characterCount: 100 },
      };
      
      const findings = await adapter.analyze(extraction, defaultRubric);
      
      const liability = findings.find(f => f.category === 'liability');
      expect(liability).toBeDefined();
      expect(liability?.severity).toBe('critical');
    });

    test('returns at least one finding for any document', async () => {
      const extraction = {
        documentId: 'test-id',
        fullText: 'Simple contract with no obvious risks.',
        sections: [],
        metadata: { wordCount: 6, characterCount: 50 },
      };
      
      const findings = await adapter.analyze(extraction, defaultRubric);
      
      expect(findings.length).toBeGreaterThan(0);
    });

    test('all findings have required fields', async () => {
      const extraction = {
        documentId: 'test-id',
        fullText: 'Contract with automatically renew clause and unlimited liability.',
        sections: [],
        metadata: { wordCount: 8, characterCount: 70 },
      };
      
      const findings = await adapter.analyze(extraction, defaultRubric);
      
      findings.forEach(finding => {
        expect(finding.id).toBeDefined();
        expect(finding.category).toBeDefined();
        expect(finding.severity).toMatch(/^(critical|high|medium|low)$/);
        expect(finding.quote).toBeDefined();
        expect(finding.explanation).toBeDefined();
        expect(finding.suggestedFix).toBeDefined();
        expect(finding.confidence).toBeGreaterThan(0);
        expect(finding.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('synthesize', () => {
    test('generates summary with critical findings', async () => {
      const extraction = {
        documentId: 'test-id',
        fullText: 'Test',
        sections: [],
        metadata: { wordCount: 1, characterCount: 4 },
      };
      
      const findings = [
        {
          id: '1',
          category: 'auto-renewal',
          severity: 'critical' as const,
          quote: 'test',
          explanation: 'test',
          suggestedFix: 'test',
          confidence: 0.9,
          sectionIndex: 0,
        },
      ];
      
      const result = await adapter.synthesize(extraction, findings);
      
      expect(result.summary).toContain('Critical risk detected');
      expect(result.topIssues.length).toBeGreaterThan(0);
    });

    test('generates appropriate summary for low risk', async () => {
      const extraction = {
        documentId: 'test-id',
        fullText: 'Test',
        sections: [],
        metadata: { wordCount: 1, characterCount: 4 },
      };
      
      const findings = [
        {
          id: '1',
          category: 'general',
          severity: 'low' as const,
          quote: 'test',
          explanation: 'test',
          suggestedFix: 'test',
          confidence: 0.5,
          sectionIndex: 0,
        },
      ];
      
      const result = await adapter.synthesize(extraction, findings);
      
      expect(result.summary).toContain('Moderate risk profile');
      expect(result.topIssues.length).toBe(1);
    });
  });

  describe('synthesizeStream', () => {
    test('streams summary text', async () => {
      const extraction = {
        documentId: 'test-id',
        fullText: 'Test',
        sections: [],
        metadata: { wordCount: 1, characterCount: 4 },
      };
      
      const findings = [
        {
          id: '1',
          category: 'test',
          severity: 'medium' as const,
          quote: 'test',
          explanation: 'test',
          suggestedFix: 'test',
          confidence: 0.7,
          sectionIndex: 0,
        },
      ];
      
      const chunks: string[] = [];
      for await (const chunk of adapter.synthesizeStream(extraction, findings)) {
        chunks.push(chunk);
      }
      
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join('')).toBeTruthy();
    });
  });
});
