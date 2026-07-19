/**
 * Unit tests for core utilities
 */

import { describe, test, expect } from '@jest/globals';
import {
  calculateRiskScore,
  getRiskScoreColor,
  getSeverityColor,
  formatFileSize,
  formatRelativeDate,
  truncate,
  findTextOffset,
} from '../utils';

describe('Risk Score Calculation', () => {
  test('calculates risk score correctly for mixed severities', () => {
    const findings = [
      { severity: 'critical' },
      { severity: 'high' },
      { severity: 'medium' },
      { severity: 'low' },
    ];
    const score = calculateRiskScore(findings);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('returns 0 for empty findings', () => {
    expect(calculateRiskScore([])).toBe(0);
  });

  test('returns 100 for all critical findings', () => {
    const findings = [
      { severity: 'critical' },
      { severity: 'critical' },
      { severity: 'critical' },
    ];
    expect(calculateRiskScore(findings)).toBe(100);
  });

  test('calculates correct score for single finding', () => {
    expect(calculateRiskScore([{ severity: 'critical' }])).toBe(100);
    expect(calculateRiskScore([{ severity: 'high' }])).toBe(70);
    expect(calculateRiskScore([{ severity: 'medium' }])).toBe(40);
    expect(calculateRiskScore([{ severity: 'low' }])).toBe(20);
  });
});

describe('Color Utilities', () => {
  test('getRiskScoreColor returns correct colors', () => {
    expect(getRiskScoreColor(90)).toBe('text-critical');
    expect(getRiskScoreColor(60)).toBe('text-high');
    expect(getRiskScoreColor(40)).toBe('text-medium');
    expect(getRiskScoreColor(10)).toBe('text-low');
  });

  test('getSeverityColor returns correct classes', () => {
    expect(getSeverityColor('critical')).toContain('critical');
    expect(getSeverityColor('high')).toContain('high');
    expect(getSeverityColor('medium')).toContain('medium');
    expect(getSeverityColor('low')).toContain('low');
  });
});

describe('Format Utilities', () => {
  test('formatFileSize formats bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1048576)).toBe('1 MB');
    expect(formatFileSize(1073741824)).toBe('1 GB');
  });

  test('formatRelativeDate formats dates correctly', () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const oneDayAgo = new Date(now.getTime() - 86400000);

    expect(formatRelativeDate(oneMinuteAgo.toISOString())).toBe('1m ago');
    expect(formatRelativeDate(oneHourAgo.toISOString())).toBe('1h ago');
    expect(formatRelativeDate(oneDayAgo.toISOString())).toBe('1d ago');
  });

  test('truncate shortens text correctly', () => {
    expect(truncate('short', 10)).toBe('short');
    expect(truncate('this is a long text', 10)).toBe('this is...');
    expect(truncate('exactly ten!', 12)).toBe('exactly ten!');
  });
});

describe('Text Offset Finding', () => {
  test('finds correct offset for existing text', () => {
    const fullText = 'The quick brown fox jumps over the lazy dog';
    const result = findTextOffset(fullText, 'brown fox');
    
    expect(result).not.toBeNull();
    expect(result?.start).toBe(10);
    expect(result?.end).toBe(19);
  });

  test('returns null for non-existing text', () => {
    const fullText = 'The quick brown fox';
    const result = findTextOffset(fullText, 'purple elephant');
    
    expect(result).toBeNull();
  });

  test('finds offset for text at start', () => {
    const fullText = 'Start of text';
    const result = findTextOffset(fullText, 'Start');
    
    expect(result?.start).toBe(0);
    expect(result?.end).toBe(5);
  });

  test('finds offset for text at end', () => {
    const fullText = 'Text at the end';
    const result = findTextOffset(fullText, 'end');
    
    expect(result?.start).toBe(12);
    expect(result?.end).toBe(15);
  });
});
