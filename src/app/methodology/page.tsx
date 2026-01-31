'use client';

import { useState } from 'react';

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
    <div className="border border-sage-muted rounded-2xl mb-4 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left bg-sage-pale hover:bg-sage-muted transition-colors"
      >
        <span className="font-display font-semibold text-ds-slate">{title}</span>
        <svg
          className={`w-5 h-5 text-sage transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-4 py-4 border-t border-sage-muted bg-warm-white">
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
      className="block py-1 text-sm text-ds-slate-light hover:text-sage transition-colors"
    >
      {children}
    </a>
  );
}

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <section className="bg-gradient-to-br from-sage to-sage-dark text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="font-display text-3xl md:text-4xl font-medium mb-4">
            AI Resilience Classification Methodology
          </h1>
          <p className="text-lg text-white/90">
            How we assess careers for AI resilience using a transparent, additive scoring system
            based on three key dimensions.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Navigation */}
        <div className="bg-warm-white rounded-2xl p-4 mb-8 lg:hidden border border-sage-muted">
          <h2 className="font-display font-semibold text-ds-slate mb-2">On This Page</h2>
          <div className="space-y-1">
            <TOCItem href="#tiers">The Four Tiers</TOCItem>
            <TOCItem href="#scoring">Scoring System</TOCItem>
            <TOCItem href="#dimensions">Three Dimensions</TOCItem>
            <TOCItem href="#limitations">Limitations</TOCItem>
            <TOCItem href="#sources">Data Sources</TOCItem>
          </div>
        </div>

        <div className="lg:flex lg:gap-8">
          {/* Sticky TOC for desktop */}
          <aside className="hidden lg:block lg:w-48 flex-shrink-0">
            <div className="sticky top-8">
              <h2 className="font-bold text-sage mb-3 text-xs uppercase tracking-widest">
                On This Page
              </h2>
              <nav className="space-y-1">
                <TOCItem href="#tiers">The Four Tiers</TOCItem>
                <TOCItem href="#scoring">Scoring System</TOCItem>
                <TOCItem href="#dimensions">Three Dimensions</TOCItem>
                <TOCItem href="#limitations">Limitations</TOCItem>
                <TOCItem href="#sources">Data Sources</TOCItem>
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 space-y-12">
            {/* The Four Tiers */}
            <section id="tiers">
              <h2 className="font-display text-2xl font-medium text-ds-slate mb-4">The Four Tiers</h2>
              <p className="text-ds-slate-light mb-6">
                Every career receives one of four classifications based on their total score.
              </p>

              <div className="overflow-x-auto bg-warm-white rounded-2xl p-4 border border-sage-muted">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-sage-muted">
                      <th className="text-left py-3 pr-4 font-semibold text-ds-slate">Tier</th>
                      <th className="text-left py-3 font-semibold text-ds-slate">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-ds-slate-light">
                    <tr className="border-b border-sage-muted/50">
                      <td className="py-3 pr-4">
                        <span className="text-sage font-semibold">AI-Resilient</span>
                      </td>
                      <td className="py-3">Strong human advantage or growing demand protects this career from AI displacement</td>
                    </tr>
                    <tr className="border-b border-sage-muted/50">
                      <td className="py-3 pr-4">
                        <span className="text-gold font-semibold">AI-Augmented</span>
                      </td>
                      <td className="py-3">AI assists this work but human skills remain essential</td>
                    </tr>
                    <tr className="border-b border-sage-muted/50">
                      <td className="py-3 pr-4">
                        <span className="text-ds-orange font-semibold">In Transition</span>
                      </td>
                      <td className="py-3">This career is being transformed by AI; adaptation and skill evolution needed</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4">
                        <span className="text-red-600 font-semibold">High Disruption Risk</span>
                      </td>
                      <td className="py-3">High AI exposure combined with declining demand creates significant risk</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Scoring System */}
            <section id="scoring">
              <h2 className="font-display text-2xl font-medium text-ds-slate mb-4">How We Calculate It</h2>
              <p className="text-ds-slate-light mb-6">
                We use a simple additive scoring system. Each of three dimensions earns 0-2 points,
                for a maximum total of 6 points. The total determines the classification.
              </p>

              <div className="bg-sage-pale rounded-2xl p-4 mb-6">
                <h3 className="font-display font-semibold text-ds-slate mb-3">Scoring Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-sage-muted">
                        <th className="text-left py-2 pr-4 font-semibold text-ds-slate">Dimension</th>
                        <th className="text-left py-2 pr-4 font-semibold text-ds-slate">What We Measure</th>
                        <th className="text-left py-2 font-semibold text-ds-slate">Points</th>
                      </tr>
                    </thead>
                    <tbody className="text-ds-slate-light">
                      <tr className="border-b border-sage-muted/50">
                        <td className="py-2 pr-4 font-medium text-ds-slate">AI Exposure</td>
                        <td className="py-2 pr-4">% of tasks AI can accelerate by 50%</td>
                        <td className="py-2">0-2</td>
                      </tr>
                      <tr className="border-b border-sage-muted/50">
                        <td className="py-2 pr-4 font-medium text-ds-slate">Job Growth</td>
                        <td className="py-2 pr-4">BLS 2024-2034 employment projections</td>
                        <td className="py-2">0-2</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-medium text-ds-slate">Human Advantage</td>
                        <td className="py-2 pr-4">EPOCH framework score (1-25)</td>
                        <td className="py-2">0-2</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-warm-white border border-sage-muted rounded-2xl p-4">
                <h3 className="font-display font-semibold text-ds-slate mb-3">Total Score → Classification</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-sage-muted">
                        <th className="text-left py-2 pr-4 font-semibold text-ds-slate">Score</th>
                        <th className="text-left py-2 font-semibold text-ds-slate">Classification</th>
                      </tr>
                    </thead>
                    <tbody className="text-ds-slate-light">
                      <tr className="border-b border-sage-muted/50">
                        <td className="py-2 pr-4">5-6</td>
                        <td className="py-2"><span className="text-sage font-medium">AI-Resilient</span></td>
                      </tr>
                      <tr className="border-b border-sage-muted/50">
                        <td className="py-2 pr-4">3-4</td>
                        <td className="py-2"><span className="text-gold font-medium">AI-Augmented</span></td>
                      </tr>
                      <tr className="border-b border-sage-muted/50">
                        <td className="py-2 pr-4">2</td>
                        <td className="py-2"><span className="text-ds-orange font-medium">In Transition</span></td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4">0-1</td>
                        <td className="py-2"><span className="text-red-600 font-medium">High Disruption Risk</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Three Dimensions */}
            <section id="dimensions">
              <h2 className="font-display text-2xl font-medium text-ds-slate mb-4">The Three Dimensions Explained</h2>
              <p className="text-ds-slate-light mb-6">
                Each dimension is scored independently based on objective data sources.
              </p>

              {/* Dimension 1: AI Exposure */}
              <CollapsibleSection title="1. AI Exposure" defaultOpen={true}>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-ds-slate mb-1">What it measures</h4>
                    <p className="text-ds-slate-light">
                      The percentage of an occupation's tasks where AI tools (specifically Large Language Models
                      like ChatGPT) could reduce completion time by at least 50% while maintaining quality.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-ds-slate mb-1">How we calculate it</h4>
                    <p className="text-ds-slate-light mb-2">
                      We use the "GPTs are GPTs" research (Eloundou et al., 2023) from OpenAI and
                      University of Pennsylvania, which analyzed task-level LLM exposure.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-sage-muted">
                            <th className="text-left py-2 pr-4 font-semibold text-ds-slate">AI Exposure</th>
                            <th className="text-left py-2 pr-4 font-semibold text-ds-slate">Meaning</th>
                            <th className="text-left py-2 font-semibold text-ds-slate">Points</th>
                          </tr>
                        </thead>
                        <tbody className="text-ds-slate-light">
                          <tr className="border-b border-sage-muted/50">
                            <td className="py-2 pr-4"><span className="text-sage font-medium">Low</span></td>
                            <td className="py-2 pr-4">&lt;25% of tasks exposed</td>
                            <td className="py-2">+2</td>
                          </tr>
                          <tr className="border-b border-sage-muted/50">
                            <td className="py-2 pr-4"><span className="text-gold font-medium">Medium</span></td>
                            <td className="py-2 pr-4">25-50% of tasks exposed</td>
                            <td className="py-2">+1</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4"><span className="text-red-600 font-medium">High</span></td>
                            <td className="py-2 pr-4">&gt;50% of tasks exposed</td>
                            <td className="py-2">+0</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="bg-sage-pale border border-sage-muted rounded-xl p-3">
                    <h4 className="font-semibold text-sage mb-1">Why lower exposure = more points</h4>
                    <p className="text-sm text-ds-slate-light">
                      Careers with fewer AI-exposed tasks are more protected from disruption. A low AI exposure
                      score means most of what you do in this job cannot be easily done or accelerated by AI.
                    </p>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Dimension 2: Job Growth */}
              <CollapsibleSection title="2. Job Growth">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-ds-slate mb-1">What it measures</h4>
                    <p className="text-ds-slate-light">
                      Projected employment change from 2024 to 2034.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-ds-slate mb-1">How we calculate it</h4>
                    <p className="text-ds-slate-light mb-2">
                      We use official Bureau of Labor Statistics (BLS) employment projections.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-sage-muted">
                            <th className="text-left py-2 pr-4 font-semibold text-ds-slate">Job Growth</th>
                            <th className="text-left py-2 pr-4 font-semibold text-ds-slate">Meaning</th>
                            <th className="text-left py-2 font-semibold text-ds-slate">Points</th>
                          </tr>
                        </thead>
                        <tbody className="text-ds-slate-light">
                          <tr className="border-b border-sage-muted/50">
                            <td className="py-2 pr-4"><span className="text-sage font-medium">Growing</span></td>
                            <td className="py-2 pr-4">&gt;5% growth projected</td>
                            <td className="py-2">+2</td>
                          </tr>
                          <tr className="border-b border-sage-muted/50">
                            <td className="py-2 pr-4"><span className="text-gold font-medium">Stable</span></td>
                            <td className="py-2 pr-4">0% to 5% growth projected</td>
                            <td className="py-2">+1</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4"><span className="text-red-600 font-medium">Declining</span></td>
                            <td className="py-2 pr-4">Negative growth projected</td>
                            <td className="py-2">+0</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="bg-sage-pale border border-sage-muted rounded-xl p-3">
                    <h4 className="font-semibold text-sage mb-1">Why this matters</h4>
                    <p className="text-sm text-ds-slate-light">
                      Growing demand can absorb technological disruption. Even if some tasks become automated,
                      expanding industries create new roles and responsibilities. Declining demand compounds
                      AI risk—fewer jobs plus AI automation is a difficult combination.
                    </p>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Dimension 3: Human Advantage (EPOCH) */}
              <CollapsibleSection title="3. Human Advantage (EPOCH Framework)">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-ds-slate mb-1">What it measures</h4>
                    <p className="text-ds-slate-light">
                      How much the job relies on five dimensions of uniquely human capability
                      that AI struggles to replicate.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-ds-slate mb-1">The EPOCH Framework</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-sage-muted">
                            <th className="text-left py-2 pr-4 font-semibold text-ds-slate">Letter</th>
                            <th className="text-left py-2 pr-4 font-semibold text-ds-slate">Dimension</th>
                            <th className="text-left py-2 font-semibold text-ds-slate">Examples</th>
                          </tr>
                        </thead>
                        <tbody className="text-ds-slate-light">
                          <tr className="border-b border-sage-muted/50">
                            <td className="py-2 pr-4 font-medium text-ds-slate">E</td>
                            <td className="py-2 pr-4">Empathy</td>
                            <td className="py-2">Emotional intelligence, patient care, reading social cues</td>
                          </tr>
                          <tr className="border-b border-sage-muted/50">
                            <td className="py-2 pr-4 font-medium text-ds-slate">P</td>
                            <td className="py-2 pr-4">Presence</td>
                            <td className="py-2">Physical presence, hands-on work, being there matters</td>
                          </tr>
                          <tr className="border-b border-sage-muted/50">
                            <td className="py-2 pr-4 font-medium text-ds-slate">O</td>
                            <td className="py-2 pr-4">Opinion</td>
                            <td className="py-2">Professional judgment, decision-making under uncertainty</td>
                          </tr>
                          <tr className="border-b border-sage-muted/50">
                            <td className="py-2 pr-4 font-medium text-ds-slate">C</td>
                            <td className="py-2 pr-4">Creativity</td>
                            <td className="py-2">Innovation, artistic expression, novel problem-solving</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-medium text-ds-slate">H</td>
                            <td className="py-2 pr-4">Hope</td>
                            <td className="py-2">Mentorship, motivation, inspiring others</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-ds-slate-light mt-3">
                      Each dimension is scored 1-5 based on how central it is to the occupation,
                      for a maximum of 25 points.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-ds-slate mb-1">Scoring</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-sage-muted">
                            <th className="text-left py-2 pr-4 font-semibold text-ds-slate">Human Advantage</th>
                            <th className="text-left py-2 pr-4 font-semibold text-ds-slate">EPOCH Sum</th>
                            <th className="text-left py-2 font-semibold text-ds-slate">Points</th>
                          </tr>
                        </thead>
                        <tbody className="text-ds-slate-light">
                          <tr className="border-b border-sage-muted/50">
                            <td className="py-2 pr-4"><span className="text-sage font-medium">Strong</span></td>
                            <td className="py-2 pr-4">20 or higher</td>
                            <td className="py-2">+2</td>
                          </tr>
                          <tr className="border-b border-sage-muted/50">
                            <td className="py-2 pr-4"><span className="text-gold font-medium">Moderate</span></td>
                            <td className="py-2 pr-4">12-19</td>
                            <td className="py-2">+1</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4"><span className="text-red-600 font-medium">Weak</span></td>
                            <td className="py-2 pr-4">Below 12</td>
                            <td className="py-2">+0</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="bg-sage-pale border border-sage-muted rounded-xl p-3">
                    <h4 className="font-semibold text-sage mb-1">Why this matters</h4>
                    <p className="text-sm text-ds-slate-light">
                      Jobs requiring deep empathy, physical presence, high-stakes judgment, genuine creativity,
                      or the ability to inspire others have structural protection from AI. These are capabilities
                      that AI cannot fully replicate—and in many cases, people specifically want a human doing
                      these things even if AI could approximate them.
                    </p>
                  </div>
                </div>
              </CollapsibleSection>
            </section>

            {/* Example Calculation */}
            <section className="bg-warm-white border border-sage-muted rounded-2xl p-6">
              <h2 className="font-display text-xl font-medium text-ds-slate mb-4">Example: Electrician</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-sage-muted">
                      <th className="text-left py-2 pr-4 font-semibold text-ds-slate">Dimension</th>
                      <th className="text-left py-2 pr-4 font-semibold text-ds-slate">Assessment</th>
                      <th className="text-left py-2 font-semibold text-ds-slate">Points</th>
                    </tr>
                  </thead>
                  <tbody className="text-ds-slate-light">
                    <tr className="border-b border-sage-muted/50">
                      <td className="py-2 pr-4 font-medium text-ds-slate">AI Exposure</td>
                      <td className="py-2 pr-4">Low — Only ~4% of tasks can be accelerated by AI. The work is physical.</td>
                      <td className="py-2">+2</td>
                    </tr>
                    <tr className="border-b border-sage-muted/50">
                      <td className="py-2 pr-4 font-medium text-ds-slate">Job Growth</td>
                      <td className="py-2 pr-4">Growing — 6% projected growth. Infrastructure investment drives demand.</td>
                      <td className="py-2">+2</td>
                    </tr>
                    <tr className="border-b border-sage-muted/50">
                      <td className="py-2 pr-4 font-medium text-ds-slate">Human Advantage</td>
                      <td className="py-2 pr-4">Strong — High presence, high judgment, skilled hands-on work.</td>
                      <td className="py-2">+2</td>
                    </tr>
                    <tr className="bg-sage-muted">
                      <td className="py-2 pr-4 font-bold text-ds-slate">Total</td>
                      <td className="py-2 pr-4"></td>
                      <td className="py-2 font-bold text-sage">6 → AI-Resilient</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Limitations */}
            <section id="limitations">
              <h2 className="font-display text-2xl font-medium text-ds-slate mb-4">Limitations & Disclaimers</h2>
              <div className="space-y-4">
                <div className="bg-terracotta-bg border border-terracotta/30 rounded-2xl p-4">
                  <ul className="text-sm text-ds-slate-light space-y-2">
                    <li><strong className="text-terracotta">1. AI capabilities are evolving rapidly.</strong> The AI exposure data is based
                      on 2023 research. New AI capabilities could change exposure levels for some occupations.</li>
                    <li><strong className="text-terracotta">2. Individual jobs vary significantly.</strong> This classification represents
                      aggregate trends for occupation categories. Your specific job depends on employer,
                      location, specialization, and how you adapt.</li>
                    <li><strong className="text-terracotta">3. Projections are estimates, not guarantees.</strong> BLS projections may not
                      account for major economic shifts, policy changes, or breakthroughs.</li>
                    <li><strong className="text-terracotta">4. EPOCH scores involve judgment.</strong> While grounded in O*NET data,
                      EPOCH scoring requires qualitative assessment.</li>
                    <li><strong className="text-terracotta">5. This is not career advice.</strong> This tool informs your thinking but
                      should not make decisions for you.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data Sources */}
            <section id="sources">
              <h2 className="font-display text-2xl font-medium text-ds-slate mb-4">Data Sources</h2>
              <div className="overflow-x-auto bg-warm-white rounded-2xl p-4 border border-sage-muted">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-sage-muted">
                      <th className="text-left py-3 pr-4 font-semibold text-ds-slate">Source</th>
                      <th className="text-left py-3 pr-4 font-semibold text-ds-slate">What we use it for</th>
                      <th className="text-left py-3 font-semibold text-ds-slate">Year</th>
                    </tr>
                  </thead>
                  <tbody className="text-ds-slate-light">
                    <tr className="border-b border-sage-muted/50">
                      <td className="py-3 pr-4">
                        <a href="https://arxiv.org/abs/2303.10130" target="_blank" rel="noopener noreferrer" className="text-sage hover:text-sage-light hover:underline">
                          GPTs are GPTs (OpenAI/UPenn)
                        </a>
                      </td>
                      <td className="py-3 pr-4">AI Exposure (primary)</td>
                      <td className="py-3">2023</td>
                    </tr>
                    <tr className="border-b border-sage-muted/50">
                      <td className="py-3 pr-4">
                        <a href="https://github.com/AIOE-Data/AIOE" target="_blank" rel="noopener noreferrer" className="text-sage hover:text-sage-light hover:underline">
                          AIOE Dataset (Felten et al.)
                        </a>
                      </td>
                      <td className="py-3 pr-4">AI Exposure (fallback)</td>
                      <td className="py-3">2021</td>
                    </tr>
                    <tr className="border-b border-sage-muted/50">
                      <td className="py-3 pr-4">
                        <a href="https://www.bls.gov/emp/" target="_blank" rel="noopener noreferrer" className="text-sage hover:text-sage-light hover:underline">
                          BLS Employment Projections
                        </a>
                      </td>
                      <td className="py-3 pr-4">Job growth outlook</td>
                      <td className="py-3">2024-2034</td>
                    </tr>
                    <tr className="border-b border-sage-muted/50">
                      <td className="py-3 pr-4">
                        <a href="https://www.onetonline.org/" target="_blank" rel="noopener noreferrer" className="text-sage hover:text-sage-light hover:underline">
                          O*NET 30.1
                        </a>
                      </td>
                      <td className="py-3 pr-4">Task descriptions, work activities</td>
                      <td className="py-3">2024</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 text-ds-slate">EPOCH Framework</td>
                      <td className="py-3 pr-4">Human advantage scoring</td>
                      <td className="py-3">2024</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Feedback CTA */}
            <section className="bg-sage-pale border border-sage-muted rounded-2xl p-6">
              <h2 className="font-display text-xl font-medium text-ds-slate mb-2">Questions or Feedback?</h2>
              <p className="text-ds-slate-light mb-4">
                We're committed to making this methodology as accurate and useful as possible.
                If you have expertise in a career we've classified and think we got it wrong,
                please let us know.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://forms.gle/AUDDvhvbBtiHVkZE8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-sage"
                >
                  Submit Feedback
                </a>
              </div>
            </section>

            {/* Footer */}
            <footer className="text-sm text-ds-slate-muted border-t border-sage-muted pt-6">
              <p>Last updated: January 2026</p>
              <p>Methodology version: 2.0 (Additive Scoring)</p>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
