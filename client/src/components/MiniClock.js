import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const MiniClock = ({ showSeconds = true, showDate = true, compact = false }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    if (showSeconds) {
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
        hour12: false
      });
    }
  };

  const formatDate = (date) => {
    if (compact) {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit'
      });
    } else {
      return date.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
      });
    }
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Clock className="w-4 h-4" />
        <span className="font-mono font-medium">{formatTime(currentTime)}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-1">
      <div className="flex items-center space-x-2">
        <Clock className="w-4 h-4 text-yellow-500" />
        <span className="font-mono font-bold text-gray-800">
          {formatTime(currentTime)}
        </span>
      </div>
      {showDate && (
        <div className="text-xs text-gray-500 font-medium">
          {formatDate(currentTime)}
        </div>
      )}
    </div>
  );
};

export default MiniClock;
