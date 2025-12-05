import React from 'react';
import './ProgressBar.css';

interface ProgressBarProps {
  current: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  color?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  current, 
  max, 
  label, 
  showPercentage = true,
  color = '#ff1b8d'
}) => {
  const percentage = Math.min((current / max) * 100, 100);

  return (
    <div className="progress-bar-container">
      {label && (
        <div className="progress-bar-header">
          <span className="progress-bar-label">{label}</span>
          {showPercentage && (
            <span className="progress-bar-text">
              {current} / {max} XP
            </span>
          )}
        </div>
      )}
      <div className="progress-bar-track">
        <div 
          className="progress-bar-fill" 
          style={{ 
            width: `${percentage}%`,
            backgroundColor: color 
          }}
        >
          <div className="progress-bar-glow"></div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
