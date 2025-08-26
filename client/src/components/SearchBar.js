import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';

const SearchBar = ({
  placeholder = 'Buscar...',
  onSearch,
  onClear,
  filters = [],
  className = '',
  debounceMs = 300
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (onSearch) {
        onSearch(query, activeFilters);
      }
    }, debounceMs);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, activeFilters, onSearch, debounceMs]);

  const handleClear = () => {
    setQuery('');
    setActiveFilters({});
    if (onClear) {
      onClear();
    }
  };

  const handleFilterChange = (filterKey, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const hasActiveFilters = Object.values(activeFilters).some(value => value && value !== '');

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          placeholder={placeholder}
        />
        {(query || hasActiveFilters) && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Filters */}
      {filters.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <div key={filter.key} className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={activeFilters[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">{filter.label}</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-2 flex flex-wrap gap-1">
          {Object.entries(activeFilters).map(([key, value]) => {
            if (!value) return null;
            const filter = filters.find(f => f.key === key);
            const option = filter?.options.find(opt => opt.value === value);
            return (
              <span
                key={key}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
              >
                {filter?.label}: {option?.label || value}
                <button
                  onClick={() => handleFilterChange(key, '')}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-primary-400 hover:bg-primary-200 hover:text-primary-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
