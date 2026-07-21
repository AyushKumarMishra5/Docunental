/**
 * Export API Route - Professional Report Generation
 * Generate EY-style reports in multiple formats
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDBAdapter } from '@/lib/db/adapter';
import { ExportService } from '@/lib/export/export-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const format = searchParams.get('format') || 'json'; // json, markdown, executive, detailed

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const db = await getDBAdapter();
    const document = await db.getDocument(documentId);
    const analysis = await db.getAnalysis(documentId);

    if (!document || !analysis) {
      return NextResponse.json(
        { error: 'Document or analysis not found' },
        { status: 404 }
      );
    }

    let content: any;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'executive':
        content = ExportService.generateExecutiveSummary(document, analysis);
        contentType = 'text/markdown';
        filename = `${document.filename.replace(/\.[^/.]+$/, '')}-executive-summary.md`;
        break;

      case 'detailed':
        content = ExportService.generateDetailedReport(document, analysis);
        contentType = 'text/markdown';
        filename = `${document.filename.replace(/\.[^/.]+$/, '')}-detailed-report.md`;
        break;

      case 'matrix':
        content = JSON.stringify(ExportService.generateRiskMatrix(analysis), null, 2);
        contentType = 'application/json';
        filename = `${document.filename.replace(/\.[^/.]+$/, '')}-risk-matrix.json`;
        break;

      case 'json':
      default:
        content = JSON.stringify(ExportService.exportToJSON(document, analysis), null, 2);
        contentType = 'application/json';
        filename = `${document.filename.replace(/\.[^/.]+$/, '')}-full-analysis.json`;
        break;
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    );
  }
}
