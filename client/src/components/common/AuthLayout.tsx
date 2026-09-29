import type { ReactNode } from "react";
import { WaveBrand } from "@/components/common/WaveBrand";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="auth-page auth-split-page">
      <section className="auth-showcase" aria-label="Welcome to Wave">
        <div className="auth-showcase-content">
          <WaveBrand className="auth-showcase-brand" />
          <div className="auth-showcase-copy">
            <span className="auth-showcase-eyebrow">A little closer, every day</span>
            <h1>Find your people.<br />Feel more connected.</h1>
            <p>Share the moments that matter, discover new perspectives, and grow your circle with Wave.</p>
          </div>
          <div className="auth-wave-art" aria-hidden="true">
            <div className="auth-wave-orb auth-wave-orb-one" />
            <div className="auth-wave-orb auth-wave-orb-two" />
            <div className="auth-wave-orb auth-wave-orb-three" />
            <svg viewBox="0 0 720 440" fill="none" role="presentation">
              <defs>
                <linearGradient id="auth-wave-stroke" x1="70" y1="330" x2="636" y2="102" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#2563EB" />
                  <stop offset=".52" stopColor="#3B82F6" />
                  <stop offset="1" stopColor="#8B5CF6" />
                </linearGradient>
                <linearGradient id="auth-wave-fill" x1="350" y1="104" x2="369" y2="394" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3B82F6" stopOpacity=".25" />
                  <stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
                </linearGradient>
                <filter id="auth-wave-glow" x="35" y="57" width="650" height="326" colorInterpolationFilters="sRGB">
                  <feGaussianBlur stdDeviation="13" />
                </filter>
              </defs>
              <path d="M58 259c76-96 130-126 186-91 49 31 65 107 121 107 56 0 70-90 127-90 49 0 89 47 170 13" stroke="url(#auth-wave-stroke)" strokeWidth="54" strokeLinecap="round" opacity=".32" filter="url(#auth-wave-glow)" />
              <path d="M58 259c76-96 130-126 186-91 49 31 65 107 121 107 56 0 70-90 127-90 49 0 89 47 170 13v120H58V259Z" fill="url(#auth-wave-fill)" />
              <path d="M58 259c76-96 130-126 186-91 49 31 65 107 121 107 56 0 70-90 127-90 49 0 89 47 170 13" stroke="url(#auth-wave-stroke)" strokeWidth="3" strokeLinecap="round" />
              <path d="M80 309c74-46 130-59 181-29 42 24 68 60 110 60 49 0 77-56 122-56 43 0 76 20 144 8" stroke="#60A5FA" strokeOpacity=".34" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="244" cy="168" r="7" fill="#BFDBFE" />
              <circle cx="365" cy="275" r="8" fill="#E0E7FF" />
              <circle cx="492" cy="185" r="6" fill="#C4B5FD" />
            </svg>
            <div className="auth-wave-node auth-wave-node-one" />
            <div className="auth-wave-node auth-wave-node-two" />
            <div className="auth-wave-node auth-wave-node-three" />
          </div>
          <div className="auth-showcase-foot">
            <span className="auth-live-indicator" />
            <span>Make room for more connection</span>
          </div>
        </div>
      </section>
      <section className="auth-form-panel" aria-label="Account access">
        <div className="auth-form-panel-inner">{children}</div>
      </section>
    </main>
  );
}
