import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate risk score from findings (severity-weighted)
 */
export function calculateRiskScore(findings: Array<{ severity: string }>): number {
  if (findings.length === 0) return 0;
  
  const severityWeights = {
    critical: 10,
    high: 7,
    medium: 4,
    low: 2,
  };
  
  const totalWeight = findings.reduce((sum, finding) => {
    const weight = severityWeights[finding.severity as keyof typeof severityWeights] || 0;
    return sum + weight;
  }, 0);
  
  const maxPossibleWeight = findings.length * 10;
  
  return Math.round((totalWeight / maxPossibleWeight) * 100);
}

/**
 * Get risk score color class
 */
export function getRiskScoreColor(score: number): string {
  if (score >= 75) return 'text-critical';
  if (score >= 50) return 'text-high';
  if (score >= 25) return 'text-medium';
  return 'text-low';
}

/**
 * Get severity badge color
 */
export function getSeverityColor(severity: string): string {
  const colors = {
    critical: 'bg-critical/10 text-critical border-critical/20',
    high: 'bg-high/10 text-high border-high/20',
    medium: 'bg-medium/10 text-medium border-medium/20',
    low: 'bg-low/10 text-low border-low/20',
  };
  return colors[severity as keyof typeof colors] || colors.low;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format date relative to now
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Find text offset in document (for highlighting)
 */
export function findTextOffset(fullText: string, quote: string): { start: number; end: number } | null {
  const index = fullText.indexOf(quote);
  if (index === -1) return null;
  
  return {
    start: index,
    end: index + quote.length,
  };
}
