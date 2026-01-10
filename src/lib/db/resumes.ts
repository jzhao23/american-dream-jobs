/**
 * Resume Storage Operations
 *
 * Handles resume file storage and metadata management
 */

import { getSupabaseClient } from '../compass/supabase';

// Types
export interface UserResume {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_size_bytes: number;
  storage_path: string;
  extracted_text: string | null;
  parsed_profile: ParsedResumeProfile | null;
  parse_confidence: number | null;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ParsedResumeProfile {
  skills: string[];
  jobTitles: string[];
  education: {
    level: string;
    fields: string[];
  };
  industries: string[];
  experienceYears: number;
}

export interface UploadResumeInput {
  userId: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  fileBuffer: Buffer;
  extractedText: string;
  parsedProfile?: ParsedResumeProfile;
  parseConfidence?: number;
}

// Storage bucket name
const RESUMES_BUCKET = 'resumes';

/**
 * Upload a resume file and save metadata
 */
export async function uploadResume(input: UploadResumeInput): Promise<UserResume> {
  const supabase = getSupabaseClient();

  // Generate unique storage path
  const timestamp = Date.now();
  const sanitizedFileName = input.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `${input.userId}/${timestamp}_${sanitizedFileName}`;

  // Deactivate any existing active resumes for this user
  await supabase
    .from('user_resumes')
    .update({ is_active: false })
    .eq('user_id', input.userId)
    .eq('is_active', true);

  // Get the next version number
  const { data: versionData } = await supabase
    .from('user_resumes')
    .select('version')
    .eq('user_id', input.userId)
    .order('version', { ascending: false })
    .limit(1);

  const nextVersion = versionData && versionData.length > 0 ? versionData[0].version + 1 : 1;

  // Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(RESUMES_BUCKET)
    .upload(storagePath, input.fileBuffer, {
      contentType: getContentType(input.fileType),
      upsert: false
    });

  if (uploadError) {
    // If bucket doesn't exist, try to continue without storage
    // (for development environments without storage configured)
    console.warn(`Storage upload warning: ${uploadError.message}`);
  }

  // Insert metadata into database
  const { data: resume, error: dbError } = await supabase
    .from('user_resumes')
    .insert({
      user_id: input.userId,
      file_name: input.fileName,
      file_type: input.fileType,
      file_size_bytes: input.fileSizeBytes,
      storage_path: storagePath,
      extracted_text: input.extractedText,
      parsed_profile: input.parsedProfile || null,
      parse_confidence: input.parseConfidence || null,
      version: nextVersion,
      is_active: true
    })
    .select()
    .single();

  if (dbError) {
    // Clean up uploaded file if database insert fails
    await supabase.storage.from(RESUMES_BUCKET).remove([storagePath]);
    throw new Error(`Failed to save resume metadata: ${dbError.message}`);
  }

  return resume as UserResume;
}

/**
 * Get the active resume for a user
 */
export async function getActiveResume(userId: string): Promise<UserResume | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('user_resumes')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to get active resume: ${error.message}`);
  }

  return data as UserResume;
}

/**
 * Get all resumes for a user (including inactive)
 */
export async function getUserResumes(userId: string): Promise<UserResume[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('user_resumes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get user resumes: ${error.message}`);
  }

  return data as UserResume[];
}

/**
 * Get resume by ID
 */
export async function getResumeById(resumeId: string): Promise<UserResume | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('user_resumes')
    .select('*')
    .eq('id', resumeId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get resume: ${error.message}`);
  }

  return data as UserResume;
}

/**
 * Delete a resume (soft delete - deactivate, keep file for audit)
 */
export async function deactivateResume(resumeId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('user_resumes')
    .update({ is_active: false })
    .eq('id', resumeId);

  if (error) {
    throw new Error(`Failed to deactivate resume: ${error.message}`);
  }
}

/**
 * Permanently delete a resume and its file (for GDPR requests)
 */
export async function permanentlyDeleteResume(resumeId: string): Promise<void> {
  const supabase = getSupabaseClient();

  // Get resume to find storage path
  const resume = await getResumeById(resumeId);
  if (!resume) {
    return; // Already deleted
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(RESUMES_BUCKET)
    .remove([resume.storage_path]);

  if (storageError) {
    console.warn(`Storage deletion warning: ${storageError.message}`);
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('user_resumes')
    .delete()
    .eq('id', resumeId);

  if (dbError) {
    throw new Error(`Failed to delete resume: ${dbError.message}`);
  }
}

/**
 * Delete all resumes for a user (for GDPR requests)
 */
export async function deleteAllUserResumes(userId: string): Promise<void> {
  const resumes = await getUserResumes(userId);

  for (const resume of resumes) {
    await permanentlyDeleteResume(resume.id);
  }
}

/**
 * Update parsed profile for a resume
 */
export async function updateResumeParsedProfile(
  resumeId: string,
  parsedProfile: ParsedResumeProfile,
  parseConfidence: number
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('user_resumes')
    .update({
      parsed_profile: parsedProfile,
      parse_confidence: parseConfidence
    })
    .eq('id', resumeId);

  if (error) {
    throw new Error(`Failed to update resume profile: ${error.message}`);
  }
}

/**
 * Get download URL for a resume file
 */
export async function getResumeDownloadUrl(resumeId: string): Promise<string | null> {
  const supabase = getSupabaseClient();

  const resume = await getResumeById(resumeId);
  if (!resume) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from(RESUMES_BUCKET)
    .createSignedUrl(resume.storage_path, 3600); // 1 hour expiry

  if (error) {
    console.warn(`Failed to create signed URL: ${error.message}`);
    return null;
  }

  return data.signedUrl;
}

/**
 * Helper to get content type from file type
 */
function getContentType(fileType: string): string {
  const contentTypes: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    md: 'text/markdown',
    txt: 'text/plain'
  };

  return contentTypes[fileType] || 'application/octet-stream';
}
