/**
 * Unit tests for localStorage module
 * @jest-environment jsdom
 */

import {
  getLocalUserData,
  saveCareerCompassResult,
  getLatestCareerCompassResult,
  hasCareerCompassResults,
  saveResumeData,
  getResumeData,
  hasResumeData,
  clearResumeData,
  updatePreferences,
  getPreferences,
  clearAllLocalData,
  getStoredDataSummary,
  isStorageAvailable,
  storeCompassResume,
  getCompassResume,
  hasCompassResume,
  clearCompassResume,
  CareerCompassResult,
  ResumeData,
} from '@/lib/localStorage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

describe('localStorage module', () => {
  beforeEach(() => {
    localStorageMock.clear();
    sessionStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('isStorageAvailable', () => {
    it('should return true when localStorage is available', () => {
      expect(isStorageAvailable()).toBe(true);
    });
  });

  describe('getLocalUserData', () => {
    it('should return default data when nothing is stored', () => {
      const data = getLocalUserData();
      expect(data.version).toBe(1);
      expect(data.careerCompassResults).toBeNull();
      expect(data.resumeData).toBeNull();
      expect(data.preferences.location).toBe('');
    });

    it('should return stored data when available', () => {
      const testData = {
        version: 1,
        careerCompassResults: null,
        resumeData: null,
        preferences: {
          location: 'New York',
          locationCode: '35620',
          locationName: 'New York-Newark-Jersey City',
          trainingTimePreference: 'short-term',
          educationLevel: 'bachelors',
        },
        lastVisit: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      localStorageMock.setItem('american_dream_jobs_data', JSON.stringify(testData));

      const data = getLocalUserData();
      expect(data.preferences.location).toBe('New York');
      expect(data.preferences.trainingTimePreference).toBe('short-term');
    });
  });

  describe('Career Compass Results', () => {
    const mockResult: CareerCompassResult = {
      timestamp: new Date().toISOString(),
      responses: {
        training: 'short-term',
        education: 'bachelors',
        background: ['technical', 'office'],
        salary: '60-80k',
        workStyle: ['analytical', 'technology'],
        location: { code: '35620', name: 'New York', shortName: 'NYC' },
        anythingElse: 'Looking for remote work',
      },
      recommendations: [
        {
          slug: 'software-developer',
          title: 'Software Developer',
          score: 0.95,
          matchReasons: ['Strong technical background', 'Good salary match'],
        },
      ],
      savedAt: new Date().toISOString(),
    };

    it('should save and retrieve Career Compass results', () => {
      const saved = saveCareerCompassResult(mockResult);
      expect(saved).toBe(true);

      const result = getLatestCareerCompassResult();
      expect(result).not.toBeNull();
      expect(result?.responses.training).toBe('short-term');
      expect(result?.recommendations[0].slug).toBe('software-developer');
    });

    it('should detect when Career Compass results exist', () => {
      expect(hasCareerCompassResults()).toBe(false);

      saveCareerCompassResult(mockResult);
      expect(hasCareerCompassResults()).toBe(true);
    });
  });

  describe('Resume Data', () => {
    const mockResume: ResumeData = {
      fileName: 'my-resume.pdf',
      uploadedAt: new Date().toISOString(),
      parsedContent: 'Experienced software developer with 5 years...',
      fileSize: 1024,
    };

    it('should save and retrieve resume data', () => {
      const saved = saveResumeData(mockResume);
      expect(saved).toBe(true);

      const resume = getResumeData();
      expect(resume).not.toBeNull();
      expect(resume?.fileName).toBe('my-resume.pdf');
      expect(resume?.parsedContent).toContain('software developer');
    });

    it('should detect when resume data exists', () => {
      expect(hasResumeData()).toBe(false);

      saveResumeData(mockResume);
      expect(hasResumeData()).toBe(true);
    });

    it('should clear resume data', () => {
      saveResumeData(mockResume);
      expect(hasResumeData()).toBe(true);

      clearResumeData();
      expect(hasResumeData()).toBe(false);
    });

    it('should reject oversized resume content', () => {
      const oversizedResume: ResumeData = {
        fileName: 'huge-resume.pdf',
        uploadedAt: new Date().toISOString(),
        parsedContent: 'x'.repeat(6 * 1024 * 1024), // 6MB
      };

      const saved = saveResumeData(oversizedResume);
      expect(saved).toBe(false);
    });
  });

  describe('User Preferences', () => {
    it('should update and retrieve preferences', () => {
      updatePreferences({
        location: 'San Francisco',
        locationCode: '41860',
        trainingTimePreference: 'medium',
      });

      const prefs = getPreferences();
      expect(prefs.location).toBe('San Francisco');
      expect(prefs.locationCode).toBe('41860');
      expect(prefs.trainingTimePreference).toBe('medium');
    });

    it('should merge partial updates', () => {
      updatePreferences({ location: 'Boston' });
      updatePreferences({ trainingTimePreference: 'significant' });

      const prefs = getPreferences();
      expect(prefs.location).toBe('Boston');
      expect(prefs.trainingTimePreference).toBe('significant');
    });
  });

  describe('clearAllLocalData', () => {
    it('should clear all stored data', () => {
      saveResumeData({
        fileName: 'test.pdf',
        uploadedAt: new Date().toISOString(),
        parsedContent: 'test content',
      });
      updatePreferences({ location: 'Test City' });

      expect(hasResumeData()).toBe(true);

      const cleared = clearAllLocalData();
      expect(cleared).toBe(true);

      expect(hasResumeData()).toBe(false);
      expect(getPreferences().location).toBe('');
    });
  });

  describe('getStoredDataSummary', () => {
    it('should return accurate summary', () => {
      const summary1 = getStoredDataSummary();
      expect(summary1.hasCompassResults).toBe(false);
      expect(summary1.hasResume).toBe(false);
      expect(summary1.hasPreferences).toBe(false);

      saveResumeData({
        fileName: 'test.pdf',
        uploadedAt: new Date().toISOString(),
        parsedContent: 'test',
      });

      const summary2 = getStoredDataSummary();
      expect(summary2.hasResume).toBe(true);
    });
  });

  describe('Legacy compatibility functions', () => {
    it('should work with storeCompassResume', () => {
      storeCompassResume('Resume text content', 'legacy-resume.pdf');

      const resume = getCompassResume();
      expect(resume).not.toBeNull();
      expect(resume?.text).toBe('Resume text content');
      expect(resume?.filename).toBe('legacy-resume.pdf');
    });

    it('should work with hasCompassResume', () => {
      expect(hasCompassResume()).toBe(false);

      storeCompassResume('Some resume text');
      expect(hasCompassResume()).toBe(true);
    });

    it('should work with clearCompassResume', () => {
      storeCompassResume('Resume to clear');
      expect(hasCompassResume()).toBe(true);

      clearCompassResume();
      expect(hasCompassResume()).toBe(false);
    });
  });
});
