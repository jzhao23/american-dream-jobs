"use client";

import { CareerExplorer } from "@/components/CareerExplorer";
import { CategoryStrip } from "@/components/CategoryStrip";
import { CareerCompassWizard } from "@/components/CareerCompassWizard";
import { FindJobsButton } from "@/components/jobs/FindJobsButton";
import careersIndex from "../../data/output/careers-index.json";
import type { CareerIndex } from "@/types/career";

const careers = careersIndex as CareerIndex[];

const curatedPaths = [
  {
    id: "healthcare",
    icon: "🏥",
    title: "Healthcare (Non-Clinical)",
    pay: "$45k–$85k",
    time: "6–24 mo",
    aiStatus: "resilient",
    aiLabel: "🟢 AI-Resilient",
    desc: "Hands-on patient care and technical roles in the fastest-growing sector. High demand everywhere.",
    roles: "Medical Assistant · Phlebotomist · Surgical Tech · Dental Hygienist",
    href: "/paths/healthcare-nonclinical",
  },
  {
    id: "trades",
    icon: "🏗️",
    title: "Skilled Trades",
    pay: "$50k–$100k+",
    time: "6 mo–4 yr",
    aiStatus: "resilient",
    aiLabel: "🟢 AI-Resilient",
    desc: "Earn while you learn through apprenticeships. Strong unions, excellent benefits, can't be outsourced.",
    roles: "Electrician · HVAC Tech · Plumber · Welder · Wind Turbine Tech",
    href: "/paths/skilled-trades",
  },
  {
    id: "tech",
    icon: "💻",
    title: "Tech (No Degree Required)",
    pay: "$55k–$130k",
    time: "6–24 mo",
    aiStatus: "augmented",
    aiLabel: "🟡 AI-Augmented",
    desc: "Systems analysis, networking, and engineering technician roles. Certifications over degrees.",
    roles: "Systems Analyst · Robotics Tech · Civil Eng Tech · Mechatronics",
    href: "/paths/tech-no-degree",
  },
  {
    id: "transport",
    icon: "🚛",
    title: "Transportation & Logistics",
    pay: "$35k–$80k",
    time: "<6 mo",
    aiStatus: "transition",
    aiLabel: "🟠 In Transition",
    desc: "The fastest path to income. CDL training is quick. Know the AI landscape before you commit.",
    roles: "Heavy Truck Driver · Logistics Coordinator · Delivery Driver",
    href: "/paths/transportation-logistics",
  },
];

const featuredCareers = [
  { title: "Wind Turbine Technician", pay: "$61,770", time: "6–12 mo", ai: "resilient", aiLabel: "🟢 Resilient", href: "/specializations/wind-turbine-service-technicians" },
  { title: "Dental Hygienist", pay: "$87,530", time: "2 years", ai: "resilient", aiLabel: "🟢 Resilient", href: "/specializations/dental-hygienists" },
  { title: "Respiratory Therapist", pay: "$77,960", time: "2 years", ai: "resilient", aiLabel: "🟢 Resilient", href: "/careers/respiratory-therapists" },
  { title: "Electrician", pay: "$61,590", time: "4–5 years*", ai: "resilient", aiLabel: "🟢 Resilient", href: "/specializations/electricians" },
  { title: "Solar Panel Installer", pay: "$48,800", time: "<6 mo", ai: "resilient", aiLabel: "🟢 Resilient", href: "/specializations/solar-photovoltaic-installers" },
  { title: "MRI Technologist", pay: "$83,740", time: "2 years", ai: "augmented", aiLabel: "🟡 Augmented", href: "/specializations/magnetic-resonance-imaging-technologists" },
];

