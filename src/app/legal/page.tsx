import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Legal | American Dream Jobs",
  description: "Privacy Policy and Terms of Service for American Dream Jobs",
};

export default function LegalPage() {
  const effectiveDate = "February 2026";

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="text-sm text-ds-slate-light mb-8">
          <Link href="/" className="hover:text-sage">
            Home
          </Link>
          <span className="mx-2">→</span>
          <span className="text-ds-slate">Legal</span>
        </nav>

        <h1 className="font-display text-3xl md:text-4xl font-medium text-ds-slate mb-8">
          Legal
        </h1>

        {/* Quick Navigation */}
        <div className="bg-warm-white rounded-xl p-6 mb-12 border border-sage-muted">
          <h2 className="font-semibold text-ds-slate mb-4">On This Page</h2>
          <ul className="space-y-2">
            <li>
              <a href="#privacy-policy" className="text-sage hover:underline">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="#terms" className="text-sage hover:underline">
                Terms of Service
              </a>
            </li>
          </ul>
        </div>

        {/* Privacy Policy */}
        <section id="privacy-policy" className="mb-16 scroll-mt-24">
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-ds-slate mb-2">
            Privacy Policy
          </h2>
          <p className="text-sm text-ds-slate-light mb-8">
            Effective Date: {effectiveDate}
          </p>

          <div className="prose prose-slate max-w-none space-y-6">
            <p>
              American Dream Jobs (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates americandreamjobs.org (the &quot;Site&quot;). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our Site and use our services. Please read this policy carefully. By using our Site, you consent to the practices described herein.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              1. Information We Collect
            </h3>

            <h4 className="font-semibold text-ds-slate mt-6 mb-2">
              Information You Provide Directly
            </h4>

            <p>
              <strong>Resume and Career Information:</strong> When you use our Career Compass feature, you may upload your resume (in PDF, DOCX, DOC, MD, or TXT format, up to 5MB) or manually enter information about your work experience, skills, education, and career preferences. You may also answer questionnaire prompts about your training timeline, salary expectations, work style preferences, and career goals. This information is used to generate personalized career recommendations.
            </p>

            <p>
              <strong>Form Submissions:</strong> We collect information you voluntarily provide when you submit a career request (career title, reason, and optionally your email), submit a contribution or correction (your name, email, and content), subscribe to updates (your email address and optional user type), or provide feedback through our feedback form.
            </p>

            <h4 className="font-semibold text-ds-slate mt-6 mb-2">
              Information Collected Automatically
            </h4>

            <p>
              <strong>Analytics Data:</strong> We use Plausible Analytics, a privacy focused service that does not use cookies and does not collect personally identifiable information. Plausible collects aggregate data such as page views, referral sources, and approximate geographic location at the country level. If Google Analytics is enabled on our Site, it may collect additional usage data including pages visited, session duration, device type, and approximate location, subject to Google&apos;s privacy policy.
            </p>

            <p>
              <strong>Session Storage:</strong> We use your browser&apos;s session storage to temporarily store Career Compass results, preferences, and questionnaire answers. Session storage is local to your browser and is automatically cleared when you close your browser tab or window. This data is never transmitted to our servers for permanent storage.
            </p>

            <h4 className="font-semibold text-ds-slate mt-6 mb-2">
              Information We Do Not Collect
            </h4>

            <p>
              We do not require user accounts, passwords, or login credentials. We do not collect payment information, social security numbers, or government identification. We do not use tracking cookies for advertising purposes.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              2. How We Use Your Information
            </h3>

            <p>
              We use the information we collect to provide personalized career recommendations through our Career Compass feature, to process and analyze your resume using artificial intelligence services, to respond to your inquiries, feedback, career requests, and support needs, to improve our Site, services, and user experience, to generate aggregate, anonymized analytics about Site usage, and to maintain the security and integrity of our Site.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              3. Third Party Services and Data Sharing
            </h3>

            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded my-4">
              <p className="font-semibold text-amber-800 mb-2">Important Disclosure</p>
              <p className="text-amber-900">
                To provide our Career Compass feature, your resume content and career profile information is transmitted to external artificial intelligence services for processing. Please review this section carefully to understand how your data is shared.
              </p>
            </div>

            <p>
              <strong>Anthropic (Claude AI):</strong> When you use Career Compass with a resume, your resume text and career profile information is sent to Anthropic&apos;s Claude AI service for analysis, skill extraction, and career matching. Anthropic processes this data according to their API terms and privacy policy available at{" "}
              <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-sage hover:underline">
                anthropic.com/privacy
              </a>
              . We use API configurations designed to minimize data retention, and we do not request that Anthropic use your data for model training.
            </p>

            <p>
              <strong>OpenAI:</strong> Your career profile information may be sent to OpenAI&apos;s API to generate mathematical vector representations (embeddings) used for similarity matching with career profiles. OpenAI processes this data according to their privacy policy at{" "}
              <a href="https://openai.com/privacy" target="_blank" rel="noopener noreferrer" className="text-sage hover:underline">
                openai.com/privacy
              </a>
              . We use API configurations that opt out of data training.
            </p>

            <p>
              <strong>Supabase:</strong> Career embeddings and cached matching data may be stored temporarily in Supabase&apos;s database service to improve performance. Supabase processes data according to their privacy policy at{" "}
              <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-sage hover:underline">
                supabase.com/privacy
              </a>
              .
            </p>

            <p>
              <strong>Plausible Analytics:</strong> We use Plausible for privacy focused website analytics. Plausible does not use cookies, does not collect personal data, does not track users across sites, and is fully compliant with GDPR, CCPA, and PECR. Learn more at{" "}
              <a href="https://plausible.io/data-policy" target="_blank" rel="noopener noreferrer" className="text-sage hover:underline">
                plausible.io/data-policy
              </a>
              .
            </p>

            <p>
              <strong>Google Analytics (if enabled):</strong> We may use Google Analytics for additional usage insights. Google Analytics uses cookies and collects data according to Google&apos;s privacy policy. You can opt out of Google Analytics using browser extensions or privacy settings.
            </p>

            <p>
              <strong>CareerOneStop:</strong> When you click &quot;Find Jobs&quot; links on our Site, you are directed to CareerOneStop, a service operated by the U.S. Department of Labor. CareerOneStop has its own privacy policy and terms of service. We are not responsible for their data practices.
            </p>

            <p>
              <strong>We do not sell your personal information.</strong> We do not share your information with third parties for their own marketing purposes. We may disclose information if required by law, to protect our rights and safety, or to enforce our terms.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              4. Data Retention
            </h3>

            <p>
              <strong>Career Compass Data:</strong> Resume content, career profiles, and questionnaire responses are processed in real time to generate recommendations. This data is not permanently stored on our servers. Results are stored only in your browser&apos;s session storage and are automatically deleted when you close your browser.
            </p>

            <p>
              <strong>Form Submissions:</strong> Information submitted through our forms (career requests, contributions, feedback, newsletter signups) is retained in our server logs until we have addressed your request or you ask us to delete it. We may move this data to a database in the future for better organization.
            </p>

            <p>
              <strong>Third Party Retention:</strong> Third party AI services may temporarily retain data for processing according to their own policies. We use API configurations designed to minimize retention periods, but we cannot control third party data practices. Please review each service&apos;s privacy policy for specific retention details.
            </p>

            <p>
              <strong>Analytics Data:</strong> Plausible Analytics retains aggregate, non personal data indefinitely. If Google Analytics is enabled, data retention follows Google&apos;s policies.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              5. Data Security
            </h3>

            <p>
              We implement reasonable technical and organizational security measures to protect your information. All data transmitted between your browser and our servers uses HTTPS encryption. We use reputable third party service providers with their own security practices. However, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security of your data.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              6. Your Rights and Choices
            </h3>

            <p>
              Depending on your location, you may have the following rights regarding your personal information:
            </p>

            <p>
              <strong>Right to Know/Access:</strong> You may request information about what personal data we have collected about you.
            </p>

            <p>
              <strong>Right to Deletion:</strong> You may request that we delete personal information we have collected from you.
            </p>

            <p>
              <strong>Right to Opt Out:</strong> You may choose not to use features that require data processing, such as the Career Compass feature.
            </p>

            <p>
              <strong>Right to Non Discrimination:</strong> We will not discriminate against you for exercising your privacy rights.
            </p>

            <p>
              <strong>Do Not Sell:</strong> We do not sell personal information. No opt out is necessary because we do not engage in sales of personal data.
            </p>

            <p>
              To exercise these rights, please contact us through the feedback form on our Site. We will respond to verifiable requests within the timeframes required by applicable law.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              7. Children&apos;s Privacy
            </h3>

            <p>
              Our Site is intended for a general audience and is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately, and we will take steps to delete such information.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              8. International Users
            </h3>

            <p>
              Our Site is operated in the United States. If you are accessing our Site from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States and other countries where our service providers operate. These countries may have data protection laws that differ from those of your country. By using our Site, you consent to the transfer of your information to the United States and other jurisdictions as described in this policy.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              9. California Privacy Rights
            </h3>

            <p>
              If you are a California resident, you have specific rights under the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA). These include the right to know what personal information we collect, the right to delete your information, the right to opt out of sales (we do not sell data), and the right to non discrimination. To exercise these rights, contact us through our feedback form.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              10. Do Not Track Signals
            </h3>

            <p>
              Our Site does not respond to Do Not Track (DNT) signals. However, our primary analytics provider (Plausible) does not track users across sites regardless of DNT settings.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              11. Changes to This Policy
            </h3>

            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make material changes, we will update the &quot;Effective Date&quot; at the top of this policy and post the revised policy on this page. We encourage you to review this policy periodically. Your continued use of our Site after any changes constitutes acceptance of the updated policy.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              12. Contact Us
            </h3>

            <p>
              If you have questions about this Privacy Policy, wish to exercise your privacy rights, or have concerns about our data practices, please contact us through our{" "}
              <a href="https://forms.gle/AUDDvhvbBtiHVkZE8" target="_blank" rel="noopener noreferrer" className="text-sage hover:underline">
                feedback form
              </a>
              .
            </p>
          </div>
        </section>

        {/* Terms of Service */}
        <section id="terms" className="mb-16 scroll-mt-24">
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-ds-slate mb-2">
            Terms of Service
          </h2>
          <p className="text-sm text-ds-slate-light mb-8">
            Effective Date: {effectiveDate}
          </p>

          <div className="prose prose-slate max-w-none space-y-6">
            <p>
              Welcome to American Dream Jobs. These Terms of Service (&quot;Terms&quot;) govern your access to and use of americandreamjobs.org (the &quot;Site&quot;) and all services provided through the Site. By accessing or using our Site, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Site.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              1. Description of Service
            </h3>

            <p>
              American Dream Jobs is a free career exploration platform that provides information about careers, wages, training requirements, job outlook, and artificial intelligence resilience. Our data is derived from publicly available sources including the U.S. Bureau of Labor Statistics (BLS), O*NET, and other Department of Labor resources. We also offer a Career Compass feature that uses artificial intelligence to provide personalized career recommendations based on your resume and preferences.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              2. Not Professional Advice
            </h3>

            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded my-4">
              <p className="font-semibold text-amber-800 mb-2">Important Disclaimer</p>
              <p className="text-amber-900">
                The information provided on this Site is for general informational and educational purposes only. It is NOT professional career counseling, vocational guidance, financial advice, legal advice, educational planning, or any other form of professional advice. Career decisions are personal and consequential. You should consult with qualified professionals (career counselors, financial advisors, educators) before making significant career or educational decisions.
              </p>
            </div>

            <p>
              We do not guarantee job placement, employment, specific salary outcomes, career success, or any particular results from using our Site or following our recommendations. Individual outcomes depend on many factors beyond the information we provide, including your skills, effort, local job market conditions, economic factors, and employer decisions.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              3. Data Sources and Accuracy
            </h3>

            <p>
              Career information on this Site is derived from publicly available U.S. government data sources, including Bureau of Labor Statistics Occupational Employment and Wage Statistics (BLS OEWS), Bureau of Labor Statistics Employment Projections, O*NET (Occupational Information Network), and CareerOneStop (U.S. Department of Labor).
            </p>

            <p>
              While we strive to present accurate, current, and complete information, we make no warranties or representations regarding the accuracy, completeness, timeliness, or reliability of this data. Government data is updated periodically and may not reflect current conditions. Wage data represents median figures; actual salaries vary significantly based on location, experience, employer, industry, economic conditions, and individual circumstances. Job projections are estimates and not guarantees of future employment.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              4. Artificial Intelligence Features Disclaimer
            </h3>

            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded my-4">
              <p className="font-semibold text-amber-800 mb-2">AI Limitations</p>
              <p className="text-amber-900">
                Our Career Compass feature uses artificial intelligence (AI) services provided by third parties, including Anthropic (Claude) and OpenAI. AI systems have inherent limitations and may produce recommendations that are inaccurate, incomplete, biased, or unsuitable for your specific situation.
              </p>
            </div>

            <p>
              AI generated career recommendations should be treated as one source of information among many, not as definitive guidance. These recommendations may contain errors, inaccuracies, or outdated information. They may reflect biases present in training data or algorithms. They cannot account for all personal circumstances, preferences, or constraints. They should not replace professional career counseling. They are not guarantees of career fit, success, or satisfaction.
            </p>

            <p>
              We do not control the AI models or their outputs. By using the Career Compass feature, you acknowledge these limitations and agree that you are responsible for your own career decisions.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              5. AI Resilience Scores Disclaimer
            </h3>

            <p>
              Our AI Resilience scores (AI Resilient, AI Augmented, In Transition, High Disruption Risk) represent our own analysis and assessment of how careers may be affected by artificial intelligence and automation technologies. These scores are based on our interpretation of research and publicly available studies. They are opinions and assessments, not predictions or guarantees. They are subject to change as technology and research evolve. They are not endorsed by or affiliated with any government agency.
            </p>

            <p>
              The future impact of AI on any career is inherently uncertain and subject to rapid, unpredictable change. Our scores should not be the sole basis for career decisions. Past trends do not guarantee future outcomes.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              6. External Links and Third Party Content
            </h3>

            <p>
              Our Site contains links to external websites and services, including CareerOneStop (operated by the U.S. Department of Labor), employer websites, job boards, and educational resources. These links are provided for your convenience. We do not control, endorse, or assume responsibility for the content, privacy practices, accuracy, or availability of any external sites. Your use of external sites is governed by their respective terms and privacy policies. We are not responsible for any harm arising from your use of or reliance on external content.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              7. User Conduct
            </h3>

            <p>
              By using our Site, you agree not to use the Site for any unlawful purpose or in violation of any applicable laws, attempt to gain unauthorized access to our systems, servers, or data, interfere with, disrupt, or overburden the Site or its infrastructure, scrape, harvest, or systematically collect data from the Site without our written permission, use automated tools (bots, crawlers) except standard search engine indexing, submit false, misleading, or malicious content through our forms, impersonate any person or entity or misrepresent your affiliation, transmit viruses, malware, or other harmful code, or use the Site in any way that could damage our reputation or goodwill.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              8. Intellectual Property
            </h3>

            <p>
              The Site&apos;s design, layout, graphics, logos, code, and original content (including our AI Resilience methodology and scoring) are owned by American Dream Jobs and are protected by copyright, trademark, and other intellectual property laws. Career data sourced from U.S. government agencies (BLS, O*NET, CareerOneStop) is in the public domain.
            </p>

            <p>
              You are granted a limited, non exclusive, non transferable license to access and use the Site for personal, non commercial purposes. You may not reproduce, distribute, modify, create derivative works from, publicly display, or commercially exploit our proprietary content without our prior written consent.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              9. User Submissions
            </h3>

            <p>
              When you submit content to us (career requests, contributions, feedback, corrections), you grant us a non exclusive, royalty free, perpetual, worldwide license to use, modify, publish, and incorporate that content into our Site and services. You represent that you have the right to submit such content and that it does not violate any third party rights.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              10. Privacy
            </h3>

            <p>
              Your use of our Site is also governed by our Privacy Policy, which describes how we collect, use, and share your information. By using the Site, you consent to our data practices as described in the Privacy Policy.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              11. Disclaimer of Warranties
            </h3>

            <div className="bg-gray-100 p-4 rounded border border-gray-300 text-sm my-4">
              <p>
                THE SITE AND ALL CONTENT, FEATURES, AND SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON INFRINGEMENT.
              </p>
              <p className="mt-2">
                WE DO NOT WARRANT THAT THE SITE WILL BE UNINTERRUPTED, ERROR FREE, SECURE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. WE DO NOT WARRANT THAT THE INFORMATION ON THE SITE IS ACCURATE, COMPLETE, CURRENT, OR RELIABLE. WE DO NOT WARRANT THAT ANY CAREER RECOMMENDATIONS WILL BE SUITABLE FOR YOU OR LEAD TO ANY PARTICULAR OUTCOME.
              </p>
            </div>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              12. Limitation of Liability
            </h3>

            <div className="bg-gray-100 p-4 rounded border border-gray-300 text-sm my-4">
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, AMERICAN DREAM JOBS, ITS OPERATORS, FOUNDERS, EMPLOYEES, AFFILIATES, AND SERVICE PROVIDERS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, REVENUE, GOODWILL, DATA, OR OTHER INTANGIBLE LOSSES, REGARDLESS OF WHETHER SUCH DAMAGES WERE FORESEEABLE OR WHETHER WE WERE ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
              <p className="mt-2">
                THIS LIMITATION APPLIES TO DAMAGES ARISING FROM: (A) YOUR USE OF OR INABILITY TO USE THE SITE; (B) ANY CAREER, EDUCATIONAL, FINANCIAL, OR LIFE DECISIONS YOU MAKE BASED ON INFORMATION FROM THE SITE; (C) ANY AI GENERATED RECOMMENDATIONS OR CONTENT; (D) ANY CONDUCT OR CONTENT OF THIRD PARTIES; (E) UNAUTHORIZED ACCESS TO OR ALTERATION OF YOUR DATA; OR (F) ANY OTHER MATTER RELATING TO THE SITE.
              </p>
              <p className="mt-2">
                IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU EXCEED ONE HUNDRED DOLLARS ($100) OR THE AMOUNT YOU PAID US IN THE PAST TWELVE MONTHS, WHICHEVER IS GREATER.
              </p>
            </div>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              13. Indemnification
            </h3>

            <p>
              You agree to indemnify, defend, and hold harmless American Dream Jobs and its operators, founders, employees, affiliates, and service providers from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising out of or related to: (a) your use of the Site; (b) your violation of these Terms; (c) your violation of any third party rights; (d) any content you submit to us; or (e) your career or other decisions made based on information from the Site.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              14. Modifications to Service
            </h3>

            <p>
              We reserve the right to modify, suspend, or discontinue any part of the Site or services at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuation of the Site.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              15. Changes to Terms
            </h3>

            <p>
              We reserve the right to modify these Terms at any time. When we make material changes, we will update the &quot;Effective Date&quot; at the top of this page and post the revised Terms. Your continued use of the Site after any changes constitutes acceptance of the modified Terms. We encourage you to review these Terms periodically.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              16. Governing Law and Jurisdiction
            </h3>

            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law principles. Any legal action or proceeding arising out of or relating to these Terms or the Site shall be brought exclusively in the state or federal courts located in California, and you consent to the personal jurisdiction of such courts.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              17. Dispute Resolution
            </h3>

            <p>
              Before initiating any legal proceeding, you agree to first contact us and attempt to resolve the dispute informally. Most concerns can be resolved quickly through our feedback form. If we cannot resolve a dispute informally within thirty (30) days, either party may proceed with formal legal action as provided in these Terms.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              18. Severability
            </h3>

            <p>
              If any provision of these Terms is found to be unenforceable or invalid by a court of competent jurisdiction, that provision shall be limited or eliminated to the minimum extent necessary so that these Terms shall otherwise remain in full force and effect and enforceable.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              19. Entire Agreement
            </h3>

            <p>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and American Dream Jobs regarding your use of the Site and supersede all prior agreements, understandings, and communications, whether written or oral.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              20. Waiver
            </h3>

            <p>
              Our failure to enforce any provision of these Terms shall not constitute a waiver of that provision or any other provision. Any waiver must be in writing and signed by us to be effective.
            </p>

            <h3 className="font-display text-xl font-semibold text-ds-slate mt-8 mb-4">
              21. Contact
            </h3>

            <p>
              For questions about these Terms, please contact us through our{" "}
              <a href="https://forms.gle/AUDDvhvbBtiHVkZE8" target="_blank" rel="noopener noreferrer" className="text-sage hover:underline">
                feedback form
              </a>
              .
            </p>
          </div>
        </section>

        {/* Attribution */}
        <section className="border-t border-sage-muted pt-8">
          <p className="text-sm text-ds-slate-light">
            Career data provided by the U.S. Department of Labor, Bureau of Labor Statistics, and O*NET. This site is not affiliated with, endorsed by, or connected to the U.S. federal government.
          </p>
        </section>
      </div>
    </div>
  );
}
