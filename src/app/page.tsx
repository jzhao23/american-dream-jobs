"use client";

import { useState } from "react";
import { CareerExplorer } from "@/components/CareerExplorer";
import careersIndex from "../../data/output/careers-index.json";
import type { CareerIndex } from "@/types/career";

const careers = careersIndex as CareerIndex[];

const timeOptions = [
  { id: "asap", icon: "⚡", title: "ASAP", desc: "Under 6 months" },
  { id: "6-24", icon: "📅", title: "6–24 months", desc: "Certifications & programs" },
  { id: "2-4", icon: "🎯", title: "2–4 years", desc: "Degrees & apprenticeships" },
  { id: "longer", icon: "🎓", title: "I can invest longer", desc: "Explore all paths" },
];

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
    href: "/categories/healthcare-technical",
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
    href: "/categories/construction",
  },
  {
    id: "tech",
    icon: "💻",
    title: "Tech (No Degree Required)",
    pay: "$55k–$120k",
    time: "6–18 mo",
    aiStatus: "augmented",
    aiLabel: "🟡 AI-Augmented",
    desc: "Cybersecurity, cloud, and IT support roles hire on skills and certifications, not degrees.",
    roles: "IT Support · Cybersecurity Analyst · Cloud Admin · Network Tech",
    href: "/categories/technology",
  },
  {
    id: "transport",
    icon: "🚛",
    title: "Transportation & Logistics",
    pay: "$45k–$80k",
    time: "<6 mo",
    aiStatus: "transition",
    aiLabel: "🟠 In Transition",
    desc: "The fastest path to decent income. CDL training is quick. Know the AI landscape before you commit.",
    roles: "Heavy Truck Driver · Logistics Coordinator · Delivery Driver",
    href: "/categories/transportation",
  },
];

const featuredCareers = [
  { title: "Wind Turbine Technician", pay: "$61,770", time: "6–12 mo", ai: "resilient", aiLabel: "🟢 Resilient", href: "/careers/wind-turbine-service-technicians" },
  { title: "Dental Hygienist", pay: "$87,530", time: "2 years", ai: "resilient", aiLabel: "🟢 Resilient", href: "/careers/dental-hygienists" },
  { title: "Respiratory Therapist", pay: "$77,960", time: "2 years", ai: "resilient", aiLabel: "🟢 Resilient", href: "/careers/respiratory-therapists" },
  { title: "Electrician", pay: "$61,590", time: "4–5 years*", ai: "resilient", aiLabel: "🟢 Resilient", href: "/careers/electricians" },
  { title: "Solar Panel Installer", pay: "$48,800", time: "<6 mo", ai: "resilient", aiLabel: "🟢 Resilient", href: "/careers/solar-photovoltaic-installers" },
  { title: "MRI Technologist", pay: "$83,740", time: "2 years", ai: "augmented", aiLabel: "🟡 Augmented", href: "/careers/magnetic-resonance-imaging-technologists" },
];

const trustItems = [
  {
    icon: "📊",
    title: "Official Government Data",
    desc: "Bureau of Labor Statistics & O*NET—the same sources workforce pros use",
  },
  {
    icon: "🤖",
    title: "AI Impact Scores",
    desc: "Know which jobs are future-proof before you invest in training",
  },
  {
    icon: "💵",
    title: "100% Free Forever",
    desc: "No ads, no premium tiers, no data selling. Ever.",
  },
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
    title: "Compare Careers",
    desc: "Put two or more careers side by side. Compare salary, training requirements, job outlook, and AI impact in one view.",
    href: "/compare",
  },
  {
    icon: "📈",
    title: "Calculate Earnings",
    desc: "Project your net worth over time. See how different career choices affect your long-term financial picture.",
    href: "/calculator",
  },
];

export default function HomePage() {
  const [selectedTime, setSelectedTime] = useState("6-24");

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

      {/* Time Filter Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-12 md:pb-16 animate-fadeUp" style={{ animationDelay: "0.2s" }}>
        <div className="bg-warm-white rounded-2xl p-6 md:p-8 shadow-soft">
          <h2 className="font-display text-xl md:text-2xl font-medium text-ds-slate text-center mb-6">
            How soon do you need to start earning?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {timeOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedTime(option.id)}
                className={`time-option ${selectedTime === option.id ? "selected" : ""}`}
              >
                <div className="text-2xl md:text-3xl mb-2">{option.icon}</div>
                <div className="font-display font-semibold text-ds-slate text-sm md:text-base mb-1">
                  {option.title}
                </div>
                <div className="text-xs md:text-sm text-ds-slate-light">
                  {option.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
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
            <div className="hidden md:grid grid-cols-[1fr_100px_100px_120px] gap-4 px-6 py-4 bg-sage text-white text-xs font-bold uppercase tracking-wide">
              <span>Career</span>
              <span>Median Pay</span>
              <span>Training</span>
              <span>AI Outlook</span>
            </div>
            {/* Table Rows */}
            {featuredCareers.map((career, idx) => (
              <a
                key={idx}
                href={career.href}
                className="grid md:grid-cols-[1fr_100px_100px_120px] gap-2 md:gap-4 px-4 md:px-6 py-4 border-b border-sage-muted hover:bg-warm-white transition-colors items-center"
              >
                <span className="font-semibold text-ds-slate">{career.title}</span>
                <span className="font-bold text-sage text-sm md:text-base">{career.pay}</span>
                <span className="text-sm text-ds-slate-light">{career.time}</span>
                <span className={`inline-flex items-center gap-1 text-xs md:text-sm font-semibold px-2 md:px-3 py-1 rounded-md w-fit ${
                  career.ai === "resilient" ? "badge-ai-resilient" : "badge-ai-augmented"
                }`}>
                  {career.aiLabel}
                </span>
              </a>
            ))}
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

      {/* Trust Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 md:py-20 text-center">
        <p className="section-eyebrow">Why Trust Us</p>
        <h2 className="section-title">Built different</h2>
        <p className="section-subtitle mb-10">
          We're not selling you bootcamps or job listings. Just honest info to help you decide.
        </p>
        <div className="grid md:grid-cols-3 gap-8 md:gap-10">
          {trustItems.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-sage-muted rounded-2xl flex items-center justify-center text-2xl mb-1">
                {item.icon}
              </div>
              <span className="font-semibold text-ds-slate">{item.title}</span>
              <span className="text-sm text-ds-slate-light leading-relaxed">{item.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Career Compass CTA Section */}
      <section className="relative bg-gradient-to-br from-sage to-sage-dark text-white py-16 md:py-20 overflow-hidden">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="text-5xl mb-4">🧭</div>
          <h2 className="font-display text-2xl md:text-3xl font-medium mb-4">
            Not sure where to start?
          </h2>
          <p className="text-lg opacity-90 mb-8 leading-relaxed">
            Upload your resume and answer a few questions. We'll match you with careers that fit your goals, skills, and timeline.
          </p>
          <a
            href="/compass"
            className="btn-white"
          >
            Take the Career Compass
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
          <p className="text-sm opacity-70 mt-5">No account needed. Resume optional.</p>
        </div>
      </section>

      {/* Tools Bar Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="text-center mb-8">
          <p className="section-eyebrow">Tools</p>
          <h2 className="section-title">More ways to explore</h2>
          <p className="section-subtitle">Dig deeper with our free career planning tools</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 md:gap-5">
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
