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
        >
          {/* Diamante principal */}
          <path 
            d="M12 2L15.09 8.26L22 12L15.09 15.74L12 22L8.91 15.74L2 12L8.91 8.26L12 2Z" 
            fill="url(#goldGradient)"
            stroke="#D97706"
            strokeWidth="1"
          />
          
          {/* Brillo interno */}
          <path 
            d="M12 4L14.18 8.5L19 12L14.18 15.5L12 20L9.82 15.5L5 12L9.82 8.5L12 4Z" 
            fill="url(#innerGlow)"
            opacity="0.6"
          />
          
          {/* Punto central */}
          <circle cx="12" cy="12" r="1.5" fill="#FCD34D" />
          
          {/* Gradientes */}
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F9D664" />
              <stop offset="50%" stopColor="#F4CC5A" />
              <stop offset="100%" stopColor="#F9D664" />
            </linearGradient>
            <linearGradient id="innerGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F9D664" />
              <stop offset="100%" stopColor="#F4CC5A" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Texto del logo */}
      {showText && (
        <div className="ml-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-[#F9D664] to-[#F4CC5A] bg-clip-text text-transparent">
            Joyería
          </h1>
          <p className="text-xs text-[#F9D664] font-medium">
            Sistema de Inventario
          </p>
        </div>
      )}
    </div>
  );
};

export default Logo;
