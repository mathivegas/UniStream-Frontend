import React, { useState, useEffect } from 'react';
import './GiftForm.css';
import { Gift } from '../../types';

interface GiftFormProps {
  gift?: Gift | null;
  onSubmit: (gift: Omit<Gift, 'id'>) => void;
  onCancel: () => void;
}

const GiftForm: React.FC<GiftFormProps> = ({ gift, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    costo: 0,
    puntos: 0,
    imagenUrl: ''
  });

  useEffect(() => {
    if (gift) {
      setFormData({
        nombre: gift.nombre,
        descripcion: gift.descripcion,
        costo: gift.costo,
        puntos: gift.puntos,
        imagenUrl: gift.imagenUrl
      });
    }
  }, [gift]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'costo' || name === 'puntos' ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.descripcion || formData.costo <= 0 || formData.puntos <= 0) {
      alert('Por favor completa todos los campos correctamente');
      return;
    }
    onSubmit(formData);
    setFormData({ nombre: '', descripcion: '', costo: 0, puntos: 0, imagenUrl: '' });
  };

  return (
    <div className="gift-form-overlay">
      <div className="gift-form-modal">
        <div className="gift-form-header">
          <h2 className="gift-form-title">
            {gift ? 'Editar Regalo' : 'Crear Nuevo Regalo'}
          </h2>
          <button className="gift-form-close" onClick={onCancel}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="gift-form">
          <div className="form-group">
            <label htmlFor="nombre" className="form-label">
              Nombre del Regalo *
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="form-input"
              placeholder="Ej: Suscripción Premium"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="descripcion" className="form-label">
              Descripción *
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Describe los beneficios del regalo..."
              rows={3}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="costo" className="form-label">
                Costo (monedas) *
              </label>
              <input
                type="number"
                id="costo"
                name="costo"
                value={formData.costo}
                onChange={handleChange}
                className="form-input"
                placeholder="0"
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="puntos" className="form-label">
                Puntos que Otorga *
              </label>
              <input
                type="number"
                id="puntos"
                name="puntos"
                value={formData.puntos}
                onChange={handleChange}
                className="form-input"
                placeholder="0"
                min="1"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="imagenUrl" className="form-label">
              URL de la Imagen
            </label>
            <input
              type="text"
              id="imagenUrl"
              name="imagenUrl"
              value={formData.imagenUrl}
              onChange={handleChange}
              className="form-input"
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </div>

          {formData.imagenUrl && (
            <div className="form-preview">
              <p className="form-preview-label">Vista Previa:</p>
              <img 
                src={formData.imagenUrl} 
                alt="Preview" 
                className="form-preview-image"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="form-btn form-btn-cancel">
              Cancelar
            </button>
            <button type="submit" className="form-btn form-btn-submit">
              {gift ? 'Actualizar' : 'Crear'} Regalo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GiftForm;
