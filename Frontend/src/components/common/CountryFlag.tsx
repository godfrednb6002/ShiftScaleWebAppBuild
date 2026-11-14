import React from 'react';

interface CountryFlagProps {
  countryCode: string;
  className?: string;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({ countryCode, className = 'w-5 h-3.5' }) => {
  const code = countryCode.toUpperCase();

  if (code === 'GH' || code === 'GHANA') {
    // Ghana flag: Red, Gold with Black 5-pointed star, Green horizontal tricolor
    return (
      <svg
        viewBox="0 0 600 400"
        className={`${className} rounded-[2px] shadow-xs shrink-0 inline-block overflow-hidden`}
        aria-label="Flag of Ghana"
      >
        <rect width="600" height="133.3" fill="#D40026" />
        <rect y="133.3" width="600" height="133.4" fill="#FCD116" />
        <rect y="266.7" width="600" height="133.3" fill="#006B3F" />
        {/* Black star in the center */}
        <polygon
          points="300,145 318,198 375,198 329,232 346,285 300,251 254,285 271,232 225,198 282,198"
          fill="#000000"
        />
      </svg>
    );
  }

  if (code === 'CI' || code === "CÔTE D'IVOIRE" || code === 'IVORY COAST') {
    // Ivory Coast: Orange, White, Green vertical tricolor
    return (
      <svg
        viewBox="0 0 600 400"
        className={`${className} rounded-[2px] shadow-xs shrink-0 inline-block overflow-hidden`}
        aria-label="Flag of Côte d'Ivoire"
      >
        <rect width="200" height="400" fill="#F77F00" />
        <rect x="200" width="200" height="400" fill="#FFFFFF" />
        <rect x="400" width="200" height="400" fill="#009E60" />
      </svg>
    );
  }

  if (code === 'NG' || code === 'NIGERIA') {
    // Nigeria: Green, White, Green vertical tricolor
    return (
      <svg
        viewBox="0 0 600 400"
        className={`${className} rounded-[2px] shadow-xs shrink-0 inline-block overflow-hidden`}
        aria-label="Flag of Nigeria"
      >
        <rect width="200" height="400" fill="#008751" />
        <rect x="200" width="200" height="400" fill="#FFFFFF" />
        <rect x="400" width="200" height="400" fill="#008751" />
      </svg>
    );
  }

  if (code === 'KE' || code === 'KENYA') {
    // Kenya: Black, Red with white fimbriations, Green horizontal
    return (
      <svg
        viewBox="0 0 600 400"
        className={`${className} rounded-[2px] shadow-xs shrink-0 inline-block overflow-hidden`}
        aria-label="Flag of Kenya"
      >
        <rect width="600" height="120" fill="#000000" />
        <rect y="120" width="600" height="20" fill="#FFFFFF" />
        <rect y="140" width="600" height="120" fill="#BB0000" />
        <rect y="260" width="600" height="20" fill="#FFFFFF" />
        <rect y="280" width="600" height="120" fill="#006600" />
        {/* Maasai shield center icon */}
        <ellipse cx="300" cy="200" rx="35" ry="60" fill="#BB0000" stroke="#FFFFFF" strokeWidth="6" />
        <ellipse cx="300" cy="200" rx="18" ry="40" fill="#000000" />
      </svg>
    );
  }

  if (code === 'NO' || code === 'NORWAY') {
    // Norway: Red field with white-bordered dark blue Scandinavian cross
    return (
      <svg
        viewBox="0 0 220 160"
        className={`${className} rounded-[2px] shadow-xs shrink-0 inline-block overflow-hidden`}
        aria-label="Flag of Norway"
      >
        <rect width="220" height="160" fill="#BA122B" />
        <rect x="60" width="40" height="160" fill="#FFFFFF" />
        <rect y="60" width="220" height="40" fill="#FFFFFF" />
        <rect x="70" width="20" height="160" fill="#00205B" />
        <rect y="70" width="220" height="20" fill="#00205B" />
      </svg>
    );
  }

  // Fallback generic globe
  return (
    <div
      className={`${className} rounded-[2px] bg-emerald-700 flex items-center justify-center text-[8px] font-bold text-white shadow-xs`}
    >
      {code.slice(0, 2)}
    </div>
  );
};
