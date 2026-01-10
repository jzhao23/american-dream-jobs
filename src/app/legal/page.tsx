'use client';

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

export default function LegalPage() {
  const effectiveDate = 'January 9, 2026';
  const companyName = 'American Dream Jobs';
  const websiteUrl = 'americandreamjobs.com';
  const contactEmail = 'legal@americandreamjobs.com';

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <section className="bg-gradient-to-br from-sage to-sage-dark text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="font-display text-3xl md:text-4xl font-medium mb-4">
            Terms & Conditions and Privacy Policy
          </h1>
          <p className="text-lg text-white/90">
            Last updated: {effectiveDate}
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Navigation */}
        <div className="bg-warm-white rounded-2xl p-4 mb-8 lg:hidden border border-sage-muted">
          <h2 className="font-display font-semibold text-ds-slate mb-2">On This Page</h2>
          <div className="space-y-1">
            <TOCItem href="#terms">Terms & Conditions</TOCItem>
            <TOCItem href="#privacy">Privacy Policy</TOCItem>
            <TOCItem href="#data-collection">Data We Collect</TOCItem>
            <TOCItem href="#data-use">How We Use Your Data</TOCItem>
            <TOCItem href="#data-sharing">Data Sharing</TOCItem>
            <TOCItem href="#your-rights">Your Rights</TOCItem>
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
                <TOCItem href="#terms">Terms & Conditions</TOCItem>
                <TOCItem href="#privacy">Privacy Policy</TOCItem>
                <TOCItem href="#data-collection">Data We Collect</TOCItem>
                <TOCItem href="#data-use">How We Use Data</TOCItem>
                <TOCItem href="#data-sharing">Data Sharing</TOCItem>
                <TOCItem href="#your-rights">Your Rights</TOCItem>
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 space-y-12">
            {/* ==================== */}
            {/* TERMS AND CONDITIONS */}
            {/* ==================== */}
            <section id="terms">
              <h2 className="font-display text-2xl font-medium text-ds-slate mb-6 pb-2 border-b-2 border-sage">
                Terms & Conditions
              </h2>

              <div className="space-y-6 text-ds-slate-light text-sm leading-relaxed">
                <div>
                  <h3 className="font-semibold text-ds-slate mb-2">1. Acceptance of Terms</h3>
                  <p>
                    By accessing or using {companyName} ("{websiteUrl}"), you agree to be bound by these Terms & Conditions ("Terms").
                    If you do not agree to all of these Terms, do not use this website or any of its services.
                    We reserve the right to modify these Terms at any time. Your continued use of the website following
                    any changes constitutes acceptance of the modified Terms.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-ds-slate mb-2">2. Description of Services</h3>
                  <p className="mb-2">
                    {companyName} provides career exploration tools, job search functionality, career recommendations,
                    and related informational services ("Services"). These Services include but are not limited to:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Career information and AI resilience assessments</li>
                    <li>Job search aggregation from third-party job boards</li>
                    <li>Career Compass personalized career matching</li>
                    <li>Resume storage and analysis</li>
                    <li>Salary calculations and comparisons</li>
                    <li>Email notifications about the American Dream Jobs Network</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-ds-slate mb-2">3. User Accounts and Registration</h3>
                  <p className="mb-2">
                    To access certain features, you must provide a valid email address and agree to these Terms. By registering, you represent that:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>You are at least 18 years of age or the age of majority in your jurisdiction</li>
                    <li>The information you provide is accurate, current, and complete</li>
                    <li>You will maintain and promptly update your information</li>
                    <li>You are responsible for maintaining the confidentiality of your account</li>
                    <li>You accept responsibility for all activities that occur under your account</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-ds-slate mb-2">4. User Content and Uploads</h3>
                  <p className="mb-2">
                    By uploading content (including resumes, documents, and personal information) to our Services, you:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Grant us a non-exclusive, worldwide, royalty-free license to use, store, process, and analyze such content solely for providing and improving our Services</li>
                    <li>Represent that you own or have the necessary rights to such content</li>
                    <li>Acknowledge that we may use automated systems including AI to process your content</li>
                    <li>Understand that while we implement security measures, no system is completely secure</li>
                  </ul>
                  <p className="mt-2">
                    We do not claim ownership of your content. You retain all rights to your uploaded materials.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-ds-slate mb-2">5. Prohibited Conduct</h3>
                  <p className="mb-2">You agree not to:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Use the Services for any unlawful purpose or in violation of any applicable laws</li>
                    <li>Attempt to gain unauthorized access to any portion of the Services or any systems</li>
                    <li>Use automated means (bots, scrapers, crawlers) to access the Services without express permission</li>
                    <li>Interfere with or disrupt the Services or servers connected to the Services</li>
                    <li>Upload viruses, malware, or other malicious code</li>
                    <li>Impersonate any person or entity or misrepresent your affiliation</li>
                    <li>Harvest or collect email addresses or other contact information of users</li>
                    <li>Use the Services to send unsolicited communications (spam)</li>
                    <li>Circumvent, disable, or otherwise interfere with security-related features</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-ds-slate mb-2">6. Third-Party Services and Links</h3>
                  <p>
                    Our Services may contain links to third-party websites and integrate with third-party services,
                    including job boards (LinkedIn, Indeed, Glassdoor, etc.). We are not responsible for the content,
                    privacy policies, or practices of any third-party websites or services. When you click a job
                    listing link, you will be redirected to an external website governed by its own terms and privacy
                    policies. Your interactions with third-party services are solely between you and such third parties.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-ds-slate mb-2">7. Disclaimer of Warranties</h3>
                  <p className="mb-2 uppercase font-medium text-ds-slate">
                    THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
                  </p>
                  <p className="mb-2">To the fullest extent permitted by law, we disclaim all warranties, including but not limited to:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT</li>
                    <li>WARRANTIES THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE</li>
                    <li>WARRANTIES REGARDING THE ACCURACY, RELIABILITY, OR COMPLETENESS OF ANY CONTENT</li>
                    <li>WARRANTIES THAT ANY DEFECTS WILL BE CORRECTED</li>
                  </ul>
                  <p className="mt-2">
                    Career assessments, AI resilience classifications, salary information, and job recommendations
                    are provided for informational purposes only and should not be relied upon as the sole basis
                    for career decisions. We do not guarantee employment outcomes or the accuracy of job listings.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-ds-slate mb-2">8. Limitation of Liability</h3>
                  <p className="uppercase font-medium text-ds-slate mb-2">
                    TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>
                      {companyName.toUpperCase()}, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE
                      FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT
                      LIMITED TO DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES.
                    </li>
                    <li>
                      IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATED TO THE SERVICES
                      EXCEED ONE HUNDRED DOLLARS ($100.00) OR THE AMOUNT YOU HAVE PAID US IN THE PAST TWELVE MONTHS, WHICHEVER IS GREATER.
                    </li>
                    <li>
                      THESE LIMITATIONS APPLY REGARDLESS OF THE LEGAL THEORY, WHETHER BASED ON WARRANTY, CONTRACT, TORT,
                      STRICT LIABILITY, OR ANY OTHER THEORY, AND EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-ds-slate mb-2">9. Indemnification</h3>
                  <p>
                    You agree to defend, indemnify, and hold harmless {companyName} and its officers, directors, employees,
                    agents, licensors, and suppliers from and against any claims, actions, demands, damages, costs, liabilities,
                    losses, and expenses (including reasonable attorneys' fees) arising out of or related to: (a) your use of
                    the Services; (b) your violation of these Terms; (c) your violation of any rights of another party; or
                    (d) your content or any content you submit, post, or transmit through the Services.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-ds-slate mb-2">10. Intellectual Property</h3>
                  <p>
                    All content, features, and functionality of the Services, including but not limited to text, graphics,
                    logos, icons, images, audio clips, data compilations, software, and the compilation thereof, are the
                    exclusive property of {companyName} or its licensors and are protected by United States and international
                    copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, modify,
                    create derivative works of, publicly display, publicly perform, republish, download, store, or transmit
                    any material from our Services without prior written consent.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-ds-slate mb-2">11. Termination</h3>
                  <p>
                    We may terminate or suspend your access to the Services immediately, without prior notice or liability,
                    for any reason, including without limitation if you breach these Terms. Upon termination, your right
                    to use the Services will immediately cease. You may terminate your account at any time by contacting us
                    at {contactEmail}. All provisions of these Terms which by their nature should survive termination shall
                    survive, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-ds-slate mb-2">12. Governing Law and Dispute Resolution</h3>
                  <p className="mb-2">
                    These Terms shall be governed by and construed in accordance with the laws of the State of Delaware,
                    United States, without regard to its conflict of law provisions.
                  </p>
                  <p className="mb-2">
                    Any dispute arising from or relating to these Terms or the Services shall first be attempted to be
                    resolved through informal negotiation. If informal resolution is unsuccessful within 30 days, either
                    party may initiate binding arbitration administered by JAMS in accordance with its Streamlined Arbitration
                    Rules and Procedures. The arbitration shall be conducted in English and take place in Delaware or remotely.
                  </p>
                  <p>
                    <strong>CLASS ACTION WAIVER:</strong> YOU AGREE THAT ANY CLAIMS MUST BE BROUGHT IN YOUR INDIVIDUAL
                    CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-ds-slate mb-2">13. Severability</h3>
                  <p>
                    If any provision of these Terms is held to be invalid, illegal, or unenforceable, the remaining
                    provisions shall continue in full force and effect. The invalid or unenforceable provision shall
                    be modified to the minimum extent necessary to make it valid and enforceable while preserving the
                    parties' original intent.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-ds-slate mb-2">14. Entire Agreement</h3>
                  <p>
                    These Terms, together with the Privacy Policy and any other legal notices published by us on the
                    Services, constitute the entire agreement between you and {companyName} concerning your use of the
                    Services. These Terms supersede any prior agreements or understandings, whether written or oral.
                  </p>
                </div>
              </div>
            </section>

            {/* ============== */}
            {/* PRIVACY POLICY */}
            {/* ============== */}
            <section id="privacy">
              <h2 className="font-display text-2xl font-medium text-ds-slate mb-6 pb-2 border-b-2 border-sage">
                Privacy Policy
              </h2>

              <div className="space-y-6 text-ds-slate-light text-sm leading-relaxed">
                <div>
                  <h3 className="font-semibold text-ds-slate mb-2">Overview</h3>
                  <p>
                    {companyName} ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy
                    explains how we collect, use, disclose, and safeguard your information when you use our website
                    and services. Please read this policy carefully. If you do not agree with the terms of this
                    Privacy Policy, please do not access the Services.
                  </p>
                </div>

                <div id="data-collection">
                  <h3 className="font-semibold text-ds-slate mb-2">1. Information We Collect</h3>

                  <h4 className="font-medium text-ds-slate mt-4 mb-2">a. Information You Provide Directly</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Contact Information:</strong> Email address (required for job search and American Dream Jobs Network)</li>
                    <li><strong>Location Data:</strong> City, state, ZIP code, or metropolitan area you provide for job searches</li>
                    <li><strong>Resume and Career Information:</strong> Uploaded resumes, work history, skills, education, and career preferences</li>
                    <li><strong>Career Compass Responses:</strong> Questionnaire answers about training willingness, salary expectations, work style preferences, and career goals</li>
                    <li><strong>Communications:</strong> Information you provide when contacting us for support or feedback</li>
                  </ul>

                  <h4 className="font-medium text-ds-slate mt-4 mb-2">b. Information Collected Automatically</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Device Information:</strong> Browser type, operating system, device type</li>
                    <li><strong>Usage Data:</strong> Pages visited, features used, time spent on pages, click patterns</li>
                    <li><strong>Log Data:</strong> IP address, access times, referring URLs</li>
                    <li><strong>Cookies and Similar Technologies:</strong> See our Cookie section below</li>
                  </ul>

                  <h4 className="font-medium text-ds-slate mt-4 mb-2">c. Information from Third Parties</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Job Board Data:</strong> Job listings aggregated from LinkedIn, Indeed, Glassdoor, and other sources</li>
                    <li><strong>Analytics Providers:</strong> Aggregate usage statistics from analytics services</li>
                  </ul>
                </div>

                <div id="data-use">
                  <h3 className="font-semibold text-ds-slate mb-2">2. How We Use Your Information</h3>
                  <p className="mb-2">We use the information we collect to:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Provide Services:</strong> Search for jobs, generate career recommendations, display relevant content</li>
                    <li><strong>Personalization:</strong> Tailor job results and career suggestions based on your profile and preferences</li>
                    <li><strong>Communications:</strong> Send you information about the American Dream Jobs Network, service updates, and relevant opportunities (with your consent)</li>
                    <li><strong>Analytics and Improvement:</strong> Understand how users interact with our Services to improve functionality and user experience</li>
                    <li><strong>Security:</strong> Protect against fraud, unauthorized access, and other security threats</li>
                    <li><strong>Legal Compliance:</strong> Comply with applicable laws, regulations, and legal processes</li>
                    <li><strong>AI Processing:</strong> Use automated systems including AI to analyze resumes, generate career matches, and improve recommendations</li>
                  </ul>
                </div>

                <div id="data-sharing">
                  <h3 className="font-semibold text-ds-slate mb-2">3. How We Share Your Information</h3>

                  <h4 className="font-medium text-ds-slate mt-4 mb-2">a. We Do NOT Sell Your Personal Information</h4>
                  <p>
                    We do not sell, rent, or trade your personal information to third parties for their marketing purposes.
                  </p>

                  <h4 className="font-medium text-ds-slate mt-4 mb-2">b. Service Providers</h4>
                  <p>
                    We may share information with third-party vendors who perform services on our behalf, including:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Cloud hosting and database services (Supabase, Vercel)</li>
                    <li>Job search API providers (SerpApi, RapidAPI)</li>
                    <li>AI services for resume parsing and career matching (Anthropic, OpenAI)</li>
                    <li>Analytics services (Plausible, Google Analytics)</li>
                    <li>Email delivery services</li>
                  </ul>
                  <p className="mt-2">
                    These service providers are contractually obligated to use your information only to provide
                    services to us and are prohibited from using it for their own purposes.
                  </p>

                  <h4 className="font-medium text-ds-slate mt-4 mb-2">c. Legal Requirements</h4>
                  <p>
                    We may disclose your information if required by law, court order, or governmental request,
                    or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others.
                  </p>

                  <h4 className="font-medium text-ds-slate mt-4 mb-2">d. Business Transfers</h4>
                  <p>
                    In the event of a merger, acquisition, bankruptcy, or sale of assets, your information may be
                    transferred to the acquiring entity. We will notify you of any such change and any choices you may have.
                  </p>

                  <h4 className="font-medium text-ds-slate mt-4 mb-2">e. Aggregated or De-identified Data</h4>
                  <p>
                    We may share aggregated or de-identified information that cannot reasonably be used to identify you
                    for research, analytics, or other purposes.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-ds-slate mb-2">4. Data Retention</h3>
                  <p className="mb-2">
                    We retain your personal information for as long as necessary to provide the Services and fulfill
                    the purposes described in this Privacy Policy, unless a longer retention period is required or
                    permitted by law. Specifically:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Account Data:</strong> Retained until you request deletion or account termination</li>
                    <li><strong>Resume Data:</strong> Retained until you delete it or request account deletion</li>
                    <li><strong>Job Search Cache:</strong> Automatically deleted after 24 hours</li>
                    <li><strong>Usage Analytics:</strong> Retained in aggregate form indefinitely; individual data deleted after 2 years</li>
                    <li><strong>Legal Compliance:</strong> Some data may be retained longer if required by law</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-ds-slate mb-2">5. Cookies and Tracking Technologies</h3>
                  <p className="mb-2">
                    We use cookies and similar tracking technologies to:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Essential Cookies:</strong> Required for basic functionality (session management, security)</li>
                    <li><strong>Preference Cookies:</strong> Remember your settings and preferences (location, theme)</li>
                    <li><strong>Analytics Cookies:</strong> Understand how you use our Services (page views, feature usage)</li>
                  </ul>
                  <p className="mt-2">
                    You can control cookies through your browser settings. Disabling cookies may affect functionality.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-ds-slate mb-2">6. Security</h3>
                  <p className="mb-2">
                    We implement appropriate technical and organizational measures to protect your information, including:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Encryption of data in transit (HTTPS/TLS) and at rest</li>
                    <li>Secure cloud infrastructure with access controls</li>
                    <li>Regular security assessments and updates</li>
                    <li>Limited employee access to personal data on a need-to-know basis</li>
                  </ul>
                  <p className="mt-2">
                    However, no method of transmission over the Internet or electronic storage is 100% secure.
                    While we strive to protect your personal information, we cannot guarantee absolute security.
                  </p>
                </div>

                <div id="your-rights">
                  <h3 className="font-semibold text-ds-slate mb-2">7. Your Rights and Choices</h3>

                  <h4 className="font-medium text-ds-slate mt-4 mb-2">a. All Users</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                    <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                    <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                    <li><strong>Opt-out:</strong> Unsubscribe from marketing communications at any time</li>
                    <li><strong>Data Portability:</strong> Request your data in a portable format</li>
                  </ul>

                  <h4 className="font-medium text-ds-slate mt-4 mb-2">b. California Residents (CCPA/CPRA)</h4>
                  <p className="mb-2">If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA):</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Right to know what personal information is collected, used, shared, or sold</li>
                    <li>Right to delete personal information held by businesses</li>
                    <li>Right to opt-out of the sale or sharing of personal information (we do not sell your data)</li>
                    <li>Right to non-discrimination for exercising your privacy rights</li>
                    <li>Right to correct inaccurate personal information</li>
                    <li>Right to limit use and disclosure of sensitive personal information</li>
                  </ul>

                  <h4 className="font-medium text-ds-slate mt-4 mb-2">c. EU/UK Residents (GDPR)</h4>
                  <p className="mb-2">If you are in the European Economic Area or United Kingdom, you have rights under the General Data Protection Regulation (GDPR):</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Right of access to your personal data</li>
                    <li>Right to rectification of inaccurate data</li>
                    <li>Right to erasure ("right to be forgotten")</li>
                    <li>Right to restrict processing</li>
                    <li>Right to data portability</li>
                    <li>Right to object to processing</li>
                    <li>Rights related to automated decision-making and profiling</li>
                  </ul>
                  <p className="mt-2">
                    Our legal bases for processing include: consent (which you may withdraw at any time),
                    performance of a contract, legitimate interests, and legal obligations.
                  </p>

                  <h4 className="font-medium text-ds-slate mt-4 mb-2">d. How to Exercise Your Rights</h4>
                  <p>
                    To exercise any of these rights, please contact us at {contactEmail}. We will respond to
                    verifiable requests within 30 days (or 45 days if extended, with notice). We may request
                    additional information to verify your identity before processing your request.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-ds-slate mb-2">8. Children's Privacy</h3>
                  <p>
                    Our Services are not intended for children under 18 years of age. We do not knowingly collect
                    personal information from children under 18. If you are a parent or guardian and believe your
                    child has provided us with personal information, please contact us at {contactEmail}, and we
                    will promptly delete such information.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-ds-slate mb-2">9. International Data Transfers</h3>
                  <p>
                    Your information may be transferred to and processed in countries other than your country of
                    residence, including the United States. These countries may have different data protection laws.
                    When we transfer your information, we take appropriate safeguards, including standard contractual
                    clauses approved by relevant authorities, to ensure your information remains protected.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-ds-slate mb-2">10. Do Not Track</h3>
                  <p>
                    Some browsers have a "Do Not Track" feature that signals to websites that you do not want your
                    online activity tracked. We currently do not respond to "Do Not Track" signals because there is
                    no common industry standard for compliance. However, you can use browser settings and extensions
                    to limit tracking.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-ds-slate mb-2">11. Changes to This Privacy Policy</h3>
                  <p>
                    We may update this Privacy Policy from time to time. The updated version will be indicated by
                    an updated "Last updated" date. If we make material changes, we will notify you by email (if
                    you have provided one) or by posting a notice on our website prior to the change becoming effective.
                    Your continued use of the Services after the effective date constitutes acceptance of the updated policy.
                  </p>
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className="text-sm text-ds-slate-muted border-t border-sage-muted pt-6">
              <p>Effective Date: {effectiveDate}</p>
              <p>Version: 1.0</p>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
