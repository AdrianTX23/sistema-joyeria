import React from 'react';

const Logo = ({ className = "w-8 h-8", showText = true }) => {
  return (
    <div className={`flex items-center ${className}`}>
      {/* Icono de diamante dorado */}
      <div className="relative">
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          className="w-full h-full"
          style={{ filter: 'none' }} // Forzar que no haya filtros CSS
        >
          {/* Diamante principal */}
          <path 
            d="M12 2L15.09 8.26L22 12L15.09 15.74L12 22L8.91 15.74L2 12L8.91 8.26L12 2Z" 
            fill="#F9D664"
            stroke="#D97706"
            strokeWidth="1"
          />
          
          {/* Brillo interno */}
          <path 
            d="M12 4L14.18 8.5L19 12L14.18 15.5L12 20L9.82 15.5L5 12L9.82 8.5L12 4Z" 
            fill="#F4CC5A"
            opacity="0.8"
          />
          
          {/* Punto central */}
          <circle cx="12" cy="12" r="1.5" fill="#FCD34D" />
          
          {/* Brillo adicional */}
          <path 
            d="M12 6L13.5 10L17 12L13.5 14L12 18L10.5 14L7 12L10.5 10L12 6Z" 
            fill="#FEF3C7"
            opacity="0.6"
          />
        </svg>
      </div>
      
      {/* Texto del logo */}
      {showText && (
        <div className="ml-3">
          <h1 className="text-xl font-bold text-[#F9D664]">
            Joyería
          </h1>
          <p className="text-xs text-[#F4CC5A] font-medium">
            Sistema de Inventario
          </p>
        </div>
      )}
    </div>
  );
};

export default Logo;
