/**
 * Enhanced Results Dashboard with Document Viewer
 */

'use client';

import { useState } from 'react';
import type { DocumentMetadata, AnalysisResult, ExtractionResult } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@/components/ui/primitives';
import { getRiskScoreColor, getSeverityColor, formatRelativeDate } from '@/lib/utils';
import { AlertTriangle, CheckCircle, FileText, TrendingUp, Download, Columns } from 'lucide-react';
import { RiskBreakdownChart } from './RiskBreakdownChart';
import { FindingsTable } from './FindingsTable';
import { DocumentViewer } from './DocumentViewer';

interface EnhancedResultsDashboardProps {
  document: DocumentMetadata;
  analysis: AnalysisResult;
  extraction: ExtractionResult;
}

export function EnhancedResultsDashboard({ document, analysis, extraction }: EnhancedResultsDashboardProps) {
  const [selectedFinding, setSelectedFinding] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'dashboard' | 'split'>('dashboard');

  const severityCounts = {
    critical: analysis.findings.filter(f => f.severity === 'critical').length,
    high: analysis.findings.filter(f => f.severity === 'high').length,
    medium: analysis.findings.filter(f => f.severity === 'medium').length,
    low: analysis.findings.filter(f => f.severity === 'low').length,
  };

  const handleFindingSelect = (id: string) => {
    setSelectedFinding(id);
    if (viewMode === 'dashboard') {
      setViewMode('split');
    }
  };

  if (viewMode === 'split') {
    return (
      <div className="max-w-[1800px] mx-auto">
        {/* Header with view toggle */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-6 w-6 text-text-secondary" />
              <h1 className="font-display text-3xl text-text-primary">{document.filename}</h1>
            </div>
            <p className="text-sm text-text-secondary">
              Analyzed {formatRelativeDate(analysis.analyzedAt)} · {analysis.findings.length} findings
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('dashboard')}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-panel border border-border hover:bg-hover transition-colors text-sm font-medium text-text-primary"
            >
              Dashboard View
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-panel border border-border hover:bg-hover transition-colors text-sm font-medium text-text-primary">
              <Download className="h-4 w-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Split View: Findings + Document */}
        <div className="grid grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Left: Findings */}
          <div className="flex flex-col space-y-4 overflow-hidden">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Findings</CardTitle>
                    <CardDescription>{analysis.findings.length} issues identified</CardDescription>
                  </div>
                  <div className={`text-3xl font-bold ${getRiskScoreColor(analysis.riskScore)}`}>
                    {analysis.riskScore}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <FindingsTable 
                  findings={analysis.findings} 
                  selectedId={selectedFinding}
                  onSelectFinding={setSelectedFinding}
                  documentId={document.id}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right: Document Viewer */}
          <div className="flex flex-col overflow-hidden">
            <DocumentViewer
              extraction={extraction}
              findings={analysis.findings}
              selectedFindingId={selectedFinding}
              onFindingClick={setSelectedFinding}
            />
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View (original)
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-6 w-6 text-text-secondary" />
            <h1 className="font-display text-3xl text-text-primary">{document.filename}</h1>
          </div>
          <p className="text-sm text-text-secondary">
            Analyzed {formatRelativeDate(analysis.analyzedAt)} · {analysis.findings.length} findings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode('split')}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-accent text-text-inverse hover:bg-accent-hover transition-colors text-sm font-medium"
          >
            <Columns className="h-4 w-4" />
            View with Document
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-panel border border-border hover:bg-hover transition-colors text-sm font-medium text-text-primary">
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className={`text-6xl font-bold ${getRiskScoreColor(analysis.riskScore)}`}>
                {analysis.riskScore}
              </div>
              <div className="text-sm text-text-muted text-center mt-1">Risk Score</div>
            </div>
            <div className="flex-1">
              <p className="text-text-primary leading-relaxed">{analysis.summary}</p>
            </div>
          </div>

          {/* Top Issues */}
          {analysis.topIssues.length > 0 && (
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Top Issues to Address
              </h4>
              <ul className="space-y-2">
                {analysis.topIssues.map((issue, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-text-primary">
                    <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-medium">
                      {index + 1}
                    </span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Critical"
          value={severityCounts.critical}
          color="critical"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="High"
          value={severityCounts.high}
          color="high"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Medium"
          value={severityCounts.medium}
          color="medium"
        />
        <StatCard
          icon={<CheckCircle className="h-5 w-5" />}
          label="Low"
          value={severityCounts.low}
          color="low"
        />
      </div>

      {/* Risk Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Breakdown by Category</CardTitle>
          <CardDescription>Distribution of findings across risk categories</CardDescription>
        </CardHeader>
        <CardContent>
          <RiskBreakdownChart findings={analysis.findings} />
        </CardContent>
      </Card>

      {/* Findings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Findings</CardTitle>
          <CardDescription>All identified risks and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <FindingsTable 
            findings={analysis.findings} 
            selectedId={selectedFinding}
            onSelectFinding={handleFindingSelect}
            documentId={document.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  color: string;
}) {
  const colorClasses = {
    critical: 'text-critical',
    high: 'text-high',
    medium: 'text-medium',
    low: 'text-low',
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3">
        <div className={`${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className={`text-2xl font-bold ${colorClasses[color as keyof typeof colorClasses]}`}>
            {value}
          </div>
          <div className="text-sm text-text-muted">{label}</div>
        </div>
      </div>
    </Card>
  );
}
