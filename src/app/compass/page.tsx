"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/Toast";

export default function CompassPage() {
  const router = useRouter();
  const [resumeText, setResumeText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

  const handleAnswerChange = (questionKey: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionKey]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate resume text
      if (!resumeText.trim() || resumeText.trim().length < 50) {
        setToast({
          message: 'Please paste your resume text (at least 50 characters)',
          type: 'error'
        });
        setIsLoading(false);
        return;
      }

      // Call API with resume text (note: trailing slash required)
      const response = await fetch('/api/compass/match/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: resumeText.trim(), answers })
      });

      // Get response text first to handle both JSON and HTML error pages
      const responseText = await response.text();

      // Check if response is HTML (server error page)
      if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
        console.error('Server returned HTML error page:', responseText.substring(0, 500));
        throw new Error('Server error occurred. Please check the server logs.');
      }

      // Parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response:', responseText.substring(0, 500));
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to get recommendations');
      }

      // Store results and metadata
      sessionStorage.setItem('compass-results', JSON.stringify(data.matches));
      sessionStorage.setItem(
        'compass-submission',
        JSON.stringify({
          resumeFileName: 'Resume text',
          answers,
          timestamp: new Date().toISOString(),
        })
      );

      // Navigate to results
      router.push('/compass-results');
    } catch (error) {
      console.error('Career Compass error:', error);
      setToast({
        message: error instanceof Error ? error.message : "Failed to get career recommendations. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
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
            Upload your resume and answer a few questions to discover personalized career recommendations.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="card p-6 md:p-8">
          {/* Resume Text Section */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-secondary-900 mb-2">
              Your Resume
            </label>
            <p className="text-sm text-secondary-600 mb-3">
              Paste your resume text below. Include your work experience, skills, education, and any relevant certifications.
            </p>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Example:

John Smith
Software Engineer with 5 years of experience

EXPERIENCE
Senior Software Engineer at TechCorp (2021-Present)
- Led development of microservices architecture
- Managed team of 4 developers

SKILLS
JavaScript, TypeScript, React, Node.js, Python, AWS

EDUCATION
B.S. Computer Science, State University, 2018"
              rows={10}
              className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-2 text-xs text-secondary-500">
              Tip: Copy and paste directly from your resume document or LinkedIn profile
            </p>
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
                placeholder="e.g., Develop leadership skills, transition to a new industry, increase earning potential..."
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
                placeholder="e.g., Technical skills, management, creative abilities, hands-on trades..."
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
                placeholder="e.g., Remote, office-based, hands-on fieldwork, collaborative teams, independent work..."
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
                placeholder="e.g., Minimum salary requirements, long-term wealth building, work-life balance over maximum earnings..."
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
                placeholder="e.g., Healthcare, technology, skilled trades, public service, creative fields..."
                className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className={`px-6 py-3 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                isLoading
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
                  Analyzing...
                </span>
              ) : (
                "Get Career Recommendations"
              )}
            </button>
          </div>
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
