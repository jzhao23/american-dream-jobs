"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type SubmissionType = "correction" | "experience" | "video";

const SUBMISSION_TYPES: { value: SubmissionType; label: string; description: string }[] = [
  {
    value: "correction",
    label: "Quick Correction",
    description: "Fix an error or add missing information",
  },
  {
    value: "experience",
    label: "Share Experience",
    description: "Write about your experience in this career",
  },
  {
    value: "video",
    label: "Video Contribution",
    description: "Share a link to a video about the job",
  },
];

function ContributeFormContent() {
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    careerSlug: "",
    submissionType: "experience" as SubmissionType,
    content: "",
    name: "",
    email: "",
    link: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    const career = searchParams.get("career");
    const type = searchParams.get("type");

    if (career) {
      setFormData((prev) => ({ ...prev, careerSlug: career }));
    }
    if (type && ["correction", "experience", "video"].includes(type)) {
      setFormData((prev) => ({
        ...prev,
        submissionType: type as SubmissionType,
      }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch("/api/contribute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="card p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">
            Thank You!
          </h2>
          <p className="text-secondary-600 mb-6">
            Your contribution has been received. We'll review it and update the
            career page soon.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/" className="btn-primary">
              Back to Home
            </a>
            <button
              onClick={() => {
                setStatus("idle");
                setFormData({
                  careerSlug: "",
                  submissionType: "experience",
                  content: "",
                  name: "",
                  email: "",
                  link: "",
                });
              }}
              className="btn-secondary"
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-3">
          Contribute Your Knowledge
        </h1>
        <p className="text-lg text-secondary-600">
          Help us build the most honest and useful career resource. Share your
          real-world experience, correct errors, or add context that helps
          others make better decisions.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="card p-6 md:p-8 space-y-6"
        name="contribution"
        data-netlify="true"
      >
        <input type="hidden" name="form-name" value="contribution" />

        {/* Submission Type */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-3">
            What would you like to contribute?
          </label>
          <div className="grid gap-3">
            {SUBMISSION_TYPES.map((type) => (
              <label
                key={type.value}
                className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  formData.submissionType === type.value
                    ? "border-primary-500 bg-primary-50"
                    : "border-secondary-200 hover:border-primary-300"
                }`}
              >
                <input
                  type="radio"
                  name="submissionType"
                  value={type.value}
                  checked={formData.submissionType === type.value}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      submissionType: e.target.value as SubmissionType,
                    }))
                  }
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-secondary-900">
                    {type.label}
                  </div>
                  <div className="text-sm text-secondary-600">
                    {type.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Career (optional) */}
        <div>
          <label
            htmlFor="careerSlug"
            className="block text-sm font-medium text-secondary-700 mb-2"
          >
            Related Career (optional)
          </label>
          <input
            type="text"
            id="careerSlug"
            name="careerSlug"
            value={formData.careerSlug}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, careerSlug: e.target.value }))
            }
            placeholder="e.g., welder, electrician, registered-nurse"
            className="w-full px-4 py-3 text-base border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>

        {/* Main Content */}
        <div>
          <label
            htmlFor="content"
            className="block text-sm font-medium text-secondary-700 mb-2"
          >
            {formData.submissionType === "correction"
              ? "What needs to be corrected?"
              : formData.submissionType === "video"
              ? "Tell us about the video"
              : "Share your experience"}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <textarea
            id="content"
            name="content"
            required
            rows={6}
            value={formData.content}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, content: e.target.value }))
            }
            placeholder={
              formData.submissionType === "correction"
                ? "Please describe what information is incorrect and what it should be..."
                : formData.submissionType === "video"
                ? "Describe what the video covers and why it's helpful..."
                : "Tell us about your day-to-day work, how you got into this career, what you wish you knew before starting..."
            }
            className="w-full px-4 py-3 text-base border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-y"
          />
        </div>

        {/* Link (for videos) */}
        {formData.submissionType === "video" && (
          <div>
            <label
              htmlFor="link"
              className="block text-sm font-medium text-secondary-700 mb-2"
            >
              Video URL
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="url"
              id="link"
              name="link"
              required={formData.submissionType === "video"}
              value={formData.link}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, link: e.target.value }))
              }
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-4 py-3 text-base border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
        )}

        {/* Optional Contact Info */}
        <div className="border-t border-secondary-200 pt-6">
          <p className="text-sm text-secondary-600 mb-4">
            Optional: Leave your contact info if you'd like us to follow up or
            credit your contribution.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-secondary-700 mb-2"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-4 py-3 text-base border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-secondary-700 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full px-4 py-3 text-base border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>
        </div>

        {status === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            Something went wrong. Please try again.
          </div>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full btn-primary py-3 text-base disabled:opacity-50"
        >
          {status === "loading" ? "Submitting..." : "Submit Contribution"}
        </button>
      </form>
    </div>
  );
}

export default function ContributePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-secondary-200 rounded w-3/4 mb-4" />
            <div className="h-4 bg-secondary-200 rounded w-full mb-8" />
            <div className="card p-8">
              <div className="h-4 bg-secondary-200 rounded w-1/2 mb-4" />
              <div className="h-32 bg-secondary-200 rounded mb-4" />
              <div className="h-10 bg-secondary-200 rounded" />
            </div>
          </div>
        </div>
      }
    >
      <ContributeFormContent />
    </Suspense>
  );
}
