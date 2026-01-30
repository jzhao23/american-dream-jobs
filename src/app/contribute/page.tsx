import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contribute - American Dream Jobs",
  description: "Help us build the most honest and useful career resource by sharing your experience.",
};

export default function ContributePage() {
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

      <div className="card p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-secondary-900 mb-3">
            Ways to Contribute
          </h2>
          <ul className="space-y-4 text-secondary-700">
            <li className="flex items-start gap-3">
              <span className="text-sage font-bold">1.</span>
              <div>
                <strong>Quick Correction</strong>
                <p className="text-secondary-600">Fix an error or add missing information to a career page</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-sage font-bold">2.</span>
              <div>
                <strong>Share Experience</strong>
                <p className="text-secondary-600">Tell us about your day-to-day work, how you got into this career, what you wish you knew before starting</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-sage font-bold">3.</span>
              <div>
                <strong>Video Contribution</strong>
                <p className="text-secondary-600">Share a link to a helpful video about a career</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="border-t border-secondary-200 pt-6">
          <h3 className="font-semibold text-secondary-900 mb-2">
            Ready to contribute?
          </h3>
          <p className="text-secondary-600 mb-4">
            Send us an email with your contribution. Include the career name and
            any relevant details.
          </p>
          <a
            href="mailto:contribute@americandreamjobs.com?subject=Career%20Contribution"
            className="btn-primary inline-block"
          >
            Email Your Contribution
          </a>
        </div>
      </div>
    </div>
  );
}
