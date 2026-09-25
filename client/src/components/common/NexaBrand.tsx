import { Link } from "react-router-dom";

interface NexaBrandProps {
  className?: string;
}

export function NexaBrand({ className = "" }: NexaBrandProps) {
  return (
    <Link to="/" className={`nexa-brand ${className}`.trim()} aria-label="Nexa home">
      <svg className="nexa-mark" viewBox="0 0 40 40" aria-hidden="true">
        <defs>
          <linearGradient id="nexa-mark-gradient" x1="5" y1="5" x2="35" y2="35" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2563EB" />
            <stop offset="1" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="12" fill="url(#nexa-mark-gradient)" />
        <path d="M11 28V12h4l10 10.5V12h4v16h-4L15 17.5V28h-4Z" fill="white" />
      </svg>
      <span className="nexa-brand-name">Nexa</span>
    </Link>
  );
}
