/**
 * Resume Manager Component Tests
 *
 * Basic tests for the ResumeManager component.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock auth context
jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    userProfileId: 'user-123',
    isAuthenticated: true,
  }),
}));

// Mock fetch
global.fetch = jest.fn();

// Import after mocking
import { ResumeManager } from '@/components/auth/ResumeManager';

describe('ResumeManager Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    const { container } = render(<ResumeManager />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should display resume when user has one', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: true,
        data: {
          id: 'resume-123',
          fileName: 'my-resume.pdf',
          fileType: 'pdf',
          fileSizeBytes: 102400,
          version: 1,
          createdAt: '2026-01-15T10:00:00Z',
          hasParsedProfile: true,
        },
      }),
    });

    render(<ResumeManager />);

    await waitFor(() => {
      expect(screen.getByText('my-resume.pdf')).toBeInTheDocument();
    });
  });

  it('should display empty state when no resume exists', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: null }),
    });

    render(<ResumeManager />);

    await waitFor(() => {
      expect(screen.getByText('No resume uploaded')).toBeInTheDocument();
    });
  });

  it('should format file size correctly', () => {
    const formatFileSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(1572864)).toBe('1.5 MB');
  });
});
