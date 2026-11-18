import React from 'react';

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  label = 'もどる',
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 text-[#fafafa] font-bold text-base hover:opacity-80 active:scale-95 transition-all cursor-pointer focus:outline-none ${className}`}
    >
      <svg
        className="w-4 h-4 fill-[#d88b33]"
        viewBox="0 0 24 24"
      >
        <polygon points="18,3 6,12 18,21" />
      </svg>
      <span>{label}</span>
    </button>
  );
};
