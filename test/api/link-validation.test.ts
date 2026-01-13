/**
 * Link Validation Tests
 *
 * Tests that all career and specialization links across the application are valid.
 */

import * as fs from 'fs';
import * as path from 'path';

interface Career {
  slug: string;
  title: string;
}

describe('Link Validation', () => {
  let careers: Map<string, Career>;
  let specializations: Map<string, Career>;
  let embeddingSlugs: string[];

  beforeAll(() => {
    // Load careers
    const careersPath = path.join(process.cwd(), 'data/output/careers.json');
    const careersData = JSON.parse(fs.readFileSync(careersPath, 'utf-8')) as Career[];
    careers = new Map(careersData.map(c => [c.slug, c]));

    // Load specializations
    const specsPath = path.join(process.cwd(), 'data/output/specializations.json');
    const specsData = JSON.parse(fs.readFileSync(specsPath, 'utf-8')) as Career[];
    specializations = new Map(specsData.map(s => [s.slug, s]));

    // Load embeddings
    const embPath = path.join(process.cwd(), 'data/compass/career-embeddings.json');
    const embData = JSON.parse(fs.readFileSync(embPath, 'utf-8'));
    embeddingSlugs = embData.embeddings.map((e: { career_slug: string }) => e.career_slug);
  });

  describe('Home Page Featured Careers', () => {
    // Hard-coded slugs from page.tsx
    const featuredCareersLinks = [
      { title: 'Wind Turbine Technician', type: 'specializations', slug: 'wind-turbine-service-technicians' },
      { title: 'Dental Hygienist', type: 'specializations', slug: 'dental-hygienists' },
      { title: 'Respiratory Therapist', type: 'careers', slug: 'respiratory-therapists' },
      { title: 'Electrician', type: 'specializations', slug: 'electricians' },
      { title: 'Solar Panel Installer', type: 'specializations', slug: 'solar-photovoltaic-installers' },
      { title: 'MRI Technologist', type: 'specializations', slug: 'magnetic-resonance-imaging-technologists' },
    ];

    test.each(featuredCareersLinks)(
      '$title -> /$type/$slug should exist',
      ({ type, slug }) => {
        if (type === 'careers') {
          expect(careers.has(slug)).toBe(true);
        } else {
          expect(specializations.has(slug)).toBe(true);
        }
      }
    );
  });

  describe('Career Embeddings', () => {
    test('all embedding slugs should exist in careers.json', () => {
      const invalidSlugs: string[] = [];

      for (const slug of embeddingSlugs) {
        if (!careers.has(slug)) {
          invalidSlugs.push(slug);
        }
      }

      expect(invalidSlugs).toHaveLength(0);
    });

    test('all careers should have embeddings', () => {
      const embeddingSet = new Set(embeddingSlugs);
      const missingEmbeddings: string[] = [];

      for (const [slug] of careers) {
        if (!embeddingSet.has(slug)) {
          missingEmbeddings.push(slug);
        }
      }

      expect(missingEmbeddings).toHaveLength(0);
    });

    test('embedding count should match career count', () => {
      expect(embeddingSlugs.length).toBe(careers.size);
    });
  });

  describe('Data Consistency', () => {
    test('careers.json should have at least 100 entries', () => {
      expect(careers.size).toBeGreaterThanOrEqual(100);
    });

    test('specializations.json should have at least 500 entries', () => {
      expect(specializations.size).toBeGreaterThanOrEqual(500);
    });

    test('all career slugs should be lowercase with hyphens', () => {
      const invalidSlugs: string[] = [];

      for (const [slug] of careers) {
        if (!/^[a-z0-9-]+$/.test(slug)) {
          invalidSlugs.push(slug);
        }
      }

      expect(invalidSlugs).toHaveLength(0);
    });

    test('all specialization slugs should be lowercase with hyphens', () => {
      const invalidSlugs: string[] = [];

      for (const [slug] of specializations) {
        if (!/^[a-z0-9-]+$/.test(slug)) {
          invalidSlugs.push(slug);
        }
      }

      expect(invalidSlugs).toHaveLength(0);
    });
  });
});
