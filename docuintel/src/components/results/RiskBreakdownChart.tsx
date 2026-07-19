/**
 * Risk Breakdown Chart Component
 */

'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Finding } from '@/lib/types';
import { tokens } from '@/lib/theme/tokens';

interface RiskBreakdownChartProps {
  findings: Finding[];
}

export function RiskBreakdownChart({ findings }: RiskBreakdownChartProps) {
  const data = useMemo(() => {
    const categoryMap = new Map<string, { critical: number; high: number; medium: number; low: number }>();

    findings.forEach(finding => {
      const current = categoryMap.get(finding.category) || { critical: 0, high: 0, medium: 0, low: 0 };
      current[finding.severity]++;
      categoryMap.set(finding.category, current);
    });

    return Array.from(categoryMap.entries()).map(([category, counts]) => ({
      category: category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      critical: counts.critical,
      high: counts.high,
      medium: counts.medium,
      low: counts.low,
      total: counts.critical + counts.high + counts.medium + counts.low,
    })).sort((a, b) => b.total - a.total);
  }, [findings]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        No findings to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={tokens.colors.base.border} />
        <XAxis 
          dataKey="category" 
          angle={-45}
          textAnchor="end"
          height={80}
          tick={{ fill: tokens.colors.text.secondary, fontSize: 12 }}
        />
        <YAxis tick={{ fill: tokens.colors.text.secondary, fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: tokens.colors.base.panel,
            border: `1px solid ${tokens.colors.base.border}`,
            borderRadius: tokens.borderRadius.md,
            color: tokens.colors.text.primary,
          }}
          cursor={{ fill: tokens.colors.base.hover }}
        />
        <Bar dataKey="critical" stackId="a" fill={tokens.colors.risk.critical} />
        <Bar dataKey="high" stackId="a" fill={tokens.colors.risk.high} />
        <Bar dataKey="medium" stackId="a" fill={tokens.colors.risk.medium} />
        <Bar dataKey="low" stackId="a" fill={tokens.colors.risk.low} />
      </BarChart>
    </ResponsiveContainer>
  );
}
