/**
 * API Test Helpers
 *
 * Utility functions for testing Next.js API routes.
 */

import { NextRequest } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Create a mock NextRequest with optional headers and URL.
 */
export function createMockRequest(
  url: string,
  options: {
    headers?: Record<string, string>;
    method?: string;
  } = {}
): NextRequest {
  const headers = new Headers(options.headers || {});
  return new NextRequest(url, {
    method: options.method || 'GET',
    headers,
  });
}

/**
 * Create mock Vercel geo headers for location detection.
 */
export function createVercelGeoHeaders(options: {
  city?: string;
  region?: string;
  country?: string;
  latitude?: string;
  longitude?: string;
}): Record<string, string> {
  const headers: Record<string, string> = {};

  if (options.city) headers['x-vercel-ip-city'] = options.city;
  if (options.region) headers['x-vercel-ip-country-region'] = options.region;
  if (options.country) headers['x-vercel-ip-country'] = options.country;
  if (options.latitude) headers['x-vercel-ip-latitude'] = options.latitude;
  if (options.longitude) headers['x-vercel-ip-longitude'] = options.longitude;

  return headers;
}

/**
 * Mock file system operations for testing data loading.
 */
export class MockFileSystem {
  private files: Map<string, string> = new Map();

  setFile(filePath: string, content: string | object): void {
    const normalizedPath = path.normalize(filePath);
    const contentStr = typeof content === 'object' ? JSON.stringify(content) : content;
    this.files.set(normalizedPath, contentStr);
  }

  removeFile(filePath: string): void {
    const normalizedPath = path.normalize(filePath);
    this.files.delete(normalizedPath);
  }

  existsSync(filePath: fs.PathLike): boolean {
    const normalizedPath = path.normalize(filePath.toString());
    return this.files.has(normalizedPath);
  }

  readFileSync(filePath: fs.PathLike, encoding?: BufferEncoding | { encoding?: BufferEncoding } | null): string {
    const normalizedPath = path.normalize(filePath.toString());
    const content = this.files.get(normalizedPath);
    if (!content) {
      const error = new Error(`ENOENT: no such file or directory, open '${filePath}'`) as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      throw error;
    }
    return content;
  }

  clear(): void {
    this.files.clear();
  }

  /**
   * Install this mock onto the fs module.
   */
  install(): () => void {
    const originalExistsSync = fs.existsSync;
    const originalReadFileSync = fs.readFileSync;

    (fs as { existsSync: typeof fs.existsSync }).existsSync = this.existsSync.bind(this);
    (fs as { readFileSync: typeof fs.readFileSync }).readFileSync = this.readFileSync.bind(this) as typeof fs.readFileSync;

    return () => {
      (fs as { existsSync: typeof fs.existsSync }).existsSync = originalExistsSync;
      (fs as { readFileSync: typeof fs.readFileSync }).readFileSync = originalReadFileSync;
    };
  }
}

/**
 * Parse JSON response from NextResponse.
 */
export async function parseJsonResponse<T>(response: Response): Promise<T> {
  return await response.json() as T;
}

/**
 * Expect a response to have a specific status code.
 */
export function expectStatus(response: Response, expectedStatus: number): void {
  expect(response.status).toBe(expectedStatus);
}

/**
 * Expect a response to be successful JSON.
 */
export async function expectSuccessResponse<T>(
  response: Response,
  validate?: (data: T) => void
): Promise<T> {
  expect(response.status).toBe(200);
  const data = await parseJsonResponse<T>(response);
  if (validate) {
    validate(data);
  }
  return data;
}

/**
 * Expect a response to be an error with specific code.
 */
export async function expectErrorResponse(
  response: Response,
  expectedStatus: number,
  expectedErrorCode?: string
): Promise<void> {
  expect(response.status).toBe(expectedStatus);
  const data = await parseJsonResponse<{ success: boolean; error?: { code: string } }>(response);
  expect(data.success).toBe(false);
  if (expectedErrorCode) {
    expect(data.error?.code).toBe(expectedErrorCode);
  }
}

export default {
  createMockRequest,
  createVercelGeoHeaders,
  MockFileSystem,
  parseJsonResponse,
  expectStatus,
  expectSuccessResponse,
  expectErrorResponse,
};
