/**
 * Findings Table Component with Feedback Actions
 */

'use client';

import { useState, useMemo } from 'react';
import type { Finding } from '@/lib/types';
import { Badge, Button } from '@/components/ui/primitives';
import { getSeverityColor } from '@/lib/utils';
import { ChevronDown, ChevronUp, Search, CheckCircle, XCircle } from 'lucide-react';

interface FindingsTableProps {
  findings: Finding[];
  selectedId: string | null;
  onSelectFinding: (id: string) => void;
  documentId?: string;
  onFeedback?: (findingId: string, action: 'confirmed' | 'not-relevant') => void;
}

type SortField = 'severity' | 'category' | 'confidence';
type SortDirection = 'asc' | 'desc';

export function FindingsTable({ findings, selectedId, onSelectFinding, documentId, onFeedback }: FindingsTableProps) {
  const [sortField, setSortField] = useState<SortField>('severity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterText, setFilterText] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<Map<string, 'confirmed' | 'not-relevant'>>(new Map());

  const handleFeedback = async (findingId: string, action: 'confirmed' | 'not-relevant') => {
    if (!documentId) return;
    
    setFeedbackState(prev => new Map(prev).set(findingId, action));
    
    if (onFeedback) {
      onFeedback(findingId, action);
    }

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findingId, documentId, action }),
      });
    } catch (error) {
      console.error('Failed to save feedback:', error);
    }
  };

  const sortedAndFiltered = useMemo(() => {
    let result = [...findings];

    // Filter by search text
    if (filterText) {
      const lower = filterText.toLowerCase();
      result = result.filter(f => 
        f.explanation.toLowerCase().includes(lower) ||
        f.category.toLowerCase().includes(lower) ||
        f.quote.toLowerCase().includes(lower)
      );
    }

    // Filter by severity
    if (selectedSeverity) {
      result = result.filter(f => f.severity === selectedSeverity);
    }

    // Sort
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'severity') {
        comparison = severityOrder[a.severity] - severityOrder[b.severity];
      } else if (sortField === 'category') {
        comparison = a.category.localeCompare(b.category);
      } else if (sortField === 'confidence') {
        comparison = a.confidence - b.confidence;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [findings, sortField, sortDirection, filterText, selectedSeverity]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search findings..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-base border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="flex items-center gap-2">
          {(['critical', 'high', 'medium', 'low'] as const).map(severity => (
            <button
              key={severity}
              onClick={() => setSelectedSeverity(selectedSeverity === severity ? null : severity)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedSeverity === severity
                  ? getSeverityColor(severity)
                  : 'bg-panel text-text-secondary hover:bg-hover'
              }`}
            >
              {severity.charAt(0).toUpperCase() + severity.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-panel border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => toggleSort('severity')}
                    className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Severity
                    <SortIcon field="severity" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => toggleSort('category')}
                    className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Category
                    <SortIcon field="category" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                  Issue
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => toggleSort('confidence')}
                    className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Confidence
                    <SortIcon field="confidence" />
                  </button>
                </th>
                {documentId && (
                  <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedAndFiltered.length === 0 ? (
                <tr>
                  <td colSpan={documentId ? 5 : 4} className="px-4 py-8 text-center text-sm text-text-muted">
                    No findings match your filters
                  </td>
                </tr>
              ) : (
                sortedAndFiltered.map((finding) => {
                  const feedback = feedbackState.get(finding.id);
                  
                  return (
                    <tr
                      key={finding.id}
                      onClick={() => onSelectFinding(finding.id)}
                      className={`cursor-pointer transition-colors ${
                        selectedId === finding.id ? 'bg-accent/10' : 
                        feedback === 'not-relevant' ? 'opacity-50' :
                        'hover:bg-hover'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <Badge className={getSeverityColor(finding.severity)}>
                          {finding.severity}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-text-primary font-mono">
                          {finding.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <p className="text-sm text-text-primary font-medium">
                            {finding.explanation}
                          </p>
                          <p className="text-xs text-text-muted line-clamp-1">
                            &ldquo;{finding.quote}&rdquo;
                          </p>
                          {feedback && (
                            <Badge variant="secondary" className="text-xs">
                              {feedback === 'confirmed' ? 'Confirmed' : 'Not Relevant'}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-panel rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-accent"
                              style={{ width: `${finding.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-text-muted font-mono">
                            {Math.round(finding.confidence * 100)}%
                          </span>
                        </div>
                      </td>
                      {documentId && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleFeedback(finding.id, 'confirmed')}
                              disabled={!!feedback}
                              className="p-1 rounded hover:bg-low/20 text-low disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              title="Confirm finding"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleFeedback(finding.id, 'not-relevant')}
                              disabled={!!feedback}
                              className="p-1 rounded hover:bg-critical/20 text-critical disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              title="Mark as not relevant"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-text-muted">
        Showing {sortedAndFiltered.length} of {findings.length} findings
      </div>
    </div>
  );
}
