import type { Metadata } from "next";
import { Analytics } from "@/components/Analytics";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "American Dream Jobs - Find Careers That Build America",
  description:
    "Discover high-paying, AI-resilient careers that matter. Explore training paths, wages, and what jobs are actually like.",
  keywords: [
    "careers",
    "jobs",
    "trades",
    "vocational training",
    "salary",
    "job market",
  ],
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <Analytics />
        <Header />
        <main className="pb-16 md:pb-0">{children}</main>
        <BottomNav />
        <Footer />
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="bg-secondary-50 border-t border-secondary-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🇺🇸</span>
              <span className="font-bold text-lg text-secondary-900">
                American Dream Jobs
              </span>
            </div>
            <p className="text-sm text-secondary-600">
              Honest career information for people who want to build real
              skills and earn good money.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-secondary-900 mb-4">Links</h3>
            <ul className="space-y-2 text-sm text-secondary-600">
              <li>
                <a href="/#careers" className="hover:text-secondary-900">
                  Explore Careers
                </a>
              </li>
              <li>
                <a href="/compare" className="hover:text-secondary-900">
                  Compare Careers
                </a>
              </li>
              <li>
                <a href="/calculator" className="hover:text-secondary-900">
                  Net Worth Calculator
                </a>
              </li>
              <li>
                <a href="/contribute" className="hover:text-secondary-900">
                  Contribute
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-secondary-900 mb-4">
              Data Sources
            </h3>
            <ul className="space-y-2 text-sm text-secondary-600">
              <li>
                <a
                  href="https://www.careeronestop.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-secondary-900"
                >
                  CareerOneStop (DOL)
                </a>
              </li>
              <li>
                <a
                  href="https://www.bls.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-secondary-900"
                >
                  Bureau of Labor Statistics
                </a>
              </li>
              <li>
                <a
                  href="https://www.onetonline.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-secondary-900"
                >
                  O*NET OnLine
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-secondary-200 mt-8 pt-8 text-sm text-secondary-500 text-center">
          <p>
            Data provided by U.S. Department of Labor. This site is not
            affiliated with the federal government.
          </p>
        </div>
      </div>
    </footer>
  );
}
