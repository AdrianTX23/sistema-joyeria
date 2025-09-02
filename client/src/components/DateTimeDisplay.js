import React, { useState, useEffect } from 'react';
import { Clock, Calendar, MapPin } from 'lucide-react';

const DateTimeDisplay = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [is24Hour, setIs24Hour] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Formatear hora
  const formatTime = (date) => {
    if (is24Hour) {
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } else {
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    }
  };

  // Formatear fecha
  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Formatear fecha corta
  const formatShortDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Obtener día de la semana
  const getDayOfWeek = (date) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
  };

  // Obtener mes
  const getMonth = (date) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[date.getMonth()];
  };

  // Obtener estación del año
  const getSeason = (date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    if ((month === 3 && day >= 21) || month === 4 || month === 5 || (month === 6 && day < 21)) {
      return '🌱 Primavera';
    } else if ((month === 6 && day >= 21) || month === 7 || month === 8 || (month === 9 && day < 23)) {
      return '☀️ Verano';
    } else if ((month === 9 && day >= 23) || month === 10 || month === 11 || (month === 12 && day < 21)) {
      return '🍂 Otoño';
    } else {
      return '❄️ Invierno';
    }
  };

  // Obtener fase lunar (simplificada)
  const getMoonPhase = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Cálculo simplificado de fase lunar
    const lunarDay = (year * 12 + month) * 29.53 + day;
    const phase = Math.floor(lunarDay % 29.53);
    
    if (phase < 3.69) return '🌑 Luna Nueva';
    if (phase < 11.07) return '🌒 Luna Creciente';
    if (phase < 18.45) return '🌕 Luna Llena';
    if (phase < 25.83) return '🌖 Luna Menguante';
    return '🌑 Luna Nueva';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <Clock className="w-6 h-6 text-yellow-500 mr-2" />
          Reloj y Calendario
        </h2>
        <button
          onClick={() => setIs24Hour(!is24Hour)}
          className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors duration-200"
        >
          {is24Hour ? '12h' : '24h'}
        </button>
      </div>

      {/* Reloj Principal */}
      <div className="text-center mb-6">
        <div className="text-5xl font-bold text-gray-900 mb-2 font-mono">
          {formatTime(currentTime)}
        </div>
        <div className="text-lg text-gray-600">
          {getDayOfWeek(currentTime)}, {formatShortDate(currentTime)}
        </div>
      </div>

      {/* Información Detallada */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Calendario */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Calendar className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="font-semibold text-gray-800">Calendario</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Día:</span>
              <span className="font-medium">{currentTime.getDate()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Mes:</span>
              <span className="font-medium">{getMonth(currentTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Año:</span>
              <span className="font-medium">{currentTime.getFullYear()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Semana:</span>
              <span className="font-medium">{Math.ceil((currentTime.getDate() + new Date(currentTime.getFullYear(), currentTime.getMonth(), 1).getDay()) / 7)}</span>
            </div>
          </div>
        </div>

        {/* Información Adicional */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <MapPin className="w-5 h-5 text-green-500 mr-2" />
            <h3 className="font-semibold text-gray-800">Información</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Estación:</span>
              <span className="font-medium">{getSeason(currentTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fase Lunar:</span>
              <span className="font-medium">{getMoonPhase(currentTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Día del Año:</span>
              <span className="font-medium">{Math.floor((currentTime - new Date(currentTime.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Semana del Año:</span>
              <span className="font-medium">{Math.ceil((currentTime.getDate() + new Date(currentTime.getFullYear(), 0, 1).getDay()) / 7)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fecha Completa */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-center text-gray-700 font-medium">
          {formatDate(currentTime)}
        </div>
      </div>

      {/* Indicadores de Tiempo */}
      <div className="mt-4 flex justify-center space-x-4 text-xs text-gray-500">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
          Tiempo Real
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-blue-400 rounded-full mr-1"></div>
          {is24Hour ? 'Formato 24h' : 'Formato 12h'}
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></div>
          UTC {currentTime.getTimezoneOffset() / -60}
        </div>
      </div>
    </div>
  );
};

export default DateTimeDisplay;
