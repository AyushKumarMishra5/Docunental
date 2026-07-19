/**
 * Document text extraction utilities
 * Uses pdf-parse v1.1.1 (stable, working version)
 */

import mammoth from 'mammoth';

const EXTRACTION_TIMEOUT = 30000; // 30 seconds

export async function extractText(buffer: Buffer, fileType: string): Promise<string> {
  console.log(`[Extraction] Starting extraction for ${fileType} (${buffer.length} bytes)`);

  try {
    let text: string;

    switch (fileType) {
      case 'pdf':
        text = await withTimeout(extractFromPDF(buffer), EXTRACTION_TIMEOUT, 'PDF extraction');
        break;
      case 'docx':
        text = await withTimeout(extractFromDOCX(buffer), EXTRACTION_TIMEOUT, 'DOCX extraction');
        break;
      case 'txt':
      case 'md':
        text = buffer.toString('utf-8');
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}. Supported types: PDF, DOCX, TXT, MD`);
    }

    // Validate extracted text
    if (!text || text.trim().length === 0) {
      throw new Error(
        `No text could be extracted from the ${fileType.toUpperCase()} file. The file might be empty, corrupted, or contain only images (scanned document).`
      );
    }

    console.log(`[Extraction] Successfully extracted ${text.length} characters`);
    return text;
  } catch (error) {
    console.error(`[Extraction] Failed:`, error);

    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error(`Extraction timed out. The file might be too large or complex. Try a smaller file.`);
      }
      if (error.message.includes('password') || error.message.includes('Password')) {
        throw new Error(`This PDF is password-protected. Please remove the password and try again.`);
      }
      if (error.message.includes('Invalid PDF')) {
        throw new Error(`Invalid or corrupted PDF file. Please check the file and try again.`);
      }
      throw error;
    }

    throw new Error(`Failed to extract text from ${fileType.toUpperCase()} file. Please try a different file.`);
  }
}

/**
 * Wrapper to add timeout to async operations
 */
async function withTimeout<T>(promise: Promise<T>, ms: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

async function extractFromPDF(buffer: Buffer): Promise<string> {
  try {
    console.log('[PDF Extraction] Loading pdf-parse module...');

    // pdf-parse v1.1.1 has a known bug: on import it tries to read a test file
    // ('./test/data/05-versions-space.pdf') which doesn't exist in production.
    // We must suppress this by running it in isolation.
    // The actual PDF parsing still works - the error is from module init only.
    let pdfParse: CallableFunction;
    try {
      const pdfModule = await import('pdf-parse');
      pdfParse = (pdfModule as { default?: CallableFunction }).default || (pdfModule as unknown as CallableFunction);
    } catch (importError) {
      // The import may throw due to the test file, but the module still loads.
      // Retry by requiring it directly.
      console.warn('[PDF Extraction] Module import warning (known pdf-parse bug), retrying...');
      const pdfModule = Function('return require("pdf-parse")')();
      pdfParse = (pdfModule as { default?: CallableFunction }).default || (pdfModule as unknown as CallableFunction);
    }

    console.log('[PDF Extraction] Parsing PDF buffer...');
    const data = await (pdfParse as CallableFunction)(buffer);
    const text = (data as { text: string }).text;

    if (!text || text.trim().length === 0) {
      throw new Error(
        'PDF contains no extractable text. It may be a scanned document (images only) or have unsupported encoding.'
      );
    }

    console.log(`[PDF Extraction] Extracted text (${text.length} chars)`);
    return text;
  } catch (error) {
    console.error('[PDF Extraction] Error:', error);

    if (error instanceof Error) {
      if (error.message.includes('No text')) {
        throw error;
      }
      // Handle the famous pdf-parse test file bug
      if (error.message.includes('05-versions-space.pdf')) {
        throw new Error('PDF parser initialization failed. Please restart the server and try again.');
      }
      throw new Error(`PDF extraction failed: ${error.message}`);
    }

    throw new Error('PDF extraction failed with unknown error');
  }
}

async function extractFromDOCX(buffer: Buffer): Promise<string> {
  try {
    console.log('[DOCX Extraction] Extracting text...');

    const result = await mammoth.extractRawText({ buffer });

    if (!result.value || result.value.trim().length === 0) {
      throw new Error('DOCX file appears to be empty or contains no extractable text.');
    }

    console.log(`[DOCX Extraction] Extracted text (${result.value.length} chars)`);
    return result.value;
  } catch (error) {
    console.error('[DOCX Extraction] Error:', error);

    if (error instanceof Error) {
      throw new Error(`DOCX extraction failed: ${error.message}`);
    }

    throw new Error('DOCX extraction failed with unknown error');
  }
}
