"use client";

import { useState } from "react";

interface TOCItem {
  id: string;
  label: string;
  emoji?: string;
}

interface TableOfContentsProps {
  items: TOCItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setIsExpanded(false);
  };

  if (items.length === 0) return null;

  return (
    <nav className="bg-warm-white border border-sage-muted rounded-xl p-4 mb-8">
      {/* Mobile: Collapsible */}
      <div className="md:hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="text-sm font-medium text-ds-slate">Jump to section</span>
          <svg
            className={`w-5 h-5 text-ds-slate-light transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isExpanded && (
          <div className="mt-3 flex flex-wrap gap-2">
            {items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleClick(e, item.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cream hover:bg-sage-muted text-ds-slate-light hover:text-ds-slate text-sm rounded-full transition-colors"
              >
                {item.emoji && <span className="text-xs">{item.emoji}</span>}
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: Horizontal layout */}
      <div className="hidden md:block">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-ds-slate-light shrink-0">Jump to:</span>
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleClick(e, item.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cream hover:bg-sage-muted text-ds-slate-light hover:text-ds-slate text-sm rounded-full transition-colors"
              >
                {item.emoji && <span className="text-xs">{item.emoji}</span>}
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
