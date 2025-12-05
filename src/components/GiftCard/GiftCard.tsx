import React from 'react';
import './GiftCard.css';
import { Gift } from '../../types';

interface GiftCardProps {
  gift: Gift;
  onEdit?: (gift: Gift) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

const GiftCard: React.FC<GiftCardProps> = ({ 
  gift, 
  onEdit, 
  onDelete,
  showActions = false 
}) => {
  return (
    <div className="gift-card">
      <div className="gift-card-image">
        <img src={gift.imagenUrl} alt={gift.nombre} />
      </div>
      <div className="gift-card-content">
        <h3 className="gift-card-title">{gift.nombre}</h3>
        <p className="gift-card-description">{gift.descripcion}</p>
        <div className="gift-card-stats">
          <div className="gift-stat">
            <span className="gift-stat-label">Costo:</span>
            <span className="gift-stat-value">{gift.costo} monedas</span>
          </div>
          <div className="gift-stat">
            <span className="gift-stat-label">Puntos:</span>
            <span className="gift-stat-value">{gift.puntos}</span>
          </div>
        </div>
      </div>
      {showActions && (
        <div className="gift-card-actions">
          <button 
            className="gift-btn gift-btn-edit"
            onClick={() => onEdit && onEdit(gift)}
          >
            Editar
          </button>
          <button 
            className="gift-btn gift-btn-delete"
            onClick={() => onDelete && onDelete(gift.id)}
          >
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
};

export default GiftCard;
