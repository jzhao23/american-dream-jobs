"use client";

import { useState } from "react";

export default function RequestPage() {
  const [formData, setFormData] = useState({
    careerTitle: "",
    reason: "",
    additionalInfo: "",
    email: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch("/api/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Request failed");
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
          <div className="text-5xl mb-4">✨</div>
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">
            Request Submitted!
          </h2>
          <p className="text-secondary-600 mb-6">
            Thanks for your request! We'll add{" "}
            <strong>{formData.careerTitle}</strong> to our list and notify you
            when it's published.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/" className="btn-primary">
              Explore Careers
            </a>
            <button
              onClick={() => {
                setStatus("idle");
                setFormData({
                  careerTitle: "",
                  reason: "",
                  additionalInfo: "",
                  email: "",
                });
              }}
              className="btn-secondary"
            >
              Request Another
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
          Request a Career
        </h1>
        <p className="text-lg text-secondary-600">
          Don't see a career you're interested in? Let us know and we'll add it
          to our list. The more requests we get for a career, the higher
          priority it becomes.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="card p-6 md:p-8 space-y-6"
        name="career-request"
        data-netlify="true"
      >
        <input type="hidden" name="form-name" value="career-request" />

        {/* Career Title */}
        <div>
          <label
            htmlFor="careerTitle"
            className="block text-sm font-medium text-secondary-700 mb-2"
          >
            What career should we add?
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            id="careerTitle"
            name="careerTitle"
            required
            value={formData.careerTitle}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, careerTitle: e.target.value }))
            }
            placeholder="e.g., Solar Panel Installer, Pharmacy Technician, Heavy Equipment Operator"
            className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>

        {/* Reason */}
        <div>
          <label
            htmlFor="reason"
            className="block text-sm font-medium text-secondary-700 mb-2"
          >
            Why are you interested in this career?
          </label>
          <textarea
            id="reason"
            name="reason"
            rows={3}
            value={formData.reason}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, reason: e.target.value }))
            }
            placeholder="Considering a career change? Helping someone explore options? Just curious?"
            className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-y"
          />
        </div>

        {/* Additional Info */}
        <div>
          <label
            htmlFor="additionalInfo"
            className="block text-sm font-medium text-secondary-700 mb-2"
          >
            Anything specific you want us to cover?
          </label>
          <textarea
            id="additionalInfo"
            name="additionalInfo"
            rows={3}
            value={formData.additionalInfo}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                additionalInfo: e.target.value,
              }))
            }
            placeholder="Specific questions about pay, training, day-to-day work, etc."
            className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-y"
          />
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-secondary-700 mb-2"
          >
            Email (to notify you when it's published)
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="you@example.com"
            className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
          <p className="text-sm text-secondary-500 mt-1">
            Optional. We'll only email you about this specific request.
          </p>
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
          {status === "loading" ? "Submitting..." : "Submit Request"}
        </button>
      </form>

      {/* Popular Requests */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-secondary-900 mb-4">
          Coming Soon
        </h2>
        <p className="text-secondary-600 mb-4">
          These careers have been requested and are in our pipeline:
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            "Solar Panel Installer",
            "Heavy Equipment Operator",
            "Pharmacy Technician",
            "Dental Assistant",
            "Aircraft Mechanic",
            "Commercial Diver",
            "Boilermaker",
            "Sheet Metal Worker",
          ].map((career) => (
            <div
              key={career}
              className="flex items-center gap-2 text-secondary-700"
            >
              <span className="w-2 h-2 rounded-full bg-primary-400" />
              {career}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
