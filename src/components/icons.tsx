// icons.tsx
import React from "react";

export function BoldIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M15.6 10.79A4.2 4.2 0 0012 2H6a1 1 0 100 2h6a2.2 2.2 0 010 4.4H6a1 1 0 100 2h6a2.2 2.2 0 010 4.4H6a1 1 0 100 2h6a4.2 4.2 0 003.6-6.01z" />
    </svg>
  );
}

export function ItalicIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M10 4a1 1 0 100 2h1.235l-3.47 12H6a1 1 0 000 2h8a1 1 0 000-2h-1.235l3.47-12H18a1 1 0 000-2h-8z" />
    </svg>
  );
}

export function UnderlineIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 4a1 1 0 00-1 1v6a3 3 0 006 0V5a1 1 0 10-2 0v6a1 1 0 01-2 0V5a1 1 0 00-1-1zM5 19a1 1 0 000 2h14a1 1 0 100-2H5z" />
    </svg>
  );
}

export function StrikethroughIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M5 10a1 1 0 100 2h14a1 1 0 100-2H5zm6-5a1 1 0 011 1v1h2V6a1 1 0 112 0v1h1a1 1 0 010 2H7a1 1 0 010-2h1V6a1 1 0 011-1h2zM7 16h10a1 1 0 110 2H7a1 1 0 110-2z" />
    </svg>
  );
}
