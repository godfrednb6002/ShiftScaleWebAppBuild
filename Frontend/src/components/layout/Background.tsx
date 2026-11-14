import React from 'react';

interface BackgroundProps {
  isDarkMode: boolean;
  bgImage: string;
}

export const Background: React.FC<BackgroundProps> = ({ isDarkMode, bgImage }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <img
        src={bgImage}
        alt=""
        className={`w-full h-full object-cover object-center filter -scale-x-100 transition-all duration-700 ${
          isDarkMode ? 'opacity-40 brightness-75 contrast-110 saturate-125' : 'opacity-28 saturate-110'
        }`}
      />
      {/* Transparent gradient tint */}
      <div
        className={`absolute inset-0 transition-colors duration-300 ${
          isDarkMode
            ? 'bg-gradient-to-b from-[#08120b]/30 via-transparent to-[#08120b]/50'
            : 'bg-gradient-to-b from-[#d7e6d9]/25 via-transparent to-[#d7e6d9]/45'
        }`}
      />
    </div>
  );
};
