'use client';

import { useState } from 'react';
import Link from 'next/link';

// Collapsible section component
function CollapsibleSection({
  title,
  children,
  defaultOpen = false
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-secondary-200 rounded-lg mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left bg-secondary-50 hover:bg-secondary-100 rounded-t-lg transition-colors"
      >
        <span className="font-semibold text-secondary-900">{title}</span>
        <svg
          className={`w-5 h-5 text-secondary-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-4 py-4 border-t border-secondary-200">
          {children}
        </div>
      )}
    </div>
  );
}

// Table of contents item
function TOCItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="block py-1 text-sm text-secondary-600 hover:text-primary-600 transition-colors"
    >
      {children}
    </a>
  );
}

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <section className="bg-white border-b border-secondary-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
            How We Assess AI Impact on Careers
          </h1>
          <p className="text-lg text-secondary-600">
            Transparent methodology for our AI Resilience ratings, including data sources,
            calculation methods, and honest limitations.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Navigation */}
        <div className="card p-4 mb-8 lg:hidden">
          <h2 className="font-semibold text-secondary-900 mb-2">On This Page</h2>
          <div className="space-y-1">
            <TOCItem href="#why">Why We Built This</TOCItem>
            <TOCItem href="#framework">Our 4-Dimensional Framework</TOCItem>
            <TOCItem href="#classifications">How We Classify Careers</TOCItem>
            <TOCItem href="#limitations">What We Don't Know</TOCItem>
            <TOCItem href="#sources">Data Sources</TOCItem>
          </div>
        </div>

        <div className="lg:flex lg:gap-8">
          {/* Sticky TOC for desktop */}
          <aside className="hidden lg:block lg:w-48 flex-shrink-0">
            <div className="sticky top-8">
              <h2 className="font-semibold text-secondary-900 mb-3 text-sm uppercase tracking-wide">
                On This Page
              </h2>
              <nav className="space-y-1">
                <TOCItem href="#why">Why We Built This</TOCItem>
                <TOCItem href="#framework">4-Dimensional Framework</TOCItem>
                <TOCItem href="#classifications">Classifications</TOCItem>
                <TOCItem href="#limitations">Limitations</TOCItem>
                <TOCItem href="#sources">Data Sources</TOCItem>
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 space-y-12">
            {/* Why We Built This */}
            <section id="why">
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">Why We Built This</h2>
              <div className="prose prose-secondary max-w-none">
                <p className="text-secondary-700 mb-4">
                  Most AI impact predictions rely on outdated single-source data, like the widely-cited
                  2013 Oxford study that predicted 47% of jobs were at high risk of automation. While
                  groundbreaking at the time, that research is now over a decade old and didn't anticipate
                  developments like large language models.
                </p>
                <p className="text-secondary-700 mb-4">
                  We built this system to provide <strong>transparent, multi-source assessments</strong> that
                  acknowledge uncertainty. Rather than giving a false sense of precision with a single
                  "automation probability" number, we evaluate careers across four dimensions and combine
                  them into categorical ratings.
                </p>
                <p className="text-secondary-700">
                  <strong>Our commitment:</strong> We update our assessments as new research emerges
                  and are transparent about our methodology's limitations. If you work in an occupation
                  and believe our assessment is wrong, <Link href="/contribute" className="text-primary-600 hover:underline">we want to hear from you</Link>.
                </p>
              </div>
            </section>

            {/* 4-Dimensional Framework */}
            <section id="framework">
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">Our 4-Dimensional Framework</h2>
              <p className="text-secondary-600 mb-6">
                We assess AI impact across four dimensions, then combine them into an overall classification.
              </p>

              {/* Dimension 1: Task Exposure */}
              <CollapsibleSection title="1. Task Exposure" defaultOpen={true}>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-secondary-900 mb-1">What it measures</h4>
                    <p className="text-secondary-700">
                      How much of this job's daily work involves tasks that AI can currently perform or assist with.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-secondary-900 mb-1">How we calculate it</h4>
                    <p className="text-secondary-700 mb-2">
                      We use the AIOE (AI Occupational Exposure) dataset from Felten, Raj, and Seamans (2021),
                      which measures exposure by analyzing how AI capabilities map to occupational abilities
                      defined in O*NET.
                    </p>
                    <ul className="list-disc list-inside text-secondary-700 space-y-1 ml-2">
                      <li><strong>Low:</strong> Bottom 33% of exposure scores</li>
                      <li><strong>Medium:</strong> Middle 34% of exposure scores</li>
                      <li><strong>High:</strong> Top 33% of exposure scores</li>
                    </ul>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <h4 className="font-semibold text-amber-800 mb-1">Limitations</h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>Based on task descriptions, not actual workplace AI adoption</li>
                      <li>Doesn't distinguish between "AI can do this" and "employers are using AI for this"</li>
                      <li>O*NET task descriptions may lag behind how jobs are actually performed</li>
                    </ul>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Dimension 2: Automation Risk */}
              <CollapsibleSection title="2. Automation Risk">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-secondary-900 mb-1">What it measures</h4>
                    <p className="text-secondary-700">
                      The likelihood that AI will fully replace workers in this role, rather than augment their productivity.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-secondary-900 mb-1">How we calculate it</h4>
                    <p className="text-secondary-700 mb-2">
                      We assess what percentage of core tasks are "routine" (repetitive, rule-based) versus
                      non-routine. High automation risk indicates jobs where most tasks can be fully automated,
                      not just assisted.
                    </p>
                    <ul className="list-disc list-inside text-secondary-700 space-y-1 ml-2">
                      <li><strong>Low:</strong> Mostly non-routine tasks requiring judgment, creativity, or physical presence</li>
                      <li><strong>Medium:</strong> Mix of routine and non-routine tasks</li>
                      <li><strong>High:</strong> Predominantly routine, rule-based tasks</li>
                    </ul>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <h4 className="font-semibold text-amber-800 mb-1">Limitations</h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>"Automatable" doesn't mean "will be automated" — cost, regulations, and organizational inertia matter</li>
                      <li>We can't predict breakthrough AI capabilities</li>
                      <li>Automation often happens gradually, changing roles rather than eliminating them overnight</li>
                    </ul>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Dimension 3: Job Growth */}
              <CollapsibleSection title="3. Job Growth">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-secondary-900 mb-1">What it measures</h4>
                    <p className="text-secondary-700">
                      Whether employment in this occupation is projected to increase or decrease over the next decade.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-secondary-900 mb-1">How we calculate it</h4>
                    <p className="text-secondary-700 mb-2">
                      We use official Bureau of Labor Statistics (BLS) employment projections for 2024-2034.
                      BLS economists factor in technology, demographics, and economic trends.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-secondary-200">
                            <th className="text-left py-2 pr-4 font-semibold text-secondary-900">Category</th>
                            <th className="text-left py-2 font-semibold text-secondary-900">10-Year Projection</th>
                          </tr>
                        </thead>
                        <tbody className="text-secondary-700">
                          <tr className="border-b border-secondary-100">
                            <td className="py-2 pr-4">Declining Quickly</td>
                            <td className="py-2">More than 10% decline</td>
                          </tr>
                          <tr className="border-b border-secondary-100">
                            <td className="py-2 pr-4">Declining Slowly</td>
                            <td className="py-2">0% to 10% decline</td>
                          </tr>
                          <tr className="border-b border-secondary-100">
                            <td className="py-2 pr-4">Stable</td>
                            <td className="py-2">0% to 5% growth</td>
                          </tr>
                          <tr className="border-b border-secondary-100">
                            <td className="py-2 pr-4">Growing Slowly</td>
                            <td className="py-2">5% to 15% growth</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4">Growing Quickly</td>
                            <td className="py-2">More than 15% growth</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <h4 className="font-semibold text-amber-800 mb-1">Limitations</h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>BLS projections are 10-year averages; actual year-to-year changes vary</li>
                      <li>Projections assume no major economic disruptions</li>
                      <li>BLS has historically underestimated technology-driven changes</li>
                      <li>Projections are updated every 2 years; may not reflect very recent developments</li>
                    </ul>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Dimension 4: Human Advantage */}
              <CollapsibleSection title="4. Human Advantage (EPOCH Framework)">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-secondary-900 mb-1">What it measures</h4>
                    <p className="text-secondary-700">
                      How much this job relies on distinctly human capabilities that AI cannot replicate.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-secondary-900 mb-1">How we calculate it</h4>
                    <p className="text-secondary-700 mb-2">
                      We use the EPOCH framework, rating each occupation 1-5 on five human capabilities:
                    </p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-secondary-200">
                            <th className="text-left py-2 pr-4 font-semibold text-secondary-900">Dimension</th>
                            <th className="text-left py-2 font-semibold text-secondary-900">What it means</th>
                          </tr>
                        </thead>
                        <tbody className="text-secondary-700">
                          <tr className="border-b border-secondary-100">
                            <td className="py-2 pr-4 font-medium">E - Empathy</td>
                            <td className="py-2">Emotional intelligence, building trust, understanding unspoken needs</td>
                          </tr>
                          <tr className="border-b border-secondary-100">
                            <td className="py-2 pr-4 font-medium">P - Presence</td>
                            <td className="py-2">Physical presence required — hands-on work, face-to-face interaction</td>
                          </tr>
                          <tr className="border-b border-secondary-100">
                            <td className="py-2 pr-4 font-medium">O - Opinion</td>
                            <td className="py-2">Judgment calls, ethical decisions, exercising authority</td>
                          </tr>
                          <tr className="border-b border-secondary-100">
                            <td className="py-2 pr-4 font-medium">C - Creativity</td>
                            <td className="py-2">Novel problem-solving, artistic expression, innovation</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-medium">H - Hope</td>
                            <td className="py-2">Leadership, inspiring others, providing vision and motivation</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-secondary-700 mt-3">
                      Scores are summed (max 25) and categorized:
                    </p>
                    <ul className="list-disc list-inside text-secondary-700 space-y-1 ml-2 mt-2">
                      <li><strong>Strong</strong> (20+): AI has limited ability to replace this work</li>
                      <li><strong>Moderate</strong> (12-19): AI augments but doesn't replace</li>
                      <li><strong>Weak</strong> (&lt;12): Higher risk of AI disruption</li>
                    </ul>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <h4 className="font-semibold text-amber-800 mb-1">Limitations</h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>EPOCH scores involve judgment calls; reasonable people might disagree</li>
                      <li>AI capabilities in empathy and creativity are evolving rapidly</li>
                      <li>Scores reflect job descriptions, not how individual workers actually perform</li>
                    </ul>
                  </div>
                </div>
              </CollapsibleSection>
            </section>

            {/* Classifications */}
            <section id="classifications">
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">How We Classify Careers</h2>
              <p className="text-secondary-600 mb-6">
                We don't use a simple formula. Instead, we apply a decision tree that weighs different signals
                based on research about what actually drives job displacement.
              </p>

              <div className="space-y-4">
                {/* AI-Resilient */}
                <div className="border-l-4 border-green-500 pl-4 py-2">
                  <h3 className="font-bold text-secondary-900 flex items-center gap-2">
                    <span className="text-green-600">AI-Resilient</span>
                  </h3>
                  <p className="text-secondary-700 text-sm mt-1">
                    <strong>Meaning:</strong> This career has strong protection against AI disruption.
                  </p>
                  <p className="text-secondary-600 text-sm">
                    <strong>Typical profile:</strong> Low task exposure, moderate-to-strong human advantage,
                    stable or growing demand
                  </p>
                  <p className="text-secondary-500 text-sm">
                    <strong>Examples:</strong> Electricians, Plumbers, Nurses, HVAC Technicians
                  </p>
                </div>

                {/* AI-Augmented */}
                <div className="border-l-4 border-yellow-500 pl-4 py-2">
                  <h3 className="font-bold text-secondary-900 flex items-center gap-2">
                    <span className="text-yellow-600">AI-Augmented</span>
                  </h3>
                  <p className="text-secondary-700 text-sm mt-1">
                    <strong>Meaning:</strong> AI will significantly change how this work is done, but demand
                    for workers remains strong.
                  </p>
                  <p className="text-secondary-600 text-sm">
                    <strong>Typical profile:</strong> High task exposure, but strong growth or strong human advantage
                  </p>
                  <p className="text-secondary-500 text-sm">
                    <strong>Examples:</strong> Software Developers, Graphic Designers, Financial Analysts
                  </p>
                </div>

                {/* In Transition */}
                <div className="border-l-4 border-orange-500 pl-4 py-2">
                  <h3 className="font-bold text-secondary-900 flex items-center gap-2">
                    <span className="text-orange-600">In Transition</span>
                  </h3>
                  <p className="text-secondary-700 text-sm mt-1">
                    <strong>Meaning:</strong> This role is actively evolving — some tasks are being automated
                    while new responsibilities emerge.
                  </p>
                  <p className="text-secondary-600 text-sm">
                    <strong>Typical profile:</strong> High exposure + high automation risk + stable or slow growth
                  </p>
                  <p className="text-secondary-500 text-sm">
                    <strong>Examples:</strong> Customer Service Reps, Paralegals, Medical Coders
                  </p>
                </div>

                {/* High Disruption Risk */}
                <div className="border-l-4 border-red-500 pl-4 py-2">
                  <h3 className="font-bold text-secondary-900 flex items-center gap-2">
                    <span className="text-red-600">High Disruption Risk</span>
                  </h3>
                  <p className="text-secondary-700 text-sm mt-1">
                    <strong>Meaning:</strong> This occupation faces significant decline due to automation.
                  </p>
                  <p className="text-secondary-600 text-sm">
                    <strong>Typical profile:</strong> High automation risk + declining demand + weak human advantage
                  </p>
                  <p className="text-secondary-500 text-sm">
                    <strong>Examples:</strong> Data Entry Clerks, Telemarketers, Word Processors
                  </p>
                </div>
              </div>

              <div className="mt-6 bg-secondary-100 rounded-lg p-4">
                <h4 className="font-semibold text-secondary-900 mb-2">Key Decision Rules</h4>
                <ul className="text-sm text-secondary-700 space-y-2">
                  <li><strong>1. Job growth is our strongest signal.</strong> Rapidly declining occupations with
                    high automation risk are classified as High Disruption Risk.</li>
                  <li><strong>2. Strong human advantage provides protection.</strong> Even high-exposure jobs
                    can be AI-Resilient if they require irreplaceable human skills.</li>
                  <li><strong>3. We err toward caution.</strong> When signals conflict, we assign the more
                    conservative rating.</li>
                </ul>
              </div>
            </section>

            {/* Limitations */}
            <section id="limitations">
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">What We Don't Know</h2>
              <p className="text-secondary-600 mb-6">
                We believe in epistemic humility. Here's what our methodology cannot capture:
              </p>

              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">Inherent Uncertainty</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li><strong>AI capabilities are changing rapidly.</strong> A job rated "AI-Resilient" today
                      could face disruption from a breakthrough we can't predict.</li>
                    <li><strong>Predictions ≠ reality.</strong> All models are wrong; some are useful. Our
                      ratings are educated estimates, not guarantees.</li>
                  </ul>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-800 mb-2">Data Gaps</h4>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li><strong>Small occupations have noisy data.</strong> BLS projections for occupations
                      with fewer than 50,000 workers are less reliable.</li>
                    <li><strong>New occupations aren't captured.</strong> Jobs created in the last few years
                      lack historical data.</li>
                    <li><strong>Geographic variation.</strong> AI adoption differs by region; our national-level
                      scores may not match your local market.</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">What We Can't Measure</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li><strong>Your specific employer.</strong> A tech-forward company and a traditional
                      firm may automate very differently.</li>
                    <li><strong>Policy changes.</strong> Regulations could accelerate or slow AI adoption.</li>
                    <li><strong>Economic shocks.</strong> Recessions, pandemics, and other disruptions
                      aren't in our model.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data Sources */}
            <section id="sources">
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">Data Sources</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-secondary-200">
                      <th className="text-left py-3 pr-4 font-semibold text-secondary-900">Source</th>
                      <th className="text-left py-3 pr-4 font-semibold text-secondary-900">What we use it for</th>
                      <th className="text-left py-3 font-semibold text-secondary-900">Last updated</th>
                    </tr>
                  </thead>
                  <tbody className="text-secondary-700">
                    <tr className="border-b border-secondary-100">
                      <td className="py-3 pr-4">
                        <a href="https://www.bls.gov/emp/" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                          BLS Employment Projections
                        </a>
                      </td>
                      <td className="py-3 pr-4">Job growth outlook</td>
                      <td className="py-3">2024-2034 projections</td>
                    </tr>
                    <tr className="border-b border-secondary-100">
                      <td className="py-3 pr-4">
                        <a href="https://www.bls.gov/oes/" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                          BLS Occupational Employment Statistics
                        </a>
                      </td>
                      <td className="py-3 pr-4">Wage data</td>
                      <td className="py-3">May 2024</td>
                    </tr>
                    <tr className="border-b border-secondary-100">
                      <td className="py-3 pr-4">
                        <a href="https://www.onetonline.org/" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                          O*NET 30.1
                        </a>
                      </td>
                      <td className="py-3 pr-4">Task descriptions, work activities</td>
                      <td className="py-3">2024</td>
                    </tr>
                    <tr className="border-b border-secondary-100">
                      <td className="py-3 pr-4">
                        <a href="https://github.com/AIOE-Data/AIOE" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                          AIOE Dataset (Felten et al.)
                        </a>
                      </td>
                      <td className="py-3 pr-4">AI occupational exposure scores</td>
                      <td className="py-3">2021</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4">
                        <a href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5028371" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                          EPOCH Framework (Loaiza & Rigobon)
                        </a>
                      </td>
                      <td className="py-3 pr-4">Human advantage scoring</td>
                      <td className="py-3">2024</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Feedback CTA */}
            <section className="bg-primary-50 border border-primary-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-secondary-900 mb-2">Questions or Corrections?</h2>
              <p className="text-secondary-700 mb-4">
                If you have questions about our methodology or believe an occupation is misclassified,
                we want to hear from you.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/contribute"
                  className="btn-primary"
                >
                  Submit Feedback
                </Link>
                <Link
                  href="/contribute?type=correction"
                  className="btn-secondary"
                >
                  Report an Error
                </Link>
              </div>
            </section>

            {/* Footer */}
            <footer className="text-sm text-secondary-500 border-t border-secondary-200 pt-6">
              <p>Last updated: January 2026</p>
              <p>Methodology version: 1.0</p>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
