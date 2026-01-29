import type { Metadata } from "next";
import { Analytics } from "@/components/Analytics";
import { Header } from "@/components/Header";
import { FlagLogo } from "@/components/FlagLogo";
import { LocationProvider } from "@/lib/location-context";
import { AuthProvider } from "@/lib/auth-context";
// TODO: Re-enable after auth security audit
// import { AuthModal } from "@/components/auth/AuthModal";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://americandreamjobs.org"),
  title: "American Dream Jobs - Find Top Jobs in Minutes",
  description:
    "Discover high-paying, AI-resilient careers that matter. Explore training paths, wages, and what jobs are actually like and apply to hundreds of jobs in seconds.",
  keywords: [
    "careers",
    "jobs",
    "trades",
    "vocational training",
    "salary",
    "job market",
  ],
  openGraph: {
    title: "American Dream Jobs - Find Top Jobs in Minutes",
    description:
      "Discover high-paying, AI-resilient careers that matter. Explore training paths, wages, and what jobs are actually like and apply to hundreds of jobs in seconds.",
    images: [
      {
        url: "/us-flag-circle.svg",
        width: 512,
        height: 512,
        alt: "American Dream Jobs - Circular American Flag",
      },
    ],
    type: "website",
    siteName: "American Dream Jobs",
  },
  twitter: {
    card: "summary",
    title: "American Dream Jobs - Find Top Jobs in Minutes",
    description:
      "Discover high-paying, AI-resilient careers that matter. Explore training paths, wages, and what jobs are actually like and apply to hundreds of jobs in seconds.",
    images: ["/us-flag-circle.svg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Source+Sans+3:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <LocationProvider>
          <AuthProvider>
            <Analytics />
            <Header />
            <main>{children}</main>
            <Footer />
            {/* TODO: Re-enable after auth security audit */}
            {/* <AuthModal /> */}
          </AuthProvider>
        </LocationProvider>
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="bg-warm-white border-t border-sage-muted mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FlagLogo size="lg" />
              <span className="font-display font-semibold text-lg text-sage">
                American Dream Jobs
              </span>
            </div>
            <p className="text-sm text-ds-slate-light leading-relaxed">
              Honest career information for people who want to build real
              skills and earn good money. Built by two engineers who believe
              everyone deserves access to quality career guidance.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-ds-slate-muted mb-4">
              Explore
            </h3>
            <ul className="space-y-2 text-sm text-ds-slate-light">
              <li>
                <a href="/#careers" className="hover:text-sage transition-colors">
                  All Careers
                </a>
              </li>
              <li>
                <a href="/compare" className="hover:text-sage transition-colors">
                  Compare Futures
                </a>
              </li>
              <li>
                <a href="/calculator" className="hover:text-sage transition-colors">
                  Net Worth Calculator
                </a>
              </li>
              <li>
                <a href="/compass" className="hover:text-sage transition-colors">
                  Career Compass
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-ds-slate-muted mb-4">
              About
            </h3>
            <ul className="space-y-2 text-sm text-ds-slate-light">
              <li>
                <a href="/methodology" className="hover:text-sage transition-colors">
                  Our Methodology
                </a>
              </li>
              <li>
                <a href="/contribute" className="hover:text-sage transition-colors">
                  Contribute
                </a>
              </li>
              <li>
                <a
                  href="https://www.bls.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sage transition-colors"
                >
                  BLS Data
                </a>
              </li>
              <li>
                <a
                  href="https://www.onetonline.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sage transition-colors"
                >
                  O*NET
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-sage-muted mt-8 pt-8 text-sm text-ds-slate-muted text-center">
          <p>
            Data provided by U.S. Department of Labor. This site is not
            affiliated with the federal government.
          </p>
        </div>
      </div>
    </footer>
  );
}
