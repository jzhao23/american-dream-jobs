/**
 * Job Export API
 *
 * POST: Export job search results to Excel or CSV
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as XLSX from 'xlsx';
import { JobListing } from '@/lib/jobs';

// Request schema
const exportJobsSchema = z.object({
  jobs: z.array(z.object({
    id: z.string(),
    title: z.string(),
    company: z.string(),
    location: z.string(),
    locationType: z.enum(['onsite', 'remote', 'hybrid']),
    salary: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      currency: z.string(),
      period: z.enum(['year', 'hour'])
    }).optional(),
    description: z.string(),
    highlights: z.array(z.string()).optional(),
    postedAt: z.string(),
    applyUrl: z.string(),
    source: z.string()
  })),
  careerTitle: z.string(),
  location: z.string(),
  format: z.enum(['xlsx', 'csv']).optional().default('xlsx')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = exportJobsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validationResult.error.errors[0].message
          }
        },
        { status: 400 }
      );
    }

    const { jobs, careerTitle, location, format } = validationResult.data;

    if (jobs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_JOBS',
            message: 'No jobs to export'
          }
        },
        { status: 400 }
      );
    }

    // Transform jobs to export format
    const exportData = jobs.map((job: JobListing) => ({
      'Job Title': job.title,
      'Company': job.company,
      'Location': job.location,
      'Work Type': job.locationType.charAt(0).toUpperCase() + job.locationType.slice(1),
      'Salary': formatSalary(job.salary),
      'Posted': job.postedAt,
      'Source': job.source,
      'Apply URL': job.applyUrl,
      'Description': job.description.slice(0, 200) + (job.description.length > 200 ? '...' : ''),
      'Highlights': job.highlights?.join('; ') || ''
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 40 }, // Job Title
      { wch: 25 }, // Company
      { wch: 25 }, // Location
      { wch: 10 }, // Work Type
      { wch: 20 }, // Salary
      { wch: 15 }, // Posted
      { wch: 15 }, // Source
      { wch: 50 }, // Apply URL
      { wch: 50 }, // Description
      { wch: 50 }  // Highlights
    ];

    // Add worksheet to workbook
    const sheetName = `${careerTitle.slice(0, 20)} Jobs`;
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate file
    let buffer: Buffer;
    let contentType: string;
    let fileExtension: string;

    if (format === 'csv') {
      const csvContent = XLSX.utils.sheet_to_csv(worksheet);
      buffer = Buffer.from(csvContent, 'utf-8');
      contentType = 'text/csv';
      fileExtension = 'csv';
    } else {
      buffer = Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileExtension = 'xlsx';
    }

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const sanitizedCareer = careerTitle.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30);
    const sanitizedLocation = location.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 20);
    const filename = `${sanitizedCareer}-jobs-${sanitizedLocation}-${timestamp}.${fileExtension}`;

    // Return file (convert Buffer to Uint8Array for NextResponse)
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to export jobs'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * Format salary for display
 */
function formatSalary(salary?: JobListing['salary']): string {
  if (!salary) return 'Not disclosed';

  const formatNumber = (n: number) => {
    if (n >= 1000) {
      return `$${(n / 1000).toFixed(0)}K`;
    }
    return `$${n}`;
  };

  const period = salary.period === 'hour' ? '/hr' : '/yr';

  if (salary.min && salary.max) {
    return `${formatNumber(salary.min)} - ${formatNumber(salary.max)}${period}`;
  } else if (salary.min) {
    return `${formatNumber(salary.min)}+${period}`;
  } else if (salary.max) {
    return `Up to ${formatNumber(salary.max)}${period}`;
  }

  return 'Not disclosed';
}
