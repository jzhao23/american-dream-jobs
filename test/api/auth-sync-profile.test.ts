/**
 * Auth Sync Profile API Tests
 *
 * Tests for POST /api/auth/sync-profile
 *
 * This endpoint syncs a Supabase Auth user to our user_profiles table,
 * creating or linking the profile as needed.
 */

import { NextRequest } from 'next/server';

// Mock Supabase client
const mockRpc = jest.fn();
jest.mock('@/lib/compass/supabase', () => ({
  getSupabaseClient: () => ({
    rpc: mockRpc,
  }),
}));

// Import after mocking
import { POST } from '@/app/api/auth/sync-profile/route';

describe('POST /api/auth/sync-profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =====================================================
  // HAPPY PATH TESTS
  // =====================================================

  describe('Happy Path: New User', () => {
    /**
     * Test Name: Create new user profile for auth user
     * Category: Happy Path
     * Intent: Verify new auth users get a user_profiles record
     * Setup: Call with new authId and email
     * Expected Behavior: Returns new userId with isNew=true
     * Failure Impact: New users wouldn't be able to use the app
     */
    it('should create new user profile for new auth user', async () => {
      const mockUserId = 'uuid-12345-new';
      mockRpc.mockResolvedValueOnce({
        data: [{ user_id: mockUserId, is_new: true, has_resume: false }],
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/sync-profile', {
        method: 'POST',
        body: JSON.stringify({
          authId: 'auth-uuid-123',
          email: 'newuser@example.com',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.userId).toBe(mockUserId);
      expect(data.data.isNew).toBe(true);
      expect(data.data.hasResume).toBe(false);

      expect(mockRpc).toHaveBeenCalledWith('get_or_create_user_from_auth', {
        p_auth_id: 'auth-uuid-123',
        p_email: 'newuser@example.com',
        p_location_code: null,
        p_location_name: null,
      });
    });
  });

  describe('Happy Path: Existing User', () => {
    /**
     * Test Name: Link existing user profile to auth
     * Category: Happy Path
     * Intent: Verify existing email users get linked to auth
     * Setup: Call with authId for existing email user
     * Expected Behavior: Returns existing userId with isNew=false
     * Failure Impact: Returning users would lose their data
     */
    it('should link existing user profile to auth user', async () => {
      const mockUserId = 'uuid-existing-user';
      mockRpc.mockResolvedValueOnce({
        data: [{ user_id: mockUserId, is_new: false, has_resume: true }],
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/sync-profile', {
        method: 'POST',
        body: JSON.stringify({
          authId: 'auth-uuid-456',
          email: 'existing@example.com',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.userId).toBe(mockUserId);
      expect(data.data.isNew).toBe(false);
      expect(data.data.hasResume).toBe(true);
    });

    /**
     * Test Name: Include location when provided
     * Category: Happy Path
     * Intent: Verify location is passed to database function
     * Setup: Call with locationCode and locationName
     * Expected Behavior: Location params passed to RPC
     * Failure Impact: User location wouldn't be saved
     */
    it('should pass location params when provided', async () => {
      mockRpc.mockResolvedValueOnce({
        data: [{ user_id: 'uuid-with-location', is_new: true, has_resume: false }],
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/sync-profile', {
        method: 'POST',
        body: JSON.stringify({
          authId: 'auth-uuid-789',
          email: 'user@example.com',
          locationCode: '41860',
          locationName: 'San Francisco, CA',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockRpc).toHaveBeenCalledWith('get_or_create_user_from_auth', {
        p_auth_id: 'auth-uuid-789',
        p_email: 'user@example.com',
        p_location_code: '41860',
        p_location_name: 'San Francisco, CA',
      });
    });
  });

  // =====================================================
  // NEGATIVE TESTS
  // =====================================================

  describe('Negative: Invalid Inputs', () => {
    /**
     * Test Name: Missing authId
     * Category: Negative
     * Intent: Verify validation of required authId
     * Setup: Call without authId
     * Expected Behavior: Returns 400 error
     * Failure Impact: Invalid requests would crash the API
     */
    it('should return 400 when authId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/sync-profile', {
        method: 'POST',
        body: JSON.stringify({
          email: 'user@example.com',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_INPUT');
    });

    /**
     * Test Name: Missing email
     * Category: Negative
     * Intent: Verify validation of required email
     * Setup: Call without email
     * Expected Behavior: Returns 400 error
     * Failure Impact: Invalid requests would crash the API
     */
    it('should return 400 when email is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/sync-profile', {
        method: 'POST',
        body: JSON.stringify({
          authId: 'auth-uuid-123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_INPUT');
    });
  });

  // =====================================================
  // ERROR HANDLING TESTS
  // =====================================================

  describe('Error Handling: Database Errors', () => {
    /**
     * Test Name: Database error during sync
     * Category: Error Handling
     * Intent: Verify proper error response on DB failure
     * Setup: Mock RPC to return error
     * Expected Behavior: Returns 500 with DB_ERROR
     * Failure Impact: DB errors would crash the API
     */
    it('should return 500 when database operation fails', async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const request = new NextRequest('http://localhost:3000/api/auth/sync-profile', {
        method: 'POST',
        body: JSON.stringify({
          authId: 'auth-uuid-123',
          email: 'user@example.com',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DB_ERROR');
    });
  });
});
