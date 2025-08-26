import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  color = 'primary',
  subtitle,
  onClick,
  loading = false
}) => {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-success-100 text-success-600',
    warning: 'bg-warning-100 text-warning-600',
    danger: 'bg-danger-100 text-danger-600',
    secondary: 'bg-secondary-100 text-secondary-600'
  };

  const CardComponent = onClick ? 'button' : 'div';
  const cardProps = onClick ? { onClick, className: 'cursor-pointer hover:shadow-md transition-shadow' } : {};

  return (
    <CardComponent {...cardProps}>
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mt-1"></div>
                </div>
              ) : (
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
              )}
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
              )}
              {trend && !loading && (
                <div className="flex items-center mt-2">
                  {trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-success-600 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-danger-600 mr-1" />
                  )}
                  <span className={`text-sm ${trend === 'up' ? 'text-success-600' : 'text-danger-600'}`}>
                    {trendValue}
                  </span>
                </div>
              )}
            </div>
            {Icon && (
              <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
                <Icon className="w-6 h-6" />
              </div>
            )}
          </div>
        </div>
      </div>
    </CardComponent>
  );
};

export default StatsCard;
