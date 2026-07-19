/**
 * Document Viewer with Inline Highlights
 * The signature feature: click findings to jump to exact source text
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Finding, ExtractionResult } from '@/lib/types';
import { getSeverityColor } from '@/lib/utils';
import { FileText, ZoomIn, ZoomOut } from 'lucide-react';

interface DocumentViewerProps {
  extraction: ExtractionResult;
  findings: Finding[];
  selectedFindingId: string | null;
  onFindingClick?: (findingId: string) => void;
}

export function DocumentViewer({ 
  extraction, 
  findings, 
  selectedFindingId,
  onFindingClick 
}: DocumentViewerProps) {
  const [fontSize, setFontSize] = useState(14);
  const viewerRef = useRef<HTMLDivElement>(null);
  const highlightRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Build a map of text offsets to findings
  const offsetMap = new Map<string, Finding>();
  findings.forEach(finding => {
    if (finding.startOffset !== undefined && finding.endOffset !== undefined) {
      offsetMap.set(`${finding.startOffset}-${finding.endOffset}`, finding);
    } else {
      // Fallback: find by quote
      const index = extraction.fullText.indexOf(finding.quote);
      if (index !== -1) {
        finding.startOffset = index;
        finding.endOffset = index + finding.quote.length;
        offsetMap.set(`${finding.startOffset}-${finding.endOffset}`, finding);
      }
    }
  });

  // Scroll to selected finding
  useEffect(() => {
    if (selectedFindingId) {
      const element = highlightRefs.current.get(selectedFindingId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedFindingId]);

  // Render text with highlights
  const renderHighlightedText = () => {
    const text = extraction.fullText;
    const segments: Array<{ text: string; finding?: Finding; start: number; end: number }> = [];
    
    // Sort findings by start offset
    const sortedFindings = findings
      .filter(f => f.startOffset !== undefined && f.endOffset !== undefined)
      .sort((a, b) => a.startOffset! - b.startOffset!);

    let lastIndex = 0;
    sortedFindings.forEach(finding => {
      const start = finding.startOffset!;
      const end = finding.endOffset!;

      // Add text before this finding
      if (start > lastIndex) {
        segments.push({ text: text.substring(lastIndex, start), start: lastIndex, end: start });
      }

      // Add highlighted finding
      segments.push({ text: text.substring(start, end), finding, start, end });
      lastIndex = end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      segments.push({ text: text.substring(lastIndex), start: lastIndex, end: text.length });
    }

    return segments.map((segment, index) => {
      if (segment.finding) {
        const isSelected = segment.finding.id === selectedFindingId;
        const severityColor = getSeverityColor(segment.finding.severity);
        
        return (
          <motion.mark
            key={`${segment.finding.id}-${index}`}
            ref={(el) => {
              if (el) highlightRefs.current.set(segment.finding!.id, el);
            }}
            className={`cursor-pointer rounded-sm px-0.5 transition-all ${severityColor} ${
              isSelected ? 'ring-2 ring-accent shadow-lg' : 'hover:ring-1 hover:ring-accent/50'
            }`}
            onClick={() => onFindingClick?.(segment.finding!.id)}
            animate={isSelected ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 0.3 }}
            title={`${segment.finding.severity.toUpperCase()}: ${segment.finding.category}`}
          >
            {segment.text}
          </motion.mark>
        );
      }
      
      return <span key={`text-${index}`}>{segment.text}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full border border-border rounded-lg overflow-hidden bg-base">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-panel">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <FileText className="h-4 w-4" />
          <span className="font-medium">{extraction.metadata.wordCount.toLocaleString()} words</span>
          <span className="text-text-muted">·</span>
          <span>{findings.length} highlights</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFontSize(Math.max(10, fontSize - 2))}
            className="p-2 rounded hover:bg-hover transition-colors"
            aria-label="Decrease font size"
          >
            <ZoomOut className="h-4 w-4 text-text-secondary" />
          </button>
          <span className="text-xs text-text-muted font-mono w-12 text-center">
            {fontSize}px
          </span>
          <button
            onClick={() => setFontSize(Math.min(24, fontSize + 2))}
            className="p-2 rounded hover:bg-hover transition-colors"
            aria-label="Increase font size"
          >
            <ZoomIn className="h-4 w-4 text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Document Content */}
      <div 
        ref={viewerRef}
        className="flex-1 overflow-y-auto p-8"
      >
        <div 
          className="max-w-4xl mx-auto font-body text-text-primary leading-relaxed whitespace-pre-wrap"
          style={{ fontSize: `${fontSize}px` }}
        >
          {renderHighlightedText()}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-border bg-panel">
        <div className="flex items-center gap-4 text-xs">
          <span className="text-text-muted">Severity:</span>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded ${getSeverityColor('critical')}`}>Critical</span>
            <span className={`px-2 py-0.5 rounded ${getSeverityColor('high')}`}>High</span>
            <span className={`px-2 py-0.5 rounded ${getSeverityColor('medium')}`}>Medium</span>
            <span className={`px-2 py-0.5 rounded ${getSeverityColor('low')}`}>Low</span>
          </div>
        </div>
      </div>
    </div>
  );
}
