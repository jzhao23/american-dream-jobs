/**
 * Resume Upload API
 *
 * POST: Upload a resume for a user
 * GET: Get user's active resume
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadResume, getActiveResume, getUserById } from '@/lib/db';

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Supported MIME types
const SUPPORTED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'text/markdown': 'md',
  'text/plain': 'txt',
  'text/x-markdown': 'md',
};

async function parsePDF(buffer: Buffer): Promise<string> {
  // Use our custom PDF parser that works in Vercel serverless environment
  const { extractPDFText } = await import('@/lib/pdf-parser');
  return extractPDFText(buffer);
}

async function parseDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

function parseMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^[-*_]{3,}$/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FILE', message: 'No file provided' } },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_USER', message: 'User ID is required' } },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
          }
        },
        { status: 400 }
      );
    }

    // Determine file type
    let fileType = file.type;
    if (!SUPPORTED_TYPES[fileType]) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'pdf') fileType = 'application/pdf';
      else if (extension === 'docx') fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (extension === 'doc') fileType = 'application/msword';
      else if (extension === 'md') fileType = 'text/markdown';
      else if (extension === 'txt') fileType = 'text/plain';
    }

    if (!SUPPORTED_TYPES[fileType]) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNSUPPORTED_TYPE',
            message: 'Unsupported file type. Please upload a PDF, Word document (.docx), Markdown (.md), or text file (.txt)'
          }
        },
        { status: 400 }
      );
    }

    // Parse file content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let extractedText: string;

    try {
      const typeKey = SUPPORTED_TYPES[fileType];
      switch (typeKey) {
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
          extractedText = buffer.toString('utf-8').trim();
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
            code: 'PARSE_ERROR',
            message: 'Failed to parse file. Please make sure the file is not corrupted.'
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
            code: 'INSUFFICIENT_CONTENT',
            message: 'Could not extract enough text from the file. Please make sure the file contains your resume content.'
          }
        },
        { status: 400 }
      );
    }

    // Upload to storage and save metadata
    const resume = await uploadResume({
      userId,
      fileName: file.name,
      fileType: SUPPORTED_TYPES[fileType],
      fileSizeBytes: file.size,
      fileBuffer: buffer,
      extractedText
    });

    console.log(`Resume uploaded for user ${userId}: ${resume.id}`);

    return NextResponse.json({
      success: true,
      data: {
        resumeId: resume.id,
        fileName: resume.file_name,
        fileType: resume.file_type,
        extractedLength: extractedText.length,
        extractedText: extractedText, // Include text for immediate use by Career Compass
        version: resume.version
      }
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to upload resume'
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PARAM',
            message: 'User ID is required'
          }
        },
        { status: 400 }
      );
    }

    const resume = await getActiveResume(userId);

    if (!resume) {
      return NextResponse.json({
        success: true,
        data: null
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: resume.id,
        fileName: resume.file_name,
        fileType: resume.file_type,
        fileSizeBytes: resume.file_size_bytes,
        version: resume.version,
        createdAt: resume.created_at,
        hasParsedProfile: !!resume.parsed_profile
      }
    });
  } catch (error) {
    console.error('Get resume error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get resume'
        }
      },
      { status: 500 }
    );
  }
}
