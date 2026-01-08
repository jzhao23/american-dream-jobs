import Link from "next/link";
import type { Metadata } from "next";
import { CareerExplorer } from "@/components/CareerExplorer";
import { formatPay } from "@/types/career";
import careersIndex from "../../../../data/output/careers-index.json";
import type { CareerIndex } from "@/types/career";

export const metadata: Metadata = {
  title: "Skilled Trades Careers | American Dream Jobs",
  description:
    "Explore skilled trades careers in construction, electrical, plumbing, HVAC, and repair. Earn while you learn through apprenticeships. $50k-$100k+ potential.",
};

// Filter construction and installation-repair careers
function getSkilledTradesCareers(): CareerIndex[] {
  const careers = careersIndex as CareerIndex[];
  return careers.filter(
    (c) => c.category === "construction" || c.category === "installation-repair"
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
  icon: "🏗️",
  title: "Skilled Trades",
  subtitle: "Build America's infrastructure while building your career",
  salaryRange: "$50k–$100k+",
  trainingTime: "6 months – 4 years",
  aiOutlook: "AI-Resilient",
  description: `The skilled trades are experiencing a historic shortage of workers as baby boomers retire and too few young people enter these careers. This shortage is your opportunity: high demand, rising wages, and job security that comes from skills that simply cannot be automated or outsourced.

Unlike traditional college paths, most trades let you earn while you learn through apprenticeships. You'll get paid from day one while developing expertise that takes years to master. Many journeyman electricians, plumbers, and HVAC technicians out-earn college graduates—without the student debt.

These are careers where your work matters visibly. You'll wire homes, install heating systems, build structures, and repair the equipment that keeps society running. The physical, variable nature of the work makes it highly resistant to automation. A robot can't navigate a crawl space or troubleshoot a unique installation.`,
  typicalTasks: [
    "Read blueprints and technical diagrams",
    "Install, maintain, and repair electrical/plumbing/HVAC systems",
    "Operate power tools and specialized equipment",
    "Troubleshoot problems and develop solutions",
    "Ensure work meets building codes and safety standards",
    "Collaborate with other trades on construction projects",
  ],
  educationPaths: {
    typical: "Apprenticeship or Trade School",
    timeRange: "6 months to 4-5 years (apprenticeship)",
    commonCredentials: [
      "Journeyman License (Electrical, Plumbing, HVAC)",
      "EPA Section 608 Certification (HVAC)",
      "OSHA Safety Certifications",
      "State Contractor License",
      "Welding Certifications (AWS)",
    ],
  },
  whoItsFor: [
    "Like working with your hands",
    "Enjoy problem-solving and troubleshooting",
    "Want to earn while you learn",
    "Prefer variety over repetitive desk work",
    "Value job security and union benefits",
    "Don't want college debt",
  ],
  whoItsNotFor: [
    "Prefer climate-controlled office environments",
    "Have physical limitations that prevent manual labor",
  ],
  coreSkills: [
    "Blueprint Reading",
    "Hand & Power Tools",
    "Math & Measurements",
    "Problem Solving",
    "Physical Stamina",
    "Safety Awareness",
    "Code Compliance",
    "Customer Service",
  ],
  popularRoles: [
    "Electrician",
    "Plumber",
    "HVAC Technician",
    "Welder",
    "Carpenter",
    "Wind Turbine Technician",
  ],
};

export default function SkilledTradesPage() {
  const careers = getSkilledTradesCareers();
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
                  🟢 {pathContent.aiOutlook}
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
