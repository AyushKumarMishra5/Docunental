/**
 * OpenRouter AI Adapter (production)
 */

import OpenAI from 'openai';
import type { ExtractionResult, Finding, Rubric, Playbook } from '@/lib/types';
import type { AIAdapter } from './adapter';
import { v4 as uuidv4 } from 'uuid';

export class OpenRouterAdapter implements AIAdapter {
  private client: OpenAI;
  private model: string;

  constructor() {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY not set in environment variables');
    }

    this.client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    });

    this.model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';
  }

  /**
   * Pass 1: Extract document structure and sections
   */
  async extract(text: string, documentId: string): Promise<ExtractionResult> {
    const prompt = `You are a document structure analyzer. Extract the hierarchical structure from this document.

Document:
${text}

Return a JSON object with:
- sections: array of { index, heading, text, startOffset, endOffset }
- metadata: { pageCount?, wordCount, characterCount }

Identify section headings (numbered, lettered, or titled) and extract the text for each section. Calculate accurate character offsets for each section.`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    console.log('OpenRouter extract response:', JSON.stringify(response, null, 2));

    if (!response.choices || response.choices.length === 0) {
      throw new Error('No choices in AI response');
    }

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty content in AI response');
    }

    const parsed = JSON.parse(content);

    return {
      documentId,
      fullText: text,
      sections: parsed.sections || [],
      metadata: {
        wordCount: text.split(/\s+/).length,
        characterCount: text.length,
        ...parsed.metadata,
      },
    };
  }

  /**
   * Pass 2: Analyze document against rubric
   */
  async analyze(
    extraction: ExtractionResult,
    rubric: Rubric,
    playbook?: Playbook
  ): Promise<Finding[]> {
    const rubricDescription = rubric.categories
      .map(cat => `${cat.name}: ${cat.description}`)
      .join('\n');

    const prompt = `You are a contract risk analyst. Analyze this document for risk factors.

Document:
${extraction.fullText}

Rubric Categories:
${rubricDescription}

${playbook ? `Compare against this baseline:\n${JSON.stringify(playbook.baseline.extractedTerms, null, 2)}` : ''}

Return a JSON array of findings, each with:
{
  "category": string (matching rubric),
  "severity": "critical" | "high" | "medium" | "low",
  "quote": string (exact text from document),
  "explanation": string (why this is a risk),
  "suggestedFix": string (how to mitigate),
  "confidence": number (0-1),
  "sectionIndex": number
}

Focus on actual risks present in the document. Be specific and cite exact text.`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error('No choices in AI response');
    }

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty content in AI response');
    }

    const parsed = JSON.parse(content);
    const findings = (parsed.findings || []).map((f: Record<string, unknown>) => ({
      ...f,
      id: uuidv4(),
    }));

    return findings;
  }

  /**
   * Pass 3: Synthesize executive summary and top issues
   */
  async synthesize(
    extraction: ExtractionResult,
    findings: Finding[]
  ): Promise<{ summary: string; topIssues: string[] }> {
    const findingsSummary = findings.map(f => 
      `${f.severity.toUpperCase()}: ${f.category} - ${f.explanation}`
    ).join('\n');

    const prompt = `You are a legal risk analyst. Generate an executive summary for these document findings.

Document: ${extraction.metadata.wordCount} words
Findings:
${findingsSummary}

Return a JSON object with:
{
  "summary": string (2-3 sentence executive summary of overall risk),
  "topIssues": string[] (3 most critical issues to address)
}`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error('No choices in AI response');
    }

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty content in AI response');
    }

    return JSON.parse(content);
  }

  /**
   * Stream synthesis for real-time UI updates
   */
  async *synthesizeStream(
    extraction: ExtractionResult,
    findings: Finding[]
  ): AsyncIterable<string> {
    const findingsSummary = findings.map(f => 
      `${f.severity.toUpperCase()}: ${f.category} - ${f.explanation}`
    ).join('\n');

    const prompt = `You are a legal risk analyst. Generate an executive summary for these document findings.

Document: ${extraction.metadata.wordCount} words
Findings:
${findingsSummary}

Provide a 2-3 sentence executive summary of the overall risk profile.`;

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      temperature: 0.3,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }
}
