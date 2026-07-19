'use client';

import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, Button, Badge } from '@/components/ui/primitives';
import { EmptyState } from '@/components/ui/EmptyState';
import { GitCompare, Upload, FileText, TrendingUp, TrendingDown, Minus, CheckCircle, AlertCircle, Download, Table, List, Eye, Shield, AlertTriangle, Info, FileCheck } from 'lucide-react';
import { cn, getSeverityColor } from '@/lib/utils';
import type { VersionComparison, ClauseDiff } from '@/lib/types';

export default function ComparePage() {
  const [oldFile, setOldFile] = useState<File | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [comparing, setComparing] = useState(false);
  const [comparison, setComparison] = useState<VersionComparison | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'diff' | 'summary'>('diff');
  const [showDiffDetails, setShowDiffDetails] = useState(true);

  const handleCompare = async () => {
    if (!oldFile || !newFile) {
      setError('Please select both old and new files');
      return;
    }

    setComparing(true);
    setError(null);
    setComparison(null);

    try {
      const formData = new FormData();
      formData.append('oldFile', oldFile);
      formData.append('newFile', newFile);

      console.log('Comparing:', oldFile.name, '→', newFile.name);

      const response = await fetch('/api/compare', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Comparison failed');
      }

      console.log('Comparison result:', result);
      setComparison(result.comparison);
      setViewMode('diff');
    } catch (error) {
      console.error('Comparison error:', error);
      setError(error instanceof Error ? error.message : 'Comparison failed. Please try again.');
    } finally {
      setComparing(false);
    }
  };

  const handleExport = () => {
    if (!comparison) return;
    const report = {
      summary: comparison.summary,
      clauses: comparison.clauses,
      comparedAt: comparison.comparedAt,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `version-comparison-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (comparison) {
    const added = comparison.clauses.filter(c => c.changeType === 'added').length;
    const removed = comparison.clauses.filter(c => c.changeType === 'removed').length;
    const modified = comparison.clauses.filter(c => c.changeType === 'modified').length;
    const unchanged = comparison.clauses.filter(c => c.changeType === 'unchanged').length;
    const riskIncreased = comparison.clauses.filter(c => c.riskDelta === 'increased').length;
    const riskDecreased = comparison.clauses.filter(c => c.riskDelta === 'decreased').length;
    
    // Calculate overall risk assessment
    const totalChanges = added + removed + modified;
    const riskLevel = riskIncreased > 3 ? 'High' : riskIncreased > 0 ? 'Medium' : 'Low';
    const changeImpact = totalChanges > 10 ? 'Significant' : totalChanges > 5 ? 'Moderate' : 'Minor';

    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />

        <main className="flex-1 container mx-auto px-6 py-12">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Executive Header - EY Style */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                    <GitCompare className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h1 className="font-display text-4xl text-text-primary">
                      Smart Contract Review
                    </h1>
                    <p className="text-sm text-text-muted">Version Comparison Analysis</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <Badge className={cn(
                    "text-sm font-semibold px-3 py-1",
                    riskLevel === 'High' && "bg-critical text-white",
                    riskLevel === 'Medium' && "bg-medium text-white",
                    riskLevel === 'Low' && "bg-low text-white"
                  )}>
                    <Shield className="h-3 w-3 mr-1" />
                    Risk Level: {riskLevel}
                  </Badge>
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    <Info className="h-3 w-3 mr-1" />
                    {changeImpact} Impact
                  </Badge>
                  <span className="text-xs text-text-muted">
                    {new Date(comparison.comparedAt).toLocaleDateString('en-US', { 
                      year: 'numeric', month: 'long', day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setViewMode(viewMode === 'diff' ? 'summary' : 'diff')}>
                  {viewMode === 'diff' ? <List className="h-4 w-4 mr-2" /> : <Table className="h-4 w-4 mr-2" />}
                  {viewMode === 'diff' ? 'Summary View' : 'Diff View'}
                </Button>
                <Button variant="secondary" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
                <Button onClick={() => { setComparison(null); setOldFile(null); setNewFile(null); }}>
                  New Comparison
                </Button>
              </div>
            </div>

            {/* Executive Summary - EY Style */}
            <Card className="border-2 border-accent/20 bg-gradient-to-br from-panel to-panel/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-accent" />
                  Executive Summary
                </CardTitle>
                <CardDescription>Key findings and recommendations for stakeholders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-panel border border-border">
                    <div className="text-2xl font-bold text-text-primary mb-1">{totalChanges}</div>
                    <div className="text-sm text-text-secondary">Total Changes Identified</div>
                  </div>
                  <div className="p-4 rounded-lg bg-panel border border-border">
                    <div className="text-2xl font-bold text-text-primary mb-1">
                      {Math.round((unchanged / comparison.clauses.length) * 100)}%
                    </div>
                    <div className="text-sm text-text-secondary">Content Retained</div>
                  </div>
                  <div className="p-4 rounded-lg bg-panel border border-border">
                    <div className="text-2xl font-bold text-text-primary mb-1">
                      {riskIncreased > riskDecreased ? '+' : ''}{riskIncreased - riskDecreased}
                    </div>
                    <div className="text-sm text-text-secondary">Net Risk Change</div>
                  </div>
                </div>
                
                {/* Key Observations */}
                <div className="space-y-2 pt-2">
                  <h4 className="font-semibold text-text-primary flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-medium" />
                    Key Observations
                  </h4>
                  <ul className="space-y-2 text-sm text-text-secondary">
                    {modified > 0 && (
                      <li className="flex items-start gap-2">
                        <span className="text-medium mt-0.5">•</span>
                        <span><strong>{modified}</strong> clause{modified !== 1 ? 's' : ''} modified - review carefully for unintended changes</span>
                      </li>
                    )}
                    {riskIncreased > 0 && (
                      <li className="flex items-start gap-2">
                        <span className="text-critical mt-0.5">•</span>
                        <span><strong className="text-critical">{riskIncreased}</strong> change{riskIncreased !== 1 ? 's' : ''} increase risk exposure - immediate attention required</span>
                      </li>
                    )}
                    {added > 0 && (
                      <li className="flex items-start gap-2">
                        <span className="text-low mt-0.5">•</span>
                        <span><strong>{added}</strong> new clause{added !== 1 ? 's' : ''} added - validate alignment with business objectives</span>
                      </li>
                    )}
                    {removed > 0 && (
                      <li className="flex items-start gap-2">
                        <span className="text-warning mt-0.5">•</span>
                        <span><strong>{removed}</strong> clause{removed !== 1 ? 's' : ''} removed - ensure no critical protections lost</span>
                      </li>
                    )}
                    {riskDecreased > 0 && (
                      <li className="flex items-start gap-2">
                        <span className="text-low mt-0.5">•</span>
                        <span><strong className="text-low">{riskDecreased}</strong> improvement{riskDecreased !== 1 ? 's' : ''} reduce risk - positive changes</span>
                      </li>
                    )}
                  </ul>
                </div>

                {/* Recommendation */}
                <div className={cn(
                  "p-4 rounded-lg border-l-4",
                  riskIncreased > 3 ? "bg-critical/5 border-critical" : 
                  riskIncreased > 0 ? "bg-medium/5 border-medium" : 
                  "bg-low/5 border-low"
                )}>
                  <h4 className="font-semibold text-text-primary mb-2">Recommendation</h4>
                  <p className="text-sm text-text-secondary">
                    {riskIncreased > 3 
                      ? "⚠️ High-risk changes detected. Legal review and stakeholder approval strongly recommended before signing."
                      : riskIncreased > 0
                      ? "⚡ Moderate changes with some risk. Detailed review of modified clauses advised."
                      : totalChanges > 5
                      ? "✓ Changes appear favorable or neutral. Review key modifications for compliance."
                      : "✓ Minimal changes detected. Quick review sufficient for most use cases."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Analytics - EY Style */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Change Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-accent" />
                    Change Breakdown
                  </CardTitle>
                  <CardDescription>Analysis of all modifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AnalyticsRow 
                    label="Modified Clauses" 
                    value={modified} 
                    total={comparison.clauses.length}
                    icon={<FileText className="h-4 w-4" />}
                    color="medium"
                    description="Existing clauses with changes"
                  />
                  <AnalyticsRow 
                    label="New Additions" 
                    value={added} 
                    total={comparison.clauses.length}
                    icon={<TrendingUp className="h-4 w-4" />}
                    color="low"
                    description="Clauses added in new version"
                  />
                  <AnalyticsRow 
                    label="Removals" 
                    value={removed} 
                    total={comparison.clauses.length}
                    icon={<TrendingDown className="h-4 w-4" />}
                    color="warning"
                    description="Clauses removed from old version"
                  />
                  <AnalyticsRow 
                    label="Unchanged" 
                    value={unchanged} 
                    total={comparison.clauses.length}
                    icon={<CheckCircle className="h-4 w-4" />}
                    color="text-secondary"
                    description="Clauses that remain identical"
                  />
                </CardContent>
              </Card>

              {/* Risk Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-accent" />
                    Risk Assessment
                  </CardTitle>
                  <CardDescription>Impact on organizational risk exposure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {riskIncreased > 0 && (
                    <div className="p-4 rounded-lg bg-critical/5 border-l-4 border-critical">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-critical mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-critical mb-1">Increased Risk Exposure</h4>
                          <p className="text-sm text-text-secondary mb-2">
                            {riskIncreased} clause{riskIncreased !== 1 ? 's' : ''} introduce higher risk. These changes may:
                          </p>
                          <ul className="text-xs text-text-secondary space-y-1 ml-4">
                            <li>• Expand liability or obligations</li>
                            <li>• Reduce protections or rights</li>
                            <li>• Introduce unfavorable terms</li>
                          </ul>
                        </div>
                        <Badge className="bg-critical text-white font-bold">{riskIncreased}</Badge>
                      </div>
                    </div>
                  )}
                  
                  {riskDecreased > 0 && (
                    <div className="p-4 rounded-lg bg-low/5 border-l-4 border-low">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-low mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-low mb-1">Reduced Risk Exposure</h4>
                          <p className="text-sm text-text-secondary mb-2">
                            {riskDecreased} clause{riskDecreased !== 1 ? 's' : ''} improve your position. These changes may:
                          </p>
                          <ul className="text-xs text-text-secondary space-y-1 ml-4">
                            <li>• Add beneficial protections</li>
                            <li>• Limit liability exposure</li>
                            <li>• Strengthen your rights</li>
                          </ul>
                        </div>
                        <Badge className="bg-low text-white font-bold">{riskDecreased}</Badge>
                      </div>
                    </div>
                  )}

                  {riskIncreased === 0 && riskDecreased === 0 && (
                    <div className="p-4 rounded-lg bg-panel border border-border">
                      <div className="flex items-center gap-3">
                        <Info className="h-5 w-5 text-text-muted" />
                        <div>
                          <h4 className="font-semibold text-text-primary mb-1">Neutral Risk Impact</h4>
                          <p className="text-sm text-text-secondary">
                            Changes appear to be administrative or clarifying in nature without material risk impact.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Net Risk Indicator */}
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-secondary">Net Risk Change</span>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-2xl font-bold",
                          riskIncreased > riskDecreased ? "text-critical" : 
                          riskDecreased > riskIncreased ? "text-low" : 
                          "text-text-muted"
                        )}>
                          {riskIncreased > riskDecreased ? '+' : ''}
                          {riskIncreased - riskDecreased}
                        </span>
                        {riskIncreased > riskDecreased && <TrendingUp className="h-5 w-5 text-critical" />}
                        {riskDecreased > riskIncreased && <TrendingDown className="h-5 w-5 text-low" />}
                        {riskIncreased === riskDecreased && <Minus className="h-5 w-5 text-text-muted" />}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Diff View - Enhanced */}
            {viewMode === 'diff' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <GitCompare className="h-5 w-5 text-accent" />
                        Clause-by-Clause Analysis
                      </CardTitle>
                      <CardDescription>Detailed side-by-side comparison with risk indicators</CardDescription>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-colors">
                      <input 
                        type="checkbox" 
                        checked={showDiffDetails}
                        onChange={(e) => setShowDiffDetails(e.target.checked)}
                        className="rounded border-border"
                      />
                      Show Full Text
                    </label>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Priority sections first */}
                    {comparison.clauses
                      .filter(c => c.riskDelta === 'increased')
                      .map((clause, index) => (
                        <ComparisonRow key={`high-${index}`} clause={clause} showDetails={showDiffDetails} priority="high" />
                      ))}
                    
                    {comparison.clauses
                      .filter(c => c.changeType === 'modified' && c.riskDelta !== 'increased')
                      .map((clause, index) => (
                        <ComparisonRow key={`mod-${index}`} clause={clause} showDetails={showDiffDetails} />
                      ))}
                    
                    {comparison.clauses
                      .filter(c => c.changeType === 'added')
                      .map((clause, index) => (
                        <ComparisonRow key={`add-${index}`} clause={clause} showDetails={showDiffDetails} />
                      ))}
                    
                    {comparison.clauses
                      .filter(c => c.changeType === 'removed')
                      .map((clause, index) => (
                        <ComparisonRow key={`rem-${index}`} clause={clause} showDetails={showDiffDetails} />
                      ))}
                    
                    {showDiffDetails && comparison.clauses
                      .filter(c => c.changeType === 'unchanged')
                      .map((clause, index) => (
                        <ComparisonRow key={`unc-${index}`} clause={clause} showDetails={showDiffDetails} />
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary Table View */}
            {viewMode === 'summary' && (
              <Card>
                <CardHeader>
                  <CardTitle>Summary Table</CardTitle>
                  <CardDescription>All changes in tabular format</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-4 font-medium text-text-secondary">Change Type</th>
                          <th className="text-left py-2 px-4 font-medium text-text-secondary">Section</th>
                          <th className="text-left py-2 px-4 font-medium text-text-secondary">Risk Delta</th>
                          <th className="text-left py-2 px-4 font-medium text-text-secondary">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {comparison.clauses.map((clause, index) => (
                          <tr key={index} className="hover:bg-hover transition-colors">
                            <td className="py-3 px-4">
                              <Badge variant="secondary" className={cn(
                                clause.changeType === 'added' && "bg-low/10 text-low",
                                clause.changeType === 'removed' && "bg-critical/10 text-critical",
                                clause.changeType === 'modified' && "bg-medium/10 text-medium",
                                clause.changeType === 'unchanged' && "bg-text-secondary/10 text-text-secondary"
                              )}>
                                {clause.changeType}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-text-primary">{clause.heading || `Section ${clause.sectionIndex + 1}`}</td>
                            <td className="py-3 px-4">
                              {clause.riskDelta !== 'neutral' && (
                                <Badge className={cn(
                                  clause.riskDelta === 'increased' && "bg-critical/10 text-critical",
                                  clause.riskDelta === 'decreased' && "bg-low/10 text-low"
                                )}>
                                  Risk {clause.riskDelta}
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-text-secondary">{clause.explanation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      <main className="flex-1 container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="font-display text-4xl text-text-primary mb-3">
              Version Comparison
            </h1>
            <p className="text-text-secondary">
              Upload two versions of the same document to see clause-level differences and risk impact.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-error mt-0.5" />
                <div className="text-error">{error}</div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <FileUploadBox
              label="Old Version"
              file={oldFile}
              onFileSelect={setOldFile}
              onClear={() => setOldFile(null)}
            />
            <FileUploadBox
              label="New Version"
              file={newFile}
              onFileSelect={setNewFile}
              onClear={() => setNewFile(null)}
            />
          </div>

          {(oldFile || newFile) && (
            <Button
              onClick={handleCompare}
              disabled={!oldFile || !newFile || comparing}
              size="lg"
              className="w-full h-14 text-lg font-bold relative group overflow-hidden bg-gradient-to-r from-accent to-cyan-400 hover:from-cyan-400 hover:to-accent border-2 border-accent/50 shadow-lg shadow-accent/30 text-black"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              {comparing ? (
                <>
                  <div className="animate-spin h-5 w-5 mr-2 relative z-10" />
                  <span className="relative z-10">COMPARING...</span>
                </>
              ) : (
                <>
                  <GitCompare className="h-5 w-5 mr-2 relative z-10" />
                  <span className="relative z-10">COMPARE VERSIONS</span>
                  {oldFile && newFile && <span className="ml-2 text-xs relative z-10">(2 files)</span>}
                </>
              )}
            </Button>
          )}

          {/* Instructions */}
          <div className="mt-12 p-6 bg-panel rounded-lg border border-border">
            <h3 className="font-medium text-text-primary mb-3 flex items-center gap-2">
              <Eye className="h-5 w-5" />
              How It Works
            </h3>
            <ul className="space-y-2 text-sm text-text-secondary list-disc pl-5">
              <li>Upload two versions of the same document (PDF, DOCX, TXT)</li>
              <li>We extract and compare each clause/section</li>
              <li>Find what changed, what was added, and what was removed</li>
              <li>See risk impact for each change (increased/decreased/neutral)</li>
              <li>Export detailed reports in JSON format</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

function AnalyticsRow({ 
  label, 
  value, 
  total, 
  icon, 
  color, 
  description 
}: { 
  label: string; 
  value: number; 
  total: number; 
  icon: React.ReactNode; 
  color: string; 
  description: string;
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  
  const colorClasses = {
    critical: 'bg-critical text-critical',
    high: 'bg-high text-high',
    medium: 'bg-medium text-medium',
    low: 'bg-low text-low',
    success: 'bg-low text-low',
    warning: 'bg-warning text-warning',
    'text-secondary': 'bg-text-muted text-text-muted',
  };

  const bgColor = colorClasses[color as keyof typeof colorClasses]?.split(' ')[0] || 'bg-accent';
  const textColor = colorClasses[color as keyof typeof colorClasses]?.split(' ')[1] || 'text-accent';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("flex h-8 w-8 items-center justify-center rounded", `${bgColor}/10`, textColor)}>
            {icon}
          </div>
          <div>
            <div className="font-medium text-text-primary">{label}</div>
            <div className="text-xs text-text-muted">{description}</div>
          </div>
        </div>
        <div className="text-right">
          <div className={cn("text-lg font-bold", textColor)}>{value}</div>
          <div className="text-xs text-text-muted">{percentage}%</div>
        </div>
      </div>
      <div className="h-2 bg-panel rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all", bgColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}


function ComparisonRow({ clause, showDetails, priority }: { clause: ClauseDiff; showDetails: boolean; priority?: 'high' }) {
  const hasChanges = clause.changeType !== 'unchanged';
  const isHighPriority = priority === 'high' || clause.riskDelta === 'increased';
  
  return (
    <div className={cn(
      "border rounded-lg overflow-hidden transition-all",
      isHighPriority && "border-2 border-critical shadow-lg ring-2 ring-critical/20",
      !isHighPriority && "border-border hover:shadow-md",
      clause.changeType === 'added' && !isHighPriority && "border-low/30 bg-low/5",
      clause.changeType === 'removed' && !isHighPriority && "border-warning/30 bg-warning/5",
      clause.changeType === 'modified' && !isHighPriority && "border-medium/30",
      clause.changeType === 'unchanged' && "opacity-50"
    )}>
      <div className={cn(
        "p-4 border-b border-border flex items-center justify-between",
        isHighPriority && "bg-critical/5"
      )}>
        <div className="flex items-center gap-3 flex-1">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0",
            clause.changeType === 'added' && "bg-low/20 text-low",
            clause.changeType === 'removed' && "bg-warning/20 text-warning",
            clause.changeType === 'modified' && isHighPriority && "bg-critical/20 text-critical",
            clause.changeType === 'modified' && !isHighPriority && "bg-medium/20 text-medium",
            clause.changeType === 'unchanged' && "bg-text-secondary/20 text-text-secondary"
          )}>
            {clause.changeType === 'added' && <TrendingUp className="h-5 w-5" />}
            {clause.changeType === 'removed' && <TrendingDown className="h-5 w-5" />}
            {clause.changeType === 'modified' && <FileText className="h-5 w-5" />}
            {clause.changeType === 'unchanged' && <CheckCircle className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text-primary flex items-center gap-2">
              {clause.heading || `Section ${clause.sectionIndex + 1}`}
              {isHighPriority && (
                <span className="flex items-center gap-1 text-xs font-bold text-critical bg-critical/10 px-2 py-0.5 rounded">
                  <Shield className="h-3 w-3" />
                  PRIORITY REVIEW
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="secondary" className={cn(
                "text-xs font-medium",
                clause.changeType === 'added' && "bg-low/10 text-low border-low/20",
                clause.changeType === 'removed' && "bg-warning/10 text-warning border-warning/20",
                clause.changeType === 'modified' && "bg-medium/10 text-medium border-medium/20",
                clause.changeType === 'unchanged' && "bg-text-secondary/10 text-text-secondary"
              )}>
                {clause.changeType.toUpperCase()}
              </Badge>
              {clause.riskDelta !== 'neutral' && (
                <Badge className={cn(
                  "text-xs font-bold",
                  clause.riskDelta === 'increased' ? "bg-critical text-white" : "bg-low text-white"
                )}>
                  {clause.riskDelta === 'increased' ? '⚠️ RISK INCREASED' : '✓ RISK DECREASED'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">
          {clause.oldText && (
            <div className={cn(
              "p-5 text-sm",
              clause.changeType === 'removed' ? "bg-warning/5" : "bg-panel"
            )}>
              <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-text-muted uppercase tracking-wide">
                <FileText className="h-3.5 w-3.5" />
                Previous Version
                {clause.changeType === 'modified' && (
                  <span className="ml-auto text-critical text-base">→</span>
                )}
              </div>
              <div className="text-text-primary whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto p-3 rounded bg-white/50 border border-border/50">
                {clause.oldText}
              </div>
            </div>
          )}
          {clause.newText && (
            <div className={cn(
              "p-5 text-sm",
              clause.changeType === 'added' ? "bg-low/5" : "bg-panel"
            )}>
              <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-text-muted uppercase tracking-wide">
                <CheckCircle className="h-3.5 w-3.5" />
                Current Version
              </div>
              <div className="text-text-primary whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto p-3 rounded bg-white/50 border border-border/50">
                {clause.newText}
              </div>
            </div>
          )}
        </div>
      )}

      {clause.explanation && (
        <div className={cn(
          "p-4 text-sm border-t",
          isHighPriority ? "bg-critical/5 border-critical/20" : "bg-panel/50 border-border"
        )}>
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold text-text-primary">Analysis: </span>
              <span className="text-text-secondary">{clause.explanation}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FileUploadBox({
  label,
  file,
  onFileSelect,
  onClear,
}: {
  label: string;
  file: File | null;
  onFileSelect: (file: File | null) => void;
  onClear: () => void;
}) {
  return (
    <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-accent/50 transition-all bg-panel hover:bg-hover">
      <div className="text-center">
        <FileText className="h-12 w-12 text-text-muted mx-auto mb-3" />
        <h3 className="font-medium text-text-primary mb-2">{label}</h3>
        {file ? (
          <div className="space-y-3">
            <div className="p-3 rounded bg-accent/10 border border-accent/20">
              <p className="text-sm text-text-primary font-medium truncate">{file.name}</p>
              <p className="text-xs text-text-muted mt-1">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={onClear}
              className="text-sm text-error hover:text-error/80 font-medium transition-colors"
            >
              Remove File
            </button>
          </div>
        ) : (
          <div>
            <input
              type="file"
              onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
              id={`file-${label}`}
            />
            <label
              htmlFor={`file-${label}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent/10 border-2 border-accent/30 hover:bg-accent/20 hover:border-accent/50 transition-all text-sm font-semibold text-accent cursor-pointer group"
            >
              <Upload className="h-4 w-4 group-hover:scale-110 transition-transform" />
              Choose File
            </label>
            <p className="text-xs text-text-muted mt-3">PDF, DOCX, TXT, MD • Max 10MB</p>
          </div>
        )}
      </div>
    </div>
  );
}
