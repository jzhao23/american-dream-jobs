import Link from "next/link";
import type { Metadata } from "next";
import { CareerExplorer } from "@/components/CareerExplorer";
import { formatPay } from "@/types/career";
import careersIndex from "../../../../data/output/careers-index.json";
import type { CareerIndex } from "@/types/career";

export const metadata: Metadata = {
  title: "Tech Careers (No Degree Required) | American Dream Jobs",
  description:
    "Start your tech career without a 4-year degree. IT support, systems analysis, networking, and engineering technician roles with bootcamp and certification paths. $55k-$130k potential.",
};

// Filter tech and engineering technician careers that don't require bachelor's+
function getTechNoDegreeeCareers(): CareerIndex[] {
  const careers = careersIndex as CareerIndex[];
  const nonDegreeEducation = [
    "High school diploma or equivalent",
    "Some college, no degree",
    "Post-secondary certificate",
    "Associate's degree",
    "Less than high school",
  ];

  return careers.filter(
    (c) =>
      (c.category === "technology" || c.category === "engineering") &&
      c.typical_education &&
      nonDegreeEducation.includes(c.typical_education)
  );
}

function computeStats(careers: CareerIndex[]) {
  const pays = careers.map((c) => c.median_pay).filter((p) => p > 0);
  const medianPay = pays.sort((a, b) => a - b)[Math.floor(pays.length / 2)] || 0;

  const aiResilient = careers.filter(
    (c) => c.ai_resilience === "AI-Resilient" || c.ai_resilience === "AI-Augmented"
  ).length;
  const aiRiskPercent = Math.round((aiResilient / careers.length) * 100);

  return {
    totalCareers: careers.length,
    medianPay,
    aiRiskPercent,
    aiRiskLevel: aiRiskPercent >= 70 ? "Low" : aiRiskPercent >= 40 ? "Medium" : "High",
  };
}

const pathContent = {
  icon: "💻",
  title: "Tech (No Degree Required)",
  subtitle: "Start your tech career without a 4-year degree",
  salaryRange: "$55k–$130k",
  trainingTime: "6–24 months",
  aiOutlook: "AI-Augmented",
  description: `The tech industry has evolved beyond its "bachelor's degree required" past. Today, many of the fastest-growing tech careers can be entered through bootcamps, certifications, and self-directed learning—often in under two years.

These paths include systems analysis, IT support, networking, and engineering technician roles where demonstrated skills matter more than credentials. Companies like Google, Apple, and IBM have dropped degree requirements for many positions, recognizing that coding bootcamps and certification programs produce job-ready candidates.

The key is choosing the right entry point. While AI engineering roles may require advanced degrees, systems administration, network support, and technical operations roles value certifications like CompTIA A+, AWS, and Cisco credentials. Many employers offer on-the-job training, and the field rewards continuous learning over initial credentials.`,
  typicalTasks: [
    "Install, configure, and maintain computer systems and networks",
    "Troubleshoot hardware and software issues",
    "Analyze business needs and design technical solutions",
    "Manage cloud infrastructure and services",
    "Implement security measures and monitor systems",
    "Document technical procedures and train users",
  ],
  educationPaths: {
    typical: "Certificate, Bootcamp, or Associate Degree",
    timeRange: "6 months to 2 years",
    commonCredentials: [
      "CompTIA A+, Network+, Security+",
      "AWS Certified Solutions Architect",
      "Cisco CCNA",
      "Google IT Support Certificate",
      "Microsoft Azure Certifications",
    ],
  },
  whoItsFor: [
    "Enjoy problem-solving and logical thinking",
    "Are comfortable learning new technologies",
    "Want high earning potential without a 4-year degree",
    "Like working with computers and systems",
    "Value remote work opportunities",
    "Are self-motivated learners",
  ],
  whoItsNotFor: [
    "Prefer minimal screen time",
    "Dislike troubleshooting and debugging",
  ],
  coreSkills: [
    "Problem Solving",
    "Systems Thinking",
    "Networking Basics",
    "Operating Systems",
    "Cloud Computing",
    "Security Fundamentals",
    "Communication",
    "Continuous Learning",
  ],
  popularRoles: [
    "Computer Systems Analyst",
    "Robotics Technician",
    "Civil Engineering Technologist",
    "Mechatronics Technician",
    "Industrial Engineering Technician",
    "Telecommunications Specialist",
  ],
};

