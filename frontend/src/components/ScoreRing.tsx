import React from 'react';

interface ScoreRingProps {
  score: number;
  maxScore?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  maxScore = 10,
  size = 120,
  strokeWidth = 8,
  label,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(score / maxScore, 1);
  const offset = circumference - percentage * circumference;

  const getColor = () => {
    if (percentage >= 0.8) return '#2E8B68';
    if (percentage >= 0.5) return '#174D3A';
    return '#E98B78';
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E8E6DF"
            strokeWidth={strokeWidth}
          />
          {/* Score ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[#282A27]">{score}</span>
          <span className="text-xs text-[#777B73]">/ {maxScore}</span>
        </div>
      </div>
      {label && <span className="text-sm font-medium text-[#777B73]">{label}</span>}
    </div>
  );
};

export default ScoreRing;
