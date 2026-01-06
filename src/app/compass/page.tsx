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
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <section className="bg-white border-b border-secondary-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
            Career Compass
          </h1>
          <p className="text-lg text-secondary-600 max-w-2xl">
            Upload your resume and answer a few questions to discover personalized career recommendations powered by AI.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="card p-6 md:p-8">
          {/* Resume Section */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-secondary-900 mb-2">
              Your Resume
            </label>
            <p className="text-sm text-secondary-600 mb-4">
              Upload a file or paste your resume text below.
            </p>

            {/* File Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-lg p-6 mb-4 transition-colors ${
                isDragOver
                  ? 'border-primary-500 bg-primary-50'
                  : uploadedFile
                  ? 'border-green-400 bg-green-50'
                  : 'border-secondary-300 bg-secondary-50 hover:border-secondary-400'
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
                      className="animate-spin h-8 w-8 text-primary-600"
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
                    <span className="text-sm text-secondary-600">Extracting text from {uploadedFile?.name}...</span>
                  </div>
                ) : uploadedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-green-700">{uploadedFile.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearUploadedFile();
                      }}
                      className="text-xs text-secondary-500 hover:text-secondary-700 underline"
                    >
                      Remove and upload different file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <svg className="h-10 w-10 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <span className="text-sm font-medium text-primary-600">Drop your resume here</span>
                      <span className="text-sm text-secondary-500"> or click to browse</span>
                    </div>
                    <span className="text-xs text-secondary-400">
                      Supports PDF, Word (.docx), Markdown, and text files (max {MAX_FILE_SIZE_MB}MB)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 border-t border-secondary-200"></div>
              <span className="text-sm text-secondary-400">or paste your resume text</span>
              <div className="flex-1 border-t border-secondary-200"></div>
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
- Improved system performance by 40%

Software Engineer at StartupXYZ (2019-2021)
- Built React Native mobile application
- Implemented CI/CD pipelines

SKILLS
JavaScript, TypeScript, React, Node.js, Python, AWS, Docker

EDUCATION
B.S. Computer Science, State University, 2019`}
              rows={12}
              className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
            />
            <div className="mt-2 flex justify-between text-xs text-secondary-500">
              <span>
                {uploadedFile ? 'Extracted from uploaded file - you can edit the text above' : 'Tip: Copy and paste directly from your resume document or LinkedIn profile'}
              </span>
              <span className={resumeText.length < 100 ? 'text-red-500' : 'text-green-600'}>
                {resumeText.length} characters
              </span>
            </div>
          </div>

          {/* Questions Section */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">
              Career Assessment Questions
            </h2>

            {/* Question 1 */}
            <div>
              <label
                htmlFor="question1"
                className="block text-sm font-medium text-secondary-700 mb-2"
              >
                What are your primary career goals for the next 5 years?
              </label>
              <textarea
                id="question1"
                rows={3}
                value={answers.question1}
                onChange={(e) => handleAnswerChange("question1", e.target.value)}
                placeholder="e.g., Develop leadership skills, transition to a new industry, increase earning potential, find more meaningful work..."
                className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Question 2 */}
            <div>
              <label
                htmlFor="question2"
                className="block text-sm font-medium text-secondary-700 mb-2"
              >
                What skills or areas of expertise do you want to develop?
              </label>
              <textarea
                id="question2"
                rows={3}
                value={answers.question2}
                onChange={(e) => handleAnswerChange("question2", e.target.value)}
                placeholder="e.g., Technical skills like data analysis, management and leadership, creative abilities, hands-on trades..."
                className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Question 3 */}
            <div>
              <label
                htmlFor="question3"
                className="block text-sm font-medium text-secondary-700 mb-2"
              >
                What type of work environment do you thrive in?
              </label>
              <textarea
                id="question3"
                rows={3}
                value={answers.question3}
                onChange={(e) => handleAnswerChange("question3", e.target.value)}
                placeholder="e.g., Remote work, office-based, hands-on fieldwork, collaborative teams, independent work, flexible hours..."
                className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Question 4 */}
            <div>
              <label
                htmlFor="question4"
                className="block text-sm font-medium text-secondary-700 mb-2"
              >
                What are your salary expectations or financial goals?
              </label>
              <textarea
                id="question4"
                rows={3}
                value={answers.question4}
                onChange={(e) => handleAnswerChange("question4", e.target.value)}
                placeholder="e.g., Looking for $100,000+ salary, prioritize work-life balance over maximum earnings, want high growth potential..."
                className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Question 5 */}
            <div>
              <label
                htmlFor="question5"
                className="block text-sm font-medium text-secondary-700 mb-2"
              >
                What industries or career paths are you most interested in exploring?
              </label>
              <textarea
                id="question5"
                rows={3}
                value={answers.question5}
                onChange={(e) => handleAnswerChange("question5", e.target.value)}
                placeholder="e.g., Healthcare, technology, skilled trades, public service, creative fields, finance, education..."
                className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={isLoading || isParsingFile}
              className={`px-6 py-3 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                isLoading || isParsingFile
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
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
                </span>
              ) : (
                "Get Career Recommendations"
              )}
            </button>
          </div>

          {/* Processing Info */}
          {isLoading && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm text-blue-700">
                  <p className="font-medium">AI-Powered Analysis</p>
                  <p className="mt-1">
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
