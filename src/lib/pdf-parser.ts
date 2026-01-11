/**
 * PDF Parser Utility
 *
 * Wrapper around pdf-parse that works in Vercel serverless environment.
 * pdf-parse has a known issue where it tries to load a test file on import,
 * which fails in serverless environments. This module provides a workaround.
 */

// We need to access pdf.js directly to avoid the test file loading issue
// that occurs with the standard pdf-parse import
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

interface PDFParseResult {
  text: string;
  numpages: number;
  numrender: number;
  info: Record<string, unknown>;
  metadata: Record<string, unknown> | null;
}

/**
 * Extract text from a PDF buffer
 * This implementation directly uses pdf.js to avoid pdf-parse's test file issue
 *
 * @param buffer - The PDF file buffer
 * @returns The extracted text and metadata
 */
export async function parsePDF(buffer: Buffer): Promise<PDFParseResult> {
  // Convert buffer to Uint8Array for pdf.js
  const data = new Uint8Array(buffer);

  // Load the PDF document
  const loadingTask = pdfjsLib.getDocument({
    data,
    useSystemFonts: true,
    // Disable worker to avoid issues in serverless
    disableFontFace: true,
  });

  const pdf = await loadingTask.promise;

  let fullText = '';
  const numPages = pdf.numPages;

  // Extract text from each page
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => {
        // TextItem has a 'str' property, TextMarkedContent does not
        if ('str' in item && typeof (item as { str?: string }).str === 'string') {
          return (item as { str: string }).str;
        }
        return '';
      })
      .join(' ');
    fullText += pageText + '\n';
  }

  // Get document info
  const metadata = await pdf.getMetadata().catch(() => null);

  return {
    text: fullText.trim(),
    numpages: numPages,
    numrender: numPages,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    info: (metadata?.info as any) || {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: (metadata?.metadata as any) || null,
  };
}

/**
 * Extract just the text from a PDF buffer
 *
 * @param buffer - The PDF file buffer
 * @returns The extracted text content
 */
export async function extractPDFText(buffer: Buffer): Promise<string> {
  const result = await parsePDF(buffer);
  return result.text;
}
