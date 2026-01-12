/**
 * Training Programs Database Operations
 *
 * Handles CRUD operations for training programs and career-program relationships
 */

import { getSupabaseClient } from '../compass/supabase';

// Types
export interface TrainingProgram {
  id: string;
  name: string;
  type: 'bootcamp' | 'certification' | 'online_course' | 'apprenticeship' | 'degree_program' | 'professional_development';
  provider: string;
  url: string;
  description: string | null;
  duration_months: number | null;
  format: 'online' | 'in-person' | 'hybrid' | null;
  cost_amount: number | null;
  cost_type: 'free' | 'low' | 'moderate' | 'high' | null;
  cost_notes: string | null;
  credential_earned: string | null;
  relevance_score: number | null;
  verified: boolean;
  last_verified: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryTrainingResource {
  id: number;
  category: string;
  name: string;
  url: string;
  description: string | null;
  created_at: string;
}

export interface CareerTrainingProgramLink {
  career_slug: string;
  program_id: string;
  is_primary: boolean;
  created_at: string;
}

export interface UpsertTrainingProgramInput {
  id: string;
  name: string;
  type: TrainingProgram['type'];
  provider: string;
  url: string;
  description?: string;
  duration_months?: number;
  format?: 'online' | 'in-person' | 'hybrid';
  cost_amount?: number;
  cost_type?: 'free' | 'low' | 'moderate' | 'high';
  cost_notes?: string;
  credential_earned?: string;
  relevance_score?: number;
  verified?: boolean;
}

/**
 * Get all training programs for a career
 */
export async function getTrainingProgramsForCareer(
  careerSlug: string
): Promise<TrainingProgram[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('career_training_programs')
    .select(`
      program_id,
      is_primary,
      training_programs (*)
    `)
    .eq('career_slug', careerSlug);

  if (error) {
    throw new Error(`Failed to get training programs: ${error.message}`);
  }

  // Extract and sort programs (primary first, then by relevance)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const programs = (data || [])
    .map((link: any) => ({
      ...(link.training_programs as TrainingProgram),
      is_primary: link.is_primary as boolean
    }))
    .filter((p): p is TrainingProgram & { is_primary: boolean } => p !== null && p.id !== undefined)
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return (b.relevance_score || 0) - (a.relevance_score || 0);
    });

  return programs;
}

/**
 * Get category-level training resources
 */
export async function getCategoryTrainingResources(
  category: string
): Promise<CategoryTrainingResource[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('category_training_resources')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get category resources: ${error.message}`);
  }

  return (data || []) as CategoryTrainingResource[];
}

/**
 * Upsert a training program
 */
export async function upsertTrainingProgram(
  input: UpsertTrainingProgramInput
): Promise<TrainingProgram> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('training_programs')
    .upsert({
      id: input.id,
      name: input.name,
      type: input.type,
      provider: input.provider,
      url: input.url,
      description: input.description || null,
      duration_months: input.duration_months || null,
      format: input.format || null,
      cost_amount: input.cost_amount || null,
      cost_type: input.cost_type || null,
      cost_notes: input.cost_notes || null,
      credential_earned: input.credential_earned || null,
      relevance_score: input.relevance_score || null,
      verified: input.verified || false,
      last_verified: input.verified ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert training program: ${error.message}`);
  }

  return data as TrainingProgram;
}

/**
 * Link a program to a career
 */
export async function linkProgramToCareer(
  careerSlug: string,
  programId: string,
  isPrimary: boolean = false
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('career_training_programs')
    .upsert({
      career_slug: careerSlug,
      program_id: programId,
      is_primary: isPrimary,
    });

  if (error) {
    throw new Error(`Failed to link program to career: ${error.message}`);
  }
}

/**
 * Unlink a program from a career
 */
export async function unlinkProgramFromCareer(
  careerSlug: string,
  programId: string
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('career_training_programs')
    .delete()
    .eq('career_slug', careerSlug)
    .eq('program_id', programId);

  if (error) {
    throw new Error(`Failed to unlink program: ${error.message}`);
  }
}

/**
 * Add a category training resource
 */
export async function addCategoryTrainingResource(
  category: string,
  name: string,
  url: string,
  description?: string
): Promise<CategoryTrainingResource> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('category_training_resources')
    .insert({
      category,
      name,
      url,
      description: description || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add category resource: ${error.message}`);
  }

  return data as CategoryTrainingResource;
}

/**
 * Get all training programs (for export/sync)
 */
export async function getAllTrainingPrograms(): Promise<TrainingProgram[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('training_programs')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to get all programs: ${error.message}`);
  }

  return (data || []) as TrainingProgram[];
}

/**
 * Get all career-program links (for export/sync)
 */
export async function getAllCareerProgramLinks(): Promise<CareerTrainingProgramLink[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('career_training_programs')
    .select('*');

  if (error) {
    throw new Error(`Failed to get career-program links: ${error.message}`);
  }

  return (data || []) as CareerTrainingProgramLink[];
}

/**
 * Delete a training program
 */
export async function deleteTrainingProgram(programId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('training_programs')
    .delete()
    .eq('id', programId);

  if (error) {
    throw new Error(`Failed to delete program: ${error.message}`);
  }
}
