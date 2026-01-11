/**
 * PDF Parser Utility
 *
 * Wrapper around pdf-parse that works in Vercel serverless environment.
 * pdf-parse has a known issue where it tries to load a test file on import,
 * which fails in serverless environments. This module provides a workaround
 * by importing from the internal module path that skips the test file.
 */

interface PDFParseResult {
  text: string;
  numpages: number;
  numrender: number;
  info: Record<string, unknown>;
  metadata: Record<string, unknown> | null;
}

/**
 * Extract text from a PDF buffer using pdf-parse
 *
 * We import from the internal path to avoid the test file loading issue
 * that occurs with the standard pdf-parse import in Vercel serverless.
 *
 * @param buffer - The PDF file buffer
 * @returns The extracted text and metadata
 */
export async function parsePDF(buffer: Buffer): Promise<PDFParseResult> {
  // Import the internal pdf-parse module that doesn't load the test file
  // The main pdf-parse entry point runs a test on import which fails in serverless
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdf = require('pdf-parse/lib/pdf-parse.js');

  const result = await pdf(buffer);

  return {
    text: result.text || '',
    numpages: result.numpages || 0,
    numrender: result.numrender || 0,
    info: result.info || {},
    metadata: result.metadata || null,
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
