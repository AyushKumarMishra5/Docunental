/**
 * Core domain types for DocuIntel
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface DocumentMetadata {
  id: string;
  filename: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'md';
  fileSize: number;
  uploadedAt: string;
  sessionId: string;
}

export interface Section {
  index: number;
  heading: string | null;
  text: string;
  startOffset: number;
  endOffset: number;
}

export interface ExtractionResult {
  documentId: string;
  fullText: string;
  sections: Section[];
  metadata: {
    pageCount?: number;
    wordCount: number;
    characterCount: number;
  };
}

export interface Finding {
  id: string;
  category: string;
  severity: Severity;
  quote: string;
  explanation: string;
  suggestedFix: string;
  confidence: number;
  sectionIndex: number;
  startOffset?: number;
  endOffset?: number;
}

export interface AnalysisResult {
  documentId: string;
  sessionId: string;
  findings: Finding[];
  riskScore: number;
  summary: string;
  topIssues: string[];
  analyzedAt: string;
  playbookId?: string;
}

export interface RubricCategory {
  id: string;
  name: string;
  description: string;
  riskFactors: string[];
  severityGuidance: {
    critical: string;
    high: string;
    medium: string;
    low: string;
  };
}

export interface Rubric {
  id: string;
  name: string;
  description: string;
  categories: RubricCategory[];
}

export interface Playbook {
  id: string;
  name: string;
  description: string;
  documentId: string;
  baseline: {
    sections: Section[];
    extractedTerms: Record<string, string>;
  };
  createdAt: string;
  sessionId: string;
}

export interface PlaybookComparison {
  playbookId: string;
  documentId: string;
  differences: {
    category: string;
    severity: Severity;
    standardClause: string;
    documentClause: string;
    explanation: string;
  }[];
}

export interface ClauseDiff {
  sectionIndex: number;
  heading: string | null;
  changeType: 'added' | 'removed' | 'modified' | 'unchanged';
  oldText?: string;
  newText?: string;
  riskDelta: 'increased' | 'decreased' | 'neutral';
  explanation?: string;
}

export interface VersionComparison {
  oldDocumentId: string;
  newDocumentId: string;
  clauses: ClauseDiff[];
  summary: string;
  comparedAt: string;
}

export interface FindingFeedback {
  findingId: string;
  documentId: string;
  sessionId: string;
  action: 'confirmed' | 'not-relevant';
  timestamp: string;
}

export interface SessionHistory {
  sessionId: string;
  analyses: {
    id: string;
    documentId: string;
    filename: string;
    analyzedAt: string;
    riskScore: number;
    findingsCount: number;
  }[];
}

export type ProcessingStage = 
  | 'uploading'
  | 'extracting'
  | 'chunking'
  | 'indexing'
  | 'analyzing'
  | 'synthesizing'
  | 'complete'
  | 'error';

export interface ProcessingProgress {
  stage: ProcessingStage;
  message: string;
  progress?: number;
}