const tools = [
  {
    icon: "🔍",
    title: "Explore Careers",
    desc: "Browse 1,000+ careers with filters for pay, training time, and AI resilience. Find options you didn't know existed.",
    href: "/#careers",
  },
  {
    icon: "⚖️",
    title: "Compare Futures",
    desc: "Which path will earn more in the long run? Compare up to 3 careers to see lifetime earnings, education costs, and ROI.",
    href: "/compare",
  },
  {
    icon: "📈",
    title: "Calculate Earnings",
    desc: "Project your net worth over time. See how different career choices affect your long-term financial picture.",
    href: "/calculator",
  },
  {
    icon: "📍",
    title: "Local Jobs",
    desc: "See top careers and fastest-growing opportunities in your area. Real employment data from the Bureau of Labor Statistics.",
    href: "/local-jobs",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-sage-muted text-sage text-sm font-semibold px-4 py-2 rounded-full mb-6 animate-fadeDown">
          <span>✨</span>
          Free career guidance · Real government data
        </div>
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-medium text-ds-slate leading-tight mb-5 animate-fadeUp">
          Ready for a <em className="italic text-sage">fresh start?</em>
        </h1>
        <p className="text-lg md:text-xl text-ds-slate-light max-w-xl mx-auto leading-relaxed animate-fadeUp" style={{ animationDelay: "0.1s" }}>
          We help you find stable, well-paying careers you can actually train for—even mid-career. No fluff, just honest data from the Department of Labor.
        </p>
      </section>

      {/* Career Compass Wizard - Inline step-by-step flow */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-12 md:pb-16 animate-fadeUp" style={{ animationDelay: "0.2s" }}>
        <CareerCompassWizard />
      </section>

      {/* Curated Paths Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 md:pb-20">
        <div className="text-center mb-8">
          <p className="section-eyebrow">Popular Paths</p>
          <h2 className="section-title">High-demand fields for career changers</h2>
          <p className="section-subtitle">Clear training routes, strong job markets, good pay</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4 md:gap-5">
          {curatedPaths.map((path) => (
            <a
              key={path.id}
              href={path.href}
              className="card-warm p-5 md:p-6 flex flex-col"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-sage-muted rounded-xl flex items-center justify-center text-2xl md:text-3xl flex-shrink-0">
                  {path.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg md:text-xl font-semibold text-ds-slate mb-2">
                    {path.title}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="tag-pay">{path.pay}</span>
                    <span className="tag-time">{path.time}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                      path.aiStatus === "resilient" ? "badge-ai-resilient" :
                      path.aiStatus === "augmented" ? "badge-ai-augmented" :
                      "badge-ai-transition"
                    }`}>
                      {path.aiLabel}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm md:text-base text-ds-slate-light leading-relaxed mb-4 flex-1">
                {path.desc}
              </p>
              <div className="pt-4 border-t border-sage-muted">
                <p className="text-xs font-bold uppercase tracking-wide text-ds-slate-muted mb-1">
                  Popular Roles
                </p>
                <p className="text-sm font-medium text-sage">{path.roles}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Category Strip */}
      <CategoryStrip />

      {/* Featured Careers Table Section */}
      <section className="bg-warm-white py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <p className="section-eyebrow">Quick-Start Careers</p>
            <h2 className="section-title">Top careers you can start in under 2 years</h2>
            <p className="section-subtitle">Sorted by AI resilience—your job security matters</p>
          </div>
          <div className="bg-cream rounded-2xl overflow-hidden shadow-card">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[1fr_100px_100px_120px_110px] gap-4 px-6 py-4 bg-sage text-white text-xs font-bold uppercase tracking-wide">
              <span>Career</span>
              <span>Median Pay</span>
              <span>Training</span>
              <span>AI Outlook</span>
              <span>Find Jobs</span>
            </div>
            {/* Table Rows */}
            {featuredCareers.map((career, idx) => {
              const slug = career.href.split('/').pop() || '';
              return (
                <div
                  key={idx}
                  className="grid md:grid-cols-[1fr_100px_100px_120px_110px] gap-2 md:gap-4 px-4 md:px-6 py-4 border-b border-sage-muted hover:bg-warm-white transition-colors items-center"
                >
                  <a href={career.href} className="font-semibold text-ds-slate hover:text-sage hover:underline">{career.title}</a>
                  <span className="font-bold text-sage text-sm md:text-base">{career.pay}</span>
                  <span className="text-sm text-ds-slate-light">{career.time}</span>
                  <span className={`inline-flex items-center gap-1 text-xs md:text-sm font-semibold px-2 md:px-3 py-1 rounded-md w-fit ${
                    career.ai === "resilient" ? "badge-ai-resilient" : "badge-ai-augmented"
                  }`}>
                    {career.aiLabel}
                  </span>
                  <div className="md:block">
                    <FindJobsButton
                      careerSlug={slug}
                      careerTitle={career.title}
                      variant="compact"
                      className="mt-2 md:mt-0"
                    />
                  </div>
                </div>
              );
            })}
            {/* View All Link */}
            <a
              href="/#careers"
              className="flex items-center justify-center gap-2 px-6 py-4 font-semibold text-sage hover:bg-sage-muted transition-colors border-t border-sage-muted group"
            >
              View all 200+ quick-start careers
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Tools Bar Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="text-center mb-8">
          <p className="section-eyebrow">Tools</p>
          <h2 className="section-title">More ways to explore</h2>
          <p className="section-subtitle">Dig deeper with our free career planning tools</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {tools.map((tool, idx) => (
            <a
              key={idx}
              href={tool.href}
              className="card-warm p-5 md:p-6 flex flex-col group"
            >
              <div className="w-12 h-12 bg-sage-muted rounded-xl flex items-center justify-center text-xl mb-4">
                {tool.icon}
              </div>
              <h3 className="font-display text-lg font-semibold text-ds-slate mb-2 flex items-center justify-between">
                {tool.title}
                <svg className="w-5 h-5 text-sage opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </h3>
              <p className="text-sm text-ds-slate-light leading-relaxed">
                {tool.desc}
              </p>
            </a>
          ))}
        </div>
      </section>

      {/* Full Career Explorer Section */}
      <section id="careers" className="bg-warm-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="section-eyebrow">All Careers</p>
            <h2 className="section-title">Explore 1,000+ Careers</h2>
            <p className="section-subtitle">Filter by pay, training time, category, and AI resilience</p>
          </div>
          <CareerExplorer careers={careers} hideCategoryFilter />
        </div>
      </section>
    </div>
  );
}
