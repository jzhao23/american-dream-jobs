"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/Toast";

interface ParsedProfile {
  skills: string[];
  jobTitles: string[];
  education: {
    level: string;
    fields: string[];
  };
  industries: string[];
  experienceYears: number;
  confidence: number;
}

type ProcessingStage = 'idle' | 'analyzing' | 'matching' | 'complete';

const ACCEPTED_FILE_TYPES = '.pdf,.docx,.doc,.md,.txt';
const MAX_FILE_SIZE_MB = 5;

const questions = [
  {
    id: "question1",
    label: "What are your primary career goals for the next 5 years?",
    placeholder: "e.g., Develop leadership skills, transition to a new industry, increase earning potential...",
  },
  {
    id: "question2",
    label: "What skills or areas of expertise do you want to develop?",
    placeholder: "e.g., Technical skills, management, creative abilities, hands-on trades...",
  },
  {
    id: "question3",
    label: "What type of work environment do you thrive in?",
    placeholder: "e.g., Remote, office-based, hands-on fieldwork, collaborative teams, independent work...",
  },
  {
    id: "question4",
    label: "What are your salary expectations or financial goals?",
    placeholder: "e.g., Minimum salary requirements, long-term wealth building, work-life balance over maximum earnings...",
  },
  {
    id: "question5",
    label: "What industries or career paths are you most interested in exploring?",
    placeholder: "e.g., Healthcare, technology, skilled trades, public service, creative fields...",
  },
];

