"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/Toast";

export default function CompassPage() {
  const router = useRouter();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

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
      // TODO: Replace with actual API call
      // Simulate API call for now
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Store form data in sessionStorage for results page
      sessionStorage.setItem(
        "compass-submission",
        JSON.stringify({
          resumeFileName: resumeFile?.name || "No resume uploaded",
          answers,
          timestamp: new Date().toISOString(),
        })
      );

      // Navigate to results page
      router.push("/compass-results");
    } catch (error) {
      setToast({
        message: "Failed to get career recommendations. Please try again.",
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
          {/* Resume Upload Section */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-secondary-900 mb-3">
              Resume Upload
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <label className="flex-1 w-full">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="resume-upload"
                />
                <div className="flex items-center justify-center px-6 py-4 border-2 border-dashed border-secondary-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-secondary-50 transition-colors">
                  <div className="text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-secondary-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-secondary-600">
                      <span className="font-medium text-primary-600 hover:text-primary-700">
                        Click to upload
                      </span>{" "}
                      or drag and drop
                    </p>
                    <p className="text-xs text-secondary-500">PDF, DOC, or DOCX</p>
                  </div>
                </div>
              </label>
            </div>
            {resumeFile && (
              <div className="mt-3 flex items-center gap-2 text-sm text-secondary-700">
                <svg
                  className="h-5 w-5 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">{resumeFile.name}</span>
                <button
                  type="button"
                  onClick={() => setResumeFile(null)}
                  className="ml-auto text-red-600 hover:text-red-800 text-xs"
                >
                  Remove
                </button>
              </div>
            )}
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
