import React from "react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  iconSize?: number;
  textColor?: string;
  iconColor?: string;
}

export function Logo({
  className = "",
  showText = true,
  iconSize = 32,
  textColor = "currentColor",
  iconColor = "#001F61"
}: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div 
        style={{ width: iconSize, height: iconSize }}
        className="flex items-center justify-center shrink-0"
      >
        <svg
          viewBox="0 0 100 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Main Infinity Path */}
          <path
            d="M30.5 15C42.5 15 52.5 30 69.5 30C86.5 30 86.5 45 69.5 45C52.5 45 42.5 30 30.5 30C18.5 30 18.5 15 30.5 15Z"
            stroke={iconColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-20"
          />
          {/* Top Stroke */}
          <path
            d="M30 15C12 15 12 45 30 45C38 45 45 37 50 30C55 23 62 15 70 15C88 15 88 45 70 45C62 45 55 37 50 30"
            stroke={iconColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* The Eye Integration */}
          <circle cx="28" cy="30" r="9" fill={iconColor} />
          <circle cx="28" cy="30" r="3.5" fill="white" />
          <path d="M22 25C24 23 28 23 30 25" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col leading-none">
          <span 
            className="text-lg font-black tracking-tight uppercase"
            style={{ color: textColor === "currentColor" ? undefined : textColor }}
          >
            LOGICLENS
          </span>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.15em] mt-0.5">
            TraceWise AI
          </span>
        </div>
      )}
    </div>
  );
}
