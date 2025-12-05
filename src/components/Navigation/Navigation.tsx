import React from 'react';
import { Link } from 'react-router-dom';
import './Navigation.css';

const Navigation: React.FC = () => {
  return (
    <nav className="demo-navigation">
      <div className="demo-nav-content">
        <h3 className="demo-nav-title">🎮 Demo de Aplicación</h3>
        <div className="demo-nav-links">
          <Link to="/" className="demo-nav-link">
            <span className="demo-link-icon">🏠</span>
            <span className="demo-link-text">Inicio</span>
          </Link>
          <Link to="/espectador" className="demo-nav-link">
            <span className="demo-link-icon">👤</span>
            <span className="demo-link-text">Perfil Espectador</span>
          </Link>
          <Link to="/admin" className="demo-nav-link">
            <span className="demo-link-icon">⚙️</span>
            <span className="demo-link-text">Panel Admin</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