export default function TechNoDegreePage() {
  const careers = getTechNoDegreeeCareers();
  const stats = computeStats(careers);

  return (
    <div className="min-h-screen bg-cream">
      {/* Header Section */}
      <section className="bg-gradient-to-br from-sage to-sage-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Breadcrumb */}
          <nav className="text-sm text-white/70 mb-6">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">→</span>
            <span className="text-white">{pathContent.title}</span>
          </nav>

          <div className="flex items-start gap-4">
            <div className="text-5xl">{pathContent.icon}</div>
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">
                {pathContent.title}
              </h1>
              <p className="text-xl text-white/90 mb-4">{pathContent.subtitle}</p>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="bg-white/20 px-3 py-1.5 rounded-full">
                  {stats.totalCareers} careers
                </span>
                <span className="bg-white/20 px-3 py-1.5 rounded-full">
                  {formatPay(stats.medianPay)} median pay
                </span>
                <span className="bg-white/20 px-3 py-1.5 rounded-full">
                  🟡 {pathContent.aiOutlook}
                </span>
                <span className="bg-white/20 px-3 py-1.5 rounded-full">
                  ⏱️ {pathContent.trainingTime}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Overview Cards */}
      <section className="bg-warm-white border-b border-sage-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* What You'll Do */}
            <div className="bg-cream rounded-2xl p-6">
              <h3 className="text-lg font-display font-semibold text-ds-slate mb-4 flex items-center gap-2">
                <span>📋</span> What You'll Do
              </h3>
              <ul className="space-y-2">
                {pathContent.typicalTasks.map((task, i) => (
                  <li key={i} className="text-sm text-ds-slate-light flex items-start gap-2">
                    <span className="text-sage mt-0.5">•</span>
                    {task}
                  </li>
                ))}
              </ul>
            </div>

            {/* Education & Training */}
            <div className="bg-cream rounded-2xl p-6">
              <h3 className="text-lg font-display font-semibold text-ds-slate mb-4 flex items-center gap-2">
                <span>🎓</span> Education & Training
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-ds-slate">Typical Path</div>
                  <div className="text-sm text-ds-slate-light">
                    {pathContent.educationPaths.typical}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-ds-slate">Time Investment</div>
                  <div className="text-sm text-ds-slate-light">
                    {pathContent.educationPaths.timeRange}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-ds-slate">Common Credentials</div>
                  <ul className="text-sm text-ds-slate-light">
                    {pathContent.educationPaths.commonCredentials.slice(0, 4).map((cred, i) => (
                      <li key={i}>• {cred}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Who This Is For */}
            <div className="bg-cream rounded-2xl p-6">
              <h3 className="text-lg font-display font-semibold text-ds-slate mb-4 flex items-center gap-2">
                <span>👤</span> Who This Is For
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-sage mb-2">Good fit if you:</div>
                  <ul className="space-y-1">
                    {pathContent.whoItsFor.map((trait, i) => (
                      <li key={i} className="text-sm text-ds-slate-light flex items-start gap-2">
                        <span className="text-sage mt-0.5">✓</span>
                        {trait}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-sm font-medium text-terracotta mb-2">Not ideal if you:</div>
                  <ul className="space-y-1">
                    {pathContent.whoItsNotFor.map((trait, i) => (
                      <li key={i} className="text-sm text-ds-slate-light flex items-start gap-2">
                        <span className="text-terracotta mt-0.5">✗</span>
                        {trait}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-warm-white border-b border-sage-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-3xl">
            <h2 className="font-display text-xl font-semibold text-ds-slate mb-4">
              About {pathContent.title} Careers
            </h2>
            <div className="prose text-ds-slate-light">
              {pathContent.description.split("\n\n").map((paragraph, i) => (
                <p key={i} className="mb-4 leading-relaxed">
                  {paragraph.trim()}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core Skills */}
      <section className="bg-cream border-b border-sage-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="font-display text-xl font-semibold text-ds-slate mb-4">
            Core Skills Needed
          </h2>
          <div className="flex flex-wrap gap-2">
            {pathContent.coreSkills.map((skill, i) => (
              <span
                key={i}
                className="bg-warm-white px-3 py-1.5 rounded-full text-sm text-ds-slate-light border border-sage-muted"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Career Explorer Section */}
      <section className="bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <p className="section-eyebrow">Explore Careers</p>
            <h2 className="section-title">{pathContent.title} Careers</h2>
            <p className="section-subtitle">
              Browse all {stats.totalCareers} careers in this path
            </p>
          </div>
          <CareerExplorer careers={careers} hideCategoryFilter />
        </div>
      </section>

      {/* Back Navigation */}
      <section className="bg-warm-white border-t border-sage-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/" className="text-sage hover:text-sage-light font-medium transition-colors">
              ← Back to Home
            </Link>
            <span className="text-ds-slate-muted hidden sm:inline">|</span>
            <Link
              href="/#careers"
              className="text-sage hover:text-sage-light font-medium transition-colors"
            >
              Browse All Careers
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
