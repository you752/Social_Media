import { Link } from "react-router-dom";

interface WaveBrandProps {
  className?: string;
}

export function WaveBrand({ className = "" }: WaveBrandProps) {
  return (
    <Link to="/" className={`wave-brand ${className}`.trim()} aria-label="Wave home">
      <svg className="wave-mark" viewBox="0 0 44 44" aria-hidden="true">
        <defs>
          <linearGradient id="wave-mark-gradient" x1="6" y1="6" x2="38" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--accent-from)" />
            <stop offset="1" stopColor="var(--accent-to)" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="40" height="40" rx="14" fill="url(#wave-mark-gradient)" />
        <path d="M10 25.5c2.6-5.2 5.3-7.8 8.2-7.8 3.8 0 4.8 4.2 8.2 4.2 3.3 0 5.6-3 7.6-6.9V29c-2.1-3.7-4.5-6.8-7.8-6.8-3.4 0-4.7 4.2-8.1 4.2-2.7 0-5.4-2.4-8.1-7.1V25.5Z" fill="white" opacity="0.96" />
        <circle cx="31.5" cy="17" r="2.2" fill="white" />
      </svg>
      <span className="wave-brand-name">Wave</span>
    </Link>
  );
}
