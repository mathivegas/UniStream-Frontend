import Button from '@mui/joy/Button';
import React from 'react';

export interface CustomButtonProps {
  buttonText: string;
  onClick?: () => void;
  variant?: 'solid' | 'outlined' | 'plain' | 'soft';
  color?: 'primary' | 'neutral' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  buttonText,
  onClick,
  variant = 'solid',
  color = 'primary',
  size = 'lg',
  className = '',
  disabled = false,
}) => {
  return (
    <Button
      variant={variant}
      color={color}
      size={size}
      fullWidth
      onClick={onClick}
      disabled={disabled}
      className={`effect-button ${className}`.trim()}
    >
      {buttonText}
    </Button>
  );
};

export default CustomButton;