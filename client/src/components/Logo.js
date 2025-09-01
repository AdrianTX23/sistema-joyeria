import React from 'react';

const Logo = ({ className = "w-8 h-8", showText = true }) => {
  return (
    <div className={`flex items-center ${className}`}>
      {/* Logo Icon */}
      <div className="relative">
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          {/* Fondo circular dorado con gradiente */}
          <defs>
            <radialGradient id="goldGradient" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#F9D664" />
              <stop offset="70%" stopColor="#F4CC5A" />
              <stop offset="100%" stopColor="#D97706" />
            </radialGradient>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#FEF3C7" />
            </linearGradient>
          </defs>
          
          {/* Fondo circular dorado */}
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="url(#goldGradient)"
            stroke="#D97706"
            strokeWidth="1.5"
          />
          
          {/* Anillo de compromiso */}
          <ellipse
            cx="20"
            cy="20"
            rx="12"
            ry="8"
            fill="none"
            stroke="url(#ringGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          
          {/* Montura del anillo */}
          <path
            d="M20 12L22 16L20 20L18 16L20 12Z"
            fill="white"
            stroke="#D97706"
            strokeWidth="1"
          />
          
          {/* Piedra preciosa central */}
          <path
            d="M20 16L21.5 19L20 22L18.5 19L20 16Z"
            fill="#FEF3C7"
            stroke="white"
            strokeWidth="1"
          />
          
          {/* Brillo de la piedra */}
          <path
            d="M20 17L20.5 19L20 21L19.5 19L20 17Z"
            fill="white"
            opacity="0.9"
          />
          
          {/* Detalles del anillo */}
          <circle
            cx="20"
            cy="20"
            r="1"
            fill="white"
            opacity="0.8"
          />
          
          {/* Brillo superior */}
          <circle
            cx="19"
            cy="17"
            r="0.8"
            fill="white"
            opacity="0.7"
          />
          
          {/* Efecto de brillo adicional */}
          <circle
            cx="21"
            cy="15"
            r="0.5"
            fill="white"
            opacity="0.6"
          />
        </svg>
      </div>

      {/* Texto del logo */}
      {showText && (
        <div className="ml-3">
          <h1 className="text-xl font-bold text-gray-900 leading-tight">
            Joyería Elegante
          </h1>
          <p className="text-xs text-gray-600 leading-tight">
            Sistema de Inventario
          </p>
        </div>
      )}
    </div>
  );
};

export default Logo;
