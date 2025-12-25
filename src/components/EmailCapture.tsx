"use client";

import { useState } from "react";

type Persona = "student" | "switcher" | "practitioner" | "educator";

const PERSONAS: { value: Persona; label: string }[] = [
  { value: "student", label: "Student exploring options" },
  { value: "switcher", label: "Switching careers" },
  { value: "practitioner", label: "Working professional" },
  { value: "educator", label: "Educator / Counselor" },
];

export function EmailCapture() {
  const [email, setEmail] = useState("");
  const [persona, setPersona] = useState<Persona | "">("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, persona }),
      });

      if (!response.ok) {
        throw new Error("Subscription failed");
      }

      setStatus("success");
      setEmail("");
      setPersona("");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="text-3xl mb-2">✓</div>
        <h3 className="text-lg font-semibold text-green-800 mb-1">
          You're on the list!
        </h3>
        <p className="text-green-700">
          We'll email you when we add new career profiles.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
        />
      </div>

      <div>
        <label htmlFor="persona" className="sr-only">
          I am a...
        </label>
        <select
          id="persona"
          name="persona"
          value={persona}
          onChange={(e) => setPersona(e.target.value as Persona)}
          className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors text-secondary-900 bg-white"
        >
          <option value="">I am a... (optional)</option>
          {PERSONAS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {status === "error" && (
        <p className="text-red-600 text-sm">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "loading" ? "Subscribing..." : "Get Updates"}
      </button>

      <p className="text-xs text-secondary-500">
        No spam. Unsubscribe anytime. We respect your privacy.
      </p>
    </form>
  );
}
