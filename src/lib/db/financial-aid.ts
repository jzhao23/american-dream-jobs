/**
 * Financial Aid / Scholarships Database Operations
 *
 * Handles CRUD operations for scholarships and career-scholarship relationships
 */

import { getSupabaseClient } from '../compass/supabase';

// Types
export interface Scholarship {
  id: string;
  name: string;
  url: string;
  provider: string;
  amount_min: number | null;
  amount_max: number | null;
  amount_text: string | null;
  eligibility: string | null;
  deadline: string | null;
  renewable: boolean;
  scope: 'national' | 'state' | 'local' | 'institution' | null;
  verified: boolean;
  last_verified: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryFinancialResource {
  id: number;
  category: string;
  name: string;
  url: string;
  description: string | null;
  resource_type: 'scholarship_db' | 'federal_aid' | 'employer' | 'general' | null;
  created_at: string;
}

export interface FederalAidInfo {
  education_level: string;
  federal_aid_eligible: boolean;
  typical_aid_sources: string[];
  notes: string | null;
}

export interface CareerScholarshipLink {
  career_slug: string;
  scholarship_id: string;
  created_at: string;
}

export interface UpsertScholarshipInput {
  id: string;
  name: string;
  url: string;
  provider: string;
  amount_min?: number;
  amount_max?: number;
  amount_text?: string;
  eligibility?: string;
  deadline?: string;
  renewable?: boolean;
  scope?: 'national' | 'state' | 'local' | 'institution';
  verified?: boolean;
}

/**
 * Get all scholarships for a career
 */
export async function getScholarshipsForCareer(
  careerSlug: string
): Promise<Scholarship[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('career_scholarships')
    .select(`
      scholarship_id,
      scholarships (*)
    `)
    .eq('career_slug', careerSlug);

  if (error) {
    throw new Error(`Failed to get scholarships: ${error.message}`);
  }

  // Extract and sort by amount (highest first)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scholarships = (data || [])
    .map((link: any) => link.scholarships as Scholarship)
    .filter((s): s is Scholarship => s !== null)
    .sort((a, b) => {
      const aMax = a.amount_max || a.amount_min || 0;
      const bMax = b.amount_max || b.amount_min || 0;
      return bMax - aMax;
    });

  return scholarships;
}

/**
 * Get category-level financial resources
 */
export async function getCategoryFinancialResources(
  category: string
): Promise<CategoryFinancialResource[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('category_financial_resources')
    .select('*')
    .eq('category', category)
    .order('resource_type', { ascending: true });

  if (error) {
    throw new Error(`Failed to get category resources: ${error.message}`);
  }

  return (data || []) as CategoryFinancialResource[];
}

/**
 * Get federal aid eligibility by education level
 */
export async function getFederalAidEligibility(
  educationLevel: string
): Promise<FederalAidInfo | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('education_federal_aid')
    .select('*')
    .eq('education_level', educationLevel)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get federal aid info: ${error.message}`);
  }

  return data as FederalAidInfo;
}

/**
 * Get all federal aid rules
 */
export async function getAllFederalAidRules(): Promise<FederalAidInfo[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('education_federal_aid')
    .select('*')
    .order('education_level', { ascending: true });

  if (error) {
    throw new Error(`Failed to get federal aid rules: ${error.message}`);
  }

  return (data || []) as FederalAidInfo[];
}

/**
 * Upsert a scholarship
 */
export async function upsertScholarship(
  input: UpsertScholarshipInput
): Promise<Scholarship> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('scholarships')
    .upsert({
      id: input.id,
      name: input.name,
      url: input.url,
      provider: input.provider,
      amount_min: input.amount_min || null,
      amount_max: input.amount_max || null,
      amount_text: input.amount_text || null,
      eligibility: input.eligibility || null,
      deadline: input.deadline || null,
      renewable: input.renewable || false,
      scope: input.scope || null,
      verified: input.verified || false,
      last_verified: input.verified ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert scholarship: ${error.message}`);
  }

  return data as Scholarship;
}

/**
 * Link a scholarship to a career
 */
export async function linkScholarshipToCareer(
  careerSlug: string,
  scholarshipId: string
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('career_scholarships')
    .upsert({
      career_slug: careerSlug,
      scholarship_id: scholarshipId,
    });

  if (error) {
    throw new Error(`Failed to link scholarship to career: ${error.message}`);
  }
}

/**
 * Unlink a scholarship from a career
 */
export async function unlinkScholarshipFromCareer(
  careerSlug: string,
  scholarshipId: string
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('career_scholarships')
    .delete()
    .eq('career_slug', careerSlug)
    .eq('scholarship_id', scholarshipId);

  if (error) {
    throw new Error(`Failed to unlink scholarship: ${error.message}`);
  }
}

/**
 * Add a category financial resource
 */
export async function addCategoryFinancialResource(
  category: string,
  name: string,
  url: string,
  description?: string,
  resourceType?: 'scholarship_db' | 'federal_aid' | 'employer' | 'general'
): Promise<CategoryFinancialResource> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('category_financial_resources')
    .insert({
      category,
      name,
      url,
      description: description || null,
      resource_type: resourceType || 'general',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add category resource: ${error.message}`);
  }

  return data as CategoryFinancialResource;
}

/**
 * Get all scholarships (for export/sync)
 */
export async function getAllScholarships(): Promise<Scholarship[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('scholarships')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to get all scholarships: ${error.message}`);
  }

  return (data || []) as Scholarship[];
}

/**
 * Get all career-scholarship links (for export/sync)
 */
export async function getAllCareerScholarshipLinks(): Promise<CareerScholarshipLink[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('career_scholarships')
    .select('*');

  if (error) {
    throw new Error(`Failed to get career-scholarship links: ${error.message}`);
  }

  return (data || []) as CareerScholarshipLink[];
}

/**
 * Delete a scholarship
 */
export async function deleteScholarship(scholarshipId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('scholarships')
    .delete()
    .eq('id', scholarshipId);

  if (error) {
    throw new Error(`Failed to delete scholarship: ${error.message}`);
  }
}
