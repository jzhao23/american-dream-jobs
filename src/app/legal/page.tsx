'use client';

export default function LegalPage() {
  const effectiveDate = 'January 30, 2026';
  const companyName = 'American Dream Jobs';
  const websiteUrl = 'americandreamjobs.com';

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <section className="bg-gradient-to-br from-sage to-sage-dark text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="font-display text-3xl md:text-4xl font-medium mb-4">
            Terms of Use & Privacy
          </h1>
          <p className="text-lg text-white/90">
            Last updated: {effectiveDate}
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <main className="space-y-12">
          {/* Privacy Summary Box */}
          <section className="bg-sage-pale border border-sage-muted rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <svg className="w-8 h-8 text-sage flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div>
                <h2 className="font-display text-xl font-semibold text-sage mb-2">
                  Privacy First
                </h2>
                <p className="text-ds-slate-light">
                  <strong className="text-ds-slate">We don't collect your personal data.</strong> Your Career Compass responses,
                  resume information, and preferences are stored only in your browser's local storage.
                  We don't have accounts, we don't track you, and we don't sell anything.
                </p>
              </div>
            </div>
          </section>

          {/* Terms of Use */}
          <section id="terms">
            <h2 className="font-display text-2xl font-medium text-ds-slate mb-6 pb-2 border-b-2 border-sage">
              Terms of Use
            </h2>

            <div className="space-y-6 text-ds-slate-light text-sm leading-relaxed">
              <div>
                <h3 className="font-semibold text-ds-slate mb-2">Using This Site</h3>
                <p>
                  {companyName} ("{websiteUrl}") provides career exploration tools and job search functionality.
                  By using this site, you agree to these terms. If you don't agree, please don't use the site.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-ds-slate mb-2">What We Provide</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Career information and AI resilience assessments</li>
                  <li>Job search aggregated from third-party job boards</li>
                  <li>Career Compass - personalized career matching</li>
                  <li>Salary calculations and comparisons</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-ds-slate mb-2">Information Accuracy</h3>
                <p>
                  Career data comes from the Bureau of Labor Statistics, O*NET, and other public sources.
                  Job listings come from third-party job boards. We do our best to present accurate information,
                  but we can't guarantee everything is correct or up-to-date. Career assessments and AI predictions
                  are informational tools, not professional advice. Don't make major life decisions based solely on this site.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-ds-slate mb-2">Third-Party Job Listings</h3>
                <p>
                  When you click a job listing, you leave our site and go to an external website (LinkedIn, Indeed, Glassdoor, etc.).
                  Those sites have their own terms and privacy policies. We're not responsible for their content or practices.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-ds-slate mb-2">Don't Be a Jerk</h3>
                <p>
                  Don't use bots or scrapers. Don't try to break the site. Don't use it for anything illegal.
                  We reserve the right to block anyone who abuses the service.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-ds-slate mb-2">No Warranties</h3>
                <p className="uppercase text-xs font-medium text-ds-slate">
                  This site is provided "as is" without warranties. We don't guarantee employment outcomes,
                  accuracy of job listings, or that the site will always work perfectly. Use at your own risk.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-ds-slate mb-2">Limitation of Liability</h3>
                <p className="uppercase text-xs font-medium text-ds-slate">
                  We're not liable for any damages from using this site, including but not limited to
                  career decisions made based on our information, missed job opportunities, or any other losses.
                </p>
              </div>
            </div>
          </section>

          {/* Privacy Policy */}
          <section id="privacy">
            <h2 className="font-display text-2xl font-medium text-ds-slate mb-6 pb-2 border-b-2 border-sage">
              Privacy Policy
            </h2>

            <div className="space-y-6 text-ds-slate-light text-sm leading-relaxed">
              <div>
                <h3 className="font-semibold text-ds-slate mb-2">The Short Version</h3>
                <p>
                  We don't collect your personal data. No accounts. No tracking. No cookies for advertising.
                  Your information stays on your device.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-ds-slate mb-2">What's Stored Locally</h3>
                <p className="mb-2">
                  When you use Career Compass or upload a resume, that information is stored in your browser's
                  local storage on your device. This includes:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Career Compass questionnaire responses</li>
                  <li>Parsed resume text (if you upload one)</li>
                  <li>Your location preference</li>
                  <li>Career match results</li>
                </ul>
                <p className="mt-2">
                  This data never leaves your device. Clear your browser data anytime to remove it.
                  It expires automatically after 30 days.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-ds-slate mb-2">What We Don't Collect</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Email addresses</li>
                  <li>Names or personal identifiers</li>
                  <li>Resumes (they're processed in your browser, not sent to us)</li>
                  <li>IP addresses</li>
                  <li>Browsing history or behavior tracking</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-ds-slate mb-2">Analytics</h3>
                <p>
                  We use Google Analytics to track basic usage metrics like page views and visitor counts.
                  This helps us understand how many people use the site and which pages are popular.
                  Google Analytics uses cookies but we don't use it to identify or track individual users.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-ds-slate mb-2">External Services</h3>
                <p className="mb-2">
                  To provide job listings and career matching, we use these services:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Job Search APIs:</strong> We send job titles and locations (not your personal data) to fetch job listings</li>
                  <li><strong>AI Services:</strong> Career matching uses AI models, but only career data is sent - never your personal information</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-ds-slate mb-2">Children's Privacy</h3>
                <p>
                  This site is for adults exploring careers. We don't knowingly collect information from anyone under 18.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-ds-slate mb-2">Changes</h3>
                <p>
                  If we change this policy, we'll update the date at the top. Since we don't collect your email,
                  we can't notify you - so check back occasionally if you care about this stuff.
                </p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="text-sm text-ds-slate-muted border-t border-sage-muted pt-6">
            <p>Effective Date: {effectiveDate}</p>
            <p className="mt-2">
              Questions? Email us at{' '}
              <a href="mailto:hello@americandreamjobs.com" className="text-sage hover:underline">
                hello@americandreamjobs.com
              </a>
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
