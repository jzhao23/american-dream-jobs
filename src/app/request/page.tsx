import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request a Career - American Dream Jobs",
  description: "Don't see a career you're interested in? Let us know and we'll add it to our list.",
};

export default function RequestPage() {
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

      <div className="card p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-secondary-900 mb-3">
            How to Request
          </h2>
          <p className="text-secondary-600 mb-4">
            Send us an email with the career you'd like us to add. Feel free to include:
          </p>
          <ul className="list-disc list-inside space-y-2 text-secondary-700 ml-2">
            <li>The career title you're interested in</li>
            <li>Why you're interested (career change, helping someone, etc.)</li>
            <li>Any specific questions you want answered</li>
          </ul>
        </div>

        <div className="border-t border-secondary-200 pt-6">
          <a
            href="mailto:requests@americandreamjobs.com?subject=Career%20Request"
            className="btn-primary inline-block"
          >
            Email Your Request
          </a>
        </div>
      </div>

      {/* Coming Soon */}
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
