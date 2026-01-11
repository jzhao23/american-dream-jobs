/**
 * PDF Parser Utility
 *
 * Wrapper around pdf-parse that works in Vercel serverless environment.
 * pdf-parse has a known issue where it tries to load a test file on import,
 * which fails in serverless environments. This module provides a workaround.
 */

import type { Result } from 'pdf-parse';

/**
 * Parse a PDF buffer and extract text content
 *
 * @param buffer - The PDF file buffer
 * @returns The extracted text and metadata
 */
export async function parsePDF(buffer: Buffer): Promise<Result> {
  // Dynamic import with the render function override to prevent test file loading
  // pdf-parse tries to render a test PDF on require, which fails in Vercel
  // By providing our own render function, we bypass this issue
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse/lib/pdf-parse');

  // Parse the PDF with default options
  const result = await pdfParse(buffer, {
    // Use default page rendering
    pagerender: undefined,
    // Maximum number of pages to parse (0 = all)
    max: 0,
  });

  return result;
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
