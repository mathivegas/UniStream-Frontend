import React from 'react';
import './UserProfile.css';
import { User } from '../../types';
import ProgressBar from '../ProgressBar/ProgressBar';

interface UserProfileProps {
  user: User;
  level: number;
  points: number;
  maxPoints: number;
  onLevelUp?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ 
  user, 
  level, 
  points, 
  maxPoints 
}) => {
  return (
    <div className="user-profile-card">
      <button className="btn-edit-profile-card">Editar Perfil</button>
      <div className="user-profile-header">
        <div className="user-avatar-container">
          <img src={user.avatarUrl} alt={user.nombre} className="user-avatar" />
          <div className="user-level-badge">{level}</div>
        </div>
        <div className="user-info">
          <h2 className="user-name">{user.nombre}</h2>
          <p className="user-username">@{user.username}</p>
          <p className="user-bio">{user.bio}</p>
        </div>
      </div>

      <div className="user-progress-section">
        <ProgressBar 
          current={points} 
          max={maxPoints} 
          label="Progreso del Nivel"
          showPercentage={true}
        />
      </div>

      <div className="user-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <p className="stat-label">Tiempo de Visualización</p>
            <p className="stat-value">{user.tiempoVisualizacion}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <p className="stat-label">Streamers Seguidos</p>
            <p className="stat-value">{user.streamersSeguidos}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎁</div>
          <div className="stat-content">
            <p className="stat-label">Regalos Enviados</p>
            <p className="stat-value">{user.regalosEnviados}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎉</div>
          <div className="stat-content">
            <p className="stat-label">Regalos Recibidos</p>
            <p className="stat-value">{user.regalosRecibidos}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
