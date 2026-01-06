import { NextRequest, NextResponse } from 'next/server';

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Supported MIME types
const SUPPORTED_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'text/markdown': 'md',
  'text/plain': 'txt',
  'text/x-markdown': 'md',
} as const;

type SupportedMimeType = keyof typeof SUPPORTED_TYPES;

function isSupportedType(type: string): type is SupportedMimeType {
  return type in SUPPORTED_TYPES;
}

async function parsePDF(buffer: Buffer): Promise<string> {
  // Dynamic import to avoid issues with pdf-parse in edge runtime
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse');
  const data = await pdfParse(buffer);
  return data.text;
}

async function parseDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

function parseMarkdown(text: string): string {
  // Strip common markdown syntax for cleaner text
  return text
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, '')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove list markers
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parsePlainText(text: string): string {
  return text.trim();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { message: 'No file provided' } },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
          }
        },
        { status: 400 }
      );
    }

    // Determine file type from MIME type or extension
    let fileType = file.type;

    // Fallback to extension-based detection if MIME type is generic
    if (!isSupportedType(fileType)) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'pdf') fileType = 'application/pdf';
      else if (extension === 'docx') fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (extension === 'doc') fileType = 'application/msword';
      else if (extension === 'md') fileType = 'text/markdown';
      else if (extension === 'txt') fileType = 'text/plain';
    }

    if (!isSupportedType(fileType)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Unsupported file type. Please upload a PDF, Word document (.docx), Markdown (.md), or text file (.txt)'
          }
        },
        { status: 400 }
      );
    }

    console.log(`📄 Parsing ${SUPPORTED_TYPES[fileType]} file: ${file.name} (${file.size} bytes)`);

    let extractedText: string;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      switch (SUPPORTED_TYPES[fileType]) {
        case 'pdf':
          extractedText = await parsePDF(buffer);
          break;
        case 'docx':
        case 'doc':
          extractedText = await parseDocx(buffer);
          break;
        case 'md':
          extractedText = parseMarkdown(buffer.toString('utf-8'));
          break;
        case 'txt':
          extractedText = parsePlainText(buffer.toString('utf-8'));
          break;
        default:
          throw new Error('Unsupported file type');
      }
    } catch (parseError) {
      console.error('File parsing error:', parseError);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Failed to parse file. Please make sure the file is not corrupted and try again.'
          }
        },
        { status: 400 }
      );
    }

    // Validate extracted text
    if (!extractedText || extractedText.trim().length < 50) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Could not extract enough text from the file. Please make sure the file contains your resume content.'
          }
        },
        { status: 400 }
      );
    }

    console.log(`✓ Extracted ${extractedText.length} characters from ${file.name}`);

    return NextResponse.json({
      success: true,
      text: extractedText,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: SUPPORTED_TYPES[fileType],
        extractedLength: extractedText.length,
      }
    });
  } catch (error) {
    console.error('Parse file error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'An unexpected error occurred while processing your file'
        }
      },
      { status: 500 }
    );
  }
}
