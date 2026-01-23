/**
 * Resume Management API Tests
 *
 * Tests for GET /api/users/resume/manage and DELETE /api/users/resume/manage
 *
 * These endpoints allow authenticated users to view and delete their resume
 * metadata through the ResumeManager component.
 */

import { NextRequest } from 'next/server';

// Mock database functions
const mockGetActiveResume = jest.fn();
const mockDeactivateResume = jest.fn();
const mockGetUserById = jest.fn();

jest.mock('@/lib/db', () => ({
  getActiveResume: (...args: unknown[]) => mockGetActiveResume(...args),
  deactivateResume: (...args: unknown[]) => mockDeactivateResume(...args),
  getUserById: (...args: unknown[]) => mockGetUserById(...args),
}));

// Import after mocking
import { GET, DELETE } from '@/app/api/users/resume/manage/route';

describe('Resume Management API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =====================================================
  // GET ENDPOINT TESTS
  // =====================================================

  describe('GET /api/users/resume/manage', () => {
    describe('Happy Path', () => {
      /**
       * Test Name: Returns resume metadata when exists
       * Category: Happy Path
       * Intent: Verify resume data is returned correctly
       * Setup: Mock user and resume to exist
       * Expected Behavior: Returns full resume metadata
       * Failure Impact: Users couldn't see their resume status
       */
      it('should return resume metadata when resume exists', async () => {
        const mockUserId = 'user-123';
        const mockResume = {
          id: 'resume-123',
          file_name: 'my-resume.pdf',
          file_type: 'pdf',
          file_size_bytes: 102400,
          version: 1,
          created_at: '2026-01-15T10:00:00Z',
          updated_at: '2026-01-15T10:00:00Z',
          parsed_profile: { skills: ['JavaScript'] },
        };

        mockGetUserById.mockResolvedValueOnce({ id: mockUserId, email: 'test@example.com' });
        mockGetActiveResume.mockResolvedValueOnce(mockResume);

        const request = new NextRequest(
          `http://localhost:3000/api/users/resume/manage?userId=${mockUserId}`
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.id).toBe('resume-123');
        expect(data.data.fileName).toBe('my-resume.pdf');
        expect(data.data.hasParsedProfile).toBe(true);

        expect(mockGetUserById).toHaveBeenCalledWith(mockUserId);
        expect(mockGetActiveResume).toHaveBeenCalledWith(mockUserId);
      });

      /**
       * Test Name: Returns null when no resume exists
       * Category: Happy Path
       * Intent: Verify empty state handled correctly
       * Setup: Mock user exists, no resume
       * Expected Behavior: Returns data: null
       * Failure Impact: Error instead of empty state
       */
      it('should return null when user has no resume', async () => {
        const mockUserId = 'user-no-resume';

        mockGetUserById.mockResolvedValueOnce({ id: mockUserId, email: 'test@example.com' });
        mockGetActiveResume.mockResolvedValueOnce(null);

        const request = new NextRequest(
          `http://localhost:3000/api/users/resume/manage?userId=${mockUserId}`
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toBeNull();
      });
    });

    describe('Validation Errors', () => {
      /**
       * Test Name: Returns 400 when userId missing
       * Category: Validation
       * Intent: Verify required param validation
       * Setup: Call without userId
       * Expected Behavior: Returns 400 with error
       * Failure Impact: Server error instead of clear message
       */
      it('should return 400 when userId is missing', async () => {
        const request = new NextRequest(
          'http://localhost:3000/api/users/resume/manage'
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('MISSING_PARAM');
      });

      /**
       * Test Name: Returns 404 when user not found
       * Category: Validation
       * Intent: Verify user existence check
       * Setup: Mock user not found
       * Expected Behavior: Returns 404 with error
       * Failure Impact: Data leak or confusing error
       */
      it('should return 404 when user does not exist', async () => {
        mockGetUserById.mockResolvedValueOnce(null);

        const request = new NextRequest(
          'http://localhost:3000/api/users/resume/manage?userId=nonexistent'
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('USER_NOT_FOUND');
      });
    });

    describe('Error Handling', () => {
      /**
       * Test Name: Returns 500 on database error
       * Category: Error Handling
       * Intent: Verify DB errors handled gracefully
       * Setup: Mock DB to throw
       * Expected Behavior: Returns 500 with generic error
       * Failure Impact: Unhandled error crashes server
       */
      it('should return 500 when database operation fails', async () => {
        mockGetUserById.mockRejectedValueOnce(new Error('Database error'));

        const request = new NextRequest(
          'http://localhost:3000/api/users/resume/manage?userId=user-123'
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('INTERNAL_ERROR');
      });
    });
  });

  // =====================================================
  // DELETE ENDPOINT TESTS
  // =====================================================

  describe('DELETE /api/users/resume/manage', () => {
    describe('Happy Path', () => {
      /**
       * Test Name: Deletes resume successfully
       * Category: Happy Path
       * Intent: Verify resume deletion works
       * Setup: Mock user and resume exist
       * Expected Behavior: Deactivates resume, returns deleted ID
       * Failure Impact: Users couldn't delete resume
       */
      it('should deactivate resume successfully', async () => {
        const mockUserId = 'user-123';
        const mockResume = {
          id: 'resume-123',
          file_name: 'my-resume.pdf',
        };

        mockGetUserById.mockResolvedValueOnce({ id: mockUserId, email: 'test@example.com' });
        mockGetActiveResume.mockResolvedValueOnce(mockResume);
        mockDeactivateResume.mockResolvedValueOnce(undefined);

        const request = new NextRequest(
          `http://localhost:3000/api/users/resume/manage?userId=${mockUserId}`,
          { method: 'DELETE' }
        );

        const response = await DELETE(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.deletedResumeId).toBe('resume-123');

        expect(mockDeactivateResume).toHaveBeenCalledWith('resume-123');
      });
    });

    describe('Validation Errors', () => {
      /**
       * Test Name: Returns 400 when userId missing
       * Category: Validation
       * Intent: Verify required param validation
       * Setup: Call without userId
       * Expected Behavior: Returns 400 with error
       * Failure Impact: Server error instead of clear message
       */
      it('should return 400 when userId is missing', async () => {
        const request = new NextRequest(
          'http://localhost:3000/api/users/resume/manage',
          { method: 'DELETE' }
        );

        const response = await DELETE(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('MISSING_PARAM');
      });

      /**
       * Test Name: Returns 404 when user not found
       * Category: Validation
       * Intent: Verify user existence check
       * Setup: Mock user not found
       * Expected Behavior: Returns 404 with error
       * Failure Impact: Data leak or confusing error
       */
      it('should return 404 when user does not exist', async () => {
        mockGetUserById.mockResolvedValueOnce(null);

        const request = new NextRequest(
          'http://localhost:3000/api/users/resume/manage?userId=nonexistent',
          { method: 'DELETE' }
        );

        const response = await DELETE(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('USER_NOT_FOUND');
      });

      /**
       * Test Name: Returns 404 when no resume to delete
       * Category: Validation
       * Intent: Verify delete requires existing resume
       * Setup: Mock user exists, no resume
       * Expected Behavior: Returns 404 with NO_RESUME error
       * Failure Impact: Confusing success on no-op
       */
      it('should return 404 when user has no resume to delete', async () => {
        const mockUserId = 'user-no-resume';

        mockGetUserById.mockResolvedValueOnce({ id: mockUserId, email: 'test@example.com' });
        mockGetActiveResume.mockResolvedValueOnce(null);

        const request = new NextRequest(
          `http://localhost:3000/api/users/resume/manage?userId=${mockUserId}`,
          { method: 'DELETE' }
        );

        const response = await DELETE(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('NO_RESUME');
      });
    });

    describe('Error Handling', () => {
      /**
       * Test Name: Returns 500 on database error
       * Category: Error Handling
       * Intent: Verify DB errors handled gracefully
       * Setup: Mock deactivate to throw
       * Expected Behavior: Returns 500 with generic error
       * Failure Impact: Unhandled error crashes server
       */
      it('should return 500 when database operation fails', async () => {
        const mockUserId = 'user-123';
        const mockResume = { id: 'resume-123' };

        mockGetUserById.mockResolvedValueOnce({ id: mockUserId });
        mockGetActiveResume.mockResolvedValueOnce(mockResume);
        mockDeactivateResume.mockRejectedValueOnce(new Error('Database error'));

        const request = new NextRequest(
          `http://localhost:3000/api/users/resume/manage?userId=${mockUserId}`,
          { method: 'DELETE' }
        );

        const response = await DELETE(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('INTERNAL_ERROR');
      });
    });
  });
});
