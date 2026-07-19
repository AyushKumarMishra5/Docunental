/**
 * AI Adapter Interface
 * Abstracts OpenRouter (real) vs. mock implementation
 */

import type { ExtractionResult, Finding, Rubric, Playbook } from '@/lib/types';

export interface AIAdapter {
  /**
   * Pass 1: Extract document structure and sections
   */
  extract(text: string, documentId: string): Promise<ExtractionResult>;

  /**
   * Pass 2: Analyze document against rubric
   */
  analyze(
    extraction: ExtractionResult,
    rubric: Rubric,
    playbook?: Playbook
  ): Promise<Finding[]>;

  /**
   * Pass 3: Synthesize executive summary and top issues
   */
  synthesize(
    extraction: ExtractionResult,
    findings: Finding[]
  ): Promise<{
    summary: string;
    topIssues: string[];
  }>;

  /**
   * Stream synthesis for real-time UI updates
   */
  synthesizeStream(
    extraction: ExtractionResult,
    findings: Finding[]
  ): AsyncIterable<string>;
}

/**
 * Factory function to get the appropriate adapter based on environment
 */
export async function getAIAdapter(): Promise<AIAdapter> {
  const useMock = process.env.USE_MOCK === '1' || !process.env.OPENROUTER_API_KEY;
  
  if (useMock) {
    const { MockAIAdapter } = await import('./mock');
    return new MockAIAdapter();
  } else {
    const { OpenRouterAdapter } = await import('./openrouter');
    return new OpenRouterAdapter();
  }
}