export default function CompassPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumeText, setResumeText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('idle');
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [answers, setAnswers] = useState({
    question1: "",
    question2: "",
    question3: "",
    question4: "",
    question5: "",
  });

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleAnswerChange = (questionKey: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionKey]: value,
    }));
  };

  const parseFile = async (file: File) => {
    // Validate file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setToast({
        message: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB`,
        type: 'error'
      });
      return;
    }

    setIsParsingFile(true);
    setUploadedFile(file);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/compass/parse-file/', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to parse file');
      }

      setResumeText(data.text);
      setToast({
        message: `Resume extracted from ${file.name}`,
        type: 'success'
      });
    } catch (error) {
      console.error('File parse error:', error);
      setToast({
        message: error instanceof Error ? error.message : 'Failed to parse file',
        type: 'error'
      });
      setUploadedFile(null);
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseFile(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      parseFile(file);
    }
  }, []);

  const clearUploadedFile = () => {
    setUploadedFile(null);
    setResumeText("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = (): string | null => {
    if (!resumeText.trim() || resumeText.trim().length < 100) {
      return "Please provide your resume text (at least 100 characters)";
    }
    if (!answers.question1.trim() || answers.question1.length < 10) {
      return "Please describe your career goals (at least 10 characters)";
    }
    if (!answers.question2.trim() || answers.question2.length < 10) {
      return "Please describe skills you want to develop (at least 10 characters)";
    }
    if (!answers.question3.trim() || answers.question3.length < 10) {
      return "Please describe your preferred work environment (at least 10 characters)";
    }
    if (!answers.question4.trim() || answers.question4.length < 5) {
      return "Please provide your salary expectations";
    }
    if (!answers.question5.trim() || answers.question5.length < 5) {
      return "Please share your industry interests";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted!');
    console.log('Resume length:', resumeText.length);
    console.log('Answers:', answers);

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      console.log('Validation error:', validationError);
      setToast({ message: validationError, type: "error" });
      return;
    }
    console.log('Validation passed, calling API...');

    setIsLoading(true);
    setProcessingStage('analyzing');

    try {
      // Step 1: Analyze resume
      const analyzeResponse = await fetch('/api/compass/analyze/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: resumeText.trim() })
      });

      const analyzeData = await analyzeResponse.json();

      if (!analyzeData.success) {
        throw new Error(analyzeData.error?.message || 'Failed to analyze resume');
      }

      const profile: ParsedProfile = analyzeData.profile;
      console.log('Resume analyzed:', profile);

      // Step 2: Get recommendations
      setProcessingStage('matching');

      const recommendResponse = await fetch('/api/compass/recommend/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: {
            skills: profile.skills,
            jobTitles: profile.jobTitles,
            education: profile.education,
            industries: profile.industries,
            experienceYears: profile.experienceYears
          },
          preferences: {
            careerGoals: answers.question1,
            skillsToDevelop: answers.question2,
            workEnvironment: answers.question3,
            salaryExpectations: answers.question4,
            industryInterests: answers.question5
          }
        })
      });

      const recommendData = await recommendResponse.json();

      if (!recommendData.success) {
        throw new Error(recommendData.error?.message || 'Failed to get recommendations');
      }

      console.log('Recommendations received:', recommendData.recommendations.length);

      setProcessingStage('complete');

      // Store results in sessionStorage
      sessionStorage.setItem('compass-results', JSON.stringify(recommendData.recommendations));
      sessionStorage.setItem('compass-metadata', JSON.stringify(recommendData.metadata));
      sessionStorage.setItem('compass-profile', JSON.stringify(profile));
      sessionStorage.setItem(
        'compass-submission',
        JSON.stringify({
          resumeLength: resumeText.length,
          answers,
          timestamp: new Date().toISOString(),
        })
      );

      // Navigate to results page
      router.push('/compass-results');
    } catch (error) {
      console.error('Career Compass error:', error);
      setToast({
        message: error instanceof Error ? error.message : 'Failed to get career recommendations. Please try again.',
        type: 'error',
      });
      setProcessingStage('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const getProcessingMessage = (): string => {
    switch (processingStage) {
      case 'analyzing':
        return 'Analyzing your resume...';
      case 'matching':
        return 'Finding your perfect career matches...';
      case 'complete':
        return 'Complete! Redirecting...';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Page Header */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-12 text-center">
        <h1 className="font-display text-3xl md:text-4xl font-medium text-ds-slate mb-3">
          🧭 Career Compass
        </h1>
        <p className="text-lg text-ds-slate-light max-w-xl mx-auto">
          Upload your resume and answer a few questions to discover personalized career recommendations.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-12">
        <form onSubmit={handleSubmit} className="bg-warm-white rounded-2xl shadow-soft p-6 md:p-8">
          {/* Resume Section */}
          <div className="mb-8 pb-8 border-b border-sage-muted">
            <h2 className="font-display text-lg font-semibold text-ds-slate mb-1">
              Resume (Optional)
            </h2>
            <p className="text-sm text-ds-slate-light mb-4">
              Have a resume? Upload it for more personalized recommendations based on your experience.
            </p>

            {/* File Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-6 mb-4 transition-all cursor-pointer ${
                isDragOver
                  ? 'border-sage bg-sage-pale'
                  : uploadedFile
                  ? 'border-sage bg-sage-pale border-solid'
                  : 'border-sage-muted bg-cream hover:border-sage-light'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isParsingFile || isLoading}
              />

              <div className="text-center">
                {isParsingFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="animate-spin h-8 w-8 text-sage"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span className="text-sm text-ds-slate-light">Extracting text from {uploadedFile?.name}...</span>
                  </div>
                ) : uploadedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-3xl">✓</div>
                    <span className="text-sm font-semibold text-sage">{uploadedFile.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearUploadedFile();
                      }}
                      className="text-xs text-terracotta hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-3xl mb-1">📄</div>
                    <div className="text-sm">
                      <span className="font-medium text-ds-slate">Click to upload your resume</span>
                    </div>
                    <span className="text-xs text-ds-slate-muted">
                      PDF, DOC, DOCX, or TXT (max {MAX_FILE_SIZE_MB}MB)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 border-t border-sage-muted"></div>
              <span className="text-xs text-ds-slate-muted">or paste your resume text</span>
              <div className="flex-1 border-t border-sage-muted"></div>
            </div>

            {/* Text Area */}
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder={`Example:

John Smith
Software Engineer with 5 years of experience

EXPERIENCE
Senior Software Engineer at TechCorp (2021-Present)
- Led development of microservices architecture
- Managed team of 4 developers

SKILLS
JavaScript, TypeScript, React, Node.js, Python, AWS

EDUCATION
B.S. Computer Science, State University, 2019`}
              rows={10}
              className="w-full px-4 py-3 bg-cream border border-sage-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent font-mono text-sm transition-all"
            />
            <div className="mt-2 flex justify-between text-xs text-ds-slate-muted">
              <span>
                {uploadedFile ? 'Extracted from uploaded file — you can edit above' : 'Paste from your resume or LinkedIn profile'}
              </span>
              <span className={resumeText.length < 100 ? 'text-terracotta' : 'text-sage'}>
                {resumeText.length} characters
              </span>
            </div>
          </div>

          {/* Questions Section */}
          <div className="mb-8">
            <div className="mb-6">
              <h2 className="font-display text-lg font-semibold text-ds-slate mb-1">
                Career Assessment Questions
              </h2>
              <p className="text-sm text-ds-slate-light">
                These questions help us understand your goals and preferences—things a resume can&apos;t tell us.
              </p>
            </div>

            <div className="space-y-6">
              {questions.map((q, idx) => (
                <div key={q.id}>
                  <label
                    htmlFor={q.id}
                    className="flex items-start gap-3 text-sm font-medium text-ds-slate mb-2"
                  >
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-sage-muted text-sage text-xs font-bold rounded-full flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    {q.label}
                  </label>
                  <textarea
                    id={q.id}
                    rows={3}
                    value={answers[q.id as keyof typeof answers]}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder={q.placeholder}
                    className="w-full px-4 py-3 bg-cream border border-sage-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent text-sm transition-all placeholder:text-ds-slate-muted"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit Section */}
          <div className="pt-6 border-t border-sage-muted">
            <button
              type="submit"
              disabled={isLoading || isParsingFile}
              className={`w-full px-6 py-4 font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2 flex items-center justify-center gap-2 ${
                isLoading || isParsingFile
                  ? "bg-ds-slate-muted text-white cursor-not-allowed"
                  : "bg-sage text-white hover:bg-sage-light hover:-translate-y-0.5 shadow-soft hover:shadow-hover"
              }`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {getProcessingMessage()}
                </>
              ) : (
                "Get Career Recommendations"
              )}
            </button>
            <p className="text-center text-sm text-ds-slate-muted mt-4">
              We&apos;ll analyze your responses and match you with careers that fit your goals.
            </p>
          </div>

          {/* Processing Info */}
          {isLoading && (
            <div className="mt-6 p-4 bg-sage-pale rounded-xl">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 text-sage text-lg">🤖</div>
                <div className="text-sm text-ds-slate">
                  <p className="font-medium">AI-Powered Analysis</p>
                  <p className="mt-1 text-ds-slate-light">
                    We&apos;re using advanced AI to analyze your resume, understand your goals, and match you with careers from our database of 1,000+ occupations. This typically takes 10-15 seconds.
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
