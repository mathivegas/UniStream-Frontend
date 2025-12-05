import React, { useEffect } from 'react';
import './NotificationSystem.css';
import { NotificationType } from '../../types';

interface NotificationSystemProps {
  message: string;
  type: NotificationType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ 
  message, 
  type, 
  isVisible, 
  onClose,
  duration = 5000 
}) => {
  useEffect(() => {
    if (isVisible && type !== 'levelup') {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration, type]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      case 'levelup':
        return '🎉';
      default:
        return 'ℹ';
    }
  };

  return (
    <>
      <div className={`notification notification-${type} ${isVisible ? 'show' : ''}`}>
        <div className="notification-icon">{getIcon()}</div>
        <div className="notification-content">
          <p className="notification-message">{message}</p>
        </div>
        <button className="notification-close" onClick={onClose}>✕</button>
      </div>
      
      {type === 'levelup' && isVisible && (
        <div className="celebration-overlay">
          <div className="celebration-content">
            <div className="celebration-icon">🎉</div>
            <h2 className="celebration-title">¡SUBISTE DE NIVEL!</h2>
            <p className="celebration-message">{message}</p>
            <div className="confetti-container">
              {[...Array(50)].map((_, i) => (
                <div 
                  key={i} 
                  className="confetti" 
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    backgroundColor: ['#ff1b8d', '#7c3aed', '#fbbf24', '#10b981', '#3b82f6'][Math.floor(Math.random() * 5)]
                  }}
                ></div>
              ))}
            </div>
            <button className="celebration-close-btn" onClick={onClose}>
              Continuar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationSystem;
