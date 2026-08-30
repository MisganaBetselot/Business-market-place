/**
 * Original mark for Addis Gebeya. A simple stall roof over a horizon
 * line, teal roof with an orange support post, standing in for a market
 * stall, not a copy of any other brand's mark.
 */
export default function Logo({ withWordmark = true, variant = "default", className = "" }) {
  const roofColor = variant === "light" ? "#ffffff" : "var(--color-brand-600)";
  const wordmarkColor = variant === "light" ? "text-white" : "text-brand-600";

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Stall roof */}
        <path
          d="M3 12L15 4L27 12"
          stroke={roofColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 12V22C6 22.5523 6.44772 23 7 23H23C23.5523 23 24 22.5523 24 22V12"
          stroke={roofColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Support post, the orange accent */}
        <line x1="15" y1="12" x2="15" y2="23" stroke="var(--color-gold-500)" strokeWidth="2.5" strokeLinecap="round" />
        {/* Awning stripe */}
        <path
          d="M9 12L15 8L21 12"
          stroke="var(--color-gold-500)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {withWordmark && (
        <span className={`font-display text-lg font-semibold leading-none ${wordmarkColor}`}>
          Addis <span style={{ color: "var(--color-gold-500)" }}>Gebeya</span>
        </span>
      )}
    </span>
  );
}
